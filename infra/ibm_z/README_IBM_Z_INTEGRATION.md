# IBM Z Transactional Boundary — Integration Contract

This document is the "why IBM Z matters" story made concrete, and the exact
contract to fill in when you have real IBM Z / z/OS Connect access during the
Datathon.

## The architectural claim

SkyGuard-X's judging narrative (per the uploaded spec) is not "we used IBM Z
somewhere" — it's: **time-sensitive decision intelligence sits close to
transactional data, so scoring happens in-line, not after the fact.**

Concretely, that means the AI scoring step (telemetry anomaly detection today;
conjunction/hazard scoring as the project grows) is architected as a call
through a transactional boundary — `apps/api/infra_ibm_z_adapter.py` —
instead of being called directly from business logic. That boundary is the
integration point.

## What this build ships (honest status)

| Piece | Status |
|---|---|
| `transactional_score()` call wrapper with latency instrumentation | **Real code**, in use on every telemetry event |
| Real HTTPS call to an IBM Z endpoint (z/OS Connect EE, CICS, or an on-platform inference service) | **Not implemented** — no IBM Z endpoint is reachable from this build environment |
| mTLS client cert config (`IBM_Z_CLIENT_CERT_PATH`) | **Config plumbing only**, unused until a real cert + endpoint exist |
| Latency numbers currently logged | **Simulated boundary** — in-process function call, not a network hop to IBM Z. Do **not** present these as IBM Z performance numbers. |

## What to fill in for a real IBM Z demo

1. **Expose a scoring endpoint.** If you have IBM Z / LinuxONE access (e.g. via
   the Datathon's provided environment), stand up a minimal scoring service —
   this can be as simple as z/OS Connect EE fronting a REST call to a Python/
   Java scoring routine co-located with your transactional data, or a CICS/IMS
   transaction that returns a JSON risk object matching `RiskObject` in
   `apps/api/core/events.py`.
2. **Point the adapter at it.** Set:
   ```bash
   IBM_Z_INTEGRATION_ENABLED=true
   IBM_Z_ENDPOINT_URL=https://your-z-endpoint/score
   IBM_Z_CLIENT_CERT_PATH=/path/to/client.pem
   ```
3. **Implement the real branch** in `transactional_score()` — the exact
   `httpx` call is sketched in a comment in that file. No other code changes
   anywhere in the codebase; every call site already goes through this one
   function.
4. **Re-run the benchmark** in `docs/BENCHMARKING.md` and record real
   end-to-end and IBM-Z-hop latency separately. Label the chart clearly:
   "measured" vs. "target."

## Why this is the right architecture even before step 1-4 are done

- It keeps the **call shape stable**: business logic (`main.py`,
  `services/*`) never talks to a scoring model directly — it always goes
  through the transactional boundary. That's the same discipline a real
  deployment needs (keep sensitive data + inference close together, audit
  every call).
- It gives judges a **concrete, inspectable integration point** rather than a
  slide that says "IBM Z" with no code behind it.
- It fails safe: if `IBM_Z_INTEGRATION_ENABLED=true` but no endpoint responds,
  the adapter logs a clear warning and the demo keeps running on the
  simulated path — matching the spec's §7.11 "Model unavailable → fallback
  rule/model + degraded-mode banner" requirement.
