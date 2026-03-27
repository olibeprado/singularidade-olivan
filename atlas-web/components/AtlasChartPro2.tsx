"use client";1

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
  BarChart2,
  Bell,
  BrainCircuit,
  ChevronDown,
  ChevronRight,
  Droplets,
  Eraser,
  Eye,
  EyeOff,
  Layers3,
  Magnet,
  Maximize2,
  Minus,
  MousePointer2,
  Move,
  RotateCcw,
  Ruler,
  ScanSearch,
  Search,
  Settings,
  Shapes,
  Sigma,
  Square,
  Trash2,
  TrendingUp,
  Type,
  Waves,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

type Timeframe = "1m" | "5m" | "15m" | "30m" | "1H" | "4H" | "1D";
type ModeKey = "auto" | "manual" | "space";
type ToolCategory =
  | "cursor"
  | "trend"
  | "gannfib"
  | "shapes"
  | "annotation"
  | "measure"
  | "zoom"
  | "magnet"
  | "visibility"
  | "remove";
type DrawingTool = "cursor" | "trendline" | "ray" | "hline" | "vline";
type InteractionMode = "navigate" | "objects";

type CandleData = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type ToolItem = { id: string; label: string };
type ToolGroup = { id: ToolCategory; icon: React.ReactNode; title: string; items: ToolItem[] };
type TrendPoint = { time: number; price: number };

type BaseObject = { id: string; name: string; locked?: boolean; hidden?: boolean };
type TrendLineObject = BaseObject & { type: "trendline"; p1: TrendPoint; p2: TrendPoint };
type RayObject = BaseObject & { type: "ray"; p1: TrendPoint; p2: TrendPoint };
type HLineObject = BaseObject & { type: "hline"; price: number; anchorTime: number };
type VLineObject = BaseObject & { type: "vline"; time: number; anchorPrice: number };
type DrawingObject = TrendLineObject | RayObject | HLineObject | VLineObject;
type Draft = { type: "trendline" | "ray"; p1: TrendPoint; p2: TrendPoint | null } | null;

const TIMEFRAMES: Timeframe[] = ["1m", "5m", "15m", "30m", "1H", "4H", "1D"];
const NAV_TABS = ["Gráfico", "Ordens", "Posições", "IA Atlas", "Fluxo"];

const TOOL_GROUPS: ToolGroup[] = [
  {
    id: "cursor",
    icon: <MousePointer2 size={16} />,
    title: "Cursor / Navegação",
    items: [
      { id: "cursor", label: "Cursor" },
      { id: "crosshair", label: "Cruzeta" },
      { id: "hand", label: "Mover gráfico" },
      { id: "select", label: "Selecionar objeto" },
    ],
  },
  {
    id: "trend",
    icon: <TrendingUp size={16} />,
    title: "Linhas de Tendência",
    items: [
      { id: "trendline", label: "Trend Line" },
      { id: "ray", label: "Ray" },
      { id: "hline", label: "Horizontal Line" },
      { id: "vline", label: "Vertical Line" },
    ],
  },
  {
    id: "gannfib",
    icon: <BarChart2 size={16} />,
    title: "Gann / Fibonacci / Pitchfork",
    items: [
      { id: "pitchfork", label: "Pitchfork" },
      { id: "schiff", label: "Schiff Pitchfork" },
      { id: "fib-retrace", label: "Fib Retracement" },
    ],
  },
  {
    id: "shapes",
    icon: <Shapes size={16} />,
    title: "Formas / Padrões",
    items: [
      { id: "rect", label: "Rectangle" },
      { id: "circle", label: "Circle" },
      { id: "triangle", label: "Triangle" },
    ],
  },
  {
    id: "annotation",
    icon: <Type size={16} />,
    title: "Anotações",
    items: [
      { id: "text", label: "Text" },
      { id: "note", label: "Note" },
    ],
  },
  {
    id: "measure",
    icon: <Ruler size={16} />,
    title: "Medição",
    items: [
      { id: "measure", label: "Measure" },
      { id: "date-range", label: "Date Range" },
    ],
  },
  {
    id: "zoom",
    icon: <Maximize2 size={16} />,
    title: "Zoom / Navegação",
    items: [
      { id: "zoom-in", label: "Zoom In" },
      { id: "zoom-out", label: "Zoom Out" },
    ],
  },
  {
    id: "magnet",
    icon: <Magnet size={16} />,
    title: "Magnetismo",
    items: [
      { id: "magnet-weak", label: "Magnet Weak" },
      { id: "magnet-off", label: "Magnet Off" },
    ],
  },
  {
    id: "visibility",
    icon: <Eye size={16} />,
    title: "Visibilidade / Objetos",
    items: [
      { id: "show-all", label: "Mostrar tudo" },
      { id: "hide-all", label: "Ocultar tudo" },
    ],
  },
  {
    id: "remove",
    icon: <Trash2 size={16} />,
    title: "Remover / Limpeza",
    items: [
      { id: "delete-selected", label: "Apagar selecionado" },
      { id: "clear-drawings", label: "Limpar desenhos" },
    ],
  },
];

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

