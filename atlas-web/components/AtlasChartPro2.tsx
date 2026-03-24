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

// ============================================================
// DRAWING TOOLS TYPES & CONSTANTS
// ============================================================

export type DrawTool =
  | "cursor" | "trendline" | "hline" | "vline" | "ray" | "extended"
  | "channel" | "pitchfork" | "fib" | "fibext" | "fibarc" | "fibfan"
  | "rect" | "triangle" | "ellipse" | "measure" | "text";

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
  x1: number; y1: number;
  x2: number; y2: number;
  x3?: number; y3?: number;
  fibLevels?: FibLevel[];
  text?: string;
  fontSize?: number;
  bold?: boolean;
  label?: string;
  showArrow?: boolean;
  showVariation?: boolean;
  showPercent?: boolean;
  channelOffset?: number;
  p1?: number; // price at y1
  p2?: number; // price at y2
};

const DEFAULT_FIB_LEVELS: FibLevel[] = [
  { pct: 0,     color: "#ffd54f", visible: true  },
  { pct: 0.236, color: "#00d4ff", visible: true  },
  { pct: 0.382, color: "#00e676", visible: true  },
  { pct: 0.5,   color: "#ff9100", visible: true  },
  { pct: 0.618, color: "#c77dff", visible: true  },
  { pct: 0.786, color: "#ff3060", visible: true  },
  { pct: 1.0,   color: "#ffd54f", visible: true  },
  { pct: 1.272, color: "#448aff", visible: false },
  { pct: 1.618, color: "#00e676", visible: false },
];

const TOOL_COLORS: Record<DrawTool, string> = {
  cursor:    "#ffffff", trendline: "#00d4ff", hline:    "#ffd54f",
  vline:     "#ffd54f", ray:       "#ff9100", extended: "#00d4ff",
  channel:   "#448aff", pitchfork: "#c77dff", fib:      "#ffd54f",
  fibext:    "#00e676", fibarc:    "#ff9100", fibfan:   "#c77dff",
  rect:      "#00d4ff", triangle:  "#00e676", ellipse:  "#ff9100",
  measure:   "#00e676", text:      "#ffffff",
};

const TOOL_LABELS: Record<DrawTool, string> = {
  cursor: "Cursor (V)", trendline: "Tendência (T)", hline: "Horizontal (H)",
  vline: "Vertical (K)", ray: "Raio (R)", extended: "Estendida",
  channel: "Canal", pitchfork: "Pitchfork", fib: "Fibonacci (F)",
  fibext: "Fib Extensão", fibarc: "Fib Arcos", fibfan: "Fib Fan",
  rect: "Retângulo (G)", triangle: "Triângulo", ellipse: "Elipse",
  measure: "Medir (M)", text: "Texto (X)",
};

function makeDash(style: Drawing["lineStyle"]) {
  return style === "dashed" ? "5,3" : style === "dotted" ? "2,3" : "";
}

function newDrawing(
  tool: DrawTool, x1: number, y1: number, x2: number, y2: number
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
    x1, y1, x2, y2,
    fibLevels: ["fib","fibext","fibarc","fibfan"].includes(tool)
      ? DEFAULT_FIB_LEVELS.map(l => ({ ...l }))
      : undefined,
  };
}

function hitTestDrawing(d: Drawing, mx: number, my: number): boolean {
  const pad = 10;
  if (d.tool === "hline") return Math.abs(my - d.y1) < pad;
  if (d.tool === "vline") return Math.abs(mx - d.x1) < pad;
  if (["rect","fib","fibext","measure","ellipse","triangle"].includes(d.tool))
    return mx >= Math.min(d.x1,d.x2)-pad && mx <= Math.max(d.x1,d.x2)+pad &&
           my >= Math.min(d.y1,d.y2)-pad && my <= Math.max(d.y1,d.y2)+pad;
  if (d.tool === "text")
    return mx >= d.x1-pad && mx <= d.x1+200 && my >= d.y1-20 && my <= d.y1+pad;
  const dx = d.x2-d.x1, dy = d.y2-d.y1;
  const t = Math.max(0, Math.min(1, ((mx-d.x1)*dx+(my-d.y1)*dy)/(dx*dx+dy*dy+0.001)));
  return Math.sqrt((mx-d.x1-t*dx)**2+(my-d.y1-t*dy)**2) < pad;
}

// ============================================================
// SVG RENDERER
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
          <line x1={0} y1={d.y1} x2={svgW} y2={d.y1}
            stroke={col} strokeWidth={lw} strokeDasharray={dash || undefined} />
          {d.label && (
            <text x={6} y={d.y1-4} fill={col} fontSize={9}
              fontFamily="monospace" fontWeight="bold">{d.label}</text>
          )}
          {sel && <circle cx={svgW/2} cy={d.y1} r={5} fill="#fff" stroke={col} strokeWidth={1.5} />}
        </g>
      );

    case "vline":
      return (
        <g>
          <line x1={d.x1} y1={0} x2={d.x1} y2={svgH}
            stroke={col} strokeWidth={lw} strokeDasharray={dash || undefined} />
          {sel && <circle cx={d.x1} cy={svgH/2} r={5} fill="#fff" stroke={col} strokeWidth={1.5} />}
        </g>
      );

    case "trendline": {
      const angle = Math.atan2(d.y2-d.y1, d.x2-d.x1);
      return (
        <g>
          <line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2}
            stroke={col} strokeWidth={lw} strokeDasharray={dash || undefined} />
          {d.showArrow !== false && (
            <polygon fill={col} points={
              `${d.x2},${d.y2} ` +
              `${d.x2-12*Math.cos(angle-0.4)},${d.y2-12*Math.sin(angle-0.4)} ` +
              `${d.x2-12*Math.cos(angle+0.4)},${d.y2-12*Math.sin(angle+0.4)}`
            } />
          )}
          {d.showVariation && d.p1 && d.p2 && (
            <text x={(d.x1+d.x2)/2} y={(d.y1+d.y2)/2+12}
              fill={col} fontSize={10} fontFamily="monospace"
              textAnchor="middle" fontWeight="bold">
              {((d.p2-d.p1)/d.p1*100).toFixed(2)}%
            </text>
          )}
          {handles}
        </g>
      );
    }

    case "ray": {
      const dx=d.x2-d.x1, dy=d.y2-d.y1, len=Math.sqrt(dx*dx+dy*dy)||1;
      return (
        <g>
          <line x1={d.x1} y1={d.y1}
            x2={d.x1+(dx/len)*svgW*2} y2={d.y1+(dy/len)*svgW*2}
            stroke={col} strokeWidth={lw} strokeDasharray={dash || undefined} />
          {handles}
        </g>
      );
    }

    case "extended": {
      const dx=d.x2-d.x1, dy=d.y2-d.y1, len=Math.sqrt(dx*dx+dy*dy)||1;
      return (
        <g>
          <line
            x1={d.x1-(dx/len)*svgW*2} y1={d.y1-(dy/len)*svgW*2}
            x2={d.x2+(dx/len)*svgW*2} y2={d.y2+(dy/len)*svgW*2}
            stroke={col} strokeWidth={lw} strokeDasharray={dash || undefined} />
          {handles}
        </g>
      );
    }

    case "channel": {
      const off = d.channelOffset || 40;
      return (
        <g>
          <line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} stroke={col} strokeWidth={lw} />
          <line x1={d.x1} y1={d.y1+off} x2={d.x2} y2={d.y2+off}
            stroke={col} strokeWidth={lw} strokeDasharray="5,3" />
          <polygon fill={col} fillOpacity={fillAlpha}
            points={`${d.x1},${d.y1} ${d.x2},${d.y2} ${d.x2},${d.y2+off} ${d.x1},${d.y1+off}`} />
          {handles}
        </g>
      );
    }

    case "pitchfork": {
      const mx=(d.x2+(d.x3||d.x2))/2, my=(d.y2+(d.y3||d.y2))/2;
      const dx=mx-d.x1, dy=my-d.y1, len=Math.sqrt(dx*dx+dy*dy)||1;
      const hh=Math.abs((d.y3||d.y2)-d.y2)/2;
      return (
        <g>
          <line x1={d.x1} y1={d.y1} x2={mx+(dx/len)*svgW} y2={my+(dy/len)*svgW}
            stroke={col} strokeWidth={lw} />
          <line x1={d.x1} y1={d.y1} x2={mx+(dx/len)*svgW} y2={my+(dy/len)*svgW-hh*2}
            stroke={col} strokeWidth={lw} strokeDasharray="4,3" />
          <line x1={d.x1} y1={d.y1} x2={mx+(dx/len)*svgW} y2={my+(dy/len)*svgW+hh*2}
            stroke={col} strokeWidth={lw} strokeDasharray="4,3" />
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
          {levels.filter(l => l.visible).map((lvl, i) => {
            const y = d.y1 + pDiff * lvl.pct;
            if (y < -50 || y > svgH + 50) return null;
            return (
              <g key={i}>
                <line x1={minX} y1={y} x2={svgW} y2={y}
                  stroke={lvl.color} strokeWidth={lw}
                  strokeDasharray={dash || undefined} opacity={0.8} />
                {d.showPrice && (
                  <text x={minX+4} y={y-3} fill={lvl.color}
                    fontSize={9} fontFamily="monospace" fontWeight="bold">
                    {(lvl.pct*100).toFixed(1)}%
                  </text>
                )}
              </g>
            );
          })}
          {levels.filter(l => l.visible).map((lvl, i, arr) => {
            if (i >= arr.length-1) return null;
            const y1 = d.y1 + pDiff * lvl.pct;
            const y2 = d.y1 + pDiff * arr[i+1].pct;
            return (
              <rect key={i} x={minX} y={Math.min(y1,y2)}
                width={svgW-minX} height={Math.abs(y2-y1)}
                fill={lvl.color} fillOpacity={fillAlpha} />
            );
          })}
          <line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2}
            stroke={col} strokeWidth={lw+0.5} />
          {handles}
        </g>
      );
    }

    case "fibarc": {
      const r = Math.sqrt((d.x2-d.x1)**2+(d.y2-d.y1)**2);
      const levels = d.fibLevels || DEFAULT_FIB_LEVELS;
      return (
        <g>
          {levels.filter(l => l.visible).map((lvl, i) => (
            <circle key={i} cx={d.x1} cy={d.y1} r={r*lvl.pct}
              fill="none" stroke={lvl.color} strokeWidth={lw} opacity={0.75} />
          ))}
          {handles}
        </g>
      );
    }

    case "fibfan": {
      const levels = d.fibLevels || DEFAULT_FIB_LEVELS;
      return (
        <g>
          {levels.filter(l => l.visible).map((lvl, i) => {
            const ty = d.y1 + (d.y2-d.y1) * lvl.pct;
            const dx = d.x2-d.x1, dy = ty-d.y1;
            const len = Math.sqrt(dx*dx+dy*dy) || 1;
            return (
              <line key={i} x1={d.x1} y1={d.y1}
                x2={d.x1+(dx/len)*svgW*2} y2={d.y1+(dy/len)*svgW*2}
                stroke={lvl.color} strokeWidth={lw} opacity={0.75} />
            );
          })}
          {handles}
        </g>
      );
    }

    case "rect": {
      const rx=Math.min(d.x1,d.x2), ry=Math.min(d.y1,d.y2);
      const rw=Math.abs(d.x2-d.x1), rh=Math.abs(d.y2-d.y1);
      return (
        <g>
          <rect x={rx} y={ry} width={rw} height={rh}
            fill={col} fillOpacity={fillAlpha} stroke={col} strokeWidth={lw} />
          {d.showPercent !== false && d.p1 && d.p2 && (
            <text x={rx+rw/2} y={ry+rh/2+4} fill={col} fontSize={11}
              fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              {((d.p2-d.p1)/d.p1*100).toFixed(2)}%
            </text>
          )}
          {handles}
        </g>
      );
    }

    case "triangle": {
      const pts = `${d.x1},${d.y1} ${d.x2},${d.y2} `+
        `${(d.x1+d.x2)/2},${Math.min(d.y1,d.y2)-Math.abs(d.y2-d.y1)*0.5}`;
      return (
        <g>
          <polygon points={pts} fill={col} fillOpacity={fillAlpha}
            stroke={col} strokeWidth={lw} />
          {handles}
        </g>
      );
    }

    case "ellipse": {
      const cx=(d.x1+d.x2)/2, cy=(d.y1+d.y2)/2;
      const rx=Math.abs(d.x2-d.x1)/2, ry=Math.abs(d.y2-d.y1)/2;
      return (
        <g>
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry}
            fill={col} fillOpacity={fillAlpha} stroke={col} strokeWidth={lw} />
          {handles}
        </g>
      );
    }

    case "measure": {
      const mc = d.y1 > d.y2 ? "#00e676" : "#ff3060";
      const rx=Math.min(d.x1,d.x2), ry=Math.min(d.y1,d.y2);
      const rw=Math.abs(d.x2-d.x1), rh=Math.abs(d.y2-d.y1);
      return (
        <g>
          <rect x={rx} y={ry} width={rw} height={rh}
            fill={mc} fillOpacity={0.1} stroke={mc} strokeWidth={lw} />
          <text x={rx+rw/2} y={ry+rh/2+4} fill={mc} fontSize={11}
            fontWeight="bold" textAnchor="middle" fontFamily="monospace">
            {rh.toFixed(0)}px
          </text>
          {handles}
        </g>
      );
    }

    case "text":
      return (
        <g>
          <text x={d.x1} y={d.y1} fill={col}
            fontSize={d.fontSize || 13}
            fontWeight={d.bold ? "bold" : "normal"}
            fontFamily="monospace">
            {d.text || ""}
          </text>
        </g>
      );

    default:
      return null;
  }
}

