import React, { useState } from "react";

/**
 * SkyGuardDefenseShowcase — Enterprise Homepage Feature Showcase Section
 * 
 * Title: "SkyGuard — Real-Time Transactional & System Defense"
 * Subtitle: "In-Flight AI Monitoring & Sub-Millisecond Threat Prevention"
 * Layout: 2-column dynamic layout (Left: Feature highlights + CTAs; Right: Interactive UI visual card & live monitoring status badge)
 */
export default function SkyGuardDefenseShowcase({ onOpenMonitor, onNavigateAbout }) {
  const [activeTab, setActiveTab] = useState("telemetry"); // telemetry | ai_engine | security
  const [isSimulatedThreat, setIsSimulatedThreat] = useState(false);

  const features = [
    {
      id: "inline",
      icon: "⚡",
      title: "In-Line Inspection",
      desc: "Inspects and scores incoming transactions and system telemetry in real time (< 2ms latency) before execution.",
      metric: "< 2ms",
      metricLabel: "Inference Latency",
      color: "var(--blue-light)",
    },
    {
      id: "blocking",
      icon: "🛡️",
      title: "Autonomous Active Blocking",
      desc: "Automatically flags, blocks, and isolates high-risk anomalies before financial or operational damage occurs.",
      metric: "100%",
      metricLabel: "Damage Prevention",
      color: "var(--yellow)",
    },
    {
      id: "ibm_z",
      icon: "🏛️",
      title: "IBM Z & AI Acceleration Integration",
      desc: "Leverages hardware-level AI acceleration for maximum throughput without data leaving the secure boundary.",
      metric: "IBM Telum",
      metricLabel: "On-Chip Coprocessor",
      color: "var(--teal)",
    },
    {
      id: "genai",
      icon: "✨",
      title: "GenAI Incident Explanations",
      desc: "Powered by Generative AI to provide clear, natural-language root-cause reports for security operators instantly.",
      metric: "Instant",
      metricLabel: "Operator Summaries",
      color: "#a855f7",
    },
  ];

  return (
    <section
      id="skyguard-defense"
      style={{
        padding: "70px 24px",
        background: "radial-gradient(circle at 80% 20%, rgba(20, 36, 68, 0.4) 0%, rgba(6, 9, 14, 1) 75%)",
        borderTop: "1px solid rgba(59, 130, 246, 0.3)",
        borderBottom: "1px solid rgba(59, 130, 246, 0.3)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background Ambient Glows */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          right: "5%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, transparent 70%)",
          pointerEvents: "none",
          filter: "blur(60px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-20%",
          left: "10%",
          width: "450px",
          height: "450px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(245, 200, 76, 0.08) 0%, transparent 70%)",
          pointerEvents: "none",
          filter: "blur(60px)",
        }}
      />

      <div style={{ maxWidth: 1240, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Top Header Block */}
        <div style={{ textAlign: "center", marginBottom: 50 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 12px",
              borderRadius: 20,
              background: "rgba(59, 130, 246, 0.12)",
              border: "1px solid rgba(59, 130, 246, 0.4)",
              color: "var(--blue-light)",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.06em",
              marginBottom: 12,
            }}
          >
            <span className="radar-live" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--teal)" }} />
            <span>ENTERPRISE SYSTEM & TRANSACTION DEFENSE</span>
          </div>

          <h2
            style={{
              fontSize: "clamp(26px, 4vw, 38px)",
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "-0.02em",
              margin: "0 0 12px",
              lineHeight: 1.2,
            }}
          >
            SkyGuard — Real-Time Transactional & System Defense
          </h2>

          <p
            style={{
              fontSize: "clamp(14px, 2vw, 17px)",
              color: "var(--text-muted)",
              maxWidth: 720,
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            In-Flight AI Monitoring & Sub-Millisecond Threat Prevention powered by co-located hardware inference and post-quantum transactional security.
          </p>
        </div>

        {/* 2-Column Dynamic Layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap: 36,
            alignItems: "stretch",
          }}
        >
          {/* ========================================================================= */}
          {/* COLUMN 1 (LEFT): Feature Highlights & Call to Actions */}
          {/* ========================================================================= */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {features.map((f) => (
                <div
                  key={f.id}
                  className="hover-lift"
                  style={{
                    background: "rgba(13, 18, 28, 0.75)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    padding: "18px 20px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 16,
                    backdropFilter: "blur(12px)",
                    transition: "all 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = f.color;
                    e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.5), 0 0 16px ${f.color}22`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 8,
                      background: "rgba(255, 255, 255, 0.04)",
                      border: `1px solid ${f.color}44`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      flexShrink: 0,
                    }}
                  >
                    {f.icon}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 800, color: "#ffffff", margin: 0 }}>
                        {f.title}
                      </h3>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          fontFamily: "var(--font-mono)",
                          color: f.color,
                          background: `${f.color}15`,
                          padding: "2px 7px",
                          borderRadius: 4,
                          border: `1px solid ${f.color}33`,
                        }}
                      >
                        {f.metric}
                      </span>
                    </div>
                    <p style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.55, margin: 0 }}>
                      {f.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", paddingTop: 8 }}>
              <button
                onClick={onOpenMonitor}
                className="cta-button"
                style={{
                  padding: "13px 26px",
                  fontSize: 14,
                  fontWeight: 800,
                  borderRadius: 8,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 0 20px var(--yellow-glow)",
                }}
              >
                <span>📡</span>
                <span>Explore SkyGuard Dashboard</span>
              </button>

              <button
                onClick={onNavigateAbout}
                style={{
                  background: "rgba(20, 28, 48, 0.8)",
                  border: "1px solid rgba(59, 130, 246, 0.45)",
                  color: "var(--blue-light)",
                  padding: "13px 22px",
                  fontSize: 13.5,
                  fontWeight: 700,
                  borderRadius: 8,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(59, 130, 246, 0.2)";
                  e.currentTarget.style.borderColor = "var(--blue-light)";
                  e.currentTarget.style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(20, 28, 48, 0.8)";
                  e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.45)";
                  e.currentTarget.style.color = "var(--blue-light)";
                }}
              >
                <span>📄</span>
                <span>Read Technical Spec</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* COLUMN 2 (RIGHT): Interactive UI Visual Card & Live Status Preview */}
          {/* ========================================================================= */}
          <div
            style={{
              background: "linear-gradient(135deg, rgba(13, 20, 36, 0.95) 0%, rgba(8, 12, 22, 0.98) 100%)",
              border: "1px solid rgba(59, 130, 246, 0.4)",
              borderRadius: 14,
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: 18,
              boxShadow: "0 16px 48px rgba(0,0,0,0.7), 0 0 24px rgba(59, 130, 246, 0.15)",
              backdropFilter: "blur(20px)",
              position: "relative",
            }}
          >
            {/* Live Status Badge Strip */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 10,
                paddingBottom: 16,
                borderBottom: "1px solid rgba(30, 41, 59, 0.8)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>🛡️</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#ffffff", fontFamily: "var(--font-ui)" }}>
                    SKYGUARD DEFENSE ENGINE
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                    HARDWARE IN-LINE INSPECTION CLUSTER
                  </div>
                </div>
              </div>

              {/* Glowing Green Live Badge */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  borderRadius: 20,
                  background: "rgba(46, 196, 182, 0.15)",
                  border: "1px solid var(--teal)",
                  color: "var(--teal)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 10.5,
                  fontWeight: 800,
                  boxShadow: "0 0 12px rgba(46, 196, 182, 0.3)",
                }}
              >
                <span className="radar-live" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--teal)" }} />
                <span>Status: Active Monitoring</span>
              </div>
            </div>

            {/* Interactive Mode Switcher */}
            <div style={{ display: "flex", gap: 6, background: "rgba(6, 9, 14, 0.8)", padding: 4, borderRadius: 6 }}>
              {[
                { id: "telemetry", label: "Live Telemetry" },
                { id: "ai_engine", label: "IBM Z Coprocessor" },
                { id: "security", label: "Quantum Audit" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  style={{
                    flex: 1,
                    background: activeTab === t.id ? "rgba(59, 130, 246, 0.25)" : "transparent",
                    color: activeTab === t.id ? "#ffffff" : "var(--text-muted)",
                    border: activeTab === t.id ? "1px solid var(--blue)" : "1px solid transparent",
                    borderRadius: 4,
                    padding: "6px 8px",
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Live Metrics Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 10,
              }}
            >
              <div style={{ background: "rgba(6, 9, 14, 0.7)", border: "1px solid var(--border)", borderRadius: 6, padding: "12px", textAlign: "center" }}>
                <div style={{ fontSize: 9.5, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>INSPECTION SPEED</div>
                <div style={{ fontSize: 19, fontWeight: 900, fontFamily: "var(--font-mono)", color: "var(--teal)", marginTop: 2 }}>&lt; 1.8 ms</div>
                <div style={{ fontSize: 9, color: "var(--teal)" }}>In-Transaction AI</div>
              </div>

              <div style={{ background: "rgba(6, 9, 14, 0.7)", border: "1px solid var(--border)", borderRadius: 6, padding: "12px", textAlign: "center" }}>
                <div style={{ fontSize: 9.5, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>ACID INTEGRITY</div>
                <div style={{ fontSize: 19, fontWeight: 900, fontFamily: "var(--font-mono)", color: "var(--yellow)", marginTop: 2 }}>100%</div>
                <div style={{ fontSize: 9, color: "var(--yellow)" }}>Zero Escape Rate</div>
              </div>

              <div style={{ background: "rgba(6, 9, 14, 0.7)", border: "1px solid var(--border)", borderRadius: 6, padding: "12px", textAlign: "center" }}>
                <div style={{ fontSize: 9.5, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>DEFENSE ALGO</div>
                <div style={{ fontSize: 19, fontWeight: 900, fontFamily: "var(--font-mono)", color: "#a855f7", marginTop: 2 }}>KYBER</div>
                <div style={{ fontSize: 9, color: "#a855f7" }}>ML-KEM-1024</div>
              </div>
            </div>

            {/* Live Threat Interception Card */}
            <div
              style={{
                background: isSimulatedThreat ? "rgba(230, 57, 70, 0.12)" : "rgba(13, 20, 36, 0.8)",
                border: `1px solid ${isSimulatedThreat ? "var(--red)" : "rgba(59, 130, 246, 0.35)"}`,
                borderRadius: 8,
                padding: "16px",
                transition: "all 0.25s ease",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14 }}>{isSimulatedThreat ? "🚨" : "⚡"}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, fontFamily: "var(--font-mono)", color: isSimulatedThreat ? "var(--red)" : "var(--blue-light)" }}>
                    {isSimulatedThreat ? "THREAT BLOCKED & ISOLATED" : "IN-FLIGHT THREAT INTERCEPTION STREAM"}
                  </span>
                </div>
                <button
                  onClick={() => setIsSimulatedThreat(!isSimulatedThreat)}
                  style={{
                    background: isSimulatedThreat ? "rgba(230, 57, 70, 0.2)" : "rgba(245, 200, 76, 0.15)",
                    border: `1px solid ${isSimulatedThreat ? "var(--red)" : "var(--yellow)"}`,
                    color: isSimulatedThreat ? "var(--red)" : "var(--yellow)",
                    padding: "3px 8px",
                    borderRadius: 4,
                    fontSize: 9.5,
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {isSimulatedThreat ? "Reset Baseline" : "Simulate Threat"}
                </button>
              </div>

              {/* GenAI Explanation Box */}
              <div
                style={{
                  background: "rgba(6, 9, 14, 0.85)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: 6,
                  padding: "10px 12px",
                  fontSize: 11.5,
                  lineHeight: 1.5,
                  fontFamily: "var(--font-ui)",
                  color: isSimulatedThreat ? "#ffb4a2" : "var(--text)",
                }}
              >
                <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--yellow)", marginBottom: 4, fontWeight: 700 }}>
                  ✨ GENAI ROOT-CAUSE EXPLANATION:
                </div>
                {isSimulatedThreat ? (
                  <span>
                    <strong>CRITICAL DRIFT DETECTED:</strong> SAT-1042 telemetry exhibits non-linear thermal anomaly (+48.2°C) concurrent with 1.4km spatial debris conjunction. In-line active blocking triggered. Autonomous commanding suspended; audit stamped to IBM Db2 for z/OS.
                  </span>
                ) : (
                  <span>
                    <strong>NOMINAL IN-FLIGHT STATE:</strong> Subsystem telemetry across 6 LEO assets verifies zero spatial collisions (&gt; 15km separation). All transactional scores within verified baseline envelope (Z-Score: 0.04).
                  </span>
                )}
              </div>

              {/* Transaction Footprint */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 10,
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-muted)",
                  marginTop: 10,
                  borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                  paddingTop: 8,
                }}
              >
                <span>TXN: TXN-Z-8849201-ACID</span>
                <span style={{ color: "var(--teal)" }}>✓ Quantum-Safe Verified</span>
                <span>Telum Coprocessor</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
