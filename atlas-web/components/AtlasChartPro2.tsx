"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { createChart, ColorType, CrosshairMode, IChartApi, Time } from "lightweight-charts";

// TIPOS
type DrawTool = "cursor" | "trendline" | "hline" | "vline" | "rect" | "fib";

interface Drawing {
  id: string;
  tool: DrawTool;
  color: string;
  x1: number; y1: number;
  x2: number; y2: number;
}

// CONSTANTES
const TOOL_COLORS: Record<DrawTool, string> = {
  cursor: "#ffffff", trendline: "#00d4ff", hline: "#ffd54f",
  vline: "#ffd54f", rect: "#00d4ff", fib: "#ffd54f",
};

const TOOL_LABELS: Record<DrawTool, string> = {
  cursor: "Cursor", trendline: "Tendência", hline: "Horizontal",
  vline: "Vertical", rect: "Retângulo", fib: "Fibonacci",
};

// HOOK DESENHOS
function useDrawings() {
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [activeTool, setActiveTool] = useState<DrawTool>("cursor");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const addDrawing = useCallback((d: Drawing) => {
    setDrawings(prev => [...prev, d]);
    setActiveTool("cursor");
  }, []);

  const deleteDrawing = useCallback((id: string) => {
    setDrawings(prev => prev.filter(d => d.id !== id));
  }, []);

  const clearAll = useCallback(() => setDrawings([]), []);

  return {
    drawings, activeTool, selectedId,
    setDrawings, setActiveTool, setSelectedId,
    addDrawing, deleteDrawing, clearAll,
  };
}

// TOOLBAR ESQUERDA
function DrawingToolbar({ 
  activeTool, 
  onChangeTool 
}: { 
  activeTool: DrawTool; 
  onChangeTool: (t: DrawTool) => void;
}) {
  const tools = [
    { key: "cursor" as DrawTool, icon: "↖" },
    { key: "trendline" as DrawTool, icon: "╱" },
    { key: "hline" as DrawTool, icon: "─" },
    { key: "vline" as DrawTool, icon: "│" },
    { key: "rect" as DrawTool, icon: "▭" },
    { key: "fib" as DrawTool, icon: "FIB" },
  ];

  return (
    <div style={{
      width: 48,
      borderRight: "1px solid #172133",
      background: "linear-gradient(180deg,rgba(8,12,24,0.98),rgba(6,9,17,0.98))",
      display: "flex", flexDirection: "column",
      padding: "8px 6px", gap: 4,
    }}>
      {tools.map(tool => {
        const active = activeTool === tool.key;
        return (
          <button
            key={tool.key}
            onClick={() => onChangeTool(tool.key)}
            title={TOOL_LABELS[tool.key]}
            style={{
              width: 36, height: 36,
              borderRadius: 7, cursor: "pointer",
              border: active
                ? "1px solid rgba(45,226,255,0.3)"
                : "1px solid rgba(255,255,255,0.04)",
              background: active
                ? "radial-gradient(circle,rgba(45,226,255,0.18),rgba(45,226,255,0.04))"
                : "linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.008))",
              color: active ? "#2de2ff" : "#90a4c8",
              fontSize: 13, fontWeight: 900, fontFamily: "monospace",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {tool.icon}
          </button>
        );
      })}
    </div>
  );
}

// TOP BAR
function TopBar({ symbol }: { symbol: string }) {
  return (
    <div style={{
      height: 64,
      padding: "0 14px",
      display: "flex",
      alignItems: "center",
      gap: 10,
      borderBottom: "1px solid #172133",
      background: "radial-gradient(circle at top, rgba(14,28,60,0.86), rgba(6,10,20,0.98) 55%)",
    }}>
      {/* LOGO AQUI */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11,
          background: "linear-gradient(135deg, rgba(42,231,255,0.22), rgba(119,77,255,0.28))",
          border: "1px solid rgba(255,255,255,0.08)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {/* SEU ÍCONE SVG AQUI */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#2de2ff" strokeWidth="2"/>
            <path d="M12 6v12M6 12h12" stroke="#2de2ff" strokeWidth="2"/>
          </svg>
        </div>
        <span style={{ color: "#f6fbff", fontSize: 17, fontWeight: 900 }}>
          SINGULARIDADE
        </span>
      </div>
      
      <div style={{ width: 1, height: 30, background: "rgba(255,255,255,0.08)" }} />
      
      <button style={{
        display: "inline-flex", alignItems: "center", gap: 7,
        height: 36, padding: "0 12px", borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.07)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.012))",
        color: "#eef6ff", fontSize: 13, fontWeight: 800, cursor: "pointer",
      }}>
        <span style={{ color: "#f7c948" }}>₿</span>
        {symbol}
      </button>
      
      <div style={{ flex: 1 }} />
      
      <div style={{ display: "flex", gap: 4 }}>
        {["1m", "5m", "15m", "30m", "1H", "4H", "1D"].map(tf => (
          <button key={tf} style={{
            height: 29, padding: "0 10px", borderRadius: 9,
            border: "1px solid rgba(255,255,255,0.06)",
            background: tf === "15m" 
              ? "linear-gradient(180deg, rgba(247,201,72,0.16), rgba(247,201,72,0.04))"
              : "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.008))",
            color: tf === "15m" ? "#f7c948" : "#dce8ff",
            fontSize: 11, fontWeight: 800, cursor: "pointer",
          }}>
            {tf}
          </button>
        ))}
      </div>
    </div>
  );
}

