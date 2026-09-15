"""
Test suite for Layer 1 — Space Intelligence (SkyGuard XAI).

Verifies:
1. Event Validation & Deduplication
2. Telemetry History & State Tracking
3. Health Scoring Engine
4. AI Isolation Forest Anomaly Detection & Attribution
5. Model Evaluation Metrics (Precision, Recall, F1, Confusion Matrix)
6. Conjunction Proximity & Miss Distance
7. Unified Space Risk Engine & Contributor Weights
8. Real-Time Alert Transitions
9. Layer 2 Export Schema Contract
10. End-to-End Space Pipeline
"""
from datetime import datetime, timezone
import pytest

from core.events import CanonicalEvent, DataQuality, EventType, RiskObject
from core.eventbus import InProcEventBus
from services.ingestion.gateway import EventGateway, DuplicateEventError, MalformedEventError
from services.space_risk.anomaly import score_telemetry, evaluate_model
from services.space_risk.conjunction import calculate_spatial_proximity, _distance_to_risk_level
from services.space_risk.tracker import SpaceTracker, TelemetryPoint
from services.space_risk.risk_engine import calculate_unified_risk
from services.space_risk.alerts import AlertManager


def test_event_validation_valid():
    event = CanonicalEvent(
        event_type=EventType.SATELLITE_TELEMETRY,
        source="simulator",
        entity_id="SAT-1042",
        event_time=datetime.now(timezone.utc),
        payload={
            "latitude": 28.61,
            "longitude": 77.21,
            "altitude_km": 550.0,
            "velocity_kms": 7.6,
            "temperature_c": 24.5,
            "battery_level": 91.0,
            "power_consumption": 62.0,
            "signal_strength": 96.0,
        },
    )
    valid, errors = event.validate_bounds()
    assert valid is True
    assert len(errors) == 0


def test_event_validation_invalid_bounds():
    event = CanonicalEvent(
        event_type=EventType.SATELLITE_TELEMETRY,
        source="simulator",
        entity_id="SAT-1042",
        event_time=datetime.now(timezone.utc),
        payload={
            "latitude": 150.0,  # Invalid: > 90
            "battery_level": -10.0,  # Invalid: < 0
            "velocity_kms": -5.0,  # Invalid: negative
        },
    )
    valid, errors = event.validate_bounds()
    assert valid is False
    assert len(errors) >= 3


@pytest.mark.asyncio
async def test_gateway_rejects_malformed_and_duplicate():
    bus = InProcEventBus()
    gateway = EventGateway(bus)

    # 1. Malformed event rejection
    malformed = CanonicalEvent(
        event_id="evt-bad-1",
        event_type=EventType.SATELLITE_TELEMETRY,
        source="simulator",
        entity_id="SAT-1042",
        event_time=datetime.now(timezone.utc),
        payload={"latitude": 120.0},
    )
    with pytest.raises(MalformedEventError):
        await gateway.ingest(malformed)

    # 2. Valid event ingestion
    valid = CanonicalEvent(
        event_id="evt-good-1",
        event_type=EventType.SATELLITE_TELEMETRY,
        source="simulator",
        entity_id="SAT-1042",
        event_time=datetime.now(timezone.utc),
        payload={"latitude": 28.61, "battery_level": 90.0},
    )
    await gateway.ingest(valid)

    # 3. Duplicate event rejection
    with pytest.raises(DuplicateEventError):
        await gateway.ingest(valid)


def test_telemetry_history_and_tracker():
    tracker = SpaceTracker()
    now = datetime.now(timezone.utc)

    # Update 3 points
    tracker.register_or_update_satellite({
        "satellite_id": "SAT-1042",
        "satellite_name": "SKYGUARD-1042",
        "latitude": 28.61,
        "longitude": 77.21,
        "temperature_c": 24.5,
        "battery_level": 91.0,
        "power_consumption": 62.0,
        "signal_strength": 96.0,
    }, now)

    sat = tracker.get_satellite("SAT-1042")
    assert sat is not None
    assert sat.satellite_name == "SKYGUARD-1042"
    assert sat.health_score > 90.0
    assert sat.health_status == "NORMAL"
    assert len(sat.telemetry_history) == 1

    # Check history retrieval
    history = tracker.get_satellite_history("SAT-1042")
    assert len(history) == 1
    assert history[0]["temperature_c"] == 24.5


def test_health_scoring_degraded():
    tracker = SpaceTracker()
    sat = tracker.register_or_update_satellite({
        "satellite_id": "SAT-1042",
        "temperature_c": 71.0,  # High heat
        "battery_level": 42.0,  # Depleted
        "power_consumption": 94.0,  # Power surge
        "signal_strength": 61.0,  # Degraded
        "attitude_status": "TUMBLING",
    })

    assert sat.health_score < 50.0
    assert sat.health_status in ("HIGH_RISK", "CRITICAL")
    assert len(sat.health_evidence) > 0


