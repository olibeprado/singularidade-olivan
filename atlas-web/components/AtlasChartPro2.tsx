"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  IChartApi,
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
  Eye,
  Layers3,
  Maximize2,
  MousePointer2,
  PenTool,
  RotateCcw,
  Ruler,
  ScanSearch,
  Search,
  Settings,
  Shapes,
  Sigma,
  Square,
  Star,
  Trash2,
  TrendingDown,
  TrendingUp,
  Type,
  Waves,
  Plus,
  Minus,
  MoveUpRight,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  GitBranch,
  Grid2X2,
  Circle,
  Spline,
  Network,
  SlidersHorizontal,
} from "lucide-react";

type Timeframe = "1m" | "5m" | "15m" | "30m" | "1H" | "4H" | "1D";
type ModeKey = "auto" | "manual" | "space";
type TopModuleKey =
  | "Fluxo"
  | "Singularidade"
  | "IA Atlas"
  | "Scanner"
  | "Mestre Scanner"
  | "Estrutura"
  | "Euler"
  | "Liquidez";

type CandleData = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type IndicatorData = {
  time: number;
  rsi: number;
  mfi: number;
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
  trendBias: "bullish" | "bearish" | "neutral";
  structure: StructureItem[];
  structure2: StructureItem[];
};

type AssetScore = {
  symbol: string;
  volumeScore: number;
  rsiMfi: number;
  price: number;
  change: number;
  trend: "up" | "down" | "neutral";
  color: string;
  aiScore: number;
  signal: string;
  riskLevel: string;
  riskType: string;
  invalidation: number;
};

type ToolKey =
  | "cursor"
  | "point"
  | "marker"
  | "trendLine"
  | "ray"
  | "arrow"
  | "horizontal"
  | "vertical"
  | "parallelChannel"
  | "regressionChannel"
  | "range"
  | "grid"
  | "pitchfork"
  | "gannBox"
  | "gannSquare"
  | "fibRetracement"
  | "fibProjection";

type DrawPoint = { x: number; y: number };

type DrawObject = {
  id: string;
  name: string;
  type: ToolKey;
  points: DrawPoint[];
  locked?: boolean;
  hidden?: boolean;
};

type ScannerEvent = {
  time: string;
  title: string;
  tag: string;
  tone: "positive" | "warning" | "neutral";
};

const TIMEFRAMES: Timeframe[] = ["1m", "5m", "15m", "30m", "1H", "4H", "1D"];
const NAV_TABS = ["Gráfico", "Ordens", "Posições", "IA Atlas", "Fluxo"];
const TOP_MODULES: TopModuleKey[] = [
  "Fluxo",
  "Singularidade",
  "IA Atlas",
  "Scanner",
  "Mestre Scanner",
  "Estrutura",
  "Euler",
  "Liquidez",
];
const LIQUIDITY_TABS = ["Liquidez", "Map", "Clusters", "Eventos", "Fluxo Institucional", "Notícias IA Atlas"];

const ui = {
  bg: "#060913",
  bg2: "#050810",
  border: "#172133",
  text: "#ebf3ff",
  mut: "#7f93b7",
  cyan: "#2de2ff",
  cyan2: "#00d8ff",
  green: "#27f59d",
  yellow: "#f7c948",
  red: "#ff6b86",
  magenta: "#ff4fa3",
  orange: "#ff9d2e",
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

function symbolBasePrice(symbol: string) {
  const map: Record<string, number> = {
    BTC: 74682,
    ETH: 3932,
    SOL: 174.8,
    BNB: 610.75,
    XRP: 2.147,
    DOGE: 0.387,
    AVAX: 38.87,
    DOT: 8.98,
    ADA: 0.847,
    ARB: 1.21,
    SEI: 0.58,
    INJ: 65.99,
    CORE: 1.9,
    PET: 0.65,
  };
  return map[symbol] ?? 100;
}

function generateCandles(count = 240, startPrice = 74500): CandleData[] {
  const now = Math.floor(Date.now() / 1000);
  const candles: CandleData[] = [];
  let prevClose = startPrice;

  for (let i = count; i > 0; i--) {
    const time = now - i * 300;
    const wave =
      Math.sin(i / 11) * (startPrice * 0.0045) +
      Math.cos(i / 17) * (startPrice * 0.0022);
    const drift = (Math.random() - 0.49) * (startPrice * 0.0065) + wave;
    const open = prevClose;
    const close = Math.max(0.0001, open + drift);
    const high = Math.max(open, close) + Math.random() * (startPrice * 0.0035);
    const low = Math.min(open, close) - Math.random() * (startPrice * 0.0035);
    const volume = 120 + Math.random() * 1400;
    candles.push({ time, open, high, low, close, volume });
    prevClose = close;
  }

  return candles;
}

function generateIndicators(candles: CandleData[]): IndicatorData[] {
  return candles.map((c, i) => {
    const rsi = clamp(48 + Math.sin(i / 8) * 14 + (Math.random() - 0.5) * 6, 5, 95);
    const mfi = clamp(52 + Math.cos(i / 10) * 16 + (Math.random() - 0.5) * 6, 5, 95);
    return { time: c.time, rsi, mfi };
  });
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

function generateSparkline(count: number, start: number, trend: "up" | "down" | "neutral") {
  const arr: number[] = [];
  let value = start;
  for (let i = 0; i < count; i++) {
    const drift = trend === "up" ? 1.3 : trend === "down" ? -1.2 : 0.12;
    value += drift + (Math.random() - 0.5) * 3;
    arr.push(value);
  }
  return arr;
}

function getScoreVisual(score: number) {
  if (score >= 80) return { color: ui.green, label: "Compra" };
  if (score >= 50) return { color: ui.yellow, label: "Neutro" };
  return { color: ui.red, label: "Baixa" };
}

function symbolToInsight(asset: AssetScore): AIInsight {
  return {
    symbol: asset.symbol,
    price: asset.price,
    score: asset.aiScore,
    signal: asset.signal,
    riskLevel: asset.riskLevel,
    riskType: asset.riskType,
    invalidation: asset.invalidation,
    trendBias: asset.trend === "up" ? "bullish" : asset.trend === "down" ? "bearish" : "neutral",
    structure: [
      {
        label: "Fluxo",
        value:
          asset.trend === "up" ? "Positivo" : asset.trend === "down" ? "Pressão" : "Neutro",
        type:
          asset.trend === "up" ? "positive" : asset.trend === "down" ? "negative" : "neutral",
      },
      {
        label: "Momentum",
        value: asset.aiScore >= 80 ? "Forte" : asset.aiScore >= 60 ? "Moderado" : "Fraco",
        type: asset.aiScore >= 80 ? "strong" : asset.aiScore >= 60 ? "neutral" : "negative",
      },
      {
        label: "Liquidez",
        value:
          asset.volumeScore >= 70 ? "Ativo" : asset.volumeScore >= 50 ? "Médio" : "Baixo",
        type:
          asset.volumeScore >= 70 ? "positive" : asset.volumeScore >= 50 ? "neutral" : "negative",
      },
      {
        label: "Confluência",
        type: "dots",
        dots: Math.max(2, Math.min(9, Math.round(asset.aiScore / 11))),
      },
    ],
    structure2: [
      {
        label: "Euler",
        value:
          asset.trend === "up" ? "Alinhado" : asset.trend === "down" ? "Pressão" : "Estável",
        type:
          asset.trend === "up" ? "positive" : asset.trend === "down" ? "negative" : "neutral",
      },
      {
        label: "Razão de Prata",
        value: asset.rsiMfi >= 60 ? "Forte" : asset.rsiMfi >= 45 ? "Estável" : "Fraca",
        type: asset.rsiMfi >= 60 ? "positive" : asset.rsiMfi >= 45 ? "neutral" : "negative",
      },
      {
        label: "Risco Assimétrico",
        value: asset.change >= 0 ? "Bom" : "Sensível",
        type: asset.change >= 0 ? "positive" : "negative",
      },
      {
        label: "Invalidação",
        value: asset.change >= 0 ? "Controlada" : "Próxima",
        type: asset.change >= 0 ? "neutral" : "negative",
      },
    ],
  };
}

function ModuleButton({
  icon,
  text,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  text: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
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
        height: 29,
        padding: "0 10px",
        borderRadius: 9,
        border: active
          ? "1px solid rgba(247,201,72,0.34)"
          : "1px solid rgba(255,255,255,0.06)",
        background: active
          ? "linear-gradient(180deg, rgba(247,201,72,0.16), rgba(247,201,72,0.04))"
          : "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.008))",
        color: active ? ui.yellow : "#dce8ff",
        fontSize: 11,
        fontWeight: 800,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
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
              color: ui.cyan,
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

      <div style={{ width: 1, height: 30, background: "rgba(255,255,255,0.08)" }} />

      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {TIMEFRAMES.map((tf) => (
          <TopButton key={tf} active={timeframe === tf} onClick={() => onTimeframeChange(tf)}>
            {tf}
          </TopButton>
        ))}
      </div>

      <div style={{ width: 1, height: 30, background: "rgba(255,255,255,0.08)" }} />

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
        <span style={{ color: ui.green, fontSize: 12, fontWeight: 900 }}>
          {isPositive ? "+" : ""}
          {change.toFixed(2)}%
        </span>
        <Search size={15} color="#90a4c8" />
        <Bell size={15} color="#90a4c8" />
        <Settings size={15} color="#90a4c8" />
      </div>
    </div>
  );
}

function ModuleStrip({
  activeModule,
  onChange,
}: {
  activeModule: TopModuleKey;
  onChange: (m: TopModuleKey) => void;
}) {
  const icons: Record<TopModuleKey, React.ReactNode> = {
    Fluxo: <Waves size={13} />,
    Singularidade: <BrainCircuit size={13} />,
    "IA Atlas": <Activity size={13} />,
    Scanner: <ScanSearch size={13} />,
    "Mestre Scanner": <Star size={13} />,
    Estrutura: <Layers3 size={13} />,
    Euler: <Sigma size={13} />,
    Liquidez: <Droplets size={13} />,
  };

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
      {TOP_MODULES.map((module) => (
        <ModuleButton
          key={module}
          icon={icons[module]}
          text={module}
          active={activeModule === module}
          onClick={() => onChange(module)}
        />
      ))}
    </div>
  );
}

function LeftToolbar({
  activeTool,
  onSelectTool,
}: {
  activeTool: ToolKey;
  onSelectTool: (tool: ToolKey) => void;
}) {
  const groups: { title: string; items: { key: ToolKey; icon: React.ReactNode; label: string }[] }[] = [
    {
      title: "CURSOR",
      items: [
        { key: "cursor", icon: <MousePointer2 size={15} />, label: "Navegar" },
        { key: "point", icon: <Circle size={15} />, label: "Ponto" },
        { key: "marker", icon: <Eye size={15} />, label: "Marcador" },
      ],
    },
    {
      title: "LINHAS DE TENDÊNCIA",
      items: [
        { key: "trendLine", icon: <TrendingUp size={15} />, label: "Linha" },
        { key: "ray", icon: <MoveUpRight size={15} />, label: "Raio" },
        { key: "arrow", icon: <ArrowUp size={15} />, label: "Seta" },
        { key: "horizontal", icon: <ArrowRight size={15} />, label: "Horizontal" },
        { key: "vertical", icon: <ArrowDown size={15} />, label: "Vertical" },
      ],
    },
    {
      title: "CANAIS",
      items: [
        { key: "parallelChannel", icon: <GitBranch size={15} />, label: "Canal Paralelo" },
        { key: "regressionChannel", icon: <BarChart2 size={15} />, label: "Canal Regressão" },
        { key: "range", icon: <SlidersHorizontal size={15} />, label: "Faixa" },
        { key: "grid", icon: <Grid2X2 size={15} />, label: "Grid" },
      ],
    },
    {
      title: "GAFOS & GANN",
      items: [
        { key: "pitchfork", icon: <Spline size={15} />, label: "Pitchfork" },
        { key: "gannBox", icon: <Network size={15} />, label: "Gann Box" },
        { key: "gannSquare", icon: <Square size={15} />, label: "Gann Square" },
      ],
    },
    {
      title: "FIBONACCI",
      items: [
        { key: "fibRetracement", icon: <Ruler size={15} />, label: "Retracement" },
        { key: "fibProjection", icon: <ArrowRight size={15} />, label: "Projection" },
      ],
    },
  ];

  return (
    <div
      data-atlas-scroll="cyan"
      style={{
        width: 74,
        borderRight: `1px solid ${ui.border}`,
        background:
          "linear-gradient(180deg, rgba(8,12,24,0.98), rgba(6,9,17,0.98))",
        display: "flex",
        flexDirection: "column",
        padding: "10px 8px",
        gap: 12,
        overflowY: "auto",
        flexShrink: 0,
      }}
    >
      {groups.map((group, gi) => (
        <div key={gi} style={{ display: "grid", gap: 8 }}>
          <div
            style={{
              color: "#536887",
              fontSize: 8,
              fontWeight: 900,
              letterSpacing: 0.9,
              textTransform: "uppercase",
              textAlign: "center",
            }}
          >
            {group.title}
          </div>

          {group.items.map((tool) => {
            const isActive = activeTool === tool.key;
            return (
              <button
                key={tool.key}
                title={tool.label}
                onClick={() => onSelectTool(tool.key)}
                style={{
                  width: 40,
                  height: 40,
                  margin: "0 auto",
                  borderRadius: 12,
                  border: isActive
                    ? "1px solid rgba(45,226,255,0.28)"
                    : "1px solid rgba(255,255,255,0.04)",
                  background: isActive
                    ? "radial-gradient(circle at 50% 50%, rgba(45,226,255,0.18), rgba(45,226,255,0.04))"
                    : "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.008))",
                  color: isActive ? ui.cyan : "#90a4c8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: isActive ? "0 0 18px rgba(45,226,255,0.18)" : "none",
                }}
              >
                {tool.icon}
              </button>
            );
          })}
        </div>
      ))}

      <div style={{ flex: 1 }} />

      <button
        style={{
          width: 40,
          height: 40,
          margin: "0 auto",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(255,255,255,0.02)",
          color: "#90a4c8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <Settings size={15} />
      </button>
    </div>
  );
}

function ScoreDots({ count, total = 9 }: { count: number; total?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            display: "inline-block",
            background:
              i < count
                ? "linear-gradient(180deg, #31e9ff, #18b7ff)"
                : "rgba(255,255,255,0.14)",
          }}
        />
      ))}
    </div>
  );
}

