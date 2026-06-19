import { useState, useRef, useEffect } from "react";
import {
  ShieldCheck, AlertTriangle, CheckCircle2, Camera,
  ClipboardList, Share2, Save, ArrowLeft, ArrowRight,
  Paperclip, MapPin, User, X, Info, Bug, BarChart2
} from "lucide-react";
import { C } from "../constants/theme";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { useToast } from "../components/ui/Toast";
import { api } from "../lib/api";

const STEP_LABELS = ["Farm Info", "Damage", "Financial", "Documents", "Report"];

const inputStyle = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: 10,
  border: `1.5px solid ${C.brd}`,
  background: C.surface,
  fontSize: 13,
  color: C.txt,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

function ProgressBar({ step }) {
  return (
    <div style={{ padding: "16px 12px 4px" }}>
      <div style={{ display: "flex", alignItems: "flex-start" }}>
        {STEP_LABELS.map((label, i) => {
          const s = i + 1;
          const done = step > s;
          const active = step === s;
          return (
            <div
              key={s}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}
            >
              {s > 1 && (
                <div style={{
                  position: "absolute", top: 13, left: 0, right: "50%",
                  height: 2, background: step >= s ? C.p3 : C.brd,
                }} />
              )}
              {s < 5 && (
                <div style={{
                  position: "absolute", top: 13, left: "50%", right: 0,
                  height: 2, background: step > s ? C.p3 : C.brd,
                }} />
              )}
              <div style={{
                width: 28, height: 28, borderRadius: "50%", position: "relative", zIndex: 1,
                background: done ? C.p3 : active ? C.primary : C.surface,
                border: (!done && !active) ? `2px solid ${C.brd}` : "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: done || active ? "white" : C.mut,
                fontSize: 11, fontWeight: 800,
                boxShadow: active ? `0 2px 8px rgba(18,60,44,0.28)` : "none",
                transition: "all 0.2s ease",
              }}>
                {done ? "✓" : s}
              </div>
              <div style={{
                fontSize: 8, marginTop: 4, textAlign: "center",
                color: active ? C.primary : done ? C.p3 : C.mut,
                fontWeight: active ? 700 : 500,
              }}>
                {label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NavRow({ onBack, onNext, nextLabel = "Next", nextDisabled = false }) {
  return (
    <div style={{ display: "flex", gap: 10, padding: "16px 16px 8px" }}>
      <button
        onClick={onBack}
        style={{
          flex: 1, padding: "13px 0", borderRadius: 12,
          border: `1.5px solid ${C.brd}`, background: C.surface,
          color: C.txt2, fontSize: 13, fontWeight: 700, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}
      >
        <ArrowLeft size={15} /> Back
      </button>
      {onNext && (
        <button
          onClick={onNext}
          disabled={nextDisabled}
          style={{
            flex: 2, padding: "13px 0", borderRadius: 12, border: "none",
            background: nextDisabled ? C.mut : C.primary,
            color: "white", fontSize: 13, fontWeight: 700,
            cursor: nextDisabled ? "default" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            transition: "all 0.2s ease",
          }}
        >
          {nextLabel} <ArrowRight size={15} />
        </button>
      )}
    </div>
  );
}

export default function ClaimTab({ user, loc, scans, lang, setTab }) {
  const { showToast } = useToast();
  const photoRef = useRef();
  const refNumRef = useRef(`KS-${Date.now().toString(36).toUpperCase()}`);
  const refNum = refNumRef.current;

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [reportText, setReportText] = useState("");

  // Step 1 – Farm Info
  const [khasra, setKhasra] = useState("");
  const [insuredAcres, setInsuredAcres] = useState("");
  const [sowingDate, setSowingDate] = useState("");
  const [harvestDate, setHarvestDate] = useState("");
  const [yieldPerAcre, setYieldPerAcre] = useState("500");

  // Step 2 – Damage
  const [damageDate, setDamageDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [intimationDate, setIntimationDate] = useState(() => {
    const d = new Date(); d.setHours(d.getHours() + 1);
    return d.toISOString().slice(0, 16);
  });
  const [damagePct, setDamagePct] = useState(30);
  const [damagePhotoB64, setDamagePhotoB64] = useState(null);
  const [damagePhotoPreview, setDamagePhotoPreview] = useState(null);

  // Step 3 – Financial
  const [marketPrice, setMarketPrice] = useState(() => {
    try {
      const stored = localStorage.getItem("ks_last_market_v2");
      if (stored) {
        const parsed = JSON.parse(stored);
        return String(parsed.latestPrice || 15);
      }
    } catch {}
    return "15";
  });

  // Step 4 – Docs
  const [docs, setDocs] = useState(() => {
    try {
      const stored = localStorage.getItem("ks_claim_docs_v1");
      return stored
        ? { photo: false, ...JSON.parse(stored) }
        : { aadhaar: false, land: false, bank: false, photo: false };
    } catch {
      return { aadhaar: false, land: false, bank: false, photo: false };
    }
  });

  // Computed from scans
  const lastDisease = scans
    ?.filter(s => s.type === "leaf" && s.data?.status === "diseased")
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  const diseaseName = lastDisease?.data?.disease || "Crop Disease";
  const cropName = lastDisease?.data?.crop || "Crop";

  // Financial calculations
  const expectedProduction = parseFloat(insuredAcres || 0) * parseFloat(yieldPerAcre || 0);
  const expectedValue = expectedProduction * parseFloat(marketPrice || 0);
  const estimatedLoss = (damagePct / 100) * expectedValue;

  // 72h compliance
  const hoursGap = damageDate && intimationDate
    ? (new Date(intimationDate) - new Date(damageDate)) / 3600000
    : 0;
  const within72h = hoursGap >= 0 && hoursGap <= 72;

  const checkedCount = Object.values(docs).filter(Boolean).length;
  const sliderColor = damagePct < 30 ? C.p3 : damagePct <= 60 ? C.amber : C.red;

  // Auto-check photo doc
  useEffect(() => {
    setDocs(prev => ({ ...prev, photo: !!damagePhotoB64 }));
  }, [damagePhotoB64]);

  // Persist non-photo docs
  useEffect(() => {
    const { photo: _p, ...toPersist } = docs;
    localStorage.setItem("ks_claim_docs_v1", JSON.stringify(toPersist));
  }, [docs]);

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setDamagePhotoB64(reader.result);
      setDamagePhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setDamagePhotoB64(null);
    setDamagePhotoPreview(null);
    if (photoRef.current) photoRef.current.value = "";
  };

  const generateAndShare = async () => {
    const ts36 = Date.now().toString(36).toUpperCase();
    const ref = `KS-${ts36}`;

    const text = `🛡️ KRISHISENSE CROP LOSS REPORT
══════════════════════════════════
Reference: ${ref}
Date Generated: ${new Date().toLocaleString("en-IN")}

👤 FARMER DETAILS
Name: ${user?.fullName || "—"}
Phone: ${user?.phoneNumber || "—"}
Location: ${loc?.name || "—"}, ${loc?.state || "—"}
GPS: ${loc?.lat ? loc.lat.toFixed(6) : "—"}, ${loc?.lon ? loc.lon.toFixed(6) : "—"}

🌾 PLOT & CROP DETAILS
Khasra/Survey No.: ${khasra}
Insured Crop: ${cropName}
Insured Area: ${insuredAcres} acres
Sowing Date: ${sowingDate || "Not specified"}
Expected Harvest: ${harvestDate || "Not specified"}

🦠 DISEASE DIAGNOSIS
Disease: ${diseaseName}
Diagnosed by: KrishiSense AI (PlantVillage ML + Gemini Vision)
Diagnosis Date: ${lastDisease?.date ? new Date(lastDisease.date).toLocaleString("en-IN") : "—"}

⚠️ DAMAGE ASSESSMENT
Date of Damage: ${new Date(damageDate).toLocaleString("en-IN")}
Date of Intimation: ${new Date(intimationDate).toLocaleString("en-IN")}
Intimation Status: ${within72h ? "WITHIN 72 HOURS ✅" : `LATE (>${hoursGap.toFixed(0)}h) ⚠️`}
Observed Field Damage: ${damagePct}%

💰 FINANCIAL EXPOSURE
Market Price: ₹${marketPrice}/kg
Expected Yield: ${yieldPerAcre} kg/acre
Expected Production: ${expectedProduction.toLocaleString("en-IN")} kg
Expected Crop Value: ₹${expectedValue.toLocaleString("en-IN")}
Estimated Loss (${damagePct}% damage): ₹${estimatedLoss.toLocaleString("en-IN")}

📎 DOCUMENT READINESS
Aadhaar: ${docs.aadhaar ? "✅ Available" : "❌ Not ready"}
Land Record: ${docs.land ? "✅ Available" : "❌ Not ready"}
Bank Passbook: ${docs.bank ? "✅ Available" : "❌ Not ready"}
Damage Photo: ${damagePhotoB64 ? "✅ Captured" : "❌ Missing"}

📋 NEXT STEPS
1. Visit your nearest bank or CSC office with original documents
2. Carry this report (screenshot or printout) as reference
3. Quote reference number: ${ref}
4. Ask for PMFBY claim form for ${cropName}

══════════════════════════════════
Generated by KrishiSense AI
Powered by: PlantVillage ML · Gemini · NASA MODIS · SoilGrids
This report is for claim support only and does not guarantee claim approval.`;

    setReportText(text);

    try {
      if (navigator.share) {
        await navigator.share({ title: `KrishiSense Crop Loss Report — ${ref}`, text });
      } else {
        await navigator.clipboard.writeText(text);
        showToast("Report copied ✓", "success");
      }
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        showToast("Report copied ✓", "success");
      } catch {
        showToast("Could not share report", "error");
      }
    }
  };

  const saveReport = async () => {
    setSaving(true);
    try {
      await api.saveScan("claim_report", {
        reference: `KS-${Date.now().toString(36).toUpperCase()}`,
        diseaseName,
        cropName,
        khasra,
        insuredAcres,
        damagePct,
        estimatedLoss,
        marketPrice,
        within72h,
        intimationDate,
        damageDate,
        docsReady: checkedCount,
        hasPhoto: !!damagePhotoB64,
        loc: { name: loc?.name, state: loc?.state },
      });
      showToast("Claim report saved ✓", "success");
    } catch {
      showToast("Failed to save report", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ paddingBottom: 24 }}>
      <ProgressBar step={step} />

      {/* ── STEP 1: Farm & Crop Info ── */}
      {step === 1 && (
        <>
          <div style={{ padding: "16px 16px 4px" }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.txt, display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <ClipboardList size={18} color={C.p2} /> Farm & Crop Details
            </div>

            {/* Auto-filled chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
              {loc?.name && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 20, background: C.tint, border: `1px solid ${C.brd}`, fontSize: 11, color: C.p2, fontWeight: 600 }}>
                  <MapPin size={10} color={C.p2} /> {loc.name}, {loc.state}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 20, background: "#FFF3F3", border: "1px solid #FFCDD2", fontSize: 11, color: C.red, fontWeight: 600 }}>
                <Bug size={10} color={C.red} /> {diseaseName} in {cropName}
              </div>
              {user?.fullName && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 20, background: C.surface, border: `1px solid ${C.brd}`, fontSize: 11, color: C.txt2, fontWeight: 600 }}>
                  <User size={10} color={C.mut} /> {user.fullName}
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.txt2, marginBottom: 5 }}>Survey / Khasra Number *</div>
                <input
                  type="text"
                  value={khasra}
                  onChange={e => setKhasra(e.target.value)}
                  placeholder="e.g. 123/4A"
                  style={inputStyle}
                />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.txt2, marginBottom: 5 }}>Insured Area *</div>
                <div style={{ position: "relative" }}>
                  <input
                    type="number"
                    value={insuredAcres}
                    onChange={e => setInsuredAcres(e.target.value)}
                    placeholder="e.g. 2.5"
                    style={{ ...inputStyle, paddingRight: 52 }}
                  />
                  <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: C.mut, fontWeight: 600 }}>acres</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.txt2, marginBottom: 5 }}>Sowing Date</div>
                  <input type="date" value={sowingDate} onChange={e => setSowingDate(e.target.value)} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.txt2, marginBottom: 5 }}>Expected Harvest</div>
                  <input type="date" value={harvestDate} onChange={e => setHarvestDate(e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.txt2, marginBottom: 5 }}>Expected Yield per Acre</div>
                <div style={{ position: "relative" }}>
                  <input
                    type="number"
                    value={yieldPerAcre}
                    onChange={e => setYieldPerAcre(e.target.value)}
                    placeholder="500"
                    style={{ ...inputStyle, paddingRight: 36 }}
                  />
                  <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: C.mut, fontWeight: 600 }}>kg</span>
                </div>
              </div>
            </div>
          </div>
          <NavRow
            onBack={() => setTab("grow")}
            onNext={() => setStep(2)}
            nextDisabled={!khasra.trim() || !insuredAcres}
          />
        </>
      )}

      {/* ── STEP 2: Damage Assessment ── */}
      {step === 2 && (
        <>
          <div style={{ padding: "16px 16px 4px" }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.txt, display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <AlertTriangle size={18} color={C.amber} /> Damage Assessment
            </div>

            {/* Auto-filled disease card */}
            {lastDisease && (
              <Card style={{ background: C.tint, border: "1px solid #C8E6C9", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <CheckCircle2 size={18} color={C.p2} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.p2 }}>{diseaseName} detected on {cropName}</div>
                    <div style={{ fontSize: 10, color: C.mut, display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                      {lastDisease.date
                        ? new Date(lastDisease.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                        : "Date unknown"}
                      {lastDisease.data?.severity != null && (
                        <Badge
                          text={lastDisease.data.severity > 65 ? "HIGH" : lastDisease.data.severity > 35 ? "MED" : "LOW"}
                          color={lastDisease.data.severity > 65 ? C.red : lastDisease.data.severity > 35 ? C.amber : C.p3}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.txt2, marginBottom: 5 }}>Date & Time of Damage</div>
                <input type="datetime-local" value={damageDate} onChange={e => setDamageDate(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.txt2, marginBottom: 5 }}>Date & Time of Intimation</div>
                <input type="datetime-local" value={intimationDate} onChange={e => setIntimationDate(e.target.value)} style={inputStyle} />
              </div>

              {/* 72h compliance */}
              {damageDate && intimationDate && (
                <div style={{
                  padding: "10px 14px", borderRadius: 10,
                  background: within72h ? "#E8F5E9" : "#FFF3F3",
                  border: `1px solid ${within72h ? "#A5D6A7" : "#FFCDD2"}`,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  {within72h
                    ? <CheckCircle2 size={14} color={C.p2} />
                    : <AlertTriangle size={14} color={C.red} />}
                  <div style={{ fontSize: 11, fontWeight: 600, color: within72h ? C.p2 : C.red }}>
                    {within72h
                      ? `Reported within 72 hours — ${hoursGap.toFixed(1)}h after damage`
                      : `Reported ${hoursGap.toFixed(0)}h after damage — may affect claim validity`}
                  </div>
                </div>
              )}

              {/* Damage % slider */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.txt2 }}>Observed Field Damage</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: sliderColor }}>{damagePct}%</div>
                </div>
                <input
                  type="range"
                  min={0} max={100} step={1}
                  value={damagePct}
                  onChange={e => setDamagePct(Number(e.target.value))}
                  style={{ width: "100%", accentColor: sliderColor, cursor: "pointer", display: "block" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: C.mut, marginTop: 4 }}>
                  <span>0% — None</span><span>50% — Moderate</span><span>100% — Total</span>
                </div>
              </div>

              {/* Damage photo upload */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.txt2, marginBottom: 8 }}>Damage Photo Evidence</div>
                <input ref={photoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
                {!damagePhotoB64 ? (
                  <div
                    onClick={() => photoRef.current?.click()}
                    style={{
                      border: `2px dashed ${C.red}`, borderRadius: 12,
                      padding: "22px 16px", display: "flex", flexDirection: "column",
                      alignItems: "center", gap: 6, cursor: "pointer", background: "#FFF3F3",
                    }}
                  >
                    <Camera size={30} color={C.red} />
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.red }}>Add Damage Photo</div>
                    <div style={{ fontSize: 11, color: C.mut, textAlign: "center" }}>Clear image of affected crop or field</div>
                    <div style={{ fontSize: 10, color: C.mut }}>JPG/PNG up to 10MB</div>
                  </div>
                ) : (
                  <div style={{ position: "relative", display: "inline-block" }}>
                    <img
                      src={damagePhotoPreview}
                      alt="Damage"
                      style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 10, border: `2px solid ${C.p3}`, display: "block" }}
                    />
                    <button
                      onClick={removePhoto}
                      style={{
                        position: "absolute", top: -8, right: -8, width: 22, height: 22,
                        borderRadius: "50%", border: "none", background: C.red,
                        color: "white", cursor: "pointer", display: "flex",
                        alignItems: "center", justifyContent: "center", padding: 0,
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                <div style={{ fontSize: 10, color: C.mut, marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                  <Info size={10} color={C.mut} /> Photo compressed before use. SHA-256 fingerprint stored.
                </div>
              </div>
            </div>
          </div>
          <NavRow onBack={() => setStep(1)} onNext={() => setStep(3)} />
        </>
      )}

      {/* ── STEP 3: Financial Exposure ── */}
      {step === 3 && (
        <>
          <div style={{ padding: "16px 16px 4px" }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.txt, display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <BarChart2 size={18} color={C.p2} /> Financial Exposure
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.txt2, marginBottom: 5 }}>Market Price</div>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 13, fontWeight: 800, color: C.p2 }}>₹</span>
                <input
                  type="number"
                  value={marketPrice}
                  onChange={e => setMarketPrice(e.target.value)}
                  placeholder="15"
                  style={{ ...inputStyle, paddingLeft: 30, paddingRight: 40 }}
                />
                <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: C.mut, fontWeight: 600 }}>/kg</span>
              </div>
            </div>

            {/* Live calculation panel */}
            <div style={{
              borderRadius: 16, overflow: "hidden",
              background: "linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #388E3C 100%)",
              padding: "18px 18px",
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#A5D6A7", letterSpacing: 1.4, marginBottom: 16 }}>✦ LIVE CALCULATION</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.70)" }}>Expected Production</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "white" }}>{expectedProduction.toLocaleString("en-IN")} kg</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.70)" }}>Expected Crop Value</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "white" }}>₹{expectedValue.toLocaleString("en-IN")}</div>
                </div>
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.18)", paddingTop: 12, marginTop: 2 }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.60)", marginBottom: 4 }}>Estimated Loss ({damagePct}% damage)</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: "#FF8A80" }}>₹{estimatedLoss.toLocaleString("en-IN")}</div>
                </div>
              </div>
            </div>
            <div style={{ fontSize: 10, color: C.mut, marginTop: 8, textAlign: "center" }}>
              Transparent calculation: Area × Yield × Price × Damage%
            </div>
          </div>
          <NavRow onBack={() => setStep(2)} onNext={() => setStep(4)} />
        </>
      )}

      {/* ── STEP 4: Document Checklist ── */}
      {step === 4 && (
        <>
          <div style={{ padding: "16px 16px 4px" }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.txt, display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Paperclip size={18} color={C.p2} /> Insurance Claim Documents
            </div>
            <div style={{ fontSize: 11, color: C.mut, marginBottom: 12 }}>{checkedCount} of 4 ready</div>

            {/* Progress bar */}
            <div style={{ height: 5, borderRadius: 99, background: C.brd, marginBottom: 18, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 99, background: C.p3,
                width: `${(checkedCount / 4) * 100}%`, transition: "width 0.3s ease",
              }} />
            </div>

            {/* Checklist */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {[
                { key: "aadhaar", label: "Aadhaar Card Available", sub: "Only availability recorded — number not stored by KrishiSense", disabled: false },
                { key: "land",   label: "Land Record (7/12 or Khata) Available", sub: "Only availability recorded — document not uploaded or stored", disabled: false },
                { key: "bank",   label: "Bank Passbook Available", sub: "Only availability recorded — account details not stored", disabled: false },
                { key: "photo",  label: "Damage Photo Added", sub: "Completed automatically when damage photo is ready", disabled: true },
              ].map(({ key, label, sub, disabled }) => (
                <div
                  key={key}
                  onClick={() => { if (!disabled) setDocs(prev => ({ ...prev, [key]: !prev[key] })); }}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px",
                    borderRadius: 12, border: `1.5px solid ${docs[key] ? C.p3 : C.brd}`,
                    background: docs[key] ? C.tint : C.surface,
                    cursor: disabled ? "default" : "pointer",
                    transition: "all 0.15s ease",
                    opacity: disabled && !docs[key] ? 0.55 : 1,
                  }}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
                    background: docs[key] ? C.p3 : "transparent",
                    border: `2px solid ${docs[key] ? C.p3 : C.brd}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s ease",
                  }}>
                    {docs[key] && <span style={{ color: "white", fontSize: 12, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.txt }}>{label}</div>
                    <div style={{ fontSize: 10, color: C.mut, marginTop: 2, lineHeight: 1.45 }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Info banner */}
            <div style={{
              padding: "12px 14px", borderRadius: 12,
              background: "#FFFBF0", border: "1px solid #FFE0B2",
              display: "flex", gap: 10, alignItems: "flex-start",
            }}>
              <Info size={14} color={C.amber} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 11, color: "#92400E", lineHeight: 1.55 }}>
                KrishiSense does not store sensitive documents. This checklist only confirms readiness before visiting the bank or CSC office.
              </div>
            </div>
          </div>
          <NavRow onBack={() => setStep(3)} onNext={() => setStep(5)} nextLabel="Generate Report" />
        </>
      )}

      {/* ── STEP 5: Generate Report ── */}
      {step === 5 && (
        <>
          <div style={{ padding: "16px 16px 4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                background: `linear-gradient(135deg, ${C.p2}, ${C.p3})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 4px 14px rgba(22,134,75,0.30)`,
              }}>
                <ShieldCheck size={24} color="white" />
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: C.txt }}>Crop Loss Report Ready</div>
                <div style={{ fontSize: 10, color: C.mut }}>PMFBY claim documentation package</div>
              </div>
            </div>

            {/* Summary card */}
            <Card style={{ marginBottom: 16, background: C.tint, border: `1px solid ${C.brd}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.p2, letterSpacing: 1.2, marginBottom: 14 }}>✦ REPORT SUMMARY</div>
              {[
                ["Reference",      refNum],
                ["Farmer",         user?.fullName || "—"],
                ["Location",       loc ? `${loc.name}, ${loc.state}` : "—"],
                ["GPS",            loc?.lat ? `${loc.lat.toFixed(4)}, ${loc.lon.toFixed(4)}` : "—"],
                ["Crop / Disease", `${cropName} — ${diseaseName}`],
                ["Khasra / Area",  `${khasra || "—"} | ${insuredAcres || "—"} acres`],
                ["Damage",         `${damagePct}% | Intimation: ${within72h ? "✅ Within 72h" : "⚠️ Late"}`],
                ["Estimated Loss", `₹${estimatedLoss.toLocaleString("en-IN")}`],
                ["Documents",      `${checkedCount}/4 ready`],
              ].map(([key, val], i, arr) => (
                <div
                  key={key}
                  style={{
                    display: "flex", gap: 8,
                    ...(i < arr.length - 1 ? { paddingBottom: 8, marginBottom: 8, borderBottom: `1px solid ${C.brd}` } : {}),
                  }}
                >
                  <div style={{ fontSize: 10, color: C.mut, fontWeight: 600, width: 100, flexShrink: 0 }}>{key}</div>
                  <div style={{ fontSize: 11, color: C.txt, fontWeight: 700, flex: 1 }}>{val}</div>
                </div>
              ))}
            </Card>

            <button
              onClick={generateAndShare}
              style={{
                width: "100%", padding: "14px 0", borderRadius: 12, border: "none",
                background: `linear-gradient(135deg, ${C.p2}, ${C.p3})`,
                color: "white", fontSize: 14, fontWeight: 800, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                marginBottom: 10,
                boxShadow: `0 4px 14px rgba(22,134,75,0.30)`,
              }}
            >
              <Share2 size={16} /> Share / Download Report
            </button>
            <button
              onClick={saveReport}
              disabled={saving}
              style={{
                width: "100%", padding: "14px 0", borderRadius: 12,
                border: `1.5px solid ${C.brd}`,
                background: saving ? C.mut : C.surface,
                color: saving ? "white" : C.txt2,
                fontSize: 14, fontWeight: 700,
                cursor: saving ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "all 0.2s ease",
              }}
            >
              {saving ? "Saving..." : <><Save size={16} /> Save to KrishiSense</>}
            </button>
          </div>
          <NavRow onBack={() => setStep(4)} />
        </>
      )}
    </div>
  );
}