function ModuleButton({ icon, text, active }: { icon: React.ReactNode; text: string; active?: boolean }) {
  return (
    <button
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        height: 34,
        padding: "0 14px",
        borderRadius: 12,
        border: active ? "1px solid rgba(247,201,72,0.34)" : "1px solid rgba(255,255,255,0.06)",
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
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
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
  const [replayMode, setReplayMode] = useState(false);
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
            boxShadow: "0 0 24px rgba(46,226,255,0.16)",
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

      <div style={{ width: 1, height: 30, background: "rgba(255,255,255,0.08)", marginLeft: 4 }} />

      <button
        onClick={() => setReplayMode(!replayMode)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          height: 32,
          padding: "0 10px",
          borderRadius: 10,
          border: replayMode ? "1px solid rgba(247,201,72,0.34)" : "1px solid transparent",
          background: replayMode
            ? "linear-gradient(180deg, rgba(247,201,72,0.16), rgba(247,201,72,0.04))"
            : "transparent",
          color: replayMode ? ui.yellow : "#8da1c7",
          fontSize: 12,
          fontWeight: 800,
          cursor: "pointer",
        }}
      >
        <RotateCcw size={12} />
        Replay
      </button>

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
      ) : null}
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

function toolIcon(id: ToolCategory) {
  switch (id) {
    case "cursor": return <Move size={13} />;
    case "trend": return <Minus size={13} />;
    case "gannfib": return <BarChart2 size={13} />;
    case "shapes": return <Square size={13} />;
    case "annotation": return <Type size={13} />;
    case "measure": return <Ruler size={13} />;
    case "zoom": return <Search size={13} />;
    case "magnet": return <Magnet size={13} />;
    case "visibility": return <EyeOff size={13} />;
    case "remove": return <Eraser size={13} />;
  }
}

function toolLabel(tool: DrawingTool) {
  switch (tool) {
    case "cursor": return "Cursor";
    case "trendline": return "Trend Line";
    case "ray": return "Ray";
    case "hline": return "Horizontal Line";
    case "vline": return "Vertical Line";
  }
}

