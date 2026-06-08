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

  // Script-range checks — non-Devanagari Indian scripts (unambiguous, check first)
  if (/[ఀ-౿]/.test(text)) return { code: "te-IN", name: "Telugu"    };
  if (/[ಀ-೿]/.test(text)) return { code: "kn-IN", name: "Kannada"   };
  if (/[஀-௿]/.test(text)) return { code: "ta-IN", name: "Tamil"     };
  if (/[઀-૿]/.test(text)) return { code: "gu-IN", name: "Gujarati"  };
  if (/[ঀ-৿]/.test(text)) return { code: "bn-IN", name: "Bengali"   };
  if (/[਀-੿]/.test(text)) return { code: "pa-IN", name: "Punjabi"   };
  if (/[ഀ-ൿ]/.test(text)) return { code: "ml-IN", name: "Malayalam" };

  // Devanagari (Hindi vs Marathi) — disambiguate by keyword scoring
  if (/[ऀ-ॿ]/.test(text)) {
    // ळ = ळ — phoneme unique to Marathi (not used in standard Hindi)
    const isMarathiChar = /ळ/.test(text);

    const marathiKeywords = [
      "आहे", "आहेत", "नाही", "काय", "कसे", "माझे", "तुमचे",
      "शेती", "पीक", "झाले", "झाली", "करून", "होते", "असतो",
      "पाहिजे", "नको", "साठी", "करायचे", "सांगा", "बघा",
      "काळजी", "पावसाळा", "विचारतो", "करू", "झालेलं", "सोबत",
    ];
    const hindiKeywords = [
      "है", "हैं", "नहीं", "क्या", "कैसे", "मेरा", "आपका",
      "खेती", "फसल", "किसान", "हुआ", "करके", "होगा", "चाहिए",
      "बताइए", "करना", "बोलिए", "पूछना", "देखिए", "समझाइए",
      "साथ", "करें", "चिंता", "बिल्कुल",
    ];

    let mr = isMarathiChar ? 6 : 0;
    let hi = 0;
    marathiKeywords.forEach(w => { if (text.includes(w)) mr += 2; });
    hindiKeywords.forEach(w   => { if (text.includes(w)) hi += 2; });

    // Phrase-level tiebreakers
    if (text.includes("करू नका") || text.includes("बरोबर") || text.includes("काळजी")) mr += 4;
    if (text.includes("मत करो")  || text.includes("बिल्कुल") || text.includes("चिंता"))  hi += 4;

    return mr > hi
      ? { code: "mr-IN", name: "Marathi" }
      : { code: "hi-IN", name: "Hindi"   };
  }

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
  rec.lang              = langCode;
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

  window.speechSynthesis.cancel();

  const detected   = detectLanguage(text);
  const targetLang = langCode || detected.code;

  const utter     = new SpeechSynthesisUtterance(text);
  utter.lang      = targetLang;
  window.activeUtterance = utter;

  let rate  = 0.88;
  let pitch = 1.03;

  const isUrgent = /[!！]/.test(text) ||
    /Warning|danger|urgent|alert|stop|avoid|prevent|सावधान|खतरा|नुकसान|त्वरित|घबराएं|बधाई|अभिनंदन|काळजी घ्या/gi.test(text);
  const isComforting = /don't worry|no problem|safe|helper|friend|चिंता मत|काळजी करू|काळजी नसावी|काळजी नको|घाबरू नका|निश्चिंत|ठीक हो|मदद/gi.test(text);
  const isQuestion = /[?？]/.test(text);

  if      (isUrgent)     { rate = 0.98; pitch = 1.12; }
  else if (isComforting) { rate = 0.80; pitch = 0.96; }
  else if (isQuestion)   { rate = 0.88; pitch = 1.07; }

  utter.rate  = rate;
  utter.pitch = pitch;

  const voices = window.speechSynthesis.getVoices();
  const match  = voices.find(
    (v) => v.lang === targetLang || v.lang.startsWith(targetLang.split("-")[0])
  );
  if (match) utter.voice = match;

  const done = () => { window.activeUtterance = null; if (onEnd) onEnd(); };
  utter.onstart = () => { if (onStart) onStart(); };
  utter.onend   = done;
  utter.onerror = done;

  setTimeout(() => { if (window.speechSynthesis) window.speechSynthesis.speak(utter); }, 50);
};
