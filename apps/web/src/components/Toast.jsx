import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "info", duration = 3200) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 5);
    const newToast = { id, message, type };
    setToasts((prev) => [...prev.slice(-4), newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Notification Container */}
      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          pointerEvents: "none",
          maxWidth: 380,
        }}
      >
        {toasts.map((toast) => {
          let borderColor = "var(--blue)";
          let bgGradient = "linear-gradient(135deg, rgba(16, 26, 46, 0.96) 0%, rgba(10, 14, 20, 0.98) 100%)";
          let icon = "ℹ️";
          let accentColor = "var(--blue)";

          if (toast.type === "success") {
            borderColor = "var(--yellow)";
            accentColor = "var(--yellow)";
            icon = "⚡";
          } else if (toast.type === "danger" || toast.type === "critical") {
            borderColor = "var(--red)";
            accentColor = "var(--red)";
            icon = "🚨";
          } else if (toast.type === "warning") {
            borderColor = "var(--yellow)";
            accentColor = "var(--yellow)";
            icon = "⚠️";
          }

          return (
            <div
              key={toast.id}
              style={{
                pointerEvents: "auto",
                background: bgGradient,
                border: `1px solid ${borderColor}`,
                boxShadow: `0 8px 24px rgba(0,0,0,0.6), 0 0 12px ${borderColor}33`,
                borderRadius: 6,
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: "var(--text)",
                fontFamily: "var(--font-ui)",
                fontSize: 12.5,
                animation: "toast-slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                backdropFilter: "blur(10px)",
              }}
            >
              <span style={{ fontSize: 16 }}>{icon}</span>
              <div style={{ flex: 1, lineHeight: 1.4 }}>
                <span style={{ color: accentColor, fontWeight: 700, marginRight: 6, fontFamily: "var(--font-mono)", fontSize: 11 }}>
                  SYSTEM:
                </span>
                {toast.message}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: 13,
                  padding: "0 4px",
                }}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      showToast: (msg, type) => console.log(`[Toast ${type || "info"}]: ${msg}`),
    };
  }
  return ctx;
}
