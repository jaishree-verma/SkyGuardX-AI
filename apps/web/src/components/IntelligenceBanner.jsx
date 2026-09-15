import React from "react";
import GlossaryTooltip from "./GlossaryTooltip.jsx";

export default function IntelligenceBanner({
  riskySatellite,
  riskData,
  conjunction,
  onInspect,
  fleetCount = 6,
}) {
  const isHighRisk =
    riskData &&
    (riskData.status === "HIGH" ||
      riskData.status === "CRITICAL" ||
      (riskData.risk_score && riskData.risk_score >= 0.55));

  if (!isHighRisk) {
    return (
      <div
        style={{
          background: "linear-gradient(90deg, rgba(46, 196, 182, 0.08) 0%, rgba(16, 21, 31, 0.9) 100%)",
          borderBottom: "1px solid rgba(46, 196, 182, 0.25)",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "rgba(46, 196, 182, 0.15)",
              border: "1px solid var(--teal)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              color: "var(--teal)",
            }}
          >
            ✓
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", display: "flex", alignItems: "center", gap: 8 }}>
              <span>SPACE ENVIRONMENT NOMINAL</span>
              <span style={{ fontSize: 11, color: "var(--teal)", fontFamily: "var(--font-mono)", fontWeight: 500 }}>
                · 0 CRITICAL THREATS
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>
              Continuously monitoring {fleetCount} LEO satellites and nearby space debris objects. All orbital parameters and subsystem telemetry within nominal operating envelopes.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, fontFamily: "var(--font-mono)", fontSize: 11 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "var(--text-muted)", fontSize: 10 }}>AI ANOMALY MODEL</div>
            <div style={{ fontWeight: 600, color: "var(--teal)" }}>telemetry-anomaly-v1</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "var(--text-muted)", fontSize: 10 }}>DECISION STATE</div>
            <div style={{ fontWeight: 600, color: "var(--text)" }}>CONTINUE MONITORING</div>
          </div>
        </div>
      </div>
    );
  }

  // Abnormal / Threat Detected state
  const satId = riskySatellite?.satellite_id || "SAT-1042";
  const satName = riskySatellite?.satellite_name || "SKYGUARD-LEO-PRIMARY";
  const riskPct = riskData?.risk_score ? (riskData.risk_score * 100).toFixed(0) : "89";
  const confidencePct = riskData?.confidence ? (riskData.confidence * 100).toFixed(0) : "94";
  const healthPct = riskySatellite?.health_score ? riskySatellite.health_score.toFixed(0) : "82";
  const status = riskData?.status || "HIGH RISK";

  return (
    <div
      style={{
        background: "linear-gradient(90deg, rgba(230, 57, 70, 0.16) 0%, rgba(16, 21, 31, 0.95) 100%)",
        borderBottom: "1px solid rgba(230, 57, 70, 0.5)",
        padding: "10px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "rgba(230, 57, 70, 0.2)",
            border: "1.5px solid #e63946",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
          }}
        >
          🚨
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontWeight: 800, fontSize: 14, color: "#e63946", letterSpacing: "0.02em" }}>
              HIGH SPACE RISK DETECTED
            </span>
            <span
              style={{
                background: "#e63946",
                color: "#ffffff",
                fontSize: 10,
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: 3,
                fontFamily: "var(--font-mono)",
              }}
            >
              {satId}
            </span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{satName}</span>
          </div>

          <div style={{ fontSize: 12, color: "var(--text)", marginTop: 3 }}>
            AI detected <strong style={{ color: "#ff9f1c" }}>multivariate telemetry anomaly</strong> (thermal & power surge) +{" "}
            <strong style={{ color: "#e63946" }}>elevated conjunction risk</strong> with DEB-2098{" "}
            {conjunction?.miss_distance_km ? `(${conjunction.miss_distance_km} km miss distance)` : "(0.72 km estimated miss distance)"}.
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 20, flexShrink: 0 }}>
        <div style={{ textAlign: "center", fontFamily: "var(--font-mono)" }}>
          <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.04em" }}>
            <GlossaryTooltip term="Risk Score">OVERALL RISK</GlossaryTooltip>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#e63946" }}>{riskPct}%</div>
        </div>

        <div style={{ textAlign: "center", fontFamily: "var(--font-mono)" }}>
          <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.04em" }}>
            <GlossaryTooltip term="Confidence">AI CONFIDENCE</GlossaryTooltip>
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text)" }}>{confidencePct}%</div>
        </div>

        <div style={{ textAlign: "center", fontFamily: "var(--font-mono)" }}>
          <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.04em" }}>HEALTH</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#ff9f1c" }}>{healthPct}%</div>
        </div>

        <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: 16 }}>
          <div style={{ fontSize: 10, color: "#ff9f1c", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
            ACTION REQUIRED
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
            Operator review required
          </div>
          <button
            onClick={() => onInspect(satId)}
            style={{
              background: "#e63946",
              color: "#ffffff",
              border: "none",
              padding: "5px 12px",
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Inspect Intelligence →
          </button>
        </div>
      </div>
    </div>
  );
}
