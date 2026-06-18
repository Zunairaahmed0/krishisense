import { useState, useRef, useEffect, useCallback } from "react";
import { PhoneOff, Mic, MicOff, Volume2 } from "lucide-react";
import { C } from "../../constants/theme";
import { AudioRecorder } from "../../lib/audioRecorder";
import { transcribeWithGroq, getLangFromState, DEFAULT_LANG } from "../../lib/groqWhisper";
import { speakText, cancelAllSpeech } from "../../lib/sarvamTTS";
import { askAI } from "../../lib/ai";

const S = { IDLE: "idle", LISTENING: "listening", THINKING: "thinking", SPEAKING: "speaking" };

const STATUS_LABEL = { idle: "Starting…", listening: "Listening…", thinking: "Thinking…", speaking: "Speaking…" };
const STATUS_COLOR = { idle: C.mut, listening: C.p3, thinking: C.amber, speaking: C.blue };

const NUM_BARS = 24;

const buildGreeting = (lang, loc, weather) => {
  const place   = loc?.name || "";
  const temp    = weather?.current?.temperature_2m;
  const tempStr = temp != null ? `${temp}°C` : "";

  const placeStr = place ? ` You're calling from ${place}.` : "";
  const tempFrag  = tempStr ? ` Today it's ${tempStr}.` : "";

  switch (lang.code.split("-")[0]) {
    case "mr":
      return `मी KrishiSense चा AI शेती तज्ञ आहे.${place ? ` तुम्ही ${place} मधून आहात.` : ""}${tempStr ? ` आज तापमान ${tempStr} आहे.` : ""} मी तुम्हाला कशी मदत करू?`;
    case "hi":
      return `मैं KrishiSense का AI कृषि विशेषज्ञ हूं।${place ? ` आप ${place} से हैं।` : ""}${tempStr ? ` आज तापमान ${tempStr} है।` : ""} मैं आपकी कैसे मदद कर सकता हूं?`;
    case "te":
      return `నేను KrishiSense AI వ్యవసాయ నిపుణుడిని.${place ? ` మీరు ${place} నుండి ఉన్నారు.` : ""}${tempStr ? ` ఈరోజు ఉష్ణోగ్రత ${tempStr}.` : ""} నేను మీకు ఎలా సహాయం చేయగలను?`;
    case "ta":
      return `நான் KrishiSense AI விவசாய நிபுணர்.${place ? ` நீங்கள் ${place} இல் இருக்கிறீர்கள்.` : ""}${tempStr ? ` இன்று வெப்பநிலை ${tempStr}.` : ""} நான் உங்களுக்கு எப்படி உதவலாம்?`;
    case "kn":
      return `ನಾನು KrishiSense AI ಕೃಷಿ ತಜ್ಞ.${place ? ` ನೀವು ${place} ನಿಂದ ಇದ್ದೀರಿ.` : ""}${tempStr ? ` ಇಂದು ತಾಪಮಾನ ${tempStr}.` : ""} ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?`;
    case "gu":
      return `હું KrishiSense AI ખેતી નિષ્ણાત છું.${place ? ` તમે ${place} થી છો.` : ""}${tempStr ? ` આજે તાપમાન ${tempStr} છે.` : ""} હું તમારી કેવી રીતે મદદ કરી શકું?`;
    case "bn":
      return `আমি KrishiSense AI কৃষি বিশেষজ্ঞ।${place ? ` আপনি ${place} থেকে এসেছেন।` : ""}${tempStr ? ` আজ তাপমাত্রা ${tempStr}।` : ""} আমি আপনাকে কীভাবে সাহায্য করতে পারি?`;
    case "pa":
      return `ਮੈਂ KrishiSense AI ਖੇਤੀ ਮਾਹਿਰ ਹਾਂ।${place ? ` ਤੁਸੀਂ ${place} ਤੋਂ ਹੋ।` : ""}${tempStr ? ` ਅੱਜ ਤਾਪਮਾਨ ${tempStr} ਹੈ।` : ""} ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?`;
    case "ml":
      return `ഞാൻ KrishiSense AI കൃഷി വിദഗ്ദ്ധൻ.${place ? ` നിങ്ങൾ ${place} ൽ നിന്നാണ്.` : ""}${tempStr ? ` ഇന്ന് താപനില ${tempStr}.` : ""} ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കട്ടെ?`;
    default:
      return `I'm KrishiSense, your AI farming expert.${placeStr}${tempFrag} How can I help you today?`;
  }
};

