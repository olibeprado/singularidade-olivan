"use client";
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
createChart,
ColorType,
CrosshairMode,
IChartApi,
Time,
} from "lightweight-charts";
// Note: Ensure lucide-react is installed via `npm install lucide-react`

// IMPORTS (Simulated for context - replace with actual imports in your project)
// import { Activity, Waves, BrainCircuit, ScanSearch, Star, Layers3, Sigma, Droplets, ChevronDown, ChevronRight, TrendingUp, Search, Bell, Settings, RotateCcw, Plus, Minus } from "lucide-react";

// ============================================================
// CORE CONSTANTS & TYPES
// ============================================================
const COLORS = {
  bg: "#060913",
  border: "#172133",
  text: "#ebf3ff",
  mut: "#7f93b7",
  cyan: "#2de2ff",
  green: "#27f59d",
  yellow: "#f7c948",
  red: "#ff6b86",
};

type DrawTool = 
| "cursor" | "trendline" | "hline" | "vline" | "ray" | "extended"
| "channel" | "pitchfork" | "fib" | "fibext" | "fibarc" | "fibfan"
| "rect" | "triangle" | "ellipse" | "measure" | "text";

interface Drawing {
id: string;
tool: DrawTool;
color: string;
lineWidth: number;
lineStyle: "solid" | "dashed" | "dotted";
fillOpacity: number;
locked: boolean;
hidden: boolean;
note: string;
x1: number; y1: number;
x2: number; y2: number;
}

type Timeframe = "1m" | "5m" | "15m" | "30m" | "1H" | "4H" | "1D";

// MOCK DATA GENERATION
const generateCandles = (count: number, startPrice: number) => {
const candles = [];
let price = startPrice;
const now = Math.floor(Date.now() / 1000);
for (let i = count; i > 0; i--) {
const open = price;
const change = (Math.random() - 0.5) * 200; // Random walk volatility
const close = open + change;
const high = Math.max(open, close) + Math.random() * 50;
const low = Math.min(open, close) - Math.random() * 50;
candles.push({
time: now - i * 60,
open, high, low, close,
});
price = close;
}
return candles;
};

// ============================================================
// SUB-COMPONENTS
// ============================================================

