"use client";
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  BarChart2,
  Bell,
  BrainCircuit,
  ChevronDown,
  ChevronRight,
  Droplets,
  Eye,
  Layers3,
  Maximize2,
  MousePointer2,
  PenTool,
  RotateCcw,
  Ruler,
  ScanSearch,
  Search,
  Settings,
  Shapes,
  Sigma,
  Square,
  Star,
  Trash2,
  TrendingDown,
  TrendingUp,
  Type,
  Waves,
  Plus,
  Minus,
  MoveUpRight,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  GitBranch,
  Grid2X2,
  Circle,
  Spline,
  Network,
  SlidersHorizontal,
} from "lucide-react";

const ui = {
  bg: "#060913",
  bg2: "#050810",
  border: "#172133",
  text: "#ebf3ff",
  mut: "#7f93b7",
  cyan: "#2de2ff",
  cyan2: "#00d8ff",
  green: "#27f59d",
  yellow: "#f7c948",
  red: "#ff6b86",
  magenta: "#ff4fa3",
  orange: "#ff9d2e",
};
  createChart,
  ColorType,
  CrosshairMode,
  IChartApi,
  Time,
} from "lightweight-charts";
import {
  Activity,
  BrainCircuit,
  ChevronDown,
  ChevronRight,
  Droplets,
  Eye,
  Layers3,
  Maximize2,
  MousePointer2,
  PenTool,
  RotateCcw,
  Ruler,
  ScanSearch,
  Search,
  Settings,
  Shapes,
  Sigma,
  Square,
  Star,
  Trash2,
  TrendingDown,
  TrendingUp,
  Type,
  Waves,
  Plus,
  Minus,
  MoveUpRight,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  GitBranch,
  Grid2X2,
  Circle,
  Spline,
  Network,
  SlidersHorizontal,
} from "lucide-react";

// ============================================================
// DRAWING TOOLS TYPES & CONSTANTS - EXPANDIDO
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
  | "fib"
  | "fibext"
  | "fibarc"
  | "fibfan"
  | "rect"
  | "triangle"
  | "ellipse"
  | "measure"
  | "text"
  // NOVAS FERRAMENTAS INVESTING.COM
  | "arc"
  | "gann"
  | "speedline"
  | "timecycle"
  | "anchoredvwap"
  | "brush"
  | "callout"
  | "horizontalray"
  | "verticalray";

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
  { pct: 1.272, color: "#448aff", visible: false },
  { pct: 1.618, color: "#00e676", visible: false },
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
  fib: "#ffd54f",
  fibext: "#00e676",
  fibarc: "#ff9100",
  fibfan: "#c77dff",
  rect: "#00d4ff",
  triangle: "#00e676",
  ellipse: "#ff9100",
  measure: "#00e676",
  text: "#ffffff",
  // NOVAS FERRAMENTAS
  arc: "#ff9100",
  gann: "#c77dff",
  speedline: "#448aff",
  timecycle: "#00e676",
  anchoredvwap: "#2de2ff",
  brush: "#ffd54f",
  callout: "#00d4ff",
  horizontalray: "#ff3060",
  verticalray: "#ff3060",
};

const TOOL_LABELS: Record<DrawTool, string> = {
  cursor: "Cursor (V)",
  trendline: "Tendência (T)",
  hline: "Horizontal (H)",
  vline: "Vertical (K)",
  ray: "Raio (R)",
  extended: "Estendida",
  channel: "Canal",
  pitchfork: "Pitchfork",
  fib: "Fibonacci (F)",
  fibext: "Fib Extensão",
  fibarc: "Fib Arcos",
  fibfan: "Fib Fan",
  rect: "Retângulo (G)",
  triangle: "Triângulo",
  ellipse: "Elipse",
  measure: "Medir (M)",
  text: "Texto (X)",
  // NOVAS FERRAMENTAS
  arc: "Arco (A)",
  gann: "Gann Fan",
  speedline: "Velocidade",
  timecycle: "Ciclo Temporal",
  anchoredvwap: "VWAP Ancorada",
  brush: "Pincel (B)",
  callout: "Callout (C)",
  horizontalray: "Raio H",
  verticalray: "Raio V",
};

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
    fibLevels: ["fib", "fibext", "fibarc", "fibfan"].includes(tool)
      ? DEFAULT_FIB_LEVELS.map((l) => ({ ...l }))
      : undefined,
  };
}

