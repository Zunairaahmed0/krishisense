const GROQ_KEY = import.meta.env.VITE_GROQ_KEY;

// Sarvam v3 speaker names confirmed working for each language
export const LANG_MAP = {
  hi: { code: "hi-IN", name: "Hindi",     sarvamCode: "hi-IN", speaker: "shubh"  },
  mr: { code: "mr-IN", name: "Marathi",   sarvamCode: "mr-IN", speaker: "kavya"  },
  te: { code: "te-IN", name: "Telugu",    sarvamCode: "te-IN", speaker: "rahul"  },
  ta: { code: "ta-IN", name: "Tamil",     sarvamCode: "ta-IN", speaker: "priya"  },
  kn: { code: "kn-IN", name: "Kannada",   sarvamCode: "kn-IN", speaker: "aditya" },
  gu: { code: "gu-IN", name: "Gujarati",  sarvamCode: "gu-IN", speaker: "simran" },
  bn: { code: "bn-IN", name: "Bengali",   sarvamCode: "bn-IN", speaker: "roopa"  },
  pa: { code: "pa-IN", name: "Punjabi",   sarvamCode: "pa-IN", speaker: "shubh"  },
  ml: { code: "ml-IN", name: "Malayalam", sarvamCode: "ml-IN", speaker: "kavya"  },
  en: { code: "en-IN", name: "English",   sarvamCode: "en-IN", speaker: "neha"   },
};

export const DEFAULT_LANG = LANG_MAP["hi"];

const STATE_LANG = {
  "Maharashtra": "mr", "Gujarat": "gu", "Karnataka": "kn", "Tamil Nadu": "ta",
  "Andhra Pradesh": "te", "Telangana": "te", "Kerala": "ml", "West Bengal": "bn",
  "Punjab": "pa", "Haryana": "hi", "Uttar Pradesh": "hi", "Bihar": "hi",
  "Madhya Pradesh": "hi", "Rajasthan": "hi", "Delhi": "hi", "Chhattisgarh": "hi",
  "Jharkhand": "hi", "Uttarakhand": "hi", "Himachal Pradesh": "hi",
  "Odisha": "hi", "Assam": "bn", "Tripura": "bn",
};

export const getLangFromState = (state) => {
  const code = STATE_LANG[state] || "hi";
  return LANG_MAP[code] || DEFAULT_LANG;
};

export const transcribeWithGroq = async (audioBlob) => {
  if (!GROQ_KEY) {
    console.warn("No VITE_GROQ_KEY — skipping Whisper transcription");
    return { transcript: "", langInfo: DEFAULT_LANG };
  }
  try {
    const form = new FormData();
    form.append("file", new File([audioBlob], "audio.webm", { type: audioBlob.type || "audio/webm" }));
    form.append("model", "whisper-large-v3");
    form.append("response_format", "verbose_json");
    form.append("temperature", "0");

    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_KEY}` },
      body: form,
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) throw new Error(`Groq ${res.status}`);
    const data = await res.json();
    const detected = data.language || "hi";
    return {
      transcript: (data.text || "").trim(),
      langInfo: LANG_MAP[detected] || DEFAULT_LANG,
    };
  } catch (e) {
    console.error("Groq transcription failed:", e.message);
    return { transcript: "", langInfo: DEFAULT_LANG };
  }
};
