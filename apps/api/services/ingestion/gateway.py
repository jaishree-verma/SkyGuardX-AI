"""
Event Gateway — spec §6.3 steps 1-4 (receive, validate, deduplicate, normalize).

Every event, whatever its source, passes through here before touching any
risk/impact/decision logic. This is the single choke point that guarantees
downstream services never see malformed, duplicate, or out-of-order-without-
warning data.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from core.config import get_settings
from core.events import CanonicalEvent, DataQualityStatus
from core.eventbus import InProcEventBus

logger = logging.getLogger("SkyGuard-X.gateway")

TOPIC_RAW_EVENTS = "events.raw"


class DuplicateEventError(Exception):
    pass


class EventGateway:
    """Stateful gateway: tracks seen event_ids (idempotency) and last-seen
    event_time per entity (out-of-order / late-event detection)."""

    def __init__(self, bus: InProcEventBus) -> None:
        self._bus = bus
        self._settings = get_settings()
        self._seen_ids: set[str] = set()
        self._last_event_time: dict[str, datetime] = {}

    async def ingest(self, event: CanonicalEvent) -> CanonicalEvent:
        # 1. Idempotency / duplicate detection
        if event.event_id in self._seen_ids:
            raise DuplicateEventError(f"duplicate event_id={event.event_id}")
        self._seen_ids.add(event.event_id)

        # 2. Data-quality + staleness normalization
        age = event.age_seconds()
        if age > self._settings.data_staleness_ttl_seconds:
            event.quality.status = DataQualityStatus.STALE
            logger.warning("event %s is STALE (%.1fs old)", event.event_id, age)

        # 3. Out-of-order detection (event-time, not arrival-time)
        last_seen = self._last_event_time.get(event.entity_id)
        is_out_of_order = bool(last_seen and event.event_time < last_seen)
        if is_out_of_order:
            logger.info(
                "out-of-order event for entity=%s: event_time=%s < last_seen=%s "
                "(kept for audit/replay, downstream state not force-overwritten)",
                event.entity_id, event.event_time, last_seen,
            )
        else:
            self._last_event_time[event.entity_id] = event.event_time

        # 4. Late-event policy: events arriving after the grace window are still
        #    published (for audit + replay) but flagged so decision logic can
        #    discount them.
        event.payload.setdefault("_gateway_meta", {})
        event.payload["_gateway_meta"] = {
            "out_of_order": is_out_of_order,
            "late": age > self._settings.late_event_grace_seconds,
            "received_at": datetime.now(timezone.utc).isoformat(),
        }

        await self._bus.publish(TOPIC_RAW_EVENTS, event)
        return event
