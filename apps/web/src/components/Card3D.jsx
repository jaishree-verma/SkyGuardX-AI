import React, { useRef, useState } from "react";

/**
 * Card3D — Interactive 3D Perspective Tilt Card with Specular Glare
 * Provides hardware-accelerated 3D mouse tracking, smooth damping, and holographic sheen.
 */
export default function Card3D({
  children,
  className = "",
  style = {},
  maxTilt = 8,
  glare = true,
  scale = 1.02,
  elevation = 16,
  onClick,
  id,
}) {
  const cardRef = useRef(null);
  const [transform, setTransform] = useState({
    rotateX: 0,
    rotateY: 0,
    glareX: 50,
    glareY: 50,
    glareOpacity: 0,
    isHovered: false,
  });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setTransform({
      rotateX,
      rotateY,
      glareX,
      glareY,
      glareOpacity: 0.22,
      isHovered: true,
    });
  };

  const handleMouseLeave = () => {
    setTransform((prev) => ({
      ...prev,
      rotateX: 0,
      rotateY: 0,
      glareOpacity: 0,
      isHovered: false,
    }));
  };

  const { rotateX, rotateY, glareX, glareY, glareOpacity, isHovered } = transform;

  return (
    <div
      ref={cardRef}
      id={id}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`card-3d-wrapper ${className}`}
      style={{
        perspective: "1000px",
        transformStyle: "preserve-3d",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      <div
        className="card-3d-inner"
        style={{
          width: "100%",
          height: "100%",
          transform: isHovered
            ? `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale}) translateZ(${elevation}px)`
            : "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1) translateZ(0px)",
          transition: isHovered
            ? "transform 0.08s ease-out, box-shadow 0.15s ease-out"
            : "transform 0.45s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.45s ease-out",
          position: "relative",
          overflow: "hidden",
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        {children}

        {/* Dynamic Holographic Glare Sheen */}
        {glare && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background: `radial-gradient(circle 320px at ${glareX}% ${glareY}%, rgba(255, 255, 255, ${glareOpacity}), transparent 70%)`,
              transition: isHovered ? "opacity 0.08s ease-out" : "opacity 0.4s ease-out",
              opacity: glareOpacity,
              borderRadius: "inherit",
              mixBlendMode: "overlay",
              zIndex: 10,
            }}
          />
        )}
      </div>
    </div>
  );
}
