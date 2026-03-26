"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  HistogramData,
  Time,
  UTCTimestamp,
} from "lightweight-charts";

type TopModule =
  | "Fluxo"
  | "Singularidade"
  | "IA Atlas"
  | "Scanner"
  | "Estrutura"
  | "Euler"
  | "Liquidez"
  | "Mestre Scanner";

type Timeframe = "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d";
type DrawTool = "cursor" | "trendline" | "hline" | "vline" | "rect" | "fib";

type ChartPoint = {
  time: UTCTimestamp;
  price: number;
};

type Drawing = {
  id: string;
  tool: DrawTool;
  color: string;
  locked: boolean;
  hidden: boolean;
  p1: ChartPoint;
  p2: ChartPoint;
};

type DragState = {
  id: string;
  kind: "move" | "start" | "end";
  lastPoint: ChartPoint;
} | null;

type ScreenDrawing = {
  id: string;
  tool: DrawTool;
  color: string;
  locked: boolean;
  hidden: boolean;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

const ui = {
  bg: "#060b14",
  panel: "rgba(9,14,26,0.98)",
  panel2: "rgba(12,19,36,0.98)",
  border: "rgba(255,255,255,0.07)",
  soft: "#8ea2c8",
  text: "#eef4ff",
  cyan: "#00d4ff",
  green: "#34d399",
  red: "#fb7185",
  yellow: "#ffd54f",
  orange: "#ff9f43",
};

const topModules: TopModule[] = [
  "Fluxo",
  "Singularidade",
  "IA Atlas",
  "Scanner",
  "Estrutura",
  "Euler",
  "Liquidez",
  "Mestre Scanner",
];

const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"];
const timeframes: Timeframe[] = ["1m", "5m", "15m", "30m", "1h", "4h", "1d"];

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function formatCompact(num: number) {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
  return num.toFixed(2);
}

function makeMockData(points = 220): {
  candles: CandlestickData<Time>[];
  volume: HistogramData<Time>[];
} {
  const start = Math.floor(Date.now() / 1000) - points * 60;
  let last = 74200;
  const candles: CandlestickData<Time>[] = [];
  const volume: HistogramData<Time>[] = [];
  for (let i = 0; i < points; i++) {
    const time = (start + i * 60) as UTCTimestamp;
    const wave = Math.sin(i / 12) * 34 + Math.cos(i / 8) * 18;
    const open = last;
    const close = open + wave + (Math.random() - 0.5) * 55;
    const high = Math.max(open, close) + Math.random() * 70;
    const low = Math.min(open, close) - Math.random() * 70;
    last = close;
    candles.push({ time, open, high, low, close });
    volume.push({
      time,
      value: Math.round(600 + Math.random() * 2400),
      color: close >= open ? "rgba(52,211,153,0.35)" : "rgba(251,113,133,0.35)",
    });
  }
  return { candles, volume };
}

function SmallCard({
  title,
  value,
  color,
  sub,
}: {
  title: string;
  value: string;
  color: string;
  sub: string;
}) {
  return (
    <div
      style={{
        border: `1px solid ${ui.border}`,
        borderRadius: 12,
        background: `linear-gradient(180deg, ${ui.panel2}, rgba(7,11,22,0.99))`,
        padding: "10px 12px",
        minHeight: 60,
      }}
    >
      <div style={{ color: "#7f93b9", fontSize: 10, fontWeight: 800, marginBottom: 4 }}>{title}</div>
      <div style={{ color, fontSize: 18, fontWeight: 900, lineHeight: 1.1 }}>{value}</div>
      <div style={{ color: "#8ea2c8", fontSize: 10, marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function SideToolButton({
  active,
  icon,
  title,
  onClick,
}: {
  active?: boolean;
  icon: string;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        border: active ? `1px solid ${ui.cyan}` : `1px solid ${ui.border}`,
        background: active ? "rgba(0,212,255,0.14)" : "rgba(255,255,255,0.03)",
        color: active ? "#bff8ff" : "#9cb1d8",
        cursor: "pointer",
        fontWeight: 800,
        fontSize: icon.length > 2 ? 10 : 14,
      }}
    >
      {icon}
    </button>
  );
}

function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy || 1;
  const t = clamp(((px - x1) * dx + (py - y1) * dy) / lenSq, 0, 1);
  const xx = x1 + t * dx;
  const yy = y1 + t * dy;
  return Math.hypot(px - xx, py - yy);
}

function PlaceholderModule({ title }: { title: string }) {
  return (
    <div style={{ height: "100%", padding: 12 }}>
      <div
        style={{
          height: "100%",
          borderRadius: 16,
          border: `1px solid ${ui.border}`,
          background: `linear-gradient(180deg, ${ui.panel2}, rgba(7,11,22,0.99))`,
          display: "grid",
          placeItems: "center",
          color: "#92a7cf",
          fontWeight: 700,
        }}
      >
        {title}
      </div>
    </div>
  );
}

function drawShape(d: ScreenDrawing, width: number, height: number, selected: boolean) {
  const stroke = d.color;
  const handles =
    selected && !d.locked ? (
      <>
        <circle cx={d.x1} cy={d.y1} r={5} fill="#fff" stroke={stroke} strokeWidth={1.5} />
        {(d.tool === "trendline" || d.tool === "rect" || d.tool === "fib") && (
          <circle cx={d.x2} cy={d.y2} r={5} fill="#fff" stroke={stroke} strokeWidth={1.5} />
        )}
      </>
    ) : null;

  if (d.hidden) return null;

  if (d.tool === "hline") {
    return (
      <g key={d.id}>
        <line
          x1={0}
          y1={d.y1}
          x2={width}
          y2={d.y1}
          stroke={stroke}
          strokeWidth={selected ? 2.4 : 1.8}
          strokeDasharray="6 5"
        />
        {handles}
      </g>
    );
  }

  if (d.tool === "vline") {
    return (
      <g key={d.id}>
        <line
          x1={d.x1}
          y1={0}
          x2={d.x1}
          y2={height}
          stroke={stroke}
          strokeWidth={selected ? 2.4 : 1.8}
          strokeDasharray="6 5"
        />
        {handles}
      </g>
    );
  }

  if (d.tool === "rect") {
    const x = Math.min(d.x1, d.x2);
    const y = Math.min(d.y1, d.y2);
    const w = Math.abs(d.x2 - d.x1);
    const h = Math.abs(d.y2 - d.y1);
    return (
      <g key={d.id}>
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          fill="rgba(0,212,255,0.08)"
          stroke={stroke}
          strokeWidth={selected ? 2.2 : 1.7}
        />
        {handles}
      </g>
    );
  }

  if (d.tool === "fib") {
    const left = Math.min(d.x1, d.x2);
    const right = Math.max(d.x1, d.x2);
    const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
    return (
      <g key={d.id}>
        {levels.map((lv) => {
          const y = d.y1 + (d.y2 - d.y1) * lv;
          return (
            <g key={`${d.id}-${lv}`}>
              <line
                x1={left}
                y1={y}
                x2={right}
                y2={y}
                stroke={stroke}
                strokeWidth={selected ? 2.0 : 1.4}
              />
              <text x={left + 6} y={y - 4} fill={stroke} fontSize={10} fontWeight={800}>
                {lv.toFixed(3)}
              </text>
            </g>
          );
        })}
        {handles}
      </g>
    );
  }

  return (
    <g key={d.id}>
      <line
        x1={d.x1}
        y1={d.y1}
        x2={d.x2}
        y2={d.y2}
        stroke={stroke}
        strokeWidth={selected ? 2.4 : 1.9}
      />
      {handles}
    </g>
  );
}

function ScannerWorkspace({
  symbol,
  timeframe,
}: {
  symbol: string;
  timeframe: Timeframe;
}) {
  const chartHostRef = useRef<HTMLDivElement | null>(null);
  const overlayWrapRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  const data = useMemo(() => makeMockData(220), [symbol, timeframe]);

  const [activeTool, setActiveTool] = useState<DrawTool>("cursor");
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [draft, setDraft] = useState<Drawing | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState>(null);
  const [svgSize, setSvgSize] = useState({ width: 1000, height: 600 });
  const [hoveringDrawing, setHoveringDrawing] = useState(false);

  const selectedDrawing = drawings.find((d) => d.id === selectedId) || null;
  const livePrice = data.candles[data.candles.length - 1]?.close ?? 0;
  const prevPrice = data.candles[data.candles.length - 2]?.close ?? livePrice;
  const priceChange = prevPrice ? ((livePrice - prevPrice) / prevPrice) * 100 : 0;

  useEffect(() => {
    if (!chartHostRef.current) return;

    const chart = createChart(chartHostRef.current, {
      width: chartHostRef.current.clientWidth,
      height: chartHostRef.current.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#7085ad",
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.035)" },
        horzLines: { color: "rgba(255,255,255,0.035)" },
      },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.08)" },
      timeScale: {
        borderColor: "rgba(255,255,255,0.08)",
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: { mode: CrosshairMode.Normal },
      handleScroll: true,
      handleScale: true,
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#37f4ad",
      downColor: "#ff6c8d",
      borderUpColor: "#37f4ad",
      borderDownColor: "#ff6c8d",
      wickUpColor: "#37f4ad",
      wickDownColor: "#ff6c8d",
    });

    const volumeSeries = chart.addHistogramSeries({
      priceScaleId: "",
      color: "rgba(0,212,255,0.35)",
      priceFormat: { type: "volume" },
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });

    candleSeries.setData(data.candles);
    volumeSeries.setData(data.volume);

    chart.timeScale().fitContent();

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    const updateSize = () => {
      if (!chartHostRef.current) return;
      const width = chartHostRef.current.clientWidth;
      const height = chartHostRef.current.clientHeight;
      chart.applyOptions({ width, height });
      setSvgSize({ width, height });
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(chartHostRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [data]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        setDrawings((prev) => prev.filter((d) => d.id !== selectedId));
        setSelectedId(null);
      }
      if (e.key === "Escape") {
        setDraft(null);
        setDragState(null);
        setActiveTool("cursor");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  const pixelToChartPoint = (clientX: number, clientY: number): ChartPoint | null => {
    const rect = overlayWrapRef.current?.getBoundingClientRect();
    const chart = chartRef.current;
    const series = candleSeriesRef.current;
    if (!rect || !chart || !series) return null;

    const x = clamp(clientX - rect.left, 0, rect.width);
    const y = clamp(clientY - rect.top, 0, rect.height);

    const rawTime = chart.timeScale().coordinateToTime(x);
    const rawPrice = series.coordinateToPrice(y);

    if (rawTime == null || rawPrice == null) return null;
    if (typeof rawTime !== "number") return null;

    return {
      time: rawTime as UTCTimestamp,
      price: rawPrice,
    };
  };

  const chartPointToPixel = (point: ChartPoint) => {
    const chart = chartRef.current;
    const series = candleSeriesRef.current;
    if (!chart || !series) return null;

    const x = chart.timeScale().timeToCoordinate(point.time);
    const y = series.priceToCoordinate(point.price);

    if (x == null || y == null) return null;
    return { x, y };
  };

  const toScreenDrawing = (d: Drawing): ScreenDrawing | null => {
    const a = chartPointToPixel(d.p1);
    const b = chartPointToPixel(d.p2);
    if (!a || !b) return null;

    return {
      id: d.id,
      tool: d.tool,
      color: d.color,
      locked: d.locked,
      hidden: d.hidden,
      x1: a.x,
      y1: a.y,
      x2: b.x,
      y2: b.y,
    };
  };

  const visibleDrawings = useMemo(() => {
    const list = draft ? [...drawings, draft] : drawings;
    return list
      .map((d) => ({ raw: d, screen: toScreenDrawing(d) }))
      .filter((item): item is { raw: Drawing; screen: ScreenDrawing } => !!item.screen);
  }, [drawings, draft, svgSize]);

  const hitDrawing = (x: number, y: number) => {
    for (let i = visibleDrawings.length - 1; i >= 0; i -= 1) {
      const { raw, screen } = visibleDrawings[i];
      if (raw.hidden) continue;

      if (!raw.locked) {
        if (Math.hypot(x - screen.x1, y - screen.y1) <= 8) return { id: raw.id, kind: "start" as const };
        if (
          (raw.tool === "trendline" || raw.tool === "rect" || raw.tool === "fib") &&
          Math.hypot(x - screen.x2, y - screen.y2) <= 8
        ) {
          return { id: raw.id, kind: "end" as const };
        }
      }

      if (raw.tool === "hline" && Math.abs(y - screen.y1) < 8) return { id: raw.id, kind: "move" as const };
      if (raw.tool === "vline" && Math.abs(x - screen.x1) < 8) return { id: raw.id, kind: "move" as const };

      if (raw.tool === "rect" || raw.tool === "fib") {
        const lx = Math.min(screen.x1, screen.x2);
        const rx = Math.max(screen.x1, screen.x2);
        const ty = Math.min(screen.y1, screen.y2);
        const by = Math.max(screen.y1, screen.y2);
        if (x >= lx - 8 && x <= rx + 8 && y >= ty - 8 && y <= by + 8) {
          return { id: raw.id, kind: "move" as const };
        }
      }

      if (raw.tool === "trendline" && distToSegment(x, y, screen.x1, screen.y1, screen.x2, screen.y2) < 8) {
        return { id: raw.id, kind: "move" as const };
      }
    }

    return null;
  };

  const beginPointer = (e: React.MouseEvent<HTMLDivElement | SVGSVGElement>) => {
    const point = pixelToChartPoint(e.clientX, e.clientY);
    if (!point) return;

    const rect = overlayWrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const localX = clamp(e.clientX - rect.left, 0, rect.width);
    const localY = clamp(e.clientY - rect.top, 0, rect.height);

    if (activeTool === "cursor") {
      const hit = hitDrawing(localX, localY);
      if (!hit) {
        setSelectedId(null);
        return;
      }

      setSelectedId(hit.id);
      const found = drawings.find((d) => d.id === hit.id);
      if (!found || found.locked) return;
      setDragState({ id: hit.id, kind: hit.kind, lastPoint: point });
      return;
    }

    const id = `dw-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    if (activeTool === "hline") {
      const obj: Drawing = {
        id,
        tool: "hline",
        color: ui.yellow,
        locked: false,
        hidden: false,
        p1: point,
        p2: point,
      };
      setDrawings((prev) => [...prev, obj]);
      setSelectedId(id);
      setActiveTool("cursor");
      return;
    }

    if (activeTool === "vline") {
      const obj: Drawing = {
        id,
        tool: "vline",
        color: ui.orange,
        locked: false,
        hidden: false,
        p1: point,
        p2: point,
      };
      setDrawings((prev) => [...prev, obj]);
      setSelectedId(id);
      setActiveTool("cursor");
      return;
    }

    const color = activeTool === "fib" ? ui.yellow : ui.cyan;
    setDraft({
      id,
      tool: activeTool,
      color,
      locked: false,
      hidden: false,
      p1: point,
      p2: point,
    });
    setSelectedId(id);
  };

  const movePointer = (e: React.MouseEvent<HTMLDivElement | SVGSVGElement>) => {
    const point = pixelToChartPoint(e.clientX, e.clientY);
    if (!point) return;

    const rect = overlayWrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const localX = clamp(e.clientX - rect.left, 0, rect.width);
    const localY = clamp(e.clientY - rect.top, 0, rect.height);

    if (activeTool === "cursor" && !dragState) {
      const hit = hitDrawing(localX, localY);
      setHoveringDrawing(!!hit);
      return;
    }

    if (draft) {
      setDraft((prev) => (prev ? { ...prev, p2: point } : prev));
      return;
    }

    if (!dragState) return;

    setDrawings((prev) =>
      prev.map((d) => {
        if (d.id !== dragState.id || d.locked) return d;

        if (dragState.kind === "start") {
          return { ...d, p1: point };
        }

        if (dragState.kind === "end") {
          return { ...d, p2: point };
        }

        const dt = point.time - dragState.lastPoint.time;
        const dp = point.price - dragState.lastPoint.price;

        return {
          ...d,
          p1: {
            time: (d.p1.time + dt) as UTCTimestamp,
            price: d.p1.price + dp,
          },
          p2: {
            time: (d.p2.time + dt) as UTCTimestamp,
            price: d.p2.price + dp,
          },
        };
      })
    );

    setDragState((prev) => (prev ? { ...prev, lastPoint: point } : prev));
  };

  const finishPointer = () => {
    if (draft) {
      setDrawings((prev) => [...prev, draft]);
      setDraft(null);
      setActiveTool("cursor");
    }
    setDragState(null);
  };

  const overlayCaptures =
    activeTool !== "cursor" || !!draft || !!dragState || hoveringDrawing;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", minWidth: 0 }}>
      <div
        style={{
          padding: "10px 12px",
          borderBottom: `1px solid ${ui.border}`,
          background: `linear-gradient(180deg, rgba(12,19,36,0.94), rgba(8,13,25,0.94))`,
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr repeat(4, 0.72fr) 280px", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "rgba(247,201,72,0.14)",
                color: ui.yellow,
                display: "grid",
                placeItems: "center",
                fontSize: 11,
                fontWeight: 900,
              }}
            >
              SC
            </div>
            <div>
              <div style={{ color: ui.text, fontWeight: 900, fontSize: 15 }}>{symbol}</div>
              <div style={{ color: "#7d91b6", fontSize: 10, fontWeight: 700 }}>
                Scanner Atlas • Ferramenta: {activeTool} • TF: {timeframe}
              </div>
            </div>
          </div>

          <SmallCard
            title="Preço"
            value={livePrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            color="#4ef0cb"
            sub="Mercado em tempo real"
          />
          <SmallCard
            title="Variação"
            value={`${priceChange >= 0 ? "+" : ""}${priceChange.toFixed(2)}%`}
            color={priceChange >= 0 ? ui.green : ui.red}
            sub="Último candle"
          />
          <SmallCard
            title="Volume"
            value={formatCompact(data.volume[data.volume.length - 1]?.value ?? 0)}
            color={ui.cyan}
            sub="Volume recente"
          />
          <SmallCard
            title="Desenhos"
            value={String(drawings.length + (draft ? 1 : 0))}
            color={drawings.length || draft ? ui.yellow : ui.red}
            sub="Objetos no gráfico"
          />

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <button
              onClick={() => {
                if (!selectedId) return;
                setDrawings((prev) => prev.map((d) => (d.id === selectedId ? { ...d, locked: !d.locked } : d)));
              }}
              style={{
                border: `1px solid ${ui.border}`,
                borderRadius: 10,
                padding: "8px 10px",
                background: "rgba(255,255,255,0.03)",
                color: "#d7e4ff",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {selectedDrawing?.locked ? "Destravar" : "Travar"}
            </button>
            <button
              onClick={() => {
                if (!selectedId) return;
                setDrawings((prev) => prev.map((d) => (d.id === selectedId ? { ...d, hidden: !d.hidden } : d)));
              }}
              style={{
                border: `1px solid ${ui.border}`,
                borderRadius: 10,
                padding: "8px 10px",
                background: "rgba(255,255,255,0.03)",
                color: "#d7e4ff",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {selectedDrawing?.hidden ? "Mostrar" : "Ocultar"}
            </button>
            <button
              onClick={() => {
                if (!selectedId) return;
                setDrawings((prev) => prev.filter((d) => d.id !== selectedId));
                setSelectedId(null);
              }}
              style={{
                border: "1px solid rgba(255,107,129,0.30)",
                borderRadius: 10,
                padding: "8px 10px",
                background: "rgba(255,107,129,0.08)",
                color: "#ffd3da",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Apagar selecionado
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "52px minmax(0, 1fr) 280px" }}>
        <div
          style={{
            borderRight: `1px solid ${ui.border}`,
            background: `linear-gradient(180deg, rgba(8,12,24,0.98), rgba(6,9,17,0.98))`,
            display: "flex",
            flexDirection: "column",
            padding: 8,
            gap: 6,
          }}
        >
          <SideToolButton active={activeTool === "cursor"} icon="↖" title="Cursor" onClick={() => setActiveTool("cursor")} />
          <SideToolButton active={activeTool === "trendline"} icon="╱" title="Linha" onClick={() => setActiveTool("trendline")} />
          <SideToolButton active={activeTool === "hline"} icon="─" title="Horizontal" onClick={() => setActiveTool("hline")} />
          <SideToolButton active={activeTool === "vline"} icon="│" title="Vertical" onClick={() => setActiveTool("vline")} />
          <SideToolButton active={activeTool === "rect"} icon="▭" title="Retângulo" onClick={() => setActiveTool("rect")} />
          <SideToolButton active={activeTool === "fib"} icon="FIB" title="Fibonacci" onClick={() => setActiveTool("fib")} />
        </div>

        <div
          ref={overlayWrapRef}
          style={{ position: "relative", minWidth: 0, minHeight: 0 }}
          onMouseDown={(e) => {
            if (activeTool !== "cursor") beginPointer(e);
          }}
          onMouseMove={(e) => {
            if (activeTool !== "cursor") movePointer(e);
          }}
          onMouseUp={() => {
            if (activeTool !== "cursor") finishPointer();
          }}
          onMouseLeave={() => {
            if (activeTool !== "cursor") finishPointer();
            setHoveringDrawing(false);
          }}
        >
          <div ref={chartHostRef} style={{ position: "absolute", inset: 0, zIndex: 1 }} />

          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${svgSize.width} ${svgSize.height}`}
            preserveAspectRatio="none"
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 5,
              pointerEvents: overlayCaptures ? "auto" : "none",
              cursor:
                activeTool !== "cursor"
                  ? "crosshair"
                  : hoveringDrawing
                  ? "pointer"
                  : "default",
            }}
            onMouseDown={(e) => beginPointer(e)}
            onMouseMove={(e) => movePointer(e)}
            onMouseUp={finishPointer}
            onMouseLeave={() => {
              finishPointer();
              setHoveringDrawing(false);
            }}
          >
            {visibleDrawings.map(({ raw, screen }) => (
              <g key={raw.id}>{drawShape(screen, svgSize.width, svgSize.height, raw.id === selectedId)}</g>
            ))}
          </svg>
        </div>

        <div
          style={{
            borderLeft: `1px solid ${ui.border}`,
            background: `linear-gradient(180deg, rgba(12,18,34,0.985), rgba(7,11,22,0.99))`,
            padding: 12,
            display: "grid",
            gridTemplateRows: "auto auto 1fr",
            gap: 12,
          }}
        >
          <div style={{ border: `1px solid ${ui.border}`, borderRadius: 14, padding: 12, background: "rgba(255,255,255,0.02)" }}>
            <div style={{ color: "#edf5ff", fontSize: 14, fontWeight: 900, marginBottom: 6 }}>Leitura rápida</div>
            <div style={{ color: "#8ea2c8", fontSize: 12, lineHeight: 1.7 }}>
              Agora os objetos vivem em time/preço. Cursor navega. Ferramentas capturam só quando necessário.
            </div>
          </div>

          <div style={{ border: `1px solid ${ui.border}`, borderRadius: 14, padding: 12, background: "rgba(255,255,255,0.02)" }}>
            <div style={{ color: "#edf5ff", fontSize: 14, fontWeight: 900, marginBottom: 6 }}>IA Análise</div>
            <div style={{ color: "#8ea2c8", fontSize: 12, lineHeight: 1.7 }}>
              Base correta para modularizar depois. Próximo passo ideal: extrair engine, overlay e sidebar em arquivos separados.
            </div>
          </div>

          <div style={{ border: `1px solid ${ui.border}`, borderRadius: 14, padding: 12, background: "rgba(255,255,255,0.02)", overflow: "auto" }}>
            <div style={{ color: "#edf5ff", fontSize: 14, fontWeight: 900, marginBottom: 8 }}>Objetos</div>
            {drawings.length === 0 ? (
              <div style={{ color: "#8ea2c8", fontSize: 12 }}>Nenhum desenho ainda.</div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {[...drawings].reverse().map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedId(d.id)}
                    style={{
                      textAlign: "left",
                      border: d.id === selectedId ? `1px solid ${ui.cyan}` : `1px solid ${ui.border}`,
                      background: d.id === selectedId ? "rgba(0,212,255,0.10)" : "rgba(255,255,255,0.03)",
                      borderRadius: 10,
                      padding: 10,
                      color: "#dfe8ff",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: 12 }}>{d.tool}</div>
                    <div style={{ color: "#8ea2c8", fontSize: 10, marginTop: 4 }}>
                      {d.locked ? "travado" : "editável"} • {d.hidden ? "oculto" : "visível"}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AtlasChartPro2() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState<Timeframe>("15m");
  const [activeModule, setActiveModule] = useState<TopModule>("Scanner");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(180deg, rgba(5,8,16,1), rgba(7,11,22,1))`,
        color: ui.text,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto auto 1fr auto",
          alignItems: "center",
          gap: 12,
          padding: "10px 14px",
          borderBottom: `1px solid ${ui.border}`,
          background: `linear-gradient(180deg, rgba(12,18,34,0.98), rgba(8,12,24,0.98))`,
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div style={{ fontWeight: 900, letterSpacing: 0.6, color: "#fff4bf" }}>SINGULARIDADE</div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {symbols.map((s) => (
            <button
              key={s}
              onClick={() => setSymbol(s)}
              style={{
                borderRadius: 10,
                border: s === symbol ? "1px solid rgba(255,220,110,0.42)" : `1px solid ${ui.border}`,
                background: s === symbol ? "rgba(255,213,79,0.14)" : "rgba(255,255,255,0.03)",
                color: s === symbol ? "#fff4bf" : "#bfd0ea",
                padding: "8px 10px",
                cursor: "pointer",
                fontWeight: 800,
                fontSize: 12,
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          {topModules.map((m) => (
            <button
              key={m}
              onClick={() => setActiveModule(m)}
              style={{
                borderRadius: 10,
                border: m === activeModule ? "1px solid rgba(94,231,255,0.38)" : `1px solid ${ui.border}`,
                background: m === activeModule ? "rgba(94,231,255,0.10)" : "rgba(255,255,255,0.03)",
                color: m === activeModule ? "#c7fbff" : "#bfd0ea",
                padding: "8px 10px",
                cursor: "pointer",
                fontWeight: 800,
                fontSize: 12,
              }}
            >
              {m}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              style={{
                borderRadius: 10,
                border: tf === timeframe ? `1px solid ${ui.cyan}` : `1px solid ${ui.border}`,
                background: tf === timeframe ? "rgba(0,212,255,0.12)" : "rgba(255,255,255,0.03)",
                color: tf === timeframe ? "#bff8ff" : "#bfd0ea",
                padding: "8px 10px",
                cursor: "pointer",
                fontWeight: 800,
                fontSize: 12,
              }}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: "calc(100vh - 64px)" }}>
        {activeModule === "Scanner" ? (
          <ScannerWorkspace symbol={symbol} timeframe={timeframe} />
        ) : activeModule === "Liquidez" ? (
          <PlaceholderModule title="Liquidez preservada nesta base simplificada" />
        ) : activeModule === "Mestre Scanner" ? (
          <PlaceholderModule title="Mestre Scanner" />
        ) : (
          <PlaceholderModule title={activeModule} />
        )}
      </div>
    </div>
  );
}
