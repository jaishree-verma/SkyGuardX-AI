import React from "react";

function formatTime(iso) {
  try {
    const d = new Date(iso);
    return d.toTimeString().split(" ")[0];
  } catch {
    return "";
  }
}

export default function LiveEventTimeline({ events = [], connected }) {
  return (
    <div
      style={{
        background: "var(--panel-raised)",
        border: "1px solid var(--border)",
        borderRadius: 6,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "10px 14px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: "var(--font-mono)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="live-dot" />
          <span style={{ fontWeight: 800, fontSize: 11, color: "var(--text)" }}>
            LIVE SPACE EVENTS
          </span>
        </div>

        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
          DATA → AI → RISK → ALERT
        </span>
      </div>

      <div className="scrollbar-thin" style={{ overflowY: "auto", flex: 1, padding: "6px" }}>
        {events.length === 0 && (
          <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)", fontSize: 11 }}>
            Connecting to real-time space event stream...
          </div>
        )}

        {events.map((e, idx) => {
          const isAnomaly = e.event_type === "telemetry_anomaly";
          const isConjunction = e.event_type === "conjunction_alert" || e.event_type === "conjunction_update";

          let icon = "📡";
          let headline = `${e.entity_id} telemetry frame received`;
          let badgeColor = "var(--text-muted)";

          if (isConjunction) {
            icon = "🚨";
            headline = `Conjunction detected (${e.entity_id} + DEB-2098)`;
            badgeColor = "#e63946";
          } else if (isAnomaly) {
            icon = "🤖";
            headline = `Anomaly detected: ${e.entity_id}`;
            badgeColor = "#ff9f1c";
          } else if (e.event_type === "space_risk_alert") {
            icon = "⚠";
            headline = `Operator alert: Elevated risk on ${e.entity_id}`;
            badgeColor = "#ff9f1c";
          }

          return (
            <div
              key={e.event_id || idx}
              style={{
                padding: "8px 10px",
                borderRadius: 4,
                marginBottom: 4,
                background: isConjunction
                  ? "rgba(230, 57, 70, 0.08)"
                  : isAnomaly
                  ? "rgba(255, 159, 28, 0.08)"
                  : "var(--bg)",
                borderLeft: `3px solid ${badgeColor}`,
                fontFamily: "var(--font-mono)",
                fontSize: 11,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: 10 }}>
                <span style={{ fontWeight: 600, color: badgeColor }}>{formatTime(e.event_time)}</span>
                <span style={{ fontSize: 9 }}>{e.entity_id}</span>
              </div>

              <div style={{ marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 13 }}>{icon}</span>
                <span style={{ color: "var(--text)", fontWeight: isAnomaly || isConjunction ? 600 : 400 }}>
                  {headline}
                </span>
              </div>

              {isAnomaly && (
                <div style={{ fontSize: 10, color: "#ff9f1c", marginTop: 2 }}>
                  Thermal & power draw breach verified envelopes
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
