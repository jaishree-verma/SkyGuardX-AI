"""
TLE & Orbit Propagation Module
Uses skyfield and sgp4 to parse TLEs and propagate 3D orbital positions.
"""

from __future__ import annotations
import math
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List, Tuple, Dict, Any

import requests
from skyfield.api import EarthSatellite, load, wgs84

logger = logging.getLogger("SkyGuardX.space_intelligence.tle")

# Bundled fallback TLEs for offline/resilience use
FALLBACK_TLES = [
    (
        "ISS (ZARYA)",
        "1 25544U 98067A   24045.52481481  .00016717  00000-0  30246-3 0  9992",
        "2 25544  51.6412  60.1234 0005623  95.4321 264.7890 15.50123456123456",
    ),
    (
        "FENGYUN 1C DEB",
        "1 29742U 99025AZG 24045.31245678  .00001234  00000-0  45678-3 0  9991",
        "2 29742  98.7123 210.4567 0234567 145.6789 216.1234 14.12345678876543",
    ),
    (
        "HST (HUBBLE)",
        "1 20580U 90037B   24045.45678901  .00000456  00000-0  12345-4 0  9993",
        "2 20580  28.4690 110.2345 0002890 280.1234 150.4567 15.09123456123456",
    ),
]


@dataclass
class SpaceObject:
    """Represents a tracked satellite or orbital debris fragment."""
    name: str
    catalog_id: str
    object_type: str  # "SATELLITE" | "DEBRIS"
    epoch: str
    # 3D Geocentric coordinates (km)
    x_km: float
    y_km: float
    z_km: float
    # Velocity components (km/s)
    vx_km_s: float
    vy_km_s: float
    vz_km_s: float
    # Subpoint geospatial coordinates
    latitude_deg: float
    longitude_deg: float
    altitude_km: float
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    @property
    def position_km(self) -> Tuple[float, float, float]:
        """3D Cartesian geocentric position (X, Y, Z) in km."""
        return (self.x_km, self.y_km, self.z_km)

    @property
    def velocity_km_s(self) -> Tuple[float, float, float]:
        """Velocity vector (Vx, Vy, Vz) in km/s."""
        return (self.vx_km_s, self.vy_km_s, self.vz_km_s)

    @property
    def speed_km_s(self) -> float:
        """Scalar orbital speed in km/s."""
        return math.sqrt(self.vx_km_s**2 + self.vy_km_s**2 + self.vz_km_s**2)


def fetch_celestrak_tle(catalog_id: int | str, timeout: float = 8.0) -> Tuple[str, str, str]:
    """
    Fetch live TLE lines from CelesTrak for a NORAD catalog ID.
    Returns (name, line1, line2).
    """
    url = f"https://celestrak.org/NORAD/elements/gp.php?CATNR={catalog_id}&FORMAT=TLE"
    try:
        resp = requests.get(url, timeout=timeout)
        resp.raise_for_status()
        lines = [line.strip() for line in resp.text.strip().splitlines() if line.strip()]
        if len(lines) >= 3:
            return lines[0], lines[1], lines[2]
        elif len(lines) == 2:
            return f"NORAD-{catalog_id}", lines[0], lines[1]
    except Exception as exc:
        logger.warning(f"Live CelesTrak TLE fetch failed for {catalog_id}: {exc}. Using fallback.")

    # Match in fallback list
    cat_str = str(catalog_id)
    for name, l1, l2 in FALLBACK_TLES:
        if cat_str in l1:
            return name, l1, l2
    return FALLBACK_TLES[0]