// 1. TOP BAR
const TopBar = () => (
<div style={{ height: 64, borderBottom: `1px solid ${COLORS.border}`, padding: "0 16px", display: "flex", alignItems: "center", gap: 12, background: COLORS.bg, boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
{/* Logo */}
<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
<div style={{ width: 38, height: 38, borderRadius: 11, background: "linear-gradient(135deg, #2de2ff33, #8b5cf633)", display: "flex", alignItems: "center", justifyContent: "center" }}>
<span style={{ color: "#fff", fontSize: 10, fontWeight: 900 }}>SV</span>
</div>
<div>
<span style={{ color: COLORS.text, fontSize: 17, fontWeight: 900, letterSpacing: 0.5 }}>SINGULARIDADE</span>
<span style={{ color: COLORS.cyan, fontSize: 9, fontWeight: 800, marginLeft: 4 }}>OBP</span>
</div>
</div>

<div style={{ width: 1, height: 30, background: COLORS.border }} />

{/* Asset Selector */}
<button style={{ 
display: "flex", alignItems: "center", gap: 6, 
height: 36, padding: "0 12px", borderRadius: 10, 
border: `1px solid ${COLORS.border}`,
background: "rgba(255,255,255,0.03)", 
color: COLORS.text, fontSize: 13, fontWeight: 800, cursor: "pointer" 
}}>
<span style={{ color: COLORS.yellow }}>₿</span> BTC
<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={COLORS.mut}><path d="M2 4L6 8L10 4" strokeWidth="2"/></svg>
</button>

{/* Price Info */}
<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
<span style={{ color: COLORS.green, fontSize: 12, fontWeight: 800 }}>+2.80%</span>
</div>

<div style={{ flex: 1 }} />

{/* Timeframes */}
<div style={{ display: "flex", gap: 4 }}>
{["1m", "5m", "15m", "30m", "1H", "4H", "1D"].map(tf => (
<button key={tf} style={{
height: 29, padding: "0 12px", borderRadius: 9,
border: tf === "15m" ? `1px solid ${COLORS.yellow}` : `1px solid ${COLORS.border}`,
background: tf === "15m" ? `${COLORS.yellow}11` : "transparent",
color: tf === "15m" ? COLORS.yellow : COLORS.text,
fontSize: 11, fontWeight: 800, cursor: "pointer"
}}>
{tf}
</button>
))}
</div>

<div style={{ width: 1, height: 30, background: COLORS.border }} />

{/* Right Icons */}
<div style={{ display: "flex", alignItems: "center", gap: 6 }}>
{[Search, Bell, Settings].map((Icon, idx) => <Icon key={idx} size={16} color={COLORS.mut} style={{ cursor: "pointer" }} />)}
</div>
</div>
);

// 2. MODULE STRIP
const ModuleStrip = ({ activeModule, onChange }: { activeModule: string; onChange: (m: string) => void }) => {
const modules = ["Fluxo", "Singularidade", "IA Atlas", "Scanner", "Mestre Scanner", "Estrutura", "Euler", "Liquidez"];
return (
<div style={{ height: 42, borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 8, padding: "0 16px", background: COLORS.bg }}>
{modules.map(mod => (
<button 
key={mod} 
onClick={() => onChange(mod)}
style={{
height: 30,
padding: "0 12px",
borderRadius: 999,
border: mod === activeModule ? `1px solid ${COLORS.cyan}` : `1px solid ${COLORS.border}`,
background: mod === activeModule ? `${COLORS.cyan}22` : "transparent",
color: mod === activeModule ? COLORS.cyan : COLORS.text,
fontSize: 11,
fontWeight: 800,
cursor: "pointer",
transition: "all 0.2s"
}}
>
{mod}
</button>
))}
</div>
);
};

// 3. LEFT TOOLBAR
const DrawingToolbar = ({ activeTool, onChange }: { activeTool: DrawTool; onChange: (t: DrawTool) => void }) => {
const groups = [
{ title: "CURSOR", items: [{ key: "cursor", icon: "↖" }] },
{ title: "LINHAS", items: [{ key: "trendline", icon: "╱" }, { key: "hline", icon: "─" }, { key: "vline", icon: "│" }] },
{ title: "FIBO", items: [{ key: "fib", icon: "FIB" }] },
];

return (
<div style={{ width: 48, borderRight: `1px solid ${COLORS.border}`, background: COLORS.bg, display: "flex", flexDirection: "column", padding: 8, gap: 6 }}>
{groups.map((group, gi) => (
<div key={gi}>
<div style={{ color: COLORS.mut, fontSize: 6, fontWeight: 900, marginBottom: 4, textAlign: "center", letterSpacing: 1 }}>{group.title}</div>
{group.items.map(item => (
<button 
key={item.key}
onClick={() => onChange(item.key)}
style={{
width: 36, height: 34,
borderRadius: 6,
border: activeTool === item.key ? `1px solid ${COLORS.cyan}` : `1px solid transparent`,
background: activeTool === item.key ? `${COLORS.cyan}11` : "transparent",
color: activeTool === item.key ? COLORS.cyan : COLORS.text,
fontSize: 13, fontWeight: 900, fontFamily: "monospace", cursor: "pointer",
display: "flex", alignItems: "center", justifyContent: "center",
}}
title={TOOL_LABELS[item.key]}
>
{item.icon}
</button>
))}
</div>
))}
</div>
);
};

// 4. MAIN CHART PANEL (Structure Only)
const ChartPanel = () => {
return (
<div style={{ display: "flex", flexDirection: "column", height: "100%", background: COLORS.bg }}>
{/* Header Info */}
<div style={{ 
padding: "10px 16px", borderBottom: `1px solid ${COLORS.border}`, 
display: "grid", gridTemplateColumns: "repeat(4, minmax(100px, 1fr)) auto", gap: 8, 
alignItems: "center", 
}}>
<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
<div style={{ width: 20, height: 20, background: `${COLORS.yellow}22`, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.yellow, fontSize: 8, fontWeight: 900 }}>SC</div>
<div>
<div style={{ color: COLORS.text, fontSize: 13, fontWeight: 900 }}>BTC</div>
<div style={{ color: COLORS.mut, fontSize: 9 }}>Scanner • 15m</div>
</div>
</div>

{["Preço", "Variação", "Volume", "Desenhos"].map(label => (
<div key={label} style={{
padding: "8px 12px", borderRadius: 10,
border: `1px solid ${COLORS.border}`,
background: COLORS.bg,
display: "flex", flexDirection: "column",
gap: 4
}}>
<span style={{ color: COLORS.mut, fontSize: 8, fontWeight: 900, letterSpacing: 0.5 }}>{label}</span>
<span style={{ color: COLORS.text, fontSize: 11, fontWeight: 900, fontFamily: "monospace" }}>--</span>
</div>
))}

<div style={{ display: "flex", gap: 4 }}>
{["Auto", "Manual", "Seguir + Espaço", "Zoom−", "Zoom+", "Reset"].map(btn => (
<button key={btn} style={{
height: 24, padding: "0 10px", borderRadius: 5,
border: btn === "Auto" ? `1px solid ${COLORS.yellow}` : `1px solid ${COLORS.border}`,
background: btn === "Auto" ? `${COLORS.yellow}11` : "transparent",
color: btn === "Auto" ? COLORS.yellow : COLORS.text,
fontSize: 10, fontWeight: 800, cursor: "pointer",
}}>{btn}</button>
))}
</div>
</div>

{/* Drawing Controls */}
<div style={{ height: 28, borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 6, padding: "0 16px", background: `${COLORS.bg}cc` }}>
<button style={{ background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "2px 8px", color: COLORS.mut, fontSize: 10, fontWeight: 700, cursor: "pointer" }}>🔒 Travar</button>
<button style={{ background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "2px 8px", color: COLORS.mut, fontSize: 10, fontWeight: 700, cursor: "pointer" }}>⚙ Config.</button>
<button style={{ background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "2px 8px", color: COLORS.red, fontSize: 10, fontWeight: 700, cursor: "pointer" }}>✕ Apagar</button>
<button style={{ background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "2px 8px", color: COLORS.mut, fontSize: 10, fontWeight: 700, cursor: "pointer" }}>🗑 Limpar</button>
<div style={{ width: 1, height: 14, background: COLORS.border }} />
<span style={{ color: COLORS.mut, fontSize: 9 }}>Cor:</span>
{[COLORS.yellow, COLORS.cyan, COLORS.green, COLORS.red, COLORS.red].map(c => (
<div key={c} style={{ width: 12, height: 12, borderRadius: 3, background: c, border: `1px solid ${COLORS.border}` }} />
))}
</div>

{/* Chart Container */}
<div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
<div ref={(el) => { if(el) el.style.display='block'; }} style={{ width: "100%", height: "100%" }}>
  {/* Canvas Placeholder - Replace with actual Lightweight Charts instance */}
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: COLORS.mut, backgroundColor: COLORS.bg }}>
    [GRAFICO LIGHTWEIGHT CHART RENDER AQUI]
  </div>
</div>
</div>

{/* Footer/Rsi Panel Placeholder */}
<div style={{ height: 80, borderTop: `1px solid ${COLORS.border}`, background: COLORS.bg, display: "flex", alignItems: "center", paddingLeft: 16, color: COLORS.mut, fontSize: 10, fontWeight: 700 }}>RSI / MFI --</div>
</div>
);
};

