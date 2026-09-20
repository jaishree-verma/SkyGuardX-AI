"""
Canonical event schema — spec §6.4.

Every event that enters SkyGuard-X, no matter its source (satellite telemetry,
orbital conjunction feed, Earth-observation hazard, infrastructure system),
is converted into this one predictable structure before any downstream
service touches it. This is what lets Space Intelligence, Earth Intelligence,
Impact, Cascade, Scenario, Decision and Explanation all speak one language.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator, ConfigDict


class EventType(str, Enum):
    TELEMETRY_ANOMALY = "telemetry_anomaly"
    TELEMETRY_NOMINAL = "telemetry_nominal"
    SATELLITE_TELEMETRY = "SATELLITE_TELEMETRY"
    satellite_telemetry = "satellite_telemetry"
    CONJUNCTION_UPDATE = "conjunction_update"
    CONJUNCTION_ALERT = "conjunction_alert"
    SPACE_RISK_ALERT = "space_risk_alert"
    SPACE_OBJECT_UPDATE = "space_object_update"
    EARTH_HAZARD_WILDFIRE = "earth_hazard_wildfire"
    EARTH_HAZARD_FLOOD = "earth_hazard_flood"
    INFRASTRUCTURE_CHANGE = "infrastructure_change"
    CONVERGENCE_ALERT = "convergence_alert"


class DataQualityStatus(str, Enum):
    GOOD = "GOOD"
    DEGRADED = "DEGRADED"
    STALE = "STALE"
    MISSING = "MISSING"


class DataQuality(BaseModel):
    status: DataQualityStatus = DataQualityStatus.GOOD
    latency_ms: float = 0.0
    missing_fields: list[str] = Field(default_factory=list)


class GeoPoint(BaseModel):
    lat: float
    lon: float


class CanonicalEvent(BaseModel):
    """The one shape every downstream service consumes. See data/schemas/event_schema.json
    for the JSON Schema used to validate events at the gateway boundary."""

    event_id: str = Field(default_factory=lambda: f"evt-{uuid.uuid4().hex[:10]}")
    event_type: EventType
    source: str  # e.g. "simulator", "ground-station-1", "eo-satellite-feed"
    entity_id: str  # e.g. "SAT-1042", "DEB-2098"
    event_time: datetime  # when the source says it happened
    ingest_time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    processing_time: Optional[datetime] = None
    schema_version: str = "1.0"
    quality: DataQuality = Field(default_factory=DataQuality)
    location: Optional[GeoPoint] = None
    payload: dict[str, Any] = Field(default_factory=dict)

    @field_validator("event_time", "ingest_time", "processing_time")
    @classmethod
    def _ensure_tz(cls, v: Optional[datetime]) -> Optional[datetime]:
        if v is None:
            return None
        if v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v

    def age_seconds(self) -> float:
        return (datetime.now(timezone.utc) - self.event_time).total_seconds()

    def validate_bounds(self) -> tuple[bool, list[str]]:
        """Validates geographic and telemetry bounds safely without crashing."""
        errors: list[str] = []
        p = self.payload

        # Coordinate checks
        lat = p.get("latitude", self.location.lat if self.location else None)
        lon = p.get("longitude", self.location.lon if self.location else None)
        if lat is not None and not (-90.0 <= float(lat) <= 90.0):
            errors.append(f"latitude {lat} out of range [-90, 90]")
        if lon is not None and not (-180.0 <= float(lon) <= 180.0):
            errors.append(f"longitude {lon} out of range [-180, 180]")

        # Battery check
        battery = p.get("battery_level")
        if battery is not None and not (0.0 <= float(battery) <= 100.0):
            errors.append(f"battery_level {battery} out of range [0, 100]")

        # Signal check
        signal = p.get("signal_strength")
        if signal is not None and not (0.0 <= float(signal) <= 100.0):
            errors.append(f"signal_strength {signal} out of range [0, 100]")

        # Velocity check
        vel = p.get("velocity_kms")
        if vel is not None and float(vel) < 0.0:
            errors.append(f"velocity_kms {vel} cannot be negative")

        return len(errors) == 0, errors


class RiskObject(BaseModel):
    """Output of Space Risk / Earth Risk services."""
    model_config = ConfigDict(protected_namespaces=())

    entity_id: str
    risk_type: str  # "health" | "conjunction" | "unified_space_risk"
    risk_score: float  # 0..1
    confidence: float  # 0..1
    status: str  # "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
    top_evidence: list[str] = Field(default_factory=list)
    model_version: str
    source_event_id: str
    risk_contributors: Optional[dict[str, float]] = None
    data_age_seconds: Optional[float] = None
    computed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SpaceRiskEvent(BaseModel):
    """Standardized Layer 1 output object ready for future Layer 2 (Earth Impact) consumption."""
    model_config = ConfigDict(protected_namespaces=())

    space_event_id: str
    entity_id: str
    event_type: str = "SPACE_RISK"
    risk_score: float
    risk_level: str  # LOW | MEDIUM | HIGH | CRITICAL
    confidence: float
    location: dict[str, float]
    affected_objects: list[str]
    evidence: list[str]
    timestamp: str
    model_version: str = "space-risk-v1"
    requires_human_approval: bool = True
    autonomous_action_allowed: bool = False


class AlertObject(BaseModel):
    alert_id: str = Field(default_factory=lambda: f"alt-{uuid.uuid4().hex[:8]}")
    alert_type: str  # "SPACE_RISK_ALERT" | "CONJUNCTION_ALERT"
    severity: str  # "WARNING" | "HIGH" | "CRITICAL"
    title: str
    message: str
    entity_id: str
    secondary_entity_id: Optional[str] = None
    risk_score: float
    evidence: list[str] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ImpactObject(BaseModel):
    hazard_id: str
    affected_population: int
    affected_roads: list[str] = Field(default_factory=list)
    affected_facilities: list[dict[str, Any]] = Field(default_factory=list)
    accessibility_index: float  # 0..1, 1 = fully accessible
    computed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ConvergenceAlert(BaseModel):
    """Fired when a satellite space risk + Earth hazard overlap geographically.

    compound_threat_index = sqrt(space_risk_score * earth_risk_score).
    This preserves extremes and correctly models the compound disaster scenario.
    """
    convergence_id: str = Field(default_factory=lambda: f"CVG-{uuid.uuid4().hex[:8].upper()}")
    event_type: str = "CONVERGENCE_ALERT"
    compound_threat_index: float          # 0..1, geometric mean of both risks
    severity: str                          # LOW | MEDIUM | HIGH | CRITICAL
    space_entity_id: str
    space_risk_score: float
    space_risk_status: str
    space_top_evidence: list[str] = Field(default_factory=list)
    earth_hazard_type: str
    earth_risk_score: float
    earth_risk_status: str
    spatial_overlap_km2: float
    distance_km: Optional[float] = None
    convergence_zone: Optional[dict] = None
    affected_population: int = 0
    requires_human_approval: bool = True
    autonomous_action_allowed: bool = False
    detected_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    source: str = "convergence_engine_v1"
    gemini_brief: Optional[dict] = None    # Populated by explanation service
