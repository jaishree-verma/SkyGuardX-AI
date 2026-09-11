import { useEffect, useRef, useState } from "react";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws/events";

/**
 * Connects to SkyGuard-X's real-time channel and keeps rolling buffers per
 * message channel (event / risk / impact / cascade / scenario_results /
 * recommendation / recommendation_decided / conjunction). Auto-reconnects
 * with backoff so a dropped connection (backend restart, network blip)
 * doesn't leave the dashboard silently stale.
 */
export function useNexusSocket() {
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState({
    events: [],
    risks: {},
    impact: null,
    cascade: null,
    scenarioResults: null,
    recommendations: [],
    conjunction: null,
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
        const msg = JSON.parse(evt.data);
        setState((prev) => {
          switch (msg.channel) {
            case "event":
              return { ...prev, events: [msg.payload, ...prev.events].slice(0, 100) };
            case "risk":
              return {
                ...prev,
                risks: { ...prev.risks, [msg.payload.entity_id]: msg.payload },
              };
            case "impact":
              return { ...prev, impact: msg.payload };
            case "cascade":
              return { ...prev, cascade: msg.payload };
            case "scenario_results":
              return { ...prev, scenarioResults: msg.payload };
            case "conjunction":
              return { ...prev, conjunction: msg.payload };
            case "recommendation":
              return { ...prev, recommendations: [msg.payload, ...prev.recommendations].slice(0, 20) };
            case "recommendation_decided":
              return {
                ...prev,
                recommendations: prev.recommendations.map((r) =>
                  r.recommendation_id === msg.payload.recommendation_id ? msg.payload : r
                ),
              };
            default:
              return prev;
          }
        });
      };

      ws.onclose = () => {
        if (cancelled) return;
        setConnected(false);
        const delay = Math.min(1000 * 2 ** attemptRef.current, 10000);
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

  return { connected, ...state };
}
