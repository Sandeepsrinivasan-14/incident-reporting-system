import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react";

const ToastContext = createContext(null);

const ICONS = {
  success: <CheckCircle size={18} />,
  error: <XCircle size={18} />,
  info: <AlertCircle size={18} />,
};

const COLORS = {
  success: { bg: "#f0fdf4", border: "#86efac", color: "#166534", icon: "#22c55e" },
  error:   { bg: "#fef2f2", border: "#fca5a5", color: "#991b1b", icon: "#ef4444" },
  info:    { bg: "#eff6ff", border: "#93c5fd", color: "#1e40af", icon: "#3b82f6" },
};

function ToastItem({ toast, onRemove }) {
  const c = COLORS[toast.type] || COLORS.info;
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: "12px",
      background: c.bg, border: `1px solid ${c.border}`, color: c.color,
      borderRadius: "12px", padding: "14px 16px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
      minWidth: "280px", maxWidth: "380px",
      animation: "slideInRight 0.35s cubic-bezier(0.34,1.56,0.64,1)",
      fontFamily: "inherit",
    }}>
      <span style={{ color: c.icon, flexShrink: 0, marginTop: "1px" }}>{ICONS[toast.type]}</span>
      <span style={{ flex: 1, fontSize: "14px", fontWeight: 500, lineHeight: "1.5" }}>{toast.message}</span>
      <button onClick={() => onRemove(toast.id)} style={{
        background: "none", border: "none", cursor: "pointer",
        color: c.color, opacity: 0.6, padding: "0", flexShrink: 0,
        display: "flex", alignItems: "center",
      }}>
        <X size={16} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div style={{
        position: "fixed", top: "20px", right: "20px",
        display: "flex", flexDirection: "column", gap: "10px",
        zIndex: 9999, pointerEvents: "none",
      }}>
        {toasts.map((t) => (
          <div key={t.id} style={{ pointerEvents: "auto" }}>
            <ToastItem toast={t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
