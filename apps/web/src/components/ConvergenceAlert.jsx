import { useState, useEffect } from "react";
import AIThreatBriefing from "./AIThreatBriefing";

function CTIDial({ value }) {
  const pct = Math.min(1, Math.max(0, value));
  const angle = pct * 180 - 90; // -90° (left) to +90° (right)
  const color =
    pct >= 0.75 ? "#f87171" : pct >= 0.55 ? "#fb923c" : pct >= 0.35 ? "#f59e0b" : "#4ade80";

  return (
    <div style={{ position: "relative", width: "140px", height: "75px", margin: "0 auto" }}>
      {/* Track arc */}
      <svg width="140" height="80" viewBox="0 0 140 80">
        <path d="M 10 75 A 60 60 0 0 1 130 75" fill="none" stroke="#1e293b" strokeWidth="10" strokeLinecap="round" />
        <path
          d="M 10 75 A 60 60 0 0 1 130 75"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${pct * 188} 188`}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
        {/* Needle */}
        <g transform={`rotate(${angle}, 70, 75)`}>
          <line x1="70" y1="75" x2="70" y2="22" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <circle cx="70" cy="75" r="4" fill={color} />
        </g>
      </svg>
      <div
        style={{
          position: "absolute",
          bottom: "0",
          left: "50%",
          transform: "translateX(-50%)",
          fontFamily: "monospace",
          fontSize: "20px",
          fontWeight: 900,
          color,
          textShadow: `0 0 12px ${color}`,
          letterSpacing: "-0.02em",
        }}
      >
        {(pct * 100).toFixed(0)}
        <span style={{ fontSize: "11px", fontWeight: 400, color: "#94a3b8" }}>%</span>
      </div>
    </div>
  );
}

function PulsingRing() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            inset: `${i * 20}px`,
            border: "1px solid rgba(248,113,113,0.15)",
            borderRadius: "20px",
            animation: `ringPulse 2s ease-in-out ${i * 0.4}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

export default function ConvergenceAlert({ alert, onDismiss }) {
  const [reason, setReason] = useState("ACKNOWLEDGED");
  const [dismissing, setDismissing] = useState(false);
  const [operator, setOperator] = useState("operator@console");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (alert) {
      setTimeout(() => setVisible(true), 50);
    }
  }, [alert]);

  if (!alert) return null;

  const cti = alert.compound_threat_index || 0;
  const severity = alert.severity || "HIGH";
  const brief = alert.gemini_brief || null;

  const severityColor = {
    CRITICAL: "#f87171",
    HIGH: "#fb923c",
    MEDIUM: "#f59e0b",
    LOW: "#4ade80",
  }[severity] || "#f87171";

  const handleDismiss = async () => {
    setDismissing(true);
    try {
      await fetch(`/api/v1/convergence/alerts/${alert.convergence_id}/dismiss`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approver: operator, decision: reason, notes: null }),
      });
    } catch (_) { /* non-blocking */ }
    setVisible(false);
    setTimeout(() => onDismiss?.(), 400);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(2, 6, 23, 0.92)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.4s ease",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "780px",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#030712",
          border: `2px solid ${severityColor}`,
          borderRadius: "16px",
          boxShadow: `0 0 60px ${severityColor}30, 0 0 120px ${severityColor}10`,
          padding: "28px",
          animation: "alertPop 0.4s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <PulsingRing />

        {/* Title bar */}
        <div style={{ position: "relative", zIndex: 1, marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <span style={{ fontSize: "24px", animation: "warningFlash 0.6s step-end infinite" }}>⚡</span>
            <div>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: "16px",
                  fontWeight: 900,
                  letterSpacing: "0.12em",
                  color: severityColor,
                  textTransform: "uppercase",
                  textShadow: `0 0 20px ${severityColor}`,
                }}
              >
                MULTI-HAZARD CONVERGENCE DETECTED
              </div>
              <div style={{ fontFamily: "monospace", fontSize: "10px", color: "#64748b", marginTop: "2px" }}>
                ID: {alert.convergence_id} · {new Date(alert.detected_at).toLocaleTimeString()} ·{" "}
                <span style={{ color: severityColor }}>SEVERITY: {severity}</span>
              </div>
            </div>
            <div
              style={{
                marginLeft: "auto",
                fontFamily: "monospace",
                fontSize: "10px",
                padding: "4px 10px",
                borderRadius: "6px",
                border: `1px solid ${severityColor}`,
                color: severityColor,
                background: `${severityColor}11`,
                whiteSpace: "nowrap",
              }}
            >
              🔒 REQUIRES HUMAN ACTION
            </div>
          </div>
        </div>

        {/* Risk metrics row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "12px",
            marginBottom: "24px",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* CTI Dial */}
          <div
            style={{
              background: "#07101d",
              border: `1px solid ${severityColor}33`,
              borderRadius: "10px",
              padding: "16px 12px 12px",
              textAlign: "center",
            }}
          >
            <div style={{ fontFamily: "monospace", fontSize: "9px", color: "#64748b", letterSpacing: "0.1em", marginBottom: "8px" }}>
              COMPOUND THREAT INDEX
            </div>
            <CTIDial value={cti} />
          </div>

          {/* Space Risk */}
          <div
            style={{
              background: "#07101d",
              border: "1px solid #1e3a5f",
              borderRadius: "10px",
              padding: "16px",
            }}
          >
            <div style={{ fontFamily: "monospace", fontSize: "9px", color: "#64748b", letterSpacing: "0.1em", marginBottom: "12px" }}>
              🛰 SPACE RISK
            </div>
            <div style={{ fontFamily: "monospace", fontSize: "24px", fontWeight: 900, color: "#60a5fa" }}>
              {(alert.space_risk_score * 100).toFixed(0)}
              <span style={{ fontSize: "11px", color: "#475569" }}>%</span>
            </div>
            <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>{alert.space_entity_id}</div>
            <div
              style={{
                marginTop: "8px",
                fontSize: "10px",
                fontFamily: "monospace",
                color: alert.space_risk_status === "CRITICAL" ? "#f87171" : alert.space_risk_status === "HIGH" ? "#fb923c" : "#f59e0b",
                background: "#0f172a",
                padding: "3px 8px",
                borderRadius: "4px",
                display: "inline-block",
              }}
            >
              {alert.space_risk_status}
            </div>
          </div>

          {/* Earth Risk */}
          <div
            style={{
              background: "#07101d",
              border: "1px solid #1e3a1a",
              borderRadius: "10px",
              padding: "16px",
            }}
          >
            <div style={{ fontFamily: "monospace", fontSize: "9px", color: "#64748b", letterSpacing: "0.1em", marginBottom: "12px" }}>
              🌍 EARTH RISK
            </div>
            <div style={{ fontFamily: "monospace", fontSize: "24px", fontWeight: 900, color: "#34d399" }}>
              {(alert.earth_risk_score * 100).toFixed(0)}
              <span style={{ fontSize: "11px", color: "#475569" }}>%</span>
            </div>
            <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>{alert.earth_hazard_type}</div>
            <div style={{ marginTop: "4px", fontSize: "11px", color: "#94a3b8" }}>
              👥 {(alert.affected_population || 0).toLocaleString()} people
            </div>
          </div>
        </div>

        {/* Evidence tags */}
        {alert.space_top_evidence?.length > 0 && (
          <div style={{ marginBottom: "20px", position: "relative", zIndex: 1 }}>
            <div style={{ fontFamily: "monospace", fontSize: "10px", color: "#475569", marginBottom: "6px" }}>
              SPACE RISK EVIDENCE:
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {alert.space_top_evidence.map((e, i) => (
                <span
                  key={i}
                  style={{
                    fontFamily: "monospace",
                    fontSize: "10px",
                    background: "#0a1628",
                    border: "1px solid #1e3a5f",
                    color: "#93c5fd",
                    padding: "3px 8px",
                    borderRadius: "4px",
                  }}
                >
                  {e}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Gemini Briefing */}
        {brief && (
          <div style={{ marginBottom: "20px", position: "relative", zIndex: 1 }}>
            <AIThreatBriefing explanation={brief} isLoading={false} />
          </div>
        )}

        {/* Dismiss section */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            background: "#07101d",
            border: "1px solid #1e293b",
            borderRadius: "10px",
            padding: "16px",
            display: "flex",
            gap: "12px",
            alignItems: "flex-end",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: "160px" }}>
            <label style={{ fontFamily: "monospace", fontSize: "10px", color: "#64748b", display: "block", marginBottom: "6px" }}>
              OPERATOR ID
            </label>
            <input
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              style={{
                width: "100%",
                background: "#030712",
                border: "1px solid #1e293b",
                borderRadius: "6px",
                padding: "8px 10px",
                color: "#e2e8f0",
                fontFamily: "monospace",
                fontSize: "12px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: "160px" }}>
            <label style={{ fontFamily: "monospace", fontSize: "10px", color: "#64748b", display: "block", marginBottom: "6px" }}>
              DECISION CODE
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{
                width: "100%",
                background: "#030712",
                border: "1px solid #1e293b",
                borderRadius: "6px",
                padding: "8px 10px",
                color: "#e2e8f0",
                fontFamily: "monospace",
                fontSize: "12px",
                outline: "none",
              }}
            >
              <option value="ACKNOWLEDGED">ACKNOWLEDGED — monitoring</option>
              <option value="ESCALATED">ESCALATED — command notified</option>
              <option value="ACTION_TAKEN">ACTION_TAKEN — response deployed</option>
              <option value="FALSE_POSITIVE">FALSE_POSITIVE — no action needed</option>
            </select>
          </div>
          <button
            onClick={handleDismiss}
            disabled={dismissing}
            style={{
              padding: "9px 24px",
              background: dismissing ? "#1e293b" : `linear-gradient(135deg, ${severityColor}cc, ${severityColor}88)`,
              border: "none",
              borderRadius: "8px",
              color: dismissing ? "#475569" : "#fff",
              fontFamily: "monospace",
              fontSize: "12px",
              fontWeight: 700,
              cursor: dismissing ? "not-allowed" : "pointer",
              letterSpacing: "0.06em",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            {dismissing ? "⏳ RECORDING..." : "✓ CONFIRM & DISMISS"}
          </button>
        </div>

        <style>{`
          @keyframes alertPop { from{transform:scale(0.92);opacity:0} to{transform:scale(1);opacity:1} }
          @keyframes ringPulse { 0%,100%{opacity:0.4;transform:scale(1)} 50%{opacity:0.1;transform:scale(1.02)} }
          @keyframes warningFlash { 0%,100%{opacity:1} 50%{opacity:0.2} }
        `}</style>
      </div>
    </div>
  );
}
