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
  const eventAgeSec = Math.max(0, Math.round((Date.now() - lastEventTime) / 1000));

  const navLinks = [
    { id: "home", label: "Home", anchor: null },
    { id: "how-it-works", label: "How It Works", anchor: "how-it-works" },
    { id: "intelligence", label: "Intelligence", anchor: "intelligence" },
    { id: "monitor", label: "Live Monitor", anchor: null },
    { id: "alerts", label: "Alerts", anchor: null, badge: alertsCount > 0 ? alertsCount : null },
    { id: "about", label: "About", anchor: null },
  ];

  const handleNavClick = (link) => {
    setMobileMenuOpen(false);
    if (link.anchor) {
      if (currentView !== "home") {
        onNavigate("home");
        setTimeout(() => {
          const el = document.getElementById(link.anchor);
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        const el = document.getElementById(link.anchor);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      onNavigate(link.id);
    }
  };

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        padding: "0 22px",
        height: "56px",
        background: "rgba(16, 21, 31, 0.95)",
        borderBottom: "1px solid var(--border)",
        gap: 20,
        zIndex: 1000,
        position: "sticky",
        top: 0,
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Brand Identity */}
      <div
        onClick={() => {
          onNavigate("home");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          cursor: "pointer",
        }}
      >
        <span style={{ fontSize: 20 }}>🛰</span>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontWeight: 800,
                letterSpacing: "0.04em",
                fontSize: 15,
                color: "var(--text)",
              }}
            >
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
          <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.02em" }}>
            Real-Time Space Intelligence
          </div>
        </div>
      </div>

      {/* Desktop Navigation Links */}
      <nav style={{ display: "flex", gap: 4, marginLeft: 16 }} className="desktop-nav">
        {navLinks.map((link) => {
          const isActive = currentView === link.id;
          return (
            <button
              key={link.id}
              onClick={() => handleNavClick(link)}
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
              <span>{link.label}</span>
              {link.badge && (
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
                  {link.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Right Controls */}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
        {/* Check Satellite CTA */}
        {currentView !== "check" && (
          <button
            onClick={() => onNavigate("check")}
            className="cta-button"
            style={{ padding: "7px 14px", fontSize: 11.5 }}
          >
            <span>🔍</span>
            <span>Check Satellite</span>
          </button>
        )}

        {/* Demo Controls */}
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
          title="Triggers the deterministic SAT-1042 anomaly and DEB-2098 conjunction scenario"
        >
          <span>▶</span> Demo (SAT-1042)
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

        {/* Status Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontFamily: "var(--font-mono)" }}>
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
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            display: "none",
            background: "var(--panel-raised)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            padding: "6px 10px",
            borderRadius: 4,
            cursor: "pointer",
          }}
          className="mobile-menu-btn"
        >
          ☰
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div
          style={{
            position: "absolute",
            top: 56,
            left: 0,
            right: 0,
            background: "var(--panel-raised)",
            borderBottom: "1px solid var(--border)",
            padding: "14px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            zIndex: 999,
          }}
        >
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNavClick(link)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text)",
                textAlign: "left",
                fontSize: 14,
                padding: "8px 0",
                cursor: "pointer",
              }}
            >
              {link.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
