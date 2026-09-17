import React, { useState, useEffect, useCallback } from "react";
import { useNexusSocket } from "./hooks/useWebSocket.js";
import { api } from "./api/client.js";
import { ToastProvider, useToast } from "./components/Toast.jsx";
import AppNavbar from "./components/AppNavbar.jsx";
import LandingPage from "./components/LandingPage.jsx";
import SatelliteCheckPage from "./components/SatelliteCheckPage.jsx";
import CommandCenter from "./components/CommandCenter.jsx";
import SatellitesView from "./components/SatellitesView.jsx";
import AlertsView from "./components/AlertsView.jsx";
import EventsView from "./components/EventsView.jsx";
import AnalyticsView from "./components/AnalyticsView.jsx";
import AboutPage from "./components/AboutPage.jsx";
import AlertBanner from "./components/AlertBanner.jsx";

function AppContent() {
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

  const { showToast } = useToast();

  // Route State: home | check | monitor | satellites | alerts | events | analytics | about
  const [currentView, setCurrentView] = useState("home");
  const [selectedSatId, setSelectedSatId] = useState("SAT-1042");
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [demoStatus, setDemoStatus] = useState("idle");

  // Parse Hash Route
  const parseRouteFromHash = useCallback(() => {
    const hash = window.location.hash.replace(/^#\/?/, "");
    if (!hash || hash === "" || hash === "home") {
      return { view: "home", satId: null };
    }

    // Handle query params e.g. check?sat=SAT-1042 or satellites?sat=SAT-2089
    const [path, queryString] = hash.split("?");
    let satId = null;
    if (queryString) {
      const params = new URLSearchParams(queryString);
      satId = params.get("sat");
    }

    const validViews = ["home", "check", "monitor", "satellites", "alerts", "events", "analytics", "about"];
    if (validViews.includes(path)) {
      return { view: path, satId };
    }

    // Check if it's an anchor on landing page
    if (["how-it-works", "intelligence", "features", "architecture", "stats"].includes(path)) {
      return { view: "home", satId: null, anchor: path };
    }

    return { view: "home", satId: null };
  }, []);

  // Sync URL hash with component state & handle browser back/forward
  useEffect(() => {
    const handleHashChange = () => {
      const { view, satId, anchor } = parseRouteFromHash();
      setCurrentView(view);
      if (satId) setSelectedSatId(satId);

      if (anchor) {
        setTimeout(() => {
          const el = document.getElementById(anchor);
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }, 150);
      }
    };

    // Initial load
    handleHashChange();

    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("popstate", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("popstate", handleHashChange);
    };
  }, [parseRouteFromHash]);

  // Navigate function that updates URL hash and browser history
  const handleNavigate = useCallback((view, satId = null) => {
    setCurrentView(view);
    if (satId) setSelectedSatId(satId);

    const newHash = satId ? `#/${view}?sat=${satId}` : `#/${view}`;
    if (window.location.hash !== newHash) {
      window.history.pushState(null, "", newHash);
    }

    // Update document title for accessibility and browser tabs
    const titles = {
      home: "SKYGUARD XAI — Real-Time Space Intelligence",
      check: "SKYGUARD XAI | Satellite AI Risk Check",
      monitor: "SKYGUARD XAI | Space Command Center",
      satellites: "SKYGUARD XAI | Fleet Observability",
      alerts: "SKYGUARD XAI | Active Threat Warnings",
      events: "SKYGUARD XAI | Canonical Event Stream",
      analytics: "SKYGUARD XAI | AI Model Benchmarks",
      about: "SKYGUARD XAI | Mission & Architecture",
    };
    document.title = titles[view] || "SKYGUARD XAI";
  }, []);

  // Merge incoming alerts
  useEffect(() => {
    if (alerts && alerts.length > 0) {
      setActiveAlerts((prev) => {
        const existing = new Set(prev.map((a) => a.alert_id));
        const newOnes = alerts.filter((a) => !existing.has(a.alert_id));
        if (newOnes.length > 0 && prev.length > 0) {
          showToast(`New space anomaly detected: ${newOnes[0].title}`, "danger");
        }
        return [...newOnes, ...prev].slice(0, 15);
      });
    }
  }, [alerts, showToast]);

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
    showToast("Launching orbital hazard scenario simulation...", "warning");
    try {
      await api.startDemo();
      showToast("Demo scenario active. Telemetry drift & conjunction injected.", "danger");
    } catch (e) {
      console.error("Failed to start demo:", e);
      showToast("Could not start demo simulation: " + e.message, "danger");
      setDemoStatus("idle");
    }
  };

  const handleResetDemo = async () => {
    setDemoStatus("reset");
    setActiveAlerts([]);
    showToast("Resetting constellation to nominal baseline...", "info");
    try {
      await api.resetDemo();
      showToast("Orbit baseline restored. All satellites nominal.", "success");
      setTimeout(() => setDemoStatus("idle"), 1500);
    } catch (e) {
      console.error("Failed to reset demo:", e);
      setDemoStatus("idle");
    }
  };

  const handleDismissAlert = (alertId) => {
    setActiveAlerts((prev) => prev.filter((a) => a.alert_id !== alertId));
    showToast("Alert dismissed from active HUD banner", "info");
  };

  const handleNavigateToCheck = (satId) => {
    handleNavigate("check", satId || "SAT-1042");
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
        onNavigate={handleNavigate}
        connected={connected}
        lastEventTime={lastEventTime}
        alertsCount={activeAlerts.length}
        demoStatus={demoStatus}
        onStartDemo={handleStartDemo}
        onResetDemo={handleResetDemo}
        selectedSatId={selectedSatId}
        onSelectSatellite={setSelectedSatId}
        satellites={satellites}
      />

      {/* 2. Main Product Flow Switcher */}
      <main style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {/* VIEW 1: PRODUCT LANDING PAGE */}
        {currentView === "home" && (
          <LandingPage
            onCheckSatellite={handleNavigateToCheck}
            onOpenMonitor={() => handleNavigate("monitor")}
            onNavigateView={handleNavigate}
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

        {/* VIEW 2: CHECK LIVE SATELLITE (Search + Intelligent Scanning + Explainable AI Result) */}
        {currentView === "check" && (
          <SatelliteCheckPage
            satellites={satellites}
            risks={risks}
            conjunctions={conjunctions}
            conjunction={conjunction}
            events={events}
            spaceObjects={spaceObjects}
            initialSatelliteId={selectedSatId}
            onOpenMonitor={() => handleNavigate("monitor")}
            onInspectSatellite={(id) => handleNavigate("satellites", id)}
          />
        )}

        {/* VIEW 3: LIVE COMMAND CENTER MONITOR (Advanced Multi-Column Console) */}
        {currentView === "monitor" && (
          <CommandCenter
            isEmbedded={true}
            selectedSatId={selectedSatId}
            onSelectSatellite={setSelectedSatId}
            onInspectSatellite={(id) => handleNavigate("check", id)}
            onNavigateTab={handleNavigate}
          />
        )}

        {/* VIEW 4: FLEET SATELLITES OBSERVABILITY & INSPECTOR */}
        {currentView === "satellites" && (
          <div style={{ height: "calc(100vh - 56px)", overflow: "hidden" }}>
            <SatellitesView
              satellites={satellites}
              risks={risks}
              conjunction={conjunction}
              selectedSatId={selectedSatId}
              onSelectSatellite={(id) => setSelectedSatId(id)}
              onCheckSatellite={handleNavigateToCheck}
              onOpenMonitor={(satId) => handleNavigate("monitor", satId)}
            />
          </div>
        )}

        {/* VIEW 5: ACTIVE ALERTS AUDIT CENTER */}
        {currentView === "alerts" && (
          <div style={{ height: "calc(100vh - 56px)", overflow: "hidden" }}>
            <AlertsView
              alerts={activeAlerts}
              conjunction={conjunction}
              onInspectSatellite={handleNavigateToCheck}
            />
          </div>
        )}

        {/* VIEW 6: LIVE EVENT STREAM EXPLORER */}
        {currentView === "events" && (
          <div style={{ height: "calc(100vh - 56px)", overflow: "hidden" }}>
            <EventsView events={events} onInspectSatellite={handleNavigateToCheck} />
          </div>
        )}

        {/* VIEW 7: AI MODEL EVALUATION & BENCHMARKS */}
        {currentView === "analytics" && (
          <div style={{ height: "calc(100vh - 56px)", overflow: "hidden" }}>
            <AnalyticsView onInspectSatellite={handleNavigateToCheck} />
          </div>
        )}

        {/* VIEW 8: ABOUT & DECISION ARCHITECTURE */}
        {currentView === "about" && (
          <AboutPage
            onCheckSatellite={handleNavigateToCheck}
            onOpenMonitor={() => handleNavigate("monitor")}
            onNavigateView={handleNavigate}
          />
        )}
      </main>

      {/* 3. Floating Real-Time Alert Toast Notification */}
      <AlertBanner alerts={activeAlerts} onDismiss={handleDismissAlert} />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
