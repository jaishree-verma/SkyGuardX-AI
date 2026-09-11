# SkyGuard-X — Architecture

## Component diagram

```
 DATA SOURCES (real TLE sample / real LA geometry / simulator)
        |
        v
 EVENT GATEWAY  (services/ingestion/gateway.py)
   - validate (Pydantic schema) - dedupe (event_id) - normalize (event-time,
     staleness, out-of-order flag)
        |
        v
 EVENT BUS  (core/eventbus.py — in-proc pub/sub today, aiokafka-ready)
        |
   -----+------------------------------------------
   |                        |
   v                        v
 SPACE INTELLIGENCE     EARTH INTELLIGENCE
 - anomaly.py            - hazard.py (real LA geometry,
   (IsolationForest)        shapely)
 - conjunction.py
   (real SGP4 propagation,
   TCA/miss-distance)
   |                        |
   +-----------+------------+
               v
        IMPACT ENGINE (impact_engine/impact.py)
        - shapely spatial join vs real roads/facilities/population
               v
        CASCADE ENGINE (cascade_engine/cascade.py)
        - networkx dependency graph, event -> impact propagation
               v
        WHAT-IF ENGINE (scenario_engine/whatif.py)
        - immutable baseline, in-memory scenario diffing
               v
        DECISION ENGINE (decision_engine/decision.py)
        - deterministic weighted score + hard safety constraints
               v
        EXPLANATION SERVICE (explanation_service/explain.py)
        - grounded LLM call on structured evidence only, template fallback
               v
        COMMAND CENTER (apps/web) via WebSocket (core/websocket_manager.py)
        - map / event stream / risk cards / cascade bars / decision panel
               v
        HUMAN APPROVAL  ->  AUDIT (db/models.py: AuditRecord, append-only)
```

Every arrow above is a real function call in this codebase — not a slide
diagram with no code behind it.

## IBM Z transactional boundary

`apps/api/infra_ibm_z_adapter.py` sits directly in front of every scoring
call (`transactional_score(...)` wraps `space_anomaly.score_telemetry` in
`main.py`). See `infra/ibm_z/README_IBM_Z_INTEGRATION.md` for exactly what's
real vs. simulated and how to plug in a live endpoint.

## Data contracts

- **Canonical event**: `apps/api/core/events.py::CanonicalEvent`, validated
  against `data/schemas/event_schema.json` at the gateway.
- **RiskObject**: output of both Space and Earth risk services — same shape
  regardless of domain, so Impact/Cascade/Decision/Explanation never branch
  on "is this a satellite or a wildfire."
- **ImpactObject**: output of the Impact Engine.
- **ScenarioResult**: output of the What-If Engine, one per candidate action,
  consumed directly by the Decision Engine's scoring formula.

## Event-time discipline (spec §6.6)

The gateway distinguishes `event_time` (when the source says it happened),
`ingest_time` (when SkyGuard-X received it), and implicitly `processing_time`
(when a risk/impact/decision result is computed — each Risk/Impact object
carries its own `computed_at`). Out-of-order events are logged and flagged in
`payload["_gateway_meta"]` rather than silently overwriting newer state.

## Real-time transport

WebSocket (`/ws/events`) is the primary channel; an SSE endpoint
(`/stream/events`) is provided as a fallback for networks that block WS
upgrades. Both replay the same `ConnectionManager` ring buffer so a
newly-opened dashboard isn't blank.

## Why services are separate Python packages, not separate deployables (yet)

The spec's target repo layout (`services/space-risk/`, `services/earth-risk/`,
etc., each with its own deployment) is preserved as the **module boundary**
inside one FastAPI process for this vertical slice — vertical-slice-first,
per the spec's own MVP guidance (§4, "MVP BOUNDARY: a complete working chain
beats a dashboard containing many unfinished features"). Each service module
has no import dependency on FastAPI itself, so splitting any one of them into
its own container + REST/event interface later is a deployment change, not a
rewrite.
