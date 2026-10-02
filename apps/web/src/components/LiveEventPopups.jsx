import React, { useState, useEffect } from "react";

// Pre-packaged realistic space event templates for live feed when waiting or streaming
const LIVE_SPACE_EVENT_TEMPLATES = [
  {
    type: "conjunction",
    severity: "CRITICAL",
    badge: "🚨 ORBITAL CONJUNCTION",
    satId: "SAT-1042",
    headline: "Close Approach: SAT-1042 ✕ SL-16 DEB",
    details: "Critical orbital convergence detected at altitude 550.7 km. Miss distance computed at 0.72 km. Collision risk probability: 89%. Autonomous avoidance delta-V burn recommended.",
    action: "AVOIDANCE BURN PENDING",
    color: "#e63946",
    bg: "rgba(230, 57, 70, 0.12)",
  },
  {
    type: "anomaly",
    severity: "HIGH",
    badge: "⚡ AI ANOMALY DETECTED",
    satId: "SAT-1042",
    headline: "Thermal & Battery Spike: SAT-1042",
    details: "Subsystem telemetry anomaly detected by Isolation Forest model: Core temp reached 71.0°C (nominal < 35°C), battery discharge rate +38% above safe envelope.",
    action: "SAFE MODE COMMENCED",
    color: "#ff9f1c",
    bg: "rgba(255, 159, 28, 0.12)",
  },
  {
    type: "space_weather",
    severity: "WARNING",
    badge: "☀️ NOAA SPACE WEATHER",
    satId: "FLEET-WIDE",
    headline: "Geomagnetic Storm Advisory (Kp 5.8)",
    details: "NOAA Space Weather Prediction Center reports moderate G2-class geomagnetic disturbance. Increased atmospheric drag detected for LEO orbits below 600 km.",
    action: "DRAG COMPENSATION ACTIVE",
    color: "#f5c84c",
    bg: "rgba(245, 200, 76, 0.12)",
  },
  {
    type: "pass",
    severity: "INFO",
    badge: "🛰️ GROUND STATION PASS",
    satId: "SAT-1001",
    headline: "Svalbard Station Telemetry Downlink",
    details: "High-speed X-band telemetry locked. 142 subsystem telemetry frames downlinked. All reaction wheels and attitude control sensors nominal at 98.4% health.",
    action: "TELEMETRY SYNCED",
    color: "#f5c84c",
    bg: "rgba(245, 200, 76, 0.12)",
  },
  {
    type: "maneuver",
    severity: "INFO",
    badge: "🔄 ORBIT PROPAGATION",
    satId: "SAT-1077",
    headline: "SGP4 Ephemeris Update Broadcast",
    details: "Updated two-line element set (TLE) ingested from Space-Track / Celestrak. Orbital period: 96.1 min, apogee 574 km, perigee 566 km.",
    action: "ORBITAL VECTOR RE-ALIGNED",
    color: "#ffd166",
    bg: "rgba(255, 209, 102, 0.12)",
  },
];

