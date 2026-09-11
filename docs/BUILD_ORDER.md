# Build Order (spec §7.2, mapped to what's already done in this zip)

| # | Step | Status in this zip |
|---|---|---|
| 1 | Monorepo + shared config | Done — `apps/`, `core/config.py` |
| 2 | Canonical event schema + tests | Done — `core/events.py`, `data/schemas/event_schema.json`, `tests/test_pipeline.py` |
| 3 | Simulator (telemetry + hazard) | Done — `simulator/event_simulator.py` |
| 4 | Event gateway + persistence | Done — `services/ingestion/gateway.py`, `db/` |
| 5 | Baseline telemetry anomaly detector | Done — `services/space_risk/anomaly.py` (IsolationForest) |
| 6 | Conjunction calculation | Done — `services/space_risk/conjunction.py` (real SGP4) |
| 7 | Earth hazard workflow (wildfire) | Done — `services/earth_risk/hazard.py` |
| 8 | Geospatial impact (population/roads) | Done — `services/impact_engine/impact.py` |
| 9 | Cascade graph + impact score | Done — `services/cascade_engine/cascade.py` |
| 10 | Scenario engine, 2+ candidate actions | Done — `services/scenario_engine/whatif.py` (3 actions) |
| 11 | Decision engine + hard safety constraints | Done — `services/decision_engine/decision.py` |
| 12 | Grounded explanation service | Done — `services/explanation_service/explain.py` |
| 13 | Command-center UI on real APIs | Done — `apps/web/` (WebSocket-driven, no mock data in the UI layer) |
| 14 | IBM Z integration/boundary + latency | Simulated boundary in place (`infra_ibm_z_adapter.py`), real endpoint is a documented integration point — see `infra/ibm_z/README_IBM_Z_INTEGRATION.md` |
| 15 | AuthN/authZ, audit logging, failure handling | Audit logging done (`db/models.py::AuditRecord`); OIDC/OAuth2/RBAC is the next increment — see "What's not built yet" below |
| 16 | Full end-to-end demo + benchmark | Runnable via `docker compose up`; see `docs/BENCHMARKING.md` for how to measure and record real numbers |

## What's not built yet (be upfront about this with judges)

- **AuthN/AuthZ (OIDC/OAuth2 + RBAC)**: the API has no auth middleware yet.
  Every `/api/v1/*` route is open. Add before any non-demo use.
- **Real IBM Z endpoint**: architecturally wired (see step 14), not
  network-connected in this build.
- **Kafka / IBM Event Streams**: `core/eventbus.py` ships a Kafka-API-shaped
  in-process bus; the `aiokafka` adapter stub is present but not started.
- **Flood hazard type**: only wildfire is implemented for the MVP, per the
  spec's own "choose one hazard" guidance. Flood cascade rules already exist
  in `cascade_engine/cascade.py::build_flood_cascade_graph()` as a starting
  point for Phase 2.
- **Model monitoring / drift / MLflow**: Phase 2 item per the spec's roadmap.

## Running the tests

```bash
cd apps/api
pip install -r requirements.txt
pytest -q
```
