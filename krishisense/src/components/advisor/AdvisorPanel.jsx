import { useState, useEffect, useRef } from "react";
import { ChevronLeft, Volume2, VolumeX, Keyboard, PhoneOff, Mic, Send, Phone } from "lucide-react";
import { C } from "../../constants/theme";
import { askAI } from "../../lib/ai";
import { getLang, buildPrompt, detectLanguage } from "../../lib/voiceAI";
import { speakText, cancelAllSpeech } from "../../lib/sarvamTTS";
import aiCallingBg from "../../assets/AI_Calling_BG.png";

// ─── Response cache ────────────────────────────────────────────────────────────
// Module-level so it survives re-mounts within the same session.
const QUERY_CACHE  = new Map(); // key → { reply, ts }
const CACHE_TTL    = 60 * 60 * 1000; // 1 hour — stale enough for weather changes
const CACHE_MAX    = 100;

const normQ = (text) =>
  text.toLowerCase().trim()
    .replace(/[^\w\sऀ-ॿ਀-੿]/g, "") // keep Devanagari + words
    .replace(/\s+/g, " ");

const cacheKey = (text, locName) =>
  `${normQ(text)}|${locName || ""}|${new Date().toDateString()}`;

const SUGGESTIONS = [
  "मेरी फसल को पानी कब देना चाहिए?",
  "कांदा रोग का इलाज कैसे करें?",
  "आज मंडी भाव क्या है?",
  "माझ्या शेतात कोणते पीक घ्यावे?",
  "What crop should I plant now?",
];

// ─── speak() wrapper ──────────────────────────────────────────────────────────
// Uses Sarvam TTS (HTTP → Audio object, no user-gesture restriction) with
// automatic fallback to browser speech synthesis.
const speak = (text, langCode, onDone) => {
  if (!text) { onDone?.(); return; }
  speakText(text, langCode || "hi-IN", "shubh", null, () => onDone?.());
};

// ─── Reliable STT with silence detection ──────────────────────────────────────
// Uses continuous=true + 1.5s silence timer to capture natural speech pauses.
const createSTT = (langCode, onInterim, onFinal, onError) => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { onError?.("Speech recognition not supported. Please use Chrome or Edge."); return null; }

  const rec = new SR();
  rec.lang           = langCode || "hi-IN";
  rec.continuous     = true;
  rec.interimResults = true;

  let silenceTimer  = null;
  let accumulated   = "";
  let submitted     = false;

  const submit = (final) => {
    if (submitted || final.trim().length < 2) return;
    submitted = true;
    clearTimeout(silenceTimer);
    try { rec.stop(); } catch (_) {}
    onFinal(final.trim());
  };

  rec.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) accumulated += e.results[i][0].transcript + " ";
      else interim += e.results[i][0].transcript;
    }
    const current = (accumulated + interim).trim();
    onInterim?.(current);

    clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => submit(current), 1500);
  };

  rec.onend = () => {
    clearTimeout(silenceTimer);
    if (!submitted && accumulated.trim().length > 1) submit(accumulated.trim());
    else if (!submitted) onError?.("no-speech");
  };

  rec.onerror = (e) => {
    clearTimeout(silenceTimer);
    if (e.error !== "no-speech" && e.error !== "aborted") onError?.(e.error);
  };

  try { rec.start(); } catch (e) { onError?.(e.message); }
  return rec;
};

