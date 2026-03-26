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
ArrowDown,
ArrowRight,
ArrowUp,
ArrowDown,
MoveUpRight,
Plus,
Minus,
RotateCcw,
ScanSearch,
Star,
Waves,
BrainCircuit,
Layers3,
Sigma,
Droplets,
ChevronDown,
ChevronRight,
GitBranch,
SlidersHorizontal,
Grid2X2,
Circle,
Network,
Search,
Bell,
Settings,
TrendingUp,
TrendingDown,
} from "lucide-react";

// ============================================================
// TIPOS & CONSTANTES
// ============================================================
type DrawTool =
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
p1?: number;
p2?: number;
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

// UI CONSTANTS
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

// UTILITY FUNCTIONS
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

function generateCandles(count = 240, startPrice = 74500): any[] {
const now = Math.floor(Date.now() / 1000);
const candles: any[] = [];
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

function computeSMA(candles: any[], period: number) {
return candles.map((c, i) => {
if (i < period - 1) return { time: c.time, value: c.close };
let sum = 0;
for (let j = i - period + 1; j <= i; j++) sum += candles[j].close;
return { time: c.time, value: sum / period };
});
}

function computeEMA(candles: any[], period: number) {
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

// ============================================================
// DRAWING ENGINE
// ============================================================
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

// SVG RENDERER
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
// TOOLBAR
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
// TOP BAR
// ============================================================
const TIMEFRAMES: ("1m" | "5m" | "15m" | "30m" | "1H" | "4H" | "1D")[] = ["1m", "5m", "15m", "30m", "1H", "4H", "1D"];
const NAV_TABS = ["Gráfico", "Ordens", "Posições", "IA Atlas", "Fluxo"];
const TOP_MODULES = [
"Fluxo",
"Singularidade",
"IA Atlas",
"Scanner",
"Mestre Scanner",
"Estrutura",
"Euler",
"Liquidez",
];

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
timeframe: TimeFrame;
onTimeframeChange: (tf: TimeFrame) => void;
}) {
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
{/* LOGO COM ÍCONE */}
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
<svg width="22" height="22" viewBox="0 0 512 512" fill="none">
<circle cx="256" cy="256" r="240" stroke="#2de2ff" strokeWidth="2" opacity="0.8"/>
<path d="M256 60 L428 160 L428 352 L256 452 L84 352 L84 160 Z" stroke="#2de2ff" strokeWidth="2.5"/>
<circle cx="256" cy="256" r="12" fill="#ffffff" opacity="0.95"/>
</svg>
</div>
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

// ============================================================
// MODULE STRIP
// ============================================================
const ICONS: Record<(typeof TOP_MODULES)[number], React.ReactNode> = {
Fluxo: <Waves size={13} />,
"Singularidade": <BrainCircuit size={13} />,
"IA Atlas": <Activity size={13} />,
"Scanner": <ScanSearch size={13} />,
"Mestre Scanner": <Star size={13} />,
Estrutura: <Layers3 size={13} />,
Euler: <Sigma size={13} />,
Liquidez: <Droplets size={13} />,
};

function ModuleStrip({
activeModule,
onChange,
}: {
activeModule: typeof TOP_MODULES[number];
onChange: (m: typeof TOP_MODULES[number]) => void;
}) {
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
<button
key={module}
onClick={() => onChange(module)}
style={{
display: "inline-flex",
alignItems: "center",
gap: 8,
height: 34,
padding: "0 14px",
borderRadius: 12,
border: module === activeModule
? "1px solid rgba(247,201,72,0.34)"
: "1px solid rgba(255,255,255,0.06)",
background: module === activeModule
? "linear-gradient(180deg, rgba(247,201,72,0.16), rgba(247,201,72,0.04))"
: "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01))",
color: module === activeModule ? "#ffe39a" : "#d9e8ff",
fontSize: 12,
fontWeight: 800,
cursor: "pointer",
}}
>
{ICONS[module]}
{module}
</button>
))}
</div>
);
}

