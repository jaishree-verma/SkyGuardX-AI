import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup, useMap } from "react-leaflet";
import { api } from "../api/client.js";
import WeatherLayer from "./WeatherLayer.jsx";

const LA_CENTER = [34.055, -118.555];

function MapResizeHandler() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const t = setTimeout(() => map.invalidateSize(), 150);
    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
    };
  }, [map]);
  return null;
}

export default function MapView({ impact }) {
  const [hazard, setHazard] = useState(null);

  useEffect(() => {
    let mounted = true;
    const poll = async () => {
      try {
        const h = await api.hazards();
        if (mounted && h && h.hazard_id) setHazard(h);
      } catch {
        /* hazard not computed yet — fine, keep waiting */
      }
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const exposedIds = new Set((impact?.affected_facilities || []).map((f) => f.asset_id));

  return (
    <div style={{ height: "100%", width: "100%", minHeight: "80vh", position: "relative" }}>
      <MapContainer
        center={LA_CENTER}
        zoom={12}
        style={{ height: "100%", width: "100%", background: "#0a0e14" }}
        zoomControl={false}
      >
        <MapResizeHandler />
        <TileLayer
          attribution='&copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          maxZoom={16}
        />
        <WeatherLayer defaultMode="radar" />
        {hazard?.geometry && (
          <GeoJSON
            data={hazard.geometry}
            style={{ color: "#ff9f1c", weight: 2, fillColor: "#ff9f1c", fillOpacity: 0.18 }}
          />
        )}
        <CircleMarker
          center={[34.0195, -118.4912]}
          radius={exposedIds.has("F-HOSP-1") ? 9 : 6}
          pathOptions={{ color: exposedIds.has("F-HOSP-1") ? "#ff9f1c" : "#2ec4b6", fillOpacity: 0.9 }}
        >
          <Popup>UCLA Med Ctr, Santa Monica — reference point</Popup>
        </CircleMarker>
        <CircleMarker
          center={[34.043, -118.5245]}
          radius={exposedIds.has("F-FIRE-69") ? 9 : 6}
          pathOptions={{ color: exposedIds.has("F-FIRE-69") ? "#ff9f1c" : "#2ec4b6", fillOpacity: 0.9 }}
        >
          <Popup>LAFD Station 69, Pacific Palisades — reference point</Popup>
        </CircleMarker>
      </MapContainer>
      <div
        style={{
          position: "absolute", top: 12, left: 12, zIndex: 500,
          background: "rgba(16,21,31,0.9)", border: "1px solid var(--border)",
          borderRadius: 4, padding: "6px 10px", fontFamily: "var(--font-mono)", fontSize: 11,
          color: "var(--text-muted)",
        }}
      >
        {hazard ? (
          <span>
            HAZARD-77 · wildfire · severity {hazard.severity} ·{" "}
            <span style={{ color: "var(--amber)" }}>simulated event, real LA-area geometry</span>
          </span>
        ) : (
          "waiting for hazard event…"
        )}
      </div>
    </div>
  );
}
