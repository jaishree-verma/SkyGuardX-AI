import asyncio
import datetime
import logging
from typing import Any

import httpx

logger = logging.getLogger("SkyGuard-X.space_weather")

class SpaceWeatherFeed:
    """
    Fetches real space weather events from NASA DONKI (Database Of Notifications, Knowledge, Information).
    Includes Solar Flares (FLR), Coronal Mass Ejections (CME), and Geomagnetic Storms (GST).
    """
    def __init__(self):
        self.api_key = "DEMO_KEY"
        self.base_url = "https://api.nasa.gov/DONKI"
        self.client = httpx.AsyncClient(timeout=10.0)

    async def get_recent_events(self, days_back: int = 7) -> dict[str, Any]:
        """Fetch real events from the last N days."""
        end_date = datetime.datetime.utcnow()
        start_date = end_date - datetime.timedelta(days=days_back)
        
        params = {
            "startDate": start_date.strftime("%Y-%m-%d"),
            "endDate": end_date.strftime("%Y-%m-%d"),
            "api_key": self.api_key
        }

        flares = []
        cmes = []
        storms = []

        try:
            # Fetch concurrently
            flr_resp, cme_resp, gst_resp = await asyncio.gather(
                self.client.get(f"{self.base_url}/FLR", params=params),
                self.client.get(f"{self.base_url}/CME", params=params),
                self.client.get(f"{self.base_url}/GST", params=params),
                return_exceptions=True
            )

            if isinstance(flr_resp, httpx.Response) and flr_resp.status_code == 200:
                data = flr_resp.json()
                if isinstance(data, list):
                    flares = data
            
            if isinstance(cme_resp, httpx.Response) and cme_resp.status_code == 200:
                data = cme_resp.json()
                if isinstance(data, list):
                    cmes = data

            if isinstance(gst_resp, httpx.Response) and gst_resp.status_code == 200:
                data = gst_resp.json()
                if isinstance(data, list):
                    storms = data

        except Exception as e:
            logger.error(f"Error fetching NASA DONKI data: {e}")

        # Compute summary metrics for the simulator/UI
        highest_flare = "None"
        if flares:
            # Flare classes: A, B, C, M, X
            classes = [f.get("classType", "") for f in flares if f.get("classType")]
            if classes:
                classes.sort(key=lambda x: ("XMCBA".find(x[0].upper()) if x else 99, x))
                highest_flare = classes[0] if "XMCBA".find(classes[0][0].upper()) != -1 else classes[-1]

        highest_kp = 0.0
        if storms:
            for storm in storms:
                for kpi in storm.get("allKpIndex", []):
                    kp = kpi.get("kpIndex")
                    if kp is not None and kp > highest_kp:
                        highest_kp = kp

        return {
            "flares": flares,
            "cmes": cmes,
            "storms": storms,
            "summary": {
                "highest_flare_class": highest_flare,
                "highest_kp_index": highest_kp,
                "active_cme_count": len(cmes)
            },
            "timestamp": datetime.datetime.utcnow().isoformat()
        }

    async def close(self):
        await self.client.aclose()
