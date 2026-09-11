import React from "react";

export default function ImpactCascadePanel({ impact, cascade }) {
  return (
    <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border)" }}>
      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: "var(--text-muted)" }}>
        IMPACT + CASCADE
      </div>
      {impact ? (
        <div className="mono" style={{ fontSize: 11.5, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          <span style={{ color: "var(--text-muted)" }}>population exposed</span>
          <span>{impact.affected_population.toLocaleString()}</span>
          <span style={{ color: "var(--text-muted)" }}>roads affected</span>
          <span>{impact.affected_roads.length}</span>
          <span style={{ color: "var(--text-muted)" }}>accessibility idx</span>
          <span>{impact.accessibility_index.toFixed(2)}</span>
        </div>
      ) : (
        <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>No impact computed yet.</div>
      )}

      {cascade && (
        <div style={{ marginTop: 10 }}>
          {Object.entries(cascade).map(([node, magnitude]) => (
            <div key={node} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              <span style={{ fontSize: 11, width: 140, color: "var(--text-muted)" }}>{node.replace(/_/g, " ")}</span>
              <div style={{ flex: 1, height: 5, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${Math.min(magnitude * 100, 100)}%`,
                    height: "100%",
                    background: magnitude > 0.6 ? "var(--amber)" : magnitude > 0.3 ? "var(--gold)" : "var(--teal)",
                  }}
                />
              </div>
              <span className="mono" style={{ fontSize: 11, width: 36, textAlign: "right" }}>{magnitude.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
