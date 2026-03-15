"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { createChart, ColorType } from "lightweight-charts";

type Candle = {
  time: string;
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
  | "zoom"
  | "line"
  | "zones"
  | "levels"
  | "measure"
  | "magnet"
  | "clock"
  | "settings";

type ViewMode = "auto" | "manual" | "space";

type Point = { x: number; y: number };

type DrawingLine = {
  id: string;
  type: "line";
  start: Point;
  end: Point;
};

type DrawingLevel = {
  id: string;
  type: "level";
  y: number;
  priceLabel: string;
};

type DrawingZone = {
  id: string;
  type: "zone";
  start: Point;
  end: Point;
};

type DrawingMeasure = {
  id: string;
  type: "measure";
  start: Point;
  end: Point;
  delta: string;
  pct: string;
};

type Drawing = DrawingLine | DrawingLevel | DrawingZone | DrawingMeasure;

const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"];
const timeframes = ["1m", "5m", "15m", "30m", "1h", "4h", "1d"];

const topModules: TopModule[] = [
  "Fluxo",
  "Singularidade",
  "IA Atlas",
  "Scanner",
  "Estrutura",
  "Euler",
  "Liquidez",
];

const moduleIcons: Record<TopModule, string> = {
  Fluxo: "≈",
  Singularidade: "✦",
  "IA Atlas": "◈",
  Scanner: "⌕",
  Estrutura: "▣",
  Euler: "∑",
  Liquidez: "≋",
};

const chartTools: { key: ToolKey; icon: string; label: string }[] = [
  { key: "cursor", icon: "⌖", label: "Cursor" },
  { key: "zoom", icon: "⊕", label: "Zoom" },
  { key: "line", icon: "╱", label: "Linha" },
  { key: "zones", icon: "◫", label: "Zonas" },
  { key: "levels", icon: "≡", label: "Níveis" },
  { key: "measure", icon: "⎘", label: "Medida" },
  { key: "magnet", icon: "⌬", label: "Magnet" },
  { key: "clock", icon: "◷", label: "Replay" },
  { key: "settings", icon: "⚙", label: "Config" },
];

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
        background:
          "linear-gradient(180deg, rgba(14,21,39,0.96), rgba(7,11,22,0.985))",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 12,
        padding: "10px 12px",
        minHeight: 64,
        boxShadow: "0 10px 28px rgba(0,0,0,0.18)",
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "#7f93b9",
          marginBottom: 6,
          letterSpacing: 0.45,
          textTransform: "uppercase",
          fontWeight: 700,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 19,
          fontWeight: 900,
          color:
            positive === undefined ? "#eef4ff" : positive ? "#2fe19a" : "#ff6b81",
          lineHeight: 1.08,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function RightRow({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 0",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        gap: 12,
      }}
    >
      <span style={{ color: "#99a9c8", fontSize: 12 }}>{label}</span>
      <span
        style={{
          color:
            positive === undefined ? "#eef4ff" : positive ? "#34d399" : "#fb7185",
          fontWeight: 800,
          fontSize: 12,
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function ScannerRow({
  asset,
  score,
  trend,
  price,
}: {
  asset: string;
  score: string;
  trend: string;
  price: string;
}) {
  const up =
    trend.toLowerCase().includes("forte") ||
    trend.toLowerCase().includes("positivo") ||
    trend.toLowerCase().includes("compra") ||
    trend.toLowerCase().includes("alta") ||
    trend.toLowerCase().includes("validação") ||
    trend.toLowerCase().includes("confluência") ||
    trend.toLowerCase().includes("assistida") ||
    trend.toLowerCase().includes("pool") ||
    trend.toLowerCase().includes("cluster");

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.2fr 1fr 1fr 1fr",
        gap: 10,
        padding: "12px 0",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        color: "#d8e2ff",
        fontSize: 13,
      }}
    >
      <div style={{ fontWeight: 800 }}>{asset}</div>
      <div>{score}</div>
      <div style={{ color: up ? "#34d399" : "#f59e0b", fontWeight: 800 }}>
        {trend}
      </div>
      <div style={{ textAlign: "right" }}>{price}</div>
    </div>
  );
}

function MiniMetricCard({
  title,
  value,
  subtitle,
  positive = true,
}: {
  title: string;
  value: string;
  subtitle: string;
  positive?: boolean;
}) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 12,
        padding: 8,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015))",
      }}
    >
      <div
        style={{
          color: "#8ea4c8",
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: 0.45,
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div
        style={{
          color: positive ? "#eaf2ff" : "#ff8ea0",
          fontSize: 22,
          fontWeight: 900,
          lineHeight: 1,
          marginBottom: 8,
        }}
      >
        {value}
      </div>
      <div style={{ color: "#9eb0cf", fontSize: 12 }}>{subtitle}</div>
    </div>
  );
}

function LeftInfoRow({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        padding: "11px 0",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div style={{ color: "#8ea4c8", fontSize: 13 }}>{label}</div>
      <div
        style={{
          color: positive === false ? "#ff8ea0" : positive ? "#34d399" : "#eaf2ff",
          fontWeight: 800,
          fontSize: 12,
          textAlign: "right",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function PremiumButton({
  active,
  onClick,
  children,
  compact,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "relative",
        border: active
          ? "1px solid rgba(255,220,110,0.42)"
          : "1px solid rgba(255,255,255,0.08)",
        background: active
          ? "linear-gradient(180deg, rgba(255,213,79,0.24), rgba(255,170,0,0.08))"
          : "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.018))",
        color: active ? "#fff4bf" : "#bfd0ea",
        borderRadius: 12,
        padding: compact ? "10px 14px" : "11px 16px",
        minHeight: 44,
        fontWeight: 800,
        fontSize: compact ? 13 : 14,
        cursor: "pointer",
        whiteSpace: "nowrap",
        flexShrink: 0,
        boxShadow: active
          ? "0 0 0 1px rgba(255,215,90,0.12) inset, 0 8px 22px rgba(255,180,20,0.10)"
          : "0 6px 18px rgba(0,0,0,0.10)",
        transition: "all 0.18s ease",
      }}
    >
      {active && (
        <span
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 12,
            background:
              "linear-gradient(90deg, rgba(255,255,255,0.00), rgba(255,255,255,0.10), rgba(255,255,255,0.00))",
            pointerEvents: "none",
          }}
        />
      )}
      <span style={{ position: "relative" }}>{children}</span>
    </button>
  );
}