// ============================================================
// LEFT TOOLBAR
// ============================================================

const TOOL_GROUPS_CONFIG = [
  { title: "CURSOR",  items: [{ key: "cursor"    as DrawTool, icon: "↖" }] },
  { title: "LINHAS",  items: [
    { key: "trendline" as DrawTool, icon: "╱" },
    { key: "hline"     as DrawTool, icon: "─" },
    { key: "vline"     as DrawTool, icon: "│" },
    { key: "ray"       as DrawTool, icon: "→" },
    { key: "extended"  as DrawTool, icon: "↔" },
  ]},
  { title: "CANAIS",  items: [
    { key: "channel"   as DrawTool, icon: "⦀" },
    { key: "pitchfork" as DrawTool, icon: "⑂" },
  ]},
  { title: "FIBO",    items: [
    { key: "fib"    as DrawTool, icon: "FIB" },
    { key: "fibext" as DrawTool, icon: "EXT" },
    { key: "fibarc" as DrawTool, icon: "◌"  },
    { key: "fibfan" as DrawTool, icon: "⋱"  },
  ]},
  { title: "FORMAS",  items: [
    { key: "rect"     as DrawTool, icon: "▭" },
    { key: "triangle" as DrawTool, icon: "△" },
    { key: "ellipse"  as DrawTool, icon: "◯" },
  ]},
  { title: "MISC",    items: [
    { key: "measure" as DrawTool, icon: "⟺" },
    { key: "text"    as DrawTool, icon: "T"  },
  ]},
];

function DrawingToolbar({
  activeTool,
  onChangeTool,
}: {
  activeTool: DrawTool;
  onChangeTool: (t: DrawTool) => void;
}) {
  return (
    <div style={{
      width: 52,
      borderRight: "1px solid #172133",
      background: "linear-gradient(180deg,rgba(8,12,24,0.98),rgba(6,9,17,0.98))",
      display: "flex", flexDirection: "column",
      padding: "8px 6px", gap: 2,
      overflowY: "auto", flexShrink: 0,
    }}>
      {TOOL_GROUPS_CONFIG.map((group, gi) => (
        <div key={gi}>
          {gi > 0 && <div style={{ height: 1, background: "#172133", margin: "3px 0" }} />}
          <div style={{
            color: "#424e63", fontSize: 7, fontWeight: 900,
            letterSpacing: 0.8, textTransform: "uppercase",
            textAlign: "center", marginBottom: 3,
          }}>
            {group.title}
          </div>
          {group.items.map(item => {
            const active = activeTool === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onChangeTool(item.key)}
                title={TOOL_LABELS[item.key]}
                style={{
                  width: 38, height: 34,
                  margin: "0 auto", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  borderRadius: 7, cursor: "pointer",
                  border: active
                    ? "1px solid rgba(45,226,255,0.3)"
                    : "1px solid rgba(255,255,255,0.04)",
                  background: active
                    ? "radial-gradient(circle,rgba(45,226,255,0.18),rgba(45,226,255,0.04))"
                    : "linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.008))",
                  color: active ? "#2de2ff" : "#90a4c8",
                  fontSize: item.icon.length > 1 ? 8 : 13,
                  fontWeight: 900, fontFamily: "monospace",
                }}
              >
                {item.icon}
              </button>
            );
          })}
        </div>
      ))}
      <div style={{ height: 1, background: "#172133", margin: "3px 0" }} />
      {/* Undo & Clear */}
      {[{ icon: "↩", label: "Desfazer (Z)" }, { icon: "✕", label: "Limpar tudo" }].map((b, i) => (
        <button key={i} title={b.label} style={{
          width: 38, height: 34, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 7, cursor: "pointer", fontSize: 13,
          border: "1px solid rgba(255,255,255,0.04)",
          background: "transparent", color: "#6a7f99",
        }}>
          {b.icon}
        </button>
      ))}
    </div>
  );
}

// ============================================================
// DRAWING SETTINGS MODAL
// ============================================================

