import React, { useState } from "react";

/**
 * BrandLogoIcon — Dynamic Morphing Aerospace Shield & Radar Icon
 * 
 * Base state: Geometric aerospace shield with orbital node & crosshairs.
 * Hover state: Transforms with dynamic rotating radar sweep, glowing halo expansion,
 * and illuminated quantum energy core with 300ms cubic-bezier transition.
 */
export default function BrandLogoIcon({ connected = true }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="img"
      aria-label="Home"
      style={{
        position: "relative",
        width: 40,
        height: 40,
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        transform: isHovered ? "scale(1.08)" : "scale(1)",
        boxShadow: isHovered
          ? "0 0 24px rgba(59, 130, 246, 0.6), 0 0 12px rgba(245, 200, 76, 0.4), inset 0 0 14px rgba(59, 130, 246, 0.3)"
          : "0 0 14px rgba(59, 130, 246, 0.25)",
        background: isHovered
          ? "linear-gradient(135deg, rgba(59, 130, 246, 0.35) 0%, rgba(245, 200, 76, 0.2) 100%)"
          : "linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(20, 28, 48, 0.9) 100%)",
        border: isHovered
          ? "1.5px solid var(--yellow)"
          : "1px solid rgba(59, 130, 246, 0.45)",
      }}
    >
      <svg
        width="26"
        height="26"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
          transform: isHovered ? "rotate(15deg)" : "rotate(0deg)",
        }}
      >
        {/* Outer Shield / Hexagonal Defense Perimeter */}
        <path
          d={
            isHovered
              ? "M16 2 L28 8 V18 C28 24.5 16 29.5 16 29.5 C16 29.5 4 24.5 4 18 V8 Z"
              : "M16 3 L27 8.5 V17.5 C27 23.5 16 28 16 28 C16 28 5 23.5 5 17.5 V8.5 Z"
          }
          fill={isHovered ? "rgba(59, 130, 246, 0.25)" : "rgba(59, 130, 246, 0.12)"}
          stroke={isHovered ? "#f5c84c" : "#60a5fa"}
          strokeWidth={isHovered ? "1.8" : "1.4"}
          strokeLinejoin="round"
          style={{ transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}
        />

        {/* Dynamic Inner Radar Sweep Ring */}
        <circle
          cx="16"
          cy="16"
          r="8"
          stroke={isHovered ? "#60a5fa" : "rgba(255, 255, 255, 0.25)"}
          strokeWidth="1.2"
          strokeDasharray={isHovered ? "4 3" : "none"}
          style={{
            transition: "all 0.3s ease",
            transformOrigin: "16px 16px",
          }}
        />

        {/* Tactical Crosshair Axes */}
        <line
          x1="16"
          y1="9"
          x2="16"
          y2="23"
          stroke={isHovered ? "rgba(245, 200, 76, 0.85)" : "rgba(255, 255, 255, 0.3)"}
          strokeWidth="1"
          strokeLinecap="round"
          style={{ transition: "stroke 0.25s ease" }}
        />
        <line
          x1="9"
          y1="16"
          x2="23"
          y2="16"
          stroke={isHovered ? "rgba(245, 200, 76, 0.85)" : "rgba(255, 255, 255, 0.3)"}
          strokeWidth="1"
          strokeLinecap="round"
          style={{ transition: "stroke 0.25s ease" }}
        />

        {/* Central Quantum Node Core */}
        <circle
          cx="16"
          cy="16"
          r={isHovered ? "3.2" : "2.2"}
          fill={isHovered ? "#f5c84c" : "#2ec4b6"}
          style={{
            transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            filter: isHovered ? "drop-shadow(0 0 6px #f5c84c)" : "none",
          }}
        />

        {/* Orbiting Satellite Particle (Expands on Hover) */}
        <circle
          cx={isHovered ? "22" : "20"}
          cy={isHovered ? "11" : "12"}
          r={isHovered ? "2" : "1.4"}
          fill="#60a5fa"
          style={{
            transition: "all 0.3s ease",
            filter: "drop-shadow(0 0 4px #60a5fa)",
          }}
        />
      </svg>

      {/* Live Connectivity Ping Dot */}
      <span
        className={connected ? "radar-live" : ""}
        style={{
          position: "absolute",
          top: -2,
          right: -2,
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: connected ? "var(--teal)" : "var(--red)",
          boxShadow: `0 0 10px ${connected ? "var(--teal)" : "var(--red)"}`,
          transition: "transform 0.2s ease",
          transform: isHovered ? "scale(1.25)" : "scale(1)",
        }}
      />
    </div>
  );
}
