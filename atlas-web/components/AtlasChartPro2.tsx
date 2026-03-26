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
  Layers3,
  RotateCcw,
  ScanSearch,
  Search,
  Settings,
  Sigma,
  Star,
  TrendingDown,
  TrendingUp,
  Waves,
} from "lucide-react";

// ============================================
// TIPOS E CONSTANTES
// ============================================
type DrawTool =
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
  | "text";

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
  fib: "#ffd54f",
  rect: "#00d4ff",
  triangle: "#00e676",
  ellipse: "#ff9100",
  measure: "#00e676",
  text: "#ffffff",
};

const ui = {
  bg: "#060913",
  border: "#172133",
  cyan: "#2de2ff",
  green: "#27f59d",
  yellow: "#f7c948",
  red: "#ff6b86",
};

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================
function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
function formatCompact(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1e3).toFixed(2)}K`;
  return n.toFixed(2);
}
function symbolBasePrice(symbol: string) {
  const map: Record<string, number> = { BTC: 74682, ETH: 3932 };
  return map[symbol] ?? 74682;
}
function generateCandles(count = 240, startPrice = 74682): any[] {
  const candles = [];
  let price = startPrice;
  const now = Math.floor(Date.now() / 1000);
  for (let i = count; i > 0; i--) {
    const open = price;
    const change = (Math.random() - 0.49) * price * 0.006;
    const close = Math.max(0.01, open + change);
    const high = Math.max(open, close) + Math.random() * price * 0.002;
    const low = Math.min(open, close) - Math.random() * price * 0.002;
    const volume = Math.random() * 1000 + 100;
    candles.push({ time: now - i * 300, open, high, low, close, volume });
    price = close;
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
  const ema = [];
  let prev = candles[0]?.close ?? 0;
  for (let i = 0; i < candles.length; i++) {
    const value = i === 0 ? candles[i].close : candles[i].close * k + prev * (1 - k);
    ema.push({ time: candles[i].time, value });
    prev = value;
  }
  return ema;
}

// ============================================
// RENDERIZAÇÃO DE DESENHOS (SVG)
// ============================================
function renderDrawingSVG(d: Drawing, w: number, h: number, selected: boolean) {
  const col = d.color;
  const lw = d.lineWidth || 2;
  const dash = d.lineStyle === "dashed" ? "5,3" : "";
  const handles = selected ? (
    <>
      <circle cx={d.x1} cy={d.y1} r={5} fill="#fff" stroke={col} strokeWidth={1.5} />
      <circle cx={d.x2} cy={d.y2} r={5} fill="#fff" stroke={col} strokeWidth={1.5} />
    </>
  ) : null;

  switch (d.tool) {
    case "hline":
      return (
        <g>
          <line x1={0} y1={d.y1} x2={w} y2={d.y1} stroke={col} strokeWidth={lw} strokeDasharray={dash} />
          {handles}
        </g>
      );
    case "vline":
      return (
        <g>
          <line x1={d.x1} y1={0} x2={d.x1} y2={h} stroke={col} strokeWidth={lw} strokeDasharray={dash} />
          {handles}
        </g>
      );
    case "trendline":
      return (
        <g>
          <line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} stroke={col} strokeWidth={lw} strokeDasharray={dash} />
          {handles}
        </g>
      );
    case "rect":
      return (
        <g>
          <rect
            x={Math.min(d.x1, d.x2)}
            y={Math.min(d.y1, d.y2)}
            width={Math.abs(d.x2 - d.x1)}
            height={Math.abs(d.y2 - d.y1)}
            fill={col}
            fillOpacity={0.1}
            stroke={col}
            strokeWidth={lw}
          />
          {handles}
        </g>
      );
    case "fib":
      return (
        <g>
          {DEFAULT_FIB_LEVELS.filter(lvl => lvl.visible).map((lvl, i) => (
            <line key={i} x1={0} y1={d.y1 + (d.y2 - d.y1) * lvl.pct} x2={w} y2={d.y1 + (d.y2 - d.y1) * lvl.pct}
              stroke={lvl.color} strokeWidth={1} opacity={0.6} />
          ))}
          <line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} stroke={col} strokeWidth={lw} />
          {handles}
        </g>
      );
    default:
      return <line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} stroke={col} strokeWidth={lw} />;
  }
}

// ============================================
// COMPONENTES DE UI
// ============================================
function TopButton({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button
      style={{
        height: 29, padding: "0 10px", borderRadius: 9,
        border: active ? `1px solid rgba(247,201,72,0.34)` : "1px solid rgba(255,255,255,0.06)",
        background: active ? "rgba(247,201,72,0.16)" : "transparent",
        color: active ? "#f7c948" : "#dce8ff",
        fontSize: 11, fontWeight: 800, cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function DrawingToolbar({ activeTool, onChangeTool }: { activeTool: DrawTool; onChangeTool: (t: DrawTool) => void }) {
  const tools: { key: DrawTool; icon: string }[] = [
    { key: "cursor", icon: "↖" }, { key: "trendline", icon: "╱" }, { key: "hline", icon: "─" },
    { key: "vline", icon: "│" }, { key: "rect", icon: "▭" }, { key: "fib", icon: "FIB" },
  ];
  return (
    <div style={{ width: 52, borderRight: "1px solid #172133", background: "#0a0f1d", display: "flex", flexDirection: "column", padding: 8, gap: 4 }}>
      {tools.map(tool => (
        <button key={tool.key} onClick={() => onChangeTool(tool.key)}
          style={{
            width: 38, height: 36, borderRadius: 7, cursor: "pointer",
            border: activeTool === tool.key ? "1px solid rgba(45,226,255,0.3)" : "1px solid transparent",
            background: activeTool === tool.key ? "rgba(45,226,255,0.15)" : "transparent",
            color: activeTool === tool.key ? "#2de2ff" : "#90a4c8",
            fontSize: 13, fontWeight: 900, fontFamily: "monospace",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >{tool.icon}</button>
      ))}
    </div>
  );
}

function AIInsightPanel() {
  return (
    <div style={{ width: 280, borderLeft: "1px solid #172133", background: "#0a0f1d", padding: 12 }}>
      <h3 style={{ color: "#eef6ff", fontSize: 12, fontWeight: 800, marginBottom: 12 }}>IA Insights</h3>
      <div style={{ borderBottom: "1px solid #172133", paddingBottom: 8, marginBottom: 8 }}>
        <div style={{ color: "#f7c948", fontSize: 11 }}>BTC</div>
        <div style={{ color: "#27f59d", fontSize: 16, fontWeight: 900 }}>COMPRA</div>
      </div>
      <div style={{ color: "#7a8aa3", fontSize: 11 }}>Risco moderado, tendência alta.</div>
    </div>
  );
}

// ============================================
// CHART PANEL COM FUNCIONALIDADE
// ============================================
function ChartPanel({ candleCount = 240 }: { candleCount?: number }) {
  const mainRef = useRef<HTMLDivElement>(null);
  const oscRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [activeTool, setActiveTool] = useState<DrawTool>("cursor");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftStart, setDraftStart] = useState<{ x: number; y: number } | null>(null);
  const [svgSize, setSvgSize] = useState({ w: 0, h: 0 });
  
  // Dados
  const candles = useMemo(() => generateCandles(candleCount), []);
  const ma20 = useMemo(() => computeSMA(candles, 20), [candles]);
  const ma50 = useMemo(() => computeSMA(candles, 50), [candles]);

  // Inicializa Charts
  useEffect(() => {
    if (!mainRef.current || !oscRef.current) return;

    const opts = {
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#7085ad" },
      grid: { vertLines: { color: "rgba(255,255,255,0.05)" }, horzLines: { color: "rgba(255,255,255,0.05)" } },
      crosshair: { mode: CrosshairMode.Normal }, handleScroll: true, handleScale: true,
    };

    const chart = createChart(mainRef.current, { ...opts, width: mainRef.current.clientWidth, height: mainRef.current.clientHeight });
    const series = chart.addCandlestickSeries({
      upColor: "#26a69a", downColor: "#ef5350", borderUpColor: "#26a69a", borderDownColor: "#ef5350",
      wickUpColor: "#26a69a", wickDownColor: "#ef5350",
    });
    series.setData(candles.map((c: any) => ({ time: c.time as Time, open: c.open, high: c.high, low: c.low, close: c.close })));

    chart.timeScale().fitContent();
    setSvgSize({ w: mainRef.current.clientWidth, h: mainRef.current.clientHeight });

    window.addEventListener("resize", () => {
      if (mainRef.current && oscRef.current) {
        setSvgSize({ w: mainRef.current.clientWidth, h: mainRef.current.clientHeight });
        chart.applyOptions({ width: mainRef.current.clientWidth, height: mainRef.current.clientHeight });
      }
    });

    return () => chart.remove();
  }, [candles]);

  // Lógica Desenho
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (activeTool === "cursor") {
      const rect = e.currentTarget.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const hit = drawings.find(d => d.id === selectedId && !d.locked);
      if (hit) setSelectedId(null); else { setDraftStart({ x: mx, y: e.clientY - rect.top }); }
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setDraftStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };
  const handleMouseUp = (e: React.MouseEvent<SVGSVGElement>) => {
    if (draftStart && activeTool !== "cursor") {
      const rect = e.currentTarget.getBoundingClientRect();
      const newD: Drawing = {
        id: Date.now().toString(), tool: activeTool, color: TOOL_COLORS[activeTool],
        x1: draftStart.x, y1: draftStart.y, x2: e.clientX - rect.left, y2: e.clientY - rect.top,
        lineWidth: 2, lineStyle: "solid", fillOpacity: 10, locked: false, hidden: false, note: "", showPrice: true,
      };
      setDrawings(prev => [...prev, newD]);
      setDraftStart(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, background: ui.bg, position: "relative" }}>
      {/* Info Header */}
      <div style={{ height: 44, borderBottom: "1px solid #172133", display: "grid", gridTemplateColumns: "auto 1fr", alignItems: "center", padding: "0 16px" }}>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ color: "#27f59d", fontSize: 14, fontWeight: 900 }}>BTC</div>
          <div style={{ color: "#7085ad", fontSize: 11 }}>Live Trading</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["1m", "5m", "15m", "1H", "4H"].map(tf => <TopButton key={tf} active>{tf}</TopButton>)}
        </div>
      </div>

      {/* Chart Container */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <div ref={mainRef} style={{ width: "100%", height: "100%" }} />
        
        {/* SVG Overlay */}
        <svg ref={svgRef} style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: activeTool !== "cursor" ? "auto" : "none", cursor: activeTool === "cursor" ? "default" : "crosshair" }}
          onMouseDown={handleMouseDown} onMouseMove={(e) => { const r=e.currentTarget.getBoundingClientRect(); if(draftStart)setDraftStart({...draftStart,x:e.clientX-r.left}); }} onMouseUp={handleMouseUp}>
          
          {/* Render Desenhos Fixos */}
          {drawings.map(d => renderDrawingSVG(d, svgSize.w, svgSize.h, d.id === selectedId))}
          
          {/* Render Draft (Preview) */}
          {draftStart && activeTool !== "cursor" && renderDrawingSVG({
            id: "draft", tool: activeTool, color: TOOL_COLORS[activeTool], x1: draftStart.x, y1: draftStart.y,
            x2: svgSize.w, y2: svgSize.h, lineWidth: 2, lineStyle: "solid", fillOpacity: 0, locked: false, hidden: false, showPrice: false
          }, svgSize.w, svgSize.h, false).cloneNode(true)} 
        </svg>

        {/* Oscillator Placeholder */}
        <div ref={oscRef} style={{ height: 80, borderTop: "1px solid #172133", background: "#060913" }}>
          <div style={{ padding: 4, color: "#7085ad", fontSize: 10 }}>Volume</div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// APP PRINCIPAL
// ============================================
export default function AtlasChartPro2() {
  const [activeTab, setActiveTab] = useState<"Chart" | "Scan">("Chart");

  return (
    <div style={{ width: "100vw", height: "100vh", background: ui.bg, color: "#ebf3ff", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      
      {/* Top Navbar */}
      <div style={{ height: 48, borderBottom: "1px solid #172133", display: "flex", alignItems: "center", padding: "0 12px", gap: 16 }}>
        <div style={{ fontWeight: 900, fontSize: 14, color: "#2de2ff", letterSpacing: 1 }}>SINGULARIDADE</div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 8 }}>
          <TopButton active={activeTab==="Chart"}>Gráfico</TopButton>
          <TopButton active={activeTab==="Scan"}>Scanner</TopButton>
        </div>
        <Settings size={16} color="#90a4c8" style={{ marginLeft: 16 }} />
      </div>

      {/* Modules Strip */}
      <div style={{ height: 32, borderBottom: "1px solid #172133", padding: "0 16px", display: "flex", alignItems: "center", gap: 8, background: "#080e1c" }}>
         {["Fluxo", "Scanner", "Estrutura", "IA Atlas", "Liquidez"].map(m => (
           <span key={m} style={{ fontSize: 10, color: "#90a4c8", cursor: "pointer", fontWeight: 600 }}>{m}</span>
         ))}
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <DrawingToolbar activeTool={"cursor" as DrawTool} onChangeTool={() => {}} />
        
        <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
          <ChartPanel />
        </div>

        <AIInsightPanel />
      </div>
    </div>
  );
}