// 5. RIGHT INSIGHT PANEL
const InsightPanel = () => (
<div style={{ width: 280, borderLeft: `1px solid ${COLORS.border}`, background: COLORS.bg, display: "flex", flexDirection: "column", padding: 12 }}>
<h3 style={{ fontSize: 12, fontWeight: 900, color: COLORS.text, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Insights</h3>
<div style={{ marginBottom: 24 }}>
<span style={{ color: COLORS.green, fontSize: 32, fontWeight: 900, lineHeight: 1 }}>+2.8%</span>
<div style={{ color: COLORS.cyan, fontSize: 10, fontWeight: 800, marginTop: 4 }}>Compra Forte</div>
</div>

<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
{[{ label: "Risco", value: "Moderado", color: COLORS.yellow }, { label: "Tipo", value: "Volatilidade", color: COLORS.red }, { label: "Invalidação", value: "$69k", color: COLORS.text }].map(item => (
<div key={item.label} style={{ borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 8, display: "flex", justifyContent: "space-between" }}>
<span style={{ color: COLORS.mut, fontSize: 10 }}>{item.label}</span>
<span style={{ color: item.color, fontSize: 10, fontWeight: 800 }}>{item.value}</span>
</div>
))}

<div style={{ marginTop: 8 }}>
<div style={{ color: COLORS.text, fontSize: 11, fontWeight: 800, marginBottom: 8 }}>Estrutura</div>
{[{ l: "Fluxo", v: "Positivo" }, { l: "Momentum", v: "Forte" }, { l: "Confluência", v: "8/9" }].map(row => (
<div key={row.l} style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: COLORS.mut, marginBottom: 6 }}>
<span>{row.l}</span>
<span style={{ color: COLORS.green }}>{row.v}</span>
</div>
))}
</div>
</div>
</div>
);

// ============================================================
// UTILITY HELPERS
// ============================================================
const TOOL_LABELS: Record<DrawTool, string> = {
cursor: "Cursor (V)", trendline: "Tendência (T)", hline: "Horizontal (H)", vline: "Vertical (K)", ray: "Raio (R)", extended: "Estendida", channel: "Canal", pitchfork: "Pitchfork", fib: "Fibonacci (F)", fibext: "Extensão", fibarc: "Arcos", fibfan: "Fan", rect: "Retângulo", triangle: "Triângulo", ellipse: "Elipse", measure: "Medir", text: "Texto",
};

// ============================================================
// MAIN APP COMPONENT
// ============================================================
export default function SingularidadeApp() {
const [activeModule, setActiveModule] = useState("Scanner");
const [activeTool, setActiveTool] = useState<DrawTool>("cursor");

// Generate Data once on mount
const candles = useMemo(() => generateCandles(240, 74000), []);

// NOTE: Actual lightweight-chart initialization would go here inside a useEffect hook for ChartPanel
// For this "shell" version, we just render the UI structure.

return (
<div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column", background: COLORS.bg, fontFamily: "'Inter', sans-serif", color: COLORS.text }}>
<TopBar />
<ModuleStrip activeModule={activeModule} onChange={setActiveModule} />
<div style={{ display: "flex", flex: 1, minHeight: 0 }}>
<DrawingToolbar activeTool={activeTool} onChange={setActiveTool} />
<div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
<ChartPanel />
</div>
<InsightPanel />
</div>
</div>
);
}
