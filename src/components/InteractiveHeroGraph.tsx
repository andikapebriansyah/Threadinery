"use client";

import React, { useEffect, useRef } from "react";

interface GraphNode {
  id: string;
  baseXPct: number; // 0 - 100%
  baseYPct: number; // 0 - 100%
  label: string;
  type: "character" | "location" | "event" | "faction" | "concept";
  speed: number;
  phase: number;
  amplitude: number;
}

interface GraphEdge {
  from: string;
  to: string;
  isDiscovered?: boolean;
}

// 36 Nodes scattered across the canvas
const BACKGROUND_NODES: GraphNode[] = [
  // Top Row
  { id: "valen", baseXPct: 6, baseYPct: 12, label: "Valen", type: "character", speed: 0.7, phase: 0, amplitude: 12 },
  { id: "menara", baseXPct: 22, baseYPct: 8, label: "Menara Hawa", type: "location", speed: 0.5, phase: 1.2, amplitude: 14 },
  { id: "c-conflict", baseXPct: 38, baseYPct: 10, label: "KONFLIK UTAMA", type: "concept", speed: 0.4, phase: 2.1, amplitude: 10 },
  { id: "ashmoor", baseXPct: 56, baseYPct: 7, label: "Ashmoor", type: "location", speed: 0.6, phase: 0.5, amplitude: 12 },
  { id: "ordo", baseXPct: 74, baseYPct: 10, label: "Ordo Mawar", type: "faction", speed: 0.8, phase: 1.8, amplitude: 15 },
  { id: "seraphina", baseXPct: 92, baseYPct: 12, label: "Seraphina", type: "character", speed: 0.6, phase: 3.0, amplitude: 10 },

  // Upper Mid Row
  { id: "c-plot", baseXPct: 5, baseYPct: 30, label: "PLOT ARC", type: "concept", speed: 0.5, phase: 0.4, amplitude: 14 },
  { id: "elira", baseXPct: 16, baseYPct: 34, label: "Elira", type: "character", speed: 0.75, phase: 1.0, amplitude: 15 },
  { id: "blackcat", baseXPct: 30, baseYPct: 25, label: "Kucing Hitam", type: "concept", speed: 0.6, phase: 2.5, amplitude: 12 },
  { id: "c-world", baseXPct: 70, baseYPct: 26, label: "WORLDBUILDING", type: "concept", speed: 0.4, phase: 1.1, amplitude: 16 },
  { id: "kael", baseXPct: 84, baseYPct: 30, label: "Kael", type: "character", speed: 0.8, phase: 0.2, amplitude: 14 },
  { id: "c-timeline", baseXPct: 95, baseYPct: 32, label: "TIMELINE", type: "concept", speed: 0.5, phase: 2.2, amplitude: 10 },

  // Center Periphery
  { id: "thorne", baseXPct: 8, baseYPct: 52, label: "Thorne", type: "character", speed: 0.7, phase: 1.5, amplitude: 14 },
  { id: "perjanjian", baseXPct: 24, baseYPct: 52, label: "Perjanjian Rahasia", type: "event", speed: 0.6, phase: 0.8, amplitude: 16 },
  { id: "lyra", baseXPct: 76, baseYPct: 48, label: "Lyra", type: "character", speed: 0.65, phase: 2.8, amplitude: 15 },
  { id: "market", baseXPct: 92, baseYPct: 52, label: "Pasar Malam", type: "location", speed: 0.75, phase: 1.4, amplitude: 12 },

  // Lower Mid Row
  { id: "sundering", baseXPct: 14, baseYPct: 70, label: "The Sundering", type: "event", speed: 0.55, phase: 2.0, amplitude: 14 },
  { id: "hutan", baseXPct: 28, baseYPct: 74, label: "Hutan Sunyi", type: "location", speed: 0.7, phase: 0.3, amplitude: 16 },
  { id: "c-family", baseXPct: 44, baseYPct: 78, label: "FAMILY TREE", type: "concept", speed: 0.45, phase: 1.7, amplitude: 12 },
  { id: "thales", baseXPct: 72, baseYPct: 70, label: "House Thales", type: "faction", speed: 0.7, phase: 0.9, amplitude: 14 },
  { id: "benteng", baseXPct: 88, baseYPct: 72, label: "Benteng Hitam", type: "location", speed: 0.6, phase: 2.4, amplitude: 15 },

  // Bottom Row
  { id: "eksekusi", baseXPct: 10, baseYPct: 90, label: "Eksekusi Rahasia", type: "event", speed: 0.65, phase: 1.1, amplitude: 12 },
  { id: "pelabuhan", baseXPct: 26, baseYPct: 92, label: "Pelabuhan Tua", type: "location", speed: 0.7, phase: 0.6, amplitude: 14 },
  { id: "teahouse", baseXPct: 50, baseYPct: 94, label: "Kedai Teh", type: "location", speed: 0.5, phase: 2.3, amplitude: 15 },
  { id: "guild", baseXPct: 74, baseYPct: 92, label: "Guild Bayangan", type: "faction", speed: 0.7, phase: 1.6, amplitude: 14 },
  { id: "c-lore", baseXPct: 90, baseYPct: 88, label: "ANCIENT LORE", type: "concept", speed: 0.4, phase: 0.1, amplitude: 16 },
];

