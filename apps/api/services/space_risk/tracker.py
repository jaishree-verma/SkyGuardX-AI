"""
Space Tracking & Health Engine for Layer 1 Space Intelligence.

Responsibilities:
1. Space Object Tracking: Maintains current coordinates, altitude, velocity, and
   attitude for satellites and space debris.
2. Telemetry History Store: Keeps rolling time-series buffers (last 50 points)
   for temperature, battery, power, signal, and velocity.
3. Satellite Health Engine: Computes explainable 0–100 health scores based on
   telemetry deviation, attitude status, and data staleness.
"""
from __future__ import annotations

import logging
from collections import deque
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger("SkyGuard-X.space_risk.tracker")

MAX_HISTORY_POINTS = 60
STALENESS_THRESHOLD_SECONDS = 45.0


@dataclass
class TelemetryPoint:
    timestamp: str
    temperature_c: float
    battery_level: float
    power_consumption: float
    signal_strength: float
    velocity_kms: float
    is_anomalous: bool = False


@dataclass
class SatelliteState:
    satellite_id: str
    satellite_name: str
    object_type: str = "SATELLITE"  # SATELLITE | DEBRIS | OTHER_SPACE_OBJECT
    latitude: float = 0.0
    longitude: float = 0.0
    altitude_km: float = 550.0
    velocity_kms: float = 7.6
    temperature_c: float = 24.5
    battery_level: float = 91.0
    power_consumption: float = 62.0
    signal_strength: float = 96.0
    attitude_status: str = "NORMAL"  # NORMAL | MINOR_DRIFT | TUMBLING
    operational_status: str = "ACTIVE"  # ACTIVE | DEGRADED | SAFE_MODE | OFFLINE
    health_score: float = 96.0
    health_status: str = "NORMAL"  # NORMAL | WARNING | HIGH_RISK | CRITICAL | STALE
    health_confidence: float = 0.95
    health_evidence: List[str] = field(default_factory=list)
    last_updated: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    telemetry_history: deque[TelemetryPoint] = field(default_factory=lambda: deque(maxlen=MAX_HISTORY_POINTS))

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["last_updated"] = self.last_updated.isoformat()
        d["data_age_seconds"] = round((datetime.now(timezone.utc) - self.last_updated).total_seconds(), 1)
        d["telemetry_history"] = [asdict(p) for p in self.telemetry_history]
        return d

    def position_dict(self) -> Dict[str, Any]:
        return {
            "satellite_id": self.satellite_id,
            "satellite_name": self.satellite_name,
            "object_type": self.object_type,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "altitude_km": self.altitude_km,
            "velocity_kms": self.velocity_kms,
            "last_updated": self.last_updated.isoformat(),
            "data_age_seconds": round((datetime.now(timezone.utc) - self.last_updated).total_seconds(), 1),
        }

    def health_dict(self) -> Dict[str, Any]:
        return {
            "satellite_id": self.satellite_id,
            "health_score": round(self.health_score, 1),
            "status": self.health_status,
            "confidence": round(self.health_confidence, 2),
            "evidence": self.health_evidence,
            "attitude_status": self.attitude_status,
            "operational_status": self.operational_status,
            "last_updated": self.last_updated.isoformat(),
            "data_age_seconds": round((datetime.now(timezone.utc) - self.last_updated).total_seconds(), 1),
        }


@dataclass
class DebrisState:
    object_id: str
    name: str
    object_type: str = "DEBRIS"
    latitude: float = 0.0
    longitude: float = 0.0
    altitude_km: float = 550.0
    velocity_kms: float = 7.6
    radar_cross_section_m2: float = 0.8
    last_updated: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["last_updated"] = self.last_updated.isoformat()
        d["data_age_seconds"] = round((datetime.now(timezone.utc) - self.last_updated).total_seconds(), 1)
        return d


