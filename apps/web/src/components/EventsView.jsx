import React, { useState } from "react";

export default function EventsView({ events = [] }) {
  const [filterType, setFilterType] = useState("ALL");
  const [filterSat, setFilterSat] = useState("ALL");
  const [selectedEvent, setSelectedEvent] = useState(null);

  const filteredEvents = events.filter((e) => {
    if (filterType !== "ALL" && !e.event_type.toLowerCase().includes(filterType.toLowerCase())) return false;
    if (filterSat !== "ALL" && e.entity_id !== filterSat) return false;
    return true;
  });

  const satOptions = Array.from(new Set(events.map((e) => e.entity_id))).filter(Boolean);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", height: "100%", overflow: "hidden", background: "var(--bg)" }}>
      {/* Event Stream Table with Filters */}
      <div style={{ display: "flex", flexDirection: "column", height: "100%", borderRight: "1px solid var(--border)", overflow: "hidden" }}>
        {/* Filter Toolbar */}
        <div
          style={{
            padding: "12px 18px",
            borderBottom: "1px solid var(--border)",
            background: "var(--panel)",
            display: "flex",
            gap: 12,
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
            FILTER:
          </span>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              background: "var(--panel-raised)",
              color: "var(--text)",
              border: "1px solid var(--border)",
              borderRadius: 4,
              padding: "4px 8px",
              fontSize: 11,
              fontFamily: "var(--font-mono)",
            }}
          >
            <option value="ALL">All Event Types</option>
            <option value="telemetry">Telemetry</option>
            <option value="anomaly">Anomaly</option>
            <option value="conjunction">Conjunction</option>
            <option value="alert">Alert</option>
          </select>

          <select
            value={filterSat}
            onChange={(e) => setFilterSat(e.target.value)}
            style={{
              background: "var(--panel-raised)",
              color: "var(--text)",
              border: "1px solid var(--border)",
              borderRadius: 4,
              padding: "4px 8px",
              fontSize: 11,
              fontFamily: "var(--font-mono)",
            }}
          >
            <option value="ALL">All Satellites & Objects</option>
            {satOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            Showing {filteredEvents.length} events
          </span>
        </div>

        {/* Events Table */}
        <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-thin">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5, textAlign: "left" }}>
            <thead>
              <tr style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)", fontFamily: "var(--font-mono)", fontSize: 10 }}>
                <th style={{ padding: "8px 14px" }}>EVENT ID</th>
                <th style={{ padding: "8px 10px" }}>TIME</th>
                <th style={{ padding: "8px 10px" }}>TYPE</th>
                <th style={{ padding: "8px 10px" }}>ENTITY</th>
                <th style={{ padding: "8px 10px" }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((e) => {
                const isSelected = selectedEvent?.event_id === e.event_id;
                const isAnom = e.event_type.includes("anomaly");
                const isConj = e.event_type.includes("conjunction");

                return (
                  <tr
                    key={e.event_id}
                    onClick={() => setSelectedEvent(e)}
                    style={{
                      cursor: "pointer",
                      borderBottom: "1px solid var(--border)",
                      background: isSelected ? "var(--panel-raised)" : "transparent",
                    }}
                  >
                    <td style={{ padding: "8px 14px", fontFamily: "var(--font-mono)" }}>{e.event_id}</td>
                    <td style={{ padding: "8px 10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                      {e.event_time ? new Date(e.event_time).toLocaleTimeString() : ""}
                    </td>
                    <td style={{ padding: "8px 10px" }}>
                      <span
                        style={{
                          fontWeight: 600,
                          color: isAnom ? "#ff9f1c" : isConj ? "#e63946" : "var(--teal)",
                        }}
                      >
                        {e.event_type}
                      </span>
                    </td>
                    <td style={{ padding: "8px 10px", fontWeight: 600 }}>{e.entity_id}</td>
                    <td style={{ padding: "8px 10px" }}>
                      <span className="pill" style={{ fontSize: 9 }}>
                        {e.quality?.status || "GOOD"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Drawer: Raw Event JSON Inspector */}
      <div style={{ background: "var(--panel)", padding: "16px", overflowY: "auto" }} className="scrollbar-thin">
        <div style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: 10 }}>
          CANONICAL EVENT PAYLOAD
        </div>

        {selectedEvent ? (
          <pre
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 4,
              padding: "12px",
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              color: "var(--teal)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              lineHeight: 1.4,
            }}
          >
            {JSON.stringify(selectedEvent, null, 2)}
          </pre>
        ) : (
          <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 40, textAlign: "center" }}>
            Select an event from the table to inspect its canonical JSON schema.
          </div>
        )}
      </div>
    </div>
  );
}