function DrawingSettingsModal({
  drawing,
  onApply,
  onClose,
}: {
  drawing: Drawing;
  onApply: (d: Drawing) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState<Drawing>({
    ...drawing,
    fibLevels: drawing.fibLevels?.map(l => ({ ...l })),
  });
  const [tab, setTab] = useState<"style" | "levels" | "visibility">("style");
  const set = (patch: Partial<Drawing>) => setLocal(p => ({ ...p, ...patch }));
  const fibLevels = local.fibLevels ?? DEFAULT_FIB_LEVELS.map(l => ({ ...l }));
  const hasFib = ["fib","fibext","fibarc","fibfan"].includes(local.tool);
  const swatches = ["#ffd54f","#00d4ff","#00e676","#ff3060","#c77dff","#ff9100","#448aff","#ffffff"];

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.8)", zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#0f1520", border: "1px solid #1e2d42",
        borderRadius: 12, padding: 20,
        width: 380, maxHeight: "88vh", overflowY: "auto",
      }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 14 }}>
          <span style={{ color:"#e8f1ff", fontSize:13, fontWeight:800 }}>
            ⚙ {TOOL_LABELS[local.tool]}
          </span>
          <button onClick={onClose} style={{ background:"transparent", border:"none", color:"#7f93b7", cursor:"pointer", fontSize:16 }}>✕</button>
        </div>

        <div style={{ display:"flex", gap:4, marginBottom:14, borderBottom:"1px solid #172133", paddingBottom:8 }}>
          {(["style","levels","visibility"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding:"4px 10px", borderRadius:5, fontSize:10, fontWeight:700, cursor:"pointer",
              background: tab===t ? "#2de2ff" : "transparent",
              color: tab===t ? "#000" : "#7f93b7",
              border: tab===t ? "none" : "1px solid #172133",
            }}>
              {t === "style" ? "🎨 Estilo" : t === "levels" ? "📊 Níveis" : "👁 Visib."}
            </button>
          ))}
        </div>

        {tab === "style" && (
          <div style={{ display:"grid", gap:12 }}>
            <div>
              <div style={{ fontSize:9, color:"#7f93b7", marginBottom:6 }}>Cor</div>
              <div style={{ display:"flex", gap:4, flexWrap:"wrap", alignItems:"center" }}>
                {swatches.map(c => (
                  <div key={c} onClick={() => set({ color: c })} style={{
                    width:22, height:22, borderRadius:4, background:c, cursor:"pointer",
                    border: local.color === c ? "2px solid #fff" : "2px solid transparent",
                  }} />
                ))}
                <input type="color" value={local.color}
                  onChange={e => set({ color: e.target.value })}
                  style={{ width:24, height:24, border:"none", borderRadius:4, cursor:"pointer", padding:0 }} />
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div>
                <div style={{ fontSize:9, color:"#7f93b7", marginBottom:4 }}>Espessura</div>
                <select value={local.lineWidth} onChange={e => set({ lineWidth: parseFloat(e.target.value) })}
                  style={{ width:"100%", background:"#0a1020", border:"1px solid #1e2d42", borderRadius:4, color:"#e8f1ff", fontSize:10, padding:"5px 7px" }}>
                  <option value={1}>Fina</option>
                  <option value={1.5}>Normal</option>
                  <option value={2}>Média</option>
                  <option value={3}>Grossa</option>
                  <option value={4}>Muito Grossa</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize:9, color:"#7f93b7", marginBottom:4 }}>Estilo</div>
                <select value={local.lineStyle} onChange={e => set({ lineStyle: e.target.value as Drawing["lineStyle"] })}
                  style={{ width:"100%", background:"#0a1020", border:"1px solid #1e2d42", borderRadius:4, color:"#e8f1ff", fontSize:10, padding:"5px 7px" }}>
                  <option value="solid">Sólida ───</option>
                  <option value="dashed">Tracejada ─ ─</option>
                  <option value="dotted">Pontilhada · ·</option>
                </select>
              </div>
            </div>

            <div>
              <div style={{ fontSize:9, color:"#7f93b7", marginBottom:4 }}>
                Opacidade fundo: {local.fillOpacity}%
              </div>
              <input type="range" min={0} max={40} value={local.fillOpacity}
                onChange={e => set({ fillOpacity: parseInt(e.target.value) })}
                style={{ width:"100%", accentColor:"#2de2ff" }} />
            </div>

            <label style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#e8f1ff" }}>
              Mostrar preço
              <input type="checkbox" checked={local.showPrice}
                onChange={e => set({ showPrice: e.target.checked })}
                style={{ accentColor:"#2de2ff" }} />
            </label>

            {hasFib && (
              <div style={{ borderTop:"1px solid #172133", paddingTop:10 }}>
                <div style={{ fontSize:9, fontWeight:700, color:"#7f93b7", textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>
                  Níveis Fibonacci
                </div>
                <div style={{ maxHeight:170, overflowY:"auto", display:"flex", flexDirection:"column", gap:4 }}>
                  {fibLevels.map((lvl, i) => (
                    <div key={i} style={{ display:"grid", gridTemplateColumns:"auto 1fr auto auto", gap:4, alignItems:"center" }}>
                      <input type="checkbox" checked={lvl.visible}
                        onChange={e => {
                          const nl = [...fibLevels];
                          nl[i] = { ...nl[i], visible: e.target.checked };
                          set({ fibLevels: nl });
                        }}
                        style={{ accentColor:"#2de2ff" }} />
                      <input type="number" value={(lvl.pct*100).toFixed(1)}
                        step={0.1} min={-500} max={500}
                        onChange={e => {
                          const nl = [...fibLevels];
                          nl[i] = { ...nl[i], pct: parseFloat(e.target.value)/100 };
                          set({ fibLevels: nl });
                        }}
                        style={{ background:"#0a1020", border:"1px solid #1e2d42", borderRadius:3, color:"#e8f1ff", fontSize:10, padding:"2px 5px", width:70 }} />
                      <input type="color" value={lvl.color}
                        onChange={e => {
                          const nl = [...fibLevels];
                          nl[i] = { ...nl[i], color: e.target.value };
                          set({ fibLevels: nl });
                        }}
                        style={{ width:20, height:20, border:"none", borderRadius:3, cursor:"pointer", padding:0 }} />
                      <button onClick={() => set({ fibLevels: fibLevels.filter((_,j) => j !== i) })}
                        style={{ background:"transparent", border:"none", color:"#ff3060", cursor:"pointer", fontSize:12, padding:"1px 4px" }}>✕</button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => set({ fibLevels: [...fibLevels, { pct: 2.0, color: "#00d4ff", visible: true }] })}
                  style={{ marginTop:6, width:"100%", padding:"4px 0", background:"#0a1020", border:"1px solid #1e2d42", borderRadius:4, color:"#2de2ff", fontSize:10, cursor:"pointer" }}>
                  + Nível
                </button>
              </div>
            )}

            {local.tool === "hline" && (
              <div style={{ borderTop:"1px solid #172133", paddingTop:10 }}>
                <div style={{ fontSize:9, color:"#7f93b7", marginBottom:4 }}>Rótulo</div>
                <input value={local.label || ""} onChange={e => set({ label: e.target.value })}
                  placeholder="Ex: Suporte, Resistência..."
                  style={{ width:"100%", background:"#0a1020", border:"1px solid #1e2d42", borderRadius:4, color:"#e8f1ff", fontSize:10, padding:"5px 7px" }} />
              </div>
            )}

            {["trendline","ray","extended"].includes(local.tool) && (
              <div style={{ borderTop:"1px solid #172133", paddingTop:10, display:"flex", flexDirection:"column", gap:6 }}>
                <label style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#e8f1ff" }}>
                  Mostrar seta
                  <input type="checkbox" checked={local.showArrow !== false}
                    onChange={e => set({ showArrow: e.target.checked })}
                    style={{ accentColor:"#2de2ff" }} />
                </label>
                <label style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#e8f1ff" }}>
                  Variação %
                  <input type="checkbox" checked={!!local.showVariation}
                    onChange={e => set({ showVariation: e.target.checked })}
                    style={{ accentColor:"#2de2ff" }} />
                </label>
              </div>
            )}

            {local.tool === "text" && (
              <div style={{ borderTop:"1px solid #172133", paddingTop:10, display:"grid", gap:8 }}>
                <div>
                  <div style={{ fontSize:9, color:"#7f93b7", marginBottom:4 }}>Texto</div>
                  <input value={local.text || ""} onChange={e => set({ text: e.target.value })}
                    style={{ width:"100%", background:"#0a1020", border:"1px solid #1e2d42", borderRadius:4, color:"#e8f1ff", fontSize:10, padding:"5px 7px" }} />
                </div>
                <select value={local.fontSize || 13} onChange={e => set({ fontSize: parseInt(e.target.value) })}
                  style={{ width:"100%", background:"#0a1020", border:"1px solid #1e2d42", borderRadius:4, color:"#e8f1ff", fontSize:10, padding:"5px 7px" }}>
                  <option value={10}>Pequeno</option><option value={13}>Médio</option>
                  <option value={16}>Grande</option><option value={20}>Muito Grande</option>
                </select>
                <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"#e8f1ff" }}>
                  <input type="checkbox" checked={!!local.bold}
                    onChange={e => set({ bold: e.target.checked })}
                    style={{ accentColor:"#2de2ff" }} /> Negrito
                </label>
              </div>
            )}
          </div>
        )}

        {tab === "levels" && (
          <div>
            {hasFib ? (
              fibLevels.filter(l => l.visible).map((l, i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:"1px solid #172133" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <div style={{ width:10, height:10, borderRadius:2, background:l.color }} />
                    <span style={{ fontSize:10, color:"#8ea2c8" }}>{(l.pct*100).toFixed(1)}%</span>
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, color:l.color }}>—</span>
                </div>
              ))
            ) : (
              <div style={{ color:"#536887", fontSize:11, textAlign:"center", padding:20 }}>
                Sem níveis para este tipo de desenho
              </div>
            )}
          </div>
        )}

        {tab === "visibility" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <label style={{ display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:11, color:"#e8f1ff", padding:"6px 0", borderBottom:"1px solid #172133" }}>
              Visível
              <input type="checkbox" checked={!local.hidden}
                onChange={e => set({ hidden: !e.target.checked })}
                style={{ accentColor:"#2de2ff", width:15, height:15 }} />
            </label>
            <label style={{ display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:11, color:"#e8f1ff", padding:"6px 0", borderBottom:"1px solid #172133" }}>
              Travado (não mover)
              <input type="checkbox" checked={local.locked}
                onChange={e => set({ locked: e.target.checked })}
                style={{ accentColor:"#2de2ff", width:15, height:15 }} />
            </label>
            <div>
              <div style={{ fontSize:9, color:"#7f93b7", marginBottom:4 }}>Nota</div>
              <textarea value={local.note} onChange={e => set({ note: e.target.value })} rows={3}
                style={{ width:"100%", background:"#0a1020", border:"1px solid #1e2d42", borderRadius:4, color:"#e8f1ff", fontSize:10, padding:"5px 7px", resize:"vertical" }} />
            </div>
          </div>
        )}

        <div style={{ display:"flex", gap:8, marginTop:16 }}>
          <button onClick={onClose} style={{ flex:1, padding:8, borderRadius:5, fontSize:11, fontWeight:700, cursor:"pointer", background:"#0a1020", border:"1px solid #1e2d42", color:"#7f93b7" }}>
            Cancelar
          </button>
          <button onClick={() => { onApply(local); onClose(); }}
            style={{ flex:1, padding:8, borderRadius:5, fontSize:11, fontWeight:700, cursor:"pointer", background:"#2de2ff", border:"none", color:"#000" }}>
            ✓ Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CONTEXT MENU
// ============================================================

function DrawingContextMenu({
  x, y, drawing,
  onSettings, onDelete, onToggleLock, onToggleHide, onClose,
}: {
  x: number; y: number; drawing: Drawing;
  onSettings: () => void; onDelete: () => void;
  onToggleLock: () => void; onToggleHide: () => void; onClose: () => void;
}) {
  useEffect(() => {
    const h = () => onClose();
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, [onClose]);

  const items = [
    { label: "⚙ Configurações", action: onSettings },
    { label: drawing.locked ? "🔓 Destravar" : "🔒 Travar", action: onToggleLock },
    { label: drawing.hidden ? "👁 Mostrar" : "🙈 Ocultar", action: onToggleHide },
    { label: "🗑 Apagar", action: onDelete, danger: true },
  ];

  return (
    <div style={{
      position: "fixed", left: x, top: y,
      background: "#0f1520", border: "1px solid #1e2d42",
      borderRadius: 7, zIndex: 900, minWidth: 165,
      boxShadow: "0 8px 24px rgba(0,0,0,.6)", overflow: "hidden",
    }}>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i === items.length - 1 && (
            <div style={{ height: 1, background: "#172133", margin: "2px 0" }} />
          )}
          <div
            onClick={() => { item.action(); onClose(); }}
            style={{ padding: "7px 12px", fontSize: 11, cursor: "pointer", color: item.danger ? "#ff3060" : "#e8f1ff" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#1a2535")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            {item.label}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

// ============================================================
// CUSTOM HOOKS
// ============================================================

function useDrawings() {
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<DrawTool>("cursor");

  const addDrawing = useCallback((d: Drawing) => {
    setDrawings(prev => [...prev, d]);
    setSelectedId(d.id);
    setActiveTool("cursor");
  }, []);

  const updateDrawing = useCallback((id: string, patch: Partial<Drawing>) => {
    setDrawings(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d));
  }, []);

  const deleteSelected = useCallback(() => {
    setDrawings(prev => prev.filter(d => d.id !== selectedId));
    setSelectedId(null);
  }, [selectedId]);

  const clearAll = useCallback(() => {
    setDrawings([]);
    setSelectedId(null);
  }, []);

  const toggleLock = useCallback(() => {
    if (!selectedId) return;
    setDrawings(prev => prev.map(d =>
      d.id === selectedId ? { ...d, locked: !d.locked } : d
    ));
  }, [selectedId]);

  const applySettings = useCallback((updated: Drawing) => {
    setDrawings(prev => prev.map(d => d.id === updated.id ? updated : d));
  }, []);

  return {
    drawings, selectedId, activeTool,
    setSelectedId, setActiveTool,
    addDrawing, updateDrawing, deleteSelected, clearAll, toggleLock, applySettings,
    setDrawings, // needed for undo
  };
}

function useDrawingKeyboard(
  selectedId: string | null,
  activeTool: DrawTool,
  onDelete: () => void,
  onUndo: () => void,
  onClear: () => void,
  onChangeTool: (t: DrawTool) => void,
  onEscape: () => void,
) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        onDelete();
        return;
      }

      if (e.key === "Escape") { onEscape(); return; }
      if (e.key === "z" || e.key === "Z") { onUndo(); return; }

      const map: Record<string, DrawTool> = {
        v: "cursor", t: "trendline", h: "hline", k: "vline",
        r: "ray",    f: "fib",       g: "rect",  m: "measure", x: "text",
      };
      if (map[e.key]) onChangeTool(map[e.key]);
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedId, activeTool, onDelete, onUndo, onClear, onChangeTool, onEscape]);
}

