"""
LIVE Space-hazard feed — NASA Near Earth Object Web Service (NeoWs).

This module fetches real-time data on asteroids passing near Earth.
https://api.nasa.gov/
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone, timedelta
from typing import Any

logger = logging.getLogger("SkyGuard-X.space_risk.live_asteroids")

# Using DEMO_KEY for NASA API. For production, a real API key should be used.
NEOWS_URL = "https://api.nasa.gov/neo/rest/v1/feed"
DEMO_KEY = "DEMO_KEY"

async def fetch_near_earth_objects(timeout_s: float = 6.0) -> list[dict[str, Any]]:
    """Real call to NASA NeoWs to get today's close approaches."""
    try:
        import httpx

        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        params = {
            "start_date": today,
            "end_date": today,
            "api_key": DEMO_KEY
        }
        async with httpx.AsyncClient(timeout=timeout_s) as client:
            resp = await client.get(
                NEOWS_URL,
                params=params,
                headers={"User-Agent": "SkyGuard-X-NASA-NeoWs-Plugin"},
            )
            resp.raise_for_status()
        data = resp.json()
        near_earth_objects = data.get("near_earth_objects", {}).get(today, [])
        logger.info("LIVE NeoWs fetch: %d near earth object(s) today", len(near_earth_objects))
        return near_earth_objects
    except Exception as exc:
        logger.warning("fetch_near_earth_objects failed: %s (will use offline sample if available)", exc)
        return []

def neo_to_hazard_record(neo: dict[str, Any]) -> dict[str, Any] | None:
    """Converts a NeoWs asteroid record into our internal hazard record shape."""
    try:
        from shapely.geometry import Point
        
        # We don't have exact lat/lon for the approach, but we can simulate a Point
        # or just provide a dummy geometry for the sake of the system if needed.
        # Asteroid approaches are a global/space threat, so setting to (0,0) for now.
        geom = Point(0, 0)
    except Exception as exc:
        logger.warning("could not create NeoWs geometry: %s", exc)
        return None

    # Calculate severity based on estimated diameter
    diameter_max = neo.get("estimated_diameter", {}).get("meters", {}).get("estimated_diameter_max", 0)
    if diameter_max > 1000:
        severity = "HIGH"
    elif diameter_max > 100:
        severity = "MEDIUM"
    else:
        severity = "LOW"

    is_potentially_hazardous = neo.get("is_potentially_hazardous_asteroid", False)
    probability = 0.9 if is_potentially_hazardous else 0.3

    return {
        "hazard_id": neo.get("id", "neows-unknown"),
        "hazard_type": "asteroid_approach",
        "severity": severity,
        "probability": probability,
        "observed_at": datetime.now(timezone.utc).isoformat(),
        "geometry": geom,
        "extent_multiplier": 1.0,
        "data_source": "live_nasa_neows",
        "headline": f"Near Earth Object: {neo.get('name')}",
        "area_desc": "Global / Space",
        "expires": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
    }

async def get_live_asteroid_hazard() -> dict[str, Any] | None:
    """Returns the first potentially hazardous asteroid approach today, or None."""
    neos = await fetch_near_earth_objects()
    for neo in neos:
        # We prefer to return one that is potentially hazardous if available
        if neo.get("is_potentially_hazardous_asteroid", False):
            record = neo_to_hazard_record(neo)
            if record:
                return record
    
    # If no hazardous ones, just return the first one
    if neos:
        record = neo_to_hazard_record(neos[0])
        if record:
            return record
            
    return None
