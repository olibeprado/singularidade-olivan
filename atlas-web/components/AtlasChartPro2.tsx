"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { createChart, ColorType, CrosshairMode, IChartApi, Time } from "lightweight-charts";

// ============================================================
// TIPOS
// ============================================================
type DrawTool = "cursor" | "trendline" | "hline" | "vline" | "ray" | "extended" | "channel" | "fib" | "fibext" | "fibarc" | "rect" | "ellipse" | "triangle" | "measure" | "text";
type Timeframe = "1m" | "5m" | "15m" | "30m" | "1H" | "4H" | "1D";
type ModeKey = "auto" | "manual" | "space";

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
  showPercent?: boolean;
  channelOffset?: number;
  p1?: number;
  p2?: number;
}

interface FibLevel {
  pct: number;
  color: string;
  visible: boolean;
}

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ============================================================
// CONSTANTES
// ============================================================
const DEFAULT_FIB_LEVELS: FibLevel[] = [
  { pct: 0, color: "#f5c842", visible: true },
  { pct: 0.236, color: "#2de2ff", visible: true },
  { pct: 0.382, color: "#00c896", visible: true },
  { pct: 0.5, color: "#ff8c00", visible: true },
  { pct: 0.618, color: "#a78bfa", visible: true },
  { pct: 0.786, color: "#ff4466", visible: true },
  { pct: 1.0, color: "#f5c842", visible: true },
  { pct: 1.272, color: "#448aff", visible: false },
  { pct: 1.618, color: "#00c896", visible: false },
];

const TOOL_COLORS: Record<DrawTool, string> = {
  cursor: "#ffffff",
  trendline: "#2de2ff",
  hline: "#f5c842",
  vline: "#f5c842",
  ray: "#ff8c00",
  extended: "#2de2ff",
  channel: "#448aff",
  fib: "#f5c842",
  fibext: "#00c896",
  fibarc: "#ff8c00",
  rect: "#2de2ff",
  ellipse: "#ff8c00",
  triangle: "#00c896",
  measure: "#00c896",
  text: "#ffffff",
};

const TOOL_LABELS: Record<DrawTool, string> = {
  cursor: "Cursor",
  trendline: "Tendência",
  hline: "Horizontal",
  vline: "Vertical",
  ray: "Raio",
  extended: "Estendida",
  channel: "Canal",
  fib: "Fibonacci",
  fibext: "Fib Ext",
  fibarc: "Fib Arc",
  rect: "Retângulo",
  ellipse: "Elipse",
  triangle: "Triângulo",
  measure: "Medida",
  text: "Texto",
};

// ============================================================
// UTILS
// ============================================================
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
    fibLevels: ["fib", "fibext", "fibarc"].includes(tool)
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
  const dx = d.x2 - d.x1,
    dy = d.y2 - d.y1;
  const t = Math.max(
    0,
    Math.min(1, ((mx - d.x1) * dx + (my - d.y1) * dy) / (dx * dx + dy * dy + 0.001))
  );
  return Math.sqrt((mx - d.x1 - t * dx) ** 2 + (my - d.y1 - t * dy) ** 2) < pad;
}

