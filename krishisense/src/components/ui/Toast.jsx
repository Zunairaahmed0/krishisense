import { useState, useEffect } from "react";

// Module-level singleton — no context setup needed, works anywhere in the tree
const _listeners = new Set();
let _id = 0;

function _dispatch(message, type) {
  const id = ++_id;
  _listeners.forEach(cb => cb({ id, message, type }));
}

export function useToast() {
  return { showToast: _dispatch };
}

const BG = {
  success: "#1B5E20",
  error:   "#C62828",
  warn:    "#E65100",
  info:    "#0277BD",
};

export default function Toast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const add = ({ id, message, type }) => {
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(
        () => setToasts(prev => prev.filter(t => t.id !== id)),
        3000
      );
    };
    _listeners.add(add);
    return () => _listeners.delete(add);
  }, []);

  if (!toasts.length) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 64,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 999999,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        alignItems: "center",
        pointerEvents: "none",
      }}
    >
      {toasts.map(t => (
        <div
          key={t.id}
          style={{
            background: BG[t.type] || BG.success,
            color: "white",
            padding: "10px 22px",
            borderRadius: 99,
            fontSize: 13,
            fontWeight: 700,
            boxShadow: "0 4px 24px rgba(0,0,0,0.28)",
            whiteSpace: "nowrap",
            animation: "fadeDown 0.3s ease",
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
