"""
LIVE Earth-hazard feed — NASA EONET (Earth Observatory Natural Event Tracker).

This module fetches real-time data on natural events like wildfires and volcanoes.
https://eonet.gsfc.nasa.gov/docs/v3
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone, timedelta
from typing import Any

logger = logging.getLogger("SkyGuard-X.earth_risk.live_eonet")

EONET_URL = "https://eonet.gsfc.nasa.gov/api/v3/events"

async def fetch_eonet_events(status: str = "open", timeout_s: float = 6.0) -> list[dict[str, Any]]:
    """Real call to NASA EONET for open natural events."""
    try:
        import httpx

        params = {
            "status": status,
            "limit": 50,  # limit to 50 recent events
        }
        async with httpx.AsyncClient(timeout=timeout_s) as client:
            resp = await client.get(
                EONET_URL,
                params=params,
                headers={"User-Agent": "SkyGuard-X-NASA-EONET-Plugin"},
            )
            resp.raise_for_status()
        data = resp.json()
        events = data.get("events", [])
        logger.info("LIVE EONET fetch: %d open event(s)", len(events))
        return events
    except Exception as exc:
        logger.warning("fetch_eonet_events failed: %s", exc)
        return []

def eonet_to_hazard_record(event: dict[str, Any]) -> dict[str, Any] | None:
    """Converts a NASA EONET event record into our internal hazard record shape."""
    try:
        from shapely.geometry import Point
        
        # Get latest geometry (EONET provides a list of geometries for the event over time)
        geometries = event.get("geometry", [])
        if not geometries:
            return None
        latest_geo = geometries[-1]
        coords = latest_geo.get("coordinates")
        if not coords or len(coords) < 2:
            return None
            
        geom = Point(coords[0], coords[1])
    except Exception as exc:
        logger.warning("could not create EONET geometry: %s", exc)
        return None

    # Categories in EONET have ids like 'wildfires', 'volcanoes'
    categories = event.get("categories", [])
    cat_id = categories[0].get("id") if categories else "unknown"
    hazard_type = "wildfire" if cat_id == "wildfires" else cat_id
    
    # EONET events are real observations, so high probability
    probability = 0.95
    severity = "HIGH"

    return {
        "hazard_id": event.get("id", "eonet-unknown"),
        "hazard_type": hazard_type,
        "severity": severity,
        "probability": probability,
        "observed_at": datetime.now(timezone.utc).isoformat(),
        "geometry": geom,
        "extent_multiplier": 1.0,
        "data_source": "live_nasa_eonet",
        "headline": f"EONET Event: {event.get('title')}",
        "area_desc": "Global / Point Geometry",
        "expires": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
    }

async def get_live_eonet_hazard(hazard_type: str = "wildfires") -> dict[str, Any] | None:
    """Returns the first EONET event of the requested type, or None."""
    events = await fetch_eonet_events()
    for event in events:
        categories = event.get("categories", [])
        cat_id = categories[0].get("id") if categories else ""
        if hazard_type in cat_id or cat_id in hazard_type:
            record = eonet_to_hazard_record(event)
            if record:
                return record
                
    return None