const BACKGROUND_EDGES: GraphEdge[] = [
  { from: "valen", to: "elira" },
  { from: "elira", to: "menara" },
  { from: "elira", to: "ashmoor" },
  { from: "elira", to: "blackcat" },
  { from: "elira", to: "perjanjian" },
  { from: "elira", to: "sundering" },
  { from: "thorne", to: "elira" },
  { from: "perjanjian", to: "hutan" },
  { from: "sundering", to: "eksekusi" },
  { from: "eksekusi", to: "pelabuhan" },
  { from: "pelabuhan", to: "teahouse" },
  
  { from: "seraphina", to: "ordo" },
  { from: "ordo", to: "ashmoor" },
  { from: "ashmoor", to: "kael" },
  { from: "kael", to: "lyra" },
  { from: "kael", to: "benteng" },
  { from: "kael", to: "market" },
  { from: "kael", to: "thales" },
  { from: "lyra", to: "guild" },
  { from: "thales", to: "guild" },
  { from: "guild", to: "teahouse" },

  // Discovered Implicit Edges
  { from: "elira", to: "kael", isDiscovered: true },
  { from: "blackcat", to: "lyra", isDiscovered: true },
  { from: "perjanjian", to: "benteng", isDiscovered: true },
  { from: "hutan", to: "thales", isDiscovered: true },
];

