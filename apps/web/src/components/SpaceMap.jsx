import React from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const STATUS_COLORS = {
  NORMAL: "#2ec4b6",
  LOW: "#2ec4b6",
  WARNING: "#f5c84c",
  MEDIUM: "#f5c84c",
  HIGH_RISK: "#ff9f1c",
  HIGH: "#ff9f1c",
  CRITICAL: "#e63946",
  STALE: "#66738c",
};

export default function SpaceMap({
  satellites = {},
  spaceObjects = [],
  selectedSatId,
  onSelectSatellite,
  onInspectSatellite,
  conjunction,
}) {
  // Find coordinates for conjunction vector
  let conjunctionLine = null;
  let midPoint = null;
  let missDistanceKm = null;

  if (conjunction && conjunction.miss_distance_km < 15.0) {
    const objA = spaceObjects.find(
      (o) => (o.satellite_id || o.object_id) === conjunction.object_a
    );
    const objB = spaceObjects.find(
      (o) => (o.satellite_id || o.object_id) === conjunction.object_b
    );
    if (objA && objB) {
      conjunctionLine = [
        [objA.latitude, objA.longitude],
        [objB.latitude, objB.longitude],
      ];
      midPoint = [(objA.latitude + objB.latitude) / 2, (objA.longitude + objB.longitude) / 2];
      missDistanceKm = conjunction.miss_distance_km;
    }
  }

  const satCount = Object.keys(satellites).length;
  const debrisCount = spaceObjects.filter((o) => o.object_type === "DEBRIS").length;

  return (
    <div style={{ height: "100%", width: "100%", position: "relative", background: "#06090e" }}>
      <MapContainer
        center={[15, 20]}
        zoom={2}
        minZoom={1}
        maxZoom={7}
        style={{ height: "100%", width: "100%", background: "#06090e" }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Conjunction vector line */}
        {conjunctionLine && (
          <Polyline
            positions={conjunctionLine}
            pathOptions={{
              color: "#e63946",
              weight: 2.5,
              dashArray: "6, 6",
            }}
          >
            {midPoint && (
              <Tooltip permanent direction="top" className="conjunction-tooltip">
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "#e63946" }}>
                  ⚠ CLOSE APPROACH: {missDistanceKm} km
                </span>
              </Tooltip>
            )}
          </Polyline>
        )}

        {/* Space Objects & Satellites */}
        {spaceObjects.map((obj) => {
          const isDebris = obj.object_type === "DEBRIS";
          const id = obj.satellite_id || obj.object_id;
          const isSelected = selectedSatId === id;
          const satData = satellites[id];

          const status = satData?.health_status || "NORMAL";
          const color = isDebris ? "#a855f7" : STATUS_COLORS[status] || "#2ec4b6";
          const radius = isSelected ? 9 : isDebris ? 5 : 7;

          return (
            <CircleMarker
              key={id}
              center={[obj.latitude || 0, obj.longitude || 0]}
              radius={radius}
              pathOptions={{
                color: isSelected ? "#ffffff" : color,
                fillColor: color,
                fillOpacity: isSelected ? 1.0 : 0.85,
                weight: isSelected ? 3 : 1.5,
              }}
              eventHandlers={{
                click: () => {
                  if (!isDebris) onSelectSatellite(id);
                },
              }}
            >
              <Popup>
                <div style={{ fontFamily: "var(--font-ui)", color: "#dce4f0", minWidth: 160 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
                    <span>{isDebris ? "☄️ " : "🛰 "}{obj.satellite_name || obj.name || id}</span>
                    <span style={{ color, fontSize: 11, fontFamily: "var(--font-mono)" }}>{status}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5, fontFamily: "var(--font-mono)" }}>
                    <div>Coords: {obj.latitude?.toFixed(2)}°, {obj.longitude?.toFixed(2)}°</div>
                    <div>Altitude: {obj.altitude_km} km</div>
                    <div>Velocity: {obj.velocity_kms} km/s</div>
                    {satData && (
                      <div style={{ borderTop: "1px solid var(--border)", marginTop: 4, paddingTop: 4 }}>
                        <div>Health: <strong style={{ color: "#ff9f1c" }}>{satData.health_score?.toFixed(0)}%</strong></div>
                        <div>Temp: {satData.temperature_c}°C | Batt: {satData.battery_level}%</div>
                      </div>
                    )}
                  </div>
                  {!isDebris && (
                    <div style={{ marginTop: 8, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.12)" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onInspectSatellite) onInspectSatellite(id);
                          else if (onSelectSatellite) onSelectSatellite(id);
                        }}
                        style={{
                          width: "100%",
                          background: "rgba(245, 200, 76, 0.15)",
                          border: "1px solid var(--yellow)",
                          color: "var(--yellow)",
                          borderRadius: 4,
                          padding: "5px 8px",
                          fontSize: 10.5,
                          fontWeight: 700,
                          cursor: "pointer",
                          fontFamily: "var(--font-mono)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 5,
                        }}
                      >
                        <span>🔍</span>
                        <span>Run AI Risk Scan ➔</span>
                      </button>
                    </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Top Overlay Badge */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 12,
          zIndex: 500,
          background: "rgba(16, 21, 31, 0.9)",
          border: "1px solid var(--border)",
          borderRadius: 4,
          padding: "6px 12px",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span className="live-dot" />
        <span style={{ fontWeight: 700, color: "var(--text)" }}>ORBITAL PROJECTION</span>
        <span style={{ color: "var(--text-muted)" }}>
          {satCount} Satellites · {debrisCount} Debris
        </span>
      </div>

      {/* Map Legend */}
      <div
        style={{
          position: "absolute",
          bottom: 12,
          left: 12,
          zIndex: 500,
          background: "rgba(16, 21, 31, 0.94)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          padding: "8px 12px",
          fontSize: 10.5,
          fontFamily: "var(--font-mono)",
          color: "var(--text)",
          backdropFilter: "blur(6px)",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.4)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, borderBottom: "1px solid var(--border)", paddingBottom: 4 }}>
          <span style={{ fontWeight: 700, fontSize: 10, color: "var(--text-muted)" }}>SPACE OBJECTS</span>
          <span style={{ fontSize: 9.5, color: "var(--teal)" }}>LIVE TRACKING · Age: 2s</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 10.5 }}>
          <span>🛰 Satellite</span>
          <span style={{ color: "#a855f7" }}>○ Debris</span>
          <span style={{ color: "#f5c84c" }}>🟡 Warning</span>
          <span style={{ color: "#ff9f1c" }}>🟠 High Risk</span>
          <span style={{ color: "#e63946" }}>🔴 Critical</span>
        </div>
      </div>
    </div>
  );
}
