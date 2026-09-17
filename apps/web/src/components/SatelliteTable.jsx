import React from "react";

const STATUS_BADGE = {
  NORMAL: { bg: "rgba(46, 196, 182, 0.15)", color: "#2ec4b6", border: "rgba(46, 196, 182, 0.3)" },
  LOW: { bg: "rgba(46, 196, 182, 0.15)", color: "#2ec4b6", border: "rgba(46, 196, 182, 0.3)" },
  WARNING: { bg: "rgba(245, 200, 76, 0.15)", color: "#f5c84c", border: "rgba(245, 200, 76, 0.3)" },
  MEDIUM: { bg: "rgba(245, 200, 76, 0.15)", color: "#f5c84c", border: "rgba(245, 200, 76, 0.3)" },
  HIGH_RISK: { bg: "rgba(255, 159, 28, 0.15)", color: "#ff9f1c", border: "rgba(255, 159, 28, 0.3)" },
  HIGH: { bg: "rgba(255, 159, 28, 0.15)", color: "#ff9f1c", border: "rgba(255, 159, 28, 0.3)" },
  CRITICAL: { bg: "rgba(230, 57, 70, 0.2)", color: "#e63946", border: "rgba(230, 57, 70, 0.4)" },
  STALE: { bg: "rgba(102, 115, 140, 0.15)", color: "#66738c", border: "rgba(102, 115, 140, 0.3)" },
};

export default function SatelliteTable({ satellites, risks, selectedSatId, onSelectSatellite, onInspectSatellite }) {
  const satList = Object.values(satellites).sort((a, b) => {
    // Put highest risk on top
    const riskA = risks[a.satellite_id]?.risk_score || 0;
    const riskB = risks[b.satellite_id]?.risk_score || 0;
    return riskB - riskA;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--panel)" }}>
      <div
        style={{
          padding: "10px 14px",
          fontSize: 11,
          fontWeight: 700,
          color: "var(--text-muted)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: "var(--font-mono)",
        }}
      >
        <span>ACTIVE SATELLITE FLEET ({satList.length})</span>
        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>SELECT ROW OR CLICK SCAN</span>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-thin">
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "left" }}>
          <thead>
            <tr style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)", fontFamily: "var(--font-mono)", fontSize: 10 }}>
              <th style={{ padding: "8px 12px" }}>SATELLITE</th>
              <th style={{ padding: "8px 8px" }}>STATUS</th>
              <th style={{ padding: "8px 8px" }}>HEALTH</th>
              <th style={{ padding: "8px 8px" }}>RISK</th>
              <th style={{ padding: "8px 8px" }}>TEMP</th>
              <th style={{ padding: "8px 8px" }}>BATT</th>
              <th style={{ padding: "8px 8px" }}>SIGNAL</th>
              <th style={{ padding: "8px 8px" }}>AGE</th>
              <th style={{ padding: "8px 10px", textAlign: "right" }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {satList.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>
                  Connecting to satellite telemetry stream...
                </td>
              </tr>
            )}
            {satList.map((sat) => {
              const isSelected = selectedSatId === sat.satellite_id;
              const r = risks[sat.satellite_id];
              const riskPct = r ? (r.risk_score * 100).toFixed(0) : "5";
              const status = sat.health_status || "NORMAL";
              const badge = STATUS_BADGE[status] || STATUS_BADGE.NORMAL;
              const age = sat.data_age_seconds !== undefined ? `${sat.data_age_seconds}s` : "<2s";

              return (
                <tr
                  key={sat.satellite_id}
                  onClick={() => onSelectSatellite(sat.satellite_id)}
                  style={{
                    cursor: "pointer",
                    borderBottom: "1px solid var(--border)",
                    background: isSelected ? "var(--panel-raised)" : "transparent",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "rgba(22, 29, 43, 0.6)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ fontWeight: 600, color: "var(--text)" }}>{sat.satellite_id}</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{sat.satellite_name}</div>
                  </td>
                  <td style={{ padding: "10px 8px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 6px",
                        borderRadius: 3,
                        fontSize: 10,
                        fontWeight: 600,
                        fontFamily: "var(--font-mono)",
                        background: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`,
                      }}
                    >
                      {status}
                    </span>
                  </td>
                  <td style={{ padding: "10px 8px", fontFamily: "var(--font-mono)" }}>
                    <span style={{ color: sat.health_score < 70 ? "#ff9f1c" : "#2ec4b6", fontWeight: 600 }}>
                      {sat.health_score?.toFixed(0)}%
                    </span>
                  </td>
                  <td style={{ padding: "10px 8px", fontFamily: "var(--font-mono)" }}>
                    <span style={{ color: Number(riskPct) > 50 ? "#e63946" : "#2ec4b6", fontWeight: 600 }}>
                      {riskPct}%
                    </span>
                  </td>
                  <td style={{ padding: "10px 8px", fontFamily: "var(--font-mono)" }}>
                    <span style={{ color: sat.temperature_c > 45 ? "#ff9f1c" : "var(--text)" }}>
                      {sat.temperature_c?.toFixed(1)}°C
                    </span>
                  </td>
                  <td style={{ padding: "10px 8px", fontFamily: "var(--font-mono)" }}>
                    <span style={{ color: sat.battery_level < 60 ? "#ff9f1c" : "var(--text)" }}>
                      {sat.battery_level?.toFixed(0)}%
                    </span>
                  </td>
                  <td style={{ padding: "10px 8px", fontFamily: "var(--font-mono)" }}>
                    <span style={{ color: sat.signal_strength < 75 ? "#ff9f1c" : "var(--text)" }}>
                      {sat.signal_strength?.toFixed(0)}%
                    </span>
                  </td>
                  <td style={{ padding: "10px 8px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                    {age}
                  </td>
                  <td style={{ padding: "10px 10px", textAlign: "right" }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onInspectSatellite) onInspectSatellite(sat.satellite_id);
                        else if (onSelectSatellite) onSelectSatellite(sat.satellite_id);
                      }}
                      style={{
                        background: "rgba(245, 200, 76, 0.15)",
                        border: "1px solid rgba(245, 200, 76, 0.4)",
                        color: "var(--yellow)",
                        padding: "3px 8px",
                        borderRadius: 4,
                        fontSize: 10.5,
                        fontWeight: 700,
                        fontFamily: "var(--font-mono)",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                      }}
                      title={`Run AI anomaly risk scan on ${sat.satellite_id}`}
                    >
                      <span>🔍</span>
                      <span>SCAN</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
