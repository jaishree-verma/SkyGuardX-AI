import React from "react";

function SparklineChart({ label, points, unit, normalRange, color, isAnomTrigger }) {
  if (!points || points.length === 0) {
    return (
      <div style={{ background: "var(--panel-raised)", padding: "8px 10px", borderRadius: 4, border: "1px solid var(--border)" }}>
        <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{label}</div>
        <div style={{ height: 44, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 11 }}>
          Awaiting telemetry data...
        </div>
      </div>
    );
  }

  const values = points.map((p) => p.val);
  const minVal = Math.min(...values, normalRange[0] * 0.9);
  const maxVal = Math.max(...values, normalRange[1] * 1.1);
  const range = maxVal - minVal || 1.0;

  const width = 280;
  const height = 48;
  const padding = 4;

  const coords = points.map((p, i) => {
    const x = padding + (i / Math.max(1, points.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((p.val - minVal) / range) * (height - 2 * padding);
    return { x, y, val: p.val, isAnom: p.isAnom };
  });

  const pathD = coords.reduce(
    (acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
    ""
  );

  const currentVal = values[values.length - 1];
  const isOutOfRange = currentVal < normalRange[0] || currentVal > normalRange[1];

  return (
    <div
      style={{
        background: "var(--panel-raised)",
        padding: "8px 10px",
        borderRadius: 4,
        border: `1px solid ${isOutOfRange ? "rgba(255, 159, 28, 0.4)" : "var(--border)"}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>{label}</span>
        <span
          style={{
            fontSize: 12,
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            color: isOutOfRange ? "#ff9f1c" : color,
          }}
        >
          {currentVal?.toFixed(1)} {unit}
          {isOutOfRange && (
            <span style={{ fontSize: 9, marginLeft: 4, background: "rgba(255, 159, 28, 0.2)", padding: "1px 4px", borderRadius: 2 }}>
              OUT OF BOUNDS
            </span>
          )}
        </span>
      </div>

      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
        {/* Nominal range indicator band */}
        <line
          x1="0"
          x2={width}
          y1={height - padding - ((normalRange[0] - minVal) / range) * (height - 2 * padding)}
          y2={height - padding - ((normalRange[0] - minVal) / range) * (height - 2 * padding)}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeDasharray="2, 4"
        />
        <line
          x1="0"
          x2={width}
          y1={height - padding - ((normalRange[1] - minVal) / range) * (height - 2 * padding)}
          y2={height - padding - ((normalRange[1] - minVal) / range) * (height - 2 * padding)}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeDasharray="2, 4"
        />

        {/* Data curve */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />

        {/* Anomaly and latest points */}
        {coords.map((pt, i) => {
          if (pt.isAnom || (isAnomTrigger && i >= coords.length - 2)) {
            return (
              <circle
                key={i}
                cx={pt.x}
                cy={pt.y}
                r="3.5"
                fill="#e63946"
                stroke="#ffffff"
                strokeWidth="1"
              />
            );
          }
          if (i === coords.length - 1) {
            return (
              <circle
                key={i}
                cx={pt.x}
                cy={pt.y}
                r="2.5"
                fill={color}
              />
            );
          }
          return null;
        })}
      </svg>
    </div>
  );
}

export default function TelemetryGraphs({ satellite, history = [] }) {
  if (!satellite) {
    return (
      <div style={{ color: "var(--text-muted)", fontSize: 12, padding: "20px", textAlign: "center" }}>
        Select a satellite to inspect telemetry curves
      </div>
    );
  }

  // Extract metric series from history
  const points = history.length > 0 ? history : satellite.telemetry_history || [];
  const tempPoints = points.map((p) => ({ val: p.temperature_c, isAnom: p.temperature_c > 40.0 }));
  const powerPoints = points.map((p) => ({ val: p.power_consumption, isAnom: p.power_consumption > 80.0 }));
  const batteryPoints = points.map((p) => ({ val: p.battery_level, isAnom: p.battery_level < 60.0 }));
  const signalPoints = points.map((p) => ({ val: p.signal_strength, isAnom: p.signal_strength < 75.0 }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
          SUBSYSTEM TELEMETRY STREAM ({points.length} PTS)
        </div>
        <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          NORMAL VS ANOMALOUS REGIONS
        </div>
      </div>

      <SparklineChart
        label="TEMPERATURE (°C)"
        points={tempPoints}
        unit="°C"
        normalRange={[15.0, 35.0]}
        color="#2ec4b6"
      />

      <SparklineChart
        label="POWER CONSUMPTION (W)"
        points={powerPoints}
        unit="W"
        normalRange={[45.0, 75.0]}
        color="#4c9aff"
      />

      <SparklineChart
        label="BATTERY LEVEL (%)"
        points={batteryPoints}
        unit="%"
        normalRange={[70.0, 100.0]}
        color="#2ec4b6"
      />

      <SparklineChart
        label="SIGNAL STRENGTH (%)"
        points={signalPoints}
        unit="%"
        normalRange={[80.0, 100.0]}
        color="#f5c84c"
      />
    </div>
  );
}
