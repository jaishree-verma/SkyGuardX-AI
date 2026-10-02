"""
Layer 2: Earth Impact 🌍
Spatial hazard ingestion, OSM infrastructure overlays, and population risk evaluation.
"""

from .hazard_ingestion import (
    load_hazard_polygon,
    create_hazard_polygon,
    get_hazard_bbox,
)
from .infrastructure_overlay import (
    fetch_road_network_bbox,
    calculate_road_disruptions,
)
from .population_risk import (
    create_synthetic_population_raster,
    estimate_affected_population_raster,
    estimate_affected_population_density,
    estimate_population_risk,
)

__all__ = [
    "load_hazard_polygon",
    "create_hazard_polygon",
    "get_hazard_bbox",
    "fetch_road_network_bbox",
    "calculate_road_disruptions",
    "create_synthetic_population_raster",
    "estimate_affected_population_raster",
    "estimate_affected_population_density",
    "estimate_population_risk",
]
