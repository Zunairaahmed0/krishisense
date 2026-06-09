import { Bell, Menu, ChevronLeft } from "lucide-react";
import { C } from "../../constants/theme";

export default function Header({ title, subtitle, iconSrc, showBack, onBack, logoSrc, notifications = 0, rightSlot, onMenuClick, onBellClick, onLogoTap }) {
  return (
    <div style={{
      background:   "rgba(255,255,255,0.88)",
      backdropFilter: "blur(18px)",
      padding:      "12px 16px",
      display:      "flex",
      alignItems:   "center",
      justifyContent: "space-between",
      position:     "sticky",
      top:          0,
      zIndex:       40,
      borderBottom: `1px solid ${C.brd}`,
      boxShadow:    "0 10px 30px rgba(18,60,44,0.06)",
    }}>
      {/* Left */}
      {showBack ? (
        <button aria-label="Back" onClick={onBack} style={{ width: 38, height: 38, borderRadius: 12, border: `1px solid ${C.brd}`, background: C.surface, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 14px rgba(18,60,44,0.05)" }}>
          <ChevronLeft size={20} color={C.txt} />
        </button>
      ) : (
        <button aria-label="Menu" onClick={onMenuClick} style={{ width: 38, height: 38, borderRadius: 12, background: C.surface, border: `1px solid ${C.brd}`, cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(18,60,44,0.05)" }}>
          <Menu size={22} color={C.txt2} />
        </button>
      )}

      {/* Center */}
      <div style={{ textAlign: "center", flex: 1, margin: "0 8px", minWidth: 0 }}>
        {title ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {iconSrc && (
              <img
                src={iconSrc}
                alt=""
                style={{ width: 32, height: 32, objectFit: "contain", borderRadius: 6, flexShrink: 0 }}
              />
            )}
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: C.primary }}>{title}</div>
              {subtitle && <div style={{ fontSize: 11, color: C.mut }}>{subtitle}</div>}
            </div>
          </div>
        ) : logoSrc ? (
          <div
            onClick={onLogoTap}
            style={{
              width: 180,
              maxWidth: "100%",
              height: 44,
              margin: "0 auto",
              backgroundImage: `url(${logoSrc})`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center 43%",
              backgroundSize: "280px auto",
              cursor: onLogoTap ? "pointer" : "default",
              WebkitTapHighlightColor: "transparent",
            }}
            role="img"
            aria-label="KrishiSense"
          />
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg,${C.p2},${C.p4})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 16 }}>🌿</span>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.primary, letterSpacing: -.3 }}>KrishiSense</div>
              <div style={{ fontSize: 9, color: C.mut }}>AI Assistant for Farmers</div>
            </div>
          </div>
        )}
      </div>

      {/* Right */}
      {rightSlot || (
        <button aria-label="Notifications" onClick={onBellClick} style={{ position: "relative", width: 38, height: 38, borderRadius: 12, background: C.surface, border: `1px solid ${C.brd}`, cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(18,60,44,0.05)" }}>
          <Bell size={22} color={C.txt2} />
          {notifications > 0 && (
            <span style={{ position: "absolute", top: 0, right: 0, width: 16, height: 16, borderRadius: "50%", background: C.red, color: "white", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {notifications}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
