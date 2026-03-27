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
  Bell,
  BrainCircuit,
  ChevronDown,
  Droplets,
  Layers3,
  ScanSearch,
  Search,
  Settings,
  Sigma,
  Star,
  TrendingUp,
  Waves,
} from "lucide-react";

// ============================================================
// TIPOS & CONSTANTES
// ============================================================
type Timeframe = "1m" | "5m" | "15m" | "30m" | "1H" | "4H" | "1D";
type TopModuleKey =
  | "Fluxo"
  | "Singularidade"
  | "IA Atlas"
  | "Scanner"
  | "Mestre Scanner"
  | "Estrutura"
  | "Euler"
  | "Liquidez";

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

type FibLevel = { pct: number; color: string; visible: boolean };

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
  showPrice: boolean;
  x1: number; y1: number;
  x2: number; y2: number;
  fibLevels?: FibLevel[];
}

const DEFAULT_FIB_LEVELS: FibLevel[] = [
  { pct: 0,     color: "#ffd54f", visible: true },
  { pct: 0.236, color: "#00d4ff", visible: true },
  { pct: 0.382, color: "#00e676", visible: true },
  { pct: 0.5,   color: "#ff9100", visible: true },
  { pct: 0.618, color: "#c77dff", visible: true },
  { pct: 0.786, color: "#ff3060", visible: true },
  { pct: 1.0,   color: "#ffd54f", visible: true },
];

const TOOL_COLORS: Record<DrawTool, string> = {
  cursor:    "#ffffff", trendline: "#00d4ff", hline:    "#ffd54f",
  vline:     "#ffd54f", ray:       "#ff9100", extended: "#00d4ff",
  channel:   "#448aff", pitchfork: "#c77dff", fib:      "#ffd54f",
  fibext:    "#00e676", fibarc:    "#ff9100", fibfan:   "#c77dff",
  rect:      "#00d4ff", triangle:  "#00e676", ellipse:  "#ff9100",
  measure:   "#00e676", text:      "#ffffff",
};

function newDrawing(tool: DrawTool, x1: number, y1: number, x2: number, y2: number): Drawing {
  return {
    id: `${tool}-${Date.now()}`,
    tool,
    color: TOOL_COLORS[tool],
    lineWidth: 2,
    lineStyle: "solid",
    fillOpacity: 10,
    locked: false,
    hidden: false,
    note: "",
    showPrice: true,
    x1, y1, x2, y2,
    fibLevels: ["fib","fibext","fibarc"].includes(tool) ? DEFAULT_FIB_LEVELS.map(l => ({ ...l })) : undefined,
  };
}

function hitTestDrawing(d: Drawing, mx: number, my: number): boolean {
  const pad = 10;
  if (d.tool === "hline") return Math.abs(my - d.y1) < pad;
  if (d.tool === "vline") return Math.abs(mx - d.x1) < pad;
  return mx >= Math.min(d.x1,d.x2)-pad && mx <= Math.max(d.x1,d.x2)+pad && my >= Math.min(d.y1,d.y2)-pad && my <= Math.max(d.y1,d.y2)+pad;
}

function renderDrawingSVG(d: Drawing, w: number, h: number, sel: boolean) {
  const col = d.color, lw = d.lineWidth;
  const handles = sel ? (<><circle cx={d.x1} cy={d.y1} r={5} fill="#fff" stroke={col}/><circle cx={d.x2} cy={d.y2} r={5} fill="#fff" stroke={col}/></>) : null;
  
  switch(d.tool) {
    case "hline": return <g><line x1={0} y1={d.y1} x2={w} y2={d.y1} stroke={col} strokeWidth={lw}/>{handles}</g>;
    case "vline": return <g><line x1={d.x1} y1={0} x2={d.x1} y2={h} stroke={col} strokeWidth={lw}/>{handles}</g>;
    default: return <g><line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} stroke={col} strokeWidth={lw}/>{handles}</g>;
  }
}

// ============================================
// UI COMPONENTS
// ============================================
const ui = {
  bg: "#060913", border: "#172133", text: "#ebf3ff", mut: "#7f93b7", cyan: "#2de2ff", green: "#27f59d", yellow: "#f7c948", red: "#ff6b86",
};

function TopButton({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{ height: 29, padding: "0 10px", borderRadius: 9, border: active ? `1px solid ${ui.yellow}` : "1px solid transparent", background: active ? `${ui.yellow}1a` : "transparent", color: active ? ui.yellow : ui.text, fontSize: 11, fontWeight: 800, cursor: "pointer" }}>{children}</button>
  );
}

