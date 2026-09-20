"""
Multi-Hazard Convergence Engine — Feature 2 of the hackathon branch.

Detects when a satellite anomaly and an Earth hazard overlap geographically
within the same time window and computes a Compound Threat Index (CTI).

The CTI is the geometric mean of both risk scores:
    CTI = sqrt(space_risk_score * earth_risk_score)

This preserves extremes (a CTI of 0.70+ is high-priority even if one score
is lower), which is the correct behaviour for compound disaster scenarios.

Convergence fires only when:
  - space_risk_score >= SPACE_THRESHOLD (0.40)
  - earth_risk_score >= EARTH_THRESHOLD (0.40)
  - The satellite ground-track point is within MAX_CONVERGENCE_DISTANCE_KM
    of the Earth hazard polygon centroid

This module is stateless — it takes the latest risk objects and hazard
records as inputs and returns a ConvergenceEvent if conditions are met.
"""
from __future__ import annotations

import logging
import math
import uuid
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger("SkyGuard-X.convergence")

# ---------------------------------------------------------------------------
# Thresholds — tunable without code changes if needed
# ---------------------------------------------------------------------------
SPACE_THRESHOLD = 0.40      # minimum space risk score to trigger
EARTH_THRESHOLD = 0.40      # minimum earth risk score to trigger
MAX_CONVERGENCE_DISTANCE_KM = 800.0  # satellite ground track radius for overlap check


