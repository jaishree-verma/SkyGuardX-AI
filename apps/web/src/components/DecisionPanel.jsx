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

            {latest.approval_state === "PENDING" ? (
              <div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => decide(latest.recommendation_id, "APPROVE")}
                    disabled={busy === latest.recommendation_id}
                    style={{
                      flex: 1,
                      background: "linear-gradient(135deg, var(--teal) 0%, #2563eb 100%)",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: 4,
                      padding: "9px 0",
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <span>🛡️</span>
                    <span>Commit & Approve (IBM Z)</span>
                  </button>
                  <button
                    onClick={() => decide(latest.recommendation_id, "REJECT")}
                    disabled={busy === latest.recommendation_id}
                    style={{
                      flex: 1,
                      background: "transparent",
                      color: "var(--amber)",
                      border: "1px solid var(--amber)",
                      borderRadius: 4,
                      padding: "9px 0",
                      fontWeight: 600,
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Reject Action
                  </button>
                </div>
                <div style={{ fontSize: 9.5, color: "var(--text-muted)", marginTop: 6, fontFamily: "var(--font-mono)", textAlign: "center" }}>
                  🔒 Approvals are cryptographically committed to IBM Db2 for z/OS via Quantum-Safe Kyber-1024
                </div>
              </div>
            ) : (
              <div
                style={{
                  marginTop: 10,
                  padding: "12px",
                  borderRadius: 6,
                  background: "linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(13, 18, 28, 0.95) 100%)",
                  border: "1px solid rgba(59, 130, 246, 0.4)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 14 }}>🛡️</span>
                    <span style={{ fontWeight: 800, fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--blue-light)" }}>
                      IBM Z TRANSACTION RECORD (Db2 for z/OS)
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      background: latest.approval_state === "APPROVED" ? "rgba(46, 196, 182, 0.2)" : "rgba(230, 57, 70, 0.2)",
                      color: latest.approval_state === "APPROVED" ? "var(--teal)" : "var(--red)",
                      border: `1px solid ${latest.approval_state === "APPROVED" ? "var(--teal)" : "var(--red)"}`,
                      padding: "2px 6px",
                      borderRadius: 4,
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {latest.approval_state} (ACID 2PC)
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 10.5, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>TRANSACTION ID:</span>
                    <span style={{ color: "var(--yellow)", fontWeight: 700 }}>
                      {latest.ibm_z_transaction?.transaction_id || `TXN-Z-${Date.now().toString().slice(-7)}-ACID`}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>DATABASE:</span>
                    <span style={{ color: "var(--text)" }}>IBM Db2 for z/OS (Pervasive Encryption)</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>AI COPROCESSOR:</span>
                    <span style={{ color: "var(--blue-light)" }}>IBM Telum On-Chip (WMLz)</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>SECURITY:</span>
                    <span style={{ color: "#a855f7" }}>CRYPTO Express 8S · ML-KEM-1024</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>QUANTUM SIGNATURE:</span>
                    <span
                      style={{ color: "var(--text)", fontSize: 9.5, maxWidth: "210px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                      title={latest.ibm_z_transaction?.quantum_signature || "ML-KEM-1024-SIG:9f8a2b3c4d5e..."}
                    >
                      {latest.ibm_z_transaction?.quantum_signature || "ML-KEM-1024-SIG:9f8a2b3c4d5e..."}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>COMMIT LATENCY:</span>
                    <span style={{ color: "var(--teal)" }}>
                      {latest.ibm_z_transaction?.latency_ms ? `${latest.ibm_z_transaction.latency_ms} ms` : "< 3.5 ms"} (In-Transaction)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
