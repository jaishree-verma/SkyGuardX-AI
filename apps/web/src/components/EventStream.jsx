import React from "react";

function formatTime(iso) {
  try {
    const d = new Date(iso);
    return d.toTimeString().split(" ")[0];
  } catch {
    return "";
  }
}

export default function EventStream({ events = [], connected = false }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--panel)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px",
          borderBottom: "1px solid var(--border)",
          fontFamily: "var(--font-mono)",
        }}
      >
        <span className={connected ? "live-dot" : "status-dot"} style={!connected ? { background: "var(--text-muted)" } : {}} />
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text)" }}>LIVE EVENT STREAM</span>
        <span className="pill" style={{ marginLeft: "auto", fontSize: 10, color: connected ? "var(--teal)" : "var(--amber)" }}>
          {connected ? "LIVE ●" : "CONNECTING"}
        </span>
      </div>

      <div className="scrollbar-thin" style={{ overflowY: "auto", flex: 1, padding: "4px 0" }}>
        {events.length === 0 && (
          <div style={{ padding: 16, color: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }}>
            Listening for live satellite events...
          </div>
        )}
        {events.map((e) => {
          const isAnomaly = e.event_type === "telemetry_anomaly";
          const isConjunction = e.event_type === "conjunction_alert" || e.event_type === "conjunction_update";

          const badgeColor = isAnomaly ? "#ff9f1c" : isConjunction ? "#e63946" : "#2ec4b6";

          return (
            <div
              key={e.event_id}
              style={{
                padding: "8px 12px",
                borderBottom: "1px solid var(--border)",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                borderLeft: isAnomaly || isConjunction ? `3px solid ${badgeColor}` : "3px solid transparent",
                background: isAnomaly ? "rgba(255, 159, 28, 0.05)" : "transparent",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: 10 }}>
                <span style={{ fontWeight: 600, color: badgeColor }}>{formatTime(e.event_time)}</span>
                <span>{e.entity_id}</span>
              </div>
              <div style={{ marginTop: 2, color: "var(--text)", fontWeight: isAnomaly ? 600 : 400 }}>
                {isAnomaly
                  ? "🚨 Telemetry anomaly detected"
                  : isConjunction
                  ? "⚠️ Conjunction proximity update"
                  : `${e.entity_id} telemetry frame received`}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                <span className="pill" style={{ fontSize: 9 }}>{e.event_id}</span>
                {e.quality?.status && (
                  <span className="pill" style={{ fontSize: 9, color: "var(--teal)" }}>
                    {e.quality.status}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
