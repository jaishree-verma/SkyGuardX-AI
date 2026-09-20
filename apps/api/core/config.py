"""
Central configuration for SkyGuard-X.

All tunables live here so the rest of the codebase never hardcodes a constant.
Values are overridable via environment variables (see .env.example).
"""
from __future__ import annotations

import os
from functools import lru_cache
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseModel):
    # --- App ---
    app_name: str = "SkyGuard-X"
    environment: str = os.getenv("NEXUS_ENV", "development")

    # --- Database ---
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://nexusz:nexusz@localhost:5432/nexusz",
    )
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # --- Event bus ---
    # "inproc" runs an in-process asyncio queue bus (default, laptop demo).
    # "kafka" switches to aiokafka against KAFKA_BOOTSTRAP_SERVERS.
    event_bus_backend: str = os.getenv("EVENT_BUS_BACKEND", "inproc")
    kafka_bootstrap_servers: str = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")

    # --- Simulator ---
    simulator_enabled: bool = os.getenv("SIMULATOR_ENABLED", "true").lower() == "true"
    telemetry_interval_seconds: float = float(os.getenv("TELEMETRY_INTERVAL_S", "4"))
    hazard_interval_seconds: float = float(os.getenv("HAZARD_INTERVAL_S", "20"))

    # --- IBM Z transactional boundary ---
    # When false (default in this sandbox build), the boundary is a simulated
    # in-process adapter. Set true + IBM_Z_ENDPOINT_URL to call a real endpoint.
    ibm_z_integration_enabled: bool = os.getenv("IBM_Z_INTEGRATION_ENABLED", "false").lower() == "true"
    ibm_z_endpoint_url: str = os.getenv("IBM_Z_ENDPOINT_URL", "")
    ibm_z_client_cert_path: str = os.getenv("IBM_Z_CLIENT_CERT_PATH", "")

    # --- Explanation / LLM ---
    # Set GEMINI_API_KEY to a free key from https://aistudio.google.com/apikey
    # Falls back to a deterministic template automatically if unset.
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    explanation_model: str = os.getenv("EXPLANATION_MODEL", "gemini-2.0-flash")


    # --- Risk thresholds (spec §7.3 / §7.8) ---
    risk_status_high: float = 0.75
    risk_status_medium: float = 0.45
    late_event_grace_seconds: float = 30.0
    data_staleness_ttl_seconds: float = 60.0

    # --- Decision engine weights (spec §7.8) ---
    decision_weights: dict = {
        "risk_reduction": 0.30,
        "human_impact_reduction": 0.30,
        "response_speed": 0.15,
        "resource_cost": -0.10,
        "mission_disruption": -0.10,
        "uncertainty_penalty": -0.15,
    }


@lru_cache
def get_settings() -> Settings:
    return Settings()
