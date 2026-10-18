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
  liveSatellites: () => request("/api/satellites/live"),
  startDemo: () => request("/api/v1/demo/start", { method: "POST" }),
  resetDemo: () => request("/api/v1/demo/reset", { method: "POST" }),
  hazards: () => request("/api/v1/hazards"),
  impacts: (hazardId) => request(`/api/v1/impacts/${hazardId}`),
  dataSources: () => request("/api/v1/data-sources"),
  createScenario: (data) => request("/api/v1/scenarios", { method: "POST", body: JSON.stringify(data) }),
  runScenario: (scenarioId, data) => request(`/api/v1/scenarios/${scenarioId}/run`, { method: "POST", body: JSON.stringify(data) }),
  scenarioResults: (scenarioId) => request(`/api/v1/scenarios/${scenarioId}/results`),
  generateRecommendation: () => request("/api/v1/recommendations/generate", { method: "POST" }),
  recommendations: () => request("/api/v1/recommendations"),
  approveRecommendation: (recId, approver, decision, notes = null) =>
    request(`/api/v1/recommendations/${recId}/approve`, {
      method: "POST",
      body: JSON.stringify({ approver, decision, notes }),
    }),
  audit: (recId) => request(`/api/v1/audit/${recId}`),
  auditList: (limit = 50) => request(`/api/v1/audit?limit=${limit}`),
  convergenceStatus: () => request("/api/v1/convergence/status"),
  convergenceAlerts: (limit = 20) => request(`/api/v1/convergence/alerts?limit=${limit}`),
  dismissConvergenceAlert: (convId, approver, decision, notes = null) =>
    request(`/api/v1/convergence/alerts/${convId}/dismiss`, {
      method: "POST",
      body: JSON.stringify({ approver, decision, notes }),
    }),
};

export { BASE_URL };