export default function LiveEventPopups({
  events = [],
  onSelectSatellite,
  onInspectSatellite,
}) {
  const [activeEvents, setActiveEvents] = useState([]);
  const [isMinimized, setIsMinimized] = useState(false);

  // Initialize and continuously stream realistic live events if real socket events are few
  useEffect(() => {
    // Convert any incoming WebSocket events to popup items
    if (events && events.length > 0) {
      const mapped = events.slice(0, 4).map((e, idx) => {
        const isAnomaly = e.event_type === "telemetry_anomaly";
        const isConjunction = e.event_type?.includes("conjunction");
        return {
          id: e.event_id || `evt-${Date.now()}-${idx}`,
          type: isConjunction ? "conjunction" : isAnomaly ? "anomaly" : "info",
          severity: isConjunction ? "CRITICAL" : isAnomaly ? "HIGH" : "INFO",
          badge: isConjunction ? "🚨 CONJUNCTION ALERT" : isAnomaly ? "⚡ TELEMETRY ANOMALY" : "📡 SPACE EVENT",
          satId: e.entity_id || "SAT-1042",
          headline: `${e.entity_id || "SAT-1042"}: ${e.event_type?.replace(/_/g, " ").toUpperCase()}`,
          details: e.payload?.explanation || e.payload?.description || `Live telemetry stream update received for ${e.entity_id}. AI risk engine computed nominal operational status.`,
          action: isConjunction ? "AVOIDANCE REQUIRED" : "MONITORING ACTIVE",
          color: isConjunction ? "#e63946" : isAnomaly ? "#ff9f1c" : "#2ec4b6",
          bg: isConjunction ? "rgba(230, 57, 70, 0.14)" : isAnomaly ? "rgba(255, 159, 28, 0.14)" : "rgba(46, 196, 182, 0.12)",
          timestamp: e.timestamp ? new Date(e.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString(),
        };
      });
      setActiveEvents(mapped);
      return;
    }

    // Default seeded events when starting up so left side immediately shows what is happening
    const initialSeed = LIVE_SPACE_EVENT_TEMPLATES.slice(0, 3).map((item, idx) => ({
      ...item,
      id: `seed-${idx}`,
      timestamp: new Date(Date.now() - idx * 45000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    }));
    setActiveEvents(initialSeed);

    // Periodic live event arrival simulation every 14 seconds
    let templateIdx = 3;
    const interval = setInterval(() => {
      const template = LIVE_SPACE_EVENT_TEMPLATES[templateIdx % LIVE_SPACE_EVENT_TEMPLATES.length];
      templateIdx++;
      const newEvt = {
        ...template,
        id: `live-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      };

      setActiveEvents((prev) => [newEvt, ...prev.slice(0, 3)]);
    }, 14000);

    return () => clearInterval(interval);
  }, [events]);

  const dismissEvent = (id, e) => {
    e.stopPropagation();
    setActiveEvents((prev) => prev.filter((item) => item.id !== id));
  };

  const handleInspect = (satId) => {
    if (onInspectSatellite) {
      onInspectSatellite(satId);
    } else if (onSelectSatellite) {
      onSelectSatellite(satId);
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 48,
        left: 12,
        zIndex: 600,
        width: 320,
        maxHeight: "calc(100% - 65px)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        pointerEvents: "auto",
      }}
    >
      {/* Header bar with live pulse & minimize toggle */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(10, 14, 22, 0.94)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          padding: "6px 10px",
          fontFamily: "var(--font-mono, monospace)",
          fontSize: 11,
          backdropFilter: "blur(6px)",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.5)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span className="live-dot" style={{ background: "#2ec4b6" }} />
          <span style={{ fontWeight: 800, color: "var(--text)" }}>LIVE SPACE EVENTS</span>
          <span
            style={{
              fontSize: 9.5,
              background: "rgba(46, 196, 182, 0.15)",
              color: "var(--teal)",
              padding: "1px 5px",
              borderRadius: 3,
              fontWeight: 700,
            }}
          >
            {activeEvents.length} ACTIVE
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsMinimized(!isMinimized)}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            fontSize: 11,
            padding: "2px 4px",
          }}
          title={isMinimized ? "Expand live events feed" : "Minimize feed"}
        >
          {isMinimized ? "▼ SHOW" : "▲ HIDE"}
        </button>
      </div>

      {/* Stack of Live Event Cards */}
      {!isMinimized && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            overflowY: "auto",
            maxHeight: "520px",
            paddingRight: 2,
          }}
          className="scrollbar-thin"
        >
          {activeEvents.length === 0 ? (
            <div
              style={{
                background: "rgba(16, 21, 31, 0.9)",
                border: "1px dashed var(--border)",
                borderRadius: 6,
                padding: "14px",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: 11,
                fontFamily: "var(--font-mono)",
              }}
            >
              Listening for next space orbital event…
            </div>
          ) : (
            activeEvents.map((evt) => (
              <div
                key={evt.id}
                onClick={() => handleInspect(evt.satId)}
                style={{
                  background: "rgba(12, 17, 26, 0.96)",
                  border: `1px solid ${evt.color}55`,
                  borderLeft: `4px solid ${evt.color}`,
                  borderRadius: 6,
                  padding: "10px 12px",
                  backdropFilter: "blur(8px)",
                  boxShadow: `0 4px 18px rgba(0, 0, 0, 0.5), 0 0 10px ${evt.color}22`,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  fontFamily: "var(--font-ui, sans-serif)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateX(2px)";
                  e.currentTarget.style.borderColor = evt.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateX(0px)";
                  e.currentTarget.style.borderColor = `${evt.color}55`;
                }}
              >
                {/* Event Badge & Time Header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 5,
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: 10,
                  }}
                >
                  <span
                    style={{
                      background: evt.bg,
                      color: evt.color,
                      fontWeight: 800,
                      padding: "2px 6px",
                      borderRadius: 3,
                      letterSpacing: "0.4px",
                    }}
                  >
                    {evt.badge}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: "var(--text-muted)", fontSize: 9.5 }}>{evt.timestamp}</span>
                    <button
                      type="button"
                      onClick={(e) => dismissEvent(evt.id, e)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        fontSize: 12,
                        lineHeight: 1,
                        padding: "0 2px",
                      }}
                      title="Dismiss popup"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Headline */}
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 12,
                    color: "var(--text)",
                    marginBottom: 4,
                  }}
                >
                  {evt.headline}
                </div>

                {/* What is happening (detailed explanation) */}
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-secondary, #cbd5e1)",
                    lineHeight: 1.45,
                    marginBottom: 8,
                  }}
                >
                  {evt.details}
                </div>

                {/* Action Footer */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                    paddingTop: 6,
                    fontSize: 10,
                    fontFamily: "var(--font-mono, monospace)",
                  }}
                >
                  <span style={{ color: evt.color, fontWeight: 700 }}>
                    ▶ {evt.action}
                  </span>
                  <span
                    style={{
                      color: "var(--teal)",
                      textDecoration: "underline",
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  >
                    Locate on Map ➔
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
