from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, Preformatted, HRFlowable
)
from reportlab.pdfgen import canvas
import os

out_pdf = "docs/SkyGuardX_Architecture_Blueprint.pdf"
os.makedirs("docs", exist_ok=True)

# Colors
NAVY = colors.HexColor("#0F172A")    # Slate 900
DARK_BLUE = colors.HexColor("#1E3A8A") # Blue 900
ACCENT_BLUE = colors.HexColor("#2563EB") # Blue 600
CYAN = colors.HexColor("#0284C7")    # Sky 600
EMERALD = colors.HexColor("#059669") # Emerald 600
AMBER = colors.HexColor("#D97706")   # Amber 600
RED = colors.HexColor("#DC2626")     # Red 600
TEXT_DARK = colors.HexColor("#1E293B") # Slate 800
TEXT_MUTED = colors.HexColor("#64748B") # Slate 500
BG_PALE = colors.HexColor("#F8FAFC") # Slate 50
BG_ACCENT = colors.HexColor("#EFF6FF") # Blue 50
BORDER = colors.HexColor("#E2E8F0")  # Slate 200

styles = getSampleStyleSheet()

styles.add(ParagraphStyle(
    name="DocTitle", fontName="Helvetica-Bold", fontSize=24, leading=29,
    textColor=colors.white, alignment=TA_LEFT, spaceAfter=8
))
styles.add(ParagraphStyle(
    name="DocSubtitle", fontName="Helvetica", fontSize=13, leading=17,
    textColor=colors.HexColor("#93C5FD"), alignment=TA_LEFT, spaceAfter=4
))
styles.add(ParagraphStyle(
    name="DocMeta", fontName="Helvetica", fontSize=8.5, leading=12,
    textColor=colors.HexColor("#BFDBFE"), alignment=TA_LEFT
))
styles.add(ParagraphStyle(
    name="SecHeading", fontName="Helvetica-Bold", fontSize=15, leading=19,
    textColor=NAVY, spaceBefore=12, spaceAfter=6, keepWithNext=True
))
styles.add(ParagraphStyle(
    name="SubHeading", fontName="Helvetica-Bold", fontSize=11, leading=15,
    textColor=DARK_BLUE, spaceBefore=8, spaceAfter=4, keepWithNext=True
))
styles.add(ParagraphStyle(
    name="SubSubHeading", fontName="Helvetica-Bold", fontSize=9.5, leading=13,
    textColor=ACCENT_BLUE, spaceBefore=6, spaceAfter=3, keepWithNext=True
))
styles.add(ParagraphStyle(
    name="BodyTextCustom", fontName="Helvetica", fontSize=8.7, leading=12.2,
    textColor=TEXT_DARK, spaceAfter=5
))
styles.add(ParagraphStyle(
    name="BulletCustom", fontName="Helvetica", fontSize=8.5, leading=11.8,
    textColor=TEXT_DARK, spaceAfter=3
))
styles.add(ParagraphStyle(
    name="CalloutTitle", fontName="Helvetica-Bold", fontSize=9.5, leading=13,
    textColor=DARK_BLUE, spaceAfter=3
))
styles.add(ParagraphStyle(
    name="CalloutText", fontName="Helvetica", fontSize=8.5, leading=12,
    textColor=TEXT_DARK
))
styles.add(ParagraphStyle(
    name="TH", fontName="Helvetica-Bold", fontSize=8, leading=10,
    textColor=colors.white, alignment=TA_LEFT
))
styles.add(ParagraphStyle(
    name="TD", fontName="Helvetica", fontSize=7.6, leading=10,
    textColor=TEXT_DARK, alignment=TA_LEFT
))
styles.add(ParagraphStyle(
    name="TD_Bold", fontName="Helvetica-Bold", fontSize=7.6, leading=10,
    textColor=NAVY, alignment=TA_LEFT
))
styles.add(ParagraphStyle(
    name="CodeBlock", fontName="Courier", fontSize=7.2, leading=9.5,
    textColor=TEXT_DARK
))

def P(txt, style="BodyTextCustom"):
    return Paragraph(txt, styles[style])

def bullet(txt):
    return Paragraph("• " + txt, styles["BulletCustom"])

