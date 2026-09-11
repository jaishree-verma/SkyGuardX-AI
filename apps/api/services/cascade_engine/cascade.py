"""
Cascade Engine — spec §7.6.

Represents dependencies as an explicit, versioned graph (networkx) instead of
folding everything into one opaque score. Each edge is a named, human
-readable relationship ("affects", "increases", "reduces") so the Command
Center can show *why* a downstream node changed, not just that it did.
"""
from __future__ import annotations

from dataclasses import dataclass

import networkx as nx

CASCADE_RULESET_VERSION = "cascade-rules-1.0"


def build_wildfire_cascade_graph() -> nx.DiGraph:
    """Spec §7.6 wildfire cascade:
    Wildfire -> affects -> road_accessibility -> changes -> travel_time
    Wildfire -> affects -> population_exposure -> increases -> emergency_demand
    emergency_demand -> loads -> hospital_capacity
    """
    g = nx.DiGraph()
    g.add_edge("wildfire", "road_accessibility", relation="affects", weight=0.8)
    g.add_edge("road_accessibility", "travel_time", relation="changes", weight=0.7)
    g.add_edge("wildfire", "population_exposure", relation="affects", weight=0.9)
    g.add_edge("population_exposure", "emergency_demand", relation="increases", weight=0.85)
    g.add_edge("emergency_demand", "hospital_capacity", relation="loads", weight=0.6)
    return g


def build_flood_cascade_graph() -> nx.DiGraph:
    """Spec §7.6 flood cascade."""
    g = nx.DiGraph()
    g.add_edge("flood", "road_segment", relation="closes", weight=0.9)
    g.add_edge("flood", "population_exposure", relation="exposes", weight=0.8)
    g.add_edge("road_segment", "facility_accessibility", relation="reduces", weight=0.75)
    return g


@dataclass
class CascadeStep:
    source: str
    target: str
    relation: str
    magnitude: float


def propagate(
    graph: nx.DiGraph,
    root: str,
    root_intensity: float,
) -> list[CascadeStep]:
    """Breadth-first propagation of impact intensity through the graph.
    magnitude at each downstream node = upstream magnitude * edge weight,
    which keeps the model simple, deterministic and explainable — exactly
    what the Decision Engine and Explanation Service need to consume."""
    steps: list[CascadeStep] = []
    intensities = {root: root_intensity}
    for source, target in nx.bfs_edges(graph, root):
        data = graph[source][target]
        upstream = intensities.get(source, 0.0)
        magnitude = round(upstream * data["weight"], 4)
        intensities[target] = magnitude
        steps.append(CascadeStep(source=source, target=target, relation=data["relation"], magnitude=magnitude))
    return steps


def cascade_summary(steps: list[CascadeStep]) -> dict[str, float]:
    return {s.target: s.magnitude for s in steps}
