import React, { useState } from "react";

export default function AlertsView({ alerts = [], conjunction, onInspectSatellite }) {
  const [filterSeverity, setFilterSeverity] = useState("ALL");

  const filtered = alerts.filter((a) => {
    if (filterSeverity === "ALL") return true;
    return a.severity === filterSeverity;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "20px 24px", overflowY: "auto", background: "var(--bg)" }} className="scrollbar-thin">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "var(--text)" }}>
            ACTIVE SPACE ALERTS
          </h2>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, fontFamily: "var(--font-mono)" }}>
            REAL-TIME THREAT ASSESSMENTS & DECISION WARNINGS
          </div>
        </div>

        {/* Severity Filter Tabs */}
        <div style={{ display: "flex", gap: 6 }}>
          {["ALL", "CRITICAL", "HIGH", "WARNING"].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              style={{
                background: filterSeverity === sev ? "var(--blue)" : "var(--panel-raised)",
                color: filterSeverity === sev ? "#ffffff" : "var(--text-muted)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: 600,
                fontFamily: "var(--font-mono)",
                cursor: "pointer",
              }}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div
          style={{
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "40px 20px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 10 }}>🛡️</div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>SPACE ENVIRONMENT STABLE</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
            No critical active alerts. All tracked satellites and debris paths within safe operational thresholds.
          </div>
        </div>
      )}

      {/* Alert Cards Grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map((alert) => {
          const isCritical = alert.severity === "CRITICAL";
          const borderColor = isCritical ? "#e63946" : "#ff9f1c";
          const riskPct = Math.round((alert.risk_score || 0.85) * 100);

          return (
            <div
              key={alert.alert_id}
              style={{
                background: "var(--panel-raised)",
                border: `1.5px solid ${borderColor}`,
                borderRadius: 6,
                padding: "16px 20px",
                display: "grid",
                gridTemplateColumns: "1fr 200px 140px",
                gap: 20,
                alignItems: "center",
              }}
            >
              {/* Alert Content: WHAT, WHERE, WHY */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 16 }}>{isCritical ? "🚨" : "⚠️"}</span>
                  <span style={{ fontWeight: 800, fontSize: 14, color: borderColor, fontFamily: "var(--font-mono)" }}>
                    {alert.alert_type}
                  </span>
                  <span className="pill" style={{ borderColor, color: borderColor, fontWeight: 700 }}>
                    {alert.severity}
                  </span>
                </div>

                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
                  {alert.title}
                </div>

                <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4, marginBottom: 8 }}>
                  {alert.message}
                </div>

                {alert.evidence && alert.evidence.length > 0 && (
                  <div style={{ fontSize: 11, color: "var(--text)", fontFamily: "var(--font-mono)" }}>
                    <strong>Evidence:</strong> {alert.evidence.join(" · ")}
                  </div>
                )}
              </div>

              {/* Severity & Confidence Summary */}
              <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: 16, fontFamily: "var(--font-mono)" }}>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>OVERALL RISK</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: borderColor }}>{riskPct}%</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
                  Operator review required
                </div>
              </div>

              {/* Action Button */}
              <div style={{ textAlign: "right" }}>
                <button
                  onClick={() => onInspectSatellite(alert.entity_id)}
                  style={{
                    background: borderColor,
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 4,
                    padding: "8px 14px",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Inspect {alert.entity_id} →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
