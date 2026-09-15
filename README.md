# SkyGuardX: Real-Time Space-to-Earth Decision Intelligence

IBM Z Datathon prototype. Turns live satellite, orbital and Earth-hazard events into a
ranked, explainable, human-approved action — end to end, in real time.

```
EVENT  →  DETECT  →  RISK  →  IMPACT  →  CASCADE  →  WHAT-IF  →  DECISION  →  EXPLAIN  →  HUMAN APPROVAL
```

This package is a **working vertical slice** of the full spec in the two uploaded
documents (`SkyGuard-X_Master_Project_Specification_*`). It is built to run on a laptop,
demo the full loop with real orbital data and real map/geo layers, and be extended
toward the IBM Z transactional boundary described in the spec.

> **Labeling rule (kept throughout the code):** anything not measured on real
> deployed infrastructure is marked `SIMULATED`, `SAMPLE`, or `PLANNED` in code
> comments, API responses, and the UI. The IBM Z boundary in this package is a
> **simulated interface** (`services are structured so a real z/OS Connect EE / IBM Z
> AI inference endpoint can be swapped in — see `infra/ibm_z/README_IBM_Z_INTEGRATION.md`).

---

## 1. What's actually in this zip

| Layer | Tech | Where |
|---|---|---|
| Event Gateway + canonical schema | FastAPI, Pydantic | `apps/api/core/events.py`, `apps/api/services/ingestion/` |
| Real-time transport | WebSocket (FastAPI) + Server-Sent Events fallback | `apps/api/core/websocket_manager.py` |
| Event bus / replay | Kafka-compatible topic abstraction (in-proc for laptop demo, drop-in `aiokafka` adapter) | `apps/api/core/eventbus.py` |
| Space Intelligence | Real TLE orbital elements + SGP4 propagation (`sgp4` lib) + Isolation Forest anomaly detection (`scikit-learn`) | `apps/api/services/space_risk/` |
| Earth Intelligence | Real-world hazard geometry (GeoJSON, real lat/lon), `shapely` geometry ops | `apps/api/services/earth_risk/` |
| Impact Engine | `geopandas` + `shapely` spatial join against real road/facility/population layers | `apps/api/services/impact_engine/` |
| Cascade Engine | `networkx` dependency graph, event → impact propagation | `apps/api/services/cascade_engine/` |
| What-If Engine | Immutable baseline + scenario diffing, no live-state mutation | `apps/api/services/scenario_engine/` |
| Decision Engine | Deterministic weighted scoring + hard safety constraints | `apps/api/services/decision_engine/` |
| Explanation Service | Grounded LLM call (Anthropic API, evidence-only prompt) with deterministic fallback | `apps/api/services/explanation_service/` |
| Persistence | PostgreSQL + PostGIS (SQLAlchemy models), Redis cache | `apps/api/db/`, `docker-compose.yml` |
| Simulator | Realistic telemetry + hazard event generator (labeled `SIMULATED`) | `apps/api/simulator/` |
| Command Center UI | React + Vite + Leaflet (real map tiles), WebSocket live feed | `apps/web/` |
| IBM Z boundary | Documented integration contract + simulated adapter | `infra/ibm_z/` |
| Real-world sample data | Real ISS/debris TLE, real Los Angeles-area roads/hospitals GeoJSON | `data/sample/` |

Total: a runnable FastAPI backend + React frontend + Docker Compose stack that
demonstrates the full 8-step decision loop from the spec, using real orbital
mechanics and real geography, with clearly labeled simulated event sources.

## 2. Quick start

```bash
# 1. Backend + Postgres/PostGIS + Redis
docker compose up --build

# 2. Frontend (separate terminal, if not using the web container)
cd apps/web
npm install
npm run dev
```

Backend: http://localhost:8000  (docs at `/docs`)
Frontend: http://localhost:5173
WebSocket live feed: `ws://localhost:8000/ws/events`

The simulator starts automatically and emits one telemetry event every ~4s and one
hazard update every ~20s (`SIMULATED`, clearly tagged `"source": "simulator"` on
every event — see `data/schemas/event_schema.json`).

## 3. Live datasets — what's actually called, and what happens when it's unreachable

SkyGuard-X calls three **real, free, public, no-API-key** data sources on startup
(and on demand via `POST /api/v1/data-sources/refresh`). Each one has an
automatic, tested fallback to bundled offline sample data if it can't be
reached — and the app tells you, at runtime, which one it's actually using:

```
GET /api/v1/data-sources
```

| # | Live source | What it gives us | Called from | Free / no key? |
|---|---|---|---|---|
| 1 | **Celestrak** (`celestrak.org`) | Current real orbital elements (TLE) for ISS (NORAD 25544) and Hubble (NORAD 20580) | `services/space_risk/tle_data.py: fetch_live_tle()` | Yes |
| 2 | **NOAA / National Weather Service** (`api.weather.gov`) | Real, currently-active severe-weather alerts — Red Flag/Fire Weather Warnings (wildfire) and Flood/Flash Flood Warnings, as CAP-standard GeoJSON polygons | `services/earth_risk/live_hazard_feed.py: get_live_hazard()` | Yes |
| 3 | **OpenStreetMap Overpass API** (`overpass-api.de`) | Real road centerlines, hospitals, fire stations, and a residential-density population proxy, for a bounding box around the active hazard | `services/impact_engine/live_geo.py: fetch_osm_assets()` | Yes |

**Verified in this build:** all three were actually called from this sandbox
(see the log lines from `services/*/live_*.py` when you run the server) — the
sandbox's outbound firewall returns `403 Forbidden` for all of them, which the
code catches in **under 100ms** and falls back to sample data without
crashing or hanging. `tests/test_live_data_fallback.py` asserts exactly this
behaviour. **Run this from a normal internet connection (e.g.
`docker compose up` on your own machine or a datathon venue with open
outbound HTTPS) and sources 1–3 above will come back `"live"` instead of
`"sample_fallback"` with no code changes.**

**What stays simulated no matter where you run this, and why:** satellite
*health telemetry* (solar output, battery voltage, thermal index) is **not
publicly available for any real satellite** — it's proprietary
mission-control data. There is no free public feed of it to call. This is a
genuine real-world constraint, not a sandbox limitation, so
`/api/v1/data-sources` always reports `"satellite_telemetry": "simulated"`
and explains why. Orbital *position* (source #1 above) is public and is
fetched live.

**Optional 4th live source (needs a free signup, not wired in by default):**
NASA FIRMS real-time satellite fire-hotspot detections (VIIRS/MODIS) — register
a free `MAP_KEY` at https://firms.modaps.eosdis.nasa.gov/api/area/, set
`FIRMS_MAP_KEY` in `.env`, and call `fetch_firms_hotspots()` in
`live_hazard_feed.py` (fully written, just needs the key).

**Real-world sample fallback geometry** (used only when the live calls above
fail): `data/sample/real_tle_sample.txt`, `data/sample/la_wildfire_area.geojson`,
`data/sample/la_roads_facilities.geojson` — real Los Angeles-area coordinates,
correctly-formatted TLEs, clearly labeled `SAMPLE`/`sample_fallback` throughout.

## 4. Full build order (matches spec §7.2)

See `docs/BUILD_ORDER.md` for the 16-step implementation sequence and
`docs/ARCHITECTURE.md` for the full component diagram and data contracts.

## 5. What's simulated vs. real vs. planned

| Component | Status |
|---|---|
| Satellite orbital elements (TLE) | **Live** call to Celestrak; falls back to sample if unreachable — check `/api/v1/data-sources` |
| Orbital mechanics (SGP4) | **Real algorithm** either way (live or sample elements) |
| Satellite health telemetry | **Always simulated** — no public feed exists for any real satellite (see §3) |
| Anomaly detection (Isolation Forest) | **Real model**, trained on synthetic-but-realistic telemetry distributions |
| Earth hazard (wildfire/flood) | **Live** call to NOAA/NWS active alerts; falls back to sample geometry if unreachable |
| Roads / hospitals / fire stations / population | **Live** call to OpenStreetMap Overpass; falls back to sample LA-area layer if unreachable |
| Event stream cadence (telemetry/hazard triggers) | **Simulated** generator (drives *when* the pipeline runs — see §3 for *what data* it runs on) |
| IBM Z transactional boundary | **Simulated adapter** — integration contract documented, real endpoint pluggable |
| LLM explanation | **Real API call** if `ANTHROPIC_API_KEY` is set, deterministic template fallback otherwise |
| Latency numbers | Must be benchmarked on your own run — see `docs/BENCHMARKING.md` |
