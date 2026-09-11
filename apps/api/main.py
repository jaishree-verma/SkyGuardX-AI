"""
SkyGuard-X FastAPI entrypoint.

Wires the full 8-step decision loop (spec §4):
  event -> gateway -> risk (space/earth) -> impact -> cascade -> what-if ->
  decision -> explanation -> broadcast to Command Center -> human approval -> audit

Implements the REST API from spec §7.9 and a WebSocket channel for real-time
push to the dashboard (spec's "AI decision support" + "early-warning/alerting"
theme requirements).
"""
from __future__ import annotations

import asyncio
import json
import logging
import time
import uuid
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from core.config import get_settings
from core.events import CanonicalEvent, EventType, RiskObject
from core.eventbus import get_event_bus
from core.websocket_manager import manager
from db.database import init_db, SessionLocal
from db.models import Recommendation, AuditRecord
from services.ingestion.gateway import EventGateway, DuplicateEventError, TOPIC_RAW_EVENTS
from services.space_risk import anomaly as space_anomaly
from services.space_risk import conjunction as space_conjunction
from services.space_risk.tle_data import load_sample_tle, load_active_tle
from services.earth_risk import hazard as earth_hazard
from services.earth_risk import live_hazard_feed
from services.impact_engine import impact as impact_engine
from services.impact_engine import live_geo
from services.cascade_engine.cascade import build_wildfire_cascade_graph, propagate, cascade_summary
from services.scenario_engine import whatif
from services.decision_engine import decision as decision_engine
from services.explanation_service import explain as explanation_service
from simulator.event_simulator import run_simulator
from infra_ibm_z_adapter import transactional_score  # simulated IBM Z boundary adapter

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("SkyGuard-X.main")

settings = get_settings()
bus = get_event_bus()
gateway = EventGateway(bus)

# In-memory "latest state" caches (in production these are DB-backed reads;
# kept in-memory here for a fast, dependency-light demo).
LATEST_RISK: dict[str, RiskObject] = {}
LATEST_HAZARD_RECORD: dict | None = None
LATEST_IMPACT: dict | None = None
RECOMMENDATIONS: dict[str, dict] = {}

# Populated for real at startup (see on_startup). Seeded with the offline
# sample here only so unit tests / a cold import don't crash before startup runs.
TLE_OBJECTS = load_sample_tle()
LIVE_ASSETS: list[dict] | None = None  # None => impact engine falls back to bundled sample

# Transparency record: what's actually live right now vs. falling back to
# offline sample data. Surfaced via GET /api/v1/data-sources and logged at
# startup — this is the honest answer to "which datasets is this using".
DATA_SOURCES: dict[str, str] = {
    "satellite_orbital_elements": "not_loaded_yet",  # "live" (Celestrak) | "mixed" | "sample_fallback"
    "earth_hazard": "not_loaded_yet",  # "live" (NWS) | "sample_fallback"
    "roads_facilities_population": "not_loaded_yet",  # "live" (OpenStreetMap) | "sample_fallback"
    "satellite_telemetry": "simulated",  # always simulated — see note below
}
# NOTE on satellite_telemetry: there is no public, free, real-time feed of
# any real satellite's internal health telemetry (solar output, battery
# voltage, thermal state) — that data is proprietary to each mission's
# ground control. This is a genuine real-world constraint, not a sandbox
# limitation, so this channel is honestly labeled "simulated" regardless of
# where SkyGuard-X is deployed. Orbital *position* (TLE) is public and IS fetched
# live above.

