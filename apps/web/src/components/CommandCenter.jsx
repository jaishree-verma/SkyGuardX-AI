import React from "react";
import { useNexusSocket } from "../hooks/useWebSocket.js";
import EventStream from "./EventStream.jsx";
import RiskCard from "./RiskCard.jsx";
import MapView from "./MapView.jsx";
import ImpactCascadePanel from "./ImpactCascadePanel.jsx";
import DecisionPanel from "./DecisionPanel.jsx";

export default function CommandCenter() {
  const { connected, events, risks, impact, cascade, scenarioResults, recommendations } = useNexusSocket();

  const riskList = Object.values(risks).sort((a, b) => b.risk_score - a.risk_score);

  return (
    <div style={{ display: "grid", gridTemplateRows: "56px 1fr", height: "100vh" }}>
      <header style={{
        display: "flex", alignItems: "center", padding: "0 16px",
        borderBottom: "1px solid var(--border)", background: "var(--panel)",
      }}>
        <div style={{ fontWeight: 700, letterSpacing: "0.01em" }}>SkyGuard-X</div>
        <div style={{ color: "var(--text-muted)", fontSize: 12, marginLeft: 10 }}>
          Real-Time Space-to-Earth Decision Intelligence
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          <span className="pill">IBM Z boundary: simulated</span>
          <span className="pill" style={{ color: connected ? "var(--teal)" : "var(--amber)" }}>
            {connected ? "● connected" : "○ reconnecting"}
          </span>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr 360px", overflow: "hidden" }}>
        <div style={{ borderRight: "1px solid var(--border)", background: "var(--panel)", overflow: "hidden" }}>
          <EventStream events={events} connected={connected} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: 1, minHeight: 0 }}>
            <MapView impact={impact} />
          </div>
          <div style={{ maxHeight: "38%", overflowY: "auto", background: "var(--panel)" }} className="scrollbar-thin">
            <div style={{ padding: "10px 14px", fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>
              LIVE RISK OBJECTS
            </div>
            <div style={{ padding: "0 14px 10px" }}>
              {riskList.length === 0 && (
                <div style={{ color: "var(--text-muted)", fontSize: 12 }}>Waiting for the first scored event…</div>
              )}
              {riskList.map((r) => (
                <RiskCard key={r.entity_id + r.computed_at} risk={r} />
              ))}
            </div>
            <ImpactCascadePanel impact={impact} cascade={cascade} />
          </div>
        </div>

        <div style={{ borderLeft: "1px solid var(--border)", background: "var(--panel)", overflow: "hidden" }}>
          <DecisionPanel recommendations={recommendations} scenarioResults={scenarioResults} />
        </div>
      </div>
    </div>
  );
}
