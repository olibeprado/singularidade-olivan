"use client";
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createChart, ColorType, CrosshairMode, IChartApi, Time } from "lightweight-charts";
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
} from "lucide-react";

// ============================================================
// TIPOS E CONSTANTES
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
    // ... (Outras ferramentas mantidas conforme lógica original)
    default:
      return <line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} stroke={col} strokeWidth={lw} />;
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
  // ... (Configuração completa do toolbar conforme projeto anterior)
];

// ============================================================
// MODALS & COMPONENTS AUXILIARES (Resumidos para clareza)
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
  const clearAll = useCallback(() => { setDrawings([]); setSelectedId(null); }, []);
  const toggleLock = useCallback(() => {
    if (!selectedId) return;
    setDrawings(prev => prev.map(d => d.id === selectedId ? { ...d, locked: !d.locked } : d));
  }, [selectedId]);
  const applySettings = useCallback((updated: Drawing) => {
    setDrawings(prev => prev.map(d => d.id === updated.id ? updated : d));
  }, []);
  return { drawings, selectedId, activeTool, setSelectedId, setActiveTool, addDrawing, updateDrawing, deleteSelected, clearAll, toggleLock, applySettings, setDrawings };
}
// ... (Restante dos componentes principais e módulos IA/Singularidade mantidos igual ao código base)

