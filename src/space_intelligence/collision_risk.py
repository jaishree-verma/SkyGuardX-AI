"""
Collision Risk Calculation Module
Computes 3D Euclidean distances and flags conjunction alerts when proximity < threshold.
"""

from __future__ import annotations
import math
import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import List, Tuple, Optional

from .tle_propagator import SpaceObject

logger = logging.getLogger("SkyGuardX.space_intelligence.collision")


@dataclass
class CollisionAlert:
    """Represents an orbital close-approach proximity alert."""
    obj1_name: str
    obj1_id: str
    obj2_name: str
    obj2_id: str
    distance_km: float
    relative_velocity_km_s: float
    risk_level: str  # "CRITICAL" | "HIGH" | "WARNING" | "NOMINAL"
    threshold_km: float
    timestamp: str


def compute_euclidean_distance(
    pos1: Tuple[float, float, float],
    pos2: Tuple[float, float, float],
) -> float:
    """
    Compute 3D Euclidean distance in kilometers between two geocentric positions:
    d = sqrt((x1 - x2)^2 + (y1 - y2)^2 + (z1 - z2)^2)
    """
    dx = pos1[0] - pos2[0]
    dy = pos1[1] - pos2[1]
    dz = pos1[2] - pos2[2]
    return math.sqrt(dx * dx + dy * dy + dz * dz)


def calculate_relative_velocity(
    vel1: Tuple[float, float, float],
    vel2: Tuple[float, float, float],
) -> float:
    """
    Compute magnitude of relative velocity vector in km/s:
    ||v1 - v2|| = sqrt((vx1 - vx2)^2 + (vy1 - vy2)^2 + (vz1 - vz2)^2)
    """
    dvx = vel1[0] - vel2[0]
    dvy = vel1[1] - vel2[1]
    dvz = vel1[2] - vel2[2]
    return math.sqrt(dvx * dvx + dvy * dvy + dvz * dvz)


def classify_risk_level(distance_km: float) -> str:
    """Classify risk level according to orbital safety thresholds."""
    if distance_km < 1.0:
        return "CRITICAL"
    elif distance_km < 5.0:
        return "HIGH"
    elif distance_km < 10.0:
        return "WARNING"
    elif distance_km < 25.0:
        return "ELEVATED"
    return "NOMINAL"


def detect_conjunctions(
    objects: List[SpaceObject],
    threshold_km: float = 10.0,
    timestamp: Optional[str] = None,
) -> List[CollisionAlert]:
    """
    Pairwise conjunction analysis across space objects.
    Flags any pair passing within threshold_km.
    """
    alerts: List[CollisionAlert] = []
    ts = timestamp or datetime.now(timezone.utc).isoformat()
    n = len(objects)

    for i in range(n):
        for j in range(i + 1, n):
            obj_a = objects[i]
            obj_b = objects[j]

            dist = compute_euclidean_distance(obj_a.position_km, obj_b.position_km)
            if dist <= threshold_km:
                rel_v = calculate_relative_velocity(obj_a.velocity_km_s, obj_b.velocity_km_s)
                risk = classify_risk_level(dist)
                alerts.append(
                    CollisionAlert(
                        obj1_name=obj_a.name,
                        obj1_id=obj_a.catalog_id,
                        obj2_name=obj_b.name,
                        obj2_id=obj_b.catalog_id,
                        distance_km=round(dist, 4),
                        relative_velocity_km_s=round(rel_v, 3),
                        risk_level=risk,
                        threshold_km=threshold_km,
                        timestamp=ts,
                    )
                )

    alerts.sort(key=lambda a: a.distance_km)
    return alerts
