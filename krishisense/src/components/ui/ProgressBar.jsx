import { C } from "../../constants/theme";

export default function ProgressBar({ label, value, color = C.p3, track = "#E8F5E9" }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.txt2, marginBottom: 5 }}>
        <span>{label}</span>
        <span style={{ color, fontWeight: 700 }}>{value}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: track }}>
        <div style={{ height: "100%", width: `${value}%`, borderRadius: 99, background: color, transition: "width 1.2s ease" }}/>
      </div>
    </div>
  );
}