def check_bullet(txt):
    return Paragraph("<b>[✓]</b> " + txt, styles["BulletCustom"])

def callout(title, body, border_color=ACCENT_BLUE, bg_color=BG_ACCENT):
    content = [
        [P(title, "CalloutTitle")],
        [P(body, "CalloutText")]
    ]
    t = Table(content, colWidths=[174*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), bg_color),
        ("BOX", (0,0), (-1,-1), 0.8, border_color),
        ("LINEBEFORE", (0,0), (0,-1), 4, border_color),
        ("LEFTPADDING", (0,0), (-1,-1), 10),
        ("RIGHTPADDING", (0,0), (-1,-1), 10),
        ("TOPPADDING", (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
    ]))
    return t

def code_box(text):
    t = Table([[Preformatted(text, styles["CodeBlock"])]], colWidths=[174*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), BG_PALE),
        ("BOX", (0,0), (-1,-1), 0.6, BORDER),
        ("LEFTPADDING", (0,0), (-1,-1), 8),
        ("RIGHTPADDING", (0,0), (-1,-1), 8),
        ("TOPPADDING", (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
    ]))
    return t

def make_table(headers, rows, widths):
    data = [[P(h, "TH") for h in headers]]
    for r in rows:
        formatted_row = []
        for idx, c in enumerate(r):
            if idx == 0:
                formatted_row.append(P(c, "TD_Bold"))
            else:
                formatted_row.append(P(c, "TD"))
        data.append(formatted_row)
    t = Table(data, colWidths=widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), NAVY),
        ("GRID", (0,0), (-1,-1), 0.4, BORDER),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, BG_PALE]),
        ("TOPPADDING", (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING", (0,0), (-1,-1), 6),
        ("RIGHTPADDING", (0,0), (-1,-1), 6),
    ]))
    return t

story = []

# --- COVER HEADER ---
cover_table = Table([
    [P("SkyGuardX-AI", "DocTitle")],
    [P("Real-Time Space-to-Earth Decision Intelligence Platform", "DocSubtitle")],
    [P("Architecture Blueprint & Technical System Specification • IBM Z Datathon Edition", "DocMeta")]
], colWidths=[174*mm])
cover_table.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,-1), NAVY),
    ("LEFTPADDING", (0,0), (-1,-1), 14),
    ("RIGHTPADDING", (0,0), (-1,-1), 14),
    ("TOPPADDING", (0,0), (-1,-1), 14),
    ("BOTTOMPADDING", (0,0), (-1,-1), 14),
    ("BOX", (0,0), (-1,-1), 1, DARK_BLUE)
]))
story.append(cover_table)
story.append(Spacer(1, 6*mm))

# --- EXECUTIVE CALLOUT ---
story.append(callout(
    "EXECUTIVE CALLOUT: THE CORE THESIS",
    "<b>Current crisis systems fail not at detection, but at decision-making.</b> When high-volume orbital and terrestrial sensor data changes rapidly, operators face fragmented dashboards and unquantified risks. SkyGuardX-AI provides a unified, real-time decision intelligence pipeline: transforming raw telemetry and hazard alerts into near-real-time risk assessments, modeling cascading infrastructure impacts, evaluating alternative response options via non-destructive what-if simulations, and delivering explainable, human-approved recommendations under strict policy constraints.",
    ACCENT_BLUE, BG_ACCENT
))
story.append(Spacer(1, 6*mm))

# --- SECTION 1: EXECUTIVE SUMMARY ---
story.append(P("1. Executive Summary & Product Vision", "SecHeading"))
story.append(P("<b>SkyGuardX-AI</b> is an operational decision intelligence layer designed for time-critical multi-domain environments. Rather than acting as a passive monitoring tool or simple dashboard, it bridges space-based domain awareness with terrestrial crisis management.", "BodyTextCustom"))

story.append(code_box("""       THE 8-STAGE END-TO-END DECISION LOOP:
  [EVENT] ──> [DETECT] ──> [RISK] ──> [IMPACT] ──> [CASCADE] ──> [WHAT-IF] ──> [DECISION] ──> [APPROVAL]"""))
story.append(Spacer(1, 3*mm))