// ─── Component ─────────────────────────────────────────────────────────────────
export default function AdvisorPanel({ onClose, loc, weather, botImg, voiceBotImg, voiceOn }) {
  const locLang  = getLang(loc?.state);
  const avatar   = voiceBotImg || botImg || null;

  // ── UI state ──────────────────────────────────────────────────────────────
  const [msgs,           setMsgs]           = useState(() => {
    const t = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const greeting = `नमस्ते! 🌿 मैं KrishiSense AI हूँ — आपका कृषि सलाहकार।\nHello! I'm your AI farming advisor${loc?.name ? " for " + loc.name : ""}. Ask me anything in Hindi, English, or Marathi — crops, weather, diseases, or market prices!`;
    return [{ role: "ai", text: greeting, time: t }];
  });
  const [status,         setStatus]         = useState("idle"); // idle|listening|thinking|speaking
  const [interim,        setInterim]        = useState("");
  const [textInput,      setTextInput]      = useState("");
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [keyboardMode,   setKeyboardMode]   = useState(false);
  const [callActive,     setCallActive]     = useState(false);
  const [langMenuOpen,   setLangMenuOpen]   = useState(false);
  const [activeLang,     setActiveLang]     = useState(locLang);
  const [error,          setError]          = useState("");

  // ── Refs for stable callbacks (no stale closures) ─────────────────────────
  const callActiveRef    = useRef(false);
  const statusRef        = useRef("idle");
  const speakerRef       = useRef(true);
  const keyboardRef      = useRef(false);
  const langRef          = useRef(locLang.code);
  const recRef           = useRef(null);
  const bottomRef        = useRef();
  const lastAIReplyRef   = useRef(""); // echo guard — tracks last spoken reply

  // Keep refs in sync with state
  useEffect(() => { speakerRef.current   = speakerEnabled; }, [speakerEnabled]);
  useEffect(() => { keyboardRef.current  = keyboardMode;   }, [keyboardMode]);
  useEffect(() => { langRef.current      = activeLang.code; }, [activeLang]);

  const getTime = () =>
    new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  // ── CSS animations ────────────────────────────────────────────────────────
  useEffect(() => {
    const id = "adv-styles";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id;
      s.innerHTML = `
        @keyframes adv-bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-7px)} }
        @keyframes adv-pulse  { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes adv-ring   { 0%{transform:scale(0.75);opacity:0} 60%{opacity:0.5} 100%{transform:scale(1.3);opacity:0} }
        @keyframes adv-wave   { 0%,100%{transform:scaleY(0.2)} 50%{transform:scaleY(1)} }
        .adv-scroll::-webkit-scrollbar{width:3px}
        .adv-scroll::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.08);border-radius:4px}
      `;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, interim, status]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      callActiveRef.current = false;
      cancelAllSpeech();
      try { recRef.current?.stop(); } catch (_) {}
    };
  }, []);

  // ─── Core: AI response (with cache) ──────────────────────────────────────
  const getAIReply = async (userText, detectedLang) => {
    const key    = cacheKey(userText, loc?.name);
    const cached = QUERY_CACHE.get(key);

    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      console.log("[cache] hit:", key.slice(0, 60));
      return cached.reply;
    }

    const system = buildPrompt(detectedLang?.name || activeLang.name, loc, weather);
    const reply  = await askAI(userText, system);
    const answer = reply?.trim() || "Sorry, I couldn't connect. Please try again.";
    lastAIReplyRef.current = answer;

    // Evict oldest entry when full
    if (QUERY_CACHE.size >= CACHE_MAX) {
      QUERY_CACHE.delete(QUERY_CACHE.keys().next().value);
    }
    QUERY_CACHE.set(key, { reply: answer, ts: Date.now() });
    return answer;
  };

  // ─── Core: one full turn — listen → think → speak → listen ───────────────
  const startListening = () => {
    if (!callActiveRef.current || keyboardRef.current) return;

    statusRef.current = "listening";
    setStatus("listening");
    setInterim("");
    setError("");

    // Stop any existing recognition
    try { recRef.current?.stop(); } catch (_) {}

    recRef.current = createSTT(
      langRef.current,
      // onInterim
      (text) => setInterim(text),
      // onFinal
      async (transcript) => {
        if (!callActiveRef.current) return;
        setInterim("");

        // Echo guard: discard if transcript overlaps heavily with last AI reply
        // (mic picks up speaker output immediately after TTS ends)
        const lastReply = lastAIReplyRef.current;
        if (lastReply && transcript.trim().length > 8) {
          const tWords = transcript.toLowerCase().split(/\s+/);
          const rWords = new Set(lastReply.toLowerCase().split(/\s+/).filter(w => w.length > 3));
          const overlap = tWords.filter(w => w.length > 3 && rWords.has(w)).length;
          if (overlap / tWords.length > 0.45) {
            // Looks like echo — restart listening silently
            setTimeout(() => { if (callActiveRef.current && !keyboardRef.current) startListening(); }, 600);
            return;
          }
        }

        // Detect language from what the farmer said
        const detected = detectLanguage(transcript);
        if (detected.code !== langRef.current) {
          langRef.current = detected.code;
          setActiveLang(detected);
        }

        // Show user message
        setMsgs(p => [...p, { role: "user", text: transcript, time: getTime() }]);
        statusRef.current = "thinking";
        setStatus("thinking");

        // Get AI reply
        const reply = await getAIReply(transcript, detected);
        if (!callActiveRef.current) return;

        // Show AI message
        setMsgs(p => [...p, { role: "ai", text: reply, time: getTime() }]);

        // Speak reply, then loop back to listening
        if (speakerRef.current) {
          statusRef.current = "speaking";
          setStatus("speaking");
          speak(reply, langRef.current, () => {
            // 1200ms buffer — lets speaker echo decay before mic opens again
            setTimeout(() => {
              if (callActiveRef.current && !keyboardRef.current) startListening();
              else { statusRef.current = "idle"; setStatus("idle"); }
            }, 1200);
          });
        } else {
          // Speaker off: just loop back to listening
          if (!keyboardRef.current) startListening();
          else { statusRef.current = "idle"; setStatus("idle"); }
        }
      },
      // onError
      (err) => {
        if (!callActiveRef.current) return;
        if (err === "no-speech") {
          // Silence — just restart listening
          setTimeout(() => { if (callActiveRef.current && !keyboardRef.current) startListening(); }, 400);
        } else {
          setError(`Mic error: ${err}. Tap mic to retry.`);
          statusRef.current = "idle";
          setStatus("idle");
        }
      }
    );
  };

  // ─── Start call ───────────────────────────────────────────────────────────
  const startCall = () => {
    callActiveRef.current = true;
    setCallActive(true);
    setKeyboardMode(false);
    keyboardRef.current = false;
    setError("");

    const greeting = `नमस्ते! मैं KrishiSense AI हूँ — आपका कृषि विशेषज्ञ। Hello! I'm your AI farming advisor${loc?.name ? " for " + loc.name : ""}. बोलिए, क्या जानना है? Go ahead — ask me anything!`;

    setMsgs([{ role: "ai", text: greeting, time: getTime() }]);
    statusRef.current = "speaking";
    setStatus("speaking");

    speak(greeting, langRef.current, () => {
      // 1200ms buffer after greeting so mic doesn't pick up speaker echo
      setTimeout(() => {
        if (callActiveRef.current && !keyboardRef.current) startListening();
        else { statusRef.current = "idle"; setStatus("idle"); }
      }, 1200);
    });
  };

  // ─── End call ─────────────────────────────────────────────────────────────
  const endCall = () => {
    callActiveRef.current = false;
    cancelAllSpeech();
    try { recRef.current?.stop(); } catch (_) {}
    statusRef.current = "idle";
    setStatus("idle");
    setCallActive(false);
    setInterim("");
    onClose();
  };

  // ─── Keyboard send ────────────────────────────────────────────────────────
  const sendText = async () => {
    const text = textInput.trim();
    if (!text || statusRef.current === "thinking") return;
    setTextInput("");
    setMsgs(p => [...p, { role: "user", text, time: getTime() }]);
    statusRef.current = "thinking";
    setStatus("thinking");

    const detected = detectLanguage(text);
    const reply = await getAIReply(text, detected);
    setMsgs(p => [...p, { role: "ai", text: reply, time: getTime() }]);

    if (speakerRef.current) {
      statusRef.current = "speaking";
      setStatus("speaking");
      speak(reply, detectLanguage(reply).code, () => { statusRef.current = "idle"; setStatus("idle"); });
    } else {
      statusRef.current = "idle";
      setStatus("idle");
    }
  };

  // ─── Render helpers ───────────────────────────────────────────────────────
  const AvatarCircle = ({ size = 30 }) => (
    <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
      {avatar
        ? <img src={avatar} alt="AI" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <div style={{ width: "100%", height: "100%", background: "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.4 }}>🌿</div>
      }
    </div>
  );

  const renderAI = (text) => {
    const parts = text.split(/(Recommended:|Recommendation:|सल्ला:|सुझाव:|शिफारस:)/i);
    if (parts.length > 1) {
      return (
        <div>
          <p style={{ margin: 0, paddingBottom: 6, fontSize: 13, lineHeight: 1.65 }}>{parts[0].trim()}</p>
          <div style={{ borderTop: "1px dashed #C8E6C9", paddingTop: 8, marginTop: 4 }}>
            <span style={{ color: "#2E7D32", fontWeight: 700, fontSize: 12, display: "block", marginBottom: 3 }}>✅ Recommended:</span>
            <p style={{ margin: 0, color: "#1B5E20", fontStyle: "italic", fontSize: 13, lineHeight: 1.65 }}>{parts.slice(2).join("").trim()}</p>
          </div>
        </div>
      );
    }
    return <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65 }}>{text}</p>;
  };

  // Status display config
  const sc = {
    listening: { label: "🎙️ Listening...",  dot: "#81C784", bg: "rgba(129,199,132,0.25)" },
    thinking:  { label: "⏳ Thinking...",   dot: "#FFD54F", bg: "rgba(255,213,79,0.25)"  },
    speaking:  { label: "🔊 Speaking...",   dot: "#64B5F6", bg: "rgba(100,181,246,0.25)" },
    idle:      { label: "Tap to speak",     dot: "#9E9E9E", bg: "rgba(255,255,255,0.12)" },
  }[status] || { label: "...", dot: "#9E9E9E", bg: "rgba(255,255,255,0.12)" };

  // ─── Call Overlay ──────────────────────────────────────────────────────────
  if (callActive && !keyboardMode) {
    return (
      <div style={{
        position: "fixed", top: 0, bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 480, height: "100vh", zIndex: 60,
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <style>{`
          @keyframes adv-ring  { 0%{transform:scale(0.75);opacity:0} 60%{opacity:0.5} 100%{transform:scale(1.35);opacity:0} }
          @keyframes adv-pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
          @keyframes adv-bounce{ 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-7px)} }
          .adv-scroll::-webkit-scrollbar{width:3px}
          .adv-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:4px}
        `}</style>

        {/* Background image */}
        <img
          src={aiCallingBg}
          alt=""
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center",
            zIndex: 0,
          }}
        />

        {/* Dark overlay so all UI elements stay legible */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 1,
          background: "linear-gradient(160deg, rgba(10,35,18,0.72) 0%, rgba(18,55,28,0.65) 50%, rgba(10,25,55,0.72) 100%)",
        }} />

        <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", flex: 1, padding: "52px 24px 28px", overflow: "hidden" }}>

          {/* Avatar + rings */}
          <div style={{ position: "relative", marginBottom: 16 }}>
            {(status === "listening" || status === "speaking") && (
              <>
                <div style={{ position: "absolute", inset: -14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.25)", animation: "adv-ring 1.8s infinite" }} />
                <div style={{ position: "absolute", inset: -14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.15)", animation: "adv-ring 1.8s 0.7s infinite" }} />
              </>
            )}
            <div style={{ width: 100, height: 100, borderRadius: "50%", overflow: "hidden", border: "3px solid rgba(255,255,255,0.35)" }}>
              {avatar
                ? <img src={avatar} alt="AI" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: "100%", height: "100%", background: "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>🌿</div>
              }
            </div>
          </div>

          <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 3 }}>KrishiSense AI</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 18, letterSpacing: 0.5 }}>
            {loc?.name ? `${loc.name}, ${loc.state}` : "AI Farming Advisor"}
          </div>

          {/* Status pill */}
          <div style={{ padding: "7px 20px", borderRadius: 999, background: sc.bg, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: sc.dot, animation: "adv-pulse 1s infinite" }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{sc.label}</span>
          </div>

          {/* Interim transcript */}
          {interim && (
            <div style={{ padding: "8px 16px", borderRadius: 12, background: "rgba(255,255,255,0.12)", marginBottom: 12, maxWidth: "85%" }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", fontStyle: "italic" }}>"{interim}"</span>
            </div>
          )}

          {/* Transcript scroll */}
          <div className="adv-scroll" style={{ flex: 1, width: "100%", overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingBottom: 8 }}>
            {msgs.slice(-8).map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "82%", padding: "9px 14px",
                  borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: m.role === "user" ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.26)",
                  color: "#fff", fontSize: 13, lineHeight: 1.55,
                }}>
                  <div style={{ fontSize: 10, opacity: 0.55, marginBottom: 3, fontWeight: 600 }}>
                    {m.role === "user" ? "You" : "KrishiSense AI"}
                  </div>
                  {m.text}
                </div>
              </div>
            ))}

            {/* Thinking dots */}
            {status === "thinking" && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ padding: "12px 16px", background: "rgba(0,0,0,0.26)", borderRadius: "16px 16px 16px 4px" }}>
                  <div style={{ display: "flex", gap: 5 }}>
                    {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#81C784", animation: `adv-bounce 1.2s ${i*0.2}s infinite` }} />)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div style={{ padding: "8px 14px", borderRadius: 10, background: "rgba(229,57,53,0.25)", marginBottom: 12, maxWidth: "85%" }}>
              <span style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>⚠️ {error}</span>
            </div>
          )}

          {/* Bottom controls */}
          <div style={{ display: "flex", gap: 28, alignItems: "center", marginTop: 16 }}>
            {/* Speaker */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <button
                onClick={() => { setSpeakerEnabled(p => !p); if (speakerEnabled) cancelAllSpeech(); }}
                style={{ width: 52, height: 52, borderRadius: "50%", border: "none", cursor: "pointer", background: speakerEnabled ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                {speakerEnabled ? <Volume2 size={22} color="#fff" /> : <VolumeX size={22} color="rgba(255,255,255,0.45)" />}
              </button>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>Speaker</span>
            </div>

            {/* End call */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <button
                onClick={endCall}
                style={{ width: 68, height: 68, borderRadius: "50%", border: "none", cursor: "pointer", background: "#E53935", boxShadow: "0 0 0 10px rgba(229,57,53,0.18), 0 6px 20px rgba(229,57,53,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <PhoneOff size={28} color="#fff" />
              </button>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>End Call</span>
            </div>

            {/* Type instead */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <button
                onClick={() => {
                  cancelAllSpeech();
                  try { recRef.current?.stop(); } catch (_) {}
                  statusRef.current = "idle"; setStatus("idle");
                  setKeyboardMode(true); keyboardRef.current = true;
                }}
                style={{ width: 52, height: 52, borderRadius: "50%", border: "none", cursor: "pointer", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Keyboard size={22} color="#fff" />
              </button>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>Type</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Chat View ─────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: "fixed", top: 0, bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 480, height: "100vh", zIndex: 60,
      display: "flex", flexDirection: "column", background: "#F5F7F5", overflow: "hidden",
    }}>
      <style>{`
        @keyframes adv-bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-7px)} }
        @keyframes adv-pulse  { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes adv-wave   { 0%,100%{transform:scaleY(0.2)} 50%{transform:scaleY(1)} }
        .adv-scroll::-webkit-scrollbar{width:3px}
        .adv-scroll::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.08);border-radius:4px}
      `}</style>

      {/* Header */}
      <div style={{ background: "#fff", padding: "48px 16px 12px", borderBottom: "1px solid #EEEEEE", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={endCall} style={{ width: 40, height: 40, borderRadius: "50%", border: "1px solid #E8EFE8", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <ChevronLeft size={20} color="#2E7D32" />
          </button>

          <AvatarCircle size={42} />

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#1A1A1A" }}>KrishiSense AI</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 1 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#43A047", display: "inline-block", animation: "adv-pulse 1.5s infinite" }} />
              <span style={{ fontSize: 11, color: "#43A047", fontWeight: 600 }}>Online · AI Farming Advisor</span>
            </div>
          </div>

          {/* Language selector */}
          <div style={{ position: "relative" }}>
            <button onClick={() => setLangMenuOpen(p => !p)} style={{ padding: "5px 10px", borderRadius: 16, border: "1px solid #E8EFE8", background: "#F1F8F1", fontSize: 11, fontWeight: 700, color: "#2E7D32", cursor: "pointer" }}>
              {activeLang.code === "hi-IN" ? "🇮🇳 HI" : activeLang.code === "mr-IN" ? "🇮🇳 MR" : "🇮🇳 EN"} ▾
            </button>
            {langMenuOpen && (
              <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 6, background: "#fff", border: "1px solid #E8EFE8", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.08)", zIndex: 200, overflow: "hidden", width: 110 }}>
                {[{ code: "en-US", name: "English" }, { code: "hi-IN", name: "Hindi" }, { code: "mr-IN", name: "Marathi" }].map(item => (
                  <button key={item.code} onClick={() => { setActiveLang(item); langRef.current = item.code; setLangMenuOpen(false); }}
                    style={{ width: "100%", padding: "9px 14px", textAlign: "left", border: "none", background: activeLang.code === item.code ? "#E8F5E9" : "transparent", color: activeLang.code === item.code ? "#1B5E20" : "#333", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    {item.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Call button */}
          <button
            onClick={startCall}
            title="Start voice call"
            style={{ width: 40, height: 40, borderRadius: "50%", border: "none", cursor: "pointer", background: "linear-gradient(135deg, #2E7D32, #43A047)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 12px rgba(46,125,50,0.4)" }}
          >
            <Phone size={18} color="#fff" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="adv-scroll" style={{ flex: 1, overflowY: "auto", padding: "14px 14px", display: "flex", flexDirection: "column", gap: 12 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", gap: 8, flexDirection: m.role === "user" ? "row-reverse" : "row", alignItems: "flex-end" }}>
            {m.role === "ai" && <AvatarCircle size={30} />}
            <div style={{ maxWidth: "78%" }}>
              {m.role === "ai" && <div style={{ fontSize: 10, fontWeight: 700, color: "#2E7D32", marginBottom: 3, paddingLeft: 4 }}>KrishiSense AI</div>}
              <div style={{
                background: m.role === "user" ? "linear-gradient(135deg, #2E7D32, #388E3C)" : "#fff",
                borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                padding: "11px 14px",
                boxShadow: m.role === "user" ? "0 3px 10px rgba(46,125,50,0.2)" : "0 1px 6px rgba(0,0,0,0.07)",
              }}>
                <div style={{ fontSize: 13, color: m.role === "user" ? "#fff" : "#1A1A1A", lineHeight: 1.65, whiteSpace: "pre-line" }}>
                  {m.role === "ai" ? renderAI(m.text) : m.text}
                </div>
                <div style={{ fontSize: 10, color: m.role === "user" ? "rgba(255,255,255,0.55)" : "#C0C0C0", marginTop: 4, textAlign: m.role === "user" ? "right" : "left", display: "flex", alignItems: "center", gap: 3, justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                  <span>{m.time}</span>
                  {m.role === "user" && <span style={{ color: "#81C784", fontWeight: 800, fontSize: 11 }}>✓✓</span>}
                  {m.role === "ai" && (
                    <button onClick={() => speak(m.text, activeLang.code, () => {})}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 0, marginLeft: 4, color: "#9E9E9E", display: "flex" }}>
                      <Volume2 size={11} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Interim (typing mode voice) */}
        {interim && (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div style={{ maxWidth: "78%", padding: "10px 14px", borderRadius: "18px 18px 4px 18px", background: "#F1F8F1", border: "1px dashed #A5D6A7", color: "#2E7D32", fontSize: 13, fontStyle: "italic" }}>
              "{interim}"
            </div>
          </div>
        )}

        {/* Thinking dots */}
        {status === "thinking" && (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <AvatarCircle size={30} />
            <div style={{ background: "#fff", borderRadius: "18px 18px 18px 4px", padding: "13px 16px", boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
              <div style={{ display: "flex", gap: 5 }}>
                {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#2E7D32", animation: `adv-bounce 1.2s ${i*0.2}s infinite` }} />)}
              </div>
            </div>
          </div>
        )}

        {/* Speaking waveform */}
        {status === "speaking" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 3, height: 28 }}>
              {Array.from({ length: 11 }, (_, i) => {
                const h = 4 + (1 - Math.abs(i - 5) / 5.5) * 18;
                return <div key={i} style={{ width: 3, borderRadius: 2, background: "#2E7D32", height: `${h}px`, animation: "adv-wave 0.6s ease-in-out infinite alternate", animationDelay: `${i * 0.055}s` }} />;
              })}
            </div>
            <span style={{ fontSize: 12, color: "#2E7D32", fontWeight: 600 }}>Speaking...</span>
          </div>
        )}

        {error && !callActive && (
          <div style={{ color: "#D32F2F", fontSize: 12, fontWeight: 600, textAlign: "center", padding: "6px 12px", background: "#FFEBEE", borderRadius: 8, border: "1px solid #FFCDD2" }}>
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick suggestions */}
      <div className="adv-scroll" style={{ background: "#fff", padding: "8px 12px", display: "flex", gap: 8, overflowX: "auto", borderTop: "1px solid #F0F0F0", flexShrink: 0 }}>
        {SUGGESTIONS.map((s, i) => (
          <button key={i} onClick={() => { setTextInput(s); }}
            style={{ flexShrink: 0, padding: "6px 13px", borderRadius: 999, fontSize: 11, fontWeight: 600, border: "1px solid #E8F5E9", background: "#F1F8F1", color: "#2E7D32", cursor: "pointer", whiteSpace: "nowrap" }}>
            {s}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <div style={{ background: "#fff", padding: "10px 12px 20px", display: "flex", gap: 8, alignItems: "center", flexShrink: 0, borderTop: "1px solid #EEEEEE" }}>
        {/* Mic button — starts call on tap */}
        <button
          onClick={startCall}
          title="Start voice call"
          style={{
            width: 42, height: 42, borderRadius: "50%", border: "none", cursor: "pointer", flexShrink: 0,
            background: status === "listening" ? "#E53935" : "#F1F8F1",
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: status === "listening" ? "adv-pulse 0.8s infinite" : "none",
          }}
        >
          <Mic size={19} color={status === "listening" ? "#fff" : "#2E7D32"} />
        </button>

        <input
          value={textInput}
          onChange={e => setTextInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendText()}
          placeholder={`Type in ${activeLang.name}...`}
          style={{ flex: 1, background: "#F5F7F5", border: "1.5px solid transparent", borderRadius: 999, padding: "11px 18px", fontSize: 13.5, color: "#1A1A1A", outline: "none", transition: "border 0.2s" }}
          onFocus={e => e.target.style.border = "1.5px solid #2E7D32"}
          onBlur={e => e.target.style.border = "1.5px solid transparent"}
          disabled={status === "thinking"}
        />

        <button
          onClick={() => { setSpeakerEnabled(p => !p); if (speakerEnabled) cancelAllSpeech(); }}
          style={{ width: 42, height: 42, borderRadius: "50%", border: "none", cursor: "pointer", flexShrink: 0, background: speakerEnabled ? "#E8F5E9" : "#F5F5F5", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          {speakerEnabled ? <Volume2 size={18} color="#2E7D32" /> : <VolumeX size={18} color="#9E9E9E" />}
        </button>

        <button
          onClick={sendText}
          disabled={!textInput.trim() || status === "thinking"}
          style={{
            width: 42, height: 42, borderRadius: "50%", border: "none", cursor: !textInput.trim() || status === "thinking" ? "not-allowed" : "pointer", flexShrink: 0,
            background: !textInput.trim() || status === "thinking" ? "#E0E0E0" : "linear-gradient(135deg, #2E7D32, #43A047)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: !textInput.trim() || status === "thinking" ? "none" : "0 3px 10px rgba(46,125,50,0.3)",
          }}
        >
          <Send size={17} color={!textInput.trim() || status === "thinking" ? "#9E9E9E" : "#fff"} />
        </button>
      </div>

      {/* Secure badge */}
      <div style={{ background: "#fff", padding: "6px 0 8px", textAlign: "center", borderTop: "1px solid #EEEEEE", flexShrink: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#2E7D32" }}>🔒 Secure & private conversation</span>
      </div>
    </div>
  );
}
