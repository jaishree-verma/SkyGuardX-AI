"""
Entrypoint demonstration for Layer 2: Earth Impact
Loads hazard polygons, performs OSM road network intersection, and evaluates population risk.
"""

import sys
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from pathlib import Path
from earth_impact.hazard_ingestion import load_hazard_polygon, get_hazard_bbox
from earth_impact.infrastructure_overlay import (
    fetch_road_network_bbox,
    calculate_road_disruptions,
)
from earth_impact.population_risk import (
    create_synthetic_population_raster,
    estimate_population_risk,
)


def main():
    print("=" * 70)
    print("[LAYER 2] SKYGUARD-X: EARTH IMPACT ENGINE")
    print("=" * 70)

    # 1. Hazard Ingestion
    sample_hazard_path = Path(r"c:\jaishree_projects\SkyGuardX-AI\data\sample\la_wildfire_area.geojson")
    print(f"\n[1] Spatial Hazard Ingestion from {sample_hazard_path.name}:")
    hazard_gdf = load_hazard_polygon(sample_hazard_path)
    bbox = get_hazard_bbox(hazard_gdf)
    area = hazard_gdf["area_sq_km"].iloc[0]
    print(f" -> Hazard ID: {hazard_gdf['hazard_id'].iloc[0]} | Severity: {hazard_gdf['severity'].iloc[0]}")
    print(f" -> Surface Area: {area:.2f} sq km")
    print(f" -> Bounding Box (min_lon, min_lat, max_lon, max_lat): {bbox}")

    # 2. OSM Road Network Overlay
    print("\n[2] Infrastructure & Road Network Overlay via OSMnx:")
    roads_gdf = fetch_road_network_bbox(bbox, network_type="drive", timeout=12)
    print(f" -> Extracted road segments in bounding box: {len(roads_gdf)}")

    disruptions = calculate_road_disruptions(hazard_gdf, roads_gdf)
    print(f" -> Total Disrupted Road Length: {disruptions['total_disrupted_km']:.2f} km")
    print(f" -> Intersected Disrupted Road Segments: {disruptions['disrupted_segments_count']}")
    if disruptions["highway_breakdown"]:
        print(" -> Disrupted segments by road type:")
        for hw, data in disruptions["highway_breakdown"].items():
            print(f"    * {hw}: {data['segments']} segment(s), {data['total_km']} km")

    # 3. Population Risk Impact
    print("\n[3] Population Risk Impact Evaluation via Rasterio:")
    raster_path = Path(r"c:\jaishree_projects\SkyGuardX-AI\data\sample\synth_population.tif")
    create_synthetic_population_raster(raster_path, bbox=bbox, base_density=1400.0)

    pop_impact = estimate_population_risk(hazard_gdf, raster_path=raster_path)
    print(f" -> Assessment Method: {pop_impact['method']}")
    print(f" -> Total Affected Population: {pop_impact['affected_population']:,} residents")
    print(f" -> Max Population Density Cell: {pop_impact.get('max_cell_population', 0):.2f}")
    print(f" -> Mean Population Density Cell: {pop_impact.get('mean_cell_population', 0):.2f}")

    print("\n" + "=" * 70)
    print("[SUCCESS] Layer 2 Earth Impact demonstration completed.")
    print("=" * 70)


if __name__ == "__main__":
    main()