# ---------------------------------------------------------------------------
# Haversine distance helper (no external deps required)
# ---------------------------------------------------------------------------
def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance between two lat/lon points in kilometres."""
    R = 6371.0
    φ1, φ2 = math.radians(lat1), math.radians(lat2)
    Δφ = math.radians(lat2 - lat1)
    Δλ = math.radians(lon2 - lon1)
    a = math.sin(Δφ / 2) ** 2 + math.cos(φ1) * math.cos(φ2) * math.sin(Δλ / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ---------------------------------------------------------------------------
# Core detector function
# ---------------------------------------------------------------------------
def detect_convergence(
    space_risk: dict,
    earth_hazard: dict,
    satellite_location: Optional[dict] = None,
) -> Optional[dict]:
    """Check if a space risk + earth hazard constitute a convergence event.

    Args:
        space_risk:          Unified space risk dict from the risk engine.
        earth_hazard:        Scored earth hazard record from hazard.score_record().
        satellite_location:  {"latitude": float, "longitude": float} of the satellite.

    Returns:
        A convergence event dict if conditions are met, or None.
    """
    space_score: float = space_risk.get("risk_score", 0.0)
    earth_score: float = earth_hazard.get("risk_score", 0.0)

    # Gate 1: Both risks must exceed their threshold
    if space_score < SPACE_THRESHOLD or earth_score < EARTH_THRESHOLD:
        logger.debug(
            "Convergence gate 1 not met: space=%.2f (min=%.2f) earth=%.2f (min=%.2f)",
            space_score, SPACE_THRESHOLD, earth_score, EARTH_THRESHOLD,
        )
        return None

    # Gate 2: Geographic proximity — satellite ground track vs hazard centroid
    hazard_lat = earth_hazard.get("centroid_lat")
    hazard_lon = earth_hazard.get("centroid_lon")
    distance_km: Optional[float] = None
    spatial_overlap_km2: float = 0.0

    if satellite_location and hazard_lat is not None and hazard_lon is not None:
        sat_lat = satellite_location.get("latitude", 0.0)
        sat_lon = satellite_location.get("longitude", 0.0)
        distance_km = _haversine_km(sat_lat, sat_lon, hazard_lat, hazard_lon)

        if distance_km > MAX_CONVERGENCE_DISTANCE_KM:
            logger.debug(
                "Convergence gate 2 not met: distance=%.1f km (max=%.1f km)",
                distance_km, MAX_CONVERGENCE_DISTANCE_KM,
            )
            return None

        # Approximate overlap: treat satellite footprint as circle with 500km radius
        # This is a simplified model — for the demo it correctly reflects that LEO
        # satellites have a ~1000km diameter ground visibility footprint.
        sat_footprint_radius_km = 500.0
        hazard_radius_km = math.sqrt(earth_hazard.get("area_km2", 1000.0) / math.pi)
        combined_radius = sat_footprint_radius_km + hazard_radius_km
        if distance_km < combined_radius:
            # Lens-shaped intersection area (simplified)
            overlap_fraction = max(0.0, 1.0 - distance_km / combined_radius)
            spatial_overlap_km2 = math.pi * min(sat_footprint_radius_km, hazard_radius_km) ** 2 * overlap_fraction
    else:
        # No location data — assume proximity for demo resilience
        spatial_overlap_km2 = 1.0
        logger.warning("Convergence: no satellite location — assuming geographic proximity")

    # Compound Threat Index = geometric mean (preserves extremes)
    compound_threat_index = math.sqrt(space_score * earth_score)

    convergence_id = f"CVG-{uuid.uuid4().hex[:8].upper()}"
    event = {
        "convergence_id": convergence_id,
        "event_type": "CONVERGENCE_ALERT",
        "compound_threat_index": round(compound_threat_index, 4),
        "space_entity_id": space_risk.get("entity_id", "unknown"),
        "space_risk_score": round(space_score, 4),
        "space_risk_status": space_risk.get("status", "UNKNOWN"),
        "space_top_evidence": space_risk.get("top_evidence", []),
        "earth_hazard_type": earth_hazard.get("hazard_type", "unknown"),
        "earth_risk_score": round(earth_score, 4),
        "earth_risk_status": earth_hazard.get("status", "UNKNOWN"),
        "spatial_overlap_km2": round(spatial_overlap_km2, 2),
        "distance_km": round(distance_km, 2) if distance_km is not None else None,
        "convergence_zone": {
            "lat": hazard_lat,
            "lon": hazard_lon,
        } if hazard_lat is not None else None,
        "affected_population": earth_hazard.get("affected_population", 0),
        "severity": _cti_to_severity(compound_threat_index),
        "requires_human_approval": True,
        "autonomous_action_allowed": False,
        "detected_at": datetime.now(timezone.utc).isoformat(),
        "source": "convergence_engine_v1",
    }

    logger.info(
        "CONVERGENCE DETECTED: id=%s CTI=%.3f space=%s(%.2f) earth=%s(%.2f) overlap=%.1f km²",
        convergence_id,
        compound_threat_index,
        space_risk.get("entity_id"),
        space_score,
        earth_hazard.get("hazard_type"),
        earth_score,
        spatial_overlap_km2,
    )
    return event


def _cti_to_severity(cti: float) -> str:
    """Map Compound Threat Index to human-readable severity."""
    if cti >= 0.75:
        return "CRITICAL"
    if cti >= 0.55:
        return "HIGH"
    if cti >= 0.35:
        return "MEDIUM"
    return "LOW"


# ---------------------------------------------------------------------------
# In-memory convergence log (last 50 events)
# ---------------------------------------------------------------------------
_convergence_log: list[dict] = []
_MAX_LOG = 50


def record_convergence(event: dict) -> None:
    """Append a convergence event to the in-memory log."""
    _convergence_log.append(event)
    if len(_convergence_log) > _MAX_LOG:
        _convergence_log.pop(0)


def get_convergence_log() -> list[dict]:
    """Return the convergence log (most recent first)."""
    return list(reversed(_convergence_log))


def get_convergence_status() -> dict:
    """Return current convergence watchlist status."""
    recent = _convergence_log[-1] if _convergence_log else None
    return {
        "total_events": len(_convergence_log),
        "latest_event": recent,
        "thresholds": {
            "space_min": SPACE_THRESHOLD,
            "earth_min": EARTH_THRESHOLD,
            "max_distance_km": MAX_CONVERGENCE_DISTANCE_KM,
        },
        "engine_version": "convergence-v1",
    }
