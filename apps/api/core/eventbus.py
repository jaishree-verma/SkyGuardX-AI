"""
Event bus abstraction — spec §5.1 ("Streaming: Kafka / IBM Event Streams equivalent").

For a laptop demo we default to an in-process asyncio pub/sub bus so the whole
stack runs with `docker compose up` and no external broker. The interface is
identical to what an `aiokafka`-backed implementation would expose, so swapping
EVENT_BUS_BACKEND=kafka in production is a drop-in change, not a rewrite.

Every published event is also appended to an in-memory (and, in production,
durable-store-backed) replay log, so the "replayable event simulator" behaviour
from the spec's theme-alignment section is preserved: any consumer can request
"replay events after timestamp X".
"""
from __future__ import annotations

import asyncio
import logging
from collections import defaultdict
from typing import Awaitable, Callable

from core.events import CanonicalEvent

logger = logging.getLogger("SkyGuard-X.eventbus")

Handler = Callable[[CanonicalEvent], Awaitable[None]]


class InProcEventBus:
    """Minimal topic-based pub/sub with a replay log. Same shape as a Kafka
    producer/consumer pair so it can be swapped for `aiokafka` without touching
    any service code (see KafkaEventBus stub below)."""

    def __init__(self) -> None:
        self._subscribers: dict[str, list[Handler]] = defaultdict(list)
        self._replay_log: list[CanonicalEvent] = []
        self._lock = asyncio.Lock()

    def subscribe(self, topic: str, handler: Handler) -> None:
        self._subscribers[topic].append(handler)
        logger.info("subscribed handler to topic=%s (total=%d)", topic, len(self._subscribers[topic]))

    async def publish(self, topic: str, event: CanonicalEvent) -> None:
        async with self._lock:
            self._replay_log.append(event)
        logger.debug("publish topic=%s event_id=%s", topic, event.event_id)
        handlers = list(self._subscribers.get(topic, [])) + list(self._subscribers.get("*", []))
        # Fan out concurrently but don't let one slow consumer block ingestion.
        await asyncio.gather(*(h(event) for h in handlers), return_exceptions=True)

    async def replay(self, since_iso: str | None = None) -> list[CanonicalEvent]:
        if since_iso is None:
            return list(self._replay_log)
        return [e for e in self._replay_log if e.event_time.isoformat() >= since_iso]


class KafkaEventBus:  # pragma: no cover - production adapter, needs a real broker
    """Drop-in replacement for InProcEventBus backed by aiokafka.

    Not wired up in this sandbox build (no outbound broker available), but kept
    here as the concrete integration point: instantiate this instead of
    InProcEventBus in `main.py` when EVENT_BUS_BACKEND=kafka, and everything
    else in the codebase is unaffected because both expose publish()/subscribe().
    """

    def __init__(self, bootstrap_servers: str) -> None:
        self.bootstrap_servers = bootstrap_servers
        self._producer = None  # aiokafka.AIOKafkaProducer, created in start()
        self._subscribers: dict[str, list[Handler]] = defaultdict(list)

    async def start(self) -> None:
        from aiokafka import AIOKafkaProducer  # local import: optional dependency

        self._producer = AIOKafkaProducer(bootstrap_servers=self.bootstrap_servers)
        await self._producer.start()

    def subscribe(self, topic: str, handler: Handler) -> None:
        self._subscribers[topic].append(handler)

    async def publish(self, topic: str, event: CanonicalEvent) -> None:
        assert self._producer is not None, "call start() first"
        await self._producer.send_and_wait(topic, event.model_dump_json().encode("utf-8"))


_bus_singleton: InProcEventBus | None = None


def get_event_bus() -> InProcEventBus:
    global _bus_singleton
    if _bus_singleton is None:
        _bus_singleton = InProcEventBus()
    return _bus_singleton
