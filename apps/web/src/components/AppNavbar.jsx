import React, { useState, useEffect, useRef } from "react";
import BrandLogoIcon from "./BrandLogoIcon.jsx";

export default function AppNavbar({
  currentView,
  onNavigate,
  connected,
  lastEventTime,
  alertsCount = 0,
  demoStatus,
  onStartDemo,
  onResetDemo,
  selectedSatId = "SAT-1042",
  onSelectSatellite,
  satellites = {},
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); // 'ops' | 'system' | null
  const [utcTime, setUtcTime] = useState("");
  const dropdownRef = useRef(null);

  // Live UTC Mission Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, "0");
      const minutes = String(now.getUTCMinutes()).padStart(2, "0");
      const seconds = String(now.getUTCSeconds()).padStart(2, "0");
      setUtcTime(`${hours}:${minutes}:${seconds} UTC`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const satList = Object.values(satellites);

  const handleNav = (viewId, satId = null) => {
    setOpenDropdown(null);
    setMobileMenuOpen(false);
    onNavigate(viewId, satId);
  };

  const isOpsActive = ["satellites", "alerts", "events"].includes(currentView);
  const isSystemActive = ["analytics", "about"].includes(currentView);

  return (
    <header
      ref={dropdownRef}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 14px",
        height: "62px",
        background: "rgba(6, 9, 14, 0.92)",
        borderBottom: "1px solid rgba(30, 41, 59, 0.8)",
        gap: 10,
        zIndex: 1000,
        position: "sticky",
        top: 0,
        maxWidth: "100%",
        boxSizing: "border-box",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: "0 4px 30px rgba(0, 0, 0, 0.7)",
      }}
    >
      {/* 1. Left: Brand & Connectivity Status */}
      <div
        onClick={() => handleNav("home")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          cursor: "pointer",
          userSelect: "none",
          flexShrink: 0,
          transition: "transform 0.2s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
        title="SkyGuardX AI — Space-to-Earth Decision Intelligence by @matrix-5"
      >
        <BrandLogoIcon connected={connected} />

        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontWeight: 900,
                letterSpacing: "0.06em",
                fontSize: 16.5,
                color: "#ffffff",
                fontFamily: "var(--font-ui)",
              }}
            >
              SKYGUARD<span style={{ color: "var(--yellow)", textShadow: "0 0 12px rgba(245, 200, 76, 0.5)" }}>X</span>
            </span>
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 800,
                padding: "2px 7px",
                borderRadius: 4,
                background: connected ? "rgba(46, 196, 182, 0.16)" : "rgba(230, 57, 70, 0.16)",
                color: connected ? "var(--teal)" : "var(--red)",
                border: `1px solid ${connected ? "rgba(46, 196, 182, 0.4)" : "rgba(230, 57, 70, 0.4)"}`,
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.05em",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: connected ? "var(--teal)" : "var(--red)" }} />
              {connected ? "LIVE" : "OFFLINE"}
            </span>
          </div>
          <div
            style={{
              fontSize: 9.5,
              color: "var(--text-muted)",
              letterSpacing: "0.06em",
              fontFamily: "var(--font-mono)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>SPACE-TO-EARTH AI</span>
            <span style={{ color: "var(--yellow)", fontWeight: 700 }}>· @matrix-5</span>
          </div>
        </div>
      </div>

      {/* 2. Center: Dynamic Horizontal Navigation Bar */}
      <nav
        style={{
          display: "flex",
          gap: 6,
          alignItems: "center",
          background: "rgba(13, 18, 28, 0.65)",
          padding: "5px 8px",
          borderRadius: 10,
          border: "1px solid rgba(30, 41, 59, 0.7)",
          backdropFilter: "blur(12px)",
        }}
        className="desktop-nav navbar-center-nav"
      >
        {/* TAB 1: Home */}
        <button
          onClick={() => handleNav("home")}
          className={`nav-btn ${currentView === "home" ? "active" : ""}`}
          title="Platform Overview & 3D Interactive Rocket Showcase"
        >
          <span style={{ fontSize: 15 }}>🌐</span>
          <span>Home</span>
        </button>

        {/* TAB 2: Live Command Center (PRIMARY STAR FEATURE) */}
        <button
          onClick={() => handleNav("monitor")}
          className={`nav-btn nav-btn-primary ${currentView === "monitor" ? "active" : ""}`}
          title="Command Center: Real-Time Orbital Map, Conjunctions & Autonomous Decisions"
        >
          <span style={{ fontSize: 15 }}>📡</span>
          <span>Command Center</span>
          <span
            style={{
              fontSize: 8.5,
              fontWeight: 800,
              background: "linear-gradient(135deg, var(--blue) 0%, var(--yellow) 100%)",
              color: "#06090e",
              padding: "2px 6px",
              borderRadius: 4,
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.04em",
              marginLeft: 2,
            }}
          >
            PRIMARY
          </span>
        </button>

        {/* TAB 3: AI Satellite Scanner */}
        <button
          onClick={() => handleNav("check", selectedSatId)}
          className={`nav-btn ${currentView === "check" ? "active" : ""}`}
          title="Search any satellite for instant AI risk assessment & anomaly diagnostics"
        >
          <span style={{ fontSize: 15 }}>🔍</span>
          <span>AI Scanner</span>
        </button>

        {/* TAB 4: Operations Dropdown (Fleet, Alerts, Events) */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setOpenDropdown(openDropdown === "ops" ? null : "ops")}
            className={`nav-btn ${isOpsActive ? "active" : ""}`}
            title="Operations: Fleet Directory, Active Alerts & Event Stream"
          >
            <span style={{ fontSize: 15 }}>🛰</span>
            <span>Operations</span>
            <span style={{ fontSize: 10, opacity: 0.7, transform: openDropdown === "ops" ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
              ▼
            </span>
            {alertsCount > 0 && (
              <span
                style={{
                  background: "var(--red)",
                  color: "#ffffff",
                  fontSize: 9,
                  fontWeight: 800,
                  padding: "1px 6px",
                  borderRadius: 10,
                  fontFamily: "var(--font-mono)",
                  boxShadow: "0 0 10px var(--red-glow)",
                  marginLeft: 2,
                }}
              >
                {alertsCount}
              </span>
            )}
          </button>

          {/* Operations Dropdown Menu */}
          {openDropdown === "ops" && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                width: 250,
                background: "rgba(13, 18, 28, 0.98)",
                border: "1px solid rgba(59, 130, 246, 0.35)",
                borderRadius: 10,
                padding: "8px",
                boxShadow: "0 16px 36px rgba(0, 0, 0, 0.75)",
                zIndex: 1100,
                display: "flex",
                flexDirection: "column",
                gap: 4,
                backdropFilter: "blur(20px)",
              }}
            >
              <button
                onClick={() => handleNav("satellites")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 12px",
                  borderRadius: 8,
                  background: currentView === "satellites" ? "rgba(59, 130, 246, 0.15)" : "transparent",
                  color: currentView === "satellites" ? "var(--yellow)" : "var(--text)",
                  textAlign: "left",
                  cursor: "pointer",
                  border: "none",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background =
                    currentView === "satellites" ? "rgba(59, 130, 246, 0.15)" : "transparent")
                }
              >
                <span style={{ fontSize: 17 }}>🛰</span>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700 }}>Fleet Directory</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Constellation health & subsystems</div>
                </div>
              </button>

              <button
                onClick={() => handleNav("alerts")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 12px",
                  borderRadius: 8,
                  background: currentView === "alerts" ? "rgba(230, 57, 70, 0.15)" : "transparent",
                  color: currentView === "alerts" ? "var(--red)" : "var(--text)",
                  textAlign: "left",
                  cursor: "pointer",
                  border: "none",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background =
                    currentView === "alerts" ? "rgba(230, 57, 70, 0.15)" : "transparent")
                }
              >
                <span style={{ fontSize: 17 }}>🚨</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700 }}>Active Threat Warnings</span>
                    {alertsCount > 0 && (
                      <span style={{ fontSize: 9.5, background: "var(--red)", color: "#fff", padding: "1px 6px", borderRadius: 8 }}>
                        {alertsCount}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Collision risks & ground hazards</div>
                </div>
              </button>

              <button
                onClick={() => handleNav("events")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 12px",
                  borderRadius: 8,
                  background: currentView === "events" ? "rgba(59, 130, 246, 0.15)" : "transparent",
                  color: currentView === "events" ? "var(--blue-light)" : "var(--text)",
                  textAlign: "left",
                  cursor: "pointer",
                  border: "none",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background =
                    currentView === "events" ? "rgba(59, 130, 246, 0.15)" : "transparent")
                }
              >
                <span style={{ fontSize: 17 }}>⚡</span>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700 }}>Canonical Event Stream</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Raw live WebSocket telemetry feed</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* TAB 5: System & Info Dropdown (AI Analytics, About) */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setOpenDropdown(openDropdown === "system" ? null : "system")}
            className={`nav-btn ${isSystemActive ? "active" : ""}`}
            title="System & Info: AI Model Benchmarks & Team @matrix-5 Mission"
          >
            <span style={{ fontSize: 15 }}>📊</span>
            <span>System & Info</span>
            <span style={{ fontSize: 10, opacity: 0.7, transform: openDropdown === "system" ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
              ▼
            </span>
          </button>

          {/* System Dropdown Menu */}
          {openDropdown === "system" && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                width: 250,
                background: "rgba(13, 18, 28, 0.98)",
                border: "1px solid rgba(59, 130, 246, 0.35)",
                borderRadius: 10,
                padding: "8px",
                boxShadow: "0 16px 36px rgba(0, 0, 0, 0.75)",
                zIndex: 1100,
                display: "flex",
                flexDirection: "column",
                gap: 4,
                backdropFilter: "blur(20px)",
              }}
            >
              <button
                onClick={() => handleNav("analytics")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 12px",
                  borderRadius: 8,
                  background: currentView === "analytics" ? "rgba(59, 130, 246, 0.15)" : "transparent",
                  color: currentView === "analytics" ? "var(--yellow)" : "var(--text)",
                  textAlign: "left",
                  cursor: "pointer",
                  border: "none",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background =
                    currentView === "analytics" ? "rgba(59, 130, 246, 0.15)" : "transparent")
                }
              >
                <span style={{ fontSize: 17 }}>📊</span>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700 }}>AI Model Analytics</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Isolation Forest & IBM Z Latency</div>
                </div>
              </button>

              <button
                onClick={() => handleNav("about")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 12px",
                  borderRadius: 8,
                  background: currentView === "about" ? "rgba(59, 130, 246, 0.15)" : "transparent",
                  color: currentView === "about" ? "var(--yellow)" : "var(--text)",
                  textAlign: "left",
                  cursor: "pointer",
                  border: "none",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background =
                    currentView === "about" ? "rgba(59, 130, 246, 0.15)" : "transparent")
                }
              >
                <span style={{ fontSize: 17 }}>ℹ️</span>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700 }}>Mission & @matrix-5</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Architecture & Team Credits</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* 3. Right: Satellite Quick-Focus, UTC Clock & Demo Controller */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, paddingRight: 4 }}>
        {/* Active Satellite Focus Pill & Quick Switcher */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(13, 18, 28, 0.85)",
            border: "1px solid rgba(59, 130, 246, 0.35)",
            padding: "4px 8px",
            borderRadius: 8,
            transition: "border-color 0.2s ease, box-shadow 0.2s ease",
          }}
          className="desktop-nav navbar-target-selector"
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--yellow)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.35)")}
          title="Target satellite in focus across map and telemetry"
        >
          <span style={{ fontSize: 10, color: "var(--blue-light)", fontFamily: "var(--font-mono)", fontWeight: 800 }}>
            TARGET:
          </span>

          <select
            value={selectedSatId}
            onChange={(e) => {
              const newId = e.target.value;
              if (onSelectSatellite) onSelectSatellite(newId);
              if (currentView === "check") handleNav("check", newId);
            }}
            style={{
              background: "var(--panel-raised)",
              color: "var(--text)",
              border: "1px solid var(--border)",
              borderRadius: 4,
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              padding: "4px 6px",
              cursor: "pointer",
              fontWeight: 700,
              outline: "none",
              maxWidth: "125px",
              textOverflow: "ellipsis",
            }}
          >
            {satList.length > 0 ? (
              satList.map((sat) => (
                <option key={sat.satellite_id} value={sat.satellite_id}>
                  {sat.satellite_id} ({sat.satellite_name || "LEO"})
                </option>
              ))
            ) : (
              <option value="SAT-1042">SAT-1042 (Sentinel)</option>
            )}
          </select>

          {/* Quick AI Scan Action */}
          <button
            onClick={() => handleNav("check", selectedSatId)}
            style={{
              background: "rgba(245, 200, 76, 0.15)",
              border: "1px solid var(--yellow)",
              color: "var(--yellow)",
              padding: "4px 9px",
              borderRadius: 4,
              fontSize: 10.5,
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              transition: "all 0.18s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--yellow)";
              e.currentTarget.style.color = "#06090e";
              e.currentTarget.style.boxShadow = "0 0 12px var(--yellow-glow)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(245, 200, 76, 0.15)";
              e.currentTarget.style.color = "var(--yellow)";
              e.currentTarget.style.boxShadow = "none";
            }}
            title={`Run instant AI diagnostic scan on ${selectedSatId}`}
          >
            <span>🔍</span>
            <span>SCAN</span>
          </button>
        </div>

        {/* Mission Clock Display */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 10px",
            background: "rgba(13, 18, 28, 0.75)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            color: "var(--text-muted)",
          }}
          className="desktop-nav navbar-clock"
        >
          <span className="radar-live" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--blue)" }} />
          <span>{utcTime || "UTC CLOCK"}</span>
        </div>

        {/* Start / Reset Demo Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            onClick={onStartDemo}
            disabled={demoStatus === "running"}
            style={{
              background: demoStatus === "running" ? "rgba(245, 200, 76, 0.15)" : "linear-gradient(135deg, rgba(20, 28, 48, 0.9) 0%, rgba(13, 18, 28, 0.95) 100%)",
              border: `1px solid ${demoStatus === "running" ? "var(--yellow)" : "rgba(245, 200, 76, 0.45)"}`,
              color: "var(--yellow)",
              padding: "7px 13px",
              borderRadius: 8,
              fontSize: 11.5,
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: demoStatus === "running" ? "default" : "pointer",
              transition: "all 0.2s ease",
              boxShadow: demoStatus === "running" ? "0 0 16px var(--yellow-glow)" : "none",
            }}
            onMouseEnter={(e) => {
              if (demoStatus !== "running") {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.borderColor = "var(--yellow)";
                e.currentTarget.style.boxShadow = "0 0 16px var(--yellow-glow)";
              }
            }}
            onMouseLeave={(e) => {
              if (demoStatus !== "running") {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "rgba(245, 200, 76, 0.45)";
                e.currentTarget.style.boxShadow = "none";
              }
            }}
            title="Inject simulated orbital anomaly and cascade scenario"
          >
            <span>{demoStatus === "running" ? "⚡" : "▶"}</span>
            <span>{demoStatus === "running" ? "SIMULATING..." : "START DEMO"}</span>
          </button>

          {demoStatus === "running" && (
            <button
              onClick={onResetDemo}
              style={{
                background: "rgba(230, 57, 70, 0.15)",
                border: "1px solid rgba(230, 57, 70, 0.5)",
                color: "var(--red)",
                padding: "7px 10px",
                borderRadius: 8,
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                cursor: "pointer",
                fontWeight: 700,
                transition: "all 0.18s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--red)";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(230, 57, 70, 0.15)";
                e.currentTarget.style.color = "var(--red)";
              }}
              title="Reset simulation back to nominal baseline"
            >
              RESET
            </button>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            display: "none",
            background: "var(--panel-raised)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            padding: "7px 11px",
            borderRadius: 6,
            fontSize: 16,
            cursor: "pointer",
          }}
          className="mobile-menu-btn"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* 4. Mobile Slide-Down Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            position: "fixed",
            top: 62,
            left: 0,
            right: 0,
            background: "rgba(6, 9, 14, 0.98)",
            borderBottom: "1px solid var(--border)",
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            zIndex: 999,
            backdropFilter: "blur(20px)",
            boxShadow: "0 12px 32px rgba(0, 0, 0, 0.8)",
          }}
        >
          {[
            { id: "home", label: "Home", sub: "Showcase & Tour", icon: "🌐" },
            { id: "monitor", label: "Command Center", sub: "Live Map & Decisions (Primary)", icon: "📡" },
            { id: "check", label: "AI Satellite Scanner", sub: "Inspect Anomaly Risk", icon: "🔍" },
            { id: "satellites", label: "Fleet Directory", sub: "Constellation Subsystems", icon: "🛰" },
            { id: "alerts", label: "Active Threats", sub: "Collision & Ground Warnings", icon: "🚨", badge: alertsCount > 0 ? alertsCount : null },
            { id: "events", label: "Event Stream", sub: "Raw Telemetry Feed", icon: "⚡" },
            { id: "analytics", label: "AI Model Analytics", sub: "Latency & Benchmarks", icon: "📊" },
            { id: "about", label: "Mission & @matrix-5", sub: "Architecture & Credits", icon: "ℹ️" },
          ].map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id, selectedSatId)}
                style={{
                  background: isActive ? "rgba(245, 200, 76, 0.12)" : "transparent",
                  color: isActive ? "var(--yellow)" : "var(--text)",
                  border: `1px solid ${isActive ? "var(--yellow)" : "rgba(27, 37, 56, 0.5)"}`,
                  padding: "10px 14px",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{item.label}</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{item.sub}</div>
                  </div>
                </div>
                {item.badge && (
                  <span
                    style={{
                      background: "var(--red)",
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "2px 6px",
                      borderRadius: 10,
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
