import { useState, useEffect } from "react";
import { X, ChevronRight, Loader2 } from "lucide-react";
import { C } from "../../constants/theme";
import { askAI } from "../../lib/ai";
import { parseJSON } from "../../lib/utils";
import { api } from "../../lib/api";
import { useToast } from "./Toast";

const PROFILE_KEY = "ks_farm_profile";

const PORTFOLIO_COLORS = {
  conservative: { color: "#1565C0", tint: "#E3F2FD", border: "#90CAF9", label: "Conservative", emoji: "🛡️" },
  balanced:     { color: "#2E7D32", tint: "#E8F5E9", border: "#A5D6A7", label: "Balanced",      emoji: "⚖️" },
  aggressive:   { color: "#E65100", tint: "#FFF3E0", border: "#FFCC80", label: "Aggressive",    emoji: "🚀" },
};

function AllocationBar({ crops, baseColor }) {
  const CROP_COLORS = ["#2E7D32", "#1565C0", "#E65100", "#6A1B9A", "#0277BD", "#5D4037"];
  return (
    <div>
      <div style={{ display: "flex", height: 8, borderRadius: 99, overflow: "hidden", marginBottom: 6 }}>
        {crops.map((c, i) => (
          <div
            key={i}
            style={{ width: `${c.acres_pct}%`, background: CROP_COLORS[i % CROP_COLORS.length], transition: "width 0.6s ease" }}
          />
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px" }}>
        {crops.map((c, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: C.txt2 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: CROP_COLORS[i % CROP_COLORS.length], flexShrink: 0 }} />
            <span>{c.name} <span style={{ color: C.mut }}>{c.acres_pct}%</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FarmDataForm({ profile, onChange, onSave, saving }) {
  return (
    <div style={{ padding: "0 18px 20px" }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: C.txt, marginBottom: 4 }}>📝 Your Farm Details</div>
      <div style={{ fontSize: 11, color: C.mut, marginBottom: 16 }}>
        Enter your farm specifics to get a personalized portfolio. Saved to your account.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.txt2, marginBottom: 5, display: "block" }}>Total Farm Area (in Acres)</label>
          <input
            type="number"
            value={profile.acreage}
            onChange={e => onChange("acreage", e.target.value)}
            placeholder="e.g. 3.5"
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.surface, fontSize: 12, color: C.txt, outline: "none", boxSizing: "border-box" }}
          />
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.txt2, marginBottom: 5, display: "block" }}>Available Budget for Inputs (₹)</label>
          <select
            value={profile.budget}
            onChange={e => onChange("budget", e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.surface, fontSize: 12, color: C.txt, outline: "none" }}
          >
            <option value="">-- Select budget range --</option>
            <option value="Under ₹20,000">Under ₹20,000</option>
            <option value="₹20,000 – ₹50,000">₹20,000 – ₹50,000</option>
            <option value="₹50,000 – ₹1,00,000">₹50,000 – ₹1,00,000</option>
            <option value="Above ₹1,00,000">Above ₹1,00,000</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.txt2, marginBottom: 5, display: "block" }}>Water Source</label>
          <select
            value={profile.waterSource}
            onChange={e => onChange("waterSource", e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.surface, fontSize: 12, color: C.txt, outline: "none" }}
          >
            <option value="">-- Select water source --</option>
            <option value="Rain-fed only">Rain-fed only</option>
            <option value="Borewell / Tubewell">Borewell / Tubewell</option>
            <option value="Canal irrigation">Canal irrigation</option>
            <option value="River / Nala">River / Nala</option>
            <option value="Drip system installed">Drip system installed</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.txt2, marginBottom: 5, display: "block" }}>Current / Last Crop Grown</label>
          <input
            type="text"
            value={profile.currentCrop}
            onChange={e => onChange("currentCrop", e.target.value)}
            placeholder="e.g. Onion, Wheat, Cotton"
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.surface, fontSize: 12, color: C.txt, outline: "none", boxSizing: "border-box" }}
          />
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.txt2, marginBottom: 5, display: "block" }}>Preferred Season</label>
          <div style={{ display: "flex", gap: 8 }}>
            {["Kharif", "Rabi", "Zaid", "Year-round"].map(s => (
              <button
                key={s}
                onClick={() => onChange("season", s)}
                style={{
                  flex: 1, padding: "9px 4px", borderRadius: 10, fontSize: 11, fontWeight: 700,
                  border: `1px solid ${profile.season === s ? C.primary : C.brd}`,
                  background: profile.season === s ? C.primary : C.surface,
                  color: profile.season === s ? "white" : C.txt2, cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onSave}
          disabled={saving}
          style={{
            width: "100%", padding: "13px", borderRadius: 12, border: "none",
            background: saving ? C.mut : C.primary,
            color: "white", fontSize: 13, fontWeight: 700, cursor: saving ? "default" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            marginTop: 4,
          }}
        >
          {saving ? <><Loader2 size={15} style={{ animation: "spin .9s linear infinite" }} /> Saving…</> : "💾 Save & Generate Portfolio"}
        </button>
      </div>
    </div>
  );
}

export default function PortfolioOptimizer({ rec, soil, loc, user, onClose }) {
  const { showToast } = useToast();
  const [view, setView] = useState("portfolios");
  const [portfolios, setPortfolios] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState("balanced");
  const [saving, setSaving] = useState(false);

  const defaultProfile = { acreage: "", budget: "", waterSource: "", currentCrop: "", season: "" };
  const [profile, setProfile] = useState(() => {
    try { return { ...defaultProfile, ...JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}") }; }
    catch { return defaultProfile; }
  });

  const updateProfile = (key, val) => setProfile(p => ({ ...p, [key]: val }));

  const saveFarmProfile = async () => {
    setSaving(true);
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      await api.saveScan("farmProfile", {
        ...profile,
        savedAt: new Date().toISOString(),
        userId: user?.uid,
      });
      showToast("Farm profile saved ✓", "success");
      setView("portfolios");
      generatePortfolios(profile);
    } catch (e) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      showToast("Saved locally (Firebase sync failed)", "info");
      setView("portfolios");
      generatePortfolios(profile);
    } finally {
      setSaving(false);
    }
  };

  const generatePortfolios = async (p = profile) => {
    setLoading(true);
    setPortfolios(null);
    try {
      const prompt = `You are an expert Indian agricultural advisor. Generate 3 crop portfolio plans for this farmer:
- Location: ${loc?.name || "India"}, ${loc?.state || ""}
- AI recommended crop: ${rec?.crop || "Wheat"} (${rec?.confidence || 85}% confidence, estimated profit ${rec?.profit || "₹35,000"}/acre)
- Soil: pH ${soil?.ph || 6.5}, Nitrogen ${soil?.n || 200} kg/ha, texture: ${soil?.texture || "Loamy"}
- Farm size: ${p.acreage || "3"} acres
- Water: ${p.waterSource || "Canal irrigation"}
- Budget: ${p.budget || "₹50,000 – ₹1,00,000"}
- Current crop: ${p.currentCrop || rec?.crop || "Wheat"}
- Season preference: ${p.season || "Rabi"}

Return ONLY valid JSON with exactly 3 portfolio objects — conservative, balanced, aggressive. No markdown, no explanation:
{"portfolios":[{"type":"conservative","label":"Conservative","emoji":"🛡️","description":"Low-risk stable income","crops":[{"name":"CropName","acres_pct":60},{"name":"CropName2","acres_pct":40}],"total_profit":"₹X,XXX/acre avg","risk":"Low","water_need":"Medium","season":"Rabi","reasoning":"2-sentence rationale for this profile."},{"type":"balanced","label":"Balanced","emoji":"⚖️","description":"Balanced risk and return","crops":[...],"total_profit":"₹X,XXX/acre avg","risk":"Medium","water_need":"Medium","season":"Kharif-Rabi","reasoning":"..."},{"type":"aggressive","label":"Aggressive","emoji":"🚀","description":"High-yield high-risk","crops":[...],"total_profit":"₹X,XXX/acre avg","risk":"High","water_need":"High","season":"Kharif","reasoning":"..."}]}`;

      const raw = await askAI(prompt, "Return ONLY JSON. No markdown. No extra text.");
      const data = parseJSON(raw);
      if (data?.portfolios?.length === 3) {
        setPortfolios(data.portfolios);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (e) {
      setPortfolios([
        {
          type: "conservative", label: "Conservative", emoji: "🛡️",
          description: "Low-risk stable income",
          crops: [
            { name: rec?.crop || "Wheat", acres_pct: 70 },
            { name: "Gram / Chickpea", acres_pct: 30 },
          ],
          total_profit: rec?.profit || "₹35,000/acre avg",
          risk: "Low", water_need: "Low", season: "Rabi",
          reasoning: `Focus on ${rec?.crop || "Wheat"} which is already recommended for your soil. Add Gram as a nitrogen-fixing rotation crop.`,
        },
        {
          type: "balanced", label: "Balanced", emoji: "⚖️",
          description: "Balanced risk and return",
          crops: [
            { name: rec?.crop || "Wheat", acres_pct: 50 },
            { name: "Onion", acres_pct: 30 },
            { name: "Tomato", acres_pct: 20 },
          ],
          total_profit: "₹52,000/acre avg",
          risk: "Medium", water_need: "Medium", season: "Rabi + Kharif",
          reasoning: "Diversify with a cash vegetable alongside the primary crop. Onion has strong mandi demand across Maharashtra and Madhya Pradesh.",
        },
        {
          type: "aggressive", label: "Aggressive", emoji: "🚀",
          description: "Maximum returns, higher inputs",
          crops: [
            { name: "Pomegranate", acres_pct: 40 },
            { name: "Onion", acres_pct: 40 },
            { name: rec?.crop || "Wheat", acres_pct: 20 },
          ],
          total_profit: "₹85,000/acre avg",
          risk: "High", water_need: "High", season: "Year-round",
          reasoning: "Horticultural crops offer highest returns but need investment in drip irrigation and cold storage access. Suitable for farmers near urban markets.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const hasSavedProfile = localStorage.getItem(PROFILE_KEY);
    if (hasSavedProfile) {
      generatePortfolios();
    } else {
      setView("form");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedPortfolio = portfolios?.find(p => p.type === selected);
  const allProfits = portfolios?.map(p => {
    const match = p.total_profit?.match(/[\d,]+/);
    return match ? parseInt(match[0].replace(/,/g, "")) : 0;
  }) || [];
  const maxProfit = Math.max(...allProfits, 1);

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 8000 }} />
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 480, background: C.bg,
        borderRadius: "20px 20px 0 0", zIndex: 8001,
        maxHeight: "90vh", display: "flex", flexDirection: "column",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.22)",
      }}>
        {/* Handle + Header */}
        <div style={{ padding: "14px 18px 0", flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: C.brd, margin: "0 auto 14px" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: C.txt }}>📊 Portfolio Optimizer</div>
              <div style={{ fontSize: 11, color: C.mut, marginTop: 1 }}>AI crop mix for maximum returns</div>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, border: `1px solid ${C.brd}`, background: C.surface, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={14} color={C.mut} />
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 6, marginTop: 14, marginBottom: 2 }}>
            {[["portfolios", "📊 Portfolios"], ["form", "✏️ My Farm Data"]].map(([id, label]) => (
              <button
                key={id}
                onClick={() => { setView(id); if (id === "portfolios" && !portfolios) generatePortfolios(); }}
                style={{
                  flex: 1, padding: "9px 4px", borderRadius: 10, fontSize: 12, fontWeight: 700,
                  border: `1px solid ${view === id ? C.primary : C.brd}`,
                  background: view === id ? C.primary : C.surface,
                  color: view === id ? "white" : C.txt2, cursor: "pointer", transition: "all 0.15s",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto" }}>

          {/* ── Farm Data Form ── */}
          {view === "form" && (
            <div style={{ paddingTop: 16 }}>
              <FarmDataForm profile={profile} onChange={updateProfile} onSave={saveFarmProfile} saving={saving} />
            </div>
          )}

          {/* ── Portfolio view ── */}
          {view === "portfolios" && (
            <div style={{ padding: "16px 18px 24px" }}>
              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0", gap: 14 }}>
                  <Loader2 size={32} color={C.p2} style={{ animation: "spin .9s linear infinite" }} />
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.txt2 }}>Generating AI portfolio plans…</div>
                  <div style={{ fontSize: 11, color: C.mut, textAlign: "center" }}>Analysing soil, weather, market prices & your farm profile</div>
                </div>
              ) : portfolios ? (
                <>
                  {/* Portfolio selector chips */}
                  <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                    {portfolios.map(p => {
                      const meta = PORTFOLIO_COLORS[p.type] || PORTFOLIO_COLORS.balanced;
                      const isActive = selected === p.type;
                      return (
                        <button
                          key={p.type}
                          onClick={() => setSelected(p.type)}
                          style={{
                            flex: 1, padding: "10px 6px", borderRadius: 12, cursor: "pointer",
                            border: `1.5px solid ${isActive ? meta.color : meta.border}`,
                            background: isActive ? meta.tint : C.surface,
                            transition: "all 0.18s",
                          }}
                        >
                          <div style={{ fontSize: 18 }}>{p.emoji || meta.emoji}</div>
                          <div style={{ fontSize: 10, fontWeight: 800, color: isActive ? meta.color : C.txt2, marginTop: 3, lineHeight: 1.2 }}>{p.label}</div>
                          {p.type === "balanced" && <div style={{ fontSize: 8, fontWeight: 700, color: "#2E7D32", marginTop: 2, background: "#E8F5E9", borderRadius: 4, padding: "1px 4px", display: "inline-block" }}>★ Recommended</div>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected portfolio detail */}
                  {selectedPortfolio && (() => {
                    const meta = PORTFOLIO_COLORS[selectedPortfolio.type] || PORTFOLIO_COLORS.balanced;
                    return (
                      <div style={{ borderRadius: 16, border: `1.5px solid ${meta.border}`, background: meta.tint, padding: "16px 14px", marginBottom: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                          <div style={{ fontSize: 28 }}>{selectedPortfolio.emoji || meta.emoji}</div>
                          <div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: meta.color }}>{selectedPortfolio.label} Portfolio</div>
                            <div style={{ fontSize: 11, color: C.mut }}>{selectedPortfolio.description}</div>
                          </div>
                        </div>

                        {/* Allocation bars */}
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: C.txt2, marginBottom: 8 }}>Crop Allocation</div>
                          <AllocationBar crops={selectedPortfolio.crops} baseColor={meta.color} />
                        </div>

                        {/* Metrics row */}
                        <div style={{ display: "flex", gap: 0, borderTop: `1px solid ${meta.border}`, paddingTop: 12 }}>
                          {[
                            ["💰", "Est. Profit", selectedPortfolio.total_profit],
                            ["⚠️", "Risk Level", selectedPortfolio.risk],
                            ["💧", "Water Need", selectedPortfolio.water_need],
                          ].map(([icon, label, val]) => (
                            <div key={label} style={{ flex: 1, textAlign: "center" }}>
                              <div style={{ fontSize: 14 }}>{icon}</div>
                              <div style={{ fontSize: 9, color: C.mut, marginTop: 2 }}>{label}</div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: C.txt, marginTop: 1 }}>{val}</div>
                            </div>
                          ))}
                        </div>

                        {/* Reasoning */}
                        <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.7)", fontSize: 11, color: C.txt2, lineHeight: 1.6 }}>
                          <span style={{ fontWeight: 700, color: meta.color }}>✦ Why this works: </span>
                          {selectedPortfolio.reasoning}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Comparison bar chart */}
                  <div style={{ borderRadius: 14, border: `1px solid ${C.brd}`, background: C.surface, padding: "14px" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.txt, marginBottom: 12 }}>📈 Profit Comparison</div>
                    {portfolios.map((p, i) => {
                      const meta = PORTFOLIO_COLORS[p.type] || PORTFOLIO_COLORS.balanced;
                      const val = allProfits[i];
                      const pct = maxProfit > 0 ? (val / maxProfit) * 100 : 0;
                      return (
                        <div key={p.type} style={{ marginBottom: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: meta.color }}>{p.emoji} {p.label}</div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: C.txt }}>{p.total_profit}</div>
                          </div>
                          <div style={{ height: 8, borderRadius: 99, background: meta.tint, overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: meta.color, borderRadius: 99, transition: "width 0.7s ease" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Edit farm data link */}
                  <button
                    onClick={() => setView("form")}
                    style={{ width: "100%", marginTop: 12, padding: "11px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.surface, color: C.txt2, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                  >
                    ✏️ Edit My Farm Data <ChevronRight size={14} />
                  </button>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>🌾</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.txt2, marginBottom: 6 }}>Enter Farm Details First</div>
                  <div style={{ fontSize: 11, color: C.mut, marginBottom: 16 }}>Add your farm size, water source & budget to generate a personalized portfolio</div>
                  <button onClick={() => setView("form")} style={{ padding: "12px 24px", borderRadius: 12, border: "none", background: C.primary, color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    Enter Farm Data →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