export default function ExpertCallPanel({ onClose, loc, weather, botImg }) {
  const [phase,        setPhase]        = useState(S.IDLE);
  const [detectedLang, setDetectedLang] = useState(() => getLangFromState(loc?.state));
  const [interimText,  setInterimText]  = useState("");
  const [messages,     setMessages]     = useState([]);
  const [muted,        setMuted]        = useState(false);
  const [callTime,     setCallTime]     = useState(0);
  const [level,        setLevel]        = useState(0);

  const recorderRef    = useRef(null);
  const levelTimerRef  = useRef(null);
  const callTimerRef   = useRef(null);
  const historyRef     = useRef([]);
  const isMountedRef   = useRef(true);
  const isSpeakingRef  = useRef(false);
  const mutedRef       = useRef(false);
  const messagesEndRef = useRef(null);

  useEffect(() => { mutedRef.current = muted; }, [muted]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Call timer ──────────────────────────────────────────────────────────────
  useEffect(() => {
    callTimerRef.current = setInterval(() => setCallTime(t => t + 1), 1000);
    return () => clearInterval(callTimerRef.current);
  }, []);

  // ── startRecording ──────────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    if (!isMountedRef.current || mutedRef.current) return;
    setPhase(S.LISTENING);
    setInterimText("");

    const recorder = new AudioRecorder({ silenceMs: 1800, silenceThreshold: 0.012 });
    recorderRef.current = recorder;

    levelTimerRef.current = setInterval(() => setLevel(recorder.getLevel()), 80);

    try {
      // start() returns Promise<Blob> that resolves when silence auto-stops recording
      const blob = await recorder.start();
      clearInterval(levelTimerRef.current);
      setLevel(0);
      recorderRef.current = null;

      // Blobs under ~1 KB are noise/silence — loop back
      if (!isMountedRef.current || !blob || blob.size < 1000) {
        if (isMountedRef.current && !mutedRef.current) startRecording();
        return;
      }

      setPhase(S.THINKING);
      const { transcript, langInfo } = await transcribeWithGroq(blob);
      if (!isMountedRef.current) return;

      setDetectedLang(langInfo);

      if (transcript.trim()) {
        setInterimText(transcript);
        processTranscript(transcript, langInfo);
      } else if (!mutedRef.current) {
        startRecording();
      }
    } catch (e) {
      clearInterval(levelTimerRef.current);
      setLevel(0);
      recorderRef.current = null;
      console.warn("Recording error:", e.message);
      if (isMountedRef.current && !mutedRef.current) setTimeout(startRecording, 1000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── doSpeak ─────────────────────────────────────────────────────────────────
  const doSpeak = useCallback(async (text, lang) => {
    if (!isMountedRef.current) return;
    if (isSpeakingRef.current) cancelAllSpeech();
    isSpeakingRef.current = true;
    setPhase(S.SPEAKING);
    await speakText(
      text,
      lang.sarvamCode || lang.code,
      lang.speaker || "shubh",
      () => { if (isMountedRef.current) setPhase(S.SPEAKING); },
      () => {
        isSpeakingRef.current = false;
        if (isMountedRef.current && !mutedRef.current) startRecording();
      },
    );
    isSpeakingRef.current = false;
  }, [startRecording]);

  // ── processTranscript ───────────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const processTranscript = useCallback(async (transcript, langInfo) => {
    if (!isMountedRef.current) return;
    setPhase(S.THINKING);
    setMessages(prev => [...prev, { role: "user", text: transcript }]);

    const t   = weather?.current?.temperature_2m;
    const hum = weather?.current?.relative_humidity_2m;

    // ── Language detection ────────────────────────────────────────────────────
    // Groq gives us a base language code. We also check the script to catch Hinglish
    // (Devanagari + Latin mix) which Whisper sometimes misses or labels as "en" or "hi".
    const baseCode      = langInfo.code.split("-")[0]; // "hi", "mr", "en", etc.
    const hasDevanagari = /[ऀ-ॿ]/.test(transcript);
    const hasLatinWord  = /[a-zA-Z]{2,}/.test(transcript);
    // Hinglish = Devanagari words + English words, and Whisper detected Hindi or English
    const isHinglish    = hasDevanagari && hasLatinWord && (baseCode === "hi" || baseCode === "en");

    // ── Per-language rule injected into Gemini ────────────────────────────────
    let langRule;
    if (isHinglish) {
      langRule = `The farmer is speaking Hinglish (Hindi-English code-mix). Your ENTIRE reply must also be Hinglish — mix Hindi (in Devanagari script) and English words naturally, exactly as the farmer did. Example style: "Aapki fasal mein nitrogen ki kami hai, isliye urea dalna chahiye."`;
    } else if (baseCode === "hi") {
      langRule = `The farmer spoke in Hindi. Your ENTIRE reply must be in Hindi using Devanagari script. Zero English words. Pure Hindi only.`;
    } else if (baseCode === "mr") {
      langRule = `The farmer spoke in Marathi. Your ENTIRE reply must be in Marathi using Devanagari script. Zero English or Hindi words. Pure Marathi only.`;
    } else if (baseCode === "en") {
      langRule = `The farmer spoke in English. Your ENTIRE reply must be in English. Do not use any Hindi, Marathi, or other Indian language words.`;
    } else {
      langRule = `The farmer spoke in ${langInfo.name}. Your ENTIRE reply must be in ${langInfo.name} — every single word. Never switch language.`;
    }

    const historyLines = historyRef.current
      .slice(-20)
      .map(m => `${m.role === "user" ? "Farmer" : "Expert"}: ${m.text}`)
      .join("\n");

    const system = [
      "You are KrishiSense AI farming expert having a voice call with an Indian farmer.",
      loc?.name ? `Farm location: ${loc.name}, ${loc.state}.` : "",
      t != null  ? `Current weather: ${t}°C, ${hum ?? "?"}% humidity.` : "",
      langRule,
      "Keep your reply to 2-3 sentences. No bullet points, no markdown — spoken words only.",
      "End with one short practical follow-up question.",
    ].filter(Boolean).join(" ");

    const langTag = isHinglish ? "Hinglish" : langInfo.name;
    const prompt = historyLines
      ? `${historyLines}\nFarmer: ${transcript}\nExpert (${langTag}):`
      : `Farmer: ${transcript}\nExpert (${langTag}):`;

    const reply = (await askAI(prompt, system)) || buildGreeting(langInfo, loc, weather);
    if (!isMountedRef.current) return;

    historyRef.current = [
      ...historyRef.current,
      { role: "user",      text: transcript },
      { role: "assistant", text: reply },
    ].slice(-20);

    setMessages(prev => [...prev, { role: "ai", text: reply }]);
    setInterimText("");

    // Hinglish → Hindi TTS (handles Devanagari + occasional English words best)
    const ttsLang = isHinglish
      ? { ...langInfo, sarvamCode: "hi-IN", code: "hi-IN", speaker: "shubh" }
      : langInfo;
    doSpeak(reply, ttsLang);
  }, [loc, weather, doSpeak]);

  // ── Greeting + lifecycle ────────────────────────────────────────────────────
  // Uses a local `active` flag (not a ref) so each StrictMode invocation gets its
  // own closure. The first invocation's cleanup sets active=false, cancelling its
  // timer. The second invocation creates a NEW active=true and a new timer that
  // actually fires — fixing the "Starting…" forever bug.
  useEffect(() => {
    isMountedRef.current = true;

    const initLang = getLangFromState(loc?.state);
    const greeting = buildGreeting(initLang, loc, weather);
    setDetectedLang(initLang);
    setMessages([{ role: "ai", text: greeting }]);

    let active = true;
    const timer = setTimeout(() => {
      if (active && isMountedRef.current) doSpeak(greeting, initLang);
    }, 500);

    return () => {
      active = false; // blocks this invocation's timer on fake unmount
      clearTimeout(timer);
      isMountedRef.current  = false;
      isSpeakingRef.current = false;
      clearInterval(levelTimerRef.current);
      clearInterval(callTimerRef.current);
      recorderRef.current?.stop?.();
      cancelAllSpeech();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived values ──────────────────────────────────────────────────────────
  const statusColor = STATUS_COLOR[phase] || C.mut;
  const statusLabel = STATUS_LABEL[phase] || "";
  const mm = String(Math.floor(callTime / 60)).padStart(2, "0");
  const ss = String(callTime % 60).padStart(2, "0");

  const barHeights = Array.from({ length: NUM_BARS }, (_, i) => {
    if (phase !== S.LISTENING && phase !== S.SPEAKING) return 4;
    const eff = phase === S.LISTENING ? level : level * 0.5 + 0.08;
    const noise = Math.sin(i * 1.4 + Date.now() * 0.004) * 0.35 + 0.65;
    return Math.max(4, Math.min(48, eff * 90 * noise * (0.55 + (i % 4) * 0.15)));
  });

  const handleInterrupt = () => {
    if (phase === S.SPEAKING) {
      cancelAllSpeech();
      isSpeakingRef.current = false;
      if (!mutedRef.current) startRecording();
    } else if (phase === S.LISTENING) {
      recorderRef.current?.stop?.().catch(() => {});
    } else {
      if (!mutedRef.current) startRecording();
    }
  };

  const handleEnd = () => {
    isMountedRef.current  = false;
    isSpeakingRef.current = false;
    cancelAllSpeech();
    clearInterval(levelTimerRef.current);
    clearInterval(callTimerRef.current);
    recorderRef.current?.stop?.().catch(() => {});
    onClose();
  };

  const replayMessage = (text) => {
    cancelAllSpeech();
    isSpeakingRef.current = false;
    doSpeak(text, detectedLang);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "linear-gradient(160deg,#0d2b1d 0%,#123c2c 45%,#0a2318 100%)",
      display: "flex", flexDirection: "column",
      maxWidth: 480, margin: "0 auto",
      fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
    }}>
      <style>{`
        @keyframes ks-ripple {
          0%   { transform: scale(1);   opacity: 0.55; }
          100% { transform: scale(2);   opacity: 0; }
        }
        @keyframes ks-blink {
          0%,100% { opacity: 1; } 50% { opacity: 0.2; }
        }
      `}</style>

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div style={{ padding: "52px 20px 14px", flexShrink: 0 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 6 }}>
          🌿 KrishiSense Expert
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          {loc?.name && (
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.60)", fontWeight: 600 }}>
              📍 {loc.name}
            </span>
          )}
          <span style={{ color: "rgba(255,255,255,0.30)" }}>·</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.60)", fontWeight: 600 }}>
            {detectedLang.name}
          </span>
          <span style={{ color: "rgba(255,255,255,0.30)" }}>·</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontFamily: "monospace" }}>
            {mm}:{ss}
          </span>
        </div>
        {/* Status pill */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "4px 11px", borderRadius: 99,
          background: `${statusColor}22`, border: `1px solid ${statusColor}44`,
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: "50%",
            background: statusColor,
            display: "block",
            animation: phase !== S.IDLE ? "ks-blink 1.1s ease-in-out infinite" : "none",
          }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: statusColor }}>{statusLabel}</span>
        </div>
      </div>

      {/* ── Avatar + ripple rings ─────────────────────────────────────────────── */}
      <div style={{
        display: "flex", justifyContent: "center",
        padding: "4px 0 10px", flexShrink: 0, position: "relative",
      }}>
        {(phase === S.LISTENING || phase === S.SPEAKING) && [0, 1].map(n => (
          <div key={n} style={{
            position: "absolute",
            width: 88, height: 88, borderRadius: "50%",
            border: `2px solid ${statusColor}55`,
            animation: "ks-ripple 1.6s ease-out infinite",
            animationDelay: `${n * 0.7}s`,
            pointerEvents: "none",
          }} />
        ))}
        <div style={{
          width: 88, height: 88, borderRadius: "50%",
          background: `linear-gradient(135deg,${C.p2},${C.p4})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: `3px solid ${statusColor}`,
          boxShadow: `0 0 0 4px ${statusColor}22, 0 8px 28px rgba(0,0,0,0.45)`,
          transition: "border-color 0.3s",
          overflow: "hidden", flexShrink: 0, zIndex: 1,
        }}>
          {botImg
            ? <img src={botImg} alt="AI" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            : <span style={{ fontSize: 38 }}>🌿</span>}
        </div>
      </div>

      {/* ── Waveform ──────────────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 3, height: 56, padding: "0 24px", flexShrink: 0,
      }}>
        {barHeights.map((h, i) => (
          <div key={i} style={{
            width: 3, borderRadius: 99, height: h,
            background: phase === S.LISTENING
              ? `rgba(34,160,93,${0.35 + (h / 48) * 0.65})`
              : phase === S.SPEAKING
              ? `rgba(14,165,233,${0.3 + (h / 48) * 0.6})`
              : "rgba(255,255,255,0.10)",
            transition: "height 0.08s ease, background 0.3s",
          }} />
        ))}
      </div>

      {/* ── Interim transcript ────────────────────────────────────────────────── */}
      {interimText ? (
        <div style={{
          margin: "4px 20px 6px",
          padding: "8px 12px", borderRadius: 10,
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.10)",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.78)", fontStyle: "italic" }}>
            "{interimText}"
          </span>
        </div>
      ) : null}

      {/* ── Chat history ──────────────────────────────────────────────────────── */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "6px 16px",
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            alignItems: "flex-end", gap: 5,
          }}>
            {msg.role === "ai" && (
              <div style={{
                width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                background: `linear-gradient(135deg,${C.p2},${C.p4})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden",
              }}>
                {botImg
                  ? <img src={botImg} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  : <span style={{ fontSize: 12 }}>🌿</span>}
              </div>
            )}
            <div style={{
              maxWidth: "76%", padding: "8px 12px", fontSize: 12, lineHeight: 1.6,
              borderRadius: msg.role === "user"
                ? "14px 14px 3px 14px"
                : "14px 14px 14px 3px",
              background: msg.role === "user"
                ? `linear-gradient(135deg,${C.p2},${C.p3})`
                : "rgba(255,255,255,0.09)",
              border: msg.role === "ai" ? "1px solid rgba(255,255,255,0.11)" : "none",
              color: msg.role === "user" ? "#fff" : "rgba(255,255,255,0.90)",
            }}>
              {msg.text}
            </div>
            {msg.role === "ai" && (
              <button
                onClick={() => replayMessage(msg.text)}
                title="Replay"
                style={{
                  background: "none", border: "none", padding: 2,
                  cursor: "pointer", flexShrink: 0,
                  color: "rgba(255,255,255,0.35)",
                }}
              >
                <Volume2 size={13} />
              </button>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Bottom controls ───────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 22, padding: "14px 20px 42px", flexShrink: 0,
      }}>
        {/* Mute */}
        <button
          onClick={() => setMuted(v => !v)}
          title={muted ? "Unmute" : "Mute"}
          style={{
            width: 52, height: 52, borderRadius: "50%",
            background: muted ? `${C.red}22` : "rgba(255,255,255,0.09)",
            border: `1.5px solid ${muted ? C.red : "rgba(255,255,255,0.18)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
        >
          {muted
            ? <MicOff size={22} color={C.red} />
            : <Mic   size={22} color="rgba(255,255,255,0.82)" />}
        </button>

        {/* End call */}
        <button
          onClick={handleEnd}
          title="End call"
          style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "linear-gradient(135deg,#ef4444,#dc2626)",
            border: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(239,68,68,0.45)",
          }}
        >
          <PhoneOff size={26} color="#fff" />
        </button>

        {/* Speak / Interrupt */}
        <button
          onClick={handleInterrupt}
          title={phase === S.SPEAKING ? "Interrupt" : phase === S.LISTENING ? "Stop listening" : "Speak"}
          style={{
            width: 52, height: 52, borderRadius: "50%",
            background: phase === S.LISTENING
              ? `${C.p3}28`
              : phase === S.SPEAKING
              ? `${C.blue}28`
              : "rgba(255,255,255,0.09)",
            border: `1.5px solid ${
              phase === S.LISTENING ? C.p3
              : phase === S.SPEAKING ? C.blue
              : "rgba(255,255,255,0.18)"
            }`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <Mic size={22} color={
            phase === S.LISTENING ? C.p3
            : phase === S.SPEAKING ? C.blue
            : "rgba(255,255,255,0.82)"
          } />
        </button>
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <div style={{
        textAlign: "center", fontSize: 9,
        color: "rgba(255,255,255,0.22)",
        padding: "0 16px 14px", flexShrink: 0, letterSpacing: 0.4,
      }}>
        Groq Whisper · Gemini 2.5 · Sarvam Bulbul · 10 Indian languages
      </div>
    </div>
  );
}
