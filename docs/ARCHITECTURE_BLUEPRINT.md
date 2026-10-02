# SkyGuardX-AI: Real-Time Space-to-Earth Decision Intelligence
### *Master Architecture Blueprint & System Specification*

---

> ### **EXECUTIVE CALLOUT: THE CORE THESIS**
> **Current crisis systems fail not at detection, but at decision-making.** When high-volume orbital and terrestrial sensor data changes rapidly, operators face fragmented dashboards and unquantified risks. SkyGuardX-AI provides a unified, real-time decision intelligence pipeline: transforming raw telemetry and hazard alerts into near-real-time risk assessments, modeling cascading infrastructure impacts, evaluating alternative response options via non-destructive what-if simulations, and delivering explainable, human-approved recommendations under strict policy constraints.

---

## 1. Executive Summary & Product Vision

### 1.1 High-Level Concept
**SkyGuardX-AI** is an operational decision intelligence layer designed for time-critical multi-domain environments. Rather than acting as a passive monitoring tool or simple dashboard, it bridges space-based domain awareness with terrestrial crisis management.

```
       ┌────────────────────────────────────────────────────────────────────────┐
       │                 THE 8-STAGE DECISION INTELLIGENCE LOOP                 │
       └────────────────────────────────────────────────────────────────────────┘
  [EVENT] ──> [DETECT] ──> [RISK] ──> [IMPACT] ──> [CASCADE] ──> [WHAT-IF] ──> [DECISION] ──> [APPROVAL]
```

The system continuously resolves five fundamental operational questions:
1. **What is happening?** *(Ingestion, normalization, and deduplication of live multi-source events)*
2. **How severe is the threat?** *(SGP4 orbital propagation, Isolation Forest anomaly scoring, hazard geometry)*
3. **What will break downstream?** *(Geospatial joins across roads, population, hospitals, and power grids)*
4. **What happens if we intervene?** *(Immutable counterfactual what-if simulation comparing candidate actions)*
5. **What is the optimal, defensible action?** *(Deterministic constraint scoring + grounded AI explanation + human approval)*

---

### 1.2 Target Audience & Stakeholder Matrix

| Stakeholder Persona | Core Operational Challenge | SkyGuardX-AI Deliverable |
| :--- | :--- | :--- |
| **Satellite Mission Directors** | Managing collision risks and orbital bus telemetry deviations under severe fuel budgets. | Automated conjunction miss-distance (TCA) and thruster burn vs. lifespan trade-off analysis. |
| **Emergency Response Coordinators** | Inability to predict road blockages and hospital overload during advancing wildfire/flood perimeters. | Real-time exposure mapping, critical transit protection, and proactive ambulance resource staging. |
| **Infrastructure Authorities** | Unseen second- and third-order cascading power grid and communication failures. | Dependency graph propagation modeling multi-hop asset vulnerability and service disruptions. |
| **Defense & Strategic Planners** | Lack of trust in black-box AI outputs during critical dual-use operations. | Deterministic policy enforcement, evidence-grounded natural-language rationale, and immutable audit logs. |

---

## 2. Problem Statement & Motivation

### 2.1 The Operational Breakdown
Modern crisis response teams are overwhelmed by data volume but starved of actionable intelligence. Orbital operators observe telemetry anomalies in isolation, while terrestrial dispatchers monitor severe weather alerts and GIS maps independently. The critical operational gap is connecting an evolving anomaly to its physical downstream consequences and executing defensible response interventions rapidly.

### 2.2 Critical Gaps in Conventional Architectures

| Failure Mode | Conventional Limitation | SkyGuardX-AI Architectural Resolution |
| :--- | :--- | :--- |
| **Detection Without Action** | Threshold breaches trigger sirens without identifying actionable response pathways. | **Action-oriented ranking engine**: Evaluates and prioritizes concrete response protocols. |
| **Siloed Domain Context** | Space assets and terrestrial GIS layers exist in segregated, incompatible databases. | **Canonical Event Schema**: Normalizes space telemetry and terrestrial hazards into a shared entity model. |
| **Batch Latency** | Post-disaster spatial joins take hours, rendering intelligence obsolete before delivery. | **In-memory streaming pipeline**: Evaluates risk, exposure, and cascades in sub-second cycles. |
| **Black-Box AI** | Deep learning models produce opaque scores without verifiable supporting evidence. | **Grounded Explanation Engine**: Restricts generative LLM rationale strictly to deterministic pipeline outputs. |
| **Single-Outcome Bias** | Forecasting models project one deterministic future, concealing tail risks. | **What-If Scenario Diffing**: Evaluates multiple intervention strategies against an immutable baseline. |
| **Autonomous Overreach** | Unchecked automated actuators present catastrophic risks to critical infrastructure. | **Human-in-the-Loop (HITL) Gate**: AI proposes and justifies; authenticated human operators approve. |

---

