// ── Language map: Indian state → speech code ──────────────────────────────
export const STATE_LANG = {
  "Maharashtra":      { code: "mr-IN", name: "Marathi"    },
  "Gujarat":          { code: "gu-IN", name: "Gujarati"   },
  "Karnataka":        { code: "kn-IN", name: "Kannada"    },
  "Tamil Nadu":       { code: "ta-IN", name: "Tamil"      },
  "Andhra Pradesh":   { code: "te-IN", name: "Telugu"     },
  "Telangana":        { code: "te-IN", name: "Telugu"     },
  "Kerala":           { code: "ml-IN", name: "Malayalam"  },
  "West Bengal":      { code: "bn-IN", name: "Bengali"    },
  "Punjab":           { code: "pa-IN", name: "Punjabi"    },
  "Haryana":          { code: "hi-IN", name: "Hindi"      },
  "Uttar Pradesh":    { code: "hi-IN", name: "Hindi"      },
  "Bihar":            { code: "hi-IN", name: "Hindi"      },
  "Madhya Pradesh":   { code: "hi-IN", name: "Hindi"      },
  "Rajasthan":        { code: "hi-IN", name: "Hindi"      },
  "Delhi":            { code: "hi-IN", name: "Hindi"      },
  "Odisha":           { code: "or-IN", name: "Odia"       },
  "Assam":            { code: "as-IN", name: "Assamese"   },
};

export const getLang = (state) =>
  STATE_LANG[state] || { code: "hi-IN", name: "Hindi" };

// ── Detect Language dynamically from text string ──────────────────────────
export const detectLanguage = (text) => {
  if (!text) return { code: "en-US", name: "English" };

  // 1. Check for Devanagari script range
  const hasDevanagari = /[\u0900-\u097F]/.test(text);

  if (hasDevanagari) {
    // Unique Marathi character: ळ (\u0933)
    const isMarathiChar = /[\u0933]/.test(text);

    // Common structural auxiliary words in Marathi
    const marathiKeywords = [
      /\bआहे\b/, /\bआहेत\b/, /\bनाही\b/, /\bकाय\b/, /\bकसे\b/, /\bमाझे\b/, /\bतुमचे\b/,
      /\bशेती\b/, /\bपीक\b/, /\bझाले\b/, /\bकरून\b/, /\bआहेस\b/, /\bहोता\b/, /\bझाली\b/,
      /\bपाहिजे\b/, /\bनको\b/, /\bसाठी\b/, /\bसोबत\b/, /\bकरू\b/, /\bझालेलं\b/
    ];

    // Common structural auxiliary words in Hindi
    const hindiKeywords = [
      /\bहै\b/, /\bहैं\b/, /\bनहीं\b/, /\bक्या\b/, /\bकैसे\b/, /\bमेरा\b/, /\bआपका\b/,
      /\bखेती\b/, /\bफसल\b/, /\bहुआ\b/, /\bकरके\b/, /\bहोता\b/, /\bचाहिए\b/, /\bमत\b/,
      /\bके\s+लिए\b/, /\bसाथ\b/, /\bकरें\b/
    ];

    let marathiScore = isMarathiChar ? 6 : 0;
    let hindiScore = 0;

    marathiKeywords.forEach((regex) => {
      if (regex.test(text)) marathiScore += 2;
    });

    hindiKeywords.forEach((regex) => {
      if (regex.test(text)) hindiScore += 2;
    });

    // Special matching heuristics
    if (text.includes("करू नका") || text.includes("काळजी") || text.includes("बरोबर")) {
      marathiScore += 4;
    }
    if (text.includes("मत करो") || text.includes("चिंता") || text.includes("बिल्कुल")) {
      hindiScore += 4;
    }

    if (marathiScore > hindiScore) {
      return { code: "mr-IN", name: "Marathi" };
    } else {
      return { code: "hi-IN", name: "Hindi" };
    }
  }

  // Default to English
  return { code: "en-US", name: "English" };
};

// ── Build weather context string for the AI prompt ────────────────────────
export const weatherContext = (weather, loc) => {
  if (!weather?.current) return "";
  const c = weather.current;
  const rainProb = weather?.daily?.precipitation_probability_max?.[0] ?? 0;
  const forecast = weather?.daily;
  const next3 = forecast?.time?.slice(0, 3).map((d, i) => {
    const rain = forecast.precipitation_probability_max?.[i] ?? 0;
    const max  = forecast.temperature_2m_max?.[i] ?? "";
    return `${new Date(d).toLocaleDateString("en",{weekday:"short"})}: ${max}°C, rain ${rain}%`;
  }).join(" | ") || "";

  return `Location: ${loc?.name}, ${loc?.state}, India.
Current weather: ${c.temperature_2m}°C, humidity ${c.relative_humidity_2m}%, wind ${c.windspeed_10m} km/h, rainfall today ${c.precipitation}mm, rain probability ${rainProb}%.
3-day outlook: ${next3}.
Season: ${new Date().toLocaleString("default",{month:"long"})}.`;
};