// CHART PANEL SIMPLIFICADO
function ChartPanel({ drawingState }: { drawingState: ReturnType<typeof useDrawings> }) {
  const mainRef = useRef<HTMLDivElement>(null);
  const volRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [svgSize, setSvgSize] = useState({ w: 800, h: 600 });
  const [draft, setDraft] = useState<{x1:number,y1:number,x2:number,y2:number} | null>(null);

  // Inicializa gráfico
  useEffect(() => {
    if (!mainRef.current || !volRef.current) return;

    const chart = createChart(mainRef.current, {
      width: mainRef.current.clientWidth,
      height: mainRef.current.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#7085ad",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.035)" },
        horzLines: { color: "rgba(255,255,255,0.035)" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      handleScroll: true,
      handleScale: true,
    });

    const series = chart.addCandlestickSeries({
      upColor: "#37f4ad",
      downColor: "#ff6c8d",
      borderUpColor: "#37f4ad",
      borderDownColor: "#ff6c8d",
      wickUpColor: "#37f4ad",
      wickDownColor: "#ff6c8d",
    });

    // Dados simulados
    const now = Math.floor(Date.now() / 1000);
    const candles = Array.from({ length: 100 }, (_, i) => {
      const time = now - (100 - i) * 60;
      const base = 74000 + Math.sin(i / 10) * 1000;
      return {
        time: time as Time,
        open: base,
        high: base + Math.random() * 500,
        low: base - Math.random() * 500,
        close: base + (Math.random() - 0.5) * 300,
      };
    });

    series.setData(candles);

    // Volume
    const volChart = createChart(volRef.current, {
      width: volRef.current.clientWidth,
      height: volRef.current.clientHeight,
      layout: { background: { type: ColorType.Solid, color: "transparent" } },
      grid: { vertLines: { visible: false }, horzLines: { visible: false } },
      rightPriceScale: { visible: false },
      timeScale: { visible: false },
    });

    const volSeries = volChart.addHistogramSeries({
      color: "rgba(55,244,173,0.42)",
      priceScaleId: "",
    });

    volSeries.setData(candles.map(c => ({
      time: c.time as Time,
      value: 120 + Math.random() * 1400,
      color: c.close >= c.open ? "rgba(55,244,173,0.42)" : "rgba(255,108,141,0.42)",
    })));

    chart.timeScale().fitContent();
    volChart.timeScale().fitContent();

    // Resize
    const resize = () => {
      if (mainRef.current) {
        const w = mainRef.current.clientWidth;
        const h = mainRef.current.clientHeight;
        chart.applyOptions({ width: w, height: h });
        setSvgSize({ w, h });
      }
      if (volRef.current) {
        volChart.applyOptions({ 
          width: volRef.current.clientWidth, 
          height: volRef.current.clientHeight 
        });
      }
    };

    window.addEventListener("resize", resize);
    setSvgSize({ w: mainRef.current.clientWidth, h: mainRef.current.clientHeight });

    return () => {
      window.removeEventListener("resize", resize);
      chart.remove();
      volChart.remove();
    };
  }, []);

  // Handlers de desenho
  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (drawingState.activeTool === "cursor") return;
    const rect = e.currentTarget.getBoundingClientRect();
    setDraft({
      x1: e.clientX - rect.left,
      y1: e.clientY - rect.top,
      x2: e.clientX - rect.left,
      y2: e.clientY - rect.top,
    });
  }, [drawingState.activeTool]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!draft) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setDraft(prev => prev ? ({
      ...prev,
      x2: e.clientX - rect.left,
      y2: e.clientY - rect.top,
    }) : null);
  }, [draft]);

  const handleMouseUp = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!draft || drawingState.activeTool === "cursor") return;
    const rect = e.currentTarget.getBoundingClientRect();
    drawingState.addDrawing({
      id: `draw-${Date.now()}`,
      tool: drawingState.activeTool,
      x1: draft.x1,
      y1: draft.y1,
      x2: e.clientX - rect.left,
      y2: e.clientY - rect.top,
      color: TOOL_COLORS[drawingState.activeTool],
    });
    setDraft(null);
  }, [draft, drawingState]);

  // Renderiza SVG
  const renderDrawing = (d: Drawing) => {
    switch (d.tool) {
      case "trendline":
        return <line key={d.id} x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} 
          stroke={d.color} strokeWidth={2} />;
      case "hline":
        return <line key={d.id} x1={0} y1={d.y1} x2={svgSize.w} y2={d.y1} 
          stroke={d.color} strokeWidth={2} strokeDasharray="5,3" />;
      case "vline":
        return <line key={d.id} x1={d.x1} y1={0} x2={d.x1} y2={svgSize.h} 
          stroke={d.color} strokeWidth={2} strokeDasharray="5,3" />;
      case "rect":
        return <rect key={d.id} x={Math.min(d.x1,d.x2)} y={Math.min(d.y1,d.y2)} 
          width={Math.abs(d.x2-d.x1)} height={Math.abs(d.y2-d.y1)}
          fill={`${d.color}22`} stroke={d.color} strokeWidth={2} />;
      case "fib":
        return <line key={d.id} x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} 
          stroke={d.color} strokeWidth={2} />;
      default:
        return null;
    }
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100%", width: "100%",
      background: "linear-gradient(180deg, rgba(7,12,24,0.98), rgba(6,10,18,0.98))",
    }}>
      {/* Header info */}
      <div style={{
        padding: "8px 10px", borderBottom: "1px solid #172133",
        display: "grid", gridTemplateColumns: "1fr repeat(4, 120px)", gap: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 7,
            background: "rgba(247,201,72,0.16)", color: "#f7c948",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 900,
          }}>SC</div>
          <div>
            <div style={{ color: "#eef6ff", fontSize: 14, fontWeight: 900 }}>BTC</div>
            <div style={{ color: "#7d91b6", fontSize: 10 }}>Scanner Atlas</div>
          </div>
        </div>
        {["Preço", "Variação", "Volume", "Desenhos"].map(label => (
          <div key={label} style={{
            borderRadius: 13, border: "1px solid rgba(255,255,255,0.06)",
            background: "linear-gradient(180deg, rgba(8,15,31,0.98), rgba(7,12,24,0.96))",
            minHeight: 58, padding: "10px 13px",
          }}>
            <div style={{ color: "#7f93b7", fontSize: 9, fontWeight: 900, textTransform: "uppercase" }}>
              {label}
            </div>
            <div style={{ color: "#4ef0cb", fontSize: 12, fontWeight: 900 }}>--</div>
          </div>
        ))}
      </div>

      {/* Botões */}
      <div style={{
        height: 28, padding: "0 10px", display: "flex", alignItems: "center", gap: 4,
        borderBottom: "1px solid #172133", background: "rgba(255,255,255,0.012)",
      }}>
        <button style={{
          padding: "2px 8px", borderRadius: 5, border: "1px solid rgba(255,255,255,0.07)",
          background: "transparent", color: "#9ab0d4", fontSize: 10, fontWeight: 700, cursor: "pointer",
        }}>🔒 Travar</button>
        <button style={{
          padding: "2px 8px", borderRadius: 5, border: "1px solid rgba(255,255,255,0.07)",
          background: "transparent", color: "#9ab0d4", fontSize: 10, fontWeight: 700, cursor: "pointer",
        }}>⚙ Config.</button>
        <button style={{
          padding: "2px 8px", borderRadius: 5, border: "1px solid rgba(255,255,255,0.07)",
          background: "transparent", color: "#ff3060", fontSize: 10, fontWeight: 700, cursor: "pointer",
        }}>✕ Apagar</button>
        <button style={{
          padding: "2px 8px", borderRadius: 5, border: "1px solid rgba(255,255,255,0.07)",
          background: "transparent", color: "#9ab0d4", fontSize: 10, fontWeight: 700, cursor: "pointer",
        }}>🗑 Limpar</button>
        <div style={{ width: 1, height: 14, background: "#172133", margin: "0 4px" }} />
        <span style={{ fontSize: 9, color: "#536887" }}>Cor:</span>
        {["#ffd54f","#00d4ff","#00e676","#ff3060","#c77dff"].map(c => (
          <div key={c} style={{
            width: 14, height: 14, borderRadius: 3, background: c, cursor: "pointer",
          }} />
        ))}
      </div>

      {/* Gráfico + Volume + SVG */}
      <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
        <div ref={mainRef} style={{ position: "absolute", inset: 0 }} />
        
        <svg
          ref={svgRef}
          width={svgSize.w} height={svgSize.h}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => setDraft(null)}
          style={{
            position: "absolute", inset: 0, zIndex: 4,
            cursor: drawingState.activeTool !== "cursor" ? "crosshair" : "default",
          }}
        >
          {drawingState.drawings.map(renderDrawing)}
          {draft && (
            <line x1={draft.x1} y1={draft.y1} x2={draft.x2} y2={draft.y2}
              stroke={TOOL_COLORS[drawingState.activeTool]} strokeWidth={2} opacity={0.6} />
          )}
        </svg>

        <div ref={volRef} style={{
          position: "absolute", left: 0, right: 0, bottom: 0, height: 140,
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }} />
      </div>
    </div>
  );
}

// COMPONENTE PRINCIPAL
export default function AtlasChartLite() {
  const drawingState = useDrawings();

  return (
    <div style={{
      width: "100%", height: "100vh",
      display: "flex", flexDirection: "column",
      background: "#060913", color: "#ebf3ff",
      fontFamily: "Inter, Arial, sans-serif",
    }}>
      <TopBar symbol="BTC" />
      
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <DrawingToolbar 
          activeTool={drawingState.activeTool} 
          onChangeTool={drawingState.setActiveTool} 
        />
        
        <div style={{ flex: 1 }}>
          <ChartPanel drawingState={drawingState} />
        </div>
      </div>
    </div>
  );
}