story.append(P("The system continuously resolves five fundamental operational questions:", "BodyTextCustom"))
story.append(bullet("<b>What is happening?</b> Ingestion, normalization, and deduplication of live multi-source events."))
story.append(bullet("<b>How severe is the threat?</b> SGP4 orbital propagation, Isolation Forest anomaly scoring, and hazard geometry intersection."))
story.append(bullet("<b>What will break downstream?</b> Vectorized spatial joins across roads, population, hospitals, and power grids."))
story.append(bullet("<b>What happens if we intervene?</b> Immutable counterfactual what-if simulation comparing candidate actions."))
story.append(bullet("<b>What is the optimal, defensible action?</b> Deterministic constraint scoring + grounded AI explanation + human approval."))
story.append(Spacer(1, 4*mm))

story.append(P("Target Audience & Stakeholder Matrix", "SubHeading"))
audience_data = [
    ["Satellite Mission Directors", "Managing collision risks and orbital bus telemetry deviations under severe propellant budgets.", "Automated conjunction miss-distance (TCA) and thruster burn vs. lifespan trade-off analysis."],
    ["Emergency Response Coordinators", "Inability to predict road blockages and hospital overload during advancing wildfire/flood perimeters.", "Real-time exposure mapping, critical transit protection, and proactive ambulance resource staging."],
    ["Infrastructure Authorities", "Unseen second- and third-order cascading power grid and communication failures.", "Dependency graph propagation modeling multi-hop asset vulnerability and service disruptions."],
    ["Defense & Strategic Planners", "Lack of trust in black-box AI outputs during critical dual-use operations.", "Deterministic policy enforcement, evidence-grounded natural-language rationale, and immutable audit logs."]
]
story.append(make_table(["Stakeholder Persona", "Core Operational Challenge", "SkyGuardX-AI Deliverable"], audience_data, [45*mm, 62*mm, 67*mm]))
story.append(Spacer(1, 5*mm))

# --- SECTION 2: PROBLEM STATEMENT ---
story.append(P("2. Problem Statement & Operational Gaps", "SecHeading"))
story.append(P("Modern crisis response teams are overwhelmed by data volume but starved of actionable intelligence. Orbital operators observe telemetry anomalies in isolation, while terrestrial dispatchers monitor severe weather alerts and GIS maps independently. The critical gap is <b>connecting a new event to downstream consequences and selecting a response quickly.</b>", "BodyTextCustom"))
story.append(Spacer(1, 3*mm))

gaps_data = [
    ["Detection Without Action", "Threshold breaches trigger alarms without identifying actionable response pathways.", "Action-oriented ranking engine: Evaluates and prioritizes concrete response protocols."],
    ["Siloed Domain Context", "Space assets and terrestrial GIS layers exist in segregated, incompatible databases.", "Canonical Event Schema: Normalizes space telemetry and terrestrial hazards into a shared entity model."],
    ["Batch Latency", "Post-disaster spatial joins take hours, rendering intelligence obsolete before delivery.", "In-memory streaming pipeline: Evaluates risk, exposure, and cascades in sub-second cycles."],
    ["Black-Box AI", "Deep learning models produce opaque scores without verifiable supporting evidence.", "Grounded Explanation Engine: Restricts generative LLM rationale strictly to deterministic pipeline outputs."],
    ["Single-Outcome Bias", "Forecasting models project one deterministic future, concealing tail risks.", "What-If Scenario Diffing: Evaluates multiple intervention strategies against an immutable baseline."],
    ["Autonomous Overreach", "Unchecked automated actuators present catastrophic risks to critical infrastructure.", "Human-in-the-Loop (HITL) Gate: AI proposes and justifies; authenticated human operators approve."]
]
story.append(make_table(["Failure Mode", "Conventional Limitation", "SkyGuardX-AI Resolution"], gaps_data, [40*mm, 64*mm, 70*mm]))
story.append(Spacer(1, 6*mm))

# --- SECTION 3: SYSTEM ARCHITECTURE ---
story.append(P("3. System Architecture & Technical Design", "SecHeading"))
story.append(P("SkyGuardX-AI is architected around an event-driven, decoupled micro-pipeline. Every stage maintains strict data contract isolation while running within sub-second latencies.", "BodyTextCustom"))

