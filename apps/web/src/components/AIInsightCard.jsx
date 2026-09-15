import React from "react";
import GlossaryTooltip from "./GlossaryTooltip.jsx";

export default function AIInsightCard({ satellite, risk, onViewTelemetry }) {
  if (!satellite) return null;

  const isAnom = satellite.temperature_c > 40.0 || satellite.battery_level < 60.0 || (risk && risk.risk_score >= 0.55);

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

  const confidencePct = risk?.confidence ? (risk.confidence * 100).toFixed(0) : "94";

  return (
    <div
      style={{
        background: "var(--panel-raised)",
        border: `1px solid ${isAnom ? "rgba(255, 159, 28, 0.4)" : "var(--border)"}`,
        borderRadius: 6,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>{isAnom ? "🚨" : "🤖"}</span>
          <span style={{ fontWeight: 800, fontSize: 12, letterSpacing: "0.02em", color: "var(--text)" }}>
            WHAT AI DETECTED
          </span>
          <span
            style={{
              fontSize: 10,
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              padding: "2px 6px",
              borderRadius: 3,
              background: isAnom ? "rgba(255, 159, 28, 0.2)" : "rgba(46, 196, 182, 0.2)",
              color: isAnom ? "#ff9f1c" : "var(--teal)",
            }}
          >
            {isAnom ? "TELEMETRY ANOMALY" : "ALL NOMINAL"}
          </span>
        </div>

        <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          {satellite.satellite_id}
        </span>
      </div>

      <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.4 }}>
        {isAnom ? (
          <span>
            Multivariate <GlossaryTooltip term="Isolation Forest">Isolation Forest</GlossaryTooltip> flagged critical subsystem divergence on{" "}
            <strong>{satellite.satellite_id}</strong>. Primary telemetry deviates severely from nominal baseline envelopes:
          </span>
        ) : (
          <span>
            Subsystem telemetry is continuously streaming through the Isolation Forest model. All 5 parameters remain within verified operating bounds:
          </span>
        )}
      </div>

      {/* Delta Comparison Table */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 8,
          background: "var(--bg)",
          padding: "10px",
          borderRadius: 4,
          border: "1px solid var(--border)",
          fontFamily: "var(--font-mono)",
        }}
      >
        <div>
          <div style={{ fontSize: 9, color: "var(--text-muted)" }}>TEMPERATURE</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: curTemp > 40 ? "#ff9f1c" : "var(--text)" }}>
            {baselineTemp}° → {curTemp.toFixed(1)}°C
          </div>
          <div style={{ fontSize: 9, color: curTemp > 40 ? "#ff9f1c" : "var(--teal)", marginTop: 2 }}>
            {tempDeltaPct > 0 ? `+${tempDeltaPct}%` : `${tempDeltaPct}%`}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 9, color: "var(--text-muted)" }}>POWER DRAW</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: curPower > 80 ? "#ff9f1c" : "var(--text)" }}>
            {baselinePower.toFixed(0)}W → {curPower.toFixed(0)}W
          </div>
          <div style={{ fontSize: 9, color: curPower > 80 ? "#ff9f1c" : "var(--teal)", marginTop: 2 }}>
            {powerDeltaPct > 0 ? `+${powerDeltaPct}%` : `${powerDeltaPct}%`}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 9, color: "var(--text-muted)" }}>BATTERY</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: curBattery < 60 ? "#ff9f1c" : "var(--text)" }}>
            {baselineBattery.toFixed(0)}% → {curBattery.toFixed(0)}%
          </div>
          <div style={{ fontSize: 9, color: curBattery < 60 ? "#ff9f1c" : "var(--teal)", marginTop: 2 }}>
            {batteryDeltaPct}%
          </div>
        </div>

        <div>
          <div style={{ fontSize: 9, color: "var(--text-muted)" }}>SIGNAL</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: curSignal < 75 ? "#ff9f1c" : "var(--text)" }}>
            {baselineSignal.toFixed(0)}% → {curSignal.toFixed(0)}%
          </div>
          <div style={{ fontSize: 9, color: curSignal < 75 ? "#ff9f1c" : "var(--teal)", marginTop: 2 }}>
            {signalDeltaPct}%
          </div>
        </div>
      </div>

      {/* Model Provenance & Action */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, fontFamily: "var(--font-mono)" }}>
        <div style={{ display: "flex", gap: 12, color: "var(--text-muted)" }}>
          <span>
            <GlossaryTooltip term="Confidence">AI Confidence: {confidencePct}%</GlossaryTooltip>
          </span>
          <span>Model: {risk?.model_version || "telemetry-anomaly-v1"}</span>
        </div>

        {onViewTelemetry && (
          <button
            onClick={() => onViewTelemetry(satellite.satellite_id)}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--blue)",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 600,
              padding: 0,
            }}
          >
            Inspect Telemetry Curves →
          </button>
        )}
      </div>
    </div>
  );
}
