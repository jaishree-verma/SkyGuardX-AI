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
        background: "linear-gradient(180deg, #090d15 0%, #05070b 100%)",
        borderTop: "1px solid rgba(27, 37, 56, 0.9)",
        padding: "60px 24px 36px",
        marginTop: "auto",
        position: "relative",
        zIndex: 20,
        overflow: "hidden",
      }}
    >
      {/* Ambient Top Glow Line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "15%",
          right: "15%",
          height: "1px",
          background: "linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.4) 30%, rgba(245, 200, 76, 0.5) 70%, transparent 100%)",
        }}
      />

      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        {/* Main 4-Column Footer Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 40,
            marginBottom: 48,
          }}
        >
          {/* Column 1: Brand & Mission Control Status */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  background: "linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(245, 200, 76, 0.15) 100%)",
                  border: "1px solid rgba(59, 130, 246, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                }}
              >
                🛰
              </div>
              <span style={{ fontWeight: 900, fontSize: 16, color: "#ffffff", letterSpacing: "0.05em" }}>
                SKYGUARD<span style={{ color: "var(--yellow)" }}>X</span>
              </span>
            </div>

            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>
              Real-Time Space-to-Earth Emergency Decision Intelligence. Unifying telemetry streaming,
              unsupervised machine learning, and explainable AI to protect critical orbital assets before risk escalates.
            </p>

            {/* Live Operational Badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(13, 18, 28, 0.8)",
                border: "1px solid var(--border)",
                padding: "6px 12px",
                borderRadius: 6,
                width: "fit-content",
                fontSize: 11,
                fontFamily: "var(--font-mono)",
              }}
            >
              <span className="live-dot" style={{ width: 6, height: 6 }} />
              <span style={{ color: "var(--blue-light)" }}>IBM Z ARCHITECTURE</span>
              <span style={{ color: "var(--yellow)", fontWeight: 700 }}>ONLINE</span>
            </div>
          </div>

          {/* Column 2: Platform Navigation */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--yellow)", fontWeight: 800, letterSpacing: "0.08em" }}>
              PLATFORM CONSOLE
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
              <button onClick={() => handleLink("home")} style={linkBtnStyle}>
                <span>🌐</span> Home Command Center
              </button>
              <button onClick={() => onCheckSatellite ? onCheckSatellite("SAT-1042") : handleLink("check")} style={linkBtnStyle}>
                <span>🔍</span> Check Live Satellite
              </button>
              <button onClick={() => onOpenMonitor ? onOpenMonitor() : handleLink("monitor")} style={linkBtnStyle}>
                <span>📡</span> Space Operations Monitor
              </button>
              <button onClick={() => handleLink("satellites")} style={linkBtnStyle}>
                <span>🛰</span> Fleet Telemetry Matrix
              </button>
              <button onClick={() => handleLink("alerts")} style={linkBtnStyle}>
                <span>🚨</span> Active Threat Audit Center
              </button>
              <button onClick={() => handleLink("events")} style={linkBtnStyle}>
                <span>⚡</span> Raw Telemetry Event Stream
              </button>
            </div>
          </div>

          {/* Column 3: AI Intelligence & Science */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--blue-light)", fontWeight: 800, letterSpacing: "0.08em" }}>
              INTELLIGENCE & ML
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
              <button onClick={() => handleLink("analytics")} style={linkBtnStyle}>
                <span>📊</span> AI Model Evaluation (F1 0.91)
              </button>
              <button onClick={() => handleLink("home", "intelligence")} style={linkBtnStyle}>
                <span>🧠</span> Isolation Forest Anomaly Detection
              </button>
              <button onClick={() => handleLink("home", "how-it-works")} style={linkBtnStyle}>
                <span>📐</span> 3D Conjunction Geometry
              </button>
              <button onClick={() => handleLink("about")} style={linkBtnStyle}>
                <span>🛡</span> Transactional Audit Trail
              </button>
              <button onClick={() => handleLink("about")} style={linkBtnStyle}>
                <span>⚡</span> Sub-50ms Inference SLA
              </button>
            </div>
          </div>

          {/* Column 4: 5-Layer Mission Roadmap & Certifications */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontWeight: 800, letterSpacing: "0.08em" }}>
              DATATHON SPECIFICATION
            </div>

            <div
              style={{
                background: "rgba(13, 18, 28, 0.7)",
                border: "1px solid rgba(245, 200, 76, 0.25)",
                borderRadius: 8,
                padding: "12px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--yellow)", fontFamily: "var(--font-mono)" }}>
                IBM Z DATATHON 2026
              </div>
              <div style={{ fontSize: 11.5, color: "var(--text-muted)", lineHeight: 1.4 }}>
                Theme: Real-Time AI for Critical Decisions. Implements Layer 1 Space Intelligence with deterministic explainability.
              </div>
            </div>

            {/* Quick Action: Back to top */}
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
                marginTop: 4,
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
              <span>🚀</span>
              <span>Back to Top of Mission Control</span>
            </button>
          </div>
        </div>

        {/* Bottom Strip: Copyright & Disclaimers */}
        <div
          style={{
            borderTop: "1px solid var(--border)",
            paddingTop: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 14,
            fontSize: 11.5,
            fontFamily: "var(--font-mono)",
            color: "var(--text-muted)",
          }}
        >
          <div>
            © 2026 SKYGUARD XAI · Real-Time Space Decision Support Prototype.
          </div>

          <div style={{ display: "flex", gap: 18 }}>
            <span style={{ color: "var(--blue-light)" }}>Layer 1 Space Intelligence</span>
            <span>·</span>
            <span>CCSDS Telemetry Standard</span>
            <span>·</span>
            <span style={{ color: "var(--yellow)" }}>Sub-50ms Real-Time Stream</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

const linkBtnStyle = {
  background: "none",
  border: "none",
  color: "var(--text-muted)",
  cursor: "pointer",
  padding: "2px 0",
  textAlign: "left",
  fontFamily: "var(--font-ui)",
  fontSize: 12.5,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  transition: "color 0.15s ease",
};