story.append(code_box("""  DATA INGESTION   --> CelesTrak TLE | NOAA/NWS Active Alerts | Synthetic Bus Telemetry
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
  COMMAND CENTER (WEB)     --> Real-Time WebSocket / SSE Broadcast & Human One-Click Approval"""))
story.append(Spacer(1, 4*mm))

story.append(P("Canonical Data Contracts", "SubHeading"))
story.append(P("The architecture strictly separates concerns by passing typed data contracts between engines:", "BodyTextCustom"))
story.append(code_box("""# 1. Canonical Event Gateway Contract (apps/api/core/events.py)
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
    risk_id: str; event_ref: str; domain: Literal["space", "earth"]
    severity_score: float              # Normalized [0.0 - 1.0]
    confidence: float                  # Model uncertainty [0.0 - 1.0]
    risk_vector: Dict[str, float]      # Feature contributions (e.g. miss_km, temp_c)
    computed_at: datetime"""))
story.append(Spacer(1, 5*mm))

# --- SECTION 4: ENGINE IMPLEMENTATION DETAILS ---
story.append(P("4. Deep-Dive Engine Implementations", "SecHeading"))

story.append(P("4.1 Space Intelligence: Trajectory & Anomaly Scoring", "SubHeading"))
story.append(bullet("<b>Orbital Dynamics:</b> Ingests live NORAD Two-Line Element (TLE) ephemerides from CelesTrak. Trajectories are propagated using SGP4 algorithms to compute Time of Closest Approach (TCA) and Euclidean miss-distance against space debris fields."))
story.append(bullet("<b>Telemetry Anomaly Detection:</b> An unsupervised Isolation Forest ensemble monitors multivariate spacecraft bus metrics (solar array wattage, battery bus voltage, thermal indices) to detect non-linear degradation prior to catastrophic subsystem failure."))
story.append(Spacer(1, 2*mm))

story.append(P("4.2 Earth Hazard & Spatial Impact Mapping", "SubHeading"))
story.append(bullet("<b>Hazard Ingestion:</b> Pulls live Common Alerting Protocol (CAP) GeoJSON hazard polygons from NOAA/NWS and thermal hotspot vectors from NASA FIRMS."))
story.append(bullet("<b>Spatial Joins:</b> Employs GeoPandas and Shapely to execute vectorized spatial intersections against OpenStreetMap Overpass vector layers (road centerlines, hospitals, fire stations, residential density proxies) within the dynamic hazard bounding box."))
story.append(Spacer(1, 2*mm))

story.append(P("4.3 Dependency Cascade Modeling", "SubHeading"))
story.append(bullet("<b>Graph Construction:</b> Builds a directed dependency graph using NetworkX. Nodes represent physical assets (hazard perimeters, highway corridors, electrical substations, hospitals) and edges represent operational dependencies."))
story.append(bullet("<b>Failure Propagation:</b> When a hazard polygon intersects a road or power station, the engine propagates downstream vulnerability across connected nodes, computing the Healthcare Strain Index and identifying transit evacuation chokepoints."))
story.append(Spacer(1, 6*mm))

story.append(P("4.4 Counterfactual What-If Simulation Engine", "SubHeading"))
story.append(P("The What-If engine operates on an <b>immutable state tree</b>: live system state is never mutated during evaluation. For each candidate response action, the engine creates an in-memory clone, applies intervention parameters (e.g., <i>'Execute 1.2 m/s thruster burn'</i> or <i>'Close Route 101 and re-route ambulances'</i>), and re-evaluates the cascade graph to forecast outcomes.", "BodyTextCustom"))
story.append(Spacer(1, 2*mm))

story.append(P("4.5 Deterministic Decision Engine & Safety Constraints", "SubHeading"))
story.append(P("Actions are scored using a deterministic multi-attribute utility formula bounded by non-negotiable safety rules:", "BodyTextCustom"))
story.append(code_box("""Score(Action) = [w_risk * Delta_Risk] + [w_impact * Delta_Impact] - [w_cost * Action_Cost]

MANDATORY HARD SAFETY CONSTRAINTS:
1. Orbital Propellant Rule: Never approve a maneuver that reduces thruster fuel below the deorbit reserve threshold.
2. Evacuation Rule: Never close a transit corridor if remaining alternate route capacity is below the projected evacuation load."""))
story.append(Spacer(1, 2*mm))

