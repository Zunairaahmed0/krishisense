export default function Spinner({ size = 24, color = "#388E3C" }) {
  return (
    <div style={{
      width:        size, height: size,
      border:       `2.5px solid ${color}30`,
      borderTopColor: color,
      borderRadius: "50%",
      animation:    "spin .7s linear infinite",
      flexShrink:   0,
    }}/>
  );
}
