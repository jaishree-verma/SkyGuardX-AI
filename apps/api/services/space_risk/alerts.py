"""
Real-Time Alert System for Layer 1 Space Intelligence.

Responsibilities:
1. Detects critical state transitions (e.g. LOW -> HIGH/CRITICAL risk).
2. Generates structured AlertObjects for:
   - 🚨 SPACE RISK ALERT (Telemetry anomaly / health degradation)
   - 🚨 CONJUNCTION ALERT (Close orbital approach)
3. Stores active alerts for REST API inspection (GET /api/v1/alerts).
"""
from __future__ import annotations

import logging
from collections import deque
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from core.events import AlertObject

logger = logging.getLogger("SkyGuard-X.space_risk.alerts")

MAX_ALERT_HISTORY = 50


class AlertManager:
    """Manages active and historical space alerts."""

    def __init__(self) -> None:
        self._alerts: deque[AlertObject] = deque(maxlen=MAX_ALERT_HISTORY)
        self._last_notified_state: Dict[str, str] = {}  # entity_id -> last_status

    def evaluate_space_risk_alert(
        self,
        entity_id: str,
        current_status: str,
        risk_score: float,
        evidence: List[str],
    ) -> Optional[AlertObject]:
        """Triggers an alert if risk transitions into HIGH or CRITICAL."""
        prev_status = self._last_notified_state.get(entity_id, "LOW")
        self._last_notified_state[entity_id] = current_status

        # Transition trigger: newly escalated to HIGH or CRITICAL
        if current_status in ("HIGH", "CRITICAL") and prev_status not in ("HIGH", "CRITICAL"):
            alert = AlertObject(
                alert_type="SPACE_RISK_ALERT",
                severity="CRITICAL" if current_status == "CRITICAL" else "HIGH",
                title=f"🚨 SPACE RISK ALERT: {entity_id}",
                message=f"Risk escalated {prev_status} → {current_status} ({risk_score * 100:.0f}%). Operator review required.",
                entity_id=entity_id,
                risk_score=risk_score,
                evidence=evidence[:3],
                timestamp=datetime.now(timezone.utc),
            )
            self._alerts.appendleft(alert)
            logger.warning("dispatched space risk alert for %s (risk=%.2f)", entity_id, risk_score)
            return alert
        return None

    def evaluate_conjunction_alert(
        self,
        object_a: str,
        object_b: str,
        miss_distance_km: float,
        risk_score: float,
        risk_level: str,
        tca_minutes: float,
    ) -> Optional[AlertObject]:
        """Triggers an alert if an object pair is within critical proximity (< 2.0 km)."""
        pair_key = f"{object_a}::{object_b}"
        prev_level = self._last_notified_state.get(pair_key, "LOW")
        self._last_notified_state[pair_key] = risk_level

        if risk_level in ("HIGH", "CRITICAL") and prev_level not in ("HIGH", "CRITICAL"):
            alert = AlertObject(
                alert_type="CONJUNCTION_ALERT",
                severity="CRITICAL" if risk_level == "CRITICAL" else "HIGH",
                title=f"🚨 CONJUNCTION ALERT: {object_a} + {object_b}",
                message=f"Possible collision risk! Miss distance: {miss_distance_km:.2f} km. TCA: {tca_minutes:.1f} mins.",
                entity_id=object_a,
                secondary_entity_id=object_b,
                risk_score=risk_score,
                evidence=[
                    f"Miss distance: {miss_distance_km:.2f} km",
                    f"Time to closest approach: {tca_minutes:.1f} min",
                    "Simulated maneuver advisory available — human review required",
                ],
                timestamp=datetime.now(timezone.utc),
            )
            self._alerts.appendleft(alert)
            logger.warning("dispatched conjunction alert %s vs %s (miss=%.2fkm)", object_a, object_b, miss_distance_km)
            return alert
        return None

    def list_alerts(self) -> List[Dict[str, Any]]:
        return [a.model_dump() for a in self._alerts]

    def clear(self) -> None:
        self._alerts.clear()
        self._last_notified_state.clear()


# Global Alert Manager Instance
alert_manager = AlertManager()
