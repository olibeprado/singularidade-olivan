"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  IChartApi,
  ISeriesApi,
  Time,
} from "lightweight-charts";
import {
  Activity,
  Bell,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  MousePointer2,
  TrendingUp,
  Minus,
  Waves,
  BrainCircuit,
  Layers3,
  Sigma,
  ScanSearch,
  Droplets,
} from "lucide-react";

type Timeframe = "1m" | "5m" | "15m" | "30m" | "1H" | "4H" | "1D";
type ModeKey = "auto" | "manual" | "space";
type InteractionMode = "navigate" | "objects";
type DrawingTool = "cursor" | "trendline" | "ray" | "hline" | "vline";

type CandleData = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type Point = {
  time: number;
  price: number;
};

type DrawObj =
  | {
      id: string;
      type: "trendline" | "ray";
      name: string;
      p1: Point;
      p2: Point;
      locked?: boolean;
      hidden?: boolean;
    }
  | {
      id: string;
      type: "hline";
      name: string;
      price: number;
      anchorTime: number;
      locked?: boolean;
      hidden?: boolean;
    }
  | {
      id: string;
      type: "vline";
      name: string;
      time: number;
      anchorPrice: number;
      locked?: boolean;
      hidden?: boolean;
    };

type Draft =
  | { type: "trendline" | "ray"; p1: Point; p2: Point | null }
  | null;

const TIMEFRAMES: Timeframe[] = ["1m", "5m", "15m", "30m", "1H", "4H", "1D"];
const NAV_TABS = ["Gráfico", "Ordens", "Posições", "IA Atlas", "Fluxo"];

const ui = {
  bg: "#060913",
  border: "#182235",
  text: "#ebf3ff",
  cyan: "#2de2ff",
  green: "#27f59d",
  yellow: "#f7c948",
  red: "#ff6b86",
};

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function formatCompact(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  return n.toFixed(2);
}

function generateCandles(count = 240, startPrice = 72000): CandleData[] {
  const now = Math.floor(Date.now() / 1000);
  const candles: CandleData[] = [];
  let prevClose = startPrice;

  for (let i = count; i > 0; i--) {
    const time = now - i * 300;
    const wave = Math.sin(i / 13) * 40 + Math.cos(i / 19) * 20;
    const drift = (Math.random() - 0.49) * 120 + wave;
    const open = prevClose;
    const close = Math.max(1000, open + drift);
    const high = Math.max(open, close) + Math.random() * 70;
    const low = Math.min(open, close) - Math.random() * 70;
    const volume = 120 + Math.random() * 1000;
    candles.push({ time, open, high, low, close, volume });
    prevClose = close;
  }
  return candles;
}

function computeSMA(candles: CandleData[], period: number) {
  return candles.map((c, i) => {
    if (i < period - 1) return { time: c.time, value: c.close };
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += candles[j].close;
    return { time: c.time, value: sum / period };
  });
}

function computeEMA(candles: CandleData[], period: number) {
  const k = 2 / (period + 1);
  const ema: { time: number; value: number }[] = [];
  let prev = candles[0]?.close ?? 0;
  for (let i = 0; i < candles.length; i++) {
    const close = candles[i].close;
    const value = i === 0 ? close : close * k + prev * (1 - k);
    ema.push({ time: candles[i].time, value });
    prev = value;
  }
  return ema;
}

function toolLabel(tool: DrawingTool) {
  switch (tool) {
    case "cursor":
      return "Cursor";
    case "trendline":
      return "Trend Line";
    case "ray":
      return "Ray";
    case "hline":
      return "Horizontal Line";
    case "vline":
      return "Vertical Line";
  }
}

function TopButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 31,
        padding: "0 11px",
        borderRadius: 10,
        border: active
          ? "1px solid rgba(247,201,72,0.34)"
          : "1px solid rgba(255,255,255,0.06)",
        background: active
          ? "linear-gradient(180deg, rgba(247,201,72,0.16), rgba(247,201,72,0.04))"
          : "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01))",
        color: active ? ui.yellow : "#dce8ff",
        fontSize: 12,
        fontWeight: 800,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function ModuleButton({
  icon,
  text,
  active,
}: {
  icon: React.ReactNode;
  text: string;
  active?: boolean;
}) {
  return (
    <button
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        height: 34,
        padding: "0 14px",
        borderRadius: 12,
        border: active
          ? "1px solid rgba(247,201,72,0.34)"
          : "1px solid rgba(255,255,255,0.06)",
        background: active
          ? "linear-gradient(180deg, rgba(247,201,72,0.16), rgba(247,201,72,0.04))"
          : "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01))",
        color: active ? "#ffe39a" : "#d9e8ff",
        fontSize: 12,
        fontWeight: 800,
        cursor: "pointer",
      }}
    >
      {icon}
      {text}
    </button>
  );
}

function StatCard({ title, value, valueColor }: { title: string; value: string; valueColor?: string }) {
  return (
    <div
      style={{
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.06)",
        background: "linear-gradient(180deg, rgba(8,15,31,0.98), rgba(7,12,24,0.96))",
        minHeight: 72,
        padding: "12px 14px",
      }}
    >
      <div
        style={{
          color: "#7f93b7",
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      <div style={{ color: valueColor || "#eef6ff", fontSize: 14, fontWeight: 900 }}>{value}</div>
    </div>
  );
}

function TopBar({
  symbol,
  price,
  change,
  timeframe,
  onTimeframeChange,
}: {
  symbol: string;
  price: number;
  change: number;
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
}) {
  const isPositive = change >= 0;

  return (
    <div
      style={{
        height: 64,
        padding: "0 14px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        borderBottom: `1px solid ${ui.border}`,
        background: "radial-gradient(circle at top, rgba(14,28,60,0.86), rgba(6,10,20,0.98) 55%)",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 8 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            background: "linear-gradient(135deg, rgba(42,231,255,0.22), rgba(119,77,255,0.28))",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Activity size={17} color="#e8f7ff" />
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ color: "#f6fbff", fontSize: 17, fontWeight: 900, letterSpacing: 0.3 }}>
            SINGULARIDADE
          </span>
          <span
            style={{
              color: "#2de2ff",
              fontSize: 10,
              fontWeight: 900,
              background: "rgba(45,226,255,0.1)",
              padding: "3px 6px",
              borderRadius: 999,
            }}
          >
            OBP
          </span>
        </div>
      </div>

      <div style={{ width: 1, height: 30, background: "rgba(255,255,255,0.08)" }} />

      <button
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          height: 36,
          padding: "0 12px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.07)",
          background: "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.012))",
          color: "#eef6ff",
          fontSize: 13,
          fontWeight: 800,
          cursor: "pointer",
        }}
      >
        <span style={{ color: ui.yellow }}>₿</span>
        {symbol}
        <ChevronDown size={13} color="#8295bb" />
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ color: "#f6fbff", fontSize: 13, fontFamily: "monospace", fontWeight: 900 }}>
          ${price.toLocaleString()}
        </span>
        <span
          style={{
            color: isPositive ? ui.green : ui.red,
            fontSize: 12,
            fontFamily: "monospace",
            fontWeight: 900,
          }}
        >
          {isPositive ? "+" : ""}
          {change.toFixed(2)}%
        </span>
      </div>

      <div style={{ width: 1, height: 30, background: "rgba(255,255,255,0.08)" }} />

      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {TIMEFRAMES.map((tf) => (
          <TopButton key={tf} active={timeframe === tf} onClick={() => onTimeframeChange(tf)}>
            {tf}
          </TopButton>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        {NAV_TABS.map((tab, i) => (
          <TopButton key={tab} active={i === 0}>
            {tab}
          </TopButton>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: 8 }}>
        <span style={{ color: ui.green, fontSize: 12, fontWeight: 900 }}>+1.88%</span>
        <Search size={15} color="#90a4c8" />
        <Bell size={15} color="#90a4c8" />
        <Settings size={15} color="#90a4c8" />
      </div>
    </div>
  );
}

function ModuleStrip() {
  return (
    <div
      style={{
        height: 50,
        padding: "0 16px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        borderBottom: `1px solid ${ui.border}`,
        background: "linear-gradient(180deg, rgba(8,12,23,0.98), rgba(7,11,20,0.98))",
        flexShrink: 0,
      }}
    >
      <ModuleButton icon={<Waves size={13} />} text="Fluxo" />
      <ModuleButton icon={<BrainCircuit size={13} />} text="Singularidade" />
      <ModuleButton icon={<Activity size={13} />} text="IA Atlas" />
      <ModuleButton icon={<ScanSearch size={13} />} text="Scanner" active />
      <ModuleButton icon={<Layers3 size={13} />} text="Estrutura" />
      <ModuleButton icon={<Sigma size={13} />} text="Euler" />
      <ModuleButton icon={<Droplets size={13} />} text="Liquidez" />
    </div>
  );
}

function LeftToolbar({
  currentTool,
  setCurrentTool,
}: {
  currentTool: DrawingTool;
  setCurrentTool: (v: DrawingTool) => void;
}) {
  const [collapsed, setCollapsed] = useState(true);

  const tools: { key: DrawingTool; label: string }[] = [
    { key: "cursor", label: "Cursor" },
    { key: "trendline", label: "Trend Line" },
    { key: "ray", label: "Ray" },
    { key: "hline", label: "Horizontal Line" },
    { key: "vline", label: "Vertical Line" },
  ];

  return (
    <div
      style={{
        width: collapsed ? 56 : 230,
        borderRight: `1px solid ${ui.border}`,
        background: "linear-gradient(180deg, rgba(8,12,24,0.98), rgba(6,9,17,0.98))",
        display: "flex",
        flexShrink: 0,
        transition: "width 160ms ease",
      }}
    >
      <div
        style={{
          width: 56,
          borderRight: collapsed ? "none" : "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "10px 0",
          gap: 8,
        }}
      >
        {tools.map((tool) => {
          const active = currentTool === tool.key;
          const icon =
            tool.key === "cursor" ? (
              <MousePointer2 size={16} />
            ) : tool.key === "trendline" ? (
              <TrendingUp size={16} />
            ) : tool.key === "ray" ? (
              <Minus size={16} />
            ) : tool.key === "hline" ? (
              <Minus size={16} />
            ) : (
              <Minus size={16} style={{ transform: "rotate(90deg)" }} />
            );

          return (
            <button
              key={tool.key}
              title={tool.label}
              onClick={() => setCurrentTool(tool.key)}
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                border: active
                  ? "1px solid rgba(45,226,255,0.22)"
                  : "1px solid rgba(255,255,255,0.04)",
                background: active
                  ? "linear-gradient(180deg, rgba(45,226,255,0.12), rgba(45,226,255,0.04))"
                  : "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.01))",
                color: active ? ui.cyan : "#95a8cb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              {icon}
            </button>
          );
        })}

        <button
          onClick={() => setCollapsed((v) => !v)}
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(255,255,255,0.02)",
            color: "#95a8cb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            marginTop: 6,
          }}
        >
          {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
        </button>

        <div style={{ flex: 1 }} />

        <button
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(255,255,255,0.02)",
            color: "#95a8cb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <Settings size={15} />
        </button>
      </div>

      {!collapsed ? (
        <div
          style={{
            width: 174,
            display: "flex",
            flexDirection: "column",
            background: "linear-gradient(180deg, rgba(16,22,36,0.98), rgba(12,17,28,0.98))",
          }}
        >
          <div
            style={{
              height: 42,
              padding: "0 12px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: "#ecf4ff",
              fontSize: 12,
              fontWeight: 900,
            }}
          >
            <span>Linhas de Tendência</span>
            <ChevronRight size={13} color="#7f93b7" />
          </div>

          <div style={{ padding: "8px 0", overflowY: "auto", flex: 1 }}>
            {tools.map((tool) => (
              <button
                key={tool.key}
                onClick={() => setCurrentTool(tool.key)}
                style={{
                  width: "100%",
                  height: 32,
                  padding: "0 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  border: "none",
                  background: currentTool === tool.key ? "rgba(45,226,255,0.08)" : "transparent",
                  color: currentTool === tool.key ? "#e9f7ff" : "#aebedc",
                  fontSize: 12,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <span style={{ color: currentTool === tool.key ? ui.cyan : "#7e90b4" }}>—</span>
                <span>{tool.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function pointToSegmentDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.hypot(px - x1, py - y1);
  const t = clamp(((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy), 0, 1);
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}

function ChartPanel({
  candles,
  drawings,
  selectedId,
  setSelectedId,
  currentTool,
  setCurrentTool,
  interactionMode,
  setInteractionMode,
  mode,
  onAdd,
  onUpdate,
  onDeleteSelected,
  onClearAll,
}: {
  candles: CandleData[];
  drawings: DrawObj[];
  selectedId: string | null;
  setSelectedId: (v: string | null) => void;
  currentTool: DrawingTool;
  setCurrentTool: (v: DrawingTool) => void;
  interactionMode: InteractionMode;
  setInteractionMode: (v: InteractionMode) => void;
  mode: ModeKey;
  onAdd: (obj: DrawObj) => void;
  onUpdate: (id: string, update: Partial<DrawObj>) => void;
  onDeleteSelected: () => void;
  onClearAll: () => void;
}) {
  const mainRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [renderTick, setRenderTick] = useState(0);
  const [livePrice, setLivePrice] = useState<number>(candles[candles.length - 1]?.close ?? 0);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [draft, setDraft] = useState<Draft>(null);

  const dragRef = useRef<
    | { type: "move-body"; id: string; start: Point; original: DrawObj }
    | { type: "move-handle"; id: string; handle: "p1" | "p2" | "anchor" }
    | null
  >(null);

  useEffect(() => {
    if (!mainRef.current) return;

    const mc = createChart(mainRef.current, {
      width: mainRef.current.clientWidth,
      height: mainRef.current.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#7085ad",
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.035)", style: 1 as const },
        horzLines: { color: "rgba(255,255,255,0.035)", style: 1 as const },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.08)" },
      timeScale: {
        borderColor: "rgba(255,255,255,0.08)",
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    });

    const cSeries = mc.addCandlestickSeries({
      upColor: "#37f4ad",
      downColor: "#ff6c8d",
      borderUpColor: "#37f4ad",
      borderDownColor: "#ff6c8d",
      wickUpColor: "#37f4ad",
      wickDownColor: "#ff6c8d",
    });

    chartRef.current = mc;
    candleSeriesRef.current = cSeries;

    cSeries.setData(
      candles.map((c) => ({
        time: c.time as Time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );

    const ma20 = mc.addLineSeries({
      color: "#d2b000",
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    ma20.setData(computeSMA(candles, 20).map((d) => ({ time: d.time as Time, value: d.value })));

    const ma50 = mc.addLineSeries({
      color: "#bd742a",
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    ma50.setData(computeSMA(candles, 50).map((d) => ({ time: d.time as Time, value: d.value })));

    const ema9 = mc.addLineSeries({
      color: "#50dfff",
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    ema9.setData(computeEMA(candles, 9).map((d) => ({ time: d.time as Time, value: d.value })));

    mc.timeScale().fitContent();

    const last = candles[candles.length - 1];
    const prev = candles[candles.length - 2] ?? last;
    setLivePrice(last.close);
    setPriceChange(((last.close - prev.close) / prev.close) * 100);

    const resize = () => {
      if (mainRef.current) {
        mc.applyOptions({ width: mainRef.current.clientWidth, height: mainRef.current.clientHeight });
      }
      setRenderTick((v) => v + 1);
    };

    mc.timeScale().subscribeVisibleLogicalRangeChange(() => setRenderTick((v) => v + 1));
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      chartRef.current = null;
      candleSeriesRef.current = null;
      mc.remove();
    };
  }, [candles]);

  const toScreen = (p: Point) => {
    const chart = chartRef.current;
    const series = candleSeriesRef.current;
    if (!chart || !series) return null;
    const x = chart.timeScale().timeToCoordinate(p.time as Time);
    const y = series.priceToCoordinate(p.price);
    if (x == null || y == null) return null;
    return { x: Number(x), y: Number(y) };
  };

  const fromEventToWorld = (clientX: number, clientY: number): Point | null => {
    const chart = chartRef.current;
    const series = candleSeriesRef.current;
    const rect = mainRef.current?.getBoundingClientRect();
    if (!chart || !series || !rect) return null;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const time = chart.timeScale().coordinateToTime(x);
    const price = series.coordinateToPrice(y);
    if (typeof time !== "number" || price == null) return null;
    return { time, price };
  };

  const hitTest = (clientX: number, clientY: number) => {
    const rect = mainRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    for (let i = drawings.length - 1; i >= 0; i--) {
      const obj = drawings[i];
      if (obj.hidden) continue;

      if (obj.type === "trendline" || obj.type === "ray") {
        const p1 = toScreen(obj.p1);
        const p2 = toScreen(obj.p2);
        if (!p1 || !p2) continue;

        const d1 = Math.hypot(x - p1.x, y - p1.y);
        const d2 = Math.hypot(x - p2.x, y - p2.y);
        if (d1 <= 10) return { kind: "handle" as const, id: obj.id, handle: "p1" as const };
        if (d2 <= 10) return { kind: "handle" as const, id: obj.id, handle: "p2" as const };

        let x2 = p2.x;
        let y2 = p2.y;

        if (obj.type === "ray") {
          const width = rect.width;
          const dx = p2.x - p1.x || 0.0001;
          const dy = p2.y - p1.y;
          const factor = (width - p1.x) / dx;
          x2 = width;
          y2 = p1.y + dy * factor;
        }

        if (pointToSegmentDistance(x, y, p1.x, p1.y, x2, y2) <= 8) {
          return { kind: "body" as const, id: obj.id };
        }
      }

      if (obj.type === "hline") {
        const p = toScreen({ time: obj.anchorTime, price: obj.price });
        if (!p) continue;
        if (Math.abs(y - p.y) <= 8) return { kind: "body" as const, id: obj.id };
      }

      if (obj.type === "vline") {
        const p = toScreen({ time: obj.time, price: obj.anchorPrice });
        if (!p) continue;
        if (Math.abs(x - p.x) <= 8) return { kind: "body" as const, id: obj.id };
      }
    }

    return null;
  };

  const cancelDraft = () => setDraft(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const world = fromEventToWorld(e.clientX, e.clientY);
    if (!world) return;

    if (currentTool !== "cursor") {
      if (currentTool === "trendline" || currentTool === "ray") {
        if (!draft || draft.type !== currentTool) {
          setDraft({ type: currentTool, p1: world, p2: world });
        } else {
          const obj: DrawObj = {
            id: `${currentTool}-${Date.now()}`,
            type: currentTool,
            name: `${toolLabel(currentTool)} ${drawings.length + 1}`,
            p1: draft.p1,
            p2: world,
            locked: false,
            hidden: false,
          };
          onAdd(obj);
          setSelectedId(obj.id);
          setDraft(null);
          setCurrentTool("cursor");
          setInteractionMode("objects");
        }
        return;
      }

      if (currentTool === "hline") {
        const obj: DrawObj = {
          id: `hline-${Date.now()}`,
          type: "hline",
          name: `Horizontal Line ${drawings.length + 1}`,
          price: world.price,
          anchorTime: world.time,
          locked: false,
          hidden: false,
        };
        onAdd(obj);
        setSelectedId(obj.id);
        setCurrentTool("cursor");
        setInteractionMode("objects");
        return;
      }

      if (currentTool === "vline") {
        const obj: DrawObj = {
          id: `vline-${Date.now()}`,
          type: "vline",
          name: `Vertical Line ${drawings.length + 1}`,
          time: world.time,
          anchorPrice: world.price,
          locked: false,
          hidden: false,
        };
        onAdd(obj);
        setSelectedId(obj.id);
        setCurrentTool("cursor");
        setInteractionMode("objects");
        return;
      }
    }

    const hit = hitTest(e.clientX, e.clientY);
    if (!hit) {
      setSelectedId(null);
      return;
    }

    const obj = drawings.find((d) => d.id === hit.id);
    if (!obj) return;

    setSelectedId(obj.id);
    if (obj.locked) return;

    dragRef.current = {
      type: "move-body",
      id: obj.id,
      start: world,
      original: JSON.parse(JSON.stringify(obj)) as DrawObj,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const world = fromEventToWorld(e.clientX, e.clientY);
    if (!world) return;

    if (draft && draft.p2) {
      setDraft({ ...draft, p2: world });
      return;
    }

    const drag = dragRef.current;
    if (!drag) return;

    const original = drag.original;
    const dt = world.time - drag.start.time;
    const dp = world.price - drag.start.price;

    if (original.type === "trendline" || original.type === "ray") {
      onUpdate(original.id, {
        p1: { time: original.p1.time + dt, price: original.p1.price + dp },
        p2: { time: original.p2.time + dt, price: original.p2.price + dp },
      });
    } else if (original.type === "hline") {
      onUpdate(original.id, {
        price: original.price + dp,
        anchorTime: original.anchorTime + dt,
      });
    } else if (original.type === "vline") {
      onUpdate(original.id, {
        time: original.time + dt,
        anchorPrice: original.anchorPrice + dp,
      });
    }
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  const selectedObject = drawings.find((d) => d.id === selectedId) ?? null;
  const isPositive = priceChange >= 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "linear-gradient(180deg, rgba(7,12,24,0.98), rgba(6,10,18,0.98))",
      }}
    >
      <div
        style={{
          padding: "10px 12px",
          borderBottom: `1px solid ${ui.border}`,
          background: "linear-gradient(180deg, rgba(12,19,36,0.94), rgba(8,13,25,0.94))",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.6fr repeat(4, 1fr) auto",
            gap: 10,
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 8,
                background: "rgba(247,201,72,0.16)",
                color: ui.yellow,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 900,
              }}
            >
              SC
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: "#eef6ff", fontSize: 16, fontWeight: 900, lineHeight: 1.15 }}>BTCUSDT</div>
              <div style={{ color: "#7d91b6", fontSize: 11, fontWeight: 700 }}>
                Scanner Atlas • Ferramenta: {toolLabel(currentTool)} • TF: 15m
              </div>
            </div>
          </div>

          <StatCard
            title="Preço"
            value={livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            valueColor="#4ef0cb"
          />
          <StatCard
            title="Variação"
            value={`${isPositive ? "+" : ""}${priceChange.toFixed(2)}%`}
            valueColor={isPositive ? ui.green : ui.red}
          />
          <StatCard
            title="Volume"
            value={formatCompact(candles[candles.length - 1]?.volume ?? 0)}
            valueColor="#51e6ff"
          />
          <StatCard title="Desenhos" value={String(drawings.length)} valueColor={drawings.length ? ui.yellow : ui.red} />

          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
            <TopButton active={mode === "auto"}>Auto</TopButton>
            <TopButton active={mode === "manual"}>Manual</TopButton>
            <TopButton active={mode === "space"}>Seguir + Espaço</TopButton>
            <TopButton>Zoom -</TopButton>
            <TopButton>Zoom +</TopButton>
            <TopButton>Agora</TopButton>
            <TopButton>Reset</TopButton>
          </div>
        </div>
      </div>

      <div
        style={{
          minHeight: 56,
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${ui.border}`,
          background: "rgba(255,255,255,0.015)",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <TopButton
            active={interactionMode === "navigate"}
            onClick={() => {
              setInteractionMode("navigate");
              setCurrentTool("cursor");
              cancelDraft();
            }}
          >
            Navegar
          </TopButton>

          <TopButton
            active={interactionMode === "objects"}
            onClick={() => {
              setInteractionMode("objects");
              setCurrentTool("cursor");
              cancelDraft();
            }}
          >
            Objetos
          </TopButton>

          {(["trendline", "ray", "hline", "vline"] as DrawingTool[]).map((tool) => (
            <TopButton
              key={tool}
              active={currentTool === tool}
              onClick={() => {
                setCurrentTool(tool);
                setInteractionMode("objects");
              }}
            >
              {toolLabel(tool)}
            </TopButton>
          ))}

          {draft ? <TopButton onClick={cancelDraft}>Cancelar</TopButton> : null}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <TopButton onClick={onClearAll}>Limpar desenhos</TopButton>
          <TopButton onClick={onDeleteSelected}>Apagar selecionado</TopButton>
        </div>

        <div style={{ color: "#7f93b7", fontSize: 11, fontWeight: 800, marginLeft: "auto" }}>
          {draft
            ? `Modo desenho: ${toolLabel(draft.type)} • clique para finalizar`
            : interactionMode === "navigate"
            ? "Gráfico livre para pan/zoom"
            : selectedObject
            ? `${selectedObject.name} • livre`
            : "Nenhum objeto selecionado"}
        </div>
      </div>

      <div style={{ position: "relative", flex: 1, minHeight: 0, width: "100%" }}>
        <div ref={mainRef} style={{ position: "absolute", inset: 0 }} />

        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onDoubleClick={cancelDraft}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 5,
            cursor: currentTool === "cursor" ? (interactionMode === "navigate" ? "default" : "grab") : "crosshair",
            pointerEvents: currentTool === "cursor" && interactionMode === "navigate" ? "none" : "auto",
          }}
        >
          <svg width="100%" height="100%" style={{ overflow: "visible" }}>
            {drawings.map((obj) => {
              if (obj.hidden) return null;
              const isSelected = obj.id === selectedId;

              if (obj.type === "trendline" || obj.type === "ray") {
                const p1 = toScreen(obj.p1);
                const p2 = toScreen(obj.p2);
                if (!p1 || !p2) return null;

                let x2 = p2.x;
                let y2 = p2.y;

                if (obj.type === "ray") {
                  const rect = mainRef.current?.getBoundingClientRect();
                  const width = rect?.width ?? 0;
                  const dx = p2.x - p1.x || 0.0001;
                  const dy = p2.y - p1.y;
                  const factor = (width - p1.x) / dx;
                  x2 = width;
                  y2 = p1.y + dy * factor;
                }

                return (
                  <g key={`${obj.id}-${renderTick}`}>
                    <line
                      x1={p1.x}
                      y1={p1.y}
                      x2={x2}
                      y2={y2}
                      stroke={isSelected ? "#ffd95c" : "#2de2ff"}
                      strokeWidth={isSelected ? 2.6 : 2}
                    />
                    {isSelected ? (
                      <>
                        <circle cx={p1.x} cy={p1.y} r={5} fill="#ffd95c" stroke="#06101d" strokeWidth={2} />
                        <circle cx={p2.x} cy={p2.y} r={5} fill="#ffd95c" stroke="#06101d" strokeWidth={2} />
                      </>
                    ) : null}
                  </g>
                );
              }

              if (obj.type === "hline") {
                const p = toScreen({ time: obj.anchorTime, price: obj.price });
                if (!p) return null;
                return (
                  <line
                    key={`${obj.id}-${renderTick}`}
                    x1={0}
                    y1={p.y}
                    x2="100%"
                    y2={p.y}
                    stroke={isSelected ? "#ffd95c" : "#2de2ff"}
                    strokeWidth={isSelected ? 2.6 : 2}
                    strokeDasharray="6 4"
                  />
                );
              }

              if (obj.type === "vline") {
                const p = toScreen({ time: obj.time, price: obj.anchorPrice });
                if (!p) return null;
                return (
                  <line
                    key={`${obj.id}-${renderTick}`}
                    x1={p.x}
                    y1={0}
                    x2={p.x}
                    y2="100%"
                    stroke={isSelected ? "#ffd95c" : "#2de2ff"}
                    strokeWidth={isSelected ? 2.6 : 2}
                    strokeDasharray="6 4"
                  />
                );
              }

              return null;
            })}

            {draft && draft.p2 ? (() => {
              const p1 = toScreen(draft.p1);
              const p2 = toScreen(draft.p2);
              if (!p1 || !p2) return null;
              return (
                <g>
                  <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#ffd95c" strokeWidth={2} strokeDasharray="6 5" />
                  <circle cx={p1.x} cy={p1.y} r={4} fill="#ffd95c" />
                  <circle cx={p2.x} cy={p2.y} r={4} fill="#ffd95c" />
                </g>
              );
            })() : null}
          </svg>
        </div>
      </div>
    </div>
  );
}

export default function AtlasChartPro2() {
  const [timeframe, setTimeframe] = useState<Timeframe>("15m");
  const [mode] = useState<ModeKey>("auto");
  const [interactionMode, setInteractionMode] = useState<InteractionMode>("navigate");
  const [currentTool, setCurrentTool] = useState<DrawingTool>("cursor");
  const [drawings, setDrawings] = useState<DrawObj[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const candles = useMemo(() => generateCandles(240, 72000), []);
  const lastCandle = candles[candles.length - 1];
  const firstCandle = candles[0];
  const priceChange = ((lastCandle.close - firstCandle.close) / firstCandle.close) * 100;

  const addObject = (obj: DrawObj) => setDrawings((prev) => [...prev, obj]);
  const updateObject = (id: string, update: Partial<DrawObj>) =>
    setDrawings((prev) => prev.map((obj) => (obj.id === id ? ({ ...obj, ...update } as DrawObj) : obj)));
  const deleteSelected = () => {
    if (!selectedId) return;
    setDrawings((prev) => prev.filter((obj) => obj.id !== selectedId));
    setSelectedId(null);
  };
  const clearAll = () => {
    setDrawings([]);
    setSelectedId(null);
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: ui.bg,
        color: ui.text,
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      <TopBar symbol="BTCUSDT" price={lastCandle.close} change={priceChange} timeframe={timeframe} onTimeframeChange={setTimeframe} />
      <ModuleStrip />

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <LeftToolbar currentTool={currentTool} setCurrentTool={setCurrentTool} />

        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, minHeight: 0 }}>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ChartPanel
              candles={candles}
              drawings={drawings}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              currentTool={currentTool}
              setCurrentTool={setCurrentTool}
              interactionMode={interactionMode}
              setInteractionMode={setInteractionMode}
              mode={mode}
              onAdd={addObject}
              onUpdate={updateObject}
              onDeleteSelected={deleteSelected}
              onClearAll={clearAll}
            />
          </div>
        </div>

        <div
          style={{
            width: 210,
            flexShrink: 0,
            borderLeft: `1px solid ${ui.border}`,
            background: "linear-gradient(180deg, rgba(7,11,20,0.98), rgba(4,7,14,0.98))",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: `1px solid ${ui.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ color: "#e8f1ff", fontSize: 12, fontWeight: 800, letterSpacing: 0.45 }}>Chat / IA Atlas</span>
            <ChevronDown size={14} color="#6c7da2" />
          </div>
        </div>
      </div>
    </div>
  );
}
