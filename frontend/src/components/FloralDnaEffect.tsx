"use client";

import { useEffect, useRef, useState } from "react";

interface Node {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  color: string;
  type: "leaf" | "blossom" | "berry";
  size: number;
  angleOffset: number;
}

interface FloatingParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
}

export default function FloralDnaEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });
  const [isIntroDone, setIsIntroDone] = useState(false);
  const progressRef = useRef(0); // Intro progress: 0 to 1

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    window.addEventListener("resize", handleResize);

    // Color definitions matching the botanical theme
      const colors = {
      leafDark: "rgba(20, 24, 28, 0.75)",      // dark slate
      leafLight: "rgba(59, 241, 224, 0.6)",     // teal accent
      blossomSoft: "rgba(229, 229, 227, 0.85)", // ash-mist
      blossomPink: "rgba(235, 87, 87, 0.65)",   // neon red/pink
      berryGold: "rgba(59, 241, 224, 0.3)",    // dim teal
    };

    // DNA Parameters
    const numNodes = 26; // Number of base pairs along the DNA helix
    const helixRadius = Math.min(width * 0.12, 120); // Width of the helix rotation
    const helixHeight = height * 0.85; // Stretch along the height of canvas
    const rotations = 2.0; // Number of full twists

    const nodesStrandA: Node[] = [];
    const nodesStrandB: Node[] = [];

    // Initialize DNA nodes
    for (let i = 0; i < numNodes; i++) {
      const t = i / (numNodes - 1); // Progression along the helix (0 to 1)
      const angle = t * rotations * Math.PI * 2;
      const y = (t - 0.5) * helixHeight; // Centered around Y=0

      // Strand A
      const typeA = i % 3 === 0 ? "leaf" : i % 3 === 1 ? "blossom" : "berry";
      nodesStrandA.push({
        x: 0,
        y: y,
        z: 0,
        baseX: 0,
        baseY: y,
        baseZ: 0,
        angleOffset: angle,
        type: typeA,
        size: typeA === "leaf" ? 6 + Math.random() * 4 : 4 + Math.random() * 3,
        color: typeA === "leaf" ? colors.leafLight : typeA === "blossom" ? colors.blossomSoft : colors.berryGold,
      });

      // Strand B (Offset by 180 degrees / PI)
      const typeB = i % 3 === 0 ? "blossom" : i % 3 === 1 ? "berry" : "leaf";
      nodesStrandB.push({
        x: 0,
        y: y,
        z: 0,
        baseX: 0,
        baseY: y,
        baseZ: 0,
        angleOffset: angle + Math.PI,
        type: typeB,
        size: typeB === "leaf" ? 6 + Math.random() * 4 : 4 + Math.random() * 3,
        color: typeB === "leaf" ? colors.leafLight : typeB === "blossom" ? colors.blossomSoft : colors.berryGold,
      });
    }

    // Floating botanical particles (leaves drifting in wind)
    const floaters: FloatingParticle[] = Array.from({ length: 25 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: -0.2 - Math.random() * 0.5,
      vy: 0.3 + Math.random() * 0.6,
      size: 3 + Math.random() * 8,
      opacity: 0.1 + Math.random() * 0.35,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.02,
    }));

    // Mouse tracking setup
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    let globalRotationAngle = 0;

    // Drawing helpers for leaf and flower shapes
    const drawLeaf = (ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, angle: number, color: string) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.fillStyle = color;
      ctx.beginPath();
      // Draw simple pointed leaf shape
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(size, -size / 2, size * 1.5, 0);
      ctx.quadraticCurveTo(size, size / 2, 0, 0);
      ctx.fill();
      ctx.restore();
    };

    const drawBlossom = (ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = color;
      
      // Draw 5 petals
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(0, -size / 2, size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.rotate((Math.PI * 2) / 5);
      }
      
      // Center disc
      ctx.fillStyle = "rgba(59, 241, 224, 0.9)"; // Neon center
      ctx.beginPath();
      ctx.arc(0, 0, size / 3, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    };

    const drawBerry = (ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) => {
      ctx.beginPath();
      ctx.arc(cx, cy, size, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      
      // Little highlight shine
      ctx.beginPath();
      ctx.arc(cx - size/3, cy - size/3, size/4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.fill();
    };

    // Main render loop
    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Progress intro animation
      if (progressRef.current < 1.0) {
        progressRef.current += 0.007; // Fades in and forms over ~2.5 seconds
        if (progressRef.current >= 1.0) {
          progressRef.current = 1.0;
          setIsIntroDone(true);
        }
      }

      const intro = progressRef.current;
      const easeIntro = 1 - Math.pow(1 - intro, 3); // Cubic ease out

      // Rotate helix slowly
      globalRotationAngle += 0.003 + (mouseRef.current.active ? 0.002 : 0);

      const cx = width * 0.72; // Position in the right half of the hero section
      const cy = height * 0.5;

      // Draw floating background particles (drifting leaves)
      ctx.lineWidth = 1;
      floaters.forEach(floater => {
        // Move particle
        floater.x += floater.vx;
        floater.y += floater.vy;
        floater.rotation += floater.rotationSpeed;

        // Wrap around boundaries
        if (floater.x < -20) floater.x = width + 20;
        if (floater.y > height + 20) {
          floater.y = -20;
          floater.x = Math.random() * width;
        }

        ctx.save();
        ctx.globalAlpha = floater.opacity * easeIntro;
        drawLeaf(ctx, floater.x, floater.y, floater.size, floater.rotation, colors.leafLight);
        ctx.restore();
      });

      // Temporary arrays to store projected 2D coordinates for drawing links
      const strandAProjected = nodesStrandA.map((node) => {
        // Rotate in 3D around Y
        const currentAngle = node.angleOffset + globalRotationAngle;
        const currentRadius = helixRadius * easeIntro;

        const rx = Math.sin(currentAngle) * currentRadius;
        const rz = Math.cos(currentAngle) * currentRadius;

        // Apply mouse interaction (subtle attraction/repulsion on screen coordinates)
        let px = cx + rx;
        let py = cy + node.baseY;

        if (mouseRef.current.active) {
          const dx = mouseRef.current.x - px;
          const dy = mouseRef.current.y - py;
          const dist = Math.hypot(dx, dy);
          if (dist < 180) {
            // Push nodes away slightly based on distance
            const force = (180 - dist) / 180;
            px -= (dx / dist) * force * 15;
            py -= (dy / dist) * force * 15;
          }
        }

        return { x: px, y: py, z: rz, node };
      });

      const strandBProjected = nodesStrandB.map((node) => {
        const currentAngle = node.angleOffset + globalRotationAngle;
        const currentRadius = helixRadius * easeIntro;

        const rx = Math.sin(currentAngle) * currentRadius;
        const rz = Math.cos(currentAngle) * currentRadius;

        let px = cx + rx;
        let py = cy + node.baseY;

        if (mouseRef.current.active) {
          const dx = mouseRef.current.x - px;
          const dy = mouseRef.current.y - py;
          const dist = Math.hypot(dx, dy);
          if (dist < 180) {
            const force = (180 - dist) / 180;
            px -= (dx / dist) * force * 15;
            py -= (dy / dist) * force * 15;
          }
        }

        return { x: px, y: py, z: rz, node };
      });

      // 2. Draw connecting base pairs (vines)
      // Sort depth or just render with transparency proportional to depth (z)
      ctx.globalAlpha = 1.0;
      for (let i = 0; i < numNodes; i++) {
        const ptA = strandAProjected[i];
        const ptB = strandBProjected[i];

        // Z ranges from -helixRadius to +helixRadius
        // Map depth to transparency to simulate 3D occlusion
        const avgZ = (ptA.z + ptB.z) / 2;
        const zAlpha = (avgZ + helixRadius) / (helixRadius * 2); // 0 (back) to 1 (front)
        const alpha = (0.05 + zAlpha * 0.45) * easeIntro;

        ctx.strokeStyle = `rgba(59, 241, 224, ${alpha * 0.5})`;
        ctx.lineWidth = 1.5 + zAlpha * 1.5;

        // Draw organic curved vine connection between A and B
        ctx.beginPath();
        ctx.moveTo(ptA.x, ptA.y);
        
        // Control point for curve (makes it look like a bending vine)
        const midX = (ptA.x + ptB.x) / 2;
        const midY = (ptA.y + ptB.y) / 2;
        const curveOffset = Math.sin(globalRotationAngle + i * 0.3) * 12 * (ptA.z / helixRadius);
        ctx.quadraticCurveTo(midX, midY + curveOffset, ptB.x, ptB.y);
        ctx.stroke();

        // Draw a tiny leaf in the middle of the vine connection occasionally
        if (i % 2 === 0) {
          ctx.save();
          ctx.globalAlpha = (0.2 + zAlpha * 0.6) * easeIntro;
          const leafX = midX + curveOffset * 0.5;
          const leafY = midY + curveOffset * 0.5;
          const leafAngle = Math.atan2(ptB.y - ptA.y, ptB.x - ptA.x) + Math.PI / 4;
          drawLeaf(ctx, leafX, leafY, 4 + zAlpha * 3, leafAngle, colors.leafLight);
          ctx.restore();
        }
      }

      // 3. Draw Helix Strands (vines tracking nodes)
      for (let s = 0; s < 2; s++) {
        const pts = s === 0 ? strandAProjected : strandBProjected;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(59, 241, 224, ${0.1 * easeIntro})`;
        ctx.lineWidth = 1.2;
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < numNodes; i++) {
          const xc = (pts[i].x + pts[i - 1].x) / 2;
          const yc = (pts[i].y + pts[i - 1].y) / 2;
          ctx.quadraticCurveTo(pts[i - 1].x, pts[i - 1].y, xc, yc);
        }
        ctx.stroke();
      }

      // 4. Draw node particles (leaves, blossoms, berries)
      // Draw back particles first (z < 0) and then front particles (z >= 0) to get correct depth ordering
      const allProjected = [...strandAProjected, ...strandBProjected].sort((a, b) => a.z - b.z);

      allProjected.forEach(({ x, y, z, node }) => {
        const zAlpha = (z + helixRadius) / (helixRadius * 2); // 0 to 1
        const scale = 0.6 + zAlpha * 0.6;
        ctx.save();
        ctx.globalAlpha = (0.35 + zAlpha * 0.65) * easeIntro;

        const currentSize = node.size * scale;
        
        if (node.type === "leaf") {
          const leafRotation = node.angleOffset + globalRotationAngle * 1.5;
          drawLeaf(ctx, x, y, currentSize, leafRotation, node.color);
        } else if (node.type === "blossom") {
          drawBlossom(ctx, x, y, currentSize, node.color);
        } else if (node.type === "berry") {
          drawBerry(ctx, x, y, currentSize, node.color);
        }

        ctx.restore();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {/* Interactive canvas overlaying the background */}
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          pointerEvents: "auto",
        }}
      />

      {/* Intro transition overlay: subtle botanical shimmer on entrance */}
      {!isIntroDone && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "transparent",
            opacity: 1 - progressRef.current,
            pointerEvents: "none",
            transition: "opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
            zIndex: 10,
          }}
        />
      )}
    </div>
  );
}
