"""
Replayable event simulator — spec §7.2 step 3 and the theme-alignment note:
"Prototype rule: if live satellite or disaster feeds are unavailable ... use
replayed or simulated events. Always label simulated values clearly."

Every event this module emits has source="simulator" and
payload["_simulated"]=True so nothing downstream can mistake it for a live
feed. It emits:
  - telemetry events for SAT-1042, alternating nominal readings with an
    occasional injected anomaly (so the Isolation Forest model has something
    real to catch on camera during a demo)
  - one wildfire hazard update tied to the real HAZARD-77 geometry

All events are pushed through the same EventGateway → EventBus path a real
ground-station adapter would use — the simulator is just another `source`.
"""
from __future__ import annotations

import asyncio
import logging
import random
from datetime import datetime, timezone

from core.config import get_settings
from core.events import CanonicalEvent, DataQuality, EventType
from services.ingestion.gateway import EventGateway

logger = logging.getLogger("SkyGuard-X.simulator")

_rng = random.Random(7)


def _nominal_telemetry() -> dict:
    return {
        "solar_output": round(_rng.gauss(1400, 40), 1),
        "thermal_index": round(_rng.gauss(15, 4), 2),
        "battery_voltage": round(_rng.gauss(28, 0.3), 2),
    }


def _anomalous_telemetry() -> dict:
    # Injected fault pattern: solar panel degradation + thermal spike —
    # a realistic failure mode, not random noise.
    return {
        "solar_output": round(_rng.gauss(950, 30), 1),   # well below nominal 1200-1600
        "thermal_index": round(_rng.gauss(48, 3), 2),    # above nominal -10..40
        "battery_voltage": round(_rng.gauss(25.2, 0.2), 2),
    }


async def _emit_telemetry(gateway: EventGateway, tick: int) -> None:
    is_anomaly = tick % 9 == 0  # roughly one injected anomaly every ~36s at 4s cadence
    metrics = _anomalous_telemetry() if is_anomaly else _nominal_telemetry()
    event = CanonicalEvent(
        event_type=EventType.TELEMETRY_ANOMALY if is_anomaly else EventType.TELEMETRY_NOMINAL,
        source="simulator",
        entity_id="SAT-1042",
        event_time=datetime.now(timezone.utc),
        quality=DataQuality(status="GOOD", latency_ms=round(_rng.uniform(80, 220), 1)),
        payload={**metrics, "_simulated": True},
    )
    try:
        await gateway.ingest(event)
    except Exception as exc:
        logger.warning("simulator telemetry ingest failed: %s", exc)


async def _emit_hazard(gateway: EventGateway) -> None:
    event = CanonicalEvent(
        event_type=EventType.EARTH_HAZARD_WILDFIRE,
        source="simulator",
        entity_id="HAZARD-77",
        event_time=datetime.now(timezone.utc),
        quality=DataQuality(status="GOOD", latency_ms=round(_rng.uniform(150, 400), 1)),
        payload={"hazard_id": "HAZARD-77", "_simulated": True},
    )
    try:
        await gateway.ingest(event)
    except Exception as exc:
        logger.warning("simulator hazard ingest failed: %s", exc)


async def run_simulator(gateway: EventGateway) -> None:
    settings = get_settings()
    if not settings.simulator_enabled:
        logger.info("simulator disabled via SIMULATOR_ENABLED=false")
        return

    logger.info(
        "simulator started: telemetry every %.1fs, hazard every %.1fs (source='simulator', all events tagged _simulated=True)",
        settings.telemetry_interval_seconds, settings.hazard_interval_seconds,
    )
    tick = 0
    last_hazard = 0.0
    loop = asyncio.get_event_loop()
    while True:
        await _emit_telemetry(gateway, tick)
        tick += 1

        now = loop.time()
        if now - last_hazard >= settings.hazard_interval_seconds:
            await _emit_hazard(gateway)
            last_hazard = now

        await asyncio.sleep(settings.telemetry_interval_seconds)
