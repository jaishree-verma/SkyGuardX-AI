import { useState, useEffect } from "react";

function SeverityDot({ severity }) {
  const color = {
    CRITICAL: "#f87171",
    HIGH: "#fb923c",
    MEDIUM: "#f59e0b",
    LOW: "#4ade80",
  }[severity] || "#94a3b8";
  return (
    <span
      style={{
        display: "inline-block",
        width: "7px",
        height: "7px",
        borderRadius: "50%",
        background: color,
        boxShadow: `0 0 5px ${color}`,
        marginRight: "5px",
        flexShrink: 0,
      }}
    />
  );
}

function CTIBar({ value }) {
  const pct = Math.min(1, Math.max(0, value));
  const color = pct >= 0.75 ? "#f87171" : pct >= 0.55 ? "#fb923c" : pct >= 0.35 ? "#f59e0b" : "#4ade80";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div
        style={{
          flex: 1,
          height: "4px",
          background: "#1e293b",
          borderRadius: "2px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct * 100}%`,
            background: color,
            boxShadow: `0 0 6px ${color}`,
            transition: "width 0.6s ease",
          }}
        />
      </div>
      <span style={{ fontFamily: "monospace", fontSize: "10px", color, minWidth: "30px" }}>
        {(pct * 100).toFixed(0)}%
      </span>
    </div>
  );
}

export default function ConvergenceMonitor({ onAlertSelect }) {
  const [alerts, setAlerts] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchData = async () => {
    try {
      const [alertsRes, statusRes] = await Promise.all([
        fetch("/api/v1/convergence/alerts?limit=10"),
        fetch("/api/v1/convergence/status"),
      ]);
      if (alertsRes.ok) {
        const data = await alertsRes.json();
        setAlerts(data.alerts || []);
      }
      if (statusRes.ok) {
        setStatus(await statusRes.json());
      }
      setLastFetch(new Date());
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        background: "#030712",
        border: "1px solid #1e293b",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #0a0f1a, #030712)",
          padding: "12px 14px",
          borderBottom: "1px solid #1e293b",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span style={{ fontSize: "14px" }}>⚡</span>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "#f87171",
              textTransform: "uppercase",
            }}
          >
            Space × Earth Convergence
          </div>
          <div style={{ fontFamily: "monospace", fontSize: "9px", color: "#475569", marginTop: "1px" }}>
            Multi-hazard watchlist · Auto-refresh 15s
          </div>
        </div>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "18px",
            fontWeight: 900,
            color: alerts.length > 0 ? "#f87171" : "#22c55e",
            background: alerts.length > 0 ? "#1a0505" : "#051a0a",
            border: `1px solid ${alerts.length > 0 ? "#7f1d1d" : "#14532d"}`,
            borderRadius: "6px",
            padding: "2px 10px",
            minWidth: "32px",
            textAlign: "center",
          }}
        >
          {alerts.length}
        </div>
      </div>

      {/* Thresholds */}
      {status && (
        <div
          style={{
            padding: "8px 14px",
            borderBottom: "1px solid #0f172a",
            display: "flex",
            gap: "16px",
          }}
        >
          {["space_min", "earth_min"].map((k) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ fontFamily: "monospace", fontSize: "9px", color: "#334155" }}>
                {k === "space_min" ? "🛰" : "🌍"} min:{" "}
              </span>
              <span style={{ fontFamily: "monospace", fontSize: "9px", color: "#64748b" }}>
                {(status.thresholds?.[k] * 100).toFixed(0)}%
              </span>
            </div>
          ))}
          <div style={{ marginLeft: "auto", fontFamily: "monospace", fontSize: "9px", color: "#1e293b" }}>
            {lastFetch ? lastFetch.toLocaleTimeString() : "--:--"}
          </div>
        </div>
      )}

      {/* Alert list */}
      <div style={{ maxHeight: "320px", overflowY: "auto" }}>
        {loading && (
          <div style={{ padding: "20px", textAlign: "center", fontFamily: "monospace", fontSize: "11px", color: "#334155" }}>
            Scanning for convergence events...
          </div>
        )}
        {!loading && alerts.length === 0 && (
          <div style={{ padding: "20px", textAlign: "center" }}>
            <div style={{ fontSize: "20px", marginBottom: "6px" }}>✓</div>
            <div style={{ fontFamily: "monospace", fontSize: "11px", color: "#22c55e" }}>No convergence detected</div>
            <div style={{ fontFamily: "monospace", fontSize: "10px", color: "#334155", marginTop: "4px" }}>
              Both thresholds below trigger level
            </div>
          </div>
        )}
        {alerts.map((alert) => (
          <button
            key={alert.convergence_id}
            onClick={() => onAlertSelect?.(alert)}
            style={{
              width: "100%",
              padding: "10px 14px",
              background: "transparent",
              border: "none",
              borderBottom: "1px solid #0f172a",
              cursor: "pointer",
              textAlign: "left",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#07101d")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
              <SeverityDot severity={alert.severity} />
              <span style={{ fontFamily: "monospace", fontSize: "10px", color: "#94a3b8", fontWeight: 600 }}>
                {alert.convergence_id}
              </span>
              <span
                style={{
                  marginLeft: "auto",
                  fontFamily: "monospace",
                  fontSize: "9px",
                  color: "#475569",
                }}
              >
                {new Date(alert.detected_at).toLocaleTimeString()}
              </span>
            </div>

            <div style={{ marginBottom: "6px" }}>
              <CTIBar value={alert.compound_threat_index} />
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "9px",
                  background: "#0a1628",
                  border: "1px solid #1e3a5f",
                  color: "#60a5fa",
                  padding: "2px 6px",
                  borderRadius: "3px",
                }}
              >
                🛰 {alert.space_entity_id} · {(alert.space_risk_score * 100).toFixed(0)}%
              </span>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "9px",
                  background: "#0a1f0a",
                  border: "1px solid #1e3a1e",
                  color: "#4ade80",
                  padding: "2px 6px",
                  borderRadius: "3px",
                }}
              >
                🌍 {alert.earth_hazard_type} · {(alert.earth_risk_score * 100).toFixed(0)}%
              </span>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "9px",
                  color: "#475569",
                  padding: "2px 6px",
                }}
              >
                👥 {(alert.affected_population || 0).toLocaleString()}
              </span>
            </div>
          </button>
        ))}
      </div>

      {alerts.length > 0 && (
        <div
          style={{
            padding: "8px 14px",
            borderTop: "1px solid #0f172a",
            fontFamily: "monospace",
            fontSize: "9px",
            color: "#334155",
            textAlign: "center",
          }}
        >
          Click any alert to view full briefing ·{" "}
          <span style={{ color: "#475569" }}>{alerts.length} event(s)</span>
        </div>
      )}
    </div>
  );
}
