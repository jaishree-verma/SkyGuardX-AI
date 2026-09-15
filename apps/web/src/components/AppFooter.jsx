import React from "react";

export default function AppFooter({ onNavigate, onCheckSatellite, onOpenMonitor }) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLink = (view, anchor = null) => {
    if (onNavigate) {
      onNavigate(view);
      if (anchor) {
        setTimeout(() => {
          const el = document.getElementById(anchor);
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }, 120);
      }
    }
  };

  return (
    <footer
      style={{
        background: "linear-gradient(180deg, #070a10 0%, #030508 100%)",
        borderTop: "2px solid rgba(59, 130, 246, 0.35)",
        padding: "50px 24px 34px",
        marginTop: "auto",
        position: "relative",
        zIndex: 20,
        overflow: "hidden",
        boxShadow: "0 -10px 40px rgba(0, 0, 0, 0.8)",
      }}
    >
      {/* Glowing Accent Top Bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: "linear-gradient(90deg, #3b82f6 0%, #f5c84c 50%, #e63946 100%)",
          boxShadow: "0 0 16px rgba(245, 200, 76, 0.6)",
        }}
      />

      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* ========================================================================= */}
        {/* PROMINENT TEAM MATRIX-5 & MISSION BANNER */}
        {/* ========================================================================= */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(13, 20, 34, 0.95) 0%, rgba(20, 28, 48, 0.9) 100%)",
            border: "1px solid rgba(245, 200, 76, 0.45)",
            borderRadius: 10,
            padding: "20px 26px",
            marginBottom: 44,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 20,
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(245, 200, 76, 0.15)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Team Matrix-5 Emblem */}
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 10,
                background: "linear-gradient(135deg, rgba(245, 200, 76, 0.25) 0%, rgba(59, 130, 246, 0.3) 100%)",
                border: "1.5px solid var(--yellow)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                boxShadow: "0 0 16px var(--yellow-glow)",
              }}
            >
              ⚡
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 900,
                    letterSpacing: "0.04em",
                    color: "#ffffff",
                    fontFamily: "var(--font-ui)",
                  }}
                >
                  ENGINEERED & BUILT BY{" "}
                  <span
                    style={{
                      color: "var(--yellow)",
                      textShadow: "0 0 12px rgba(245, 200, 76, 0.5)",
                      fontWeight: 900,
                    }}
                  >
                    TEAM MATRIX-5
                  </span>
                </span>

                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "3px 8px",
                    borderRadius: 4,
                    background: "rgba(245, 200, 76, 0.18)",
                    color: "var(--yellow)",
                    border: "1px solid rgba(245, 200, 76, 0.4)",
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.04em",
                  }}
                >
                  IBM Z DATATHON 2026
                </span>
              </div>

              <div
                style={{
                  fontSize: 12.5,
                  color: "#cbd5e1",
                  marginTop: 4,
                  lineHeight: 1.4,
                }}
              >
                Theme: <strong style={{ color: "var(--blue-light)" }}>Real-Time AI for Critical Decisions</strong> · Unifying Space Anomaly Detection with Mission-Critical IBM Z Transactional Intelligence.
              </div>
            </div>
          </div>

          {/* Quick Action Buttons on Banner */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => onCheckSatellite ? onCheckSatellite("SAT-1042") : handleLink("check")}
              className="cta-button"
              style={{
                padding: "8px 16px",
                fontSize: 12,
                borderRadius: 6,
                fontWeight: 700,
              }}
            >
              <span>🔍</span>
              <span>Test Live Satellite</span>
            </button>

            <button
              onClick={scrollToTop}
              style={{
                background: "rgba(10, 14, 22, 0.8)",
                border: "1px solid var(--border)",
                color: "var(--text)",
                padding: "8px 14px",
                borderRadius: 6,
                fontSize: 12,
                fontFamily: "var(--font-mono)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--blue-light)";
                e.currentTarget.style.color = "#ffffff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text)";
              }}
            >
              <span>↑ TOP</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CLEAR 4-COLUMN FOOTER NAVIGATION & ARCHITECTURE */}
        {/* ========================================================================= */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 36,
            marginBottom: 44,
          }}
        >
          {/* Column 1: Understanding SkyGuard XAI */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--yellow)", fontWeight: 800, letterSpacing: "0.08em" }}>
              WHAT SKYGUARD XAI DOES
            </div>

            <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>
              <strong style={{ color: "#ffffff" }}>SKYGUARD XAI</strong> intercepts live orbital satellite telemetry, runs unsupervised machine learning to detect thermal & power anomalies, and calculates 3D orbital conjunction collision risks in real time.
            </p>

            <div
              style={{
                background: "rgba(13, 18, 28, 0.7)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: "10px 12px",
                fontSize: 11.5,
                fontFamily: "var(--font-mono)",
                color: "var(--blue-light)",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div>● LATENCY: &lt; 50ms Real-Time Inference</div>
              <div>● ACCURACY: 97.2% Multi-Sensor Telemetry</div>
              <div>● PIPELINE: Layer 1 Space Intelligence</div>
            </div>
          </div>

          {/* Column 2: Platform Console */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--blue-light)", fontWeight: 800, letterSpacing: "0.08em" }}>
              NAVIGATION & CONSOLES
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
              <button onClick={() => handleLink("home")} style={linkBtnStyle}>
                <span>🌐</span> <strong>Home</strong> — Mission Introduction
              </button>
              <button onClick={() => onCheckSatellite ? onCheckSatellite("SAT-1042") : handleLink("check")} style={linkBtnStyle}>
                <span>🔍</span> <strong>Check Satellite</strong> — AI Risk Analysis
              </button>
              <button onClick={() => onOpenMonitor ? onOpenMonitor() : handleLink("monitor")} style={linkBtnStyle}>
                <span>📡</span> <strong>Live Monitor</strong> — 3D Command Console
              </button>
              <button onClick={() => handleLink("satellites")} style={linkBtnStyle}>
                <span>🛰</span> <strong>Fleet Observability</strong> — Subsystem Status
              </button>
              <button onClick={() => handleLink("alerts")} style={linkBtnStyle}>
                <span>🚨</span> <strong>Threat Alerts</strong> — Conjunction Warnings
              </button>
              <button onClick={() => handleLink("events")} style={linkBtnStyle}>
                <span>⚡</span> <strong>Event Stream</strong> — Real-Time Telemetry Log
              </button>
            </div>
          </div>

          {/* Column 3: AI Intelligence & Architecture */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontWeight: 800, letterSpacing: "0.08em" }}>
              HOW THE AI WORKS
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
              <button onClick={() => handleLink("analytics")} style={linkBtnStyle}>
                <span>📊</span> <strong>Isolation Forest Model</strong> — Anomaly Scorer
              </button>
              <button onClick={() => handleLink("home", "how-it-works")} style={linkBtnStyle}>
                <span>📐</span> <strong>3D Conjunction Math</strong> — Miss Distance (km)
              </button>
              <button onClick={() => handleLink("about")} style={linkBtnStyle}>
                <span>🧠</span> <strong>Explainable AI (XAI)</strong> — Root Cause Factors
              </button>
              <button onClick={() => handleLink("analytics")} style={linkBtnStyle}>
                <span>🛡</span> <strong>IBM Z Ledger</strong> — Immutable Audit Record
              </button>
              <button onClick={() => handleLink("about")} style={linkBtnStyle}>
                <span>🗺</span> <strong>5-Layer Architecture</strong> — Earth Cascade Vision
              </button>
            </div>
          </div>

          {/* Column 4: Team Matrix-5 Credits & Specs */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--yellow)", fontWeight: 800, letterSpacing: "0.08em" }}>
              TEAM MATRIX-5 DETAILS
            </div>

            <div
              style={{
                background: "rgba(10, 14, 22, 0.8)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                borderRadius: 8,
                padding: "14px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: "#ffffff" }}>
                Built by Team Matrix-5
              </div>
              <div style={{ fontSize: 11.5, color: "#94a3b8", lineHeight: 1.5 }}>
                Designed as a high-reliability prototype for space situational awareness (SSA) and critical infrastructure protection.
              </div>
              <div style={{ fontSize: 10.5, fontFamily: "var(--font-mono)", color: "var(--yellow)" }}>
                ● IBM Z DATATHON SUBMISSION · 2026
              </div>
            </div>

            {/* Jump to top button */}
            <button
              onClick={scrollToTop}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: "rgba(20, 28, 43, 0.8)",
                border: "1px solid var(--border)",
                color: "var(--text)",
                padding: "9px 16px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.18s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--yellow)";
                e.currentTarget.style.color = "var(--yellow)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text)";
              }}
            >
              <span>🚀 Back to Top of Mission Control</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BOTTOM COPYRIGHT & TEAM SIGNATURE STRIP */}
        {/* ========================================================================= */}
        <div
          style={{
            borderTop: "1px solid rgba(27, 37, 56, 0.9)",
            paddingTop: 22,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 14,
            fontSize: 12,
            fontFamily: "var(--font-mono)",
            color: "var(--text-muted)",
          }}
        >
          <div>
            <strong style={{ color: "var(--yellow)" }}>TEAM MATRIX-5</strong> · SKYGUARD XAI © 2026 · Real-Time Space Intelligence
          </div>

          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ color: "var(--blue-light)" }}>Layer 1 Space Intelligence</span>
            <span>·</span>
            <span>Sub-50ms Inference</span>
            <span>·</span>
            <span style={{ color: "var(--yellow)" }}>IBM Z Datathon 2026</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

const linkBtnStyle = {
  background: "none",
  border: "none",
  color: "#94a3b8",
  cursor: "pointer",
  padding: "3px 0",
  textAlign: "left",
  fontFamily: "var(--font-ui)",
  fontSize: 12.5,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  transition: "color 0.15s ease",
};
