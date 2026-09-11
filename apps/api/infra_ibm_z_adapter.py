"""
IBM Z transactional boundary adapter — spec's "Why IBM Z is central to the
story": time-sensitive decision intelligence should sit close to
transactional data, with in-line scoring, low latency, sensitive-data
protection, and auditable high-throughput processing.

This module is the ONE place in the codebase where "the model call" passes
through what would, in a real deployment, be the IBM Z transactional
boundary (e.g. z/OS Connect EE exposing a scoring service, or an on-platform
inference call co-located with transactional data). In this sandbox build it
is a simulated pass-through — every call is timed and labeled so latency
claims in the demo are honest (spec's "Important implementation distinction":
never present simulated timings as measured IBM Z performance).

To integrate a real endpoint: set IBM_Z_INTEGRATION_ENABLED=true and
IBM_Z_ENDPOINT_URL in the environment, then replace the `else` branch below
with an authenticated HTTPS call (mutual TLS via IBM_Z_CLIENT_CERT_PATH) to
that endpoint. Every call site in main.py (`transactional_score(...)`) is
already written against this same async signature, so no call site changes.
"""
from __future__ import annotations

import asyncio
import logging
import time
from typing import Awaitable, Callable, TypeVar

from core.config import get_settings

logger = logging.getLogger("SkyGuard-X.ibm_z_adapter")

T = TypeVar("T")


async def transactional_score(compute: Callable[[], T]) -> T:
    """Runs `compute` (a deterministic scoring function, e.g. anomaly
    detection) through the transactional boundary. Returns the same result
    type as `compute()`; adds latency instrumentation either way so real vs.
    simulated numbers are never conflated in logs or the audit trail.
    """
    settings = get_settings()
    t0 = time.perf_counter()

    if settings.ibm_z_integration_enabled and settings.ibm_z_endpoint_url:
        # PLANNED / production path — not exercised in this sandbox build.
        # Example real implementation:
        #
        #   import httpx
        #   async with httpx.AsyncClient(cert=settings.ibm_z_client_cert_path, timeout=2.0) as client:
        #       resp = await client.post(settings.ibm_z_endpoint_url, json=compute_input)
        #       result = parse_response(resp.json())
        #
        # Left as a documented integration point rather than a fake network
        # call, since no real endpoint is available in this environment.
        logger.warning(
            "IBM_Z_INTEGRATION_ENABLED=true but this build ships only the "
            "simulated adapter path — wire the real HTTPS call in "
            "infra_ibm_z_adapter.py before relying on this in production."
        )

    # SIMULATED boundary: run the deterministic model in-process, but keep
    # the same async call shape and latency logging a real network hop would
    # have, so swapping in the real endpoint later doesn't change call sites.
    result = compute() if not asyncio.iscoroutinefunction(compute) else await compute()
    elapsed_ms = (time.perf_counter() - t0) * 1000
    logger.debug("transactional_score (SIMULATED boundary) took %.2fms", elapsed_ms)
    return result
