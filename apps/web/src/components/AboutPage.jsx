import React from "react";

export default function AboutPage({ onCheckSatellite, onOpenMonitor }) {
  return (
    <div
      style={{
        padding: "40px 30px",
        maxWidth: 960,
        margin: "0 auto",
        overflowY: "auto",
        height: "calc(100vh - 56px)",
        color: "var(--text)",
      }}
      className="scrollbar-thin"
    >
      <div style={{ marginBottom: 30 }}>
        <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--blue)", fontWeight: 700, letterSpacing: "0.08em" }}>
          MISSION & ARCHITECTURE
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: "6px 0 10px", color: "var(--text)" }}>
          About SKYGUARD XAI
        </h1>
        <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.5, margin: 0 }}>
          Real-Time Space-to-Earth Emergency Decision Intelligence built for the IBM Z Datathon.
        </p>
      </div>

      {/* Datathon Theme Card */}
      <div
        style={{
          background: "linear-gradient(90deg, rgba(76, 154, 255, 0.12) 0%, rgba(16, 21, 31, 0.9) 100%)",
          border: "1px solid rgba(76, 154, 255, 0.3)",
          borderRadius: 8,
          padding: "20px 24px",
          marginBottom: 24,
        }}
      >
        <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--blue)", fontWeight: 700 }}>
          DATATHON THEME: REAL-TIME AI FOR CRITICAL DECISIONS
        </div>
        <div style={{ fontSize: 14, color: "var(--text)", marginTop: 6, lineHeight: 1.5 }}>
          In modern space and orbital operations, anomalies unfold in seconds, but orbital collisions can trigger irreversible cascades.
          SKYGUARD XAI bridges real-time telemetry streaming with unsupervised machine learning to deliver explainable, actionable decision intelligence before a threat escalates.
        </div>
      </div>

      {/* Layered Vision */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: "10px 0 0" }}>
          The 5-Layer Decision Architecture
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
          <div style={{ background: "var(--panel-raised)", border: "1px solid var(--blue)", borderRadius: 6, padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontWeight: 800, fontSize: 13, color: "var(--blue)" }}>LAYER 1 — SPACE INTELLIGENCE</span>
              <span style={{ fontSize: 9, background: "var(--teal)", color: "#000", fontWeight: 700, padding: "2px 6px", borderRadius: 3 }}>
                ACTIVE & VERIFIED
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-muted)", lineHeight: 1.45 }}>
              Continuous satellite telemetry ingestion, 5-feature Isolation Forest anomaly detection, 3D spatial debris conjunction tracking, and transparent 0–100% unified risk scoring.
            </div>
          </div>

          <div style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 6, padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text)" }}>LAYER 2 — EARTH IMPACT</span>
              <span style={{ fontSize: 9, color: "var(--text-muted)", border: "1px solid var(--border)", padding: "2px 6px", borderRadius: 3 }}>
                PLANNED
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-muted)", lineHeight: 1.45 }}>
              Translates orbital satellite degradation and debris re-entry trajectories into geographic hazard zones and ground asset risk footprints.
            </div>
          </div>

          <div style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 6, padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text)" }}>LAYER 3 — EMERGENCY RESPONSE</span>
              <span style={{ fontSize: 9, color: "var(--text-muted)", border: "1px solid var(--border)", padding: "2px 6px", borderRadius: 3 }}>
                PLANNED
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-muted)", lineHeight: 1.45 }}>
              Synthesizes ground infrastructure vulnerability, population density corridors, and regional emergency services readiness.
            </div>
          </div>

          <div style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 6, padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text)" }}>LAYER 4 — CRITICAL LOGISTICS</span>
              <span style={{ fontSize: 9, color: "var(--text-muted)", border: "1px solid var(--border)", padding: "2px 6px", borderRadius: 3 }}>
                PLANNED
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-muted)", lineHeight: 1.45 }}>
              Dynamic routing for hospitals, ambulances, and emergency logistics impacted by telecommunications or power disruptions.
            </div>
          </div>
        </div>
      </div>

      {/* Core Safety & Governance */}
      <div
        style={{
          background: "var(--panel)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          padding: "20px 24px",
          marginBottom: 30,
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 10px", color: "var(--text)" }}>
          International Safety & Human-in-the-Loop Governance
        </h3>
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.5, margin: 0 }}>
          SKYGUARD XAI strictly enforces decision-support advisories over autonomous command execution.
          In accordance with aerospace mission rules, <strong>no autonomous spacecraft maneuvering commands are executed</strong>.
          Every candidate avoidance maneuver is simulated and flagged for human operator review and sign-off.
        </p>
      </div>

      {/* Quick Navigation Footer */}
      <div style={{ display: "flex", gap: 14 }}>
        <button onClick={() => onCheckSatellite("SAT-1042")} className="cta-button">
          <span>🔍 Check Satellite (SAT-1042)</span>
        </button>
        <button
          onClick={onOpenMonitor}
          style={{
            background: "var(--panel-raised)",
            color: "var(--text)",
            border: "1px solid var(--border)",
            padding: "10px 18px",
            borderRadius: 6,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          <span>🛰 Live Monitor Dashboard</span>
        </button>
      </div>
    </div>
  );
}
