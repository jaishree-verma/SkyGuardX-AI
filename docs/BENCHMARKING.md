# Benchmarking — get real numbers before you present them

The spec is explicit: the reference IBM Z document's sub-2ms figures are from
a *different* financial-transaction system and must never be presented as
measured SkyGuard-X performance. Below is how to measure your own, honestly.

## Targets to benchmark (spec §8.5)

| Metric | Target | How to measure in this codebase |
|---|---|---|
| Event acknowledgement | < 500ms p95 | Time `POST /api/v1/events` request round-trip, or instrument `EventGateway.ingest()` entry/exit |
| Simple ML inference | < 1s p95 | `services/space_risk/anomaly.py::score_telemetry()` is already called from `main.py::process_event()`, which logs `%.1fms` per event — grep the logs |
| Dashboard update | < 2s p95 | Timestamp a WebSocket message client-side (`useWebSocket.js`) vs. the event's `ingest_time` |
| Small what-if scenario | < 5s | Time `POST /api/v1/scenarios/{id}/run` |
| Recommendation + explanation | < 8s | Time `POST /api/v1/recommendations/generate` (includes the LLM call if `ANTHROPIC_API_KEY` is set — this is usually the dominant term) |

## Quick script

```bash
# with the stack running (docker compose up)
for i in $(seq 1 20); do
  /usr/bin/time -f "%e s" curl -s -o /dev/null -X POST \
    http://localhost:8000/api/v1/recommendations/generate
done
```

Record p50/p95 across at least 20 runs, on the machine/network you'll demo
on, not a laptop under different load. Put the *actual* numbers (with
machine spec and date) in your slide, not the target table above.

## Labeling rule for the demo

Every latency number in a slide or the UI should say one of: **measured**
(you ran the benchmark above), **target** (spec goal, not yet measured), or
**simulated** (e.g. the IBM Z boundary latency in `infra_ibm_z_adapter.py`
until a real endpoint is wired in). Mixing these silently is the single
fastest way to lose credibility with a technical judging panel.
