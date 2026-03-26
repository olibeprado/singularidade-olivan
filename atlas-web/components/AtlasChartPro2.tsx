"use client";
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createChart, ColorType, CrosshairMode, IChartApi, Time } from "lightweight-charts";
import {
  Activity, BarChart2, Bell, BrainCircuit, ChevronDown, ChevronRight, Droplets,
  Layers3, Maximize2, MousePointer2, PenTool, RotateCcw, Ruler, ScanSearch,
  Search, Settings, Shapes, Sigma, Square, Star, Trash2, TrendingDown,
  TrendingUp, Type, Waves, Plus, Minus, MoveUpRight, ArrowRight, ArrowDown,
  ArrowUp, GitBranch, Grid2X2, Circle, Spline, Network, SlidersHorizontal,
} from "lucide-react";

// ============================================================
// TIPOS & CONSTANTES
// ============================================================
type DrawTool = "cursor" | "trendline" | "hline" | "vline" | "ray" | "extended"
  | "channel" | "pitchfork" | "fib" | "fibext" | "fibarc" | "fibfan"
  | "rect" | "triangle" | "ellipse" | "measure" | "text";

export type FibLevel = { pct: number; color: string; visible: boolean };
export type Drawing = {
  id: string; tool: DrawTool; color: string;
  lineWidth: number; lineStyle: "solid" | "dashed" | "dotted"; fillOpacity: number;
  locked: boolean; hidden: boolean; note: string; showPrice: boolean;
  x1: number; y1: number; x2: number; y2: number; x3?: number; y3?: number;
  fibLevels?: FibLevel[]; text?: string; fontSize?: number; bold?: boolean; label?: string;
  showArrow?: boolean; showVariation?: boolean; showPercent?: boolean; channelOffset?: number; p1?: number; p2?: number;
};

const DEFAULT_FIB_LEVELS: FibLevel[] = [
  { pct: 0,     color: "#ffd54f", visible: true }, { pct: 0.236, color: "#00d4ff", visible: true },
  { pct: 0.382, color: "#00e676", visible: true }, { pct: 0.5,   color: "#ff9100", visible: true },
  { pct: 0.618, color: "#c77dff", visible: true }, { pct: 0.786, color: "#ff3060", visible: true },
  { pct: 1.0,   color: "#ffd54f", visible: true }, { pct: 1.272, color: "#448aff", visible: false },
  { pct: 1.618, color: "#00e676", visible: false },
];

const TOOL_COLORS: Record<DrawTool, string> = {
  cursor: "#ffffff", trendline: "#00d4ff", hline: "#ffd54f", vline: "#ffd54f", ray: "#ff9100", extended: "#00d4ff",
  channel: "#448aff", pitchfork: "#c77dff", fib: "#ffd54f", fibext: "#00e676", fibarc: "#ff9100",
  rect: "#00d4ff", triangle: "#00e676", ellipse: "#ff9100", measure: "#00e676", text: "#ffffff",
};

