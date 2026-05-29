import { Home, MapPin, Leaf, ShoppingCart, Droplets } from "lucide-react";
import { C } from "../../constants/theme";

const TABS = [
  { id: "home",    Icon: Home,         label: "Home"    },
  { id: "land",    Icon: MapPin,       label: "LAND"    },
  { id: "grow",    Icon: Leaf,         label: "GROW"    },
  { id: "sell",    Icon: ShoppingCart, label: "SELL"    },
  { id: "sustain", Icon: Droplets,     label: "SUSTAIN" },
];

export default function BottomNav({ tab, setTab }) {
  return (
    <div style={{
      position:   "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 480,
      background: "rgba(255,255,255,0.92)",
      backdropFilter: "blur(18px)",
      borderTop:  `1px solid ${C.brd}`,
      display:    "flex",
      padding: "8px 10px calc(8px + env(safe-area-inset-bottom, 0px))",
      gap: 4,
      zIndex: 40,
      boxShadow: "0 -18px 40px rgba(18,60,44,0.10)",
    }}>
      {TABS.map(({ id, Icon, label }) => {
        const active = tab === id;
        return (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              flex: 1, padding: "8px 0 7px",
              background: "transparent", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              color: active ? C.primary : C.mut,
              transition: "all .18s",
              position: "relative",
              borderRadius: 12,
              boxShadow: active ? "inset 0 0 0 1px rgba(22,134,75,0.10)" : "none",
              backgroundColor: active ? C.tint : "transparent",
            }}
          >
            {active && (
              <div style={{
                position: "absolute", top: 4, left: "50%", transform: "translateX(-50%)",
                width: 18, height: 2, borderRadius: 99,
                background: C.p2,
              }}/>
            )}
            <Icon size={20} strokeWidth={active ? 2.6 : 2} />
            <span style={{ fontSize: 9, fontWeight: active ? 700 : 500, letterSpacing: 0.5 }}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
