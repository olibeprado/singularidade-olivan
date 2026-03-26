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
  ScanSearch,
  Search,
  Settings,
  Sigma,
  Star,
  TrendingDown,
  TrendingUp,
  Waves,
} from "lucide-react";

// ============================================================
// TIPOS & CONSTANTES
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

// CORREÇÃO DE TIPO AQUI: Explicitação da estrutura para evitar erro de inferência
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
  rect: "#00d4ff",
  triangle: "#00e676",
  ellipse: "#ff9100",
  measure: "#00e676",
  text: "#ffffff",
} as const;

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

function hitTestDrawing(d: Drawing, mx: number, my: number): boolean {
  const pad = 10;
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
  const dx = d.x2 - d.x1, dy = d.y2 - d.y1;
  const t = Math.max(0, Math.min(1, ((mx - d.x1) * dx + (my - d.y1) * dy) / (dx * dx + dy * dy + 0.001)));
  return Math.sqrt((mx - d.x1 - t * dx) ** 2 + (my - d.y1 - t * dy) ** 2) < pad;
}

function renderDrawingSVG(
  d: Drawing,
  svgW: number,
  svgH: number,
  selected: boolean
): React.ReactNode {
  // ... (mantenha toda a lógica de renderização existente, pois ela já era válida)
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
          {d.label && <text x={6} y={d.y1-4} fill={col} fontSize={9} fontFamily="monospace" fontWeight="bold">{d.label}</text>}
          {sel && <circle cx={svgW/2} cy={d.y1} r={5} fill="#fff" stroke={col} strokeWidth={1.5} />}
        </g>
      );
    case "vline":
      return (
        <g>
          <line x1={d.x1} y1={0} x2={d.x1} y2={svgH} stroke={col} strokeWidth={lw} strokeDasharray={dash || undefined} />
          {sel && <circle cx={d.x1} cy={svgH/2} r={5} fill="#fff" stroke={col} strokeWidth={1.5} />}
        </g>
      );
    case "trendline": {
      const angle = Math.atan2(d.y2-d.y1, d.x2-d.x1);
      return (
        <g>
          <line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} stroke={col} strokeWidth={lw} strokeDasharray={dash || undefined} />
          {d.showArrow !== false && (
            <polygon fill={col} points={`${d.x2},${d.y2} ${d.x2-12*Math.cos(angle-0.4)},${d.y2-12*Math.sin(angle-0.4)} ${d.x2-12*Math.cos(angle+0.4)},${d.y2-12*Math.sin(angle+0.4)}`} />
          )}
          {handles}
        </g>
      );
    }
    // Adicione os outros casos conforme necessário...
    default:
      return <line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} stroke={col} strokeWidth={lw} />;
  }
}

// Toolbar Left (simplificado)
const TOOL_GROUPS_CONFIG = [
  { title: "CURSOR", items: [{ key: "cursor" as DrawTool, icon: "↖" }] },
  { title: "LINHAS", items: [{ key: "trendline" as DrawTool, icon: "╱" }, { key: "hline" as DrawTool, icon: "─" }, { key: "vline" as DrawTool, icon: "│" }] },
  { title: "FIB", items: [{ key: "fib" as DrawTool, icon: "FIB" }] },
  { title: "FORMAS", items: [{ key: "rect" as DrawTool, icon: "▭" }] },
];

function DrawingToolbar({ activeTool, onChangeTool }: { activeTool: DrawTool; onChangeTool: (t: DrawTool) => void }) {
  return (
    <div style={{ width: 52, borderRight: "1px solid #172133", background: "#0a0f1d", display: "flex", flexDirection: "column", padding: "8px 6px", gap: 2 }}>
      {TOOL_GROUPS_CONFIG.map((group, gi) => (
        <div key={gi}>
           {/* Implementação visual do toolbar */}
           <button onClick={() => onChangeTool(group.items[0].key)} style={{color: activeTool === group.items[0].key ? "#2de2ff" : "#fff"}}>{group.items[0].icon}</button>
        </div>
      ))}
    </div>
  );
}

