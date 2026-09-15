import React from "react";

export default function AlertBanner({ alerts = [], onDismiss }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 68,
        right: 20,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxWidth: 380,
      }}
    >
      {alerts.slice(0, 3).map((alert) => {
        const isCritical = alert.severity === "CRITICAL";
        const borderColor = isCritical ? "#e63946" : "#ff9f1c";
        const bgColor = isCritical ? "rgba(230, 57, 70, 0.95)" : "rgba(255, 159, 28, 0.95)";

        return (
          <div
            key={alert.alert_id}
            style={{
              background: "var(--panel)",
              border: `2px solid ${borderColor}`,
              borderRadius: 6,
              padding: "10px 14px",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.6)",
              animation: "slide-in 0.3s ease",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  fontFamily: "var(--font-mono)",
                  color: borderColor,
                  letterSpacing: "0.02em",
                }}
              >
                {alert.title}
              </span>
              <button
                onClick={() => onDismiss(alert.alert_id)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  fontSize: 14,
                  cursor: "pointer",
                  padding: "0 4px",
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ fontSize: 12, color: "var(--text)", marginBottom: 6, lineHeight: 1.35 }}>
              {alert.message}
            </div>
            {alert.evidence && alert.evidence.length > 0 && (
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                Evidence: {alert.evidence[0]}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
