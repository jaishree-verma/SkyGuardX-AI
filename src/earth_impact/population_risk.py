"""
Population Risk Impact Module
Overlays hazard polygons onto population raster data (e.g. WorldPop) using rasterio,
with tabular density estimation fallback.
"""

from __future__ import annotations
import logging
from pathlib import Path
from typing import Dict, Any, Optional, Tuple, Union

import numpy as np
import geopandas as gpd
import rasterio
from rasterio.transform import from_bounds
from rasterio.mask import mask

logger = logging.getLogger("SkyGuardX.earth_impact.population")


def create_synthetic_population_raster(
    output_path: Union[str, Path],
    bbox: Tuple[float, float, float, float],
    base_density: float = 1200.0,
    rows: int = 50,
    cols: int = 50,
) -> Path:
    """
    Generate a calibrated synthetic WorldPop-style population GeoTIFF raster.
    Useful for testing and local demonstrations without downloading multi-GB datasets.
    """
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)

    min_lon, min_lat, max_lon, max_lat = bbox
    transform = from_bounds(min_lon, min_lat, max_lon, max_lat, cols, rows)

    # Generate synthetic population grid with density gradients
    y, x = np.ogrid[:rows, :cols]
    dist_from_center = np.sqrt((x - cols / 2) ** 2 + (y - rows / 2) ** 2)
    pop_grid = (base_density * np.exp(-dist_from_center / (cols / 3.0))).astype(np.float32)

    with rasterio.open(
        str(path),
        "w",
        driver="GTiff",
        height=rows,
        width=cols,
        count=1,
        dtype=pop_grid.dtype,
        crs="EPSG:4326",
        transform=transform,
        nodata=-9999.0,
    ) as dst:
        dst.write(pop_grid, 1)

    return path


def estimate_affected_population_raster(
    hazard_gdf: gpd.GeoDataFrame,
    raster_path: Union[str, Path],
) -> Dict[str, Any]:
    """
    Overlay hazard polygon onto population density raster using rasterio.mask.
    Extracts affected pixels and aggregates population statistics.
    """
    path = Path(raster_path)
    if not path.exists():
        raise FileNotFoundError(f"Population raster not found at {path}")

    # Ensure hazard polygon is in raster CRS
    with rasterio.open(str(path)) as src:
        raster_crs = src.crs
        hazard_reproj = hazard_gdf.to_crs(raster_crs)
        geometries = [geom for geom in hazard_reproj.geometry if geom.is_valid]

        masked_data, out_transform = mask(src, geometries, crop=True, nodata=-9999.0)
        nodata_val = src.nodata if src.nodata is not None else -9999.0

    valid_pixels = masked_data[(masked_data != nodata_val) & (masked_data >= 0)]

    if len(valid_pixels) == 0:
        total_pop = 0.0
        max_density = 0.0
        mean_density = 0.0
    else:
        total_pop = float(np.sum(valid_pixels))
        max_density = float(np.max(valid_pixels))
        mean_density = float(np.mean(valid_pixels))

    return {
        "method": "RASTERIO_MASK",
        "raster_source": path.name,
        "affected_population": int(round(total_pop)),
        "max_cell_population": round(max_density, 2),
        "mean_cell_population": round(mean_density, 2),
        "affected_cells_count": int(len(valid_pixels)),
    }


def estimate_affected_population_density(
    hazard_gdf: gpd.GeoDataFrame,
    density_per_sq_km: float = 1250.0,
) -> Dict[str, Any]:
    """
    Tabular estimation: computes exact hazard area in km^2 and estimates population.
    """
    gdf_proj = hazard_gdf.to_crs(epsg=3857)
    total_area_sq_km = float(gdf_proj.geometry.area.sum() / 1_000_000.0)
    estimated_pop = int(round(total_area_sq_km * density_per_sq_km))

    return {
        "method": "TABULAR_DENSITY_ESTIMATION",
        "hazard_area_sq_km": round(total_area_sq_km, 3),
        "assumed_density_per_sq_km": density_per_sq_km,
        "affected_population": estimated_pop,
    }


def estimate_population_risk(
    hazard_gdf: gpd.GeoDataFrame,
    raster_path: Optional[Union[str, Path]] = None,
    default_density: float = 1250.0,
) -> Dict[str, Any]:
    """
    Consolidated population impact estimator.
    Uses rasterio if raster exists, else falls back to geospatial density model.
    """
    if raster_path and Path(str(raster_path)).exists():
        return estimate_affected_population_raster(hazard_gdf, raster_path)
    return estimate_affected_population_density(hazard_gdf, density_per_sq_km=default_density)
