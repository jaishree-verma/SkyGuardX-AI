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

from pydantic import BaseModel, Field, field_validator


class EventType(str, Enum):
    TELEMETRY_ANOMALY = "telemetry_anomaly"
    TELEMETRY_NOMINAL = "telemetry_nominal"
    CONJUNCTION_UPDATE = "conjunction_update"
    EARTH_HAZARD_WILDFIRE = "earth_hazard_wildfire"
    EARTH_HAZARD_FLOOD = "earth_hazard_flood"
    INFRASTRUCTURE_CHANGE = "infrastructure_change"


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
    entity_id: str  # e.g. "SAT-1042", "HAZARD-77"
    event_time: datetime  # when the source says it happened
    ingest_time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    schema_version: str = "1.0"
    quality: DataQuality = Field(default_factory=DataQuality)
    location: Optional[GeoPoint] = None
    payload: dict[str, Any] = Field(default_factory=dict)

    @field_validator("event_time", "ingest_time")
    @classmethod
    def _ensure_tz(cls, v: datetime) -> datetime:
        if v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v

    def age_seconds(self) -> float:
        return (datetime.now(timezone.utc) - self.event_time).total_seconds()


class RiskObject(BaseModel):
    """Output of Space Risk / Earth Risk services."""
    entity_id: str
    risk_type: str  # "health" | "conjunction" | "wildfire" | "flood"
    risk_score: float  # 0..1
    confidence: float  # 0..1
    status: str  # "LOW" | "MEDIUM" | "HIGH"
    top_evidence: list[str] = Field(default_factory=list)
    model_version: str
    source_event_id: str
    computed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ImpactObject(BaseModel):
    hazard_id: str
    affected_population: int
    affected_roads: list[str] = Field(default_factory=list)
    affected_facilities: list[dict[str, Any]] = Field(default_factory=list)
    accessibility_index: float  # 0..1, 1 = fully accessible
    computed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
