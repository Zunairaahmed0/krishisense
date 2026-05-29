import { C } from "../../constants/theme";

export default function CircularGauge({ value = 0, max = 100, size = 80, label = "", color = C.p3, trackColor = "#E0E0E0" }) {
  const r      = (size - 10) / 2;
  const circ   = 2 * Math.PI * r;
  const filled = (value / max) * circ;

  return (
    <div style={{ position: "relative", width: size, height: size, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={7} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circ}`}
          style={{ transition: "stroke-dasharray 1.2s ease" }}
        />
      </svg>
      <div style={{ textAlign: "center", zIndex: 1 }}>
        <div style={{ fontSize: size > 70 ? 22 : 16, fontWeight: 800, color: C.primary, lineHeight: 1 }}>{value}</div>
        {label && <div style={{ fontSize: 9, color: C.mut, marginTop: 2 }}>{label}</div>}
      </div>
    </div>
  );
}