## 3. System Architecture & Technical Design

### 3.1 End-to-End Component Flow

```
  DATA INGESTION   --> CelesTrak TLE | NOAA/NWS Active Alerts | Synthetic Bus Telemetry
        |
        v
  EVENT GATEWAY    --> Pydantic Validation | Deduplication (UUIDv4) | Event-Time Ordering
        |
        +----------------------------+----------------------------+
        |                                                         |
        v                                                         v
  SPACE INTELLIGENCE ENGINE                                 EARTH INTELLIGENCE ENGINE
  • SGP4 Trajectory Propagation (sgp4)                     • CAP/GeoJSON Hazard Boundaries
  • Conjunction Miss-Distance (TCA)                        • NASA FIRMS Thermal Hotspots
  • Isolation Forest Telemetry Anomaly (sklearn)           • Shapely Geometry Intersections
        |                                                         |
        +----------------------------+----------------------------+
                                     |
                                     v
  SPATIAL IMPACT ENGINE    --> GeoPandas Overpass Joins: Roads, Hospitals, Population
        |
        v
  CASCADE GRAPH ENGINE     --> NetworkX Multi-Hop Failure Propagation (Power -> Transit -> Care)
        |
        v
  WHAT-IF SCENARIO ENGINE  --> Immutable State Tree Diffing (Candidate Action Evaluation)
        |
        v
  DECISION OPTIMIZER       --> Deterministic Utility Scoring + Hard Safety Constraints
        |
        v
  TRANSACTIONAL BOUNDARY   --> IBM Z / z/OS Connect EE Adapter (mTLS, In-Line Scoring, Audit)
        |
        v
  EXPLANATION SERVICE      --> Grounded LLM Rationale (Evidence Citations Only, Zero Hallucinations)
        |
        v
  COMMAND CENTER (WEB)     --> Real-Time WebSocket / SSE Broadcast & Human One-Click Approval
```

---

### 3.2 Canonical Data Contracts

```python
# 1. Canonical Ingestion Event (Core Bus Envelope)
class CanonicalEvent(BaseModel):
    event_id: str                      # UUIDv4 deduplication key
    event_time: datetime               # Sensor occurrence timestamp
    ingest_time: datetime              # Gateway arrival timestamp
    source: Literal["celestrak", "noaa_nws", "firms", "telemetry_sim"]
    domain: Literal["space", "earth"]
    entity_id: str                     # NORAD ID, Alert Polygon ID, or Satellite Bus ID
    payload: Dict[str, Any]            # Raw domain parameters
    data_quality: Literal["live", "sample_fallback", "simulated"]

# 2. Universal Risk Object (Output of Space & Earth Risk Engines)
class RiskObject(BaseModel):
    risk_id: str
    event_ref: str
    domain: Literal["space", "earth"]
    severity_score: float              # Normalized [0.0 - 1.0]
    confidence: float                  # Model uncertainty [0.0 - 1.0]
    risk_vector: Dict[str, float]      # Feature contributions (e.g. miss_km, temp_c)
    computed_at: datetime
```

---

## 4. Deep-Dive Engine Implementations

### 4.1 Space Intelligence: Trajectory & Anomaly Scoring
* **Orbital Dynamics:** Ingests live NORAD Two-Line Element (TLE) ephemerides from **CelesTrak**. Trajectory positions are propagated using the standard **SGP4** numerical model to compute Time of Closest Approach (TCA) and Euclidean miss-distance against space debris fields.
* **Telemetry Anomaly Detection:** An unsupervised **Isolation Forest** ensemble monitors multivariate spacecraft bus metrics (solar array wattage, battery bus voltage, thermal indices) to detect non-linear degradation prior to catastrophic subsystem failure.

### 4.2 Earth Hazard & Spatial Impact Mapping
* **Hazard Vectorization:** Ingests live Common Alerting Protocol (CAP) GeoJSON hazard polygons from the **NOAA / National Weather Service API** and active thermal detections from **NASA FIRMS**.
* **Vectorized Spatial Joins:** Leverages **GeoPandas** and **Shapely** to compute spatial intersections against **OpenStreetMap Overpass** layers within dynamic bounding boxes:
  $$\text{Exposure Score} = \alpha \cdot \text{Roads}_{\text{blocked}} + \beta \cdot \text{Facilities}_{\text{threatened}} + \gamma \cdot \text{Population}_{\text{density}}$$

### 4.3 Dependency Cascade Modeling
* Uses **NetworkX** directed graphs where nodes represent assets (hazard zones, road segments, hospitals, electrical substations) and edges represent operational dependencies.
* When a hazard polygon breaches an asset, the engine propagates downstream vulnerability across connected nodes, computing the **Healthcare Strain Index** and identifying transit evacuation chokepoints.

