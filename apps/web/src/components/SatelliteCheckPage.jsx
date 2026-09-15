import React, { useState, useEffect } from "react";
import SatelliteResultView from "./SatelliteResultView.jsx";
import { api } from "../api/client.js";

const LOADING_STEPS = [
  "Connecting to live satellite stream...",
  "Retrieving telemetry...",
  "Checking satellite health...",
  "Running anomaly detection...",
  "Checking nearby objects...",
  "Calculating risk...",
  "INTELLIGENCE READY",
];

export default function SatelliteCheckPage({
  satellites = {},
  risks = {},
  conjunctions = {},
  conjunction,
  events = [],
  spaceObjects = [],
  initialSatelliteId = null,
  onOpenMonitor,
}) {
  const [query, setQuery] = useState(initialSatelliteId || "");
  const [errorMsg, setErrorMsg] = useState(null);
  const [loadingStepIndex, setLoadingStepIndex] = useState(-1); // -1 = idle
  const [analyzedSatId, setAnalyzedSatId] = useState(null);
  const [historyData, setHistoryData] = useState([]);

  const satList = Object.values(satellites);
  const availableIds = satList.map((s) => s.satellite_id);

  // If initial satellite ID provided, auto-trigger check
  useEffect(() => {
    if (initialSatelliteId && availableIds.includes(initialSatelliteId)) {
      handleCheck(initialSatelliteId);
    }
  }, [initialSatelliteId]);

  // Autocomplete suggestions
  const suggestions = query.trim()
    ? satList.filter(
        (s) =>
          s.satellite_id.toLowerCase().includes(query.toLowerCase()) ||
          (s.satellite_name && s.satellite_name.toLowerCase().includes(query.toLowerCase()))
      )
    : [];

  const handleCheck = (targetId) => {
    const idToCheck = (targetId || query).trim().toUpperCase();
    if (!idToCheck) return;

    // Check if valid satellite
    const found = satList.find(
      (s) =>
        s.satellite_id.toUpperCase() === idToCheck ||
        (s.satellite_name && s.satellite_name.toUpperCase().includes(idToCheck))
    );

    if (!found) {
      setErrorMsg(`We could not find a satellite matching: "${idToCheck}"`);
      return;
    }

    setErrorMsg(null);
    setQuery(found.satellite_id);

    // Fetch telemetry history in background
    api.satelliteTelemetry(found.satellite_id).then((res) => {
      if (res?.history) setHistoryData(res.history);
    }).catch(() => {});

    // Run intelligent loading sequence
    setLoadingStepIndex(0);
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      if (step < LOADING_STEPS.length) {
        setLoadingStepIndex(step);
      } else {
        clearInterval(interval);
        setLoadingStepIndex(-1);
        setAnalyzedSatId(found.satellite_id);
      }
    }, 280);
  };

  const handleBackToSearch = () => {
    setAnalyzedSatId(null);
    setLoadingStepIndex(-1);
    setErrorMsg(null);
  };

  // If satellite has been analyzed, display full Intelligence Result View
  if (analyzedSatId) {
    const sat = satellites[analyzedSatId] || satList.find((s) => s.satellite_id === analyzedSatId);
    const risk = risks[analyzedSatId];
    // Find relevant conjunction if any
    let conj = null;
    if (conjunction && (conjunction.object_a === analyzedSatId || conjunction.object_b === analyzedSatId)) {
      conj = conjunction;
    } else {
      conj = Object.values(conjunctions).find(
        (c) => c.object_a === analyzedSatId || c.object_b === analyzedSatId
      );
    }

    return (
      <SatelliteResultView
        satellite={sat}
        risk={risk}
        conjunction={conj}
        history={historyData}
        events={events}
        spaceObjects={spaceObjects}
        onBack={handleBackToSearch}
        onOpenMonitor={onOpenMonitor}
      />
    );
  }

  // Loading Screen
  if (loadingStepIndex >= 0) {
    const currentMessage = LOADING_STEPS[loadingStepIndex];
    const progressPct = Math.round(((loadingStepIndex + 1) / LOADING_STEPS.length) * 100);

    return (
      <div
        style={{
          minHeight: "calc(100vh - 56px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: "var(--bg)",
          textAlign: "center",
        }}
        className="space-bg"
      >
        <div
          style={{
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "40px 50px",
            maxWidth: 540,
            width: "100%",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div style={{ fontSize: 36, animation: "float-subtle 2s ease-in-out infinite" }}>
            🛰
          </div>

          <div>
            <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--teal)", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 6 }}>
              AI PIPELINE EXECUTION ({progressPct}%)
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>
              {currentMessage}
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ width: "100%", height: 6, background: "var(--bg)", borderRadius: 3, overflow: "hidden" }}>
            <div
              style={{
                width: `${progressPct}%`,
                height: "100%",
                background: "var(--blue)",
                transition: "width 0.25s ease",
              }}
            />
          </div>

          <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            Target: <span style={{ color: "var(--text)", fontWeight: 600 }}>{query}</span> · Ingesting real-time telemetry frames
          </div>
        </div>
      </div>
    );
  }

  // Search & Check Hero Interface
  return (
    <div
      style={{
        minHeight: "calc(100vh - 56px)",
        padding: "60px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: "var(--bg)",
      }}
      className="space-bg scrollbar-thin"
    >
      <div style={{ maxWidth: 720, width: "100%", textAlign: "center" }}>
        {/* Header */}
        <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--blue)", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 8 }}>
          SATELLITE DECISION INTELLIGENCE
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--text)", margin: "0 0 10px" }}>
          Check Satellite Status
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "0 auto 32px", maxWidth: 540 }}>
          Enter a satellite name or identifier to execute our real-time anomaly detection,
          subsystem health scoring, and orbital proximity analysis.
        </p>

        {/* Search Box Card */}
        <div
          style={{
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "24px 28px",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setErrorMsg(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCheck();
                }}
                placeholder="Enter satellite name or ID (e.g. SAT-1042, SAT-1001)"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  fontSize: 15,
                  fontFamily: "var(--font-mono)",
                  background: "var(--bg)",
                  color: "var(--text)",
                  border: `1.5px solid ${errorMsg ? "#e63946" : "var(--border)"}`,
                  borderRadius: 6,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />

              {/* Autocomplete dropdown */}
              {suggestions.length > 0 && query.length > 1 && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    background: "var(--panel-raised)",
                    border: "1px solid var(--border)",
                    borderRadius: "0 0 6px 6px",
                    zIndex: 200,
                    maxHeight: 180,
                    overflowY: "auto",
                    boxShadow: "0 6px 20px rgba(0, 0, 0, 0.5)",
                  }}
                  className="scrollbar-thin"
                >
                  {suggestions.map((sat) => (
                    <div
                      key={sat.satellite_id}
                      onClick={() => handleCheck(sat.satellite_id)}
                      style={{
                        padding: "10px 14px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        cursor: "pointer",
                        borderBottom: "1px solid var(--border)",
                        fontSize: 12.5,
                        fontFamily: "var(--font-mono)",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--border)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <span style={{ fontWeight: 700, color: "var(--text)" }}>{sat.satellite_id}</span>
                      <span style={{ color: "var(--text-muted)", fontSize: 11 }}>{sat.satellite_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => handleCheck()}
              className="cta-button"
              style={{ padding: "0 24px", fontSize: 14 }}
            >
              <span>CHECK LIVE STATUS</span>
            </button>
          </div>

          {/* Invalid Satellite Error Message (Section 30) */}
          {errorMsg && (
            <div
              style={{
                marginTop: 18,
                padding: "12px 16px",
                background: "rgba(230, 57, 70, 0.12)",
                border: "1px solid rgba(230, 57, 70, 0.4)",
                borderRadius: 6,
                textAlign: "left",
                fontSize: 12.5,
              }}
            >
              <div style={{ color: "#e63946", fontWeight: 700, marginBottom: 4 }}>
                SATELLITE NOT FOUND
              </div>
              <div style={{ color: "var(--text)" }}>{errorMsg}</div>
              <div style={{ color: "var(--text-muted)", marginTop: 6, fontSize: 11.5 }}>
                Try selecting one of the available tracked fleet satellites below:
              </div>
            </div>
          )}

          {/* Quick Demo Chips */}
          <div style={{ marginTop: 24, textAlign: "left" }}>
            <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: 10 }}>
              SELECT DETERMINISTIC SATELLITE SCENARIO:
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => handleCheck("SAT-1042")}
                className="chip-btn"
                style={{ borderLeft: "3px solid #e63946" }}
              >
                <span>🚨 SAT-1042</span>
                <span style={{ color: "#e63946", fontWeight: 700 }}>(HIGH RISK · Demo Scenario)</span>
              </button>

              <button
                onClick={() => handleCheck("SAT-1001")}
                className="chip-btn"
                style={{ borderLeft: "3px solid #2ec4b6" }}
              >
                <span>🟢 SAT-1001</span>
                <span style={{ color: "var(--teal)" }}>(NORMAL · Nominal Ops)</span>
              </button>

              <button
                onClick={() => handleCheck("SAT-1003")}
                className="chip-btn"
                style={{ borderLeft: "3px solid #f5c84c" }}
              >
                <span>🟡 SAT-1003</span>
                <span style={{ color: "#f5c84c" }}>(WARNING · Thermal Drift)</span>
              </button>

              <button
                onClick={() => handleCheck("SAT-1077")}
                className="chip-btn"
                style={{ borderLeft: "3px solid #2ec4b6" }}
              >
                <span>🟢 SAT-1077</span>
                <span style={{ color: "var(--teal)" }}>(NORMAL · Sentinel)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Explainability Callout */}
        <div style={{ marginTop: 32, display: "flex", justifyContent: "space-around", color: "var(--text-muted)", fontSize: 11.5 }}>
          <div>✓ Multivariate Isolation Forest</div>
          <div>✓ 3D Spatial Conjunction Geometry</div>
          <div>✓ Human-in-the-Loop Decision Support</div>
        </div>
      </div>
    </div>
  );
}
