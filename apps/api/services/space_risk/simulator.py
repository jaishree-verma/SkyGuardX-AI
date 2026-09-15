"""
Multi-Object Space Data Simulator & Deterministic Demo Controller for Layer 1.

Features:
1. Continuous Fleet Simulation: Emits realistic telemetry and orbital coordinates
   for 6 satellites (SAT-1001, SAT-1002, SAT-1003, SAT-1042, SAT-1077, SAT-1088)
   and 3 debris objects (DEB-2001, DEB-2002, DEB-2098).
2. Deterministic Demo Scenario: Stepped progression for SAT-1042 and DEB-2098:
   - Thermal & power spike, battery depletion
   - AI Anomaly detection triggering
   - DEB-2098 close orbital convergence (~0.72 km miss distance)
   - High conjunction risk and alert generation
   - 89% combined risk, 94% confidence, human review required.
"""
from __future__ import annotations

import asyncio
import logging
import math
import random
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from core.events import CanonicalEvent, DataQuality, EventType
from services.ingestion.gateway import EventGateway

logger = logging.getLogger("SkyGuard-X.space_risk.simulator")

_rng = random.Random(42)

# Fleet definitions
SATELLITE_CATALOG = [
    {"id": "SAT-1001", "name": "SKYGUARD-ALPHA", "inclination": 51.6, "raan": 30.0, "alt": 540.0, "vel": 7.59},
    {"id": "SAT-1002", "name": "SKYGUARD-BETA", "inclination": 97.4, "raan": 120.0, "alt": 560.0, "vel": 7.58},
    {"id": "SAT-1003", "name": "SKYGUARD-GAMMA", "inclination": 45.0, "raan": 210.0, "alt": 530.0, "vel": 7.61},
    {"id": "SAT-1042", "name": "SKYGUARD-LEO-PRIMARY", "inclination": 53.0, "raan": 77.0, "alt": 550.0, "vel": 7.60},
    {"id": "SAT-1077", "name": "SKYGUARD-SENTINEL", "inclination": 98.2, "raan": 290.0, "alt": 570.0, "vel": 7.57},
    {"id": "SAT-1088", "name": "SKYGUARD-OBSERVER", "inclination": 35.0, "raan": 340.0, "alt": 520.0, "vel": 7.62},
]

DEBRIS_CATALOG = [
    {"id": "DEB-2001", "name": "COSMOS-2251-DEB", "lat": 15.2, "lon": -45.0, "alt": 555.0, "vel": 7.58},
    {"id": "DEB-2002", "name": "FENGYUN-1C-DEB", "lat": -32.1, "lon": 110.4, "alt": 565.0, "vel": 7.57},
    {"id": "DEB-2098", "name": "SL-16-R/B-DEB", "lat": 28.61, "lon": 77.21, "alt": 550.72, "vel": 7.60},
]


class DemoScenarioController:
    """Manages the deterministic demo scenario requested in the Datathon specification."""

    def __init__(self) -> None:
        self.is_active = False
        self.step = 0
        self.max_steps = 6

        # Stepped profiles for SAT-1042
        self.temp_profile = [24.5, 28.0, 35.0, 52.0, 71.0, 71.0]
        self.power_profile = [62.0, 72.0, 81.0, 94.0, 94.0, 94.0]
        self.battery_profile = [91.0, 78.0, 60.0, 42.0, 42.0, 42.0]
        self.signal_profile = [96.0, 92.0, 82.0, 61.0, 61.0, 61.0]

        # DEB-2098 distance profile relative to SAT-1042 (reaches exactly 0.72 km)
        self.deb_lat_delta = [2.5, 1.2, 0.4, 0.1, 0.0005, 0.0005]
        self.deb_lon_delta = [3.0, 1.5, 0.5, 0.1, 0.0005, 0.0005]
        self.deb_alt_delta = [5.0, 3.2, 1.8, 1.0, 0.72, 0.72]

    def start(self) -> None:
        self.is_active = True
        self.step = 0
        logger.info("Demo Scenario Started: SAT-1042 anomaly + DEB-2098 conjunction")

    def reset(self) -> None:
        self.is_active = False
        self.step = 0
        logger.info("Demo Scenario Reset")

    def advance(self) -> int:
        if not self.is_active:
            return 0
        current = self.step
        if self.step < self.max_steps - 1:
            self.step += 1
        return current


demo_controller = DemoScenarioController()


def _propagate_circular(inclination_deg: float, raan_deg: float, epoch_sec: float, period_sec: float = 5700.0) -> tuple[float, float]:
    """Computes simplified sub-satellite geodetic latitude & longitude over time."""
    mean_motion = 2.0 * math.pi / period_sec
    mean_anomaly = (epoch_sec * mean_motion) % (2.0 * math.pi)
    inc_rad = math.radians(inclination_deg)

    # Simplified spherical ground track
    lat = math.degrees(math.asin(math.sin(inc_rad) * math.sin(mean_anomaly)))
    # Earth rotation: -360 / 86400 deg/sec = -0.00416 deg/sec
    earth_rot = (epoch_sec * (360.0 / 86400.0)) % 360.0
    lon = (math.degrees(math.atan2(math.cos(inc_rad) * math.sin(mean_anomaly), math.cos(mean_anomaly))) + raan_deg - earth_rot) % 360.0
    if lon > 180.0:
        lon -= 360.0
    return round(lat, 4), round(lon, 4)