function ModuleButton({ icon, text, active, onClick }: { icon: React.ReactNode; text: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 34, padding: "0 14px", borderRadius: 12, border: active ? `1px solid rgba(247,201,72,0.34)` : "1px solid rgba(255,255,255,0.06)", background: active ? "rgba(247,201,72,0.16)" : "rgba(255,255,255,0.03)", color: active ? "#ffe39a" : "#dce8ff", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
      {icon}{text}
    </button>
  );
}

// ============================================================
// TOOLBAR LEFT
// ============================================================
export function DrawingToolbar({ activeTool, onChangeTool }: { activeTool: DrawTool; onChangeTool: (t: DrawTool) => void }) {
  const groups = [
    { title: "CURSOR", items: [{ key: "cursor" as DrawTool, icon: "↖" }] },
    { title: "LINHAS", items: [{ key: "trendline" as DrawTool, icon: "╱" }, { key: "hline" as DrawTool, icon: "─" }, { key: "vline" as DrawTool, icon: "│" }] },
    { title: "FIBO", items: [{ key: "fib" as DrawTool, icon: "FIB" }] },
  ];
  return (
    <div style={{ width: 52, borderRight: `1px solid ${ui.border}`, background: "#0a0f1d", display: "flex", flexDirection: "column", padding: 8, gap: 2 }}>
      {groups.map((g, i) => (<div key={i}><span style={{ color: ui.mut, fontSize: 6, marginBottom: 2, textAlign: "center" }}>{g.title}</span>{g.items.map(item => (<button key={item.key} onClick={() => onChangeTool(item.key)} style={{ width: 38, height: 34, border: activeTool === item.key ? `1px solid ${ui.cyan}` : "1px solid transparent", background: activeTool === item.key ? `${ui.cyan}11` : "transparent", color: activeTool === item.key ? ui.cyan : ui.mut, cursor: "pointer" }}>{item.icon}</button>))}</div>))}
    </div>
  );
}

// ============================================================
// DRAWING OPTIONS BAR
// ============================================================
function DrawingOptionsBar({ selectedId, onDelete, onClear, onLock, setColor }: { selectedId: string | null; onDelete: () => void; onClear: () => void; onLock: () => void; setColor: (c: string) => void }) {
  return (
    <div style={{ height: 28, padding: "0 10px", borderBottom: `1px solid ${ui.border}`, display: "flex", alignItems: "center", gap: 4 }}>
      <button onClick={onLock} style={{ border: "1px solid #172133", borderRadius: 4, background: "transparent", color: "#7f93b7", fontSize: 10, padding: "2px 8px", cursor: "pointer" }}>🔒</button>
      <button onClick={onDelete} style={{ border: "1px solid #172133", borderRadius: 4, background: "transparent", color: ui.red, fontSize: 10, padding: "2px 8px", cursor: "pointer" }}>✕</button>
      <button onClick={onClear} style={{ border: "1px solid #172133", borderRadius: 4, background: "transparent", color: "#7f93b7", fontSize: 10, padding: "2px 8px", cursor: "pointer" }}>🗑</button>
      {["#ffd54f","#00d4ff","#00e676","#ff3060","#c77dff"].map(c => <div key={c} onClick={() => setColor(c)} style={{ width: 12, height: 12, borderRadius: 3, background: c, border: "1px solid #172133", cursor: "pointer" }} />)}
    </div>
  );
}

