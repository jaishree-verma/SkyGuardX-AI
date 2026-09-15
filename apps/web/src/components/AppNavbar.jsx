import React, { useState } from "react";
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
        padding: "0 20px",
        height: "56px",
        background: "rgba(10, 14, 22, 0.96)",
        borderBottom: "1px solid var(--border)",
        gap: 16,
        zIndex: 1000,
        position: "sticky",
        top: 0,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {/* Brand Identity */}
      <div
        onClick={() => handleNavClick("home")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          cursor: "pointer",
          userSelect: "none",
        }}
      >
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
            fontSize: 18,
          }}
        >
          🛰
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontWeight: 800,
                letterSpacing: "0.05em",
                fontSize: 15,
                color: "var(--text)",
              }}
            >
              SKYGUARD<span style={{ color: "var(--yellow)" }}>X</span>
            </span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: 3,
                background: connected ? "rgba(59, 130, 246, 0.15)" : "rgba(230, 57, 70, 0.15)",
                color: connected ? "var(--blue-light)" : "var(--red)",
                border: `1px solid ${connected ? "rgba(59, 130, 246, 0.35)" : "rgba(230, 57, 70, 0.4)"}`,
                fontFamily: "var(--font-mono)",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: connected ? "var(--blue-light)" : "var(--red)",
                }}
              />
              {connected ? "LIVE" : "OFFLINE"}
            </span>
          </div>
          <div style={{ fontSize: 9.5, color: "var(--text-muted)", letterSpacing: "0.04em", fontFamily: "var(--font-mono)" }}>
            SPACE-TO-EARTH DECISION AI
          </div>
        </div>
      </div>

      {/* Desktop Navigation Links */}
      <nav style={{ display: "flex", gap: 2, marginLeft: 12 }} className="desktop-nav">
        {navLinks.map((link) => {
          const isActive = currentView === link.id;
          return (
            <button
              key={link.id}
              onClick={() => handleNavClick(link.id)}
              style={{
                background: isActive ? "rgba(20, 28, 43, 0.9)" : "transparent",
                color: isActive ? "var(--yellow)" : "var(--text-muted)",
                border: "none",
                borderBottom: isActive ? "2px solid var(--yellow)" : "2px solid transparent",
                padding: "16px 12px",
                fontSize: 12,
                fontWeight: isActive ? 700 : 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.15s ease",
              }}
            >
              <span style={{ fontSize: 13, opacity: isActive ? 1 : 0.7 }}>{link.icon}</span>
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
                  }}
                >
                  {link.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Right Controls */}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
        {/* Quick Check CTA */}
        {currentView !== "check" && (
          <button
            onClick={() => handleNavClick("check")}
            className="cta-button"
            style={{ padding: "6px 14px", fontSize: 11.5 }}
          >
            <span>🔍</span>
            <span>Check Satellite</span>
          </button>
        )}

        {/* Demo Simulation Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            onClick={onStartDemo}
            disabled={demoStatus === "running"}
            style={{
              background: demoStatus === "running" ? "rgba(245, 200, 76, 0.15)" : "var(--panel-raised)",
              border: `1px solid ${demoStatus === "running" ? "var(--yellow)" : "var(--border)"}`,
              color: demoStatus === "running" ? "var(--yellow)" : "var(--text)",
              padding: "6px 12px",
              borderRadius: 4,
              fontSize: 11.5,
              fontWeight: 600,
              fontFamily: "var(--font-mono)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: demoStatus === "running" ? "default" : "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <span>{demoStatus === "running" ? "⚡" : "▶"}</span>
            <span>{demoStatus === "running" ? "SIMULATING..." : "START DEMO"}</span>
          </button>

          {demoStatus === "running" && (
            <button
              onClick={onResetDemo}
              style={{
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--text-muted)",
                padding: "6px 10px",
                borderRadius: 4,
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                cursor: "pointer",
              }}
              title="Reset simulation back to nominal baseline"
            >
              RESET
            </button>
          )}
        </div>

        {/* Latency / Telemetry Age Badge */}
        <div
          style={{
            fontSize: 10.5,
            fontFamily: "var(--font-mono)",
            color: "var(--text-muted)",
            display: "none",
            alignItems: "center",
            gap: 6,
            padding: "4px 8px",
            background: "var(--panel)",
            borderRadius: 4,
            border: "1px solid var(--border)",
          }}
          className="desktop-nav"
        >
          <span className="live-dot" style={{ width: 6, height: 6 }} />
          <span>{eventAgeSec}s latency</span>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            display: "none",
            background: "var(--panel-raised)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            padding: "6px 10px",
            borderRadius: 4,
            fontSize: 16,
            cursor: "pointer",
          }}
          className="mobile-menu-btn"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          style={{
            position: "fixed",
            top: 56,
            left: 0,
            right: 0,
            background: "rgba(10, 14, 22, 0.98)",
            borderBottom: "1px solid var(--border)",
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            zIndex: 999,
            backdropFilter: "blur(12px)",
          }}
        >
          {navLinks.map((link) => {
            const isActive = currentView === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                style={{
                  background: isActive ? "var(--panel-raised)" : "transparent",
                  color: isActive ? "var(--yellow)" : "var(--text)",
                  border: `1px solid ${isActive ? "var(--yellow)" : "transparent"}`,
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