story.append(P("4.6 Grounded Explanation Engine (Zero Hallucinations)", "SubHeading"))
story.append(P("To ensure mission-critical safety, generative AI models are <b>never permitted to compute predictions, calculate probabilities, or rank actions</b>. The LLM is restricted solely to the final explanation stage: it receives a strictly structured JSON evidence payload (verified risk metrics, affected roads, cascade deltas, policy checks) and translates this structured evidence into clear natural-language rationale for the flight director or incident commander.", "BodyTextCustom"))
story.append(Spacer(1, 5*mm))

# --- SECTION 5: IBM Z INTEGRATION ---
story.append(P("5. Enterprise Transactional AI & IBM Z Integration", "SecHeading"))
story.append(callout(
    "WHY IBM Z MATTERS: THE ARCHITECTURAL CLAIM",
    "In high-consequence enterprise operations, time-sensitive decision intelligence must sit directly adjacent to core transactional data. Pushing raw operational data to external public clouds introduces latency, data synchronization risks, and regulatory compliance breaches. SkyGuardX-AI co-locates AI scoring with transactional state through a dedicated boundary adapter.",
    DARK_BLUE, BG_ACCENT
))
story.append(Spacer(1, 3*mm))

story.append(bullet("<b>Boundary Adapter Contract:</b> All AI scoring calls route through <code>apps/api/infra_ibm_z_adapter.py::transactional_score()</code>, ensuring business logic is decoupled from deployment topology."))
story.append(bullet("<b>Enterprise Interconnect:</b> Ready for direct mTLS HTTPS connectivity to z/OS Connect EE, CICS transactions, or an on-platform IBM Z AI inference accelerator."))
story.append(bullet("<b>Immutable Audit Logging:</b> When an operator authorizes a response, the decision envelope, model inputs, and approval timestamp are persisted to an append-only audit log conforming to enterprise compliance requirements."))
story.append(Spacer(1, 5*mm))

# --- SECTION 6: TECH STACK & TRADE-OFFS ---
story.append(P("6. Technology Stack & Architectural Trade-Offs", "SecHeading"))

tech_data = [
    ["Frontend Command Center", "React 18, Vite, Leaflet, Canvas", "Sub-second 60 FPS geospatial rendering, interactive maps and live telemetry streams."],
    ["API Gateway & Services", "Python FastAPI, Pydantic v2, WebSockets", "Native asynchronous I/O, strict type validation, and seamless Python ML library integration."],
    ["Spatial & Graph Analytics", "GeoPandas, Shapely, NetworkX", "Vectorized spatial joins against OSM layers and multi-hop dependency cascade modeling."],
    ["Machine Learning Core", "SGP4 Library, Scikit-Learn (Isolation Forest)", "Deterministic orbital mechanics and compact, explainable anomaly detection models."],
    ["Persistence & Caching", "PostgreSQL 16 + PostGIS, Redis 7", "ACID transactional integrity for audit records combined with low-latency spatial caching."],
    ["Transactional Boundary", "IBM Z Adapter (mTLS, z/OS Connect EE Ready)", "Enterprise security, in-line transactional scoring, and high-throughput auditability."]
]
story.append(make_table(["Layer", "Technology", "Architectural Rationale"], tech_data, [42*mm, 52*mm, 80*mm]))
story.append(Spacer(1, 4*mm))

story.append(P("Architectural Trade-Off Rationale", "SubHeading"))
story.append(bullet("<b>FastAPI vs. Node.js/Go:</b> Python eliminates serialization boundaries with scientific libraries (<code>sgp4</code>, <code>shapely</code>, <code>scikit-learn</code>), minimizing compute latency."))
story.append(bullet("<b>Deterministic Scoring vs. Pure Deep RL:</b> Aerospace and civil defense demand 100% reproducible auditability. Multi-attribute utility formulas bounded by hard constraints guarantee zero unvetted policy actions."))
story.append(bullet("<b>Evidence-Grounded LLM vs. Autonomous Agents:</b> Confining LLM usage strictly to the final explanation stage prevents hallucinations from corrupting risk calculations or safety enforcement."))
story.append(Spacer(1, 6*mm))

