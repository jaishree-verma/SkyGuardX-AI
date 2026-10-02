import React, { useEffect, useState, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

/**
 * RainViewer Weather Radar & Satellite Cloud Overlay for Leaflet
 */
export default function WeatherLayer({ defaultMode = "radar" }) {
  const map = useMap();
  const [mode, setMode] = useState(defaultMode); // "radar" | "satellite" | "off"
  const [apiData, setApiData] = useState(null);
  const [frames, setFrames] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [colorScheme, setColorScheme] = useState(2); // 2: Universal Blue, 6: NEXRAD
  const [opacity, setOpacity] = useState(0.75);

  const layersRef = useRef([]);
  const timerRef = useRef(null);

  // Clear existing tile layers from Leaflet map
  const clearLayers = () => {
    layersRef.current.forEach((layer) => {
      try {
        if (map && map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      } catch {
        /* layer might have already been removed */
      }
    });
    layersRef.current = [];
  };

  // 1. Fetch RainViewer public metadata on mount
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    fetch("https://api.rainviewer.com/public/weather-maps.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!mounted) return;
        setApiData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.warn("[WeatherLayer] RainViewer metadata fetch failed:", err);
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // 2. Build and mount TileLayers when mode, colorScheme, apiData, or map changes
  useEffect(() => {
    clearLayers();
    if (mode === "off" || !apiData || !map) {
      setFrames([]);
      return;
    }

    if (mode === "satellite") {
      // Real global satellite cloud coverage from NASA GIBS
      const d = new Date(Date.now() - 86400000); // Yesterday's global mosaic
      const yesterdayStr = d.toISOString().split("T")[0];
      
      const nasaCloudUrl = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_Cloud_Fraction_Day/default/${yesterdayStr}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`;

      const layer = L.tileLayer(nasaCloudUrl, {
        tileSize: 256,
        opacity: opacity,
        zIndex: 220,
        maxZoom: 9,
        attribution: '&copy; <a href="https://earthdata.nasa.gov" target="_blank">NASA EOSDIS GIBS</a>',
      });

      layer.addTo(map);
      layersRef.current = [layer];
      setFrames([
        {
          time: Math.floor(d.getTime() / 1000),
          path: "NASA_GIBS_MODIS_CLOUDS",
          label: "NASA MODIS GLOBAL CLOUDS",
        },
      ]);
      setCurrentIndex(0);

      return () => {
        clearLayers();
      };
    }

    // mode === "radar"
    const past = apiData.radar?.past || [];
    const nowcast = apiData.radar?.nowcast || [];
    const selectedFrames = [...past, ...nowcast];

    if (selectedFrames.length === 0) {
      setFrames([]);
      return;
    }

    setFrames(selectedFrames);
    const initialIndex = selectedFrames.length - 1;
    setCurrentIndex(initialIndex);

    const tileSize = window.devicePixelRatio >= 2 ? 512 : 256;

    // Create TileLayer for each radar frame
    const newLayers = selectedFrames.map((frame, idx) => {
      const isVisible = idx === initialIndex;
      const tileUrl = `${apiData.host}${frame.path}/${tileSize}/{z}/{x}/{y}/${colorScheme}/1_1.png`;

      const layer = L.tileLayer(tileUrl, {
        tileSize: 256,
        opacity: isVisible ? opacity : 0,
        zIndex: 220,
      });

      layer.addTo(map);
      return layer;
    });

    layersRef.current = newLayers;

    return () => {
      clearLayers();
    };
  }, [mode, colorScheme, apiData, map]);

  // 3. Update opacity across active layer
  useEffect(() => {
    if (layersRef.current[currentIndex]) {
      layersRef.current[currentIndex].setOpacity(opacity);
    }
  }, [opacity]);

  // 4. Switch frame helper
  const goToFrame = (targetIndex) => {
    if (layersRef.current.length === 0) return;
    const bounded = (targetIndex + layersRef.current.length) % layersRef.current.length;

    if (layersRef.current[currentIndex]) {
      layersRef.current[currentIndex].setOpacity(0);
    }
    if (layersRef.current[bounded]) {
      layersRef.current[bounded].setOpacity(opacity);
    }

    setCurrentIndex(bounded);
  };

  // 5. Animation loop
  useEffect(() => {
    if (!isPlaying || mode === "off" || frames.length <= 1) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % layersRef.current.length;
        if (layersRef.current[prev]) layersRef.current[prev].setOpacity(0);
        if (layersRef.current[next]) layersRef.current[next].setOpacity(opacity);
        return next;
      });
    }, 650);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, mode, frames.length, opacity]);

  const currentFrame = frames[currentIndex];
  const isNowcast = mode === "radar" && currentIndex >= (frames.length - (apiData?.radar?.nowcast?.length || 0));

  // Disable Leaflet map dragging when hovering over controls so clicking/dragging inside doesn't move map
  const handleMouseEnter = () => {
    if (map) {
      map.dragging.disable();
      map.scrollWheelZoom?.disable();
    }
  };

  const handleMouseLeave = () => {
    if (map) {
      map.dragging.enable();
      map.scrollWheelZoom?.enable();
    }
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: "absolute",
        top: 10,
        right: 12,
        zIndex: 1000,
        background: "rgba(16, 21, 31, 0.95)",
        border: "1px solid var(--border)",
        borderRadius: 6,
        padding: "8px 12px",
        fontFamily: "var(--font-mono, monospace)",
        fontSize: 11,
        backdropFilter: "blur(6px)",
        boxShadow: "0 4px 18px rgba(0, 0, 0, 0.5)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minWidth: 265,
        pointerEvents: "auto",
        userSelect: "none",
      }}
    >
      {/* Top Header / Mode Switcher */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13 }}>{mode === "radar" ? "🌧️" : mode === "satellite" ? "🛰️" : "☁️"}</span>
          <span style={{ fontWeight: 700, color: "var(--text)", letterSpacing: "0.5px" }}>
            WEATHER OVERLAY
          </span>
        </div>

        {/* Mode Toggle Buttons */}
        <div style={{ display: "flex", gap: 2, background: "rgba(255,255,255,0.06)", borderRadius: 4, padding: 2 }}>
          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setMode("radar");
            }}
            style={{
              background: mode === "radar" ? "var(--teal)" : "transparent",
              color: mode === "radar" ? "#0a0e14" : "var(--text-muted)",
              border: "none",
              borderRadius: 3,
              padding: "3px 8px",
              fontSize: 10,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "var(--font-mono, monospace)",
            }}
            title="Precipitation Doppler Radar"
          >
            Radar
          </button>
          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setMode("satellite");
            }}
            style={{
              background: mode === "satellite" ? "var(--teal)" : "transparent",
              color: mode === "satellite" ? "#0a0e14" : "var(--text-muted)",
              border: "none",
              borderRadius: 3,
              padding: "3px 8px",
              fontSize: 10,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "var(--font-mono, monospace)",
            }}
            title="Global Satellite Infrared Clouds"
          >
            Clouds
          </button>
          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setMode("off");
            }}
            style={{
              background: mode === "off" ? "rgba(255,255,255,0.15)" : "transparent",
              color: mode === "off" ? "#fff" : "var(--text-muted)",
              border: "none",
              borderRadius: 3,
              padding: "3px 8px",
              fontSize: 10,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--font-mono, monospace)",
            }}
            title="Turn weather overlay off"
          >
            Off
          </button>
        </div>
      </div>

      {/* Controls & Timestamp when Active */}
      {mode !== "off" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, borderTop: "1px solid var(--border)", paddingTop: 6 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* Playback Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  goToFrame(currentIndex - 1);
                }}
                disabled={frames.length <= 1}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                  borderRadius: 3,
                  width: 24,
                  height: 22,
                  cursor: frames.length > 1 ? "pointer" : "default",
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: frames.length <= 1 ? 0.4 : 1,
                }}
                title="Previous Frame"
              >
                ‹
              </button>

              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                disabled={frames.length <= 1}
                style={{
                  background: isPlaying ? "rgba(230, 57, 70, 0.2)" : "rgba(46, 196, 182, 0.2)",
                  border: `1px solid ${isPlaying ? "#e63946" : "var(--teal)"}`,
                  color: isPlaying ? "#ff6b6b" : "var(--teal)",
                  borderRadius: 3,
                  padding: "2px 8px",
                  height: 22,
                  cursor: frames.length > 1 ? "pointer" : "default",
                  fontWeight: 700,
                  fontSize: 10,
                  fontFamily: "var(--font-mono, monospace)",
                  opacity: frames.length <= 1 ? 0.4 : 1,
                }}
              >
                {isPlaying ? "❚❚ PAUSE" : "▶ PLAY"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  goToFrame(currentIndex + 1);
                }}
                disabled={frames.length <= 1}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                  borderRadius: 3,
                  width: 24,
                  height: 22,
                  cursor: frames.length > 1 ? "pointer" : "default",
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: frames.length <= 1 ? 0.4 : 1,
                }}
                title="Next Frame"
              >
                ›
              </button>
            </div>

            {/* Frame Timestamp */}
            <div style={{ textAlign: "right", fontSize: 10 }}>
              {isLoading ? (
                <span style={{ color: "var(--yellow)" }}>Loading radar…</span>
              ) : currentFrame ? (
                <>
                  <span
                    style={{
                      color: isNowcast ? "var(--yellow)" : "var(--teal)",
                      fontWeight: 700,
                      marginRight: 4,
                    }}
                  >
                    {mode === "satellite" ? "NASA EOSDIS" : isNowcast ? "PREDICTIVE" : "LIVE"}:
                  </span>
                  <span style={{ color: "var(--text)" }}>
                    {mode === "satellite"
                      ? "GLOBAL CLOUDS"
                      : new Date(currentFrame.time * 1000).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                  </span>
                </>
              ) : (
                <span style={{ color: "var(--text-muted)" }}>Standby</span>
              )}
            </div>
          </div>

          {/* Progress Timeline Scrubber */}
          {frames.length > 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="range"
                min={0}
                max={frames.length - 1}
                value={currentIndex}
                onChange={(e) => {
                  setIsPlaying(false);
                  goToFrame(Number(e.target.value));
                }}
                style={{
                  flex: 1,
                  accentColor: isNowcast ? "#f5c84c" : "#2ec4b6",
                  height: 4,
                  cursor: "pointer",
                }}
              />
              <span style={{ fontSize: 9.5, color: "var(--text-muted)", minWidth: 26, textAlign: "right" }}>
                {currentIndex + 1}/{frames.length}
              </span>
            </div>
          )}

          {/* Color Scheme and Opacity Options Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 9.5,
              color: "var(--text-muted)",
              marginTop: 2,
            }}
          >
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span>Palette:</span>
              <button
                type="button"
                onClick={() => setColorScheme(2)}
                style={{
                  background: colorScheme === 2 ? "rgba(46,196,182,0.2)" : "transparent",
                  color: colorScheme === 2 ? "var(--teal)" : "var(--text-muted)",
                  border: colorScheme === 2 ? "1px solid var(--teal)" : "1px solid transparent",
                  padding: "1px 5px",
                  borderRadius: 3,
                  cursor: "pointer",
                  fontSize: 9,
                  fontFamily: "var(--font-mono, monospace)",
                }}
              >
                Blue
              </button>
              <button
                type="button"
                onClick={() => setColorScheme(6)}
                style={{
                  background: colorScheme === 6 ? "rgba(46,196,182,0.2)" : "transparent",
                  color: colorScheme === 6 ? "var(--teal)" : "var(--text-muted)",
                  border: colorScheme === 6 ? "1px solid var(--teal)" : "1px solid transparent",
                  padding: "1px 5px",
                  borderRadius: 3,
                  cursor: "pointer",
                  fontSize: 9,
                  fontFamily: "var(--font-mono, monospace)",
                }}
              >
                NEXRAD
              </button>
            </div>

            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <span>Opacity:</span>
              <input
                type="range"
                min={0.2}
                max={1.0}
                step={0.05}
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                style={{ width: 44, accentColor: "var(--teal)", height: 3, cursor: "pointer" }}
                title={`Opacity: ${(opacity * 100).toFixed(0)}%`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
