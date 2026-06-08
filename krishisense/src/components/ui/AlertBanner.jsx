import { useState, useEffect } from "react";
import { X, AlertTriangle, Info } from "lucide-react";
import { onForegroundMessage } from "../../lib/notifications";

const SEVERITY = {
  critical: { bg: "#FEE2E2", border: "#EF4444", color: "#B91C1C", Icon: AlertTriangle },
  high:     { bg: "#FEF3C7", border: "#F59E0B", color: "#B45309", Icon: AlertTriangle },
  medium:   { bg: "#FEF3C7", border: "#F59E0B", color: "#B45309", Icon: AlertTriangle },
  info:     { bg: "#EFF6FF", border: "#3B82F6", color: "#1D4ED8", Icon: Info },
};

export default function AlertBanner({ firebaseApp }) {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    if (!firebaseApp) return;
    const unsub = onForegroundMessage(firebaseApp, (msg) => {
      const id = Date.now();
      setAlerts((prev) => [{ ...msg, id }, ...prev.slice(0, 2)]);
      if (msg.data?.severity === "info") {
        setTimeout(() => setAlerts((prev) => prev.filter((a) => a.id !== id)), 8000);
      }
    });
    return unsub;
  }, [firebaseApp]);

  if (!alerts.length) return null;

  return (
    <div style={{
      position: "fixed", top: 60, left: "50%", transform: "translateX(-50%)",
      width: "calc(100% - 28px)", maxWidth: 452, zIndex: 9999,
      display: "flex", flexDirection: "column", gap: 8,
      pointerEvents: "none",
    }}>
      {alerts.map((alert) => {
        const sev = alert.data?.severity || "info";
        const cfg = SEVERITY[sev] || SEVERITY.info;
        const { Icon } = cfg;
        return (
          <div key={alert.id} style={{
            background: cfg.bg, border: `1px solid ${cfg.border}`,
            borderRadius: 14, padding: "12px 14px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            display: "flex", gap: 10, alignItems: "flex-start",
            pointerEvents: "auto",
          }}>
            <Icon size={18} color={cfg.color} style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: cfg.color }}>
                {alert.title}
              </div>
              <div style={{ fontSize: 11, color: "#374151", marginTop: 3, lineHeight: 1.5 }}>
                {alert.body}
              </div>
              {alert.data?.action && (
                <div style={{
                  fontSize: 10, color: cfg.color, fontWeight: 700,
                  marginTop: 5, padding: "4px 8px",
                  background: "rgba(255,255,255,0.6)", borderRadius: 6,
                }}>
                  ✓ {alert.data.action}
                </div>
              )}
            </div>
            <button
              onClick={() => setAlerts((prev) => prev.filter((a) => a.id !== alert.id))}
              style={{ background: "none", border: "none", cursor: "pointer", color: cfg.color, padding: 2, flexShrink: 0 }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
