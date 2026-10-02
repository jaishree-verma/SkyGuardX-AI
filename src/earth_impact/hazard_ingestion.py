"""
Spatial Hazard Ingestion Module
Uses geopandas and shapely to parse, validate, and compute bounding geometries for hazards.
"""

from __future__ import annotations
import json
import logging
from pathlib import Path
from typing import Union, Dict, Any, Tuple, List

import geopandas as gpd
from shapely.geometry import shape, Polygon, MultiPolygon
from shapely.validation import make_valid

logger = logging.getLogger("SkyGuardX.earth_impact.hazard")


def load_hazard_polygon(source: Union[str, Path, Dict[str, Any]]) -> gpd.GeoDataFrame:
    """
    Load a hazard GeoJSON (file path, raw JSON string, or dict) into a validated GeoDataFrame.
    Ensures CRS is EPSG:4326 and validates geometry with Shapely.
    """
    if isinstance(source, (str, Path)) and Path(str(source)).exists():
        gdf = gpd.read_file(str(source))
    elif isinstance(source, str):
        data = json.loads(source)
        gdf = gpd.GeoDataFrame.from_features(data.get("features", [data]))
    elif isinstance(source, dict):
        if "features" in source:
            gdf = gpd.GeoDataFrame.from_features(source["features"])
        elif "geometry" in source:
            geom = shape(source["geometry"])
            gdf = gpd.GeoDataFrame([source.get("properties", {})], geometry=[geom])
        else:
            raise ValueError("Invalid GeoJSON dict structure.")
    else:
        raise ValueError(f"Unsupported source format: {type(source)}")

    if gdf.crs is None:
        gdf = gdf.set_crs(epsg=4326)
    else:
        gdf = gdf.to_crs(epsg=4326)

    # Ensure validity of geometries
    gdf["geometry"] = gdf["geometry"].apply(lambda g: make_valid(g) if not g.is_valid else g)

    # Compute area in square kilometers using projected CRS (EPSG:3857)
    gdf_proj = gdf.to_crs(epsg=3857)
    gdf["area_sq_km"] = gdf_proj.geometry.area / 1_000_000.0

    return gdf


def create_hazard_polygon(
    coordinates: List[Tuple[float, float]],
    hazard_id: str = "HAZARD-001",
    hazard_type: str = "wildfire",
    severity: str = "HIGH",
    probability: float = 0.85,
) -> gpd.GeoDataFrame:
    """
    Create a hazard GeoDataFrame from a list of (lon, lat) vertex tuples.
    """
    poly = Polygon(coordinates)
    if not poly.is_valid:
        poly = make_valid(poly)

    gdf = gpd.GeoDataFrame(
        [
            {
                "hazard_id": hazard_id,
                "hazard_type": hazard_type,
                "severity": severity,
                "probability": probability,
            }
        ],
        geometry=[poly],
        crs="EPSG:4326",
    )
    gdf_proj = gdf.to_crs(epsg=3857)
    gdf["area_sq_km"] = gdf_proj.geometry.area / 1_000_000.0
    return gdf


def get_hazard_bbox(gdf: gpd.GeoDataFrame) -> Tuple[float, float, float, float]:
    """
    Get bounding box (min_lon, min_lat, max_lon, max_lat) for OSMnx compatibility.
    """
    bounds = gdf.total_bounds
    return (float(bounds[0]), float(bounds[1]), float(bounds[2]), float(bounds[3]))