function ControlButton({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        border: active
          ? "1px solid rgba(94,231,255,0.35)"
          : "1px solid rgba(255,255,255,0.08)",
        background: active
          ? "linear-gradient(180deg, rgba(94,231,255,0.16), rgba(94,231,255,0.05))"
          : "rgba(255,255,255,0.03)",
        color: active ? "#bff8ff" : "#d7e4ff",
        borderRadius: 10,
        padding: "7px 10px",
        fontWeight: 800,
        fontSize: 11,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getRectFromPoints(a: Point, b: Point) {
  return {
    left: Math.min(a.x, b.x),
    top: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y),
  };
}

function DrawingOverlay({
  width,
  height,
  drawings,
  draftLine,
  draftZone,
  draftMeasure,
}: {
  width: number;
  height: number;
  drawings: Drawing[];
  draftLine: DrawingLine | null;
  draftZone: DrawingZone | null;
  draftMeasure: DrawingMeasure | null;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 5,
      }}
    >
      {drawings.map((drawing) => {
        if (drawing.type === "line") {
          return (
            <g key={drawing.id}>
              <line
                x1={drawing.start.x}
                y1={drawing.start.y}
                x2={drawing.end.x}
                y2={drawing.end.y}
                stroke="#7fe8ff"
                strokeWidth="1.6"
              />
              <circle cx={drawing.start.x} cy={drawing.start.y} r="2.4" fill="#7fe8ff" />
              <circle cx={drawing.end.x} cy={drawing.end.y} r="2.4" fill="#7fe8ff" />
            </g>
          );
        }

        if (drawing.type === "level") {
          return (
            <g key={drawing.id}>
              <line
                x1={0}
                y1={drawing.y}
                x2={width}
                y2={drawing.y}
                stroke="#ffd65a"
                strokeWidth="1.4"
                strokeDasharray="6 5"
              />
              <rect
                x={Math.max(width - 78, 8)}
                y={drawing.y - 12}
                width={70}
                height={18}
                rx={6}
                fill="rgba(255,214,90,0.16)"
                stroke="rgba(255,214,90,0.42)"
              />
              <text
                x={Math.max(width - 43, 16)}
                y={drawing.y}
                fill="#fff4bf"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="10"
                fontWeight="700"
              >
                {drawing.priceLabel}
              </text>
            </g>
          );
        }

        if (drawing.type === "zone") {
          const rect = getRectFromPoints(drawing.start, drawing.end);
          return (
            <g key={drawing.id}>
              <rect
                x={rect.left}
                y={rect.top}
                width={Math.max(rect.width, 2)}
                height={Math.max(rect.height, 2)}
                rx={8}
                fill="rgba(94,231,255,0.10)"
                stroke="rgba(94,231,255,0.55)"
                strokeWidth="1.4"
              />
            </g>
          );
        }

        const rect = getRectFromPoints(drawing.start, drawing.end);
        return (
          <g key={drawing.id}>
            <rect
              x={rect.left}
              y={rect.top}
              width={Math.max(rect.width, 2)}
              height={Math.max(rect.height, 2)}
              rx={8}
              fill="rgba(255,214,90,0.10)"
              stroke="rgba(255,214,90,0.60)"
              strokeWidth="1.4"
            />
            <line
              x1={drawing.start.x}
              y1={drawing.start.y}
              x2={drawing.end.x}
              y2={drawing.end.y}
              stroke="#ffd65a"
              strokeWidth="1.2"
              strokeDasharray="4 4"
            />
            <rect
              x={rect.left + 8}
              y={rect.top + 8}
              width={90}
              height={34}
              rx={8}
              fill="rgba(6,10,20,0.82)"
              stroke="rgba(255,214,90,0.35)"
            />
            <text x={rect.left + 16} y={rect.top + 22} fill="#fff4bf" fontSize="10" fontWeight="700">
              {drawing.delta}
            </text>
            <text x={rect.left + 16} y={rect.top + 34} fill="#cfe4ff" fontSize="10" fontWeight="700">
              {drawing.pct}
            </text>
          </g>
        );
      })}

      {draftLine && (
        <line
          x1={draftLine.start.x}
          y1={draftLine.start.y}
          x2={draftLine.end.x}
          y2={draftLine.end.y}
          stroke="#7fe8ff"
          strokeWidth="1.4"
          strokeDasharray="5 5"
        />
      )}

      {draftZone &&
        (() => {
          const rect = getRectFromPoints(draftZone.start, draftZone.end);
          return (
            <rect
              x={rect.left}
              y={rect.top}
              width={Math.max(rect.width, 2)}
              height={Math.max(rect.height, 2)}
              rx={8}
              fill="rgba(94,231,255,0.08)"
              stroke="rgba(94,231,255,0.55)"
              strokeWidth="1.4"
              strokeDasharray="5 4"
            />
          );
        })()}

      {draftMeasure &&
        (() => {
          const rect = getRectFromPoints(draftMeasure.start, draftMeasure.end);
          return (
            <g>
              <rect
                x={rect.left}
                y={rect.top}
                width={Math.max(rect.width, 2)}
                height={Math.max(rect.height, 2)}
                rx={8}
                fill="rgba(255,214,90,0.08)"
                stroke="rgba(255,214,90,0.55)"
                strokeWidth="1.4"
                strokeDasharray="5 4"
              />
              <line
                x1={draftMeasure.start.x}
                y1={draftMeasure.start.y}
                x2={draftMeasure.end.x}
                y2={draftMeasure.end.y}
                stroke="#ffd65a"
                strokeWidth="1.2"
                strokeDasharray="4 4"
              />
            </g>
          );
        })()}
    </svg>
  );
}

