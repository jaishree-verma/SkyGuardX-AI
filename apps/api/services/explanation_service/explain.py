"""
Explanation Service — spec's "evidence-first GenAI" principle (§3.3, §8.3).

The LLM receives ONLY structured evidence that was already computed
deterministically upstream (risk objects, impact metrics, ranked actions). It
is asked to phrase that evidence clearly in a full structured threat briefing —
never to invent a prediction, a number, or a recommendation of its own.

If no API key is configured or the call fails, a deterministic template produces
an equivalent structured JSON so the demo never breaks on "LLM unavailable"
(spec §7.11 mitigation table).

Backend: Google Gemini (free tier via Google AI Studio).
Get a free key at: https://aistudio.google.com/apikey
Set GEMINI_API_KEY in your .env file to activate live AI briefings.
Default model: gemini-2.0-flash (fast, free-tier eligible).
"""
from __future__ import annotations

import json
import logging
from typing import Any

from core.config import get_settings

logger = logging.getLogger("SkyGuard-X.explanation")

# ---------------------------------------------------------------------------
# System prompt — instructs Gemini to produce a 6-section structured briefing
# using ONLY evidence supplied to it. No hallucination allowed.
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = """You are the SkyGuard-X Threat Intelligence Briefing Engine, an AI component inside a real-time space-to-Earth decision support system.

You will receive a JSON payload called "evidence" containing:
- risk: deterministic risk scores, type, status, confidence, and top evidence factors
- impact: estimated affected population, roads, accessibility
- recommended_action: the top-ranked action and its score
- alternatives_considered: other candidate actions that were scored

Your task is to write a concise, structured THREAT BRIEFING in valid JSON with exactly 6 sections.

STRICT RULES:
1. Use ONLY facts, numbers, and categories from the evidence JSON. Never invent statistics.
2. If a field is null or missing, state "Data not available."
3. Keep each section to 2-3 sentences maximum.
4. Use plain language an operator can act on in seconds.
5. Always end "recommended_action" by stating this requires human approval.
6. "consequence_if_ignored" must reason from cascade chain in the evidence — if no cascade data, say so.

Return ONLY valid JSON in this exact structure, no markdown, no extra keys:
{
  "situation": "...",
  "threat_level": "...",
  "earth_impact": "...",
  "cascade_risk": "...",
  "recommended_action": "...",
  "consequence_if_ignored": "..."
}"""


def build_evidence_payload(risk_obj, impact_obj, top_action, all_ranked) -> dict:
    return {
        "risk": {
            "entity_id": risk_obj.entity_id,
            "risk_type": risk_obj.risk_type,
            "risk_score": risk_obj.risk_score,
            "confidence": risk_obj.confidence,
            "status": risk_obj.status,
            "top_evidence": risk_obj.top_evidence,
            "model_version": risk_obj.model_version,
        },
        "impact": {
            "affected_population": impact_obj.affected_population,
            "affected_roads": impact_obj.affected_roads,
            "accessibility_index": impact_obj.accessibility_index,
        } if impact_obj else None,
        "recommended_action": {
            "action_id": top_action.action_id,
            "action_type": top_action.action_type,
            "score": top_action.score,
            "allowed": top_action.allowed,
        } if top_action else None,
        "alternatives_considered": [
            {"action_id": r.action_id, "action_type": r.action_type, "score": r.score, "allowed": r.allowed}
            for r in all_ranked
        ] if all_ranked else [],
    }


def build_convergence_evidence_payload(
    convergence_alert: dict,
    space_risk: dict,
    earth_risk: dict,
) -> dict:
    """Build evidence payload for a compound space+earth convergence event."""
    return {
        "event_type": "MULTI_HAZARD_CONVERGENCE",
        "compound_threat_index": convergence_alert.get("compound_threat_index"),
        "space_risk": {
            "entity_id": space_risk.get("entity_id"),
            "risk_score": space_risk.get("risk_score"),
            "status": space_risk.get("status"),
            "top_evidence": space_risk.get("top_evidence", []),
        },
        "earth_risk": {
            "hazard_type": earth_risk.get("hazard_type"),
            "risk_score": earth_risk.get("risk_score"),
            "status": earth_risk.get("status"),
        },
        "spatial_overlap_km2": convergence_alert.get("spatial_overlap_km2"),
        "convergence_zone": convergence_alert.get("convergence_zone"),
        "affected_population": convergence_alert.get("affected_population"),
    }


# ---------------------------------------------------------------------------
# Deterministic fallback — produces identical JSON structure when LLM is off
# ---------------------------------------------------------------------------
def _deterministic_fallback(evidence: dict) -> dict:
    risk = evidence.get("risk") or {}
    impact = evidence.get("impact")
    action = evidence.get("recommended_action")
    entity = risk.get("entity_id", "The monitored entity")
    status = risk.get("status", "UNKNOWN")
    score = risk.get("risk_score", "N/A")
    confidence = risk.get("confidence", "N/A")

    situation = (
        f"{entity} is reporting a {risk.get('risk_type', 'unknown')} risk event. "
        f"Current risk score: {score}, status: {status}. "
        f"Model confidence: {confidence}."
    )

    factors = risk.get("top_evidence", [])
    threat_level = (
        f"Threat level assessed as {status} based on {len(factors)} contributing factor(s). "
        + (f"Key factors: {', '.join(factors[:3])}." if factors else "No specific factors available.")
    )

    if impact:
        earth_impact = (
            f"Estimated {impact['affected_population']} people and "
            f"{len(impact['affected_roads'])} road segment(s) in the affected zone. "
            f"Road accessibility index: {impact['accessibility_index']:.2f} (1.0 = fully accessible)."
        )
    else:
        earth_impact = "Ground impact assessment not yet available for this event type."

    cascade_risk = (
        "Cascade propagation analysis is available once earth hazard data is correlated. "
        f"Model version: {risk.get('model_version', 'N/A')}."
    )

    if action:
        action_status = "recommended" if action["allowed"] else "BLOCKED by a hard safety constraint"
        recommended_action = (
            f"Action '{action['action_type']}' (ID: {action['action_id']}) is {action_status}, "
            f"decision score: {action['score']:.3f}. "
            "This recommendation requires human operator approval before any action is executed."
        )
    else:
        recommended_action = "No candidate action is currently ranked. Operator should assess manually."

    consequence_if_ignored = (
        f"Without intervention, the {status.lower()} risk state for {entity} may persist or escalate. "
        "Cascade analysis requires earth-hazard correlation data — check /api/v1/cascade for propagation details."
    )

    return {
        "situation": situation,
        "threat_level": threat_level,
        "earth_impact": earth_impact,
        "cascade_risk": cascade_risk,
        "recommended_action": recommended_action,
        "consequence_if_ignored": consequence_if_ignored,
    }