// ============================================================
// CHART PANEL (GRÁFICO + VOLUME)
// ============================================================
function ChartPanel({
drawingState,
}: {
drawingState: ReturnType<typeof useDrawings>;
}) {
const mainRef = useRef<HTMLDivElement>(null);
const volRef = useRef<HTMLDivElement>(null);
const overlayRef = useRef<SVGSVGElement>(null);
const [livePrice, setLivePrice] = useState<number>(74682);
const [priceChange, setPriceChange] = useState<number>(2.8);
const [svgSize, setSvgSize] = useState({ w: 1000, h: 600 });
const [draftStart, setDraftStart] = useState<{ x: number; y: number } | null>(null);

useEffect(() => {
if (!mainRef.current || !volRef.current) return;

const baseOpts = {
layout: {
background: { type: ColorType.Solid, color: "transparent" },
textColor: "#7085ad",
fontFamily: "JetBrains Mono, monospace",
fontSize: 10,
},
grid: {
vertLines: { color: "rgba(255,255,255,0.035)", style: 1 },
horzLines: { color: "rgba(255,255,255,0.035)", style: 1 },
},
crosshair: { mode: CrosshairMode.Normal },
rightPriceScale: { borderColor: "rgba(255,255,255,0.08)" },
timeScale: {
borderColor: "rgba(255,255,255,0.08)",
timeVisible: true,
secondsVisible: false,
},
handleScroll: true,
handleScale: true,
};

const chart = createChart(mainRef.current, {
...baseOpts,
width: mainRef.current.clientWidth,
height: mainRef.current.clientHeight,
});

const cs = chart.addCandlestickSeries({
upColor: "#37f4ad",
downColor: "#ff6c8d",
borderUpColor: "#37f4ad",
borderDownColor: "#ff6c8d",
wickUpColor: "#37f4ad",
wickDownColor: "#ff6c8d",
});

const candles = generateCandles(240, 74682);
cs.setData(
candles.map((c) => ({
time: c.time as Time,
open: c.open,
high: c.high,
low: c.low,
close: c.close,
}))
);

// Médias móveis
const ma20 = chart.addLineSeries({
color: "#d2b000",
lineWidth: 1,
priceLineVisible: false,
lastValueVisible: false,
});
ma20.setData(computeSMA(candles, 20).map((d) => ({ time: d.time as Time, value: d.value })));

const ma50 = chart.addLineSeries({
color: "#8b5cf6",
lineWidth: 1,
priceLineVisible: false,
lastValueVisible: false,
});
ma50.setData(computeSMA(candles, 50).map((d) => ({ time: d.time as Time, value: d.value })));

chart.timeScale().fitContent();

setLivePrice(candles[candles.length - 1].close);
setPriceChange(((candles[candles.length - 1].close - candles[candles.length - 2]?.close ?? candles[candles.length - 1].close) / (candles[candles.length - 2]?.close ?? candles[candles.length - 1].close)) * 100);

// Volume
const vc = createChart(volRef.current, {
...baseOpts,
width: volRef.current.clientWidth,
height: volRef.current.clientHeight,
rightPriceScale: { visible: false, borderColor: "rgba(255,255,255,0)" },
timeScale: { visible: false, borderColor: "rgba(255,255,255,0)" },
grid: {
vertLines: { color: "rgba(255,255,255,0)", style: 1 },
horzLines: { color: "rgba(255,255,255,0)", style: 1 },
},
});

const volSeries = vc.addHistogramSeries({ priceScaleId: "" });
volSeries.setData(
candles.map((c) => ({
time: c.time as Time,
value: c.volume,
color: c.close >= c.open ? "rgba(55,244,173,0.42)" : "rgba(255,108,141,0.42)",
}))
);

vc.timeScale().fitContent();

// Sync scroll
chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
if (range !== null) {
vc.timeScale().setVisibleLogicalRange(range);
}
});

const resize = () => {
if (mainRef.current) {
const w = mainRef.current.clientWidth;
const h = mainRef.current.clientHeight;
chart.applyOptions({ width: w, height: h });
setSvgSize({ w, h });
}
if (volRef.current) {
vc.applyOptions({ width: volRef.current.clientWidth, height: volRef.current.clientHeight });
}
};

window.addEventListener("resize", resize);
resize();

return () => {
window.removeEventListener("resize", resize);
chart.remove();
vc.remove();
};
}, []);

const isPositive = priceChange >= 0;

const getLocalPoint = (e: React.MouseEvent<SVGSVGElement>) => {
const rect = e.currentTarget.getBoundingClientRect();
return { x: e.clientX - rect.left, y: e.clientY - rect.top };
};

const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
const p = getLocalPoint(e);
const hit = drawingState.drawings.find(d => !d.hidden && hitTestDrawing(d, p.x, p.y));
if (hit && !hit.locked) {
drawingState.setSelectedId(hit.id);
if (e.button === 2) {
e.preventDefault();
} else if (e.detail === 2) {
}
return;
}
if (drawingState.activeTool !== "cursor") {
drawingState.setSelectedId(null);
setDraftStart(p);
} else {
drawingState.setSelectedId(null);
}
}, [drawingState]);

