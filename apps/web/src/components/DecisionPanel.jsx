import React, { useState } from "react";
import { api } from "../api/client.js";

export default function DecisionPanel({ recommendations, scenarioResults, onApproved }) {
  const [busy, setBusy] = useState(null);
  const latest = recommendations[0];

  async function decide(recId, decision) {
    setBusy(recId);
    try {
      const updated = await api.approveRecommendation(recId, "operator@console", decision);
      onApproved?.(updated);
    } finally {
      setBusy(null);
    }
  }

  async function requestRecommendation() {
    setBusy("generating");
    try {
      await api.generateRecommendation();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Decision & Explanation</span>
        <button
          onClick={requestRecommendation}
          disabled={busy === "generating"}
          style={{
            marginLeft: "auto", background: "var(--blue)", color: "#06090f", border: "none",
            borderRadius: 3, padding: "5px 10px", fontSize: 11, fontWeight: 600,
          }}
        >
          {busy === "generating" ? "Running…" : "Run decision loop"}
        </button>
      </div>

      <div className="scrollbar-thin" style={{ overflowY: "auto", flex: 1, padding: 14 }}>
        {!latest && (
          <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
            No recommendation yet. A hazard event will trigger one automatically, or click
            "Run decision loop" to generate one now.
          </div>
        )}

        {scenarioResults?.ranked_actions && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>RANKED CANDIDATE ACTIONS</div>
            {scenarioResults.ranked_actions.map((a, i) => (
              <div
                key={a.action_id}
                className="mono"
                style={{
                  display: "flex", justifyContent: "space-between", fontSize: 11.5,
                  padding: "6px 8px", marginBottom: 4, borderRadius: 3,
                  background: i === 0 && a.allowed ? "rgba(76,154,255,0.12)" : "var(--panel-raised)",
                  border: `1px solid ${a.allowed ? "var(--border)" : "var(--amber)"}`,
                  opacity: a.allowed ? 1 : 0.7,
                }}
              >
                <span>{a.action_type} ({a.action_id})</span>
                <span>{a.allowed ? a.score.toFixed(3) : "NOT_ALLOWED"}</span>
              </div>
            ))}
          </div>
        )}

        {latest && (
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>
              RECOMMENDATION {latest.recommendation_id}
            </div>
            <div style={{
              border: "1px solid var(--blue)", borderRadius: 4, padding: 12,
              background: "rgba(76,154,255,0.06)", marginBottom: 10,
            }}>
              <div className="mono" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                {latest.action_type} <span style={{ color: "var(--text-muted)" }}>· conf {latest.confidence?.toFixed(2)}</span>
              </div>
              <div style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--text)" }}>
                {latest.explanation?.text}
              </div>
              <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                <span className="pill">{latest.explanation?.mode}</span>
                <span className="pill">requires human approval</span>
                <span className="pill">{latest.approval_state}</span>
              </div>
            </div>

            {latest.approval_state === "PENDING" && (
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => decide(latest.recommendation_id, "APPROVE")}
                  disabled={busy === latest.recommendation_id}
                  style={{ flex: 1, background: "var(--teal)", color: "#06090f", border: "none", borderRadius: 3, padding: "8px 0", fontWeight: 600, fontSize: 12 }}
                >
                  Approve
                </button>
                <button
                  onClick={() => decide(latest.recommendation_id, "REJECT")}
                  disabled={busy === latest.recommendation_id}
                  style={{ flex: 1, background: "transparent", color: "var(--amber)", border: "1px solid var(--amber)", borderRadius: 3, padding: "8px 0", fontWeight: 600, fontSize: 12 }}
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