const UI = {
  bg: "#060913", border: "#172133", text: "#ebf3ff", mut: "#7f93b7", cyan: "#2de2ff", green: "#27f59d", yellow: "#f7c948", red: "#ff6b86",
};

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }
function formatCompact(n: number) { if (n >= 1_000_000_000) return `${(n / 1e9).toFixed(2)}B`; if (n >= 1_000_000) return `${(n / 1e6).toFixed(2)}M`; if (n >= 1_000) return `${(n / 1e3).toFixed(2)}K`; return n.toFixed(2); }
function symbolBasePrice(symbol: string) { const map: Record<string, number> = { BTC: 74682, ETH: 3932, SOL: 174.8, BNB: 610.75 }; return map[symbol] ?? 100; }
function generateCandles(count = 240, startPrice = 74500) {
  const candles = [], now = Math.floor(Date.now() / 1000); let prevClose = startPrice;
  for (let i = count; i > 0; i--) {
    const time = now - i * 300, drift = (Math.random() - 0.49) * startPrice * 0.0065 + (Math.sin(i / 11) * startPrice * 0.0045);
    const open = prevClose, close = Math.max(0.0001, open + drift), high = Math.max(open, close) + Math.random() * startPrice * 0.0035, low = Math.min(open, close) - Math.random() * startPrice * 0.0035, volume = 120 + Math.random() * 1400;
    candles.push({ time, open, high, low, close, volume }); prevClose = close;
  } return candles;
}
function generateIndicators(candles: any[]) {
  return candles.map((c, i) => ({ time: c.time, rsi: clamp(48 + Math.sin(i / 8) * 14 + (Math.random() - 0.5) * 6, 5, 95), mfi: clamp(52 + Math.cos(i / 10) * 16 + (Math.random() - 0.5) * 6, 5, 95) }));
}
function computeSMA(candles: any[], period: number) { return candles.map((c, i) => (i < period - 1 ? { time: c.time, value: c.close } : ({ time: c.time, value: candles.slice(i - period + 1, i + 1).reduce((a, b) => a + b.close, 0) / period }))); }
function computeEMA(candles: any[], period: number) { const k = 2 / (period + 1), ema = []; let prev = candles[0]?.close ?? 0; for (let i = 0; i < candles.length; i++) { const close = candles[i].close, value = i === 0 ? close : close * k + prev * (1 - k); ema.push({ time: candles[i].time, value }); prev = value; } return ema; }

// ============================================================
// UTILITÁRIOS DE DESENHO
// ============================================================
function hitTestDrawing(d: Drawing, mx: number, my: number): boolean {
  const pad = 10;
  if (d.tool === "hline") return Math.abs(my - d.y1) < pad;
  if (d.tool === "vline") return Math.abs(mx - d.x1) < pad;
  if (["rect", "fib", "measure"].includes(d.tool)) return mx >= Math.min(d.x1, d.x2) - pad && mx <= Math.max(d.x1, d.x2) + pad && my >= Math.min(d.y1, d.y2) - pad && my <= Math.max(d.y1, d.y2) + pad;
  const dx = d.x2 - d.x1, dy = d.y2 - d.y1; const t = Math.max(0, Math.min(1, ((mx - d.x1) * dx + (my - d.y1) * dy) / (dx * dx + dy * dy + 0.001))); return Math.sqrt((mx - d.x1 - t * dx) ** 2 + (my - d.y1 - t * dy) ** 2) < pad;
}
function renderDrawingSVG(d: Drawing, svgW: number, svgH: number, selected: boolean) {
  const col = d.color, lw = d.lineWidth, dash = d.lineStyle === "dashed" ? "5,3" : d.lineStyle === "dotted" ? "2,3" : "", fa = (d.fillOpacity || 10) / 100, sel = selected && !d.locked;
  if (sel) return (<g><circle cx={d.x1} cy={d.y1} r={5} fill="#fff" stroke={col} strokeWidth={1.5}/><circle cx={d.x2} cy={d.y2} r={5} fill="#fff" stroke={col} strokeWidth={1.5}/></g>);
  switch (d.tool) {
    case "hline": return <g><line x1={0} y1={d.y1} x2={svgW} y2={d.y1} stroke={col} strokeWidth={lw} strokeDasharray={dash}/>{d.label && <text x={6} y={d.y1-4} fill={col} fontSize={9}>{d.label}</text>}</g>;
    case "vline": return <g><line x1={d.x1} y1={0} x2={d.x1} y2={svgH} stroke={col} strokeWidth={lw} strokeDasharray={dash}/></g>;
    case "trendline": { const angle = Math.atan2(d.y2-d.y1, d.x2-d.x1); return <g><line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} stroke={col} strokeWidth={lw}/><polygon points={`${d.x2},${d.y2} ${d.x2-12*Math.cos(angle-0.4)},${d.y2-12*Math.sin(angle-0.4)} ${d.x2-12*Math.cos(angle+0.4)},${d.y2-12*Math.sin(angle+0.4)}`} fill={col} /></g>; }
    case "rect": return <g><rect x={Math.min(d.x1,d.x2)} y={Math.min(d.y1,d.y2)} width={Math.abs(d.x2-d.x1)} height={Math.abs(d.y2-d.y1)} fill={col} fillOpacity={fa} stroke={col} strokeWidth={lw} /></g>;
    default: return <line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} stroke={col} strokeWidth={lw} />;
  }
}