const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
if (draftStart && drawingState.activeTool !== "cursor") {
}
}, [draftStart, drawingState.activeTool]);

const handleMouseUp = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
if (draftStart && drawingState.activeTool !== "cursor") {
const p = getLocalPoint(e);
const newDraw = newDrawing(
drawingState.activeTool,
draftStart.x,
draftStart.y,
p.x,
p.y
);
drawingState.addDrawing(newDraw);
setDraftStart(null);
}
}, [draftStart, drawingState]);

const toolLabelMap: Record<DrawTool, string> = {
cursor: "Cursor",
trendline: "Tendência",
hline: "Horizontal",
vline: "Vertical",
ray: "Raio",
extended: "Estendida",
channel: "Canal",
pitchfork: "Pitchfork",
fib: "Fibonacci",
fibext: "Fib Ext",
fibarc: "Fib Arc",
fibfan: "Fib Fan",
rect: "Retângulo",
triangle: "Triângulo",
ellipse: "Elipse",
measure: "Medida",
text: "Texto",
};

return (
<div
style={{
display: "flex",
flexDirection: "column",
height: "100%",
width: "100%",
minWidth: 0,
background:
"linear-gradient(180deg, rgba(7,12,24,0.98), rgba(6,10,18,0.98))",
}}
>
{/* Header */}
<div
style={{
padding: "8px 10px",
borderBottom: `1px solid ${ui.border}`,
background:
"linear-gradient(180deg, rgba(12,19,36,0.94), rgba(8,13,25,0.94))",
}}
>
<div
style={{
display: "grid",
gridTemplateColumns: "1.4fr repeat(4, 0.7fr) auto",
gap: 8,
alignItems: "center",
}}
>
<div style={{ display: "flex", alignItems: "center", gap: 9 }}>
<div
style={{
width: 24,
height: 24,
borderRadius: 7,
background: "rgba(247,201,72,0.16)",
color: ui.yellow,
display: "flex",
alignItems: "center",
justifyContent: "center",
fontSize: 10,
fontWeight: 900,
}}
>
SC
</div>
<div>
<div style={{ color: "#eef6ff", fontSize: 14, fontWeight: 900 }}>BTC</div>
<div
style={{
color: "#7d91b6",
fontSize: 10,
fontWeight: 700,
}}
>
Scanner Atlas • Ferramenta: {toolLabelMap[drawingState.activeTool]} • TF: 15m
</div>
</div>
</div>
{[
["Preço", livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), "#4ef0cb"],
["Variação", `${isPositive ? "+" : ""}${priceChange.toFixed(2)}%`, isPositive ? ui.green : ui.red],
["Volume", formatCompact(candles?.[candles.length - 1]?.volume ?? 0), ui.cyan],
["Desenhos", String(drawingState.drawings.filter(d => !d.hidden).length), drawingState.drawings.length > 0 ? ui.yellow : ui.red],
].map(([title, value, color]) => (
<div
key={title}
style={{
borderRadius: 13,
border: "1px solid rgba(255,255,255,0.06)",
background:
"linear-gradient(180deg, rgba(8,15,31,0.98), rgba(7,12,24,0.96))",
minHeight: 58,
padding: "10px 13px",
}}
>
<div
style={{
color: "#7f93b7",
fontSize: 9,
fontWeight: 900,
letterSpacing: 0.8,
textTransform: "uppercase",
marginBottom: 6,
}}
>
{title}
</div>
<div style={{ color: color as string, fontSize: 12, fontWeight: 900 }}>{value}</div>
</div>
))}
<div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
<TopButton active>AUTO</TopButton>
<TopButton>Manual</TopButton>
<TopButton>Zoom -</TopButton>
<TopButton>Zoom +</TopButton>
<TopButton>Agora</TopButton>
<TopButton>Reset</TopButton>
</div>
</div>
</div>

{/* Opções */}
<DrawingOptionsBar
selectedDrawing={drawingState.drawings.find(d => d.id === drawingState.selectedId) ?? null}
activeTool={drawingState.activeTool}
drawings={drawingState.drawings}
onDelete={drawingState.deleteSelected}
onClear={drawingState.clearAll}
onToggleLock={drawingState.toggleLock}
onOpenSettings={() => {
const selected = drawingState.drawings.find(d => d.id === drawingState.selectedId);
if (selected) {}
}}
onSetColor={(c) => {
if (drawingState.selectedId) drawingState.updateDrawing(drawingState.selectedId, { color: c });
}}
/>

