export default function Badge({ text, color = "#22C55E", bg }) {
  return (
    <span
      style={{
        display:       "inline-flex",
        alignItems:    "center",
        padding:       "3px 10px",
        borderRadius:  99,
        fontSize:      10,
        fontWeight:    700,
        color,
        background:    bg || `${color}1A`,
        border:        `1px solid ${color}33`,
        letterSpacing: 0.3,
        whiteSpace:    "nowrap",
      }}
    >
      {text}
    </span>
  );
}
