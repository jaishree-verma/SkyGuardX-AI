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

export default function CommandCenter({ isEmbedded = false }) {
  const { connected, lastEventTime, events, satellites, spaceObjects, risks, conjunction, alerts } = useNexusSocket();

  const [activeTab, setActiveTab] = useState("overview");
  const [selectedSatId, setSelectedSatId] = useState("SAT-1042");
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [demoStatus, setDemoStatus] = useState("idle"); // idle | running | reset

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
    setActiveTab("satellites");
  };

  // Find selected satellite and identify the highest risk satellite across the fleet
  const satList = useMemo(() => Object.values(satellites), [satellites]);
  const selectedSat = satellites[selectedSatId] || satList[0];
  const selectedRisk = selectedSat ? risks[selectedSat.satellite_id] : null;

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
        onTabChange={setActiveTab}
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
        {/* TAB 1: OVERVIEW — REAL-TIME SPACE INTELLIGENCE COMMAND CENTER */}
        {activeTab === "overview" && (
          <div
            style={{
              display: "grid",
              gridTemplateRows: "auto 1fr",
              height: "100%",
              overflow: "hidden",
            }}
          >
            {/* Primary Intelligence Banner (What is happening, Where, Risk, Confidence, What to do) */}
            <IntelligenceBanner
              riskySatellite={topRiskySatellite}
              riskData={topRiskData}
              conjunction={conjunction}
              onInspect={handleInspectSatellite}
              fleetCount={satList.length}
            />

            {/* Balanced Command Center Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "370px 1fr 340px",
                height: "100%",
                overflow: "hidden",
              }}
            >
              {/* Left Column: What AI Detected & Explainable Risk Reasoning */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  padding: "14px",
                  borderRight: "1px solid var(--border)",
                  overflowY: "auto",
                  background: "var(--panel)",
                }}
                className="scrollbar-thin"
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

              {/* Center Column: Space Map (~56%) + Fleet Quick Status Table (~44%) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateRows: "56% 44%",
                  height: "100%",
                  overflow: "hidden",
                }}
              >
                <div style={{ position: "relative", borderBottom: "1px solid var(--border)" }}>
                  <SpaceMap
                    satellites={satellites}
                    spaceObjects={spaceObjects}
                    selectedSatId={selectedSatId}
                    onSelectSatellite={setSelectedSatId}
                    conjunction={conjunction}
                  />
                </div>

                <div style={{ overflow: "hidden", background: "var(--bg)" }}>
                  <SatelliteTable
                    satellites={satellites}
                    risks={risks}
                    selectedSatId={selectedSatId}
                    onSelectSatellite={setSelectedSatId}
                  />
                </div>
              </div>

              {/* Right Column: Live Space Events Timeline (Chronological Flow) */}
              <div
                style={{
                  borderLeft: "1px solid var(--border)",
                  background: "var(--panel)",
                  overflow: "hidden",
                }}
              >
                <LiveEventTimeline events={events} connected={connected} />
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
