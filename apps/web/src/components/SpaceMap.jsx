import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import WeatherLayer from "./WeatherLayer.jsx";
import LiveEventPopups from "./LiveEventPopups.jsx";

function MapResizeHandler({ layoutKey }) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 60);
    const t2 = setTimeout(() => map.invalidateSize(), 250);
    const t3 = setTimeout(() => map.invalidateSize(), 600);

    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);

    const container = map.getContainer();
    let ro = null;
    if (window.ResizeObserver && container) {
      ro = new ResizeObserver(() => {
        map.invalidateSize();
      });
      ro.observe(container);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener("resize", onResize);
      if (ro) ro.disconnect();
    };
  }, [map, layoutKey]);

  return null;
}

function MapCameraFocus({ selectedSatId, satellites, publicSatellites, spaceObjects }) {
  const map = useMap();
  const lastFocusedId = useRef(null);

  useEffect(() => {
    if (!selectedSatId) return;
    if (lastFocusedId.current === selectedSatId) return;

    let targetLat = null;
    let targetLng = null;

    // 1. Check public satellites first
    if (publicSatellites && publicSatellites.length > 0) {
      const pub = publicSatellites.find(
        (s) =>
          s.satellite_id === selectedSatId ||
          String(s.norad_id) === String(selectedSatId) ||
          (s.name && s.name.toUpperCase() === String(selectedSatId).toUpperCase())
      );
      if (pub && typeof pub.latitude === "number" && typeof pub.longitude === "number") {
        targetLat = pub.latitude;
        targetLng = pub.longitude;
      }
    }

    // 2. Check constellation satellites
    if (targetLat === null && satellites) {
      const sat =
        satellites[selectedSatId] ||
        Object.values(satellites).find(
          (s) =>
            s.satellite_id === selectedSatId ||
            (s.satellite_name && s.satellite_name.toUpperCase() === String(selectedSatId).toUpperCase())
        );
      if (sat && typeof sat.latitude === "number" && typeof sat.longitude === "number") {
        targetLat = sat.latitude;
        targetLng = sat.longitude;
      }
    }

    // 3. Check space objects
    if (targetLat === null && spaceObjects && spaceObjects.length > 0) {
      const obj = spaceObjects.find(
        (o) =>
          (o.satellite_id || o.object_id) === selectedSatId ||
          (o.name && o.name.toUpperCase() === String(selectedSatId).toUpperCase())
      );
      if (obj && typeof obj.latitude === "number" && typeof obj.longitude === "number") {
        targetLat = obj.latitude;
        targetLng = obj.longitude;
      }
    }

    if (targetLat !== null && targetLng !== null) {
      lastFocusedId.current = selectedSatId;
      map.flyTo([targetLat, targetLng], Math.max(map.getZoom(), 4), {
        animate: true,
        duration: 1.5,
      });
    }
  }, [selectedSatId, satellites, publicSatellites, spaceObjects, map]);

  return null;
}

const STATUS_COLORS = {
  NORMAL: "#f5c84c",
  LOW: "#ffd166",
  WARNING: "#ffb703",
  MEDIUM: "#ff9f1c",
  HIGH_RISK: "#e63946",
  HIGH: "#e63946",
  CRITICAL: "#ff3344",
  STALE: "#64748b",
};

const BASEMAP_TILES = {
  satellite: {
    label: "🛰️ Real Earth",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri, Maxar, Earthstar Geographics",
    maxZoom: 18,
  },
  dark: {
    label: "🌑 Tactical Dark",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
    maxZoom: 16,
  },
  streets: {
    label: "🗺️ Topo Map",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 18,
  },
};

