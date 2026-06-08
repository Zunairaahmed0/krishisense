import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { evaluateAlerts } from "./lib/alertEngine.js";
import { sendAlertToUser, isAdminReady, getAdminFirestore } from "./lib/fcmSender.js";
import { fetchMandiPrices, fetchPriceTrend, fetchMultiCropPrices } from "./lib/mandiPrices.js";

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;

// ── CORS ───────────────────────────────────────────────────────────────────────
const normalizeOrigin = (value) => {
  if (!value) return "";
  try {
    return new URL(value).origin;
  } catch {
    return value.replace(/\/+$/, "");
  }
};

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  ...(process.env.FRONTEND_URL || "").split(","), // set this on Render to your Vercel URL(s)
].map(normalizeOrigin).filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin || allowedOrigins.includes(normalizeOrigin(origin))) return cb(null, true);
    cb(new Error(`CORS: ${origin} not allowed`));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "20mb" }));

// ── Simple in-memory rate limiter (no extra package needed) ───────────────────
// Allows 20 requests per minute per IP. Resets every 60s.
const rateBuckets = new Map(); // IP → { count, resetAt }

function rateLimit(max = 20, windowMs = 60_000) {
  return (req, res, next) => {
    const ip  = req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.ip;
    const now = Date.now();
    let bucket = rateBuckets.get(ip);

    if (!bucket || now > bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs };
      rateBuckets.set(ip, bucket);
    }

    bucket.count++;
    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.set("Retry-After", retryAfter);
      return res.status(429).json({
        error: "Too many requests. Please wait a moment and try again.",
        retryAfter,
      });
    }
    next();
  };
}

// Clean up old buckets every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, b] of rateBuckets) {
    if (now > b.resetAt) rateBuckets.delete(ip);
  }
}, 5 * 60_000);

// ── Health check ───────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "KrishiSense API", ts: new Date().toISOString() });
});

// ── Gemini AI proxy ────────────────────────────────────────────────────────────
// Hides GEMINI_API_KEY from the browser bundle.
// Accepts: POST /api/ai/chat  { content, system?, enableSearch? }
// Returns: { text: "AI reply..." }

const GEMINI_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
];

app.post("/api/ai/chat", rateLimit(20, 60_000), async (req, res) => {
  const { content, system, enableSearch = false } = req.body;

  if (!content) {
    return res.status(400).json({ error: "content is required" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server missing GEMINI_API_KEY" });
  }

  // Build Gemini payload
  const parts = typeof content === "string"
    ? [{ text: content }]
    : content; // allow pre-built parts array for image vision

  const payload = { contents: [{ parts }] };

  if (system) {
    payload.systemInstruction = { parts: [{ text: system }] };
  }
  if (enableSearch) {
    payload.tools = [{ google_search: {} }];
  }

  // Try each model in order, stop on first success
  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const geminiRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(25_000),
      });

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        console.warn(`[gemini] ${model} → ${geminiRes.status}: ${errText.slice(0, 120)}`);
        continue;
      }

      const data = await geminiRes.json();
      let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      // Strip markdown bold/italic (voice-safe output)
      text = text.replace(/\*\*?/g, "").trim();

      if (text) return res.json({ text, model });
    } catch (err) {
      console.warn(`[gemini] ${model} error:`, err.message);
    }
  }

  res.status(502).json({ error: "All Gemini models failed. Please try again." });
});

// ── User profile update ────────────────────────────────────────────────────────
// Lightweight endpoint; actual profile is stored in Firebase Firestore.
// The frontend calls Firebase directly — this is a utility fallback.
app.put("/api/auth/profile", rateLimit(10, 60_000), (req, res) => {
  const { fullName, avatar } = req.body;
  if (!fullName?.trim()) return res.status(400).json({ error: "fullName is required" });
  // No-op: Firebase Firestore handles persistence via the frontend SDK.
  res.json({ success: true, fullName: fullName.trim(), avatar: avatar || "👨‍🌾" });
});

// ── Legacy auth + scans (kept for backward compat, Firebase preferred) ─────────
import { db } from "./lib/db.js";
import { generateSalt, hashPassword, generateToken } from "./lib/crypto.js";

