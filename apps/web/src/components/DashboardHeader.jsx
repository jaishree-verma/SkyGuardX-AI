import React from "react";
import GlossaryTooltip from "./GlossaryTooltip.jsx";

export default function DashboardHeader({
  activeTab,
  onTabChange,
  connected,
  lastEventTime,
  demoStatus,
  onStartDemo,
  onResetDemo,
  alertsCount = 0,
  isEmbedded = false,
}) {
  const eventAgeSec = Math.max(0, Math.round((Date.now() - lastEventTime) / 1000));

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "satellites", label: "Satellites" },
    { id: "alerts", label: "Alerts", badge: alertsCount > 0 ? alertsCount : null },
    { id: "events", label: "Events" },
    { id: "analytics", label: "Analytics" },
  ];

  if (isEmbedded) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          height: "42px",
          background: "var(--panel)",
          borderBottom: "1px solid var(--border)",
          gap: 16,
          zIndex: 90,
        }}
      >
        <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontWeight: 700 }}>
          CONSOLE VIEW:
        </div>

        <nav style={{ display: "flex", gap: 4 }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                style={{
                  background: isActive ? "var(--panel-raised)" : "transparent",
                  color: isActive ? "var(--text)" : "var(--text-muted)",
                  border: "none",
                  borderBottom: isActive ? "2px solid var(--blue)" : "2px solid transparent",
                  padding: "10px 12px",
                  fontSize: 11.5,
                  fontWeight: isActive ? 600 : 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.15s ease",
                }}
              >
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    style={{
                      background: "#e63946",
                      color: "#ffffff",
                      fontSize: 9,
                      fontWeight: 700,
                      padding: "1px 5px",
                      borderRadius: 10,
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div style={{ marginLeft: "auto", fontSize: 10.5, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
          Active Constellation: 6 LEO Satellites · 3 Debris Targets
        </div>
      </div>
    );
  }

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        height: "54px",
        background: "var(--panel)",
        borderBottom: "1px solid var(--border)",
        gap: 20,
        zIndex: 100,
      }}
    >
      {/* Brand & Mission */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 18 }}>🛰</span>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 800, letterSpacing: "0.04em", fontSize: 15, color: "var(--text)" }}>
              SKYGUARD XAI
            </span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: 3,
                background: connected ? "rgba(46, 196, 182, 0.15)" : "rgba(230, 57, 70, 0.2)",
                color: connected ? "var(--teal)" : "#e63946",
                border: `1px solid ${connected ? "rgba(46, 196, 182, 0.3)" : "rgba(230, 57, 70, 0.4)"}`,
                fontFamily: "var(--font-mono)",
              }}
            >
              {connected ? "LIVE ●" : "DISCONNECTED"}
            </span>
          </div>
          <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>
            Real-Time Space Intelligence · Layer 1
          </div>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <nav style={{ display: "flex", gap: 4, marginLeft: 16 }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                background: isActive ? "var(--panel-raised)" : "transparent",
                color: isActive ? "var(--text)" : "var(--text-muted)",
                border: "none",
                borderBottom: isActive ? "2px solid var(--blue)" : "2px solid transparent",
                padding: "16px 14px",
                fontSize: 12.5,
                fontWeight: isActive ? 600 : 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.15s ease",
              }}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  style={{
                    background: "#e63946",
                    color: "#ffffff",
                    fontSize: 9,
                    fontWeight: 700,
                    padding: "1px 5px",
                    borderRadius: 10,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Demo Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
        <button
          onClick={onStartDemo}
          style={{
            background: demoStatus === "running" ? "rgba(255, 159, 28, 0.2)" : "var(--panel-raised)",
            color: demoStatus === "running" ? "#ff9f1c" : "var(--text)",
            border: `1px solid ${demoStatus === "running" ? "#ff9f1c" : "var(--border)"}`,
            padding: "6px 12px",
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 600,
            fontFamily: "var(--font-mono)",
            display: "flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
          }}
          title="Triggers the deterministic SAT-1042 anomaly and DEB-2098 close approach demo"
        >
          <span>▶</span> Run Demo Scenario (SAT-1042)
        </button>

        <button
          onClick={onResetDemo}
          style={{
            background: "var(--panel-raised)",
            color: "var(--text-muted)",
            border: "1px solid var(--border)",
            padding: "6px 10px",
            borderRadius: 4,
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            cursor: "pointer",
          }}
          title="Resets fleet to nominal conditions"
        >
          ↺ Reset
        </button>
      </div>

      {/* Real-time System Status Indicators */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontFamily: "var(--font-mono)" }}>
        <div className="pill" style={{ color: "var(--text-muted)" }}>
          <GlossaryTooltip term="IBM Z Boundary">
            <span>IBM Z: READY</span>
          </GlossaryTooltip>
        </div>

        <div className="pill" style={{ color: "var(--text-muted)" }}>
          <GlossaryTooltip term="Data Age">
            <span>Age: {eventAgeSec}s</span>
          </GlossaryTooltip>
        </div>

        <div
          className="pill"
          style={{
            color: connected ? "var(--teal)" : "#e63946",
            borderColor: connected ? "rgba(46, 196, 182, 0.3)" : "rgba(230, 57, 70, 0.4)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: connected ? "var(--teal)" : "#e63946",
            }}
          />
          <span>{connected ? "STREAM ACTIVE" : "OFFLINE"}</span>
        </div>
      </div>
    </header>
  );
}