def _deterministic_convergence_fallback(evidence: dict) -> dict:
    cti = evidence.get("compound_threat_index", 0.0)
    sr = evidence.get("space_risk", {})
    er = evidence.get("earth_risk", {})
    pop = evidence.get("affected_population", 0)

    return {
        "situation": (
            f"A multi-hazard convergence event has been detected. "
            f"Satellite {sr.get('entity_id', 'unknown')} is experiencing a {sr.get('status', 'UNKNOWN')} "
            f"space risk while a {er.get('hazard_type', 'ground hazard')} is active on Earth. "
            f"The two threats overlap geographically."
        ),
        "threat_level": (
            f"Compound Threat Index: {cti:.3f}/1.000 — this represents the geometric mean of both risk vectors. "
            f"Space risk: {sr.get('risk_score', 'N/A')} | Earth risk: {er.get('risk_score', 'N/A')}."
        ),
        "earth_impact": (
            f"Approximately {pop:,} people are in the convergence zone. "
            f"Spatial overlap area: {evidence.get('spatial_overlap_km2', 'N/A')} km²."
        ),
        "cascade_risk": (
            "A space-ground convergence creates compound cascade risk: "
            "satellite degradation may reduce communications capacity precisely when ground emergency response demands it."
        ),
        "recommended_action": (
            "Immediate human review is required. "
            "Consider: (1) orbital maneuver to reduce satellite exposure, "
            "(2) ground-asset pre-positioning in hazard zone, "
            "(3) backup communication routing. All actions require human approval."
        ),
        "consequence_if_ignored": (
            f"With a compound threat index of {cti:.3f}, simultaneous satellite failure and ground hazard "
            "escalation could leave the affected population without satellite-linked emergency services "
            "at the moment they are most needed."
        ),
    }


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def generate_explanation(evidence: dict) -> dict:
    """Returns structured briefing: {sections: {...6 keys...}, mode, model}.

    Uses Google Gemini if GEMINI_API_KEY is set (free tier at
    https://aistudio.google.com/apikey). Falls back gracefully to a
    deterministic template if the key is absent or the API call fails.
    """
    settings = get_settings()

    if not settings.gemini_api_key:
        sections = _deterministic_fallback(evidence)
        return {"sections": sections, "mode": "template", "model": None}

    try:
        from google import genai
        from google.genai import types as genai_types

        client = genai.Client(api_key=settings.gemini_api_key)
        response = client.models.generate_content(
            model=settings.explanation_model,
            contents=f"Evidence payload:\n{json.dumps(evidence, indent=2)}",
            config=genai_types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                max_output_tokens=600,
            ),
        )
        raw = response.text.strip()
        # Strip potential markdown code fences
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        sections = json.loads(raw)
        return {"sections": sections, "mode": "llm", "model": settings.explanation_model}

    except Exception as exc:  # LLM unavailable -> fail-safe, never blocks the decision loop
        logger.warning("Gemini explanation failed, falling back to template: %s", exc)
        sections = _deterministic_fallback(evidence)
        return {"sections": sections, "mode": "template_fallback", "model": None}


def generate_convergence_explanation(evidence: dict) -> dict:
    """Generate a compound threat briefing for a space+earth convergence event.

    Uses the same Gemini backend with a convergence-specific prompt addendum.
    Falls back to deterministic template if LLM is unavailable.
    """
    settings = get_settings()

    convergence_prompt = (
        "This is a MULTI-HAZARD CONVERGENCE EVENT where a satellite risk and "
        "an Earth hazard overlap geographically. This is the highest-priority "
        "scenario in the SkyGuard-X system. In your briefing, emphasize the "
        "compound nature of the risk and the urgency of human review."
    )

    if not settings.gemini_api_key:
        sections = _deterministic_convergence_fallback(evidence)
        return {"sections": sections, "mode": "template", "model": None, "is_convergence": True}

    try:
        from google import genai
        from google.genai import types as genai_types

        client = genai.Client(api_key=settings.gemini_api_key)
        combined_prompt = f"{convergence_prompt}\n\nEvidence payload:\n{json.dumps(evidence, indent=2)}"
        response = client.models.generate_content(
            model=settings.explanation_model,
            contents=combined_prompt,
            config=genai_types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                max_output_tokens=700,
            ),
        )
        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        sections = json.loads(raw)
        return {"sections": sections, "mode": "llm", "model": settings.explanation_model, "is_convergence": True}

    except Exception as exc:
        logger.warning("Gemini convergence explanation failed, falling back to template: %s", exc)
        sections = _deterministic_convergence_fallback(evidence)
        return {"sections": sections, "mode": "template_fallback", "model": None, "is_convergence": True}
