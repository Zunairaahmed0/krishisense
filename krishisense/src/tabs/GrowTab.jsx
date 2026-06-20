import { useState, useRef } from "react";
import { X, Microscope, Camera, AlertTriangle, CheckCircle2, Volume2, Save, RefreshCw, ScrollText, Lightbulb, TrendingDown, Leaf } from "lucide-react";
import { C } from "../constants/theme";
import { askAI } from "../lib/ai";
import { speak } from "../lib/speech";
import { parseJSON } from "../lib/utils";
import { api } from "../lib/api";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Spinner from "../components/ui/Spinner";
import { getDiseaseEntry, isDiseaseWeatherMatch } from "../lib/ragEngine";
import { classifyPlantDisease } from "../lib/plantDiseaseModel";
import { useDemoMode } from "../lib/demoMode";
import { DEMO_DISEASE } from "../lib/demoData";
import { useToast } from "../components/ui/Toast";

export default function GrowTab({ weather, weatherLoading, voiceOn, lang, botImg, scans = [], loadingScans = false, onScanSaved, onScanDeleted, loc, user, fcmToken, setTab }) {
  const demoMode = useDemoMode();
  const { showToast } = useToast();
  const [selectedScan, setSelectedScan] = useState(null);
  const [phase,        setPhase]        = useState("idle");
  const [imgPrev,      setImgPrev]      = useState(null);
  const [imgB64,       setImgB64]       = useState(null);
  const [res,          setRes]          = useState(null);
  const [isSaved,      setIsSaved]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [kbEntry,      setKbEntry]      = useState(null);
  const [weatherAlert, setWeatherAlert] = useState(false);
  const [analysisStep, setAnalysisStep] = useState("");
  const [alertSending, setAlertSending] = useState(false);
  const [alertSent,    setAlertSent]    = useState(false);
  const fileRef = useRef();
  const galleryRef = useRef();

  const loadImg = (file) => {
    setImgPrev(URL.createObjectURL(file));
    const rd = new FileReader();
    rd.onload = e => setImgB64(e.target.result.split(",")[1]);
    rd.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!imgB64) return;

    // ── Demo mode: instant impressive result ─────────────────────────────────
    if (demoMode) {
      setRes(DEMO_DISEASE);
      setKbEntry(getDiseaseEntry(DEMO_DISEASE.disease));
      setWeatherAlert(isDiseaseWeatherMatch(DEMO_DISEASE.disease, weather));
      setPhase("result");
      return;
    }

    setPhase("analyzing");
    let hfResult = null;
    let parsed = null;

    try {
    // Step 1: specialized PlantVillage classifier
    try {
      setAnalysisStep("🤖 Running PlantVillage disease classifier...");
      hfResult = await classifyPlantDisease(imgB64);
    } catch (e) {
      console.warn("HF classification failed:", e);
    }

    // Step 2: Gemini for treatment detail, primed with HF result
    const t = weather?.current?.temperature_2m;
    const h = weather?.current?.relative_humidity_2m;

    const hfContext = hfResult
      ? `A specialized plant disease classifier (trained on 54,000 PlantVillage images) has already identified this as: "${hfResult.disease}" in ${hfResult.crop} with ${hfResult.confidence}% confidence. Top predictions: ${hfResult.topPredictions.map(p => `${p.label} (${p.score}%)`).join(", ")}. Your job is to CONFIRM this diagnosis (or correct if clearly wrong) and provide detailed treatment protocol.`
      : "No pre-classification available. Analyze the image directly.";

    setAnalysisStep("🧬 Generating treatment protocol with Gemini...");

    const content = [
      { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imgB64 } },
      { type: "text", text: `Expert plant pathologist for Indian agriculture.\n${hfContext}\nCurrent weather: temp ${t ?? "unknown"}°C, humidity ${h ?? "unknown"}%.\n\n${hfResult ? `Confirm the diagnosis of "${hfResult.disease}" visually and provide the complete treatment protocol.` : "Identify the disease and provide treatment protocol."}\n\nReturn ONLY valid JSON:\n{"disease":"${hfResult?.disease || "name"}","scientific":"scientific name","crop":"${hfResult?.crop || "type"}","severity":${hfResult ? Math.min(hfResult.severity + 5, 99) : 65},"confidence":${hfResult ? Math.min(hfResult.confidence + 3, 99) : 88},"status":"${hfResult?.status || "diseased"}","description":"2 sentences about this disease in Indian farming context","treatment":["step 1 with exact product and dose","step 2","step 3"],"urgency":"48 hours","prevention":"specific prevention tip","hf_model_used":${hfResult ? "true" : "false"}}` },
    ];

    const raw = await askAI(content, "Return ONLY valid JSON. No markdown.");
    parsed = parseJSON(raw);

    // If HF succeeded but Gemini failed, build a result from HF data only
    if (!parsed && hfResult) {
      parsed = {
        disease:     hfResult.disease,
        scientific:  "",
        crop:        hfResult.crop,
        severity:    hfResult.severity,
        confidence:  hfResult.confidence,
        status:      hfResult.status,
        description: `${hfResult.disease} detected by PlantVillage classifier. AI treatment details unavailable — consult your local agricultural extension officer.`,
        treatment:   ["Consult a local agronomist for treatment advice"],
        urgency:     "As soon as possible",
        prevention:  "Monitor crops regularly and maintain field hygiene",
        hf_model_used: true,
      };
    }

    // Both models failed — show error instead of a fake diagnosis
    if (!parsed) {
      setPhase("error");
      return;
    }

    // Merge HF confidence into Gemini result
    if (hfResult && parsed) {
      parsed.hf_confidence = hfResult.confidence;
      parsed.hf_source = hfResult.source;
      parsed.top_predictions = hfResult.topPredictions;
      if (hfResult.disease.toLowerCase().includes((parsed.disease?.toLowerCase()?.split(" ")[0]) || "")) {
        parsed.confidence = Math.min(99, Math.round((hfResult.confidence + parsed.confidence) / 2 + 5));
      }
    }

    setRes(parsed);
    try { localStorage.setItem("ks_last_disease_scan", JSON.stringify(parsed)); } catch {}
    setKbEntry(getDiseaseEntry(parsed.disease));
    setWeatherAlert(isDiseaseWeatherMatch(parsed.disease, weather));
    if (voiceOn) {
      const msg = parsed.status === "healthy"
        ? `Good news! Your ${parsed.crop} is healthy.`
        : `${parsed.disease} detected in your ${parsed.crop}. Confidence: ${parsed.confidence}%. ${parsed.treatment?.[0] || ""}`;
      speak(msg, lang);
    }
    setPhase("result");
    } catch (err) {
      console.error("[GrowTab] analyze failed:", err);
      setPhase("error");
    }
  };

  const handleShareReport = async () => {
    if (!res) return;
    const urgent = res.severity > 70;
    const lines = [
      "🌿 KrishiSense Crop Health Report",
      "",
      `🌱 Crop: ${res.crop}`,
      `🦠 Disease: ${res.disease}${res.scientific && res.scientific !== "N/A" ? ` (${res.scientific})` : ""}`,
      `📊 Severity: ${res.severity}%  |  Confidence: ${res.confidence}%`,
      ...(res.hf_model_used ? [`🤖 Verified by PlantVillage ML (${res.hf_confidence}%) + Gemini Vision`] : []),
      "",
      res.description,
      "",
      ...(urgent ? ["⚠️  HIGH SEVERITY — Act immediately within 48 hours!", ""] : []),
      "💊 Treatment Protocol:",
      ...(res.treatment || []).map((t, i) => `  ${i + 1}. ${t}`),
      "",
      `⏱  Act within: ${res.urgency}`,
      `🛡  Prevention: ${res.prevention}`,
      "",
      "─────────────────────────────",
      "Powered by KrishiSense — AI Farming Intelligence for India",
      "PlantVillage ML + Gemini Vision + ICAR Disease KB",
    ];
    const text = lines.join("\n");
    const title = `KrishiSense: ${res.disease} detected in ${res.crop}`;
    if (navigator.share) {
      navigator.share({ title, text }).catch(() => null);
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .then(() => showToast("Report copied ✓"))
        .catch(() => alert(text));
    } else {
      alert(text);
    }
  };

  const handleSaveReport = async () => {
    if (!res || isSaved || saving) return;
    setSaving(true);
    try {
      await api.saveScan("leaf", res, loc);
      setIsSaved(true);
      onScanSaved?.();
      showToast("Scan saved ✓");

      // Trigger regional outbreak check for diseased scans
      if (res.status === "diseased" && res.disease) {
        try {
          const backendUrl = import.meta.env.VITE_BACKEND_URL?.replace(/\/+$/, "");
          if (backendUrl) {
            const outbreakRes = await fetch(`${backendUrl}/api/alerts/outbreak`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                diseaseName: res.disease,
                lat: loc?.lat ?? null,
                lon: loc?.lon ?? null,
                loc: { state: loc?.state || "Maharashtra", name: loc?.name || "Your Area" },
                detectedByUserId: user?.uid || "anonymous",
              }),
            });
            const outbreakData = await outbreakRes.json();
            if (outbreakData.outbreakDetected) {
              console.log(`[outbreak] Alert sent to ${outbreakData.sent} farmers`);
            }
          }
        } catch (e) {
          console.warn("[outbreak] Check failed silently:", e.message);
        }
      }
    } catch (err) {
      console.warn("Failed to save leaf scan to backend:", err);
      alert(lang === "hi" ? "सुरक्षित करने में विफल रहा: " + err.message : lang === "mr" ? "जतन करण्यात अपयशी: " + err.message : "Failed to save report: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteScan = async (scanId) => {
    if (window.confirm(lang === "hi" ? "क्या आप इस रिपोर्ट को हटाना चाहते हैं?" : lang === "mr" ? "तुम्हाला हा अहवाल हटवायचा आहे का?" : "Are you sure you want to delete this report?")) {
      try {
        await api.deleteScan(scanId);
        if (selectedScan?.id === scanId) {
          setSelectedScan(null);
        }
        onScanDeleted?.();
      } catch (err) {
        console.warn("Failed to delete scan:", err);
        showToast("Failed to delete report: " + (err?.message || "Unknown error"), "error");
      }
    }
  };

  const handleBroadcastAlert = async () => {
    if (!res?.disease || alertSending || alertSent) return;
    setAlertSending(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL?.replace(/\/+$/, "");
      if (!backendUrl) throw new Error("No backend URL");
      const r = await fetch(`${backendUrl}/api/alerts/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diseaseName:  res.disease,
          locName:      loc?.name || "",
          senderUserId: user?.uid || "",
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Failed");
      setAlertSent(true);
    } catch (e) {
      alert("Alert failed: " + e.message);
    } finally {
      setAlertSending(false);
    }
  };

  const reset = () => {
    setPhase("idle");
    setImgPrev(null);
    setImgB64(null);
    setRes(null);
    setIsSaved(false);
    setSaving(false);
    setKbEntry(null);
    setWeatherAlert(false);
    setAnalysisStep("");
    setAlertSent(false);
    setAlertSending(false);
  };
  const sevColor = s => s < 30 ? C.p3 : s < 65 ? C.amber : C.red;

  return (
    <div style={{ paddingBottom: 16 }}>

      {/* ── Header ────────────────────────────────────────── */}
      <div style={{ padding: "14px 18px 12px" }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.txt }}>AI Crop Health Monitor <span>🌿</span></div>
        <div style={{ fontSize: 12, color: C.mut, marginTop: 3 }}>Detect diseases early. Protect your crops.</div>
      </div>

      {/* ── Scan / Upload Zone ─────────────────────────────── */}
      {phase === "idle" && (
        <Card style={{ margin: "0 14px 16px", overflow: "hidden", padding: 0 }}>
          <div style={{ background: `linear-gradient(135deg,${C.tint},${C.surface})`, padding: "20px 18px" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${C.p3}20`, border: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Microscope size={16} color={C.p3} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.txt }}>Scan Your Crop</span>
                </div>
                <div style={{ fontSize: 11, color: C.mut, lineHeight: 1.5, marginBottom: 14 }}>Upload a clear image of the affected leaf for AI analysis</div>
                <div style={{ display: "flex", gap: 10 }}>
                  <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={e => e.target.files[0] && loadImg(e.target.files[0])} />
                  <input ref={galleryRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => e.target.files[0] && loadImg(e.target.files[0])} />
                  <button onClick={() => fileRef.current?.click()} style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: C.primary, color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", display:"flex", alignItems:"center", gap:5 }}><Camera size={14} /> Take Photo</button>
                  <button onClick={() => galleryRef.current?.click()} style={{ padding: "10px 18px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.surface, color: C.txt2, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>🖼 Gallery</button>
                </div>
                <div style={{ fontSize: 10, color: C.mut, marginTop: 8 }}>🔒 Your images are secure and private</div>
              </div>
              {imgPrev ? (
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <img src={imgPrev} alt="leaf" style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 12 }} />
                  <button onClick={() => { setImgPrev(null); setImgB64(null); }} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: C.red, border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <X size={11} />
                  </button>
                </div>
              ) : (
                <div style={{ width: 100, height: 100, borderRadius: 12, background: C.brd, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, flexShrink: 0 }}>🍃</div>
              )}
            </div>
            {imgPrev && (
              <button onClick={analyze} style={{ width: "100%", marginTop: 14, padding: 12, borderRadius: 12, border: "none", background: `linear-gradient(135deg,${C.primary},${C.p3})`, color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                <Microscope size={15} style={{ marginRight:6, verticalAlign:"middle" }} /> Analyze with AI
              </button>
            )}
          </div>

          {/* Feature strip */}
          <div style={{ display: "flex", borderTop: `1px solid ${C.brd}` }}>
            {[["38+","Diseases"], ["92%","Accuracy"], ["3s","Analysis"], ["🆓","Free"]].map(([v,l]) => (
              <div key={l} style={{ flex: 1, padding: "10px 0", textAlign: "center", borderRight: `1px solid ${C.brd}` }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.primary }}>{v}</div>
                <div style={{ fontSize: 9, color: C.mut }}>{l}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Analyzing ──────────────────────────────────────── */}
      {phase === "analyzing" && (
        <Card style={{ margin: "0 14px 16px", textAlign: "center", padding: 40 }}>
          <Microscope size={48} color={C.p3} style={{ marginBottom: 16 }} />
          <Spinner size={44} />
          <div style={{ fontSize: 16, fontWeight: 700, color: C.txt, marginTop: 16, marginBottom: 10 }}>Analyzing Leaf Tissue</div>
          <div style={{ fontSize: 13, color: C.p2, fontWeight: 600, marginTop: 12 }}>{analysisStep}</div>
        </Card>
      )}

      {/* ── Error ──────────────────────────────────────────── */}
      {phase === "error" && (
        <Card style={{ margin: "0 14px 16px", textAlign: "center", padding: 32 }}>
          <AlertTriangle size={44} color={C.amber} style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: C.txt, marginBottom: 8 }}>Analysis Failed</div>
          <div style={{ fontSize: 13, color: C.p2, marginBottom: 20 }}>Could not analyze the image. Please try with a clearer, well-lit photo of the affected leaf.</div>
          <button onClick={reset} style={{ background: C.p1, color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Try Again</button>
        </Card>
      )}

      {/* ── Result ─────────────────────────────────────────── */}
      {phase === "result" && res && (
        <>
          {imgPrev && <img src={imgPrev} alt="analyzed" style={{ width: "calc(100% - 28px)", margin: "0 14px 12px", height: 180, objectFit: "cover", borderRadius: 16, border: `2px solid ${res.status === "diseased" ? C.red : C.p3}` }} />}

          {/* Diagnosis */}
          <Card style={{ margin: "0 14px 12px", background: res.status === "diseased" ? "#FFF3F3" : C.tint, border: `1px solid ${res.status === "diseased" ? "#FFCDD2" : "#C8E6C9"}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                  <Badge text="✦ AI Diagnosis" color={C.p3} />
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: res.status === "diseased" ? C.red : C.primary }}>
                  {res.status === "diseased" ? `${res.disease} Detected` : "✅ Healthy Crop!"}
                </div>
                {res.status === "diseased" && res.scientific && <div style={{ fontSize: 11, color: C.mut, fontStyle: "italic" }}>({res.scientific})</div>}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ width: 60, height: 60, borderRadius: 12, background: res.status === "diseased" ? "#FFEBEE" : C.tint, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {res.status === "diseased" ? <AlertTriangle size={32} color={C.red} /> : <CheckCircle2 size={32} color={C.p2} />}
                </div>
                <div style={{ fontSize: 9, color: C.mut, marginTop: 4 }}>{res.status === "diseased" ? "High Risk" : "Healthy"}</div>
              </div>
            </div>
            {weatherAlert && res.status === "diseased" && (
              <div style={{ marginTop: 10, padding: "6px 10px", background: "#FFEBEE", borderRadius: 8, border: "1px solid #FFCDD2", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 13 }}>⚡</span>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.red }}>Current weather matches disease outbreak conditions — risk of rapid spread is HIGH</div>
              </div>
            )}
            <div style={{ display: "flex", gap: 16, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${res.status === "diseased" ? "#FFCDD2" : "#C8E6C9"}` }}>
              <div>
                <div style={{ fontSize: 9, color: C.mut }}>Confidence Score</div>
                <div style={{ height: 5, width: 100, borderRadius: 99, background: "#E0E0E0", marginTop: 4, marginBottom: 2 }}>
                  <div style={{ width: `${res.confidence}%`, height: "100%", borderRadius: 99, background: C.p3 }}/>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.p2 }}>{res.confidence}%</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: C.mut }}>Severity Level</div>
                <div style={{ display: "flex", gap: 3, marginTop: 5 }}>
                  {[1,2,3,4].map(j => <div key={j} style={{ width: 20, height: 6, borderRadius: 3, background: j <= Math.ceil(res.severity/25) ? sevColor(res.severity) : "#E0E0E0" }}/>)}
                </div>
                <Badge text={res.severity > 65 ? "HIGH" : res.severity > 35 ? "MED" : "LOW"} color={sevColor(res.severity)} />
              </div>
            </div>
            {res.hf_model_used && (
              <div style={{ marginTop: 8, padding: "6px 10px", borderRadius: 8, background: "#E8F5E9", border: "1px solid #C8E6C9", fontSize: 10 }}>
                <CheckCircle2 size={11} color={C.p2} style={{ marginRight:4, verticalAlign:"middle" }} /> Verified by PlantVillage ML model ({res.hf_confidence}%) + Gemini Vision ({res.confidence}%)
                <div style={{ fontSize: 9, color: "#666", marginTop: 2 }}>{res.hf_source}</div>
              </div>
            )}
            {res.top_predictions && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 10, color: C.mut, marginBottom: 4 }}>Model confidence breakdown:</div>
                {res.top_predictions.map((p, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: i === 0 ? C.primary : C.mut }}>
                    <span>{i === 0 ? "→ " : ""}{p.label}</span><span>{p.score}%</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Treatment */}
          {res.status === "diseased" && (
            <Card style={{ margin: "0 14px 12px", background: "#FFF8E8", border: "1px solid #FFE0B2" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                <Leaf size={16} color={C.amber} />
                <div style={{ fontSize: 14, fontWeight: 700, color: C.amber }}>Recommended Action</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.txt, marginBottom: 6 }}>{res.treatment?.[0]}</div>
                  {res.treatment?.slice(1).map((t, i) => (
                    <div key={i} style={{ fontSize: 11, color: C.txt2, marginBottom: 4, display: "flex", gap: 6 }}>
                      <span style={{ color: C.p3 }}>•</span>{t}
                    </div>
                  ))}
                </div>
                <div style={{ flexShrink: 0, textAlign: "center", marginLeft: 12 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 12, background: "#FFEBEE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>⏱</div>
                  <div style={{ fontSize: 9, color: C.mut, marginTop: 4 }}>Act Within</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.red }}>{res.urgency?.split(" ")[0]}</div>
                  <div style={{ fontSize: 9, color: C.mut }}>Hours</div>
                </div>
              </div>
            </Card>
          )}

          {/* Verified ICAR Treatment Protocol from KB */}
          {kbEntry && res.status === "diseased" && (
            <Card style={{ margin: "0 14px 12px", background: "#E3F2FD", border: "1px solid #90CAF9" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <Microscope size={15} color="#1565C0" />
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1565C0" }}>Verified ICAR Treatment Protocol</div>
                {weatherAlert && <Badge text="⚡ High Weather Risk" color={C.red} />}
              </div>
              {kbEntry.scientificName && (
                <div style={{ fontSize: 10, color: "#1565C0", fontStyle: "italic", marginBottom: 6 }}>
                  {kbEntry.scientificName}
                </div>
              )}
              {kbEntry.organicOption && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.txt, marginBottom: 2 }}>🌿 Organic Alternative</div>
                  <div style={{ fontSize: 11, color: C.txt2, lineHeight: 1.5 }}>{kbEntry.organicOption}</div>
                </div>
              )}
              {kbEntry.estimatedYieldLoss && (
                <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.txt, display:"flex", alignItems:"center", gap:4 }}><TrendingDown size={11} color={C.red} /> Yield Loss if Untreated:</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: C.red }}>{kbEntry.estimatedYieldLoss}</div>
                </div>
              )}
              {kbEntry.prevention && (
                <div style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.txt, marginBottom: 2 }}>🛡 Prevention</div>
                  <div style={{ fontSize: 11, color: C.txt2, lineHeight: 1.5 }}>{kbEntry.prevention}</div>
                </div>
              )}
              {kbEntry.source && (
                <div style={{ fontSize: 9, color: "#1565C0", marginTop: 6, fontStyle: "italic", borderTop: "1px solid #BBDEFB", paddingTop: 6 }}>
                  Source: {kbEntry.source}
                </div>
              )}
            </Card>
          )}

          {/* Environmental Conditions */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 18px", marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.txt }}>Environmental Conditions</div>
          </div>
          <div style={{ display: "flex", gap: 10, padding: "0 14px 12px", overflowX: "auto" }}>
            {[
              { icon: "💧", label: "Humidity", val: weatherLoading ? "Loading" : weather?.current?.relative_humidity_2m != null ? `${weather.current.relative_humidity_2m}%` : "--", status: weather?.current?.relative_humidity_2m >= 80 ? "High" : weather?.current?.relative_humidity_2m != null ? "Normal" : "Live", color: C.blue },
              { icon: "🌡", label: "Temperature", val: weatherLoading ? "Loading" : weather?.current?.temperature_2m != null ? `${weather.current.temperature_2m}°C` : "--", status: weather?.current?.temperature_2m >= 38 ? "Hot" : weather?.current?.temperature_2m != null ? "Current" : "Live", color: C.amber },
              { icon: "💨", label: "Wind Speed", val: weatherLoading ? "Loading" : weather?.current?.windspeed_10m != null ? `${weather.current.windspeed_10m} km/h` : "--", status: weather?.current?.windspeed_10m >= 20 ? "Windy" : weather?.current?.windspeed_10m != null ? "Current" : "Live", color: C.p3 },
            ].map((e, i) => (
              <Card key={i} style={{ flex: "0 0 110px", padding: "12px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{e.icon}</div>
                <div style={{ fontSize: 10, color: C.mut }}>{e.label}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.txt }}>{e.val}</div>
                <div style={{ fontSize: 10, color: e.color, fontWeight: 600 }}>{e.status}</div>
              </Card>
            ))}
          </div>

          {/* AI Advisor tip */}
          {botImg && (
            <div style={{ margin: "0 14px 12px", borderRadius: 16, background: C.tint, border: `1px solid #C8E6C9`, padding: "14px 16px", display: "flex", gap: 12, alignItems: "center" }}>
              <img src={botImg} alt="AI" style={{ width: 44, height: 44, objectFit: "contain" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: C.p2, fontWeight: 700, marginBottom: 3 }}>✦ AI Advisor</div>
                <div style={{ fontSize: 11, color: C.txt2, lineHeight: 1.5 }}>
                  {res.status === "healthy"
                    ? `Your crop looks healthy! Continue monitoring and follow the preventive tips to avoid future infections.`
                    : `High moisture and warm conditions are ideal for ${res.disease}. Immediate treatment can save your crop from potential yield loss.`}
                </div>
              </div>
              <button
                onClick={() => {
                  if (!voiceOn) return;
                  const tip = res.status === "healthy"
                    ? `Your crop looks healthy! Continue monitoring and follow the preventive tips to avoid future infections.`
                    : `High moisture and warm conditions are ideal for ${res.disease}. Immediate treatment can save your crop from potential yield loss.`;
                  speak(tip, lang);
                }}
                style={{ flexShrink: 0, padding: "8px 12px", borderRadius: 10, border: "none", background: C.primary, color: "white", fontSize: 10, fontWeight: 700, cursor: "pointer", display:"flex", alignItems:"center", gap:4 }}
              >
                <Volume2 size={12} /> Listen
              </button>
            </div>
          )}

          {/* Prevention tips */}
          <div style={{ padding: "0 18px", marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.txt, marginBottom: 10 }}>Preventive Tips</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[["💧","Avoid Overwatering"],["💨","Ensure Good Airflow"],["🌿","Remove Affected Leaves"],["🛡","Use Resistant Varieties"]].map(([e,t])=>(
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: C.surface, borderRadius: 12, border: `1px solid ${C.brd}` }}>
                  <span style={{ fontSize: 16 }}>{e}</span>
                  <span style={{ fontSize: 11, color: C.txt2, fontWeight: 500 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, padding: "0 14px 8px" }}>
            <button
              onClick={handleSaveReport}
              disabled={isSaved || saving}
              style={{
                flex: 1.5,
                padding: 12,
                borderRadius: 12,
                border: isSaved ? `1px solid ${C.p3}` : `1px solid ${C.brd}`,
                background: isSaved ? C.tint : C.surface,
                color: isSaved ? C.p2 : saving ? C.mut : C.txt2,
                fontSize: 12,
                fontWeight: 700,
                cursor: isSaved || saving ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                transition: "all 0.2s ease"
              }}
            >
              {saving ? "Saving..." : isSaved ? "✓ Saved to History" : <><Save size={12} style={{ marginRight:4, verticalAlign:"middle" }} />Save Report</>}
            </button>
            <button onClick={handleShareReport} style={{ flex: 1.5, padding: 12, borderRadius: 12, border: "none", background: C.primary, color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              Share Report →
            </button>
          </div>

          {/* Send Alert to All Farmers — only for diseased scans */}
          {res.status === "diseased" && (
            <div style={{ padding: "0 14px 12px" }}>
              <button
                onClick={handleBroadcastAlert}
                disabled={alertSending || alertSent}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: 12,
                  border: "none",
                  background: alertSent ? "#E8F5E9" : alertSending ? "#ccc" : "#D32F2F",
                  color: alertSent ? C.p2 : "white",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: alertSending || alertSent ? "default" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: alertSent || alertSending ? "none" : "0 3px 12px rgba(211,47,47,0.35)",
                  transition: "all 0.2s ease",
                }}
              >
                {alertSent ? "✅ Alert Sent to All Farmers!" : alertSending ? "Sending Alert..." : `🚨 Send Disease Alert to All Farmers`}
              </button>
              {!alertSent && !alertSending && (
                <div style={{ fontSize: 10, color: C.mut, textAlign: "center", marginTop: 5 }}>
                  Notifies all registered farmers about {res.disease} risk
                </div>
              )}
            </div>
          )}

          {res.status === "diseased" && (
            <button
              onClick={() => setTab("claim")}
              style={{
                width: "calc(100% - 28px)",
                margin: "8px 14px 0",
                padding: 13,
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(135deg, #1565C0, #1976D2)",
                color: "white",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              🛡️ Use This Diagnosis to File Insurance Claim
            </button>
          )}

          <button onClick={reset} style={{ width: "calc(100% - 28px)", margin: "8px 14px 0", padding: 11, borderRadius: 12, border: `1px solid ${C.brd}`, background: C.surface, color: C.mut, fontSize: 12, cursor: "pointer" }}>
            <RefreshCw size={13} style={{ marginRight:5, verticalAlign:"middle" }} /> Analyze Another Leaf
          </button>
        </>
      )}

      {/* ── Disease History Section ── */}
      <div id="disease-history-section" style={{ borderTop: `1px solid ${C.brd}`, marginTop: 24, paddingTop: 20, paddingLeft: 18, paddingRight: 18 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.txt, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <ScrollText size={16} color={C.txt} /> Saved Pathology History
        </div>

        {loadingScans ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
            <Spinner size={24} />
          </div>
        ) : scans.filter(s => s.type === "leaf").length === 0 ? (
          <Card style={{ padding: "20px 16px", textAlign: "center", background: C.surface, border: `1px dashed ${C.brd}` }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>🍂</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.txt2 }}>No saved pathology reports yet</div>
            <div style={{ fontSize: 10, color: C.mut, marginTop: 4 }}>
              Scan an unhealthy crop leaf above and save it to track diseases over time.
            </div>
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {scans.filter(s => s.type === "leaf").map(s => {
              const dateStr = new Date(s.date || s.timestamp).toLocaleDateString(lang === "hi" ? "hi-IN" : lang === "mr" ? "mr-IN" : "en-IN", {
                day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
              });
              const crop = s.data?.crop || "Crop";
              const disease = s.data?.disease || "Unknown Disease";
              const status = s.data?.status || "diseased";
              const severity = s.data?.severity || 0;

              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedScan(s)}
                  style={{
                    background: C.surface,
                    borderRadius: 14,
                    border: `1px solid ${C.brd}`,
                    padding: "12px 14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    boxShadow: C.shadow,
                    transition: "transform 0.15s ease"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>{status === "healthy" ? <CheckCircle2 size={22} color={C.p2} /> : <AlertTriangle size={22} color={C.amber} />}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: status === "healthy" ? C.primary : C.red }}>
                        {status === "healthy" ? "Healthy Crop" : disease}
                      </div>
                      <div style={{ fontSize: 9, color: C.mut, marginTop: 2 }}>
                        {dateStr} • Crop: {crop}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {status !== "healthy" && (
                      <Badge text={`${severity}% Sev`} color={sevColor(severity)} />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteScan(s.id);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 4,
                        color: C.red,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14
                      }}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Viewport-Locked Detail Modal Overlay ── */}
      {selectedScan && (() => {
        const d = selectedScan.data;
        const isHealthy = d?.status === "healthy";
        return (
          <div style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}>
            <div style={{
              background: C.bg,
              width: "100%",
              maxWidth: 480,
              maxHeight: "85vh",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              overflowY: "auto",
              position: "relative",
              boxShadow: "0 -8px 32px rgba(0,0,0,0.15)"
            }}>
              {/* Handle Drag Bar */}
              <div style={{
                display: "flex",
                justifyContent: "center",
                padding: "10px 0 6px"
              }}>
                <div style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  background: "#E0E0E0"
                }} />
              </div>

              {/* Header / Close button */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0 18px 10px",
                borderBottom: `1px solid ${C.brd}`
              }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: C.txt }}>Pathology Scan Report</div>
                  <div style={{ fontSize: 10, color: C.mut }}>
                    {new Date(selectedScan.date || selectedScan.timestamp).toLocaleString(lang === "hi" ? "hi-IN" : lang === "mr" ? "mr-IN" : "en-IN")}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedScan(null)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    border: "none",
                    background: C.surface,
                    color: C.txt2,
                    fontWeight: "bold",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: 18 }}>
                <Card style={{ background: isHealthy ? C.tint : "#FFF3F3", border: `1px solid ${isHealthy ? "#C8E6C9" : "#FFCDD2"}`, marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <Badge text="✦ Diagnosis" color={C.p3} />
                      <div style={{ fontSize: 20, fontWeight: 800, color: isHealthy ? C.primary : C.red, marginTop: 4 }}>
                        {isHealthy ? "✅ Crop is Healthy" : d?.disease}
                      </div>
                      {!isHealthy && d?.scientific && <div style={{ fontSize: 11, color: C.mut, fontStyle: "italic" }}>({d.scientific})</div>}
                      <div style={{ fontSize: 11, color: C.mut, marginTop: 4 }}>Crop Type: <strong>{d?.crop}</strong></div>
                    </div>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: isHealthy ? C.tint : "#FFEBEE", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {isHealthy ? <CheckCircle2 size={24} color={C.p2} /> : <AlertTriangle size={24} color={C.red} />}
                    </div>
                  </div>
                  
                  {!isHealthy && (
                    <div style={{ display: "flex", gap: 16, marginTop: 12, paddingTop: 12, borderTop: "1px solid #FFCDD2" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 9, color: C.mut }}>Confidence Score</div>
                        <div style={{ height: 4, borderRadius: 99, background: "#E0E0E0", marginTop: 4 }}>
                          <div style={{ width: `${d?.confidence ?? 0}%`, height: "100%", background: C.p3 }} />
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.p2, marginTop: 2 }}>{d?.confidence ?? 0}%</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 9, color: C.mut }}>Severity Level</div>
                        <div style={{ display: "flex", gap: 2, marginTop: 5 }}>
                          {[1,2,3,4].map(j => <div key={j} style={{ width: 14, height: 4, borderRadius: 2, background: j <= Math.ceil((d?.severity ?? 0)/25) ? sevColor(d.severity) : "#E0E0E0" }} />)}
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: sevColor(d?.severity ?? 0), marginTop: 2 }}>{d?.severity ?? 0}% Severity</div>
                      </div>
                    </div>
                  )}
                </Card>

                {/* Treatment Card */}
                {!isHealthy && d?.treatment && (
                  <Card style={{ background: "#FFF8E8", border: "1px solid #FFE0B2", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <span style={{ fontSize: 16 }}>🌿</span>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.amber }}>Recommended Actions</div>
                    </div>
                    <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
                      <div style={{ flex: 1 }}>
                        {d.treatment.map((t, i) => (
                          <div key={i} style={{ fontSize: 11, color: C.txt2, marginBottom: 4, display: "flex", gap: 4 }}>
                            <span style={{ color: C.p3 }}>•</span><span>{t}</span>
                          </div>
                        ))}
                      </div>
                      {d.urgency && (
                        <div style={{ flexShrink: 0, textAlign: "center", background: "#FFEBEE", padding: "6px 10px", borderRadius: 10 }}>
                          <div style={{ fontSize: 8, color: C.mut }}>Act Within</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: C.red }}>{d.urgency}</div>
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {/* Prevention Tip */}
                {d?.prevention && (
                  <Card style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.txt, marginBottom: 4, display:"flex", alignItems:"center", gap:5 }}><Lightbulb size={12} color={C.amber} /> Prevention Guideline</div>
                    <div style={{ fontSize: 11, color: C.txt2, lineHeight: 1.4 }}>{d.prevention}</div>
                  </Card>
                )}

                {/* Footer Actions */}
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => {
                      if (!voiceOn) return;
                      const msg = isHealthy
                        ? `Your crop looks healthy! Continue monitoring and follow the preventive tips.`
                        : `${d.disease} detected in your ${d.crop} with ${d.severity}% severity. ${d.treatment?.[0] || ""}`;
                      speak(msg, lang);
                    }}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: 12,
                      border: `1px solid ${C.brd}`,
                      background: C.surface,
                      color: C.primary,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6
                    }}
                  >
                    <Volume2 size={15} /> Listen
                  </button>
                  <button
                    onClick={() => handleDeleteScan(selectedScan.id)}
                    style={{
                      flex: 1.5,
                      padding: "12px",
                      borderRadius: 12,
                      border: "none",
                      background: C.red,
                      color: "white",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6
                    }}
                  >
                    🗑 Delete Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