// ============================================================
// DRAWING OPTIONS BAR
// ============================================================

function DrawingOptionsBar({
  selectedDrawing,
  activeTool,
  drawings,
  onDelete,
  onClear,
  onToggleLock,
  onOpenSettings,
  onSetColor,
}: {
  selectedDrawing: Drawing | null;
  activeTool: DrawTool;
  drawings: Drawing[];
  onDelete: () => void;
  onClear: () => void;
  onToggleLock: () => void;
  onOpenSettings: () => void;
  onSetColor: (c: string) => void;
}) {
  const btnStyle = (active = false, danger = false): React.CSSProperties => ({
    padding: "2px 8px", borderRadius: 5,
    border: "1px solid rgba(255,255,255,0.07)",
    background: active ? "rgba(45,226,255,0.1)" : "transparent",
    color: danger ? "#ff3060" : active ? "#2de2ff" : "#9ab0d4",
    fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
  });

  return (
    <div style={{
      height: 28, padding: "0 10px",
      display: "flex", alignItems: "center", gap: 4,
      borderBottom: "1px solid #172133",
      background: "rgba(255,255,255,0.012)", flexShrink: 0,
    }}>
      <button style={btnStyle(!!selectedDrawing?.locked)} onClick={onToggleLock}>🔒 Travar</button>
      <button style={btnStyle()} onClick={onOpenSettings}>⚙ Config.</button>
      <button style={btnStyle(false, true)} onClick={onDelete}>✕ Apagar</button>
      <button style={btnStyle()} onClick={onClear}>🗑 Limpar</button>
      <div style={{ width: 1, height: 14, background: "#172133", margin: "0 4px" }} />
      <span style={{ fontSize: 9, color: "#536887" }}>Cor:</span>
      {["#ffd54f","#00d4ff","#00e676","#ff3060","#c77dff"].map(c => (
        <div key={c} onClick={() => onSetColor(c)}
          style={{ width:14, height:14, borderRadius:3, background:c, cursor:"pointer", border:"1px solid transparent" }} />
      ))}
      <div style={{ flex: 1 }} />
      <span style={{ fontSize: 9, color: "#536887", fontStyle: "italic" }}>
        {selectedDrawing
          ? `${TOOL_LABELS[selectedDrawing.tool]} ${selectedDrawing.locked ? "🔒" : ""} — Del=apagar • 2×clique=config`
          : activeTool !== "cursor"
          ? `Clique para iniciar • Esc=cancelar`
          : `${drawings.filter(d => !d.hidden).length} desenhos`
        }
      </span>
    </div>
  );
}

// ============================================================
// EXISTING TYPES (from original)
// ============================================================

type Timeframe = "1m" | "5m" | "15m" | "30m" | "1H" | "4H" | "1D";
type ModeKey = "auto" | "manual" | "space";
type TopModuleKey =
  | "Fluxo"
  | "Singularidade"
  | "IA Atlas"
  | "Scanner"
  | "Mestre Scanner"
  | "Estrutura"
  | "Euler"
  | "Liquidez";

type CandleData = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type IndicatorData = {
  time: number;
  rsi: number;
  mfi: number;
};

type StructureItem = {
  label: string;
  value?: string;
  type: "positive" | "strong" | "negative" | "neutral" | "dots";
  dots?: number;
};

type AIInsight = {
  symbol: string;
  price: number;
  score: number;
  signal: string;
  riskLevel: string;
  riskType: string;
  invalidation: number;
  trendBias: "bullish" | "bearish" | "neutral";
  structure: StructureItem[];
  structure2: StructureItem[];
};

type AssetScore = {
  symbol: string;
  volumeScore: number;
  rsiMfi: number;
  price: number;
  change: number;
  trend: "up" | "down" | "neutral";
  color: string;
  aiScore: number;
  signal: string;
  riskLevel: string;
  riskType: string;
  invalidation: number;
};

type DrawObject = {
  id: string;
  name: string;
  type: string;
};

type ScannerEvent = {
  time: string;
  title: string;
  tag: string;
  tone: "positive" | "warning" | "neutral";
};

// ============================================================
// EXISTING UTILITIES
// ============================================================

const TIMEFRAMES: Timeframe[] = ["1m", "5m", "15m", "30m", "1H", "4H", "1D"];
const NAV_TABS = ["Gráfico", "Ordens", "Posições", "IA Atlas", "Fluxo"];
const TOP_MODULES: TopModuleKey[] = [
  "Fluxo",
  "Singularidade",
  "IA Atlas",
  "Scanner",
  "Mestre Scanner",
  "Estrutura",
  "Euler",
  "Liquidez",
];
const LIQUIDITY_TABS = ["Liquidez", "Map", "Clusters", "Eventos", "Fluxo Institucional", "Notícias IA Atlas"];

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

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function formatCompact(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  return n.toFixed(2);
}

function symbolBasePrice(symbol: string) {
  const map: Record<string, number> = {
    BTC: 74682,
    ETH: 3932,
    SOL: 174.8,
    BNB: 610.75,
    XRP: 2.147,
    DOGE: 0.387,
    AVAX: 38.87,
    DOT: 8.98,
    ADA: 0.847,
    ARB: 1.21,
    SEI: 0.58,
    INJ: 65.99,
    CORE: 1.9,
    PET: 0.65,
  };
  return map[symbol] ?? 100;
}

function generateCandles(count = 240, startPrice = 74500): CandleData[] {
  const now = Math.floor(Date.now() / 1000);
  const candles: CandleData[] = [];
  let prevClose = startPrice;

  for (let i = count; i > 0; i--) {
    const time = now - i * 300;
    const wave =
      Math.sin(i / 11) * (startPrice * 0.0045) +
      Math.cos(i / 17) * (startPrice * 0.0022);
    const drift = (Math.random() - 0.49) * (startPrice * 0.0065) + wave;
    const open = prevClose;
    const close = Math.max(0.0001, open + drift);
    const high = Math.max(open, close) + Math.random() * (startPrice * 0.0035);
    const low = Math.min(open, close) - Math.random() * (startPrice * 0.0035);
    const volume = 120 + Math.random() * 1400;
    candles.push({ time, open, high, low, close, volume });
    prevClose = close;
  }

  return candles;
}

function generateIndicators(candles: CandleData[]): IndicatorData[] {
  return candles.map((c, i) => {
    const rsi = clamp(48 + Math.sin(i / 8) * 14 + (Math.random() - 0.5) * 6, 5, 95);
    const mfi = clamp(52 + Math.cos(i / 10) * 16 + (Math.random() - 0.5) * 6, 5, 95);
    return { time: c.time, rsi, mfi };
  });
}

function computeSMA(candles: CandleData[], period: number) {
  return candles.map((c, i) => {
    if (i < period - 1) return { time: c.time, value: c.close };
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += candles[j].close;
    return { time: c.time, value: sum / period };
  });
}

function computeEMA(candles: CandleData[], period: number) {
  const k = 2 / (period + 1);
  const ema: { time: number; value: number }[] = [];
  let prev = candles[0]?.close ?? 0;
  for (let i = 0; i < candles.length; i++) {
    const close = candles[i].close;
    const value = i === 0 ? close : close * k + prev * (1 - k);
    ema.push({ time: candles[i].time, value });
    prev = value;
  }
  return ema;
}

function generateSparkline(count: number, start: number, trend: "up" | "down" | "neutral") {
  const arr: number[] = [];
  let value = start;
  for (let i = 0; i < count; i++) {
    const drift = trend === "up" ? 1.3 : trend === "down" ? -1.2 : 0.12;
    value += drift + (Math.random() - 0.5) * 3;
    arr.push(value);
  }
  return arr;
}

function getScoreVisual(score: number) {
  if (score >= 80) return { color: ui.green, label: "Compra" };
  if (score >= 50) return { color: ui.yellow, label: "Neutro" };
  return { color: ui.red, label: "Baixa" };
}

function symbolToInsight(asset: AssetScore): AIInsight {
  return {
    symbol: asset.symbol,
    price: asset.price,
    score: asset.aiScore,
    signal: asset.signal,
    riskLevel: asset.riskLevel,
    riskType: asset.riskType,
    invalidation: asset.invalidation,
    trendBias: asset.trend === "up" ? "bullish" : asset.trend === "down" ? "bearish" : "neutral",
    structure: [
      {
        label: "Fluxo",
        value:
          asset.trend === "up" ? "Positivo" : asset.trend === "down" ? "Pressão" : "Neutro",
        type:
          asset.trend === "up" ? "positive" : asset.trend === "down" ? "negative" : "neutral",
      },
      {
        label: "Momentum",
        value: asset.aiScore >= 80 ? "Forte" : asset.aiScore >= 60 ? "Moderado" : "Fraco",
        type: asset.aiScore >= 80 ? "strong" : asset.aiScore >= 60 ? "neutral" : "negative",
      },
      {
        label: "Liquidez",
        value:
          asset.volumeScore >= 70 ? "Ativo" : asset.volumeScore >= 50 ? "Médio" : "Baixo",
        type:
          asset.volumeScore >= 70 ? "positive" : asset.volumeScore >= 50 ? "neutral" : "negative",
      },
      {
        label: "Confluência",
        type: "dots",
        dots: Math.max(2, Math.min(9, Math.round(asset.aiScore / 11))),
      },
    ],
    structure2: [
      {
        label: "Euler",
        value:
          asset.trend === "up" ? "Alinhado" : asset.trend === "down" ? "Pressão" : "Estável",
        type:
          asset.trend === "up" ? "positive" : asset.trend === "down" ? "negative" : "neutral",
      },
      {
        label: "Razão de Prata",
        value: asset.rsiMfi >= 60 ? "Forte" : asset.rsiMfi >= 45 ? "Estável" : "Fraca",
        type: asset.rsiMfi >= 60 ? "positive" : asset.rsiMfi >= 45 ? "neutral" : "negative",
      },
      {
        label: "Risco Assimétrico",
        value: asset.change >= 0 ? "Bom" : "Sensível",
        type: asset.change >= 0 ? "positive" : "negative",
      },
      {
        label: "Invalidação",
        value: asset.change >= 0 ? "Controlada" : "Próxima",
        type: asset.change >= 0 ? "neutral" : "negative",
      },
    ],
  };
}

// ============================================================
// EXISTING COMPONENTS (unchanged except where noted)
// ============================================================

