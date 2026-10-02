"""
Unit tests for Layer 2: Earth Impact
"""

import pytest
from pathlib import Path
from shapely.geometry import box
import geopandas as gpd

from src.earth_impact.hazard_ingestion import (
    load_hazard_polygon,
    create_hazard_polygon,
    get_hazard_bbox,
)
from src.earth_impact.infrastructure_overlay import (
    calculate_road_disruptions,
)
from src.earth_impact.population_risk import (
    create_synthetic_population_raster,
    estimate_affected_population_raster,
    estimate_affected_population_density,
)


def test_hazard_ingestion():
    """Verify hazard polygon loading and metric area calculation."""
    sample_file = Path(r"c:\jaishree_projects\SkyGuardX-AI\data\sample\la_wildfire_area.geojson")
    gdf = load_hazard_polygon(sample_file)

    assert not gdf.empty
    assert gdf.crs.to_epsg() == 4326
    assert "area_sq_km" in gdf.columns
    assert gdf["area_sq_km"].iloc[0] > 0.0

    bbox = get_hazard_bbox(gdf)
    assert len(bbox) == 4
    assert bbox[0] < bbox[2]  # minx < maxx
    assert bbox[1] < bbox[3]  # miny < maxy


def test_road_disruptions_overlay():
    """Verify geopandas spatial overlay intersection calculation on roads."""
    # Hazard box (-118.58 to -118.55, 34.05 to 34.07)
    hazard = create_hazard_polygon(
        [
            (-118.58, 34.05),
            (-118.55, 34.05),
            (-118.55, 34.07),
            (-118.58, 34.07),
            (-118.58, 34.05),
        ]
    )

    # Road line intersecting hazard
    from shapely.geometry import LineString
    roads = gpd.GeoDataFrame(
        [{"name": "Highway 1", "highway": "primary"}],
        geometry=[LineString([(-118.60, 34.06), (-118.54, 34.06)])],
        crs="EPSG:4326",
    )

    result = calculate_road_disruptions(hazard, roads)
    assert result["disrupted_segments_count"] == 1
    assert result["total_disrupted_km"] > 0.0


def test_population_risk_rasterio(tmp_path):
    """Verify rasterio population estimation using masked raster geometry."""
    bbox = (-118.6, 34.0, -118.5, 34.1)
    raster_file = tmp_path / "test_worldpop.tif"
    create_synthetic_population_raster(raster_file, bbox=bbox, base_density=1000.0)

    # Create polygon inside the raster
    hazard = create_hazard_polygon(
        [
            (-118.58, 34.02),
            (-118.52, 34.02),
            (-118.52, 34.08),
            (-118.58, 34.08),
            (-118.58, 34.02),
        ]
    )

    impact = estimate_affected_population_raster(hazard, raster_file)
    assert impact["affected_population"] > 0
    assert impact["affected_cells_count"] > 0
