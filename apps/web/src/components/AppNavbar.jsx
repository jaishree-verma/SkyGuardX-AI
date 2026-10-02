import React, { useState, useEffect, useRef, useMemo } from "react";
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
  publicSatellites = [],
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); // 'ops' | 'system' | 'tracking' | null
  const [utcTime, setUtcTime] = useState("");
  const dropdownRef = useRef(null);

  const isLanding = currentView === "home";

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

  // Active satellite display computation for the Dynamic Tracking Pill
  const activeSatellite = useMemo(() => {
    // 1. Check public satellites first
    if (publicSatellites && publicSatellites.length > 0) {
      const foundPub = publicSatellites.find(
        (s) =>
          s.satellite_id === selectedSatId ||
          String(s.norad_id) === String(selectedSatId) ||
          (s.name && s.name.toUpperCase() === String(selectedSatId).toUpperCase())
      );
      if (foundPub) {
        return {
          id: foundPub.satellite_id,
          name: foundPub.name,
          norad: foundPub.norad_id,
          isPublic: true,
          label: `${foundPub.name} (NORAD ${foundPub.norad_id})`,
        };
      }
    }

    // 2. Check constellation satellites
    if (satellites && Object.keys(satellites).length > 0) {
      const foundConst = satellites[selectedSatId] || satList.find((s) => s.satellite_id === selectedSatId);
      if (foundConst) {
        return {
          id: foundConst.satellite_id,
          name: foundConst.satellite_name || foundConst.satellite_id,
          norad: foundConst.norad_id || "LEO",
          isPublic: false,
          label: `${foundConst.satellite_id} (${foundConst.satellite_name || "LEO"})`,
        };
      }
    }

    return {
      id: selectedSatId,
      name: selectedSatId,
      norad: "LEO",
      isPublic: false,
      label: selectedSatId,
    };
  }, [selectedSatId, publicSatellites, satellites, satList]);

  const handleNav = (viewId, satId = null) => {
    setOpenDropdown(null);
    setMobileMenuOpen(false);
    onNavigate(viewId, satId);
  };

  const isOpsActive = ["satellites", "alerts", "events"].includes(currentView);
  const isSystemActive = ["analytics", "about"].includes(currentView);

  // -------------------------------------------------------------------------
  // LANDING PAGE: ULTRA-CLEAN TRANSPARENT HEADER
  // -------------------------------------------------------------------------
  if (isLanding) {
    return (
      <header
        className="navbar-transparent-landing"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          height: "64px",
          zIndex: 1000,
          position: "sticky",
          top: 0,
          width: "100%",
          boxSizing: "border-box",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          background: "rgba(6, 9, 14, 0.45)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        {/* Brand Logo & Mission Badge */}
        <div
          onClick={() => handleNav("home")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            cursor: "pointer",
            userSelect: "none",
          }}
          className="btn-interactive"
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
                <span
                  className="animate-pulse"
                  style={{ width: 5, height: 5, borderRadius: "50%", background: connected ? "#10b981" : "var(--red)" }}
                />
                {connected ? "LIVE" : "OFFLINE"}
              </span>
            </div>
            <div
              style={{
                fontSize: 9.5,
                color: "var(--text-muted)",
                letterSpacing: "0.06em",
                fontFamily: "var(--font-mono)",
              }}
            >
              SPACE INTELLIGENCE · @matrix-5
            </div>
          </div>
        </div>

        {/* Clean Right Actions: Direct Dashboard Launch + Demo Trigger */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Mission UTC Clock */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              background: "rgba(10, 13, 20, 0.8)",
              border: "1px solid rgba(245, 200, 76, 0.25)",
              borderRadius: 8,
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              color: "var(--text-muted)",
            }}
            className="desktop-nav"
          >
            <span className="animate-pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--yellow)", boxShadow: "0 0 8px var(--yellow-glow)" }} />
            <span>{utcTime || "UTC CLOCK"}</span>
          </div>

          {/* Direct Launch to Dashboard Button (Vibrant Cyber Gold) */}
          <button
            onClick={() => handleNav("monitor")}
            className="btn-interactive cta-button"
            style={{
              padding: "9px 20px",
              fontSize: 12.5,
              borderRadius: 8,
              fontWeight: 800,
              gap: 6,
              boxShadow: "0 0 16px var(--yellow-glow)",
            }}
            title="Launch Command Center full-screen dashboard"
          >
            <span>📡</span>
            <span>ENTER COMMAND CENTER</span>
            <span>➔</span>
          </button>
        </div>
      </header>
    );
  }

  // -------------------------------------------------------------------------
  // DASHBOARD & OPERATIONAL VIEWS: 64px STICKY GLASSMORPHIC NAVBAR
  // -------------------------------------------------------------------------
  return (
    <header
      ref={dropdownRef}
      className="navbar-glass-container nav-fade-in"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        height: "64px",
        minHeight: "64px",
        maxHeight: "64px",
        background: "rgba(15, 23, 42, 0.85)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.10)",
        gap: 12,
        zIndex: 1000,
        position: "sticky",
        top: 0,
        width: "100%",
        boxSizing: "border-box",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
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
        }}
        className="btn-interactive"
        title="SkyGuardX AI — Return to Home Landing Page"
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
              <span
                className="animate-pulse"
                style={{ width: 5, height: 5, borderRadius: "50%", background: connected ? "#10b981" : "var(--red)" }}
              />
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

      {/* 2. Center: Standardized Navigation Links with glowing hover line */}
      <nav
        style={{
          display: "flex",
          gap: 6,
          alignItems: "center",
          background: "rgba(10, 15, 28, 0.65)",
          padding: "5px 8px",
          borderRadius: 10,
          border: "1px solid rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(12px)",
        }}
        className="desktop-nav navbar-center-nav"
      >
        {/* TAB 1: Home */}
        <button
          onClick={() => handleNav("home")}
          className={`nav-btn nav-item-indicator ${currentView === "home" ? "active" : ""}`}
          style={{ transition: "all 0.2s ease" }}
          title="Return to Landing Page & 3D Rocket Showcase"
        >
          <span style={{ fontSize: 14 }}>🌐</span>
          <span>Home</span>
        </button>

        {/* TAB 2: Live Command Center (PRIMARY STAR FEATURE) */}
        <button
          onClick={() => handleNav("monitor")}
          className={`nav-btn nav-item-indicator nav-btn-primary ${currentView === "monitor" ? "active" : ""}`}
          style={{ transition: "all 0.2s ease" }}
          title="Command Center: Real-Time Orbital Map, Conjunctions & Live Weather"
        >
          <span style={{ fontSize: 14 }}>📡</span>
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

        {/* TAB 3: AI Scanner */}
        <button
          onClick={() => handleNav("check", selectedSatId)}
          className={`nav-btn nav-item-indicator ${currentView === "check" ? "active" : ""}`}
          style={{ transition: "all 0.2s ease" }}
          title="Search any satellite for instant AI risk assessment & anomaly diagnostics"
        >
          <span style={{ fontSize: 14 }}>🔍</span>
          <span>AI Scanner</span>
        </button>

        {/* TAB 4: Operations Dropdown */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setOpenDropdown(openDropdown === "ops" ? null : "ops")}
            className={`nav-btn nav-item-indicator ${isOpsActive ? "active" : ""}`}
            style={{ transition: "all 0.2s ease" }}
            title="Operations: Fleet Directory, Active Alerts & Event Stream"
          >
            <span style={{ fontSize: 14 }}>🛰</span>
            <span>Operations</span>
            <span
              style={{
                fontSize: 10,
                opacity: 0.7,
                transform: openDropdown === "ops" ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
            >
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
                background: "rgba(8, 11, 18, 0.98)",
                border: "1px solid rgba(245, 200, 76, 0.35)",
                borderRadius: 10,
                padding: "8px",
                boxShadow: "0 16px 36px rgba(0, 0, 0, 0.9)",
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
                  background: currentView === "satellites" ? "rgba(245, 200, 76, 0.18)" : "transparent",
                  color: currentView === "satellites" ? "var(--yellow)" : "var(--text)",
                  textAlign: "left",
                  cursor: "pointer",
                  border: "none",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background =
                    currentView === "satellites" ? "rgba(245, 200, 76, 0.18)" : "transparent")
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
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)")}
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
                      <span
                        style={{
                          fontSize: 9.5,
                          background: "var(--red)",
                          color: "#fff",
                          padding: "1px 6px",
                          borderRadius: 8,
                        }}
                      >
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
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)")}
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

        {/* TAB 5: System & Info Dropdown */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setOpenDropdown(openDropdown === "system" ? null : "system")}
            className={`nav-btn nav-item-indicator ${isSystemActive ? "active" : ""}`}
            style={{ transition: "all 0.2s ease" }}
            title="System & Info: AI Model Benchmarks & Team @matrix-5 Mission"
          >
            <span style={{ fontSize: 14 }}>📊</span>
            <span>System</span>
            <span
              style={{
                fontSize: 10,
                opacity: 0.7,
                transform: openDropdown === "system" ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
            >
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
                  background: "rgba(8, 11, 18, 0.98)",
                  border: "1px solid rgba(245, 200, 76, 0.35)",
                  borderRadius: 10,
                  padding: "8px",
                  boxShadow: "0 16px 36px rgba(0, 0, 0, 0.9)",
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
                    background: currentView === "analytics" ? "rgba(245, 200, 76, 0.18)" : "transparent",
                    color: currentView === "analytics" ? "var(--yellow)" : "var(--text)",
                    textAlign: "left",
                    cursor: "pointer",
                    border: "none",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)")}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      currentView === "analytics" ? "rgba(245, 200, 76, 0.18)" : "transparent")
                  }
                >
                  <span style={{ fontSize: 17 }}>📊</span>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700 }}>AI Model Analytics</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Isolation Forest & Latency Benchmarks</div>
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
                    background: currentView === "about" ? "rgba(245, 200, 76, 0.18)" : "transparent",
                    color: currentView === "about" ? "var(--yellow)" : "var(--text)",
                    textAlign: "left",
                    cursor: "pointer",
                    border: "none",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)")}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      currentView === "about" ? "rgba(245, 200, 76, 0.18)" : "transparent")
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

        {/* 3. Right: Dynamic Tracking Status Pill, UTC Clock & Demo Controller */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          {/* Dynamic Satellite Tracking Status Pill (with pulsing green dot) */}
          <div style={{ position: "relative" }}>
            <div
              onClick={() => setOpenDropdown(openDropdown === "tracking" ? null : "tracking")}
              className="btn-interactive"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(8, 11, 18, 0.90)",
                border: "1px solid rgba(245, 200, 76, 0.45)",
                padding: "6px 12px",
                borderRadius: 20,
                cursor: "pointer",
                boxShadow: "0 2px 12px rgba(0, 0, 0, 0.6), 0 0 10px rgba(245, 200, 76, 0.15)",
              }}
              title="Click to switch tracking target satellite"
            >
              {/* Subtle Pulsing Green Dot */}
              <span
                className="animate-pulse"
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#10b981",
                  boxShadow: "0 0 8px #10b981",
                  flexShrink: 0,
                }}
              />

              <span
                style={{
                  fontSize: 11.5,
                  fontFamily: "var(--font-mono)",
                  color: "#e2e8f0",
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <span>📡 Tracking:</span>
                <span style={{ color: "var(--yellow)" }}>{activeSatellite.label}</span>
              </span>

              <span
                style={{
                  fontSize: 9,
                  color: "var(--yellow)",
                  transform: openDropdown === "tracking" ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
              >
                ▼
              </span>
            </div>

            {/* Quick Satellite Switcher Dropdown */}
            {openDropdown === "tracking" && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  width: 280,
                  background: "rgba(8, 11, 18, 0.98)",
                  border: "1px solid rgba(245, 200, 76, 0.4)",
                  borderRadius: 10,
                  padding: "8px",
                  boxShadow: "0 16px 36px rgba(0, 0, 0, 0.9), 0 0 16px rgba(245, 200, 76, 0.15)",
                  zIndex: 1150,
                  backdropFilter: "blur(20px)",
                  maxHeight: 340,
                  overflowY: "auto",
                }}
                className="scrollbar-thin"
              >
                <div
                  style={{
                    fontSize: 10,
                    fontFamily: "var(--font-mono)",
                    color: "var(--yellow)",
                    fontWeight: 800,
                    padding: "4px 8px 6px",
                    borderBottom: "1px solid rgba(245, 200, 76, 0.18)",
                    marginBottom: 6,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>SELECT TRACKING TARGET</span>
                  <span>REAL-TIME FLEET</span>
                </div>

              {/* Public Satellites Group */}
              {publicSatellites.length > 0 && (
                <div style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 9.5, color: "var(--text-muted)", fontFamily: "var(--font-mono)", padding: "2px 8px" }}>
                    ● PUBLIC SATELLITES (CELESTRAK)
                  </div>
                  {publicSatellites.map((pub) => {
                    const isSelected = selectedSatId === pub.satellite_id;
                    return (
                      <button
                        key={pub.satellite_id}
                        onClick={() => {
                          if (onSelectSatellite) onSelectSatellite(pub.satellite_id);
                          setOpenDropdown(null);
                        }}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "6px 8px",
                          borderRadius: 6,
                          background: isSelected ? "rgba(245, 200, 76, 0.15)" : "transparent",
                          color: isSelected ? "var(--yellow)" : "var(--text)",
                          border: isSelected ? "1px solid rgba(245, 200, 76, 0.4)" : "1px solid transparent",
                          cursor: "pointer",
                          textAlign: "left",
                          fontSize: 11.5,
                          fontFamily: "var(--font-mono)",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)")}
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = isSelected ? "rgba(245, 200, 76, 0.15)" : "transparent")
                        }
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ color: pub.color || "#38bdf8" }}>🛰️</span>
                          <span style={{ fontWeight: 700 }}>{pub.name}</span>
                          <span style={{ fontSize: 9.5, color: "var(--text-muted)" }}>({pub.norad_id})</span>
                        </div>
                        <span style={{ fontSize: 9, color: "var(--teal)", background: "rgba(46,196,182,0.12)", padding: "1px 5px", borderRadius: 3 }}>
                          {pub.altitude_km?.toFixed(0)} km
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Constellation Satellites Group */}
              <div>
                <div style={{ fontSize: 9.5, color: "var(--text-muted)", fontFamily: "var(--font-mono)", padding: "2px 8px" }}>
                  ● CONSTELLATION FLEET
                </div>
                {(satList.length > 0 ? satList : [{ satellite_id: "SAT-1042", satellite_name: "Sentinel-LEO" }]).map((sat) => {
                  const isSelected = selectedSatId === sat.satellite_id;
                  return (
                    <button
                      key={sat.satellite_id}
                      onClick={() => {
                        if (onSelectSatellite) onSelectSatellite(sat.satellite_id);
                        setOpenDropdown(null);
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "6px 8px",
                        borderRadius: 6,
                        background: isSelected ? "rgba(245, 200, 76, 0.15)" : "transparent",
                        color: isSelected ? "var(--yellow)" : "var(--text)",
                        border: isSelected ? "1px solid rgba(245, 200, 76, 0.4)" : "1px solid transparent",
                        cursor: "pointer",
                        textAlign: "left",
                        fontSize: 11.5,
                        fontFamily: "var(--font-mono)",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)")}
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = isSelected ? "rgba(245, 200, 76, 0.15)" : "transparent")
                      }
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span>🛰️</span>
                        <span style={{ fontWeight: 700 }}>{sat.satellite_id}</span>
                        <span style={{ fontSize: 9.5, color: "var(--text-muted)" }}>
                          ({sat.satellite_name || "LEO"})
                        </span>
                      </div>
                      {sat.satellite_id === "SAT-1042" && (
                        <span style={{ fontSize: 9, color: "var(--red)", background: "rgba(230,57,70,0.15)", padding: "1px 5px", borderRadius: 3 }}>
                          HIGH RISK
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Quick AI Scan Action */}
        <button
          onClick={() => handleNav("check", selectedSatId)}
          className="btn-interactive"
          style={{
            background: "rgba(245, 200, 76, 0.15)",
            border: "1px solid var(--yellow)",
            color: "var(--yellow)",
            padding: "5px 10px",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            fontFamily: "var(--font-mono)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
          title={`Run instant AI diagnostic scan on ${selectedSatId}`}
        >
          <span>🔍</span>
          <span>SCAN</span>
        </button>

        {/* Mission Clock Display */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 10px",
            background: "rgba(10, 15, 28, 0.75)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 8,
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            color: "var(--text-muted)",
          }}
          className="desktop-nav navbar-clock"
        >
          <span className="animate-pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--blue)" }} />
          <span>{utcTime || "UTC CLOCK"}</span>
        </div>

        {/* Start / Reset Demo Buttons with Interactive Hover Effects */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            onClick={onStartDemo}
            disabled={demoStatus === "running"}
            className="btn-interactive"
            style={{
              background:
                demoStatus === "running"
                  ? "rgba(245, 200, 76, 0.15)"
                  : "linear-gradient(135deg, rgba(20, 28, 48, 0.9) 0%, rgba(13, 18, 28, 0.95) 100%)",
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
              boxShadow: demoStatus === "running" ? "0 0 16px var(--yellow-glow)" : "none",
            }}
            title="Inject simulated orbital anomaly and cascade scenario"
          >
            <span>{demoStatus === "running" ? "⚡" : "▶"}</span>
            <span>{demoStatus === "running" ? "SIMULATING..." : "START DEMO"}</span>
          </button>

          {demoStatus === "running" && (
            <button
              onClick={onResetDemo}
              className="btn-interactive"
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

      {/* Mobile Slide-Down Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            position: "fixed",
            top: 64,
            left: 0,
            right: 0,
            background: "rgba(10, 15, 28, 0.98)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
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