{/* Gráfico */}
<div style={{ position: "relative", flex: 1, minHeight: 0 }}>
<div ref={mainRef} style={{ position: "absolute", inset: 0 }} />
<svg
ref={overlayRef}
width="100%"
height="100%"
viewBox={`0 0 ${svgSize.w} ${svgSize.h}`}
preserveAspectRatio="none"
onMouseDown={handleMouseDown}
onMouseMove={handleMouseMove}
onMouseUp={handleMouseUp}
onContextMenu={(e) => e.preventDefault()}
style={{
position: "absolute",
inset: 0,
zIndex: 4,
pointerEvents: drawingState.activeTool !== "cursor" || drawingState.selectedId ? "auto" : "none",
cursor: drawingState.activeTool !== "cursor" ? "crosshair" : "default",
}}
>
{drawingState.drawings.filter(d => !d.hidden).map(d => (
<g key={d.id}>
{renderDrawingSVG(d, svgSize.w, svgSize.h, d.id === drawingState.selectedId)}
</g>
))}
</svg>
<div
ref={volRef}
style={{
position: "absolute",
left: 0,
right: 0,
bottom: 0,
height: 140,
pointerEvents: "none",
opacity: 0.95,
borderTop: "1px solid rgba(255,255,255,0.05)",
}}
/>
</div>
</div>
);
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
<option value="dashed">Tracejada ─ </option>
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
setDrawings,
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
// AI INSIGHT PANEL (VAZIO)
// ============================================================
function AIInsightPanel({ insight, topModule }: { insight: any; topModule: string }) {
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
{topModule} Insights
</span>
<ChevronDown size={14} color="#6c7da2" />
</div>
{/* VAZIO - pronto para conteúdo futuro */}
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
BTC
</span>
</div>
<span style={{ color: "#96a8cb", fontSize: 12, fontFamily: "monospace" }}>
74,682
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
BTC
</span>
<div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
<span
style={{
color: ui.green,
fontSize: 20,
fontWeight: 900,
}}
>
84 ↑
</span>
<TrendingUp size={14} color={ui.green} />
</div>
</div>
</div>
</div>
);
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function AtlasChartPro2() {
const [timeframe, setTimeframe] = useState<"1m" | "5m" | "15m" | "30m" | "1H" | "4H" | "1D">("15m");
const [mode] = useState<"auto" | "manual" | "space">("auto");
const [activeModule, setActiveModule] = useState<typeof TOP_MODULES[number]>("Scanner");
const [objects] = useState<any[]>([]);
const [selectedId] = useState<string | null>(null);
const [selectedSymbol, setSelectedSymbol] = useState<string>("BTC");
const [contextMenu, setContextMenu] = useState<{ x: number; y: number; drawing: Drawing } | null>(null);
const [settingsDrawing, setSettingsDrawing] = useState<Drawing | null>(null);
const drawingState = useDrawings();

useDrawingKeyboard(
drawingState.selectedId,
drawingState.activeTool,
drawingState.deleteSelected,
() => drawingState.setDrawings(prev => prev.slice(0, -1)),
drawingState.clearAll,
drawingState.setActiveTool,
() => { drawingState.setSelectedId(null); drawingState.setActiveTool("cursor"); }
);

const scannerAssets = useMemo<any[]>(
() => [
{ symbol: "BTC", volumeScore: 82.41, rsiMfi: 64.82, price: 74682, change: 2.8, trend: "up", color: "#27f59d", aiScore: 84, signal: "COMPRA", riskLevel: "Moderado", riskType: "Volatilidade", invalidation: 69180.6 },
{ symbol: "ETH", volumeScore: 73.35, rsiMfi: 58.1, price: 3932, change: 2.58, trend: "up", color: "#31c8ff", aiScore: 79, signal: "COMPRA", riskLevel: "Moderado", riskType: "Pullback", invalidation: 3560 },
{ symbol: "SOL", volumeScore: 61.18, rsiMfi: 43.7, price: 174.8, change: 3.06, trend: "up", color: "#ffb14a", aiScore: 76, signal: "COMPRA", riskLevel: "Moderado", riskType: "Aceleração", invalidation: 166 },
{ symbol: "BNB", volumeScore: 69.08, rsiMfi: 52.2, price: 610.75, change: 0.43, trend: "neutral", color: "#f7c948", aiScore: 61, signal: "NEUTRO", riskLevel: "Moderado", riskType: "Consolidação", invalidation: 584 },
],
[]
);

const scannerEvents = useMemo<any[]>(
() => [
{ time: "23:31:25", title: "Compra Baleia", tag: "Fluxo • Scanner", tone: "positive" },
{ time: "14:30:23", title: "Venda Retail", tag: "Confluência", tone: "neutral" },
{ time: "14:29:47", title: "Compra Baleia", tag: "RSI / MFI", tone: "positive" },
{ time: "14:29:47", title: "Venda Institucional", tag: "Risco Assimétrico", tone: "warning" },
{ time: "14:31:08", title: "Liquidação Long", tag: "Eventos", tone: "warning" },
],
[]
);

const activeAsset = useMemo(
() => scannerAssets.find((a) => a.symbol === selectedSymbol) ?? scannerAssets[0],
[scannerAssets, selectedSymbol]
);

const candles = useMemo(() => generateCandles(240, symbolBasePrice(activeAsset.symbol)), [activeAsset.symbol]);
const indicators = useMemo(() => [], [candles]); // Sem RSI
const selectedObject = useMemo(
() => objects.find((o) => o.id === selectedId) ?? null,
[objects, selectedId]
);

const insight = useMemo(() => ({ symbol: activeAsset.symbol, price: activeAsset.price, score: activeAsset.aiScore }), [activeAsset]);

return (
<div
style={{
width: "100%",
height: "100vh",
display: "flex",
flexDirection: "column",
overflow: "hidden",
background: ui.bg,
color: ui.text,
fontFamily: "Inter, Arial, sans-serif",
}}
>
<style>{`
[data-atlas-scroll="cyan"] {
scrollbar-width: thin;
scrollbar-color: rgba(45,226,255,0.55) rgba(255,255,255,0.04);
}
[data-atlas-scroll="cyan"]::-webkit-scrollbar {
width: 8px;
height: 8px;
}
[data-atlas-scroll="cyan"]::-webkit-scrollbar-track {
background: rgba(255,255,255,0.03);
border-radius: 999px;
}
[data-atlas-scroll="cyan"]::-webkit-scrollbar-thumb {
background: linear-gradient(180deg, rgba(45,226,255,0.72), rgba(0,216,255,0.38));
border-radius: 999px;
border: 1px solid rgba(45,226,255,0.18);
}
`}</style>

<TopBar
symbol={activeAsset.symbol}
price={activeAsset.price}
change={activeAsset.change}
timeframe={timeframe}
onTimeframeChange={setTimeframe}
/>
<ModuleStrip activeModule={activeModule} onChange={setActiveModule} />
<div style={{ display: "flex", minHeight: 0, flex: 1 }}>
<DrawingToolbar activeTool={drawingState.activeTool} onChangeTool={drawingState.setActiveTool} />
<div style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
<div
style={{
display: "grid",
gridTemplateColumns: "minmax(0, 1fr) 320px",
height: "100%",
minHeight: 0,
}}
>
<div style={{ minWidth: 0, minHeight: 0 }}>
<ChartPanel drawingState={drawingState} />
</div>
<div
style={{
minWidth: 0,
minHeight: 0,
borderLeft: `1px solid ${ui.border}`,
background:
"linear-gradient(180deg, rgba(7,11,20,0.98), rgba(4,7,14,0.98))",
display: "grid",
gridTemplateRows:
activeModule === "Scanner"
? "1fr"
: "1fr auto",
}}
>
<AIInsightPanel insight={insight} topModule={activeModule} />
{activeModule !== "Scanner" && (
<div
style={{
borderTop: `1px solid ${ui.border}`,
padding: 10,
background: "rgba(255,255,255,0.015)",
}}
>
{/* Scanner Panel Contínuo (VAZIO) */}
</div>
)}
</div>
</div>
</div>
</div>
</div>
{contextMenu && (
<DrawingContextMenu
x={contextMenu.x}
y={contextMenu.y}
drawing={contextMenu.drawing}
onSettings={() => setSettingsDrawing(contextMenu.drawing)}
onDelete={() => {
drawingState.setDrawings(prev => prev.filter(d => d.id !== contextMenu.drawing.id));
if (drawingState.selectedId === contextMenu.drawing.id) drawingState.setSelectedId(null);
setContextMenu(null);
}}
onToggleLock={() => {
drawingState.updateDrawing(contextMenu.drawing.id, { locked: !contextMenu.drawing.locked });
setContextMenu(null);
}}
onToggleHide={() => {
drawingState.updateDrawing(contextMenu.drawing.id, { hidden: !contextMenu.drawing.hidden });
setContextMenu(null);
}}
onClose={() => setContextMenu(null)}
/>
)}
{settingsDrawing && (
<DrawingSettingsModal
drawing={settingsDrawing}
onApply={(updated) => {
drawingState.applySettings(updated);
setSettingsDrawing(null);
}}
onClose={() => setSettingsDrawing(null)}
/>
)}
</div>
);
}
