import React from "react";

const STATUS_COLOR = { HIGH: "var(--amber)", MEDIUM: "var(--gold)", LOW: "var(--teal)" };

export default function RiskCard({ risk }) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderLeft: `3px solid ${STATUS_COLOR[risk.status] || "var(--border)"}`,
        borderRadius: 4,
        padding: "10px 12px",
        marginBottom: 8,
        background: "var(--panel-raised)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{risk.entity_id}</span>
        <span className={`status-dot status-${risk.status}`} />
        <span className="mono" style={{ fontSize: 11, color: STATUS_COLOR[risk.status] }}>{risk.status}</span>
      </div>
      <div style={{ display: "flex", gap: 14, marginTop: 6, fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-muted)" }}>
        <span>risk <b style={{ color: "var(--text)" }}>{risk.risk_score.toFixed(2)}</b></span>
        <span>conf <b style={{ color: "var(--text)" }}>{risk.confidence.toFixed(2)}</b></span>
        <span>{risk.model_version}</span>
      </div>
      {risk.top_evidence?.length > 0 && (
        <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
          {risk.top_evidence.map((ev) => (
            <span key={ev} className="pill">{ev}</span>
          ))}
        </div>
      )}
    </div>
  );
}