def fetch_celestrak_json(catalog_id: int | str, timeout: float = 8.0) -> Dict[str, Any]:
    """
    Fetch CelesTrak General Perturbations (GP) JSON dataset.
    """
    url = f"https://celestrak.org/NORAD/elements/gp.php?CATNR={catalog_id}&FORMAT=json"
    try:
        resp = requests.get(url, timeout=timeout)
        resp.raise_for_status()
        data = resp.json()
        if isinstance(data, list) and len(data) > 0:
            return data[0]
        return data
    except Exception as exc:
        logger.warning(f"Live CelesTrak JSON fetch failed for {catalog_id}: {exc}.")
        return {"NORAD_CAT_ID": str(catalog_id), "OBJECT_NAME": f"NORAD-{catalog_id}", "STATUS": "OFFLINE_FALLBACK"}


def parse_tle_dataset(tle_text_or_lines: str | List[str]) -> List[Tuple[str, str, str]]:
    """
    Parse multi-object TLE streams/files into tuples of (name, line1, line2).
    """
    if isinstance(tle_text_or_lines, str):
        raw_lines = tle_text_or_lines.strip().splitlines()
    else:
        raw_lines = tle_text_or_lines

    cleaned = [ln.strip() for ln in raw_lines if ln.strip() and not ln.strip().startswith("#")]
    parsed = []
    i = 0
    while i < len(cleaned):
        if cleaned[i].startswith("1 ") and i + 1 < len(cleaned) and cleaned[i + 1].startswith("2 "):
            name = f"OBJECT-{cleaned[i][2:7].strip()}"
            parsed.append((name, cleaned[i], cleaned[i + 1]))
            i += 2
        elif i + 2 < len(cleaned) and cleaned[i + 1].startswith("1 ") and cleaned[i + 2].startswith("2 "):
            name = cleaned[i]
            parsed.append((name, cleaned[i + 1], cleaned[i + 2]))
            i += 3
        else:
            i += 1
    return parsed


def propagate_orbit(
    name: str,
    line1: str,
    line2: str,
    target_time: Optional[datetime] = None,
    object_type: Optional[str] = None,
) -> SpaceObject:
    """
    Propagate orbital state to 3D Cartesian coordinates (X, Y, Z) and subpoint WGS84.
    Uses skyfield and sgp4 under the hood.
    """
    ts = load.timescale()
    if target_time is None:
        t = ts.now()
        iso_epoch = datetime.now(timezone.utc).isoformat()
    else:
        if target_time.tzinfo is None:
            target_time = target_time.replace(tzinfo=timezone.utc)
        t = ts.from_datetime(target_time)
        iso_epoch = target_time.isoformat()

    sat = EarthSatellite(line1, line2, name, ts)
    geocentric = sat.at(t)

    # 3D Geocentric Cartesian Coordinates (km)
    x, y, z = geocentric.position.km
    vx, vy, vz = geocentric.velocity.km_per_s

    # Subpoint geospatial coordinates (WGS84)
    subpoint = wgs84.subpoint(geocentric)
    lat = subpoint.latitude.degrees
    lon = subpoint.longitude.degrees
    alt = subpoint.elevation.km

    # Determine object type if not supplied
    if object_type is None:
        object_type = "DEBRIS" if "DEB" in name.upper() or "R/B" in name.upper() else "SATELLITE"

    # Extract Catalog ID from line 1 (columns 3-7)
    catalog_id = line1[2:7].strip() if len(line1) >= 7 else "UNKNOWN"

    return SpaceObject(
        name=name,
        catalog_id=catalog_id,
        object_type=object_type,
        epoch=iso_epoch,
        x_km=float(x),
        y_km=float(y),
        z_km=float(z),
        vx_km_s=float(vx),
        vy_km_s=float(vy),
        vz_km_s=float(vz),
        latitude_deg=float(lat),
        longitude_deg=float(lon),
        altitude_km=float(alt),
    )


def propagate_objects(
    tles: List[Tuple[str, str, str]],
    target_time: Optional[datetime] = None,
) -> List[SpaceObject]:
    """Propagate a list of (name, line1, line2) TLE tuples simultaneously."""
    return [propagate_orbit(name, l1, l2, target_time=target_time) for name, l1, l2 in tles]