// UI Constants
const ui = {
  bg: "#060913", border: "#172133", text: "#ebf3ff", mut: "#7f93b7",
  cyan: "#2de2ff", green: "#27f59d", yellow: "#f7c948", red: "#ff6b86",
};

type Timeframe = "1m" | "5m" | "15m" | "30m" | "1H" | "4H" | "1D";
type TopModuleKey = "Fluxo" | "Singularidade" | "IA Atlas" | "Scanner" | "Mestre Scanner" | "Estrutura" | "Euler" | "Liquidez";

type CandleData = { time: number; open: number; high: number; low: number; close: number; volume: number };
type IndicatorData = { time: number; rsi: number; mfi: number };
type AssetScore = { symbol: string; price: number; change: number; aiScore: number; signal: string; riskLevel: string; riskType: string; invalidation: number; };
type AIInsight = { symbol: string; price: number; score: number; signal: string; riskLevel: string; riskType: string; invalidation: number; structure: any[]; structure2: any[]; trendBias: any };

// Utils
function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }
function generateCandles(count = 240, startPrice = 74500): CandleData[] {
  const now = Math.floor(Date.now() / 1000);
  const candles: CandleData[] = []; let prevClose = startPrice;
  for (let i = count; i > 0; i--) {
    const time = now - i * 300;
    const wave = Math.sin(i / 11) * (startPrice * 0.0045) + Math.cos(i / 17) * (startPrice * 0.0022);
    const drift = (Math.random() - 0.49) * (startPrice * 0.0065) + wave;
    const open = prevClose, close = Math.max(0.0001, open + drift);
    const high = Math.max(open, close) + Math.random() * (startPrice * 0.0035), low = Math.min(open, close) - Math.random() * (startPrice * 0.0035);
    candles.push({ time, open, high, low, close, volume: 120 + Math.random() * 1400 });
    prevClose = close;
  }
  return candles;
}
function generateIndicators(candles: CandleData[]): IndicatorData[] {
  return candles.map((c, i) => ({ time: c.time, rsi: clamp(48 + Math.sin(i / 8) * 14 + (Math.random() - 0.5) * 6, 5, 95), mfi: clamp(52 + Math.cos(i / 10) * 16 + (Math.random() - 0.5) * 6, 5, 95) }));
}
function symbolToInsight(asset: AssetScore): AIInsight {
  return {
    symbol: asset.symbol, price: asset.price, score: asset.aiScore,
    signal: asset.signal, riskLevel: asset.riskLevel, riskType: asset.riskType,
    invalidation: asset.invalidation,
    structure: [], structure2: [], trendBias: "neutral"
  };
}

function useDrawings() {
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<DrawTool>("cursor");
  const addDrawing = useCallback((d: Drawing) => { setDrawings(prev => [...prev, d]); setSelectedId(d.id); setActiveTool("cursor"); }, []);
  const updateDrawing = useCallback((id: string, patch: Partial<Drawing>) => { setDrawings(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d)); }, []);
  const deleteSelected = useCallback(() => { setDrawings(prev => prev.filter(d => d.id !== selectedId)); setSelectedId(null); }, [selectedId]);
  const clearAll = useCallback(() => { setDrawings([]); setSelectedId(null); }, []);
  const toggleLock = useCallback(() => { if (!selectedId) return; setDrawings(prev => prev.map(d => d.id === selectedId ? { ...d, locked: !d.locked } : d)); }, [selectedId]);
  const applySettings = useCallback((updated: Drawing) => { setDrawings(prev => prev.map(d => d.id === updated.id ? updated : d)); }, []);
  return { drawings, selectedId, activeTool, setSelectedId, setActiveTool, addDrawing, updateDrawing, deleteSelected, clearAll, toggleLock, applySettings, setDrawings };
}

