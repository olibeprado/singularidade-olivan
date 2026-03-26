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
  Activity, BarChart2, Bell, BrainCircuit, ChevronDown, ChevronRight,
  Droplets, Eye, Layers3, Maximize2, MousePointer2, PenTool, RotateCcw,
  Ruler, ScanSearch, Search, Settings, Shapes, Sigma, Square, Star,
  Trash2, TrendingDown, TrendingUp, Type, Waves, Plus, Minus,
  MoveUpRight, ArrowRight, ArrowDown, ArrowUp, GitBranch, Grid2X2,
  Circle, Spline, Network, SlidersHorizontal, X,
} from "lucide-react";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
type Timeframe = "1m" | "5m" | "15m" | "30m" | "1H" | "4H" | "1D";
type ModeKey = "auto" | "manual" | "space";
type TopModuleKey =
  | "Fluxo" | "Singularidade" | "IA Atlas" | "Scanner"
  | "Mestre Scanner" | "Estrutura" | "Euler" | "Liquidez";

type CandleData = { time: number; open: number; high: number; low: number; close: number; volume: number };
type IndicatorData = { time: number; rsi: number; mfi: number };
type StructureItem = { label: string; value?: string; type: "positive" | "strong" | "negative" | "neutral" | "dots"; dots?: number };
type AIInsight = { symbol: string; price: number; score: number; signal: string; riskLevel: string; riskType: string; invalidation: number; trendBias: "bullish" | "bearish" | "neutral"; structure: StructureItem[]; structure2: StructureItem[] };
type AssetScore = { symbol: string; volumeScore: number; rsiMfi: number; price: number; change: number; trend: "up" | "down" | "neutral"; color: string; aiScore: number; signal: string; riskLevel: string; riskType: string; invalidation: number };
type ScannerEvent = { time: string; title: string; tag: string; tone: "positive" | "warning" | "neutral" };

// ─── Drawing types ───
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
  // geometry (SVG coords)
  x1: number; y1: number;
  x2: number; y2: number;
  x3?: number; y3?: number;
  // fib
  fibLevels?: FibLevel[];
  // text
  text?: string;
  fontSize?: number;
  bold?: boolean;
  // hline extras
  label?: string;
  // flags
  showArrow?: boolean;
  showAngle?: boolean;
  showVariation?: boolean;
  showPercent?: boolean;
  showPrices?: boolean;
};

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const TIMEFRAMES: Timeframe[] = ["1m", "5m", "15m", "30m", "1H", "4H", "1D"];
const NAV_TABS = ["Gráfico", "Ordens", "Posições", "IA Atlas", "Fluxo"];
const TOP_MODULES: TopModuleKey[] = ["Fluxo","Singularidade","IA Atlas","Scanner","Mestre Scanner","Estrutura","Euler","Liquidez"];
const LIQUIDITY_TABS = ["Liquidez","Map","Clusters","Eventos","Fluxo Institucional","Notícias IA Atlas"];

const DEFAULT_FIB_LEVELS: FibLevel[] = [
  { pct: 0,     color: "#ffd54f", visible: true },
  { pct: 0.236, color: "#00d4ff", visible: true },
  { pct: 0.382, color: "#00e676", visible: true },
  { pct: 0.5,   color: "#ff9100", visible: true },
  { pct: 0.618, color: "#c77dff", visible: true },
  { pct: 0.786, color: "#ff3060", visible: true },
  { pct: 1.0,   color: "#ffd54f", visible: true },
  { pct: 1.272, color: "#448aff", visible: false },
  { pct: 1.618, color: "#00e676", visible: false },
];

const TOOL_COLORS: Record<DrawTool, string> = {
  cursor: "#ffffff", trendline: "#00d4ff", hline: "#ffd54f", vline: "#ffd54f",
  ray: "#ff9100", extended: "#00d4ff", channel: "#448aff", pitchfork: "#c77dff",
  fib: "#ffd54f", fibext: "#00e676", fibarc: "#ff9100", fibfan: "#c77dff",
  rect: "#00d4ff", triangle: "#00e676", ellipse: "#ff9100",
  measure: "#00e676", text: "#ffffff",
};

