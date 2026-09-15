import React, { useState, useEffect } from "react";
import { useNexusSocket } from "./hooks/useWebSocket.js";
import { api } from "./api/client.js";
import AppNavbar from "./components/AppNavbar.jsx";
import LandingPage from "./components/LandingPage.jsx";
import SatelliteCheckPage from "./components/SatelliteCheckPage.jsx";
import CommandCenter from "./components/CommandCenter.jsx";
import AlertsView from "./components/AlertsView.jsx";
import AboutPage from "./components/AboutPage.jsx";
import AlertBanner from "./components/AlertBanner.jsx";

export default function App() {
  const {
    connected,
    lastEventTime,
    events,
    satellites,
    spaceObjects,
    risks,
    conjunction,
    conjunctions,
    alerts,
  } = useNexusSocket();

  const [currentView, setCurrentView] = useState("home"); // home | check | monitor | alerts | about
  const [selectedSatForCheck, setSelectedSatForCheck] = useState(null);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [demoStatus, setDemoStatus] = useState("idle");

  // Merge incoming alerts
  useEffect(() => {
    if (alerts && alerts.length > 0) {
      setActiveAlerts((prev) => {
        const existing = new Set(prev.map((a) => a.alert_id));
        const newOnes = alerts.filter((a) => !existing.has(a.alert_id));
        return [...newOnes, ...prev].slice(0, 15);
      });
    }
  }, [alerts]);

  // Initial fetch of active alerts and objects
  useEffect(() => {
    api.satellites().catch(() => {});
    api.spaceObjects().catch(() => {});
    api.alerts().then((res) => {
      if (res && Array.isArray(res)) setActiveAlerts(res.slice(0, 15));
    }).catch(() => {});
  }, []);

  const handleStartDemo = async () => {
    setDemoStatus("running");
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

  const handleNavigateToCheck = (satId) => {
    setSelectedSatForCheck(satId || null);
    setCurrentView("check");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "var(--bg)",
        overflow: "hidden",
        color: "var(--text)",
        fontFamily: "var(--font-ui)",
      }}
    >
      {/* 1. Global Product Navigation Bar */}
      <AppNavbar
        currentView={currentView}
        onNavigate={setCurrentView}
        connected={connected}
        lastEventTime={lastEventTime}
        alertsCount={activeAlerts.length}
        demoStatus={demoStatus}
        onStartDemo={handleStartDemo}
        onResetDemo={handleResetDemo}
      />

      {/* 2. Main Product Flow Switcher */}
      <main style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {/* VIEW 1: PRODUCT LANDING PAGE */}
        {currentView === "home" && (
          <LandingPage
            onCheckSatellite={handleNavigateToCheck}
            onOpenMonitor={() => setCurrentView("monitor")}
            onNavigateView={setCurrentView}
            satellites={satellites}
            spaceObjects={spaceObjects}
            events={events}
            risks={risks}
            conjunction={conjunction}
            connected={connected}
            lastEventTime={lastEventTime}
            alertsCount={activeAlerts.length}
          />
        )}

        {/* VIEW 2: HERO INTERACTION — CHECK LIVE SATELLITE (Search + Intelligent Loading + Result) */}
        {currentView === "check" && (
          <SatelliteCheckPage
            satellites={satellites}
            risks={risks}
            conjunctions={conjunctions}
            conjunction={conjunction}
            events={events}
            spaceObjects={spaceObjects}
            initialSatelliteId={selectedSatForCheck}
            onOpenMonitor={() => setCurrentView("monitor")}
          />
        )}

        {/* VIEW 3: LIVE COMMAND CENTER MONITOR (Advanced Multi-Column Console) */}
        {currentView === "monitor" && <CommandCenter isEmbedded={true} />}

        {/* VIEW 4: ACTIVE ALERTS AUDIT CENTER */}
        {currentView === "alerts" && (
          <div style={{ height: "calc(100vh - 56px)", overflow: "hidden" }}>
            <AlertsView
              alerts={activeAlerts}
              conjunction={conjunction}
              onInspectSatellite={handleNavigateToCheck}
            />
          </div>
        )}

        {/* VIEW 5: ABOUT & DECISION ARCHITECTURE */}
        {currentView === "about" && (
          <AboutPage
            onCheckSatellite={handleNavigateToCheck}
            onOpenMonitor={() => setCurrentView("monitor")}
          />
        )}
      </main>

      {/* 3. Floating Real-Time Alert Toast Notification */}
      <AlertBanner alerts={activeAlerts} onDismiss={handleDismissAlert} />
    </div>
  );
}
