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
} from "lucide-react";

type Timeframe = "1m" | "5m" | "15m" | "30m" | "1H" | "4H" | "1D";
type ModeKey = "auto" | "manual" | "space";

type CandleData = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type StructureItem = {
  label: string;
  value?: string;
  type: "positive" | "strong" | "negative" | "neutral" | "dots";
  dots?: number;
};

type AIInsight = {
  symbol: string;
  price: number;
  score: number;
  signal: string;
  riskLevel: string;
  riskType: string;
  invalidation: number;
  structure: StructureItem[];
  structure2: StructureItem[];
};

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

type DrawingTool = "cursor" | "trendline";

type ToolItem = {
  id: string;
  label: string;
};

type ToolGroup = {
  id: ToolCategory;
  icon: React.ReactNode;
  title: string;
  items: ToolItem[];
};

type TrendPoint = {
  time: number;
  price: number;
};

type TrendLineObject = {
  id: string;
  name: string;
  type: "trendline";
  p1: TrendPoint;
  p2: TrendPoint;
  locked?: boolean;
  hidden?: boolean;
};

const TIMEFRAMES: Timeframe[] = ["1m", "5m", "15m", "30m", "1H", "4H", "1D"];
const NAV_TABS = ["Gráfico", "Ordens", "Posições", "IA Atlas", "Fluxo"];

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

    candles.push({
      time,
      open,
      high,
      low,
      close,
      volume,
    });

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
      { id: "info-line", label: "Info Line" },
      { id: "ray", label: "Ray" },
      { id: "extended", label: "Extended Line" },
      { id: "hline", label: "Horizontal Line" },
      { id: "vline", label: "Vertical Line" },
      { id: "cross", label: "Cross Line" },
      { id: "arrow", label: "Arrow" },
      { id: "path", label: "Path" },
      { id: "brush", label: "Brush" },
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
      { id: "fib-ext", label: "Trend-Based Fib Extension" },
      { id: "fib-time", label: "Trend-Based Fib Time" },
      { id: "fib-channel", label: "Fib Channel" },
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
      { id: "polyline", label: "Polyline" },
      { id: "long", label: "Long Position" },
      { id: "short", label: "Short Position" },
    ],
  },
  {
    id: "annotation",
    icon: <Type size={16} />,
    title: "Anotações",
    items: [
      { id: "text", label: "Text" },
      { id: "note", label: "Note" },
      { id: "balloon", label: "Balloon" },
      { id: "price-note", label: "Price Label" },
    ],
  },
  {
    id: "measure",
    icon: <Ruler size={16} />,
    title: "Medição",
    items: [
      { id: "measure", label: "Measure" },
      { id: "date-range", label: "Date Range" },
      { id: "price-range", label: "Price Range" },
    ],
  },
  {
    id: "zoom",
    icon: <Maximize2 size={16} />,
    title: "Zoom / Navegação",
    items: [
      { id: "zoom-in", label: "Zoom In" },
      { id: "zoom-out", label: "Zoom Out" },
      { id: "auto-fit", label: "Auto Fit" },
      { id: "reset-view", label: "Reset View" },
    ],
  },
  {
    id: "magnet",
    icon: <Magnet size={16} />,
    title: "Magnetismo",
    items: [
      { id: "magnet-weak", label: "Magnet Weak" },
      { id: "magnet-strong", label: "Magnet Strong" },
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
      { id: "lock-all", label: "Travar tudo" },
      { id: "unlock-all", label: "Destravar tudo" },
    ],
  },
  {
    id: "remove",
    icon: <Trash2 size={16} />,
    title: "Remover / Limpeza",
    items: [
      { id: "delete-selected", label: "Apagar selecionado" },
      { id: "clear-drawings", label: "Limpar desenhos" },
      { id: "clear-indicators", label: "Limpar indicadores" },
      { id: "factory-ui", label: "Reset visual" },
    ],
  },
];

const ui = {
  bg: "#060913",
  border: "#182235",
  text: "#ebf3ff",
  mut: "#7f93b7",
  cyan: "#2de2ff",
  green: "#27f59d",
  yellow: "#f7c948",
  red: "#ff6b86",
};