class SpaceSimulator:
    def __init__(self, gateway: EventGateway) -> None:
        self.gateway = gateway
        self._running = False
        self._tick = 0
        self._start_time = datetime.now(timezone.utc).timestamp()

    async def start(self) -> None:
        self._running = True
        logger.info("Space Simulator started with 6 satellites and 3 debris objects")

        while self._running:
            try:
                await self._emit_tick()
            except Exception as exc:
                logger.error("Error in space simulator tick: %s", exc)
            await asyncio.sleep(2.5)  # fast 2.5s cadence for live command center updates

    def stop(self) -> None:
        self._running = False

    async def _emit_tick(self) -> None:
        self._tick += 1
        elapsed = datetime.now(timezone.utc).timestamp() - self._start_time
        demo_active = demo_controller.is_active
        demo_step = demo_controller.advance() if demo_active else 0

        sat_1042_lat, sat_1042_lon = 0.0, 0.0
        # 1. Emit Telemetry for all Satellites
        for idx, s in enumerate(SATELLITE_CATALOG):
            sat_id = s["id"]
            lat, lon = _propagate_circular(s["inclination"], s["raan"] + idx * 45.0, elapsed)
            if sat_id == "SAT-1042":
                sat_1042_lat, sat_1042_lon = lat, lon

            # Check if this is the demo satellite during an active scenario
            if sat_id == "SAT-1042" and demo_active:
                temp = demo_controller.temp_profile[demo_step]
                power = demo_controller.power_profile[demo_step]
                battery = demo_controller.battery_profile[demo_step]
                signal = demo_controller.signal_profile[demo_step]
                attitude = "NORMAL" if demo_step < 3 else "MINOR_DRIFT"
                op_status = "ACTIVE" if demo_step < 4 else "DEGRADED"
                event_type = EventType.TELEMETRY_ANOMALY if demo_step >= 2 else EventType.TELEMETRY_NOMINAL
            elif sat_id == "SAT-1003":
                # Deterministic WARNING satellite (mild temperature & battery drift)
                temp = round(_rng.gauss(38.5, 0.8), 1)
                battery = round(_rng.gauss(71.5, 1.2), 1)
                power = round(_rng.gauss(76.0, 1.5), 1)
                signal = round(_rng.gauss(85.0, 1.5), 1)
                attitude = "MINOR_DRIFT"
                op_status = "ACTIVE"
                event_type = EventType.TELEMETRY_NOMINAL
            else:
                # Deterministic NORMAL satellites (SAT-1001, SAT-1002, SAT-1077, SAT-1088)
                temp = round(_rng.gauss(24.5, 1.0), 1)
                battery = round(_rng.gauss(91.0, 1.2), 1)
                power = round(_rng.gauss(62.0, 1.8), 1)
                signal = round(_rng.gauss(96.0, 1.0), 1)
                attitude = "NORMAL"
                op_status = "ACTIVE"
                event_type = EventType.TELEMETRY_NOMINAL

            event = CanonicalEvent(
                event_type=event_type,
                source="simulator",
                entity_id=sat_id,
                event_time=datetime.now(timezone.utc),
                quality=DataQuality(status="GOOD", latency_ms=round(_rng.uniform(15, 45), 1)),
                payload={
                    "satellite_id": sat_id,
                    "satellite_name": s["name"],
                    "latitude": lat,
                    "longitude": lon,
                    "altitude_km": s["alt"],
                    "velocity_kms": s["vel"],
                    "temperature_c": temp,
                    "battery_level": battery,
                    "power_consumption": power,
                    "signal_strength": signal,
                    "attitude_status": attitude,
                    "operational_status": op_status,
                    "_simulated": True,
                    "demo_step": demo_step if (sat_id == "SAT-1042" and demo_active) else None,
                },
            )
            await self.gateway.ingest(event)

        # 2. Emit Space Objects / Debris updates
        for d in DEBRIS_CATALOG:
            deb_id = d["id"]

            if deb_id == "DEB-2098" and demo_active:
                # Move directly toward SAT-1042 to create close approach
                d_lat = sat_1042_lat + demo_controller.deb_lat_delta[demo_step]
                d_lon = sat_1042_lon + demo_controller.deb_lon_delta[demo_step]
                d_alt = 550.0 + demo_controller.deb_alt_delta[demo_step]
            else:
                # Slowly drift
                d_lat = (d["lat"] + (elapsed * 0.005)) % 90.0
                d_lon = (d["lon"] + (elapsed * 0.01)) % 180.0
                d_alt = d["alt"]

            deb_event = CanonicalEvent(
                event_type=EventType.SPACE_OBJECT_UPDATE,
                source="simulator",
                entity_id=deb_id,
                event_time=datetime.now(timezone.utc),
                quality=DataQuality(status="GOOD", latency_ms=20.0),
                payload={
                    "object_id": deb_id,
                    "name": d["name"],
                    "object_type": "DEBRIS",
                    "latitude": round(d_lat, 4),
                    "longitude": round(d_lon, 4),
                    "altitude_km": round(d_alt, 2),
                    "velocity_kms": d["vel"],
                    "_simulated": True,
                },
            )
            await self.gateway.ingest(deb_event)