app = FastAPI(
    title="SkyGuard-X API",
    description="Real-Time Space-to-Earth Decision Intelligence — event-to-decision loop API.",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Core decision-loop pipeline: this is the function that runs steps 2-8 of
# the spec's 8-step loop every time a canonical event arrives.
# ---------------------------------------------------------------------------
async def process_event(event: CanonicalEvent) -> None:
    t0 = time.perf_counter()
    await manager.broadcast("event", event.model_dump())

    if event.event_type in (EventType.TELEMETRY_ANOMALY, EventType.TELEMETRY_NOMINAL):
        # STEP 2-3: AI detection + risk prediction (with the simulated IBM Z
        # transactional boundary in front of the model call — see
        # infra_ibm_z_adapter.py / infra/ibm_z/README_IBM_Z_INTEGRATION.md).
        risk = await transactional_score(lambda: space_anomaly.score_telemetry(event))
        LATEST_RISK[event.entity_id] = risk
        await manager.broadcast("risk", risk.model_dump())

        if risk.status in ("MEDIUM", "HIGH"):
            await _run_conjunction_check(event.entity_id, risk)

    elif event.event_type == EventType.EARTH_HAZARD_WILDFIRE:
        await _run_earth_hazard_pipeline(event)

    logger.info("processed event %s (%s) in %.1fms", event.event_id, event.event_type, (time.perf_counter() - t0) * 1000)


async def _run_conjunction_check(entity_id: str, health_risk: RiskObject) -> None:
    """STEP 3 continued: space collision risk, run opportunistically whenever
    a satellite shows elevated health risk (a degraded satellite is also more
    conjunction-relevant to watch closely)."""
    if len(TLE_OBJECTS) < 2:
        return
    primary, secondary = TLE_OBJECTS[0], TLE_OBJECTS[1]
    try:
        result = space_conjunction.find_closest_approach(primary, secondary)
        risk_obj = space_conjunction.to_risk_object(result, source_event_id=health_risk.source_event_id)
        LATEST_RISK[f"{entity_id}::conjunction"] = risk_obj
        await manager.broadcast("conjunction", {
            "tca_utc": result.tca_utc.isoformat(),
            "miss_distance_km": result.miss_distance_km,
            "risk": risk_obj.model_dump(),
            "candidate_maneuvers": result.candidate_maneuvers,
        })
    except Exception as exc:
        logger.warning("conjunction check failed: %s", exc)


async def _run_earth_hazard_pipeline(event: CanonicalEvent) -> None:
    global LATEST_HAZARD_RECORD, LATEST_IMPACT

    # STEP 3: risk prediction. If a LIVE NWS hazard was loaded at startup (or
    # a refresh — see /api/v1/data-sources), score that real record; otherwise
    # fall back to the offline sample geometry. Either path goes through the
    # same scoring math (earth_hazard.score_record), so results are directly
    # comparable regardless of source.
    if LATEST_HAZARD_RECORD is not None and LATEST_HAZARD_RECORD.get("data_source") == "live":
        risk, hazard_record = earth_hazard.score_record(LATEST_HAZARD_RECORD, event.event_id)
    else:
        risk, hazard_record = earth_hazard.score_hazard(event)
    LATEST_HAZARD_RECORD = hazard_record
    LATEST_RISK[event.entity_id] = risk
    await manager.broadcast("risk", risk.model_dump())

    # STEP 4: impact analysis — uses LIVE OpenStreetMap roads/facilities if
    # available (LIVE_ASSETS), else the bundled offline sample layer.
    impact_obj = impact_engine.compute_impact(hazard_record, assets=LIVE_ASSETS)
    LATEST_IMPACT = impact_obj.model_dump()
    await manager.broadcast("impact", LATEST_IMPACT)

    # cascade (folded into step 4/5): downstream effects graph
    graph = build_wildfire_cascade_graph()
    steps = propagate(graph, "wildfire", risk.risk_score)
    cascade = cascade_summary(steps)
    await manager.broadcast("cascade", cascade)

    # STEP 5-6: what-if + decision, using two candidate actions by default
    scenario = whatif.create_scenario(
        baseline_hazard_id=event.entity_id,
        assumptions={"hazard_extent_multiplier": 1.0},
        actions=[
            {"id": "A", "type": "NO_ACTION"},
            {"id": "B", "type": "CLOSE_ROAD", "params": {"road_id": "R-27"}},
            {"id": "C", "type": "RELOCATE_RESOURCE", "params": {"resource_id": "AMB-4", "destination": "ZONE-B"}},
        ],
    )
    results = whatif.run_scenario(scenario)
    ranked = decision_engine.rank_actions(results)
    top = decision_engine.top_recommendation(ranked)
    await manager.broadcast("scenario_results", {
        "scenario_id": scenario.scenario_id,
        "ranked_actions": [r.__dict__ for r in ranked],
    })

    # STEP 7: grounded explanation
    evidence = explanation_service.build_evidence_payload(risk, impact_obj, top, ranked)
    explanation = explanation_service.generate_explanation(evidence)

    # STEP 8: package recommendation for human approval
    if top:
        rec_id = f"rec-{uuid.uuid4().hex[:8]}"
        recommendation = {
            "recommendation_id": rec_id,
            "action": top.action_id,
            "action_type": top.action_type,
            "confidence": risk.confidence,
            "evidence": evidence,
            "explanation": explanation,
            "requires_human_approval": True,
            "approval_state": "PENDING",
            "model_versions": {
                "risk": risk.model_version,
                "decision": decision_engine.DECISION_MODEL_VERSION,
            },
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        RECOMMENDATIONS[rec_id] = recommendation
        await manager.broadcast("recommendation", recommendation)
        _write_audit(actor="system", recommendation_id=rec_id, event={"type": "recommendation_generated"})


def _write_audit(actor: str, recommendation_id: str | None, event: dict) -> None:
    try:
        with SessionLocal() as db:
            db.add(AuditRecord(actor=actor, recommendation_id=recommendation_id, event=event))
            db.commit()
    except Exception as exc:
        logger.warning("audit write skipped (dev DB not ready): %s", exc)


# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------
@app.on_event("startup")
async def on_startup() -> None:
    global TLE_OBJECTS, LATEST_HAZARD_RECORD, LIVE_ASSETS

    init_db()
    bus.subscribe(TOPIC_RAW_EVENTS, process_event)

    # --- LIVE DATA ACQUISITION -------------------------------------------
    # 1. Satellite orbital elements: real call to Celestrak (see tle_data.py).
    TLE_OBJECTS, tle_source = await load_active_tle()
    DATA_SOURCES["satellite_orbital_elements"] = tle_source

    # 2. Earth hazard: real call to the National Weather Service active
    #    alerts API. If NWS has no active wildfire/flood alert with usable
    #    geometry right now, fall back to the bundled offline hazard.
    live_hazard = await live_hazard_feed.get_live_hazard("wildfire")
    if live_hazard is None:
        # score_hazard() (sample path) builds LATEST_HAZARD_RECORD the first
        # time a wildfire event is processed; nothing to seed here.
        DATA_SOURCES["earth_hazard"] = "sample_fallback"
        hazard_bbox = (34.02, -118.63, 34.10, -118.47)  # LA sample area, for the live-geo call below
    else:
        DATA_SOURCES["earth_hazard"] = "live"
        LATEST_HAZARD_RECORD = live_hazard
        minx, miny, maxx, maxy = live_hazard["geometry"].bounds
        hazard_bbox = (miny - 0.05, minx - 0.05, maxy + 0.05, maxx + 0.05)
        logger.info("LIVE hazard loaded from NWS: %s (%s)", live_hazard["hazard_id"], live_hazard.get("headline"))

    # 3. Roads / hospitals / fire stations / population proxy around the
    #    (live or sample) hazard's bounding box: real call to OpenStreetMap.
    min_lat, min_lon, max_lat, max_lon = hazard_bbox
    osm_features = await live_geo.fetch_osm_assets(min_lat, min_lon, max_lat, max_lon)
    if osm_features:
        LIVE_ASSETS = osm_features
        DATA_SOURCES["roads_facilities_population"] = "live"
    else:
        LIVE_ASSETS = None  # impact_engine.compute_impact() falls back to bundled sample
        DATA_SOURCES["roads_facilities_population"] = "sample_fallback"

    asyncio.create_task(run_simulator(gateway))
    logger.info(
        "SkyGuard-X API started (env=%s, ibm_z_integration_enabled=%s) | data sources: %s",
        settings.environment, settings.ibm_z_integration_enabled, DATA_SOURCES,
    )


# ---------------------------------------------------------------------------
# REST API — spec §7.9
# ---------------------------------------------------------------------------
class IngestEventRequest(BaseModel):
    event_type: EventType
    source: str
    entity_id: str
    event_time: datetime | None = None
    payload: dict = {}


@app.get("/api/v1/health")
async def health():
    return {"status": "ok", "service": "SkyGuard-X-api", "time": datetime.now(timezone.utc).isoformat()}


@app.get("/api/v1/data-sources")
async def data_sources():
    """Answers, precisely and at runtime, "which datasets is this actually
    using right now": live (Celestrak / NWS / OpenStreetMap) or offline
    sample fallback, per data channel. This is the fail-safe-behaviour /
    reproducibility transparency the spec requires (§8.3)."""
    return {
        "sources": DATA_SOURCES,
        "tracked_objects": [{"name": o.name, "norad_id": o.norad_id} for o in TLE_OBJECTS],
        "live_asset_count": len(LIVE_ASSETS) if LIVE_ASSETS else 0,
        "notes": {
            "satellite_telemetry": (
                "Always simulated: no real satellite publishes live internal health "
                "telemetry publicly (proprietary mission-control data). Orbital "
                "position (TLE) IS fetched live when reachable."
            ),
            "sandbox_note": (
                "If all sources read 'sample_fallback', outbound network to "
                "celestrak.org / api.weather.gov / overpass-api.de was not reachable "
                "from wherever this instance is running — check your network/firewall. "
                "The fetch code itself is real; see services/*/live_*.py."
            ),
        },
    }


@app.post("/api/v1/data-sources/refresh")
async def refresh_data_sources():
    """Manually re-trigger the live-data acquisition startup did automatically.
    Useful for a live demo: click this right before presenting to pull the
    freshest TLEs/alerts/OSM data rather than relying on whatever was live at
    container-start time."""
    await on_startup()
    return DATA_SOURCES


@app.get("/api/v1/events")
async def get_events(since: str | None = None):
    events = await bus.replay(since)
    return [e.model_dump() for e in events[-200:]]


@app.post("/api/v1/events")
async def ingest_event(req: IngestEventRequest):
    event = CanonicalEvent(
        event_type=req.event_type,
        source=req.source,
        entity_id=req.entity_id,
        event_time=req.event_time or datetime.now(timezone.utc),
        payload=req.payload,
    )
    try:
        await gateway.ingest(event)
    except DuplicateEventError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    return event.model_dump()


@app.get("/api/v1/satellites/{satellite_id}/health")
async def satellite_health(satellite_id: str):
    risk = LATEST_RISK.get(satellite_id)
    if not risk:
        raise HTTPException(status_code=404, detail="no health data yet for this satellite")
    return risk.model_dump()


@app.get("/api/v1/conjunctions")
async def conjunctions():
    return {k: v.model_dump() for k, v in LATEST_RISK.items() if v.risk_type == "conjunction"}


@app.get("/api/v1/hazards")
async def hazards():
    if not LATEST_HAZARD_RECORD:
        return {}
    record = dict(LATEST_HAZARD_RECORD)
    record["geometry"] = record["geometry"].__geo_interface__
    return record


@app.get("/api/v1/impacts/{hazard_id}")
async def impacts(hazard_id: str):
    if not LATEST_IMPACT or LATEST_IMPACT.get("hazard_id") != hazard_id:
        raise HTTPException(status_code=404, detail="no impact computed yet for this hazard")
    return LATEST_IMPACT


class CreateScenarioRequest(BaseModel):
    baseline_id: str
    assumptions: dict = {}
    actions: list[dict]


@app.post("/api/v1/scenarios")
async def create_scenario(req: CreateScenarioRequest):
    scenario = whatif.create_scenario(req.baseline_id, req.assumptions, req.actions)
    return {"scenario_id": scenario.scenario_id, "baseline_id": scenario.baseline_hazard_id, "assumptions": scenario.assumptions}


_SCENARIOS: dict[str, whatif.Scenario] = {}


@app.post("/api/v1/scenarios/{scenario_id}/run")
async def run_scenario_endpoint(scenario_id: str, req: CreateScenarioRequest):
    scenario = whatif.create_scenario(req.baseline_id, req.assumptions, req.actions)
    scenario.scenario_id = scenario_id
    results = whatif.run_scenario(scenario)
    ranked = decision_engine.rank_actions(results)
    _SCENARIOS[scenario_id] = scenario
    return {
        "scenario_id": scenario_id,
        "results": [r.__dict__ for r in results],
        "ranked_actions": [r.__dict__ for r in ranked],
    }


@app.get("/api/v1/scenarios/{scenario_id}/results")
async def scenario_results(scenario_id: str):
    if scenario_id not in _SCENARIOS:
        raise HTTPException(status_code=404, detail="scenario not found — run it first via POST .../run")
    scenario = _SCENARIOS[scenario_id]
    results = whatif.run_scenario(scenario)
    return [r.__dict__ for r in results]


@app.post("/api/v1/recommendations/generate")
async def generate_recommendation():
    if not LATEST_HAZARD_RECORD:
        raise HTTPException(status_code=400, detail="no hazard processed yet — wait for the simulator or POST an event")
    fake_event = CanonicalEvent(
        event_type=EventType.EARTH_HAZARD_WILDFIRE,
        source="api",
        entity_id=LATEST_HAZARD_RECORD["hazard_id"],
        event_time=datetime.now(timezone.utc),
        payload={"hazard_id": LATEST_HAZARD_RECORD["hazard_id"]},
    )
    await _run_earth_hazard_pipeline(fake_event)
    latest = list(RECOMMENDATIONS.values())[-1] if RECOMMENDATIONS else None
    return latest or {"detail": "no recommendation generated"}


class ApprovalRequest(BaseModel):
    approver: str
    decision: str  # "APPROVE" | "REJECT"
    notes: str | None = None


@app.post("/api/v1/recommendations/{recommendation_id}/approve")
async def approve_recommendation(recommendation_id: str, req: ApprovalRequest):
    rec = RECOMMENDATIONS.get(recommendation_id)
    if not rec:
        raise HTTPException(status_code=404, detail="recommendation not found")
    rec["approval_state"] = "APPROVED" if req.decision.upper() == "APPROVE" else "REJECTED"
    rec["approved_by"] = req.approver
    rec["approved_at"] = datetime.now(timezone.utc).isoformat()
    rec["notes"] = req.notes

    try:
        with SessionLocal() as db:
            db.add(Recommendation(
                recommendation_id=recommendation_id,
                action=rec["action"],
                confidence=rec["confidence"],
                evidence=rec["evidence"],
                approval_state=rec["approval_state"],
            ))
            db.commit()
    except Exception as exc:
        logger.warning("recommendation persist skipped: %s", exc)

    _write_audit(actor=req.approver, recommendation_id=recommendation_id, event={
        "type": "human_approval", "decision": rec["approval_state"], "notes": req.notes,
    })
    await manager.broadcast("recommendation_decided", rec)
    return rec


@app.get("/api/v1/audit/{recommendation_id}")
async def audit(recommendation_id: str):
    try:
        with SessionLocal() as db:
            rows = db.query(AuditRecord).filter(AuditRecord.recommendation_id == recommendation_id).all()
            return [
                {"actor": r.actor, "timestamp": r.timestamp.isoformat(), "event": r.event}
                for r in rows
            ]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"audit store unavailable: {exc}")


# ---------------------------------------------------------------------------
# Real-time transport
# ---------------------------------------------------------------------------
@app.websocket("/ws/events")
async def ws_events(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()  # keep-alive / ignore inbound pings
    except WebSocketDisconnect:
        await manager.disconnect(websocket)


@app.get("/stream/events")
async def sse_events():
    """SSE fallback for networks that block WebSocket upgrades."""
    from fastapi.responses import StreamingResponse

    async def event_gen():
        last_len = 0
        while True:
            recent = manager.recent()
            for msg in recent[last_len:]:
                yield f"data: {json.dumps(msg, default=str)}\n\n"
            last_len = len(recent)
            await asyncio.sleep(1)

    return StreamingResponse(event_gen(), media_type="text/event-stream")
