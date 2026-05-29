export default function LiveDot({ color = "#388E3C" }) {
  return (
    <span style={{
      display: "inline-block", width: 7, height: 7,
      background: color, borderRadius: "50%",
      animation: "pulse 1.5s infinite",
    }}/>
  );
}
