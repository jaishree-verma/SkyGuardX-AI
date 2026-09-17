import React, { useState } from "react";
import SatelliteTable from "./SatelliteTable.jsx";
import SatelliteDetail from "./SatelliteDetail.jsx";

export default function SatellitesView({
  satellites = {},
  risks = {},
  conjunction,
  onSelectSatellite,
  selectedSatId,
  onCheckSatellite,
  onOpenMonitor,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const satList = Object.values(satellites);

  const normalCount = satList.filter((s) => !s.health_status || s.health_status === "NORMAL").length;
  const warningCount = satList.filter((s) => s.health_status === "WARNING").length;
  const highRiskCount = satList.filter((s) => s.health_status === "HIGH_RISK" || s.health_status === "HIGH").length;
  const criticalCount = satList.filter((s) => s.health_status === "CRITICAL").length;

  const selectedSat = satellites[selectedSatId] || satList[0];
  const selectedRisk = selectedSat ? risks[selectedSat.satellite_id] : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: "var(--bg)" }}>
      {/* Fleet Summary KPI Strip */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--border)",
          background: "var(--panel)",
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 14,
        }}
      >
        <div style={{ background: "var(--panel-raised)", padding: "12px", borderRadius: 6, border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>TOTAL SATELLITES</div>
          <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--text)" }}>{satList.length}</div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>LEO Constellation</div>
        </div>

        <div style={{ background: "var(--panel-raised)", padding: "12px", borderRadius: 6, border: "1px solid rgba(46, 196, 182, 0.3)" }}>
          <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>NOMINAL</div>
          <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--teal)" }}>{normalCount}</div>
          <div style={{ fontSize: 10, color: "var(--teal)", marginTop: 2 }}>All systems nominal</div>
        </div>

        <div style={{ background: "var(--panel-raised)", padding: "12px", borderRadius: 6, border: "1px solid rgba(245, 200, 76, 0.3)" }}>
          <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>WARNING</div>
          <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--gold)" }}>{warningCount}</div>
          <div style={{ fontSize: 10, color: "var(--gold)", marginTop: 2 }}>Minor telemetry drift</div>
        </div>

        <div style={{ background: "var(--panel-raised)", padding: "12px", borderRadius: 6, border: "1px solid rgba(255, 159, 28, 0.3)" }}>
          <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>HIGH RISK</div>
          <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--font-mono)", color: "#ff9f1c" }}>{highRiskCount}</div>
          <div style={{ fontSize: 10, color: "#ff9f1c", marginTop: 2 }}>Anomaly detected</div>
        </div>

        <div style={{ background: "var(--panel-raised)", padding: "12px", borderRadius: 6, border: "1px solid rgba(230, 57, 70, 0.3)" }}>
          <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>CRITICAL</div>
          <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--font-mono)", color: "#e63946" }}>{criticalCount}</div>
          <div style={{ fontSize: 10, color: "#e63946", marginTop: 2 }}>Action required</div>
        </div>
      </div>

      {/* Main 2-column view: Fleet Grid + Inspector */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", flex: 1, overflow: "hidden" }}>
        <div style={{ borderRight: "1px solid var(--border)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <SatelliteTable
            satellites={satellites}
            risks={risks}
            selectedSatId={selectedSatId}
            onSelectSatellite={onSelectSatellite}
            onInspectSatellite={onCheckSatellite}
          />
        </div>

        <div style={{ overflow: "hidden" }}>
          <SatelliteDetail
            satellite={selectedSat}
            risk={selectedRisk}
            conjunction={conjunction}
            onCheckSatellite={onCheckSatellite}
            onOpenMonitor={onOpenMonitor}
          />
        </div>
      </div>
    </div>
  );
}