function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No session token provided." });
  const user = db.getUserByToken(token);
  if (!user) return res.status(401).json({ error: "Session expired or invalid." });
  req.user = user; req.token = token;
  next();
}

app.post("/api/auth/register", rateLimit(5, 60_000), (req, res) => {
  const { username, fullName, password } = req.body;
  if (!username || !fullName || !password)
    return res.status(400).json({ error: "username, fullName, and password are required." });
  if (username.length < 3) return res.status(400).json({ error: "Username must be at least 3 characters." });
  if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters." });
  if (db.findUserByUsername(username))
    return res.status(409).json({ error: "Username already registered." });
  try {
    const salt = generateSalt();
    const profile = db.createUser(username, fullName, hashPassword(password, salt), salt);
    const token = generateToken();
    db.createSession(token, profile.id);
    res.status(201).json({ user: profile, token });
  } catch (e) {
    res.status(500).json({ error: "Registration failed." });
  }
});

app.post("/api/auth/login", rateLimit(10, 60_000), (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "username and password are required." });
  const user = db.findUserByUsername(username);
  if (!user || hashPassword(password, user.salt) !== user.passwordHash)
    return res.status(401).json({ error: "Invalid username or password." });
  const token = generateToken();
  db.createSession(token, user.id);
  const { passwordHash: _, salt: __, ...profile } = user;
  res.json({ user: profile, token });
});

app.get("/api/auth/me", authenticate, (req, res) => res.json({ user: req.user }));

app.delete("/api/auth/logout", authenticate, (req, res) => {
  db.deleteSession(req.token);
  res.json({ success: true });
});

app.post("/api/scans", authenticate, (req, res) => {
  const { type, data } = req.body;
  if (!type || !data) return res.status(400).json({ error: "type and data are required." });
  res.status(201).json(db.saveScan(req.user.id, type, data));
});

app.get("/api/scans", authenticate, (req, res) => {
  res.json(db.getScansByUserId(req.user.id));
});

// ── Check and send weather-based alerts for a specific farmer ─────────────────
app.post("/api/alerts/check", rateLimit(30, 60_000), async (req, res) => {
  const { userId, weather, loc, crops, fcmToken } = req.body;
  if (!weather || !loc) return res.status(400).json({ error: "weather and loc required" });

  const alerts = evaluateAlerts(weather, loc, crops || []);
  if (!alerts.length) {
    return res.json({ alerts: [], sent: 0, message: "No alerts for current conditions" });
  }

  let sent = 0;
  if (fcmToken && isAdminReady()) {
    for (const alert of alerts.filter((a) => a.severity !== "info")) {
      const ok = await sendAlertToUser(fcmToken, alert);
      if (ok) sent++;
    }
  }

  res.json({ alerts, sent });
});

// ── Regional outbreak alert — triggered when multiple farms detect same disease ─
app.post("/api/alerts/outbreak", rateLimit(10, 60_000), async (req, res) => {
  const { diseaseName, loc, detectedByUserId } = req.body;
  if (!diseaseName || !loc) return res.status(400).json({ error: "required fields missing" });

  try {
    const db = getAdminFirestore();

    const weekAgo    = new Date(Date.now() - 7 * 86400000).toISOString();
    const scansSnap  = await db.collection("scans")
      .where("type",         "==", "leaf")
      .where("data.disease", "==", diseaseName)
      .where("date",         ">=", weekAgo)
      .get();

    const count = scansSnap.size;
    if (count < 3) {
      return res.json({ outbreakDetected: false, count, message: "Insufficient cases for outbreak alert" });
    }

    const outbreakAlert = {
      title:     `🚨 ${diseaseName} Outbreak in Your Region`,
      body:      `${count} farms in your area have detected ${diseaseName} in the last 7 days. Your crops may be at risk even with no visible symptoms yet.`,
      action:    `Apply preventive fungicide immediately. Check KrishiSense GROW tab for the full treatment protocol.`,
      alertType: "outbreak_" + diseaseName.toLowerCase().replace(/\s/g, "_"),
      severity:  "critical",
      targetUrl: "/?tab=grow",
    };

    const tokenSnap = await db.collection("fcmTokens").where("active", "==", true).get();
    const tokens    = tokenSnap.docs.map((d) => d.data().token).filter(Boolean);

    let sent = 0;
    for (const token of tokens) {
      const ok = await sendAlertToUser(token, outbreakAlert);
      if (ok) sent++;
    }

    await db.collection("outbreaks").add({
      disease:         diseaseName,
      state:           loc.state,
      detectedCount:   count,
      alertedFarmers:  sent,
      triggeredAt:     new Date().toISOString(),
      triggeredBy:     detectedByUserId,
    });

    res.json({ outbreakDetected: true, count, sent, alert: outbreakAlert });
  } catch (e) {
    console.error("[outbreak]", e.message);
    res.status(500).json({ error: "Outbreak check failed: " + e.message });
  }
});

