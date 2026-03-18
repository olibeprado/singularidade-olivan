"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
  type Time,
} from "lightweight-charts";
import LiquidityPanel from "./atlas-v3/LiquidityPanel";
import ScannerPanel from "./atlas-v3/ScannerPanel";

type Candle = {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type TopModule =
  | "Fluxo"
  | "Singularidade"
  | "IA Atlas"
  | "Scanner"
  | "Estrutura"
  | "Euler"
  | "Liquidez";

type ToolKey =
  | "cursor"
  | "draw"
  | "shapes"
  | "measure"
  | "fib"
  | "patterns"
  | "longshort"
  | "forecast"
  | "more";

type ToolOption = {
  id: string;
  label: string;
  icon: string;
};

type ChartPoint = {
  time: number;
  price: number;
};

type ScreenPoint = {
  x: number;
  y: number;
};

type DrawingType = "line" | "fib";

type DrawingStyle = "solid" | "dashed";

type ProfessionalDrawing = {
  id: string;
  type: DrawingType;
  start: ChartPoint;
  end: ChartPoint;
  color: string;
  style: DrawingStyle;
  locked?: boolean;
  hidden?: boolean;
};

type DragTarget =
  | { drawingId: string; handle: "start" | "end" | "move-all"; anchor?: ChartPoint }
  | null;

const TOOL_DATA: Record<
  ToolKey,
  { label: string; icon: string; options: ToolOption[] }
> = {
  cursor: {
    label: "Cursor",
    icon: "⌖",
    options: [
      { id: "cursor-default", label: "Padrão", icon: "⌖" },
      { id: "cursor-dot", label: "Ponto", icon: "•" },
    ],
  },
  draw: {
    label: "Linhas",
    icon: "╱",
    options: [
      { id: "line-trend", label: "Linha de Tendência", icon: "╱" },
      { id: "line-horizontal", label: "Linha Horizontal", icon: "―" },
      { id: "line-vertical", label: "Linha Vertical", icon: "┃" },
    ],
  },
  shapes: {
    label: "Formas",
    icon: "▢",
    options: [{ id: "shape-rect", label: "Retângulo", icon: "▢" }],
  },
  measure: {
    label: "Medição",
    icon: "📏",
    options: [{ id: "meas-ruler", label: "Régua", icon: "📏" }],
  },
  fib: {
    label: "Fibonacci",
    icon: "≡",
    options: [{ id: "fib-retracement", label: "Retração", icon: "≡" }],
  },
  patterns: {
    label: "Padrões",
    icon: "△",
    options: [{ id: "pat-triangle", label: "Triângulo", icon: "△" }],
  },
  longshort: {
    label: "Posição",
    icon: "⇄",
    options: [
      { id: "ls-long", label: "Long", icon: "▲" },
      { id: "ls-short", label: "Short", icon: "▼" },
    ],
  },
  forecast: {
    label: "Previsão",
    icon: "📈",
    options: [{ id: "fore-bars", label: "Barras", icon: "📊" }],
  },
  more: {
    label: "Mais",
    icon: "⋯",
    options: [{ id: "more-text", label: "Texto", icon: "T" }],
  },
};

const topModules: TopModule[] = [
  "Fluxo",
  "Singularidade",
  "IA Atlas",
  "Scanner",
  "Estrutura",
  "Euler",
  "Liquidez",
];

const bottomTabs = [
  "Pressão",
  "Volume",
  "Confluência",
  "Pulso",
  "Score",
  "Risco",
  "Curvatura",
  "Validação",
  "Ciclo",
];

function makeDrawingId(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

function normalizeTime(value: Time | null): number | null {
  if (value == null) return null;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Math.floor(new Date(value).getTime() / 1000);

  if ("year" in value && "month" in value && "day" in value) {
    return Math.floor(
      Date.UTC(value.year, value.month - 1, value.day, 0, 0, 0) / 1000
    );
  }

  return null;
}

function formatPriceLabel(price: number): string {
  return price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function StatCard({
  title,
  value,
  positive,
}: {
  title: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        borderRadius: 12,
        padding: "12px 16px",
        minWidth: 140,
      }}
    >
      <div
        style={{
          color: "#93a9cf",
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: 1,
          marginBottom: 4,
        }}
      >
        {title}
      </div>
      <div
        style={{
          color: positive ? "#00f2ff" : "#fff",
          fontSize: 18,
          fontWeight: 700,
          fontFamily: "JetBrains Mono, monospace",
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default function AtlasChartPro2() {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [activeModule, setActiveModule] = useState<TopModule>("Singularidade");
  const [activeTool, setActiveTool] = useState<ToolKey>("cursor");
  const [activeToolOption, setActiveToolOption] = useState("cursor-default");
  const [activeBottomTab, setActiveBottomTab] = useState("Pressão");
  const [viewMode, setViewMode] = useState<"auto" | "manual">("auto");

  const [chartSize, setChartSize] = useState({ width: 0, height: 720 });

  const [isDrawing, setIsDrawing] = useState(false);
  const [drawings, setDrawings] = useState<ProfessionalDrawing[]>([]);
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);
  const [draftDrawing, setDraftDrawing] = useState<ProfessionalDrawing | null>(null);
  const [dragTarget, setDragTarget] = useState<DragTarget>(null);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [crosshairPrice, setCrosshairPrice] = useState<number | null>(null);
  const [crosshairTime, setCrosshairTime] = useState<number | null>(null);

  const [, setTick] = useState(0);

  const scannerRows = useMemo(() => {
  return Array.from({ length: 15 }).map((_, i) => ({
    asset: ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT"][i % 5],
    price: (40000 + Math.random() * 20000).toFixed(2),
    change: (Math.random() * 10 - 5).toFixed(2),
    score: Math.floor(Math.random() * 100),
    trend: Math.random() > 0.5 ? "up" : "down",
    signal: Math.random() > 0.7 ? "BUY" : Math.random() > 0.7 ? "SELL" : "WAIT",
  }));
}, []);
  const pulseConfig = {
    color: "#5ee7ff",
    speed: 2,
    intensity: 0.8,
  };

  const screenToChart = useCallback((x: number, y: number): ChartPoint | null => {
    if (!chartRef.current || !candleSeriesRef.current) return null;

    const price = candleSeriesRef.current.coordinateToPrice(y);
    const timeValue = chartRef.current.timeScale().coordinateToTime(x);
    const time = normalizeTime(timeValue);

    if (price == null || time == null) return null;
    return { time, price };
  }, []);

  const chartToScreen = useCallback((point: ChartPoint): ScreenPoint | null => {
    if (!chartRef.current || !candleSeriesRef.current) return null;

    const x = chartRef.current.timeScale().timeToCoordinate(point.time as UTCTimestamp);
    const y = candleSeriesRef.current.priceToCoordinate(point.price);

    if (x == null || y == null) return null;
    return { x, y };
  }, []);

  const renderDrawing = useCallback(
    (drawing: ProfessionalDrawing, isDraft = false) => {
      if (drawing.hidden && !isDraft) return null;

      const selected = drawing.id === selectedDrawingId;
      const start = chartToScreen(drawing.start);
      const end = chartToScreen(drawing.end);

      if (!start || !end) return null;

      if (drawing.type === "line") {
        return (
          <g key={drawing.id} style={{ pointerEvents: "auto" }}>
            <line
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke="transparent"
              strokeWidth="20"
              style={{ cursor: drawing.locked ? "default" : "move" }}
              onMouseDown={(e) => {
                if (drawing.locked) return;
                e.stopPropagation();
                setSelectedDrawingId(drawing.id);
                setDragTarget({
                  drawingId: drawing.id,
                  handle: "move-all",
                  anchor: screenToChart(mousePos.x, mousePos.y) ?? drawing.start,
                });
              }}
            />

            <line
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke={selected ? "#00f2ff" : drawing.color}
              strokeWidth={selected ? 2.5 : 1.5}
              strokeDasharray={drawing.style === "dashed" ? "5 5" : undefined}
              style={{ pointerEvents: "none" }}
            />

            {selected && !drawing.locked && !isDraft && (
              <>
                <circle
                  cx={start.x}
                  cy={start.y}
                  r="6"
                  fill="#0b1222"
                  stroke="#00f2ff"
                  strokeWidth="2"
                  style={{ cursor: "nwse-resize" }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setDragTarget({ drawingId: drawing.id, handle: "start" });
                  }}
                />
                <circle
                  cx={end.x}
                  cy={end.y}
                  r="6"
                  fill="#0b1222"
                  stroke="#00f2ff"
                  strokeWidth="2"
                  style={{ cursor: "nwse-resize" }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setDragTarget({ drawingId: drawing.id, handle: "end" });
                  }}
                />
              </>
            )}
          </g>
        );
      }

      const fibLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];

      return (
        <g key={drawing.id} style={{ pointerEvents: "auto" }}>
          <line
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke="transparent"
            strokeWidth="20"
            style={{ cursor: drawing.locked ? "default" : "move" }}
            onMouseDown={(e) => {
              if (drawing.locked) return;
              e.stopPropagation();
              setSelectedDrawingId(drawing.id);
              setDragTarget({
                drawingId: drawing.id,
                handle: "move-all",
                anchor: screenToChart(mousePos.x, mousePos.y) ?? drawing.start,
              });
            }}
          />

          {fibLevels.map((lvl) => {
            const y = start.y + (end.y - start.y) * lvl;
            const price = drawing.start.price + (drawing.end.price - drawing.start.price) * lvl;

            return (
              <g key={`${drawing.id}-${lvl}`}>
                <line
                  x1={0}
                  y1={y}
                  x2={chartSize.width}
                  y2={y}
                  stroke={selected ? "rgba(0,242,255,0.55)" : "rgba(0,242,255,0.25)"}
                  strokeWidth={lvl === 0 || lvl === 1 ? 1.5 : 1}
                  strokeDasharray="4 4"
                />
                <text
                  x={chartSize.width - 110}
                  y={y - 4}
                  fill="#7edfff"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {(lvl * 100).toFixed(1)}% · {formatPriceLabel(price)}
                </text>
              </g>
            );
          })}

          {selected && !drawing.locked && !isDraft && (
            <>
              <circle
                cx={start.x}
                cy={start.y}
                r="6"
                fill="#0b1222"
                stroke="#00f2ff"
                strokeWidth="2"
                style={{ cursor: "nwse-resize" }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setDragTarget({ drawingId: drawing.id, handle: "start" });
                }}
              />
              <circle
                cx={end.x}
                cy={end.y}
                r="6"
                fill="#0b1222"
                stroke="#00f2ff"
                strokeWidth="2"
                style={{ cursor: "nwse-resize" }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setDragTarget({ drawingId: drawing.id, handle: "end" });
                }}
              />
            </>
          )}
        </g>
      );
    },
    [chartSize.width, chartToScreen, mousePos.x, mousePos.y, screenToChart, selectedDrawingId]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedDrawingId) {
        setDrawings((prev) => prev.filter((d) => d.id !== selectedDrawingId));
        setSelectedDrawingId(null);
      }

      if (e.key === "Escape") {
        setSelectedDrawingId(null);
        setIsDrawing(false);
        setDraftDrawing(null);
        setDragTarget(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedDrawingId]);

  const handleClearAll = () => {
    if (window.confirm("Limpar todos os estudos do gráfico?")) {
      setDrawings([]);
      setSelectedDrawingId(null);
      setDraftDrawing(null);
      setIsDrawing(false);
      setDragTarget(null);
    }
  };

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setMousePos({ x, y });

      const chartPoint = screenToChart(x, y);
      if (!chartPoint) return;

      setCrosshairPrice(chartPoint.price);
      setCrosshairTime(chartPoint.time);

      if (isDrawing && draftDrawing) {
        setDraftDrawing((prev) => (prev ? { ...prev, end: chartPoint } : null));
        return;
      }

      if (dragTarget) {
        const { drawingId, handle } = dragTarget;

        setDrawings((prev) =>
          prev.map((d) => {
            if (d.id !== drawingId) return d;

            if (handle === "start") {
              return { ...d, start: chartPoint };
            }

            if (handle === "end") {
              return { ...d, end: chartPoint };
            }

            if (handle === "move-all") {
              const anchor = dragTarget.anchor ?? d.start;
              const dx = chartPoint.time - anchor.time;
              const dy = chartPoint.price - anchor.price;

              return {
                ...d,
                start: {
                  time: d.start.time + dx,
                  price: d.start.price + dy,
                },
                end: {
                  time: d.end.time + dx,
                  price: d.end.price + dy,
                },
              };
            }

            return d;
          })
        );

        if (handle === "move-all") {
          setDragTarget((prev) =>
            prev && prev.handle === "move-all"
              ? { ...prev, anchor: chartPoint }
              : prev
          );
        }
      }
    };

    const handleMouseUp = () => {
      if (isDrawing && draftDrawing) {
        setDrawings((prev) => [...prev, draftDrawing]);
        setSelectedDrawingId(draftDrawing.id);
        setDraftDrawing(null);
        setIsDrawing(false);
      }
      setDragTarget(null);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (activeToolOption === "cursor-default" || activeToolOption === "cursor-dot") {
        setSelectedDrawingId(null);
        return;
      }

      const rect = container.getBoundingClientRect();
      const point = screenToChart(e.clientX - rect.left, e.clientY - rect.top);
      if (!point) return;

      setIsDrawing(true);

      const isFib = activeTool === "fib" || activeToolOption.includes("fib");

      const newDrawing: ProfessionalDrawing = {
        id: makeDrawingId(),
        type: isFib ? "fib" : "line",
        start: point,
        end: point,
        color: "#00f2ff",
        style: "solid",
        locked: false,
        hidden: false,
      };

      setDraftDrawing(newDrawing);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("mousedown", handleMouseDown);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("mousedown", handleMouseDown);
    };
  }, [activeTool, activeToolOption, dragTarget, draftDrawing, isDrawing, screenToChart]);

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: 720,
      layout: {
        background: { type: ColorType.Solid, color: "#06080c" },
        textColor: "#93a9cf",
        fontSize: 11,
        fontFamily: "'JetBrains Mono', monospace",
      },
      grid: {
        vertLines: { color: "rgba(42, 46, 57, 0.05)" },
        horzLines: { color: "rgba(42, 46, 57, 0.05)" },
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.1)",
        autoScale: viewMode === "auto",
        alignLabels: true,
      },
      timeScale: {
        borderColor: "rgba(255, 255, 255, 0.1)",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 15,
        barSpacing: 8,
      },
      handleScale: {
        mouseWheel: true,
        pinch: true,
        axisPressedMouseMove: {
          time: true,
          price: true,
        },
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        vertTouchDrag: true,
      },
      crosshair: {
        mode: 0,
        vertLine: { color: "#5ee7ff", width: 1, style: 3, labelBackgroundColor: "#1e222d" },
        horzLine: { color: "#5ee7ff", width: 1, style: 3, labelBackgroundColor: "#1e222d" },
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: "#00f2ff",
      downColor: "#ff3e60",
      borderVisible: false,
      wickUpColor: "#00f2ff",
      wickDownColor: "#ff3e60",
    });

    const data: Candle[] = [];
    let price = 50000;

    for (let i = 0; i < 300; i++) {
      const open = price + Math.random() * 100 - 50;
      const close = open + Math.random() * 100 - 50;
      const high = Math.max(open, close) + Math.random() * 20;
      const low = Math.min(open, close) - Math.random() * 20;

      data.push({
        time: (1672531200 + i * 86400) as UTCTimestamp,
        open,
        high,
        low,
        close,
        volume: Math.random() * 1000,
      });

      price = close;
    }

    candlestickSeries.setData(data);

    chartRef.current = chart;
    candleSeriesRef.current = candlestickSeries;

    const handleResize = () => {
      if (!chartContainerRef.current) return;
      const width = chartContainerRef.current.clientWidth;
      chart.applyOptions({ width });
      setChartSize({ width, height: 720 });
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const handleCrosshairMove = (param: any) => {
    if (!param.point) return;
    setMousePos({ x: param.point.x, y: param.point.y });
    };

    chart.subscribeCrosshairMove(handleCrosshairMove);

    chart.timeScale().subscribeVisibleLogicalRangeChange(() => setTick((t) => t + 1));
    chart.subscribeCrosshairMove(() => setTick((t) => t + 1));

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
    };
  }, [viewMode]);

  useEffect(() => {
    if (activeModule === "Singularidade") {
      console.log("ATLAS: Sincronização Neural Estável. Protocolo Titânio em execução.");
    }
  }, [activeModule]);

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        backgroundColor: "#06080c",
        color: "#93a9cf",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Inter', sans-serif",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: 70,
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          background: "linear-gradient(to right, #06080c, #0a0d14)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: 45,
                height: 45,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(94,231,255,0.2) 0%, transparent 70%)",
                animation: "pulseAura 3s infinite ease-in-out",
              }}
            />
            <div
              style={{
                fontSize: 24,
                color: "#00f2ff",
                filter: "drop-shadow(0 0 8px rgba(0,242,255,0.8))",
                cursor: "pointer",
                zIndex: 2,
              }}
            >
              ✦
            </div>
          </div>

          <nav style={{ display: "flex", gap: 8 }}>
            {topModules.map((m) => (
              <button
                key={m}
                onClick={() => setActiveModule(m)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 600,
                  transition: "all 0.2s",
                  background: activeModule === m ? "rgba(94,231,255,0.1)" : "transparent",
                  color: activeModule === m ? "#00f2ff" : "#637b9d",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {m}
              </button>
            ))}
          </nav>
        </div>

        <div style={{ display: "flex", gap: 15, alignItems: "center" }}>
          <button
            onClick={() => setViewMode((v) => (v === "auto" ? "manual" : "auto"))}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              fontSize: 11,
              background: viewMode === "manual" ? "#ffcc00" : "rgba(255,255,255,0.05)",
              color: viewMode === "manual" ? "#000" : "#93a9cf",
              border: "1px solid rgba(255,255,255,0.1)",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            {viewMode === "auto" ? "ESCALA: AUTO" : "ESCALA: MANUAL"}
          </button>

          <StatCard title="ATLAS SCORE" value="94.2" positive />
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", position: "relative", overflow: "hidden" }}>
        <div
          style={{
            width: 55,
            borderRight: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "15px 0",
            gap: 20,
            background: "#080a0f",
          }}
        >
          {(Object.keys(TOOL_DATA) as ToolKey[]).map((key) => (
            <div key={key} style={{ position: "relative" }}>
              <button
                onClick={() => {
                  setActiveTool(key);
                  setActiveToolOption(TOOL_DATA[key].options[0].id);
                }}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  transition: "all 0.2s",
                  background: activeTool === key ? "rgba(94,231,255,0.15)" : "transparent",
                  color: activeTool === key ? "#00f2ff" : "#637b9d",
                  border: "none",
                  cursor: "pointer",
                }}
                title={TOOL_DATA[key].label}
              >
                {TOOL_DATA[key].icon}
              </button>
            </div>
          ))}

          <div style={{ flex: 1 }} />

          <button
            onClick={handleClearAll}
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              background: "rgba(255, 62, 96, 0.1)",
              color: "#ff3e60",
              border: "1px solid rgba(255, 62, 96, 0.2)",
              cursor: "pointer",
              fontSize: "14px",
              marginBottom: "10px",
            }}
            title="Limpar Estudos"
          >
            🗑️
          </button>
        </div>

        <div style={{ flex: 1, position: "relative", display: "flex", overflow: "hidden" }}>
          <div
            ref={chartContainerRef}
            style={{
              flex: 1,
              position: "relative",
              cursor: "crosshair",
            }}
          >
            <svg
              ref={svgRef}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: 10,
                overflow: "hidden",
              }}
            >
              {drawings.map((d) => renderDrawing(d))}
              {draftDrawing && renderDrawing(draftDrawing, true)}

              {activeToolOption === "cursor-dot" && (
                <circle cx={mousePos.x} cy={mousePos.y} r="3" fill="#00f2ff" />
              )}

              {crosshairPrice != null && (
                <text
                  x={12}
                  y={22}
                  fill="#7edfff"
                  fontSize="11"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {`Preço: ${formatPriceLabel(crosshairPrice)}`}
                </text>
              )}

              {crosshairTime != null && (
                <text
                  x={12}
                  y={40}
                  fill="#6785b5"
                  fontSize="11"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {`Time: ${crosshairTime}`}
                </text>
              )}
            </svg>
          </div>

          <div
            style={{
              width: 320,
              borderLeft: "1px solid rgba(255,255,255,0.05)",
              background: "rgba(10, 13, 20, 0.5)",
              backdropFilter: "blur(10px)",
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
            }}
          >
           <div
  style={{
    width: 320,
    borderLeft: "1px solid rgba(255,255,255,0.05)",
    background: "rgba(10, 13, 20, 0.5)",
    backdropFilter: "blur(10px)",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
    padding: 16,
    color: "#8ea4c8",
    fontSize: 12,
  }}
