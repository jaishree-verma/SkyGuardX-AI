import { useState, useEffect, useRef } from "react";

const SECTION_META = {
  situation: { label: "🛰 Situation", icon: "🛰", color: "#60a5fa" },
  threat_level: { label: "⚠ Threat Level", icon: "⚠", color: "#f59e0b" },
  earth_impact: { label: "🌍 Earth Impact", icon: "🌍", color: "#34d399" },
  cascade_risk: { label: "⛓ Cascade Risk", icon: "⛓", color: "#a78bfa" },
  recommended_action: { label: "✅ Recommended Action", icon: "✅", color: "#4ade80" },
  consequence_if_ignored: { label: "💀 If Ignored", icon: "💀", color: "#f87171" },
};

const SECTION_ORDER = [
  "situation",
  "threat_level",
  "earth_impact",
  "cascade_risk",
  "recommended_action",
  "consequence_if_ignored",
];

function TypewriterText({ text, speed = 18, onDone }) {
  const [displayed, setDisplayed] = useState("");
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayed("");
    indexRef.current = 0;
    if (!text) return;
    const interval = setInterval(() => {
      indexRef.current++;
      setDisplayed(text.slice(0, indexRef.current));
      if (indexRef.current >= text.length) {
        clearInterval(interval);
        onDone?.();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span style={{ whiteSpace: "pre-wrap" }}>
      {displayed}
      {displayed.length < (text || "").length && (
        <span style={{ opacity: 0.6, animation: "blink 0.7s step-end infinite" }}>█</span>
      )}
    </span>
  );
}

function SectionCard({ sectionKey, text, isActive, isComplete, expanded, onToggle, animate }) {
  const meta = SECTION_META[sectionKey] || { label: sectionKey, color: "#94a3b8" };
  const [done, setDone] = useState(false);

  if (!text) return null;

  return (
    <div
      style={{
        marginBottom: "8px",
        borderRadius: "8px",
        border: `1px solid ${isActive || isComplete ? meta.color + "66" : "#1e293b"}`,
        background: isActive ? `${meta.color}08` : isComplete ? "#0f172a" : "#06090f",
        transition: "all 0.3s ease",
        overflow: "hidden",
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "10px 14px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: "14px" }}>{meta.icon}</span>
        <span
          style={{
            flex: 1,
            fontFamily: "monospace",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: isActive || isComplete ? meta.color : "#475569",
            textTransform: "uppercase",
          }}
        >
          {meta.label}
        </span>
        {isActive && (
          <span style={{ fontSize: "10px", color: meta.color, animation: "pulse 1s ease-in-out infinite" }}>
            ● LIVE
          </span>
        )}
        {isComplete && !isActive && (
          <span style={{ fontSize: "10px", color: "#22c55e" }}>✓</span>
        )}
        <span style={{ color: "#475569", fontSize: "12px" }}>{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div
          style={{
            padding: "0 14px 14px",
            fontFamily: "'Inter', sans-serif",
            fontSize: "13px",
            lineHeight: "1.7",
            color: "#cbd5e1",
            borderTop: `1px solid ${meta.color}22`,
            paddingTop: "12px",
          }}
        >
          {animate && isActive ? (
            <TypewriterText text={text} onDone={() => setDone(true)} />
          ) : (
            text
          )}
        </div>
      )}
    </div>
  );
}

export default function AIThreatBriefing({ explanation, isLoading }) {
  const [expandedSections, setExpandedSections] = useState(
    Object.fromEntries(SECTION_ORDER.map((k) => [k, true]))
  );
  const [activeSection, setActiveSection] = useState(null);
  const [revealedSections, setRevealedSections] = useState([]);
  const revealTimerRef = useRef(null);

  const sections = explanation?.sections || null;
  const mode = explanation?.mode;
  const modelName = explanation?.model;
  const isConvergence = explanation?.is_convergence;

  // Sequentially reveal sections with typewriter for dramatic effect
  useEffect(() => {
    if (!sections) return;
    setRevealedSections([]);
    setActiveSection(null);

    let idx = 0;
    function revealNext() {
      if (idx >= SECTION_ORDER.length) {
        setActiveSection(null);
        return;
      }
      const key = SECTION_ORDER[idx];
      setActiveSection(key);
      setRevealedSections((prev) => (prev.includes(key) ? prev : [...prev, key]));
      idx++;
      revealTimerRef.current = setTimeout(revealNext, 1400);
    }
    revealNext();
    return () => clearTimeout(revealTimerRef.current);
  }, [sections]);

  const toggleSection = (key) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (isLoading) {
    return (
      <div
        style={{
          background: "#030712",
          border: "1px solid #1e293b",
          borderRadius: "12px",
          padding: "20px",
          textAlign: "center",
        }}
      >
        <div style={{ color: "#60a5fa", fontFamily: "monospace", fontSize: "12px", marginBottom: "8px" }}>
          ⬡ GEMINI THREAT ANALYSIS IN PROGRESS...
        </div>
        <div
          style={{
            height: "2px",
            background: "linear-gradient(90deg, transparent, #60a5fa, transparent)",
            animation: "shimmer 1.5s infinite",
            borderRadius: "2px",
          }}
        />
      </div>
    );
  }

  if (!sections) {
    return (
      <div
        style={{
          background: "#030712",
          border: "1px solid #1e293b",
          borderRadius: "12px",
          padding: "20px",
          color: "#475569",
          fontFamily: "monospace",
          fontSize: "12px",
          textAlign: "center",
        }}
      >
        ⬡ Awaiting decision pipeline output...
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#030712",
        border: `1px solid ${isConvergence ? "#f8717166" : "#1e3a5f"}`,
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: isConvergence
          ? "0 0 24px rgba(248,113,113,0.15)"
          : "0 0 24px rgba(96,165,250,0.06)",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: isConvergence
            ? "linear-gradient(135deg, #1a0a0a 0%, #0f172a 100%)"
            : "linear-gradient(135deg, #0a0f1a 0%, #030712 100%)",
          padding: "14px 16px",
          borderBottom: `1px solid ${isConvergence ? "#f8717122" : "#1e3a5f"}`,
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: isConvergence ? "#f87171" : "#60a5fa",
            boxShadow: `0 0 8px ${isConvergence ? "#f87171" : "#60a5fa"}`,
            animation: "pulse 2s ease-in-out infinite",
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: isConvergence ? "#f87171" : "#60a5fa",
              textTransform: "uppercase",
            }}
          >
            {isConvergence ? "⚡ COMPOUND THREAT BRIEFING" : "⬡ AI THREAT BRIEFING"}
          </div>
          <div style={{ fontFamily: "monospace", fontSize: "10px", color: "#475569", marginTop: "2px" }}>
            SkyGuard-X · Gemini Intelligence Engine · Evidence-Grounded
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "3px" }}>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "9px",
              background: mode === "llm" ? "#16213e" : "#1a1a2e",
              color: mode === "llm" ? "#60a5fa" : "#64748b",
              padding: "2px 6px",
              borderRadius: "4px",
              border: `1px solid ${mode === "llm" ? "#1e3a5f" : "#334155"}`,
            }}
          >
            {mode === "llm" ? `✨ ${modelName || "gemini-2.0-flash"}` : "⚙ deterministic fallback"}
          </span>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "9px",
              background: "#0f1f0f",
              color: "#22c55e",
              padding: "2px 6px",
              borderRadius: "4px",
              border: "1px solid #166534",
            }}
          >
            🔒 Requires Human Approval
          </span>
        </div>
      </div>

      {/* Sections */}
      <div style={{ padding: "12px" }}>
        {SECTION_ORDER.map((key) => {
          const isRevealed = revealedSections.includes(key);
          const isAct = activeSection === key;
          const isComp = isRevealed && !isAct;
          return isRevealed ? (
            <SectionCard
              key={key}
              sectionKey={key}
              text={sections[key]}
              isActive={isAct}
              isComplete={isComp}
              expanded={expandedSections[key]}
              onToggle={() => toggleSection(key)}
              animate={mode === "llm"}
            />
          ) : null;
        })}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  );
}