// ✅ CORREÇÃO: Pad aumentado de 10 para 20px para melhor hit test
function hitTestDrawing(d: Drawing, mx: number, my: number): boolean {
  const pad = 20; // ✅ AUMENTADO PARA MELHOR SELEÇÃO

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
// SVG RENDERER - COM NOVAS FERRAMENTAS
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
          {d.label && (
            <text x={6} y={d.y1 - 4} fill={col} fontSize={9} fontFamily="monospace" fontWeight="bold">
              {d.label}
            </text>
          )}
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
            <polygon
              fill={col}
              points={`${d.x2},${d.y2} ${d.x2 - 12 * Math.cos(angle - 0.4)},${d.y2 - 12 * Math.sin(angle - 0.4)} ${d.x2 - 12 * Math.cos(angle + 0.4)},${d.y2 - 12 * Math.sin(angle + 0.4)}`}
            />
          )}
          {d.showVariation && d.p1 && d.p2 && (
            <text x={(d.x1 + d.x2) / 2} y={(d.y1 + d.y2) / 2 + 12} fill={col} fontSize={10} fontFamily="monospace" textAnchor="middle" fontWeight="bold">
              {((d.p2 - d.p1) / d.p1) * 100}
              {"%"}
            </text>
          )}
          {handles}
        </g>
      );
    }

    case "ray": {
      const dx = d.x2 - d.x1,
        dy = d.y2 - d.y1,
        len = Math.sqrt(dx * dx + dy * dy) || 1;
      return (
        <g>
          <line x1={d.x1} y1={d.y1} x2={d.x1 + (dx / len) * svgW * 2} y2={d.y1 + (dy / len) * svgW * 2} stroke={col} strokeWidth={lw} strokeDasharray={dash || undefined} />
          {handles}
        </g>
      );
    }

    case "extended": {
      const dx = d.x2 - d.x1,
        dy = d.y2 - d.y1,
        len = Math.sqrt(dx * dx + dy * dy) || 1;
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
      const mx = (d.x2 + (d.x3 || d.x2)) / 2,
        my = (d.y2 + (d.y3 || d.y2)) / 2;
      const dx = mx - d.x1,
        dy = my - d.y1,
        len = Math.sqrt(dx * dx + dy * dy) || 1;
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
                {d.showPrice && (
                  <text x={minX + 4} y={y - 3} fill={lvl.color} fontSize={9} fontFamily="monospace" fontWeight="bold">
                    {(lvl.pct * 100).toFixed(1)}%
                  </text>
                )}
              </g>
            );
          })}
          {levels.filter((l) => l.visible).map((lvl, i, arr) => {
            if (i >= arr.length - 1) return null;
            const y1 = d.y1 + pDiff * lvl.pct;
            const y2 = d.y1 + pDiff * arr[i + 1].pct;
            return <rect key={i} x={minX} y={Math.min(y1, y2)} width={svgW - minX} height={Math.abs(y2 - y1)} fill={lvl.color} fillOpacity={fillAlpha} />;
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

    case "fibfan": {
      const levels = d.fibLevels || DEFAULT_FIB_LEVELS;
      return (
        <g>
          {levels.filter((l) => l.visible).map((lvl, i) => {
            const ty = d.y1 + (d.y2 - d.y1) * lvl.pct;
            const dx = d.x2 - d.x1,
              dy = ty - d.y1;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            return <line key={i} x1={d.x1} y1={d.y1} x2={d.x1 + (dx / len) * svgW * 2} y2={d.y1 + (dy / len) * svgW * 2} stroke={lvl.color} strokeWidth={lw} opacity={0.75} />;
          })}
          {handles}
        </g>
      );
    }

    case "rect": {
      const rx = Math.min(d.x1, d.x2),
        ry = Math.min(d.y1, d.y2);
      const rw = Math.abs(d.x2 - d.x1),
        rh = Math.abs(d.y2 - d.y1);
      return (
        <g>
          <rect x={rx} y={ry} width={rw} height={rh} fill={col} fillOpacity={fillAlpha} stroke={col} strokeWidth={lw} />
          {d.showPercent !== false && d.p1 && d.p2 && (
            <text x={rx + rw / 2} y={ry + rh / 2 + 4} fill={col} fontSize={11} fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              {((d.p2 - d.p1) / d.p1) * 100}
              {"%"}
            </text>
          )}
          {handles}
        </g>
      );
    }

    case "triangle": {
      const pts = `${d.x1},${d.y1} ${d.x2},${d.y2} ${(d.x1 + d.x2) / 2},${Math.min(d.y1, d.y2) - Math.abs(d.y2 - d.y1) * 0.5}`;
      return (
        <g>
          <polygon points={pts} fill={col} fillOpacity={fillAlpha} stroke={col} strokeWidth={lw} />
          {handles}
        </g>
      );
    }

    case "ellipse": {
      const cx = (d.x1 + d.x2) / 2,
        cy = (d.y1 + d.y2) / 2;
      const rx = Math.abs(d.x2 - d.x1) / 2,
        ry = Math.abs(d.y2 - d.y1) / 2;
      return (
        <g>
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={col} fillOpacity={fillAlpha} stroke={col} strokeWidth={lw} />
          {handles}
        </g>
      );
    }

    case "measure": {
      const mc = d.y1 > d.y2 ? "#00e676" : "#ff3060";
      const rx = Math.min(d.x1, d.x2),
        ry = Math.min(d.y1, d.y2);
      const rw = Math.abs(d.x2 - d.x1),
        rh = Math.abs(d.y2 - d.y1);
      return (
        <g>
          <rect x={rx} y={ry} width={rw} height={rh} fill={mc} fillOpacity={0.1} stroke={mc} strokeWidth={lw} />
          <text x={rx + rw / 2} y={ry + rh / 2 + 4} fill={mc} fontSize={11} fontWeight="bold" textAnchor="middle" fontFamily="monospace">
            {rh.toFixed(0)}px
          </text>
          {handles}
        </g>
      );
    }

    case "text":
      return (
        <g>
          <text x={d.x1} y={d.y1} fill={col} fontSize={d.fontSize || 13} fontWeight={d.bold ? "bold" : "normal"} fontFamily="monospace">
            {d.text || ""}
          </text>
        </g>
      );

    // ============================================================
    // NOVAS FERRAMENTAS INVESTING.COM
    // ============================================================

    case "arc": {
      const radius = Math.sqrt((d.x2 - d.x1) ** 2 + (d.y2 - d.y1) ** 2);
      return (
        <g>
          <path d={`M ${d.x1} ${d.y1} A ${radius} ${radius} 0 0 1 ${d.x2} ${d.y2}`} fill="none" stroke={col} strokeWidth={lw} strokeDasharray={dash || undefined} />
          {handles}
        </g>
      );
    }

    case "gann": {
      const dx = d.x2 - d.x1;
      const dy = d.y2 - d.y1;
      return (
        <g>
          <line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} stroke={col} strokeWidth={lw} />
          <line x1={d.x1} y1={d.y1} x2={d.x1 + dx} y2={d.y1 + dy * 2} stroke={col} strokeWidth={lw - 0.5} opacity={0.7} />
          <line x1={d.x1} y1={d.y1} x2={d.x1 + dx * 2} y2={d.y1 + dy} stroke={col} strokeWidth={lw - 0.5} opacity={0.7} />
          {handles}
        </g>
      );
    }

    case "callout": {
      const midX = (d.x1 + d.x2) / 2;
      const midY = (d.y1 + d.y2) / 2;
      return (
        <g>
          <line x1={d.x1} y1={d.y1} x2={midX} y2={midY} stroke={col} strokeWidth={lw} />
          <rect x={midX} y={midY - 15} width={100} height={30} fill={col} fillOpacity={0.1} stroke={col} strokeWidth={1} rx={4} />
          <text x={midX + 50} y={midY + 5} fill={col} fontSize={10} textAnchor="middle" fontFamily="monospace">
            {d.text || "Nota"}
          </text>
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

    case "horizontalray": {
      return (
        <g>
          <line x1={d.x1} y1={d.y1} x2={svgW} y2={d.y1} stroke={col} strokeWidth={lw} strokeDasharray={dash || undefined} />
          {sel && <circle cx={(d.x1 + svgW) / 2} cy={d.y1} r={5} fill="#fff" stroke={col} strokeWidth={1.5} />}
        </g>
      );
    }

    case "verticalray": {
      return (
        <g>
          <line x1={d.x1} y1={d.y1} x2={d.x1} y2={svgH} stroke={col} strokeWidth={lw} strokeDasharray={dash || undefined} />
          {sel && <circle cx={d.x1} cy={(d.y1 + svgH) / 2} r={5} fill="#fff" stroke={col} strokeWidth={1.5} />}
        </g>
      );
    }

    default:
      return null;
  }
}

// ... (resto dos componentes: DrawingSettingsModal, DrawingContextMenu, useDrawings, useDrawingKeyboard, DrawingOptionsBar, DrawingToolbar, TopBar, ModuleStrip, etc. - mantenha tudo como está)

// ============================================================
// DRAWING TOOLBAR - COM NOVAS FERRAMENTAS
// ============================================================
interface ToolItemData {
  key: DrawTool;
  icon: string;
  label: string;
  category?: string;
}

const TOOLS_CONFIG_LIST: ToolItemData[] = [
  { key: "cursor", icon: "↖", label: "Cursor (V)", category: "⭐ Favoritos" },
  { key: "trendline", icon: "╱", label: "Tendência (T)", category: "⭐ Favoritos" },
  { key: "hline", icon: "─", label: "Horizontal (H)", category: "⭐ Favoritos" },
  { key: "vline", icon: "│", label: "Vertical (K)", category: "⭐ Favoritos" },
  { key: "ray", icon: "→", label: "Raio (R)", category: "📐 Linhas" },
  { key: "extended", icon: "↔", label: "Estendida", category: "📐 Linhas" },
  { key: "channel", icon: "⦀", label: "Canal", category: "🔄 Canais" },
  { key: "pitchfork", icon: "⑂", label: "Pitchfork", category: "🔄 Canais" },
  { key: "fib", icon: "FIB", label: "Fibonacci (F)", category: "📊 Fibonacci" },
  { key: "fibext", icon: "EXT", label: "Extensão", category: "📊 Fibonacci" },
  { key: "fibarc", icon: "◌", label: "Arcos", category: "📊 Fibonacci" },
  { key: "fibfan", icon: "⋱", label: "Fan", category: "📊 Fibonacci" },
  { key: "rect", icon: "▭", label: "Retângulo (G)", category: "🔷 Formas" },
  { key: "triangle", icon: "△", label: "Triângulo", category: "🔷 Formas" },
  { key: "ellipse", icon: "◯", label: "Elipse", category: "🔷 Formas" },
  { key: "measure", icon: "⟺", label: "Medir (M)", category: "📏 Misc" },
  { key: "text", icon: "T", label: "Texto (X)", category: "📏 Misc" },
  // NOVAS FERRAMENTAS
  { key: "arc", icon: "◠", label: "Arco (A)", category: "📐 Linhas" },
  { key: "gann", icon: "⚡", label: "Gann Fan", category: "📊 Fibonacci" },
  { key: "callout", icon: "💬", label: "Callout (C)", category: "📏 Misc" },
  { key: "brush", icon: "🖌", label: "Pincel (B)", category: "📏 Misc" },
  { key: "horizontalray", icon: "⟶", label: "Raio H", category: "📐 Linhas" },
  { key: "verticalray", icon: "↓", label: "Raio V", category: "📐 Linhas" },
];

function DrawingToolbar({
  activeTool,
  onChangeTool,
}: {
  activeTool: DrawTool;
  onChangeTool: (t: DrawTool) => void;
}) {
  const [hoverCategory, setHoverCategory] = useState<string | null>(null);
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);
  const [favorites, setFavorites] = useState<DrawTool[]>(["cursor", "trendline", "hline", "vline"]);

  const toggleFavorite = (tool: DrawTool, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => (prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]));
  };

  // ✅ CORREÇÃO: Delay reduzido de 2000ms para 300ms
  const handleMouseEnter = (category: string) => {
    if (hoverTimer) clearTimeout(hoverTimer);
    const timer = setTimeout(() => {
      setHoverCategory(category);
    }, 300); // ✅ REDUZIDO PARA 300ms
    setHoverTimer(timer);
  };

  const handleMouseLeave = () => {
    if (hoverTimer) clearTimeout(hoverTimer);
    setHoverCategory(null);
  };

  const handleToolClick = (tool: DrawTool) => {
    onChangeTool(tool);
    setHoverCategory(null);
  };

  const grouped = TOOLS_CONFIG_LIST.reduce((acc, tool) => {
    const cat = tool.category || "Outros";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(tool);
    return acc;
  }, {} as Record<string, ToolItemData[]>);

  const categoryOrder = ["⭐ Favoritos", "📐 Linhas", "🔄 Canais", "📊 Fibonacci", "🔷 Formas", "📏 Misc"];

  return (
    <div
      style={{
        width: 72,
        borderRight: "1px solid #172133",
        background: "linear-gradient(180deg,rgba(8,12,24,0.98),rgba(6,9,17,0.98))",
        display: "flex",
        flexDirection: "column",
        padding: "8px 6px",
        gap: 8,
        overflowY: "auto",
        flexShrink: 0,
      }}
    >
      {categoryOrder.map((cat) => {
        const tools = grouped[cat];
        if (!tools) return null;
        const isOpen = hoverCategory === cat;
        const isFavCat = cat === "⭐ Favoritos";
        const visibleTools = isFavCat ? tools.filter((t) => favorites.includes(t.key)) : tools;
        if (visibleTools.length === 0) return null;

        return (
          <div key={cat} onMouseEnter={() => !isFavCat && handleMouseEnter(cat)} onMouseLeave={handleMouseLeave} style={{ position: "relative" }}>
            <div
              style={{
                color: "#7f93b7",
                fontSize: 8,
                fontWeight: 900,
                letterSpacing: 0.9,
                textTransform: "uppercase",
                textAlign: "center",
                marginBottom: 6,
                cursor: !isFavCat ? "pointer" : "default",
              }}
            >
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
                      title={`${tool.label} ${isFavorite ? "★ Favorito" : "☆ Clique duplo p/ favoritar"}`}
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
              <div
                style={{
                  position: "absolute",
                  left: "100%",
                  top: 0,
                  marginLeft: 6,
                  background: "#0f1520",
                  border: "1px solid #2a3a55",
                  borderRadius: 12,
                  padding: "10px 12px",
                  minWidth: 160,
                  zIndex: 200,
                  boxShadow: "0 12px 32px rgba(0,0,0,0.6)",
                  backdropFilter: "blur(12px)",
                }}
              >
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
                        color: activeTool === tool.key ? ui.cyan : "#eef5ff",
                        background: activeTool === tool.key ? "rgba(45,226,255,0.12)" : "transparent",
                        marginBottom: 4,
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(45,226,255,0.18)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 16 }}>{tool.icon}</span>
                        <span>{tool.label}</span>
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(tool.key, e);
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: isFav ? ui.yellow : "#6a7f99",
                          cursor: "pointer",
                          fontSize: 14,
                          padding: "2px 6px",
                          borderRadius: 4,
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

// ============================================================
// TOPBAR - COM LOGO PLACEHOLDER
// ============================================================
function TopBar({
  symbol,
  price,
  change,
  timeframe,
  onTimeframeChange,
}: {
  symbol: string;
  price: number;
  change: number;
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
}) {
  const [replayMode, setReplayMode] = useState(false);
  const isPositive = change >= 0;

  return (
    <div
      style={{
        height: 64,
        padding: "0 14px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        borderBottom: `1px solid ${ui.border}`,
        background: "radial-gradient(circle at top, rgba(14,28,60,0.86), rgba(6,10,20,0.98) 55%)",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 8 }}>
        {/* ✅ LOGO PLACEHOLDER - SUBSTITUA PELA SUA IMAGEM */}
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            background: "linear-gradient(135deg, rgba(42,231,255,0.22), rgba(119,77,255,0.28))",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 24px rgba(46,226,255,0.16)",
          }}
        >
          {/* SUBSTITUA ESTE ÍCONE PELA SUA IMAGEM DE LOGO */}
          <Activity size={17} color="#e8f7ff" />
          {/* OU USE: <img src="/sua-logo.png" alt="Logo" style={{ width: 28, height: 28 }} /> */}
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span
            style={{
              color: "#f6fbff",
              fontSize: 17,
              fontWeight: 900,
              letterSpacing: 0.3,
            }}
          >
            SINGULARIDADE
          </span>
          <span
            style={{
              color: ui.cyan,
              fontSize: 10,
              fontWeight: 900,
              background: "rgba(45,226,255,0.1)",
              padding: "3px 6px",
              borderRadius: 999,
            }}
          >
            OBP
          </span>
        </div>
      </div>

      <div style={{ width: 1, height: 30, background: "rgba(255,255,255,0.08)" }} />

      <button
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          height: 36,
          padding: "0 12px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.07)",
          background: "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.012))",
          color: "#eef6ff",
          fontSize: 13,
          fontWeight: 800,
          cursor: "pointer",
        }}
      >
        <span style={{ color: ui.yellow }}>₿</span>
        {symbol}
        <ChevronDown size={13} color="#8295bb" />
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            color: "#f6fbff",
            fontSize: 13,
            fontFamily: "monospace",
            fontWeight: 900,
          }}
        >
          ${price.toLocaleString()}
        </span>
        <span
          style={{
            color: isPositive ? ui.green : ui.red,
            fontSize: 12,
            fontFamily: "monospace",
            fontWeight: 900,
          }}
        >
          {isPositive ? "+" : ""}
          {change.toFixed(2)}%
        </span>
      </div>

      <div style={{ width: 1, height: 30, background: "rgba(255,255,255,0.08)" }} />

      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {TIMEFRAMES.map((tf) => (
          <TopButton key={tf} active={timeframe === tf} onClick={() => onTimeframeChange(tf)}>
            {tf}
          </TopButton>
        ))}
      </div>

      <div style={{ width: 1, height: 30, background: "rgba(255,255,255,0.08)" }} />

      <button
        onClick={() => setReplayMode(!replayMode)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          height: 32,
          padding: "0 10px",
          borderRadius: 10,
          border: replayMode ? "1px solid rgba(247,201,72,0.34)" : "1px solid transparent",
          background: replayMode ? "linear-gradient(180deg, rgba(247,201,72,0.16), rgba(247,201,72,0.04))" : "transparent",
          color: replayMode ? ui.yellow : "#8da1c7",
          fontSize: 12,
          fontWeight: 800,
          cursor: "pointer",
        }}
      >
        <RotateCcw size={12} />
        Replay
      </button>

      <div style={{ flex: 1 }} />

      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        {NAV_TABS.map((tab, i) => (
          <TopButton key={tab} active={i === 0}>
            {tab}
          </TopButton>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: 8 }}>
        <span style={{ color: ui.green, fontSize: 12, fontWeight: 900 }}>
          {isPositive ? "+" : ""}
          {change.toFixed(2)}%
        </span>
        <Search size={15} color="#90a4c8" />
        <Bell size={15} color="#90a4c8" />
        <Settings size={15} color="#90a4c8" />
      </div>
    </div>
  );
}

// ... (resto dos componentes: ModuleStrip, ScoreDots, StructureRow, AIInsightPanel, MiniSparkline, ScoreBar, ScannerPanelContinuous, MasterScannerPanel, SmallStatCard, EventRealtimePanel, HeatmapBars, LiquidityPanel, ChartPanel, FluxoModule, EulerModule, SingularidadeModule, IAAtlasModule, EstruturaModule, WorkspaceByModule, AtlasChartPro2)

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function AtlasChartPro2() {
  // ... (todo o código existente do componente principal)
  // Mantenha todo o resto do código como está!
}
