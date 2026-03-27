"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  IChartApi,
  ISeriesApi,
  Time,
} from "lightweight-charts";
import { X, Lock, Eye, EyeOff, Trash2, Eraser } from "lucide-react";

// ---------- TIPOS ----------
type Timeframe = "1m" | "5m" | "15m" | "30m" | "1H" | "4H" | "1D";
type DrawingTool = "cursor" | "trendline" | "ray" | "hline" | "vline";

type CandleData = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type TrendPoint = { time: number; price: number };

type BaseObject = { id: string; name: string; locked?: boolean; hidden?: boolean };
type TrendLineObject = BaseObject & { type: "trendline"; p1: TrendPoint; p2: TrendPoint };
type RayObject = BaseObject & { type: "ray"; p1: TrendPoint; p2: TrendPoint };
type HLineObject = BaseObject & { type: "hline"; price: number; anchorTime: number };
type VLineObject = BaseObject & { type: "vline"; time: number; anchorPrice: number };
type DrawingObject = TrendLineObject | RayObject | HLineObject | VLineObject;
type Draft = { type: "trendline" | "ray"; p1: TrendPoint; p2: TrendPoint | null } | null;

// ---------- UTILITÁRIOS ----------
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

function generateCandles(count = 240, startPrice = 74500): CandleData[] {
  const now = Math.floor(Date.now() / 1000);
  const candles: CandleData[] = [];
  let prevClose = startPrice;
  for (let i = count; i > 0; i--) {
    const time = now - i * 300;
    const wave = Math.sin(i / 11) * 35 + Math.cos(i / 17) * 18;
    const drift = (Math.random() - 0.49) * 130 + wave;
    const open = prevClose;
    const close = Math.max(1000, open + drift);
    const high = Math.max(open, close) + Math.random() * 75;
    const low = Math.min(open, close) - Math.random() * 75;
    const volume = 120 + Math.random() * 1400;
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

function pointToSegmentDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.hypot(px - x1, py - y1);
  const t = clamp(((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy), 0, 1);
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}

// ---------- COMPONENTE PRINCIPAL ----------
export default function ChartWithTools() {
  // Estado
  const [candles] = useState(() => generateCandles(240, 70200));
  const [drawings, setDrawings] = useState<DrawingObject[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentTool, setCurrentTool] = useState<DrawingTool>("cursor");
  const [draft, setDraft] = useState<Draft>(null);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const volContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volChartRef = useRef<IChartApi | null>(null);
  const [renderTick, setRenderTick] = useState(0);
  const [livePrice, setLivePrice] = useState<number>(candles[candles.length - 1]?.close ?? 0);
  const [priceChange, setPriceChange] = useState<number>(0);

  const dragRef = useRef<
    | { type: "move-body"; objectId: string; startWorld: TrendPoint; original: DrawingObject }
    | { type: "move-handle"; objectId: string; handle: "p1" | "p2" | "anchor" }
    | null
  >(null);

  // Função para criar gráficos (chamada apenas uma vez)
  const initCharts = () => {
    if (!chartContainerRef.current || !volContainerRef.current) return;
    if (chartRef.current) return; // já criado

    const baseChartOpts = {
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
    };

    const mc = createChart(chartContainerRef.current, {
      ...baseChartOpts,
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });
    chartRef.current = mc;

    const cSeries = mc.addCandlestickSeries({
      upColor: "#37f4ad",
      downColor: "#ff6c8d",
      borderUpColor: "#37f4ad",
      borderDownColor: "#ff6c8d",
      wickUpColor: "#37f4ad",
      wickDownColor: "#ff6c8d",
    });
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

    // Médias
    const ma20 = mc.addLineSeries({ color: "#d2b000", lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
    ma20.setData(computeSMA(candles, 20).map((d) => ({ time: d.time as Time, value: d.value })));

    const ma50 = mc.addLineSeries({ color: "#bd742a", lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
    ma50.setData(computeSMA(candles, 50).map((d) => ({ time: d.time as Time, value: d.value })));

    const ema9 = mc.addLineSeries({ color: "#50dfff", lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
    ema9.setData(computeEMA(candles, 9).map((d) => ({ time: d.time as Time, value: d.value })));

    mc.timeScale().fitContent();

    const last = candles[candles.length - 1];
    const prev = candles[candles.length - 2] ?? last;
    setLivePrice(last.close);
    setPriceChange(((last.close - prev.close) / prev.close) * 100);

    // Volume chart
    const vc = createChart(volContainerRef.current, {
      ...baseChartOpts,
      width: volContainerRef.current.clientWidth,
      height: volContainerRef.current.clientHeight,
    });
    volChartRef.current = vc;

    const volSeries = vc.addHistogramSeries({ priceScaleId: "right" });
    volSeries.setData(
      candles.map((c) => ({
        time: c.time as Time,
        value: c.volume,
        color: c.close >= c.open ? "rgba(55,244,173,0.45)" : "rgba(255,108,141,0.45)",
      }))
    );
    vc.timeScale().fitContent();

    const syncFn = () => setRenderTick((v) => v + 1);
    mc.timeScale().subscribeVisibleLogicalRangeChange(syncFn);

    // Observador de redimensionamento
    const resizeObserver = new ResizeObserver(() => {
      if (chartContainerRef.current) {
        mc.applyOptions({ width: chartContainerRef.current.clientWidth, height: chartContainerRef.current.clientHeight });
      }
      if (volContainerRef.current) {
        vc.applyOptions({ width: volContainerRef.current.clientWidth, height: volContainerRef.current.clientHeight });
      }
      setRenderTick((v) => v + 1);
    });

    resizeObserver.observe(chartContainerRef.current);
    resizeObserver.observe(volContainerRef.current);

    // Cleanup na desmontagem
    return () => {
      resizeObserver.disconnect();
      mc.remove();
      vc.remove();
    };
  };

  // Usar useLayoutEffect para garantir que o DOM esteja pronto e o gráfico seja criado
  useLayoutEffect(() => {
    const cleanup = initCharts();
    return () => {
      if (cleanup) cleanup();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volChartRef.current = null;
    };
  }, [candles]);

  // Funções auxiliares de coordenadas
  const toScreenPoint = (point: TrendPoint) => {
    const chart = chartRef.current;
    const series = candleSeriesRef.current;
    if (!chart || !series) return null;
    const x = chart.timeScale().timeToCoordinate(point.time as Time);
    const y = series.priceToCoordinate(point.price);
    if (x == null || y == null) return null;
    return { x: Number(x), y: Number(y) };
  };

  const fromEventToWorld = (clientX: number, clientY: number): TrendPoint | null => {
    const chart = chartRef.current;
    const series = candleSeriesRef.current;
    const rect = chartContainerRef.current?.getBoundingClientRect();
    if (!chart || !series || !rect) return null;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const time = chart.timeScale().coordinateToTime(x);
    const price = series.coordinateToPrice(y);
    if (typeof time !== "number" || price == null) return null;
    return { time, price };
  };

  // Criação de objeto
  const createObject = (tool: DrawingTool, p1: TrendPoint, p2?: TrendPoint): DrawingObject | null => {
    const id = `${tool}-${Date.now()}`;
    switch (tool) {
      case "trendline":
        return p2 ? { id, name: `Trend Line ${drawings.length + 1}`, type: "trendline", p1, p2, locked: false, hidden: false } : null;
      case "ray":
        return p2 ? { id, name: `Ray ${drawings.length + 1}`, type: "ray", p1, p2, locked: false, hidden: false } : null;
      case "hline":
        return { id, name: `Horizontal Line ${drawings.length + 1}`, type: "hline", price: p1.price, anchorTime: p1.time, locked: false, hidden: false };
      case "vline":
        return { id, name: `Vertical Line ${drawings.length + 1}`, type: "vline", time: p1.time, anchorPrice: p1.price, locked: false, hidden: false };
      default:
        return null;
    }
  };

  // Hit test
  const hitTest = (clientX: number, clientY: number) => {
    const rect = chartContainerRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    for (let i = drawings.length - 1; i >= 0; i--) {
      const obj = drawings[i];
      if (obj.hidden) continue;

      if (obj.type === "trendline" || obj.type === "ray") {
        const p1 = toScreenPoint(obj.p1);
        const p2 = toScreenPoint(obj.p2);
        if (!p1 || !p2) continue;
        const d1 = Math.hypot(x - p1.x, y - p1.y);
        const d2 = Math.hypot(x - p2.x, y - p2.y);
        if (d1 <= 10) return { kind: "handle" as const, objectId: obj.id, handle: "p1" as const };
        if (d2 <= 10) return { kind: "handle" as const, objectId: obj.id, handle: "p2" as const };

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
          return { kind: "body" as const, objectId: obj.id };
        }
      }

      if (obj.type === "hline") {
        const p = toScreenPoint({ time: obj.anchorTime, price: obj.price });
        if (!p) continue;
        if (Math.abs(y - p.y) <= 8) {
          if (Math.hypot(x - 52, y - p.y) <= 12) return { kind: "handle" as const, objectId: obj.id, handle: "anchor" as const };
          return { kind: "body" as const, objectId: obj.id };
        }
      }

      if (obj.type === "vline") {
        const p = toScreenPoint({ time: obj.time, price: obj.anchorPrice });
        if (!p) continue;
        if (Math.abs(x - p.x) <= 8) {
          if (Math.hypot(x - p.x, y - 40) <= 12) return { kind: "handle" as const, objectId: obj.id, handle: "anchor" as const };
          return { kind: "body" as const, objectId: obj.id };
        }
      }
    }
    return null;
  };

  // Manipuladores de eventos
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const world = fromEventToWorld(e.clientX, e.clientY);
    if (!world) return;

    if (currentTool !== "cursor") {
      if (currentTool === "trendline" || currentTool === "ray") {
        if (!draft || draft.type !== currentTool) {
          setDraft({ type: currentTool, p1: world, p2: world });
        } else {
          const obj = createObject(currentTool, draft.p1, world);
          if (obj) {
            setDrawings((prev) => [...prev, obj]);
            setSelectedId(obj.id);
          }
          setDraft(null);
          setCurrentTool("cursor");
        }
        return;
      }

      if (currentTool === "hline" || currentTool === "vline") {
        const obj = createObject(currentTool, world);
        if (obj) {
          setDrawings((prev) => [...prev, obj]);
          setSelectedId(obj.id);
        }
        setCurrentTool("cursor");
        return;
      }
    }

    const hit = hitTest(e.clientX, e.clientY);
    if (!hit) {
      setSelectedId(null);
      return;
    }

    const obj = drawings.find((d) => d.id === hit.objectId);
    if (!obj) return;
    setSelectedId(obj.id);
    if (obj.locked) return;

    if (hit.kind === "handle") {
      dragRef.current = { type: "move-handle", objectId: obj.id, handle: hit.handle };
      return;
    }

    dragRef.current = {
      type: "move-body",
      objectId: obj.id,
      startWorld: world,
      original: JSON.parse(JSON.stringify(obj)) as DrawingObject,
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

    if (drag.type === "move-handle") {
      const obj = drawings.find((d) => d.id === drag.objectId);
      if (!obj) return;

      if ((obj.type === "trendline" || obj.type === "ray") && (drag.handle === "p1" || drag.handle === "p2")) {
        setDrawings((prev) =>
          prev.map((d) =>
            d.id === drag.objectId ? { ...d, [drag.handle === "p1" ? "p1" : "p2"]: world } : d
          ) as DrawingObject[]
        );
      } else if (obj.type === "hline" && drag.handle === "anchor") {
        setDrawings((prev) =>
          prev.map((d) => (d.id === drag.objectId ? { ...d, price: world.price, anchorTime: world.time } : d)) as DrawingObject[]
        );
      } else if (obj.type === "vline" && drag.handle === "anchor") {
        setDrawings((prev) =>
          prev.map((d) => (d.id === drag.objectId ? { ...d, time: world.time, anchorPrice: world.price } : d)) as DrawingObject[]
        );
      }
      return;
    }

    const dt = world.time - drag.startWorld.time;
    const dp = world.price - drag.startWorld.price;
    const original = drag.original;

    if (original.type === "trendline" || original.type === "ray") {
      setDrawings((prev) =>
        prev.map((d) =>
          d.id === original.id
            ? {
                ...d,
                p1: { time: original.p1.time + dt, price: original.p1.price + dp },
                p2: { time: original.p2.time + dt, price: original.p2.price + dp },
              }
            : d
        ) as DrawingObject[]
      );
    } else if (original.type === "hline") {
      setDrawings((prev) =>
        prev.map((d) =>
          d.id === original.id
            ? { ...d, price: original.price + dp, anchorTime: original.anchorTime + dt }
            : d
        ) as DrawingObject[]
      );
    } else if (original.type === "vline") {
      setDrawings((prev) =>
        prev.map((d) =>
          d.id === original.id
            ? { ...d, time: original.time + dt, anchorPrice: original.anchorPrice + dp }
            : d
        ) as DrawingObject[]
      );
    }
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  const cancelDraft = () => setDraft(null);

  // Ações
  const deleteSelected = () => {
    if (!selectedId) return;
    setDrawings((prev) => prev.filter((d) => d.id !== selectedId));
    setSelectedId(null);
  };

  const clearAll = () => {
    setDrawings([]);
    setSelectedId(null);
  };

  const toggleLocked = () => {
    if (!selectedId) return;
    setDrawings((prev) =>
      prev.map((d) => (d.id === selectedId ? { ...d, locked: !d.locked } : d)) as DrawingObject[]
    );
  };

  const toggleHidden = () => {
    if (!selectedId) return;
    setDrawings((prev) =>
      prev.map((d) => (d.id === selectedId ? { ...d, hidden: !d.hidden } : d)) as DrawingObject[]
    );
  };

  // Teclas
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Delete") deleteSelected();
      if (e.key === "Escape") {
        cancelDraft();
        setSelectedId(null);
        dragRef.current = null;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [deleteSelected]);

  const selectedObject = drawings.find((d) => d.id === selectedId) ?? null;
  const isPositive = priceChange >= 0;

  return (
    <div
      ref={containerRef}
      style={{
        height: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: ui.bg,
        color: ui.text,
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      {/* Cabeçalho com estatísticas */}
      <div
        style={{
          padding: "10px 12px",
          borderBottom: `1px solid ${ui.border}`,
          background: "linear-gradient(180deg, rgba(12,19,36,0.94), rgba(8,13,25,0.94))",
          flexShrink: 0,
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
              <div style={{ color: "#eef6ff", fontSize: 16, fontWeight: 900, lineHeight: 1.15 }}>
                BTCUSDT
              </div>
              <div style={{ color: "#7d91b6", fontSize: 11, fontWeight: 700 }}>
                Scanner Atlas • Ferramenta: {currentTool.toUpperCase()} • TF: 15m
              </div>
            </div>
          </div>

          <div
            style={{
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.06)",
              background: "linear-gradient(180deg, rgba(8,15,31,0.98), rgba(7,12,24,0.96))",
              padding: "12px 14px",
            }}
          >
            <div style={{ color: "#7f93b7", fontSize: 10, fontWeight: 900, textTransform: "uppercase", marginBottom: 6 }}>
              Preço
            </div>
            <div style={{ color: "#4ef0cb", fontSize: 14, fontWeight: 900 }}>
              {livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div
            style={{
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.06)",
              background: "linear-gradient(180deg, rgba(8,15,31,0.98), rgba(7,12,24,0.96))",
              padding: "12px 14px",
            }}
          >
            <div style={{ color: "#7f93b7", fontSize: 10, fontWeight: 900, textTransform: "uppercase", marginBottom: 6 }}>
              Variação
            </div>
            <div style={{ color: isPositive ? ui.green : ui.red, fontSize: 14, fontWeight: 900 }}>
              {isPositive ? "+" : ""}{priceChange.toFixed(2)}%
            </div>
          </div>

          <div
            style={{
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.06)",
              background: "linear-gradient(180deg, rgba(8,15,31,0.98), rgba(7,12,24,0.96))",
              padding: "12px 14px",
            }}
          >
            <div style={{ color: "#7f93b7", fontSize: 10, fontWeight: 900, textTransform: "uppercase", marginBottom: 6 }}>
              Volume
            </div>
            <div style={{ color: "#51e6ff", fontSize: 14, fontWeight: 900 }}>
              {formatCompact(candles[candles.length - 1]?.volume ?? 0)}
            </div>
          </div>

          <div
            style={{
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.06)",
              background: "linear-gradient(180deg, rgba(8,15,31,0.98), rgba(7,12,24,0.96))",
              padding: "12px 14px",
            }}
          >
            <div style={{ color: "#7f93b7", fontSize: 10, fontWeight: 900, textTransform: "uppercase", marginBottom: 6 }}>
              Desenhos
            </div>
            <div style={{ color: drawings.length ? ui.yellow : ui.red, fontSize: 14, fontWeight: 900 }}>
              {drawings.length}
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
            <button style={{ height: 31, padding: "0 11px", borderRadius: 10, border: "1px solid rgba(247,201,72,0.34)", background: "linear-gradient(180deg, rgba(247,201,72,0.16), rgba(247,201,72,0.04))", color: ui.yellow, fontSize: 12, fontWeight: 800, cursor: "pointer" }}>Auto</button>
            <button style={{ height: 31, padding: "0 11px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", background: "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01))", color: "#dce8ff", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>Manual</button>
            <button style={{ height: 31, padding: "0 11px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", background: "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01))", color: "#dce8ff", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>Seguir + Espaço</button>
            <button style={{ height: 31, padding: "0 11px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", background: "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01))", color: "#dce8ff", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>Zoom -</button>
            <button style={{ height: 31, padding: "0 11px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", background: "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01))", color: "#dce8ff", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>Zoom +</button>
            <button style={{ height: 31, padding: "0 11px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", background: "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01))", color: "#dce8ff", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>Agora</button>
            <button style={{ height: 31, padding: "0 11px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", background: "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01))", color: "#dce8ff", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>Reset</button>
          </div>
        </div>
      </div>

      {/* Barra de ferramentas */}
      <div
        style={{
          minHeight: 68,
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${ui.border}`,
          background: "rgba(255,255,255,0.015)",
          gap: 12,
          flexWrap: "wrap",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {(["cursor", "trendline", "ray", "hline", "vline"] as const).map((tool) => (
            <button
              key={tool}
              onClick={() => {
                setCurrentTool(tool);
                if (tool === "cursor") cancelDraft();
              }}
              style={{
                height: 31,
                padding: "0 11px",
                borderRadius: 10,
                border: currentTool === tool ? "1px solid rgba(247,201,72,0.34)" : "1px solid rgba(255,255,255,0.06)",
                background: currentTool === tool
                  ? "linear-gradient(180deg, rgba(247,201,72,0.16), rgba(247,201,72,0.04))"
                  : "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01))",
                color: currentTool === tool ? ui.yellow : "#dce8ff",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {tool === "cursor" ? "Cursor" : tool === "trendline" ? "Trend Line" : tool === "ray" ? "Ray" : tool === "hline" ? "H Line" : "V Line"}
            </button>
          ))}
          {draft && (
            <button
              onClick={cancelDraft}
              style={{
                height: 31,
                padding: "0 11px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.06)",
                background: "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01))",
                color: "#dce8ff",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <X size={12} />
              Cancelar
            </button>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => setCurrentTool("cursor")} style={{ height: 31, padding: "0 11px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", background: "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01))", color: "#dce8ff", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>Objetos</button>
          <button onClick={toggleLocked} style={{ height: 31, padding: "0 11px", borderRadius: 10, border: selectedObject?.locked ? "1px solid rgba(247,201,72,0.34)" : "1px solid rgba(255,255,255,0.06)", background: selectedObject?.locked ? "linear-gradient(180deg, rgba(247,201,72,0.16), rgba(247,201,72,0.04))" : "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01))", color: selectedObject?.locked ? ui.yellow : "#dce8ff", fontSize: 12, fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Lock size={12} />
            Travar
          </button>
          <button onClick={toggleHidden} style={{ height: 31, padding: "0 11px", borderRadius: 10, border: selectedObject?.hidden ? "1px solid rgba(247,201,72,0.34)" : "1px solid rgba(255,255,255,0.06)", background: selectedObject?.hidden ? "linear-gradient(180deg, rgba(247,201,72,0.16), rgba(247,201,72,0.04))" : "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01))", color: selectedObject?.hidden ? ui.yellow : "#dce8ff", fontSize: 12, fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
            {selectedObject?.hidden ? <EyeOff size={12} /> : <Eye size={12} />}
            Ocultar
          </button>
          <button onClick={clearAll} style={{ height: 31, padding: "0 11px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", background: "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01))", color: "#dce8ff", fontSize: 12, fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Eraser size={12} />
            Limpar desenhos
          </button>
          <button onClick={deleteSelected} style={{ height: 31, padding: "0 11px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", background: "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01))", color: "#dce8ff", fontSize: 12, fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Trash2 size={12} />
            Apagar selecionado
          </button>
        </div>

        <div style={{ color: selectedObject ? "#dce8ff" : "#7f93b7", fontSize: 11, fontWeight: 800, marginLeft: "auto" }}>
          {draft ? `Modo desenho ativo: ${draft.type === "trendline" ? "Trend Line" : "Ray"} • clique para finalizar` : selectedObject ? `${selectedObject.name} • ${selectedObject.locked ? "travada" : "livre"}` : "Nenhum objeto selecionado"}
        </div>
      </div>

      {/* Área do gráfico e volume */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          position: "relative",
        }}
      >
        <div
          ref={chartContainerRef}
          style={{
            flex: 1,
            minHeight: 0,
            width: "100%",
            position: "relative",
          }}
        />
        {/* Overlay de desenho */}
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
            cursor: currentTool === "cursor" ? "default" : "crosshair",
            pointerEvents: "auto",
          }}
        >
          <svg width="100%" height="100%" style={{ overflow: "visible" }}>
            {drawings.map((obj) => {
              if (obj.hidden) return null;
              const isSelected = obj.id === selectedId;

              if (obj.type === "trendline" || obj.type === "ray") {
                const p1 = toScreenPoint(obj.p1);
                const p2 = toScreenPoint(obj.p2);
                if (!p1 || !p2) return null;
                let x2 = p2.x;
                let y2 = p2.y;
                if (obj.type === "ray") {
                  const rect = chartContainerRef.current?.getBoundingClientRect();
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
                      opacity={obj.locked ? 0.6 : 1}
                    />
                    {isSelected && (
                      <>
                        <circle cx={p1.x} cy={p1.y} r={5} fill="#ffd95c" stroke="#06101d" strokeWidth={2} />
                        <circle cx={p2.x} cy={p2.y} r={5} fill="#ffd95c" stroke="#06101d" strokeWidth={2} />
                      </>
                    )}
                  </g>
                );
              }

              if (obj.type === "hline") {
                const p = toScreenPoint({ time: obj.anchorTime, price: obj.price });
                if (!p) return null;
                return (
                  <g key={`${obj.id}-${renderTick}`}>
                    <line
                      x1={0}
                      y1={p.y}
                      x2="100%"
                      y2={p.y}
                      stroke={isSelected ? "#ffd95c" : "#2de2ff"}
                      strokeWidth={isSelected ? 2.6 : 2}
                      strokeDasharray="6 4"
                      opacity={obj.locked ? 0.6 : 1}
                    />
                    {isSelected && <circle cx={52} cy={p.y} r={5} fill="#ffd95c" stroke="#06101d" strokeWidth={2} />}
                  </g>
                );
              }

              if (obj.type === "vline") {
                const p = toScreenPoint({ time: obj.time, price: obj.anchorPrice });
                if (!p) return null;
                return (
                  <g key={`${obj.id}-${renderTick}`}>
                    <line
                      x1={p.x}
                      y1={0}
                      x2={p.x}
                      y2="100%"
                      stroke={isSelected ? "#ffd95c" : "#2de2ff"}
                      strokeWidth={isSelected ? 2.6 : 2}
                      strokeDasharray="6 4"
                      opacity={obj.locked ? 0.6 : 1}
                    />
                    {isSelected && <circle cx={p.x} cy={40} r={5} fill="#ffd95c" stroke="#06101d" strokeWidth={2} />}
                  </g>
                );
              }

              return null;
            })}

            {draft && draft.p2 && (() => {
              const p1 = toScreenPoint(draft.p1);
              const p2 = toScreenPoint(draft.p2);
              if (!p1 || !p2) return null;
              return (
                <g>
                  <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#ffd95c" strokeWidth={2} strokeDasharray="6 5" />
                  <circle cx={p1.x} cy={p1.y} r={4} fill="#ffd95c" />
                  <circle cx={p2.x} cy={p2.y} r={4} fill="#ffd95c" />
                </g>
              );
            })()}
          </svg>
        </div>

        <div
          ref={volContainerRef}
          style={{
            height: 82,
            width: "100%",
            flexShrink: 0,
            position: "relative",
            zIndex: 1,
          }}
        />
      </div>
    </div>
  );
}