// ============================================================
// CHART PANEL
// ============================================================
function ChartPanel({ drawingState }: { drawingState: ReturnType<typeof useDrawings> }) {
  const mainRef = useRef<HTMLDivElement>(null);
  const volRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [svgSize, setSvgSize] = useState({ w: 800, h: 500 });
  const [draftStart, setDraftStart] = useState<{x:number,y:number}|null>(null);

  // Dados Mockados
  const candles = useMemo(() => {
    const arr: any[] = []; let p=74682; const now=Math.floor(Date.now()/1000);
    for(let i=240; i>0; i--){
      const o=p, d=(Math.random()-.5)*150, c=o+d, h=Math.max(o,c)+Math.random()*50, l=Math.min(o,c)-Math.random()*50;
      arr.push({time:now-i*300,open:o,high:h,low:l,close:c,volume:120+Math.random()*500});p=c;
    }
    return arr;
  }, []);

  // Inicializa Lightweight Charts
  useEffect(() => {
    if(!mainRef.current||!volRef.current)return;
    const opts={layout:{background:{type:'solid',color:'transparent'},textColor:'#7f93b7'},grid:{vertLines:{color:'rgba(255,255,255,0.03)'},horzLines:{color:'rgba(255,255,255,0.03)'}},handleScroll:true,handleScale:true};
    
    // Principal
    const mc=createChart(mainRef.current,{...opts,width:mainRef.current.clientWidth,height:mainRef.current.clientHeight});
    const cs=mc.addCandlestickSeries({upColor:'#37f4ad',downColor:'#ff6c8d',borderUpColor:'#37f4ad',borderDownColor:'#ff6c8d'});
    cs.setData(candles.map((c:any)=>({time:c.time,open:c.open,high:c.high,low:c.low,close:c.close})));
    mc.timeScale().fitContent();
    
    // Volume
    const vc=createChart(volRef.current,{...opts,width:volRef.current.clientWidth,height:volRef.current.clientHeight,rightPriceScale:{visible:false}});
    vc.addHistogramSeries({priceScaleId:""}).setData(candles.map((c:any)=>({time:c.time,value:c.volume,color:c.close>=c.open?'#37f4ad':'#ff6c8d',opacity:0.4})));
    vc.timeScale().fitContent();
    
    const resize=()=>{if(mainRef.current&&volRef.current){mc.applyOptions({width:mainRef.current.clientWidth,height:mainRef.current.clientHeight});setSvgSize({w:mainRef.current.clientWidth,h:mainRef.current.clientHeight});vc.applyOptions({width:volRef.current.clientWidth,height:volRef.current.clientHeight});}};
    window.addEventListener('resize',resize);resize();
    return ()=>{window.removeEventListener('resize',resize);mc.remove();vc.remove();};
  }, [candles]);

  // Handlers Mouse
  const getPoint=(e:React.MouseEvent<SVGSVGElement>)=>{const r=e.currentTarget.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};};
  const handleMouseDown=(e:React.MouseEvent<SVGSVGElement>)=>{const p=getPoint(e);if(drawingState.activeTool==="cursor"){drawingState.setSelectedId(null);return;}setDraftStart(p);};
  const handleMouseUp=(e:React.MouseEvent<SVGSVGElement>)=>{if(draftStart&&drawingState.activeTool!=="cursor"){const p=getPoint(e);drawingState.addDrawing(newDrawing(drawingState.activeTool,draftStart.x,draftStart.y,p.x,p.y));setDraftStart(null);}};

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:"linear-gradient(180deg,rgba(7,12,24,0.98),rgba(6,10,18,0.98))"}}>
      <div style={{padding:"8px 10px",borderBottom:`1px solid ${ui.border}`,background:`linear-gradient(180deg,rgba(12,19,36,0.94),rgba(8,13,25,0.94))`,display:"flex",alignItems:"center",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>BTC<span style={{color:ui.mut,fontSize:9}}>• TF:15m</span></div>
        <div style={{color:ui.green,fontSize:9}}>+2.8%</div>
        <div style={{flex:1}}/>
        <TopButton active>Auto</TopButton>
        <TopButton>Manual</TopButton>
        <TopButton>Zoom-</TopButton>
        <TopButton>Reset</TopButton>
      </div>
      
      <DrawingOptionsBar 
        selectedId={drawingState.selectedId} 
        onDelete={drawingState.deleteSelected}
        onClear={drawingState.clearAll}
        onLock={drawingState.toggleLock}
        setColor={(c)=>drawingState.selectedId?drawingState.updateDrawing(drawingState.selectedId,{color:c}):null}
      />
      
      <div style={{position:"relative",flex:1,overflow:"hidden"}}>
        <div ref={mainRef} style={{position:"absolute",inset:0}}/>
        <svg ref={svgRef} width="100%" height="100%" viewBox={`0 0 ${svgSize.w} ${svgSize.h}`} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onContextMenu={(e)=>e.preventDefault()}
          style={{position:"absolute",inset:0,zIndex:5,cursor:drawingState.activeTool!=="cursor"?"crosshair":"default"}}>
          
          {/* Desenhos */}
          {drawingState.drawings.map(d => <g key={d.id}>{renderDrawingSVG(d, svgSize.w, svgSize.h, d.id===drawingState.selectedId)}</g>)}
          
          {/* Preview */}
          {draftStart && renderingPreviewSVG(draftStart, drawingState.activeTool, svgSize.w, svgSize.h)}
        </svg>
        
        <div ref={volRef} style={{position:"absolute",left:0,right:0,bottom:0,height:80,pointerEvents:"none"}}/>
      </div>
    </div>
  );
}

