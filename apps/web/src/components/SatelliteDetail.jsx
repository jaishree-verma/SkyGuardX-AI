import React from "react";
import TelemetryGraphs from "./TelemetryGraphs.jsx";

export default function SatelliteDetail({ satellite, risk, conjunction, history }) {
  if (!satellite) {
    return (
      <div style={{ padding: "30px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
        Select a satellite from the map or fleet table to view real-time diagnostics and AI decision evidence.
      </div>
    );
  }

  const satRisk = risk || {};
  const riskPct = satRisk.risk_score ? (satRisk.risk_score * 100).toFixed(0) : "5";
  const confidencePct = satRisk.confidence ? (satRisk.confidence * 100).toFixed(0) : "95";
  const status = satRisk.status || satellite.health_status || "NORMAL";

  const isCritical = status === "CRITICAL";
  const isHigh = status === "HIGH" || status === "HIGH_RISK";

  const statusColor = isCritical ? "#e63946" : isHigh ? "#ff9f1c" : status === "WARNING" ? "#f5c84c" : "#2ec4b6";

  const contributors = satRisk.risk_contributors || {
    telemetry_anomaly_pct: 40,
    satellite_health_pct: 30,
    conjunction_risk_pct: 30,
  };

  const topEvidence = satRisk.top_evidence || satellite.health_evidence || ["Nominal subsystem operational parameters"];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--panel)", overflowY: "auto" }} className="scrollbar-thin">
      {/* Header Info */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", background: "var(--panel-raised)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)" }}>{satellite.satellite_id}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{satellite.satellite_name} · LEO Constellation</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <span
              style={{
                display: "inline-block",
                padding: "3px 8px",
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                background: `${statusColor}22`,
                color: statusColor,
                border: `1px solid ${statusColor}55`,
              }}
            >
              {status}
            </span>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4, fontFamily: "var(--font-mono)" }}>
              Data Age: {satellite.data_age_seconds !== undefined ? `${satellite.data_age_seconds}s` : "<2s"}
            </div>
          </div>
        </div>

        {/* Orbit coordinate strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 8,
            marginTop: 12,
            padding: "8px",
            background: "var(--bg)",
            borderRadius: 4,
            border: "1px solid var(--border)",
            fontSize: 11,
            fontFamily: "var(--font-mono)",
          }}
        >
          <div>
            <div style={{ color: "var(--text-muted)", fontSize: 9 }}>LATITUDE</div>
            <div style={{ fontWeight: 600 }}>{satellite.latitude?.toFixed(2)}°</div>
          </div>
          <div>
            <div style={{ color: "var(--text-muted)", fontSize: 9 }}>LONGITUDE</div>
            <div style={{ fontWeight: 600 }}>{satellite.longitude?.toFixed(2)}°</div>
          </div>
          <div>
            <div style={{ color: "var(--text-muted)", fontSize: 9 }}>ALTITUDE</div>
            <div style={{ fontWeight: 600 }}>{satellite.altitude_km} km</div>
          </div>
          <div>
            <div style={{ color: "var(--text-muted)", fontSize: 9 }}>VELOCITY</div>
            <div style={{ fontWeight: 600 }}>{satellite.velocity_kms} km/s</div>
          </div>
        </div>
      </div>

      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Unified Risk & Health Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {/* Health Card */}
          <div style={{ background: "var(--panel-raised)", padding: "12px", borderRadius: 4, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: 4 }}>
              SUBSYSTEM HEALTH
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-mono)", color: satellite.health_score < 70 ? "#ff9f1c" : "#2ec4b6" }}>
              {satellite.health_score?.toFixed(0)}%
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
              Confidence: {((satellite.health_confidence || 0.95) * 100).toFixed(0)}%
            </div>
          </div>

          {/* Unified Risk Card */}
          <div style={{ background: "var(--panel-raised)", padding: "12px", borderRadius: 4, border: `1px solid ${isHigh ? "rgba(255, 159, 28, 0.4)" : "var(--border)"}` }}>
            <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: 4 }}>
              OVERALL SPACE RISK
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-mono)", color: Number(riskPct) > 50 ? "#e63946" : "#2ec4b6" }}>
              {riskPct}%
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
              AI Confidence: {confidencePct}%
            </div>
          </div>
        </div>

        {/* Risk Contributors Weight Breakdown */}
        <div style={{ background: "var(--panel-raised)", padding: "12px", borderRadius: 4, border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: 8, fontWeight: 700 }}>
            UNIFIED RISK CONTRIBUTORS
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11, fontFamily: "var(--font-mono)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Telemetry Anomaly (AI Model)</span>
              <span style={{ fontWeight: 600, color: "var(--amber)" }}>{contributors.telemetry_anomaly_pct}% weight</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Subsystem Health Risk</span>
              <span style={{ fontWeight: 600, color: "var(--gold)" }}>{contributors.satellite_health_pct}% weight</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Orbital Conjunction Risk</span>
              <span style={{ fontWeight: 600, color: "var(--blue)" }}>{contributors.conjunction_risk_pct}% weight</span>
            </div>
          </div>
        </div>

        {/* AI Anomaly & Health Evidence List */}
        <div style={{ background: "var(--panel-raised)", padding: "12px", borderRadius: 4, border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: 8, fontWeight: 700 }}>
            AI REASONING & STRUCTURED EVIDENCE
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {topEvidence.map((ev, i) => (
              <div
                key={i}
                style={{
                  fontSize: 12,
                  color: "var(--text)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  lineHeight: 1.4,
                }}
              >
                <span style={{ color: "#ff9f1c", fontWeight: 700 }}>•</span>
                <span>{ev}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Conjunction Assessment */}
        {conjunction && (
          <div
            style={{
              background: conjunction.miss_distance_km < 2.0 ? "rgba(230, 57, 70, 0.08)" : "var(--panel-raised)",
              padding: "12px",
              borderRadius: 4,
              border: `1px solid ${conjunction.miss_distance_km < 2.0 ? "rgba(230, 57, 70, 0.4)" : "var(--border)"}`,
            }}
          >
            <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: 6, fontWeight: 700 }}>
              CONJUNCTION / CLOSE APPROACH MONITOR
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11, fontFamily: "var(--font-mono)", marginBottom: 8 }}>
              <div>Secondary: <span style={{ fontWeight: 700, color: "#a855f7" }}>{conjunction.object_b}</span></div>
              <div>Miss Distance: <span style={{ fontWeight: 700, color: "#e63946" }}>{conjunction.miss_distance_km} km</span></div>
              <div>TCA Estimate: <span>{conjunction.time_to_closest_approach_minutes} min</span></div>
              <div>Risk Category: <span style={{ fontWeight: 700, color: "#e63946" }}>{conjunction.risk_level}</span></div>
            </div>

            {/* Candidate Maneuvers Notice */}
            <div style={{ fontSize: 11, color: "var(--text-muted)", borderTop: "1px solid var(--border)", paddingTop: 8 }}>
              <div style={{ fontWeight: 600, color: "var(--blue)", marginBottom: 4 }}>
                SIMULATED MANEUVER RECOMMENDATIONS:
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 6 }}>
                ⚠️ Human Operator Review Required. Autonomous spacecraft commanding is strictly disabled.
              </div>
              {(conjunction.candidate_maneuvers || []).map((m) => (
                <div key={m.id} style={{ fontSize: 10, fontFamily: "var(--font-mono)", margin: "3px 0", color: "var(--text)" }}>
                  • <span style={{ fontWeight: 600 }}>{m.id}</span>: {m.label} (Δv: {m.delta_v_m_s} m/s)
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Telemetry Charts */}
        <TelemetryGraphs satellite={satellite} history={history} />

        {/* Model Transparency & Provenance Strip */}
        <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)", borderTop: "1px solid var(--border)", paddingTop: 8 }}>
          <div>Model Version: {satRisk.model_version || "telemetry-anomaly-v1"}</div>
          <div>Decision Rule: Deterministic Multi-Layer Risk Boundary</div>
          <div>IBM Z Boundary: Simulated Transactional Score Wrapper</div>
        </div>
      </div>
    </div>
  );
}