const ui = {
  bg: "#060913", bg2: "#050810", border: "#172133",
  text: "#ebf3ff", mut: "#7f93b7",
  cyan: "#2de2ff", cyan2: "#00d8ff", green: "#27f59d",
  yellow: "#f7c948", red: "#ff6b86", magenta: "#ff4fa3",
  orange: "#ff9d2e",
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }
function formatCompact(n: number) {
  if (n >= 1e9) return `${(n/1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n/1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n/1e3).toFixed(2)}K`;
  return n.toFixed(2);
}
function symbolBasePrice(symbol: string) {
  const map: Record<string,number> = { BTC:74682, ETH:3932, SOL:174.8, BNB:610.75, XRP:2.147, DOGE:0.387, AVAX:38.87, DOT:8.98, ADA:0.847, ARB:1.21 };
  return map[symbol] ?? 100;
}
function generateCandles(count = 240, startPrice = 74500): CandleData[] {
  const now = Math.floor(Date.now() / 1000);
  const candles: CandleData[] = [];
  let prev = startPrice;
  for (let i = count; i > 0; i--) {
    const wave = Math.sin(i/11)*(startPrice*0.0045) + Math.cos(i/17)*(startPrice*0.0022);
    const drift = (Math.random()-0.49)*(startPrice*0.0065) + wave;
    const open = prev, close = Math.max(0.0001, open+drift);
    const high = Math.max(open,close)+Math.random()*(startPrice*0.0035);
    const low  = Math.min(open,close)-Math.random()*(startPrice*0.0035);
    candles.push({ time: now-i*300, open, high, low, close, volume: 120+Math.random()*1400 });
    prev = close;
  }
  return candles;
}
function generateIndicators(candles: CandleData[]): IndicatorData[] {
  return candles.map((c,i) => ({
    time: c.time,
    rsi: clamp(48+Math.sin(i/8)*14+(Math.random()-.5)*6, 5, 95),
    mfi: clamp(52+Math.cos(i/10)*16+(Math.random()-.5)*6, 5, 95),
  }));
}
function computeSMA(candles: CandleData[], p: number) {
  return candles.map((_,i) => {
    if (i < p-1) return { time: candles[i].time, value: candles[i].close };
    let s = 0; for (let j=i-p+1;j<=i;j++) s+=candles[j].close;
    return { time: candles[i].time, value: s/p };
  });
}
function computeEMA(candles: CandleData[], p: number) {
  const k = 2/(p+1); const ema: {time:number;value:number}[] = [];
  let prev = candles[0]?.close ?? 0;
  for (let i=0;i<candles.length;i++) {
    const v = i===0 ? candles[i].close : candles[i].close*k+prev*(1-k);
    ema.push({ time: candles[i].time, value: v }); prev = v;
  }
  return ema;
}
function generateSparkline(count: number, start: number, trend: "up"|"down"|"neutral") {
  const arr: number[] = []; let v = start;
  for (let i=0;i<count;i++) {
    v += (trend==="up"?1.3:trend==="down"?-1.2:0.12)+(Math.random()-.5)*3; arr.push(v);
  }
  return arr;
}
function getScoreVisual(s: number) {
  if (s>=80) return { color: ui.green, label:"Compra" };
  if (s>=50) return { color: ui.yellow, label:"Neutro" };
  return { color: ui.red, label:"Baixa" };
}
function symbolToInsight(a: AssetScore): AIInsight {
  return {
    symbol:a.symbol, price:a.price, score:a.aiScore, signal:a.signal,
    riskLevel:a.riskLevel, riskType:a.riskType, invalidation:a.invalidation,
    trendBias: a.trend==="up"?"bullish":a.trend==="down"?"bearish":"neutral",
    structure:[
      { label:"Fluxo", value:a.trend==="up"?"Positivo":a.trend==="down"?"Pressão":"Neutro", type:a.trend==="up"?"positive":a.trend==="down"?"negative":"neutral" },
      { label:"Momentum", value:a.aiScore>=80?"Forte":a.aiScore>=60?"Moderado":"Fraco", type:a.aiScore>=80?"strong":a.aiScore>=60?"neutral":"negative" },
      { label:"Liquidez", value:a.volumeScore>=70?"Ativo":a.volumeScore>=50?"Médio":"Baixo", type:a.volumeScore>=70?"positive":a.volumeScore>=50?"neutral":"negative" },
      { label:"Confluência", type:"dots", dots:Math.max(2,Math.min(9,Math.round(a.aiScore/11))) },
    ],
    structure2:[
      { label:"Euler", value:a.trend==="up"?"Alinhado":a.trend==="down"?"Pressão":"Estável", type:a.trend==="up"?"positive":a.trend==="down"?"negative":"neutral" },
      { label:"Razão de Prata", value:a.rsiMfi>=60?"Forte":a.rsiMfi>=45?"Estável":"Fraca", type:a.rsiMfi>=60?"positive":a.rsiMfi>=45?"neutral":"negative" },
      { label:"Risco Assimétrico", value:a.change>=0?"Bom":"Sensível", type:a.change>=0?"positive":"negative" },
      { label:"Invalidação", value:a.change>=0?"Controlada":"Próxima", type:a.change>=0?"neutral":"negative" },
    ],
  };
}
function makeDash(style: Drawing["lineStyle"]): string {
  return style==="dashed"?"5,3":style==="dotted"?"2,3":"";
}
function newDrawing(tool: DrawTool, x1:number, y1:number, x2:number, y2:number, x3?:number, y3?:number): Drawing {
  return {
    id: `${tool}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    tool, color: TOOL_COLORS[tool],
    lineWidth:2, lineStyle:"solid", fillOpacity:10,
    locked:false, hidden:false, note:"",
    showPrice:true, showArrow:true, showPercent:true, showPrices:true,
    x1, y1, x2, y2, x3, y3,
    fibLevels: (tool==="fib"||tool==="fibext"||tool==="fibarc"||tool==="fibfan")
      ? DEFAULT_FIB_LEVELS.map(l=>({...l})) : undefined,
  };
}

// ─────────────────────────────────────────────
// UI PRIMITIVES
// ─────────────────────────────────────────────
function TopButton({ children, active, onClick }: { children:React.ReactNode; active?:boolean; onClick?:()=>void }) {
  return (
    <button onClick={onClick} style={{ height:29, padding:"0 10px", borderRadius:9,
      border: active?"1px solid rgba(247,201,72,0.34)":"1px solid rgba(255,255,255,0.06)",
      background: active?"linear-gradient(180deg,rgba(247,201,72,0.16),rgba(247,201,72,0.04))":"linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.008))",
      color: active?ui.yellow:"#dce8ff", fontSize:11, fontWeight:800, cursor:"pointer", whiteSpace:"nowrap",
    }}>{children}</button>
  );
}

function ModuleButton({ icon, text, active, onClick }: { icon:React.ReactNode; text:string; active?:boolean; onClick?:()=>void }) {
  return (
    <button onClick={onClick} style={{ display:"inline-flex", alignItems:"center", gap:8, height:34, padding:"0 14px", borderRadius:12,
      border: active?"1px solid rgba(247,201,72,0.34)":"1px solid rgba(255,255,255,0.06)",
      background: active?"linear-gradient(180deg,rgba(247,201,72,0.16),rgba(247,201,72,0.04))":"linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.01))",
      color: active?"#ffe39a":"#d9e8ff", fontSize:12, fontWeight:800, cursor:"pointer",
    }}>{icon}{text}</button>
  );
}

function ScoreDots({ count, total=9 }: { count:number; total?:number }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:2 }}>
      {Array.from({length:total}).map((_,i) => (
        <span key={i} style={{ width:6, height:6, borderRadius:"50%", display:"inline-block",
          background: i<count?"linear-gradient(180deg,#31e9ff,#18b7ff)":"rgba(255,255,255,0.14)" }} />
      ))}
    </div>
  );
}

function StructureRow({ item }: { item:StructureItem }) {
  const getColor = (t: StructureItem["type"]) =>
    t==="positive"?ui.green:t==="strong"?"#9fffbc":t==="negative"?ui.red:t==="neutral"?"#aab7d1":"#dbe7ff";
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <ChevronRight size={10} color="#66789d" />
        <span style={{ fontSize:12, color:"#8ea2c8" }}>{item.label}</span>
      </div>
      {item.type==="dots"&&item.dots!==undefined
        ? <ScoreDots count={item.dots} />
        : <span style={{ fontSize:12, color:getColor(item.type), fontWeight:700 }}>{item.value}</span>
      }
    </div>
  );
}

function SmallStatCard({ title, value, sub, color, accent }: { title:string; value:string; sub?:string; color:string; accent?:string }) {
  return (
    <div style={{ borderRadius:14, border:"1px solid rgba(45,226,255,0.16)", background:"linear-gradient(180deg,rgba(6,13,24,0.98),rgba(4,8,16,0.98))",
      padding:"8px 12px 7px", height:60, overflow:"hidden", boxShadow:accent?`0 0 18px ${accent}`:"none",
      display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
      <div style={{ color:"#6f88af", fontSize:9, fontWeight:900, letterSpacing:0.78, textTransform:"uppercase", marginBottom:2, lineHeight:1 }}>{title}</div>
      <div style={{ color, fontSize:14, fontWeight:900, marginBottom:1, textShadow:`0 0 10px ${color}33`, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ color:"#7f95bb", fontSize:8, lineHeight:1.1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", opacity:0.9 }}>{sub}</div>}
    </div>
  );
}

function ScoreBar({ value }: { value:number }) {
  const v = getScoreVisual(value);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ width:62, height:6, background:"rgba(255,255,255,0.08)", borderRadius:999, overflow:"hidden" }}>
        <div style={{ width:`${Math.min(100,value)}%`, height:"100%", borderRadius:999, background:v.color }} />
      </div>
      <span style={{ fontSize:10, fontWeight:900, color:v.color }}>{v.label}</span>
    </div>
  );
}

function MiniSparkline({ data, trend }: { data:number[]; trend:"up"|"down"|"neutral" }) {
  const min=Math.min(...data), max=Math.max(...data), range=max-min||1;
  const w=86, h=34;
  const pts = data.map((v,i)=>`${(i/(data.length-1))*w},${h-((v-min)/range)*h}`).join(" ");
  return <svg width={w} height={h}><polyline points={pts} fill="none" stroke={trend==="up"?ui.green:trend==="down"?ui.red:"#8ea2c8"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

// ─────────────────────────────────────────────
// DRAWING SETTINGS MODAL
// ─────────────────────────────────────────────
function DrawingSettingsModal({ drawing, onApply, onClose }: {
  drawing: Drawing;
  onApply: (d: Drawing) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState<Drawing>({ ...drawing, fibLevels: drawing.fibLevels?.map(l=>({...l})) });
  const [tab, setTab] = useState<"style"|"levels"|"visibility">("style");

  const set = (patch: Partial<Drawing>) => setLocal(p => ({ ...p, ...patch }));

  const fibLevels = local.fibLevels ?? DEFAULT_FIB_LEVELS.map(l=>({...l}));
  const hasFib = ["fib","fibext","fibarc","fibfan"].includes(local.tool);

  const toolTitles: Record<DrawTool,string> = {
    cursor:"Cursor", trendline:"Linha de Tendência", hline:"Linha Horizontal",
    vline:"Linha Vertical", ray:"Raio", extended:"Linha Estendida",
    channel:"Canal Paralelo", pitchfork:"Pitchfork", fib:"Fibonacci Retração",
    fibext:"Fib Extensão", fibarc:"Fib Arcos", fibfan:"Fib Fan",
    rect:"Retângulo", triangle:"Triângulo", ellipse:"Elipse",
    measure:"Medição", text:"Texto",
  };

  const swatchColors = ["#ffd54f","#00d4ff","#00e676","#ff3060","#c77dff","#ff9100","#448aff","#ffffff"];

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}
         onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:"#0f1520", border:"1px solid #1e2d42", borderRadius:12, padding:20, width:380, maxHeight:"85vh", overflowY:"auto" }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <span style={{ color:"#e8f1ff", fontSize:13, fontWeight:800 }}>⚙ {toolTitles[local.tool]}</span>
          <button onClick={onClose} style={{ background:"transparent", border:"none", color:"#7f93b7", cursor:"pointer", fontSize:16 }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:4, marginBottom:14, borderBottom:"1px solid #172133", paddingBottom:8 }}>
          {(["style","levels","visibility"] as const).map(t => (
            <button key={t} onClick={()=>setTab(t)} style={{ padding:"4px 10px", borderRadius:5, fontSize:10, fontWeight:700, cursor:"pointer",
              background:tab===t?"#2de2ff":"transparent", color:tab===t?"#000":"#7f93b7", border:tab===t?"none":"1px solid #172133" }}>
              {t==="style"?"🎨 Estilo":t==="levels"?"📊 Níveis":"👁 Visibilidade"}
            </button>
          ))}
        </div>

        {/* STYLE TAB */}
        {tab==="style" && (
          <div style={{ display:"grid", gap:12 }}>
            {/* Color swatches */}
            <div>
              <div style={{ fontSize:10, color:"#7f93b7", marginBottom:6 }}>Cor da linha</div>
              <div style={{ display:"flex", gap:4, flexWrap:"wrap", alignItems:"center" }}>
                {swatchColors.map(c => (
                  <div key={c} onClick={()=>set({color:c})} style={{ width:22, height:22, borderRadius:4, background:c, cursor:"pointer",
                    border:local.color===c?"2px solid #fff":"2px solid transparent" }} />
                ))}
                <input type="color" value={local.color} onChange={e=>set({color:e.target.value})}
                  style={{ width:24, height:24, border:"none", borderRadius:4, cursor:"pointer", padding:0 }} />
                <div style={{ width:36, height:22, borderRadius:4, background:local.color, border:"1px solid #2a3a50" }} />
              </div>
            </div>

            {/* Line width & style */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div>
                <div style={{ fontSize:10, color:"#7f93b7", marginBottom:4 }}>Espessura</div>
                <select value={local.lineWidth} onChange={e=>set({lineWidth:parseFloat(e.target.value)})}
                  style={{ width:"100%", background:"#0a1020", border:"1px solid #1e2d42", borderRadius:4, color:"#e8f1ff", fontSize:11, padding:"5px 8px" }}>
                  <option value={1}>Fina (1px)</option>
                  <option value={1.5}>Normal (1.5px)</option>
                  <option value={2}>Média (2px)</option>
                  <option value={3}>Grossa (3px)</option>
                  <option value={4}>Muito Grossa (4px)</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize:10, color:"#7f93b7", marginBottom:4 }}>Estilo</div>
                <select value={local.lineStyle} onChange={e=>set({lineStyle:e.target.value as Drawing["lineStyle"]})}
                  style={{ width:"100%", background:"#0a1020", border:"1px solid #1e2d42", borderRadius:4, color:"#e8f1ff", fontSize:11, padding:"5px 8px" }}>
                  <option value="solid">Sólida ───</option>
                  <option value="dashed">Tracejada ─ ─</option>
                  <option value="dotted">Pontilhada · · ·</option>
                </select>
              </div>
            </div>

            {/* Fill opacity */}
            <div>
              <div style={{ fontSize:10, color:"#7f93b7", marginBottom:4 }}>Opacidade fundo: {local.fillOpacity}%</div>
              <input type="range" min={0} max={40} value={local.fillOpacity} onChange={e=>set({fillOpacity:parseInt(e.target.value)})}
                style={{ width:"100%", accentColor:"#2de2ff" }} />
            </div>

            {/* Show price */}
            <label style={{ display:"flex", alignItems:"center", justifyContent:"space-between", fontSize:11, color:"#e8f1ff" }}>
              Mostrar preço
              <input type="checkbox" checked={local.showPrice} onChange={e=>set({showPrice:e.target.checked})} style={{ accentColor:"#2de2ff" }} />
            </label>

            {/* TOOL-SPECIFIC sections */}
            {/* FIB levels inline */}
            {hasFib && (
              <div style={{ borderTop:"1px solid #172133", paddingTop:10 }}>
                <div style={{ fontSize:10, fontWeight:700, color:"#7f93b7", textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>Níveis Fibonacci</div>
                <div style={{ display:"grid", gridTemplateColumns:"auto 1fr auto auto", gap:4, fontSize:9, color:"#536887", marginBottom:4 }}>
                  <span>Vis.</span><span>Valor %</span><span>Cor</span><span>Del</span>
                </div>
                <div style={{ maxHeight:180, overflowY:"auto", display:"flex", flexDirection:"column", gap:4 }}>
                  {fibLevels.map((lvl,i) => (
                    <div key={i} style={{ display:"grid", gridTemplateColumns:"auto 1fr auto auto", gap:4, alignItems:"center" }}>
                      <input type="checkbox" checked={lvl.visible} onChange={e => {
                        const nl = [...fibLevels]; nl[i]={...nl[i],visible:e.target.checked}; set({fibLevels:nl});
                      }} style={{ accentColor:"#2de2ff" }} />
                      <input type="number" value={(lvl.pct*100).toFixed(1)} step={0.1} min={-500} max={500}
                        onChange={e => { const nl=[...fibLevels]; nl[i]={...nl[i],pct:parseFloat(e.target.value)/100}; set({fibLevels:nl}); }}
                        style={{ background:"#0a1020", border:"1px solid #1e2d42", borderRadius:3, color:"#e8f1ff", fontSize:10, padding:"2px 5px", width:70 }} />
                      <input type="color" value={lvl.color} onChange={e=>{ const nl=[...fibLevels]; nl[i]={...nl[i],color:e.target.value}; set({fibLevels:nl}); }}
                        style={{ width:20, height:20, border:"none", borderRadius:3, cursor:"pointer", padding:0 }} />
                      <button onClick={()=>set({fibLevels:fibLevels.filter((_,j)=>j!==i)})}
                        style={{ background:"transparent", border:"none", color:"#ff3060", cursor:"pointer", fontSize:12, padding:"1px 4px" }}>✕</button>
                    </div>
                  ))}
                </div>
                <button onClick={()=>set({fibLevels:[...fibLevels,{pct:2.0,color:"#00d4ff",visible:true}]})}
                  style={{ marginTop:6, width:"100%", padding:"4px 0", background:"#0a1020", border:"1px solid #1e2d42", borderRadius:4, color:"#2de2ff", fontSize:10, cursor:"pointer" }}>
                  + Adicionar nível
                </button>
              </div>
            )}

            {/* Text tool */}
            {local.tool==="text" && (
              <div style={{ borderTop:"1px solid #172133", paddingTop:10, display:"grid", gap:8 }}>
                <div>
                  <div style={{ fontSize:10, color:"#7f93b7", marginBottom:4 }}>Conteúdo</div>
                  <input value={local.text||""} onChange={e=>set({text:e.target.value})}
                    style={{ width:"100%", background:"#0a1020", border:"1px solid #1e2d42", borderRadius:4, color:"#e8f1ff", fontSize:11, padding:"5px 8px" }} />
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:8, alignItems:"center" }}>
                  <div>
                    <div style={{ fontSize:10, color:"#7f93b7", marginBottom:4 }}>Tamanho</div>
                    <select value={local.fontSize||13} onChange={e=>set({fontSize:parseInt(e.target.value)})}
                      style={{ width:"100%", background:"#0a1020", border:"1px solid #1e2d42", borderRadius:4, color:"#e8f1ff", fontSize:11, padding:"5px 8px" }}>
                      <option value={10}>Pequeno</option><option value={13}>Médio</option>
                      <option value={16}>Grande</option><option value={20}>Muito Grande</option><option value={26}>Enorme</option>
                    </select>
                  </div>
                  <label style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, fontSize:10, color:"#7f93b7" }}>
                    Negrito
                    <input type="checkbox" checked={!!local.bold} onChange={e=>set({bold:e.target.checked})} style={{ accentColor:"#2de2ff" }} />
                  </label>
                </div>
              </div>
            )}

            {/* HLine extras */}
            {local.tool==="hline" && (
              <div style={{ borderTop:"1px solid #172133", paddingTop:10, display:"grid", gap:8 }}>
                <div><div style={{ fontSize:10, color:"#7f93b7", marginBottom:4 }}>Rótulo</div>
                  <input value={local.label||""} onChange={e=>set({label:e.target.value})} placeholder="Ex: Suporte, Resistência..."
                    style={{ width:"100%", background:"#0a1020", border:"1px solid #1e2d42", borderRadius:4, color:"#e8f1ff", fontSize:11, padding:"5px 8px" }} />
                </div>
              </div>
            )}

            {/* Trendline extras */}
            {(local.tool==="trendline"||local.tool==="ray"||local.tool==="extended") && (
              <div style={{ borderTop:"1px solid #172133", paddingTop:10, display:"flex", flexDirection:"column", gap:6 }}>
                <label style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#e8f1ff" }}>Mostrar seta <input type="checkbox" checked={local.showArrow!==false} onChange={e=>set({showArrow:e.target.checked})} style={{ accentColor:"#2de2ff" }} /></label>
                <label style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#e8f1ff" }}>Mostrar ângulo <input type="checkbox" checked={!!local.showAngle} onChange={e=>set({showAngle:e.target.checked})} style={{ accentColor:"#2de2ff" }} /></label>
                <label style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#e8f1ff" }}>Mostrar variação % <input type="checkbox" checked={!!local.showVariation} onChange={e=>set({showVariation:e.target.checked})} style={{ accentColor:"#2de2ff" }} /></label>
              </div>
            )}

            {/* Rect extras */}
            {local.tool==="rect" && (
              <div style={{ borderTop:"1px solid #172133", paddingTop:10, display:"flex", flexDirection:"column", gap:6 }}>
                <label style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#e8f1ff" }}>Mostrar variação % <input type="checkbox" checked={local.showPercent!==false} onChange={e=>set({showPercent:e.target.checked})} style={{ accentColor:"#2de2ff" }} /></label>
                <label style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#e8f1ff" }}>Mostrar preços <input type="checkbox" checked={local.showPrices!==false} onChange={e=>set({showPrices:e.target.checked})} style={{ accentColor:"#2de2ff" }} /></label>
              </div>
            )}
          </div>
        )}

        {/* LEVELS TAB */}
        {tab==="levels" && (
          <div>
            {hasFib ? (
              <div>
                <div style={{ fontSize:10, color:"#7f93b7", marginBottom:8 }}>Níveis calculados nos pontos do desenho</div>
                {fibLevels.filter(l=>l.visible).map((l,i) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:"1px solid #172133" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <div style={{ width:10, height:10, borderRadius:2, background:l.color }} />
                      <span style={{ fontSize:10, color:"#8ea2c8", fontFamily:"monospace" }}>{(l.pct*100).toFixed(1)}%</span>
                    </div>
                    <span style={{ fontSize:11, fontWeight:700, color:l.color, fontFamily:"monospace" }}>—</span>
                  </div>
                ))}
              </div>
            ) : <div style={{ color:"#536887", fontSize:11, textAlign:"center", padding:20 }}>Sem níveis para este tipo de desenho</div>}
          </div>
        )}

        {/* VISIBILITY TAB */}
        {tab==="visibility" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <label style={{ display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:11, color:"#e8f1ff", padding:"6px 0", borderBottom:"1px solid #172133" }}>
              Visível no gráfico <input type="checkbox" checked={!local.hidden} onChange={e=>set({hidden:!e.target.checked})} style={{ accentColor:"#2de2ff", width:15, height:15 }} />
            </label>
            <label style={{ display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:11, color:"#e8f1ff", padding:"6px 0", borderBottom:"1px solid #172133" }}>
              Travado (não mover) <input type="checkbox" checked={local.locked} onChange={e=>set({locked:e.target.checked})} style={{ accentColor:"#2de2ff", width:15, height:15 }} />
            </label>
            <div style={{ marginTop:4 }}>
              <div style={{ fontSize:10, color:"#7f93b7", marginBottom:4 }}>Nota</div>
              <textarea value={local.note} onChange={e=>set({note:e.target.value})} rows={3}
                style={{ width:"100%", background:"#0a1020", border:"1px solid #1e2d42", borderRadius:4, color:"#e8f1ff", fontSize:11, padding:"5px 8px", resize:"vertical" }} />
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display:"flex", gap:8, marginTop:16 }}>
          <button onClick={onClose} style={{ flex:1, padding:8, borderRadius:5, fontSize:11, fontWeight:700, cursor:"pointer", background:"#0a1020", border:"1px solid #1e2d42", color:"#7f93b7" }}>Cancelar</button>
          <button onClick={()=>{ onApply(local); onClose(); }} style={{ flex:1, padding:8, borderRadius:5, fontSize:11, fontWeight:700, cursor:"pointer", background:"#2de2ff", border:"none", color:"#000" }}>✓ Aplicar</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// TEXT INPUT MODAL
// ─────────────────────────────────────────────
function TextInputModal({ color, onConfirm, onClose }: { color:string; onConfirm:(text:string,size:number,bold:boolean)=>void; onClose:()=>void }) {
  const [text, setText] = useState("");
  const [size, setSize] = useState(13);
  const [bold, setBold] = useState(false);
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}
         onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:"#0f1520", border:"1px solid #1e2d42", borderRadius:10, padding:18, width:300 }}>
        <div style={{ color:"#e8f1ff", fontSize:13, fontWeight:800, marginBottom:10 }}>✏ Adicionar Texto</div>
        <input autoFocus value={text} onChange={e=>setText(e.target.value)} placeholder="Digite o texto..."
          style={{ width:"100%", background:"#0a1020", border:"1px solid #1e2d42", borderRadius:4, color:"#e8f1ff", fontSize:11, padding:"6px 8px", marginBottom:8 }} />
        <select value={size} onChange={e=>setSize(parseInt(e.target.value))}
          style={{ width:"100%", background:"#0a1020", border:"1px solid #1e2d42", borderRadius:4, color:"#e8f1ff", fontSize:11, padding:"5px 8px", marginBottom:8 }}>
          <option value={10}>Pequeno</option><option value={13}>Médio</option>
          <option value={16}>Grande</option><option value={20}>Muito Grande</option>
        </select>
        <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"#e8f1ff", marginBottom:12 }}>
          <input type="checkbox" checked={bold} onChange={e=>setBold(e.target.checked)} style={{ accentColor:"#2de2ff" }} /> Negrito
        </label>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onClose} style={{ flex:1, padding:7, borderRadius:4, fontSize:11, fontWeight:700, cursor:"pointer", background:"#0a1020", border:"1px solid #1e2d42", color:"#7f93b7" }}>Cancelar</button>
          <button onClick={()=>text.trim()&&onConfirm(text,size,bold)} style={{ flex:1, padding:7, borderRadius:4, fontSize:11, fontWeight:700, cursor:"pointer", background:"#2de2ff", border:"none", color:"#000" }}>Adicionar</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// CONTEXT MENU
// ─────────────────────────────────────────────
function ContextMenu({ x, y, drawing, onSettings, onDelete, onToggleLock, onToggleHide, onClose }: {
  x:number; y:number; drawing:Drawing;
  onSettings:()=>void; onDelete:()=>void; onToggleLock:()=>void; onToggleHide:()=>void; onClose:()=>void;
}) {
  useEffect(() => {
    const h = () => onClose();
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, [onClose]);

  const item = (label:string, action:()=>void, danger=false) => (
    <div onClick={()=>{ action(); onClose(); }} style={{ padding:"7px 12px", fontSize:11, cursor:"pointer", color:danger?"#ff3060":"#e8f1ff",
      display:"flex", alignItems:"center", gap:7, transition:"background .1s" }}
      onMouseEnter={e=>(e.currentTarget.style.background="#1a2535")}
      onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
      {label}
    </div>
  );

  return (
    <div style={{ position:"fixed", left:x, top:y, background:"#0f1520", border:"1px solid #1e2d42", borderRadius:7, zIndex:900, minWidth:170, boxShadow:"0 8px 24px rgba(0,0,0,.5)", overflow:"hidden" }}>
      {item("⚙ Configurações", onSettings)}
      {item(drawing.locked?"🔓 Destravar":"🔒 Travar", onToggleLock)}
      {item(drawing.hidden?"👁 Mostrar":"🙈 Ocultar", onToggleHide)}
      <div style={{ height:1, background:"#172133", margin:"2px 0" }} />
      {item("🗑 Apagar", onDelete, true)}
    </div>
  );
}

// ─────────────────────────────────────────────
// LEFT TOOLBAR — all tools
// ─────────────────────────────────────────────
const TOOL_GROUPS: { title: string; items: { key: DrawTool; label: string; icon: React.ReactNode }[] }[] = [
  { title: "CURSOR", items: [{ key:"cursor", label:"Cursor (V)", icon:<MousePointer2 size={14}/> }] },
  { title: "LINHAS", items: [
    { key:"trendline", label:"Tendência (T)", icon:<TrendingUp size={14}/> },
    { key:"hline",     label:"Horizontal (H)", icon:<Minus size={14}/> },
    { key:"vline",     label:"Vertical (K)",   icon:<span style={{fontFamily:"monospace",fontSize:14}}>│</span> },
    { key:"ray",       label:"Raio (R)",        icon:<ArrowRight size={14}/> },
    { key:"extended",  label:"Estendida",       icon:<span style={{fontSize:11}}>⟷</span> },
  ]},
  { title: "CANAIS", items: [
    { key:"channel",   label:"Canal",      icon:<span style={{fontSize:11}}>⦀</span> },
    { key:"pitchfork", label:"Pitchfork",  icon:<GitBranch size={14}/> },
  ]},
  { title: "FIBO", items: [
    { key:"fib",    label:"Fibonacci (F)", icon:<span style={{fontSize:9,fontWeight:900,fontFamily:"monospace"}}>FIB</span> },
    { key:"fibext", label:"Fib Extensão",  icon:<span style={{fontSize:8,fontFamily:"monospace"}}>EXT</span> },
    { key:"fibarc", label:"Fib Arcos",     icon:<Circle size={13}/> },
    { key:"fibfan", label:"Fib Fan",       icon:<Spline size={13}/> },
  ]},
  { title: "FORMAS", items: [
    { key:"rect",     label:"Retângulo (G)", icon:<Square size={13}/> },
    { key:"triangle", label:"Triângulo",     icon:<span style={{fontSize:13}}>△</span> },
    { key:"ellipse",  label:"Elipse",        icon:<span style={{fontSize:13}}>◯</span> },
  ]},
  { title: "MISC", items: [
    { key:"measure", label:"Medir (M)", icon:<Ruler size={13}/> },
    { key:"text",    label:"Texto (X)", icon:<Type size={13}/> },
  ]},
];

function LeftToolbar({ activeTool, onChangeTool }: { activeTool:DrawTool; onChangeTool:(t:DrawTool)=>void }) {
  return (
    <div data-atlas-scroll="cyan" style={{ width:58, borderRight:`1px solid ${ui.border}`, background:"linear-gradient(180deg,rgba(8,12,24,0.98),rgba(6,9,17,0.98))",
      display:"flex", flexDirection:"column", padding:"8px 6px", gap:4, overflowY:"auto", flexShrink:0 }}>
      {TOOL_GROUPS.map((g,gi) => (
        <div key={gi}>
          {gi>0 && <div style={{ height:1, background:"#172133", margin:"4px 0" }} />}
          <div style={{ color:"#424e63", fontSize:7, fontWeight:900, letterSpacing:0.8, textTransform:"uppercase", textAlign:"center", marginBottom:4 }}>{g.title}</div>
          {g.items.map(item => {
            const active = activeTool===item.key;
            return (
              <button key={item.key} onClick={()=>onChangeTool(item.key)} title={item.label}
                style={{ width:40, height:36, margin:"0 auto", display:"flex", borderRadius:8,
                  flexDirection:"column", alignItems:"center", justifyContent:"center", gap:1,
                  border:active?"1px solid rgba(45,226,255,0.3)":"1px solid rgba(255,255,255,0.04)",
                  background:active?"radial-gradient(circle,rgba(45,226,255,0.18),rgba(45,226,255,0.04))":"linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.008))",
                  color:active?ui.cyan:"#90a4c8", cursor:"pointer", boxShadow:active?"0 0 14px rgba(45,226,255,0.18)":"none" }}>
                {item.icon}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// SVG DRAWING RENDERER
// ─────────────────────────────────────────────
function renderDrawing(d: Drawing, svgW: number, svgH: number, selected: boolean): React.ReactNode {
  const col = d.color;
  const lw = d.lineWidth;
  const dash = makeDash(d.lineStyle);
  const fillAlpha = (d.fillOpacity||10)/100;
  const sel = selected && !d.locked;

  const handles = sel ? (
    <>
      <circle cx={d.x1} cy={d.y1} r={5} fill="#fff" stroke={col} strokeWidth={1.5} />
      <circle cx={d.x2} cy={d.y2} r={5} fill="#fff" stroke={col} strokeWidth={1.5} />
    </>
  ) : null;

  switch(d.tool) {
    case "hline": {
      const y = d.y1;
      return (
        <g>
          <line x1={0} y1={y} x2={svgW} y2={y} stroke={col} strokeWidth={lw} strokeDasharray={dash||undefined} />
          {d.showPrice && <text x={6} y={y-4} fill={col} fontSize={9} fontFamily="JetBrains Mono, monospace" fontWeight="bold">
            {d.label ? `${d.label}` : ""}
          </text>}
          {sel && <line x1={0} y1={y} x2={svgW} y2={y} stroke="transparent" strokeWidth={12} />}
          {sel && <circle cx={svgW/2} cy={y} r={5} fill="#fff" stroke={col} strokeWidth={1.5} />}
        </g>
      );
    }
    case "vline": {
      return (
        <g>
          <line x1={d.x1} y1={0} x2={d.x1} y2={svgH} stroke={col} strokeWidth={lw} strokeDasharray={dash||undefined} />
          {sel && <circle cx={d.x1} cy={svgH/2} r={5} fill="#fff" stroke={col} strokeWidth={1.5} />}
        </g>
      );
    }
    case "trendline": {
      const angle = Math.atan2(d.y2-d.y1, d.x2-d.x1)*180/Math.PI;
      return (
        <g>
          <line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} stroke={col} strokeWidth={lw} strokeDasharray={dash||undefined} />
          {d.showArrow!==false && (() => {
            const a = Math.atan2(d.y2-d.y1, d.x2-d.x1);
            return <polygon points={`${d.x2},${d.y2} ${d.x2-12*Math.cos(a-0.4)},${d.y2-12*Math.sin(a-0.4)} ${d.x2-12*Math.cos(a+0.4)},${d.y2-12*Math.sin(a+0.4)}`} fill={col} />;
          })()}
          {d.showAngle && <text x={(d.x1+d.x2)/2+4} y={(d.y1+d.y2)/2-4} fill={col} fontSize={9} fontFamily="monospace">{angle.toFixed(1)}°</text>}
          {handles}
        </g>
      );
    }
    case "ray": {
      const dx=d.x2-d.x1, dy=d.y2-d.y1, len=Math.sqrt(dx*dx+dy*dy)||1;
      return (
        <g>
          <line x1={d.x1} y1={d.y1} x2={d.x1+(dx/len)*svgW*2} y2={d.y1+(dy/len)*svgW*2} stroke={col} strokeWidth={lw} strokeDasharray={dash||undefined} />
          {handles}
        </g>
      );
    }
    case "extended": {
      const dx=d.x2-d.x1, dy=d.y2-d.y1, len=Math.sqrt(dx*dx+dy*dy)||1;
      return (
        <g>
          <line x1={d.x1-(dx/len)*svgW*2} y1={d.y1-(dy/len)*svgW*2} x2={d.x2+(dx/len)*svgW*2} y2={d.y2+(dy/len)*svgW*2} stroke={col} strokeWidth={lw} strokeDasharray={dash||undefined} />
          {handles}
        </g>
      );
    }
    case "channel": {
      const offset = (d.x3||0);
      return (
        <g>
          <line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} stroke={col} strokeWidth={lw} />
          <line x1={d.x1} y1={d.y1+offset} x2={d.x2} y2={d.y2+offset} stroke={col} strokeWidth={lw} strokeDasharray="5,3" />
          <polygon points={`${d.x1},${d.y1} ${d.x2},${d.y2} ${d.x2},${d.y2+offset} ${d.x1},${d.y1+offset}`}
            fill={col} fillOpacity={fillAlpha} />
          {handles}
        </g>
      );
    }
    case "pitchfork": {
      const mx=(d.x2+(d.x3||d.x2))/2, my=(d.y2+(d.y3||d.y2))/2;
      const dx=mx-d.x1, dy=my-d.y1, len=Math.sqrt(dx*dx+dy*dy)||1;
      const halfH=Math.abs((d.y3||d.y2)-d.y2)/2;
      return (
        <g>
          <line x1={d.x1} y1={d.y1} x2={mx+(dx/len)*svgW} y2={my+(dy/len)*svgW} stroke={col} strokeWidth={lw} />
          <line x1={d.x1} y1={d.y1} x2={mx+(dx/len)*svgW} y2={my+(dy/len)*svgW-halfH*2} stroke={col} strokeWidth={lw} strokeDasharray="4,3" />
          <line x1={d.x1} y1={d.y1} x2={mx+(dx/len)*svgW} y2={my+(dy/len)*svgW+halfH*2} stroke={col} strokeWidth={lw} strokeDasharray="4,3" />
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
          {levels.filter(l=>l.visible).map((lvl,i) => {
            const y = d.y1 + pDiff * lvl.pct;
            if(y<-50||y>svgH+50) return null;
            return (
              <g key={i}>
                <line x1={minX} y1={y} x2={svgW} y2={y} stroke={lvl.color} strokeWidth={lw} strokeDasharray={dash||undefined} opacity={0.8} />
                {d.showPrice && <text x={minX+4} y={y-3} fill={lvl.color} fontSize={9} fontFamily="JetBrains Mono,monospace" fontWeight="bold">
                  {(lvl.pct*100).toFixed(1)}%
                </text>}
              </g>
            );
          })}
          {levels.filter(l=>l.visible).map((lvl,i,arr) => {
            if(i>=arr.length-1) return null;
            const y1=d.y1+pDiff*lvl.pct, y2=d.y1+pDiff*arr[i+1].pct;
            return <rect key={i} x={minX} y={Math.min(y1,y2)} width={svgW-minX} height={Math.abs(y2-y1)} fill={lvl.color} fillOpacity={fillAlpha} />;
          })}
          <line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} stroke={col} strokeWidth={lw+0.5} />
          {handles}
        </g>
      );
    }
    case "fibarc": {
      const r = Math.sqrt((d.x2-d.x1)**2+(d.y2-d.y1)**2);
      const levels = d.fibLevels||DEFAULT_FIB_LEVELS;
      return (
        <g>
          {levels.filter(l=>l.visible).map((lvl,i) => (
            <circle key={i} cx={d.x1} cy={d.y1} r={r*lvl.pct} fill="none" stroke={lvl.color} strokeWidth={lw} opacity={0.75} />
          ))}
          {handles}
        </g>
      );
    }
    case "fibfan": {
      const levels = d.fibLevels||DEFAULT_FIB_LEVELS;
      return (
        <g>
          {levels.filter(l=>l.visible).map((lvl,i) => {
            const ty = d.y1 + (d.y2-d.y1)*lvl.pct;
            const dx=d.x2-d.x1, dy=ty-d.y1, len=Math.sqrt(dx*dx+dy*dy)||1;
            return <line key={i} x1={d.x1} y1={d.y1} x2={d.x1+(dx/len)*svgW*2} y2={d.y1+(dy/len)*svgW*2} stroke={lvl.color} strokeWidth={lw} opacity={0.75} />;
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
          <rect x={rx} y={ry} width={rw} height={rh} fill={col} fillOpacity={fillAlpha} stroke={col} strokeWidth={lw} />
          {handles}
        </g>
      );
    }
    case "triangle": {
      const pts = `${d.x1},${d.y1} ${d.x2},${d.y2} ${(d.x1+d.x2)/2},${Math.min(d.y1,d.y2)-Math.abs(d.y2-d.y1)*0.6}`;
      return <g><polygon points={pts} fill={col} fillOpacity={fillAlpha} stroke={col} strokeWidth={lw} />{handles}</g>;
    }
    case "ellipse": {
      const cx=(d.x1+d.x2)/2, cy=(d.y1+d.y2)/2;
      const rx2=Math.abs(d.x2-d.x1)/2, ry2=Math.abs(d.y2-d.y1)/2;
      return <g><ellipse cx={cx} cy={cy} rx={rx2} ry={ry2} fill={col} fillOpacity={fillAlpha} stroke={col} strokeWidth={lw} />{handles}</g>;
    }
    case "measure": {
      const diff = d.y1 - d.y2; // positive = price went up
      const mc = diff>=0?ui.green:ui.red;
      const rx=Math.min(d.x1,d.x2), ry=Math.min(d.y1,d.y2);
      const rw=Math.abs(d.x2-d.x1), rh=Math.abs(d.y2-d.y1);
      const mx=(d.x1+d.x2)/2, my=(d.y1+d.y2)/2;
      return (
        <g>
          <rect x={rx} y={ry} width={rw} height={rh} fill={mc} fillOpacity={0.1} stroke={mc} strokeWidth={lw} />
          <text x={mx} y={my-6} fill={mc} fontSize={11} fontWeight="bold" textAnchor="middle" fontFamily="JetBrains Mono,monospace">
            {diff>=0?"▲":"▼"} {Math.abs(rh).toFixed(0)}px
          </text>
          {handles}
        </g>
      );
    }
    case "text": {
      return (
        <g>
          <text x={d.x1} y={d.y1} fill={col} fontSize={d.fontSize||13} fontWeight={d.bold?"bold":"normal"} fontFamily="JetBrains Mono,monospace">
            {d.text||""}
          </text>
        </g>
      );
    }
    default: return null;
  }
}

// ─────────────────────────────────────────────
// CHART PANEL (main chart with all tools)
// ─────────────────────────────────────────────
function ChartPanel({
  candles, indicators, mode, symbol, timeframe,
  activeTool, onChangeTool,
  drawings, selectedId, onAdd, onSelect, onUpdate, onDelete, onClear, onToggleLock, onApplySettings,
}: {
  candles: CandleData[]; indicators: IndicatorData[];
  mode: ModeKey; symbol: string; timeframe: Timeframe;
  activeTool: DrawTool; onChangeTool: (t:DrawTool)=>void;
  drawings: Drawing[]; selectedId: string|null;
  onAdd: (d:Drawing)=>void;
  onSelect: (id:string|null)=>void;
  onUpdate: (id:string,p:Partial<Drawing>)=>void;
  onDelete: ()=>void;
  onClear: ()=>void;
  onToggleLock: ()=>void;
  onApplySettings: (d:Drawing)=>void;
}) {
  const mainRef = useRef<HTMLDivElement>(null);
  const volRef  = useRef<HTMLDivElement>(null);
  const rsiRef  = useRef<HTMLDivElement>(null);
  const svgRef  = useRef<SVGSVGElement>(null);

  const [svgSize, setSvgSize] = useState({ w:800, h:400 });
  const [draftP1, setDraftP1] = useState<{x:number;y:number}|null>(null);
  const [draftP2, setDraftP2] = useState<{x:number;y:number}|null>(null);
  const [clickCount, setClickCount] = useState(0);
  const [pendingTextPos, setPendingTextPos] = useState<{x:number;y:number}|null>(null);
  const [dragging, setDragging] = useState<{id:string;sx:number;sy:number;orig:Drawing}|null>(null);
  const [settingsDrawing, setSettingsDrawing] = useState<Drawing|null>(null);
  const [ctxMenu, setCtxMenu] = useState<{x:number;y:number;id:string}|null>(null);
  const [livePrice, setLivePrice] = useState(candles[candles.length-1]?.close??0);
  const [priceChange, setPriceChange] = useState(0);

  // Init lightweight-charts
  useEffect(()=>{
    if(!mainRef.current||!volRef.current||!rsiRef.current) return;
    const base = {
      layout:{ background:{type:ColorType.Solid,color:"transparent"}, textColor:"#7085ad", fontFamily:"JetBrains Mono,monospace", fontSize:10 },
      grid:{ vertLines:{color:"rgba(255,255,255,0.035)",style:1 as const}, horzLines:{color:"rgba(255,255,255,0.035)",style:1 as const} },
      crosshair:{ mode:CrosshairMode.Normal },
      rightPriceScale:{ borderColor:"rgba(255,255,255,0.08)" },
      timeScale:{ borderColor:"rgba(255,255,255,0.08)", timeVisible:true, secondsVisible:false },
      handleScroll:true, handleScale:true,
    };
    const mc: IChartApi = createChart(mainRef.current, { ...base, width:mainRef.current.clientWidth, height:mainRef.current.clientHeight });
    const cs = mc.addCandlestickSeries({ upColor:"#37f4ad", downColor:"#ff6c8d", borderUpColor:"#37f4ad", borderDownColor:"#ff6c8d", wickUpColor:"#37f4ad", wickDownColor:"#ff6c8d" });
    cs.setData(candles.map(c=>({time:c.time as Time, open:c.open, high:c.high, low:c.low, close:c.close})));
    const ma20 = mc.addLineSeries({ color:"#d2b000", lineWidth:1, priceLineVisible:false, lastValueVisible:false });
    ma20.setData(computeSMA(candles,20).map(d=>({time:d.time as Time, value:d.value})));
    const ma50 = mc.addLineSeries({ color:"#8b5cf6", lineWidth:1, priceLineVisible:false, lastValueVisible:false });
    ma50.setData(computeSMA(candles,50).map(d=>({time:d.time as Time, value:d.value})));
    const ema100 = mc.addLineSeries({ color:"#22d3ee", lineWidth:1, priceLineVisible:false, lastValueVisible:false });
    ema100.setData(computeEMA(candles,100).map(d=>({time:d.time as Time, value:d.value})));
    mc.timeScale().fitContent();
    const last=candles[candles.length-1], prev=candles[candles.length-2]??last;
    setLivePrice(last.close);
    setPriceChange(((last.close-prev.close)/prev.close)*100);

    const vc: IChartApi = createChart(volRef.current, { ...base, width:volRef.current.clientWidth, height:volRef.current.clientHeight,
      rightPriceScale:{visible:false,borderColor:"transparent"},
      timeScale:{visible:false,borderColor:"transparent"},
      grid:{vertLines:{color:"transparent",style:1 as const},horzLines:{color:"transparent",style:1 as const}},
    });
    const vs = vc.addHistogramSeries({ priceScaleId:"" });
    vs.setData(candles.map(c=>({time:c.time as Time, value:c.volume, color:c.close>=c.open?"rgba(55,244,173,0.42)":"rgba(255,108,141,0.42)"})));
    vc.timeScale().fitContent();

    const rc: IChartApi = createChart(rsiRef.current, { ...base, width:rsiRef.current.clientWidth, height:rsiRef.current.clientHeight });
    const rsiS = rc.addLineSeries({ color:"#8b5cf6", lineWidth:2, priceLineVisible:false, lastValueVisible:false });
    const mfiS = rc.addLineSeries({ color:"#d2b000", lineWidth:1, priceLineVisible:false, lastValueVisible:false });
    rsiS.setData(indicators.map(d=>({time:d.time as Time, value:clamp(d.rsi,0,100)})));
    mfiS.setData(indicators.map(d=>({time:d.time as Time, value:clamp(d.mfi,0,100)})));
    rc.timeScale().fitContent();

    mc.timeScale().subscribeVisibleLogicalRangeChange(r=>{
      if(r) { vc.timeScale().setVisibleLogicalRange(r); rc.timeScale().setVisibleLogicalRange(r); }
    });

    const resize = () => {
      if(mainRef.current) mc.applyOptions({width:mainRef.current.clientWidth,height:mainRef.current.clientHeight});
      if(volRef.current) vc.applyOptions({width:volRef.current.clientWidth,height:volRef.current.clientHeight});
      if(rsiRef.current) rc.applyOptions({width:rsiRef.current.clientWidth,height:rsiRef.current.clientHeight});
      if(svgRef.current) { const r=svgRef.current.getBoundingClientRect(); setSvgSize({w:r.width,h:r.height}); }
    };
    window.addEventListener("resize", resize);
    setTimeout(resize, 100);
    return () => { window.removeEventListener("resize",resize); mc.remove(); vc.remove(); rc.remove(); };
  }, [candles, indicators]);

  // Keyboard: Delete / Backspace = delete selected
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key==="Delete"||e.key==="Backspace") {
        const tag = (e.target as HTMLElement)?.tagName;
        if(tag==="INPUT"||tag==="TEXTAREA") return;
        e.preventDefault(); onDelete();
      }
      if (e.key==="Escape") { onSelect(null); setDraftP1(null); setDraftP2(null); setClickCount(0); }
      // shortcuts
      const map: Record<string,DrawTool> = { v:"cursor",t:"trendline",h:"hline",k:"vline",r:"ray",f:"fib",g:"rect",m:"measure",x:"text" };
      const tag2 = (e.target as HTMLElement)?.tagName;
      if(tag2==="INPUT"||tag2==="TEXTAREA") return;
      if(map[e.key]) onChangeTool(map[e.key]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDelete, onSelect, onChangeTool]);

  function getSVGPoint(clientX:number, clientY:number) {
    const el = svgRef.current; if(!el) return null;
    const rect = el.getBoundingClientRect();
    return { x:clamp(clientX-rect.left,0,rect.width), y:clamp(clientY-rect.top,0,rect.height) };
  }

  // SVG needs 2 or 3 clicks for some tools
  const needsThreeClicks = (t:DrawTool) => t==="pitchfork"||t==="triangle";

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if(e.button===2) return;
    const pt = getSVGPoint(e.clientX, e.clientY); if(!pt) return;

    if(activeTool==="cursor") {
      // hit test
      const hit = [...drawings].reverse().find(d => hitTest(d, pt.x, pt.y));
      onSelect(hit?.id??null);
      if(hit && !hit.locked) setDragging({ id:hit.id, sx:pt.x, sy:pt.y, orig:{...hit} });
      return;
    }
    if(activeTool==="text") { setPendingTextPos(pt); return; }

    if(clickCount===0) {
      setDraftP1(pt); setDraftP2(pt); setClickCount(1);
    } else if(clickCount===1) {
      if(needsThreeClicks(activeTool)) {
        setDraftP2(pt); setClickCount(2);
      } else {
        // finalize 2-point drawing
        if(draftP1) {
          const d = newDrawing(activeTool, draftP1.x, draftP1.y, pt.x, pt.y);
          onAdd(d); onSelect(d.id);
        }
        setDraftP1(null); setDraftP2(null); setClickCount(0);
        onChangeTool("cursor");
      }
    } else if(clickCount===2 && needsThreeClicks(activeTool)) {
      if(draftP1 && draftP2) {
        const d = newDrawing(activeTool, draftP1.x, draftP1.y, draftP2.x, draftP2.y, pt.x, pt.y);
        onAdd(d); onSelect(d.id);
      }
      setDraftP1(null); setDraftP2(null); setClickCount(0);
      onChangeTool("cursor");
    }
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const pt = getSVGPoint(e.clientX, e.clientY); if(!pt) return;
    if(clickCount>=1) setDraftP2(pt);
    if(dragging && e.buttons===1) {
      const dx=pt.x-dragging.sx, dy=pt.y-dragging.sy;
      const o=dragging.orig;
      onUpdate(dragging.id,{ x1:o.x1+dx,y1:o.y1+dy,x2:o.x2+dx,y2:o.y2+dy,
        x3:o.x3!==undefined?o.x3+dx:undefined, y3:o.y3!==undefined?o.y3+dy:undefined });
    }
  };

  const onPointerUp = () => setDragging(null);

  const onContextMenu = (e: React.MouseEvent<SVGSVGElement>) => {
    e.preventDefault();
    const pt = getSVGPoint(e.clientX,e.clientY); if(!pt) return;
    const hit = [...drawings].reverse().find(d=>hitTest(d,pt.x,pt.y));
    if(hit) { onSelect(hit.id); setCtxMenu({x:e.clientX,y:e.clientY,id:hit.id}); }
  };

  const onDblClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const pt = getSVGPoint(e.clientX,e.clientY); if(!pt) return;
    const hit = [...drawings].reverse().find(d=>hitTest(d,pt.x,pt.y));
    if(hit && activeTool==="cursor") { setSettingsDrawing(hit); return; }
    if(activeTool==="cursor") {
      // quick hline
      const d = newDrawing("hline", pt.x, pt.y, pt.x+100, pt.y);
      onAdd(d); onSelect(d.id);
    }
  };

  const selectedDrawing = drawings.find(d=>d.id===selectedId)??null;
  const isPositive = priceChange>=0;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", width:"100%", minWidth:0, background:"linear-gradient(180deg,rgba(7,12,24,0.98),rgba(6,10,18,0.98))" }}>
      {/* Chart header */}
      <div style={{ padding:"8px 10px", borderBottom:`1px solid ${ui.border}`, background:"linear-gradient(180deg,rgba(12,19,36,0.94),rgba(8,13,25,0.94))" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1.4fr repeat(4,0.7fr) auto", gap:8, alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
            <div style={{ width:24, height:24, borderRadius:7, background:"rgba(247,201,72,0.16)", color:ui.yellow, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:900 }}>SC</div>
            <div>
              <div style={{ color:"#eef6ff", fontSize:14, fontWeight:900 }}>{symbol}</div>
              <div style={{ color:"#7d91b6", fontSize:10, fontWeight:700 }}>
                PROMETEUS • {activeTool==="cursor"?"Cursor":TOOL_GROUPS.flatMap(g=>g.items).find(i=>i.key===activeTool)?.label||activeTool} • TF: {timeframe}
              </div>
            </div>
          </div>
          {[
            ["Preço", livePrice.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}), "#4ef0cb"],
            ["Variação", `${isPositive?"+":""}${priceChange.toFixed(2)}%`, isPositive?ui.green:ui.red],
            ["Volume", formatCompact(candles[candles.length-1]?.volume??0), ui.cyan],
            ["Desenhos", String(drawings.filter(d=>!d.hidden).length), selectedDrawing?ui.yellow:ui.red],
          ].map(([title,value,color])=>(
            <div key={String(title)} style={{ borderRadius:13, border:"1px solid rgba(255,255,255,0.06)", background:"linear-gradient(180deg,rgba(8,15,31,0.98),rgba(7,12,24,0.96))", minHeight:58, padding:"10px 13px" }}>
              <div style={{ color:"#7f93b7", fontSize:9, fontWeight:900, letterSpacing:0.8, textTransform:"uppercase", marginBottom:6 }}>{title}</div>
              <div style={{ color:color as string, fontSize:12, fontWeight:900 }}>{value}</div>
            </div>
          ))}
          <div style={{ display:"flex", gap:6, justifyContent:"flex-end", flexWrap:"wrap" }}>
            <TopButton active={mode==="auto"}>Auto</TopButton>
            <TopButton active={mode==="manual"}>Manual</TopButton>
            <TopButton>Zoom -</TopButton>
            <TopButton>Zoom +</TopButton>
            <TopButton>Agora</TopButton>
            <TopButton>Reset</TopButton>
          </div>
        </div>
      </div>

      {/* Drawing toolbar */}
      <div style={{ height:32, padding:"0 10px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:`1px solid ${ui.border}`, background:"rgba(255,255,255,0.015)", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <TopButton active={!!selectedDrawing}>Objetos</TopButton>
          <TopButton active={!!selectedDrawing?.locked} onClick={onToggleLock}>🔒 Travar</TopButton>
          <TopButton onClick={()=>selectedId&&setSettingsDrawing(drawings.find(d=>d.id===selectedId)||null)}>⚙ Configurar</TopButton>
          <TopButton onClick={onDelete}>✕ Apagar sel.</TopButton>
          <TopButton onClick={onClear}>🗑 Limpar</TopButton>
          <div style={{ width:1, height:16, background:"#172133", margin:"0 4px" }} />
          <span style={{ fontSize:9, color:"#536887" }}>Cor:</span>
          {["#ffd54f","#00d4ff","#00e676","#ff3060","#c77dff"].map(c=>(
            <div key={c} onClick={()=>{ if(selectedId) onUpdate(selectedId,{color:c}); }}
              style={{ width:14, height:14, borderRadius:3, background:c, cursor:"pointer", border:"1px solid transparent" }} />
          ))}
        </div>
        <div style={{ color:"#7f93b7", fontSize:10, fontWeight:800 }}>
          {selectedDrawing
            ? `${TOOL_GROUPS.flatMap(g=>g.items).find(i=>i.key===selectedDrawing.tool)?.label||selectedDrawing.tool} ${selectedDrawing.locked?"🔒":""}${selectedDrawing.hidden?"🙈":""}  |  Del = apagar  |  Duplo clique = configurar`
            : activeTool!=="cursor"?"Clique para iniciar o desenho • Esc = cancelar":"Cursor livre  |  Duplo clique no gráfico = linha horizontal rápida"}
        </div>
      </div>

      {/* Canvas */}
      <div style={{ position:"relative", flex:1, minHeight:0 }}>
        <div ref={mainRef} style={{ position:"absolute", inset:0 }} />
        <svg ref={svgRef}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp} onContextMenu={onContextMenu} onDoubleClick={onDblClick}
          style={{ position:"absolute", inset:0, width:"100%", height:"100%", zIndex:3,
            cursor: activeTool==="cursor"?"default":"crosshair",
            pointerEvents: activeTool!=="cursor"||drawings.length>0?"auto":"none" }}
          viewBox={`0 0 ${svgSize.w} ${svgSize.h}`} preserveAspectRatio="none">

          {/* Existing drawings */}
          {drawings.filter(d=>!d.hidden).map(d => (
            <g key={d.id} style={{ opacity:d.hidden?0:1 }}>
              {renderDrawing(d, svgSize.w, svgSize.h, d.id===selectedId)}
            </g>
          ))}

          {/* Draft preview */}
          {draftP1 && draftP2 && activeTool!=="cursor" && (() => {
            const preview = newDrawing(activeTool, draftP1.x, draftP1.y, draftP2.x, draftP2.y);
            return <g opacity={0.6}>{renderDrawing(preview, svgSize.w, svgSize.h, false)}</g>;
          })()}
        </svg>
        <div ref={volRef} style={{ position:"absolute", left:0, right:0, bottom:0, height:140, pointerEvents:"none", opacity:0.95, borderTop:"1px solid rgba(255,255,255,0.05)", zIndex:2 }} />
      </div>

      {/* RSI/MFI panel */}
      <div style={{ width:"100%", flexShrink:0, borderTop:`1px solid ${ui.border}`, borderBottom:`1px solid ${ui.border}`, background:"#0a0f1d" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"5px 14px" }}>
          <span style={{ color:"#7f93b7", fontSize:10, fontFamily:"monospace" }}>RSI / MFI</span>
          <span style={{ display:"flex", alignItems:"center", gap:4, color:"#dce8ff", fontSize:10 }}><span style={{ width:12, height:2, background:"#8b5cf6", display:"inline-block" }}/>RSI</span>
          <span style={{ display:"flex", alignItems:"center", gap:4, color:"#dce8ff", fontSize:10 }}><span style={{ width:12, height:2, background:"#d2b000", display:"inline-block" }}/>MFI</span>
        </div>
        <div ref={rsiRef} style={{ height:112, width:"100%" }} />
      </div>

      {/* Modals */}
      {pendingTextPos && (
        <TextInputModal color={TOOL_COLORS.text}
          onConfirm={(text,size,bold)=>{
            const pt = pendingTextPos;
            const d = newDrawing("text", pt.x, pt.y, pt.x+120, pt.y);
            d.text=text; d.fontSize=size; d.bold=bold;
            onAdd(d); onSelect(d.id);
            setPendingTextPos(null); onChangeTool("cursor");
          }}
          onClose={()=>{ setPendingTextPos(null); onChangeTool("cursor"); }} />
      )}
      {settingsDrawing && (
        <DrawingSettingsModal drawing={settingsDrawing}
          onApply={d=>{ onApplySettings(d); setSettingsDrawing(null); }}
          onClose={()=>setSettingsDrawing(null)} />
      )}
      {ctxMenu && (() => {
        const d = drawings.find(x=>x.id===ctxMenu.id);
        if(!d) return null;
        return <ContextMenu x={ctxMenu.x} y={ctxMenu.y} drawing={d}
          onSettings={()=>{ setSettingsDrawing(d); setCtxMenu(null); }}
          onDelete={()=>{ onSelect(ctxMenu.id); onDelete(); setCtxMenu(null); }}
          onToggleLock={()=>{ onUpdate(ctxMenu.id,{locked:!d.locked}); setCtxMenu(null); }}
          onToggleHide={()=>{ onUpdate(ctxMenu.id,{hidden:!d.hidden}); setCtxMenu(null); }}
          onClose={()=>setCtxMenu(null)} />;
      })()}
    </div>
  );
}

// simple hit test on SVG coords
function hitTest(d: Drawing, mx: number, my: number): boolean {
  const pad = 10;
  if(d.tool==="hline") return Math.abs(my-d.y1)<pad;
  if(d.tool==="vline") return Math.abs(mx-d.x1)<pad;
  if(d.tool==="rect"||d.tool==="fib"||d.tool==="fibext"||d.tool==="measure"||d.tool==="ellipse") {
    return mx>=Math.min(d.x1,d.x2)-pad&&mx<=Math.max(d.x1,d.x2)+pad&&my>=Math.min(d.y1,d.y2)-pad&&my<=Math.max(d.y1,d.y2)+pad;
  }
  if(d.tool==="text") {
    return mx>=d.x1-pad&&mx<=d.x1+200&&my>=d.y1-20&&my<=d.y1+pad;
  }
  // Line-based: distance to segment
  const dx=d.x2-d.x1, dy=d.y2-d.y1;
  const t=Math.max(0,Math.min(1,((mx-d.x1)*dx+(my-d.y1)*dy)/(dx*dx+dy*dy+0.001)));
  const dist=Math.sqrt((mx-d.x1-t*dx)**2+(my-d.y1-t*dy)**2);
  return dist<pad;
}

// ─────────────────────────────────────────────
// (All other panels kept from original — TopBar, ModuleStrip, AIInsightPanel, etc.)
// ─────────────────────────────────────────────
function TopBar({ symbol, price, change, timeframe, onTimeframeChange }: { symbol:string; price:number; change:number; timeframe:Timeframe; onTimeframeChange:(tf:Timeframe)=>void }) {
  const [replayMode, setReplayMode] = useState(false);
  const pos = change>=0;
  return (
    <div style={{ height:64, padding:"0 14px", display:"flex", alignItems:"center", gap:10, borderBottom:`1px solid ${ui.border}`, background:"radial-gradient(circle at top,rgba(14,28,60,0.86),rgba(6,10,20,0.98) 55%)", flexShrink:0 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginRight:8 }}>
        <div style={{ width:38, height:38, borderRadius:11, background:"linear-gradient(135deg,rgba(42,231,255,0.22),rgba(119,77,255,0.28))", border:"1px solid rgba(255,255,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 24px rgba(46,226,255,0.16)" }}>
          <Activity size={17} color="#e8f7ff" />
        </div>
        <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
          <span style={{ color:"#f6fbff", fontSize:17, fontWeight:900, letterSpacing:0.3 }}>PROMETEUS</span>
          <span style={{ color:ui.cyan, fontSize:10, fontWeight:900, background:"rgba(45,226,255,0.1)", padding:"3px 6px", borderRadius:999 }}>PRO</span>
        </div>
      </div>
      <div style={{ width:1, height:30, background:"rgba(255,255,255,0.08)" }} />
      <button style={{ display:"inline-flex", alignItems:"center", gap:7, height:36, padding:"0 12px", borderRadius:10, border:"1px solid rgba(255,255,255,0.07)", background:"linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))", color:"#eef6ff", fontSize:13, fontWeight:800, cursor:"pointer" }}>
        <span style={{ color:ui.yellow }}>₿</span>{symbol}<ChevronDown size={13} color="#8295bb" />
      </button>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ color:"#f6fbff", fontSize:13, fontFamily:"monospace", fontWeight:900 }}>${price.toLocaleString()}</span>
        <span style={{ color:pos?ui.green:ui.red, fontSize:12, fontFamily:"monospace", fontWeight:900 }}>{pos?"+":""}{change.toFixed(2)}%</span>
      </div>
      <div style={{ width:1, height:30, background:"rgba(255,255,255,0.08)" }} />
      <div style={{ display:"flex", alignItems:"center", gap:4 }}>
        {TIMEFRAMES.map(tf=><TopButton key={tf} active={timeframe===tf} onClick={()=>onTimeframeChange(tf)}>{tf}</TopButton>)}
      </div>
      <div style={{ width:1, height:30, background:"rgba(255,255,255,0.08)" }} />
      <button onClick={()=>setReplayMode(!replayMode)} style={{ display:"inline-flex", alignItems:"center", gap:6, height:32, padding:"0 10px", borderRadius:10,
        border:replayMode?"1px solid rgba(247,201,72,0.34)":"1px solid transparent",
        background:replayMode?"linear-gradient(180deg,rgba(247,201,72,0.16),rgba(247,201,72,0.04))":"transparent",
        color:replayMode?ui.yellow:"#8da1c7", fontSize:12, fontWeight:800, cursor:"pointer" }}>
        <RotateCcw size={12} />Replay
      </button>
      <div style={{ flex:1 }} />
      <div style={{ display:"flex", alignItems:"center", gap:2 }}>
        {NAV_TABS.map((tab,i)=><TopButton key={tab} active={i===0}>{tab}</TopButton>)}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginLeft:8 }}>
        <span style={{ color:pos?ui.green:ui.red, fontSize:12, fontWeight:900 }}>{pos?"+":""}{change.toFixed(2)}%</span>
        <Search size={15} color="#90a4c8" /><Bell size={15} color="#90a4c8" /><Settings size={15} color="#90a4c8" />
      </div>
    </div>
  );
}

function ModuleStrip({ activeModule, onChange }: { activeModule:TopModuleKey; onChange:(m:TopModuleKey)=>void }) {
  const icons: Record<TopModuleKey, React.ReactNode> = {
    Fluxo:<Waves size={13}/>, Singularidade:<BrainCircuit size={13}/>, "IA Atlas":<Activity size={13}/>,
    Scanner:<ScanSearch size={13}/>, "Mestre Scanner":<Star size={13}/>, Estrutura:<Layers3 size={13}/>,
    Euler:<Sigma size={13}/>, Liquidez:<Droplets size={13}/>,
  };
  return (
    <div style={{ height:50, padding:"0 16px", display:"flex", alignItems:"center", gap:10, borderBottom:`1px solid ${ui.border}`, background:"linear-gradient(180deg,rgba(8,12,23,0.98),rgba(7,11,20,0.98))", flexShrink:0 }}>
      {TOP_MODULES.map(m=><ModuleButton key={m} icon={icons[m]} text={m} active={activeModule===m} onClick={()=>onChange(m)} />)}
    </div>
  );
}

function AIInsightPanel({ insight, topModule }: { insight:AIInsight; topModule:TopModuleKey }) {
  const scoreColor = insight.score>=80?ui.green:insight.score>=60?ui.yellow:ui.red;
  return (
    <div style={{ height:"100%", background:"linear-gradient(180deg,rgba(6,10,20,0.98),rgba(4,7,15,0.98))", overflowY:"auto" }}>
      <div style={{ padding:"12px 16px", borderBottom:`1px solid ${ui.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ color:"#e8f1ff", fontSize:12, fontWeight:800, letterSpacing:0.45 }}>IA Atlas Insights</span>
        <ChevronDown size={14} color="#6c7da2" />
      </div>
      <div style={{ padding:16, borderBottom:`1px solid ${ui.border}` }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ color:ui.yellow, fontSize:12 }}>₿</span>
            <span style={{ color:"#d8e6ff", fontSize:12, fontFamily:"monospace" }}>{insight.symbol}</span>
          </div>
          <span style={{ color:"#96a8cb", fontSize:12, fontFamily:"monospace" }}>{insight.price.toLocaleString()}</span>
        </div>
        <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between" }}>
          <span style={{ color:"#f3f8ff", fontSize:19, fontWeight:900 }}>{insight.symbol}</span>
          <div style={{ display:"flex", alignItems:"flex-end", gap:6 }}>
            <span style={{ color:scoreColor, fontSize:20, fontWeight:900 }}>{insight.score}</span>
            <TrendingUp size={14} color={scoreColor} />
          </div>
        </div>
        <div style={{ marginTop:10, display:"grid", gridTemplateColumns:"1fr auto", gap:8, alignItems:"center" }}>
          <div style={{ height:6, borderRadius:999, background:"rgba(255,255,255,0.08)", overflow:"hidden" }}>
            <div style={{ width:`${insight.score}%`, height:"100%", borderRadius:999, background:"linear-gradient(90deg,rgba(49,233,255,0.95),rgba(36,245,155,0.95))" }} />
          </div>
          <div style={{ padding:"5px 10px", borderRadius:7, background:`${scoreColor}22`, color:scoreColor, fontSize:11, fontWeight:900 }}>{insight.signal}</div>
        </div>
        <div style={{ marginTop:14 }}>
          {[["Risco",insight.riskLevel,ui.yellow],["Tipo",insight.riskType,ui.red],["Invalidação",`$${insight.invalidation.toLocaleString()}`,"#eef5ff"],["Fonte","binance","#d9e8ff"]].map(([k,v,c])=>(
            <div key={String(k)} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ color:"#7f93b7", fontSize:13 }}>{k}</span>
              <span style={{ color:c as string, fontSize:12, fontWeight:800 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding:"12px 16px 4px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
          <span style={{ color:"#e8f1ff", fontSize:12, fontWeight:800 }}>Estrutura</span>
          <ChevronRight size={12} color="#6c7da2" />
        </div>
        {insight.structure.map((item,i)=><StructureRow key={i} item={item} />)}
      </div>
      <div style={{ margin:12, borderRadius:14, border:"1px solid rgba(255,255,255,0.06)", background:"linear-gradient(180deg,rgba(9,15,29,0.98),rgba(7,12,24,0.98))", padding:12 }}>
        <div style={{ color:"#ecf4ff", fontSize:12, fontWeight:900, marginBottom:10 }}>{topModule}</div>
        {[["Estrutura",insight.structure[0]?.value||"Neutro",ui.green],["Momentum",insight.structure[1]?.value||"Moderado","#9fffbc"],
          ["Confluência",`${Math.max(2,Math.min(9,Math.round(insight.score/11)))} / 9`,ui.green],
          ["Razão de Prata",insight.structure2[1]?.value||"Estável",ui.green],["Ciclo",insight.score>=75?"Acelerado":"Normal",ui.cyan]
        ].map(([a,b,c])=>(
          <div key={String(a)} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid rgba(255,255,255,0.04)", fontSize:12 }}>
            <span style={{ color:"#8397bd" }}>{a}</span><span style={{ color:c as string, fontWeight:800 }}>{b}</span>
          </div>
        ))}
      </div>
      <div style={{ padding:"0 16px 16px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
          <span style={{ color:"#e8f1ff", fontSize:12, fontWeight:800 }}>Confluência</span>
          <ChevronRight size={12} color="#6c7da2" />
        </div>
        {insight.structure2.map((item,i)=><StructureRow key={i} item={item} />)}
      </div>
    </div>
  );
}

// Scanner panels (unchanged from original, abbreviated for brevity — full code below)
function ScannerPanelContinuous({ assets, selectedSymbol, onSelectSymbol }: { assets:AssetScore[]; selectedSymbol:string; onSelectSymbol:(s:string)=>void }) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(()=> search.trim()?assets.filter(a=>a.symbol.toLowerCase().includes(search.toLowerCase())):assets,[assets,search]);
  const sparks = useMemo(()=>filtered.map(a=>generateSparkline(24,40+Math.random()*40,a.trend)),[filtered]);
  return (
    <div style={{ height:"100%", borderRadius:12, border:`1px solid ${ui.border}`, background:"linear-gradient(180deg,rgba(7,10,19,0.98),rgba(5,8,15,0.98))", display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <div style={{ padding:"10px 12px 8px", borderBottom:`1px solid ${ui.border}`, display:"grid", gap:8, flexShrink:0 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 178px", gap:10, alignItems:"center" }}>
          <span style={{ color:"#f1f7ff", fontSize:13, fontWeight:900 }}>SCANNER</span>
          <div style={{ display:"flex", alignItems:"center", gap:8, height:32, padding:"0 10px", borderRadius:9, border:"1px solid rgba(255,255,255,0.06)", background:"rgba(255,255,255,0.03)" }}>
            <Search size={13} color="#8ca0c6" />
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..." style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"#e9f3ff", fontSize:11 }} />
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1.1fr 0.92fr 0.98fr 0.92fr 1fr", gap:10, color:"#6c7da2", fontSize:11 }}>
          <span>Ativo</span><span>Sinal</span><span>Preço</span><span>RSI/MFI</span><span>Chart</span>
        </div>
      </div>
      <div data-atlas-scroll="cyan" style={{ flex:1, overflowY:"auto" }}>
        {filtered.map((a,i)=>(
          <div key={a.symbol} onClick={()=>onSelectSymbol(a.symbol)}
            style={{ display:"grid", gridTemplateColumns:"1.1fr 0.92fr 0.98fr 0.92fr 1fr", gap:10, padding:"11px 12px", borderBottom:"1px solid rgba(255,255,255,0.045)", alignItems:"center", cursor:"pointer",
              background:a.symbol===selectedSymbol?"linear-gradient(90deg,rgba(247,201,72,0.10),rgba(45,226,255,0.06))":"transparent" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ width:7, height:7, borderRadius:"50%", background:a.color, display:"inline-block" }} />
              <span style={{ color:"#edf5ff", fontSize:12, fontWeight:800 }}>{a.symbol}</span>
            </div>
            <ScoreBar value={a.volumeScore} />
            <div style={{ display:"flex", flexDirection:"column" }}>
              <span style={{ color:"#eef5ff", fontSize:12, fontFamily:"monospace" }}>${a.price.toLocaleString()}</span>
              <span style={{ color:a.change>=0?ui.green:ui.red, fontSize:12, fontFamily:"monospace", fontWeight:800 }}>{a.change>=0?"+":""}{a.change.toFixed(1)}%</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              {a.trend==="up"?<TrendingUp size={11} color={ui.green}/>:a.trend==="down"?<TrendingDown size={11} color={ui.red}/>:<Activity size={11} color="#a2b3d3"/>}
              <span style={{ color:"#8fd6ff", fontSize:12, fontFamily:"monospace" }}>{a.rsiMfi.toFixed(1)}</span>
            </div>
            <MiniSparkline data={sparks[i]} trend={a.trend} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ROOT COMPONENT
// ─────────────────────────────────────────────
export default function Prometeus() {
  const [timeframe, setTimeframe] = useState<Timeframe>("15m");
  const [activeModule, setActiveModule] = useState<TopModuleKey>("Scanner");
  const [activeTool, setActiveTool] = useState<DrawTool>("cursor");
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [selectedId, setSelectedId] = useState<string|null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState("BTC");

  const scannerAssets = useMemo<AssetScore[]>(()=>[
    { symbol:"BTC", volumeScore:82.41, rsiMfi:64.82, price:74682, change:2.8, trend:"up", color:"#27f59d", aiScore:84, signal:"COMPRA", riskLevel:"Moderado", riskType:"Volatilidade", invalidation:69180.6 },
    { symbol:"ETH", volumeScore:73.35, rsiMfi:58.1, price:3932, change:2.58, trend:"up", color:"#31c8ff", aiScore:79, signal:"COMPRA", riskLevel:"Moderado", riskType:"Pullback", invalidation:3560 },
    { symbol:"SOL", volumeScore:61.18, rsiMfi:43.7, price:174.8, change:3.06, trend:"up", color:"#ffb14a", aiScore:76, signal:"COMPRA", riskLevel:"Moderado", riskType:"Aceleração", invalidation:166 },
    { symbol:"BNB", volumeScore:69.08, rsiMfi:52.2, price:610.75, change:0.43, trend:"neutral", color:"#f7c948", aiScore:61, signal:"NEUTRO", riskLevel:"Moderado", riskType:"Consolidação", invalidation:584 },
    { symbol:"XRP", volumeScore:55.63, rsiMfi:39.9, price:2.147, change:-1.1, trend:"down", color:"#a783ff", aiScore:36, signal:"BAIXA", riskLevel:"Moderado", riskType:"Pressão", invalidation:2.32 },
    { symbol:"DOGE", volumeScore:66.14, rsiMfi:57.6, price:0.387, change:-0.81, trend:"down", color:"#22c55e", aiScore:52, signal:"NEUTRO", riskLevel:"Moderado", riskType:"Volatilidade", invalidation:0.35 },
    { symbol:"AVAX", volumeScore:71.44, rsiMfi:61.82, price:38.87, change:3.48, trend:"up", color:"#31e9ff", aiScore:77, signal:"COMPRA", riskLevel:"Moderado", riskType:"Aceleração", invalidation:35.4 },
    { symbol:"DOT", volumeScore:60.22, rsiMfi:49.5, price:8.98, change:2.15, trend:"up", color:"#ff4fa3", aiScore:68, signal:"COMPRA", riskLevel:"Moderado", riskType:"Faixa", invalidation:8.1 },
    { symbol:"ADA", volumeScore:62.5, rsiMfi:51.8, price:0.847, change:3.21, trend:"up", color:"#00d8ff", aiScore:71, signal:"COMPRA", riskLevel:"Moderado", riskType:"Pullback", invalidation:0.79 },
    { symbol:"ARB", volumeScore:44.62, rsiMfi:48.3, price:1.21, change:0.5, trend:"neutral", color:"#52b6ff", aiScore:54, signal:"NEUTRO", riskLevel:"Moderado", riskType:"Faixa", invalidation:1.12 },
  ],[]);

  const activeAsset = useMemo(()=>scannerAssets.find(a=>a.symbol===selectedSymbol)??scannerAssets[0],[scannerAssets,selectedSymbol]);
  const candles = useMemo(()=>generateCandles(240,symbolBasePrice(activeAsset.symbol)),[activeAsset.symbol]);
  const indicators = useMemo(()=>generateIndicators(candles),[candles]);
  const insight = useMemo(()=>symbolToInsight(activeAsset),[activeAsset]);

  const addDrawing = useCallback((d:Drawing)=>setDrawings(p=>[...p,d]),[]);
  const updateDrawing = useCallback((id:string,patch:Partial<Drawing>)=>setDrawings(p=>p.map(d=>d.id===id?{...d,...patch}:d)),[]);
  const deleteSelected = useCallback(()=>{ if(!selectedId) return; setDrawings(p=>p.filter(d=>d.id!==selectedId)); setSelectedId(null); },[selectedId]);
  const clearDrawings = useCallback(()=>{ setDrawings([]); setSelectedId(null); },[]);
  const toggleLock = useCallback(()=>{ if(!selectedId) return; setDrawings(p=>p.map(d=>d.id===selectedId?{...d,locked:!d.locked}:d)); },[selectedId]);
  const applySettings = useCallback((d:Drawing)=>setDrawings(p=>p.map(x=>x.id===d.id?d:x)),[]);

  const showScanner = activeModule==="Scanner"||activeModule==="Mestre Scanner";

  return (
    <div style={{ width:"100%", height:"100vh", display:"flex", flexDirection:"column", overflow:"hidden", background:ui.bg, color:ui.text, fontFamily:"Inter, Arial, sans-serif" }}>
      <style>{`
        [data-atlas-scroll="cyan"]{scrollbar-width:thin;scrollbar-color:rgba(45,226,255,0.55) rgba(255,255,255,0.04);}
        [data-atlas-scroll="cyan"]::-webkit-scrollbar{width:8px;height:8px;}
        [data-atlas-scroll="cyan"]::-webkit-scrollbar-track{background:rgba(255,255,255,0.03);border-radius:999px;}
        [data-atlas-scroll="cyan"]::-webkit-scrollbar-thumb{background:linear-gradient(180deg,rgba(45,226,255,0.72),rgba(0,216,255,0.38));border-radius:999px;border:1px solid rgba(45,226,255,0.18);}
        input[type=range]{accent-color:#2de2ff;}
        select{appearance:none;}
        button{font-family:inherit;}
      `}</style>

      <TopBar symbol={activeAsset.symbol} price={activeAsset.price} change={activeAsset.change} timeframe={timeframe} onTimeframeChange={setTimeframe} />
      <ModuleStrip activeModule={activeModule} onChange={setActiveModule} />

      <div style={{ display:"flex", minHeight:0, flex:1 }}>
        <LeftToolbar activeTool={activeTool} onChangeTool={setActiveTool} />

        <div style={{ flex:1, minWidth:0, minHeight:0 }}>
          <div style={{ display:"grid", gridTemplateColumns:"minmax(0,1fr) 320px", height:"100%", minHeight:0 }}>
            <div style={{ minWidth:0, minHeight:0 }}>
              {activeModule==="Scanner" ? (
                <ChartPanel
                  candles={candles} indicators={indicators} mode="auto"
                  symbol={activeAsset.symbol} timeframe={timeframe}
                  activeTool={activeTool} onChangeTool={setActiveTool}
                  drawings={drawings} selectedId={selectedId}
                  onAdd={addDrawing} onSelect={setSelectedId}
                  onUpdate={updateDrawing} onDelete={deleteSelected}
                  onClear={clearDrawings} onToggleLock={toggleLock}
                  onApplySettings={applySettings}
                />
              ) : (
                <div style={{ height:"100%", padding:10, overflow:"auto", color:"#8ea2c8", fontSize:13, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ color:ui.cyan, fontSize:24, fontWeight:900, marginBottom:8 }}>⚡ {activeModule}</div>
                    <div>Selecione o módulo <strong style={{color:ui.yellow}}>Scanner</strong> para ver o gráfico com todas as ferramentas de desenho.</div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ minWidth:0, minHeight:0, borderLeft:`1px solid ${ui.border}`, background:"linear-gradient(180deg,rgba(7,11,20,0.98),rgba(4,7,14,0.98))", display:"grid", gridTemplateRows:showScanner?"1fr":"1fr auto" }}>
              <AIInsightPanel insight={insight} topModule={activeModule} />
              {!showScanner && (
                <div style={{ borderTop:`1px solid ${ui.border}`, padding:10, background:"rgba(255,255,255,0.015)" }}>
                  <ScannerPanelContinuous assets={scannerAssets.slice(0,6)} selectedSymbol={selectedSymbol} onSelectSymbol={setSelectedSymbol} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