>
  Painel de liquidez temporariamente desativado.
</div>
          </div>
        </div>
      </div>

      <div
        style={{
          height: 45,
          borderTop: "1px solid rgba(255,255,255,0.05)",
          background: "#080a0f",
          display: "flex",
          alignItems: "center",
          padding: "0 15px",
          gap: 20,
        }}
      >
        <div style={{ display: "flex", gap: 5 }}>
          {bottomTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveBottomTab(tab)}
              style={{
                padding: "4px 12px",
                borderRadius: 4,
                fontSize: 11,
                fontWeight: activeBottomTab === tab ? 700 : 400,
                background:
                  activeBottomTab === tab ? "rgba(94,231,255,0.1)" : "transparent",
                color: activeBottomTab === tab ? "#00f2ff" : "#637b9d",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        <div
          style={{
            fontSize: 10,
            color: "#445571",
            fontFamily: "JetBrains Mono, monospace",
          }}
        >
          SISTEMA ATLAS V3 // PROTOCOLO TITÂNIO ATIVO
        </div>
      </div>

      <div
        style={{
          padding: "20px 25px",
          background: "linear-gradient(180deg, #080a0f 0%, #06080c 100%)",
          borderTop: "1px solid rgba(255,255,255,0.03)",
          minHeight: 180,
        }}
      >
        {activeModule === "IA Atlas" ? (
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#00f2ff",
                boxShadow: "0 0 10px #00f2ff",
                animation: "pulseAura 2s infinite",
              }}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 14,
                  marginBottom: 4,
                }}
              >
                Análise Neural Atlas
              </div>
              <div style={{ color: "#93a9cf", fontSize: 13, lineHeight: "1.5" }}>
                Processando clusters de liquidez em tempo real. Padrão de exaustão
                identificado no nível atual. Aguardando confluência do indicador de
                volume para confirmação de reversão.
              </div>
            </div>
          </div>
        ) : activeModule === "Scanner" ? (
          <ScannerPanel rows={scannerRows} pulseConfig={pulseConfig} isSmall={false} />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: 11, color: "#445571" }}>FORÇA DO FLUXO</span>
              <div
                style={{
                  height: 4,
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: 2,
                }}
              >
                <div
                  style={{
                    width: "75%",
                    height: "100%",
                    background: "#00f2ff",
                    boxShadow: "0 0 10px #00f2ff",
                  }}
                />
              </div>
            </div>
            <StatCard title="PRESSÃO COMPRADORA" value="68%" positive />
            <StatCard title="VOLATILIDADE" value="MÉDIA" />
            <StatCard title="DELTA ACUMULADO" value="+12.4k" positive />
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes pulseAura {
          0% {
            transform: scale(0.95);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.6;
          }
          100% {
            transform: scale(0.95);
            opacity: 0.3;
          }
        }

        ::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 242, 255, 0.3);
        }

        .tv-lightweight-charts {
          border-radius: 4px;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
