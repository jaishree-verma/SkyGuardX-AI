import { useState, useEffect } from "react";
import { api } from "../api/client.js";

/**
 * Hook to poll live public satellites (ISS, Sentinel-2A, Landsat 9, Terra, Hubble)
 * from /api/satellites/live every 3.5 seconds.
 */
export function useLivePublicSatellites(pollingIntervalMs = 3500) {
  const [publicSatellites, setPublicSatellites] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchLive = async () => {
      try {
        const data = await api.liveSatellites();
        if (mounted && Array.isArray(data) && data.length > 0) {
          setPublicSatellites(data);
          setLastUpdated(Date.now());
          setIsLive(true);
        }
      } catch (err) {
        // If API fails temporarily, keep existing state
        console.warn("[useLivePublicSatellites] Poll error:", err);
      }
    };

    fetchLive();
    const interval = setInterval(fetchLive, pollingIntervalMs);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [pollingIntervalMs]);

  return { publicSatellites, lastUpdated, isLive };
}
