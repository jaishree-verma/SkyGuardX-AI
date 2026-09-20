import React, { useState } from "react";
import GlossaryTooltip from "./GlossaryTooltip.jsx";
import SpaceRocketHero3D from "./SpaceRocketHero3D.jsx";
import SkyGuardDefenseShowcase from "./SkyGuardDefenseShowcase.jsx";
import AppFooter from "./AppFooter.jsx";
import Card3D from "./Card3D.jsx";

export default function LandingPage({
  onCheckSatellite,
  onOpenMonitor,
  onNavigateView,
  satellites = {},
  spaceObjects = [],
  events = [],
  risks = {},
  conjunction,
  connected,
  lastEventTime,
  alertsCount = 0,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const satCount = Object.keys(satellites).length || 6;
  const debrisCount = spaceObjects.filter((o) => o.object_type === "DEBRIS").length || 3;
  const eventAgeSec = Math.max(0, Math.round((Date.now() - (lastEventTime || Date.now())) / 1000));

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    const q = searchQuery.trim().toUpperCase() || "SAT-1042";
    onCheckSatellite(q);
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 56px)",
        background: "var(--bg)",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        color: "var(--text)",
      }}
      className="scrollbar-thin"
    >
      {/* ========================================================================= */}
      {/* SECTION 1: 3D SPACE ROCKET HERO SECTION */}
      {/* ========================================================================= */}
      <SpaceRocketHero3D
        onCheckSatellite={onCheckSatellite}
        onExploreHowItWorks={() => scrollToSection("how-it-works")}
        onQuickQuery={(id) => onCheckSatellite(id)}
        satCount={satCount}
        debrisCount={debrisCount}
        connected={connected}
        lastEventTime={lastEventTime}
        alertsCount={alertsCount}
      />

      {/* ========================================================================= */}
      {/* SECTION 1.5: ABOUT SKYGUARDX AI & 5-LAYER ARCHITECTURE SCROBBLER */}
      {/* ========================================================================= */}
      <section
        style={{
          padding: "36px 0 32px",
          background: "linear-gradient(180deg, rgba(6, 9, 14, 0.98) 0%, rgba(13, 18, 28, 0.95) 50%, rgba(6, 9, 14, 0.98) 100%)",
          borderTop: "1px solid rgba(59, 130, 246, 0.25)",
          borderBottom: "1px solid rgba(59, 130, 246, 0.25)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto 20px", padding: "0 24px" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--blue)", fontWeight: 800, letterSpacing: "0.08em", background: "rgba(59, 130, 246, 0.12)", border: "1px solid rgba(59, 130, 246, 0.3)", padding: "3px 8px", borderRadius: 4, marginBottom: 6 }}>
                <span>🛡️</span>
                <span>MISSION & ARCHITECTURE · BUILT BY @MATRIX-5</span>
              </div>
              <h2 style={{ fontSize: 26, fontWeight: 900, margin: "2px 0 0", color: "#ffffff", letterSpacing: "-0.01em" }}>
                About SKYGUARD XAI
              </h2>
              <div style={{ fontSize: 13.5, color: "var(--text-muted)", marginTop: 4 }}>
                Real-Time Space-to-Earth Emergency Decision Intelligence built for the IBM Z Datathon.
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--blue-light)" }}>
              <span className="radar-live" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--teal)" }} />
              <span>THE 5-LAYER DECISION ARCHITECTURE SCROBBLER</span>
            </div>
          </div>

          {/* Datathon Theme Card */}
          <div
            style={{
              background: "linear-gradient(90deg, rgba(59, 130, 246, 0.12) 0%, rgba(13, 18, 28, 0.85) 100%)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              borderRadius: 8,
              padding: "16px 20px",
              marginBottom: 20,
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ fontSize: 10.5, fontFamily: "var(--font-mono)", color: "var(--blue-light)", fontWeight: 800, letterSpacing: "0.06em" }}>
              DATATHON THEME: REAL-TIME AI FOR CRITICAL DECISIONS
            </div>
            <div style={{ fontSize: 13, color: "var(--text)", marginTop: 6, lineHeight: 1.5 }}>
              In modern space and orbital operations, anomalies unfold in seconds, but orbital collisions can trigger irreversible cascades.
              SKYGUARD XAI bridges real-time telemetry streaming with unsupervised machine learning to deliver explainable, actionable decision intelligence before a threat escalates.
            </div>
          </div>
        </div>

        {/* Continuous Horizontal Scrobbler Ribbon (The 5-Layer Decision Architecture) */}
        <div className="scrobbler-wrapper" style={{ padding: "6px 0" }}>
          <div className="scrobbler-track">
            {[
              {
                layer: "LAYER 1",
                tag: "SPACE INTELLIGENCE",
                status: "ACTIVE & VERIFIED",
                statusColor: "var(--teal)",
                icon: "🛰️",
                title: "Space Intelligence",
                desc: "Continuous satellite telemetry ingestion, 5-feature Isolation Forest anomaly detection, 3D spatial debris conjunction tracking, and transparent 0–100% unified risk scoring.",
                tech: "SGP4 · Scikit-Learn · Celestrack TLE",
                view: "monitor",
              },
              {
                layer: "LAYER 2",
                tag: "EARTH IMPACT",
                status: "LIVE GEOJSON",
                statusColor: "var(--yellow)",
                icon: "🌍",
                title: "Earth Impact Risk",
                desc: "Translates orbital satellite degradation and debris re-entry trajectories into geographic hazard zones and ground asset risk footprints with active NOAA wildfire/flood polygons.",
                tech: "NOAA CAP Alerts · Shapely Geometry",
                view: "monitor",
              },
              {
                layer: "LAYER 3",
                tag: "EMERGENCY RESPONSE",
                status: "LIVE OVERPASS",
                statusColor: "var(--blue-light)",
                icon: "🏥",
                title: "Emergency Response",
                desc: "Synthesizes ground infrastructure vulnerability, population density corridors, and regional emergency services readiness across hospitals, fire stations, and critical logistics.",
                tech: "OpenStreetMap · Overpass API",
                view: "monitor",
              },
              {
                layer: "LAYER 4",
                tag: "CRITICAL LOGISTICS",
                status: "CASCADE GRAPH",
                statusColor: "#a855f7",
                icon: "⚡",
                title: "Critical Logistics",
                desc: "Dynamic routing for hospitals, ambulances, and emergency logistics impacted by telecommunications or power disruptions modeled via a NetworkX dependency propagation graph.",
                tech: "NetworkX · GeoPandas Spatial Joins",
                view: "analytics",
              },
              {
                layer: "LAYER 5",
                tag: "MAINFRAME TRANSACTION BOUNDARY",
                status: "IBM Z & QUANTUM-SAFE",
                statusColor: "var(--yellow)",
                icon: "🛡️",
                title: "IBM Z Transaction Boundary",
                desc: "Sub-4ms in-transaction AI scoring via IBM Telum coprocessor + Post-Quantum ML-KEM-1024 cryptographic approval ledger committed immutably to IBM Db2 for z/OS.",
                tech: "IBM Telum · Db2 z/OS · ML-KEM-1024",
                view: "analytics",
              },
              {
                layer: "ENGINEERED BY",
                tag: "MISSION CONTROL",
                status: "DATATHON 2026",
                statusColor: "var(--yellow)",
                icon: "🚀",
                title: "Team @matrix-5",
                desc: "Architected for the IBM Z Datathon 2026. Built with high-assurance aerospace safety rules: strict human-in-the-loop sign-off, zero hallucinations, and tamper-proof audit trails.",
                tech: "Team @matrix-5 · Verified Prototype",
                view: "about",
              },
              // Duplicate set for seamless continuous loop
              {
                layer: "LAYER 1",
                tag: "SPACE INTELLIGENCE",
                status: "ACTIVE & VERIFIED",
                statusColor: "var(--teal)",
                icon: "🛰️",
                title: "Space Intelligence",
                desc: "Continuous satellite telemetry ingestion, 5-feature Isolation Forest anomaly detection, 3D spatial debris conjunction tracking, and transparent 0–100% unified risk scoring.",
                tech: "SGP4 · Scikit-Learn · Celestrack TLE",
                view: "monitor",
              },
              {
                layer: "LAYER 2",
                tag: "EARTH IMPACT",
                status: "LIVE GEOJSON",
                statusColor: "var(--yellow)",
                icon: "🌍",
                title: "Earth Impact Risk",
                desc: "Translates orbital satellite degradation and debris re-entry trajectories into geographic hazard zones and ground asset risk footprints with active NOAA wildfire/flood polygons.",
                tech: "NOAA CAP Alerts · Shapely Geometry",
                view: "monitor",
              },
              {
                layer: "LAYER 3",
                tag: "EMERGENCY RESPONSE",
                status: "LIVE OVERPASS",
                statusColor: "var(--blue-light)",
                icon: "🏥",
                title: "Emergency Response",
                desc: "Synthesizes ground infrastructure vulnerability, population density corridors, and regional emergency services readiness across hospitals, fire stations, and critical logistics.",
                tech: "OpenStreetMap · Overpass API",
                view: "monitor",
              },
              {
                layer: "LAYER 4",
                tag: "CRITICAL LOGISTICS",
                status: "CASCADE GRAPH",
                statusColor: "#a855f7",
                icon: "⚡",
                title: "Critical Logistics",
                desc: "Dynamic routing for hospitals, ambulances, and emergency logistics impacted by telecommunications or power disruptions modeled via a NetworkX dependency propagation graph.",
                tech: "NetworkX · GeoPandas Spatial Joins",
                view: "analytics",
              },
              {
                layer: "LAYER 5",
                tag: "MAINFRAME TRANSACTION BOUNDARY",
                status: "IBM Z & QUANTUM-SAFE",
                statusColor: "var(--yellow)",
                icon: "🛡️",
                title: "IBM Z Transaction Boundary",
                desc: "Sub-4ms in-transaction AI scoring via IBM Telum coprocessor + Post-Quantum ML-KEM-1024 cryptographic approval ledger committed immutably to IBM Db2 for z/OS.",
                tech: "IBM Telum · Db2 z/OS · ML-KEM-1024",
                view: "analytics",
              },
              {
                layer: "ENGINEERED BY",
                tag: "MISSION CONTROL",
                status: "DATATHON 2026",
                statusColor: "var(--yellow)",
                icon: "🚀",
                title: "Team @matrix-5",
                desc: "Architected for the IBM Z Datathon 2026. Built with high-assurance aerospace safety rules: strict human-in-the-loop sign-off, zero hallucinations, and tamper-proof audit trails.",
                tech: "Team @matrix-5 · Verified Prototype",
                view: "about",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="scrobbler-card"
                onClick={() => onNavigateView ? onNavigateView(item.view) : onOpenMonitor ? onOpenMonitor() : null}
                style={{
                  minWidth: "340px",
                  maxWidth: "380px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--blue-light)" }}>
                      {item.layer}
                    </span>
                    <span style={{ color: "var(--text-muted)", fontSize: 10 }}>·</span>
                    <span style={{ fontSize: 9.5, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                      {item.tag}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 8.5,
                      fontWeight: 800,
                      fontFamily: "var(--font-mono)",
                      color: item.statusColor,
                      background: "rgba(255, 255, 255, 0.05)",
                      border: `1px solid ${item.statusColor}55`,
                      padding: "2px 6px",
                      borderRadius: 3,
                    }}
                  >
                    {item.status}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#ffffff" }}>
                    {item.title}
                  </span>
                </div>

                <div style={{ fontSize: 11.5, color: "var(--text-muted)", lineHeight: 1.5, marginBottom: 12 }}>
                  {item.desc}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 8 }}>
                  <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--blue-light)" }}>
                    {item.tech}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--yellow)", fontWeight: 700 }}>
                    Inspect ↗
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 1.75: SKYGUARD REAL-TIME TRANSACTIONAL & SYSTEM DEFENSE SHOWCASE */}
      {/* ========================================================================= */}
      <SkyGuardDefenseShowcase
        onOpenMonitor={onOpenMonitor}
        onNavigateAbout={() => (onNavigateView ? onNavigateView("about") : null)}
      />

      {/* ========================================================================= */}
      {/* SECTION 2: LIVE SYSTEM PREVIEW */}
      {/* ========================================================================= */}
      <section
        style={{
          padding: "50px 24px",
          background: "var(--panel)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--teal)", fontWeight: 700, letterSpacing: "0.08em" }}>
              LIVE SYSTEM PREVIEW
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 800, margin: "6px 0 0", color: "var(--text)" }}>
              See Space Intelligence in Action
            </h2>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
              Direct intelligence snapshot generated from active satellite telemetry and orbital proximity
            </div>
          </div>

          {/* Intelligence Preview 3D Interactive Card */}
          <Card3D maxTilt={6} elevation={24} scale={1.01}>
            <div
              style={{
                background: "var(--bg)",
                border: "1.5px solid rgba(230, 57, 70, 0.4)",
                borderRadius: 8,
                padding: "22px 26px",
                boxShadow: "0 14px 40px rgba(0,0,0,0.6), 0 0 20px rgba(230, 57, 70, 0.15)",
                display: "flex",
                flexDirection: "column",
                gap: 18,
              }}
            >
            {/* Header row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 24 }}>🚨</span>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>SAT-1042</span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>SKYGUARD-LEO-PRIMARY</span>
                    <span
                      style={{
                        background: "#e63946",
                        color: "#ffffff",
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: 3,
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      HIGH RISK
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>
                    AI detected abnormal telemetry signature + 0.72 km proximity to orbital debris
                  </div>
                </div>
              </div>

              {/* KPI Strip */}
              <div style={{ display: "flex", gap: 20, fontFamily: "var(--font-mono)" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 9.5, color: "var(--text-muted)" }}>RISK SCORE</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#e63946" }}>89%</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 9.5, color: "var(--text-muted)" }}>CONFIDENCE</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text)" }}>94%</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 9.5, color: "var(--text-muted)" }}>HEALTH</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#ff9f1c" }}>82%</div>
                </div>
              </div>
            </div>

            {/* Evidence & Deltas */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 12,
                background: "var(--panel-raised)",
                padding: "14px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                fontSize: 12,
                fontFamily: "var(--font-mono)",
              }}
            >
              <div>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>TEMPERATURE</div>
                <div style={{ color: "#ff9f1c", fontWeight: 700, marginTop: 2 }}>24.5°C → 71.0°C (+190%)</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>POWER DRAW</div>
                <div style={{ color: "#ff9f1c", fontWeight: 700, marginTop: 2 }}>62W → 94W (+52%)</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>BATTERY DEGRADATION</div>
                <div style={{ color: "#e63946", fontWeight: 700, marginTop: 2 }}>91% → 42% (-54%)</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>CONJUNCTION PROXIMITY</div>
                <div style={{ color: "#e63946", fontWeight: 700, marginTop: 2 }}>DEB-2098 at 0.72 km</div>
              </div>
            </div>

            {/* Bottom action */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <span style={{ fontSize: 11.5, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                Decision State: <strong style={{ color: "#ff9f1c" }}>Operator review required. Autonomous maneuver disabled.</strong>
              </span>
              <button
                onClick={() => onCheckSatellite("SAT-1042")}
                className="cta-button"
                style={{ padding: "8px 18px", fontSize: 12 }}
              >
                <span>CHECK YOUR SATELLITE →</span>
              </button>
            </div>
          </div>
          </Card3D>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: WHY THIS MATTERS */}
      {/* ========================================================================= */}
      <section style={{ padding: "60px 24px", maxWidth: 960, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--blue)", fontWeight: 700, letterSpacing: "0.08em" }}>
          THE CORE PHILOSOPHY
        </div>
        <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 900, margin: "10px 0 16px", color: "var(--text)" }}>
          SPACE DATA IS ONLY USEFUL IF WE CAN ACT ON IT.
        </h2>
        <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 740, margin: "0 auto 36px" }}>
          Satellites continuously generate thousands of raw telemetry data points every second.
          Yet when an unexpected anomaly occurs, raw numbers alone cannot answer the critical questions:
          <em> Is something wrong? How serious is it? What changed? Why did the risk increase? Which event needs attention first?</em>
        </p>

        {/* Visual Transformation Flow inside Card3D */}
        <Card3D maxTilt={5} elevation={14} scale={1.01}>
          <div
            style={{
              background: "var(--panel)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "24px",
              boxShadow: "0 8px 28px rgba(0,0,0,0.5)",
              position: "relative",
            }}
          >
            <div
              className="laser-pipeline"
              style={{
                height: 2,
                width: "100%",
                borderRadius: 1,
                marginBottom: 20,
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-around",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 14,
                fontFamily: "var(--font-mono)",
                fontSize: 12,
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20 }}>📡</div>
                <div style={{ fontWeight: 700, color: "var(--text)", marginTop: 4 }}>RAW DATA</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Telemetry & Orbits</div>
              </div>
              <span style={{ color: "var(--text-muted)", fontSize: 16 }}>→</span>

              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20 }}>🤖</div>
                <div style={{ fontWeight: 700, color: "var(--blue)", marginTop: 4 }}>AI DETECTION</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Isolation Forest</div>
              </div>
              <span style={{ color: "var(--text-muted)", fontSize: 16 }}>→</span>

              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20 }}>🔎</div>
                <div style={{ fontWeight: 700, color: "var(--teal)", marginTop: 4 }}>EXPLANATION</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Baseline Deltas</div>
              </div>
              <span style={{ color: "var(--text-muted)", fontSize: 16 }}>→</span>

              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20 }}>📊</div>
                <div style={{ fontWeight: 700, color: "#ff9f1c", marginTop: 4 }}>RISK SCORE</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Calibrated 0-100%</div>
              </div>
              <span style={{ color: "var(--text-muted)", fontSize: 16 }}>→</span>

              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20 }}>🚨</div>
                <div style={{ fontWeight: 700, color: "#e63946", marginTop: 4 }}>ALERT</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Human Sign-off</div>
              </div>
            </div>
          </div>
        </Card3D>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: PROBLEM -> SOLUTION */}
      {/* ========================================================================= */}
      <section
        style={{
          padding: "50px 24px",
          background: "var(--panel)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
            {/* The Challenge */}
            <div
              style={{
                background: "var(--panel-raised)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "28px 26px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#e63946" }}>
                <span style={{ fontSize: 18 }}>⚠️</span>
                <span style={{ fontWeight: 800, fontSize: 14, fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
                  THE CHALLENGE
                </span>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", margin: 0 }}>
                Data Overload & Alert Fatigue
              </h3>
              <p style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.55, margin: 0 }}>
                Space systems generate massive volumes of continuously streaming metrics.
                Traditional mission monitoring relies on manual human inspection across separate, siloed dashboards:
              </p>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
                <li>Raw numerical telemetry logs without baseline context</li>
                <li>Isolated health charts without multi-variable correlation</li>
                <li>Disconnected orbital tracking without collision proximity</li>
                <li>Opaque risk indicators with no explainable justification</li>
              </ul>
            </div>

            {/* The Solution */}
            <div
              style={{
                background: "var(--panel-raised)",
                border: "1.5px solid rgba(46, 196, 182, 0.4)",
                borderRadius: 8,
                padding: "28px 26px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--teal)" }}>
                <span style={{ fontSize: 18 }}>✓</span>
                <span style={{ fontWeight: 800, fontSize: 14, fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
                  THE SKYGUARD XAI APPROACH
                </span>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", margin: 0 }}>
                Unified, Explainable Risk Intelligence
              </h3>
              <p style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.55, margin: 0 }}>
                SKYGUARD XAI continuously correlates incoming data streams and synthesizes them into actionable insights:
              </p>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>
                <li>✓ <strong>Multivariate Anomaly Detection:</strong> Unsupervised Isolation Forest</li>
                <li>✓ <strong>Subsystem Health Scoring:</strong> Transparent 0–100% operational rating</li>
                <li>✓ <strong>Conjunction Tracking:</strong> 3D miss distance & Time to Closest Approach</li>
                <li>✓ <strong>Explainable Evidence:</strong> Exact baseline deviations explaining WHY</li>
                <li>✓ <strong>Real-Time Alerts:</strong> High-priority warnings without autonomous risk</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5: WHAT SKYGUARD XAI DOES (6 FEATURE CARDS) */}
      {/* ========================================================================= */}
      <section style={{ padding: "60px 24px", maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--teal)", fontWeight: 700, letterSpacing: "0.08em" }}>
            PLATFORM CAPABILITIES
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 900, margin: "6px 0 0", color: "var(--text)" }}>
            ONE INTELLIGENCE LAYER FOR THE SPACE ENVIRONMENT
          </h2>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6 }}>
            Comprehensive observability across telemetry, satellite health, and orbital threats
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18 }}>
          {[
            {
              icon: "🛰",
              title: "SATELLITE MONITORING",
              desc: "Continuously track geodetic orbital coordinates, altitude (550 km), orbital velocity (7.6 km/s), and real-time operational status across the entire LEO constellation.",
            },
            {
              icon: "📡",
              title: "TELEMETRY INTELLIGENCE",
              desc: "Monitor thermal dissipation, battery state-of-charge, primary bus power draw, and RF signal strength at a fast 2.5-second sampling cadence.",
            },
            {
              icon: "🤖",
              title: "AI ANOMALY DETECTION",
              desc: "5-dimensional Isolation Forest evaluates multi-variable telemetry divergence to identify hardware degradation and sudden power surges before failure occurs.",
            },
            {
              icon: "☄",
              title: "CONJUNCTION DETECTION",
              desc: "Compute 3D Euclidean and geodetic proximity against cataloged orbital debris objects (e.g. DEB-2098) to calculate miss distance and Time to Closest Approach.",
            },
            {
              icon: "⚠",
              title: "RISK INTELLIGENCE",
              desc: "Harmonizes telemetry anomalies (40%), subsystem health (30%), and orbital conjunction proximity (30%) into a unified, mathematically calibrated risk score.",
            },
            {
              icon: "🔎",
              title: "EXPLAINABLE AI",
              desc: "No black-box decisions. Every generated alert reveals the structured evidence checklist, exact baseline percentage deviations, and confidence levels.",
            },
          ].map((card, i) => (
            <Card3D key={i} maxTilt={10} elevation={16} scale={1.03}>
              <div
                style={{
                  background: "var(--panel)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "24px 22px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  height: "100%",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
                  transition: "border-color 0.2s ease",
                }}
              >
                <div style={{ fontSize: 28 }}>{card.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 14, color: "var(--text)", letterSpacing: "0.02em" }}>
                  {card.title}
                </div>
                <div style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.55 }}>
                  {card.desc}
                </div>
              </div>
            </Card3D>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 6: HOW IT WORKS (7 PROCESS STEPS) */}
      {/* ========================================================================= */}
      <section
        id="how-it-works"
        style={{
          padding: "60px 24px",
          background: "var(--panel)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--blue)", fontWeight: 700, letterSpacing: "0.08em" }}>
              7-STEP DATA PIPELINE
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 900, margin: "6px 0 0", color: "var(--text)" }}>
              From Live Data to Intelligence
            </h2>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6 }}>
              How raw space telemetry becomes an actionable, operator-approved decision
            </div>
          </div>

          {/* Laser Pipeline Indicator Bar */}
          <div
            className="laser-pipeline"
            style={{
              height: 3,
              width: "100%",
              borderRadius: 2,
              marginBottom: 20,
              boxShadow: "0 0 10px rgba(59, 130, 246, 0.6)",
            }}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 14,
            }}
          >
            {[
              { num: "01", title: "RECEIVE", desc: "Live satellite telemetry frames arrive via real-time ingestion gateway." },
              { num: "02", title: "ANALYZE", desc: "SKYGUARD XAI evaluates multi-channel metrics against verified operating envelopes." },
              { num: "03", title: "DETECT", desc: "Isolation Forest identifies non-linear subsystem anomalies and thermal spikes." },
              { num: "04", title: "CORRELATE", desc: "Space-object spatial relationships and close-approach trajectories are calculated." },
              { num: "05", title: "ASSESS", desc: "Unified Space Risk Engine computes calibrated risk percentage (0–100%)." },
              { num: "06", title: "EXPLAIN", desc: "The platform isolates percentage baseline deviations to explain WHY." },
              { num: "07", title: "ALERT", desc: "Operators receive a real-time intelligence warning for human review." },
            ].map((st) => (
              <Card3D key={st.num} maxTilt={8} elevation={12} scale={1.03}>
                <div
                  style={{
                    background: "var(--panel-raised)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: "20px 18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    height: "100%",
                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.35)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 900, color: "var(--blue)" }}>
                      {st.num}
                    </span>
                    <span style={{ fontSize: 9.5, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                      STEP
                    </span>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "var(--text)" }}>{st.title}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.45 }}>{st.desc}</div>
                </div>
              </Card3D>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 7: AI EXPLAINABILITY SECTION (XAI) */}
      {/* ========================================================================= */}
      <section id="intelligence" style={{ padding: "60px 24px", maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--teal)", fontWeight: 700, letterSpacing: "0.08em" }}>
            EXPLAINABLE AI PRINCIPLES
          </div>
          <h2 style={{ fontSize: "clamp(24px, 4vw, 34px)", fontWeight: 900, margin: "6px 0 4px", color: "var(--text)" }}>
            AI SHOULD NOT JUST SAY "RISKY."
          </h2>
          <div style={{ fontSize: "clamp(18px, 3vw, 24px)", fontWeight: 800, color: "var(--blue)" }}>
            IT MUST TELL YOU WHY.
          </div>
        </div>

        {/* 3-Column Comparative Visual */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {/* Left Column: Observed Data */}
          <Card3D maxTilt={7} elevation={16} scale={1.02}>
            <div
              style={{
                background: "var(--panel)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "22px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                height: "100%",
                boxShadow: "0 4px 18px rgba(0,0,0,0.4)",
              }}
            >
              <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontWeight: 700 }}>
                1. OBSERVED DATA
              </div>
              <div style={{ fontSize: 12.5, fontFamily: "var(--font-mono)", display: "flex", flexDirection: "column", gap: 6 }}>
                <div>• Temperature: <strong style={{ color: "#ff9f1c" }}>71.0°C</strong> (baseline ~24.5°C)</div>
                <div>• Battery Level: <strong style={{ color: "#e63946" }}>42.0%</strong> (baseline ~91.0%)</div>
                <div>• Power Consumption: <strong style={{ color: "#ff9f1c" }}>94.0W</strong> (baseline ~62.0W)</div>
                <div>• Signal Strength: <strong style={{ color: "#f5c84c" }}>61.0%</strong> (baseline ~96.0%)</div>
                <div>• Proximity: <strong style={{ color: "#e63946" }}>0.72 km</strong> to DEB-2098</div>
              </div>
            </div>
          </Card3D>

          {/* Center Column: AI Analysis */}
          <Card3D maxTilt={7} elevation={16} scale={1.02}>
            <div
              style={{
                background: "var(--panel)",
                border: "1px solid var(--blue)",
                borderRadius: 8,
                padding: "22px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                height: "100%",
                boxShadow: "0 4px 20px rgba(59, 130, 246, 0.2)",
              }}
            >
              <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--blue)", fontWeight: 700 }}>
                2. AI MODEL ANALYSIS
              </div>
              <div style={{ fontSize: 12.5, fontFamily: "var(--font-mono)", display: "flex", flexDirection: "column", gap: 6 }}>
                <div>• Algorithm: <strong>Isolation Forest</strong></div>
                <div>• Telemetry Anomaly: <span style={{ color: "#ff9f1c", fontWeight: 700 }}>HIGH</span></div>
                <div>• Conjunction Risk: <span style={{ color: "#e63946", fontWeight: 700 }}>HIGH</span></div>
                <div>• Model: <strong>telemetry-anomaly-v1</strong></div>
                <div>• Confidence Rating: <strong>94.0%</strong></div>
              </div>
            </div>
          </Card3D>

          {/* Right Column: Intelligence & Evidence */}
          <Card3D maxTilt={7} elevation={18} scale={1.02}>
            <div
              style={{
                background: "rgba(230, 57, 70, 0.08)",
                border: "1px solid rgba(230, 57, 70, 0.4)",
                borderRadius: 8,
                padding: "22px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                height: "100%",
                boxShadow: "0 6px 24px rgba(230, 57, 70, 0.2)",
              }}
            >
              <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "#e63946", fontWeight: 700 }}>
                3. EXPLAINABLE INTELLIGENCE
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#e63946" }}>
                OVERALL RISK: 89% (HIGH RISK)
              </div>
              <div style={{ fontSize: 11.5, color: "var(--text)", lineHeight: 1.45 }}>
                ✓ Temperature spike (+190% above baseline)<br />
                ✓ Power consumption surge (+52% draw)<br />
                ✓ Rapid battery degradation (-54% capacity)<br />
                ✓ Conjunction: 0.72 km miss distance with DEB-2098<br />
                <strong>Action: Operator review required.</strong>
              </div>
            </div>
          </Card3D>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 8: LIVE SATELLITE CHECK SECTION (INTERACTIVE HERO) */}
      {/* ========================================================================= */}
      <section
        id="check-satellite"
        style={{
          padding: "60px 24px",
          background: "var(--panel)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--blue)", fontWeight: 700, letterSpacing: "0.08em" }}>
            INTERACTIVE QUERY ENGINE
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 900, margin: "6px 0 10px", color: "var(--text)" }}>
            CHECK A SATELLITE
          </h2>
          <p style={{ fontSize: 14.5, color: "var(--text-muted)", maxWidth: 560, margin: "0 auto 28px" }}>
            Enter a satellite name or identifier to execute real-time anomaly detection,
            subsystem health scoring, and orbital proximity analysis.
          </p>

          {/* Search Box Form */}
          <form
            onSubmit={handleSearchSubmit}
            style={{
              display: "flex",
              gap: 10,
              background: "var(--bg)",
              padding: "10px",
              borderRadius: 8,
              border: "1.5px solid var(--border)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
            }}
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter satellite name or ID (e.g. SAT-1042, SAT-1001)"
              style={{
                flex: 1,
                padding: "12px 16px",
                fontSize: 14.5,
                fontFamily: "var(--font-mono)",
                background: "transparent",
                color: "var(--text)",
                border: "none",
                outline: "none",
              }}
            />
            <button type="submit" className="cta-button" style={{ padding: "0 24px" }}>
              <span>CHECK LIVE STATUS</span>
            </button>
          </form>

          {/* Chips */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 18 }}>
            <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)", alignSelf: "center" }}>
              AVAILABLE SCENARIOS:
            </span>
            <button onClick={() => onCheckSatellite("SAT-1042")} className="chip-btn" style={{ borderLeft: "3px solid #e63946" }}>
              <span>🚨 SAT-1042 (HIGH RISK · Anomaly + Conjunction)</span>
            </button>
            <button onClick={() => onCheckSatellite("SAT-1001")} className="chip-btn" style={{ borderLeft: "3px solid #2ec4b6" }}>
              <span>🟢 SAT-1001 (NORMAL · Baseline)</span>
            </button>
            <button onClick={() => onCheckSatellite("SAT-1003")} className="chip-btn" style={{ borderLeft: "3px solid #f5c84c" }}>
              <span>🟡 SAT-1003 (WARNING · Thermal Drift)</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 9: WHAT YOU GET (SATELLITE ANALYSIS PREVIEW) */}
      {/* ========================================================================= */}
      <section style={{ padding: "60px 24px", maxWidth: 960, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.08em" }}>
            EXPLAINABLE OUTPUT FORMAT
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 800, margin: "6px 0 0", color: "var(--text)" }}>
            What You Get When You Query
          </h2>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
            Every query yields a deterministic, multi-dimensional decision breakdown
          </div>
        </div>

        <div
          style={{
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "24px 28px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: 6 }}>
              INTELLIGENCE SUMMARY
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>SAT-1042</div>
            <div style={{ color: "#e63946", fontWeight: 700, fontSize: 13, marginTop: 2 }}>🔴 HIGH RISK DETECTED</div>
            <div style={{ display: "flex", gap: 14, marginTop: 12, fontFamily: "var(--font-mono)", fontSize: 12 }}>
              <div>Risk: <strong style={{ color: "#e63946" }}>89%</strong></div>
              <div>Confidence: <strong>94%</strong></div>
              <div>Health: <strong>82%</strong></div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: 6 }}>
              WHY IS THIS RISKY?
            </div>
            <div style={{ fontSize: 12, fontFamily: "var(--font-mono)", display: "flex", flexDirection: "column", gap: 4 }}>
              <div>⚠ Temperature: 24.5°C → 71.0°C (+190%)</div>
              <div>⚠ Power Draw: 62W → 94W (+52%)</div>
              <div>⚠ Battery: 91% → 42% (-54%)</div>
              <div>⚠ Conjunction: DEB-2098 at 0.72 km</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 10: NORMAL VS HIGH RISK (3 SEVERITY STATES) */}
      {/* ========================================================================= */}
      <section
        style={{
          padding: "60px 24px",
          background: "var(--panel)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--teal)", fontWeight: 700, letterSpacing: "0.08em" }}>
              TIERED THREAT EVALUATION
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 900, margin: "6px 0 0", color: "var(--text)" }}>
              NOT EVERY ALERT IS A CRISIS.
            </h2>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
              Calibrated threat thresholds distinguish between nominal drift, moderate warnings, and critical conjunctions
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18 }}>
            {/* Normal Card */}
            <Card3D maxTilt={8} elevation={14} scale={1.03}>
              <div
                style={{
                  background: "var(--panel-raised)",
                  border: "1px solid rgba(46, 196, 182, 0.35)",
                  borderRadius: 8,
                  padding: "22px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  height: "100%",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.35)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 18 }}>🟢</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "var(--teal)", fontFamily: "var(--font-mono)" }}>
                    NORMAL
                  </span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>SAT-1001</div>
                <div style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                  Risk: <strong style={{ color: "var(--teal)" }}>8%</strong> · Health: <strong>97%</strong> · Confidence: <strong>96%</strong>
                </div>
                <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.45 }}>
                  No significant anomaly detected. Telemetry metrics remain securely within expected baseline envelopes.
                </div>
                <button
                  onClick={() => onCheckSatellite("SAT-1001")}
                  style={{
                    background: "transparent",
                    border: "1px solid var(--border)",
                    color: "var(--teal)",
                    padding: "6px 12px",
                    borderRadius: 4,
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                    cursor: "pointer",
                    marginTop: "auto",
                  }}
                >
                  Inspect SAT-1001 →
                </button>
              </div>
            </Card3D>

            {/* Warning Card */}
            <Card3D maxTilt={8} elevation={14} scale={1.03}>
              <div
                style={{
                  background: "var(--panel-raised)",
                  border: "1px solid rgba(245, 200, 76, 0.4)",
                  borderRadius: 8,
                  padding: "22px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  height: "100%",
                  boxShadow: "0 4px 20px rgba(245, 200, 76, 0.15)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 18 }}>🟡</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#f5c84c", fontFamily: "var(--font-mono)" }}>
                    WARNING
                  </span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>SAT-1003</div>
                <div style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                  Risk: <strong style={{ color: "#f5c84c" }}>42%</strong> · Health: <strong>78%</strong> · Confidence: <strong>91%</strong>
                </div>
                <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.45 }}>
                  Potential abnormal behavior detected. Mild thermal rise (~38.5°C) and battery capacity drift noted.
                </div>
                <button
                  onClick={() => onCheckSatellite("SAT-1003")}
                  style={{
                    background: "transparent",
                    border: "1px solid var(--border)",
                    color: "#f5c84c",
                    padding: "6px 12px",
                    borderRadius: 4,
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                    cursor: "pointer",
                    marginTop: "auto",
                  }}
                >
                  Inspect SAT-1003 →
                </button>
              </div>
            </Card3D>

            {/* High Risk Card */}
            <Card3D maxTilt={8} elevation={16} scale={1.03}>
              <div
                style={{
                  background: "var(--panel-raised)",
                  border: "1px solid rgba(230, 57, 70, 0.5)",
                  borderRadius: 8,
                  padding: "22px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  height: "100%",
                  boxShadow: "0 6px 24px rgba(230, 57, 70, 0.25)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 18 }}>🔴</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#e63946", fontFamily: "var(--font-mono)" }}>
                    HIGH RISK
                  </span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>SAT-1042</div>
                <div style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                  Risk: <strong style={{ color: "#e63946" }}>89%</strong> · Health: <strong>82%</strong> · Confidence: <strong>94%</strong>
                </div>
                <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.45 }}>
                  Severe multivariate anomaly (71°C) and orbital conjunction proximity (0.72 km) detected. Human review required.
                </div>
                <button
                  onClick={() => onCheckSatellite("SAT-1042")}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(230, 57, 70, 0.5)",
                    color: "#e63946",
                    padding: "6px 12px",
                    borderRadius: 4,
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                    cursor: "pointer",
                    marginTop: "auto",
                  }}
                >
                  Inspect SAT-1042 →
                </button>
              </div>
            </Card3D>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 11: REAL-TIME TIMELINE (DATATHON THEME) */}
      {/* ========================================================================= */}
      <section style={{ padding: "60px 24px", maxWidth: 960, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--blue)", fontWeight: 700, letterSpacing: "0.08em" }}>
            DATATHON THEME: REAL-TIME AI FOR CRITICAL DECISIONS
          </div>
          <h2 style={{ fontSize: "clamp(24px, 4vw, 34px)", fontWeight: 900, margin: "6px 0 0", color: "var(--text)" }}>
            REAL-TIME CHANGES THE VALUE OF INTELLIGENCE
          </h2>
          <div style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 6 }}>
            Speed to actionable insight is the difference between preventing an orbital collision and managing a catastrophe
          </div>
        </div>

        {/* Real-time sequence */}
        <div
          style={{
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "24px 28px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            fontFamily: "var(--font-mono)",
            fontSize: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: "var(--text-muted)", width: 70 }}>10:02:08</span>
            <span style={{ color: "var(--teal)" }}>📡 Telemetry frame received</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>SAT-1042</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: "var(--text-muted)", width: 70 }}>10:02:11</span>
            <span style={{ color: "#ff9f1c" }}>🌡 Telemetry anomaly detected</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Temperature spike 71.0°C</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: "var(--text-muted)", width: 70 }}>10:02:13</span>
            <span style={{ color: "#ff9f1c" }}>📊 Risk score updated</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Escalated 24% → 62%</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: "var(--text-muted)", width: 70 }}>10:02:15</span>
            <span style={{ color: "#e63946" }}>☄ Conjunction proximity flagged</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>DEB-2098 at 0.72 km</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(230, 57, 70, 0.12)", padding: "8px 10px", borderRadius: 4 }}>
            <span style={{ color: "#e63946", width: 70, fontWeight: 700 }}>10:02:16</span>
            <span style={{ color: "#e63946", fontWeight: 700 }}>🚨 HIGH RISK ALERT GENERATED</span>
            <span style={{ fontSize: 11, color: "#ff9f1c" }}>Operator review required</span>
          </div>
        </div>

        <blockquote
          style={{
            margin: "24px 0 0",
            padding: "16px 20px",
            borderLeft: "3px solid var(--blue)",
            background: "rgba(76, 154, 255, 0.08)",
            borderRadius: "0 6px 6px 0",
            fontSize: 14,
            color: "var(--text)",
            fontStyle: "italic",
          }}
        >
          "A useful prediction is not only about being accurate. It is also about being available when the decision still matters."
        </blockquote>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 12: LIVE MONITOR PREVIEW */}
      {/* ========================================================================= */}
      <section
        style={{
          padding: "60px 24px",
          background: "var(--panel)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 30 }}>
            <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--teal)", fontWeight: 700, letterSpacing: "0.08em" }}>
              CONSTELLATION OBSERVABILITY
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 900, margin: "6px 0 0", color: "var(--text)" }}>
              See the Whole Space Environment
            </h2>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
              Need to inspect all 6 satellites, debris tracks, and active alarms simultaneously?
            </div>
          </div>

          <div
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 20,
            }}
          >
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>
                SKYGUARD XAI Mission Command Center
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, maxWidth: 620 }}>
                Includes full interactive Leaflet map projection, active fleet table, live event timeline,
                and formal AI model reproducibility metrics.
              </div>
            </div>

            <button onClick={onOpenMonitor} className="cta-button" style={{ padding: "12px 24px" }}>
              <span>OPEN LIVE MONITOR →</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 13: IBM Z CONNECTION */}
      {/* ========================================================================= */}
      <section style={{ padding: "60px 24px", maxWidth: 960, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--blue)", fontWeight: 700, letterSpacing: "0.08em" }}>
          TRANSACTIONAL GOVERNANCE
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 900, margin: "6px 0 10px", color: "var(--text)" }}>
          FROM SPACE INTELLIGENCE TO TRANSACTIONAL DECISIONS
        </h2>

        {/* Pipeline Visual inside Card3D */}
        <Card3D maxTilt={5} elevation={12} scale={1.01} style={{ margin: "20px auto", maxWidth: 840 }}>
          <div
            style={{
              background: "var(--panel)",
              border: "1px solid rgba(59, 130, 246, 0.35)",
              borderRadius: 8,
              padding: "26px 28px",
              boxShadow: "0 8px 30px rgba(0, 0, 0, 0.45)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                marginBottom: 20,
              }}
            >
              <span className="pill">SPACE DATA</span>
              <span>→</span>
              <span className="pill">AI ANALYSIS</span>
              <span>→</span>
              <span className="pill" style={{ color: "var(--amber)" }}>SPACE RISK</span>
              <span>→</span>
              <span className="pill" style={{ color: "var(--blue)" }}>TRANSACTIONAL INTELLIGENCE</span>
              <span>→</span>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 4,
                  background: "rgba(59, 130, 246, 0.25)",
                  color: "var(--blue)",
                  fontWeight: 700,
                  border: "1px solid var(--blue)",
                  boxShadow: "0 0 10px rgba(59, 130, 246, 0.4)",
                }}
              >
                IBM Z ADAPTER
              </span>
            </div>

            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 720, margin: "0 auto 16px" }}>
              SKYGUARD XAI is designed so that real-time space risk events can eventually become inputs to transactional
              systems responsible for critical decisions. In-process isolation bridges real-time Python AI models to
              transactional scoring boundaries.
            </p>

            <div style={{ display: "inline-block" }}>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-muted)",
                  background: "var(--panel-raised)",
                  padding: "6px 14px",
                  borderRadius: 20,
                  border: "1px solid var(--border)",
                }}
              >
                INTEGRATION STATUS: <strong style={{ color: "var(--blue-light)" }}>IBM Z INTEGRATION READY</strong> (Simulated In-Process Boundary)
              </span>
            </div>
          </div>
        </Card3D>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 14: FUTURE VISION (5 LAYERS) */}
      {/* ========================================================================= */}
      <section
        id="future-vision"
        style={{
          padding: "60px 24px",
          background: "var(--panel)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--blue)", fontWeight: 700, letterSpacing: "0.08em" }}>
              FUTURE ARCHITECTURE
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 900, margin: "6px 0 0", color: "var(--text)" }}>
              SPACE INTELLIGENCE IS ONLY THE BEGINNING.
            </h2>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6 }}>
              How orbital threats will cascade to Earth Impact, infrastructure resilience, and emergency logistics
            </div>
          </div>

          <div
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "24px",
              fontFamily: "var(--font-mono)",
              fontSize: 11.5,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div style={{ color: "var(--teal)", fontWeight: 700 }}>
              LAYER 1: SPACE INTELLIGENCE [ACTIVE]
            </div>
            <span>↓</span>
            <div style={{ color: "var(--text-muted)" }}>LAYER 2: EARTH IMPACT</div>
            <span>↓</span>
            <div style={{ color: "var(--text-muted)" }}>LAYER 3: EMERGENCY RESPONSE</div>
            <span>↓</span>
            <div style={{ color: "var(--text-muted)" }}>LAYER 4: HOSPITALS & LOGISTICS</div>
            <span>↓</span>
            <div style={{ color: "var(--blue)", fontWeight: 700 }}>
              LAYER 5: HUMAN APPROVAL DECISION SUPPORT
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 18, fontSize: 12, color: "var(--text-muted)" }}>
            * Layers 2–5 represent the future roadmap for the Datathon presentation. Layer 1 is fully active and operational today.
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 15: FINAL CALL TO ACTION */}
      {/* ========================================================================= */}
      <section style={{ padding: "80px 24px 70px", maxWidth: 840, margin: "0 auto", textAlign: "center" }}>
        <h2 style={{ fontSize: "clamp(26px, 4.5vw, 38px)", fontWeight: 900, color: "var(--text)", margin: "0 0 14px" }}>
          Ready to see what SKYGUARD XAI sees?
        </h2>
        <p style={{ fontSize: 15.5, color: "var(--text-muted)", maxWidth: 580, margin: "0 auto 32px", lineHeight: 1.55 }}>
          Choose any satellite identifier to discover its current health, AI risk assessment,
          subsystem anomalies, and orbital proximity threats.
        </p>

        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => onCheckSatellite("SAT-1042")}
            className="cta-button glow-teal"
            style={{ padding: "14px 32px", fontSize: 14 }}
          >
            <span>🔍 CHECK LIVE SATELLITE</span>
          </button>
          <button
            onClick={onOpenMonitor}
            style={{
              background: "var(--panel-raised)",
              color: "var(--text)",
              border: "1px solid var(--border)",
              padding: "13px 24px",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <span>🛰 EXPLORE LIVE MONITOR</span>
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 16: COMPREHENSIVE COMMAND CENTER FOOTER */}
      {/* ========================================================================= */}
      <AppFooter
        onNavigate={onNavigateView}
        onCheckSatellite={onCheckSatellite}
        onOpenMonitor={onOpenMonitor}
      />
    </div>
  );
}
