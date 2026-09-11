"""
LIVE Earth-hazard feed — National Weather Service (api.weather.gov).

This is genuinely real-time, public, no-API-key-required data: NOAA/NWS
publishes active severe-weather alerts (including Red Flag / Fire Weather
Warnings for wildfire risk and Flood/Flash Flood Warnings) as CAP-standard
GeoJSON, updated continuously as the National Weather Service issues them.
https://www.weather.gov/documentation/services-web-api

This module is the honest, available substitute for "live wildfire/flood
detection": there is no free, public, real-time satellite fire-detection
feed we can call without an account/API key (NASA FIRMS requires a free
MAP_KEY signup, for example — see FIRMS_NOTE below). NWS active-alert data
*is* what a real emergency-operations dashboard consumes for exactly this
kind of "critical event just happened" trigger, which is why it fits the
spec's real-time theme directly.

Like tle_data.fetch_live_tle, this cannot be exercised inside this sandbox
(api.weather.gov is not on the sandbox's outbound allowlist) but is real,
correctly-shaped code against NWS's documented REST + CAP GeoJSON contract.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger("SkyGuard-X.earth_risk.live_feed")

NWS_ALERTS_URL = "https://api.weather.gov/alerts/active"
# Alert types that map to our two MVP hazard classes (spec §3.4).
WILDFIRE_ALERT_EVENTS = ["Red Flag Warning", "Fire Weather Watch", "Extreme Fire Danger"]
FLOOD_ALERT_EVENTS = ["Flood Warning", "Flash Flood Warning", "Flood Watch", "Coastal Flood Warning"]

# NWS/CAP severity -> our internal severity band (spec §7.5 hazard record shape).
NWS_SEVERITY_MAP = {"Extreme": "HIGH", "Severe": "HIGH", "Moderate": "MEDIUM", "Minor": "LOW", "Unknown": "MEDIUM"}
NWS_CERTAINTY_TO_PROBABILITY = {"Observed": 0.95, "Likely": 0.8, "Possible": 0.55, "Unlikely": 0.25, "Unknown": 0.5}

FIRMS_NOTE = (
    "For real live satellite fire-detection (VIIRS/MODIS hotspots), register a free "
    "MAP_KEY at https://firms.modaps.eosdis.nasa.gov/api/area/ and set FIRMS_MAP_KEY "
    "in .env — fetch_firms_hotspots() below is written against that API's documented "
    "CSV/GeoJSON contract and just needs the key to go live."
)


async def fetch_active_alerts(event_types: list[str], timeout_s: float = 6.0) -> list[dict[str, Any]]:
    """Real call to the NWS active-alerts endpoint, filtered to the given CAP
    event names. Returns [] (never raises) on any failure."""
    try:
        import httpx

        params = {"event": ",".join(event_types), "status": "actual", "message_type": "alert"}
        async with httpx.AsyncClient(timeout=timeout_s) as client:
            resp = await client.get(
                NWS_ALERTS_URL,
                params=params,
                headers={
                    "User-Agent": "SkyGuard-X-Datathon-Prototype (contact: demo@example.com)",
                    "Accept": "application/geo+json",
                },
            )
            resp.raise_for_status()
        data = resp.json()
        features = data.get("features", [])
        logger.info("LIVE NWS alert fetch: %d active alert(s) for %s", len(features), event_types)
        return features
    except Exception as exc:
        logger.warning("fetch_active_alerts failed for %s: %s (will use offline sample hazard)", event_types, exc)
        return []


def alert_to_hazard_record(feature: dict[str, Any], hazard_type: str) -> dict[str, Any] | None:
    """Converts one real NWS CAP GeoJSON feature into our internal hazard
    record shape (same shape earth_risk.hazard.score_hazard produces), so the
    rest of the pipeline (Impact/Cascade/What-If/Decision) doesn't need to
    know whether the hazard came from live NWS data or the offline sample."""
    props = feature.get("properties", {})
    geometry = feature.get("geometry")
    if geometry is None:
        # Many NWS alerts are issued by county/zone (UGC) with no polygon —
        # not usable for our geometry-intersection impact math, so skip them
        # in favor of alerts that do carry a geometry.
        return None
    try:
        from shapely.geometry import shape as shapely_shape

        geom = shapely_shape(geometry)
    except Exception as exc:
        logger.warning("could not parse NWS alert geometry: %s", exc)
        return None

    severity = NWS_SEVERITY_MAP.get(props.get("severity", "Unknown"), "MEDIUM")
    probability = NWS_CERTAINTY_TO_PROBABILITY.get(props.get("certainty", "Unknown"), 0.5)

    return {
        "hazard_id": props.get("id", feature.get("id", "nws-unknown")),
        "hazard_type": hazard_type,
        "severity": severity,
        "probability": probability,
        "observed_at": props.get("effective", datetime.now(timezone.utc).isoformat()),
        "geometry": geom,
        "extent_multiplier": 1.0,
        "data_source": "live_nws",
        "headline": props.get("headline"),
        "area_desc": props.get("areaDesc"),
        "expires": props.get("expires"),
    }


async def get_live_hazard(hazard_type: str = "wildfire") -> dict[str, Any] | None:
    """Top-level entry point used by main.py at startup / on refresh. Returns
    the first live, geometry-bearing hazard record of the requested type, or
    None if NWS has none active right now / the call failed — in which case
    the caller falls back to the bundled offline sample geometry."""
    event_types = WILDFIRE_ALERT_EVENTS if hazard_type == "wildfire" else FLOOD_ALERT_EVENTS
    features = await fetch_active_alerts(event_types)
    for feature in features:
        record = alert_to_hazard_record(feature, hazard_type)
        if record:
            return record
    return None


async def fetch_firms_hotspots(map_key: str, bbox: str, timeout_s: float = 6.0) -> list[dict[str, Any]]:  # pragma: no cover
    """Real VIIRS/MODIS active-fire hotspot feed from NASA FIRMS. Needs a free
    MAP_KEY (see FIRMS_NOTE). Not called anywhere by default — wire it into
    get_live_hazard() as an additional/primary source once you have a key."""
    try:
        import httpx

        url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{map_key}/VIIRS_SNPP_NRT/{bbox}/1"
        async with httpx.AsyncClient(timeout=timeout_s) as client:
            resp = await client.get(url)
            resp.raise_for_status()
        rows = [r.split(",") for r in resp.text.strip().splitlines()]
        header, data_rows = rows[0], rows[1:]
        return [dict(zip(header, row)) for row in data_rows]
    except Exception as exc:
        logger.warning("fetch_firms_hotspots failed: %s", exc)
        return []