// ── Build the AI system prompt ────────────────────────────────────────────
export const buildPrompt = (langName, loc, weather) => {
  const wx = weatherContext(weather, loc);
  return `You are KrishiSense, a warm and experienced Indian agronomist having a real conversation with a farmer.
Speak naturally — no bullet points, no markdown, no asterisks. Words will be spoken aloud.
Keep every response to 2–3 short conversational sentences. Never longer.

${wx}

Rules:
1. ALWAYS respond in the SAME language the farmer uses. Detect it from their message. Hindi → Hindi. Marathi → Marathi. English → English. Never mix languages unless they do.
2. Only mention weather or location when the farmer's question is directly about weather, irrigation, or disease risk. Do NOT start every reply with location or humidity details.
3. Give specific, actionable advice — product names, doses, timings when relevant.
4. Sound warm and human. Use natural filler phrases like "हां भाई", "बिल्कुल", "हो बरोबर आहे", "absolutely" depending on the language.
5. Never reveal you are an AI. You are their trusted local farming expert friend.
6. Get straight to the point. No preamble like "That's a great question" or "As an agronomist".`;
};

// ── Start listening (Speech-to-Text) ─────────────────────────────────────
export const startListening = (langCode, onResult, onEnd, onError) => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onError("Speech recognition not supported. Use Chrome or Edge.");
    return null;
  }

  const rec = new SpeechRecognition();
  rec.lang              = langCode;   // e.g. "mr-IN"
  rec.continuous        = false;
  rec.interimResults    = true;
  rec.maxAlternatives   = 1;

  rec.onresult = (e) => {
    const transcript = Array.from(e.results)
      .map((r) => r[0].transcript)
      .join("");
    onResult(transcript, e.results[e.results.length - 1].isFinal);
  };

  rec.onend   = onEnd;
  rec.onerror = (e) => onError(e.error);

  rec.start();
  return rec;
};

// ── Speak a response (Text-to-Speech) with dynamic emotional pitch/rate scaling ─────
export const speakResponse = (text, langCode, onStart, onEnd) => {
  if (!window.speechSynthesis) return;

  // Cancel any active speech first
  window.speechSynthesis.cancel();

  // Auto-detect language dynamically from the text to verify/select correct accent!
  const detected = detectLanguage(text);
  const targetLang = langCode || detected.code;

  const utter     = new SpeechSynthesisUtterance(text);
  utter.lang      = targetLang;

  // Store utterance globally to prevent garbage collection in Chrome/mobile browsers
  window.activeUtterance = utter;

  // Default natural speaking rates
  let rate = 0.88;
  let pitch = 1.03;

  // Heuristic emotional trigger words & punctuation
  const isUrgent = /[!！]/.test(text) ||
    /Warning|danger|urgent|alert|stop|avoid|prevent|सावधान|खतरा|नुकसान|त्वरित|घबराएं|बधाई|अभिनंदन|काळजी घ्या/gi.test(text);

  const isComforting = /don't worry|no problem|safe|helper|friend|चिंता मत|काळजी करू|काळजी नसावी|काळजी नको|घाबरू नका|निश्चिंत|ठीक हो|मदद/gi.test(text);

  const isQuestion = /[?？]/.test(text);

  if (isUrgent) {
    rate = 0.98;   // Slightly faster to convey importance
    pitch = 1.12;  // Higher pitch
  } else if (isComforting) {
    rate = 0.80;   // Slower, calming pace
    pitch = 0.96;  // Warmer, lower pitch
  } else if (isQuestion) {
    rate = 0.88;
    pitch = 1.07;  // Slightly elevated questioning tone
  }

  utter.rate = rate;
  utter.pitch = pitch;

  // Try to find a natural voice for the language
  const voices = window.speechSynthesis.getVoices();
  const match  = voices.find(
    (v) => v.lang === targetLang || v.lang.startsWith(targetLang.split("-")[0])
  );
  if (match) utter.voice = match;

  const cleanUpAndFinish = () => {
    window.activeUtterance = null;
    if (onEnd) onEnd();
  };

  utter.onstart = () => {
    if (onStart) onStart();
  };
  utter.onend   = cleanUpAndFinish;
  utter.onerror = cleanUpAndFinish;

  // A brief 50ms pause after cancel() allows the audio channel to flush cleanly,
  // preventing premature speech cutoffs or hardware channel blocks.
  setTimeout(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.speak(utter);
    }
  }, 50);
};
