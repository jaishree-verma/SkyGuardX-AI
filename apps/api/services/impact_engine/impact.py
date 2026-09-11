"""
Impact Engine — spec §7.5 (last two bullets) and §6.5 `impact` table.

Intersects hazard geometry against the real roads/facilities/population-cell
layer (data/sample/la_roads_facilities.geojson) using shapely spatial
predicates. This is what turns "there is a fire" into "these roads, this
hospital, this many people."
"""
from __future__ import annotations

import json
import os

from shapely.geometry import shape

from core.events import ImpactObject

FACILITIES_GEOJSON_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "..", "..", "data", "sample", "la_roads_facilities.geojson"
)

# Distance (in degrees, ~ proportional to km at this latitude) within which a
# road/facility/population cell is considered "exposed" even if not directly
# intersected — real hazard impact isn't limited to the exact fire perimeter
# (smoke, evacuation zones, access disruption).
PROXIMITY_BUFFER_DEG = 0.01  # ~1.1 km


def _load_sample_assets() -> list[dict]:
    with open(FACILITIES_GEOJSON_PATH) as f:
        fc = json.load(f)
    return fc["features"]


def compute_impact(hazard_record: dict, assets: list[dict] | None = None) -> ImpactObject:
    """`assets` lets the caller pass LIVE OpenStreetMap features (see
    services/impact_engine/live_geo.py) in the exact same GeoJSON-feature
    shape as the bundled sample file. If omitted, falls back to the offline
    sample so this function works standalone/in tests without network."""
    hazard_geom = hazard_record["geometry"]
    buffered = hazard_geom.buffer(PROXIMITY_BUFFER_DEG)

    affected_roads: list[str] = []
    affected_facilities: list[dict] = []
    affected_population = 0
    total_population = 0
    accessible_roads = 0
    total_roads = 0

    for feature in (assets if assets is not None else _load_sample_assets()):
        props = feature["properties"]
        geom = shape(feature["geometry"])
        exposed = buffered.intersects(geom)

        if props["type"] == "road":
            total_roads += 1
            if exposed:
                affected_roads.append(f"{props['asset_id']} ({props['name']})")
            else:
                accessible_roads += 1

        elif props["type"] in ("hospital", "fire_station"):
            if exposed:
                affected_facilities.append({
                    "asset_id": props["asset_id"],
                    "name": props["name"],
                    "type": props["type"],
                    "status": "EXPOSED",
                })

        elif props["type"] == "population_cell":
            total_population += props["population"]
            if exposed:
                affected_population += props["population"]

    accessibility_index = round(accessible_roads / total_roads, 4) if total_roads else 1.0

    return ImpactObject(
        hazard_id=hazard_record["hazard_id"],
        affected_population=affected_population,
        affected_roads=affected_roads,
        affected_facilities=affected_facilities,
        accessibility_index=accessibility_index,
    )
