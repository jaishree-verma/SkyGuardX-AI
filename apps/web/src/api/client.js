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
  hazards: () => request("/api/v1/hazards"),
  impacts: (hazardId) => request(`/api/v1/impacts/${hazardId}`),
  conjunctions: () => request("/api/v1/conjunctions"),
  generateRecommendation: () =>
    request("/api/v1/recommendations/generate", { method: "POST" }),
  approveRecommendation: (recId, approver, decision, notes) =>
    request(`/api/v1/recommendations/${recId}/approve`, {
      method: "POST",
      body: JSON.stringify({ approver, decision, notes }),
    }),
  runScenario: (scenarioId, body) =>
    request(`/api/v1/scenarios/${scenarioId}/run`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

export { BASE_URL };
