"""
SQLAlchemy models mirroring the spec §6.5 data model. PostGIS geometry columns
are used for anything spatial (hazard, asset) so real GIS queries (ST_Intersects
etc.) are available directly in the database, not just in-process shapely.
"""
from __future__ import annotations

from datetime import datetime, timezone

from geoalchemy2 import Geometry
from sqlalchemy import JSON, Boolean, Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


def _now():
    return datetime.now(timezone.utc)


class Satellite(Base):
    __tablename__ = "satellite"
    satellite_id = Column(String, primary_key=True)
    mission_state = Column(String, default="NOMINAL")
    health_state = Column(String, default="UNKNOWN")
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)


class Telemetry(Base):
    __tablename__ = "telemetry"
    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String, unique=True, index=True)
    satellite_id = Column(String, ForeignKey("satellite.satellite_id"), index=True)
    event_time = Column(DateTime(timezone=True))
    metrics = Column(JSON)
    quality = Column(JSON)


class SpaceObject(Base):
    __tablename__ = "space_object"
    object_id = Column(String, primary_key=True)
    type = Column(String)
    orbit_state = Column(JSON)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)


class Conjunction(Base):
    __tablename__ = "conjunction"
    id = Column(Integer, primary_key=True, autoincrement=True)
    satellite_id = Column(String, index=True)
    object_id = Column(String, index=True)
    tca = Column(DateTime(timezone=True))
    miss_distance_km = Column(Float)
    probability = Column(Float)


class Observation(Base):
    __tablename__ = "observation"
    id = Column(Integer, primary_key=True, autoincrement=True)
    source = Column(String)
    observed_at = Column(DateTime(timezone=True))
    geometry = Column(Geometry(geometry_type="GEOMETRY", srid=4326))
    quality = Column(JSON)


class Hazard(Base):
    __tablename__ = "hazard"
    hazard_id = Column(String, primary_key=True)
    type = Column(String)
    probability = Column(Float)
    geometry = Column(Geometry(geometry_type="GEOMETRY", srid=4326))
    severity = Column(String)
    validity = Column(JSON)


class Asset(Base):
    __tablename__ = "asset"
    asset_id = Column(String, primary_key=True)
    type = Column(String)
    geometry = Column(Geometry(geometry_type="GEOMETRY", srid=4326))
    capacity = Column(Integer, nullable=True)
    status = Column(String, default="NOMINAL")


class Impact(Base):
    __tablename__ = "impact"
    id = Column(Integer, primary_key=True, autoincrement=True)
    hazard_id = Column(String, ForeignKey("hazard.hazard_id"), index=True)
    asset_id = Column(String, ForeignKey("asset.asset_id"), index=True)
    exposure = Column(Float)
    accessibility = Column(Float)
    demand = Column(Float, nullable=True)


class ScenarioRow(Base):
    __tablename__ = "scenario"
    scenario_id = Column(String, primary_key=True)
    baseline_id = Column(String)
    assumptions = Column(JSON)
    created_at = Column(DateTime(timezone=True), default=_now)


class ScenarioResultRow(Base):
    __tablename__ = "scenario_result"
    id = Column(Integer, primary_key=True, autoincrement=True)
    scenario_id = Column(String, ForeignKey("scenario.scenario_id"), index=True)
    action = Column(String)
    metrics = Column(JSON)
    score = Column(Float)


class Recommendation(Base):
    __tablename__ = "recommendation"
    recommendation_id = Column(String, primary_key=True)
    action = Column(String)
    confidence = Column(Float)
    evidence = Column(JSON)
    approval_state = Column(String, default="PENDING")  # PENDING | APPROVED | REJECTED
    created_at = Column(DateTime(timezone=True), default=_now)


class AuditRecord(Base):
    __tablename__ = "audit"
    id = Column(Integer, primary_key=True, autoincrement=True)
    actor = Column(String)
    timestamp = Column(DateTime(timezone=True), default=_now)
    recommendation_id = Column(String, ForeignKey("recommendation.recommendation_id"), nullable=True)
    event = Column(JSON)
