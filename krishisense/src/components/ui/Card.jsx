import { C } from "../../constants/theme";

export default function Card({ children, style = {}, onClick, className = "" }) {
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        background:   C.surface,
        borderRadius: 14,
        padding:      16,
        boxShadow:    C.shadow,
        border:       `1px solid ${C.brd}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