export default function SpaceMap({
  satellites = {},
  spaceObjects = [],
  publicSatellites = [],
  selectedSatId,
  onSelectSatellite,
  onInspectSatellite,
  conjunction,
  events = [],
  layoutKey = "default",
}) {
  const [basemap, setBasemap] = useState("satellite"); // default to Real Earth photorealistic satellite view
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
    <div style={{ height: "100%", width: "100%", position: "relative", background: "#030712", overflow: "hidden" }}>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        maxZoom={12}
        maxBounds={[
          [-85, -180],
          [85, 180],
        ]}
        maxBoundsViscosity={1.0}
        worldCopyJump={false}
        style={{ height: "100%", width: "100%", background: "#030712" }}
        zoomControl={false}
      >
        {/* Automatic Map Resize Invalidation */}
        <MapResizeHandler layoutKey={layoutKey} />

        {/* Automatic Map Camera Fly-To Centering on Target Satellite */}
        <MapCameraFocus
          selectedSatId={selectedSatId}
          satellites={satellites}
          publicSatellites={publicSatellites}
          spaceObjects={spaceObjects}
        />

        <TileLayer
          key={basemap}
          attribution={BASEMAP_TILES[basemap].attribution}
          url={BASEMAP_TILES[basemap].url}
          maxZoom={BASEMAP_TILES[basemap].maxZoom}
        />

        {/* Live Weather Radar & Satellite Cloud Overlay */}
        <WeatherLayer defaultMode="radar" />

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

        {/* Real-Time Public Satellites (ISS, Sentinel-2A, Landsat 9, Terra, Hubble) */}
        {publicSatellites.map((sat) => {
          const id = sat.satellite_id || `SAT-${sat.norad_id}`;
          const isSelected = selectedSatId === id || selectedSatId === String(sat.norad_id) || selectedSatId === sat.name;
          const markerColor = sat.color || "#38bdf8";

          return (
            <CircleMarker
              key={`pub-${sat.norad_id}`}
              center={[sat.latitude, sat.longitude]}
              radius={isSelected ? 11 : 8}
              pathOptions={{
                color: isSelected ? "#ffffff" : markerColor,
                fillColor: markerColor,
                fillOpacity: isSelected ? 1.0 : 0.9,
                weight: isSelected ? 3.5 : 2,
              }}
              eventHandlers={{
                click: () => {
                  if (onSelectSatellite) onSelectSatellite(id);
                },
              }}
            >
              <Tooltip direction="top" offset={[0, -6]} opacity={0.92}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: markerColor }}>
                  {sat.name}
                </span>
              </Tooltip>

              <Popup>
                <div style={{ fontFamily: "var(--font-ui)", color: "#dce4f0", minWidth: 210 }}>
                  <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>🛰️ {sat.name}</span>
                    <span style={{ color: "#2ec4b6", fontSize: 9.5, background: "rgba(46,196,182,0.15)", padding: "2px 6px", borderRadius: 3, fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                      LIVE CELESTRAK
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6, fontFamily: "var(--font-mono)" }}>
                    <div>Satellite Name: <strong style={{ color: "var(--text)" }}>{sat.name}</strong></div>
                    <div>NORAD ID: <strong style={{ color: "var(--yellow)" }}>{sat.norad_id}</strong></div>
                    <div>Live Lat/Lng: <strong style={{ color: "var(--text)" }}>{sat.latitude?.toFixed(4)}°, {sat.longitude?.toFixed(4)}°</strong></div>
                    <div>Altitude: <strong style={{ color: "#38bdf8" }}>{sat.altitude_km} km</strong></div>
                    <div>Velocity: <strong style={{ color: "var(--teal)" }}>{sat.velocity_kms} km/s</strong></div>
                    <div>Category: {sat.category?.replace(/_/g, " ")}</div>
                  </div>
                  <div style={{ marginTop: 8, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.12)" }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onInspectSatellite) onInspectSatellite(id);
                        else if (onSelectSatellite) onSelectSatellite(id);
                      }}
                      style={{
                        width: "100%",
                        background: "rgba(56, 189, 248, 0.15)",
                        border: "1px solid #38bdf8",
                        color: "#38bdf8",
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
                      <span>Select in Space Intelligence ➔</span>
                    </button>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Top Overlay Badge & Basemap Switcher */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 12,
          zIndex: 500,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            background: "rgba(12, 17, 26, 0.94)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "6px 12px",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          }}
        >
          <span className="live-dot" />
          <span style={{ fontWeight: 800, color: "var(--text)" }}>ORBITAL PROJECTION</span>
          <span style={{ color: "var(--text-muted)" }}>
            {satCount + publicSatellites.length} Satellites ({publicSatellites.length > 0 ? `${publicSatellites.length} Public Live` : ""}) · {debrisCount} Debris
          </span>
        </div>

        {/* Real Earth / Dark / Topo Basemap Switcher */}
        <div
          style={{
            background: "rgba(12, 17, 26, 0.94)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "3px 4px",
            display: "flex",
            gap: 3,
            backdropFilter: "blur(6px)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          }}
        >
          {Object.entries(BASEMAP_TILES).map(([key, config]) => (
            <button
              key={key}
              type="button"
              onClick={() => setBasemap(key)}
              style={{
                background: basemap === key ? "var(--teal)" : "transparent",
                color: basemap === key ? "#0a0e14" : "var(--text-muted)",
                border: "none",
                borderRadius: 4,
                padding: "3px 8px",
                fontSize: 10.5,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "var(--font-mono)",
                transition: "all 0.15s ease",
              }}
            >
              {config.label}
            </button>
          ))}
        </div>
      </div>

      {/* Left Side: Live Space Events Pop-Up Feed */}
      <LiveEventPopups
        events={events}
        onSelectSatellite={onSelectSatellite}
        onInspectSatellite={onInspectSatellite}
      />

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
          <span>🛰 Fleet</span>
          <span style={{ color: "#38bdf8", fontWeight: 700 }}>● Live Public (5)</span>
          <span style={{ color: "#a855f7" }}>○ Debris</span>
          <span style={{ color: "#f5c84c" }}>🟡 Warning</span>
          <span style={{ color: "#e63946" }}>🔴 Critical</span>
        </div>
      </div>
    </div>
  );
}
