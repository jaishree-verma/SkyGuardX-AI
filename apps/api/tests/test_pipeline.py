"""
Tests for the core decision-loop pieces — spec §9.5 checklist items:
"canonical event schema exists and is tested", "decision engine applies hard
constraints", etc. Run with `pytest` from apps/api/.
"""
import asyncio
from datetime import datetime, timedelta, timezone

import pytest

from core.events import CanonicalEvent, EventType, DataQuality
from core.eventbus import InProcEventBus
from services.ingestion.gateway import EventGateway, DuplicateEventError, TOPIC_RAW_EVENTS
from services.space_risk.anomaly import score_telemetry
from services.cascade_engine.cascade import build_wildfire_cascade_graph, propagate, cascade_summary
from services.decision_engine.decision import rank_actions, HardConstraints
from services.scenario_engine.whatif import ScenarioResult


def make_event(**overrides) -> CanonicalEvent:
    defaults = dict(
        event_type=EventType.TELEMETRY_NOMINAL,
        source="test",
        entity_id="SAT-TEST",
        event_time=datetime.now(timezone.utc),
        payload={"solar_output": 1400, "thermal_index": 15, "battery_voltage": 28},
    )
    defaults.update(overrides)
    return CanonicalEvent(**defaults)


def test_canonical_event_defaults():
    e = make_event()
    assert e.event_id.startswith("evt-")
    assert e.schema_version == "1.0"
    assert e.age_seconds() < 5


@pytest.mark.asyncio
async def test_gateway_rejects_duplicate_event_id():
    bus = InProcEventBus()
    gw = EventGateway(bus)
    e = make_event()
    await gw.ingest(e)
    with pytest.raises(DuplicateEventError):
        await gw.ingest(e)


@pytest.mark.asyncio
async def test_gateway_flags_stale_event():
    bus = InProcEventBus()
    gw = EventGateway(bus)
    old_event = make_event(event_time=datetime.now(timezone.utc) - timedelta(minutes=5))
    result = await gw.ingest(old_event)
    assert result.quality.status == "STALE"


def test_anomaly_detector_flags_injected_fault():
    nominal = make_event(payload={"solar_output": 1400, "thermal_index": 15, "battery_voltage": 28})
    anomalous = make_event(
        entity_id="SAT-TEST-2",
        payload={"solar_output": 900, "thermal_index": 50, "battery_voltage": 25},
    )
    risk_nominal = score_telemetry(nominal)
    risk_anomalous = score_telemetry(anomalous)
    assert risk_anomalous.risk_score > risk_nominal.risk_score
    assert risk_anomalous.status in ("MEDIUM", "HIGH")


def test_cascade_propagation_produces_downstream_effects():
    graph = build_wildfire_cascade_graph()
    steps = propagate(graph, "wildfire", root_intensity=0.8)
    summary = cascade_summary(steps)
    assert "road_accessibility" in summary
    assert "hospital_capacity" in summary
    # magnitude should generally decay downstream since edge weights are <=1
    assert summary["hospital_capacity"] <= summary["population_exposure"]


def test_decision_engine_blocks_unsafe_action_regardless_of_score():
    high_score_but_unsafe = ScenarioResult(
        scenario_id="scn-1", action_id="B", action_type="RELOCATE_RESOURCE",
        metrics={}, score_inputs={
            "risk_reduction": 1.0, "human_impact_reduction": 1.0, "response_speed": 1.0,
            "resource_cost": 0.0, "mission_disruption": 0.0, "uncertainty_penalty": 0.0,
        },
    )
    low_score_but_safe = ScenarioResult(
        scenario_id="scn-1", action_id="A", action_type="NO_ACTION",
        metrics={}, score_inputs={
            "risk_reduction": 0.1, "human_impact_reduction": 0.1, "response_speed": 0.0,
            "resource_cost": 0.0, "mission_disruption": 0.0, "uncertainty_penalty": 0.0,
        },
    )
    ranked = rank_actions(
        [high_score_but_unsafe, low_score_but_safe],
        constraints_by_action={"B": HardConstraints(safety_ok=False)},
    )
    assert ranked[0].action_id == "A"  # unsafe action pushed below even a lower-scoring safe one
    assert ranked[-1].action_id == "B"
    assert ranked[-1].allowed is False
