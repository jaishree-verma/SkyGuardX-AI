"""
Unit tests for Layer 1: Space Intelligence
"""

import pytest
from datetime import datetime, timezone
from src.space_intelligence.tle_propagator import (
    propagate_orbit,
    parse_tle_dataset,
    FALLBACK_TLES,
    SpaceObject,
)
from src.space_intelligence.collision_risk import (
    compute_euclidean_distance,
    calculate_relative_velocity,
    detect_conjunctions,
    classify_risk_level,
)
from src.space_intelligence.space_weather import (
    get_space_weather_summary,
    fetch_solar_flux_data,
)


def test_orbit_propagation():
    """Verify orbit propagation outputs valid 3D Cartesian coords and geospatial subpoint."""
    name, l1, l2 = FALLBACK_TLES[0]
    sat = propagate_orbit(name, l1, l2)

    assert isinstance(sat, SpaceObject)
    assert sat.name == name
    assert sat.catalog_id == "25544"
    assert -90.0 <= sat.latitude_deg <= 90.0
    assert -180.0 <= sat.longitude_deg <= 180.0
    assert sat.altitude_km > 100.0  # LEO altitude
    assert sat.speed_km_s > 5.0    # Realistic orbital velocity ~7.5 km/s


def test_euclidean_distance():
    """Test 3D Euclidean distance calculation."""
    p1 = (0.0, 0.0, 0.0)
    p2 = (3.0, 4.0, 0.0)
    assert compute_euclidean_distance(p1, p2) == 5.0

    p3 = (1.0, 2.0, 2.0)
    assert compute_euclidean_distance(p1, p3) == 3.0


def test_conjunction_detection():
    """Test collision proximity alert triggering."""
    name1, l1, l2 = FALLBACK_TLES[0]
    sat1 = propagate_orbit(name1, l1, l2)

    # Synthetic object placed 3 km away from sat1
    sat2 = SpaceObject(
        name="DEBRIS-NEARBY",
        catalog_id="99999",
        object_type="DEBRIS",
        epoch=datetime.now(timezone.utc).isoformat(),
        x_km=sat1.x_km + 1.0,
        y_km=sat1.y_km + 2.0,
        z_km=sat1.z_km + 2.0,
        vx_km_s=sat1.vx_km_s + 0.1,
        vy_km_s=sat1.vy_km_s,
        vz_km_s=sat1.vz_km_s,
        latitude_deg=sat1.latitude_deg,
        longitude_deg=sat1.longitude_deg,
        altitude_km=sat1.altitude_km,
    )

    alerts = detect_conjunctions([sat1, sat2], threshold_km=10.0)
    assert len(alerts) == 1
    assert alerts[0].distance_km == 3.0
    assert alerts[0].risk_level == "HIGH"


def test_space_weather_summary():
    """Test space weather summary generation."""
    summary = get_space_weather_summary()
    assert "status" in summary
    assert "latest_kp_index" in summary
    assert "f107_solar_flux" in summary
    assert summary["f107_solar_flux"] > 0