# --- SECTION 7: BUILDATHON CHECKLIST ---
story.append(P("7. Buildathon Verification Checklist & Acceptance Criteria", "SecHeading"))
story.append(P("The SkyGuardX-AI implementation satisfies all 12 key criteria of the Datathon master specification:", "BodyTextCustom"))

check_items = [
    "<b>1. Canonical Event Schema:</b> Ingests, normalizes, and validates multi-domain events via Pydantic.",
    "<b>2. Replay & Simulation Mode:</b> Deterministic event replay with clearly tagged timestamps and sources.",
    "<b>3. Space Intelligence Engine:</b> Live CelesTrak TLE integration with real SGP4 trajectory propagation.",
    "<b>4. Earth Hazard Engine:</b> Real-time NOAA/NWS severe weather alerts and CAP polygon ingestion.",
    "<b>5. Geospatial Exposure Join:</b> Sub-second OpenStreetMap Overpass facility and roadway intersections.",
    "<b>6. Cascade Dependency Modeling:</b> Directed NetworkX graph tracing multi-tier infrastructure failures.",
    "<b>7. Counterfactual Simulation:</b> Non-destructive what-if scenario comparison of competing action plans.",
    "<b>8. Grounded Recommendations:</b> Natural-language explanations citing only structured quantitative evidence.",
    "<b>9. Human-in-the-Loop Gateway:</b> One-click operator approval gate with immutable audit persistence.",
    "<b>10. Honest Data Labeling:</b> Visible tags (LIVE, SIMULATED, SAMPLE_FALLBACK) throughout UI and API.",
    "<b>11. IBM Z Transactional Boundary:</b> Pluggable transactional scoring adapter ready for z/OS Connect EE.",
    "<b>12. End-to-End Vertical Slice:</b> Complete operational pipeline running from event to human approval."
]

for item in check_items:
    story.append(check_bullet(item))
story.append(Spacer(1, 6*mm))

# --- NORTH-STAR CALLOUT ---
story.append(callout(
    "NORTH-STAR IMPACT STATEMENT",
    "<b>From space signals to terrestrial action:</b> SkyGuardX-AI proves that the ultimate measure of emergency intelligence is not the sophistication of an isolated prediction, but the speed, clarity, and accountability with which it enables human decision-makers to act before consequences become irreversible.",
    EMERALD, colors.HexColor("#ECFDF5")
))

# --- FOOTER & HEADER CALLBACK ---
def page_decorations(canvas_obj, doc_obj):
    canvas_obj.saveState()
    # Header line (on later pages)
    if doc_obj.page > 1:
        canvas_obj.setStrokeColor(BORDER)
        canvas_obj.setLineWidth(0.5)
        canvas_obj.line(16*mm, 285*mm, 190*mm, 285*mm)
        canvas_obj.setFont("Helvetica", 7.5)
        canvas_obj.setFillColor(TEXT_MUTED)
        canvas_obj.drawString(16*mm, 288*mm, "SkyGuardX-AI • Master Architecture Blueprint & System Specification")
        canvas_obj.drawRightString(190*mm, 288*mm, "IBM Z Datathon Edition")
    
    # Footer line
    canvas_obj.setStrokeColor(BORDER)
    canvas_obj.setLineWidth(0.5)
    canvas_obj.line(16*mm, 12*mm, 190*mm, 12*mm)
    canvas_obj.setFont("Helvetica", 7.5)
    canvas_obj.setFillColor(TEXT_MUTED)
    canvas_obj.drawString(16*mm, 8*mm, "CONFIDENTIAL & PROPRIETARY • SKYGUARDX-AI DECISION INTELLIGENCE")
    canvas_obj.drawRightString(190*mm, 8*mm, f"Page {doc_obj.page}")
    canvas_obj.restoreState()

doc = SimpleDocTemplate(
    out_pdf, pagesize=A4,
    rightMargin=16*mm, leftMargin=16*mm,
    topMargin=15*mm, bottomMargin=15*mm
)

doc.build(story, onFirstPage=page_decorations, onLaterPages=page_decorations)
print("SUCCESS: Generated", os.path.abspath(out_pdf), "Size:", os.path.getsize(out_pdf), "bytes")