function renderingPreviewSVG(start:{x:number,y:number}, tool:DrawTool,w:number,h:number){
  const col=TOOL_COLORS[tool];
  switch(tool){case "hline":return<g><line x1={0} y1={start.y} x2={w} y2={start.y} stroke={col} strokeWidth={1.5} strokeDasharray="5,3"/></g>;
  case "vline":return<g><line x1={start.x} y1={0} x2={start.x} y2={h} stroke={col} strokeWidth={1.5} strokeDasharray="5,3"/></g>;
  default:return<g><line x1={start.x} y1={start.y} x2={w} y2={h} stroke={col} strokeWidth={1.5} strokeDasharray="5,3"/></g>;
  }
}

// ============================================================
// HOOK DESENHOS
// ============================================================
function useDrawings(){
  const [drawings,setDrawings]=useState<Drawing[]>([]);
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const [activeTool,setActiveTool]=useState<DrawTool>("cursor");
  
  const addDrawing=useCallback((d:Drawing)=>{setDrawings(prev=>[...prev,d]);setSelectedId(d.id);setActiveTool("cursor");},[]);
  const updateDrawing=useCallback((id:string,p:Partial<Drawing>)=>setDrawings(prev=>prev.map(d=>d.id===id?{...d,...p}:d)),[]);
  const deleteSelected=useCallback(()=>{setDrawings(prev=>prev.filter(d=>d.id!==selectedId));setSelectedId(null);},[selectedId]);
  const clearAll=useCallback(()=>{setDrawings([]);setSelectedId(null);},[]);
  const toggleLock=useCallback(()=>selectedId?updateDrawing(selectedId,{locked:!drawings.find(d=>d.id===selectedId)?.locked}):null,[selectedId,drawings,updateDrawing]);
  
  return{drawings,selectedId,activeTool,setSelectedId,setActiveTool,addDrawing,updateDrawing,deleteSelected,clearAll,toggleLock};
}

// ==========================================
// AI PANEL & MAIN APP
// ==========================================
function AIInsightPanel(){
  return(
    <div style={{width:280,borderLeft:`1px solid ${ui.border}`,background:ui.bg,padding:16}}>
      <div style={{fontWeight:900,fontSize:13,marginBottom:12}}>AI Insights</div>
      <div style={{fontSize:20,fontWeight:900,color:ui.green}}>+2.8%</div>
      <div style={{marginTop:8,padding:12,borderRadius:12,border:`1px solid ${ui.border}`,background:"rgba(255,255,255,0.03)"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <span style={{fontSize:12,color:ui.mut}}>Risco</span><span style={{fontSize:12,color:ui.yellow,fontWeight:700}}>Moderado</span>
          <span style={{fontSize:12,color:ui.mut}}>Validade</span><span style={{fontSize:12,color:ui.green,fontWeight:700}}>Ativo</span>
        </div>
      </div>
    </div>
  );
}

export default function AtlasChartPro2() {
  const drawingState = useDrawings();
  
  return (
    <div style={{width:"100%",height:"100vh",background:ui.bg,color:ui.text,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      
      {/* TOP NAV */}
      <div style={{height:48,borderBottom:`1px solid ${ui.border}`,padding:"0 16px",display:"flex",alignItems:"center",gap:8}}>
        <div style={{fontWeight:900,fontSize:14}}>SINGULARIDADE</div>
        <div style={{flex:1}}/>
        <div style={{display:"flex",gap:4}}>1m 5m 15m 1H 4H 1D</div>
        <div style={{color:ui.green,fontSize:11,fontWeight:700}}>+2.8%</div>
      </div>
      
      {/* MODULE STRIP */}
      <div style={{height:42,borderBottom:`1px solid ${ui.border}`,padding:"0 16px",display:"flex",alignItems:"center",gap:8}}>
        {[<Waves size={13} text="Fluxo"/>,<BrainCircuit size={13} text="Singularidade"/>,<Activity size={13} text="IA Atlas"/>,<ScanSearch size={13} text="Scanner" active/><Layers3 size={13} text="Estrutura"/>,<Sigma size={13} text="Euler"/>,<Droplets size={13} text="Liquidez"/>,].map((m,i)=>(m instanceof Array ? <ModuleButton key={i} icon={m[0]} text={m[1]} active={false}/> : <ModuleButton key={i} icon={m.icon} text={m.text} active={true}/>)))}
      </div>
      
      {/* CONTENT */}
      <div style={{display:"flex",flex:1,minHeight:0}}>
        <DrawingToolbar activeTool={drawingState.activeTool} onChangeTool={drawingState.setActiveTool}/>
        
        <div style={{flex:1,minWidth:0}}>
          <ChartPanel drawingState={drawingState}/>
        </div>
        
        <AIInsightPanel/>
      </div>
      
    </div>
  );
}