// Modules (Placeholder simples)
function FluxoModule({ events }: { events: any[] }) { return <div style={{height:"100%",padding:10}}>Fluxo Module</div>; }
function EulerModule({ insight }: { insight: AIInsight }) { return <div style={{height:"100%",padding:10}}>Euler Module</div>; }
function SingularidadeModule({ insight }: { insight: AIInsight }) { return <div style={{height:"100%",padding:10}}>Singularidade Module</div>; }
function IAAtlasModule({ insight }: { insight: AIInsight }) { return <div style={{height:"100%",padding:10}}>IA Atlas Module</div>; }
function EstruturaModule({ insight }: { insight: AIInsight }) { return <div style={{height:"100%",padding:10}}>Estrutura Module</div>; }
function LiquidityPanel() { return <div style={{height:"100%",padding:10}}>Liquidez Panel</div>; }
function MasterScannerPanel({ assets, selectedSymbol, onSelectSymbol }: { assets: AssetScore[], selectedSymbol: string, onSelectSymbol: any }) { return <div style={{height:"100%",padding:10}}>Master Scanner</div>; }

function ChartPanel({ drawingState }: { drawingState: ReturnType<typeof useDrawings> }) {
  const mainRef = useRef<HTMLDivElement>(null);
  const volRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<SVGSVGElement>(null);
  const [svgSize, setSvgSize] = useState({ w: 800, h: 600 });
  const [draftStart, setDraftStart] = useState<{x:number,y:number}|null>(null);
  
  const candles = useMemo(() => generateCandles(240, 74500), []);
  const indicators = useMemo(() => generateIndicators(candles), [candles]);

  useEffect(() => {
    if(!mainRef.current || !volRef.current) return;
    const chartOpts = { layout:{background:{type:ColorType.Solid,color:'transparent'},textColor:'#7085ad'}, grid:{vertLines:{color:'rgba(255,255,255,0.035)'},horzLines:{color:'rgba(255,255,255,0.035)'}}, handleScroll:true, handleScale:true };
    const mc: IChartApi = createChart(mainRef.current, {...chartOpts, width: mainRef.current.clientWidth, height: mainRef.current.clientHeight});
    mc.addCandlestickSeries({upColor:"#37f4ad", downColor:"#ff6c8d", borderUpColor:"#37f4ad", borderDownColor:"#ff6c8d"}).setData(candles.map((c:any)=>({time:c.time as Time,open:c.open,high:c.high,low:c.low,close:c.close})));
    
    const vc: IChartApi = createChart(volRef.current, {...chartOpts, width: volRef.current.clientWidth, height: volRef.current.clientHeight});
    vc.addHistogramSeries({color:"rgba(55,244,173,0.42)"}).setData(candles.map((c:any)=>({time:c.time as Time,value:Math.random()*1000,color:c.close>=c.open?'rgba(55,244,173,0.42)':'rgba(255,108,141,0.42)'})));

    const resize = () => {
      if(mainRef.current) {mc.applyOptions({width:mainRef.current.clientWidth,height:mainRef.current.clientHeight});setSvgSize({w:mainRef.current.clientWidth,h:mainRef.current.clientHeight});}
      if(volRef.current) vc.applyOptions({width:volRef.current.clientWidth,height:volRef.current.clientHeight});
    };
    window.addEventListener("resize", resize); resize();
    return ()=>{window.removeEventListener("resize", resize); mc.remove();vc.remove();};
  }, [candles]);

  const getLocalPoint = (e:React.MouseEvent<SVGSVGElement>) => {const r=e.currentTarget.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};};
  const handleOverlayMouseDown = (e:React.MouseEvent<SVGSVGElement>)=>{
    const p = getLocalPoint(e);
    if(drawingState.activeTool==="cursor"){drawingState.setSelectedId(null);return;}
    setDraftStart(p);
  };
  const handleOverlayMouseUp = (e:React.MouseEvent<SVGSVGElement>)=>{
    if(draftStart&&drawingState.activeTool!=="cursor"){
      const p=getLocalPoint(e);
      drawingState.addDrawing(newDrawing(drawingState.activeTool,draftStart.x,draftStart.y,p.x,p.y));
      setDraftStart(null);
    }
  };

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",width:"100%"}}>
      <div style={{padding:"8px 10px",borderBottom:`1px solid ${ui.border}`}}><span style={{color:ui.cyan}}>BTC • TF: 15m</span></div>
      <div style={{position:"relative",flex:1,minHeight:0}}>
        <div ref={mainRef} style={{position:"absolute",inset:0}}/>
        <svg ref={overlayRef} width="100%" height="100%" viewBox={`0 0 ${svgSize.w} ${svgSize.h}`} preserveAspectRatio="none" onMouseDown={handleOverlayMouseDown} onMouseUp={handleOverlayMouseUp} style={{position:"absolute",inset:0,zIndex:4,cursor:drawingState.activeTool!=="cursor"?"crosshair":"default",pointerEvents:"auto"}}>
          {drawingState.drawings.map(d => <g key={d.id}>{renderDrawingSVG(d, svgSize.w, svgSize.h, d.id === drawingState.selectedId)}</g>)}
          {draftStart && <line x1={draftStart.x} y1={draftStart.y} x2={svgSize.w} y2={svgSize.h} stroke={TOOL_COLORS[drawingState.activeTool]} strokeWidth={2}/>}
        </svg>
        <div ref={volRef} style={{position:"absolute",left:0,right:0,bottom:0,height:140}}/>
      </div>
    </div>
  );
}