export function InteractiveHeroGraph() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const startTime = performance.now();

    const handleResize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width || window.innerWidth;
      canvas.height = rect.height || 700;
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    let mouse = { x: -1000, y: -1000 };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    const draw = (now: number) => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const elapsed = (now - startTime) / 1000;
      const isDark = document.documentElement.getAttribute("data-theme") === "dark";

      // Neon Colors
      const neonStandoutColor = isDark ? "#E0935F" : "#C97B4A";
      const accentRGB = isDark ? "224, 147, 95" : "201, 123, 74";
      const sageRGB = isDark ? "163, 181, 148" : "138, 154, 123";
      const roseRGB = isDark ? "217, 150, 150" : "201, 124, 124";
      const textMain = isDark ? "#EDE6DA" : "#3D3226";

      // Compute exact node dot positions
      const nodes = BACKGROUND_NODES.map((n) => {
        const baseX = (n.baseXPct / 100) * w;
        const baseY = (n.baseYPct / 100) * h;
        const offsetX = Math.sin(elapsed * n.speed + n.phase) * n.amplitude;
        const offsetY = Math.cos(elapsed * n.speed * 0.85 + n.phase) * n.amplitude;

        // (x, y) represents the EXACT visual center of the dot (or concept text center)
        const x = baseX + offsetX;
        const y = baseY + offsetY;

        const dist = Math.hypot(mouse.x - x, mouse.y - y);
        const isHovered = dist < 75;

        return { ...n, x, y, isHovered };
      });

      const hoveredNode = nodes.find((n) => n.isHovered);
      const activeIds = new Set<string>();
      if (hoveredNode) {
        activeIds.add(hoveredNode.id);
        BACKGROUND_EDGES.forEach((e) => {
          if (e.from === hoveredNode.id) activeIds.add(e.to);
          if (e.to === hoveredNode.id) activeIds.add(e.from);
        });
      }

      // 1. Draw Neon Connection Lines (Lines snap 100% PRECISELY to dot center (x, y)!)
      if (hoveredNode) {
        BACKGROUND_EDGES.forEach((edge) => {
          const isConnected = edge.from === hoveredNode.id || edge.to === hoveredNode.id;
          if (!isConnected) return;

          const fromN = nodes.find((n) => n.id === edge.from);
          const toN = nodes.find((n) => n.id === edge.to);
          if (!fromN || !toN) return;

          ctx.save();

          // Outer Soft Glow Beam
          ctx.beginPath();
          ctx.moveTo(fromN.x, fromN.y);
          ctx.lineTo(toN.x, toN.y);
          ctx.strokeStyle = neonStandoutColor;
          ctx.lineWidth = 3.5;
          ctx.globalAlpha = 0.35;
          ctx.shadowColor = neonStandoutColor;
          ctx.shadowBlur = 8;
          ctx.stroke();

          // Inner Sharp Beam Line
          ctx.beginPath();
          ctx.moveTo(fromN.x, fromN.y);
          ctx.lineTo(toN.x, toN.y);
          ctx.strokeStyle = edge.isDiscovered ? "#FFF9F3" : neonStandoutColor;
          ctx.lineWidth = 1.6;
          ctx.globalAlpha = 0.95;

          if (edge.isDiscovered) {
            ctx.setLineDash([5, 4]);
            ctx.lineDashOffset = -elapsed * 25;
          } else {
            ctx.setLineDash([]);
          }

          ctx.stroke();
          ctx.restore();
        });
      }

      // 2. Draw Dots and Typography Labels
      nodes.forEach((node) => {
        const isActive = activeIds.size > 0 ? activeIds.has(node.id) : false;

        const isCenterHeroArea =
          node.baseXPct > 30 && node.baseXPct < 70 && node.baseYPct > 20 && node.baseYPct < 70;

        const defaultOpacity = isCenterHeroArea ? 0.15 : 0.38;
        const alpha = node.isHovered ? 1.0 : isActive ? 0.88 : defaultOpacity;

        ctx.save();
        ctx.globalAlpha = alpha;

        let dotColor = `rgb(${accentRGB})`;
        if (node.type === "location") dotColor = `rgb(${sageRGB})`;
        if (node.type === "event") dotColor = `rgb(${roseRGB})`;
        if (node.type === "faction") dotColor = `rgb(${sageRGB})`;

        if (node.type === "concept") {
          // Concept word centered on (node.x, node.y)
          ctx.font = node.isHovered || isActive ? "700 11.5px Lora, serif" : "600 11px Lora, serif";
          if (node.isHovered || isActive) {
            ctx.shadowColor = neonStandoutColor;
            ctx.shadowBlur = 6;
            ctx.fillStyle = neonStandoutColor;
          } else {
            ctx.fillStyle = textMain;
          }
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(node.label, node.x, node.y);
        } else {
          // Entity Node: Dot drawn EXACTLY at (node.x, node.y)
          if (node.isHovered || isActive) {
            ctx.shadowColor = neonStandoutColor;
            ctx.shadowBlur = 8;
          }

          const dotRadius = node.isHovered ? 4.5 : 3.2;

          ctx.beginPath();
          ctx.arc(node.x, node.y, dotRadius, 0, Math.PI * 2);
          ctx.fillStyle = node.isHovered || isActive ? neonStandoutColor : dotColor;
          ctx.fill();

          // Text label offset to the right of the dot center
          ctx.font = node.isHovered || isActive ? "700 12.5px Inter, sans-serif" : "500 12px Inter, sans-serif";
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillStyle = node.isHovered || isActive ? neonStandoutColor : textMain;
          ctx.fillText(node.label, node.x + dotRadius + 5, node.y);
        }

        ctx.restore();
      });

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-auto select-none">
      <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />
    </div>
  );
}