class SpaceTracker:
    """Singleton tracking store for active space objects and satellites."""

    def __init__(self) -> None:
        self._satellites: Dict[str, SatelliteState] = {}
        self._debris: Dict[str, DebrisState] = {}

    def register_or_update_satellite(self, payload: Dict[str, Any], event_time: Optional[datetime] = None) -> SatelliteState:
        sat_id = payload.get("satellite_id") or payload.get("entity_id", "SAT-UNKNOWN")
        name = payload.get("satellite_name") or f"SKYGUARD-{sat_id[-4:]}"
        now = event_time or datetime.now(timezone.utc)

        if sat_id not in self._satellites:
            self._satellites[sat_id] = SatelliteState(satellite_id=sat_id, satellite_name=name)

        sat = self._satellites[sat_id]
        sat.satellite_name = name

        # Coordinate updates
        if "latitude" in payload:
            sat.latitude = round(float(payload["latitude"]), 4)
        if "longitude" in payload:
            sat.longitude = round(float(payload["longitude"]), 4)
        if "altitude_km" in payload:
            sat.altitude_km = round(float(payload["altitude_km"]), 1)
        if "velocity_kms" in payload:
            sat.velocity_kms = round(float(payload["velocity_kms"]), 2)

        # Telemetry updates
        if "temperature_c" in payload:
            sat.temperature_c = round(float(payload["temperature_c"]), 1)
        if "battery_level" in payload:
            sat.battery_level = round(float(payload["battery_level"]), 1)
        if "power_consumption" in payload:
            sat.power_consumption = round(float(payload["power_consumption"]), 1)
        if "signal_strength" in payload:
            sat.signal_strength = round(float(payload["signal_strength"]), 1)
        if "attitude_status" in payload:
            sat.attitude_status = str(payload["attitude_status"])
        if "operational_status" in payload:
            sat.operational_status = str(payload["operational_status"])

        sat.last_updated = now

        # Compute explainable health score
        self._evaluate_health(sat)

        # Append to historical buffer
        is_anom = (sat.temperature_c > 45.0 or sat.battery_level < 55.0 or sat.power_consumption > 80.0)
        sat.telemetry_history.append(TelemetryPoint(
            timestamp=now.isoformat(),
            temperature_c=sat.temperature_c,
            battery_level=sat.battery_level,
            power_consumption=sat.power_consumption,
            signal_strength=sat.signal_strength,
            velocity_kms=sat.velocity_kms,
            is_anomalous=is_anom,
        ))

        return sat

    def register_or_update_debris(self, payload: Dict[str, Any], event_time: Optional[datetime] = None) -> DebrisState:
        obj_id = payload.get("object_id", "DEB-UNKNOWN")
        name = payload.get("name") or payload.get("object_name", f"DEBRIS-{obj_id[-4:]}")
        now = event_time or datetime.now(timezone.utc)

        if obj_id not in self._debris:
            self._debris[obj_id] = DebrisState(object_id=obj_id, name=name)

        deb = self._debris[obj_id]
        if "latitude" in payload:
            deb.latitude = round(float(payload["latitude"]), 4)
        if "longitude" in payload:
            deb.longitude = round(float(payload["longitude"]), 4)
        if "altitude_km" in payload:
            deb.altitude_km = round(float(payload["altitude_km"]), 1)
        if "velocity_kms" in payload:
            deb.velocity_kms = round(float(payload["velocity_kms"]), 2)
        deb.last_updated = now
        return deb

    def _evaluate_health(self, sat: SatelliteState) -> None:
        """Configurable, deterministic health scoring algorithm (0 to 100).
        Scoring logic:
        - Base health: 100
        - Thermal penalty: -0.7 per °C above 35°C
        - Battery penalty: -0.8 per % below 70%
        - Power consumption penalty: -0.6 per Watt above 75W
        - Signal penalty: -0.4 per % below 80%
        - Attitude penalty: -25 for TUMBLING, -10 for MINOR_DRIFT
        - Staleness penalty: -35 if data age > 45 seconds
        """
        score = 100.0
        evidence: List[str] = []
        confidence = 0.95

        # Thermal impact
        if sat.temperature_c > 35.0:
            excess = sat.temperature_c - 35.0
            penalty = min(35.0, excess * 0.9)
            score -= penalty
            pct = round(((sat.temperature_c - 24.5) / 24.5) * 100)
            evidence.append(f"Temperature {sat.temperature_c}°C (+{pct}% above baseline)")
        elif sat.temperature_c < 10.0:
            score -= 15.0
            evidence.append(f"Thermal index critically low ({sat.temperature_c}°C)")

        # Battery impact
        if sat.battery_level < 70.0:
            deficit = 70.0 - sat.battery_level
            penalty = min(40.0, deficit * 0.9)
            score -= penalty
            evidence.append(f"Battery level depleted to {sat.battery_level}% (nominal >70%)")

        # Power impact
        if sat.power_consumption > 75.0:
            excess = sat.power_consumption - 75.0
            penalty = min(25.0, excess * 0.8)
            score -= penalty
            evidence.append(f"Power draw surge at {sat.power_consumption}W (nominal <75W)")

        # Signal impact
        if sat.signal_strength < 80.0:
            deficit = 80.0 - sat.signal_strength
            penalty = min(20.0, deficit * 0.6)
            score -= penalty
            confidence -= 0.10
            evidence.append(f"RF signal strength degraded to {sat.signal_strength}%")

        # Attitude impact
        if sat.attitude_status == "TUMBLING":
            score -= 30.0
            evidence.append("Attitude control lost: Spacecraft TUMBLING")
        elif sat.attitude_status == "MINOR_DRIFT":
            score -= 10.0
            evidence.append("Attitude minor pointing drift detected")

        # Staleness check
        age = (datetime.now(timezone.utc) - sat.last_updated).total_seconds()
        if age > STALENESS_THRESHOLD_SECONDS:
            score -= 30.0
            confidence -= 0.25
            evidence.append(f"Telemetry stale: no contact for {int(age)}s")

        score = float(max(5.0, min(100.0, score)))

        # Status classification
        if age > STALENESS_THRESHOLD_SECONDS:
            status = "STALE"
        elif score >= 85.0:
            status = "NORMAL"
        elif score >= 65.0:
            status = "WARNING"
        elif score >= 40.0:
            status = "HIGH_RISK"
        else:
            status = "CRITICAL"

        if not evidence:
            evidence.append("All primary subsystems operating within nominal limits")

        sat.health_score = score
        sat.health_status = status
        sat.health_confidence = max(0.10, min(1.0, confidence))
        sat.health_evidence = evidence[:4]

    def get_satellite(self, satellite_id: str) -> Optional[SatelliteState]:
        return self._satellites.get(satellite_id)

    def list_satellites(self) -> List[Dict[str, Any]]:
        # Refresh staleness on query
        for sat in self._satellites.values():
            self._evaluate_health(sat)
        return [sat.to_dict() for sat in self._satellites.values()]

    def list_space_objects(self) -> List[Dict[str, Any]]:
        res = []
        for sat in self._satellites.values():
            res.append(sat.position_dict())
        for deb in self._debris.values():
            res.append(deb.to_dict())
        return res

    def get_satellite_history(self, satellite_id: str) -> List[Dict[str, Any]]:
        sat = self._satellites.get(satellite_id)
        if not sat:
            return []
        return [asdict(p) for p in sat.telemetry_history]


# Global Tracker Instance
tracker = SpaceTracker()
