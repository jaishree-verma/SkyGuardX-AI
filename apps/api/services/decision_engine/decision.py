"""
Decision Engine — spec §7.8.

Deterministic: same inputs + same model/weight versions always produce the
same ranking (§9.5 checklist item, §8.3 Reproducibility). The LLM is used
*after* this stage only, for explanation — never to influence the ranking
itself (spec's evidence-first-GenAI / hallucination-control principle).
"""
from __future__ import annotations

from dataclasses import dataclass

from core.config import get_settings
from services.scenario_engine.whatif import ScenarioResult

DECISION_MODEL_VERSION = "decision-1.0"


@dataclass
class HardConstraints:
    safety_ok: bool = True
    authorization_valid: bool = True
    required_data_quality: bool = True

    def passes(self) -> bool:
        return self.safety_ok and self.authorization_valid and self.required_data_quality


@dataclass
class RankedAction:
    action_id: str
    action_type: str
    score: float
    allowed: bool
    reason_if_blocked: str | None
    contributing_factors: dict[str, float]


def score_action(result: ScenarioResult) -> float:
    weights = get_settings().decision_weights
    total = 0.0
    for factor, weight in weights.items():
        total += weight * result.score_inputs.get(factor, 0.0)
    return round(total, 4)


def rank_actions(
    results: list[ScenarioResult],
    constraints_by_action: dict[str, HardConstraints] | None = None,
) -> list[RankedAction]:
    """score(action) = + risk_reduction + human_impact_reduction + response_speed
                        - resource_cost - mission_disruption - uncertainty_penalty
    (spec §7.8 formula, implemented via configurable weights in core/config.py)

    HARD RULES: safety_ok AND authorization_valid AND required_data_quality.
    If any fails -> action = NOT_ALLOWED, regardless of score.
    """
    constraints_by_action = constraints_by_action or {}
    ranked: list[RankedAction] = []

    for result in results:
        constraints = constraints_by_action.get(result.action_id, HardConstraints())
        score = score_action(result)
        allowed = constraints.passes()
        reason = None
        if not allowed:
            failed = [
                name for name, ok in [
                    ("safety", constraints.safety_ok),
                    ("authorization", constraints.authorization_valid),
                    ("data_quality", constraints.required_data_quality),
                ] if not ok
            ]
            reason = f"NOT_ALLOWED: failed hard constraint(s): {', '.join(failed)}"

        ranked.append(RankedAction(
            action_id=result.action_id,
            action_type=result.action_type,
            score=score,
            allowed=allowed,
            reason_if_blocked=reason,
            contributing_factors=result.score_inputs,
        ))

    # Allowed actions ranked by score desc; blocked actions pushed to the end
    # regardless of score so an unsafe-but-high-scoring action never surfaces
    # as the top recommendation.
    ranked.sort(key=lambda r: (not r.allowed, -r.score))
    return ranked


def top_recommendation(ranked: list[RankedAction]) -> RankedAction | None:
    allowed = [r for r in ranked if r.allowed]
    return allowed[0] if allowed else None
