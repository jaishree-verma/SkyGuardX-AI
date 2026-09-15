import React from "react";
import GlossaryTooltip from "./GlossaryTooltip.jsx";

export default function RiskBreakdown({ risk, satellite, conjunction }) {
  const riskScore = risk?.risk_score ?? 0.05;
  const riskPct = Math.round(riskScore * 100);
  const confidencePct = Math.round((risk?.confidence ?? 0.94) * 100);
  const isHighRisk = riskScore >= 0.55;

  const contributors = risk?.risk_contributors || {
    telemetry_anomaly_pct: 40,
    satellite_health_pct: 30,
    conjunction_risk_pct: 30,
  };

  const evidenceList = risk?.top_evidence || satellite?.health_evidence || [
    "Subsystems operating within nominal operating bounds",
  ];

  return (
    <div
      style={{
        background: "var(--panel-raised)",
        border: `1px solid ${isHighRisk ? "rgba(230, 57, 70, 0.4)" : "var(--border)"}`,
        borderRadius: 6,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 800, fontSize: 12, letterSpacing: "0.02em", color: "var(--text)" }}>
          WHY IS THIS RISKY? (EXPLAINABLE REASONING)
        </div>
        <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: isHighRisk ? "#e63946" : "var(--teal)", fontWeight: 700 }}>
          {isHighRisk ? "ELEVATED RISK LEVEL" : "NOMINAL OPERATIONS"}
        </div>
      </div>

      {/* Structured Evidence Checklist */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {evidenceList.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              fontSize: 12,
              color: "var(--text)",
              lineHeight: 1.35,
            }}
          >
            <span
              style={{
                color: isHighRisk ? "#e63946" : "var(--teal)",
                fontWeight: 700,
                fontSize: 14,
                lineHeight: 1,
              }}
            >
              {isHighRisk ? "⚠" : "✓"}
            </span>
            <span>{item}</span>
          </div>
        ))}

        {conjunction && conjunction.miss_distance_km < 2.0 && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              fontSize: 12,
              color: "#e63946",
              lineHeight: 1.35,
              fontWeight: 600,
            }}
          >
            <span style={{ fontSize: 14, lineHeight: 1 }}>⚠</span>
            <span>
              Conjunction detected: Estimated miss distance {conjunction.miss_distance_km} km with {conjunction.object_b} (TCA in {conjunction.time_to_closest_approach_minutes} min)
            </span>
          </div>
        )}
      </div>

      {/* Visual Risk Breakdown Bars */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" }}>
          <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontWeight: 700 }}>
            <GlossaryTooltip term="Risk Score">UNIFIED RISK CONTRIBUTORS</GlossaryTooltip>
          </span>
          <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 800, color: isHighRisk ? "#e63946" : "var(--teal)" }}>
            OVERALL: {riskPct}%
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 11, fontFamily: "var(--font-mono)" }}>
          {/* Telemetry Anomaly Bar */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text)", marginBottom: 3 }}>
              <span>Telemetry Anomaly (AI Model)</span>
              <span style={{ color: "#ff9f1c", fontWeight: 700 }}>{contributors.telemetry_anomaly_pct}%</span>
            </div>
            <div style={{ height: 6, background: "var(--bg)", borderRadius: 3, overflow: "hidden" }}>
              <div
                style={{
                  width: `${contributors.telemetry_anomaly_pct}%`,
                  height: "100%",
                  background: "#ff9f1c",
                  borderRadius: 3,
                }}
              />
            </div>
          </div>

          {/* Satellite Health Bar */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text)", marginBottom: 3 }}>
              <span>Satellite Subsystem Health</span>
              <span style={{ color: "#f5c84c", fontWeight: 700 }}>{contributors.satellite_health_pct}%</span>
            </div>
            <div style={{ height: 6, background: "var(--bg)", borderRadius: 3, overflow: "hidden" }}>
              <div
                style={{
                  width: `${contributors.satellite_health_pct}%`,
                  height: "100%",
                  background: "#f5c84c",
                  borderRadius: 3,
                }}
              />
            </div>
          </div>

          {/* Conjunction Risk Bar */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text)", marginBottom: 3 }}>
              <span>Orbital Conjunction Risk</span>
              <span style={{ color: "#4c9aff", fontWeight: 700 }}>{contributors.conjunction_risk_pct}%</span>
            </div>
            <div style={{ height: 6, background: "var(--bg)", borderRadius: 3, overflow: "hidden" }}>
              <div
                style={{
                  width: `${contributors.conjunction_risk_pct}%`,
                  height: "100%",
                  background: "#4c9aff",
                  borderRadius: 3,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Operator Next Step Banner */}
      <div
        style={{
          background: isHighRisk ? "rgba(230, 57, 70, 0.12)" : "var(--bg)",
          border: `1px solid ${isHighRisk ? "rgba(230, 57, 70, 0.3)" : "var(--border)"}`,
          borderRadius: 4,
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 11,
          fontFamily: "var(--font-mono)",
        }}
      >
        <div>
          <span style={{ color: "var(--text-muted)", marginRight: 6 }}>RECOMMENDED NEXT STEP:</span>
          <strong style={{ color: isHighRisk ? "#ff9f1c" : "var(--teal)" }}>
            {isHighRisk ? "Operator review required" : "Continue nominal monitoring"}
          </strong>
        </div>
        <span style={{ color: "var(--text-muted)", fontSize: 10 }}>
          No autonomous action performed
        </span>
      </div>
    </div>
  );
}
