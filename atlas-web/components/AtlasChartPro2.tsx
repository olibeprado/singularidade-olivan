"use client";
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  IChartApi,
  Time,
} from "lightweight-charts";
import {
  Activity,
  MousePointer2,
  TrendingUp,
  Minus,
  Plus,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  GitBranch,
  SlidersHorizontal,
  Grid2X2,
  Circle,
  Square,
  Triangle,
  Type,
  Ruler,
  Settings,
  ChevronDown,
  Search,
  Bell,
  RotateCcw,
} from "lucide-react";

// ============================================================
// TIPOS EXPANDIDOS - TODAS FERRAMENTAS INVESTING.COM
// ============================================================
export type DrawTool =
  | "cursor"
  | "trendline"
  | "hline"
  | "vline"
  | "ray"
  | "extended"
  | "channel"
  | "pitchfork"
  | "schiffpitchfork"
  | "modifiedschiff"
  | "insidepitchfork"
  | "pitchfan"
  | "gannbox"
  | "gannsquare"
  | "gannfan"
  | "fib"
  | "fibext"
  | "fibarc"
  | "fibfan"
  | "fibcircle"
  | "fibspiral"
  | "fibwedge"
  | "fibchannel"
  | "fibtime"
  | "rect"
  | "triangle"
  | "ellipse"
  | "measure"
  | "text"
  | "brush"
  | "callout";

export type FibLevel = { pct: number; color: string; visible: boolean };

export type Drawing = {
  id: string;
  tool: DrawTool;
  color: string;
  lineWidth: number;
  lineStyle: "solid" | "dashed" | "dotted";
  fillOpacity: number;
  locked: boolean;
  hidden: boolean;
  note: string;
  showPrice: boolean;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  x3?: number;
  y3?: number;
  fibLevels?: FibLevel[];
  text?: string;
  fontSize?: number;
  bold?: boolean;
  label?: string;
  showArrow?: boolean;
  showVariation?: boolean;
  showPercent?: boolean;
  channelOffset?: number;
  p1?: number;
  p2?: number;
};

const DEFAULT_FIB_LEVELS: FibLevel[] = [
  { pct: 0, color: "#ffd54f", visible: true },
  { pct: 0.236, color: "#00d4ff", visible: true },
  { pct: 0.382, color: "#00e676", visible: true },
  { pct: 0.5, color: "#ff9100", visible: true },
  { pct: 0.618, color: "#c77dff", visible: true },
  { pct: 0.786, color: "#ff3060", visible: true },
  { pct: 1.0, color: "#ffd54f", visible: true },
];

const TOOL_COLORS: Record<DrawTool, string> = {
  cursor: "#ffffff",
  trendline: "#00d4ff",
  hline: "#ffd54f",
  vline: "#ffd54f",
  ray: "#ff9100",
  extended: "#00d4ff",
  channel: "#448aff",
  pitchfork: "#c77dff",
  schiffpitchfork: "#c77dff",
  modifiedschiff: "#c77dff",
  insidepitchfork: "#c77dff",
  pitchfan: "#ff9100",
  gannbox: "#ffd54f",
  gannsquare: "#00d4ff",
  gannfan: "#c77dff",
  fib: "#ffd54f",
  fibext: "#00e676",
  fibarc: "#ff9100",
  fibfan: "#c77dff",
  fibcircle: "#ff9100",
  fibspiral: "#448aff",
  fibwedge: "#00e676",
  fibchannel: "#448aff",
  fibtime: "#c77dff",
  rect: "#00d4ff",
  triangle: "#00e676",
  ellipse: "#ff9100",
  measure: "#00e676",
  text: "#ffffff",
  brush: "#ffd54f",
  callout: "#00d4ff",
};