function StructureRow({ item }: { item: StructureItem }) {
  const getColor = (type: StructureItem["type"]) => {
    switch (type) {
      case "positive":
        return ui.green;
      case "strong":
        return "#9fffbc";
      case "negative":
        return ui.red;
      case "neutral":
        return "#aab7d1";
      default:
        return "#dbe7ff";
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "7px 0",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <ChevronRight size={10} color="#66789d" />
        <span style={{ fontSize: 12, color: "#8ea2c8" }}>{item.label}</span>
      </div>
      {item.type === "dots" && item.dots !== undefined ? (
        <ScoreDots count={item.dots} />
      ) : (
        <span style={{ fontSize: 12, color: getColor(item.type), fontWeight: 700 }}>
          {item.value}
        </span>
      )}
    </div>
  );
}

function AIInsightPanel({
  insight,
  topModule,
}: {
  insight: AIInsight;
  topModule: TopModuleKey;
}) {
  const scoreColor =
    insight.score >= 80 ? ui.green : insight.score >= 60 ? ui.yellow : ui.red;

  const moduleLabel =
    topModule === "Scanner" ? "IA Atlas Insights" : `${topModule} Insights`;

  return (
    <div
      style={{
        height: "100%",
        background:
          "linear-gradient(180deg, rgba(6,10,20,0.98), rgba(4,7,15,0.98))",
        overflowY: "auto",
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
        <span
          style={{
            color: "#e8f1ff",
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: 0.45,
          }}
        >
          {moduleLabel}
        </span>
        <ChevronDown size={14} color="#6c7da2" />
      </div>

      <div style={{ padding: 16, borderBottom: `1px solid ${ui.border}` }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: ui.yellow, fontSize: 12 }}>₿</span>
            <span style={{ color: "#d8e6ff", fontSize: 12, fontFamily: "monospace" }}>
              {insight.symbol}
            </span>
          </div>
          <span style={{ color: "#96a8cb", fontSize: 12, fontFamily: "monospace" }}>
            {insight.price.toLocaleString()}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              color: "#f3f8ff",
              fontSize: 19,
              fontWeight: 900,
              letterSpacing: 0.4,
            }}
          >
            {insight.symbol}
          </span>

          <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
            <span
              style={{
                color: scoreColor,
                fontSize: 20,
                fontWeight: 900,
              }}
            >
              {insight.score}
            </span>
            <TrendingUp size={14} color={scoreColor} />
          </div>
        </div>

        <div
          style={{
            marginTop: 10,
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 8,
            alignItems: "center",
          }}
        >
          <div
            style={{
              height: 6,
              borderRadius: 999,
              background: "rgba(255,255,255,0.08)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${insight.score}%`,
                height: "100%",
                borderRadius: 999,
                background:
                  "linear-gradient(90deg, rgba(49,233,255,0.95), rgba(36,245,155,0.95))",
              }}
            />
          </div>
          <div
            style={{
              padding: "5px 10px",
              borderRadius: 7,
              background: `${scoreColor}22`,
              color: scoreColor,
              fontSize: 11,
              fontWeight: 900,
            }}
          >
            {insight.signal}
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          {[
            ["Risco", insight.riskLevel, ui.yellow],
            ["Tipo", insight.riskType, ui.red],
            ["Invalidação", `$${insight.invalidation.toLocaleString()}`, "#eef5ff"],
            ["Fonte", "binance", "#d9e8ff"],
          ].map(([k, v, c]) => (
            <div
              key={k}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 0",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <span style={{ color: "#7f93b7", fontSize: 13 }}>{k}</span>
              <span style={{ color: c as string, fontSize: 12, fontWeight: 800 }}>
                {v}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "12px 16px 4px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <span
            style={{
              color: "#e8f1ff",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 0.45,
            }}
          >
            Estrutura
          </span>
          <ChevronRight size={12} color="#6c7da2" />
        </div>
        {insight.structure.map((item, i) => (
          <StructureRow key={i} item={item} />
        ))}
      </div>

      <div
        style={{
          margin: 12,
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.06)",
          background:
            "linear-gradient(180deg, rgba(9,15,29,0.98), rgba(7,12,24,0.98))",
          padding: 12,
        }}
      >
        <div
          style={{
            color: "#ecf4ff",
            fontSize: 12,
            fontWeight: 900,
            marginBottom: 10,
          }}
        >
          {topModule}
        </div>

        {[
          ["Estrutura", insight.structure[0]?.value || "Neutro", ui.green],
          ["Momentum", insight.structure[1]?.value || "Moderado", "#9fffbc"],
          ["Confluência", `${Math.max(2, Math.min(9, Math.round(insight.score / 11)))} / 9`, ui.green],
          ["Razão de Prata", insight.structure2[1]?.value || "Estável", ui.green],
          ["Ciclo", insight.score >= 75 ? "Acelerado" : "Normal", ui.cyan],
        ].map(([a, b, c]) => (
          <div
            key={a}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "6px 0",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
              fontSize: 12,
            }}
          >
            <span style={{ color: "#8397bd" }}>{a}</span>
            <span style={{ color: c as string, fontWeight: 800 }}>{b}</span>
          </div>
        ))}
      </div>

      <div style={{ padding: "0 16px 16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <span
            style={{
              color: "#e8f1ff",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 0.45,
            }}
          >
            Confluência
          </span>
          <ChevronRight size={12} color="#6c7da2" />
        </div>
        {insight.structure2.map((item, i) => (
          <StructureRow key={i} item={item} />
        ))}
      </div>
    </div>
  );
}

function MiniSparkline({ data, trend }: { data: number[]; trend: "up" | "down" | "neutral" }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 86;
  const h = 34;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");
  const color = trend === "up" ? ui.green : trend === "down" ? ui.red : "#8ea2c8";

  return (
    <svg width={w} height={h}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ScoreBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const visual = getScoreVisual(value);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          width: 62,
          height: 6,
          background: "rgba(255,255,255,0.08)",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: 999,
            background: visual.color,
          }}
        />
      </div>
      <span style={{ fontSize: 10, fontWeight: 900, color: visual.color }}>{visual.label}</span>
    </div>
  );
}

function ScannerPanelContinuous({
  assets,
  selectedSymbol,
  onSelectSymbol,
}: {
  assets: AssetScore[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return assets;
    const q = searchTerm.toLowerCase();
    return assets.filter((a) => a.symbol.toLowerCase().includes(q));
  }, [assets, searchTerm]);

  const sparklines = useMemo(
    () => filtered.map((a) => generateSparkline(24, 40 + Math.random() * 40, a.trend)),
    [filtered]
  );

  return (
    <div
      style={{
        height: "100%",
        borderRadius: 12,
        border: `1px solid ${ui.border}`,
        background:
          "linear-gradient(180deg, rgba(7,10,19,0.98), rgba(5,8,15,0.98))",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "10px 12px 8px",
          borderBottom: `1px solid ${ui.border}`,
          display: "grid",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 178px",
            gap: 10,
            alignItems: "center",
          }}
        >
          <span style={{ color: "#f1f7ff", fontSize: 13, fontWeight: 900 }}>
            MESTRE SCANNER
          </span>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              height: 32,
              padding: "0 10px",
              borderRadius: 9,
              border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <Search size={13} color="#8ca0c6" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar moeda..."
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#e9f3ff",
                fontSize: 11,
              }}
            />
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 0.92fr 0.98fr 0.92fr 1fr",
            gap: 10,
            color: "#6c7da2",
            fontSize: 11,
          }}
        >
          <span>Top Forge</span>
          <span>Sinal</span>
          <span>Preço</span>
          <span>RSI / MFI</span>
          <span>Mini Chart</span>
        </div>
      </div>

      <div data-atlas-scroll="cyan" style={{ flex: 1, overflowY: "auto" }}>
        {filtered.map((asset, i) => (
          <div
            key={asset.symbol}
            onClick={() => onSelectSymbol(asset.symbol)}
            style={{
              display: "grid",
              gridTemplateColumns: "1.1fr 0.92fr 0.98fr 0.92fr 1fr",
              gap: 10,
              padding: "11px 12px",
              borderBottom: "1px solid rgba(255,255,255,0.045)",
              alignItems: "center",
              cursor: "pointer",
              background:
                asset.symbol === selectedSymbol
                  ? "linear-gradient(90deg, rgba(247,201,72,0.10), rgba(45,226,255,0.06))"
                  : "transparent",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: asset.color,
                  display: "inline-block",
                }}
              />
              <span style={{ color: "#edf5ff", fontSize: 12, fontWeight: 800 }}>
                {asset.symbol}
              </span>
            </div>

            <ScoreBar value={asset.volumeScore} />

            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ color: "#eef5ff", fontSize: 12, fontFamily: "monospace" }}>
                ${asset.price.toLocaleString()}
              </span>
              <span
                style={{
                  color: asset.change >= 0 ? ui.green : ui.red,
                  fontSize: 12,
                  fontFamily: "monospace",
                  fontWeight: 800,
                }}
              >
                {asset.change >= 0 ? "+" : ""}
                {asset.change.toFixed(1)}%
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {asset.trend === "up" ? (
                <TrendingUp size={11} color={ui.green} />
              ) : asset.trend === "down" ? (
                <TrendingDown size={11} color={ui.red} />
              ) : (
                <Activity size={11} color="#a2b3d3" />
              )}
              <span style={{ color: "#8fd6ff", fontSize: 12, fontFamily: "monospace" }}>
                {asset.rsiMfi.toFixed(1)}
              </span>
            </div>

            <MiniSparkline data={sparklines[i]} trend={asset.trend} />
          </div>
        ))}
      </div>
    </div>
  );
}


function MasterScannerPanel({
  assets,
  selectedSymbol,
  onSelectSymbol,
}: {
  assets: AssetScore[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favoriteSymbols, setFavoriteSymbols] = useState<string[]>(["BTC", "ETH"]);
  const [sortKey, setSortKey] = useState<"price" | "change" | "dominance">("dominance");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  const dominanceMap = useMemo<Record<string, number>>(
    () => ({
      BTC: 52.43,
      ETH: 17.82,
      SOL: 4.96,
      BNB: 3.74,
      XRP: 2.96,
      DOGE: 1.98,
      AVAX: 1.31,
      ADA: 1.14,
      DOT: 0.74,
      ARB: 0.29,
    }),
    []
  );

  const toggleSort = (key: "price" | "change" | "dominance") => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "desc" ? "asc" : "desc"));
      return;
    }
    setSortKey(key);
    setSortDir("desc");
  };

  const toggleFavorite = (symbol: string) => {
    setFavoriteSymbols((prev) =>
      prev.includes(symbol) ? prev.filter((item) => item !== symbol) : [...prev, symbol]
    );
  };

  const orderedRows = useMemo(() => {
    const decorated = assets.map((asset) => ({
      ...asset,
      dominance: dominanceMap[asset.symbol] ?? Number((0.12 + asset.volumeScore / 1000).toFixed(2)),
      favorite: favoriteSymbols.includes(asset.symbol),
    }));

    const btc = decorated.find((item) => item.symbol === "BTC");
    let others = decorated.filter((item) => item.symbol !== "BTC");

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      others = others.filter((item) => item.symbol.toLowerCase().includes(q));
    }

    if (showFavoritesOnly) {
      others = others.filter((item) => item.favorite);
    }

    others = [...others].sort((a, b) => {
      const dir = sortDir === "desc" ? -1 : 1;
      const av = sortKey === "price" ? a.price : sortKey === "change" ? a.change : a.dominance;
      const bv = sortKey === "price" ? b.price : sortKey === "change" ? b.change : b.dominance;
      if (av < bv) return 1 * dir;
      if (av > bv) return -1 * dir;
      return a.symbol.localeCompare(b.symbol);
    });

    return btc ? [btc, ...others] : others;
  }, [assets, dominanceMap, favoriteSymbols, searchTerm, showFavoritesOnly, sortDir, sortKey]);

  const marketPositive =
    assets.filter((item) => item.change >= 0).length / Math.max(1, assets.length) >= 0.6;

  return (
    <div
      style={{
        height: "100%",
        borderRadius: 12,
        border: `1px solid ${ui.border}`,
        background: "linear-gradient(180deg, rgba(7,10,19,0.98), rgba(5,8,15,0.98))",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "10px 14px",
          borderBottom: `1px solid ${ui.border}`,
          display: "grid",
          gap: 10,
          flexShrink: 0,
          background:
            "radial-gradient(circle at top, rgba(0,216,255,0.08), transparent 38%), linear-gradient(180deg, rgba(10,16,28,0.98), rgba(7,10,19,0.98))",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 220px auto auto",
            gap: 10,
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ color: "#f2f7ff", fontSize: 18, fontWeight: 900, letterSpacing: 0.5 }}>
              MESTRE SCANNER
            </div>
            <div style={{ color: "#7f93b7", fontSize: 11 }}>
              Dominância BTC em evidência, BTC fixo e ordenação por preço ou variação.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              height: 36,
              padding: "0 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <Search size={14} color="#8ca0c6" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar ativo..."
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#e9f3ff",
                fontSize: 12,
              }}
            />
          </div>

          <button
            onClick={() => setShowFavoritesOnly(false)}
            style={{
              height: 34,
              padding: "0 12px",
              borderRadius: 10,
              border: !showFavoritesOnly
                ? "1px solid rgba(45,226,255,0.25)"
                : "1px solid rgba(255,255,255,0.06)",
              background: !showFavoritesOnly
                ? "linear-gradient(180deg, rgba(45,226,255,0.14), rgba(45,226,255,0.04))"
                : "rgba(255,255,255,0.03)",
              color: !showFavoritesOnly ? ui.cyan : "#dce8ff",
              fontSize: 11,
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Mercado
          </button>

          <button
            onClick={() => setShowFavoritesOnly(true)}
            style={{
              height: 34,
              padding: "0 12px",
              borderRadius: 10,
              border: showFavoritesOnly
                ? "1px solid rgba(247,201,72,0.3)"
                : "1px solid rgba(255,255,255,0.06)",
              background: showFavoritesOnly
                ? "linear-gradient(180deg, rgba(247,201,72,0.15), rgba(247,201,72,0.04))"
                : "rgba(255,255,255,0.03)",
              color: showFavoritesOnly ? ui.yellow : "#dce8ff",
              fontSize: 11,
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Favoritos
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 10,
          }}
        >
          <SmallStatCard
            title="Dominância BTC"
            value="52.43%"
            sub="BTC liderando o fluxo macro."
            color={ui.yellow}
            accent="rgba(247,201,72,0.12)"
          />
          <SmallStatCard
            title="BTC Fixo"
            value="$74.682"
            sub="Sempre visível no topo do scanner."
            color={ui.cyan}
            accent="rgba(45,226,255,0.1)"
          />
          <SmallStatCard
            title="Favoritos"
            value={`${favoriteSymbols.length}`}
            sub="Lista rápida com seus ativos-chave."
            color={ui.green}
            accent="rgba(39,245,157,0.1)"
          />
          <SmallStatCard
            title="Mercado"
            value={marketPositive ? "Bull Bias" : "Cautela"}
            sub={marketPositive ? "Mais ativos subindo do que caindo." : "Mercado misto e seletivo."}
            color={marketPositive ? ui.green : ui.red}
            accent={marketPositive ? "rgba(39,245,157,0.1)" : "rgba(255,107,134,0.08)"}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 0.9fr 0.95fr 0.9fr 0.8fr 1fr",
            gap: 10,
            color: "#6c7da2",
            fontSize: 11,
            alignItems: "center",
          }}
        >
          <span>Ativo</span>
          <span>Top Forge</span>
          <button
            onClick={() => toggleSort("price")}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              color: sortKey === "price" ? ui.cyan : "#6c7da2",
              fontSize: 11,
              fontWeight: 800,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            Preço {sortKey === "price" ? (sortDir === "desc" ? "↓" : "↑") : ""}
          </button>
          <button
            onClick={() => toggleSort("change")}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              color: sortKey === "change" ? ui.cyan : "#6c7da2",
              fontSize: 11,
              fontWeight: 800,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            % 24h {sortKey === "change" ? (sortDir === "desc" ? "↓" : "↑") : ""}
          </button>
          <button
            onClick={() => toggleSort("dominance")}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              color: sortKey === "dominance" ? ui.cyan : "#6c7da2",
              fontSize: 11,
              fontWeight: 800,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            Dom. BTC {sortKey === "dominance" ? (sortDir === "desc" ? "↓" : "↑") : ""}
          </button>
          <span>Mini Chart</span>
        </div>
      </div>

      <div
        data-atlas-scroll="cyan"
        style={{ flex: 1, overflowY: "auto", padding: "0 0 4px" }}
      >
        {orderedRows.map((asset, index) => {
          const spark = generateSparkline(22, 42 + index * 2, asset.trend);
          const isBtc = asset.symbol === "BTC";
          const isFav = favoriteSymbols.includes(asset.symbol);
          const scoreVisual = getScoreVisual(asset.aiScore);
          const dominance = dominanceMap[asset.symbol] ?? 0;

          return (
            <div
              key={asset.symbol}
              onClick={() => onSelectSymbol(asset.symbol)}
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 0.9fr 0.95fr 0.9fr 0.8fr 1fr",
                gap: 10,
                padding: "12px 14px",
                borderBottom: "1px solid rgba(255,255,255,0.045)",
                alignItems: "center",
                cursor: "pointer",
                background: isBtc
                  ? "linear-gradient(90deg, rgba(247,201,72,0.14), rgba(45,226,255,0.08))"
                  : asset.symbol === selectedSymbol
                  ? "linear-gradient(90deg, rgba(45,226,255,0.08), rgba(255,255,255,0.01))"
                  : "transparent",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(asset.symbol);
                  }}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.06)",
                    background: isFav ? "rgba(247,201,72,0.12)" : "rgba(255,255,255,0.03)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: isFav ? ui.yellow : "#7f93b7",
                  }}
                >
                  <Star size={13} fill={isFav ? ui.yellow : "transparent"} />
                </button>

                <div style={{ display: "grid", gap: 2 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: asset.color,
                        display: "inline-block",
                        boxShadow: `0 0 12px ${asset.color}`,
                      }}
                    />
                    <span style={{ color: "#edf5ff", fontSize: 13, fontWeight: 900 }}>
                      {asset.symbol}
                    </span>
                    {isBtc && (
                      <span
                        style={{
                          padding: "3px 7px",
                          borderRadius: 999,
                          background: "rgba(247,201,72,0.14)",
                          color: ui.yellow,
                          fontSize: 8,
                          fontWeight: 900,
                        }}
                      >
                        FIXO
                      </span>
                    )}
                  </div>
                  <span style={{ color: "#6c7da2", fontSize: 10 }}>
                    {isBtc ? "Referência principal do scanner." : "Ordenação dinâmica por mercado."}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ color: scoreVisual.color, fontSize: 12, fontWeight: 900 }}>
                  {asset.signal}
                </div>
                <ScoreBar value={asset.aiScore} />
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ color: "#eef5ff", fontSize: 12, fontFamily: "monospace" }}>
                  ${asset.price.toLocaleString()}
                </span>
                <span style={{ color: "#7f93b7", fontSize: 10 }}>
                  {asset.riskType}
                </span>
              </div>

              <div
                style={{
                  color: asset.change >= 0 ? ui.green : ui.red,
                  fontSize: 12,
                  fontFamily: "monospace",
                  fontWeight: 900,
                }}
              >
                {asset.change >= 0 ? "+" : ""}
                {asset.change.toFixed(2)}%
              </div>

              <div
                style={{
                  color: isBtc ? ui.yellow : "#dce8ff",
                  fontSize: 12,
                  fontFamily: "monospace",
                  fontWeight: 900,
                }}
              >
                {dominance.toFixed(2)}%
              </div>

              <MiniSparkline data={spark} trend={asset.trend} />
            </div>
          );
        })}
      </div>
    </div>
  );
}