function sectionTitle(text: string) {
  return (
    <span
      style={{
        color: "#e8f1ff",
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: 0.45,
      }}
    >
      {text}
    </span>
  );
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

function StatCard({
  title,
  value,
  subtitle,
  valueColor,
}: {
  title: string;
  value: string;
  subtitle?: string;
  valueColor?: string;
}) {
  return (
    <div
      style={{
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.06)",
        background:
          "linear-gradient(180deg, rgba(8,15,31,0.98), rgba(7,12,24,0.96))",
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
      <div
        style={{
          color: valueColor || "#eef6ff",
          fontSize: 14,
          fontWeight: 900,
          marginBottom: subtitle ? 3 : 0,
        }}
      >
        {value}
      </div>
      {subtitle ? (
        <div
          style={{
            color: "#7286ac",
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}

function AIInsightPanel() {
  return (
    <div
      style={{
        height: "100%",
        background:
          "linear-gradient(180deg, rgba(6,10,20,0.98), rgba(4,7,15,0.98))",
        overflow: "hidden",
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
        {sectionTitle("Chat / IA Atlas")}
        <ChevronDown size={14} color="#6c7da2" />
      </div>

      <div style={{ height: "calc(100% - 47px)" }} />
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
        background:
          "radial-gradient(circle at top, rgba(14,28,60,0.86), rgba(6,10,20,0.98) 55%)",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 8 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            background:
              "linear-gradient(135deg, rgba(42,231,255,0.22), rgba(119,77,255,0.28))",
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
          <span
            style={{
              color: "#f6fbff",
              fontSize: 17,
              fontWeight: 900,
              letterSpacing: 0.3,
            }}
          >
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

      <div
        style={{
          width: 1,
          height: 30,
          background: "rgba(255,255,255,0.08)",
        }}
      />

      <button
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          height: 36,
          padding: "0 12px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.07)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.012))",
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
        <span
          style={{
            color: "#f6fbff",
            fontSize: 13,
            fontFamily: "monospace",
            fontWeight: 900,
          }}
        >
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

      <div
        style={{
          width: 1,
          height: 30,
          background: "rgba(255,255,255,0.08)",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {TIMEFRAMES.map((tf) => (
          <TopButton
            key={tf}
            active={timeframe === tf}
            onClick={() => onTimeframeChange(tf)}
          >
            {tf}
          </TopButton>
        ))}
      </div>

      <div
        style={{
          width: 1,
          height: 30,
          background: "rgba(255,255,255,0.08)",
          marginLeft: 4,
        }}
      />

      <button
        onClick={() => setReplayMode(!replayMode)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          height: 32,
          padding: "0 10px",
          borderRadius: 10,
          border: replayMode
            ? "1px solid rgba(247,201,72,0.34)"
            : "1px solid transparent",
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
        background:
          "linear-gradient(180deg, rgba(8,12,23,0.98), rgba(7,11,20,0.98))",
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
    case "cursor":
      return <Move size={13} />;
    case "trend":
      return <Minus size={13} />;
    case "gannfib":
      return <BarChart2 size={13} />;
    case "shapes":
      return <Square size={13} />;
    case "annotation":
      return <Type size={13} />;
    case "measure":
      return <Ruler size={13} />;
    case "zoom":
      return <Search size={13} />;
    case "magnet":
      return <Magnet size={13} />;
    case "visibility":
      return <EyeOff size={13} />;
    case "remove":
      return <Eraser size={13} />;
    default:
      return <ChevronRight size={13} />;
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
  const active = TOOL_GROUPS.find((g) => g.id === activeGroup) ?? TOOL_GROUPS[0];

  return (
    <div
      style={{
        width: 260,
        borderRight: `1px solid ${ui.border}`,
        background:
          "linear-gradient(180deg, rgba(8,12,24,0.98), rgba(6,9,17,0.98))",
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
                border: isActive
                  ? "1px solid rgba(45,226,255,0.22)"
                  : "1px solid rgba(255,255,255,0.04)",
                background: isActive
                  ? "linear-gradient(180deg, rgba(45,226,255,0.12), rgba(45,226,255,0.04))"
                  : "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.01))",
                color: isActive ? ui.cyan : "#95a8cb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: isActive ? "0 0 18px rgba(45,226,255,0.12)" : "none",
              }}
            >
              {tool.icon}
            </button>
          );
        })}

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

      <div
        style={{
          width: 204,
          display: "flex",
          flexDirection: "column",
          background:
            "linear-gradient(180deg, rgba(16,22,36,0.98), rgba(12,17,28,0.98))",
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

        <div
          style={{
            padding: "8px 0",
            overflowY: "auto",
            flex: 1,
          }}
        >
          {active.items.map((item) => {
            const isTrendItem = item.id === "trendline";
            const isCursorItem = item.id === "cursor";
            const isActiveTool =
              (isTrendItem && currentTool === "trendline") ||
              (isCursorItem && currentTool === "cursor");

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (isTrendItem) setCurrentTool("trendline");
                  if (isCursorItem) setCurrentTool("cursor");
                }}
                style={{
                  width: "100%",
                  height: 32,
                  padding: "0 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  border: "none",
                  background: isActiveTool ? "rgba(45,226,255,0.08)" : "transparent",
                  color: isActiveTool ? "#e9f7ff" : "#aebedc",
                  fontSize: 12,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <span style={{ color: isActiveTool ? ui.cyan : "#7e90b4", display: "flex", alignItems: "center" }}>
                  {toolIcon(active.id)}
                </span>
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.label}
                </span>
              </button>
            );
          })}
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
          <button
            style={{
              height: 30,
              borderRadius: 9,
              border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.02)",
              color: "#c7d7f7",
              fontSize: 11,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Favoritos
          </button>
          <button
            style={{
              height: 30,
              borderRadius: 9,
              border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.02)",
              color: "#c7d7f7",
              fontSize: 11,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Recente
          </button>
        </div>
      </div>
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
  trendLines,
  selectedLineId,
  currentTool,
  mode,
  onAddLine,
  onSelectLine,
  onUpdateLine,
  onDeleteSelected,
  onClearAll,
  onToggleLocked,
  onToggleHidden,
}: {
  candles: CandleData[];
  trendLines: TrendLineObject[];
  selectedLineId: string | null;
  currentTool: DrawingTool;
  mode: ModeKey;
  onAddLine: (line: TrendLineObject) => void;
  onSelectLine: (id: string | null) => void;
  onUpdateLine: (id: string, update: Partial<TrendLineObject>) => void;
  onDeleteSelected: () => void;
  onClearAll: () => void;
  onToggleLocked: () => void;
  onToggleHidden: () => void;
}) {
  const mainRef = useRef<HTMLDivElement>(null);
  const volRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const volChartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [renderTick, setRenderTick] = useState(0);
  const [livePrice, setLivePrice] = useState<number>(candles[candles.length - 1]?.close ?? 0);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [draftStart, setDraftStart] = useState<TrendPoint | null>(null);
  const [draftCurrent, setDraftCurrent] = useState<TrendPoint | null>(null);

  const dragRef = useRef<
    | {
        type: "move-line";
        lineId: string;
        startWorld: TrendPoint;
        originalP1: TrendPoint;
        originalP2: TrendPoint;
      }
    | {
        type: "move-handle";
        lineId: string;
        handle: "p1" | "p2";
      }
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

    const mc: IChartApi = createChart(mainRef.current, {
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

    const vc: IChartApi = createChart(volRef.current, {
      ...baseChartOpts,
      width: volRef.current.clientWidth,
      height: volRef.current.clientHeight,
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

    const syncFn = (range: any) => {
      if (range !== null) {
        vc.timeScale().setVisibleLogicalRange(range);
      }
      setRenderTick((v) => v + 1);
    };

    mc.timeScale().subscribeVisibleLogicalRangeChange(syncFn);

    const resize = () => {
      if (mainRef.current) {
        mc.applyOptions({
          width: mainRef.current.clientWidth,
          height: mainRef.current.clientHeight,
        });
      }
      if (volRef.current) {
        vc.applyOptions({
          width: volRef.current.clientWidth,
          height: volRef.current.clientHeight,
        });
      }
      setRenderTick((v) => v + 1);
    };

    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      chartRef.current = null;
      candleSeriesRef.current = null;
      volChartRef.current = null;
      mc.remove();
      vc.remove();
    };
  }, [candles]);

  const selectedLine = trendLines.find((line) => line.id === selectedLineId) ?? null;

  const isPositive = priceChange >= 0;

  const toScreenPoint = (point: TrendPoint) => {
    const chart = chartRef.current;
    const series = candleSeriesRef.current;
    if (!chart || !series) return null;

    const x = chart.timeScale().timeToCoordinate(point.time as Time);
    const y = series.priceToCoordinate(point.price);

    if (x == null || y == null) return null;
    return { x, y };
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

  const hitTest = (clientX: number, clientY: number) => {
    const rect = mainRef.current?.getBoundingClientRect();
    if (!rect) return null;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    for (let i = trendLines.length - 1; i >= 0; i--) {
      const line = trendLines[i];
      if (line.hidden) continue;
      const p1 = toScreenPoint(line.p1);
      const p2 = toScreenPoint(line.p2);
      if (!p1 || !p2) continue;

      const d1 = Math.hypot(x - p1.x, y - p1.y);
      const d2 = Math.hypot(x - p2.x, y - p2.y);

      if (d1 <= 10) return { kind: "handle" as const, lineId: line.id, handle: "p1" as const };
      if (d2 <= 10) return { kind: "handle" as const, lineId: line.id, handle: "p2" as const };

      const dl = pointToSegmentDistance(x, y, p1.x, p1.y, p2.x, p2.y);
      if (dl <= 8) return { kind: "line" as const, lineId: line.id };
    }

    return null;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (currentTool === "trendline") {
      const world = fromEventToWorld(e.clientX, e.clientY);
      if (!world) return;

      if (!draftStart) {
        setDraftStart(world);
        setDraftCurrent(world);
      } else {
        const newId = `line-${Date.now()}`;
        onAddLine({
          id: newId,
          name: `Trend Line ${trendLines.length + 1}`,
          type: "trendline",
          p1: draftStart,
          p2: world,
          locked: false,
          hidden: false,
        });
        onSelectLine(newId);
        setDraftStart(null);
        setDraftCurrent(null);
      }
      return;
    }

    const hit = hitTest(e.clientX, e.clientY);
    if (!hit) {
      onSelectLine(null);
      return;
    }

    const line = trendLines.find((l) => l.id === hit.lineId);
    if (!line || line.locked) {
      onSelectLine(hit.lineId);
      return;
    }

    onSelectLine(hit.lineId);

    if (hit.kind === "handle") {
      dragRef.current = {
        type: "move-handle",
        lineId: hit.lineId,
        handle: hit.handle,
      };
      return;
    }

    const startWorld = fromEventToWorld(e.clientX, e.clientY);
    if (!startWorld) return;

    dragRef.current = {
      type: "move-line",
      lineId: hit.lineId,
      startWorld,
      originalP1: { ...line.p1 },
      originalP2: { ...line.p2 },
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (currentTool === "trendline" && draftStart) {
      const world = fromEventToWorld(e.clientX, e.clientY);
      if (world) setDraftCurrent(world);
      return;
    }

    const drag = dragRef.current;
    if (!drag) return;

    const world = fromEventToWorld(e.clientX, e.clientY);
    if (!world) return;

    if (drag.type === "move-handle") {
      const line = trendLines.find((l) => l.id === drag.lineId);
      if (!line) return;
      if (drag.handle === "p1") {
        onUpdateLine(line.id, { p1: world });
      } else {
        onUpdateLine(line.id, { p2: world });
      }
      return;
    }

    const dt = world.time - drag.startWorld.time;
    const dp = world.price - drag.startWorld.price;
    onUpdateLine(drag.lineId, {
      p1: { time: drag.originalP1.time + dt, price: drag.originalP1.price + dp },
      p2: { time: drag.originalP2.time + dt, price: drag.originalP2.price + dp },
    });
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  const handleDoubleClick = () => {
    if (draftStart) {
      setDraftStart(null);
      setDraftCurrent(null);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background:
          "linear-gradient(180deg, rgba(7,12,24,0.98), rgba(6,10,18,0.98))",
      }}
    >
      <div
        style={{
          padding: "10px 12px",
          borderBottom: `1px solid ${ui.border}`,
          background:
            "linear-gradient(180deg, rgba(12,19,36,0.94), rgba(8,13,25,0.94))",
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              minWidth: 0,
            }}
          >
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
                flexShrink: 0,
              }}
            >
              SC
            </div>

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  color: "#eef6ff",
                  fontSize: 16,
                  fontWeight: 900,
                  lineHeight: 1.15,
                }}
              >
                BTCUSDT
              </div>
              <div
                style={{
                  color: "#7d91b6",
                  fontSize: 11,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Scanner Atlas • Ferramenta: {currentTool === "trendline" ? "Trend Line" : "Cursor"} • TF: 15m
              </div>
            </div>
          </div>

          <StatCard
            title="Preço"
            value={livePrice.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
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
          <StatCard
            title="Desenhos"
            value={String(trendLines.length)}
            valueColor={trendLines.length ? ui.yellow : ui.red}
          />

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
          height: 34,
          padding: "0 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${ui.border}`,
          background: "rgba(255,255,255,0.015)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <TopButton active={currentTool === "cursor"} onClick={() => onSelectLine(selectedLineId)}>
            Objetos
          </TopButton>
          <TopButton active={!!selectedLine?.locked} onClick={onToggleLocked}>Travar</TopButton>
          <TopButton active={!!selectedLine?.hidden} onClick={onToggleHidden}>Ocultar</TopButton>
          <TopButton onClick={onClearAll}>Limpar desenhos</TopButton>
          <TopButton onClick={onDeleteSelected}>Apagar selecionado</TopButton>
          <TopButton active={currentTool === "trendline"}>Trend Line</TopButton>
        </div>

        <div
          style={{
            color: selectedLine ? "#dce8ff" : "#7f93b7",
            fontSize: 11,
            fontWeight: 800,
          }}
        >
          {selectedLine
            ? `${selectedLine.name} • ${selectedLine.locked ? "travada" : "livre"}`
            : draftStart
            ? "Clique no segundo ponto para finalizar"
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
          onDoubleClick={handleDoubleClick}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 5,
            cursor: currentTool === "trendline" ? "crosshair" : "default",
          }}
        >
          <svg width="100%" height="100%" style={{ overflow: "visible" }}>
            {trendLines.map((line) => {
              if (line.hidden) return null;
              const p1 = toScreenPoint(line.p1);
              const p2 = toScreenPoint(line.p2);
              if (!p1 || !p2) return null;
              const isSelected = line.id === selectedLineId;

              return (
                <g key={`${line.id}-${renderTick}`}>
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke={isSelected ? "#ffd95c" : "#2de2ff"}
                    strokeWidth={isSelected ? 2.6 : 2}
                    opacity={line.locked ? 0.6 : 1}
                  />
                  {isSelected ? (
                    <>
                      <circle cx={p1.x} cy={p1.y} r={5} fill="#ffd95c" stroke="#06101d" strokeWidth={2} />
                      <circle cx={p2.x} cy={p2.y} r={5} fill="#ffd95c" stroke="#06101d" strokeWidth={2} />
                    </>
                  ) : null}
                </g>
              );
            })}

            {draftStart && draftCurrent ? (() => {
              const p1 = toScreenPoint(draftStart);
              const p2 = toScreenPoint(draftCurrent);
              if (!p1 || !p2) return null;
              return (
                <g>
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke="#ffd95c"
                    strokeWidth={2}
                    strokeDasharray="6 5"
                  />
                  <circle cx={p1.x} cy={p1.y} r={4} fill="#ffd95c" />
                  <circle cx={p2.x} cy={p2.y} r={4} fill="#ffd95c" />
                </g>
              );
            })() : null}
          </svg>
        </div>
      </div>

      <div style={{ flexShrink: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "6px 16px",
            borderTop: `1px solid ${ui.border}`,
            background: "#0a0f1d",
          }}
        >
          <span style={{ color: "#7f93b7", fontSize: 11, fontFamily: "monospace" }}>
            Volume
          </span>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              background: "rgba(55,244,173,0.45)",
              display: "inline-block",
            }}
          />
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              background: "rgba(255,108,141,0.45)",
              display: "inline-block",
            }}
          />
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
  const [currentTool, setCurrentTool] = useState<DrawingTool>("trendline");
  const [trendLines, setTrendLines] = useState<TrendLineObject[]>([]);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);

  const candles = useMemo(() => generateCandles(240, 70200), []);

  const lastCandle = candles[candles.length - 1];
  const firstCandle = candles[0];
  const priceChange =
    ((lastCandle.close - firstCandle.close) / firstCandle.close) * 100;

  const aiInsight = useMemo<AIInsight>(
    () => ({
      symbol: "BTCUSDT",
      price: lastCandle.close,
      score: clamp(84, 0, 100),
      signal: "COMPRA",
      riskLevel: "Moderado",
      riskType: "Volatilidade",
      invalidation: 69180.6,
      structure: [
        { label: "Fluxo", value: "Positivo", type: "positive" },
        { label: "Momentum", value: "Forte", type: "strong" },
        { label: "Liquidez", value: "Acima", type: "positive" },
        { label: "Confluência", type: "dots", dots: 8 },
      ],
      structure2: [
        { label: "Euler", value: "Alinhado", type: "positive" },
        { label: "Razão de Prata", value: "Estável", type: "neutral" },
        { label: "Risco Assimétrico", value: "Bom", type: "positive" },
        { label: "Invalidação", value: "Próxima", type: "negative" },
      ],
    }),
    [lastCandle.close]
  );

  const selectedLine = trendLines.find((line) => line.id === selectedLineId) ?? null;

  const addLine = (line: TrendLineObject) => {
    setTrendLines((prev) => [...prev, line]);
  };

  const updateLine = (id: string, update: Partial<TrendLineObject>) => {
    setTrendLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, ...update } : line))
    );
  };

  const deleteSelected = () => {
    if (!selectedLineId) return;
    setTrendLines((prev) => prev.filter((line) => line.id !== selectedLineId));
    setSelectedLineId(null);
  };

  const clearAll = () => {
    setTrendLines([]);
    setSelectedLineId(null);
  };

  const toggleLocked = () => {
    if (!selectedLine) return;
    updateLine(selectedLine.id, { locked: !selectedLine.locked });
  };

  const toggleHidden = () => {
    if (!selectedLine) return;
    updateLine(selectedLine.id, { hidden: !selectedLine.hidden });
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
      <TopBar
        symbol="BTCUSDT"
        price={lastCandle.close}
        change={priceChange}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
      />

      <ModuleStrip />

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <LeftToolbar
          activeGroup={activeGroup}
          setActiveGroup={setActiveGroup}
          currentTool={currentTool}
          setCurrentTool={setCurrentTool}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minWidth: 0,
            minHeight: 0,
          }}
        >
          <div style={{ flex: 1, minHeight: 0 }}>
            <ChartPanel
              candles={candles}
              trendLines={trendLines}
              selectedLineId={selectedLineId}
              currentTool={currentTool}
              mode={mode}
              onAddLine={addLine}
              onSelectLine={setSelectedLineId}
              onUpdateLine={updateLine}
              onDeleteSelected={deleteSelected}
              onClearAll={clearAll}
              onToggleLocked={toggleLocked}
              onToggleHidden={toggleHidden}
            />
          </div>
        </div>

        <div
          style={{
            width: 238,
            flexShrink: 0,
            borderLeft: `1px solid ${ui.border}`,
            background:
              "linear-gradient(180deg, rgba(7,11,20,0.98), rgba(4,7,14,0.98))",
          }}
        >
          <AIInsightPanel />
        </div>
      </div>
    </div>
  );
}
