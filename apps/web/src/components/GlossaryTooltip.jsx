import React, { useState } from "react";

const DEFINITIONS = {
  Conjunction: "Two space objects predicted to pass within a potentially dangerous distance (<5 km).",
  "Risk Score": "Estimated severity (0–100%) computed by combining telemetry anomalies, subsystem health, and conjunction distance.",
  Confidence: "How confident the AI model is in its assessment based on data quality and completeness.",
  "Data Age": "Time elapsed since the latest telemetry frame was received from the satellite.",
  "IBM Z Boundary": "Transactional boundary co-locating real-time AI scoring and audit logging with core ledger transactions.",
  "Isolation Forest": "Unsupervised machine learning model that detects multivariate telemetry outliers without fixed thresholds.",
};

export default function GlossaryTooltip({ term, children }) {
  const [visible, setVisible] = useState(false);
  const text = DEFINITIONS[term] || term;

  return (
    <span
      style={{ position: "relative", display: "inline-flex", alignItems: "center", cursor: "help" }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <span style={{ borderBottom: "1px dotted var(--text-muted)" }}>{children || term}</span>
      <span style={{ marginLeft: 4, fontSize: 10, color: "var(--text-muted)" }}>ⓘ</span>

      {visible && (
        <span
          style={{
            position: "absolute",
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginBottom: 6,
            background: "#161d2b",
            border: "1px solid var(--border)",
            color: "var(--text)",
            padding: "6px 10px",
            borderRadius: 4,
            fontSize: 11,
            width: 220,
            lineHeight: 1.35,
            zIndex: 9999,
            boxShadow: "0 6px 18px rgba(0,0,0,0.6)",
            pointerEvents: "none",
            fontFamily: "var(--font-ui)",
            textAlign: "left",
          }}
        >
          <strong style={{ color: "var(--teal)", display: "block", marginBottom: 2 }}>{term}</strong>
          {text}
        </span>
      )}
    </span>
  );
}
