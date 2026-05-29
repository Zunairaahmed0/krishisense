import { useState, useEffect } from "react";
import { CheckCircle, AlertTriangle, Info, ChevronRight } from "lucide-react";
import { C } from "../constants/theme";
import { wx, PRICES } from "../constants/data";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Sparkline from "../components/ui/Sparkline";
import { speak } from "../lib/speech";
import { api } from "../lib/api";
import Spinner from "../components/ui/Spinner";

// Pass heroImg (landscan_hero_section.png) and botImg from App
export default function HomeTab({ user, weather, weatherLoading, weatherError, loc, locError, setTab, heroImg, botImg, lang, scans = [], voiceOn, onLocationClick }) {
  const getCropEmoji = (cropName) => {
    if (!cropName) return "🌱";
    const name = cropName.toLowerCase().trim();
    const emojiMap = {
      onion: "🧅", onions: "🧅",
      rice: "🌾", paddy: "🌾",
      wheat: "🌾",
      cotton: "☁️",
      tomato: "🍅", tomatoes: "🍅",
      potato: "🥔", potatoes: "🥔",
      sugarcane: "🎋",
      mustard: "🌼",
      maize: "🌽", corn: "🌽",
      chili: "🌶", chilli: "🌶",
      soybean: "🌱", groundnut: "🥜", peanuts: "🥜",
    };
    for (const key of Object.keys(emojiMap)) {
      if (name.includes(key)) return emojiMap[key];
    }
    return "🌱";
  };

  const cur   = weather?.current;
  const daily = weather?.daily;
  const todayRain = daily?.precipitation_probability_max?.[0];
  const tomorrowRain = daily?.precipitation_probability_max?.[1];
  const currentHumidity = cur?.relative_humidity_2m;
  const currentTemp = cur?.temperature_2m;
  const currentRain = cur?.precipitation;
  const waterTitle = tomorrowRain == null
    ? weatherLoading ? "Loading forecast" : "Weather unavailable"
    : tomorrowRain > 50 ? "Skip irrigation tomorrow" : tomorrowRain > 25 ? "Light irrigation tomorrow" : "Irrigate as planned";
  const waterSub = tomorrowRain == null
    ? locError || weatherError || "Waiting for live local forecast"
    : `${tomorrowRain}% rain chance tomorrow`;
  const weatherTip = currentHumidity == null && currentTemp == null
    ? "Live local weather will appear after location permission is enabled."
    : currentHumidity >= 80
      ? "High humidity in your current area. Monitor crops for fungal disease risk."
      : currentTemp >= 38
        ? "High temperature in your current area. Irrigate early morning and protect seedlings."
        : (currentRain || 0) > 0.5
          ? "Rain is being detected at your current location. Pause irrigation and check drainage."
          : "Current local weather looks manageable. Keep monitoring the 7-day forecast.";

  const alerts = [];
  if ((cur?.precipitation || 0) > 0.5)    alerts.push({ type: "info", text: "Rain detected — skip irrigation today, save ~8,000 L" });
  if ((cur?.temperature_2m || 0) > 38)    alerts.push({ type: "warn", text: "Heat wave — irrigate at dawn, protect seedlings" });
  if ((daily?.precipitation_probability_max?.[2] || 0) > 65)
    alerts.push({ type: "info", text: "Heavy rain in 2 days — harvest ready crops now" });
  if (locError)
    alerts.push({ type: "warn", text: locError });
  if (weatherError)
    alerts.push({ type: "warn", text: weatherError });
  if (weatherLoading)
    alerts.push({ type: "info", text: "Loading live weather for your current location." });
  if (!alerts.length)
    alerts.push({ type: "ok", text: "Weather conditions favorable — great day for farm activity" });

  const onionPrices = PRICES.Onion.slice(-12).map(d => d.p);

  return (
    <div style={{ paddingBottom: 16 }}>

      {/* ── Greeting + Weather ──────────────────────────────── */}
      <div style={{ padding: "14px 18px 10px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.txt }}>
            Good Morning, {user?.fullName || "Ramesh"}! <span style={{ fontSize: 18 }}>👋</span>
          </div>
          <div
            onClick={onLocationClick}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12,
              color: C.primary,
              marginTop: 5,
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: 8,
              background: "rgba(46, 125, 50, 0.08)",
              border: `1.2px solid ${C.brd}`,
              transition: "all 0.2s ease"
            }}
            title="Click to search or edit location"
          >
            <span>📍</span>
            <span style={{ fontWeight: 700 }}>
              {loc ? `${loc.name}, ${loc.state}${loc.country ? `, ${loc.country}` : ""}` : locError || "Detecting current location..."}
            </span>
            <span style={{ fontSize: 9, color: C.mut, marginLeft: 2 }}>
              {lang === "hi" ? "(बदलें)" : lang === "mr" ? "(बदला)" : "(Change)"}
            </span>
          </div>
          {loc && (
            <div style={{ fontSize: 9, color: C.mut, marginTop: 4, paddingLeft: 6 }}>
              {loc.isManual ? "Manual override: " : "GPS coordinates: "} {loc.lat.toFixed(4)}, {loc.lon.toFixed(4)}{loc.accuracy ? ` +/- ${Math.round(loc.accuracy)} m` : ""}
            </div>
          )}
        </div>
        <div style={{ background: C.surface, borderRadius: 14, padding: "10px 12px", border: `1px solid ${C.brd}`, boxShadow: C.shadow, textAlign: "right", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
            <div style={{ fontSize: 24 }}>{wx(cur?.weathercode)}</div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.txt }}>
                {weatherLoading ? "Loading..." : cur?.temperature_2m != null ? `${cur.temperature_2m}°C` : "--°C"}
              </div>
              <div style={{ fontSize: 10, color: C.mut }}>Humidity {cur?.relative_humidity_2m ?? "--"}%{todayRain != null ? ` | Rain ${todayRain}%` : ""}</div>
              {(daily?.precipitation_probability_max?.[1] || 0) > 50 && (
                <div style={{ fontSize: 10, color: C.p3, fontWeight: 600 }}>Rain expected tomorrow</div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ── Hero: Scan My Land ─────────────────────────────── */}
      <div style={{ margin: "0 14px 16px" }}>
        <div style={{
          borderRadius: 20, overflow: "hidden", position: "relative",
          background: `linear-gradient(135deg, ${C.primary} 0%, ${C.p2} 60%)`,
          minHeight: 218,
        }}>
          {heroImg && (
            <img
              src={heroImg}
              alt="Farm scan"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "62% center",
              }}
            />
          )}
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, rgba(8,49,32,0.96) 0%, rgba(8,49,32,0.88) 42%, rgba(8,49,32,0.35) 72%, rgba(8,49,32,0.06) 100%)` }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.04), rgba(0,0,0,0.20))" }} />
          <div style={{ position: "relative", padding: "24px 20px 24px", maxWidth: 245 }}>
            <Badge text="✦ AI LAND SCAN" color="#A5D6A7" bg="rgba(165,214,167,0.2)" />
            <div style={{ fontSize: 26, fontWeight: 800, color: "white", marginTop: 10, lineHeight: 1.2 }}>Scan My Land</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.84)", marginTop: 6, lineHeight: 1.5, maxWidth: 205 }}>
              Get AI-powered insights about your land, soil &amp; best crops using satellite intelligence.
            </div>
            <button
              onClick={() => setTab("land")}
              style={{ marginTop: 14, padding: "10px 20px", borderRadius: 30, border: "none", background: "rgba(255,255,255,0.22)", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, backdropFilter: "blur(8px)" }}
            >
              <span>🛰</span> SCAN MY LAND
            </button>
          </div>
        </div>
      </div>

      {/* ── Quick AI Insights ──────────────────────────────── */}
      <div style={{ padding: "0 18px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.txt, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 14 }}>✦</span> Quick AI Insights
        </div>
        <button onClick={() => setTab("land")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: C.p3, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
          View All <ChevronRight size={14} />
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, padding: "0 18px 16px", overflowX: "auto" }}>
        {/* Crop Card */}
        <div onClick={() => setTab("land")} style={{ flex: "0 0 160px", background: C.tint, borderRadius: 16, padding: 14, cursor: "pointer", border: `1px solid #C8E6C9` }}>
          <div style={{ fontSize: 10, color: C.mut, fontWeight: 600, marginBottom: 4 }}>Recommended Crop</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.primary }}>Onion</div>
          <Badge text="87% Suitability" color={C.p2} />
          <div style={{ fontSize: 10, color: C.mut, marginTop: 8 }}>Expected Yield</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.txt }}>9 Quintal / Acre</div>
          <div style={{ fontSize: 24, textAlign: "right", marginTop: 4 }}>🧅</div>
        </div>

        {/* Water Card */}
        <div onClick={() => setTab("sustain")} style={{ flex: "0 0 160px", background: C.tintBlue, borderRadius: 16, padding: 14, cursor: "pointer", border: "1px solid #B3D9F5" }}>
          <div style={{ fontSize: 10, color: C.mut, fontWeight: 600, marginBottom: 4 }}>Water Advisory</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.blue, lineHeight: 1.2 }}>{waterTitle}</div>
          <div style={{ fontSize: 11, color: C.mut, marginTop: 8 }}>{waterSub}</div>
          <div style={{ fontSize: 24, textAlign: "right", marginTop: 4 }}>💧</div>
        </div>

        {/* Market Card */}
        <div onClick={() => setTab("sell")} style={{ flex: "0 0 160px", background: C.tintAmb, borderRadius: 16, padding: 14, cursor: "pointer", border: "1px solid #FFE0B2" }}>
          <div style={{ fontSize: 10, color: C.mut, fontWeight: 600, marginBottom: 4 }}>Market Trend</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.amber, lineHeight: 1.2 }}>₹18 / kg</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
            <Badge text="Upward" color={C.amber} />
            <Sparkline data={onionPrices} color={C.amber} width={45} height={18} />
          </div>
          <div style={{ fontSize: 10, color: C.mut, marginTop: 8 }}>Weekly Change</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.txt }}>+12% Expected</div>
          <div style={{ fontSize: 24, textAlign: "right", marginTop: 4 }}>📈</div>
        </div>
      </div>
      <div style={{ padding: "0 18px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.txt, display: "flex", alignItems: "center", gap: 6 }}>
          <span>🛡</span> Diagnose Crop Health
        </div>
      </div>

      <div style={{ margin: "0 14px 16px", display: "flex", gap: 10 }}>
        {/* Upload card */}
        <Card onClick={() => setTab("grow")} style={{ flex: 1, cursor: "pointer", textAlign: "center", padding: "18px 14px" }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: C.tint, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontSize: 22 }}>📷</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.txt, marginBottom: 4 }}>Upload Crop Leaf Image</div>
          <div style={{ fontSize: 11, color: C.mut, marginBottom: 12 }}>Detect disease instantly</div>
          <button style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: C.primary, color: "white", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            UPLOAD IMAGE
          </button>
        </Card>
        {/* Disease result preview */}
        <Card style={{ flex: 1, background: `linear-gradient(145deg, #FFF8F8, #FFEBEE)`, border: "1px solid #FFCDD2" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <Badge text="AI Result" color={C.p3} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.red }}>Early Blight</div>
          <div style={{ fontSize: 10, color: C.mut, marginBottom: 4 }}>Severity: <span style={{ color: C.red, fontWeight: 700 }}>High ●</span></div>
          <div style={{ fontSize: 10, color: C.mut, marginBottom: 4 }}>Confidence: 92%</div>
          <div style={{ height: 4, borderRadius: 99, background: "#FFCDD2", overflow: "hidden", marginBottom: 8 }}>
            <div style={{ width: "92%", height: "100%", background: C.p3 }}/>
          </div>
          <div style={{ fontSize: 10, color: C.txt2, fontWeight: 600 }}>Recommended Action</div>
          <div style={{ fontSize: 10, color: C.txt2 }}>Spray chlorothalonil within 48 hours.</div>
        </Card>
      </div>

      {/* ── Smart Selling Insights ─────────────────────────── */}
      <div style={{ padding: "0 18px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.txt, display: "flex", alignItems: "center", gap: 6 }}>
          <span>🏷</span> Smart Selling Insights
        </div>
        <button onClick={() => setTab("sell")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: C.p3, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
          View Market <ChevronRight size={14} />
        </button>
      </div>

      <div style={{ display: "flex", gap: 10, padding: "0 14px 16px", overflowX: "auto" }}>
        {[
          { icon: "🏪", label: "Current Mandi Price", val: "₹18 / kg", sub: "Lasalgaon Mandi", tint: C.tint, border: "#C8E6C9" },
          { icon: "📅", label: "Best Selling Window", val: "5 Days", sub: "Prices may increase by 10–12%", tint: C.tintAmb, border: "#FFE0B2" },
          { icon: "👥", label: "Nearby Buyer Match", val: "3 Buyers", sub: "Best price ₹19 – ₹20/kg", tint: "#EDE7F6", border: "#D1C4E9" },
        ].map((s, i) => (
          <div key={i} onClick={() => setTab("sell")} style={{ flex: "0 0 140px", background: s.tint, borderRadius: 14, padding: "12px 14px", cursor: "pointer", border: `1px solid ${s.border}` }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 9, color: C.mut, fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.txt, marginTop: 2 }}>{s.val}</div>
            <div style={{ fontSize: 9, color: C.mut, marginTop: 3 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── AI Alerts ──────────────────────────────────────── */}
      <div style={{ margin: "0 14px 16px", display: "flex", flexDirection: "column", gap: 7 }}>
        {alerts.map((a, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", borderRadius: 12,
            background: a.type === "ok" ? C.tint : a.type === "warn" ? C.tintAmb : C.tintBlue,
            border: `1px solid ${a.type === "ok" ? "#C8E6C9" : a.type === "warn" ? "#FFE0B2" : "#B3D9F5"}` }}>
            {a.type === "ok" ? <CheckCircle size={15} color={C.p3} /> : a.type === "warn" ? <AlertTriangle size={15} color={C.amber} /> : <Info size={15} color={C.blue} />}
            <span style={{ fontSize: 12, color: C.txt2, lineHeight: 1.5 }}>{a.text}</span>
          </div>
        ))}
      </div>

      {/* ── AI Farming Tip Bar ─────────────────────────────── */}
      <div style={{ margin: "0 14px 16px", borderRadius: 16, background: `linear-gradient(135deg, ${C.primary}, ${C.p2})`, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        {botImg ? (
          <img src={botImg} alt="AI Bot" style={{ width: 44, height: 44, objectFit: "contain" }} />
        ) : (
          <div style={{ fontSize: 32, flexShrink: 0 }}>🤖</div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: "#A5D6A7", fontWeight: 700, marginBottom: 3 }}>✦ AI Farming Tip</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", lineHeight: 1.5 }}>
            {weatherTip}
          </div>
        </div>
        <button
          onClick={() => voiceOn && speak(weatherTip, lang)}
          style={{ flexShrink: 0, padding: "8px 12px", borderRadius: 10, border: "none", background: "rgba(255,255,255,0.18)", color: "white", fontSize: 11, fontWeight: 600, cursor: "pointer", backdropFilter: "blur(8px)" }}
        >
          🎤 Listen
        </button>
      </div>
    </div>
  );
}
