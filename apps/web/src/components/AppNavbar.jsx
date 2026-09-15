import React, { useState, useEffect } from "react";
import GlossaryTooltip from "./GlossaryTooltip.jsx";

export default function AppNavbar({
  currentView,
  onNavigate,
  connected,
  lastEventTime,
  alertsCount = 0,
  demoStatus,
  onStartDemo,
  onResetDemo,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [utcTime, setUtcTime] = useState("");

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

  const eventAgeSec = Math.max(0, Math.round((Date.now() - (lastEventTime || Date.now())) / 1000));

  const navLinks = [
    { id: "home", label: "Home", icon: "🌐" },
    { id: "check", label: "Check Satellite", icon: "🔍" },
    { id: "monitor", label: "Live Monitor", icon: "📡" },
    { id: "satellites", label: "Fleet", icon: "🛰" },
    { id: "alerts", label: "Alerts", icon: "🚨", badge: alertsCount > 0 ? alertsCount : null },
    { id: "events", label: "Events", icon: "⚡" },
    { id: "analytics", label: "AI Analytics", icon: "📊" },
    { id: "about", label: "About", icon: "ℹ️" },
  ];

  const handleNavClick = (linkId, anchor = null) => {
    setMobileMenuOpen(false);
    onNavigate(linkId);
    if (anchor) {
      setTimeout(() => {
        const el = document.getElementById(anchor);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        height: "60px",
        background: "rgba(6, 9, 14, 0.92)",
        borderBottom: "1px solid rgba(27, 37, 56, 0.8)",
        gap: 16,
        zIndex: 1000,
        position: "sticky",
        top: 0,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.6)",
      }}
    >
      {/* 1. Left: Brand Identity & Live Status */}
      <div
        onClick={() => handleNavClick("home")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          cursor: "pointer",
          userSelect: "none",
          flexShrink: 0,
        }}
      >
        {/* Custom Aerospace Radar Logo Icon */}
        <div
          style={{
            position: "relative",
            width: 36,
            height: 36,
            borderRadius: 8,
            background: "linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(245, 200, 76, 0.12) 100%)",
            border: "1px solid rgba(59, 130, 246, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 14px rgba(59, 130, 246, 0.25)",
          }}
        >
          <span style={{ fontSize: 18 }}>🛰</span>
          <span
            style={{
              position: "absolute",
              top: -2,
              right: -2,
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: connected ? "var(--yellow)" : "var(--red)",
              boxShadow: `0 0 8px ${connected ? "var(--yellow)" : "var(--red)"}`,
            }}
          />
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontWeight: 900,
                letterSpacing: "0.06em",
                fontSize: 16,
                color: "#ffffff",
                fontFamily: "var(--font-ui)",
              }}
            >
              SKYGUARD<span style={{ color: "var(--yellow)", textShadow: "0 0 10px rgba(245, 200, 76, 0.4)" }}>X</span>
            </span>
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: 4,
                background: connected ? "rgba(59, 130, 246, 0.15)" : "rgba(230, 57, 70, 0.15)",
                color: connected ? "var(--blue-light)" : "var(--red)",
                border: `1px solid ${connected ? "rgba(59, 130, 246, 0.35)" : "rgba(230, 57, 70, 0.4)"}`,
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.04em",
              }}
            >
              {connected ? "LIVE ●" : "OFFLINE"}
            </span>
          </div>
          <div
            style={{
              fontSize: 9,
              color: "var(--text-muted)",
              letterSpacing: "0.08em",
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
            }}
          >
            Space-To-Earth AI
          </div>
        </div>
      </div>

      {/* 2. Center: Navigation Bar Links */}
      <nav
        style={{
          display: "flex",
          gap: 4,
          alignItems: "center",
          background: "rgba(13, 18, 28, 0.6)",
          padding: "4px 6px",
          borderRadius: 8,
          border: "1px solid rgba(27, 37, 56, 0.6)",
        }}
        className="desktop-nav"
      >
        {navLinks.map((link) => {
          const isActive = currentView === link.id;
          return (
            <button
              key={link.id}
              onClick={() => handleNavClick(link.id)}
              style={{
                background: isActive ? "rgba(20, 28, 43, 0.95)" : "transparent",
                color: isActive ? "var(--yellow)" : "var(--text-muted)",
                border: isActive ? "1px solid rgba(245, 200, 76, 0.35)" : "1px solid transparent",
                borderRadius: 6,
                padding: "7px 12px",
                fontSize: 12,
                fontWeight: isActive ? 700 : 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
                boxShadow: isActive ? "0 2px 10px rgba(0,0,0,0.4), 0 0 10px rgba(245, 200, 76, 0.15)" : "none",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "#ffffff";
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "var(--text-muted)";
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <span style={{ fontSize: 13, opacity: isActive ? 1 : 0.75 }}>{link.icon}</span>
              <span>{link.label}</span>
              {link.badge && (
                <span
                  style={{
                    background: "var(--red)",
                    color: "#ffffff",
                    fontSize: 9,
                    fontWeight: 800,
                    padding: "1px 5px",
                    borderRadius: 10,
                    fontFamily: "var(--font-mono)",
                    boxShadow: "0 0 8px var(--red-glow)",
                    marginLeft: 2,
                  }}
                >
                  {link.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* 3. Right: Mission Clock, Action Buttons & Demo Controller */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        {/* Mission Clock Display */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 10px",
            background: "rgba(13, 18, 28, 0.75)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            color: "var(--blue-light)",
          }}
          className="desktop-nav"
        >
          <span className="live-dot" style={{ width: 5, height: 5 }} />
          <span>{utcTime || "UTC CLOCK"}</span>
        </div>

        {/* Quick Check Satellite CTA */}
        {currentView !== "check" && (
          <button
            onClick={() => handleNavClick("check")}
            className="cta-button"
            style={{
              padding: "7px 14px",
              fontSize: 12,
              borderRadius: 6,
              fontWeight: 700,
            }}
          >
            <span>🔍</span>
            <span>Check Satellite</span>
          </button>
        )}

        {/* Start / Reset Demo Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            onClick={onStartDemo}
            disabled={demoStatus === "running"}
            style={{
              background: demoStatus === "running" ? "rgba(245, 200, 76, 0.15)" : "var(--panel-raised)",
              border: `1px solid ${demoStatus === "running" ? "var(--yellow)" : "var(--border)"}`,
              color: demoStatus === "running" ? "var(--yellow)" : "var(--text)",
              padding: "7px 13px",
              borderRadius: 6,
              fontSize: 11.5,
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: demoStatus === "running" ? "default" : "pointer",
              transition: "all 0.18s ease",
              boxShadow: demoStatus === "running" ? "0 0 12px var(--yellow-glow)" : "none",
            }}
          >
            <span>{demoStatus === "running" ? "⚡" : "▶"}</span>
            <span>{demoStatus === "running" ? "SIMULATING..." : "START DEMO"}</span>
          </button>

          {demoStatus === "running" && (
            <button
              onClick={onResetDemo}
              style={{
                background: "rgba(230, 57, 70, 0.12)",
                border: "1px solid rgba(230, 57, 70, 0.4)",
                color: "var(--red)",
                padding: "7px 10px",
                borderRadius: 6,
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

      {/* 4. Mobile Slide-Down Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            position: "fixed",
            top: 60,
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
          {navLinks.map((link) => {
            const isActive = currentView === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                style={{
                  background: isActive ? "rgba(245, 200, 76, 0.12)" : "transparent",
                  color: isActive ? "var(--yellow)" : "var(--text)",
                  border: `1px solid ${isActive ? "var(--yellow)" : "rgba(27, 37, 56, 0.5)"}`,
                  padding: "10px 14px",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </div>
                {link.badge && (
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
                    {link.badge}
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
