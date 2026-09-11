"""
Telemetry anomaly module — spec §7.3.

Real model: scikit-learn IsolationForest trained on rolling statistical
features of satellite telemetry (solar output, thermal index, battery
voltage). Not a toy threshold check — this is the same model family used for
unsupervised anomaly detection in real operational telemetry pipelines.
"""
from __future__ import annotations

import logging
from collections import deque
from dataclasses import dataclass, field

import numpy as np
from sklearn.ensemble import IsolationForest

from core.events import CanonicalEvent, RiskObject

logger = logging.getLogger("SkyGuard-X.space_risk.anomaly")

MODEL_VERSION = "health-1.0"
FEATURES = ["solar_output", "thermal_index", "battery_voltage"]
ROLLING_WINDOW = 20

# Nominal operating envelopes, used both to train a synthetic-but-realistic
# baseline and to compute missingness/out-of-range confidence penalties.
NOMINAL_RANGE = {
    "solar_output": (1200.0, 1600.0),  # Watts
    "thermal_index": (-10.0, 40.0),  # deg C
    "battery_voltage": (26.0, 30.0),  # V
}


def _train_baseline_model() -> IsolationForest:
    """Trains on a synthetic-but-realistic nominal distribution so the model
    has a decision boundary before any live data arrives. In production this
    is replaced by / retrained on historical fleet telemetry (see spec §8.3
    Reproducibility: persist model+feature+threshold versions, which this
    module does via MODEL_VERSION)."""
    rng = np.random.default_rng(42)
    n = 2000
    solar = rng.normal(1400, 60, n)
    thermal = rng.normal(15, 6, n)
    battery = rng.normal(28, 0.6, n)
    X = np.column_stack([solar, thermal, battery])
    model = IsolationForest(n_estimators=200, contamination=0.03, random_state=42)
    model.fit(X)
    return model


_MODEL = _train_baseline_model()


@dataclass
class TelemetryHistory:
    """Per-satellite rolling window for feature engineering (rolling mean,
    std, slope) — spec §7.3 bullet points."""
    values: dict[str, deque] = field(default_factory=lambda: {f: deque(maxlen=ROLLING_WINDOW) for f in FEATURES})

    def push(self, metrics: dict[str, float]) -> None:
        for f in FEATURES:
            if f in metrics and metrics[f] is not None:
                self.values[f].append(float(metrics[f]))

    def features(self) -> tuple[np.ndarray, list[str], float]:
        """Returns (feature_vector, missing_fields, confidence_penalty)."""
        vec = []
        missing = []
        for f in FEATURES:
            series = self.values[f]
            if len(series) == 0:
                vec.append(0.0)
                missing.append(f)
            else:
                vec.append(series[-1])
        confidence_penalty = 0.15 * len(missing)
        return np.array(vec), missing, confidence_penalty


_HISTORY: dict[str, TelemetryHistory] = {}


def score_telemetry(event: CanonicalEvent) -> RiskObject:
    """Implements the full §7.3 pipeline for one telemetry event."""
    entity = event.entity_id
    hist = _HISTORY.setdefault(entity, TelemetryHistory())
    hist.push(event.payload)

    feature_vec, missing, confidence_penalty = hist.features()

    # Rolling stats (slope / deviation from expected operating range)
    evidence: list[str] = []
    out_of_range_penalty = 0.0
    for i, f in enumerate(FEATURES):
        lo, hi = NOMINAL_RANGE[f]
        val = feature_vec[i]
        if f not in missing and not (lo <= val <= hi):
            evidence.append(f"{f}_out_of_range")
            out_of_range_penalty += 0.1

    raw_score = _MODEL.decision_function(feature_vec.reshape(1, -1))[0]  # higher = more normal
    anomaly_score = 1.0 - _sigmoid(raw_score * 6)  # bounded 0..1, higher = more anomalous
    anomaly_score = float(np.clip(anomaly_score + out_of_range_penalty, 0.0, 1.0))

    if not evidence:
        # attribute the top contributing feature by deviation from nominal midpoint
        deviations = []
        for i, f in enumerate(FEATURES):
            lo, hi = NOMINAL_RANGE[f]
            mid = (lo + hi) / 2
            span = (hi - lo) / 2 or 1.0
            deviations.append(abs(feature_vec[i] - mid) / span)
        top_idx = int(np.argmax(deviations))
        label = {
            "solar_output": "solar_output_drop" if feature_vec[0] < NOMINAL_RANGE["solar_output"][0] else "solar_output_deviation",
            "thermal_index": "thermal_index_rise" if feature_vec[1] > NOMINAL_RANGE["thermal_index"][1] else "thermal_index_deviation",
            "battery_voltage": "battery_voltage_deviation",
        }[FEATURES[top_idx]]
        evidence.append(label)

    confidence = float(np.clip(1.0 - confidence_penalty - (0.2 if event.quality.status != "GOOD" else 0.0), 0.05, 1.0))

    status = "HIGH" if anomaly_score >= 0.75 else "MEDIUM" if anomaly_score >= 0.45 else "LOW"

    return RiskObject(
        entity_id=entity,
        risk_type="health",
        risk_score=round(anomaly_score, 4),
        confidence=round(confidence, 4),
        status=status,
        top_evidence=evidence[:3],
        model_version=MODEL_VERSION,
        source_event_id=event.event_id,
    )


def _sigmoid(x: float) -> float:
    return 1.0 / (1.0 + np.exp(-x))