// ============================================================
// COMPONENTES UI
// ============================================================
function TopBar({ symbol, price, change, timeframe }: { symbol: string; price: number; change: number; timeframe: string }) {
  const isPositive = change >= 0;
  return (
    <div style={{ height: 64, padding: "0 14px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${UI.border}`, background: "radial-gradient(circle at top, rgba(14,28,60,0.86), rgba(6,10,20,0.98) 55%)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: "linear-gradient(135deg, rgba(42,231,255,0.22), rgba(119,77,255,0.28))", display: "flex", alignItems: "center", justifyContent: "center" }}><Activity size={17} color="#e8f7ff"/></div>
        <span style={{ color: "#f6fbff", fontSize: 17, fontWeight: 900 }}>SINGULARIDADE <span style={{ fontSize: 10, color: UI.cyan, marginLeft: 6, padding: "2px 6px", background: "rgba(45,226,255,0.1)", borderRadius: 999 }}>OBP</span></span>
      </div>
      <div style={{ flex: 1 }}/>
      <button style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 36, padding: "0 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)", color: "#eef6ff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>₿ {symbol}</button>
      <span style={{ color: isPositive ? UI.green : UI.red, fontSize: 13, fontWeight: 900 }}>{isPositive ? "+" : ""}{change.toFixed(2)}%</span>
      <div style={{ display: "flex", gap: 4 }}>{"1m|5m|15m|30m|1H|4H|1D".split("|").map(tf => tf === timeframe ? <button key={tf} style={{height:29, padding:"0 10px", borderRadius:9, border:`1px solid #f7c948`, background:`rgba(247,201,72,0.1)`, color:"#f7c948", fontSize:11, fontWeight:800, cursor:"pointer"}}>{tf}</button> : <button key={tf} style={{height:29, padding:"0 10px", borderRadius:9, border:"1px solid transparent", background:"transparent", color:"#dce8ff", fontSize:11, fontWeight:800, cursor:"pointer"}}>{tf}</button>)}</div>
    </div>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL ATUALIZADO (CORREÇÃO DO ERRO)
// ============================================================
export default function AtlasChartPro2() {
  const mainRef = useRef<HTMLDivElement>(null);
  const oscRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<SVGSVGElement>(null);
  const [activeTool, setActiveTool] = useState<DrawTool>("cursor");
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftStart, setDraftStart] = useState<{x:number,y:number} | null>(null);
  const [price, setPrice] = useState(74682);
  const [timeframe, setTimeframe] = useState("15m");
  
  const candles = useMemo(() => generateCandles(240, symbolBasePrice("BTC")), []);
  const indicators = useMemo(() => generateIndicators(candles), [candles]);

  useEffect(() => {
    if (!mainRef.current || !oscRef.current) return;
    
    const opts = { layout: {background: {type: ColorType.Solid, color: "transparent"}, textColor: "#7085ad"}, grid: {vertLines: {color: "rgba(255,255,255,0.035)"}, horzLines: {color: "rgba(255,255,255,0.035)"}}, crosshair: {mode: CrosshairMode.Normal}, rightPriceScale: {borderColor: "rgba(255,255,255,0.08)"}, timeScale: {borderColor: "rgba(255,255,255,0.08)", timeVisible: true}, handleScroll: true, handleScale: true };
    
    // GRAFICO PRINCIPAL
    const chart = createChart(mainRef.current, {...opts, width: mainRef.current.clientWidth, height: mainRef.current.clientHeight});
    const cs = chart.addCandlestickSeries({upColor: "#26a69a", downColor: "#ef5350", borderUpColor: "#26a69a", borderDownColor: "#ef:
