"use client";
import React, { useEffect, useRef, useState, useMemo } from "react";
import { createChart, ColorType, CrosshairMode, IChartApi, Time } from "lightweight-charts";

// ============================================
// CORE CONSTANTS (NÃO MUDA NUNCA)
// ============================================
const COLORS = {
  bg: "#060913",
  border: "#172133",
  cyan: "#2de2ff",
  green: "#27f59d",
  yellow: "#f7c948",
  red: "#ff6b86",
  text: "#eef6ff",
};

type DrawTool = "cursor" | "trendline" | "hline" | "vline" | "rect" | "fib";

interface Drawing {
  id: string;
  tool: DrawTool;
  color: string;
  x1: number; y1: number;
  x2: number; y2: number;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function generateCandles(count: number, startPrice: number) {
  const candles = [];
  let price = startPrice;
  const now = Math.floor(Date.now() / 1000);
  
  for (let i = count; i > 0; i--) {
    const volatility = startPrice * 0.005;
    const change = (Math.random() - 0.5) * volatility;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    
    candles.push({
      time: now - i * 60,
      open,
      high,
      low,
      close,
    });
    price = close;
  }
  return candles;
}

function formatCompact(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  return n.toFixed(2);
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function SingularidadeChart() {
  const mainRef = useRef<HTMLDivElement>(null);
  const oscRef = useRef<HTMLDivElement>(null);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [activeTool, setActiveTool] = useState<DrawTool>("cursor");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftStart, setDraftStart] = useState<{x: number, y: number} | null>(null);
  const [svgSize, setSvgSize] = useState({w: 1000, h: 600});
  
  // Gerar dados
  const candles = useMemo(() => generateCandles(240, 74682), []);
  
  // Inicializar gráficos
  useEffect(() => {
    if (!mainRef.current || !oscRef.current) return;
    
    // Chart principal
    const chart = createChart(mainRef.current, {
      width: mainRef.current.clientWidth,
      height: mainRef.current.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#7085ad",
        fontFamily: "JetBrains Mono",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.05)" },
        horzLines: { color: "rgba(255,255,255,0.05)" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      handleScroll: true,
      handleScale: true,
    });
    
    const series = chart.addCandlestickSeries({
      upColor: COLORS.green,
      downColor: COLORS.red,
      borderUpColor: COLORS.green,
      borderDownColor: COLORS.red,
    });
    
    series.setData(candles.map((c: any) => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    })));
    
    // Volume
    const volChart = createChart(oscRef.current, {
      width: oscRef.current.clientWidth,
      height: oscRef.current.clientHeight,
      layout: { background: { type: ColorType.Solid, color: "transparent" } },
      rightPriceScale: { visible: false },
      timeScale: { visible: false },
    });
    
    const volSeries = volChart.addHistogramSeries({
      color: "rgba(39,245,157,0.4)",
    });
    
    volSeries.setData(candles.map((c: any) => ({
      time: c.time as Time,
      value: Math.random() * 1000,
      color: c.close >= c.open ? COLORS.green : COLORS.red,
    })));
    
    // Resize handler
    const resize = () => {
      if (mainRef.current && oscRef.current) {
        chart.applyOptions({
          width: mainRef.current.clientWidth,
          height: mainRef.current.clientHeight,
        });
        volChart.applyOptions({
          width: oscRef.current.clientWidth,
          height: oscRef.current.clientHeight,
        });
        setSvgSize({
          w: mainRef.current.clientWidth,
          h: mainRef.current.clientHeight,
        });
      }
    };
    
    window.addEventListener("resize", resize);
    resize();
    
    return () => {
      window.removeEventListener("resize", resize);
      chart.remove();
      volChart.remove();
    };
  }, [candles]);
  
  // Handlers SVG
  const getPoint = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };
  
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (activeTool === "cursor") return;
    const p = getPoint(e);
    setDraftStart(p);
  };
  
  const handleMouseUp = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!draftStart || activeTool === "cursor") return;
    const p = getPoint(e);
    const newDrawing: Drawing = {
      id: `draw-${Date.now()}`,
      tool: activeTool,
      color: COLORS.cyan,
      x1: draftStart.x,
      y1: draftStart.y,
      x2: p.x,
      y2: p.y,
    };
    setDrawings(prev => [...prev, newDrawing]);
    setDraftStart(null);
  };
  
  // Render SVG drawings
  const renderDrawing = (d: Drawing, isDraft = false) => {
    const opacity = isDraft ? 0.6 : 1;
    
    switch (d.tool) {
      case "hline":
        return <line key={d.id} x1={0} y1={d.y1} x2={svgSize.w} y2={d.y1} stroke={d.color} strokeWidth={2} strokeDasharray="5,3" opacity={opacity} />;
      case "vline":
        return <line key={d.id} x1={d.x1} y1={0} x2={d.x1} y2={svgSize.h} stroke={d.color} strokeWidth={2} strokeDasharray="5,3" opacity={opacity} />;
      case "trendline":
        return <line key={d.id} x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} stroke={d.color} strokeWidth={2} opacity={opacity} />;
      case "rect":
        const rx = Math.min(d.x1, d.x2), ry = Math.min(d.y1, d.y2), rw = Math.abs(d.x2 - d.x1), rh = Math.abs(d.y2 - d.y1);
        return <rect key={d.id} x={rx} y={ry} width={rw} height={rh} fill={`${d.color}22`} stroke={d.color} strokeWidth={2} opacity={opacity} />;
      default:
        return null;
    }
  };
  
  return (
    <div style={{ width: "100%", height: "100vh", background: COLORS.bg, color: COLORS.text, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      
      {/* TOP BAR */}
      <div style={{ height: 64, borderBottom: `1px solid ${COLORS.border}`, padding: "0 16px", display: "flex", alignItems: "center", gap: 12 }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: "linear-gradient(135deg, rgba(45,226,255,0.22), rgba(119,77,255,0.28))", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: COLORS.cyan, fontWeight: 900 }}>SV</span>
          </div>
          <div>
            <div style={{ color: COLORS.text, fontSize: 17, fontWeight: 900 }}>SINGULARIDADE</div>
            <div style={{ color: COLORS.cyan, fontSize: 10 }}>OBP</div>
          </div>
        </div>
        
        <div style={{ width: 1, height: 30, background: "rgba(255,255,255,0.1)" }} />
        
        <button style={{ 
          padding: "0 16px", height: 36, 
          borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", 
          background: "rgba(255,255,255,0.03)", color: COLORS.yellow, 
          fontSize: 13, fontWeight: 800, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          ₿ BTC
        </button>
        
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {["1m", "5m", "15m", "1H", "4H", "1D"].map(tf => (
            <button key={tf} style={{
              height: 29, padding: "0 12px", borderRadius: 9,
              border: tf === "15m" ? `1px solid rgba(247,201,72,0.34)` : "1px solid rgba(255,255,255,0.06)",
              background: tf === "15m" ? "rgba(247,201,72,0.16)" : "rgba(255,255,255,0.03)",
              color: tf === "15m" ? COLORS.yellow : COLORS.text,
              fontSize: 11, fontWeight: 800, cursor: "pointer",
            }}>
              {tf}
            </button>
          ))}
        </div>
        
        <div style={{ flex: 1 }} />
        
        <span style={{ color: COLORS.green, fontSize: 13, fontWeight: 900 }}>+2.8%</span>
      </div>
      
      {/* CONTENT */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        
        {/* TOOLBAR ESQUERDA */}
        <div style={{ width: 48, borderRight: `1px solid ${COLORS.border}`, background: "#0a0f1d", display: "flex", flexDirection: "column", padding: 8, gap: 2 }}>
          {[
            { icon: "↖", tool: "cursor" as DrawTool, label: "Cursor" },
            { icon: "╱", tool: "trendline" as DrawTool, label: "Tendência" },
            { icon: "─", tool: "hline" as DrawTool, label: "Horizontal" },
            { icon: "│", tool: "vline" as DrawTool, label: "Vertical" },
            { icon: "▭", tool: "rect" as DrawTool, label: "Retângulo" },
            { icon: "FIB", tool: "fib" as DrawTool, label: "Fibonacci" },
          ].map(({icon, tool, label}) => (
            <button
              key={tool}
              onClick={() => setActiveTool(tool)}
              style={{
                width: 40, height: 36, borderRadius: 7,
                border: activeTool === tool ? `1px solid ${COLORS.cyan}` : "1px solid transparent",
                background: activeTool === tool ? "rgba(45,226,255,0.15)" : "transparent",
                color: activeTool === tool ? COLORS.cyan : COLORS.text,
                fontSize: 13, fontWeight: 900, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
              title={label}
            >
              {icon}
            </button>
          ))}
        </div>
        
        {/* GRÁFICO PRINCIPAL */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          
          {/* INFO HEADER */}
          <div style={{ height: 50, borderBottom: `1px solid ${COLORS.border}`, padding: "0 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: 7, background: "rgba(247,201,72,0.16)", color: COLORS.yellow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900 }}>SC</div>
              <div>
                <div style={{ color: COLORS.text, fontSize: 14, fontWeight: 900 }}>BTC</div>
                <div style={{ color: "#7d91b6", fontSize: 10 }}>Scanner • {activeTool}</div>
              </div>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {["Preço", "Variação", "Volume", "Desenhos"].map(label => (
                <div key={label} style={{
                  borderRadius: 13, border: "1px solid rgba(255,255,255,0.06)",
                  background: "linear-gradient(180deg, rgba(8,15,31,0.98), rgba(7,12,24,0.96))",
                  padding: "8px 14px", minHeight: 50,
                }}>
                  <div style={{ color: "#7f93b7", fontSize: 9, fontWeight: 900, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
                  <div style={{ color: COLORS.green, fontSize: 12, fontWeight: 900 }}>{label === "Desenhos" ? drawings.length : "--"}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* CHART AREA */}
          <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
            <div ref={mainRef} style={{ width: "100%", height: "100%" }} />
            <svg
              width="100%"
              height="100%"
              viewBox={`0 0 ${svgSize.w} ${svgSize.h}`}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              style={{
                position: "absolute", inset: 0, zIndex: 5,
                cursor: activeTool !== "cursor" ? "crosshair" : "default",
                pointerEvents: drawings.length > 0 ? "auto" : "none",
              }}
            >
              {drawings.map(d => renderDrawing(d))}
              {draftStart && renderDrawing({
                id: "draft",
                tool: activeTool,
                color: COLORS.cyan,
                x1: draftStart.x,
                y1: draftStart.y,
                x2: svgSize.w,
                y2: svgSize.h,
              }, true)}
            </svg>
          </div>
          
          {/* VOLUME PANEL */}
          <div ref={oscRef} style={{ height: 100, borderTop: `1px solid ${COLORS.border}` }} />
        </div>
        
        {/* PAINEL DIREITO */}
        <div style={{ width: 280, borderLeft: `1px solid ${COLORS.border}`, background: "#0a0f1d", padding: 12 }}>
          <div style={{ color: COLORS.text, fontSize: 13, fontWeight: 900, marginBottom: 8 }}>Insights</div>
          <div style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", padding: 10 }}>
            <div style={{ color: COLORS.cyan, fontSize: 20, fontWeight: 900 }}>+2.8%</div>
            <div style={{ color: "#7f93b7", fontSize: 10, marginTop: 4 }}>Compra Forte</div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
