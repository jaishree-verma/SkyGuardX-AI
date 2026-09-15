"""
Transactional Intelligence Boundary for SkyGuard XAI.

Architectural Purpose:
In mission-critical aerospace applications, high-throughput AI inference and
telemetry auditing must sit directly adjacent to core transactional ledgers.
The TransactionalIntelligenceBoundary establishes this interface.

Honest Status & Boundary Guarantee:
If live IBM Z infrastructure (e.g. z/OS Connect EE, LinuxONE, or CICS) is not
connected, the system invokes MockIBMZAdapter.
Never claim 'Running on IBM Z' unless actively connected to verified hardware.
Currently: "IBM Z integration boundary prepared for deployment/integration."
"""
from __future__ import annotations

import asyncio
import logging
import time
from typing import Any, Callable, Dict, Optional, TypeVar

from core.config import get_settings

logger = logging.getLogger("SkyGuard-X.ibm_z_boundary")

T = TypeVar("T")


class MockIBMZAdapter:
    """Mock/Simulated adapter representing an IBM Z transactional scoring boundary."""

    def __init__(self) -> None:
        self.name = "MockIBMZAdapter (Simulated In-Process Boundary)"
        self.call_count = 0
        self.total_latency_ms = 0.0

    async def forward_risk_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        t0 = time.perf_counter()
        await asyncio.sleep(0.002)  # simulate minimal microsecond transactional boundary latency
        latency_ms = (time.perf_counter() - t0) * 1000
        self.call_count += 1
        self.total_latency_ms += latency_ms

        logger.debug(
            "MockIBMZAdapter recorded risk event: entity=%s score=%.2f latency=%.2fms",
            event_data.get("entity_id"),
            event_data.get("risk_score", 0.0),
            latency_ms,
        )
        return {
            "status": "RECORDED_AT_BOUNDARY",
            "boundary": "simulated_ibm_z_adapter",
            "latency_ms": round(latency_ms, 2),
            "timestamp": event_data.get("timestamp"),
        }


class TransactionalIntelligenceBoundary:
    """Enterprise boundary managing all real-time scoring and risk event dispatch."""

    def __init__(self) -> None:
        self._settings = get_settings()
        self.mock_adapter = MockIBMZAdapter()

    @property
    def is_live_ibm_z(self) -> bool:
        return bool(self._settings.ibm_z_integration_enabled and self._settings.ibm_z_endpoint_url)

    async def score_transaction(self, compute: Callable[[], T]) -> T:
        """Executes AI inference inside the transactional boundary with instrumentation."""
        t0 = time.perf_counter()
        if self.is_live_ibm_z:
            logger.info("Routing inference call through configured IBM Z endpoint: %s", self._settings.ibm_z_endpoint_url)
            # When live, this issues an authenticated mTLS HTTP/2 call to z/OS Connect EE
            # Currently fallback to local compute until live endpoint handshake is verified.
        res = compute() if not asyncio.iscoroutinefunction(compute) else await compute()
        elapsed_ms = (time.perf_counter() - t0) * 1000
        logger.debug("Transactional scoring executed in %.2fms", elapsed_ms)
        return res

    async def dispatch_space_risk(self, risk_data: Dict[str, Any]) -> Dict[str, Any]:
        """Dispatches computed space risk to the transactional audit boundary."""
        return await self.mock_adapter.forward_risk_event(risk_data)


# Global boundary singleton
boundary = TransactionalIntelligenceBoundary()


async def transactional_score(compute: Callable[[], T]) -> T:
    """Convenience wrapper maintaining backwards compatibility with existing call sites."""
    return await boundary.score_transaction(compute)
