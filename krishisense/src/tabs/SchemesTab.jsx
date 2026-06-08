import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Phone, CheckCircle, Circle } from "lucide-react";
import { C } from "../constants/theme";
import { GOV_SCHEMES } from "../data/govSchemes";
import { api } from "../lib/api";
import { useToast } from "../components/ui/Toast";

const APPLIED_KEY = "ks_applied_schemes";
const CHECKED_DOCS_KEY = "ks_checked_docs";

const CATEGORIES = ["All", "Insurance", "Direct Benefit", "Credit", "Equipment", "Advisory", "Irrigation"];

function DocChecklist({ schemeId, documents }) {
  const storageKey = `${CHECKED_DOCS_KEY}_${schemeId}`;
  const [checked, setChecked] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || "{}"); } catch { return {}; }
  });

  const toggle = (idx) => {
    const next = { ...checked, [idx]: !checked[idx] };
    setChecked(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const doneCount = Object.values(checked).filter(Boolean).length;

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.txt2, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>📎 Documents to Collect</span>
        <span style={{ fontSize: 10, color: doneCount === documents.length ? C.p2 : C.mut, fontWeight: 700 }}>
          {doneCount}/{documents.length} ready
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {documents.map((doc, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            style={{
              display: "flex", alignItems: "center", gap: 9, padding: "8px 10px",
              borderRadius: 10, border: `1px solid ${checked[i] ? "#A5D6A7" : C.brd}`,
              background: checked[i] ? "#F1F8F1" : C.surface,
              cursor: "pointer", textAlign: "left", width: "100%",
            }}
          >
            {checked[i]
              ? <CheckCircle size={15} color={C.p2} style={{ flexShrink: 0 }} />
              : <Circle size={15} color={C.mut} style={{ flexShrink: 0 }} />}
            <span style={{ fontSize: 11, color: checked[i] ? C.p2 : C.txt2, fontWeight: checked[i] ? 700 : 400, lineHeight: 1.4 }}>{doc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepsModal({ scheme, onClose }) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 9000 }} />
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 480, background: C.bg, borderRadius: "20px 20px 0 0",
        zIndex: 9001, padding: "20px 18px 40px", boxShadow: "0 -8px 40px rgba(0,0,0,0.20)",
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 99, background: C.brd, margin: "0 auto 18px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <div style={{ fontSize: 28 }}>{scheme.icon}</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.txt }}>{scheme.shortName}</div>
            <div style={{ fontSize: 11, color: C.mut }}>{scheme.name}</div>
          </div>
        </div>

        <div style={{ fontSize: 12, fontWeight: 700, color: C.txt, marginBottom: 12 }}>📋 Step-by-Step Application Guide</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {scheme.howToApply.map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                background: `linear-gradient(135deg, ${scheme.color}, ${scheme.color}CC)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontSize: 11, fontWeight: 800,
              }}>{i + 1}</div>
              <div style={{ fontSize: 12, color: C.txt2, lineHeight: 1.6, flex: 1, paddingTop: 3 }}>{step}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, padding: "12px 14px", borderRadius: 12, background: "#FFF8E1", border: "1px solid #FFE082" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#E65100", marginBottom: 4 }}>🌐 Official Website</div>
          <div style={{ fontSize: 12, color: "#0277BD", fontWeight: 600 }}>{scheme.website}</div>
        </div>

        <button
          onClick={onClose}
          style={{ width: "100%", marginTop: 16, padding: 14, borderRadius: 12, border: "none", background: scheme.color, color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
        >
          Got It
        </button>
      </div>
    </>
  );
}

function SchemeCard({ scheme, isApplied, onToggleApplied }) {
  const [expanded, setExpanded] = useState(false);
  const [showSteps, setShowSteps] = useState(false);

  return (
    <>
      {showSteps && <StepsModal scheme={scheme} onClose={() => setShowSteps(false)} />}
      <div style={{
        borderRadius: 16, border: `1.5px solid ${isApplied ? scheme.color + "60" : scheme.border}`,
        background: isApplied ? scheme.tint : C.surface,
        marginBottom: 12, overflow: "hidden",
        boxShadow: isApplied ? `0 2px 12px ${scheme.color}20` : C.shadow,
        transition: "all 0.2s ease",
      }}>
        {/* Card header */}
        <div
          onClick={() => setExpanded(e => !e)}
          style={{ padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}
        >
          <div style={{
            width: 46, height: 46, borderRadius: 14, flexShrink: 0, fontSize: 22,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: scheme.tint, border: `1px solid ${scheme.border}`,
          }}>
            {scheme.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.txt }}>{scheme.shortName}</div>
              <div style={{
                fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 99,
                background: scheme.tint, border: `1px solid ${scheme.border}`, color: scheme.color,
              }}>{scheme.category}</div>
              {isApplied && (
                <div style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: "#E8F5E9", border: "1px solid #A5D6A7", color: C.p2 }}>
                  ✓ Applied
                </div>
              )}
            </div>
            <div style={{ fontSize: 11, color: C.mut, marginTop: 2, lineHeight: 1.35 }}>{scheme.tagline}</div>
            <div style={{
              display: "inline-block", marginTop: 6, padding: "4px 10px",
              borderRadius: 8, background: scheme.color + "15", border: `1px solid ${scheme.color}30`,
              fontSize: 11, fontWeight: 700, color: scheme.color,
            }}>
              {scheme.benefit}
            </div>
          </div>
          <div style={{ color: C.mut, flexShrink: 0, marginTop: 2 }}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>

        {/* Expanded content */}
        {expanded && (
          <div style={{ borderTop: `1px solid ${scheme.border}`, padding: "14px 16px" }}>
            <p style={{ fontSize: 12, color: C.txt2, lineHeight: 1.6, margin: "0 0 12px" }}>{scheme.description}</p>

            {/* Eligibility */}
            <div style={{ fontSize: 11, fontWeight: 700, color: C.txt2, marginBottom: 6 }}>✅ Who Can Apply</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 14 }}>
              {scheme.eligibility.map((e, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 11, color: C.txt2, lineHeight: 1.5 }}>
                  <span style={{ color: C.p2, flexShrink: 0, fontWeight: 700 }}>•</span>
                  {e}
                </div>
              ))}
            </div>

            {/* Deadline */}
            <div style={{ padding: "8px 12px", borderRadius: 10, background: "#FFFDE7", border: "1px solid #FFF176", marginBottom: 12, fontSize: 11, color: "#F57F17" }}>
              ⏰ <strong>Deadline:</strong> {scheme.deadline}
            </div>

            {/* Doc checklist */}
            <DocChecklist schemeId={scheme.id} documents={scheme.documents} />

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <a
                href={`tel:${scheme.helpline}`}
                style={{
                  flex: 1, padding: "11px 8px", borderRadius: 12, border: `1px solid ${scheme.border}`,
                  background: scheme.tint, color: scheme.color, fontSize: 12, fontWeight: 700,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 5, textDecoration: "none",
                }}
              >
                <Phone size={13} /> {scheme.helpline}
              </a>
              <button
                onClick={() => setShowSteps(true)}
                style={{
                  flex: 1.4, padding: "11px 8px", borderRadius: 12, border: "none",
                  background: scheme.color, color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}
              >
                📋 How to Apply
              </button>
              <button
                onClick={() => onToggleApplied(scheme.id)}
                style={{
                  flex: 1.4, padding: "11px 8px", borderRadius: 12, cursor: "pointer", fontSize: 12, fontWeight: 700,
                  border: isApplied ? `1px solid ${scheme.color}60` : `1px solid ${C.brd}`,
                  background: isApplied ? scheme.tint : C.surface,
                  color: isApplied ? scheme.color : C.mut,
                }}
              >
                {isApplied ? "✓ Applied!" : "Mark Applied"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function SchemesTab({ user }) {
  const { showToast } = useToast();
  const [filter, setFilter] = useState("All");
  const [applied, setApplied] = useState(() => {
    try { return JSON.parse(localStorage.getItem(APPLIED_KEY) || "[]"); } catch { return []; }
  });

  const filtered = filter === "All" ? GOV_SCHEMES : GOV_SCHEMES.filter(s => s.category === filter);
  const appliedCount = applied.length;
  const potentialBenefit = applied.includes("pmkisan") ? "₹6,000+" : appliedCount > 0 ? "Benefits unlocked" : "₹6,000+";

  const toggleApplied = async (schemeId) => {
    const isNowApplied = !applied.includes(schemeId);
    const next = isNowApplied
      ? [...applied, schemeId]
      : applied.filter(id => id !== schemeId);

    setApplied(next);
    localStorage.setItem(APPLIED_KEY, JSON.stringify(next));

    const scheme = GOV_SCHEMES.find(s => s.id === schemeId);
    if (isNowApplied) {
      showToast(`Marked as applied to ${scheme?.shortName} ✓`, "success");
      try {
        await api.saveScan("scheme_applied", {
          schemeId,
          schemeName: scheme?.name,
          shortName: scheme?.shortName,
          appliedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.warn("Scheme applied sync failed:", e.message);
      }
    } else {
      showToast(`Removed ${scheme?.shortName} from applied list`, "info");
    }
  };

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* ── Hero Banner ────────────────────────────────────────── */}
      <div style={{
        margin: "14px 14px 0",
        borderRadius: 20,
        background: "linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #388E3C 100%)",
        padding: "20px 18px",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "absolute", bottom: -30, right: 20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <div style={{ fontSize: 9, fontWeight: 700, color: "#A5D6A7", letterSpacing: 1.5, marginBottom: 6 }}>✦ GOVERNMENT BENEFITS</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "white", lineHeight: 1.2, marginBottom: 6 }}>
          Schemes You Qualify For
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.80)", lineHeight: 1.5, marginBottom: 14 }}>
          6 active central government schemes matching your farmer profile
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.14)", borderRadius: 12, padding: "10px 12px", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: "white" }}>6</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.75)", fontWeight: 600, marginTop: 1 }}>Schemes Available</div>
          </div>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.14)", borderRadius: 12, padding: "10px 12px", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#FFF176" }}>{appliedCount}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.75)", fontWeight: 600, marginTop: 1 }}>Applied So Far</div>
          </div>
          <div style={{ flex: 1.2, background: "rgba(255,255,255,0.14)", borderRadius: 12, padding: "10px 12px", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#A5D6A7" }}>{potentialBenefit}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.75)", fontWeight: 600, marginTop: 1 }}>Potential Benefit</div>
          </div>
        </div>
      </div>

      {/* ── Category Filter ─────────────────────────────────── */}
      <div style={{ display: "flex", gap: 6, padding: "14px 14px 6px", overflowX: "auto" }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              padding: "6px 12px", borderRadius: 99, border: `1px solid ${filter === cat ? C.primary : C.brd}`,
              background: filter === cat ? C.primary : C.surface,
              color: filter === cat ? "white" : C.txt2,
              fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
              transition: "all 0.18s",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Tips Banner ─────────────────────────────────────── */}
      <div style={{ margin: "8px 14px 14px", padding: "10px 14px", borderRadius: 12, background: "#FFF8E1", border: "1px solid #FFE082", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 18, flexShrink: 0 }}>💡</div>
        <div style={{ fontSize: 11, color: "#E65100", lineHeight: 1.5 }}>
          Tap any card to expand. Use the document checklist to prepare before visiting the bank or CSC.
        </div>
      </div>

      {/* ── Scheme Cards ────────────────────────────────────── */}
      <div style={{ padding: "0 14px" }}>
        {filtered.map(scheme => (
          <SchemeCard
            key={scheme.id}
            scheme={scheme}
            isApplied={applied.includes(scheme.id)}
            onToggleApplied={toggleApplied}
          />
        ))}
      </div>

      {/* ── Bottom help text ────────────────────────────────── */}
      <div style={{ margin: "8px 14px 20px", padding: "14px 16px", borderRadius: 14, background: C.surface, border: `1px solid ${C.brd}`, textAlign: "center" }}>
        <div style={{ fontSize: 20, marginBottom: 6 }}>🏛️</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.txt, marginBottom: 4 }}>Need Help Applying?</div>
        <div style={{ fontSize: 11, color: C.mut, lineHeight: 1.6 }}>
          Visit your nearest Common Service Centre (CSC) or Gram Panchayat office. Staff will help you fill forms and upload documents for all central schemes.
        </div>
        <a
          href="tel:14499"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            marginTop: 12, padding: "9px 18px", borderRadius: 10,
            background: C.primary, color: "white", fontSize: 12, fontWeight: 700,
            textDecoration: "none",
          }}
        >
          <Phone size={13} /> Call 14499 (CSC Helpline)
        </a>
      </div>
    </div>
  );
}
