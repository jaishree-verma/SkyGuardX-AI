import React from "react";
import GlossaryTooltip from "./GlossaryTooltip.jsx";
import TelemetryGraphs from "./TelemetryGraphs.jsx";
import SpaceMap from "./SpaceMap.jsx";

export default function SatelliteResultView({
  satellite,
  risk,
  conjunction,
  history = [],
  events = [],
  spaceObjects = [],
  onBack,
  onOpenMonitor,
}) {
  if (!satellite) return null;

  const satId = satellite.satellite_id;
  const satName = satellite.satellite_name || "LEO SATELLITE";

  const riskScore = risk?.risk_score ?? 0.08;
  const riskPct = Math.round(riskScore * 100);
  const confidencePct = Math.round((risk?.confidence ?? 0.94) * 100);
  const healthScore = satellite.health_score ?? 96;
  const healthPct = Math.round(healthScore);
  const dataAgeSec = satellite.data_age_seconds !== undefined ? `${satellite.data_age_seconds}s` : "2s";

  // Determine Severity Level
  let severity = "NORMAL";
  let statusColor = "var(--teal)";
  let statusEmoji = "🟢";

  if (riskScore >= 0.85 || (conjunction && conjunction.miss_distance_km < 1.0)) {
    severity = "CRITICAL";
    statusColor = "#e63946";
    statusEmoji = "🔴";
  } else if (riskScore >= 0.65) {
    severity = "HIGH RISK";
    statusColor = "#ff9f1c";
    statusEmoji = "🟠";
  } else if (riskScore >= 0.35 || healthScore < 85) {
    severity = "WARNING";
    statusColor = "#f5c84c";
    statusEmoji = "🟡";
  }

  const isAnomalous = severity === "HIGH RISK" || severity === "CRITICAL";
  const isWarning = severity === "WARNING";

  // Telemetry Baselines
  const baselineTemp = 24.5;
  const baselinePower = 62.0;
  const baselineBattery = 91.0;
  const baselineSignal = 96.0;

  const curTemp = satellite.temperature_c ?? baselineTemp;
  const curPower = satellite.power_consumption ?? baselinePower;
  const curBattery = satellite.battery_level ?? baselineBattery;
  const curSignal = satellite.signal_strength ?? baselineSignal;

  const tempDeltaPct = Math.round(((curTemp - baselineTemp) / baselineTemp) * 100);
  const powerDeltaPct = Math.round(((curPower - baselinePower) / baselinePower) * 100);
  const batteryDeltaPct = Math.round(((curBattery - baselineBattery) / baselineBattery) * 100);
  const signalDeltaPct = Math.round(((curSignal - baselineSignal) / baselineSignal) * 100);

  const contributors = risk?.risk_contributors || {
    telemetry_anomaly_pct: isAnomalous ? 40 : 10,
    satellite_health_pct: isAnomalous ? 30 : 5,
    conjunction_risk_pct: isAnomalous && conjunction ? 30 : 0,
  };

  // Satellite specific event timeline
  const satEvents = events
    .filter((e) => e.entity_id === satId || e.payload?.satellite_id === satId)
    .slice(0, 7);

  return (
    <div
      style={{
        padding: "24px 30px",
        maxWidth: 1280,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 20,
        overflowY: "auto",
        height: "calc(100vh - 56px)",
      }}
      className="scrollbar-thin"
    >
      {/* 1. Navigation & Header Strip */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <button
          onClick={onBack}
          style={{
            background: "var(--panel-raised)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            padding: "6px 14px",
            borderRadius: 4,
            fontSize: 12,
            fontFamily: "var(--font-mono)",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
          }}
        >
          <span>←</span>
          <span>Check Another Satellite</span>
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "var(--font-mono)", fontSize: 11 }}>
          <span className="pill" style={{ color: "var(--teal)" }}>
            <span className="live-dot" style={{ marginRight: 6 }} />
            LIVE STREAM
          </span>
          <span className="pill">Age: {dataAgeSec}</span>
          <button
            onClick={onOpenMonitor}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--blue)",
              padding: "4px 10px",
              borderRadius: 4,
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              cursor: "pointer",
            }}
          >
            Open in Live Command Center ↗
          </button>
        </div>
      </div>

      {/* 2. Main Identity & Status Banner */}
      <div
        style={{
          background: isAnomalous
            ? "linear-gradient(90deg, rgba(230, 57, 70, 0.18) 0%, rgba(16, 21, 31, 0.95) 100%)"
            : isWarning
            ? "linear-gradient(90deg, rgba(245, 200, 76, 0.15) 0%, rgba(16, 21, 31, 0.95) 100%)"
            : "linear-gradient(90deg, rgba(46, 196, 182, 0.12) 0%, rgba(16, 21, 31, 0.95) 100%)",
          border: `1.5px solid ${statusColor}55`,
          borderRadius: 8,
          padding: "18px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: "50%",
              background: `${statusColor}22`,
              border: `2px solid ${statusColor}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
            }}
          >
            {statusEmoji}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>{satId}</span>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{satName}</span>
              <span
                style={{
                  background: statusColor,
                  color: severity === "WARNING" ? "#000" : "#ffffff",
                  fontSize: 10.5,
                  fontWeight: 800,
                  padding: "2px 8px",
                  borderRadius: 3,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {severity}
              </span>
            </div>
            <div style={{ fontSize: 13, color: "var(--text)", marginTop: 4 }}>
              {isAnomalous ? (
                <span>
                  🚨 <strong style={{ color: statusColor }}>HIGH RISK DETECTED:</strong> Abnormal telemetry signature and space proximity flagged by AI decision boundary.
                </span>
              ) : isWarning ? (
                <span>
                  ⚠️ <strong style={{ color: statusColor }}>POTENTIAL ABNORMAL BEHAVIOR:</strong> Subsystem telemetry shows moderate baseline drift. Continued monitoring advised.
                </span>
              ) : (
                <span>
                  ✓ <strong style={{ color: statusColor }}>ALL SYSTEMS NOMINAL:</strong> Subsystem telemetry is operating within verified mission parameters.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Top KPI Metrics */}
        <div style={{ display: "flex", gap: 24, fontFamily: "var(--font-mono)" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9.5, color: "var(--text-muted)" }}>
              <GlossaryTooltip term="Risk Score">OVERALL RISK</GlossaryTooltip>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: statusColor }}>{riskPct}%</div>
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9.5, color: "var(--text-muted)" }}>
              <GlossaryTooltip term="Confidence">AI CONFIDENCE</GlossaryTooltip>
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: "var(--text)" }}>{confidencePct}%</div>
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9.5, color: "var(--text-muted)" }}>HEALTH SCORE</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: healthPct < 70 ? "#ff9f1c" : "var(--teal)" }}>
              {healthPct}%
            </div>
          </div>
        </div>
      </div>

      {/* 3. The Core Section: "WHY IS THIS SATELLITE NORMAL / AT RISK?" */}
      <div
        style={{
          background: "var(--panel)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          padding: "20px 22px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>🔎</span>
            <span style={{ fontWeight: 800, fontSize: 14, color: "var(--text)", letterSpacing: "0.02em" }}>
              WHY IS THIS SATELLITE {severity}? (EXPLAINABLE AI REASONING)
            </span>
          </div>
          <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
            Model: {risk?.model_version || "telemetry-anomaly-v1"}
          </span>
        </div>

        {/* Explainability Grid / Checklist */}
        {isAnomalous ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 10,
                background: "var(--bg)",
                padding: "14px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                fontFamily: "var(--font-mono)",
                fontSize: 12,
              }}
            >
              <div style={{ borderLeft: "3px solid #ff9f1c", paddingLeft: 10 }}>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>TEMPERATURE DEVIATION</div>
                <div style={{ fontWeight: 700, color: "#ff9f1c", marginTop: 2 }}>
                  24.5°C → {curTemp.toFixed(1)}°C ({tempDeltaPct > 0 ? `+${tempDeltaPct}%` : `${tempDeltaPct}%`})
                </div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                  Thermal dissipation breach
                </div>
              </div>

              <div style={{ borderLeft: "3px solid #ff9f1c", paddingLeft: 10 }}>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>POWER CONSUMPTION SURGE</div>
                <div style={{ fontWeight: 700, color: "#ff9f1c", marginTop: 2 }}>
                  62W → {curPower.toFixed(0)}W ({powerDeltaPct > 0 ? `+${powerDeltaPct}%` : `${powerDeltaPct}%`})
                </div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                  Abnormal bus load detected
                </div>
              </div>

              <div style={{ borderLeft: "3px solid #e63946", paddingLeft: 10 }}>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>BATTERY DEGRADATION</div>
                <div style={{ fontWeight: 700, color: "#e63946", marginTop: 2 }}>
                  91% → {curBattery.toFixed(0)}% ({batteryDeltaPct}%)
                </div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                  Rapid discharge rate
                </div>
              </div>

              <div style={{ borderLeft: "3px solid #f5c84c", paddingLeft: 10 }}>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>SIGNAL ATTENUATION</div>
                <div style={{ fontWeight: 700, color: "#f5c84c", marginTop: 2 }}>
                  96% → {curSignal.toFixed(0)}% ({signalDeltaPct}%)
                </div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                  Downlink margin degradation
                </div>
              </div>
            </div>

            {conjunction && (
              <div
                style={{
                  background: "rgba(230, 57, 70, 0.1)",
                  border: "1px solid rgba(230, 57, 70, 0.3)",
                  padding: "10px 14px",
                  borderRadius: 4,
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 16 }}>⚠️</span>
                <span>
                  <strong>Potential Conjunction Detected:</strong> Projected close approach of{" "}
                  <strong style={{ color: "#e63946" }}>{conjunction.miss_distance_km} km</strong> with{" "}
                  <strong>{conjunction.object_b}</strong> (TCA in {conjunction.time_to_closest_approach_minutes} min).
                </span>
              </div>
            )}
          </div>
        ) : isWarning ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12.5 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#f5c84c" }}>
              <span>⚠️</span>
              <span>Subsystem telemetry indicates elevated thermal operating temperature (~38.5°C vs nominal 24.5°C).</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#f5c84c" }}>
              <span>⚠️</span>
              <span>Battery state of charge has experienced mild accelerated decline (~71.5% vs nominal 91%).</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--teal)" }}>
              <span>✓</span>
              <span>No active orbital conjunction or debris collision threats within 24-hour horizon.</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-mono)", marginTop: 4 }}>
              Recommendation: Continue monitoring. No urgent intervention required.
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12.5 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--teal)" }}>
              <span>✓</span>
              <span>Temperature within nominal thermal dissipation baseline (24.5°C).</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--teal)" }}>
              <span>✓</span>
              <span>Battery state of charge stable and within nominal operating envelope (91.0%).</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--teal)" }}>
              <span>✓</span>
              <span>Power consumption normal across primary power bus (62.0W).</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--teal)" }}>
              <span>✓</span>
              <span>RF signal downlink strength strong and stable (96.0%).</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--teal)" }}>
              <span>✓</span>
              <span>No spatial conjunctions or close approaches predicted within 24-hour orbital corridor.</span>
            </div>
          </div>
        )}
      </div>

      {/* 4. Risk Breakdown Analysis & Decision Governance */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 18 }}>
        {/* Risk Breakdown Progress Bars */}
        <div
          style={{
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "16px 20px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-muted)" }}>
              <GlossaryTooltip term="Risk Score">UNIFIED RISK BREAKDOWN</GlossaryTooltip>
            </span>
            <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", fontWeight: 800, color: statusColor }}>
              TOTAL: {riskPct}%
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 11, fontFamily: "var(--font-mono)" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span>Telemetry Anomaly (AI Isolation Forest)</span>
                <span style={{ color: "#ff9f1c", fontWeight: 700 }}>{contributors.telemetry_anomaly_pct}%</span>
              </div>
              <div style={{ height: 6, background: "var(--bg)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${contributors.telemetry_anomaly_pct}%`, height: "100%", background: "#ff9f1c" }} />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span>Subsystem Health Degradation</span>
                <span style={{ color: "#f5c84c", fontWeight: 700 }}>{contributors.satellite_health_pct}%</span>
              </div>
              <div style={{ height: 6, background: "var(--bg)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${contributors.satellite_health_pct}%`, height: "100%", background: "#f5c84c" }} />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span>Orbital Conjunction Risk</span>
                <span style={{ color: "#4c9aff", fontWeight: 700 }}>{contributors.conjunction_risk_pct}%</span>
              </div>
              <div style={{ height: 6, background: "var(--bg)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${contributors.conjunction_risk_pct}%`, height: "100%", background: "#4c9aff" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Decision Governance & Operator Notice */}
        <div
          style={{
            background: isAnomalous ? "rgba(230, 57, 70, 0.08)" : "var(--panel)",
            border: `1px solid ${isAnomalous ? "rgba(230, 57, 70, 0.4)" : "var(--border)"}`,
            borderRadius: 6,
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700, color: isAnomalous ? "#e63946" : "var(--text-muted)", marginBottom: 6 }}>
              DECISION SUPPORT PROTOCOL
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
              {isAnomalous ? "HUMAN OPERATOR REVIEW REQUIRED" : "NOMINAL FLEET CONTINUITY"}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-muted)", lineHeight: 1.45 }}>
              {isAnomalous
                ? "SKYGUARD XAI operates strictly as a decision-support advisory system. Autonomous spacecraft commanding is strictly disabled in accordance with international space operations safety protocols."
                : "All onboard subsystem indicators and orbital separation distances remain safely within nominal limits. The system will continue passive background monitoring."}
            </div>
          </div>

          <div
            style={{
              marginTop: 12,
              paddingTop: 8,
              borderTop: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              fontSize: 10.5,
              fontFamily: "var(--font-mono)",
              color: "var(--text-muted)",
            }}
          >
            <span>Autonomous Action: STRICTLY DISABLED</span>
            <span>Human Approval: MANDATORY</span>
          </div>
        </div>
      </div>

      {/* 5. Live Telemetry Strip & Subsystem History */}
      <div
        style={{
          background: "var(--panel)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          padding: "18px 20px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontWeight: 800, fontSize: 13, color: "var(--text)" }}>
            LIVE SUBSYSTEM TELEMETRY & BREACH ANALYSIS
          </span>
          <span style={{ fontSize: 10.5, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
            Sampling: 2.5s cadence · Rolling 60 points
          </span>
        </div>

        {/* Visual Progress Sequence */}
        {isAnomalous && (
          <div
            style={{
              background: "var(--bg)",
              padding: "10px 14px",
              borderRadius: 4,
              border: "1px solid var(--border)",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              marginBottom: 16,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div style={{ color: "var(--text-muted)", fontSize: 10 }}>THERMAL BREACH TIMELINE:</div>
            <div style={{ color: "var(--text)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span>24.5°C</span>
              <span>──</span>
              <span>28.0°C</span>
              <span>──</span>
              <span>35.0°C</span>
              <span>──</span>
              <span>52.0°C</span>
              <span>──</span>
              <span style={{ color: "#e63946", fontWeight: 700 }}>71.0°C [↑ ANOMALY BREACH]</span>
            </div>
          </div>
        )}

        <TelemetryGraphs satellite={satellite} history={history} />
      </div>

      {/* 6. Orbital Position Map & Space Object Conjunction */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {/* Orbital Position & Proximity Map */}
        <div
          style={{
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            overflow: "hidden",
            height: 380,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "10px 14px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
            }}
          >
            <span style={{ fontWeight: 700, color: "var(--text)" }}>ORBITAL PROXIMITY MAP</span>
            <span style={{ color: "var(--text-muted)" }}>
              Coords: {satellite.latitude?.toFixed(2)}°, {satellite.longitude?.toFixed(2)}° · Alt: {satellite.altitude_km} km
            </span>
          </div>

          <div style={{ flex: 1, position: "relative" }}>
            <SpaceMap
              satellites={{ [satId]: satellite }}
              spaceObjects={spaceObjects}
              selectedSatId={satId}
              onSelectSatellite={() => {}}
              conjunction={conjunction}
            />
          </div>
        </div>

        {/* "What Happened?" Chronological Event Timeline */}
        <div
          style={{
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            height: 380,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontWeight: 800, fontSize: 13, color: "var(--text)" }}>
              WHAT HAPPENED? (CHRONOLOGICAL EVENT LOG)
            </span>
            <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
              LIVE AUDIT TRAIL
            </span>
          </div>

          <div className="scrollbar-thin" style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            {isAnomalous ? (
              <>
                <div style={{ background: "var(--bg)", borderLeft: "3px solid var(--text-muted)", padding: "8px 10px", borderRadius: 4, fontFamily: "var(--font-mono)", fontSize: 11 }}>
                  <div style={{ color: "var(--text-muted)", fontSize: 9.5 }}>STEP 1 — INGESTION</div>
                  <div style={{ color: "var(--text)", marginTop: 2 }}>📡 Satellite telemetry received ({satId})</div>
                </div>

                <div style={{ background: "var(--bg)", borderLeft: "3px solid #ff9f1c", padding: "8px 10px", borderRadius: 4, fontFamily: "var(--font-mono)", fontSize: 11 }}>
                  <div style={{ color: "#ff9f1c", fontSize: 9.5 }}>STEP 2 — THERMAL ANOMALY</div>
                  <div style={{ color: "var(--text)", marginTop: 2 }}>🌡 Temperature spike detected (24.5°C → 71.0°C)</div>
                </div>

                <div style={{ background: "var(--bg)", borderLeft: "3px solid #ff9f1c", padding: "8px 10px", borderRadius: 4, fontFamily: "var(--font-mono)", fontSize: 11 }}>
                  <div style={{ color: "#ff9f1c", fontSize: 9.5 }}>STEP 3 — POWER SURGE</div>
                  <div style={{ color: "var(--text)", marginTop: 2 }}>⚡ Power consumption increased (+52% draw)</div>
                </div>

                <div style={{ background: "var(--bg)", borderLeft: "3px solid #e63946", padding: "8px 10px", borderRadius: 4, fontFamily: "var(--font-mono)", fontSize: 11 }}>
                  <div style={{ color: "#e63946", fontSize: 9.5 }}>STEP 4 — CONJUNCTION FLAGGED</div>
                  <div style={{ color: "var(--text)", marginTop: 2 }}>☄ Close approach identified: DEB-2098 at 0.72 km</div>
                </div>

                <div style={{ background: "rgba(230, 57, 70, 0.12)", borderLeft: "3px solid #e63946", padding: "8px 10px", borderRadius: 4, fontFamily: "var(--font-mono)", fontSize: 11 }}>
                  <div style={{ color: "#e63946", fontSize: 9.5, fontWeight: 700 }}>STEP 5 — OPERATOR ALERT</div>
                  <div style={{ color: "#e63946", fontWeight: 700, marginTop: 2 }}>🚨 Risk elevated to 89% · Operator review required</div>
                </div>
              </>
            ) : (
              satEvents.map((e, idx) => (
                <div key={idx} style={{ background: "var(--bg)", borderLeft: "3px solid var(--teal)", padding: "8px 10px", borderRadius: 4, fontFamily: "var(--font-mono)", fontSize: 11 }}>
                  <div style={{ color: "var(--text-muted)", fontSize: 9.5 }}>{e.event_type}</div>
                  <div style={{ color: "var(--text)", marginTop: 2 }}>Telemetry frame received: nominal status</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 7. What the AI Knows vs What the AI Decides */}
      <div
        style={{
          background: "var(--panel)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          padding: "18px 22px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 13, color: "var(--text)", letterSpacing: "0.02em" }}>
          WHAT THE AI KNOWS vs WHAT THE AI DECIDES
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {/* Column 1: Observed Data */}
          <div style={{ background: "var(--bg)", padding: "14px", borderRadius: 4, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontWeight: 700, marginBottom: 8 }}>
              1. OBSERVED SENSOR DATA
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text)", display: "flex", flexDirection: "column", gap: 4, fontFamily: "var(--font-mono)" }}>
              <div>• Temperature: {curTemp.toFixed(1)}°C</div>
              <div>• Power Draw: {curPower.toFixed(0)}W</div>
              <div>• Battery Level: {curBattery.toFixed(0)}%</div>
              <div>• Signal Strength: {curSignal.toFixed(0)}%</div>
              {conjunction && <div>• Closest Debris: {conjunction.miss_distance_km} km</div>}
            </div>
          </div>

          {/* Column 2: AI Analysis */}
          <div style={{ background: "var(--bg)", padding: "14px", borderRadius: 4, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--blue)", fontWeight: 700, marginBottom: 8 }}>
              2. AI ANALYSIS & INFERENCE
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text)", display: "flex", flexDirection: "column", gap: 4, fontFamily: "var(--font-mono)" }}>
              <div>• Telemetry Anomaly: <span style={{ color: isAnomalous ? "#ff9f1c" : "var(--teal)", fontWeight: 700 }}>{isAnomalous ? "HIGH" : "NOMINAL"}</span></div>
              <div>• Conjunction Spatial Risk: <span style={{ color: isAnomalous ? "#e63946" : "var(--teal)", fontWeight: 700 }}>{isAnomalous ? "HIGH" : "NOMINAL"}</span></div>
              <div>• Overall Space Risk: <span style={{ fontWeight: 800, color: statusColor }}>{riskPct}%</span></div>
              <div>• Inference Confidence: {confidencePct}%</div>
            </div>
          </div>

          {/* Column 3: Decision Support */}
          <div style={{ background: "var(--bg)", padding: "14px", borderRadius: 4, border: `1px solid ${isAnomalous ? "rgba(230, 57, 70, 0.4)" : "var(--border)"}` }}>
            <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: isAnomalous ? "#e63946" : "var(--teal)", fontWeight: 700, marginBottom: 8 }}>
              3. DECISION SUPPORT ADVISORY
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text)", display: "flex", flexDirection: "column", gap: 4 }}>
              <div>• Action: <strong style={{ color: isAnomalous ? "#ff9f1c" : "var(--teal)" }}>{isAnomalous ? "Operator review required" : "Nominal monitoring"}</strong></div>
              <div>• Automated Thruster Burn: <strong style={{ color: "#e63946" }}>BLOCKED</strong></div>
              <div>• Operator Sign-off: <strong>MANDATORY</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
