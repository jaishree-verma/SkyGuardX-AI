"""
LIVE geography feed — OpenStreetMap via the Overpass API.

Real, free, no-API-key infrastructure data: for a given bounding box (e.g.
drawn around wherever the live hazard actually is), this pulls real road
centerlines, hospitals and fire stations directly from OpenStreetMap — the
same base map data used by countless production emergency-response tools.
https://wiki.openstreetmap.org/wiki/Overpass_API

Not exercised inside this sandbox (overpass-api.de is not on the sandbox's
outbound allowlist) but is real, correctly-shaped code against Overpass QL's
documented query/response contract.
"""
from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger("SkyGuard-X.impact_engine.live_geo")

OVERPASS_URL = "https://overpass-api.de/api/interpreter"


def _build_query(min_lat: float, min_lon: float, max_lat: float, max_lon: float) -> str:
    bbox = f"{min_lat},{min_lon},{max_lat},{max_lon}"
    # Overpass QL: primary roads (for impact/accessibility) + hospitals + fire
    # stations + a coarse population proxy (residential landuse polygons,
    # since Overpass has no direct population counts).
    return f"""
    [out:json][timeout:20];
    (
      way["highway"~"^(motorway|trunk|primary|secondary)$"]({bbox});
      node["amenity"="hospital"]({bbox});
      way["amenity"="hospital"]({bbox});
      node["amenity"="fire_station"]({bbox});
      way["landuse"="residential"]({bbox});
    );
    out geom;
    """


async def fetch_osm_assets(min_lat: float, min_lon: float, max_lat: float, max_lon: float, timeout_s: float = 20.0) -> list[dict[str, Any]]:
    """Real call to Overpass. Returns a list of GeoJSON-like features in the
    exact shape data/sample/la_roads_facilities.geojson uses, so
    impact_engine.impact.compute_impact() consumes live and sample data
    identically. Returns [] (never raises) on any failure."""
    try:
        import httpx

        query = _build_query(min_lat, min_lon, max_lat, max_lon)
        async with httpx.AsyncClient(timeout=timeout_s) as client:
            resp = await client.post(OVERPASS_URL, data={"data": query})
            resp.raise_for_status()
        data = resp.json()
        features = [f for el in data.get("elements", []) for f in _element_to_features(el)]
        logger.info("LIVE OSM fetch: %d asset feature(s) in bbox (%.3f,%.3f)-(%.3f,%.3f)", len(features), min_lat, min_lon, max_lat, max_lon)
        return features
    except Exception as exc:
        logger.warning("fetch_osm_assets failed: %s (will use offline sample roads/facilities)", exc)
        return []


def _element_to_features(el: dict[str, Any]) -> list[dict[str, Any]]:
    tags = el.get("tags", {})
    out: list[dict[str, Any]] = []

    if el.get("type") == "way" and "geometry" in el:
        coords = [[pt["lon"], pt["lat"]] for pt in el["geometry"]]
        if "highway" in tags:
            out.append({
                "type": "Feature",
                "properties": {
                    "asset_id": f"OSM-R-{el['id']}",
                    "type": "road",
                    "name": tags.get("name", tags.get("highway", "unnamed road")),
                    "capacity_vph": {"motorway": 3000, "trunk": 2200, "primary": 1800, "secondary": 1200}.get(tags.get("highway"), 1000),
                },
                "geometry": {"type": "LineString", "coordinates": coords},
            })
        elif tags.get("amenity") == "hospital":
            out.append(_facility_feature(f"OSM-F-{el['id']}", "hospital", tags, coords[0] if coords else None))
        elif tags.get("landuse") == "residential" and len(coords) >= 3:
            # Coarse population proxy from residential-area footprint. Real
            # population numbers would come from census/WorldPop rasters —
            # documented as an approximation here, not claimed as exact.
            centroid = _centroid(coords)
            approx_pop = int(_polygon_area_km2(coords) * 2500)  # ~2500 people/km^2, a generic urban-residential density assumption
            out.append({
                "type": "Feature",
                "properties": {"asset_id": f"OSM-POP-{el['id']}", "type": "population_cell", "name": tags.get("name", "residential area"), "population": approx_pop, "source": "osm_residential_landuse_density_estimate"},
                "geometry": {"type": "Point", "coordinates": centroid},
            })

    elif el.get("type") == "node":
        coord = [el["lon"], el["lat"]]
        if tags.get("amenity") == "hospital":
            out.append(_facility_feature(f"OSM-F-{el['id']}", "hospital", tags, coord))
        elif tags.get("amenity") == "fire_station":
            out.append(_facility_feature(f"OSM-F-{el['id']}", "fire_station", tags, coord))

    return out


def _facility_feature(asset_id: str, ftype: str, tags: dict, coord: list[float] | None) -> dict[str, Any]:
    return {
        "type": "Feature",
        "properties": {"asset_id": asset_id, "type": ftype, "name": tags.get("name", ftype.replace("_", " ").title())},
        "geometry": {"type": "Point", "coordinates": coord or [0.0, 0.0]},
    }


def _centroid(coords: list[list[float]]) -> list[float]:
    xs = [c[0] for c in coords]
    ys = [c[1] for c in coords]
    return [sum(xs) / len(xs), sum(ys) / len(ys)]


def _polygon_area_km2(coords: list[list[float]]) -> float:
    """Rough shoelace-formula area in km^2 (equirectangular approximation —
    fine at city scale, not meant for large-area precision)."""
    import math

    if len(coords) < 3:
        return 0.0
    lat0 = coords[0][1]
    km_per_deg_lat = 111.32
    km_per_deg_lon = 111.32 * math.cos(math.radians(lat0))
    pts = [(c[0] * km_per_deg_lon, c[1] * km_per_deg_lat) for c in coords]
    area = 0.0
    for i in range(len(pts)):
        x1, y1 = pts[i]
        x2, y2 = pts[(i + 1) % len(pts)]
        area += x1 * y2 - x2 * y1
    return abs(area) / 2.0