// ============================================================
// CHART PANEL INTEGRADO
// ============================================================
function ChartPanel({ drawingState }: { drawingState: ReturnType<typeof useDrawings> }) {
  const mainRef = useRef<HTMLDivElement>(null);
  const oscRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<SVGSVGElement>(null);
  const [svgSize, setSvgSize] = useState({ w: 800, h: 600 });
  const [draftStart, setDraftStart] = useState<{ x:number, y:number } | null>(null);
  
  const candles = useMemo(() => {
    // Gerar dados simulados
    const now = Math.floor(Date.now() / 1000);
    const arr = []; let p = 74682;
    for(let i=240; i>0; i--) {
      const open = p;
      const change = (Math.random()-0.5)*500;
      const close = open+change;
      arr.push({ time: now-i*300, open, high: open+Math.random()*300, low: open-Math.random()*300, close });
      p = close;
    }
    return arr;
  }, []);
  const indicators = useMemo(() => candles.map(c => ({time:c.time, rsi: 50, mfi:50})), [candles]);

  useEffect(() => {
    if(!mainRef.current || !oscRef.current) return;
    
    const opts = { layout:{background:{type:ColorType.Solid,color:'transparent'},textColor:'#7085ad'}, grid:{vertLines:{color:'rgba(255,255,255,0.035)'},horzLines:{color:'rgba(255,255,255,0.035)'}}, crosshair:{mode:CrosshairMode.Normal}, handleScroll:true, handleScale:true };
    
    const mc = createChart(mainRef.current, {...opts,width:mainRef.current.clientWidth,height:mainRef.current.clientHeight});
    mc.addCandlestickSeries({upColor:'#26a69a',downColor:'#ef5350'}).setData(candles.map(c => ({time:c.time as Time,open:c.open,high:c.high,low:c.low,close:c.close})));
    
    // CORREÇÃO CRÍTICA: Sem crossHairMarkerVisible
    mc.addLineSeries({color:'#f5c842',lineWidth:1,priceLineVisible:false,lastValueVisible:false}).setData([{time: candles[0].time, value: candles[0].close}]); // Exemplo MA
    
    const vc = createChart(oscRef.current, {...opts,width:oscRef.current.clientWidth,height:oscRef.current.clientHeight});
    vc.timeScale().fitContent();
    mc.timeScale().fitContent();
    
    const resize = () => {
      if(mainRef.current) { mc.applyOptions({width:mainRef.current.clientWidth,height:mainRef.current.clientHeight}); setSvgSize({w:mainRef.current.clientWidth,h:mainRef.current.clientHeight}); }
      if(oscRef.current) vc.applyOptions({width:oscRef.current.clientWidth,height:oscRef.current.clientHeight});
    };
    window.addEventListener('resize', resize); resize();
    return () => { window.removeEventListener('resize', resize); mc.remove();vc.remove(); };
  }, [candles]);

  const getLocalPoint = (e: React.MouseEvent<SVGSVGElement>) => { const r=e.currentTarget.getBoundingClientRect(); return { x:e.clientX-r.left, y:e.clientY-r.top }; };
  
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if(drawingState.activeTool==="cursor"){ drawingState.setSelectedId(null); return; }
    setDraftStart(getLocalPoint(e));
  };
  const handleMouseUp = (e: React.MouseEvent<SVGSVGElement>) => {
    if(draftStart && drawingState.activeTool!=="cursor"){
      const p = getLocalPoint(e);
      drawingState.addDrawing(newDrawing(drawingState.activeTool, draftStart.x, draftStart.y, p.x, p.y));
      setDraftStart(null);
    }
  };

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",width:"100%"}}>
      <div style={{padding:"8px 10px",borderBottom:`1px solid #172133`,background:"linear-gradient(180deg, rgba(12,19,36,0.94), rgba(8,13,25,0.94))"}}>
        {/* Header Info Component Simplificado */}
        <div style={{display:"flex",gap:8}}>BTC • TF: 15m</div>
      </div>
      
      {/* Toolbar Options Component Simplificado */}
      <div style={{height:28,padding:"0 10px",display:"flex",alignItems:"center",gap:4,borderBottom:`1px solid #172133`,background:"rgba(255,255,255,0.012)"}}>
        <button onClick={drawingState.deleteSelected}>Apagar</button><button onClick={drawingState.clearAll}>Limpar</button>
      </div>
      
      {/* Chart Container */}
      <div style={{position:"relative",flex:1,minHeight:0}}>
        <div ref={mainRef} style={{position:"absolute",inset:0}} />
        
        {/* Overlay SVG */}
        <svg ref={overlayRef} width="100%" height="100%" viewBox={`0 0 ${svgSize.w} ${svgSize.h}`} preserveAspectRatio="none"
          onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onMouseLeave={()=>setDraftStart(null)}
          style={{position:"absolute",inset:0,zIndex:4,cursor:drawingState.activeTool!=="cursor"?"crosshair":"default",pointerEvents:"auto"}}
        >
          {drawingState.drawings.map(d => (<g key={d.id}>{renderDrawingSVG(d, svgSize.w, svgSize.h, d.id === drawingState.selectedId)}</g>))}
          {draftStart && <line x1={draftStart.x} y1={draftStart.y} x2={svgSize.w} y2={svgSize.h} stroke="#ffd54f" strokeWidth={2} />}
        </svg>
        
        <div ref={oscRef} style={{position:"absolute",left:0,right:0,bottom:0,height:140,pointerEvents:"none",opacity:0.95,borderTop:"1px solid rgba(255,255,255,0.05)"}}/>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function AtlasChartPro2() {
  const drawingState = useDrawings();
  const [activeModule, setActiveModule] = useState<"Scanner">("Scanner"); // Módulo simplificado
  
  return (
    <div style={{width:"100%",height:"100vh",display:"flex",flexDirection:"column",background:"#060913",color:"#ebf3ff"}}>
      
      {/* TopBar e ModuleStrip (Copie seus componentes existentes aqui) */}
      {/* Exemplo básico */}
      <div style={{height:64,borderBottom:`1px solid #172133`,padding:"0 14px",display:"flex",alignItems:"center"}}>
        <div>SINGULARIDADE OBP</div>
      </div>
      
      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        <DrawingToolbar activeTool={drawingState.activeTool} onChangeTool={drawingState.setActiveTool} />
        
        <div style={{flex:1,minWidth:0,minHeight:0}}>
          <ChartPanel drawingState={drawingState} />
        </div>
        
        <AIInsightPanel insight={{symbol:"BTC",price:74682,score:84,signal:"COMPRA",riskLevel:"Moderado",riskType:"Volatilidade",invalidation:69180.6,trendBias:"bullish",structure:[],structure2:[]}} topModule="Scanner" />
      </div>
      
      {/* Modals e ContextMenu se necessitar */}
    </div>
  );
}