function WorkspaceByModule({ activeModule, drawingState }: { activeModule: TopModuleKey, drawingState: ReturnType<typeof useDrawings> }) {
  if (activeModule === "Scanner") return <ChartPanel drawingState={drawingState} />;
  if (activeModule === "Fluxo") return <FluxoModule events={[]} />;
  if (activeModule === "Euler") return <EulerModule insight={{} as any} />;
  if (activeModule === "Singularidade") return <SingularidadeModule insight={{} as any} />;
  if (activeModule === "IA Atlas") return <IAAtlasModule insight={{} as any} />;
  if (activeModule === "Estrutura") return <EstruturaModule insight={{} as any} />;
  if (activeModule === "Liquidez") return <LiquidityPanel />;
  if (activeModule === "Mestre Scanner") return <MasterScannerPanel assets={[]} selectedSymbol="" onSelectSymbol={()=>{}} />;
  return null;
}

function DrawingOptionsBar({ drawingState }: { drawingState: ReturnType<typeof useDrawings> }) {
  const btnStyle = (active:boolean, danger=false) => ({
    padding:"2px 8px", borderRadius:5, border:"1px solid rgba(255,255,255,0.07)",
    background: active ? "rgba(45,226,255,0.1)" : "transparent",
    color: danger ? "#ff3060" : active ? "#2de2ff" : "#9ab0d4",
    fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
  });
  return (
    <div style={{height:28,padding:"0 10px",display:"flex",alignItems:"center",gap:4,borderBottom:`1px solid ${ui.border}`,background:"rgba(255,255,255,0.012)",flexShrink:0}}>
       <button style={btnStyle(true)} onClick={drawingState.clearAll}>🗑 Limpar</button>
       <button style={btnStyle(false,true)} onClick={drawingState.deleteSelected}>✕ Apagar</button>
    </div>
  );
}