function generateCandles(count = 240, startPrice = 84000): CandleData[] {
  const candles: CandleData[] = [];
  let prevClose = startPrice;
  const now = Math.floor(Date.now() / 1000);
  const interval = 300; // 5 minutes

  for (let i = count; i > 0; i--) {
    const time = now - i * interval;
    const drift = (Math.random() - 0.48) * startPrice * 0.009;
    const close = prevClose + drift;
    const high = Math.max(prevClose, close) + Math.random() * startPrice * 0.004;
    const low = Math.min(prevClose, close) - Math.random() * startPrice * 0.004;
    const volume = 150 + Math.random() * 700;

    candles.push({ time, open: prevClose, high, low, close, volume });
    prevClose = close;
  }

  return candles;
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function SingularidadeChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const oscContainerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const oscChartRef = useRef<IChartApi | null>(null);

  const [tool, setTool] = useState<DrawTool>("cursor");
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftP1, setDraftP1] = useState<{ x: number; y: number } | null>(null);
  const [draftP2, setDraftP2] = useState<{ x: number; y: number } | null>(null);
  const [clickCount, setClickCount] = useState(0);
  const [dragging, setDragging] = useState<{
    id: string;
    sx: number;
    sy: number;
    orig: Drawing;
  } | null>(null);
  const [currentTF, setCurrentTF] = useState<Timeframe>("15m");
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [svgSize, setSvgSize] = useState({ w: 800, h: 600 });

  // Initialize charts
  useEffect(() => {
    if (!chartContainerRef.current || !oscContainerRef.current) return;

    const candlesData = generateCandles(240, 84000);
    setCandles(candlesData);

    const chartOpts = {
      layout: {
        background: { type: ColorType.Solid as const, color: "transparent" },
        textColor: "#4a6080",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: "rgba(26,36,56,.5)", style: 1 as const },
        horzLines: { color: "rgba(26,36,56,.5)", style: 1 as const },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: "rgba(26,36,56,.8)" },
      timeScale: {
        borderColor: "rgba(26,36,56,.8)",
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    };

    const chart = createChart(chartContainerRef.current, chartOpts);
    chartRef.current = chart;

    const series = chart.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderUpColor: "#26a69a",
      borderDownColor: "#ef5350",
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    series.setData(
      candlesData.map((c) => ({
        time: c.time as Time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );

    // Add MAs
    const addMA = (period: number, color: string) => {
      const maSeries = chart.addLineSeries({
        color,
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        crossHairMarkerVisible: false,
      });

      const ma = candlesData.map((_, i) => {
        if (i < period - 1) return { time: candlesData[i].time, value: candlesData[i].close };
        let sum = 0;
        for (let j = i - period + 1; j <= i; j++) sum += candlesData[j].close;
        return { time: candlesData[i].time, value: sum / period };
      });

      maSeries.setData(ma);
      return maSeries;
    };

    addMA(21, "#f5c842");
    addMA(55, "#2de2ff");
    addMA(89, "#a78bfa");

    chart.timeScale().fitContent();

    // OSC chart
    const oscChart = createChart(oscContainerRef.current, {
      ...chartOpts,
      width: oscContainerRef.current.clientWidth,
      height: oscContainerRef.current.clientHeight,
      rightPriceScale: {
        borderColor: "rgba(26,36,56,.8)",
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
    });
    oscChartRef.current = oscChart;

    const rsiSeries = oscChart.addLineSeries({
      color: "#a78bfa",
      lineWidth: 1.5,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    const mfiSeries = oscChart.addLineSeries({
      color: "#4a6080",
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      lineStyle: 1 as const,
    });

    // Simple RSI calculation
    const rsi = calculateRSI(candlesData, 14);
    rsiSeries.setData(
      candlesData.map((c, i) => ({
        time: c.time as Time,
        value: Math.min(100, Math.max(0, rsi[i] || 50)),
      }))
    );

    mfiSeries.setData(
      candlesData.map((c, i) => ({
        time: c.time as Time,
        value: Math.min(100, Math.max(0, (rsi[i] || 50) + Math.sin(i * 0.3) * 6)),
      }))
    );

    oscChart.timeScale().fitContent();

    // Sync scroll
    chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (range) oscChart.timeScale().setVisibleLogicalRange(range);
    });

    // Resize handler
    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
      if (oscContainerRef.current && oscChart) {
        oscChart.applyOptions({
          width: oscContainerRef.current.clientWidth,
          height: oscContainerRef.current.clientHeight,
        });
      }
      if (chartContainerRef.current) {
        setSvgSize({
          w: chartContainerRef.current.clientWidth,
          h: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      oscChart.remove();
    };
  }, []);

  // SVG Event Handlers
  const handleSvgMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (e.button === 2) return;
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      if (tool === "cursor") {
        const hit = [...drawings]
          .reverse()
          .find((d) => !d.hidden && hitTestDrawing(d, mx, my));
        if (hit && !hit.locked) {
          setSelectedId(hit.id);
          setDragging({ id: hit.id, sx: mx, sy: my, orig: { ...hit } });
        } else {
          setSelectedId(null);
        }
        return;
      }

      if (clickCount === 0) {
        setDraftP1({ x: mx, y: my });
        setDraftP2({ x: mx, y: my });
        setClickCount(1);
      } else if (clickCount === 1) {
        finishDraw(mx, my);
        setDraftP1(null);
        setDraftP2(null);
        setClickCount(0);
        setTool("cursor");
      }
    },
    [tool, drawings, clickCount]
  );

  const handleSvgMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      if (clickCount >= 1) {
        setDraftP2({ x: mx, y: my });
      }

      if (dragging && e.buttons === 1) {
        const dx = mx - dragging.sx;
        const dy = my - dragging.sy;
        const o = dragging.orig;

        let patch: Partial<Drawing> = {
          x1: o.x1 + dx,
          y1: o.y1 + dy,
          x2: o.x2 + dx,
          y2: o.y2 + dy,
        };

        if (o.tool === "hline") {
          patch = { x1: o.x1, x2: o.x2, y1: o.y1 + dy, y2: o.y2 + dy };
        }
        if (o.tool === "vline") {
          patch = { x1: o.x1 + dx, x2: o.x2 + dx, y1: o.y1, y2: o.y2 };
        }

        setDrawings((prev) =>
          prev.map((d) => (d.id === dragging.id ? { ...d, ...patch } : d))
        );
      }
    },
    [clickCount, dragging]
  );

  const handleSvgMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  const finishDraw = (x2: number, y2: number) => {
    if (!draftP1) return;
    const d = newDrawing(tool, draftP1.x, draftP1.y, x2, y2);
    setDrawings((prev) => [...prev, d]);
    setSelectedId(d.id);
  };

  const setToolHandler = (t: DrawTool) => {
    setTool(t);
    setDraftP1(null);
    setDraftP2(null);
    setClickCount(0);
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setDrawings((prev) => prev.filter((d) => d.id !== selectedId));
    setSelectedId(null);
  };

  const clearAll = () => {
    setDrawings([]);
    setSelectedId(null);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelected();
        return;
      }

      if (e.key === "Escape") {
        setSelectedId(null);
        setDraftP1(null);
        setDraftP2(null);
        setClickCount(0);
        setTool("cursor");
        return;
      }

      const map: Record<string, DrawTool> = {
        v: "cursor",
        t: "trendline",
        h: "hline",
        r: "ray",
        f: "fib",
        g: "rect",
        m: "measure",
        x: "text",
      };

      if (map[e.key]) {
        setToolHandler(map[e.key]);
      }

      if (e.key === "z" || e.key === "Z") {
        setDrawings((prev) => prev.slice(0, -1));
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedId]);

  // Render SVG drawings
  const renderDrawing = (d: Drawing, isDraft = false) => {
    const col = d.color || "#f5c842";
    const lw = d.lineWidth || 2;
    const dash = makeDash(d.lineStyle);
    const fa = (d.fillOpacity || 10) / 100;
    const sel = d.id === selectedId && !d.locked;

    const handles = sel ? (
      <>
        <circle cx={d.x1} cy={d.y1} r={5} fill="#fff" stroke={col} strokeWidth={1.5} />
        <circle cx={d.x2} cy={d.y2} r={5} fill="#fff" stroke={col} strokeWidth={1.5} />
      </>
    ) : null;

    switch (d.tool) {
      case "hline":
        return (
          <g key={d.id}>
            <line x1={0} y1={d.y1} x2={svgSize.w} y2={d.y1} stroke={col} strokeWidth={lw} strokeDasharray={dash || undefined} />
            {d.label && <text x={6} y={d.y1 - 4} fill={col} fontSize={9} fontFamily="monospace" fontWeight="bold">{d.label}</text>}
            {sel && <circle cx={svgSize.w / 2} cy={d.y1} r={5} fill="#fff" stroke={col} strokeWidth={1.5} />}
          </g>
        );
      case "vline":
        return (
          <g key={d.id}>
            <line x1={d.x1} y1={0} x2={d.x1} y2={svgSize.h * 0.8} stroke={col} strokeWidth={lw} strokeDasharray={dash || undefined} />
            {sel && <circle cx={d.x1} cy={svgSize.h * 0.4} r={5} fill="#fff" stroke={col} strokeWidth={1.5} />}
          </g>
        );
      case "trendline": {
        const angle = Math.atan2(d.y2 - d.y1, d.x2 - d.x1);
        return (
          <g key={d.id}>
            <line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} stroke={col} strokeWidth={lw} strokeDasharray={dash || undefined} />
            {d.showArrow !== false && (
              <polygon
                fill={col}
                points={`${d.x2},${d.y2} ${d.x2 - 12 * Math.cos(angle - 0.4)},${d.y2 - 12 * Math.sin(angle - 0.4)} ${d.x2 - 12 * Math.cos(angle + 0.4)},${d.y2 - 12 * Math.sin(angle + 0.4)}`}
              />
            )}
            {d.showVariation && d.p1 && d.p2 && (
              <text x={(d.x1 + d.x2) / 2} y={(d.y1 + d.y2) / 2 + 12} fill={col} fontSize={10} fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                {((d.p2 - d.p1) / d.p1 * 100).toFixed(2)}%
              </text>
            )}
            {handles}
          </g>
        );
      }
      case "rect": {
        const rx = Math.min(d.x1, d.x2);
        const ry = Math.min(d.y1, d.y2);
        const rw = Math.abs(d.x2 - d.x1);
        const rh = Math.abs(d.y2 - d.y1);
        return (
          <g key={d.id}>
            <rect x={rx} y={ry} width={rw} height={rh} fill={col} fillOpacity={fa} stroke={col} strokeWidth={lw} rx={2} />
            {handles}
          </g>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="singularidade-chart" style={{ width: "100%", height: "100vh", display: "flex", flexDirection: "column", background: "#060c18", color: "#e8f4ff", fontFamily: "'Inter', sans-serif" }}>
      {/* Top Navigation */}
      <div style={{ display: "flex", alignItems: "center", height: 40, background: "#080e1c", borderBottom: "1px solid #1a2438", padding: "0 12px", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginRight: 6 }}>
          <div style={{ width: 26, height: 26, background: "linear-gradient(135deg,rgba(45,226,255,.25),rgba(100,60,255,.35))", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M8 2 L14 8 L8 14 L2 8 Z" />
              <path d="M8 5 L11 8 L8 11 L5 8 Z" fill="currentColor" stroke="none" opacity={0.5} />
            </svg>
          </div>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#e8f4ff", letterSpacing: 0.3 }}>SINGULARIDADE</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: "#2de2ff", background: "rgba(45,226,255,0.1)", padding: "1px 6px", borderRadius: 999, border: "1px solid rgba(45,226,255,0.2)" }}>OBP</span>
        </div>
        <div style={{ width: 1, height: 22, background: "#1a2438", margin: "0 4px" }} />
        <button style={{ display: "flex", alignItems: "center", gap: 6, height: 28, padding: "0 10px", borderRadius: 7, border: "1px solid #1e2a40", background: "rgba(255,255,255,.03)", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#e8f4ff" }}>
          <span style={{ fontSize: 13, color: "#f5c842" }}>₿</span>
          <span>BTC</span>
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 8px" }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: "#e8f4ff" }}>$84,302.06</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#00c896", fontFamily: "'JetBrains Mono', monospace" }}>+0.45%</span>
        </div>
        <div style={{ width: 1, height: 22, background: "#1a2438", margin: "0 4px" }} />
        <div style={{ display: "flex", gap: 2 }}>
          {(["1m", "5m", "15m", "30m", "1H", "4H", "1D"] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setCurrentTF(tf)}
              style={{
                height: 24,
                padding: "0 7px",
                borderRadius: 5,
                border: "1px solid transparent",
                background: currentTF === tf ? "#2de2ff" : "transparent",
                color: currentTF === tf ? "#000" : "#7a90b0",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Module Strip */}
      <div style={{ display: "flex", alignItems: "center", height: 42, background: "#080e1c", borderBottom: "1px solid #1a2438", padding: "0 14px", gap: 6 }}>
        {["Fluxo", "Singularidade", "IA Atlas", "Scanner", "Mestre Scanner", "Estrutura", "Euler", "Liquidez"].map((mod) => (
          <button
            key={mod}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              height: 30,
              padding: "0 12px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,.07)",
              background: mod === "Scanner" ? "linear-gradient(180deg, rgba(45,226,255,.15), rgba(45,226,255,.04))" : "linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.01))",
              color: mod === "Scanner" ? "#2de2ff" : "#c8d8ef",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {mod}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left Toolbar */}
        <div style={{ width: 38, background: "#080e1c", borderRight: "1px solid #1a2438", display: "flex", flexDirection: "column", alignItems: "center", padding: "6px 0", gap: 1, overflowY: "auto" }}>
          <span style={{ fontSize: 6, color: "#3d5070", letterSpacing: 0.7, textTransform: "uppercase", textAlign: "center", marginBottom: 2 }}>CURSOR</span>
          <button
            onClick={() => setToolHandler("cursor")}
            style={{
              width: 30,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 6,
              cursor: "pointer",
              color: tool === "cursor" ? "#2de2ff" : "#3d5070",
              fontSize: 12,
              background: tool === "cursor" ? "rgba(45,226,255,.1)" : "transparent",
              border: tool === "cursor" ? "1px solid rgba(45,226,255,.25)" : "1px solid transparent",
            }}
          >
            ↖
          </button>
          <div style={{ width: 22, height: 1, background: "#1a2438", margin: "3px 0" }} />
          <span style={{ fontSize: 6, color: "#3d5070", letterSpacing: 0.7, textTransform: "uppercase", textAlign: "center", marginBottom: 2 }}>LINHAS</span>
          {(["trendline", "hline", "vline", "ray", "extended"] as DrawTool[]).map((t) => (
            <button
              key={t}
              onClick={() => setToolHandler(t)}
              style={{
                width: 30,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 6,
                cursor: "pointer",
                color: tool === t ? "#2de2ff" : "#3d5070",
                fontSize: t === "extended" ? 10 : 12,
                background: tool === t ? "rgba(45,226,255,.1)" : "transparent",
                border: tool === t ? "1px solid rgba(45,226,255,.25)" : "1px solid transparent",
              }}
            >
              {t === "trendline" ? "╱" : t === "hline" ? "─" : t === "vline" ? "│" : t === "ray" ? "→" : "↔"}
            </button>
          ))}
          <div style={{ width: 22, height: 1, background: "#1a2438", margin: "3px 0" }} />
          <span style={{ fontSize: 6, color: "#3d5070", letterSpacing: 0.7, textTransform: "uppercase", textAlign: "center", marginBottom: 2 }}>FIB</span>
          <button
            onClick={() => setToolHandler("fib")}
            style={{
              width: 30,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 6,
              cursor: "pointer",
              color: tool === "fib" ? "#2de2ff" : "#3d5070",
              fontSize: 7,
              fontWeight: 800,
              fontFamily: "monospace",
              background: tool === "fib" ? "rgba(45,226,255,.1)" : "transparent",
              border: tool === "fib" ? "1px solid rgba(45,226,255,.25)" : "1px solid transparent",
            }}
          >
            FIB
          </button>
          <div style={{ width: 22, height: 1, background: "#1a2438", margin: "3px 0" }} />
          <span style={{ fontSize: 6, color: "#3d5070", letterSpacing: 0.7, textTransform: "uppercase", textAlign: "center", marginBottom: 2 }}>FORMAS</span>
          {(["rect", "ellipse", "triangle"] as DrawTool[]).map((t) => (
            <button
              key={t}
              onClick={() => setToolHandler(t)}
              style={{
                width: 30,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 6,
                cursor: "pointer",
                color: tool === t ? "#2de2ff" : "#3d5070",
                fontSize: 11,
                background: tool === t ? "rgba(45,226,255,.1)" : "transparent",
                border: tool === t ? "1px solid rgba(45,226,255,.25)" : "1px solid transparent",
              }}
            >
              {t === "rect" ? "▭" : t === "ellipse" ? "◯" : "△"}
            </button>
          ))}
          <div style={{ width: 22, height: 1, background: "#1a2438", margin: "3px 0" }} />
          <button
            onClick={() => setDrawings((prev) => prev.slice(0, -1))}
            style={{
              width: 30,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 6,
              cursor: "pointer",
              color: "#3d5070",
              fontSize: 13,
              background: "transparent",
              border: "1px solid transparent",
            }}
          >
            ↩
          </button>
          <button
            onClick={clearAll}
            style={{
              width: 30,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 6,
              cursor: "pointer",
              color: "#3d5070",
              fontSize: 11,
              background: "transparent",
              border: "1px solid transparent",
            }}
          >
            ✕
          </button>
        </div>

        {/* Chart Area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Chart Header */}
          <div style={{ display: "flex", alignItems: "center", height: 38, background: "#080e1c", borderBottom: "1px solid #1a2438", padding: "0 10px", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ width: 22, height: 22, background: "rgba(245,200,66,.15)", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#f5c842" }}>SC</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#e8f4ff" }}>BTC</div>
                <div style={{ fontSize: 9, color: "#7a90b0" }}>Scanner Atlas • Ferramenta: {TOOL_LABELS[tool]} • TF: {currentTF}</div>
              </div>
            </div>
            <div style={{ width: 1, height: 28, background: "#1a2438", margin: "0 8px" }} />
            <div>
              <div style={{ fontSize: 8, color: "#3d5070", textTransform: "uppercase", letterSpacing: 0.5 }}>PREÇO</div>
              <div style={{ fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "#00c896" }}>84,302.06</div>
            </div>
            <div style={{ width: 1, height: 28, background: "#1a2438", margin: "0 8px" }} />
            <div>
              <div style={{ fontSize: 8, color: "#3d5070", textTransform: "uppercase", letterSpacing: 0.5 }}>VARIAÇÃO</div>
              <div style={{ fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "#00c896" }}>+0.45%</div>
            </div>
            <div style={{ width: 1, height: 28, background: "#1a2438", margin: "0 8px" }} />
            <div>
              <div style={{ fontSize: 8, color: "#3d5070", textTransform: "uppercase", letterSpacing: 0.5 }}>VOLUME</div>
              <div style={{ fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "#2de2ff" }}>774.64</div>
            </div>
            <div style={{ width: 1, height: 28, background: "#1a2438", margin: "0 8px" }} />
            <div>
              <div style={{ fontSize: 8, color: "#3d5070", textTransform: "uppercase", letterSpacing: 0.5 }}>DESENHOS</div>
              <div style={{ fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: drawings.length > 0 ? "#f5c842" : "#ef5350" }}>{drawings.length}</div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 3 }}>
              {["Auto", "Manual", "Seguir + Espaço", "Zoom−", "Zoom+", "Agora", "Reset"].map((btn) => (
                <button
                  key={btn}
                  style={{
                    height: 24,
                    padding: "0 8px",
                    borderRadius: 5,
                    border: "1px solid #1e2a40",
                    background: btn === "Auto" ? "rgba(45,226,255,.08)" : "transparent",
                    color: btn === "Auto" ? "#2de2ff" : "#7a90b0",
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {btn}
                </button>
              ))}
            </div>
          </div>

          {/* Drawing Toolbar */}
          <div style={{ display: "flex", alignItems: "center", height: 30, background: "rgba(8,14,28,.8)", borderBottom: "1px solid #1a2438", padding: "0 10px", gap: 4 }}>
            <button onClick={deleteSelected} style={{ height: 22, padding: "0 8px", borderRadius: 4, border: "1px solid #1a2438", background: "transparent", color: "#7a90b0", fontSize: 10, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              🔒 Travar
            </button>
            <button style={{ height: 22, padding: "0 8px", borderRadius: 4, border: "1px solid #1a2438", background: "transparent", color: "#7a90b0", fontSize: 10, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              ⚙ Config.
            </button>
            <button onClick={deleteSelected} style={{ height: 22, padding: "0 8px", borderRadius: 4, border: "1px solid #1a2438", background: "transparent", color: "rgba(255,68,102,.7)", fontSize: 10, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              ✕ Apagar
            </button>
            <button onClick={clearAll} style={{ height: 22, padding: "0 8px", borderRadius: 4, border: "1px solid #1a2438", background: "transparent", color: "#7a90b0", fontSize: 10, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              🗑 Limpar
            </button>
            <div style={{ width: 1, height: 16, background: "#1a2438", margin: "0 4px" }} />
            <span style={{ fontSize: 9, color: "#3d5070" }}>Cor:</span>
            {["#f5c842", "#2de2ff", "#00c896", "#ff4466", "#a78bfa"].map((c) => (
              <div
                key={c}
                onClick={() => {
                  if (selectedId) {
                    setDrawings((prev) => prev.map((d) => (d.id === selectedId ? { ...d, color: c } : d)));
                  }
                }}
                style={{
                  width: 13,
                  height: 13,
                  borderRadius: 3,
                  background: c,
                  cursor: "pointer",
                  border: "1px solid rgba(255,255,255,.15)",
                }}
              />
            ))}
            <div style={{ marginLeft: "auto", fontSize: 9, color: "#3d5070", fontStyle: "italic" }}>
              Del = apagar • Duplo clique = configurar
            </div>
          </div>

          {/* Canvas */}
          <div style={{ flex: 1, position: "relative", overflow: "hidden", background: "#060c18" }}>
            <div ref={chartContainerRef} style={{ position: "absolute", inset: 0 }} />
            <svg
              ref={svgRef}
              width={svgSize.w}
              height={svgSize.h}
              onMouseDown={handleSvgMouseDown}
              onMouseMove={handleSvgMouseMove}
              onMouseUp={handleSvgMouseUp}
              onMouseLeave={handleSvgMouseUp}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                zIndex: 5,
                pointerEvents: tool !== "cursor" || drawings.length > 0 ? "auto" : "none",
                cursor: tool === "cursor" ? "default" : "crosshair",
              }}
            >
              {drawings.filter((d) => !d.hidden).map((d) => renderDrawing(d))}
              {draftP1 && draftP2 && tool !== "cursor" && renderDrawing(newDrawing(tool, draftP1.x, draftP1.y, draftP2.x, draftP2.y), true)}
            </svg>
          </div>

          {/* Oscillator Panel */}
          <div style={{ height: 100, borderTop: "1px solid #1a2438", position: "relative", background: "#060c18" }}>
            <div style={{ position: "absolute", top: 4, left: 8, display: "flex", gap: 8, zIndex: 2, fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}>
              <span style={{ color: "#a78bfa" }}>— RSI</span>
              <span style={{ color: "#7a90b0" }}>— MFI</span>
            </div>
            <div ref={oscContainerRef} style={{ position: "absolute", inset: 0 }} />
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ width: 210, background: "#080e1c", borderLeft: "1px solid #1a2438", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "8px 12px", borderBottom: "1px solid #1a2438", fontSize: 11, fontWeight: 700, color: "#e8f4ff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            IA Atlas Insights
            <svg width={12} height={12} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M3 5l4 4 4-4" />
            </svg>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#7a90b0" }}>
                  <span style={{ fontSize: 11, color: "#f5c842" }}>₿</span>
                  <span>8 BTC</span>
                </div>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#7a90b0" }}>74,682</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: "#e8f4ff" }}>BTC</span>
                <span style={{ fontSize: 22, fontWeight: 900, color: "#00c896" }}>84 ↑</span>
              </div>
              <div style={{ height: 5, borderRadius: 999, background: "rgba(255,255,255,.07)", overflow: "hidden", marginBottom: 6 }}>
                <div style={{ width: "84%", height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#2de2ff,#00c896)" }} />
              </div>
              <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 5, fontSize: 10, fontWeight: 800, letterSpacing: 0.5, marginBottom: 10, background: "rgba(0,200,150,.12)", border: "1px solid rgba(0,200,150,.3)", color: "#00c896" }}>COMPRA</span>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(26,36,56,.5)" }}>
                <span style={{ fontSize: 10, color: "#7a90b0" }}>Risco</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#f5c842" }}>Moderado</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(26,36,56,.5)" }}>
                <span style={{ fontSize: 10, color: "#7a90b0" }}>Tipo</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#ff4466" }}>Volatilidade</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(26,36,56,.5)" }}>
                <span style={{ fontSize: 10, color: "#7a90b0" }}>Invalidação</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#e8f4ff" }}>$69,180.6</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(26,36,56,.5)" }}>
                <span style={{ fontSize: 10, color: "#7a90b0" }}>Fonte</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#2de2ff" }}>binance</span>
              </div>
            </div>
            <div style={{ fontSize: 9, fontWeight: 800, color: "#3d5070", textTransform: "uppercase", letterSpacing: 1, margin: "10px 0 5px", paddingBottom: 3, borderBottom: "1px solid #1a2438" }}>Estrutura</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(26,36,56,.5)" }}>
              <span style={{ fontSize: 10, color: "#7a90b0" }}>Fluxo</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#00c896" }}>Positivo</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(26,36,56,.5)" }}>
              <span style={{ fontSize: 10, color: "#7a90b0" }}>Momentum</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#00c896" }}>Forte</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(26,36,56,.5)" }}>
              <span style={{ fontSize: 10, color: "#7a90b0" }}>Liquidez</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#2de2ff" }}>Ativo</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(26,36,56,.5)" }}>
              <span style={{ fontSize: 10, color: "#7a90b0" }}>Confluência</span>
              <div style={{ display: "flex", gap: 3 }}>
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: i < 8 ? "linear-gradient(180deg,#2de2ff,#18b7ff)" : "rgba(255,255,255,.14)" }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// RSI CALCULATION
// ============================================================
function calculateRSI(candles: CandleData[], period: number): number[] {
  const rsi = new Array(candles.length).fill(50);
  if (candles.length < period + 1) return rsi;

  let gain = 0;
  let loss = 0;

  for (let i = 1; i <= period; i++) {
    const change = candles[i].close - candles[i - 1].close;
    if (change >= 0) gain += change;
    else loss -= change;
  }

  let avgGain = gain / period;
  let avgLoss = loss / period;

  rsi[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < candles.length; i++) {
    const change = candles[i].close - candles[i - 1].close;
    const g = change >= 0 ? change : 0;
    const l = change < 0 ? -change : 0;
    avgGain = (avgGain * (period - 1) + g) / period;
    avgLoss = (avgLoss * (period - 1) + l) / period;
    rsi[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }

  return rsi;
}
