const BACKEND = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/+$/, "");

let _audioCtx    = null;
let _activeSource = null;
let _cancelled   = false;

export const cancelAllSpeech = () => {
  _cancelled = true;
  if (_activeSource instanceof Audio) {
    _activeSource.pause();
    _activeSource.src = "";
  } else if (_activeSource && typeof _activeSource.stop === "function") {
    try { _activeSource.stop(); } catch (_) {}
  }
  _activeSource = null;
  try { window.speechSynthesis?.cancel(); } catch (_) {}
};

export const speakWithSarvam = async (text, langCode, speaker = "shubh") => {
  if (!BACKEND) return false;
  _cancelled = false;
  try {
    const res = await fetch(`${BACKEND}/api/voice/speak`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, languageCode: langCode, speaker }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[sarvam] TTS failed:", err.error || `HTTP ${res.status}`);
      return false;
    }

    const data = await res.json();
    const audios = data.audios || [];

    for (const base64 of audios) {
      if (_cancelled) break;
      await new Promise((resolve) => {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        if (!_audioCtx) {
          _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        const play = (buf) => {
          if (_cancelled) { resolve(); return; }
          const source = _audioCtx.createBufferSource();
          source.buffer = buf;
          source.connect(_audioCtx.destination);
          source.onended = () => { _activeSource = null; resolve(); };
          _activeSource = source;
          source.start(0);
        };
        const resume = _audioCtx.state === "suspended"
          ? _audioCtx.resume() : Promise.resolve();
        resume
          .then(() => _audioCtx.decodeAudioData(bytes.buffer.slice(0)))
          .then(play)
          .catch(() => {
            const audio = new Audio(`data:audio/wav;base64,${base64}`);
            _activeSource = audio;
            const done = () => { _activeSource = null; resolve(); };
            audio.onended = done; audio.onerror = done;
            audio.play().catch(done);
          });
      });
    }
    return true;
  } catch (e) {
    console.error("[sarvam] TTS error:", e.message);
    _activeSource = null;
    return false;
  }
};

export const speakWithBrowser = (text, langCode) =>
  new Promise((resolve) => {
    if (!window.speechSynthesis) { resolve(); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang  = langCode;
    u.rate  = 0.88;
    u.pitch = 1.05;

    const trySpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const match  = voices.find(v => v.lang === langCode || v.lang.startsWith(langCode.split("-")[0]));
      if (match) u.voice = match;

      const safety = setTimeout(resolve, 12_000);
      u.onend   = () => { clearTimeout(safety); resolve(); };
      u.onerror = () => { clearTimeout(safety); resolve(); };
      window.speechSynthesis.speak(u);
    };

    if (window.speechSynthesis.getVoices().length) {
      trySpeak();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null; trySpeak();
      };
      setTimeout(() => { window.speechSynthesis.onvoiceschanged = null; resolve(); }, 2000);
    }
  });

export const speakText = async (text, langCode, speaker, onStart, onEnd) => {
  cancelAllSpeech();
  _cancelled = false;
  await new Promise(r => setTimeout(r, 80));
  onStart?.();
  const ok = await speakWithSarvam(text, langCode, speaker);
  if (!ok && !_cancelled) await speakWithBrowser(text, langCode);
  onEnd?.();
};
