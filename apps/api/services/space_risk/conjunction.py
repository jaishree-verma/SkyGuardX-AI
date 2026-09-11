"""
Conjunction / collision module — spec §7.4.

Uses real SGP4 propagation (see tle_data.py) to find time of closest approach
(TCA) and miss distance between two tracked objects over a prediction
horizon, then converts miss distance + uncertainty into a bounded risk score.
Returns candidate maneuvers for comparison — never an automatic command
(spec safety rule, enforced again at the Decision Engine's hard constraints).
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

import numpy as np

from core.events import RiskObject
from services.space_risk.tle_data import TrackedObject, propagate

MODEL_VERSION = "conjunction-1.0"

# Conservative combined hard-body radius assumption for risk banding (km).
# Real operations use per-object covariance; this is a documented simplification.
ASSUMED_COMBINED_RADIUS_KM = 0.02
PREDICTION_HORIZON_HOURS = 24
STEP_SECONDS = 30


@dataclass
class ConjunctionResult:
    primary: str
    secondary: str
    tca_utc: datetime
    miss_distance_km: float
    risk_score: float
    confidence: float
    candidate_maneuvers: list[dict]


def _positions_at(obj: TrackedObject, t: datetime) -> np.ndarray:
    pos, _vel = propagate(obj, t.year, t.month, t.day, t.hour, t.minute, t.second + t.microsecond / 1e6)
    return np.array(pos)


def find_closest_approach(primary: TrackedObject, secondary: TrackedObject, start: datetime | None = None) -> ConjunctionResult:
    """Coarse-to-fine search for time of closest approach over the prediction
    horizon — the same two-pass strategy (coarse scan then refine) used in
    real conjunction-screening tools, simplified for demo runtime."""
    start = start or datetime.now(timezone.utc)
    horizon = timedelta(hours=PREDICTION_HORIZON_HOURS)

    # Coarse pass: every 2 minutes across the horizon
    coarse_step = timedelta(minutes=2)
    best_t, best_d = start, math.inf
    t = start
    while t <= start + horizon:
        try:
            p1, p2 = _positions_at(primary, t), _positions_at(secondary, t)
            d = float(np.linalg.norm(p1 - p2))
            if d < best_d:
                best_d, best_t = d, t
        except RuntimeError:
            pass
        t += coarse_step

    # Fine pass: +/- 4 minutes around the coarse minimum, at STEP_SECONDS resolution
    fine_start = best_t - timedelta(minutes=4)
    fine_end = best_t + timedelta(minutes=4)
    t = fine_start
    while t <= fine_end:
        try:
            p1, p2 = _positions_at(primary, t), _positions_at(secondary, t)
            d = float(np.linalg.norm(p1 - p2))
            if d < best_d:
                best_d, best_t = d, t
        except RuntimeError:
            pass
        t += timedelta(seconds=STEP_SECONDS)

    risk_score, confidence = _distance_to_risk(best_d)
    maneuvers = _candidate_maneuvers(best_d, best_t)

    return ConjunctionResult(
        primary=primary.name,
        secondary=secondary.name,
        tca_utc=best_t,
        miss_distance_km=round(best_d, 4),
        risk_score=risk_score,
        confidence=confidence,
        candidate_maneuvers=maneuvers,
    )


def _distance_to_risk(miss_distance_km: float) -> tuple[float, float]:
    """Bounded risk from miss distance. This is a documented, explainable
    approximation (not a full probability-of-collision covariance
    calculation) — the spec explicitly requires we not describe this as
    certainty. Confidence drops for very small or very large distances where
    the coarse/fine search resolution matters more."""
    if miss_distance_km <= ASSUMED_COMBINED_RADIUS_KM:
        risk = 0.99
    else:
        # exponential decay in "risk-relevant" range (0 - 5 km), ~0 beyond that
        risk = float(np.clip(math.exp(-miss_distance_km / 1.0), 0.0, 0.99))
    confidence = 0.9 if 0.05 < miss_distance_km < 5.0 else 0.6
    return round(risk, 4), round(confidence, 4)


def _candidate_maneuvers(miss_distance_km: float, tca: datetime) -> list[dict]:
    """Candidate maneuver comparison, never an automatic command (spec §7.4
    SAFETY RULE). Delta-v figures are illustrative planning magnitudes, not
    a flight-dynamics solution — flagged as SIMULATED / PLANNED."""
    return [
        {
            "id": "NO_ACTION",
            "label": "Continue nominal trajectory",
            "delta_v_m_s": 0.0,
            "fuel_cost": "none",
            "resulting_risk_reduction": 0.0,
            "status": "SIMULATED_RECOMMENDATION_ONLY",
        },
        {
            "id": "RAISE_ORBIT",
            "label": "Small radial burn ~6h before TCA to increase separation",
            "delta_v_m_s": 0.05,
            "fuel_cost": "low",
            "resulting_risk_reduction": 0.6,
            "status": "SIMULATED_RECOMMENDATION_ONLY",
        },
        {
            "id": "PHASE_SHIFT",
            "label": "Along-track burn to shift arrival time away from TCA",
            "delta_v_m_s": 0.02,
            "fuel_cost": "very low",
            "resulting_risk_reduction": 0.4,
            "status": "SIMULATED_RECOMMENDATION_ONLY",
        },
    ]


def to_risk_object(result: ConjunctionResult, source_event_id: str) -> RiskObject:
    status = "HIGH" if result.risk_score >= 0.75 else "MEDIUM" if result.risk_score >= 0.45 else "LOW"
    return RiskObject(
        entity_id=result.primary,
        risk_type="conjunction",
        risk_score=result.risk_score,
        confidence=result.confidence,
        status=status,
        top_evidence=[
            f"miss_distance_{result.miss_distance_km}km",
            f"tca_{result.tca_utc.isoformat()}",
            f"secondary_object_{result.secondary}",
        ],
        model_version=MODEL_VERSION,
        source_event_id=source_event_id,
    )
