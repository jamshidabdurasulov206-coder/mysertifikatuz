import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const show = useCallback((message, type = "info", duration = 3500) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => remove(id), duration);
    return id;
  }, [remove]);

  const toast = {
    success: (msg, dur) => show(msg, "success", dur),
    error:   (msg, dur) => show(msg, "error",   dur || 5000),
    warning: (msg, dur) => show(msg, "warning", dur),
    info:    (msg, dur) => show(msg, "info",    dur),
    confirm: (message) => window.confirm(message), // keep confirm for now, replace later
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Container */}
      <div
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 99999,
          display: "flex",
          flexDirection: "column-reverse",
          gap: "10px",
          maxWidth: "380px",
          width: "calc(100vw - 48px)",
          pointerEvents: "none",
        }}
      >
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const ICONS = {
  success: "✓",
  error:   "✕",
  warning: "⚠",
  info:    "ℹ",
};

const COLORS = {
  success: { bg: "#f0fdf4", border: "#86efac", icon: "#16a34a", text: "#14532d" },
  error:   { bg: "#fef2f2", border: "#fca5a5", icon: "#dc2626", text: "#7f1d1d" },
  warning: { bg: "#fffbeb", border: "#fcd34d", icon: "#d97706", text: "#78350f" },
  info:    { bg: "#eff6ff", border: "#93c5fd", icon: "#2563eb", text: "#1e3a5f" },
};

function ToastItem({ toast, onClose }) {
  const c = COLORS[toast.type] || COLORS.info;
  return (
    <div
      role="alert"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: "14px 16px",
        background: c.bg,
        border: `1.5px solid ${c.border}`,
        borderRadius: "14px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
        animation: "toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both",
        pointerEvents: "all",
        cursor: "default",
      }}
    >
      {/* Icon */}
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        background: c.icon, color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 900, fontSize: 14, flexShrink: 0,
      }}>
        {ICONS[toast.type]}
      </div>
      {/* Message */}
      <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: c.text, lineHeight: 1.5, flex: 1 }}>
        {toast.message}
      </p>
      {/* Close */}
      <button
        onClick={onClose}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: c.text, opacity: 0.5, fontSize: 16, padding: 0,
          lineHeight: 1, flexShrink: 0,
        }}
        aria-label="Yopish"
      >✕</button>
    </div>
  );
}

export default ToastProvider;