function ModuleButton({
  icon,
  text,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  text: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        height: 34,
        padding: "0 14px",
        borderRadius: 12,
        border: active
          ? "1px solid rgba(247,201,72,0.34)"
          : "1px solid rgba(255,255,255,0.06)",
        background: active
          ? "linear-gradient(180deg, rgba(247,201,72,0.16), rgba(247,201,72,0.04))"
          : "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01))",
        color: active ? "#ffe39a" : "#d9e8ff",
        fontSize: 12,
        fontWeight: 800,
        cursor: "pointer",
      }}
    >
      {icon}
      {text}
    </button>
  );
}

function TopButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 29,
        padding: "0 10px",
        borderRadius: 9,
        border: active
          ? "1px solid rgba(247,201,72,0.34)"
          : "1px solid rgba(255,255,255,0.06)",
        background: active
          ? "linear-gradient(180deg, rgba(247,201,72,0.16), rgba(247,201,72,0.04))"
          : "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.008))",
        color: active ? ui.yellow : "#dce8ff",
        fontSize: 11,
        fontWeight: 800,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

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
        background:
          "radial-gradient(circle at top, rgba(14,28,60,0.86), rgba(6,10,20,0.98) 55%)",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 8 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            background:
              "linear-gradient(135deg, rgba(42,231,255,0.22), rgba(119,77,255,0.28))",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 24px rgba(46,226,255,0.16)",
          }}
        >
          <Activity size={17} color="#e8f7ff" />
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
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.012))",
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
          background: replayMode
            ? "linear-gradient(180deg, rgba(247,201,72,0.16), rgba(247,201,72,0.04))"
            : "transparent",
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

function ModuleStrip({
  activeModule,
  onChange,
}: {
  activeModule: TopModuleKey;
  onChange: (m: TopModuleKey) => void;
}) {
  const icons: Record<TopModuleKey, React.ReactNode> = {
    Fluxo: <Waves size={13} />,
    Singularidade: <BrainCircuit size={13} />,
    "IA Atlas": <Activity size={13} />,
    Scanner: <ScanSearch size={13} />,
    "Mestre Scanner": <Star size={13} />,
    Estrutura: <Layers3 size={13} />,
    Euler: <Sigma size={13} />,
    Liquidez: <Droplets size={13} />,
  };

  return (
    <div
      style={{
        height: 50,
        padding: "0 16px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        borderBottom: `1px solid ${ui.border}`,
        background:
          "linear-gradient(180deg, rgba(8,12,23,0.98), rgba(7,11,20,0.98))",
        flexShrink: 0,
      }}
    >
      {TOP_MODULES.map((module) => (
        <ModuleButton
          key={module}
          icon={icons[module]}
          text={module}
          active={activeModule === module}
          onClick={() => onChange(module)}
        />
      ))}
    </div>
  );
}

// ============================================================
// EXISTING COMPONENTS (continued)
// ============================================================

function ScoreDots({ count, total = 9 }: { count: number; total?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            display: "inline-block",
            background:
              i < count
                ? "linear-gradient(180deg, #31e9ff, #18b7ff)"
                : "rgba(255,255,255,0.14)",
          }}
        />
      ))}
    </div>
  );
}

function StructureRow({ item }: { item: StructureItem }) {
  const getColor = (type: StructureItem["type"]) => {
    switch (type) {
      case "positive":
        return ui.green;
      case "strong":
        return "#9fffbc";
      case "negative":
        return ui.red;
      case "neutral":
        return "#aab7d1";
      default:
        return "#dbe7ff";
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "7px 0",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <ChevronRight size={10} color="#66789d" />
        <span style={{ fontSize: 12, color: "#8ea2c8" }}>{item.label}</span>
      </div>
      {item.type === "dots" && item.dots !== undefined ? (
        <ScoreDots count={item.dots} />
      ) : (
        <span style={{ fontSize: 12, color: getColor(item.type), fontWeight: 700 }}>
          {item.value}
        </span>
      )}
    </div>
  );
}

function AIInsightPanel({
  insight,
  topModule,
}: {
  insight: AIInsight;
  topModule: TopModuleKey;
}) {
  const scoreColor =
    insight.score >= 80 ? ui.green : insight.score >= 60 ? ui.yellow : ui.red;

  const moduleLabel =
    topModule === "Scanner" ? "IA Atlas Insights" : `${topModule} Insights`;

  return (
    <div
      style={{
        height: "100%",
        background:
          "linear-gradient(180deg, rgba(6,10,20,0.98), rgba(4,7,15,0.98))",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          borderBottom: `1px solid ${ui.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            color: "#e8f1ff",
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: 0.45,
          }}
        >
          {moduleLabel}
        </span>
        <ChevronDown size={14} color="#6c7da2" />
      </div>

      <div style={{ padding: 16, borderBottom: `1px solid ${ui.border}` }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: ui.yellow, fontSize: 12 }}>₿</span>
            <span style={{ color: "#d8e6ff", fontSize: 12, fontFamily: "monospace" }}>
              {insight.symbol}
            </span>
          </div>
          <span style={{ color: "#96a8cb", fontSize: 12, fontFamily: "monospace" }}>
            {insight.price.toLocaleString()}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              color: "#f3f8ff",
              fontSize: 19,
              fontWeight: 900,
              letterSpacing: 0.4,
            }}
          >
            {insight.symbol}
          </span>

          <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
            <span
              style={{
                color: scoreColor,
                fontSize: 20,
                fontWeight: 900,
              }}
            >
              {insight.score}
            </span>
            <TrendingUp size={14} color={scoreColor} />
          </div>
        </div>

        <div
          style={{
            marginTop: 10,
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 8,
            alignItems: "center",
          }}
        >
          <div
            style={{
              height: 6,
              borderRadius: 999,
              background: "rgba(255,255,255,0.08)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${insight.score}%`,
                height: "100%",
                borderRadius: 999,
                background:
                  "linear-gradient(90deg, rgba(49,233,255,0.95), rgba(36,245,155,0.95))",
              }}
            />
          </div>
          <div
            style={{
              padding: "5px 10px",
              borderRadius: 7,
              background: `${scoreColor}22`,
              color: scoreColor,
              fontSize: 11,
              fontWeight: 900,
            }}
          >
            {insight.signal}
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          {[
            ["Risco", insight.riskLevel, ui.yellow],
            ["Tipo", insight.riskType, ui.red],
            ["Invalidação", `$${insight.invalidation.toLocaleString()}`, "#eef5ff"],
            ["Fonte", "binance", "#d9e8ff"],
          ].map(([k, v, c]) => (
            <div
              key={k}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 0",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <span style={{ color: "#7f93b7", fontSize: 13 }}>{k}</span>
              <span style={{ color: c as string, fontSize: 12, fontWeight: 800 }}>
                {v}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "12px 16px 4px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <span
            style={{
              color: "#e8f1ff",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 0.45,
            }}
          >
            Estrutura
          </span>
          <ChevronRight size={12} color="#6c7da2" />
        </div>
        {insight.structure.map((item, i) => (
          <StructureRow key={i} item={item} />
        ))}
      </div>

      <div
        style={{
          margin: 12,
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.06)",
          background:
            "linear-gradient(180deg, rgba(9,15,29,0.98), rgba(7,12,24,0.98))",
          padding: 12,
        }}
      >
        <div
          style={{
            color: "#ecf4ff",
            fontSize: 12,
            fontWeight: 900,
            marginBottom: 10,
          }}
        >
          {topModule}
        </div>

        {[
          ["Estrutura", insight.structure[0]?.value || "Neutro", ui.green],
          ["Momentum", insight.structure[1]?.value || "Moderado", "#9fffbc"],
          ["Confluência", `${Math.max(2, Math.min(9, Math.round(insight.score / 11)))} / 9`, ui.green],
          ["Razão de Prata", insight.structure2[1]?.value || "Estável", ui.green],
          ["Ciclo", insight.score >= 75 ? "Acelerado" : "Normal", ui.cyan],
        ].map(([a, b, c]) => (
          <div
            key={a}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "6px 0",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
              fontSize: 12,
            }}
          >
            <span style={{ color: "#8397bd" }}>{a}</span>
            <span style={{ color: c as string, fontWeight: 800 }}>{b}</span>
          </div>
        ))}
      </div>

      <div style={{ padding: "0 16px 16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <span
            style={{
              color: "#e8f1ff",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 0.45,
            }}
          >
            Confluência
          </span>
          <ChevronRight size={12} color="#6c7da2" />
        </div>
        {insight.structure2.map((item, i) => (
          <StructureRow key={i} item={item} />
        ))}
      </div>
    </div>
  );
}

function MiniSparkline({ data, trend }: { data: number[]; trend: "up" | "down" | "neutral" }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 86;
  const h = 34;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");
  const color = trend === "up" ? ui.green : trend === "down" ? ui.red : "#8ea2c8";

  return (
    <svg width={w} height={h}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ScoreBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const visual = getScoreVisual(value);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          width: 62,
          height: 6,
          background: "rgba(255,255,255,0.08)",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: 999,
            background: visual.color,
          }}
        />
      </div>
      <span style={{ fontSize: 10, fontWeight: 900, color: visual.color }}>{visual.label}</span>
    </div>
  );
}

function ScannerPanelContinuous({
  assets,
  selectedSymbol,
  onSelectSymbol,
}: {
  assets: AssetScore[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return assets;
    const q = searchTerm.toLowerCase();
    return assets.filter((a) => a.symbol.toLowerCase().includes(q));
  }, [assets, searchTerm]);

  const sparklines = useMemo(
    () => filtered.map((a) => generateSparkline(24, 40 + Math.random() * 40, a.trend)),
    [filtered]
  );

  return (
    <div
      style={{
        height: "100%",
        borderRadius: 12,
        border: `1px solid ${ui.border}`,
        background:
          "linear-gradient(180deg, rgba(7,10,19,0.98), rgba(5,8,15,0.98))",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "10px 12px 8px",
          borderBottom: `1px solid ${ui.border}`,
          display: "grid",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 178px",
            gap: 10,
            alignItems: "center",
          }}
        >
          <span style={{ color: "#f1f7ff", fontSize: 13, fontWeight: 900 }}>
            MESTRE SCANNER
          </span>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              height: 32,
              padding: "0 10px",
              borderRadius: 9,
              border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <Search size={13} color="#8ca0c6" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar moeda..."
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#e9f3ff",
                fontSize: 11,
              }}
            />
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 0.92fr 0.98fr 0.92fr 1fr",
            gap: 10,
            color: "#6c7da2",
            fontSize: 11,
          }}
        >
          <span>Top Forge</span>
          <span>Sinal</span>
          <span>Preço</span>
          <span>RSI / MFI</span>
          <span>Mini Chart</span>
        </div>
      </div>

      <div data-atlas-scroll="cyan" style={{ flex: 1, overflowY: "auto" }}>
        {filtered.map((asset, i) => (
          <div
            key={asset.symbol}
            onClick={() => onSelectSymbol(asset.symbol)}
            style={{
              display: "grid",
              gridTemplateColumns: "1.1fr 0.92fr 0.98fr 0.92fr 1fr",
              gap: 10,
              padding: "11px 12px",
              borderBottom: "1px solid rgba(255,255,255,0.045)",
              alignItems: "center",
              cursor: "pointer",
              background:
                asset.symbol === selectedSymbol
                  ? "linear-gradient(90deg, rgba(247,201,72,0.10), rgba(45,226,255,0.06))"
                  : "transparent",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: asset.color,
                  display: "inline-block",
                }}
              />
              <span style={{ color: "#edf5ff", fontSize: 12, fontWeight: 800 }}>
                {asset.symbol}
              </span>
            </div>

            <ScoreBar value={asset.volumeScore} />

            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ color: "#eef5ff", fontSize: 12, fontFamily: "monospace" }}>
                ${asset.price.toLocaleString()}
              </span>
              <span
                style={{
                  color: asset.change >= 0 ? ui.green : ui.red,
                  fontSize: 12,
                  fontFamily: "monospace",
                  fontWeight: 800,
                }}
              >
                {asset.change >= 0 ? "+" : ""}
                {asset.change.toFixed(1)}%
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {asset.trend === "up" ? (
                <TrendingUp size={11} color={ui.green} />
              ) : asset.trend === "down" ? (
                <TrendingDown size={11} color={ui.red} />
              ) : (
                <Activity size={11} color="#a2b3d3" />
              )}
              <span style={{ color: "#8fd6ff", fontSize: 12, fontFamily: "monospace" }}>
                {asset.rsiMfi.toFixed(1)}
              </span>
            </div>

            <MiniSparkline data={sparklines[i]} trend={asset.trend} />
          </div>
        ))}
      </div>
    </div>
  );
}

