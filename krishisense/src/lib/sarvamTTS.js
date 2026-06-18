const SARVAM_KEY = import.meta.env.VITE_SARVAM_KEY;

let _activeSource = null; // AudioBufferSourceNode or Audio element
let _audioCtx     = null;
let _cancelled    = false;

// Call synchronously inside a user-gesture handler (button click) to unlock the
// AudioContext so subsequent async audio.play() / source.start() calls are allowed
// by the browser's autoplay policy.
export const unlockAudio = () => {
  if (typeof window === "undefined") return;
  if (!_audioCtx) {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (_audioCtx.state === "suspended") _audioCtx.resume().catch(() => {});
};

export const cancelAllSpeech = () => {
  _cancelled = true;
  if (_activeSource) {
    if (typeof _activeSource.stop === "function") {
      try { _activeSource.stop(); } catch (_) {}
    } else if (_activeSource instanceof Audio) {
      _activeSource.pause();
      _activeSource.src = "";
    }
  }
  _activeSource = null;
  try { window.speechSynthesis?.cancel(); } catch (_) {}
};

const splitIntoChunks = (text, maxLen = 450) => {
  if (text.length <= maxLen) return [text];
  const sentences = text.match(/[^.!?।]+[.!?।]+/g) || [text];
  const chunks = [];
  let current = "";
  for (const s of sentences) {
    if ((current + s).length > maxLen && current) { chunks.push(current.trim()); current = s; }
    else current += s;
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.length ? chunks : [text];
};

export const speakWithSarvam = async (text, langCode, speaker = "shubh") => {
  if (!SARVAM_KEY) return false;
  _cancelled = false;
  try {
    const chunks = splitIntoChunks(text);
    for (const chunk of chunks) {
      if (_cancelled) break;
      const res = await fetch("https://api.sarvam.ai/text-to-speech", {
        method: "POST",
        headers: { "api-subscription-key": SARVAM_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          text: chunk.trim(),
          target_language_code: langCode,
          speaker,
          pace: 0.92,
          speech_sample_rate: 24000,
          model: "bulbul:v3",
        }),
        signal: AbortSignal.timeout(12_000),
      });
      if (!res.ok) throw new Error(`Sarvam ${res.status}`);
      const data = await res.json();
      const base64 = data.audios?.[0];
      if (!base64 || _cancelled) continue;

      // Decode via AudioContext (works in async callbacks after any user interaction;
      // new Audio().play() is blocked by autoplay policy unless called synchronously
      // inside a user gesture — AudioContext + BufferSource has no such restriction).
      await new Promise((resolve) => {
        const binary = atob(base64);
        const bytes  = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

        if (!_audioCtx) {
          _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

        const play = (buf) => {
          if (_cancelled) { resolve(); return; }
          const source = _audioCtx.createBufferSource();
          source.buffer = buf;
          source.connect(_audioCtx.destination);
          source.onended = () => { if (_activeSource === source) _activeSource = null; resolve(); };
          _activeSource = source;
          source.start(0);
        };

        const resume = _audioCtx.state === "suspended" ? _audioCtx.resume() : Promise.resolve();
        resume
          .then(() => _audioCtx.decodeAudioData(bytes.buffer.slice(0)))
          .then(play)
          .catch(() => {
            // AudioContext fallback: try plain Audio element
            const audio = new Audio(`data:audio/wav;base64,${base64}`);
            _activeSource = audio;
            const done = () => { if (_activeSource === audio) _activeSource = null; resolve(); };
            audio.onended = done;
            audio.onerror = done;
            audio.play().catch(done);
          });
      });
    }
    return true;
  } catch (e) {
    console.warn("Sarvam TTS:", e.message);
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

    // Voices might not be loaded yet — wait for them
    const trySpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const match  = voices.find(v => v.lang === langCode || v.lang.startsWith(langCode.split("-")[0]));
      if (match) u.voice = match;

      // Safety timeout: browser TTS sometimes never fires onend
      const safety = setTimeout(resolve, 12_000);
      u.onend   = () => { clearTimeout(safety); resolve(); };
      u.onerror = () => { clearTimeout(safety); resolve(); };
      window.speechSynthesis.speak(u);
    };

    if (window.speechSynthesis.getVoices().length) {
      trySpeak();
    } else {
      window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.onvoiceschanged = null; trySpeak(); };
      // If voices never load, give up after 2s and resolve so the flow continues
      setTimeout(() => { window.speechSynthesis.onvoiceschanged = null; resolve(); }, 2000);
    }
  });

export const speakText = async (text, langCode, speaker, onStart, onEnd) => {
  cancelAllSpeech();
  _cancelled = false;
  // Small pause so audio pipeline clears before new playback
  await new Promise(r => setTimeout(r, 80));
  onStart?.();
  const ok = await speakWithSarvam(text, langCode, speaker);
  if (!ok && !_cancelled) await speakWithBrowser(text, langCode);
  onEnd?.();
};
