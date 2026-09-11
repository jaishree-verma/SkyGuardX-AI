import React from "react";

function timeAgo(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s.toFixed(0)}s ago`;
  return `${(s / 60).toFixed(1)}m ago`;
}

export default function EventStream({ events, connected }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
        <span className={connected ? "live-dot" : "status-dot"} style={!connected ? { background: "var(--text-muted)" } : {}} />
        <span style={{ fontSize: 13, fontWeight: 600 }}>Event Stream</span>
        <span className="pill" style={{ marginLeft: "auto" }}>{connected ? "LIVE" : "RECONNECTING"}</span>
      </div>
      <div className="scrollbar-thin" style={{ overflowY: "auto", flex: 1, padding: "6px 0" }}>
        {events.length === 0 && (
          <div style={{ padding: 16, color: "var(--text-muted)", fontSize: 12 }}>
            No events yet — the simulator emits telemetry every few seconds.
          </div>
        )}
        {events.map((e) => (
          <div
            key={e.event_id}
            style={{
              padding: "8px 14px",
              borderBottom: "1px solid var(--border)",
              fontFamily: "var(--font-mono)",
              fontSize: 11.5,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
              <span>{e.event_id}</span>
              <span>{timeAgo(e.event_time)}</span>
            </div>
            <div style={{ marginTop: 2, color: "var(--text)" }}>
              {e.event_type} <span style={{ color: "var(--text-muted)" }}>· {e.entity_id}</span>
            </div>
            {e.payload?._simulated && (
              <span className="pill" style={{ marginTop: 4, display: "inline-block", color: "var(--amber)", borderColor: "var(--amber)" }}>
                SIMULATED
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
