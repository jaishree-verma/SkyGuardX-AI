"""
Conjunction / collision risk module for Layer 1 Space Intelligence.

Supports both:
1. Real SGP4 orbital propagation for TLE-tracked space objects.
2. 3D spatial proximity and Miss Distance computation for fleet satellites and debris.

Computes:
- Miss distance (km)
- Time to Closest Approach (TCA) in minutes / UTC
- Conjunction Risk Score (0..1)
- Risk Level: LOW, MEDIUM, HIGH, CRITICAL
- Candidate maneuvers (labeled SIMULATED RECOMMENDATION — HUMAN REVIEW REQUIRED;
  strictly NO autonomous spacecraft execution).
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

import numpy as np

from core.events import RiskObject
from services.space_risk.tle_data import TrackedObject, propagate

MODEL_VERSION = "conjunction-v1"

ASSUMED_COMBINED_RADIUS_KM = 0.02
PREDICTION_HORIZON_HOURS = 24
STEP_SECONDS = 30
EARTH_RADIUS_KM = 6371.0


@dataclass
class ConjunctionResult:
    conjunction_id: str
    object_a: str
    object_b: str
    time_to_closest_approach_minutes: float
    miss_distance_km: float
    risk_score: float
    risk_level: str  # LOW | MEDIUM | HIGH | CRITICAL
    confidence: float
    candidate_maneuvers: List[Dict[str, Any]]
    evidence: List[str]
    tca_utc: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    human_review_required: bool = True
    autonomous_command_allowed: bool = False

    # Backward compatibility attributes
    @property
    def primary(self) -> str:
        return self.object_a

    @property
    def secondary(self) -> str:
        return self.object_b


def _geodetic_to_cartesian(lat_deg: float, lon_deg: float, alt_km: float) -> np.ndarray:
    """Converts (lat, lon, altitude_km) to Earth-Centered Earth-Fixed (ECEF) Cartesian (km)."""
    phi = math.radians(lat_deg)
    lam = math.radians(lon_deg)
    r = EARTH_RADIUS_KM + alt_km
    x = r * math.cos(phi) * math.cos(lam)
    y = r * math.cos(phi) * math.sin(lam)
    z = r * math.sin(phi)
    return np.array([x, y, z])


def calculate_spatial_proximity(
    obj_a: Dict[str, Any],
    obj_b: Dict[str, Any],
    tca_minutes: float = 18.0,
) -> ConjunctionResult:
    """Calculates spatial distance and collision risk between two tracked space objects."""
    id_a = obj_a.get("satellite_id") or obj_a.get("object_id", "OBJ-A")
    id_b = obj_b.get("object_id") or obj_b.get("satellite_id", "OBJ-B")

    lat_a = float(obj_a.get("latitude", 0.0))
    lon_a = float(obj_a.get("longitude", 0.0))
    alt_a = float(obj_a.get("altitude_km", 550.0))

    lat_b = float(obj_b.get("latitude", 0.0))
    lon_b = float(obj_b.get("longitude", 0.0))
    alt_b = float(obj_b.get("altitude_km", 550.0))

    p_a = _geodetic_to_cartesian(lat_a, lon_a, alt_a)
    p_b = _geodetic_to_cartesian(lat_b, lon_b, alt_b)

    dist_km = float(np.linalg.norm(p_a - p_b))

    # Bounded risk calculation based on miss distance
    risk_score, risk_level, confidence = _distance_to_risk_level(dist_km)
    maneuvers = _candidate_maneuvers(dist_km)

    evidence = [
        f"Miss distance calculated at {dist_km:.2f} km between {id_a} and {id_b}",
        f"Estimated time to closest approach: {tca_minutes:.1f} minutes",
        f"Spatial risk category: {risk_level}",
    ]
    if dist_km < 1.0:
        evidence.append("Immediate human review required: separation below critical 1.0 km threshold")

    return ConjunctionResult(
        conjunction_id=f"CONJ-{id_a[-4:]}-{id_b[-4:]}",
        object_a=id_a,
        object_b=id_b,
        time_to_closest_approach_minutes=tca_minutes,
        miss_distance_km=round(dist_km, 3),
        risk_score=risk_score,
        risk_level=risk_level,
        confidence=confidence,
        candidate_maneuvers=maneuvers,
        evidence=evidence,
        tca_utc=datetime.now(timezone.utc) + timedelta(minutes=tca_minutes),
        human_review_required=True,
        autonomous_command_allowed=False,
    )


def _distance_to_risk_level(miss_distance_km: float) -> Tuple[float, str, float]:
    """Computes bounded risk score (0..1), risk level, and confidence from miss distance (km)."""
    if miss_distance_km <= 0.2:
        risk_score = 0.98
        risk_level = "CRITICAL"
        confidence = 0.96
    elif miss_distance_km <= 1.0:
        # Scale 0.80 to 0.95
        risk_score = 0.95 - (miss_distance_km - 0.2) * 0.15
        risk_level = "HIGH"
        confidence = 0.94
    elif miss_distance_km <= 5.0:
        # Scale 0.40 to 0.79
        risk_score = 0.79 - (miss_distance_km - 1.0) * 0.10
        risk_level = "MEDIUM"
        confidence = 0.90
    else:
        # Exponential decay beyond 5km
        risk_score = float(np.clip(math.exp(-miss_distance_km / 10.0) * 0.35, 0.01, 0.39))
        risk_level = "LOW"
        confidence = 0.85

    return round(float(risk_score), 4), risk_level, round(float(confidence), 4)


def _candidate_maneuvers(miss_distance_km: float) -> List[Dict[str, Any]]:
    """Candidate maneuver recommendations.
    Strictly SIMULATED recommendations; human operator review is required.
    Autonomous commanding is forbidden.
    """
    return [
        {
            "id": "NO_ACTION",
            "label": "Continue nominal trajectory (Monitor)",
            "delta_v_m_s": 0.0,
            "fuel_cost": "none",
            "resulting_risk_reduction": 0.0,
            "status": "SIMULATED_RECOMMENDATION_ONLY",
            "requires_human_approval": True,
            "autonomous_execution": False,
        },
        {
            "id": "RAISE_ORBIT",
            "label": "Small radial burn ~6h before TCA to increase radial separation (+1.2 km)",
            "delta_v_m_s": 0.05,
            "fuel_cost": "low",
            "resulting_risk_reduction": 0.85 if miss_distance_km < 2.0 else 0.50,
            "status": "SIMULATED_RECOMMENDATION_ONLY",
            "requires_human_approval": True,
            "autonomous_execution": False,
        },
        {
            "id": "PHASE_SHIFT",
            "label": "Along-track posigrade burn to phase arrival time away from conjunction window",
            "delta_v_m_s": 0.02,
            "fuel_cost": "very low",
            "resulting_risk_reduction": 0.70,
            "status": "SIMULATED_RECOMMENDATION_ONLY",
            "requires_human_approval": True,
            "autonomous_execution": False,
        },
    ]


# ---------------------------------------------------------------------------
# SGP4 Conjunction analysis for TLE pairs
# ---------------------------------------------------------------------------
def _positions_at(obj: TrackedObject, t: datetime) -> np.ndarray:
    pos, _vel = propagate(obj, t.year, t.month, t.day, t.hour, t.minute, t.second + t.microsecond / 1e6)
    return np.array(pos)


def find_closest_approach(primary: TrackedObject, secondary: TrackedObject, start: datetime | None = None) -> ConjunctionResult:
    """Coarse-to-fine SGP4 propagation search for closest approach."""
    start = start or datetime.now(timezone.utc)
    horizon = timedelta(hours=PREDICTION_HORIZON_HOURS)

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

    risk_score, risk_level, confidence = _distance_to_risk_level(best_d)
    tca_mins = max(0.0, (best_t - start).total_seconds() / 60.0)

    return ConjunctionResult(
        conjunction_id=f"CONJ-{primary.name[:8]}-{secondary.name[:8]}",
        object_a=primary.name,
        object_b=secondary.name,
        time_to_closest_approach_minutes=round(tca_mins, 1),
        miss_distance_km=round(best_d, 3),
        risk_score=risk_score,
        risk_level=risk_level,
        confidence=confidence,
        candidate_maneuvers=_candidate_maneuvers(best_d),
        evidence=[
            f"SGP4 propagation computed miss distance: {best_d:.2f} km",
            f"TCA in {tca_mins:.1f} minutes",
        ],
        tca_utc=best_t,
        human_review_required=True,
        autonomous_command_allowed=False,
    )


def to_risk_object(result: ConjunctionResult, source_event_id: str) -> RiskObject:
    status = "CRITICAL" if result.risk_level == "CRITICAL" else ("HIGH" if result.risk_score >= 0.75 else ("MEDIUM" if result.risk_score >= 0.45 else "LOW"))
    return RiskObject(
        entity_id=result.object_a,
        risk_type="conjunction",
        risk_score=result.risk_score,
        confidence=result.confidence,
        status=status,
        top_evidence=result.evidence[:3],
        model_version=MODEL_VERSION,
        source_event_id=source_event_id,
        data_age_seconds=0.0,
    )