function LeftToolbar({
  activeGroup,
  setActiveGroup,
  currentTool,
  setCurrentTool,
}: {
  activeGroup: ToolCategory;
  setActiveGroup: (v: ToolCategory) => void;
  currentTool: DrawingTool;
  setCurrentTool: (v: DrawingTool) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const active = TOOL_GROUPS.find((g) => g.id === activeGroup) ?? TOOL_GROUPS[0];

  return (
    <div
      style={{
        width: collapsed ? 56 : 260,
        borderRight: `1px solid ${ui.border}`,
        background: "linear-gradient(180deg, rgba(8,12,24,0.98), rgba(6,9,17,0.98))",
        display: "flex",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 56,
          borderRight: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "10px 0",
          gap: 8,
        }}
      >
        {TOOL_GROUPS.map((tool) => {
          const isActive = tool.id === activeGroup;
          return (
            <button
              key={tool.id}
              title={tool.title}
              onClick={() => setActiveGroup(tool.id)}
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                border: isActive ? "1px solid rgba(45,226,255,0.22)" : "1px solid rgba(255,255,255,0.04)",
                background: isActive
                  ? "linear-gradient(180deg, rgba(45,226,255,0.12), rgba(45,226,255,0.04))"
                  : "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.01))",
                color: isActive ? ui.cyan : "#95a8cb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              {tool.icon}
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
            width: 204,
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
          <span>{active.title}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#7f93b7" }}>
            {toolIcon(active.id)}
            <ChevronRight size={13} />
          </div>
        </div>

        <div style={{ padding: "8px 0", overflowY: "auto", flex: 1 }}>
          {active.items.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (["cursor", "trendline", "ray", "hline", "vline"].includes(item.id)) {
                  setCurrentTool(item.id as DrawingTool);
                  setActiveGroup(item.id === "cursor" ? "cursor" : "trend");
                }
              }}
              style={{
                width: "100%",
                height: 32,
                padding: "0 12px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                border: "none",
                background: item.id === currentTool ? "rgba(45,226,255,0.08)" : "transparent",
                color: item.id === currentTool ? "#e9f7ff" : "#aebedc",
                fontSize: 12,
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <span style={{ color: item.id === currentTool ? ui.cyan : "#7e90b4", display: "flex", alignItems: "center" }}>
                {toolIcon(active.id)}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div
          style={{
            padding: 10,
            borderTop: "1px solid rgba(255,255,255,0.05)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
          }}
        >
          <button style={{ height: 30, borderRadius: 9, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", color: "#c7d7f7", fontSize: 11, fontWeight: 800 }}>Favoritos</button>
          <button style={{ height: 30, borderRadius: 9, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", color: "#c7d7f7", fontSize: 11, fontWeight: 800 }}>Recente</button>
        </div>
      </div>
    </div>
  );
}

function objectLabel(obj: DrawingObject | null) {
  if (!obj) return "Nenhum objeto selecionado";
  return `${obj.name} • ${obj.locked ? "travada" : "livre"}`;
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
  currentTool,
  setCurrentTool,
  interactionMode,
  setInteractionMode,
  mode,
  onAdd,
  onSelect,
  onUpdate,
  onDeleteSelected,
  onClearAll,
  onToggleLocked,
  onToggleHidden,
}: {
  candles: CandleData[];
  drawings: DrawingObject[];
  selectedId: string | null;
  currentTool: DrawingTool;
  setCurrentTool: (v: DrawingTool) => void;
  interactionMode: InteractionMode;
  setInteractionMode: (v: InteractionMode) => void;
  mode: ModeKey;
  onAdd: (obj: DrawingObject) => void;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, update: Partial<DrawingObject>) => void;
  onDeleteSelected: () => void;
  onClearAll: () => void;
  onToggleLocked: () => void;
  onToggleHidden: () => void;
}) {
  const mainRef = useRef<HTMLDivElement>(null);
  const volRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [renderTick, setRenderTick] = useState(0);
  const [livePrice, setLivePrice] = useState<number>(candles[candles.length - 1]?.close ?? 0);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [draft, setDraft] = useState<Draft>(null);

  const dragRef = useRef<
    | { type: "move-body"; objectId: string; startWorld: TrendPoint; original: DrawingObject }
    | { type: "move-handle"; objectId: string; handle: "p1" | "p2" | "anchor" }
    | null
  >(null);

  useEffect(() => {
    if (!mainRef.current || !volRef.current) return;

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

    const mc = createChart(mainRef.current, {
      ...baseChartOpts,
      width: mainRef.current.clientWidth,
      height: mainRef.current.clientHeight,
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

    const resize = () => {
      if (mainRef.current) {
        mc.applyOptions({ width: mainRef.current.clientWidth, height: mainRef.current.clientHeight });
      }
      setRenderTick((v) => v + 1);
    };

    window.addEventListener("resize", resize);
    mc.timeScale().subscribeVisibleLogicalRangeChange(() => setRenderTick((v) => v + 1));

    return () => {
      window.removeEventListener("resize", resize);
      chartRef.current = null;
      candleSeriesRef.current = null;
      mc.remove();
    };
  }, [candles]);

  const selectedObject = drawings.find((d) => d.id === selectedId) ?? null;
  const isPositive = priceChange >= 0;

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
    const rect = mainRef.current?.getBoundingClientRect();
    if (!chart || !series || !rect) return null;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const time = chart.timeScale().coordinateToTime(x);
    const price = series.coordinateToPrice(y);
    if (typeof time !== "number" || price == null) return null;
    return { time, price };
  };

  const createObject = (tool: DrawingTool, p1: TrendPoint, p2?: TrendPoint): DrawingObject | null => {
    const id = `${tool}-${Date.now()}`;
    switch (tool) {
      case "trendline": return p2 ? { id, name: `Trend Line ${drawings.length + 1}`, type: "trendline", p1, p2, locked: false, hidden: false } : null;
      case "ray": return p2 ? { id, name: `Ray ${drawings.length + 1}`, type: "ray", p1, p2, locked: false, hidden: false } : null;
      case "hline": return { id, name: `Horizontal Line ${drawings.length + 1}`, type: "hline", price: p1.price, anchorTime: p1.time, locked: false, hidden: false };
      case "vline": return { id, name: `Vertical Line ${drawings.length + 1}`, type: "vline", time: p1.time, anchorPrice: p1.price, locked: false, hidden: false };
      default: return null;
    }
  };

  const cancelDraft = () => setDraft(null);

  const hitTest = (clientX: number, clientY: number) => {
    const rect = mainRef.current?.getBoundingClientRect();
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
            onAdd(obj);
            onSelect(obj.id);
          }
          setDraft(null);
          setCurrentTool("cursor");
          setInteractionMode("objects");
        }
        return;
      }

      if (currentTool === "hline" || currentTool === "vline") {
        const obj = createObject(currentTool, world);
        if (obj) {
          onAdd(obj);
          onSelect(obj.id);
        }
        setCurrentTool("cursor");
        setInteractionMode("objects");
        return;
      }
    }

    const hit = hitTest(e.clientX, e.clientY);
    if (!hit) {
      onSelect(null);
      return;
    }

    const obj = drawings.find((d) => d.id === hit.objectId);
    if (!obj) return;
    onSelect(obj.id);
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
        onUpdate(obj.id, drag.handle === "p1" ? { p1: world } : { p2: world });
      } else if (obj.type === "hline" && drag.handle === "anchor") {
        onUpdate(obj.id, { price: world.price, anchorTime: world.time });
      } else if (obj.type === "vline" && drag.handle === "anchor") {
        onUpdate(obj.id, { time: world.time, anchorPrice: world.price });
      }
      return;
    }

    const dt = world.time - drag.startWorld.time;
    const dp = world.price - drag.startWorld.price;
    const original = drag.original;

    if (original.type === "trendline" || original.type === "ray") {
      onUpdate(original.id, {
        p1: { time: original.p1.time + dt, price: original.p1.price + dp },
        p2: { time: original.p2.time + dt, price: original.p2.price + dp },
      });
    } else if (original.type === "hline") {
      onUpdate(original.id, { price: original.price + dp, anchorTime: original.anchorTime + dt });
    } else if (original.type === "vline") {
      onUpdate(original.id, { time: original.time + dt, anchorPrice: original.anchorPrice + dp });
    }
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  const toolButtons: DrawingTool[] = ["cursor", "trendline", "ray", "hline", "vline"];

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

          <StatCard title="Preço" value={livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} valueColor="#4ef0cb" />
          <StatCard title="Variação" value={`${isPositive ? "+" : ""}${priceChange.toFixed(2)}%`} valueColor={isPositive ? ui.green : ui.red} />
          <StatCard title="Volume" value={formatCompact(candles[candles.length - 1]?.volume ?? 0)} valueColor="#51e6ff" />
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
          minHeight: 68,
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${ui.border}`,
          background: "rgba(255,255,255,0.015)",
          gap: 12,
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

          {toolButtons.filter((tool) => tool !== "cursor").map((tool) => (
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

          {draft ? (
            <TopButton onClick={cancelDraft}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <X size={12} />
                Cancelar
              </span>
            </TopButton>
          ) : null}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <TopButton active={!!selectedObject?.locked} onClick={onToggleLocked}>Travar</TopButton>
          <TopButton active={!!selectedObject?.hidden} onClick={onToggleHidden}>Ocultar</TopButton>
          <TopButton onClick={onClearAll}>Limpar desenhos</TopButton>
          <TopButton onClick={onDeleteSelected}>Apagar selecionado</TopButton>
        </div>

        <div style={{ color: selectedObject ? "#dce8ff" : "#7f93b7", fontSize: 11, fontWeight: 800, marginLeft: "auto" }}>
          {draft ? `Modo desenho: ${toolLabel(draft.type)} • clique para finalizar` : interactionMode === "navigate" ? "Gráfico livre para pan/zoom" : objectLabel(selectedObject)}
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
                const p1 = toScreenPoint(obj.p1);
                const p2 = toScreenPoint(obj.p2);
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
                    <line x1={p1.x} y1={p1.y} x2={x2} y2={y2} stroke={isSelected ? "#ffd95c" : "#2de2ff"} strokeWidth={isSelected ? 2.6 : 2} opacity={obj.locked ? 0.6 : 1} />
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
                const p = toScreenPoint({ time: obj.anchorTime, price: obj.price });
                if (!p) return null;
                return (
                  <g key={`${obj.id}-${renderTick}`}>
                    <line x1={0} y1={p.y} x2="100%" y2={p.y} stroke={isSelected ? "#ffd95c" : "#2de2ff"} strokeWidth={isSelected ? 2.6 : 2} strokeDasharray="6 4" opacity={obj.locked ? 0.6 : 1} />
                    {isSelected ? <circle cx={52} cy={p.y} r={5} fill="#ffd95c" stroke="#06101d" strokeWidth={2} /> : null}
                  </g>
                );
              }

              if (obj.type === "vline") {
                const p = toScreenPoint({ time: obj.time, price: obj.anchorPrice });
                if (!p) return null;
                return (
                  <g key={`${obj.id}-${renderTick}`}>
                    <line x1={p.x} y1={0} x2={p.x} y2="100%" stroke={isSelected ? "#ffd95c" : "#2de2ff"} strokeWidth={isSelected ? 2.6 : 2} strokeDasharray="6 4" opacity={obj.locked ? 0.6 : 1} />
                    {isSelected ? <circle cx={p.x} cy={40} r={5} fill="#ffd95c" stroke="#06101d" strokeWidth={2} /> : null}
                  </g>
                );
              }

              return null;
            })}

            {draft && draft.p2 ? (() => {
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
            })() : null}
          </svg>
        </div>
      </div>

      <div style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 16px", borderTop: `1px solid ${ui.border}`, background: "#0a0f1d" }}>
          <span style={{ color: "#7f93b7", fontSize: 11, fontFamily: "monospace" }}>Volume</span>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: "rgba(55,244,173,0.45)", display: "inline-block" }} />
          <span style={{ width: 8, height: 8, borderRadius: 2, background: "rgba(255,108,141,0.45)", display: "inline-block" }} />
        </div>
        <div ref={volRef} style={{ height: 82, width: "100%" }} />
      </div>
    </div>
  );
}

export default function AtlasChartPro2() {
  const [timeframe, setTimeframe] = useState<Timeframe>("15m");
  const [mode] = useState<ModeKey>("auto");
  const [activeGroup, setActiveGroup] = useState<ToolCategory>("trend");
  const [currentTool, setCurrentTool] = useState<DrawingTool>("cursor");
  const [interactionMode, setInteractionMode] = useState<InteractionMode>("navigate");
  const [drawings, setDrawings] = useState<DrawingObject[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const candles = useMemo(() => generateCandles(240, 70200), []);
  const lastCandle = candles[candles.length - 1];
  const firstCandle = candles[0];
  const priceChange = ((lastCandle.close - firstCandle.close) / firstCandle.close) * 100;
  const selectedObject = drawings.find((d) => d.id === selectedId) ?? null;

  const addObject = (obj: DrawingObject) => setDrawings((prev) => [...prev, obj]);
  const updateObject = (id: string, update: Partial<DrawingObject>) => setDrawings((prev) => prev.map((obj) => (obj.id === id ? ({ ...obj, ...update } as DrawingObject) : obj)));
  const deleteSelected = () => {
    if (!selectedId) return;
    setDrawings((prev) => prev.filter((obj) => obj.id !== selectedId));
    setSelectedId(null);
  };
  const clearAll = () => {
    setDrawings([]);
    setSelectedId(null);
  };
  const toggleLocked = () => {
    if (!selectedObject) return;
    updateObject(selectedObject.id, { locked: !selectedObject.locked } as Partial<DrawingObject>);
  };
  const toggleHidden = () => {
    if (!selectedObject) return;
    updateObject(selectedObject.id, { hidden: !selectedObject.hidden } as Partial<DrawingObject>);
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
        <LeftToolbar activeGroup={activeGroup} setActiveGroup={setActiveGroup} currentTool={currentTool} setCurrentTool={setCurrentTool} />
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, minHeight: 0 }}>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ChartPanel
              candles={candles}
              drawings={drawings}
              selectedId={selectedId}
              currentTool={currentTool}
              setCurrentTool={setCurrentTool}
              interactionMode={interactionMode}
              setInteractionMode={setInteractionMode}
              mode={mode}
              onAdd={addObject}
              onSelect={setSelectedId}
              onUpdate={updateObject}
              onDeleteSelected={deleteSelected}
              onClearAll={clearAll}
              onToggleLocked={toggleLocked}
              onToggleHidden={toggleHidden}
            />
          </div>
        </div>
        <div style={{ width: 238, flexShrink: 0, borderLeft: `1px solid ${ui.border}`, background: "linear-gradient(180deg, rgba(7,11,20,0.98), rgba(4,7,14,0.98))" }}>
          <div style={{ height: "100%", background: "linear-gradient(180deg, rgba(6,10,20,0.98), rgba(4,7,15,0.98))" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${ui.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ color: "#e8f1ff", fontSize: 12, fontWeight: 800, letterSpacing: 0.45 }}>Chat / IA Atlas</span>
              <ChevronDown size={14} color="#6c7da2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
