/**
 * KrishiSense AI Client
 *
 * In production (VITE_BACKEND_URL set): calls /api/ai/chat on the backend,
 * which holds the Gemini key server-side — key never reaches the browser.
 *
 * In local dev (no VITE_BACKEND_URL): falls back to calling Gemini directly
 * using VITE_GEMINI_KEY so development still works without a running backend.
 */

const BACKEND_URL  = import.meta.env.VITE_BACKEND_URL?.replace(/\/+$/, "");   // e.g. https://krishisense-api.onrender.com
const GEMINI_KEY   = import.meta.env.VITE_GEMINI_KEY;    // only used in local dev fallback

const DIRECT_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
];

// ── Via backend proxy (production) ─────────────────────────────────────────────
async function askViaBackend(content, system, enableSearch) {
  const res = await fetch(`${BACKEND_URL}/api/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, system, enableSearch }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Backend ${res.status}`);
  }

  const data = await res.json();
  return data.text || "";
}

// ── Direct Gemini call (local dev fallback) ────────────────────────────────────
async function askDirect(content, system, enableSearch) {
  if (!GEMINI_KEY) throw new Error("No VITE_GEMINI_KEY for direct fallback");

  const parts = typeof content === "string"
    ? [{ text: content }]
    : content.map(item =>
        item.type === "text"
          ? { text: item.text }
          : { inlineData: { mimeType: item.source?.media_type || "image/jpeg", data: item.source?.data } }
      );

  const payload = { contents: [{ parts }] };
  if (system) payload.systemInstruction = { parts: [{ text: system }] };
  if (enableSearch) payload.tools = [{ google_search: {} }];

  for (const model of DIRECT_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;
      const res  = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(25_000),
      });

      if (!res.ok) { console.warn(`[gemini-direct] ${model} → ${res.status}`); continue; }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (text) return text.replace(/\*\*?/g, "").trim();
    } catch (e) {
      console.warn(`[gemini-direct] ${model}:`, e.message);
    }
  }
  return "";
}

// ── Public API ─────────────────────────────────────────────────────────────────
export const askClaude = async (content, system = "", enableSearch = false) => {
  try {
    if (BACKEND_URL) {
      return await askViaBackend(content, system, enableSearch);
    }
    return await askDirect(content, system, enableSearch);
  } catch (err) {
    console.error("[askClaude]", err.message);
    // If backend failed, try direct as last resort (only works if VITE_GEMINI_KEY present)
    if (BACKEND_URL && GEMINI_KEY) {
      try { return await askDirect(content, system, enableSearch); } catch (e2) { console.warn("[askClaude] direct fallback failed:", e2.message); }
    }
    return "";
  }
};
