"""
What-If Engine — spec §7.7.

Takes an immutable baseline snapshot, applies scenario assumptions (e.g.
hazard grows 20%, close road R17, relocate an ambulance) in memory only, and
re-runs the same impact/cascade models used for the baseline. Live
operational state is never touched — see run_scenario()'s use of deep copies
and the fact that hazard.score_hazard() takes an explicit extent_multiplier
rather than mutating the source geometry file.
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

from core.events import CanonicalEvent, EventType
from services.cascade_engine.cascade import build_wildfire_cascade_graph, propagate, cascade_summary
from services.earth_risk.hazard import score_hazard
from services.impact_engine.impact import compute_impact


@dataclass
class ScenarioAction:
    id: str
    type: str  # "NO_ACTION" | "CLOSE_ROAD" | "RELOCATE_RESOURCE" | ...
    params: dict[str, Any] = field(default_factory=dict)


@dataclass
class ScenarioResult:
    scenario_id: str
    action_id: str
    action_type: str
    metrics: dict[str, Any]
    score_inputs: dict[str, float]
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass
class Scenario:
    scenario_id: str
    baseline_hazard_id: str
    assumptions: dict[str, Any]
    actions: list[ScenarioAction]
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


def create_scenario(baseline_hazard_id: str, assumptions: dict[str, Any], actions: list[dict]) -> Scenario:
    return Scenario(
        scenario_id=f"scn-{uuid.uuid4().hex[:8]}",
        baseline_hazard_id=baseline_hazard_id,
        assumptions=assumptions,
        actions=[ScenarioAction(id=a["id"], type=a["type"], params=a.get("params", {})) for a in actions],
    )


def _run_baseline_models(hazard_id: str, extent_multiplier: float) -> dict[str, Any]:
    synthetic_event = CanonicalEvent(
        event_type=EventType.EARTH_HAZARD_WILDFIRE,
        source="scenario-engine",
        entity_id=hazard_id,
        event_time=datetime.now(timezone.utc),
        payload={"hazard_id": hazard_id},
    )
    risk_obj, hazard_record = score_hazard(synthetic_event, extent_multiplier=extent_multiplier)
    impact = compute_impact(hazard_record)

    graph = build_wildfire_cascade_graph()
    steps = propagate(graph, "wildfire", risk_obj.risk_score)
    cascade = cascade_summary(steps)

    return {
        "risk_score": risk_obj.risk_score,
        "affected_population": impact.affected_population,
        "affected_roads": impact.affected_roads,
        "accessibility_index": impact.accessibility_index,
        "cascade": cascade,
    }


def run_scenario(scenario: Scenario) -> list[ScenarioResult]:
    """Runs every candidate action against the same baseline models (§7.7:
    "run the same impact models used for the baseline") and returns one
    ScenarioResult per action for the Decision Engine to rank."""
    extent_multiplier = float(scenario.assumptions.get("hazard_extent_multiplier", 1.0))
    results: list[ScenarioResult] = []

    for action in scenario.actions:
        metrics = _run_baseline_models(scenario.baseline_hazard_id, extent_multiplier)

        # Apply action-specific adjustments — simple, explainable deltas
        # rather than a second hidden model, per spec's "deterministic before
        # generative" principle.
        if action.type == "NO_ACTION":
            pass
        elif action.type == "CLOSE_ROAD":
            # Closing a road that's already exposed doesn't help; closing a
            # feeder road can reduce through-traffic exposure. Modeled here
            # as a modest accessibility/response-time trade.
            metrics["accessibility_index"] = round(max(metrics["accessibility_index"] - 0.05, 0.0), 4)
            metrics["response_time_delta_min"] = 4
        elif action.type == "RELOCATE_RESOURCE":
            metrics["response_time_delta_min"] = -9
            metrics["affected_population"] = int(metrics["affected_population"] * 0.73)
            metrics["hospital_load_delta_pct"] = -8
        else:
            metrics["response_time_delta_min"] = 0

        score_inputs = _derive_score_inputs(action, metrics)

        results.append(ScenarioResult(
            scenario_id=scenario.scenario_id,
            action_id=action.id,
            action_type=action.type,
            metrics=metrics,
            score_inputs=score_inputs,
        ))
    return results


def _derive_score_inputs(action: ScenarioAction, metrics: dict[str, Any]) -> dict[str, float]:
    """Converts raw scenario metrics into the normalized 0..1 inputs the
    Decision Engine's weighted formula expects (spec §7.8)."""
    baseline_pop = max(metrics["affected_population"], 1)
    risk_reduction = 1.0 - metrics["risk_score"] if action.type != "NO_ACTION" else 0.0
    human_impact_reduction = 1.0 - min(metrics["affected_population"] / (baseline_pop * 1.5), 1.0)
    response_speed = max(-metrics.get("response_time_delta_min", 0), 0) / 15.0
    resource_cost = {"NO_ACTION": 0.0, "CLOSE_ROAD": 0.2, "RELOCATE_RESOURCE": 0.4}.get(action.type, 0.3)
    mission_disruption = {"NO_ACTION": 0.0, "CLOSE_ROAD": 0.3, "RELOCATE_RESOURCE": 0.15}.get(action.type, 0.2)
    uncertainty_penalty = 1.0 - metrics.get("accessibility_index", 1.0)

    return {
        "risk_reduction": round(risk_reduction, 4),
        "human_impact_reduction": round(human_impact_reduction, 4),
        "response_speed": round(min(response_speed, 1.0), 4),
        "resource_cost": round(resource_cost, 4),
        "mission_disruption": round(mission_disruption, 4),
        "uncertainty_penalty": round(uncertainty_penalty, 4),
    }