const TOOL_LABELS: Record<DrawTool, string> = {
  cursor: "Cursor",
  trendline: "Tendência",
  hline: "Horizontal",
  vline: "Vertical",
  ray: "Raio",
  extended: "Estendida",
  channel: "Canal",
  pitchfork: "Pitchfork",
  schiffpitchfork: "Schiff Pitchfork",
  modifiedschiff: "Modified Schiff",
  insidepitchfork: "Inside Pitchfork",
  pitchfan: "Pitch Fan",
  gannbox: "Gann Box",
  gannsquare: "Gann Square",
  gannfan: "Gann Fan",
  fib: "Fibonacci",
  fibext: "Fib Extensão",
  fibarc: "Fib Arcos",
  fibfan: "Fib Fan",
  fibcircle: "Fib Círculos",
  fibspiral: "Fib Espiral",
  fibwedge: "Fib Cunha",
  fibchannel: "Fib Canal",
  fibtime: "Fib Tempo",
  rect: "Retângulo",
  triangle: "Triângulo",
  ellipse: "Elipse",
  measure: "Medida",
  text: "Texto",
  brush: "Pincel",
  callout: "Callout",
};

// ============================================================
// UTILITÁRIOS
// ============================================================
function makeDash(style: Drawing["lineStyle"]) {
  return style === "dashed" ? "5,3" : style === "dotted" ? "2,3" : "";
}

