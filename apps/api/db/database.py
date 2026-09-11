"""
Database engine/session setup. Falls back to SQLite (no PostGIS geometry
columns active) automatically if PostgreSQL is unreachable, so `uvicorn
main:app` still runs standalone for quick local development without Docker
Compose. Use docker-compose for the full PostGIS-backed experience.
"""
from __future__ import annotations

import logging

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from core.config import get_settings
from db.models import Base

logger = logging.getLogger("SkyGuard-X.db")

settings = get_settings()

try:
    engine = create_engine(settings.database_url, pool_pre_ping=True)
    with engine.connect():
        pass
    logger.info("connected to %s", settings.database_url)
except Exception as exc:
    logger.warning("could not connect to %s (%s); falling back to local SQLite for dev", settings.database_url, exc)
    engine = create_engine("sqlite:///./nexusz_dev.db", connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db() -> None:
    """Create each table independently. On plain SQLite (no SpatiaLite
    extension loaded) the Geometry-column tables (observation/hazard/asset)
    can fail to create — that's fine for the demo since spatial ops run
    in-process via shapely (see impact_engine/impact.py), not via the DB.
    Non-spatial tables (audit, recommendation, scenario, ...) must still be
    created so the audit trail keeps working even without PostGIS."""
    for table in Base.metadata.sorted_tables:
        try:
            table.create(bind=engine, checkfirst=True)
        except Exception as exc:
            logger.warning("schema creation skipped for table=%s (%s)", table.name, exc)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