function MasterScannerPanel({
  assets,
  selectedSymbol,
  onSelectSymbol,
}: {
  assets: AssetScore[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favoriteSymbols, setFavoriteSymbols] = useState<string[]>(["BTC", "ETH"]);
  const [sortKey, setSortKey] = useState<"price" | "change" | "dominance">("dominance");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  const dominanceMap = useMemo<Record<string, number>>(
    () => ({
      BTC: 52.43,
      ETH: 17.82,
      SOL: 4.96,
      BNB: 3.74,
      XRP: 2.96,
      DOGE: 1.98,
      AVAX: 1.31,
      ADA: 1.14,
      DOT: 0.74,
      ARB: 0.29,
    }),
    []
  );

  const toggleSort = (key: "price" | "change" | "dominance") => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "desc" ? "asc" : "desc"));
      return;
    }
    setSortKey(key);
    setSortDir("desc");
  };

  const toggleFavorite = (symbol: string) => {
    setFavoriteSymbols((prev) =>
      prev.includes(symbol) ? prev.filter((item) => item !== symbol) : [...prev, symbol]
    );
  };

  const orderedRows = useMemo(() => {
    const decorated = assets.map((asset) => ({
      ...asset,
      dominance: dominanceMap[asset.symbol] ?? Number((0.12 + asset.volumeScore / 1000).toFixed(2)),
      favorite: favoriteSymbols.includes(asset.symbol),
    }));

    const btc = decorated.find((item) => item.symbol === "BTC");
    let others = decorated.filter((item) => item.symbol !== "BTC");

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      others = others.filter((item) => item.symbol.toLowerCase().includes(q));
    }

    if (showFavoritesOnly) {
      others = others.filter((item) => item.favorite);
    }

    others = [...others].sort((a, b) => {
      const dir = sortDir === "desc" ? -1 : 1;
      const av = sortKey === "price" ? a.price : sortKey === "change" ? a.change : a.dominance;
      const bv = sortKey === "price" ? b.price : sortKey === "change" ? b.change : b.dominance;
      if (av < bv) return 1 * dir;
      if (av > bv) return -1 * dir;
      return a.symbol.localeCompare(b.symbol);
    });

    return btc ? [btc, ...others] : others;
  }, [assets, dominanceMap, favoriteSymbols, searchTerm, showFavoritesOnly, sortDir, sortKey]);

  const marketPositive =
    assets.filter((item) => item.change >= 0).length / Math.max(1, assets.length) >= 0.6;

  return (
    <div
      style={{
        height: "100%",
        borderRadius: 12,
        border: `1px solid ${ui.border}`,
        background: "linear-gradient(180deg, rgba(7,10,19,0.98), rgba(5,8,15,0.98))",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "10px 14px",
          borderBottom: `1px solid ${ui.border}`,
          display: "grid",
          gap: 10,
          flexShrink: 0,
          background:
            "radial-gradient(circle at top, rgba(0,216,255,0.08), transparent 38%), linear-gradient(180deg, rgba(10,16,28,0.98), rgba(7,10,19,0.98))",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 220px auto auto",
            gap: 10,
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ color: "#f2f7ff", fontSize: 18, fontWeight: 900, letterSpacing: 0.5 }}>
              MESTRE SCANNER
            </div>
            <div style={{ color: "#7f93b7", fontSize: 11 }}>
              Dominância BTC em evidência, BTC fixo e ordenação por preço ou variação.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              height: 36,
              padding: "0 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <Search size={14} color="#8ca0c6" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar ativo..."
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#e9f3ff",
                fontSize: 12,
              }}
            />
          </div>

          <button
            onClick={() => setShowFavoritesOnly(false)}
            style={{
              height: 34,
              padding: "0 12px",
              borderRadius: 10,
              border: !showFavoritesOnly
                ? "1px solid rgba(45,226,255,0.25)"
                : "1px solid rgba(255,255,255,0.06)",
              background: !showFavoritesOnly
                ? "linear-gradient(180deg, rgba(45,226,255,0.14), rgba(45,226,255,0.04))"
                : "rgba(255,255,255,0.03)",
              color: !showFavoritesOnly ? ui.cyan : "#dce8ff",
              fontSize: 11,
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Mercado
          </button>

          <button
            onClick={() => setShowFavoritesOnly(true)}
            style={{
              height: 34,
              padding: "0 12px",
              borderRadius: 10,
              border: showFavoritesOnly
                ? "1px solid rgba(247,201,72,0.3)"
                : "1px solid rgba(255,255,255,0.06)",
              background: showFavoritesOnly
                ? "linear-gradient(180deg, rgba(247,201,72,0.15), rgba(247,201,72,0.04))"
                : "rgba(255,255,255,0.03)",
              color: showFavoritesOnly ? ui.yellow : "#dce8ff",
              fontSize: 11,
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Favoritos
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 10,
          }}
        >
          <SmallStatCard
            title="Dominância BTC"
            value="52.43%"
            sub="BTC liderando o fluxo macro."
            color={ui.yellow}
            accent="rgba(247,201,72,0.12)"
          />
          <SmallStatCard
            title="BTC Fixo"
            value="$74.682"
            sub="Sempre visível no topo do scanner."
            color={ui.cyan}
            accent="rgba(45,226,255,0.1)"
          />
          <SmallStatCard
            title="Favoritos"
            value={`${favoriteSymbols.length}`}
            sub="Lista rápida com seus ativos-chave."
            color={ui.green}
            accent="rgba(39,245,157,0.1)"
          />
          <SmallStatCard
            title="Mercado"
            value={marketPositive ? "Bull Bias" : "Cautela"}
            sub={marketPositive ? "Mais ativos subindo do que caindo." : "Mercado misto e seletivo."}
            color={marketPositive ? ui.green : ui.red}
            accent={marketPositive ? "rgba(39,245,157,0.1)" : "rgba(255,107,134,0.08)"}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 0.9fr 0.95fr 0.9fr 0.8fr 1fr",
            gap: 10,
            color: "#6c7da2",
            fontSize: 11,
            alignItems: "center",
          }}
        >
          <span>Ativo</span>
          <span>Top Forge</span>
          <button
            onClick={() => toggleSort("price")}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              color: sortKey === "price" ? ui.cyan : "#6c7da2",
              fontSize: 11,
              fontWeight: 800,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            Preço {sortKey === "price" ? (sortDir === "desc" ? "↓" : "↑") : ""}
          </button>
          <button
            onClick={() => toggleSort("change")}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              color: sortKey === "change" ? ui.cyan : "#6c7da2",
              fontSize: 11,
              fontWeight: 800,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            % 24h {sortKey === "change" ? (sortDir === "desc" ? "↓" : "↑") : ""}
          </button>
          <button
            onClick={() => toggleSort("dominance")}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              color: sortKey === "dominance" ? ui.cyan : "#6c7da2",
              fontSize: 11,
              fontWeight: 800,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            Dom. BTC {sortKey === "dominance" ? (sortDir === "desc" ? "↓" : "↑") : ""}
          </button>
          <span>Mini Chart</span>
        </div>
      </div>

      <div
        data-atlas-scroll="cyan"
        style={{ flex: 1, overflowY: "auto", padding: "0 0 4px" }}
      >
        {orderedRows.map((asset, index) => {
          const spark = generateSparkline(22, 42 + index * 2, asset.trend);
          const isBtc = asset.symbol === "BTC";
          const isFav = favoriteSymbols.includes(asset.symbol);
          const scoreVisual = getScoreVisual(asset.aiScore);
          const dominance = dominanceMap[asset.symbol] ?? 0;

          return (
            <div
              key={asset.symbol}
              onClick={() => onSelectSymbol(asset.symbol)}
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 0.9fr 0.95fr 0.9fr 0.8fr 1fr",
                gap: 10,
                padding: "12px 14px",
                borderBottom: "1px solid rgba(255,255,255,0.045)",
                alignItems: "center",
                cursor: "pointer",
                background: isBtc
                  ? "linear-gradient(90deg, rgba(247,201,72,0.14), rgba(45,226,255,0.08))"
                  : asset.symbol === selectedSymbol
                  ? "linear-gradient(90deg, rgba(45,226,255,0.08), rgba(255,255,255,0.01))"
                  : "transparent",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(asset.symbol);
                  }}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.06)",
                    background: isFav ? "rgba(247,201,72,0.12)" : "rgba(255,255,255,0.03)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: isFav ? ui.yellow : "#7f93b7",
                  }}
                >
                  <Star size={13} fill={isFav ? ui.yellow : "transparent"} />
                </button>

                <div style={{ display: "grid", gap: 2 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: asset.color,
                        display: "inline-block",
                        boxShadow: `0 0 12px ${asset.color}`,
                      }}
                    />
                    <span style={{ color: "#edf5ff", fontSize: 13, fontWeight: 900 }}>
                      {asset.symbol}
                    </span>
                    {isBtc && (
                      <span
                        style={{
                          padding: "3px 7px",
                          borderRadius: 999,
                          background: "rgba(247,201,72,0.14)",
                          color: ui.yellow,
                          fontSize: 8,
                          fontWeight: 900,
                        }}
                      >
                        FIXO
                      </span>
                    )}
                  </div>
                  <span style={{ color: "#6c7da2", fontSize: 10 }}>
                    {isBtc ? "Referência principal do scanner." : "Ordenação dinâmica por mercado."}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ color: scoreVisual.color, fontSize: 12, fontWeight: 900 }}>
                  {asset.signal}
                </div>
                <ScoreBar value={asset.aiScore} />
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ color: "#eef5ff", fontSize: 12, fontFamily: "monospace" }}>
                  ${asset.price.toLocaleString()}
                </span>
                <span style={{ color: "#7f93b7", fontSize: 10 }}>
                  {asset.riskType}
                </span>
              </div>

              <div
                style={{
                  color: asset.change >= 0 ? ui.green : ui.red,
                  fontSize: 12,
                  fontFamily: "monospace",
                  fontWeight: 900,
                }}
              >
                {asset.change >= 0 ? "+" : ""}
                {asset.change.toFixed(2)}%
              </div>

              <div
                style={{
                  color: isBtc ? ui.yellow : "#dce8ff",
                  fontSize: 12,
                  fontFamily: "monospace",
                  fontWeight: 900,
                }}
              >
                {dominance.toFixed(2)}%
              </div>

              <MiniSparkline data={spark} trend={asset.trend} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SmallStatCard({
  title,
  value,
  sub,
  color,
  accent,
}: {
  title: string;
  value: string;
  sub?: string;
  color: string;
  accent?: string;
}) {
  return (
    <div
      style={{
        borderRadius: 14,
        border: "1px solid rgba(45,226,255,0.16)",
        background:
          "linear-gradient(180deg, rgba(6,13,24,0.98), rgba(4,8,16,0.98))",
        padding: "8px 12px 7px",
        height: 60,
        overflow: "hidden",
        boxShadow: accent ? `0 0 18px ${accent}` : "none",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          color: "#6f88af",
          fontSize: 9,
          fontWeight: 900,
          letterSpacing: 0.78,
          textTransform: "uppercase",
          marginBottom: 2,
          lineHeight: 1,
        }}
      >
        {title}
      </div>
      <div
        style={{
          color,
          fontSize: 14,
          fontWeight: 900,
          marginBottom: 1,
          textShadow: `0 0 10px ${color}33`,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            color: "#7f95bb",
            fontSize: 8,
            lineHeight: 1.1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            opacity: 0.9,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function EventRealtimePanel({ events }: { events: ScannerEvent[] }) {
  const rows = events.slice(0, 7).map((event, index) => {
    const amountBase = [67.0, 23.1, 234.7, 89.2, 67.8, 45.6, 125.4][index] ?? 42.8;
    const priceBase = [65508, 65395, 65385, 65420, 65380, 65400, 65450][index] ?? 65410;
    const exchangeBase = ["OKX", "Binance", "OKX", "Coinbase Pro", "Bybit", "Kraken", "Binance"][index] ?? "Exchange";
    const severityWidth = [58, 28, 72, 52, 88, 33, 78][index] ?? 50;
    const severityLabel = index % 3 === 0 ? "Baixo" : index % 3 === 1 ? "Alto" : "Médio";
    const rightColor =
      severityLabel === "Alto" ? ui.red : severityLabel === "Médio" ? ui.yellow : ui.green;
    const leftDot = event.tone === "positive" ? ui.green : event.tone === "warning" ? ui.yellow : "#ff5050";

    return {
      ...event,
      amountBase,
      priceBase,
      exchangeBase,
      severityWidth,
      severityLabel,
      rightColor,
      leftDot,
    };
  });

  return (
    <div
      style={{
        height: "100%",
        borderRadius: 12,
        border: `1px solid ${ui.border}`,
        background:
          "linear-gradient(180deg, rgba(6,10,18,0.98), rgba(4,7,14,0.98))",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: 42,
          padding: "0 12px",
          borderBottom: `1px solid ${ui.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#00e117",
              display: "inline-block",
            }}
          />
          <span style={{ color: "#edf5ff", fontSize: 13, fontWeight: 900 }}>
            Eventos em Tempo Real
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              padding: "4px 8px",
              borderRadius: 6,
              background: "rgba(0,225,23,0.08)",
              color: "#00e117",
              fontSize: 10,
              fontWeight: 900,
            }}
          >
            Live
          </span>
          <span style={{ color: "#7f93b7", fontSize: 11, fontWeight: 700 }}>
            {rows.length} eventos
          </span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 8, display: "grid", gap: 8 }}>
        {rows.map((event, i) => (
          <div
            key={`${event.time}-${i}`}
            style={{
              position: "relative",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.06)",
              background:
                "linear-gradient(180deg, rgba(9,14,24,0.98), rgba(7,11,20,0.98))",
              padding: "12px 12px 12px 28px",
              overflow: "hidden",
              minHeight: 62,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 10,
                top: 18,
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: event.leftDot,
              }}
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 0.8fr 0.54fr",
                gap: 12,
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ color: "#f0f7ff", fontSize: 12, fontWeight: 900, marginBottom: 3 }}>
                  {event.title}
                </div>
                <div style={{ color: "#7f93b7", fontSize: 11 }}>{event.exchangeBase}</div>
              </div>

              <div style={{ textAlign: "center" }}>
                <div style={{ color: "#eef5ff", fontSize: 12, fontWeight: 900, fontFamily: "monospace" }}>
                  {event.amountBase.toFixed(1)} BTC
                </div>
                <div style={{ color: "#7f93b7", fontSize: 11, fontFamily: "monospace" }}>
                  ${event.priceBase.toLocaleString()}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#dce8ff", fontSize: 12, fontFamily: "monospace", marginBottom: 4 }}>
                  {event.time}
                </div>
                <div style={{ color: event.rightColor, fontSize: 12, fontWeight: 900 }}>
                  {event.severityLabel}
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 10,
                height: 3,
                borderRadius: 999,
                background: "rgba(255,255,255,0.05)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${event.severityWidth}%`,
                  height: "100%",
                  borderRadius: 999,
                  background:
                    event.severityLabel === "Alto"
                      ? "linear-gradient(90deg, #29ff72, #ff3c57)"
                      : event.severityLabel === "Médio"
                      ? "linear-gradient(90deg, #ffb300, #ff4b57)"
                      : "linear-gradient(90deg, #29ff72, #24d6ff)",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeatmapBars() {
  const rows = [
    { label: "72.200", value: 88, color: "rgba(49,233,255,0.85)" },
    { label: "71.800", value: 72, color: "rgba(39,245,157,0.82)" },
    { label: "71.200", value: 58, color: "rgba(247,201,72,0.82)" },
    { label: "70.800", value: 96, color: "rgba(255,107,134,0.82)" },
    { label: "70.300", value: 66, color: "rgba(49,233,255,0.85)" },
    { label: "69.900", value: 47, color: "rgba(39,245,157,0.82)" },
  ];

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {rows.map((r) => (
        <div
          key={r.label}
          style={{
            display: "grid",
            gridTemplateColumns: "64px 1fr 46px",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ color: "#9ab0d4", fontSize: 12, fontFamily: "monospace" }}>
            {r.label}
          </span>

          <div
            style={{
              height: 12,
              borderRadius: 999,
              background: "rgba(255,255,255,0.06)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${r.value}%`,
                height: "100%",
                borderRadius: 999,
                background: r.color,
              }}
            />
          </div>

          <span style={{ color: "#e9f3ff", fontSize: 11, fontWeight: 800, textAlign: "right" }}>
            {r.value}%
          </span>
        </div>
      ))}
    </div>
  );
}

function LiquidityPanel() {
  const [tab, setTab] = useState("Liquidez");

  const renderMain = () => {
    if (tab === "Liquidez") {
      return (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ color: "#edf5ff", fontSize: 13, fontWeight: 900 }}>Mapa de Liquidez</div>
          <HeatmapBars />
        </div>
      );
    }

    if (tab === "Map") {
      const volumeBars = [
        { h: 72, c: "#149969" }, { h: 56, c: "#8f3452" }, { h: 86, c: "#149969" }, { h: 46, c: "#8f3452" },
        { h: 66, c: "#8f3452" }, { h: 94, c: "#149969" }, { h: 52, c: "#149969" }, { h: 126, c: "#149969" },
        { h: 104, c: "#8f3452" }, { h: 76, c: "#149969" }, { h: 112, c: "#149969" }, { h: 138, c: "#8f3452" },
      ];
      const xLabels = ["00:00","02:00","04:00","06:00","08:00","10:00","12:00","14:00","16:00","18:00","20:00","22:00"];
      return (
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ color: "#edf5ff", fontSize: 13, fontWeight: 900 }}>Mapa de Preço</div>
              <div style={{ display: "flex", gap: 6 }}>
                {["1M","5M","15M","1H","4H","1D"].map((tf) => (
                  <button
                    key={tf}
                    style={{
                      height: 22,
                      minWidth: 28,
                      borderRadius: 6,
                      border: tf === "1H" ? "1px solid rgba(45,226,255,0.55)" : "1px solid rgba(255,255,255,0.08)",
                      background: tf === "1H" ? "rgba(45,226,255,0.14)" : "rgba(255,255,255,0.02)",
                      color: tf === "1H" ? "#dffcff" : "#7f95bb",
                      fontSize: 9,
                      fontWeight: 900,
                      padding: "0 8px",
                    }}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ color: ui.mut, fontSize: 11 }}>VOL: 22.13</div>
          </div>

          <div style={{ height: 430, borderRadius: 14, border: "1px solid rgba(255,255,255,0.05)", background: "linear-gradient(180deg, rgba(6,13,24,0.96), rgba(5,9,18,0.98))", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(45,226,255,0.035), transparent 32%)" }} />
            <div style={{ position: "absolute", left: 14, top: 14, zIndex: 2 }}>
              <div style={{ color: "#eff7ff", fontSize: 19, fontWeight: 900, marginBottom: 4 }}>$71.500,00 <span style={{ color: "#27f59d", fontSize: 14, marginLeft: 8 }}>↗ +0.34%</span></div>
            </div>

            <div style={{ position: "absolute", left: 14, right: 14, top: 52, bottom: 118 }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 42, color: "#5e7398", fontSize: 10, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "16px 0 26px" }}>
                <span>$72k</span>
                <span>$71k</span>
                <span>$71k</span>
                <span>$70k</span>
                <span>$70k</span>
              </div>
              <div style={{ position: "absolute", left: 38, right: 0, top: 0, bottom: 0 }}>
                <svg viewBox="0 0 760 260" style={{ width: "100%", height: "100%" }}>
                  <defs>
                    <linearGradient id="atlasMapFillV2" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="rgba(45,226,255,0.20)" />
                      <stop offset="100%" stopColor="rgba(45,226,255,0.03)" />
                    </linearGradient>
                  </defs>
                  <path d="M12 190 C84 76, 152 34, 220 126 S332 272, 406 176 S516 20, 596 86 S676 56, 748 10" fill="none" stroke="#23dcff" strokeWidth="2.8" />
                  <path d="M12 190 C84 76, 152 34, 220 126 S332 272, 406 176 S516 20, 596 86 S676 56, 748 10 L748 260 L12 260 Z" fill="url(#atlasMapFillV2)" />
                </svg>
              </div>
            </div>

            <div style={{ position: "absolute", left: 14, right: 14, bottom: 16, height: 98 }}>
              <div style={{ position: "absolute", left: 42, right: 0, bottom: 0, display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 10, alignItems: "end", height: 92 }}>
                {volumeBars.map((bar, idx) => (
                  <div key={idx} style={{ display: "grid", gap: 6 }}>
                    <div style={{ height: bar.h, borderRadius: 1, background: bar.c, opacity: 0.95 }} />
                  </div>
                ))}
              </div>
              <div style={{ position: "absolute", left: 42, right: 0, bottom: -2, display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 10 }}>
                {xLabels.map((label) => (
                  <div key={label} style={{ color: "#56709b", fontSize: 9, textAlign: "center" }}>{label}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (tab === "Clusters") {
      return (
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ color: "#edf5ff", fontSize: 13, fontWeight: 900 }}>Mapa de Clusters</div>
            <div style={{ color: ui.mut, fontSize: 11 }}>Select Active · Select All</div>
          </div>
          <div style={{ height: 320, borderRadius: 14, border: "1px solid rgba(255,255,255,0.05)", background: "linear-gradient(180deg, rgba(6,13,24,0.96), rgba(5,9,18,0.98))", position: "relative" }}>
            {[
              ["BTC Core", 180, 165, 96, "#8b5cf6"],
              ["ETH Core", 360, 105, 70, "#2de2ff"],
              ["BTC Alta", 120, 285, 52, "#27f59d"],
              ["Whale Sell", 420, 260, 46, "#ff4d8d"],
              ["Retail", 300, 305, 34, "#ff944d"],
            ].map(([name, x, y, size, color]) => (
              <div key={String(name)} style={{ position: "absolute", left: Number(x), top: Number(y), width: Number(size), height: Number(size), borderRadius: 999, border: `1px solid ${color}`, boxShadow: `0 0 25px ${color}33`, display: "grid", placeItems: "center", color: color as string, fontSize: 12, fontWeight: 900, transform: "translate(-50%, -50%)" }}>
                <div style={{ textAlign: "center", lineHeight: 1.1 }}>{name}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (tab === "Eventos") {
      return (
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ color: "#edf5ff", fontSize: 13, fontWeight: 900 }}>Livro de Trade</div>
            <div style={{ color: ui.mut, fontSize: 11 }}>Tempo Real</div>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {[
              ["14:32", "LIQUIDAÇÃO", "$71.265", "Liquidação em massa shorts detectada", ui.green],
              ["14:28", "WHALE", "$70.980", "Ordem de compra institucional +$12.4M", ui.green],
              ["14:21", "CLUSTER", "$71.100", "BTC Core absorvendo pressão vendedora", ui.cyan],
              ["14:15", "PRESSÃO", "$70.750", "Pressão vendedora concentrada em $70.800", ui.red],
              ["14:08", "SUPORTE", "$71.420", "Suporte forte confirmado em $71.200", ui.green],
            ].map(([time, label, price, desc, color]) => (
              <div key={String(time)} style={{ display: "grid", gridTemplateColumns: "54px 1fr", gap: 10, alignItems: "center" }}>
                <div style={{ color: ui.mut, fontSize: 11 }}>{time}</div>
                <div style={{ borderRadius: 12, border: `1px solid ${color}55`, background: `${color}14`, padding: "12px 14px" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                    <span style={{ color: color as string, fontSize: 10, fontWeight: 900 }}>{label}</span>
                    <span style={{ color: color as string, fontSize: 14, fontWeight: 900 }}>{price}</span>
                  </div>
                  <div style={{ color: "#9bb0d2", fontSize: 13 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (tab === "Fluxo Institucional") {
      return (
        <div style={{ display: "grid", gap: 10, alignContent: "start", marginTop: -2 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ borderRadius: 14, border: `1px solid ${ui.green}55`, background: "rgba(10, 31, 24, 0.55)", padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ color: "#f1fbff", fontSize: 14, fontWeight: 900 }}>Cenário Alta</div>
                <div style={{ color: ui.green, fontSize: 20, fontWeight: 900 }}>93%</div>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden", marginBottom: 10 }}><div style={{ width: "93%", height: "100%", background: ui.green }} /></div>
              <div style={{ display: "grid", gap: 6 }}>
                {[['Alvo 1', '$91.672', ui.green], ['Alvo 2', '$99.732', ui.cyan], ['Stop Loss', '$83.887', ui.yellow]].map(([label, val, c]) => (
                  <div key={String(label)} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#8ea2c8' }}>{label}</span>
                    <span style={{ color: c as string, fontWeight: 900 }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ borderRadius: 14, border: `1px solid ${ui.red}55`, background: "rgba(31, 10, 20, 0.55)", padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ color: "#f1fbff", fontSize: 14, fontWeight: 900 }}>Cenário Baixa</div>
                <div style={{ color: ui.red, fontSize: 20, fontWeight: 900 }}>7%</div>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden", marginBottom: 10 }}><div style={{ width: "7%", height: "100%", background: ui.red }} /></div>
              <div style={{ display: "grid", gap: 6 }}>
                {[['Alvo 1', '$83.242', ui.red], ['Alvo 2', '$79.650', '#ff7e91'], ['Stop Loss', '$89.430', ui.yellow]].map(([label, val, c]) => (
                  <div key={String(label)} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#8ea2c8' }}>{label}</span>
                    <span style={{ color: c as string, fontWeight: 900 }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "0.74fr 0.92fr 0.74fr", gap: 10, alignItems: 'stretch' }}>
            <div style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)", background: "linear-gradient(180deg, rgba(9,15,29,0.98), rgba(7,12,24,0.98))", padding: 12 }}>
              <div style={{ color: "#edf5ff", fontSize: 14, fontWeight: 900, marginBottom: 8 }}>Sentimento do Mercado</div>
              <div style={{ height: 226, display: "grid", placeItems: "center" }}>
                <div style={{ width: 162, height: 162, borderRadius: '50%', border: '12px solid rgba(45,226,255,0.15)', borderTopColor: ui.yellow, borderRightColor: ui.green, borderBottomColor: '#ff008055', position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: 26, borderRadius: '50%', background: 'radial-gradient(circle, rgba(7,13,24,1), rgba(5,10,18,1))', display: 'grid', placeItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: ui.green, fontSize: 42, fontWeight: 900, lineHeight: 1 }}>59</div>
                      <div style={{ color: '#8ea2c8', fontSize: 13, marginTop: 6 }}>Ganância</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)", background: "linear-gradient(180deg, rgba(9,15,29,0.98), rgba(7,12,24,0.98))", padding: 12, display: "grid", gap: 8 }}>
              <div style={{ color: "#edf5ff", fontSize: 13, fontWeight: 900 }}>Fluxo Institucional</div>
              {[["🦈", "Tubarões", "-125M", false], ["🏛️", "Institucionais", "+582M", true], ["🐟", "Sardinhas", "+320M", true]].map(([icon, name, val, pos]) => (
                <div key={String(name)} style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", padding: 12, background: 'rgba(255,255,255,0.015)' }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ color: "#edf5ff", fontSize: 14, fontWeight: 900, display: 'flex', gap: 8, alignItems: 'center' }}><span>{icon}</span>{name}</span>
                    <span style={{ color: pos ? ui.green : ui.red, fontSize: 20, fontWeight: 900 }}>{val}</span>
                  </div>
                  <div style={{ height: 12, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden", display: "grid", gridTemplateColumns: "51fr 49fr", marginBottom: 6 }}>
                    <div style={{ background: ui.green }} />
                    <div style={{ background: '#ea4c89' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                    <span style={{ color: '#5ce4a2' }}>51% comprando</span>
                    <span style={{ color: '#ff7a97' }}>49% vendendo</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)", background: "linear-gradient(180deg, rgba(9,15,29,0.98), rgba(7,12,24,0.98))", padding: 12 }}>
              <div style={{ color: "#edf5ff", fontSize: 14, fontWeight: 900, marginBottom: 8 }}>Livro de Ofertas</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.8fr 0.9fr', color: '#6f88af', fontSize: 11, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: 6 }}>
                <span>Preço</span><span>Qtd</span><span>Total</span>
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {[
                  ['$87.026','0.666','$417K', ui.red], ['$85.869','6.538','$471K', ui.red], ['$87.886','4.878','$284K', ui.red], ['$87.627','6.447','$413K', ui.red], ['$87.318','10.774','$279K', ui.red],
                  ['$87.112','10.515','$365K', ui.green], ['$87.118','11.838','$194K', ui.green], ['$86.715','10.027','$280K', ui.green], ['$87.047','11.168','$70K', ui.green], ['$86.688','2.729','$321K', ui.green],
                ].map(([price, qty, total, c], idx) => (
                  <div key={String(price)+idx} style={{ display: 'grid', gridTemplateColumns: '1fr 0.8fr 0.9fr', fontSize: 13 }}>
                    <span style={{ color: c as string, fontWeight: 900 }}>{price}</span>
                    <span style={{ color: '#9bb0d2' }}>{qty}</span>
                    <span style={{ color: '#7086ad' }}>{total}</span>
                  </div>
                ))}
              </div>
            </div>"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";import {
  createChart,
  ColorType,
  CrosshairMode,
  IChartApi,
  Time,
} from "lightweight-charts";
import {
  Activity,
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

// ============================================================
// DRAWING TOOLS TYPES & CONSTANTS
// ============================================================

export type DrawTool =
  | "cursor" | "trendline" | "hline" | "vline" | "ray" | "extended"
  | "channel" | "pitchfork" | "fib" | "fibext" | "fibarc" | "fibfan"
  | "rect" | "triangle" | "ellipse" | "measure" | "text";

export type FibLevel = { pct: number; color: string; visible: boolean };

export type Drawing = {
  id: string;
  tool: DrawTool;
  color: string;

          </div>
        </div>
      );
    }

    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          ["Negativo", "Fed mantém taxa de juros em 5,25% - 5,50%", ui.red],
          ["Positivo", "BlackRock adiciona mais $2.1B em Bitcoin ETF", ui.green],
          ["Positivo", "Binance anuncia suporte para Ethereum Shanghai", ui.green],
          ["Neutro", "Regulação crypto na Europa: MiCA entra em vigor", ui.yellow],
        ].map(([tone, title, color]) => (
          <div key={String(title)} style={{ borderRadius: 14, border: `1px solid ${color}55`, background: "linear-gradient(180deg, rgba(9,15,29,0.98), rgba(7,12,24,0.98))", padding: 16, minHeight: 180 }}>
            <div style={{ color: color as string, fontSize: 11, fontWeight: 900, marginBottom: 10 }}>{tone}</div>
            <div style={{ color: "#f1fbff",
