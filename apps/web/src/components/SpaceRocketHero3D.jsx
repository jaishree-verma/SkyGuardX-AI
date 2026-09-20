import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function SpaceRocketHero3D({
  onCheckSatellite,
  onExploreHowItWorks,
  onQuickQuery,
  satCount = 6,
  debrisCount = 3,
  connected = true,
  lastEventTime,
  alertsCount = 0,
}) {
  const mountRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [searchVal, setSearchVal] = useState("");
  const [isHovered, setIsHovered] = useState(false);

  // Three.js 3D Starfield & Orbit Rings Canvas
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 720;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 80;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // Transparent so photo shows through
    container.appendChild(renderer.domElement);

    // 1. 3D Stars / Space Debris Particles (Soft, sparkling, and cleared from center text)
    const starCount = 1100;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      let x = (Math.random() - 0.5) * 320;
      let y = (Math.random() - 0.5) * 220;
      let z = (Math.random() - 0.5) * 200 - 20;

      // Keep particles slightly away from the exact center to keep headline crystal clear
      if (Math.abs(x) < 45 && Math.abs(y) < 30) {
        x += (x >= 0 ? 50 : -50);
        y += (y >= 0 ? 35 : -35);
      }

      starPositions[i * 3] = x;
      starPositions[i * 3 + 1] = y;
      starPositions[i * 3 + 2] = z;

      // Color variation: white, cyan/blue, warm yellow/gold
      const rVal = Math.random();
      if (rVal > 0.85) {
        // Soft Yellow/Gold accent
        starColors[i * 3] = 0.98;
        starColors[i * 3 + 1] = 0.82;
        starColors[i * 3 + 2] = 0.35;
      } else if (rVal > 0.45) {
        // Tech Blue accent
        starColors[i * 3] = 0.4;
        starColors[i * 3 + 1] = 0.7;
        starColors[i * 3 + 2] = 1.0;
      } else {
        // Soft white star
        starColors[i * 3] = 0.88;
        starColors[i * 3 + 1] = 0.92;
        starColors[i * 3 + 2] = 0.98;
      }
    }

    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute("color", new THREE.BufferAttribute(starColors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 0.85,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    // 2. 3D Orbit Trajectory Rings
    const createOrbitRing = (radiusX, radiusY, tiltX, tiltY, colorHex, opacity = 0.4) => {
      const curve = new THREE.EllipseCurve(0, 0, radiusX, radiusY, 0, 2 * Math.PI, false, 0);
      const points = curve.getPoints(120);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: opacity,
        blending: THREE.AdditiveBlending,
      });
      const ring = new THREE.Line(geometry, material);
      ring.rotation.x = tiltX;
      ring.rotation.y = tiltY;
      return ring;
    };

    const ring1 = createOrbitRing(65, 45, Math.PI / 3, Math.PI / 6, 0x3b82f6, 0.45);
    const ring2 = createOrbitRing(80, 52, Math.PI / 2.6, -Math.PI / 7, 0xf5c84c, 0.35);
    const ring3 = createOrbitRing(50, 36, Math.PI / 3.4, Math.PI / 4, 0x60a5fa, 0.3);
    scene.add(ring1);
    scene.add(ring2);
    scene.add(ring3);

    // 3. 3D Earth Globe with Wireframe Grid & Atmospheric Aura (Positioned in space depth)
    const earthGroup = new THREE.Group();
    earthGroup.position.set(42, -26, -18);

    // Earth deep body
    const earthGeo = new THREE.SphereGeometry(22, 36, 36);
    const earthMat = new THREE.MeshBasicMaterial({
      color: 0x081326,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthGroup.add(earthMesh);

    // Earth wireframe longitude/latitude telemetry grid
    const gridGeo = new THREE.SphereGeometry(22.25, 26, 18);
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x2563eb,
      wireframe: true,
      transparent: true,
      opacity: 0.42,
    });
    const gridMesh = new THREE.Mesh(gridGeo, gridMat);
    earthGroup.add(gridMesh);

    // Earth atmospheric glowing rim
    const glowGeo = new THREE.SphereGeometry(24.8, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    earthGroup.add(glowMesh);
    scene.add(earthGroup);

    // 4. Orbiting Satellite 3D Units with Solar Panels & Beacon Halos
    const createSatelliteUnit = (colorHex) => {
      const unit = new THREE.Group();
      // Main Chassis
      const core = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 1.2, 1.2),
        new THREE.MeshBasicMaterial({ color: 0xf8fafc })
      );
      // Solar Arrays
      const panels = new THREE.Mesh(
        new THREE.BoxGeometry(4.4, 0.15, 0.9),
        new THREE.MeshBasicMaterial({ color: colorHex })
      );
      // Outer Sensor Glow
      const beacon = new THREE.Mesh(
        new THREE.SphereGeometry(1.6, 12, 12),
        new THREE.MeshBasicMaterial({
          color: colorHex,
          transparent: true,
          opacity: 0.4,
          blending: THREE.AdditiveBlending,
        })
      );
      unit.add(core);
      unit.add(panels);
      unit.add(beacon);
      return unit;
    };

    const satMesh1 = createSatelliteUnit(0x3b82f6); // SAT-1042 (Blue/Cyber)
    const satMesh2 = createSatelliteUnit(0xf5c84c); // SAT-1001 (Gold/Sentinel)
    const debrisMesh = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.1),
      new THREE.MeshBasicMaterial({ color: 0xef4444, wireframe: true })
    ); // DEB-2098 Debris

    scene.add(satMesh1);
    scene.add(satMesh2);
    scene.add(debrisMesh);

    // 5. Dynamic 3D Conjunction Threat Laser Line
    const conjLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
    ]);
    const conjLineMat = new THREE.LineBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const conjLine = new THREE.Line(conjLineGeo, conjLineMat);
    scene.add(conjLine);

    // Mouse Tracking for Parallax
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
      targetX = x * 15;
      targetY = y * 12;
      setMousePos({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // Animation Loop
    let animId;
    let angle = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      angle += 0.008;

      // Slow 3D rotations
      starField.rotation.y += 0.0004;
      starField.rotation.x += 0.0002;

      earthGroup.rotation.y += 0.002;
      earthGroup.rotation.x = Math.sin(angle * 0.2) * 0.08;

      ring1.rotation.z += 0.001;
      ring2.rotation.z -= 0.0012;
      ring3.rotation.z += 0.0008;

      // Position satellites along orbital paths
      satMesh1.position.x = Math.cos(angle) * 58;
      satMesh1.position.y = Math.sin(angle) * 38;
      satMesh1.position.z = Math.sin(angle * 1.5) * 20;
      satMesh1.rotation.y += 0.02;
      satMesh1.rotation.z = Math.sin(angle) * 0.5;

      satMesh2.position.x = Math.cos(-angle * 0.7) * 72;
      satMesh2.position.y = Math.sin(-angle * 0.7) * 44;
      satMesh2.position.z = Math.cos(angle) * 25;
      satMesh2.rotation.y -= 0.015;

      // Position debris approaching SAT-1042
      debrisMesh.position.x = satMesh1.position.x + Math.sin(angle * 3) * 7;
      debrisMesh.position.y = satMesh1.position.y + Math.cos(angle * 3) * 6;
      debrisMesh.position.z = satMesh1.position.z + Math.sin(angle * 2) * 5;
      debrisMesh.rotation.x += 0.03;
      debrisMesh.rotation.y += 0.04;

      // Update conjunction threat laser line between sat1 and debris
      const linePositions = conjLine.geometry.attributes.position.array;
      linePositions[0] = satMesh1.position.x;
      linePositions[1] = satMesh1.position.y;
      linePositions[2] = satMesh1.position.z;
      linePositions[3] = debrisMesh.position.x;
      linePositions[4] = debrisMesh.position.y;
      linePositions[5] = debrisMesh.position.z;
      conjLine.geometry.attributes.position.needsUpdate = true;
      conjLine.material.opacity = 0.4 + Math.sin(angle * 6) * 0.4; // Pulsing threat laser

      // Smooth camera interpolation with mouse parallax
      currentX += (targetX - currentX) * 0.05;
      currentY += (targetY - currentY) * 0.05;
      camera.position.x = currentX;
      camera.position.y = currentY;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    const q = searchVal.trim().toUpperCase() || "SAT-1042";
    onCheckSatellite(q);
  };

  // 3D Parallax offset for DOM elements
  const parallaxX = mousePos.x * 16;
  const parallaxY = mousePos.y * 12;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: "88vh",
        background: "#06090e",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        perspective: "1200px",
      }}
    >
      {/* 1. Cinematic 8K Space Rocket Background Image Layer with Depth Parallax */}
      <div
        style={{
          position: "absolute",
          top: "-5%",
          left: "-5%",
          width: "110%",
          height: "110%",
          backgroundImage: "url('/space_rocket_hero.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center 42%",
          backgroundRepeat: "no-repeat",
          transform: `translate3d(${-parallaxX * 0.4}px, ${-parallaxY * 0.4}px, 0) scale(1.04)`,
          transition: "transform 0.12s cubic-bezier(0.16, 1, 0.3, 1)",
          zIndex: 1,
          filter: "brightness(0.85) contrast(1.15)",
        }}
      />

      {/* 2. Deep Atmospheric Vignette & Contrast Overlay (Black foundation with gradient falloff) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 75% 35%, rgba(6, 9, 14, 0.2) 0%, rgba(6, 9, 14, 0.75) 60%, rgba(6, 9, 14, 0.98) 95%), linear-gradient(180deg, rgba(6, 9, 14, 0.4) 0%, rgba(6, 9, 14, 0.3) 50%, rgba(6, 9, 14, 1) 100%)",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />

      {/* 3. Three.js 3D WebGL Canvas Layer (Stars, Orbit Rings, Nodes) */}
      <div
        ref={mountRef}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 3,
          pointerEvents: "none",
        }}
      />

      {/* 4. Futuristic HUD Overlay Grid & Scanning Vectors */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 4,
          pointerEvents: "none",
          backgroundImage:
            "linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          opacity: 0.7,
        }}
      />

      {/* 5. Floating Interactive 3D Telemetry HUD (Left Side Widget) */}
      <div
        style={{
          position: "absolute",
          left: "4%",
          top: "22%",
          zIndex: 6,
          background: "rgba(10, 14, 22, 0.82)",
          border: "1px solid rgba(59, 130, 246, 0.35)",
          borderRadius: 8,
          padding: "16px 18px",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          boxShadow: "0 12px 32px rgba(0, 0, 0, 0.6), 0 0 16px rgba(59, 130, 246, 0.2)",
          transform: `translate3d(${parallaxX * 0.8}px, ${parallaxY * 0.8}px, 40px) rotateY(${mousePos.x * 8}deg) rotateX(${-mousePos.y * 6}deg)`,
          transition: "transform 0.15s ease-out",
          width: 220,
          pointerEvents: "auto",
        }}
        className="desktop-nav"
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--blue-light)", fontWeight: 700 }}>
            ● TELEMETRY HUD
          </div>
          <span style={{ fontSize: 9, background: "rgba(59, 130, 246, 0.15)", color: "var(--blue-light)", padding: "1px 5px", borderRadius: 3, fontFamily: "var(--font-mono)" }}>
            Z-STREAM
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div>
            <div style={{ fontSize: 9.5, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>ORBITAL VELOCITY</div>
            <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--yellow)" }}>
              7.82 <span style={{ fontSize: 10, color: "var(--text-muted)" }}>km/s</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 9.5, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>LEO ALTITUDE</div>
            <div style={{ fontSize: 15, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--text)" }}>
              542.4 <span style={{ fontSize: 10, color: "var(--text-muted)" }}>km</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 9.5, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>AI THREAT LEVEL</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
              <span className="status-dot status-NORMAL" />
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--blue-light)", fontFamily: "var(--font-mono)" }}>
                NOMINAL · 0.04
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Floating Interactive 3D Target Tracking Widget (Right Side Widget) */}
      <div
        style={{
          position: "absolute",
          right: "4%",
          top: "28%",
          zIndex: 6,
          background: "rgba(10, 14, 22, 0.82)",
          border: "1px solid rgba(245, 200, 76, 0.35)",
          borderRadius: 8,
          padding: "16px 18px",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          boxShadow: "0 12px 32px rgba(0, 0, 0, 0.6), 0 0 16px rgba(245, 200, 76, 0.15)",
          transform: `translate3d(${-parallaxX * 0.8}px, ${parallaxY * 0.8}px, 40px) rotateY(${mousePos.x * -8}deg) rotateX(${-mousePos.y * 6}deg)`,
          transition: "transform 0.15s ease-out",
          width: 230,
          pointerEvents: "auto",
        }}
        className="desktop-nav"
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--yellow)", fontWeight: 700 }}>
            ⚡ ORBIT SCANNER
          </div>
          <span style={{ fontSize: 9, background: "rgba(245, 200, 76, 0.15)", color: "var(--yellow)", padding: "1px 5px", borderRadius: 3, fontFamily: "var(--font-mono)" }}>
            ACTIVE
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div>
            <div style={{ fontSize: 9.5, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>CONSTELLATION</div>
            <div style={{ fontSize: 15, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--text)" }}>
              {satCount} Satellites · {debrisCount} Debris
            </div>
          </div>

          <div>
            <div style={{ fontSize: 9.5, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>HIGH PRIORITY TARGET</div>
            <div
              onClick={() => onQuickQuery("SAT-1042")}
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--red)",
                fontFamily: "var(--font-mono)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginTop: 2,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--red)", boxShadow: "0 0 6px var(--red)" }} />
              SAT-1042 (RISK 0.88) ➔
            </div>
          </div>

          <div>
            <div style={{ fontSize: 9.5, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>DECISION SPEED</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--blue-light)", fontFamily: "var(--font-mono)" }}>
              &lt; 50ms Real-Time AI
            </div>
          </div>
        </div>
      </div>

      {/* 7. Center Hero Stage (Content Container with 3D Depth) */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          maxWidth: 960,
          width: "92%",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "40px 20px 60px",
          transform: `translate3d(${parallaxX * 0.3}px, ${parallaxY * 0.3}px, 60px)`,
          transition: "transform 0.1s ease-out",
        }}
      >
        {/* Status Chip with Pulse */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "6px 18px",
            background: "rgba(10, 14, 22, 0.88)",
            border: "1px solid rgba(59, 130, 246, 0.4)",
            borderRadius: 30,
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            color: "var(--text-muted)",
            marginBottom: 26,
            backdropFilter: "blur(12px)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.5), 0 0 12px rgba(59, 130, 246, 0.2)",
          }}
        >
          <span className="live-dot" />
          <span style={{ color: "var(--yellow)", fontWeight: 700 }}>
            {connected ? "LIVE ORBITAL STREAM" : "OFFLINE REPLAY"}
          </span>
          <span style={{ color: "var(--border-highlight)" }}>|</span>
          <span>{satCount} Satellites</span>
          <span style={{ color: "var(--border-highlight)" }}>|</span>
          <span>{debrisCount} Debris Tracked</span>
          {alertsCount > 0 && (
            <>
              <span style={{ color: "var(--border-highlight)" }}>|</span>
              <span style={{ color: "var(--red)", fontWeight: 800 }}>
                {alertsCount} Critical {alertsCount === 1 ? "Alert" : "Alerts"}
              </span>
            </>
          )}
        </div>

        {/* Hero Title with High-Contrast Typography */}
        <h1
          style={{
            fontSize: "clamp(34px, 5.5vw, 62px)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.08,
            margin: "0 0 18px",
            color: "#ffffff",
            textShadow: "0 4px 24px rgba(0, 0, 0, 0.9), 0 0 32px rgba(59, 130, 246, 0.3)",
          }}
        >
          REAL-TIME SPACE INTELLIGENCE
          <br />
          <span
            style={{
              background: "linear-gradient(90deg, #60a5fa 0%, #f5c84c 60%, #ffb703 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "none",
            }}
          >
            Before Risk Becomes Impact.
          </span>
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "clamp(14px, 1.8vw, 17px)",
            color: "#d1d9e6",
            maxWidth: 680,
            lineHeight: 1.6,
            margin: "0 0 32px",
            textShadow: "0 2px 8px rgba(0, 0, 0, 0.8)",
          }}
        >
          SKYGUARD XAI transforms real-time satellite telemetry and orbital conjunction data into
          explainable AI decision intelligence — predicting anomalies, tracking debris, and mitigating
          cascading orbital disasters in under 50 milliseconds.
        </p>

        {/* Interactive Search & Live Check Box */}
        <form
          onSubmit={handleSearchSubmit}
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            maxWidth: 580,
            background: "rgba(13, 18, 28, 0.9)",
            border: isHovered ? "1px solid var(--yellow)" : "1px solid rgba(59, 130, 246, 0.5)",
            borderRadius: 8,
            padding: "6px 8px",
            boxShadow: isHovered
              ? "0 8px 30px rgba(0,0,0,0.7), 0 0 20px rgba(245, 200, 76, 0.3)"
              : "0 8px 30px rgba(0,0,0,0.7), 0 0 16px rgba(59, 130, 246, 0.25)",
            backdropFilter: "blur(16px)",
            transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            marginBottom: 22,
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <span style={{ fontSize: 18, padding: "0 10px", opacity: 0.8 }}>🔍</span>
          <input
            type="text"
            placeholder="Enter satellite ID or name (e.g. SAT-1042, STARLINK, NOAA-20)..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#ffffff",
              fontSize: 14,
              fontFamily: "var(--font-mono)",
            }}
          />
          <button
            type="submit"
            className="cta-button"
            style={{
              padding: "10px 22px",
              fontSize: 13,
              borderRadius: 6,
              fontWeight: 800,
            }}
          >
            <span>ANALYZE</span>
            <span>➔</span>
          </button>
        </form>

        {/* Action Buttons: Check Satellite & Explore How It Works */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginBottom: 26 }}>
          <button
            onClick={() => onCheckSatellite("SAT-1042")}
            className="cta-button"
            style={{
              padding: "12px 26px",
              fontSize: 14,
              borderRadius: 6,
              fontWeight: 800,
            }}
          >
            <span>⚡</span>
            <span>CHECK LIVE SATELLITE</span>
          </button>

          <button
            onClick={onExploreHowItWorks}
            className="cta-button-outline"
            style={{
              padding: "11px 22px",
              fontSize: 14,
              borderRadius: 6,
              background: "rgba(10, 14, 22, 0.8)",
              backdropFilter: "blur(8px)",
              borderColor: "rgba(59, 130, 246, 0.4)",
            }}
          >
            <span>↓ EXPLORE HOW IT WORKS</span>
          </button>
        </div>

        {/* Quick Query Direct Chips */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <span
            style={{
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              color: "var(--text-muted)",
              letterSpacing: "0.04em",
            }}
          >
            DIRECT QUERY:
          </span>

          <button
            onClick={() => onQuickQuery("SAT-1042")}
            className="chip-btn"
            style={{
              borderColor: "rgba(230, 57, 70, 0.4)",
              background: "rgba(230, 57, 70, 0.12)",
              color: "#ffffff",
            }}
          >
            <span style={{ color: "var(--red)" }}>🚨</span>
            <span style={{ fontWeight: 700 }}>SAT-1042</span>
            <span style={{ color: "var(--red)", fontSize: 10 }}>(HIGH RISK · CONJUNCTION)</span>
          </button>

          <button
            onClick={() => onQuickQuery("SAT-1001")}
            className="chip-btn"
            style={{
              borderColor: "rgba(59, 130, 246, 0.4)",
              background: "rgba(59, 130, 246, 0.12)",
              color: "#ffffff",
            }}
          >
            <span style={{ color: "var(--blue-light)" }}>🟢</span>
            <span style={{ fontWeight: 700 }}>SAT-1001</span>
            <span style={{ color: "var(--blue-light)", fontSize: 10 }}>(NOMINAL)</span>
          </button>

          <button
            onClick={() => onQuickQuery("SAT-1003")}
            className="chip-btn"
            style={{
              borderColor: "rgba(245, 200, 76, 0.4)",
              background: "rgba(245, 200, 76, 0.12)",
              color: "#ffffff",
            }}
          >
            <span style={{ color: "var(--yellow)" }}>⚠️</span>
            <span style={{ fontWeight: 700 }}>SAT-1003</span>
            <span style={{ color: "var(--yellow)", fontSize: 10 }}>(WARNING)</span>
          </button>
        </div>
      </div>

      {/* Bottom Subtle Gradient Fade into next sections */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "100px",
          background: "linear-gradient(to top, var(--bg) 0%, transparent 100%)",
          zIndex: 8,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