// ── Manual demo trigger ────────────────────────────────────────────────────────
app.post("/api/alerts/demo", async (req, res) => {
  const { fcmToken, alertType = "early_blight" } = req.body;
  if (!fcmToken) return res.status(400).json({ error: "fcmToken required" });

  const DEMO = {
    early_blight: {
      title:     "⚠️ Disease Alert — Nashik Region",
      body:      "Early Blight conditions detected in your area. Humidity 87%, Temp 26°C. 3 nearby farms affected. Preventive spray recommended within 24 hours.",
      action:    "Spray Mancozeb 75WP at 2.5g/L on leaf undersides today.",
      alertType: "early_blight", severity: "high", targetUrl: "/?tab=grow",
    },
    outbreak: {
      title:     "🚨 Regional Outbreak — Late Blight Spreading",
      body:      "6 farms within 45 km have detected Late Blight this week. Critical risk to your Tomato/Potato crops. Act NOW.",
      action:    "Apply Metalaxyl + Mancozeb immediately. Open app for full protocol.",
      alertType: "outbreak", severity: "critical", targetUrl: "/?tab=grow",
    },
    market: {
      title:     "📈 Onion Prices Surging — Nashik",
      body:      "Onion prices at Lasalgaon mandi up 18% this week. ₹24/kg today vs ₹18/kg last week. Good selling window open now.",
      action:    "3 verified buyers ready. Open SELL tab for direct deals.",
      alertType: "market_opportunity", severity: "info", targetUrl: "/?tab=sell",
    },
  };

  const alert = DEMO[alertType] || DEMO.early_blight;
  const ok    = await sendAlertToUser(fcmToken, alert);
  res.json({ sent: ok, alert });
});

// ── Mandi Prices (data.gov.in / AGMARKNET) ────────────────────────────────────
app.get("/api/market/prices", rateLimit(30, 60_000), async (req, res) => {
  const { commodity = "Onion", state = "Maharashtra", district, market, lat, lon } = req.query;
  try {
    const data = await fetchMandiPrices({ commodity, state, district, market, lat, lon });
    res.json(data);
  } catch (e) {
    console.error("[mandi prices]", e.message);
    res.status(502).json({ error: e.message, fallback: true });
  }
});

app.get("/api/market/trend", rateLimit(20, 60_000), async (req, res) => {
  const { commodity = "Onion", state = "Maharashtra" } = req.query;
  try {
    const trend = await fetchPriceTrend(commodity, state);
    res.json({ trend, commodity, state, source: "data.gov.in / AGMARKNET" });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

app.post("/api/market/multi", rateLimit(10, 60_000), async (req, res) => {
  const { crops = ["Onion", "Tomato", "Wheat"], state = "Maharashtra" } = req.body;
  try {
    const data = await fetchMultiCropPrices(crops, state);
    res.json({ data, source: "data.gov.in / AGMARKNET" });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// ── Start ──────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🌱 KrishiSense API running on http://localhost:${PORT}`);
  console.log(`   Gemini key: ${process.env.GEMINI_API_KEY ? "✅ loaded" : "❌ MISSING — set GEMINI_API_KEY"}`);
  console.log(`   Frontend:   ${process.env.FRONTEND_URL || "(dev: any origin allowed)"}\n`);
});