function SmallStatCard({
  title,
  value,
  sub,
  color,
  accent,
}: {
  title: string;
  value: string;
  sub?: string;
  color: string;
  accent?: string;
}) {
  return (
    <div
      style={{
        borderRadius: 14,
        border: "1px solid rgba(45,226,255,0.16)",
        background:
          "linear-gradient(180deg, rgba(6,13,24,0.98), rgba(4,8,16,0.98))",
        padding: "8px 12px 7px",
        height: 60,
        overflow: "hidden",
        boxShadow: accent ? `0 0 18px ${accent}` : "none",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          color: "#6f88af",
          fontSize: 9,
          fontWeight: 900,
          letterSpacing: 0.78,
          textTransform: "uppercase",
          marginBottom: 2,
          lineHeight: 1,
        }}
      >
        {title}
      </div>
      <div
        style={{
          color,
          fontSize: 14,
          fontWeight: 900,
          marginBottom: 1,
          textShadow: `0 0 10px ${color}33`,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            color: "#7f95bb",
            fontSize: 8,
            lineHeight: 1.1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            opacity: 0.9,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function EventRealtimePanel({ events }: { events: ScannerEvent[] }) {
  const rows = events.slice(0, 7).map((event, index) => {
    const amountBase = [67.0, 23.1, 234.7, 89.2, 67.8, 45.6, 125.4][index] ?? 42.8;
    const priceBase = [65508, 65395, 65385, 65420, 65380, 65400, 65450][index] ?? 65410;
    const exchangeBase = ["OKX", "Binance", "OKX", "Coinbase Pro", "Bybit", "Kraken", "Binance"][index] ?? "Exchange";
    const severityWidth = [58, 28, 72, 52, 88, 33, 78][index] ?? 50;
    const severityLabel = index % 3 === 0 ? "Baixo" : index % 3 === 1 ? "Alto" : "Médio";
    const rightColor =
      severityLabel === "Alto" ? ui.red : severityLabel === "Médio" ? ui.yellow : ui.green;
    const leftDot = event.tone === "positive" ? ui.green : event.tone === "warning" ? ui.yellow : "#ff5050";

    return {
      ...event,
      amountBase,
      priceBase,
      exchangeBase,
      severityWidth,
      severityLabel,
      rightColor,
      leftDot,
    };
  });

  return (
    <div
      style={{
        height: "100%",
        borderRadius: 12,
        border: `1px solid ${ui.border}`,
        background:
          "linear-gradient(180deg, rgba(6,10,18,0.98), rgba(4,7,14,0.98))",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: 42,
          padding: "0 12px",
          borderBottom: `1px solid ${ui.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#00e117",
              display: "inline-block",
            }}
          />
          <span style={{ color: "#edf5ff", fontSize: 13, fontWeight: 900 }}>
            Eventos em Tempo Real
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              padding: "4px 8px",
              borderRadius: 6,
              background: "rgba(0,225,23,0.08)",
              color: "#00e117",
              fontSize: 10,
              fontWeight: 900,
            }}
          >
            Live
          </span>
          <span style={{ color: "#7f93b7", fontSize: 11, fontWeight: 700 }}>
            {rows.length} eventos
          </span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 8, display: "grid", gap: 8 }}>
        {rows.map((event, i) => (
          <div
            key={`${event.time}-${i}`}
            style={{
              position: "relative",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.06)",
              background:
                "linear-gradient(180deg, rgba(9,14,24,0.98), rgba(7,11,20,0.98))",
              padding: "12px 12px 12px 28px",
              overflow: "hidden",
              minHeight: 62,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 10,
                top: 18,
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: event.leftDot,
              }}
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 0.8fr 0.54fr",
                gap: 12,
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ color: "#f0f7ff", fontSize: 12, fontWeight: 900, marginBottom: 3 }}>
                  {event.title}
                </div>
                <div style={{ color: "#7f93b7", fontSize: 11 }}>{event.exchangeBase}</div>
              </div>

              <div style={{ textAlign: "center" }}>
                <div style={{ color: "#eef5ff", fontSize: 12, fontWeight: 900, fontFamily: "monospace" }}>
                  {event.amountBase.toFixed(1)} BTC
                </div>
                <div style={{ color: "#7f93b7", fontSize: 11, fontFamily: "monospace" }}>
                  ${event.priceBase.toLocaleString()}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#dce8ff", fontSize: 12, fontFamily: "monospace", marginBottom: 4 }}>
                  {event.time}
                </div>
                <div style={{ color: event.rightColor, fontSize: 12, fontWeight: 900 }}>
                  {event.severityLabel}
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 10,
                height: 3,
                borderRadius: 999,
                background: "rgba(255,255,255,0.05)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${event.severityWidth}%`,
                  height: "100%",
                  borderRadius: 999,
                  background:
                    event.severityLabel === "Alto"
                      ? "linear-gradient(90deg, #29ff72, #ff3c57)"
                      : event.severityLabel === "Médio"
                      ? "linear-gradient(90deg, #ffb300, #ff4b57)"
                      : "linear-gradient(90deg, #29ff72, #24d6ff)",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeatmapBars() {
  const rows = [
    { label: "72.200", value: 88, color: "rgba(49,233,255,0.85)" },
    { label: "71.800", value: 72, color: "rgba(39,245,157,0.82)" },
    { label: "71.200", value: 58, color: "rgba(247,201,72,0.82)" },
    { label: "70.800", value: 96, color: "rgba(255,107,134,0.82)" },
    { label: "70.300", value: 66, color: "rgba(49,233,255,0.85)" },
    { label: "69.900", value: 47, color: "rgba(39,245,157,0.82)" },
  ];

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {rows.map((r) => (
        <div
          key={r.label}
          style={{
            display: "grid",
            gridTemplateColumns: "64px 1fr 46px",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ color: "#9ab0d4", fontSize: 12, fontFamily: "monospace" }}>
            {r.label}
          </span>

          <div
            style={{
              height: 12,
              borderRadius: 999,
              background: "rgba(255,255,255,0.06)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${r.value}%`,
                height: "100%",
                borderRadius: 999,
                background: r.color,
              }}
            />
          </div>

          <span style={{ color: "#e9f3ff", fontSize: 11, fontWeight: 800, textAlign: "right" }}>
            {r.value}%
          </span>
        </div>
      ))}
    </div>
  );
}

function LiquidityPanel() {
  const [tab, setTab] = useState("Liquidez");

  const renderMain = () => {
    if (tab === "Liquidez") {
      return (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ color: "#edf5ff", fontSize: 13, fontWeight: 900 }}>Mapa de Liquidez</div>
          <HeatmapBars />
        </div>
      );
    }

    if (tab === "Map") {
      const volumeBars = [
        { h: 72, c: "#149969" }, { h: 56, c: "#8f3452" }, { h: 86, c: "#149969" }, { h: 46, c: "#8f3452" },
        { h: 66, c: "#8f3452" }, { h: 94, c: "#149969" }, { h: 52, c: "#149969" }, { h: 126, c: "#149969" },
        { h: 104, c: "#8f3452" }, { h: 76, c: "#149969" }, { h: 112, c: "#149969" }, { h: 138, c: "#8f3452" },
      ];
      const xLabels = ["00:00","02:00","04:00","06:00","08:00","10:00","12:00","14:00","16:00","18:00","20:00","22:00"];
      return (
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ color: "#edf5ff", fontSize: 13, fontWeight: 900 }}>Mapa de Preço</div>
              <div style={{ display: "flex", gap: 6 }}>
                {["1M","5M","15M","1H","4H","1D"].map((tf) => (
                  <button
                    key={tf}
                    style={{
                      height: 22,
                      minWidth: 28,
                      borderRadius: 6,
                      border: tf === "1H" ? "1px solid rgba(45,226,255,0.55)" : "1px solid rgba(255,255,255,0.08)",
                      background: tf === "1H" ? "rgba(45,226,255,0.14)" : "rgba(255,255,255,0.02)",
                      color: tf === "1H" ? "#dffcff" : "#7f95bb",
                      fontSize: 9,
                      fontWeight: 900,
                      padding: "0 8px",
                    }}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ color: ui.mut, fontSize: 11 }}>VOL: 22.13</div>
          </div>

          <div style={{ height: 430, borderRadius: 14, border: "1px solid rgba(255,255,255,0.05)", background: "linear-gradient(180deg, rgba(6,13,24,0.96), rgba(5,9,18,0.98))", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(45,226,255,0.035), transparent 32%)" }} />
            <div style={{ position: "absolute", left: 14, top: 14, zIndex: 2 }}>
              <div style={{ color: "#eff7ff", fontSize: 19, fontWeight: 900, marginBottom: 4 }}>$71.500,00 <span style={{ color: "#27f59d", fontSize: 14, marginLeft: 8 }}>↗ +0.34%</span></div>
            </div>

            <div style={{ position: "absolute", left: 14, right: 14, top: 52, bottom: 118 }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 42, color: "#5e7398", fontSize: 10, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "16px 0 26px" }}>
                <span>$72k</span>
                <span>$71k</span>
                <span>$71k</span>
                <span>$70k</span>
                <span>$70k</span>
              </div>
              <div style={{ position: "absolute", left: 38, right: 0, top: 0, bottom: 0 }}>
                <svg viewBox="0 0 760 260" style={{ width: "100%", height: "100%" }}>
                  <defs>
                    <linearGradient id="atlasMapFillV2" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="rgba(45,226,255,0.20)" />
                      <stop offset="100%" stopColor="rgba(45,226,255,0.03)" />
                    </linearGradient>
                  </defs>
                  <path d="M12 190 C84 76, 152 34, 220 126 S332 272, 406 176 S516 20, 596 86 S676 56, 748 10" fill="none" stroke="#23dcff" strokeWidth="2.8" />
                  <path d="M12 190 C84 76, 152 34, 220 126 S332 272, 406 176 S516 20, 596 86 S676 56, 748 10 L748 260 L12 260 Z" fill="url(#atlasMapFillV2)" />
                </svg>
              </div>
            </div>

            <div style={{ position: "absolute", left: 14, right: 14, bottom: 16, height: 98 }}>
              <div style={{ position: "absolute", left: 42, right: 0, bottom: 0, display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 10, alignItems: "end", height: 92 }}>
                {volumeBars.map((bar, idx) => (
                  <div key={idx} style={{ display: "grid", gap: 6 }}>
                    <div style={{ height: bar.h, borderRadius: 1, background: bar.c, opacity: 0.95 }} />
                  </div>
                ))}
              </div>
              <div style={{ position: "absolute", left: 42, right: 0, bottom: -2, display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 10 }}>
                {xLabels.map((label) => (
                  <div key={label} style={{ color: "#56709b", fontSize: 9, textAlign: "center" }}>{label}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (tab === "Clusters") {
      return (
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ color: "#edf5ff", fontSize: 13, fontWeight: 900 }}>Mapa de Clusters</div>
            <div style={{ color: ui.mut, fontSize: 11 }}>Select Active · Select All</div>
          </div>
          <div style={{ height: 320, borderRadius: 14, border: "1px solid rgba(255,255,255,0.05)", background: "linear-gradient(180deg, rgba(6,13,24,0.96), rgba(5,9,18,0.98))", position: "relative" }}>
            {[
              ["BTC Core", 180, 165, 96, "#8b5cf6"],
              ["ETH Core", 360, 105, 70, "#2de2ff"],
              ["BTC Alta", 120, 285, 52, "#27f59d"],
              ["Whale Sell", 420, 260, 46, "#ff4d8d"],
              ["Retail", 300, 305, 34, "#ff944d"],
            ].map(([name, x, y, size, color]) => (
              <div key={String(name)} style={{ position: "absolute", left: Number(x), top: Number(y), width: Number(size), height: Number(size), borderRadius: 999, border: `1px solid ${color}`, boxShadow: `0 0 25px ${color}33`, display: "grid", placeItems: "center", color: color as string, fontSize: 12, fontWeight: 900, transform: "translate(-50%, -50%)" }}>
                <div style={{ textAlign: "center", lineHeight: 1.1 }}>{name}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (tab === "Eventos") {
      return (
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ color: "#edf5ff", fontSize: 13, fontWeight: 900 }}>Livro de Trade</div>
            <div style={{ color: ui.mut, fontSize: 11 }}>Tempo Real</div>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {[
              ["14:32", "LIQUIDAÇÃO", "$71.265", "Liquidação em massa shorts detectada", ui.green],
              ["14:28", "WHALE", "$70.980", "Ordem de compra institucional +$12.4M", ui.green],
              ["14:21", "CLUSTER", "$71.100", "BTC Core absorvendo pressão vendedora", ui.cyan],
              ["14:15", "PRESSÃO", "$70.750", "Pressão vendedora concentrada em $70.800", ui.red],
              ["14:08", "SUPORTE", "$71.420", "Suporte forte confirmado em $71.200", ui.green],
            ].map(([time, label, price, desc, color]) => (
              <div key={String(time)} style={{ display: "grid", gridTemplateColumns: "54px 1fr", gap: 10, alignItems: "center" }}>
                <div style={{ color: ui.mut, fontSize: 11 }}>{time}</div>
                <div style={{ borderRadius: 12, border: `1px solid ${color}55`, background: `${color}14`, padding: "12px 14px" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                    <span style={{ color: color as string, fontSize: 10, fontWeight: 900 }}>{label}</span>
                    <span style={{ color: color as string, fontSize: 14, fontWeight: 900 }}>{price}</span>
                  </div>
                  <div style={{ color: "#9bb0d2", fontSize: 13 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (tab === "Fluxo Institucional") {
      return (
        <div style={{ display: "grid", gap: 10, alignContent: "start", marginTop: -2 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ borderRadius: 14, border: `1px solid ${ui.green}55`, background: "rgba(10, 31, 24, 0.55)", padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ color: "#f1fbff", fontSize: 14, fontWeight: 900 }}>Cenário Alta</div>
                <div style={{ color: ui.green, fontSize: 20, fontWeight: 900 }}>93%</div>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden", marginBottom: 10 }}><div style={{ width: "93%", height: "100%", background: ui.green }} /></div>
              <div style={{ display: "grid", gap: 6 }}>
                {[['Alvo 1', '$91.672', ui.green], ['Alvo 2', '$99.732', ui.cyan], ['Stop Loss', '$83.887', ui.yellow]].map(([label, val, c]) => (
                  <div key={String(label)} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#8ea2c8' }}>{label}</span>
                    <span style={{ color: c as string, fontWeight: 900 }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ borderRadius: 14, border: `1px solid ${ui.red}55`, background: "rgba(31, 10, 20, 0.55)", padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ color: "#f1fbff", fontSize: 14, fontWeight: 900 }}>Cenário Baixa</div>
                <div style={{ color: ui.red, fontSize: 20, fontWeight: 900 }}>7%</div>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden", marginBottom: 10 }}><div style={{ width: "7%", height: "100%", background: ui.red }} /></div>
              <div style={{ display: "grid", gap: 6 }}>
                {[['Alvo 1', '$83.242', ui.red], ['Alvo 2', '$79.650', '#ff7e91'], ['Stop Loss', '$89.430', ui.yellow]].map(([label, val, c]) => (
                  <div key={String(label)} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#8ea2c8' }}>{label}</span>
                    <span style={{ color: c as string, fontWeight: 900 }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "0.74fr 0.92fr 0.74fr", gap: 10, alignItems: 'stretch' }}>
            <div style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)", background: "linear-gradient(180deg, rgba(9,15,29,0.98), rgba(7,12,24,0.98))", padding: 12 }}>
              <div style={{ color: "#edf5ff", fontSize: 14, fontWeight: 900, marginBottom: 8 }}>Sentimento do Mercado</div>
              <div style={{ height: 226, display: "grid", placeItems: "center" }}>
                <div style={{ width: 162, height: 162, borderRadius: '50%', border: '12px solid rgba(45,226,255,0.15)', borderTopColor: ui.yellow, borderRightColor: ui.green, borderBottomColor: '#ff008055', position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: 26, borderRadius: '50%', background: 'radial-gradient(circle, rgba(7,13,24,1), rgba(5,10,18,1))', display: 'grid', placeItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: ui.green, fontSize: 42, fontWeight: 900, lineHeight: 1 }}>59</div>
                      <div style={{ color: '#8ea2c8', fontSize: 13, marginTop: 6 }}>Ganância</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)", background: "linear-gradient(180deg, rgba(9,15,29,0.98), rgba(7,12,24,0.98))", padding: 12, display: "grid", gap: 8 }}>
              <div style={{ color: "#edf5ff", fontSize: 13, fontWeight: 900 }}>Fluxo Institucional</div>
              {[["🦈", "Tubarões", "-125M", false], ["🏛️", "Institucionais", "+582M", true], ["🐟", "Sardinhas", "+320M", true]].map(([icon, name, val, pos]) => (
                <div key={String(name)} style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", padding: 12, background: 'rgba(255,255,255,0.015)' }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ color: "#edf5ff", fontSize: 14, fontWeight: 900, display: 'flex', gap: 8, alignItems: 'center' }}><span>{icon}</span>{name}</span>
                    <span style={{ color: pos ? ui.green : ui.red, fontSize: 20, fontWeight: 900 }}>{val}</span>
                  </div>
                  <div style={{ height: 12, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden", display: "grid", gridTemplateColumns: "51fr 49fr", marginBottom: 6 }}>
                    <div style={{ background: ui.green }} />
                    <div style={{ background: '#ea4c89' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                    <span style={{ color: '#5ce4a2' }}>51% comprando</span>
                    <span style={{ color: '#ff7a97' }}>49% vendendo</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)", background: "linear-gradient(180deg, rgba(9,15,29,0.98), rgba(7,12,24,0.98))", padding: 12 }}>
              <div style={{ color: "#edf5ff", fontSize: 14, fontWeight: 900, marginBottom: 8 }}>Livro de Ofertas</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.8fr 0.9fr', color: '#6f88af', fontSize: 11, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: 6 }}>
                <span>Preço</span><span>Qtd</span><span>Total</span>
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {[
                  ['$87.026','0.666','$417K', ui.red], ['$85.869','6.538','$471K', ui.red], ['$87.886','4.878','$284K', ui.red], ['$87.627','6.447','$413K', ui.red], ['$87.318','10.774','$279K', ui.red],
                  ['$87.112','10.515','$365K', ui.green], ['$87.118','11.838','$194K', ui.green], ['$86.715','10.027','$280K', ui.green], ['$87.047','11.168','$70K', ui.green], ['$86.688','2.729','$321K', ui.green],
                ].map(([price, qty, total, c], idx) => (
                  <div key={String(price)+idx} style={{ display: 'grid', gridTemplateColumns: '1fr 0.8fr 0.9fr', fontSize: 13 }}>
                    <span style={{ color: c as string, fontWeight: 900 }}>{price}</span>
                    <span style={{ color: '#9bb0d2' }}>{qty}</span>
                    <span style={{ color: '#7086ad' }}>{total}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          ["Negativo", "Fed mantém taxa de juros em 5,25% - 5,50%", ui.red],
          ["Positivo", "BlackRock adiciona mais $2.1B em Bitcoin ETF", ui.green],
          ["Positivo", "Binance anuncia suporte para Ethereum Shanghai", ui.green],
          ["Neutro", "Regulação crypto na Europa: MiCA entra em vigor", ui.yellow],
        ].map(([tone, title, color]) => (
          <div key={String(title)} style={{ borderRadius: 14, border: `1px solid ${color}55`, background: "linear-gradient(180deg, rgba(9,15,29,0.98), rgba(7,12,24,0.98))", padding: 16, minHeight: 180 }}>
            <div style={{ color: color as string, fontSize: 11, fontWeight: 900, marginBottom: 10 }}>{tone}</div>
            <div style={{ color: "#f1fbff", fontSize: 18, fontWeight: 900, lineHeight: 1.2, marginBottom: 10 }}>{title}</div>
            <div style={{ color: "#8ea2c8", fontSize: 12, lineHeight: 1.5 }}>Análise IA Atlas integrada ao módulo de liquidez para leitura rápida do impacto no fluxo.</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ height: "100%", borderRadius: 12, border: `1px solid ${ui.border}`, background: "linear-gradient(180deg, rgba(7,10,19,0.98), rgba(5,8,15,0.98))", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ minHeight: 42, padding: "6px 14px", display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${ui.border}`, flexWrap: "wrap", flexShrink: 0 }}>
        <span style={{ color: "#f2f7ff", fontSize: 13, fontWeight: 900, marginRight: 6 }}>Liquidez Avançada</span>
        {LIQUIDITY_TABS.map((t) => (
          <TopButton key={t} active={tab === t} onClick={() => setTab(t)}>{t}</TopButton>
        ))}
      </div>

      <div
        style={{
          padding: 6,
          display: "grid",
          gap: tab === "Liquidez" ? 4 : 6,
          flex: 1,
          alignContent: "start",
          gridTemplateRows: tab === "Liquidez" ? "auto auto" : "auto 1fr",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 6, alignItems: "start", alignContent: "start" }}>
          <SmallStatCard title="Liquidez Superior" value="$72.200" sub="Bloco vendedor forte acima do preço atual." color={ui.yellow} />
          <SmallStatCard title="Liquidez Inferior" value="$69.800" sub="Absorção compradora ganhando espessura." color={ui.green} />
          <SmallStatCard title="Cluster Dominante" value="BTC Core" sub="Maior concentração institucional." color={ui.cyan} />
          <SmallStatCard title="Pressão Instantânea" value="+18.6%" sub="Fluxo favorecendo continuação curta." color={ui.green} />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.26fr 0.62fr",
            gap: 10,
            flex: tab === "Liquidez" ? "0 0 auto" : 1,
            minHeight: 0,
            alignItems: "start",
            marginTop: tab === "Liquidez" ? -2 : 0,
          }}
        >
          <div data-atlas-scroll="cyan" style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)", background: "linear-gradient(180deg, rgba(9,15,29,0.98), rgba(7,12,24,0.98))", padding: 8, overflowY: tab === "Liquidez" ? "visible" : "auto", scrollbarWidth: "thin", scrollbarColor: "rgba(45,226,255,0.55) rgba(255,255,255,0.04)", minHeight: tab === "Liquidez" ? "auto" : 0 }}>
            {renderMain()}
          </div>

          <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
            <div style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)", background: "linear-gradient(180deg, rgba(9,15,29,0.98), rgba(7,12,24,0.98))", padding: 12 }}>
              <div style={{ color: "#edf5ff", fontSize: 14, fontWeight: 900, marginBottom: 8 }}>Leitura rápida</div>
              <div style={{ display: "grid", gap: 10 }}>
                {[["Liquidez acima", "Pesada", ui.red],["Liquidez abaixo", "Saudável", ui.green],["Risco curto", "Controlado", ui.yellow],["Confluência", "8 / 9", ui.cyan],["Fluxo", "Positivo", ui.green],["Volatilidade", "Moderada", "#dce8ff"]].map(([k, v, c]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ color: "#8ea2c8", fontSize: 13 }}>{k}</span>
                    <span style={{ color: c as string, fontSize: 13, fontWeight: 900 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)", background: "linear-gradient(180deg, rgba(9,15,29,0.98), rgba(7,12,24,0.98))", padding: 12 }}>
              <div style={{ color: "#edf5ff", fontSize: 14, fontWeight: 900, marginBottom: 8 }}>IA Análise</div>
              <div style={{ color: "#8ea2c8", fontSize: 13, lineHeight: 1.7 }}>Cenário favorece continuação de alta. Confluência de 8/9 indicadores positivos. Liquidez superior em $72.200 é o próximo alvo.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function clampPoint(point: DrawPoint, width: number, height: number): DrawPoint {
  return { x: clamp(point.x, 0, width), y: clamp(point.y, 0, height) };
}

function toolDisplayName(tool: ToolKey) {
  const map: Record<ToolKey, string> = {
    cursor: "Cursor",
    point: "Ponto",
    marker: "Marcador",
    trendLine: "Linha",
    ray: "Raio",
    arrow: "Seta",
    horizontal: "Horizontal",
    vertical: "Vertical",
    parallelChannel: "Canal Paralelo",
    regressionChannel: "Canal Regressão",
    range: "Faixa",
    grid: "Grid",
    pitchfork: "Pitchfork",
    gannBox: "Gann Box",
    gannSquare: "Gann Square",
    fibRetracement: "Fib Retracement",
    fibProjection: "Fib Projection",
  };
  return map[tool];
}

function makeDrawObject(tool: ToolKey, point: DrawPoint): DrawObject {
  const id = `${tool}-${Math.random().toString(36).slice(2, 9)}`;
  const second = { x: point.x + 120, y: point.y + 60 };
  const third = { x: point.x + 60, y: point.y - 50 };
  switch (tool) {
    case "point":
    case "marker":
    case "horizontal":
    case "vertical":
      return { id, name: toolDisplayName(tool), type: tool, points: [point] };
    case "pitchfork":
      return { id, name: toolDisplayName(tool), type: tool, points: [point, second, third] };
    default:
      return { id, name: toolDisplayName(tool), type: tool, points: [point, second] };
  }
}

function drawObjectSvg(obj: DrawObject, isSelected: boolean, width: number, height: number) {
  if (obj.hidden) return null;
  const stroke = isSelected ? "#f7c948" : "#2de2ff";
  const fill = isSelected ? "rgba(247,201,72,0.12)" : "rgba(45,226,255,0.10)";
  const p1 = obj.points[0];
  const p2 = obj.points[1] ?? p1;
  const p3 = obj.points[2] ?? { x: (p1.x + p2.x) / 2, y: p1.y - 60 };
  const minX = Math.min(p1.x, p2.x);
  const maxX = Math.max(p1.x, p2.x);
  const minY = Math.min(p1.y, p2.y);
  const maxY = Math.max(p1.y, p2.y);
  const common = { stroke, strokeWidth: isSelected ? 2.3 : 1.6, fill: 'none' } as const;

  switch (obj.type) {
    case "point":
      return <circle cx={p1.x} cy={p1.y} r={5} fill={stroke} stroke="rgba(255,255,255,0.6)" strokeWidth={1} />;
    case "marker":
      return <circle cx={p1.x} cy={p1.y} r={10} fill={fill} stroke={stroke} strokeWidth={2} />;
    case "trendLine":
      return <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} {...common} />;
    case "ray": {
      const dx = p2.x - p1.x || 1;
      const dy = p2.y - p1.y;
      const scale = (width - p1.x) / dx;
      return <line x1={p1.x} y1={p1.y} x2={clamp(p1.x + dx * scale, 0, width)} y2={clamp(p1.y + dy * scale, 0, height)} {...common} />;
    }
    case "arrow":
      return (
        <g>
          <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} {...common} />
          <polygon points={`${p2.x},${p2.y} ${p2.x - 12},${p2.y - 6} ${p2.x - 8},${p2.y + 8}`} fill={stroke} />
        </g>
      );
    case "horizontal":
      return <line x1={0} y1={p1.y} x2={width} y2={p1.y} {...common} strokeDasharray="5 5" />;
    case "vertical":
      return <line x1={p1.x} y1={0} x2={p1.x} y2={height} {...common} strokeDasharray="5 5" />;
    case "parallelChannel":
    case "regressionChannel": {
      const offset = obj.type === 'regressionChannel' ? 44 : 34;
      return (
        <g>
          <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} {...common} />
          <line x1={p1.x} y1={p1.y + offset} x2={p2.x} y2={p2.y + offset} {...common} />
          <line x1={p1.x} y1={p1.y} x2={p1.x} y2={p1.y + offset} {...common} strokeDasharray="4 4" />
          <line x1={p2.x} y1={p2.y} x2={p2.x} y2={p2.y + offset} {...common} strokeDasharray="4 4" />
        </g>
      );
    }
    case "range":
    case "gannBox":
    case "gannSquare":
      return (
        <g>
          <rect x={minX} y={minY} width={Math.max(18, maxX - minX)} height={Math.max(18, maxY - minY)} rx={obj.type==='gannSquare'?0:8} fill={fill} stroke={stroke} strokeWidth={1.8} />
          {(obj.type === 'gannBox' || obj.type === 'gannSquare') && <line x1={minX} y1={minY} x2={maxX} y2={maxY} {...common} />}
        </g>
      );
    case "grid":
      return (
        <g>
          <rect x={minX} y={minY} width={Math.max(18, maxX - minX)} height={Math.max(18, maxY - minY)} fill="transparent" stroke={stroke} strokeWidth={1.4} />
          {Array.from({ length: 4 }).map((_, i) => <line key={`v${i}`} x1={minX + ((maxX - minX) / 4) * i} y1={minY} x2={minX + ((maxX - minX) / 4) * i} y2={maxY} {...common} strokeDasharray="3 5" />)}
          {Array.from({ length: 4 }).map((_, i) => <line key={`h${i}`} x1={minX} y1={minY + ((maxY - minY) / 4) * i} x2={maxX} y2={minY + ((maxY - minY) / 4) * i} {...common} strokeDasharray="3 5" />)}
        </g>
      );
    case "pitchfork":
      return (
        <g>
          <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} {...common} />
          <line x1={p1.x} y1={p1.y} x2={p3.x} y2={p3.y} {...common} />
          <line x1={p2.x} y1={p2.y} x2={p3.x} y2={p3.y} {...common} />
        </g>
      );
    case "fibRetracement": {
      const levels = [0, 0.236, 0.382, 0.5, 0.618, 1];
      return <g>{levels.map((lvl) => { const y = minY + (maxY - minY) * lvl; return <line key={lvl} x1={minX} y1={y} x2={maxX} y2={y} {...common} strokeDasharray="5 4" />; })}</g>;
    }
    case "fibProjection":
      return (
        <g>
          <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} {...common} />
          <line x1={p2.x} y1={p2.y} x2={clamp(p2.x + (p2.x - p1.x), 0, width)} y2={clamp(p2.y + (p2.y - p1.y), 0, height)} {...common} strokeDasharray="6 5" />
        </g>
      );
    default:
      return null;
  }
}

function ChartPanel({
  candles,
  indicators,
  objects,
  selectedObject,
  selectedId,
  activeTool,
  mode,
  symbol,
  timeframe,
  onSelectObject,
  onAddObject,
  onUpdateObject,
  onToggleLocked,
  onToggleHidden,
  onClearAll,
  onDeleteSelected,
}: {
  candles: CandleData[];
  indicators: IndicatorData[];
  objects: DrawObject[];
  selectedObject: DrawObject | null;
  selectedId: string | null;
  activeTool: ToolKey;
  mode: ModeKey;
  symbol: string;
  timeframe: Timeframe;
  onSelectObject: (id: string | null) => void;
  onAddObject: (obj: DrawObject) => void;
  onUpdateObject: (id: string, updater: (obj: DrawObject) => DrawObject) => void;
  onToggleLocked: () => void;
  onToggleHidden: () => void;
  onClearAll: () => void;
  onDeleteSelected: () => void;
}) {
  const mainRef = useRef<HTMLDivElement>(null);
  const volOverlayRef = useRef<HTMLDivElement>(null);
  const rsiRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<SVGSVGElement>(null);
  const dragStateRef = useRef<{ id: string; last: DrawPoint } | null>(null);

  const [livePrice, setLivePrice] = useState<number>(candles[candles.length - 1]?.close ?? 0);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [overlaySize, setOverlaySize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!mainRef.current || !volOverlayRef.current || !rsiRef.current) return;

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
    const ma50 = mc.addLineSeries({ color: "#8b5cf6", lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
    ma50.setData(computeSMA(candles, 50).map((d) => ({ time: d.time as Time, value: d.value })));
    const ema100 = mc.addLineSeries({ color: "#22d3ee", lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
    ema100.setData(computeEMA(candles, 100).map((d) => ({ time: d.time as Time, value: d.value })));
    mc.timeScale().fitContent();

    const last = candles[candles.length - 1];
    const prev = candles[candles.length - 2] ?? last;
    setLivePrice(last.close);
    setPriceChange(((last.close - prev.close) / prev.close) * 100);

    const vc: IChartApi = createChart(volOverlayRef.current, {
      ...baseChartOpts,
      width: volOverlayRef.current.clientWidth,
      height: volOverlayRef.current.clientHeight,
      rightPriceScale: { visible: false, borderColor: "rgba(255,255,255,0)" },
      timeScale: { visible: false, borderColor: "rgba(255,255,255,0)" },
      grid: { vertLines: { color: "rgba(255,255,255,0)", style: 1 as const }, horzLines: { color: "rgba(255,255,255,0)", style: 1 as const } },
    });

    const volSeries = vc.addHistogramSeries({ priceScaleId: "" });
    volSeries.setData(candles.map((c) => ({ time: c.time as Time, value: c.volume, color: c.close >= c.open ? "rgba(55,244,173,0.42)" : "rgba(255,108,141,0.42)" })));
    vc.timeScale().fitContent();

    const rc: IChartApi = createChart(rsiRef.current, {
      ...baseChartOpts,
      width: rsiRef.current.clientWidth,
      height: rsiRef.current.clientHeight,
    });

    const rsiSeries = rc.addLineSeries({ color: "#8b5cf6", lineWidth: 2, priceLineVisible: false, lastValueVisible: false });
    const mfiSeries = rc.addLineSeries({ color: "#d2b000", lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
    rsiSeries.setData(indicators.map((d) => ({ time: d.time as Time, value: clamp(d.rsi, 0, 100) })));
    mfiSeries.setData(indicators.map((d) => ({ time: d.time as Time, value: clamp(d.mfi, 0, 100) })));
    rc.timeScale().fitContent();

    mc.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (range !== null) {
        vc.timeScale().setVisibleLogicalRange(range);
        rc.timeScale().setVisibleLogicalRange(range);
      }
    });

    const resize = () => {
      if (mainRef.current) {
        mc.applyOptions({ width: mainRef.current.clientWidth, height: mainRef.current.clientHeight });
        setOverlaySize({ width: mainRef.current.clientWidth, height: mainRef.current.clientHeight });
      }
      if (volOverlayRef.current) vc.applyOptions({ width: volOverlayRef.current.clientWidth, height: volOverlayRef.current.clientHeight });
      if (rsiRef.current) rc.applyOptions({ width: rsiRef.current.clientWidth, height: rsiRef.current.clientHeight });
    };

    resize();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      mc.remove();
      vc.remove();
      rc.remove();
    };
  }, [candles, indicators]);

  const isPositive = priceChange >= 0;
  const visibleObjectCount = objects.filter((o) => !o.hidden).length;
  const overlayInteractive = activeTool !== "cursor" || (!!selectedObject && !selectedObject.locked && !selectedObject.hidden);

  const getRelativePoint = (e: React.MouseEvent<SVGSVGElement>): DrawPoint => {
    const rect = e.currentTarget.getBoundingClientRect();
    return clampPoint({ x: e.clientX - rect.left, y: e.clientY - rect.top }, overlaySize.width, overlaySize.height);
  };

  const onOverlayMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const point = getRelativePoint(e);
    if (activeTool !== "cursor") {
      const obj = makeDrawObject(activeTool, point);
      onAddObject(obj);
      onSelectObject(obj.id);
      dragStateRef.current = { id: obj.id, last: point };
      return;
    }
    if (selectedObject && !selectedObject.locked && !selectedObject.hidden) {
      dragStateRef.current = { id: selectedObject.id, last: point };
    }
  };

  const onOverlayMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const drag = dragStateRef.current;
    if (!drag) return;
    const point = getRelativePoint(e);
    const dx = point.x - drag.last.x;
    const dy = point.y - drag.last.y;
    dragStateRef.current = { ...drag, last: point };
    onUpdateObject(drag.id, (obj) => ({
      ...obj,
      points: obj.points.map((p, idx) => {
        const next = activeTool !== "cursor" && idx === obj.points.length - 1
          ? clampPoint(point, overlaySize.width, overlaySize.height)
          : clampPoint({ x: p.x + dx, y: p.y + dy }, overlaySize.width, overlaySize.height);
        return next;
      }),
    }));
  };

  const onOverlayMouseUp = () => {
    dragStateRef.current = null;
    if (activeTool !== "cursor") {
      // stay on tool so user can keep drawing, but release chart immediately after mouseup
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", minWidth: 0, background: "linear-gradient(180deg, rgba(7,12,24,0.98), rgba(6,10,18,0.98))" }}>
      <div style={{ padding: "8px 10px", borderBottom: `1px solid ${ui.border}`, background: "linear-gradient(180deg, rgba(12,19,36,0.94), rgba(8,13,25,0.94))" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr repeat(4, 0.7fr) auto", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, background: "rgba(247,201,72,0.16)", color: ui.yellow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900 }}>SC</div>
            <div>
              <div style={{ color: "#eef6ff", fontSize: 14, fontWeight: 900 }}>{symbol}</div>
              <div style={{ color: "#7d91b6", fontSize: 10, fontWeight: 700 }}>Scanner Atlas • Pasta: Ferramentas • Item: {toolDisplayName(activeTool)} • TF: {timeframe}</div>
            </div>
          </div>
          {[
            ["Preço", livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), "#4ef0cb"],
            ["Variação", `${isPositive ? "+" : ""}${priceChange.toFixed(2)}%`, isPositive ? ui.green : ui.red],
            ["Volume", formatCompact(candles[candles.length - 1]?.volume ?? 0), ui.cyan],
            ["Desenhos", String(visibleObjectCount), visibleObjectCount ? ui.yellow : ui.red],
          ].map(([title, value, color]) => (
            <div key={title} style={{ borderRadius: 13, border: "1px solid rgba(255,255,255,0.06)", background: "linear-gradient(180deg, rgba(8,15,31,0.98), rgba(7,12,24,0.96))", minHeight: 58, padding: "10px 13px" }}>
              <div style={{ color: "#7f93b7", fontSize: 9, fontWeight: 900, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6 }}>{title}</div>
              <div style={{ color: color as string, fontSize: 12, fontWeight: 900 }}>{value}</div>
            </div>
          ))}
          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
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

      <div style={{ height: 32, padding: "0 10px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${ui.border}`, background: "rgba(255,255,255,0.015)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <TopButton active={activeTool === 'cursor'}>Objetos</TopButton>
          <TopButton onClick={onToggleLocked}>Travar</TopButton>
          <TopButton onClick={onToggleHidden}>Ocultar</TopButton>
          <TopButton onClick={onClearAll}>Limpar desenhos</TopButton>
          <TopButton onClick={onDeleteSelected}>Apagar selecionado</TopButton>
        </div>
        <div style={{ color: "#7f93b7", fontSize: 10, fontWeight: 800 }}>
          {selectedObject ? `${selectedObject.name} • ${selectedObject.type}${selectedObject.locked ? ' • travado' : ''}${selectedObject.hidden ? ' • oculto' : ''}` : `Ferramenta ativa: ${toolDisplayName(activeTool)}`}
        </div>
      </div>

      <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
        <div ref={mainRef} style={{ position: "absolute", inset: 0 }} />
        <svg
          ref={overlayRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${Math.max(overlaySize.width, 1)} ${Math.max(overlaySize.height, 1)}`}
          preserveAspectRatio="none"
          onMouseDown={overlayInteractive ? onOverlayMouseDown : undefined}
          onMouseMove={overlayInteractive ? onOverlayMouseMove : undefined}
          onMouseUp={overlayInteractive ? onOverlayMouseUp : undefined}
          onMouseLeave={overlayInteractive ? onOverlayMouseUp : undefined}
          style={{ position: "absolute", inset: 0, pointerEvents: overlayInteractive ? 'auto' : 'none', cursor: activeTool === 'cursor' ? (selectedObject && !selectedObject.locked ? 'grab' : 'default') : 'crosshair' }}
        >
          {objects.map((obj) => (
            <g key={obj.id} onMouseDown={(e) => {
              if (activeTool !== 'cursor') return;
              if (obj.hidden) return;
              e.stopPropagation();
              onSelectObject(obj.id);
              if (!obj.locked) dragStateRef.current = { id: obj.id, last: getRelativePoint(e as React.MouseEvent<SVGSVGElement>) };
            }}>
              {drawObjectSvg(obj, obj.id === selectedId, overlaySize.width, overlaySize.height)}
            </g>
          ))}
        </svg>
        <div ref={volOverlayRef} style={{ position: "absolute", left: 0, right: 0, bottom: 112, height: 110, pointerEvents: "none", opacity: 0.96 }} />
      </div>

      <div style={{ borderTop: `1px solid ${ui.border}`, background: "linear-gradient(180deg, rgba(9,14,26,0.98), rgba(6,10,18,0.98))" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderBottom: `1px solid ${ui.border}` }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#dce8ff", fontSize: 10 }}><span style={{ width: 12, height: 2, background: "#8b5cf6", display: "inline-block" }} />RSI</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#dce8ff", fontSize: 10 }}><span style={{ width: 12, height: 2, background: "#d2b000", display: "inline-block" }} />MFI</span>
        </div>
        <div ref={rsiRef} style={{ height: 112, width: "100%" }} />
      </div>
    </div>
  );
}

function FluxoModule({ events }: { events: ScannerEvent[] }) {
  return (
    <div style={{ height: "100%", padding: 10 }}>
      <div style={{ display: "grid", gap: 10, height: "100%" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          <SmallStatCard title="Fluxo Agressor" value="Comprador" sub="Agressão mantendo pressão positiva." color={ui.green} />
          <SmallStatCard title="Absorção" value="Ativa" sub="Vendas sendo consumidas com firmeza." color={ui.cyan} />
          <SmallStatCard title="Desequilíbrio" value="+18.6%" sub="Continuação favorecida no curto prazo." color={ui.yellow} />
        </div>
        <div style={{ minHeight: 0, flex: 1 }}>
          <EventRealtimePanel events={events} />
        </div>
      </div>
    </div>
  );
}

function EulerModule({ insight }: { insight: AIInsight }) {
  const bars = [52, 74, 61, 88, 46, 67, 58, 82, 49, 71, 63, 91, 56, 69];
  const line1 = Array.from({ length: 40 }, (_, i) => {
    const x = (i / 39) * 860;
    const y = 168 + Math.sin(i / 3.2) * 24 + Math.cos(i / 5.5) * 14;
    return `${x},${y}`;
  }).join(" ");
  const line2 = Array.from({ length: 40 }, (_, i) => {
    const x = (i / 39) * 860;
    const y = 192 + Math.cos(i / 3.8) * 28 + Math.sin(i / 6.2) * 10;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div style={{ height: "100%", padding: 10, background: "linear-gradient(180deg, rgba(5,8,16,0.98), rgba(2,6,14,0.98))" }}>
      <div
        style={{
          height: "100%",
          borderRadius: 14,
          border: "1px solid rgba(45,226,255,0.12)",
          background: "linear-gradient(180deg, rgba(4,10,20,0.98), rgba(2,6,12,0.98))",
          overflow: "hidden",
          display: "grid",
          gridTemplateRows: "auto auto 1fr auto",
          gap: 10,
          padding: 10,
          boxShadow: "0 0 30px rgba(45,226,255,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 4px 0" }}>
          <div>
            <div style={{ color: "#eef6ff", fontSize: 15, fontWeight: 900, letterSpacing: 0.6 }}>Euler Quantum Interface</div>
            <div style={{ color: "#6f88af", fontSize: 10, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase" }}>
              Scientific module • atlas sync active
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <TopButton active>Σ Fórmula</TopButton>
            <TopButton>Sync</TopButton>
            <span
              style={{
                color: ui.cyan,
                fontSize: 10,
                fontWeight: 900,
                padding: "4px 8px",
                borderRadius: 999,
                background: "rgba(45,226,255,0.10)",
                border: "1px solid rgba(45,226,255,0.18)",
              }}
            >
              Módulo Ativo
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          <SmallStatCard title="Euler Core" value="Sincronizado" sub="Proporção e estrutura conversando bem." color={ui.cyan} accent="rgba(45,226,255,0.18)" />
          <SmallStatCard title="Geometria" value="Limpa" sub="Movimento com boa leitura estrutural." color={ui.yellow} accent="rgba(247,201,72,0.16)" />
          <SmallStatCard title="Pressão" value="Moderada" sub="Sem distorção excessiva no momento." color={ui.green} accent="rgba(39,245,157,0.14)" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.28fr 0.72fr", gap: 10, minHeight: 0 }}>
          <div
            style={{
              borderRadius: 14,
              border: "1px solid rgba(45,226,255,0.12)",
              background:
                "radial-gradient(circle at 50% 0%, rgba(45,226,255,0.08), transparent 35%), linear-gradient(180deg, rgba(6,12,24,0.98), rgba(3,7,14,0.98))",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "12px 14px 8px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ color: "#eff7ff", fontSize: 13, fontWeight: 900 }}>Euler Data Stream</div>
                <div style={{ color: "#6f88af", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {insight.symbol} • previsão estrutural
                </div>
              </div>
              <div style={{ color: ui.yellow, fontSize: 12, fontWeight: 900 }}>Score {insight.score}</div>
            </div>

            <div style={{ padding: 12, height: "calc(100% - 58px)" }}>
              <svg width="100%" height="100%" viewBox="0 0 860 330" preserveAspectRatio="none">
                {Array.from({ length: 8 }, (_, i) => (
                  <line key={`h-${i}`} x1="0" y1={i * 45} x2="860" y2={i * 45} stroke="rgba(255,255,255,0.045)" strokeWidth="1" />
                ))}
                {Array.from({ length: 15 }, (_, i) => (
                  <line key={`v-${i}`} x1={i * 61.4} y1="0" x2={i * 61.4} y2="330" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                ))}

                {bars.map((h, i) => {
                  const x = 26 + i * 56;
                  return (
                    <rect
                      key={i}
                      x={x}
                      y={300 - h}
                      width="22"
                      height={h}
                      rx="4"
                      fill={i % 2 === 0 ? "rgba(45,226,255,0.38)" : "rgba(247,201,72,0.28)"}
                    />
                  );
                })}

                <polyline points={line1} fill="none" stroke={ui.cyan} strokeWidth="2.2" />
                <polyline points={line2} fill="none" stroke={ui.yellow} strokeWidth="1.8" opacity="0.92" />
              </svg>
            </div>
          </div>

          <div
            style={{
              borderRadius: 14,
              border: "1px solid rgba(45,226,255,0.12)",
              background: "linear-gradient(180deg, rgba(7,12,24,0.98), rgba(3,7,14,0.98))",
              padding: 12,
            }}
          >
            <div style={{ color: "#edf6ff", fontSize: 13, fontWeight: 900, marginBottom: 10 }}>
              Leitura do Módulo
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              {[
                ["Ativo", insight.symbol, "#dce8ff"],
                ["Score", `${insight.score}`, ui.green],
                ["Sinal", insight.signal, ui.yellow],
                ["Risco", insight.riskLevel, ui.red],
                ["Liquidez", insight.structure[2]?.value || "Médio", ui.cyan],
                ["Euler", insight.structure2[0]?.value || "Estável", ui.green],
              ].map(([k, v, c]) => (
                <div
                  key={k}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <span style={{ color: "#8ea2c8", fontSize: 13 }}>{k}</span>
                  <span style={{ color: c as string, fontSize: 13, fontWeight: 900 }}>{v}</span>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 14,
                borderRadius: "50%",
                width: 120,
                height: 120,
                marginInline: "auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  "radial-gradient(circle at 50% 50%, rgba(45,226,255,0.22), rgba(45,226,255,0.05) 55%, transparent 72%)",
                border: "1px solid rgba(45,226,255,0.16)",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ color: ui.cyan, fontSize: 28, fontWeight: 900 }}>{insight.score}</div>
                <div
                  style={{
                    color: "#7f93b7",
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: 0.8,
                    textTransform: "uppercase",
                    marginTop: 4,
                  }}
                >
                  Sincronia
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          <SmallStatCard title="Preço Atual" value={`$${insight.price.toLocaleString()}`} color={ui.cyan} />
          <SmallStatCard title="Previsão Euler" value={`$${(insight.price * 1.018).toLocaleString()}`} color={ui.yellow} />
          <SmallStatCard title="Vol. Médio" value="1.24M" color={ui.green} />
          <SmallStatCard title="Máxima" value={`$${(insight.price * 1.032).toLocaleString()}`} color="#dce8ff" />
        </div>
      </div>
    </div>
  );
}

function SingularidadeModule({ insight }: { insight: AIInsight }) {
  const bars = [44, 58, 51, 29, 35, 48, 31, 60, 26, 55, 47, 38, 25, 24, 37, 32, 41, 22];
  const line1 = Array.from({ length: 36 }, (_, i) => {
    const x = (i / 35) * 860;
    const y = 130 + Math.sin(i / 4.8) * 20 + Math.cos(i / 7.2) * 10;
    return `${x},${y}`;
  }).join(" ");
  const line2 = Array.from({ length: 36 }, (_, i) => {
    const x = (i / 35) * 860;
    const y = 190 + Math.cos(i / 5.4) * 16 + Math.sin(i / 8.4) * 8;
    return `${x},${y}`;
  }).join(" ");

  const liveList = [
    ["BTC", "$66,374.82", "+2.76%"],
    ["ETH", "$3,931.95", "+2.58%"],
    ["SOL", "$174.80", "+3.06%"],
    ["ADA", "$0.6186", "+5.05%"],
    ["DOT", "$8.4004", "+0.35%"],
  ];

  const singSignal = insight.signal === "COMPRA" ? "Neutro" : insight.signal;
  const singSignalColor = insight.signal === "COMPRA" ? ui.cyan : ui.yellow;

  return (
    <div style={{ height: "100%", padding: 10, background: "linear-gradient(180deg, rgba(4,7,14,0.98), rgba(2,5,10,0.98))" }}>
      <div
        style={{
          height: "100%",
          borderRadius: 14,
          border: "1px solid rgba(0,214,255,0.12)",
          background: "linear-gradient(180deg, rgba(4,8,18,0.98), rgba(2,5,10,0.98))",
          overflow: "hidden",
          display: "grid",
          gridTemplateRows: "auto auto 1fr auto",
          gap: 10,
          padding: 10,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "linear-gradient(rgba(0,214,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,214,255,0.02) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            opacity: 0.35,
          }}
        />

        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 4px 0" }}>
          <div>
            <div style={{ color: "#eaf6ff", fontSize: 15, fontWeight: 900, letterSpacing: 0.8 }}>Singularidade Terminal</div>
            <div style={{ color: "#6883aa", fontSize: 10, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase" }}>
              Quantum state monitor
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ color: "#00ff9d", fontSize: 10, fontWeight: 900, letterSpacing: 0.7, textTransform: "uppercase" }}>
              • Ao vivo
            </span>
            <span
              style={{
                color: ui.cyan,
                fontSize: 10,
                fontWeight: 900,
                padding: "4px 8px",
                borderRadius: 999,
                background: "rgba(0,214,255,0.08)",
                border: "1px solid rgba(0,214,255,0.16)",
              }}
            >
              Módulo Ativo
            </span>
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          <SmallStatCard title="Pulso" value={insight.score >= 78 ? "Elevado" : insight.score >= 58 ? "Moderado" : "Baixo"} sub="Motor matemático em leitura viva." color={ui.cyan2} />
          <SmallStatCard title="Ruído" value={insight.score >= 72 ? "Baixo" : insight.score >= 50 ? "Moderado" : "Elevado"} sub="Leitura mais limpa do movimento." color={ui.yellow} />
          <SmallStatCard title="Fase" value={insight.score >= 75 ? "Expansão" : insight.score >= 55 ? "Transição" : "Neutro"} sub="Contexto de aceleração controlada." color={ui.magenta} />
        </div>

        <div style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "1.24fr 0.76fr", gap: 10, minHeight: 0 }}>
          <div style={{ display: "grid", gridTemplateRows: "1fr auto", gap: 10, minHeight: 0 }}>
            <div
              style={{
                borderRadius: 14,
                border: "1px solid rgba(0,214,255,0.12)",
                background: "linear-gradient(180deg, rgba(5,11,22,0.98), rgba(3,7,14,0.98))",
                overflow: "hidden",
                minHeight: 0,
              }}
            >
              <div
                style={{
                  padding: "12px 14px 8px",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#eef7ff", fontSize: 13, fontWeight: 900 }}>Singularidade</span>
                  <span
                    style={{
                      color: ui.magenta,
                      fontSize: 10,
                      fontWeight: 900,
                      padding: "3px 8px",
                      borderRadius: 999,
                      background: "rgba(255,79,163,0.10)",
                      border: "1px solid rgba(255,79,163,0.16)",
                    }}
                  >
                    {insight.price.toLocaleString()}
                  </span>
                </div>

                <span
                  style={{
                    color: ui.cyan,
                    fontSize: 10,
                    fontWeight: 900,
                    padding: "4px 10px",
                    borderRadius: 999,
                    background: "rgba(0,214,255,0.08)",
                    border: "1px solid rgba(0,214,255,0.16)",
                  }}
                >
                  Atlas Sync
                </span>
              </div>

              <div style={{ padding: 12, height: "calc(100% - 52px)" }}>
                <svg width="100%" height="100%" viewBox="0 0 860 320" preserveAspectRatio="none">
                  {Array.from({ length: 7 }, (_, i) => (
                    <line key={`h-${i}`} x1="0" y1={i * 45} x2="860" y2={i * 45} stroke="rgba(255,255,255,0.035)" strokeWidth="1" />
                  ))}
                  {Array.from({ length: 14 }, (_, i) => (
                    <line key={`v-${i}`} x1={i * 66} y1="0" x2={i * 66} y2="320" stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
                  ))}

                  {bars.map((h, i) => {
                    const x = 18 + i * 44;
                    return <rect key={i} x={x} y={280 - h} width="24" height={h} rx="3" fill="rgba(0,214,255,0.38)" />;
                  })}

                  <polyline points={line1} fill="none" stroke="#00eaff" strokeWidth="2.4" />
                  <polyline points={line2} fill="none" stroke="#d7a100" strokeWidth="1.8" opacity="0.9" strokeDasharray="6 4" />
                </svg>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "0.86fr 1fr 1fr", gap: 10 }}>
              <div
                style={{
                  borderRadius: 14,
                  border: "1px solid rgba(0,214,255,0.12)",
                  background: "linear-gradient(180deg, rgba(5,11,22,0.98), rgba(3,7,14,0.98))",
                  padding: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      color: "#6f88af",
                      fontSize: 10,
                      fontWeight: 900,
                      letterSpacing: 0.7,
                      textTransform: "uppercase",
                      marginBottom: 14,
                    }}
                  >
                    Índice Singular
                  </div>

                  <div
                    style={{
                      width: 108,
                      height: 108,
                      borderRadius: "50%",
                      margin: "0 auto",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "conic-gradient(#00ff9d 0deg, #00ff9d 290deg, rgba(255,255,255,0.08) 290deg 360deg)",
                      padding: 8,
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        background: "#06101b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "column",
                      }}
                    >
                      <span style={{ color: "#00ff9d", fontSize: 18, fontWeight: 900 }}>{insight.score}</span>
                      <span style={{ color: "#7f93b7", fontSize: 10 }}>Excelente</span>
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  borderRadius: 14,
                  border: "1px solid rgba(0,214,255,0.12)",
                  background: "linear-gradient(180deg, rgba(5,11,22,0.98), rgba(3,7,14,0.98))",
                  padding: 14,
                }}
              >
                <div style={{ color: "#edf7ff", fontSize: 13, fontWeight: 900, marginBottom: 12 }}>
                  Mercado Live
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  {liveList.map(([sym, price, change]) => (
                    <div
                      key={sym}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        paddingBottom: 8,
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <div>
                        <div style={{ color: "#edf6ff", fontSize: 12, fontWeight: 900 }}>{sym}</div>
                        <div style={{ color: "#6f88af", fontSize: 10 }}>Mercado spot</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: "#dce8ff", fontSize: 12, fontWeight: 800 }}>{price}</div>
                        <div style={{ color: "#00ff9d", fontSize: 11, fontWeight: 900 }}>{change}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  borderRadius: 14,
                  border: "1px solid rgba(0,214,255,0.12)",
                  background: "linear-gradient(180deg, rgba(5,11,22,0.98), rgba(3,7,14,0.98))",
                  padding: 14,
                  display: "grid",
                  alignContent: "start",
                  gap: 10,
                }}
              >
                <div style={{ color: "#edf7ff", fontSize: 13, fontWeight: 900 }}>Métricas</div>
                {[
                  ["Momentum", "78.4%", ui.cyan],
                  ["Proteção", "92%", "#00ff9d"],
                  ["Volatilidade", "34.2", ui.yellow],
                  ["Desvio", "1.82", ui.magenta],
                ].map(([k, v, c]) => (
                  <div
                    key={k}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <span style={{ color: "#7f93b7", fontSize: 13 }}>{k}</span>
                    <span style={{ color: c as string, fontSize: 13, fontWeight: 900 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              borderRadius: 14,
              border: "1px solid rgba(0,214,255,0.12)",
              background: "linear-gradient(180deg, rgba(5,11,22,0.98), rgba(3,7,14,0.98))",
              padding: 12,
              overflowY: "auto",
            }}
          >
            <div
              style={{
                color: "#edf7ff",
                fontSize: 13,
                fontWeight: 900,
                marginBottom: 12,
                textTransform: "uppercase",
                letterSpacing: 0.7,
              }}
            >
              Leitura do módulo
            </div>

            <div
              style={{
                borderRadius: 12,
                border: "1px solid rgba(0,214,255,0.10)",
                background: "linear-gradient(180deg, rgba(6,14,24,0.98), rgba(5,10,20,0.98))",
                padding: 14,
                marginBottom: 12,
                minHeight: 108,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ color: ui.magenta, fontSize: 32, fontWeight: 900 }}>
                  {Math.max(4, Math.round(insight.score / 20))}
                </div>
                <div
                  style={{
                    color: "#7f93b7",
                    fontSize: 10,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: 0.7,
                    marginTop: 6,
                  }}
                >
                  Score
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              {[
                ["Ativo", insight.symbol, "#dce8ff"],
                ["Sinal", singSignal, singSignalColor],
                ["Risco", "Alto", ui.red],
                ["Liquidez", "Inativo", "#8b97ad"],
                ["Euler", "Desalinhado", ui.magenta],
              ].map(([k, v, c]) => (
                <div
                  key={k}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <span style={{ color: "#7f93b7", fontSize: 13 }}>{k}</span>
                  <span style={{ color: c as string, fontSize: 13, fontWeight: 900 }}>{v}</span>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 14,
                borderRadius: 12,
                height: 82,
                border: "1px solid rgba(255,255,255,0.05)",
                background:
                  "radial-gradient(circle at 50% 50%, rgba(255,79,163,0.12), rgba(0,214,255,0.06), transparent 70%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#647da3",
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Campo quântico ativo
            </div>
          </div>
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 1,
            height: 40,
            borderRadius: 10,
            border: "1px solid rgba(0,214,255,0.10)",
            background: "rgba(0,0,0,0.28)",
            display: "flex",
            alignItems: "center",
            overflow: "hidden",
            padding: "0 12px",
            gap: 18,
          }}
        >
          {[
            ["ETH", "$3,482", "+1.12%", "#00ff9d"],
            ["SOL", "$187.40", "-0.87%", "#ff4fa3"],
            ["BNB", "$612.38", "+0.43%", "#00ff9d"],
            ["ADA", "$0.847", "+3.21%", "#00ff9d"],
            ["DOT", "$9.34", "-1.05%", "#ff4fa3"],
            ["AVAX", "$42.18", "+4.78%", "#00ff9d"],
            ["MATIC", "$1.23", "+0.93%", "#00ff9d"],
          ].map(([sym, price, change, color]) => (
            <div
              key={sym}
              style={{ display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", fontSize: 11 }}
            >
              <span style={{ color: ui.cyan, fontWeight: 900 }}>{sym}</span>
              <span style={{ color: "#dce8ff" }}>{price}</span>
              <span style={{ color: color as string, fontWeight: 900 }}>{change}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function IAAtlasModule({ insight }: { insight: AIInsight }) {
  const probUp = Math.min(88, Math.max(56, insight.score - 8));
  const probDown = 100 - probUp - 10;
  const priceLine = Array.from({ length: 28 }, (_, i) => {
    const x = (i / 27) * 860;
    const y = 110 + Math.sin(i / 4.2) * 18 + Math.cos(i / 7) * 8;
    return `${x},${y}`;
  }).join(" ");
  const predLine = Array.from({ length: 28 }, (_, i) => {
    const x = (i / 27) * 860;
    const y = i < 18 ? 126 + Math.cos(i / 4.5) * 10 : 118 - (i - 18) * 1.1;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div style={{ height: "100%", padding: 10, background: "linear-gradient(180deg, rgba(4,8,16,0.98), rgba(2,6,12,0.98))" }}>
      <div
        style={{
          height: "100%",
          borderRadius: 14,
          border: "1px solid rgba(0,214,255,0.12)",
          background: "linear-gradient(180deg, rgba(4,10,20,0.98), rgba(2,6,12,0.98))",
          display: "grid",
          gridTemplateRows: "auto auto 1fr auto",
          gap: 10,
          padding: 10,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "linear-gradient(rgba(0,214,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(0,214,255,0.018) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            opacity: 0.35,
          }}
        />

        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ color: "#eaf6ff", fontSize: 15, fontWeight: 900, letterSpacing: 0.8 }}>
              IA ATLAS
            </div>
            <div style={{ color: "#6883aa", fontSize: 10, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase" }}>
              Sistema preditivo de ativos digitais
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <TopButton active>Atlas Sync</TopButton>
            <span
              style={{
                color: "#00ff9d",
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: 0.7,
                textTransform: "uppercase",
              }}
            >
              • Online
            </span>
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "0.8fr 1.3fr 1fr", gap: 10 }}>
          <div
            style={{
              borderRadius: 14,
              border: "1px solid rgba(0,214,255,0.12)",
              background: "linear-gradient(180deg, rgba(5,11,22,0.98), rgba(3,7,14,0.98))",
              padding: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 104,
                  height: 104,
                  borderRadius: "50%",
                  margin: "0 auto 10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "conic-gradient(#00ff9d 0deg, #24f5d6 300deg, rgba(255,255,255,0.08) 300deg 360deg)",
                  padding: 8,
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    background: "#06101b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                  }}
                >
                  <span style={{ color: "#00ff9d", fontSize: 20, fontWeight: 900 }}>{insight.score}</span>
                  <span style={{ color: "#7f93b7", fontSize: 10 }}>Forte</span>
                </div>
              </div>
              <div style={{ color: "#7f93b7", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.7 }}>
                Score Atlas
              </div>
            </div>
          </div>

          <div
            style={{
              borderRadius: 14,
              border: "1px solid rgba(0,214,255,0.12)",
              background: "linear-gradient(180deg, rgba(5,11,22,0.98), rgba(3,7,14,0.98))",
              padding: 12,
              display: "grid",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
              <div style={{ color: "#f0f7ff", fontSize: 18, fontWeight: 900 }}>${insight.price.toLocaleString()}</div>
              <div style={{ color: ui.red, fontSize: 12, fontWeight: 900 }}>↘ -1.17%</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              <SmallStatCard title="Sinal" value="COMPRA" color={ui.green} />
              <SmallStatCard title="Risco" value="Baixo" color={ui.green} />
              <SmallStatCard title="Tendência" value={insight.trendBias === "bullish" ? "Alta" : insight.trendBias === "bearish" ? "Baixa" : "Neutra"} color={insight.trendBias === "bullish" ? ui.green : insight.trendBias === "bearish" ? ui.red : ui.yellow} />
            </div>
          </div>

          <div
            style={{
              borderRadius: 14,
              border: "1px solid rgba(0,214,255,0.12)",
              background: "linear-gradient(180deg, rgba(5,11,22,0.98), rgba(3,7,14,0.98))",
              padding: 12,
            }}
          >
            <div style={{ color: "#edf7ff", fontSize: 13, fontWeight: 900, marginBottom: 10 }}>
              Sentimento do Mercado
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              <SmallStatCard title="Fear & Greed" value="79" sub="Ganância extrema" color={ui.green} />
              <SmallStatCard title="Dominância" value="55.1%" sub="Market cap" color={ui.cyan} />
            </div>
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 10, minHeight: 0 }}>
          <div
            style={{
              borderRadius: 14,
              border: "1px solid rgba(0,214,255,0.12)",
              background: "linear-gradient(180deg, rgba(5,11,22,0.98), rgba(3,7,14,0.98))",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "12px 14px 8px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ color: "#eef7ff", fontSize: 13, fontWeight: 900 }}>IA Atlas</div>
                <div style={{ color: "#6f88af", fontSize: 10 }}>Análise preditiva</div>
              </div>
              <TopButton>Atlas Sync</TopButton>
            </div>

            <div style={{ padding: 12, height: "calc(100% - 52px)" }}>
              <svg width="100%" height="100%" viewBox="0 0 860 320" preserveAspectRatio="none">
                {Array.from({ length: 7 }, (_, i) => (
                  <line key={`h-${i}`} x1="0" y1={i * 45} x2="860" y2={i * 45} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                ))}
                {Array.from({ length: 14 }, (_, i) => (
                  <line key={`v-${i}`} x1={i * 66} y1="0" x2={i * 66} y2="320" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                ))}
                <polyline points={priceLine} fill="none" stroke={ui.cyan} strokeWidth="2.3" />
                <polyline points={predLine} fill="none" stroke={ui.yellow} strokeWidth="1.8" strokeDasharray="6 4" />
                <rect x="0" y="110" width="860" height="170" fill="rgba(0,214,255,0.05)" />
              </svg>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 10 }}>
            <div
              style={{
                borderRadius: 14,
                border: "1px solid rgba(0,214,255,0.12)",
                background: "linear-gradient(180deg, rgba(5,11,22,0.98), rgba(3,7,14,0.98))",
                padding: 14,
              }}
            >
              <div style={{ color: "#00ff9d", fontSize: 13, fontWeight: 900, marginBottom: 10 }}>
                Probabilidade Alta
              </div>
              <div style={{ color: "#00ff9d", fontSize: 42, fontWeight: 900, marginBottom: 10 }}>
                {probUp.toFixed(1)}%
              </div>
              <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,0.06)", overflow: "hidden", marginBottom: 12 }}>
                <div style={{ width: `${probUp}%`, height: "100%", background: "#00ff9d" }} />
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#7f93b7", fontSize: 12 }}>Saída Alta</span>
                  <span style={{ color: "#dce8ff", fontSize: 12, fontWeight: 900 }}>$98,500.00</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#7f93b7", fontSize: 12 }}>Stop Loss</span>
                  <span style={{ color: ui.orange, fontSize: 12, fontWeight: 900 }}>$84,500.00</span>
                </div>
              </div>
            </div>

            <div
              style={{
                borderRadius: 14,
                border: "1px solid rgba(255,79,163,0.16)",
                background: "linear-gradient(180deg, rgba(5,11,22,0.98), rgba(3,7,14,0.98))",
                padding: 14,
              }}
            >
              <div style={{ color: ui.magenta, fontSize: 13, fontWeight: 900, marginBottom: 10 }}>
                Probabilidade Baixa
              </div>
              <div style={{ color: ui.magenta, fontSize: 42, fontWeight: 900, marginBottom: 10 }}>
                {probDown.toFixed(1)}%
              </div>
              <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,0.06)", overflow: "hidden", marginBottom: 12 }}>
                <div style={{ width: `${probDown}%`, height: "100%", background: ui.magenta }} />
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#7f93b7", fontSize: 12 }}>Saída Baixa</span>
                  <span style={{ color: "#dce8ff", fontSize: 12, fontWeight: 900 }}>$82,000.00</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#7f93b7", fontSize: 12 }}>Stop Loss</span>
                  <span style={{ color: ui.orange, fontSize: 12, fontWeight: 900 }}>$84,500.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 10 }}>
          <div
            style={{
              borderRadius: 14,
              border: "1px solid rgba(0,214,255,0.12)",
              background: "linear-gradient(180deg, rgba(5,11,22,0.98), rgba(3,7,14,0.98))",
              padding: 14,
            }}
          >
            <div style={{ color: "#edf7ff", fontSize: 13, fontWeight: 900, marginBottom: 12 }}>
              Módulo Atlas
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {[
                ["Ativo", insight.symbol, "#dce8ff"],
                ["Risco", insight.riskLevel, ui.yellow],
                ["Liquidez", "Ativo", ui.green],
                ["Euler", "Alinhado", ui.green],
              ].map(([k, v, c]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ color: "#7f93b7", fontSize: 13 }}>{k}</span>
                  <span style={{ color: c as string, fontSize: 13, fontWeight: 900 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              borderRadius: 14,
              border: "1px solid rgba(0,214,255,0.12)",
              background: "linear-gradient(180deg, rgba(5,11,22,0.98), rgba(3,7,14,0.98))",
              padding: 14,
            }}
          >
            <div style={{ color: "#edf7ff", fontSize: 13, fontWeight: 900, marginBottom: 12 }}>
              Previsão Temporal IA
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {[
                ["1H", "55.0%", "30.0%", "15%"],
                ["4H", "62.0%", "25.0%", "13%"],
                ["1D", "73.0%", "19.0%", "8%"],
                ["1W", "68.0%", "22.0%", "10%"],
              ].map(([tf, up, down, neutral]) => (
                <div key={tf} style={{ borderLeft: "1px solid rgba(255,255,255,0.06)", paddingLeft: 10 }}>
                  <div style={{ color: ui.cyan, fontSize: 12, fontWeight: 900, marginBottom: 8 }}>{tf}</div>
                  <div style={{ color: ui.green, fontSize: 13, fontWeight: 900 }}>{up}</div>
                  <div style={{ color: ui.magenta, fontSize: 13, fontWeight: 900 }}>{down}</div>
                  <div style={{ color: ui.orange, fontSize: 13, fontWeight: 900 }}>{neutral}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EstruturaModule({ insight }: { insight: AIInsight }) {
  const trend1 = Array.from({ length: 40 }, (_, i) => {
    const x = (i / 39) * 860;
    const y = 72 + Math.sin(i / 5.2) * 6 + Math.cos(i / 8.3) * 4;
    return `${x},${y}`;
  }).join(" ");
  const trend2 = Array.from({ length: 40 }, (_, i) => {
    const x = (i / 39) * 860;
    const y = 102 + Math.cos(i / 5.8) * 8;
    return `${x},${y}`;
  }).join(" ");
  const bars = Array.from({ length: 34 }, (_, i) => ({
    up: 22 + ((i * 17) % 62),
    down: 12 + ((i * 11) % 50),
  }));

  return (
    <div style={{ height: "100%", padding: 10, background: "linear-gradient(180deg, rgba(4,8,16,0.98), rgba(2,6,12,0.98))" }}>
      <div
        style={{
          height: "100%",
          borderRadius: 14,
          border: "1px solid rgba(0,214,255,0.12)",
          background: "linear-gradient(180deg, rgba(4,10,20,0.98), rgba(2,6,12,0.98))",
          overflow: "hidden",
          display: "grid",
          gridTemplateRows: "auto 1fr",
          gap: 10,
          padding: 10,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "linear-gradient(rgba(0,214,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(0,214,255,0.018) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            opacity: 0.35,
          }}
        />

        <div style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          <SmallStatCard title="Estrutura" value="Alinhada" sub="Tendência e contexto favorecem continuação." color={ui.cyan} />
          <SmallStatCard title="Base" value="Testando" sub="Região central sustentando o preço." color={ui.yellow} />
          <SmallStatCard title="Invalidação" value="Controlada" sub="Risco sistêmico ainda aceitável." color={ui.magenta} />
        </div>

        <div style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateRows: "1fr auto auto", gap: 10, minHeight: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.18fr 0.82fr", gap: 10, minHeight: 0 }}>
            <div
              style={{
                borderRadius: 14,
                border: "1px solid rgba(0,214,255,0.12)",
                background: "linear-gradient(180deg, rgba(5,11,22,0.98), rgba(3,7,14,0.98))",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "12px 14px 8px",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ color: "#eef7ff", fontSize: 13, fontWeight: 900 }}>Estrutura</div>
                <TopButton>Atlas Sync</TopButton>
              </div>

              <div style={{ padding: 12, height: "calc(100% - 52px)" }}>
                <svg width="100%" height="100%" viewBox="0 0 860 290" preserveAspectRatio="none">
                  {Array.from({ length: 7 }, (_, i) => (
                    <line key={`h-${i}`} x1="0" y1={i * 38} x2="860" y2={i * 38} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                  ))}
                  {Array.from({ length: 14 }, (_, i) => (
                    <line key={`v-${i}`} x1={i * 66} y1="0" x2={i * 66} y2="290" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                  ))}

                  {bars.map((b, i) => {
                    const x = 18 + i * 24;
                    return (
                      <g key={i}>
                        <rect x={x} y={250 - b.up} width="8" height={b.up} rx="2" fill="rgba(0,255,157,0.72)" />
                        <rect x={x + 10} y={250 - b.down} width="8" height={b.down} rx="2" fill="rgba(255,91,111,0.72)" />
                      </g>
                    );
                  })}

                  <polyline points={trend1} fill="none" stroke={ui.cyan} strokeWidth="2.2" />
                  <polyline points={trend2} fill="none" stroke={ui.yellow} strokeWidth="1.8" />
                </svg>
              </div>
            </div>

            <div
              style={{
                borderRadius: 14,
                border: "1px solid rgba(0,214,255,0.12)",
                background: "linear-gradient(180deg, rgba(5,11,22,0.98), rgba(3,7,14,0.98))",
                padding: 12,
              }}
            >
              <div style={{ color: "#edf7ff", fontSize: 13, fontWeight: 900, marginBottom: 12 }}>
                Leitura do Módulo
              </div>

              <div
                style={{
                  width: 110,
                  height: 56,
                  margin: "0 auto 14px",
                  borderTopLeftRadius: 110,
                  borderTopRightRadius: 110,
                  border: "8px solid rgba(255,255,255,0.08)",
                  borderBottom: "none",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderTopLeftRadius: 110,
                    borderTopRightRadius: 110,
                    border: `8px solid ${ui.green}`,
                    borderBottom: "none",
                    clipPath: "inset(0 35% 0 0)",
                  }}
                />
                <div style={{ position: "absolute", bottom: -4, left: "50%", transform: "translateX(-50%)", color: ui.green, fontWeight: 900 }}>
                  {insight.score}
                </div>
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                {[
                  ["Ativo", insight.symbol, "#dce8ff"],
                  ["Score", `${insight.score}`, ui.green],
                  ["Sinal", "Compra Forte", ui.green],
                  ["Risco", "Baixo", ui.green],
                  ["Liquidez", "Ativo", ui.green],
                  ["Euler", "Alinhado", ui.cyan],
                ].map(([k, v, c]) => (
                  <div
                    key={k}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <span style={{ color: "#7f93b7", fontSize: 13 }}>{k}</span>
                    <span style={{ color: c as string, fontSize: 13, fontWeight: 900 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div
              style={{
                borderRadius: 14,
                border: "1px solid rgba(0,255,157,0.16)",
                background: "linear-gradient(180deg, rgba(5,11,22,0.98), rgba(3,7,14,0.98))",
                padding: 14,
              }}
            >
              <div style={{ color: "#00ff9d", fontSize: 13, fontWeight: 900, marginBottom: 12 }}>
                Cenário Alta
              </div>
              <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,0.06)", overflow: "hidden", marginBottom: 12 }}>
                <div style={{ width: "86%", height: "100%", background: "#00ff9d" }} />
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {[
                  ["Alvo 1", "$92,812"],
                  ["Alvo 2", "$93,513"],
                  ["Stop Loss", "$84,711"],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#7f93b7", fontSize: 13 }}>{k}</span>
                    <span style={{ color: k === "Stop Loss" ? ui.yellow : "#dce8ff", fontSize: 13, fontWeight: 900 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                borderRadius: 14,
                border: "1px solid rgba(255,79,163,0.16)",
                background: "linear-gradient(180deg, rgba(5,11,22,0.98), rgba(3,7,14,0.98))",
                padding: 14,
              }}
            >
              <div style={{ color: ui.magenta, fontSize: 13, fontWeight: 900, marginBottom: 12 }}>
                Cenário Baixa
              </div>
              <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,0.06)", overflow: "hidden", marginBottom: 12 }}>
                <div style={{ width: "14%", height: "100%", background: ui.magenta }} />
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {[
                  ["Alvo 1", "$83,451"],
                  ["Alvo 2", "$81,301"],
                  ["Stop Loss", "$85,257"],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#7f93b7", fontSize: 13 }}>{k}</span>
                    <span style={{ color: k === "Stop Loss" ? ui.yellow : "#dce8ff", fontSize: 13, fontWeight: 900 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <SmallStatCard title="Sentimento do Mercado" value="54" sub="Neutro" color={ui.yellow} />
            <SmallStatCard title="Fluxo Institucional" value="+$523M" sub="Tubarões dominando o fluxo." color={ui.green} />
            <SmallStatCard title="Livro de Ofertas" value="Ativo" sub="Bid/Ask com boa espessura." color={ui.cyan} />
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkspaceByModule({
  activeModule,
  candles,
  indicators,
  objects,
  selectedObject,
  selectedId,
  activeTool,
  mode,
  symbol,
  timeframe,
  events,
  insight,
  scannerAssets,
  onSelectSymbol,
  onSelectObject,
  onAddObject,
  onUpdateObject,
  onToggleLocked,
  onToggleHidden,
  onClearAll,
  onDeleteSelected,
}: {
  activeModule: TopModuleKey;
  candles: CandleData[];
  indicators: IndicatorData[];
  objects: DrawObject[];
  selectedObject: DrawObject | null;
  selectedId: string | null;
  activeTool: ToolKey;
  mode: ModeKey;
  symbol: string;
  timeframe: Timeframe;
  events: ScannerEvent[];
  insight: AIInsight;
  scannerAssets: AssetScore[];
  onSelectSymbol: (symbol: string) => void;
  onSelectObject: (id: string | null) => void;
  onAddObject: (obj: DrawObject) => void;
  onUpdateObject: (id: string, updater: (obj: DrawObject) => DrawObject) => void;
  onToggleLocked: () => void;
  onToggleHidden: () => void;
  onClearAll: () => void;
  onDeleteSelected: () => void;
}) {
  if (activeModule === "Scanner") {
    return <ChartPanel candles={candles} indicators={indicators} objects={objects} selectedObject={selectedObject} selectedId={selectedId} activeTool={activeTool} mode={mode} symbol={symbol} timeframe={timeframe} onSelectObject={onSelectObject} onAddObject={onAddObject} onUpdateObject={onUpdateObject} onToggleLocked={onToggleLocked} onToggleHidden={onToggleHidden} onClearAll={onClearAll} onDeleteSelected={onDeleteSelected} />;
  }
  if (activeModule === "Mestre Scanner") {
    return <div style={{ height: "100%", padding: 10 }}><MasterScannerPanel assets={scannerAssets} selectedSymbol={symbol} onSelectSymbol={onSelectSymbol} /></div>;
  }
  if (activeModule === "Fluxo") return <FluxoModule events={events} />;
  if (activeModule === "Liquidez") return <div style={{ height: "100%", padding: 10 }}><LiquidityPanel /></div>;
  if (activeModule === "Euler") return <EulerModule insight={insight} />;
  if (activeModule === "Singularidade") return <SingularidadeModule insight={insight} />;
  if (activeModule === "IA Atlas") return <IAAtlasModule insight={insight} />;
  if (activeModule === "Estrutura") return <EstruturaModule insight={insight} />;
  return null;
}

export default function AtlasChartPro2() {
  const [timeframe, setTimeframe] = useState<Timeframe>("15m");
  const [mode] = useState<ModeKey>("auto");
  const [activeModule, setActiveModule] = useState<TopModuleKey>("Scanner");
  const [activeTool, setActiveTool] = useState<ToolKey>("cursor");
  const [objects, setObjects] = useState<DrawObject[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string>("BTC");

  const scannerAssets = useMemo<AssetScore[]>(
    () => [
      { symbol: "BTC", volumeScore: 82.41, rsiMfi: 64.82, price: 74682, change: 2.8, trend: "up", color: "#27f59d", aiScore: 84, signal: "COMPRA", riskLevel: "Moderado", riskType: "Volatilidade", invalidation: 69180.6 },
      { symbol: "ETH", volumeScore: 73.35, rsiMfi: 58.1, price: 3932, change: 2.58, trend: "up", color: "#31c8ff", aiScore: 79, signal: "COMPRA", riskLevel: "Moderado", riskType: "Pullback", invalidation: 3560 },
      { symbol: "SOL", volumeScore: 61.18, rsiMfi: 43.7, price: 174.8, change: 3.06, trend: "up", color: "#ffb14a", aiScore: 76, signal: "COMPRA", riskLevel: "Moderado", riskType: "Aceleração", invalidation: 166 },
      { symbol: "BNB", volumeScore: 69.08, rsiMfi: 52.2, price: 610.75, change: 0.43, trend: "neutral", color: "#f7c948", aiScore: 61, signal: "NEUTRO", riskLevel: "Moderado", riskType: "Consolidação", invalidation: 584 },
      { symbol: "XRP", volumeScore: 55.63, rsiMfi: 39.9, price: 2.147, change: -1.1, trend: "down", color: "#a783ff", aiScore: 36, signal: "BAIXA", riskLevel: "Moderado", riskType: "Pressão", invalidation: 2.32 },
      { symbol: "DOGE", volumeScore: 66.14, rsiMfi: 57.6, price: 0.387, change: -0.81, trend: "down", color: "#22c55e", aiScore: 52, signal: "NEUTRO", riskLevel: "Moderado", riskType: "Volatilidade", invalidation: 0.35 },
      { symbol: "AVAX", volumeScore: 71.44, rsiMfi: 61.82, price: 38.87, change: 3.48, trend: "up", color: "#31e9ff", aiScore: 77, signal: "COMPRA", riskLevel: "Moderado", riskType: "Aceleração", invalidation: 35.4 },
      { symbol: "DOT", volumeScore: 60.22, rsiMfi: 49.5, price: 8.98, change: 2.15, trend: "up", color: "#ff4fa3", aiScore: 68, signal: "COMPRA", riskLevel: "Moderado", riskType: "Faixa", invalidation: 8.1 },
      { symbol: "ADA", volumeScore: 62.5, rsiMfi: 51.8, price: 0.847, change: 3.21, trend: "up", color: "#00d8ff", aiScore: 71, signal: "COMPRA", riskLevel: "Moderado", riskType: "Pullback", invalidation: 0.79 },
      { symbol: "ARB", volumeScore: 44.62, rsiMfi: 48.3, price: 1.21, change: 0.5, trend: "neutral", color: "#52b6ff", aiScore: 54, signal: "NEUTRO", riskLevel: "Moderado", riskType: "Faixa", invalidation: 1.12 },
    ],
    []
  );

  const scannerEvents = useMemo<ScannerEvent[]>(
    () => [
      { time: "23:31:25", title: "Compra Baleia", tag: "Fluxo • Scanner", tone: "positive" },
      { time: "14:30:23", title: "Venda Retail", tag: "Confluência", tone: "neutral" },
      { time: "14:29:47", title: "Compra Baleia", tag: "RSI / MFI", tone: "positive" },
      { time: "14:29:47", title: "Venda Institucional", tag: "Risco Assimétrico", tone: "warning" },
      { time: "14:31:08", title: "Liquidação Long", tag: "Eventos", tone: "warning" },
      { time: "14:30:55", title: "Compra Algorítmica", tag: "Scanner+", tone: "positive" },
      { time: "14:32:15", title: "Compra Grande", tag: "Singularidade", tone: "positive" },
      { time: "14:31:42", title: "Venda Institucional", tag: "Confluência", tone: "neutral" },
    ],
    []
  );

  const activeAsset = useMemo(
    () => scannerAssets.find((a) => a.symbol === selectedSymbol) ?? scannerAssets[0],
    [scannerAssets, selectedSymbol]
  );

  const candles = useMemo(() => generateCandles(240, symbolBasePrice(activeAsset.symbol)), [activeAsset.symbol]);
  const indicators = useMemo(() => generateIndicators(candles), [candles]);
  const selectedObject = useMemo(
    () => objects.find((o) => o.id === selectedId) ?? null,
    [objects, selectedId]
  );
  const insight = useMemo(() => symbolToInsight(activeAsset), [activeAsset]);

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

      <style>{`
        [data-atlas-scroll="cyan"] {
          scrollbar-width: thin;
          scrollbar-color: rgba(45,226,255,0.55) rgba(255,255,255,0.04);
        }
        [data-atlas-scroll="cyan"]::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        [data-atlas-scroll="cyan"]::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.03);
          border-radius: 999px;
        }
        [data-atlas-scroll="cyan"]::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(45,226,255,0.72), rgba(0,216,255,0.38));
          border-radius: 999px;
          border: 1px solid rgba(45,226,255,0.18);
        }
      `}</style>

      <TopBar
        symbol={activeAsset.symbol}
        price={activeAsset.price}
        change={activeAsset.change}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
      />

      <ModuleStrip activeModule={activeModule} onChange={setActiveModule} />

      <div style={{ display: "flex", minHeight: 0, flex: 1 }}>
        <LeftToolbar activeTool={activeTool} onSelectTool={setActiveTool} />

        <div style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) 320px",
              height: "100%",
              minHeight: 0,
            }}
          >
            <div style={{ minWidth: 0, minHeight: 0 }}>
              <WorkspaceByModule
                activeModule={activeModule}
                candles={candles}
                indicators={indicators}
                objects={objects}
                selectedObject={selectedObject}
                selectedId={selectedId}
                activeTool={activeTool}
                mode={mode}
                symbol={activeAsset.symbol}
                timeframe={timeframe}
                events={scannerEvents}
                insight={insight}
                scannerAssets={scannerAssets}
                onSelectSymbol={setSelectedSymbol}
                onSelectObject={setSelectedId}
                onAddObject={(obj) => setObjects((prev) => [...prev, obj])}
                onUpdateObject={(id, updater) => setObjects((prev) => prev.map((obj) => obj.id === id ? updater(obj) : obj))}
                onToggleLocked={() => setObjects((prev) => prev.map((obj) => obj.id === selectedId ? { ...obj, locked: !obj.locked } : obj))}
                onToggleHidden={() => setObjects((prev) => prev.map((obj) => obj.id === selectedId ? { ...obj, hidden: !obj.hidden } : obj))}
                onClearAll={() => { setObjects([]); setSelectedId(null); }}
                onDeleteSelected={() => { setObjects((prev) => prev.filter((obj) => obj.id !== selectedId)); setSelectedId(null); }}
              />
            </div>

            <div
              style={{
                minWidth: 0,
                minHeight: 0,
                borderLeft: `1px solid ${ui.border}`,
                background:
                  "linear-gradient(180deg, rgba(7,11,20,0.98), rgba(4,7,14,0.98))",
                display: "grid",
                gridTemplateRows:
                  activeModule === "Scanner" || activeModule === "Mestre Scanner"
                    ? "1fr"
                    : "1fr auto",
              }}
            >
              <AIInsightPanel insight={insight} topModule={activeModule} />

              {activeModule !== "Scanner" && activeModule !== "Mestre Scanner" && (
                <div
                  style={{
                    borderTop: `1px solid ${ui.border}`,
                    padding: 10,
                    background: "rgba(255,255,255,0.015)",
                  }}
                >
                  <ScannerPanelContinuous
                    assets={scannerAssets.slice(0, 6)}
                    selectedSymbol={selectedSymbol}
                    onSelectSymbol={setSelectedSymbol}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
