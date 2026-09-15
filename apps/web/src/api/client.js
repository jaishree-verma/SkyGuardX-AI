const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${detail}`);
  }
  return res.json();
}

export const api = {
  health: () => request("/api/v1/health"),
  events: (since) => request(`/api/v1/events${since ? `?since=${since}` : ""}`),
  satellites: () => request("/api/v1/satellites"),
  satellite: (id) => request(`/api/v1/satellites/${id}`),
  satellitePosition: (id) => request(`/api/v1/satellites/${id}/position`),
  satelliteTelemetry: (id) => request(`/api/v1/satellites/${id}/telemetry`),
  satelliteHealth: (id) => request(`/api/v1/satellites/${id}/health`),
  spaceObjects: () => request("/api/v1/space-objects"),
  conjunctions: () => request("/api/v1/conjunctions"),
  risks: () => request("/api/v1/risks"),
  alerts: () => request("/api/v1/alerts"),
  modelEvaluation: () => request("/api/v1/model-evaluation"),
  startDemo: () => request("/api/v1/demo/start", { method: "POST" }),
  resetDemo: () => request("/api/v1/demo/reset", { method: "POST" }),
};

export { BASE_URL };