export default function AtlasChartPro2() {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);

  const [symbol, setSymbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState("1m");
  const [activeModule, setActiveModule] = useState<TopModule>("Scanner");
  const [activeTool, setActiveTool] = useState<ToolKey>("cursor");
  const [source, setSource] = useState("carregando...");
  const [price, setPrice] = useState("--");
  const [change, setChange] = useState("--");
  const [volume, setVolume] = useState("--");
  const [lastClose, setLastClose] = useState<number | null>(null);
  const [signal, setSignal] = useState("Compra Forte");
  const [score, setScore] = useState(92);
  const [chartHeight, setChartHeight] = useState(730);
  const [viewportWidth, setViewportWidth] = useState(1440);
  const [viewMode, setViewMode] = useState<ViewMode>("auto");
  const [spaceOffset] = useState(10);
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 });

  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [firstPoint, setFirstPoint] = useState<Point | null>(null);
  const [draftLine, setDraftLine] = useState<DrawingLine | null>(null);
  const [draftZone, setDraftZone] = useState<DrawingZone | null>(null);
  const [draftMeasure, setDraftMeasure] = useState<DrawingMeasure | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const hasInitialFitRef = useRef(false);
  const savedScrollPositionRef = useRef<number | null>(null);

  useEffect(() => {
    const handleViewport = () => setViewportWidth(window.innerWidth);
    handleViewport();
    window.addEventListener("resize", handleViewport);
    return () => window.removeEventListener("resize", handleViewport);
  }, []);

  const isCompact = viewportWidth < 1280;
  const isMedium = viewportWidth < 1024;
  const isSmall = viewportWidth < 860;

  useEffect(() => {
    const updateChartHeight = () => {
      const offset = isSmall ? 310 : isMedium ? 255 : 155;
      const nextHeight = Math.max(560, Math.min(window.innerHeight - offset, 900));
      setChartHeight(nextHeight);
    };

    updateChartHeight();
    window.addEventListener("resize", updateChartHeight);

    return () => {
      window.removeEventListener("resize", updateChartHeight);
    };
  }, [isMedium, isSmall]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartHeight,
      layout: {
        background: { type: ColorType.Solid, color: "#09111f" },
        textColor: "#93a9cf",
      },
      grid: {
        vertLines: { color: "rgba(120,140,180,0.10)" },
        horzLines: { color: "rgba(120,140,180,0.10)" },
      },
      crosshair: {
        vertLine: { color: "rgba(255,255,255,0.12)" },
        horzLine: { color: "rgba(255,255,255,0.12)" },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.10)",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.10)",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 6,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#36e29a",
      downColor: "#ff5f7a",
      borderUpColor: "#36e29a",
      borderDownColor: "#ff5f7a",
      wickUpColor: "#36e29a",
      wickDownColor: "#ff5f7a",
    });

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "",
      color: "#3b82f6",
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.84,
        bottom: 0,
      },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    const handleResize = () => {
      if (!chartContainerRef.current || !chartRef.current) return;
      chartRef.current.applyOptions({
        width: chartContainerRef.current.clientWidth,
        height: chartHeight,
      });
      setChartSize({
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [chartHeight]);

  useEffect(() => {
    setViewMode("auto");
    savedScrollPositionRef.current = null;
    hasInitialFitRef.current = false;
  }, [symbol, timeframe]);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const res = await fetch(
          `/api/market?symbol=${symbol}&interval=${timeframe}&limit=220`,
          { cache: "no-store" }
        );
        const data = await res.json();

        if (cancelled) return;
        if (!res.ok || !data?.candles?.length) {
          setSource("erro");
          return;
        }

        const timeScale = chartRef.current?.timeScale();

        if (timeScale && viewMode === "manual") {
          const currentScrollPosition = timeScale.scrollPosition();
          if (
            typeof currentScrollPosition === "number" &&
            Number.isFinite(currentScrollPosition)
          ) {
            savedScrollPositionRef.current = currentScrollPosition;
          }
        }

        setSource(data.source || "desconhecida");

        const candles: Candle[] = data.candles;

        const normalizedCandles = candles.map((c) => ({
          time: Math.floor(new Date(c.time).getTime() / 1000),
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }));

        const normalizedVolume = candles.map((c) => ({
          time: Math.floor(new Date(c.time).getTime() / 1000),
          value: c.volume,
          color:
            c.close >= c.open
              ? "rgba(54,226,154,0.72)"
              : "rgba(255,95,122,0.72)",
        }));

        candleSeriesRef.current?.setData(normalizedCandles);
        volumeSeriesRef.current?.setData(normalizedVolume);

        if (timeScale) {
          if (!hasInitialFitRef.current) {
            timeScale.fitContent();
            hasInitialFitRef.current = true;
          } else if (viewMode === "auto") {
            timeScale.scrollToRealTime();
          } else if (viewMode === "space") {
            timeScale.scrollToPosition(spaceOffset, false);
          } else if (
            savedScrollPositionRef.current !== null &&
            Number.isFinite(savedScrollPositionRef.current)
          ) {
            timeScale.scrollToPosition(savedScrollPositionRef.current, false);
          }
        }

        const last = candles[candles.length - 1];
        const prev = candles[candles.length - 2] || last;

        setLastClose(last.close);
        setPrice(
          last.close.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        );

        const pct = prev.close ? ((last.close - prev.close) / prev.close) * 100 : 0;
        setChange(`${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`);
        setVolume(
          last.volume.toLocaleString("en-US", {
            maximumFractionDigits: 2,
          })
        );

        const strength = Math.min(99, Math.max(51, Math.round(70 + Math.abs(pct) * 12)));
        setScore(strength);
        setSignal(pct >= 0 ? "Compra Forte" : "Pressão Vendedora");
      } catch {
        if (!cancelled) setSource("erro");
      }
    }

    loadData();
    const timer = window.setInterval(loadData, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [symbol, timeframe, viewMode, spaceOffset]);

  const scoreColor = useMemo(() => {
    if (score >= 85) return "#29d391";
    if (score >= 70) return "#f7c948";
    return "#ff6b81";
  }, [score]);

  const moduleTitle = useMemo(() => {
    switch (activeModule) {
      case "Fluxo":
        return "Fluxo de Mercado";
      case "Singularidade":
        return "Pulso da Singularidade";
      case "IA Atlas":
        return "Leitura IA Atlas";
      case "Scanner":
        return "Scanner Atlas";
      case "Estrutura":
        return "Estrutura do Mercado";
      case "Euler":
        return "Leitura Euler";
      case "Liquidez":
        return "Mapa de Liquidez";
      default:
        return "Scanner Atlas";
    }
  }, [activeModule]);

  const moduleAccent = useMemo(() => {
    switch (activeModule) {
      case "Fluxo":
        return "#29d391";
      case "Singularidade":
        return "#5ee7ff";
      case "IA Atlas":
        return "#8b5cf6";
      case "Scanner":
        return "#ffd65a";
      case "Estrutura":
        return "#34d399";
      case "Euler":
        return "#60a5fa";
      case "Liquidez":
        return "#22d3ee";
      default:
        return "#ffd65a";
    }
  }, [activeModule]);

  const bottomTabs =
    activeModule === "Fluxo"
      ? ["Fluxo", "Pressão", "Volume", "Eventos"]
      : activeModule === "Singularidade"
      ? ["Singularidade", "Confluência", "Pulso", "Eventos"]
      : activeModule === "IA Atlas"
      ? ["IA Atlas", "Score", "Risco", "Eventos"]
      : activeModule === "Estrutura"
      ? ["Estrutura", "Euler", "Ciclo", "Eventos"]
      : activeModule === "Euler"
      ? ["Euler", "Curvatura", "Validação", "Eventos"]
      : activeModule === "Liquidez"
      ? ["Map", "Heatmap", "Clusters", "Eventos"]
      : ["Indicadores", "Fluxo", "Scanner", "Eventos"];

  const leftPanelTitle =
    activeModule === "Scanner"
      ? "Mestre Scanner"
      : activeModule === "Fluxo"
      ? "Mapa de Fluxo"
      : activeModule === "IA Atlas"
      ? "Radar IA Atlas"
      : activeModule === "Estrutura"
      ? "Mapa Estrutural"
      : activeModule === "Euler"
      ? "Validação Euler"
      : activeModule === "Liquidez"
      ? "Mapa de Liquidez"
      : "Pulso Singularidade";

  const leftRows =
    activeModule === "Fluxo"
      ? [
          { asset: "BTCUSDT", score: "91.7", trend: "Pressão Compradora", price: "$69,489" },
          { asset: "ETHUSDT", score: "84.1", trend: "Fluxo Positivo", price: "$3,745" },
          { asset: "SOLUSDT", score: "79.4", trend: "Absorção", price: "$168.40" },
          { asset: "BNBUSDT", score: "72.3", trend: "Aceleração", price: "$611.22" },
        ]
      : activeModule === "IA Atlas"
      ? [
          { asset: "BTCUSDT", score: "94.2", trend: "Convicção Alta", price: "$69,489" },
          { asset: "ETHUSDT", score: "88.8", trend: "Compra Assistida", price: "$3,745" },
          { asset: "SOLUSDT", score: "81.0", trend: "Positivo", price: "$168.40" },
          { asset: "BNBUSDT", score: "76.4", trend: "Neutro Forte", price: "$611.22" },
        ]
      : activeModule === "Estrutura"
      ? [
          { asset: "BTCUSDT", score: "93.1", trend: "Estrutura Forte", price: "$69,489" },
          { asset: "ETHUSDT", score: "86.7", trend: "Positivo", price: "$3,745" },
          { asset: "SOLUSDT", score: "80.5", trend: "Continuidade", price: "$168.40" },
          { asset: "BNBUSDT", score: "74.8", trend: "Base Sólida", price: "$611.22" },
        ]
      : activeModule === "Euler"
      ? [
          { asset: "BTCUSDT", score: "90.6", trend: "Validação Forte", price: "$69,489" },
          { asset: "ETHUSDT", score: "83.3", trend: "Curvatura Positiva", price: "$3,745" },
          { asset: "SOLUSDT", score: "78.1", trend: "Confirmação", price: "$168.40" },
          { asset: "BNBUSDT", score: "71.9", trend: "Assimetria", price: "$611.22" },
        ]
      : activeModule === "Singularidade"
      ? [
          { asset: "BTCUSDT", score: "92.8", trend: "Pulso Forte", price: "$69,489" },
          { asset: "ETHUSDT", score: "87.1", trend: "Confluência", price: "$3,745" },
          { asset: "SOLUSDT", score: "82.2", trend: "Positivo", price: "$168.40" },
          { asset: "BNBUSDT", score: "75.0", trend: "Aceleração", price: "$611.22" },
        ]
      : activeModule === "Liquidez"
      ? [
          { asset: "71,600", score: "98.1", trend: "Parede Forte", price: "$12.8M" },
          { asset: "71,250", score: "91.4", trend: "Cluster Alto", price: "$9.3M" },
          { asset: "70,980", score: "86.2", trend: "Pool de Stops", price: "$7.1M" },
          { asset: "70,720", score: "80.9", trend: "Liquidez Ativa", price: "$5.9M" },
        ]
      : [
          { asset: "BTCUSDT", score: "92.4", trend: "Compra Forte", price: "$69,489" },
          { asset: "ETHUSDT", score: "87.2", trend: "Positivo", price: "$3,745" },
          { asset: "SOLUSDT", score: "82.8", trend: "Positivo", price: "$168.40" },
          { asset: "BNBUSDT", score: "74.9", trend: "Aceleração", price: "$611.22" },
        ];

  const leftDynamicBlock = useMemo(() => {
    if (activeModule === "Scanner") {
      return {
        type: "table" as const,
        title: "Mestre Scanner",
        subtitle: "Ativos priorizados por score, tendência e leitura geral do momento.",
      };
    }

    return {
      type: "cards" as const,
      title: leftPanelTitle,
      subtitle:
        activeModule === "Liquidez"
          ? "Painel dedicado a paredes, heatmap, stops e clusters relevantes para o preço."
          : "Leitura complementar do módulo ativo com visão sintética e apoio operacional.",
      cards:
        activeModule === "Liquidez"
          ? [
              { title: "Parede", value: "71,600", subtitle: "Oferta dominante", positive: true },
              { title: "Cluster", value: "Forte", subtitle: "Acúmulo relevante", positive: true },
              { title: "Stops", value: "Acima", subtitle: "Alvo provável", positive: true },
              { title: "Heatmap", value: "Ativo", subtitle: "Leitura disponível", positive: true },
            ]
          : [
              { title: "Bias", value: "Positivo", subtitle: "Leitura geral", positive: true },
              { title: "Força", value: "Alta", subtitle: "Contexto atual", positive: true },
              { title: "Ritmo", value: "Ativo", subtitle: "Movimento em curso", positive: true },
              { title: "Suporte", value: "Bom", subtitle: "Estrutura saudável", positive: true },
            ],
      rows:
        activeModule === "Liquidez"
          ? [
              { label: "Pool", value: "71,250", positive: true },
              { label: "Caça", value: "Provável", positive: true },
              { label: "Absorção", value: "Moderada", positive: true },
              { label: "Atração", value: "Elevada", positive: true },
            ]
          : [
              { label: "Condição", value: "Operável", positive: true },
              { label: "Aceleração", value: "Boa", positive: true },
              { label: "Contexto", value: "Favorável", positive: true },
              { label: "Ciclo", value: "Ativo", positive: true },
            ],
    };
  }, [activeModule, leftPanelTitle]);

  const insightConfig = useMemo(() => {
    if (activeModule === "Fluxo") {
      return {
        panelTitle: "Fluxo Atlas Insights",
        scoreValue: 89,
        scoreLabel: "Fluxo Comprador",
        rowsTop: [
          { label: "Direção", value: "Compra Assistida", positive: true },
          { label: "Fluxo", value: "Agressão Alta", positive: true },
          { label: "Absorção", value: "Moderada", positive: true },
          { label: "Invalidação", value: "$68,920", positive: false },
        ],
        rowsBottomTitle: "Estrutura de Fluxo",
        rowsBottomDescription:
          "Leitura de pressão, absorção e continuidade do movimento.",
        rowsBottom: [
          { label: "Pressão", value: "Positiva", positive: true },
          { label: "Delta", value: "Forte", positive: true },
          { label: "Liquidez", value: "Entrada", positive: true },
          { label: "Ritmo", value: "Acelerando", positive: true },
        ],
      };
    }

    if (activeModule === "Singularidade") {
      return {
        panelTitle: "Singularidade Insights",
        scoreValue: 91,
        scoreLabel: "Confluência Forte",
        rowsTop: [
          { label: "Direção", value: "Bullish", positive: true },
          { label: "Convicção", value: "Alta", positive: true },
          { label: "Ciclo", value: "Inicial", positive: true },
          { label: "Invalidação", value: "$68,880", positive: false },
        ],
        rowsBottomTitle: "Leitura Singular",
        rowsBottomDescription:
          "Confluência entre estrutura, aceleração e contexto.",
        rowsBottom: [
          { label: "Estrutura", value: "Positiva", positive: true },
          { label: "Expansão", value: "Boa", positive: true },
          { label: "Saturação", value: "Baixa", positive: true },
          { label: "Liquidez", value: "Favorável", positive: true },
        ],
      };
    }

    if (activeModule === "IA Atlas") {
      return {
        panelTitle: "IA Atlas Insights",
        scoreValue: score,
        scoreLabel: signal,
        rowsTop: [
          {
            label: "Direção",
            value: signal,
            positive: !change.startsWith("-"),
          },
          { label: "Risco", value: "Médio", positive: undefined },
          { label: "Convicção", value: "Alta", positive: true },
          { label: "Invalidação", value: "$68,950", positive: false },
        ],
        rowsBottomTitle: "Modelo Conceitual",
        rowsBottomDescription:
          "Combinação entre score, direção, convicção e risco operacional.",
        rowsBottom: [
          { label: "Φ Crescimento", value: "0.78", positive: true },
          { label: "δs Estrutura", value: "0.82", positive: true },
          { label: "e Aceleração", value: "0.74", positive: true },
          { label: "π Ciclo", value: "0.29", positive: false },
          { label: "λ Liquidez", value: "0.88", positive: true },
          { label: "τ Reação", value: "0.67", positive: true },
        ],
      };
    }

    if (activeModule === "Estrutura") {
      return {
        panelTitle: "Estrutura Insights",
        scoreValue: 87,
        scoreLabel: "Suporte Sólido",
        rowsTop: [
          { label: "Estrutura", value: "Positiva", positive: true },
          { label: "Euler", value: "Forte", positive: true },
          { label: "Base", value: "Sólida", positive: true },
          { label: "Invalidação", value: "$68,700", positive: false },
        ],
        rowsBottomTitle: "Leitura Estrutural",
        rowsBottomDescription: "Validação da sustentação, base e continuidade.",
        rowsBottom: [
          { label: "Tendência", value: "Alta", positive: true },
          { label: "Suporte", value: "Forte", positive: true },
          { label: "Compressão", value: "Baixa", positive: true },
          { label: "Ciclo", value: "Limpo", positive: true },
        ],
      };
    }

    if (activeModule === "Euler") {
      return {
        panelTitle: "Euler Insights",
        scoreValue: 84,
        scoreLabel: "Curvatura Positiva",
        rowsTop: [
          { label: "Validação", value: "Forte", positive: true },
          { label: "Curvatura", value: "Positiva", positive: true },
          { label: "Assimetria", value: "Boa", positive: true },
          { label: "Invalidação", value: "$68,640", positive: false },
        ],
        rowsBottomTitle: "Leitura Matemática",
        rowsBottomDescription:
          "Camada conceitual de validação de curvatura e continuidade.",
        rowsBottom: [
          { label: "Inclinação", value: "Alta", positive: true },
          { label: "Ritmo", value: "Consistente", positive: true },
          { label: "Aceleração", value: "Moderada", positive: true },
          { label: "Risco", value: "Controlado", positive: true },
        ],
      };
    }

    if (activeModule === "Liquidez") {
      return {
        panelTitle: "Liquidez Insights",
        scoreValue: 93,
        scoreLabel: "Caça Provável",
        rowsTop: [
          { label: "Cluster", value: "Forte", positive: true },
          { label: "Stops", value: "Acima", positive: true },
          { label: "Heatmap", value: "Ativo", positive: true },
          { label: "Pool", value: "71,250", positive: true },
        ],
        rowsBottomTitle: "Estrutura de Liquidez",
        rowsBottomDescription:
          "Parede, pools, heatmap e possíveis zonas de captura.",
        rowsBottom: [
          { label: "Parede", value: "71,600", positive: true },
          { label: "Absorção", value: "Moderada", positive: true },
          { label: "Stops", value: "71,350 - 71,220", positive: true },
          { label: "Alvo", value: "71,480", positive: true },
        ],
      };
    }

    return {
      panelTitle: "IA Atlas Insights",
      scoreValue: score,
      scoreLabel: signal,
      rowsTop: [
        { label: "Direção", value: signal, positive: !change.startsWith("-") },
        { label: "Risco", value: "Médio", positive: undefined },
        { label: "Convicção", value: "Alta", positive: true },
        { label: "Invalidação", value: "$68,950", positive: false },
      ],
      rowsBottomTitle: "Estrutura",
      rowsBottomDescription: "Leitura consolidada dos principais fatores.",
      rowsBottom: [
        { label: "Estrutura", value: "Positiva", positive: true },
        { label: "Euler", value: "Forte", positive: true },
        { label: "Singularidade", value: "Ativa", positive: true },
        { label: "Ciclo", value: "Inicial", positive: true },
      ],
    };
  }, [activeModule, score, signal, change]);

  const pulseConfig = useMemo(() => {
    if (activeModule === "Fluxo") {
      return {
        title: "Pulso de Fluxo",
        description:
          "Mapa conceitual da pressão compradora e equilíbrio de absorção.",
        path1: "M0,100 C40,96 70,78 110,82 C150,86 180,60 220,56 C260,52 290,70 330,62 C370,54 410,40 450,46 C500,54 540,28 600,20",
        path2: "M0,108 C45,104 76,90 112,92 C155,94 190,72 228,70 C268,68 300,78 340,74 C388,70 425,58 470,60 C520,62 555,42 600,36",
        stats: [
          { title: "Delta", value: "+18%", positive: true },
          { title: "Absorção", value: "Boa", positive: true },
        ],
        biasLabel: "Bias",
        biasValue: "Comprador",
      };
    }

    if (activeModule === "Singularidade") {
      return {
        title: "Pulso Singularidade",
        description:
          "Confluência entre aceleração, estrutura e contexto operacional.",
        path1: "M0,98 C40,95 80,82 120,86 C164,90 198,62 240,58 C280,54 315,72 355,66 C394,60 430,42 470,40 C520,38 560,24 600,18",
        path2: "M0,110 C48,106 85,94 122,96 C165,98 202,80 244,78 C284,76 320,84 360,82 C400,80 438,64 478,60 C530,56 566,46 600,40",
        stats: [
          { title: "Confluência", value: "88%", positive: true },
          { title: "Ciclo", value: "Inicial", positive: true },
        ],
        biasLabel: "Bias",
        biasValue: "Expansivo",
      };
    }

    if (activeModule === "IA Atlas") {
      return {
        title: "Pulso IA Atlas",
        description:
          "Camada conceitual da fórmula mestre com score, risco e convicção.",
        path1: "M0,108 C44,100 82,88 120,86 C168,84 204,64 244,54 C290,44 330,58 366,52 C406,46 442,28 486,24 C528,20 560,30 600,14",
        path2: "M0,116 C48,112 84,102 122,100 C166,98 205,84 244,78 C286,72 322,74 360,72 C404,70 446,58 488,52 C530,46 566,38 600,34",
        stats: [
          { title: "Score", value: `${score}`, positive: score >= 70 },
          { title: "Convicção", value: "Alta", positive: true },
        ],
        biasLabel: "Direção",
        biasValue: signal,
      };
    }

    if (activeModule === "Estrutura") {
      return {
        title: "Pulso Estrutural",
        description:
          "Sustentação de tendência, base e estabilidade do movimento.",
        path1: "M0,96 C50,92 86,76 122,80 C164,84 196,66 236,58 C278,50 314,60 356,56 C402,52 440,38 486,34 C536,30 566,20 600,12",
        path2: "M0,108 C52,104 90,90 126,92 C168,94 204,78 246,72 C286,66 326,68 366,66 C408,64 448,56 490,50 C532,44 568,34 600,28",
        stats: [
          { title: "Base", value: "Sólida", positive: true },
          { title: "Força", value: "Alta", positive: true },
        ],
        biasLabel: "Bias",
        biasValue: "Positivo",
      };
    }

    if (activeModule === "Euler") {
      return {
        title: "Curvatura Euler",
        description:
          "Leitura matemática conceitual de curvatura, validação e simetria.",
        path1: "M0,112 C42,108 76,92 116,88 C158,84 192,68 234,60 C280,52 318,56 358,48 C398,40 438,32 480,28 C528,24 566,20 600,16",
        path2: "M0,118 C44,114 80,104 118,100 C162,96 198,82 238,76 C284,70 320,70 360,66 C404,62 444,54 484,48 C530,42 568,36 600,30",
        stats: [
          { title: "Validação", value: "Forte", positive: true },
          { title: "Assimetria", value: "Boa", positive: true },
        ],
        biasLabel: "Curva",
        biasValue: "Positiva",
      };
    }

    if (activeModule === "Liquidez") {
      return {
        title: "Mapa Dinâmico de Liquidez",
        description:
          "Camada conceitual de cluster, paredes e alvos prováveis.",
        path1: "M0,98 C44,96 82,90 122,84 C168,78 206,72 248,58 C290,44 326,58 364,52 C406,46 446,30 486,28 C532,26 562,20 600,16",
        path2: "M0,116 C46,112 84,106 122,98 C164,90 204,86 242,80 C286,74 324,72 364,70 C408,68 446,60 486,54 C528,48 564,40 600,36",
        stats: [
          { title: "Cluster", value: "Forte", positive: true },
          { title: "Heatmap", value: "Ativo", positive: true },
        ],
        biasLabel: "Alvo",
        biasValue: "71,480",
      };
    }

    return {
      title: "Pulso Scanner",
      description: "Leitura geral do conjunto de ativos priorizados.",
      path1: "M0,104 C48,100 86,90 126,88 C164,86 204,74 244,66 C286,58 324,64 364,60 C404,56 444,44 486,36 C530,28 568,24 600,18",
      path2: "M0,116 C48,114 86,104 126,100 C166,96 206,88 246,84 C286,80 326,80 366,76 C408,72 448,66 488,58 C530,50 568,44 600,38",
      stats: [
        { title: "Top Score", value: "92.4", positive: true },
        { title: "Setup", value: "Bom", positive: true },
      ],
      biasLabel: "Bias",
      biasValue: "Compra Forte",
    };
  }, [activeModule, score, signal]);

  const mainGridColumns = isSmall
    ? "1fr"
    : isMedium
    ? "minmax(0, 1fr)"
    : isCompact
    ? "38px minmax(0, 1fr) 320px"
    : "40px minmax(0, 1fr) 410px";

  const bottomGridColumns = isSmall ? "1fr" : "1.2fr 1fr";

  const liquidityHeatRows = [
    { level: "71,600", strength: 96, tag: "Cluster institucional" },
    { level: "71,520", strength: 82, tag: "Liquidez acumulada" },
    { level: "71,420", strength: 74, tag: "Zona ativa" },
    { level: "71,350", strength: 64, tag: "Stops prováveis" },
    { level: "71,220", strength: 58, tag: "Pool de liquidez" },
  ];

  const clearDrafts = () => {
    setFirstPoint(null);
    setDraftLine(null);
    setDraftZone(null);
    setDraftMeasure(null);
    setIsDragging(false);
  };

  useEffect(() => {
    clearDrafts();
  }, [activeTool]);

  const zoomIn = () => {
    const timeScale = chartRef.current?.timeScale();
    if (!timeScale) return;
    const range = timeScale.getVisibleLogicalRange();
    if (!range) return;
    const center = (range.from + range.to) / 2;
    const currentWidth = range.to - range.from;
    const nextWidth = Math.max(10, currentWidth * 0.8);
    timeScale.setVisibleLogicalRange({
      from: center - nextWidth / 2,
      to: center + nextWidth / 2,
    });
  };

  const zoomOut = () => {
    const timeScale = chartRef.current?.timeScale();
    if (!timeScale) return;
    const range = timeScale.getVisibleLogicalRange();
    if (!range) return;
    const center = (range.from + range.to) / 2;
    const currentWidth = range.to - range.from;
    const nextWidth = currentWidth * 1.25;
    timeScale.setVisibleLogicalRange({
      from: center - nextWidth / 2,
      to: center + nextWidth / 2,
    });
  };

  const goToCurrent = () => {
    const timeScale = chartRef.current?.timeScale();
    if (!timeScale) return;
    if (viewMode === "space") {
      timeScale.scrollToPosition(spaceOffset, false);
    } else {
      timeScale.scrollToRealTime();
    }
  };

  const getPointFromEvent = (event: React.MouseEvent<HTMLDivElement>): Point | null => {
    if (!chartContainerRef.current) return null;
    const rect = chartContainerRef.current.getBoundingClientRect();
    return {
      x: clamp(event.clientX - rect.left, 0, rect.width),
      y: clamp(event.clientY - rect.top, 0, rect.height),
    };
  };

  const pointToPrice = (point: Point) => {
    const priceValue = candleSeriesRef.current?.coordinateToPrice?.(point.y);
    return typeof priceValue === "number" ? priceValue : lastClose ?? 0;
  };

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const point = getPointFromEvent(event);
    if (!point) return;

    if (activeTool === "levels") {
      const priceValue = pointToPrice(point);
      setDrawings((prev) => [
        ...prev,
        {
          id: `level-${Date.now()}`,
          type: "level",
          y: point.y,
          priceLabel: priceValue.toLocaleString("en-US", {
            maximumFractionDigits: 2,
          }),
        },
      ]);
      return;
    }

    if (activeTool === "line") {
      if (!firstPoint) {
        setFirstPoint(point);
        setDraftLine({ id: "draft-line", type: "line", start: point, end: point });
        return;
      }
      setDrawings((prev) => [
        ...prev,
        {
          id: `line-${Date.now()}`,
          type: "line",
          start: firstPoint,
          end: point,
        },
      ]);
      clearDrafts();
      return;
    }

    if (activeTool === "measure") {
      if (!firstPoint) {
        setFirstPoint(point);
        setDraftMeasure({
          id: "draft-measure",
          type: "measure",
          start: point,
          end: point,
          delta: "0.00",
          pct: "0.00%",
        });
        return;
      }
      const startPrice = pointToPrice(firstPoint);
      const endPrice = pointToPrice(point);
      const delta = endPrice - startPrice;
      const pct = startPrice !== 0 ? (delta / startPrice) * 100 : 0;
      setDrawings((prev) => [
        ...prev,
        {
          id: `measure-${Date.now()}`,
          type: "measure",
          start: firstPoint,
          end: point,
          delta: `${delta >= 0 ? "+" : ""}${delta.toLocaleString("en-US", {
            maximumFractionDigits: 2,
          })}`,
          pct: `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`,
        },
      ]);
      clearDrafts();
    }
  };

  const handleOverlayMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool !== "zones") return;
    const point = getPointFromEvent(event);
    if (!point) return;
    setIsDragging(true);
    setFirstPoint(point);
    setDraftZone({ id: "draft-zone", type: "zone", start: point, end: point });
  };

  const handleOverlayMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const point = getPointFromEvent(event);
    if (!point) return;

    if (activeTool === "line" && firstPoint) {
      setDraftLine({ id: "draft-line", type: "line", start: firstPoint, end: point });
    }

    if (activeTool === "zones" && isDragging && firstPoint) {
      setDraftZone({ id: "draft-zone", type: "zone", start: firstPoint, end: point });
    }

    if (activeTool === "measure" && firstPoint) {
      const startPrice = pointToPrice(firstPoint);
      const endPrice = pointToPrice(point);
      const delta = endPrice - startPrice;
      const pct = startPrice !== 0 ? (delta / startPrice) * 100 : 0;
      setDraftMeasure({
        id: "draft-measure",
        type: "measure",
        start: firstPoint,
        end: point,
        delta: `${delta >= 0 ? "+" : ""}${delta.toLocaleString("en-US", {
          maximumFractionDigits: 2,
        })}`,
        pct: `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`,
      });
    }
  };

  const handleOverlayMouseUp = (event: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool !== "zones" || !isDragging || !firstPoint) return;
    const point = getPointFromEvent(event);
    if (!point) return;
    setDrawings((prev) => [
      ...prev,
      {
        id: `zone-${Date.now()}`,
        type: "zone",
        start: firstPoint,
        end: point,
      },
    ]);
    clearDrafts();
  };

  const clearDrawings = () => {
    setDrawings([]);
    clearDrafts();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(29,42,84,0.30), transparent 24%), linear-gradient(180deg, #040913 0%, #030712 100%)",
        color: "#eef4ff",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background:
            "linear-gradient(180deg, rgba(5,10,20,0.985), rgba(6,11,22,0.965))",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 20,
          boxShadow: "0 12px 32px rgba(0,0,0,0.22)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: isSmall ? "flex-start" : "center",
            justifyContent: "space-between",
            gap: 18,
            padding: "10px 16px 10px",
            flexWrap: "wrap",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            minHeight: isSmall ? "auto" : 74,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: isSmall ? "flex-start" : "center",
              gap: 16,
              minWidth: 0,
              flexWrap: "wrap",
              flex: 1,
              width: "100%",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <div
                style={{
                  width: isSmall ? 58 : 66,
                  height: isSmall ? 58 : 66,
                  borderRadius: 12,
                  background:
                    "radial-gradient(circle at 30% 30%, rgba(94,231,255,0.16), rgba(255,255,255,0.02))",
                  border: "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  boxShadow:
                    "0 0 14px rgba(114,160,255,0.10), 0 0 24px rgba(94,231,255,0.05)",
                  flexShrink: 0,
                }}
              >
                <Image
                  src="/logo-singularidade.png"
                  alt="Logo Singularidade"
                  width={isSmall ? 52 : 60}
                  height={isSmall ? 52 : 60}
                  style={{ objectFit: "cover" }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: 8, minWidth: 0 }}>
                <span
                  style={{
                    fontWeight: 900,
                    fontSize: isSmall ? 20 : 22,
                    letterSpacing: 0.55,
                    whiteSpace: "nowrap",
                    textShadow: "0 0 10px rgba(94,231,255,0.06)",
                  }}
                >
                  SINGULARIDADE
                </span>
                <span
                  style={{
                    color: "#93a7ca",
                    fontSize: 13,
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                  }}
                >
                  OBP
                </span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 9,
                alignItems: "center",
                flexWrap: "nowrap",
                overflowX: "auto",
                scrollbarWidth: "none",
                width: isSmall ? "100%" : "auto",
                paddingBottom: 2,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.025))",
                  border: "1px solid rgba(255,255,255,0.09)",
                  borderRadius: 12,
                  padding: "9px 12px",
                  minHeight: 42,
                  flexShrink: 0,
                  boxShadow: "0 8px 18px rgba(0,0,0,0.12)",
                }}
              >
                <span style={{ color: "#f4c24e", fontSize: 15 }}>🪙</span>
                <select
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  style={{
                    background: "transparent",
                    color: "#eef4ff",
                    border: "none",
                    outline: "none",
                    fontWeight: 900,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  {symbols.map((s) => (
                    <option key={s} value={s} style={{ color: "#000" }}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {timeframes.map((tf) => {
                const active = timeframe === tf;
                return (
                  <PremiumButton
                    key={tf}
                    active={active}
                    onClick={() => setTimeframe(tf)}
                    compact={isSmall}
                  >
                    {tf}
                  </PremiumButton>
                );
              })}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              color: "#9cb0d2",
              fontSize: 13,
              flexShrink: 0,
              whiteSpace: "nowrap",
              width: isSmall ? "100%" : "auto",
              justifyContent: isSmall ? "space-between" : "flex-end",
            }}
          >
            <span style={{ opacity: 0.9 }}>Replay</span>
            <span style={{ opacity: 0.9 }}>IA Atlas</span>
            <span
              style={{
                color: change.startsWith("-") ? "#ff6b81" : "#2fe19a",
                fontWeight: 900,
                fontSize: 14,
              }}
            >
              {change}
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px 10px",
            overflowX: "auto",
            scrollbarWidth: "none",
            background:
              "linear-gradient(180deg, rgba(12,18,34,0.55), rgba(8,12,24,0.10))",
          }}
        >
          {topModules.map((item) => {
            const active = activeModule === item;
            return (
              <PremiumButton
                key={item}
                active={active}
                onClick={() => setActiveModule(item)}
                compact={isSmall}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 18, textAlign: "center", color: active ? "#fff0ad" : "#96abd0" }}>
                    {moduleIcons[item]}
                  </span>
                  <span>{item}</span>
                </span>
              </PremiumButton>
            );
          })}
        </div>
      </div>

      <div style={{ padding: 12 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: mainGridColumns,
            gap: 10,
            alignItems: "start",
          }}
        >
          {!isSmall && (
            <div
              style={{
                background:
                  "linear-gradient(180deg, rgba(14,21,38,0.98), rgba(8,12,24,0.98))",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 16,
                padding: "10px 4px",
                display: "flex",
                flexDirection: isMedium ? "row" : "column",
                flexWrap: isMedium ? "wrap" : "nowrap",
                gap: 8,
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 16px 40px rgba(0,0,0,0.24)",
              }}
            >
              {chartTools.map((tool) => {
                const active = activeTool === tool.key;
                return (
                  <button
                    key={tool.key}
                    title={tool.label}
                    onClick={() => setActiveTool(tool.key)}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 9,
                      border: active
                        ? `1px solid ${moduleAccent}55`
                        : "1px solid rgba(255,255,255,0.06)",
                      background: active
                        ? `linear-gradient(180deg, ${moduleAccent}28, rgba(255,255,255,0.03))`
                        : "rgba(255,255,255,0.025)",
                      color: active ? "#eef4ff" : "#9fb3d4",
                      fontSize: 13,
                      cursor: "pointer",
                      boxShadow: active ? `0 0 18px ${moduleAccent}22` : "none",
                    }}
                  >
                    {tool.icon}
                  </button>
                );
              })}
            </div>
          )}

          <div
            style={{
              background:
                "linear-gradient(180deg, rgba(12,18,34,0.985), rgba(7,11,22,0.99))",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14,
              overflow: "hidden",
              boxShadow: "0 10px 26px rgba(0,0,0,0.24)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 12px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 24,
                    height: 24,
                    borderRadius: 8,
                    background: `${moduleAccent}20`,
                    color: moduleAccent,
                    fontWeight: 900,
                    fontSize: 12,
                    border: `1px solid ${moduleAccent}33`,
                    padding: "0 8px",
                    boxShadow: `0 0 16px ${moduleAccent}22`,
                  }}
                >
                  {activeModule.slice(0, 2).toUpperCase()}
                </div>

                <div>
                  <div style={{ fontWeight: 900, fontSize: 15 }}>{symbol}</div>
                  <div style={{ color: "#8fa3c7", fontSize: 11 }}>
                    {moduleTitle} • Ferramenta: {chartTools.find((t) => t.key === activeTool)?.label} • TF: {timeframe}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, color: "#8fa3c7", fontSize: 13, alignItems: "center", flexWrap: "wrap" }}>
                <ControlButton
                  active={viewMode === "auto"}
                  onClick={() => {
                    setViewMode("auto");
                    savedScrollPositionRef.current = 0;
                    chartRef.current?.timeScale()?.scrollToRealTime();
                  }}
                >
                  Auto
                </ControlButton>
                <ControlButton
                  active={viewMode === "manual"}
                  onClick={() => {
                    setViewMode("manual");
                    const currentScroll = chartRef.current?.timeScale()?.scrollPosition();
                    if (
                      typeof currentScroll === "number" &&
                      Number.isFinite(currentScroll)
                    ) {
                      savedScrollPositionRef.current = currentScroll;
                    }
                  }}
                >
                  Manual
                </ControlButton>
                <ControlButton
                  active={viewMode === "space"}
                  onClick={() => {
                    setViewMode("space");
                    savedScrollPositionRef.current = spaceOffset;
                    chartRef.current?.timeScale()?.scrollToPosition(spaceOffset, false);
                  }}
                >
                  Seguir + Espaço
                </ControlButton>
                <ControlButton onClick={zoomOut}>Zoom -</ControlButton>
                <ControlButton onClick={zoomIn}>Zoom +</ControlButton>
                <ControlButton onClick={goToCurrent}>Agora</ControlButton>
                <ControlButton onClick={clearDrawings}>Limpar</ControlButton>
                <span>♡</span>
                <span>⚡</span>
                <span>◎</span>
                <span>⚙</span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                padding: "7px 12px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                background:
                  "linear-gradient(180deg, rgba(8,12,24,0.75), rgba(8,12,24,0.35))",
                color: "#6f84ab",
                fontSize: 10,
                letterSpacing: 0.35,
                textTransform: "uppercase",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ color: "#00d4ff", fontWeight: 800 }}>{symbol}</span>
                <span>OBP Engine</span>
                <span style={{ padding: "2px 6px", borderRadius: 6, background: "rgba(255,255,255,0.04)" }}>A</span>
                <span style={{ padding: "2px 6px", borderRadius: 6, background: "rgba(255,255,255,0.04)" }}>OO</span>
                <span style={{ padding: "2px 6px", borderRadius: 6, background: "rgba(255,255,255,0.04)" }}>3</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span>Spread 0.12</span>
                <span>Vol {volume}</span>
                <span>Src {source}</span>
              </div>
            </div>

            {isSmall && (
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  padding: "10px 12px",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  overflowX: "auto",
                  scrollbarWidth: "none",
                }}
              >
                {chartTools.map((tool) => {
                  const active = activeTool === tool.key;
                  return (
                    <button
                      key={tool.key}
                      title={tool.label}
                      onClick={() => setActiveTool(tool.key)}
                      style={{
                        width: 34,
                        height: 30,
                        borderRadius: 10,
                        border: active
                          ? `1px solid ${moduleAccent}55`
                          : "1px solid rgba(255,255,255,0.06)",
                        background: active
                          ? `linear-gradient(180deg, ${moduleAccent}28, rgba(255,255,255,0.03))`
                          : "rgba(255,255,255,0.025)",
                        color: active ? "#eef4ff" : "#9fb3d4",
                        fontSize: 14,
                        cursor: "pointer",
                        flexShrink: 0,
                        boxShadow: active ? `0 0 18px ${moduleAccent}22` : "none",
                      }}
                    >
                      {tool.icon}
                    </button>
                  );
                })}
              </div>
            )}

            <div style={{ position: "relative", width: "100%", height: chartHeight }}>
              <div ref={chartContainerRef} style={{ width: "100%", height: chartHeight }} />
              <div
                onClick={handleOverlayClick}
                onMouseDown={handleOverlayMouseDown}
                onMouseMove={handleOverlayMouseMove}
                onMouseUp={handleOverlayMouseUp}
                onMouseLeave={() => {
                  if (activeTool === "zones" && isDragging) clearDrafts();
                }}
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 4,
                  background: "transparent",
                  cursor:
                    activeTool === "levels"
                      ? "row-resize"
                      : activeTool === "cursor"
                      ? "crosshair"
                      : activeTool === "line"
                      ? "crosshair"
                      : activeTool === "zones"
                      ? "crosshair"
                      : activeTool === "measure"
                      ? "crosshair"
                      : "default",
                }}
              />
              <DrawingOverlay
                width={chartSize.width}
                height={chartSize.height}
                drawings={drawings}
                draftLine={draftLine}
                draftZone={draftZone}
                draftMeasure={draftMeasure}
              />
            </div>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <div
              style={{
                background:
                  "linear-gradient(180deg, rgba(9,14,28,0.99), rgba(7,11,22,0.995))",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 14,
                padding: 10,
                boxShadow: "0 8px 18px rgba(0,0,0,0.22)",
              }}
            >
              <div
                style={{
                  color: "#dfe8ff",
                  fontWeight: 900,
                  fontSize: 13,
                  marginBottom: 10,
                }}
              >
                {insightConfig.panelTitle}
              </div>
              <div style={{ color: "#8fa3c7", fontSize: 12, marginBottom: 8 }}>{symbol}</div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  marginBottom: 12,
                  gap: 12,
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 900 }}>{symbol}</div>
                <div
                  style={{
                    fontSize: 30,
                    lineHeight: 1,
                    fontWeight: 900,
                    color: scoreColor,
                    textShadow: `0 0 18px ${moduleAccent}22`,
                  }}
                >
                  {insightConfig.scoreValue}
                </div>
              </div>
              <div
                style={{
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 12,
                  overflow: "hidden",
                  marginBottom: 10,
                }}
              >
                <div style={{ height: 6, background: "rgba(255,255,255,0.05)" }}>
                  <div
                    style={{
                      width: `${insightConfig.scoreValue}%`,
                      height: "100%",
                      background: `linear-gradient(90deg, ${moduleAccent}70, rgba(61,229,255,0.95))`,
                      boxShadow: `0 0 18px ${moduleAccent}35`,
                    }}
                  />
                </div>
                <div
                  style={{
                    padding: "10px 11px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontWeight: 800,
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: "#8fa3c7" }}>Score</span>
                  <span style={{ color: "#eef4ff" }}>{insightConfig.scoreLabel}</span>
                </div>
              </div>
              {insightConfig.rowsTop.map((row) => (
                <RightRow
                  key={`${activeModule}-top-${row.label}`}
                  label={row.label}
                  value={row.value}
                  positive={row.positive}
                />
              ))}
            </div>

            <div
              style={{
                background:
                  "linear-gradient(180deg, rgba(12,18,34,0.985), rgba(7,11,22,0.99))",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 14,
                padding: 10,
                boxShadow: "0 8px 18px rgba(0,0,0,0.22)",
              }}
            >
              <div
                style={{
                  color: "#dfe8ff",
                  fontWeight: 900,
                  fontSize: 14,
                  marginBottom: 8,
                }}
              >
                {insightConfig.rowsBottomTitle}
              </div>
              <div style={{ color: "#8fa3c7", fontSize: 12, marginBottom: 12 }}>
                {insightConfig.rowsBottomDescription}
              </div>
              {insightConfig.rowsBottom.map((row) => (
                <RightRow
                  key={`${activeModule}-bottom-${row.label}`}
                  label={row.label}
                  value={row.value}
                  positive={row.positive}
                />
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 6,
            background:
              "linear-gradient(180deg, rgba(12,18,34,0.985), rgba(7,11,22,0.99))",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            padding: 10,
            boxShadow: "0 8px 18px rgba(0,0,0,0.22)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 14,
            }}
          >
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {bottomTabs.map((tab, i) => (
                <div
                  key={tab}
                  style={{
                    padding: "7px 11px",
                    borderRadius: 11,
                    border: "1px solid rgba(255,255,255,0.06)",
                    background:
                      i === 0
                        ? `linear-gradient(180deg, ${moduleAccent}24, rgba(255,255,255,0.03))`
                        : "rgba(255,255,255,0.025)",
                    color: i === 0 ? "#eef4ff" : "#a8b8d8",
                    fontWeight: 800,
                    fontSize: 11,
                  }}
                >
                  {tab}
                </div>
              ))}
            </div>
            <div style={{ color: "#88a0c9", fontSize: 12 }}>
              {moduleTitle} • Volume • RSI • Fluxo
            </div>
          </div>

          {activeModule === "Liquidez" ? (
            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <div
                  style={{
                    color: "#dfe8ff",
                    fontWeight: 900,
                    marginBottom: 8,
                    fontSize: 14,
                  }}
                >
                  Mapa de Liquidez
                </div>
                <div style={{ color: "#8ea4c8", fontSize: 12, marginBottom: 12 }}>
                  Heatmap institucional exibido apenas no painel inferior para manter
                  o gráfico principal limpo.
                </div>
              </div>

              <div
                style={{
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 14,
                  padding: 16,
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isSmall ? "1fr" : "92px minmax(0, 1fr) 190px",
                    gap: 14,
                    alignItems: "stretch",
                  }}
                >
                  <div style={{ display: "grid", gap: 8 }}>
                    {liquidityHeatRows.map((row) => (
                      <div
                        key={row.level}
                        style={{
                          height: 30,
                          display: "flex",
                          alignItems: "center",
                          color: "#dfe8ff",
                          fontWeight: 800,
                          fontSize: 13,
                        }}
                      >
                        {row.level}
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "grid", gap: 10 }}>
                    {liquidityHeatRows.map((row, idx) => (
                      <div
                        key={row.level}
                        style={{
                          position: "relative",
                          height: 30,
                          borderRadius: 8,
                          overflow: "hidden",
                          background:
                            idx === 0
                              ? "linear-gradient(90deg, rgba(255,80,80,0.20), rgba(255,120,0,0.92), rgba(255,230,120,0.98))"
                              : idx === 1
                              ? "linear-gradient(90deg, rgba(255,100,60,0.16), rgba(255,150,0,0.78), rgba(255,220,100,0.90))"
                              : idx === 2
                              ? "linear-gradient(90deg, rgba(255,120,40,0.12), rgba(255,170,0,0.66), rgba(255,210,90,0.76))"
                              : idx === 3
                              ? "linear-gradient(90deg, rgba(255,90,120,0.10), rgba(255,130,0,0.54), rgba(255,200,90,0.62))"
                              : "linear-gradient(90deg, rgba(70,160,255,0.12), rgba(35,211,238,0.42), rgba(255,210,90,0.48))",
                          boxShadow:
                            idx < 2 ? "0 0 28px rgba(255,170,0,0.18) inset" : "none",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            width: `${row.strength}%`,
                            background:
                              "linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.14), rgba(255,255,255,0.02))",
                            mixBlendMode: "screen",
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: 12,
                      padding: 12,
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.015))",
                    }}
                  >
                    <div style={{ color: "#dfe8ff", fontWeight: 900, marginBottom: 10 }}>
                      Resumo de Liquidez
                    </div>
                    <RightRow label="Cluster institucional" value="71,600" positive />
                    <RightRow label="Liquidez acumulada" value="71,520" positive />
                    <RightRow label="Zona de stops" value="71,350 - 71,220" positive />
                    <RightRow label="Alvo provável" value="71,480" positive />
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isSmall ? "1fr" : "repeat(4, minmax(0, 1fr))",
                  gap: 8,
                }}
              >
                <StatCard title="Parede" value="71,600" positive />
                <StatCard title="Cluster" value="Forte" positive />
                <StatCard title="Heatmap" value="Ativo" positive />
                <StatCard title="Caça" value="Provável" positive />
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: bottomGridColumns,
                gap: 16,
              }}
            >
              <div>
                <div
                  style={{
                    color: "#dfe8ff",
                    fontWeight: 900,
                    marginBottom: 8,
                    fontSize: 14,
                  }}
                >
                  {leftPanelTitle}
                </div>
                <div style={{ color: "#8ea4c8", fontSize: 12, marginBottom: 12 }}>
                  {leftDynamicBlock.subtitle}
                </div>

                {leftDynamicBlock.type === "table" ? (
                  <>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: isSmall
                          ? "1.3fr 1fr 1fr"
                          : "1.2fr 1fr 1fr 1fr",
                        gap: 10,
                        color: "#7f95bb",
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: 0.4,
                        paddingBottom: 10,
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <div>Ativo</div>
                      <div>Score</div>
                      <div>Tendência</div>
                      {!isSmall && <div style={{ textAlign: "right" }}>Preço</div>}
                    </div>
                    {leftRows.map((row) =>
                      isSmall ? (
                        <div
                          key={`${activeModule}-${row.asset}`}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1.3fr 1fr 1fr",
                            gap: 10,
                            padding: "12px 0",
                            borderBottom: "1px solid rgba(255,255,255,0.05)",
                            color: "#d8e2ff",
                            fontSize: 13,
                          }}
                        >
                          <div style={{ fontWeight: 800 }}>{row.asset}</div>
                          <div>{row.score}</div>
                          <div style={{ color: "#34d399", fontWeight: 800 }}>
                            {row.trend}
                          </div>
                        </div>
                      ) : (
                        <ScannerRow
                          key={`${activeModule}-${row.asset}`}
                          asset={row.asset}
                          score={row.score}
                          trend={row.trend}
                          price={row.price}
                        />
                      )
                    )}
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: isSmall
                          ? "1fr"
                          : "repeat(2, minmax(0, 1fr))",
                        gap: 10,
                        marginBottom: 12,
                      }}
                    >
                      {leftDynamicBlock.cards.map((card) => (
                        <MiniMetricCard
                          key={`${activeModule}-${card.title}`}
                          title={card.title}
                          value={card.value}
                          subtitle={card.subtitle}
                          positive={card.positive}
                        />
                      ))}
                    </div>
                    <div
                      style={{
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: 16,
                        padding: 12,
                        background:
                          "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))",
                      }}
                    >
                      <div
                        style={{
                          color: "#dfe8ff",
                          fontWeight: 800,
                          marginBottom: 6,
                          fontSize: 14,
                        }}
                      >
                        {leftDynamicBlock.title}
                      </div>
                      {leftDynamicBlock.rows.map((row) => (
                        <LeftInfoRow
                          key={`${activeModule}-${row.label}`}
                          label={row.label}
                          value={row.value}
                          positive={row.positive}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div
                style={{
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 16,
                  padding: 12,
                  background:
                    "radial-gradient(circle at top, rgba(38,106,255,0.18), transparent 35%), rgba(255,255,255,0.02)",
                  minHeight: 210,
                }}
              >
                <div style={{ color: "#dfe8ff", fontWeight: 900, marginBottom: 8 }}>
                  {pulseConfig.title}
                </div>
                <div style={{ color: "#8fa3c7", fontSize: 12, marginBottom: 15 }}>
                  {pulseConfig.description}
                </div>
                <div
                  style={{
                    height: 104,
                    borderRadius: 12,
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(90deg, rgba(61,229,255,0.0), rgba(61,229,255,0.12), rgba(255,213,79,0.10), rgba(61,229,255,0.0))",
                    }}
                  />
                  <svg
                    viewBox="0 0 600 140"
                    width="100%"
                    height="100%"
                    style={{ position: "relative" }}
                  >
                    <path d={pulseConfig.path1} fill="none" stroke="#5ee7ff" strokeWidth="3" />
                    <path
                      d={pulseConfig.path2}
                      fill="none"
                      stroke="#ffd65a"
                      strokeWidth="2"
                      opacity="0.9"
                    />
                  </svg>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isSmall ? "1fr" : "repeat(3, 1fr)",
                    gap: 10,
                    marginTop: 12,
                  }}
                >
                  <StatCard
                    title={pulseConfig.stats[0].title}
                    value={pulseConfig.stats[0].value}
                    positive={pulseConfig.stats[0].positive}
                  />
                  <StatCard
                    title={pulseConfig.stats[1].title}
                    value={pulseConfig.stats[1].value}
                    positive={pulseConfig.stats[1].positive}
                  />
                  <StatCard
                    title={pulseConfig.biasLabel}
                    value={pulseConfig.biasValue}
                    positive
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: 8,
            display: "grid",
            gridTemplateColumns: isSmall ? "1fr" : "repeat(3, minmax(0, 1fr))",
            gap: 8,
          }}
        >
          <StatCard title="Preço" value={price} positive={!change.startsWith("-")} />
          <StatCard title="Variação" value={change} positive={!change.startsWith("-")} />
          <StatCard title="Volume" value={volume} positive />
        </div>
      </div>
    </div>
  );
}