### 4.4 Counterfactual What-If Simulation Engine
* Operates on an **immutable state tree**: live operational states are never mutated during simulation.
* For each candidate intervention $A_k$, the engine forks a lightweight scenario clone, applies parameter adjustments, and simulates downstream consequences across the cascade graph.

### 4.5 Deterministic Decision Engine & Safety Constraints
Actions are evaluated using a deterministic multi-attribute utility function bounded by non-negotiable safety rules:
$$\text{Score}(A_k) = w_r \cdot \Delta \text{Risk} + w_i \cdot \Delta \text{Impact} - w_c \cdot \text{Cost}(A_k)$$

* **Orbital Propellant Rule:** Never approve a maneuver that reduces thruster fuel below the reserve threshold required for deorbiting.
* **Evacuation Rule:** Never recommend closing a transit artery if alternative route capacity is below the projected evacuation load.

### 4.6 Grounded Explanation Engine
* Generative AI models are strictly prohibited from calculating risks or ranking decisions.
* The LLM receives **only** a structured JSON context payload containing verified upstream facts (risk values, affected roads, what-if comparison deltas, constraint check passes). It translates this structured evidence into concise natural language for the human operator with zero hallucinations.

---

## 5. Enterprise Transactional AI & IBM Z Integration

### 5.1 The Transactional AI Boundary
In high-consequence enterprise operations, time-sensitive decision intelligence must sit directly adjacent to core transactional data. Pushing raw operational data to external public clouds introduces latency, data synchronization risks, and regulatory compliance breaches. SkyGuardX-AI co-locates AI scoring with transactional state through a dedicated boundary adapter.

* **Boundary Adapter Contract:** All AI scoring calls route through `apps/api/infra_ibm_z_adapter.py::transactional_score()`.
* **Enterprise Interconnect:** Built for direct mTLS HTTPS connectivity to z/OS Connect EE, CICS transactions, or an on-platform IBM Z AI inference accelerator.
* **Immutable Audit Logging:** When an operator authorizes a response, the decision envelope, model inputs, and approval timestamp are persisted to an append-only audit log.

---

## 6. Technology Stack & Architectural Trade-Offs

| Layer | Chosen Technology | Architectural Advantage |
| :--- | :--- | :--- |
| **Frontend Command Center** | React 18, Vite, Leaflet, Canvas | Sub-second 60 FPS geospatial rendering, interactive maps and live telemetry streams. |
| **API Gateway & Services** | Python FastAPI, Pydantic v2, WebSockets | Native asynchronous I/O, strict type validation, and seamless Python ML library integration. |
| **Spatial & Graph Analytics** | GeoPandas, Shapely, NetworkX | Vectorized spatial joins against OSM layers and multi-hop dependency cascade modeling. |
| **Machine Learning Core** | SGP4 Library, Scikit-Learn (Isolation Forest) | Deterministic orbital mechanics and compact, explainable anomaly detection models. |
| **Persistence & Caching** | PostgreSQL 16 + PostGIS, Redis 7 | ACID transactional integrity for audit records combined with low-latency spatial caching. |
| **Transactional Boundary** | IBM Z Adapter (mTLS, z/OS Connect EE Ready) | Enterprise security, in-line transactional scoring, and high-throughput auditability. |

---

## 7. Buildathon Verification Checklist & Acceptance Criteria

- [x] **1. Canonical Event Schema:** Validated via Pydantic with strict schema enforcement.
- [x] **2. Replay & Simulation Mode:** Deterministic event replay with clearly tagged timestamps and sources.
- [x] **3. Space Intelligence Engine:** Live CelesTrak TLE integration with real SGP4 trajectory propagation.
- [x] **4. Earth Hazard Engine:** Real-time NOAA/NWS severe weather alerts and CAP polygon ingestion.
- [x] **5. Geospatial Exposure Join:** Sub-second OpenStreetMap Overpass facility and roadway intersections.
- [x] **6. Cascade Dependency Modeling:** Directed NetworkX graph tracing multi-tier infrastructure failures.
- [x] **7. Counterfactual Simulation:** Non-destructive what-if scenario comparison of competing action plans.
- [x] **8. Grounded Recommendations:** Natural-language explanations citing only structured quantitative evidence.
- [x] **9. Human-in-the-Loop Gateway:** One-click operator approval gate with immutable audit persistence.
- [x] **10. Honest Data Labeling:** Visible tags (LIVE, SIMULATED, SAMPLE_FALLBACK) throughout UI and API.
- [x] **11. IBM Z Transactional Boundary:** Pluggable transactional scoring adapter ready for z/OS Connect EE.
- [x] **12. End-to-End Vertical Slice:** Complete operational pipeline running from event to human approval.

---

> ### **NORTH-STAR IMPACT STATEMENT**
> **From space signals to terrestrial action:** SkyGuardX-AI proves that the ultimate measure of emergency intelligence is not the sophistication of an isolated prediction, but the speed, clarity, and accountability with which it enables human decision-makers to act before consequences become irreversible.
