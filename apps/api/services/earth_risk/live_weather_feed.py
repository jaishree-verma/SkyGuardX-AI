"""
LIVE Earth weather feed — Open-Meteo.

This module fetches real-time weather conditions for a given coordinate.
https://open-meteo.com/en/docs
"""
from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger("SkyGuard-X.earth_risk.live_weather")

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

async def fetch_current_weather(lat: float, lon: float, timeout_s: float = 6.0) -> dict[str, Any] | None:
    """Real call to Open-Meteo for current weather conditions."""
    try:
        import httpx

        params = {
            "latitude": lat,
            "longitude": lon,
            "current_weather": True,
        }
        async with httpx.AsyncClient(timeout=timeout_s) as client:
            resp = await client.get(
                OPEN_METEO_URL,
                params=params,
                headers={"User-Agent": "SkyGuard-X-Open-Meteo-Plugin"},
            )
            resp.raise_for_status()
        data = resp.json()
        current_weather = data.get("current_weather")
        if current_weather:
            logger.info("LIVE Open-Meteo fetch: current temp %s", current_weather.get("temperature"))
            return current_weather
        return None
    except Exception as exc:
        logger.warning("fetch_current_weather failed for (%s, %s): %s", lat, lon, exc)
        return None

def enhance_hazard_with_weather(hazard: dict[str, Any], weather: dict[str, Any]) -> dict[str, Any]:
    """Adds weather data (wind speed, temp) to a hazard record to improve scoring context."""
    if not weather:
        return hazard
        
    weather_desc = f"Temp: {weather.get('temperature')}C, Wind: {weather.get('windspeed')}km/h"
    
    # Append to area_desc or create a new field
    current_desc = hazard.get("area_desc", "")
    hazard["area_desc"] = f"{current_desc} | Weather: {weather_desc}"
    
    return hazard
