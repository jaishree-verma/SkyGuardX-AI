"""
Entrypoint demonstration for Layer 1: Space Intelligence
Propagates real orbits, computes collision proximity alerts, and pulls space weather feeds.
"""

import sys
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

import json
from datetime import datetime, timezone
from space_intelligence.tle_propagator import (
    fetch_celestrak_tle,
    propagate_orbit,
    propagate_objects,
    FALLBACK_TLES,
)
from space_intelligence.collision_risk import detect_conjunctions
from space_intelligence.space_weather import get_space_weather_summary


def main():
    print("=" * 70)
    print("[LAYER 1] SKYGUARD-X: SPACE INTELLIGENCE ENGINE")
    print("=" * 70)

    # 1. Fetch & Propagate Target Satellites
    print("\n[1] Orbit Propagation via Skyfield & SGP4:")
    satellites = []
    # ISS
    iss_tle = fetch_celestrak_tle(25544)
    iss = propagate_orbit(iss_tle[0], iss_tle[1], iss_tle[2])
    satellites.append(iss)
    print(f" -> {iss.name} (NORAD {iss.catalog_id}):")
    print(f"    Geocentric (X, Y, Z): ({iss.x_km:.2f}, {iss.y_km:.2f}, {iss.z_km:.2f}) km")
    print(f"    Subpoint: Lat {iss.latitude_deg:.2f} deg, Lon {iss.longitude_deg:.2f} deg, Alt {iss.altitude_km:.2f} km")
    print(f"    Velocity: ({iss.vx_km_s:.2f}, {iss.vy_km_s:.2f}, {iss.vz_km_s:.2f}) km/s | Speed: {iss.speed_km_s:.2f} km/s")

    # Hubble Space Telescope
    hst_tle = fetch_celestrak_tle(20580)
    hst = propagate_orbit(hst_tle[0], hst_tle[1], hst_tle[2])
    satellites.append(hst)
    print(f" -> {hst.name} (NORAD {hst.catalog_id}):")
    print(f"    Geocentric (X, Y, Z): ({hst.x_km:.2f}, {hst.y_km:.2f}, {hst.z_km:.2f}) km")
    print(f"    Subpoint: Lat {hst.latitude_deg:.2f} deg, Lon {hst.longitude_deg:.2f} deg, Alt {hst.altitude_km:.2f} km")

    # Fengyun-1C Debris
    debris = propagate_orbit(FALLBACK_TLES[1][0], FALLBACK_TLES[1][1], FALLBACK_TLES[1][2])
    satellites.append(debris)
    print(f" -> {debris.name} (NORAD {debris.catalog_id}):")
    print(f"    Geocentric (X, Y, Z): ({debris.x_km:.2f}, {debris.y_km:.2f}, {debris.z_km:.2f}) km")

    # 2. Collision Risk & Proximity Detection
    print("\n[2] Proximity & Conjunction Analysis (Euclidean Distance):")
    alerts = detect_conjunctions(satellites, threshold_km=10000.0)
    print(f" -> Evaluated {len(satellites)} objects in space catalog | Alerts flagged: {len(alerts)}")
    for alert in alerts:
        print(f"    * [{alert.risk_level}] {alert.obj1_name} <-> {alert.obj2_name}: "
              f"Distance = {alert.distance_km:.2f} km | Rel Speed = {alert.relative_velocity_km_s:.2f} km/s")

    # 3. NOAA Space Weather Feed
    print("\n[3] NOAA SWPC Live Space Weather Feed:")
    sw = get_space_weather_summary()
    print(f" -> Planetary Kp Index: {sw['latest_kp_index']} ({sw['status']})")
    print(f" -> F10.7 Solar Radio Flux: {sw['f107_solar_flux']} sfu (Atmospheric Drag: {sw['atmospheric_drag_risk']})")
    print(f" -> Active NOAA SWPC Alerts: {sw['active_alerts_count']}")
    if sw['recent_alerts']:
        print(f"    Recent advisory: {sw['recent_alerts'][0].get('message', '')[:100]}...")

    print("\n" + "=" * 70)
    print("[SUCCESS] Layer 1 Space Intelligence demonstration completed.")
    print("=" * 70)


if __name__ == "__main__":
    main()
