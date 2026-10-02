"""
Infrastructure & Road Network Overlay Module
Uses osmnx to fetch road networks inside hazard bbox and performs spatial overlay.
"""

from __future__ import annotations
import logging
from pathlib import Path
from typing import Tuple, Dict, Any, Optional

import geopandas as gpd
import osmnx as ox
from shapely.geometry import box

logger = logging.getLogger("SkyGuardX.earth_impact.infrastructure")

# Built-in fallback sample path
FALLBACK_ROADS_PATH = Path(r"c:\jaishree_projects\SkyGuardX-AI\data\sample\la_roads_facilities.geojson")


def fetch_road_network_bbox(
    bbox: Tuple[float, float, float, float],
    network_type: str = "drive",
    timeout: int = 15,
) -> gpd.GeoDataFrame:
    """
    Fetch road network inside bounding box (min_lon, min_lat, max_lon, max_lat) using OSMnx.
    Falls back gracefully to local sample data if Overpass is unreachable.
    """
    ox.settings.timeout = timeout
    try:
        logger.info(f"Querying OpenStreetMap via OSMnx for bbox: {bbox}")
        # OSMnx 2.0+ accepts bbox=(left, bottom, right, top)
        G = ox.graph_from_bbox(bbox=bbox, network_type=network_type)
        edges_gdf = ox.graph_to_gdfs(G, nodes=False, edges=True)
        if len(edges_gdf) > 0:
            if edges_gdf.crs is None:
                edges_gdf = edges_gdf.set_crs(epsg=4326)
            else:
                edges_gdf = edges_gdf.to_crs(epsg=4326)
            return edges_gdf
    except Exception as exc:
        logger.warning(f"OSMnx graph fetch failed: {exc}. Using fallback road dataset.")

    # Fallback: load local sample GeoJSON or generate synthetic grid
    if FALLBACK_ROADS_PATH.exists():
        raw_gdf = gpd.read_file(str(FALLBACK_ROADS_PATH))
        if raw_gdf.crs is None:
            raw_gdf = raw_gdf.set_crs(epsg=4326)
        # Filter for line features within bbox
        bbox_geom = box(*bbox)
        clipped = raw_gdf[raw_gdf.geometry.intersects(bbox_geom)]
        if len(clipped) > 0:
            return clipped
        return raw_gdf

    # Synthetic fallback road lines if no sample file
    from shapely.geometry import LineString
    min_lon, min_lat, max_lon, max_lat = bbox
    lines = [
        LineString([(min_lon, (min_lat + max_lat) / 2), (max_lon, (min_lat + max_lat) / 2)]),
        LineString([((min_lon + max_lon) / 2, min_lat), ((min_lon + max_lon) / 2, max_lat)]),
    ]
    return gpd.GeoDataFrame(
        [
            {"name": "Interstate Route 1", "highway": "primary", "length": 5000.0},
            {"name": "Canyon Road", "highway": "secondary", "length": 3200.0},
        ],
        geometry=lines,
        crs="EPSG:4326",
    )


def calculate_road_disruptions(
    hazard_gdf: gpd.GeoDataFrame,
    roads_gdf: gpd.GeoDataFrame,
) -> Dict[str, Any]:
    """
    Perform spatial intersection (geopandas.overlay) between road network and hazard polygon.
    Computes exact disrupted road segments and total kilometers disrupted.
    """
    # Align CRS
    if hazard_gdf.crs != roads_gdf.crs:
        roads_gdf = roads_gdf.to_crs(hazard_gdf.crs)

    # Perform spatial overlay intersection
    intersections = gpd.overlay(roads_gdf, hazard_gdf, how="intersection")

    # Project to EPSG:3857 to measure accurate metric lengths
    intersections_proj = intersections.to_crs(epsg=3857)
    intersections["disrupted_length_km"] = intersections_proj.geometry.length / 1000.0

    total_disrupted_km = float(intersections["disrupted_length_km"].sum())
    segment_count = len(intersections)

    # Breakdown by highway category if present (handling list values from OSMnx)
    highway_breakdown = {}
    if "highway" in intersections.columns:
        intersections["highway_clean"] = intersections["highway"].apply(
            lambda h: ", ".join(h) if isinstance(h, list) else str(h)
        )
        for hw_type, group in intersections.groupby("highway_clean"):
            highway_breakdown[str(hw_type)] = {
                "segments": len(group),
                "total_km": round(float(group["disrupted_length_km"].sum()), 3),
            }

    return {
        "total_disrupted_km": round(total_disrupted_km, 3),
        "disrupted_segments_count": segment_count,
        "highway_breakdown": highway_breakdown,
        "disrupted_roads_gdf": intersections,
    }