// Main App
export default function AtlasChartPro2() {
  const [timeframe, setTimeframe] = useState<Timeframe>("15m");
  const [activeModule, setActiveModule] = useState<TopModuleKey>("Scanner");
  const drawingState = useDrawings();
  const scannerAssets: AssetScore[] = useMemo(()=>[{symbol:"BTC",price:74682,change:2.8,aiScore:84,signal:"COMPRA",riskLevel:"Moderado",riskType:"Volatilidade",invalidation:69180.6}],[]);
  const activeAsset = useMemo(()=>scannerAssets.find(a=>a.symbol==="BTC")??scannerAssets[0],[scannerAssets]);
  const insight = useMemo(()=>symbolToInsight(activeAsset),[activeAsset]);

  return (
    <div style={{width:"100%",height:"100vh",display:"flex",flexDirection:"column",overflow:"hidden",background:ui.bg,color:ui.text}}>
      {/* Top Bar */}
      <div style={{height:64,padding:"0 14px",display:"flex",alignItems:"center",gap:10,borderBottom:`1px solid ${ui.border}`,background:"radial-gradient(circle at top, rgba(14,28,60,0.86), rgba(6,10,20,0.98) 55%)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <Activity size={17} color={ui.cyan}/>
          <span style={{color:ui.text,fontSize:17,fontWeight:900}}>SINGULARIDADE <span style={{color:ui.cyan,fontSize:10}}>OBP</span></span>
        </div>
        <div style={{flex:1}}/><span style={{color:ui.yellow}}>₿ BTC</span>
        <span style={{color:isPositive?ui.green:ui.red,fontSize:12}}>+2.80%</span>
        {(["1m","5m","15m","30m","1H","4H","1D"] as Timeframe[]).map(tf=>(
          <button key={tf} onClick={()=>setTimeframe(tf)} style={{height:29,padding:"0 10px",borderRadius:9,border:tf==="15m"?`1px solid ${ui.yellow}`:"1px solid transparent",background:tf==="15m"?`rgba(247,201,72,0.16)`:"transparent",color:tf==="15m"?ui.yellow:ui.text,fontSize:11,fontWeight:800,cursor:"pointer"}}>{tf}</button>
        ))}
      </div>

      {/* Module Strip */}
      <div style={{height:50,padding:"0 16px",display:"flex",alignItems:"center",gap:10,borderBottom:`1px solid ${ui.border}`,background:"linear-gradient(180deg, rgba(8,12,23,0.98), rgba(7,11,20,0.98))"}}>
         {TOP_MODULES.map(m=>(
           <button key={m} onClick={()=>setActiveModule(m)} style={{height:34,padding:"0 14px",borderRadius:12,border:activeModule===m?`1px solid ${ui.cyan}`:`1px solid ${ui.mut}`,background:activeModule===m?`rgba(45,226,255,0.15)`:"transparent",color:activeModule===m?ui.cyan:ui.text,fontSize:11,fontWeight:800,cursor:"pointer"}}>{m}</button>
         ))}
      </div>

      <div style={{display:"flex",minHeight:0,flex:1}}>
        <DrawingToolbar activeTool={drawingState.activeTool} onChangeTool={drawingState.setActiveTool} />
        
        <div style={{flex:1,minWidth:0,minHeight:0}}>
          <div style={{display:"grid",gridTemplateColumns:"minmax(0, 1fr) 320px",height:"100%",minHeight:0}}>
            <div style={{minWidth:0,minHeight:0}}>
              <WorkspaceByModule activeModule={activeModule} drawingState={drawingState} />
            </div>
            <div style={{minWidth:0,minHeight:0,borderLeft:`1px solid ${ui.border}`,background:"linear-gradient(180deg, rgba(7,11,20,0.98), rgba(4,7,14,0.98))"}}>
              <div style={{padding:12,borderBottom:`1px solid ${ui.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <span style={{color:ui.text,fontSize:12,fontWeight:800}}>AI Insights</span>
              </div>
              <div style={{padding:16,borderBottom:`1px solid ${ui.border}`}}>
                 <span style={{color:ui.text,fontSize:13,fontWeight:900}}>{insight.symbol} Score: <span style={{color:ui.green}}>{insight.score}</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <DrawingOptionsBar drawingState={drawingState} />
    </div>
  );
}