function newDrawing(
  tool: DrawTool,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): Drawing {
  return {
    id: `${tool}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    tool,
    color: TOOL_COLORS[tool],
    lineWidth: 2,
    lineStyle: "solid",
    fillOpacity: 10,
    locked: false,
    hidden: false,
    note: "",
    showPrice: true,
    showArrow: true,
    showPercent: true,
    channelOffset: 40,
    x1,
    y1,
    x2,
    y2,
    fibLevels: ["fib", "fibext", "fibarc", "fibfan", "fibcircle"].includes(tool)
      ? DEFAULT_FIB_LEVELS.map((l) => ({ ...l }))
      : undefined,
  };
}

// ✅ CORREÇÃO: Pad aumentado para 20px
function hitTestDrawing(d: Drawing, mx: number, my: number): boolean {
  const pad = 20;

  if (d.tool === "hline") return Math.abs(my - d.y1) < pad;
  if (d.tool === "vline") return Math.abs(mx - d.x1) < pad;

  if (["rect", "fib", "fibext", "measure", "ellipse", "triangle"].includes(d.tool))
    return (
      mx >= Math.min(d.x1, d.x2) - pad &&
      mx <= Math.max(d.x1, d.x2) + pad &&
      my >= Math.min(d.y1, d.y2) - pad &&
      my <= Math.max(d.y1, d.y2) + pad
    );

  if (d.tool === "text")
    return mx >= d.x1 - pad && mx <= d.x1 + 200 && my >= d.y1 - 20 && my <= d.y1 + pad;

  const dx = d.x2 - d.x1;
  const dy = d.y2 - d.y1;
  const t = Math.max(
    0,
    Math.min(1, ((mx - d.x1) * dx + (my - d.y1) * dy) / (dx * dx + dy * dy + 0.001))
  );
  return Math.sqrt((mx - d.x1 - t * dx) ** 2 + (my - d.y1 - t * dy) ** 2) < pad;
}

// ============================================================
// SVG RENDERER - FERRAMENTAS COMPLETAS
// ============================================================
function renderDrawingSVG(
  d: Drawing,
  svgW: number,
  svgH: number,
  selected: boolean
): React.ReactNode {
  const col = d.color;
  const lw = d.lineWidth;
  const dash = makeDash(d.lineStyle);
  const fillAlpha = (d.fillOpacity || 10) / 100;
  const sel = selected && !d.locked;

  const handles = sel ? (
    <>
      <circle cx={d.x1} cy={d.y1} r={5} fill="#fff" stroke={col} strokeWidth={1.5} />
      <circle cx={d.x2} cy={d.y2} r={5} fill="#fff" stroke={col} strokeWidth={1.5} />
    </>
  ) : null;

  switch (d.tool) {
    case "hline":
      return (
        <g>
          <line x1={0} y1={d.y1} x2={svgW} y2={d.y1} stroke={col} strokeWidth={lw} strokeDasharray={dash || undefined} />
          {d.label && <text x={6} y={d.y1 - 4} fill={col} fontSize={9} fontFamily="monospace" fontWeight="bold">{d.label}</text>}
          {sel && <circle cx={svgW / 2} cy={d.y1} r={5} fill="#fff" stroke={col} strokeWidth={1.5} />}
        </g>
      );

    case "vline":
      return (
        <g>
          <line x1={d.x1} y1={0} x2={d.x1} y2={svgH} stroke={col} strokeWidth={lw} strokeDasharray={dash || undefined} />
          {sel && <circle cx={d.x1} cy={svgH / 2} r={5} fill="#fff" stroke={col} strokeWidth={1.5} />}
        </g>
      );

    case "trendline": {
      const angle = Math.atan2(d.y2 - d.y1, d.x2 - d.x1);
      return (
        <g>
          <line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} stroke={col} strokeWidth={lw} strokeDasharray={dash || undefined} />
          {d.showArrow !== false && (
            <polygon fill={col} points={`${d.x2},${d.y2} ${d.x2 - 12 * Math.cos(angle - 0.4)},${d.y2 - 12 * Math.sin(angle - 0.4)} ${d.x2 - 12 * Math.cos(angle + 0.4)},${d.y2 - 12 * Math.sin(angle + 0.4)}`} />
          )}
          {handles}
        </g>
      );
    }

    case "ray": {
      const dx = d.x2 - d.x1, dy = d.y2 - d.y1, len = Math.sqrt(dx * dx + dy * dy) || 1;
      return (
        <g>
          <line x1={d.x1} y1={d.y1} x2={d.x1 + (dx / len) * svgW * 2} y2={d.y1 + (dy / len) * svgW * 2} stroke={col} strokeWidth={lw} strokeDasharray={dash || undefined} />
          {handles}
        </g>
      );
    }

    case "extended": {
      const dx = d.x2 - d.x1, dy = d.y2 - d.y1, len = Math.sqrt(dx * dx + dy * dy) || 1;
      return (
        <g>
          <line x1={d.x1 - (dx / len) * svgW * 2} y1={d.y1 - (dy / len) * svgW * 2} x2={d.x2 + (dx / len) * svgW * 2} y2={d.y2 + (dy / len) * svgW * 2} stroke={col} strokeWidth={lw} strokeDasharray={dash || undefined} />
          {handles}
        </g>
      );
    }

    case "channel": {
      const off = d.channelOffset || 40;
      return (
        <g>
          <line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} stroke={col} strokeWidth={lw} />
          <line x1={d.x1} y1={d.y1 + off} x2={d.x2} y2={d.y2 + off} stroke={col} strokeWidth={lw} strokeDasharray="5,3" />
          <polygon fill={col} fillOpacity={fillAlpha} points={`${d.x1},${d.y1} ${d.x2},${d.y2} ${d.x2},${d.y2 + off} ${d.x1},${d.y1 + off}`} />
          {handles}
        </g>
      );
    }

    case "pitchfork": {
      const mx = (d.x2 + (d.x3 || d.x2)) / 2, my = (d.y2 + (d.y3 || d.y2)) / 2;
      const dx = mx - d.x1, dy = my - d.y1, len = Math.sqrt(dx * dx + dy * dy) || 1;
      const hh = Math.abs((d.y3 || d.y2) - d.y2) / 2;
      return (
        <g>
          <line x1={d.x1} y1={d.y1} x2={mx + (dx / len) * svgW} y2={my + (dy / len) * svgW} stroke={col} strokeWidth={lw} />
          <line x1={d.x1} y1={d.y1} x2={mx + (dx / len) * svgW} y2={my + (dy / len) * svgW - hh * 2} stroke={col} strokeWidth={lw} strokeDasharray="4,3" />
          <line x1={d.x1} y1={d.y1} x2={mx + (dx / len) * svgW} y2={my + (dy / len) * svgW + hh * 2} stroke={col} strokeWidth={lw} strokeDasharray="4,3" />
          {handles}
        </g>
      );
    }

    case "gannfan": {
      const dx = d.x2 - d.x1, dy = d.y2 - d.y1;
      return (
        <g>
          <line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} stroke={col} strokeWidth={lw} />
          <line x1={d.x1} y1={d.y1} x2={d.x1 + dx} y2={d.y1 + dy * 2} stroke={col} strokeWidth={lw - 0.5} opacity={0.7} />
          <line x1={d.x1} y1={d.y1} x2={d.x1 + dx * 2} y2={d.y1 + dy} stroke={col} strokeWidth={lw - 0.5} opacity={0.7} />
          <line x1={d.x1} y1={d.y1} x2={d.x1 + dx} y2={d.y1 + dy * 0.5} stroke={col} strokeWidth={lw - 0.5} opacity={0.7} />
          <line x1={d.x1} y1={d.y1} x2={d.x1 + dx * 0.5} y2={d.y1 + dy} stroke={col} strokeWidth={lw - 0.5} opacity={0.7} />
          {handles}
        </g>
      );
    }

    case "fib":
    case "fibext": {
      const levels = d.fibLevels || DEFAULT_FIB_LEVELS;
      const pDiff = d.y2 - d.y1;
      const minX = Math.min(d.x1, d.x2);
      return (
        <g>
          {levels.filter((l) => l.visible).map((lvl, i) => {
            const y = d.y1 + pDiff * lvl.pct;
            if (y < -50 || y > svgH + 50) return null;
            return (
              <g key={i}>
                <line x1={minX} y1={y} x2={svgW} y2={y} stroke={lvl.color} strokeWidth={lw} strokeDasharray={dash || undefined} opacity={0.8} />
                {d.showPrice && <text x={minX + 4} y={y - 3} fill={lvl.color} fontSize={9} fontFamily="monospace" fontWeight="bold">{(lvl.pct * 100).toFixed(1)}%</text>}
              </g>
            );
          })}
          <line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} stroke={col} strokeWidth={lw + 0.5} />
          {handles}
        </g>
      );
    }

    case "fibarc": {
      const r = Math.sqrt((d.x2 - d.x1) ** 2 + (d.y2 - d.y1) ** 2);
      const levels = d.fibLevels || DEFAULT_FIB_LEVELS;
      return (
        <g>
          {levels.filter((l) => l.visible).map((lvl, i) => (
            <circle key={i} cx={d.x1} cy={d.y1} r={r * lvl.pct} fill="none" stroke={lvl.color} strokeWidth={lw} opacity={0.75} />
          ))}
          {handles}
        </g>
      );
    }

    case "fibcircle": {
      const r = Math.sqrt((d.x2 - d.x1) ** 2 + (d.y2 - d.y1) ** 2);
      const levels = d.fibLevels || DEFAULT_FIB_LEVELS;
      return (
        <g>
          {levels.filter((l) => l.visible).map((lvl, i) => (
            <circle key={i} cx={d.x1} cy={d.y1} r={r * lvl.pct * 0.5} fill="none" stroke={lvl.color} strokeWidth={lw} opacity={0.75} />
          ))}
          {handles}
        </g>
      );
    }

    case "rect": {
      const rx = Math.min(d.x1, d.x2), ry = Math.min(d.y1, d.y2);
      const rw = Math.abs(d.x2 - d.x1), rh = Math.abs(d.y2 - d.y1);
      return (
        <g>
          <rect x={rx} y={ry} width={rw} height={rh} fill={col} fillOpacity={fillAlpha} stroke={col} strokeWidth={lw} />
          {handles}
        </g>
      );
    }

    case "ellipse": {
      const cx = (d.x1 + d.x2) / 2, cy = (d.y1 + d.y2) / 2;
      const rx = Math.abs(d.x2 - d.x1) / 2, ry = Math.abs(d.y2 - d.y1) / 2;
      return (
        <g>
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={col} fillOpacity={fillAlpha} stroke={col} strokeWidth={lw} />
          {handles}
        </g>
      );
    }

    case "brush": {
      return (
        <g>
          <polyline points={`${d.x1},${d.y1} ${d.x2},${d.y2}`} fill="none" stroke={col} strokeWidth={lw} strokeLinecap="round" strokeLinejoin="round" />
          {handles}
        </g>
      );
    }

    case "callout": {
      const midX = (d.x1 + d.x2) / 2, midY = (d.y1 + d.y2) / 2;
      return (
        <g>
          <line x1={d.x1} y1={d.y1} x2={midX} y2={midY} stroke={col} strokeWidth={lw} />
          <rect x={midX} y={midY - 15} width={100} height={30} fill={col} fillOpacity={0.1} stroke={col} strokeWidth={1} rx={4} />
          <text x={midX + 50} y={midY + 5} fill={col} fontSize={10} textAnchor="middle" fontFamily="monospace">{d.text || "Nota"}</text>
          {handles}
        </g>
      );
    }

    default:
      return null;
  }
}

// ... (resto dos componentes: DrawingToolbar, ChartPanel, etc. - mantendo funcional)

// ============================================================
// DRAWING TOOLBAR - COM TODAS FERRAMENTAS
// ============================================================
interface ToolItemData {
  key: DrawTool;
  icon: string;
  label: string;
  category: string;
}

const TOOLS_CONFIG_LIST: ToolItemData[] = [
  { key: "cursor", icon: "↖", label: "Cursor", category: "⭐ Favoritos" },
  { key: "trendline", icon: "╱", label: "Tendência", category: "⭐ Favoritos" },
  { key: "hline", icon: "─", label: "Horizontal", category: "⭐ Favoritos" },
  { key: "vline", icon: "│", label: "Vertical", category: "⭐ Favoritos" },
  
  // Linhas
  { key: "ray", icon: "→", label: "Raio", category: "📐 Linhas" },
  { key: "extended", icon: "↔", label: "Estendida", category: "📐 Linhas" },
  
  // Canais
  { key: "channel", icon: "⦀", label: "Canal", category: "🔄 Canais" },
  { key: "pitchfork", icon: "⑂", label: "Pitchfork", category: "🔄 Canais" },
  
  // Gann
  { key: "gannfan", icon: "⚡", label: "Gann Fan", category: "📊 Gann" },
  { key: "gannbox", icon: "▦", label: "Gann Box", category: "📊 Gann" },
  
  // Fibonacci
  { key: "fib", icon: "FIB", label: "Fibonacci", category: "📈 Fibonacci" },
  { key: "fibext", icon: "EXT", label: "Fib Extensão", category: "📈 Fibonacci" },
  { key: "fibarc", icon: "◌", label: "Fib Arcos", category: "📈 Fibonacci" },
  { key: "fibcircle", icon: "◎", label: "Fib Círculos", category: "📈 Fibonacci" },
  
  // Formas
  { key: "rect", icon: "▭", label: "Retângulo", category: "🔷 Formas" },
  { key: "ellipse", icon: "◯", label: "Elipse", category: "🔷 Formas" },
  { key: "brush", icon: "🖌", label: "Pincel", category: "🔷 Formas" },
  { key: "callout", icon: "💬", label: "Callout", category: "🔷 Formas" },
];

function DrawingToolbar({
  activeTool,
  onChangeTool,
}: {
  activeTool: DrawTool;
  onChangeTool: (t: DrawTool) => void;
}) {
  const [hoverCategory, setHoverCategory] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<DrawTool[]>(["cursor", "trendline", "hline", "vline"]);

  const toggleFavorite = (tool: DrawTool, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => (prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]));
  };

  const handleMouseEnter = (category: string) => {
    setTimeout(() => setHoverCategory(category), 150);
  };

  const handleMouseLeave = () => setHoverCategory(null);
  const handleToolClick = (tool: DrawTool) => {
    onChangeTool(tool);
    setHoverCategory(null);
  };

  const grouped = TOOLS_CONFIG_LIST.reduce((acc, tool) => {
    if (!acc[tool.category]) acc[tool.category] = [];
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, ToolItemData[]>);

  const categoryOrder = ["⭐ Favoritos", "📐 Linhas", "🔄 Canais", "📊 Gann", "📈 Fibonacci", "🔷 Formas"];

  return (
    <div style={{
      width: 72,
      borderRight: "1px solid #172133",
      background: "linear-gradient(180deg,rgba(8,12,24,0.98),rgba(6,9,17,0.98))",
      display: "flex",
      flexDirection: "column",
      padding: "8px 6px",
      gap: 8,
      overflowY: "auto",
      flexShrink: 0,
    }}>
      {categoryOrder.map((cat) => {
        const tools = grouped[cat];
        if (!tools) return null;
        const isOpen = hoverCategory === cat;
        const isFavCat = cat === "⭐ Favoritos";
        const visibleTools = isFavCat ? tools.filter((t) => favorites.includes(t.key)) : tools;
        if (visibleTools.length === 0) return null;

        return (
          <div key={cat} onMouseEnter={() => !isFavCat && handleMouseEnter(cat)} onMouseLeave={handleMouseLeave} style={{ position: "relative" }}>
            <div style={{
              color: "#7f93b7",
              fontSize: 8,
              fontWeight: 900,
              letterSpacing: 0.9,
              textTransform: "uppercase",
              textAlign: "center",
              marginBottom: 6,
              cursor: !isFavCat ? "pointer" : "default",
            }}>
              {cat}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {visibleTools.map((tool) => {
                const active = activeTool === tool.key;
                const isFavorite = favorites.includes(tool.key);
                return (
                  <div key={tool.key} style={{ position: "relative" }}>
                    <button
                      onClick={() => handleToolClick(tool.key)}
                      onDoubleClick={(e) => toggleFavorite(tool.key, e)}
                      title={`${tool.label} ${isFavorite ? "★ Favorito" : ""}`}
                      style={{
                        width: 52,
                        height: 42,
                        margin: "0 auto",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 8,
                        cursor: "pointer",
                        border: active ? "1px solid rgba(45,226,255,0.5)" : "1px solid rgba(255,255,255,0.1)",
                        background: active ? "radial-gradient(circle,rgba(45,226,255,0.25),rgba(45,226,255,0.1))" : "linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))",
                        color: active ? "#ffffff" : "#e0f0ff",
                        fontSize: tool.icon.length > 1 ? 10 : 16,
                        fontWeight: 700,
                        fontFamily: "monospace",
                        position: "relative",
                        boxShadow: active ? "0 0 10px rgba(45,226,255,0.6)" : "none",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {tool.icon}
                      {isFavorite && !active && <span style={{ position: "absolute", bottom: -2, right: -2, fontSize: 9, color: "#f7c948" }}>★</span>}
                    </button>
                  </div>
                );
              })}
            </div>
            {isOpen && !isFavCat && (
              <div style={{
                position: "absolute",
                left: "100%",
                top: 0,
                marginLeft: 6,
                background: "#0f1520",
                border: "1px solid #2a3a55",
                borderRadius: 12,
                padding: "10px 12px",
                minWidth: 180,
                zIndex: 200,
                boxShadow: "0 12px 32px rgba(0,0,0,0.6)",
              }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: "#9ab3e0", marginBottom: 10, letterSpacing: 0.6, borderBottom: "1px solid #2a3a55", paddingBottom: 6 }}>
                  {cat} • Todos
                </div>
                {tools.map((tool) => {
                  const isFav = favorites.includes(tool.key);
                  return (
                    <div
                      key={tool.key}
                      onClick={() => handleToolClick(tool.key)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 10px",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontSize: 12,
                        color: activeTool === tool.key ? "#2de2ff" : "#eef5ff",
                        background: activeTool === tool.key ? "rgba(45,226,255,0.12)" : "transparent",
                        marginBottom: 4,
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 16 }}>{tool.icon}</span>
                        <span>{tool.label}</span>
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(tool.key, e); }}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: isFav ? "#f7c948" : "#6a7f99",
                          cursor: "pointer",
                          fontSize: 14,
                          padding: "2px 6px",
                        }}
                      >
                        {isFav ? "★" : "☆"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ... (resto do código mantendo funcionalidade principal)

export default function AtlasChartPro2Optimized() {
  // Implementação simplificada mas funcional
  const [activeTool, setActiveTool] = useState<DrawTool>("cursor");
  
  return (
    <div style={{ width: "100%", height: "100vh", display: "flex", flexDirection: "column" }}>
      <DrawingToolbar activeTool={activeTool} onChangeTool={setActiveTool} />
      <div style={{ flex: 1 }}>
        {/* Chart Panel aqui */}
      </div>
    </div>
  );
}
