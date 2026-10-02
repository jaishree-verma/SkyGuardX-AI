import React, { useEffect, useState, useMemo } from "react";
import { useNexusSocket } from "../hooks/useWebSocket.js";
import { api } from "../api/client.js";
import DashboardHeader from "./DashboardHeader.jsx";
import IntelligenceBanner from "./IntelligenceBanner.jsx";
import AIInsightCard from "./AIInsightCard.jsx";
import RiskBreakdown from "./RiskBreakdown.jsx";
import LiveEventTimeline from "./LiveEventTimeline.jsx";
import SpaceMap from "./SpaceMap.jsx";
import SatelliteTable from "./SatelliteTable.jsx";
import SatellitesView from "./SatellitesView.jsx";
import AlertsView from "./AlertsView.jsx";
import EventsView from "./EventsView.jsx";
import AnalyticsView from "./AnalyticsView.jsx";
import AlertBanner from "./AlertBanner.jsx";
import { useLivePublicSatellites } from "../hooks/useLivePublicSatellites.js";

export default function CommandCenter({
  isEmbedded = false,
  selectedSatId: propSelectedSatId,
  onSelectSatellite: propOnSelectSatellite,
  onInspectSatellite,
  onNavigateTab,
}) {
  const { connected, lastEventTime, events, satellites, spaceObjects, risks, conjunction, alerts } = useNexusSocket();
  const { publicSatellites, isLive: isPublicLive } = useLivePublicSatellites(3500);

  const [activeTab, setActiveTab] = useState("overview");
  const [internalSatId, setInternalSatId] = useState("SAT-1042");
  const selectedSatId = propSelectedSatId !== undefined ? propSelectedSatId : internalSatId;
  const setSelectedSatId = propOnSelectSatellite || setInternalSatId;
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [demoStatus, setDemoStatus] = useState("idle"); // idle | running | reset

  // Collapsible Floating Overlay HUD Panels (Expanded Map Mode)
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [showFleetTable, setShowFleetTable] = useState(false);
  const [showEventStream, setShowEventStream] = useState(false);
  const [showFullBanner, setShowFullBanner] = useState(true);

  const layoutKey = `${showAIInsights}-${showFleetTable}-${showEventStream}-${showFullBanner}`;

  // Merge incoming websocket alerts into active alert history
  useEffect(() => {
    if (alerts && alerts.length > 0) {
      setActiveAlerts((prev) => {
        const existingIds = new Set(prev.map((a) => a.alert_id));
        const newOnes = alerts.filter((a) => !existingIds.has(a.alert_id));
        return [...newOnes, ...prev].slice(0, 15);
      });
    }
  }, [alerts]);

  // Initial fetch of satellites, space objects, and alerts
  useEffect(() => {
    api.satellites().catch(() => {});
    api.spaceObjects().catch(() => {});
    api.alerts().then((res) => {
      if (res && Array.isArray(res)) setActiveAlerts(res.slice(0, 15));
    }).catch(() => {});
  }, []);

  const handleStartDemo = async () => {
    setDemoStatus("running");
    setSelectedSatId("SAT-1042");
    try {
      await api.startDemo();
    } catch (e) {
      console.error("Failed to start demo:", e);
    }
  };

  const handleResetDemo = async () => {
    setDemoStatus("reset");
    setActiveAlerts([]);
    try {
      await api.resetDemo();
    } catch (e) {
      console.error("Failed to reset demo:", e);
    }
  };

  const handleDismissAlert = (alertId) => {
    setActiveAlerts((prev) => prev.filter((a) => a.alert_id !== alertId));
  };

  const handleInspectSatellite = (satId) => {
    setSelectedSatId(satId);
    if (onInspectSatellite) {
      onInspectSatellite(satId);
    } else {
      setActiveTab("satellites");
    }
  };

  // Find selected satellite and identify the highest risk satellite across the fleet
  const satList = useMemo(() => Object.values(satellites), [satellites]);
  const publicSat = useMemo(
    () =>
      publicSatellites.find(
        (s) =>
          s.satellite_id === selectedSatId ||
          String(s.norad_id) === String(selectedSatId) ||
          s.name === selectedSatId
      ),
    [publicSatellites, selectedSatId]
  );
  const selectedSat = publicSat || satellites[selectedSatId] || satList[0];
  const selectedRisk = selectedSat
    ? risks[selectedSat.satellite_id] || (publicSat ? {
        satellite_id: publicSat.satellite_id,
        risk_score: 0.04,
        status: "NORMAL",
        confidence: 0.99,
        breakdown: {
          telemetry_anomaly: 0.01,
          subsystem_health: 0.02,
          orbital_conjunction: 0.01,
        },
        recommendation: `Operational state nominal. Live CelesTrak SGP4 orbit propagated at altitude ${publicSat.altitude_km} km with velocity ${publicSat.velocity_kms} km/s.`,
      } : null)
    : null;

  const topRiskySatellite = useMemo(() => {
    if (satList.length === 0) return null;
    let maxRisk = -1;
    let topSat = satList.find((s) => s.satellite_id === "SAT-1042") || satList[0];
    for (const sat of satList) {
      const r = risks[sat.satellite_id]?.risk_score || 0;
      if (r > maxRisk) {
        maxRisk = r;
        topSat = sat;
      }
    }
    return topSat;
  }, [satList, risks]);

  const topRiskData = topRiskySatellite ? risks[topRiskySatellite.satellite_id] : null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: isEmbedded ? "42px 1fr" : "54px 1fr",
        height: isEmbedded ? "calc(100vh - 56px)" : "100vh",
        background: "var(--bg)",
        overflow: "hidden",
        color: "var(--text)",
        fontFamily: "var(--font-ui)",
      }}
    >
      {/* 1. Top Navigation Bar */}
      <DashboardHeader
        activeTab={activeTab}
        onTabChange={(tabId) => {
          if (onNavigateTab && tabId !== "overview") {
            onNavigateTab(tabId);
          } else {
            setActiveTab(tabId);
          }
        }}
        connected={connected}
        lastEventTime={lastEventTime}
        demoStatus={demoStatus}
        onStartDemo={handleStartDemo}
        onResetDemo={handleResetDemo}
        alertsCount={activeAlerts.length}
        isEmbedded={isEmbedded}
      />

      {/* 2. Main Content Area Switcher */}
      <main style={{ overflow: "hidden", height: "100%", position: "relative" }}>
        {/* TAB 1: OVERVIEW — FULL-SCREEN EXPANDED MAP COMMAND CENTER */}
        {activeTab === "overview" && (
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              minHeight: "80vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              margin: 0,
              padding: 0,
            }}
          >
            {/* Primary Intelligence Banner (Collapsible to maximize full map view) */}
            {showFullBanner && (
              <div style={{ position: "relative", zIndex: 10, flexShrink: 0 }}>
                <IntelligenceBanner
                  riskySatellite={topRiskySatellite}
                  riskData={topRiskData}
                  conjunction={conjunction}
                  onInspect={handleInspectSatellite}
                  fleetCount={satList.length}
                />
              </div>
            )}

            {/* FULL-STAGE MAP: OCCUPIES 100% WIDTH AND FLEX-GROW 1 (MIN 80vh) */}
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
                flex: 1,
                minHeight: "80vh",
                overflow: "hidden",
              }}
            >
              <SpaceMap
                satellites={satellites}
                spaceObjects={spaceObjects}
                publicSatellites={publicSatellites}
                selectedSatId={selectedSatId}
                onSelectSatellite={setSelectedSatId}
                onInspectSatellite={handleInspectSatellite}
                conjunction={conjunction}
                events={events}
                layoutKey={layoutKey}
              />

              {/* FLOATING OVERLAY 1: LEFT SIDEBAR — AI RISK INTELLIGENCE & EXPLAINABLE REASONING */}
              {showAIInsights && (
                <div
                  style={{
                    position: "absolute",
                    top: 14,
                    left: 14,
                    bottom: 60,
                    width: 380,
                    maxWidth: "calc(100vw - 28px)",
                    zIndex: 650,
                    background: "rgba(10, 14, 22, 0.95)",
                    backdropFilter: "blur(14px)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.75)",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "10px 14px",
                      borderBottom: "1px solid var(--border)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ fontSize: 14 }}>🧠</span>
                      <span style={{ fontWeight: 800, fontSize: 11, color: "var(--text)" }}>
                        AI RISK & EXPLAINABLE REASONING
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAIInsights(false)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--text-muted)",
                        fontSize: 16,
                        cursor: "pointer",
                        lineHeight: 1,
                      }}
                      title="Close panel"
                    >
                      ✕
                    </button>
                  </div>

                  <div
                    className="scrollbar-thin"
                    style={{
                      overflowY: "auto",
                      flex: 1,
                      padding: "14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <AIInsightCard
                      satellite={selectedSat || topRiskySatellite}
                      risk={selectedRisk || topRiskData}
                      onViewTelemetry={handleInspectSatellite}
                    />

                    <RiskBreakdown
                      risk={selectedRisk || topRiskData}
                      satellite={selectedSat || topRiskySatellite}
                      conjunction={conjunction}
                    />
                  </div>
                </div>
              )}

              {/* FLOATING OVERLAY 2: RIGHT SIDEBAR — LIVE SPACE EVENT TIMELINE STREAM */}
              {showEventStream && (
                <div
                  style={{
                    position: "absolute",
                    top: 14,
                    right: 14,
                    bottom: 60,
                    width: 350,
                    maxWidth: "calc(100vw - 28px)",
                    zIndex: 650,
                    background: "rgba(10, 14, 22, 0.95)",
                    backdropFilter: "blur(14px)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.75)",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "10px 14px",
                      borderBottom: "1px solid var(--border)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ fontSize: 14 }}>📡</span>
                      <span style={{ fontWeight: 800, fontSize: 11, color: "var(--text)" }}>
                        CANONICAL EVENT TIMELINE
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowEventStream(false)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--text-muted)",
                        fontSize: 16,
                        cursor: "pointer",
                        lineHeight: 1,
                      }}
                      title="Close panel"
                    >
                      ✕
                    </button>
                  </div>

                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <LiveEventTimeline events={events} connected={connected} />
                  </div>
                </div>
              )}

              {/* FLOATING OVERLAY 3: BOTTOM DRAWER — ACTIVE SATELLITE FLEET TABLE */}
              {showFleetTable && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 54,
                    left: 14,
                    right: 14,
                    height: 275,
                    zIndex: 640,
                    background: "rgba(10, 14, 22, 0.96)",
                    backdropFilter: "blur(14px)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.75)",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "8px 14px",
                      borderBottom: "1px solid var(--border)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontFamily: "var(--font-mono)",
                      background: "rgba(255, 255, 255, 0.02)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13 }}>🛰️</span>
                      <span style={{ fontWeight: 800, fontSize: 11, color: "var(--text)" }}>
                        ACTIVE SATELLITE CONSTELLATION TELEMETRY ({satList.length})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowFleetTable(false)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--text-muted)",
                        fontSize: 16,
                        cursor: "pointer",
                        lineHeight: 1,
                      }}
                      title="Close table"
                    >
                      ✕
                    </button>
                  </div>

                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <SatelliteTable
                      satellites={satellites}
                      publicSatellites={publicSatellites}
                      risks={risks}
                      selectedSatId={selectedSatId}
                      onSelectSatellite={setSelectedSatId}
                      onInspectSatellite={handleInspectSatellite}
                    />
                  </div>
                </div>
              )}

              {/* FLOATING MISSION CONTROL DOCK: BOTTOM-CENTER OVERLAY */}
              <div
                style={{
                  position: "absolute",
                  bottom: 12,
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 630,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "rgba(10, 14, 22, 0.94)",
                  border: "1px solid var(--border)",
                  borderRadius: 24,
                  padding: "4px 8px",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 6px 24px rgba(0, 0, 0, 0.6)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowAIInsights(!showAIInsights)}
                  style={{
                    background: showAIInsights ? "rgba(245, 200, 76, 0.22)" : "transparent",
                    color: showAIInsights ? "var(--yellow)" : "var(--text)",
                    border: `1px solid ${showAIInsights ? "var(--yellow)" : "transparent"}`,
                    borderRadius: 16,
                    padding: "4px 10px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontWeight: 700,
                    fontSize: 11,
                    transition: "all 0.15s ease",
                  }}
                  title="Toggle AI Risk & Explainable Reasoning panel"
                >
                  <span>🧠</span>
                  <span>AI Insights</span>
                  <span style={{ fontSize: 9, opacity: 0.8 }}>{showAIInsights ? "▲" : "▼"}</span>
                </button>

                <div style={{ width: 1, height: 16, background: "rgba(245, 200, 76, 0.25)" }} />

                {/* 5 Live Public Satellites Selector (ISS, Sentinel-2A, Landsat 9, Terra, Hubble) */}
                <button
                  type="button"
                  onClick={() => {
                    if (publicSatellites.length > 0) {
                      const curIdx = publicSatellites.findIndex((s) => s.satellite_id === selectedSatId);
                      const nextSat = publicSatellites[(curIdx + 1) % publicSatellites.length];
                      setSelectedSatId(nextSat.satellite_id);
                      setShowAIInsights(true);
                    }
                  }}
                  style={{
                    background: publicSat ? "rgba(245, 200, 76, 0.22)" : "transparent",
                    color: publicSat ? "var(--yellow)" : "var(--text)",
                    border: `1px solid ${publicSat ? "var(--yellow)" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: 16,
                    padding: "4px 10px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontWeight: 700,
                    fontSize: 11,
                    transition: "all 0.15s ease",
                  }}
                  title="Cycle and track 5 Live Public Satellites (ISS, Sentinel-2A, Landsat 9, Terra, Hubble)"
                >
                  <span>🛰️</span>
                  <span>Live Public ({publicSatellites.length})</span>
                  {publicSat && (
                    <span style={{ fontSize: 9.5, color: "var(--yellow)", fontWeight: 800 }}>
                      [{publicSat.name.split(" ")[0]}]
                    </span>
                  )}
                </button>

                <div style={{ width: 1, height: 16, background: "rgba(245, 200, 76, 0.25)" }} />

                <button
                  type="button"
                  onClick={() => setShowFleetTable(!showFleetTable)}
                  style={{
                    background: showFleetTable ? "rgba(245, 200, 76, 0.22)" : "transparent",
                    color: showFleetTable ? "var(--yellow)" : "var(--text)",
                    border: `1px solid ${showFleetTable ? "var(--yellow)" : "transparent"}`,
                    borderRadius: 16,
                    padding: "4px 10px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontWeight: 700,
                    fontSize: 11,
                    transition: "all 0.15s ease",
                  }}
                  title="Toggle Satellite Fleet Table Drawer"
                >
                  <span>🛰️</span>
                  <span>Fleet Table ({satList.length})</span>
                  <span style={{ fontSize: 9, opacity: 0.8 }}>{showFleetTable ? "▲" : "▼"}</span>
                </button>

                <div style={{ width: 1, height: 16, background: "rgba(230, 57, 70, 0.3)" }} />

                <button
                  type="button"
                  onClick={() => setShowEventStream(!showEventStream)}
                  style={{
                    background: showEventStream ? "rgba(230, 57, 70, 0.22)" : "transparent",
                    color: showEventStream ? "var(--red)" : "var(--text)",
                    border: `1px solid ${showEventStream ? "var(--red)" : "transparent"}`,
                    borderRadius: 16,
                    padding: "4px 10px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontWeight: 700,
                    fontSize: 11,
                    transition: "all 0.15s ease",
                  }}
                  title="Toggle Live Event Stream Timeline"
                >
                  <span>📡</span>
                  <span>Event Stream</span>
                  <span style={{ fontSize: 9, opacity: 0.8 }}>{showEventStream ? "▲" : "▼"}</span>
                </button>

                <div style={{ width: 1, height: 16, background: "var(--border)" }} />

                <button
                  type="button"
                  onClick={() => setShowFullBanner(!showFullBanner)}
                  style={{
                    background: "transparent",
                    color: "var(--text-muted)",
                    border: "none",
                    borderRadius: 16,
                    padding: "4px 8px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                  }}
                  title={showFullBanner ? "Hide top banner to maximize map" : "Show top banner"}
                >
                  <span>{showFullBanner ? "⛶ Maximize Map" : "⊟ Show Banner"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SATELLITES — FLEET OBSERVABILITY & DEEP INSPECTOR */}
        {activeTab === "satellites" && (
          <SatellitesView
            satellites={satellites}
            risks={risks}
            conjunction={conjunction}
            selectedSatId={selectedSatId}
            onSelectSatellite={setSelectedSatId}
          />
        )}

        {/* TAB 3: ALERTS — ACTIVE THREAT ASSESSMENT & DECISION WARNINGS */}
        {activeTab === "alerts" && (
          <AlertsView
            alerts={activeAlerts}
            conjunction={conjunction}
            onInspectSatellite={handleInspectSatellite}
          />
        )}

        {/* TAB 4: EVENTS — CANONICAL STREAM & JSON PAYLOAD EXPLORER */}
        {activeTab === "events" && <EventsView events={events} />}

        {/* TAB 5: ANALYTICS — AI MODEL EVALUATION & IBM Z AUDIT */}
        {activeTab === "analytics" && <AnalyticsView />}
      </main>

      {/* Floating Real-Time Critical Alert Banner */}
      <AlertBanner alerts={activeAlerts} onDismiss={handleDismissAlert} />
    </div>
  );
}
