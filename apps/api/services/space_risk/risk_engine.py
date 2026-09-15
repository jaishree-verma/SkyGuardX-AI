"""
Unified Space Risk Engine for Layer 1 Space Intelligence.

Combines:
  1. Telemetry Anomaly Risk (AI Isolation Forest model)
  2. Satellite Health Risk (Deterministic subsystem health score)
  3. Conjunction / Collision Risk (Proximity & SGP4 calculations)

Outputs:
  - Overall Space Risk score (0..1)
  - Risk Status: LOW, MEDIUM, HIGH, CRITICAL
  - Contributor percentages (e.g. Telemetry 40%, Health 30%, Conjunction 30%)
  - Top evidence list
  - Standardized Layer 2 contract object (SpaceRiskEvent)
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from core.events import RiskObject, SpaceRiskEvent

logger = logging.getLogger("SkyGuard-X.space_risk.risk_engine")

MODEL_VERSION = "space-risk-v1"

# Contributor weights
WEIGHT_TELEMETRY = 0.40
WEIGHT_HEALTH = 0.30
WEIGHT_CONJUNCTION = 0.30


def calculate_unified_risk(
    entity_id: str,
    telemetry_risk: Optional[RiskObject] = None,
    health_score: float = 96.0,
    health_evidence: Optional[List[str]] = None,
    conjunction_risk: Optional[RiskObject] = None,
    location: Optional[Dict[str, float]] = None,
    data_age_seconds: float = 0.0,
) -> Dict[str, Any]:
    """Blends telemetry anomaly, health state, and conjunction risk into Overall Space Risk."""
    # 1. Telemetry Anomaly Component
    t_score = telemetry_risk.risk_score if telemetry_risk else 0.05
    t_conf = telemetry_risk.confidence if telemetry_risk else 0.90
    t_ev = telemetry_risk.top_evidence if telemetry_risk else []

    # 2. Health Risk Component (Invert 0-100 health score into 0-1 risk)
    h_risk_raw = max(0.0, min(1.0, (100.0 - health_score) / 100.0))
    h_conf = 0.95

    # 3. Conjunction Component
    c_score = conjunction_risk.risk_score if conjunction_risk else 0.02
    c_conf = conjunction_risk.confidence if conjunction_risk else 0.90
    c_ev = conjunction_risk.top_evidence if conjunction_risk else []

    # Weighted blend
    overall_score = (
        WEIGHT_TELEMETRY * t_score
        + WEIGHT_HEALTH * h_risk_raw
        + WEIGHT_CONJUNCTION * c_score
    )
    overall_score = float(max(0.01, min(0.99, overall_score)))

    # Weighted confidence
    overall_conf = (
        WEIGHT_TELEMETRY * t_conf
        + WEIGHT_HEALTH * h_conf
        + WEIGHT_CONJUNCTION * c_conf
    )
    # Staleness penalty on confidence
    if data_age_seconds > 45.0:
        overall_conf = max(0.10, overall_conf - 0.30)

    # Status classification
    if overall_score >= 0.75 or (conjunction_risk and conjunction_risk.status == "CRITICAL"):
        status = "CRITICAL"
    elif overall_score >= 0.55:
        status = "HIGH"
    elif overall_score >= 0.30:
        status = "MEDIUM"
    else:
        status = "LOW"

    # Aggregated top evidence
    evidence: List[str] = []
    if t_score > 0.40 and t_ev:
        evidence.extend([f"[Telemetry] {e}" for e in t_ev if not e.startswith("All primary")])
    if h_risk_raw > 0.30 and health_evidence:
        evidence.extend([f"[Health] {e}" for e in health_evidence if not e.startswith("All primary")])
    if c_score > 0.40 and c_ev:
        evidence.extend([f"[Conjunction] {e}" for e in c_ev])

    if not evidence:
        evidence.append("All space operations, telemetry, and orbital paths within safe parameters")

    contributors = {
        "telemetry_anomaly_pct": round(WEIGHT_TELEMETRY * 100),
        "satellite_health_pct": round(WEIGHT_HEALTH * 100),
        "conjunction_risk_pct": round(WEIGHT_CONJUNCTION * 100),
        "telemetry_raw_score": round(t_score, 3),
        "health_raw_score": round(h_risk_raw, 3),
        "conjunction_raw_score": round(c_score, 3),
    }

    loc = location or {"latitude": 0.0, "longitude": 0.0}

    # Standardized Layer 2 contract representation
    affected = [entity_id]
    if conjunction_risk and "secondary" in conjunction_risk.top_evidence:
        affected.append("DEBRIS")

    layer2_event = SpaceRiskEvent(
        space_event_id=f"EVT-SPACE-{entity_id}-{int(datetime.now(timezone.utc).timestamp())}",
        entity_id=entity_id,
        event_type="SPACE_RISK",
        risk_score=round(overall_score, 4),
        risk_level=status,
        confidence=round(overall_conf, 4),
        location=loc,
        affected_objects=affected,
        evidence=evidence[:4],
        timestamp=datetime.now(timezone.utc).isoformat(),
        model_version=MODEL_VERSION,
        requires_human_approval=True,
        autonomous_action_allowed=False,
    )

    return {
        "entity_id": entity_id,
        "risk_score": round(overall_score, 4),
        "risk_percentage": round(overall_score * 100, 1),
        "confidence": round(overall_conf, 4),
        "status": status,
        "risk_contributors": contributors,
        "top_evidence": evidence[:5],
        "model_version": MODEL_VERSION,
        "data_age_seconds": round(data_age_seconds, 1),
        "recommended_next_step": "Operator review required" if status in ("HIGH", "CRITICAL") else "Continue nominal monitoring",
        "autonomous_action_allowed": False,
        "layer2_export": layer2_event.model_dump(),
        "computed_at": datetime.now(timezone.utc).isoformat(),
    }
