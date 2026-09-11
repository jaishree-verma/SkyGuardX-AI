"""
Real-time transport for the Command Center dashboard.

The dashboard needs to see events, risk updates, impact updates and
recommendations the moment they're computed — not on a polling interval.
This manager fans out every server-side update to all connected WebSocket
clients as a typed JSON message: {"channel": ..., "payload": ...}.

An SSE fallback endpoint (`/stream/events`) is also exposed in main.py for
clients/networks that block WebSocket upgrades.
"""
from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger("SkyGuard-X.ws")


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: set[WebSocket] = set()
        self._lock = asyncio.Lock()
        # Ring buffer so SSE polling clients / late WS connects can catch up.
        self._recent: list[dict[str, Any]] = []
        self._recent_limit = 200

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        async with self._lock:
            self._connections.add(ws)
        logger.info("ws connected, total=%d", len(self._connections))
        # Replay recent history so a newly-opened dashboard isn't blank.
        for msg in self._recent[-50:]:
            await ws.send_text(json.dumps(msg))

    async def disconnect(self, ws: WebSocket) -> None:
        async with self._lock:
            self._connections.discard(ws)
        logger.info("ws disconnected, total=%d", len(self._connections))

    async def broadcast(self, channel: str, payload: Any) -> None:
        message = {"channel": channel, "payload": payload}
        async with self._lock:
            self._recent.append(message)
            if len(self._recent) > self._recent_limit:
                self._recent.pop(0)
            targets = list(self._connections)
        text = json.dumps(message, default=str)
        stale: list[WebSocket] = []
        for ws in targets:
            try:
                await ws.send_text(text)
            except Exception:
                stale.append(ws)
        if stale:
            async with self._lock:
                for ws in stale:
                    self._connections.discard(ws)

    def recent(self) -> list[dict[str, Any]]:
        return list(self._recent)


manager = ConnectionManager()