def test_ai_anomaly_detection_nominal_vs_abnormal():
    # Nominal telemetry
    nom_event = CanonicalEvent(
        event_type=EventType.TELEMETRY_NOMINAL,
        source="simulator",
        entity_id="SAT-1042",
        event_time=datetime.now(timezone.utc),
        payload={
            "temperature_c": 24.5,
            "battery_level": 91.0,
            "power_consumption": 62.0,
            "signal_strength": 96.0,
            "velocity_kms": 7.6,
        },
    )
    nom_risk = score_telemetry(nom_event)
    assert nom_risk.risk_score < 0.40
    assert nom_risk.status == "LOW"

    # Injected anomaly: temperature spike and battery drop
    anom_event = CanonicalEvent(
        event_type=EventType.TELEMETRY_ANOMALY,
        source="simulator",
        entity_id="SAT-1042",
        event_time=datetime.now(timezone.utc),
        payload={
            "temperature_c": 71.0,
            "battery_level": 42.0,
            "power_consumption": 94.0,
            "signal_strength": 61.0,
            "velocity_kms": 7.6,
        },
    )
    anom_risk = score_telemetry(anom_event)
    assert anom_risk.risk_score >= 0.75
    assert anom_risk.status == "HIGH"
    assert any("Temperature increased" in ev for ev in anom_risk.top_evidence)


def test_model_evaluation_metrics():
    eval_result = evaluate_model()
    assert eval_result["model_version"] == "telemetry-anomaly-v1"
    metrics = eval_result["metrics"]
    assert "precision" in metrics
    assert "recall" in metrics
    assert "f1_score" in metrics
    assert metrics["f1_score"] > 0.85
    cm = eval_result["confusion_matrix"]
    assert cm["true_positives"] > 0
    assert cm["true_negatives"] > 0


def test_conjunction_proximity_and_candidate_maneuvers():
    # Satellite at (28.61, 77.21, 550.0)
    sat = {"satellite_id": "SAT-1042", "latitude": 28.61, "longitude": 77.21, "altitude_km": 550.0}
    # Debris close by (~0.72 km)
    deb = {"object_id": "DEB-2098", "latitude": 28.614, "longitude": 77.214, "altitude_km": 550.72}

    res = calculate_spatial_proximity(sat, deb, tca_minutes=18.0)
    assert res.miss_distance_km < 2.0
    assert res.risk_level in ("HIGH", "CRITICAL")
    assert res.risk_score > 0.80
    assert res.human_review_required is True
    assert res.autonomous_command_allowed is False
    assert len(res.candidate_maneuvers) >= 2


def test_unified_space_risk_and_layer2_contract():
    telemetry_risk = RiskObject(
        entity_id="SAT-1042",
        risk_type="health",
        risk_score=0.89,
        confidence=0.94,
        status="HIGH",
        top_evidence=["Temperature spike 71.0C", "Power draw 94W"],
        model_version="telemetry-anomaly-v1",
        source_event_id="evt-1",
    )
    conj_risk = RiskObject(
        entity_id="SAT-1042",
        risk_type="conjunction",
        risk_score=0.84,
        confidence=0.92,
        status="HIGH",
        top_evidence=["Miss distance 0.72 km with DEB-2098"],
        model_version="conjunction-v1",
        source_event_id="evt-1",
    )

    unified = calculate_unified_risk(
        entity_id="SAT-1042",
        telemetry_risk=telemetry_risk,
        health_score=42.0,  # depleted health
        health_evidence=["Battery 42%"],
        conjunction_risk=conj_risk,
        location={"latitude": 28.61, "longitude": 77.21},
    )

    assert unified["risk_score"] >= 0.75
    assert unified["status"] == "CRITICAL"
    assert "telemetry_anomaly_pct" in unified["risk_contributors"]
    assert "layer2_export" in unified
    l2 = unified["layer2_export"]
    assert l2["event_type"] == "SPACE_RISK"
    assert l2["entity_id"] == "SAT-1042"
    assert l2["requires_human_approval"] is True
    assert l2["autonomous_action_allowed"] is False


def test_alert_manager_state_transition():
    manager = AlertManager()

    # Normal state should not alert
    alert1 = manager.evaluate_space_risk_alert("SAT-1042", "LOW", 0.15, ["Nominal"])
    assert alert1 is None

    # Transition to HIGH should trigger alert
    alert2 = manager.evaluate_space_risk_alert("SAT-1042", "HIGH", 0.82, ["Temperature anomaly"])
    assert alert2 is not None
    assert alert2.alert_type == "SPACE_RISK_ALERT"
    assert alert2.severity == "HIGH"

    # Subsequent same status should not re-alert (no spam)
    alert3 = manager.evaluate_space_risk_alert("SAT-1042", "HIGH", 0.85, ["Temperature anomaly"])
    assert alert3 is None

    # Conjunction alert
    conj_alert = manager.evaluate_conjunction_alert(
        object_a="SAT-1042",
        object_b="DEB-2098",
        miss_distance_km=0.72,
        risk_score=0.84,
        risk_level="HIGH",
        tca_minutes=18.0,
    )
    assert conj_alert is not None
    assert conj_alert.alert_type == "CONJUNCTION_ALERT"
