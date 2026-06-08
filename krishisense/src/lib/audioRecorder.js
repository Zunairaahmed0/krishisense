const getSupportedMimeType = () => {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];
  return candidates.find(t => MediaRecorder.isTypeSupported(t)) || "";
};

export class AudioRecorder {
  constructor({ silenceMs = 1800, silenceThreshold = 0.012 } = {}) {
    this.silenceMs        = silenceMs;
    this.silenceThreshold = silenceThreshold;
    this.mediaRecorder    = null;
    this.audioContext     = null;
    this.analyser         = null;
    this.chunks           = [];
    this.silenceTimer     = null;
    this.isRecording      = false;
    this._rafId           = null;
  }

  // Returns Promise<Blob> that resolves when silence auto-stops recording.
  // External code just does: const blob = await recorder.start()
  async start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.audioContext = new AudioContext();
    const source = this.audioContext.createMediaStreamSource(stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 512;
    source.connect(this.analyser);

    this.chunks = [];
    this.isRecording = true;

    const mimeType = getSupportedMimeType();
    this.mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };

    return new Promise((resolve) => {
      this.mediaRecorder.onstop = () => {
        const type = this.mediaRecorder.mimeType || "audio/webm";
        const blob = new Blob(this.chunks, { type });
        this.chunks = [];
        this._cleanup();
        resolve(blob);
      };

      this.mediaRecorder.start(100);

      // 600 ms grace period — RMS is 0 at startup, let it settle before checking silence
      setTimeout(() => {
        if (this.isRecording) this._checkSilence();
      }, 600);
    });
  }

  _checkSilence() {
    if (!this.isRecording) return;
    const buf = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(buf);
    const rms = Math.sqrt(buf.reduce((s, v) => s + v * v, 0) / buf.length);

    if (rms < this.silenceThreshold) {
      if (!this.silenceTimer) {
        this.silenceTimer = setTimeout(() => {
          if (this.isRecording) this.stop();
        }, this.silenceMs);
      }
    } else {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    this._rafId = requestAnimationFrame(() => this._checkSilence());
  }

  // Can be called externally (cleanup / user presses stop) — triggers onstop → resolves start() Promise
  stop() {
    if (!this.isRecording) return;
    this.isRecording = false;
    clearTimeout(this.silenceTimer);
    this.silenceTimer = null;
    if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop(); // fires onstop → resolves the Promise from start()
    } else {
      this._cleanup();
    }
  }

  _cleanup() {
    this.audioContext?.close().catch(() => {});
    this.mediaRecorder?.stream?.getTracks().forEach(t => t.stop());
  }

  getLevel() {
    if (!this.analyser || !this.isRecording) return 0;
    const buf = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(buf);
    const rms = Math.sqrt(buf.reduce((s, v) => s + v * v, 0) / buf.length);
    return Math.min(1, rms * 20);
  }
}
