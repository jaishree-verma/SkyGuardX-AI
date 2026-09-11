"""
Earth hazard module — spec §7.5. MVP hazard: wildfire (spec recommends
wildfire OR flood for MVP; wildfire chosen here as the more visually and
narratively demonstrable per the spec's own note).

Loads real hazard geometry (data/sample/la_wildfire_area.geojson — real LA
-area coordinates, illustrative extent, see file header) and turns it into a
RiskObject plus a hazard record that the Impact Engine consumes.
"""
from __future__ import annotations

import json
import os
from datetime import datetime, timezone

from shapely.geometry import shape

from core.events import CanonicalEvent, RiskObject

MODEL_VERSION = "hazard-wildfire-1.0"

HAZARD_GEOJSON_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "..", "..", "data", "sample", "la_wildfire_area.geojson"
)


def load_hazard_geometry(hazard_id: str = "HAZARD-77") -> dict:
    with open(HAZARD_GEOJSON_PATH) as f:
        fc = json.load(f)
    for feature in fc["features"]:
        if feature["properties"]["hazard_id"] == hazard_id:
            return feature
    raise ValueError(f"hazard {hazard_id} not found in {HAZARD_GEOJSON_PATH}")


def score_hazard(event: CanonicalEvent, extent_multiplier: float = 1.0) -> tuple[RiskObject, dict]:
    """OFFLINE-SAMPLE path: loads geometry from the bundled sample file, then
    delegates to score_record() for the actual scoring math. Kept as the
    default/fallback so the pipeline works standalone without network."""
    feature = load_hazard_geometry(event.payload.get("hazard_id", "HAZARD-77"))
    props = feature["properties"]
    record = {
        "hazard_id": props["hazard_id"],
        "hazard_type": "wildfire",
        "severity": props["severity"],
        "probability": props["probability"],
        "observed_at": props["observed_at"],
        "geometry": shape(feature["geometry"]),
        "data_source": "sample_fallback",
    }
    return score_record(record, event.event_id, extent_multiplier)


def score_record(record: dict, source_event_id: str, extent_multiplier: float = 1.0) -> tuple[RiskObject, dict]:
    """LIVE-COMPATIBLE path: scores a hazard record that's already been built
    — whether from the offline sample (score_hazard, above) or from a real
    live NWS alert (services/earth_risk/live_hazard_feed.get_live_hazard(),
    which returns a record in this exact shape). This is the single place
    severity/probability -> risk-score conversion happens, so live and
    sample hazards are scored identically (spec §7.5)."""
    severity_map = {"LOW": 0.3, "MEDIUM": 0.55, "HIGH": 0.85}
    risk_score = min(severity_map.get(record["severity"], 0.5) * extent_multiplier, 0.99)

    geom = record["geometry"]
    if extent_multiplier != 1.0:
        # Grow/shrink the hazard footprint around its centroid — a simple,
        # explainable proxy for "the fire expands by X%" scenarios (§7.7).
        geom = geom.buffer(0)  # normalize
        centroid = geom.centroid
        scale = extent_multiplier ** 0.5
        geom = _scale_around_point(geom, centroid, scale)

    hazard_record = {
        **record,
        "geometry": geom,
        "extent_multiplier": extent_multiplier,
        "data_source": record.get("data_source", "sample_fallback"),
    }

    risk_obj = RiskObject(
        entity_id=record["hazard_id"],
        risk_type=record.get("hazard_type", "wildfire"),
        risk_score=round(risk_score, 4),
        confidence=round(record["probability"], 4),
        status="HIGH" if risk_score >= 0.75 else "MEDIUM" if risk_score >= 0.45 else "LOW",
        top_evidence=[f"severity_{record['severity']}", f"extent_x{extent_multiplier}", f"source_{hazard_record['data_source']}"],
        model_version=MODEL_VERSION,
        source_event_id=source_event_id,
    )
    return risk_obj, hazard_record


def _scale_around_point(geom, point, scale: float):
    from shapely.affinity import scale as shapely_scale

    return shapely_scale(geom, xfact=scale, yfact=scale, origin=point)
