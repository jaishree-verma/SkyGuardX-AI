import { useEffect, useRef, useState } from "react";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws/events";

/**
 * Real-time WebSocket hook for Layer 1 Space Intelligence.
 * Subscribes to telemetry, space objects, risks, conjunctions, alerts, and canonical events.
 */
export function useNexusSocket() {
  const [connected, setConnected] = useState(false);
  const [lastEventTime, setLastEventTime] = useState(Date.now());
  const [state, setState] = useState({
    events: [],
    satellites: {},
    spaceObjects: [],
    risks: {},
    conjunction: null,
    conjunctions: {},
    alerts: [],
  });
  const wsRef = useRef(null);
  const attemptRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    function connect() {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) return;
        setConnected(true);
        attemptRef.current = 0;
      };

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          setLastEventTime(Date.now());

          setState((prev) => {
            switch (msg.channel) {
              case "telemetry": {
                const sat = msg.payload;
                return {
                  ...prev,
                  satellites: {
                    ...prev.satellites,
                    [sat.satellite_id]: sat,
                  },
                };
              }
              case "space_objects": {
                return {
                  ...prev,
                  spaceObjects: msg.payload,
                };
              }
              case "event": {
                return {
                  ...prev,
                  events: [msg.payload, ...prev.events].slice(0, 100),
                };
              }
              case "risk": {
                const r = msg.payload;
                return {
                  ...prev,
                  risks: {
                    ...prev.risks,
                    [r.entity_id]: r,
                  },
                };
              }
              case "conjunction": {
                const c = msg.payload;
                const pairKey = `${c.object_a}::${c.object_b}`;
                return {
                  ...prev,
                  conjunction: c,
                  conjunctions: {
                    ...prev.conjunctions,
                    [pairKey]: c,
                  },
                };
              }
              case "alert": {
                const alert = msg.payload;
                return {
                  ...prev,
                  alerts: [alert, ...prev.alerts.filter((a) => a.alert_id !== alert.alert_id)].slice(0, 20),
                };
              }
              default:
                return prev;
            }
          });
        } catch (e) {
          console.error("Failed to parse WS message:", e);
        }
      };

      ws.onclose = () => {
        if (cancelled) return;
        setConnected(false);
        const delay = Math.min(1000 * 2 ** attemptRef.current, 8000);
        attemptRef.current += 1;
        setTimeout(connect, delay);
      };

      ws.onerror = () => ws.close();
    }

    connect();
    return () => {
      cancelled = true;
      wsRef.current?.close();
    };
  }, []);

  return { connected, lastEventTime, ...state };
}
