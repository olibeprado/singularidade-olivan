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

type DrawObject = {
  id: string;
  name: string;
  type: string;
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
  "Estrutura",
  "Euler",
  "Liquidez",
];
const LIQUIDITY_TABS = ["Map", "Heatmap", "Clusters", "Eventos"];

const ui = {
  bg: "#060913",
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

function ModuleButton({ icon, text, active, onClick }: { icon: React.ReactNode; text: string; active?: boolean; onClick?: () => void; }) {
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

function TopButton({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void; }) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 29,
        padding: "0 10px",
        borderRadius: 9,
        border: active ? "1px solid rgba(247,201,72,0.34)" : "1px solid rgba(255,255,255,0.06)",
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

function TopBar({ symbol, price, change, timeframe, onTimeframeChange }: { symbol: string; price: number; change: number; timeframe: Timeframe; onTimeframeChange: (tf: Timeframe) => void; }) {
  const [replayMode, setReplayMode] = useState(false);
  const isPositive = change >= 0;

  return (
    <div style={{ height: 64, padding: "0 14px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${ui.border}`, background: "radial-gradient(circle at top, rgba(14,28,60,0.86), rgba(6,10,20,0.98) 55%)", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 8 }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: "linear-gradient(135deg, rgba(42,231,255,0.22), rgba(119,77,255,0.28))", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 24px rgba(46,226,255,0.16)" }}>
          <Activity size={17} color="#e8f7ff" />
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ color: "#f6fbff", fontSize: 17, fontWeight: 900, letterSpacing: 0.3 }}>SINGULARIDADE</span>
          <span style={{ color: ui.cyan, fontSize: 10, fontWeight: 900, background: "rgba(45,226,255,0.1)", padding: "3px 6px", borderRadius: 999 }}>OBP</span>
        </div>
      </div>

      <div style={{ width: 1, height: 30, background: "rgba(255,255,255,0.08)" }} />

      <button style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 36, padding: "0 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", background: "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.012))", color: "#eef6ff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
        <span style={{ color: ui.yellow }}>₿</span>
        {symbol}
        <ChevronDown size={13} color="#8295bb" />
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ color: "#f6fbff", fontSize: 13, fontFamily: "monospace", fontWeight: 900 }}>${price.toLocaleString()}</span>
        <span style={{ color: isPositive ? ui.green : ui.red, fontSize: 12, fontFamily: "monospace", fontWeight: 900 }}>
          {isPositive ? "+" : ""}{change.toFixed(2)}%
        </span>
      </div>

      <div style={{ width: 1, height: 30, background: "rgba(255,255,255,0.08)" }} />

      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {TIMEFRAMES.map((tf) => (
          <TopButton key={tf} active={timeframe === tf} onClick={() => onTimeframeChange(tf)}>{tf}</TopButton>
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
          background: replayMode ? "linear-gradient(180deg, rgba(247,201,72,0.16), rgba(247,201,72,0.04))" : "transparent",
          color: replayMode ? ui.yellow : "#8da1c7",
          fontSize: 12,
          fontWeight: 800,
          cursor: "pointer",
        }}
      >
        <RotateCcw size={12} /> Replay
      </button>

      <div style={{ flex: 1 }} />

      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        {NAV_TABS.map((tab, i) => (
          <TopButton key={tab} active={i === 0}>{tab}</TopButton>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: 8 }}>
        <span style={{ color: ui.green, fontSize: 12, fontWeight: 900 }}>{isPositive ? "+" : ""}{change.toFixed(2)}%</span>
        <Search size={15} color="#90a4c8" />
        <Bell size={15} color="#90a4c8" />
        <Settings size={15} color="#90a4c8" />
      </div>
    </div>
  );
}

function ModuleStrip({ activeModule, onChange }: { activeModule: TopModuleKey; onChange: (m: TopModuleKey) => void; }) {
  const icons: Record<TopModuleKey, React.ReactNode> = {
    Fluxo: <Waves size={13} />,
    Singularidade: <BrainCircuit size={13} />,
    "IA Atlas": <Activity size={13} />,
    Scanner: <ScanSearch size={13} />,
    Estrutura: <Layers3 size={13} />,
    Euler: <Sigma size={13} />,
    Liquidez: <Droplets size={13} />,
  };

  return (
    <div style={{ height: 50, padding: "0 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${ui.border}`, background: "linear-gradient(180deg, rgba(8,12,23,0.98), rgba(7,11,20,0.98))", flexShrink: 0 }}>
      {TOP_MODULES.map((module) => (
        <ModuleButton key={module} icon={icons[module]} text={module} active={activeModule === module} onClick={() => onChange(module)} />
      ))}
    </div>
  );
}

function LeftToolbar() {
  const groups = [
    { title: "CURSOR", items: [{ icon: <MousePointer2 size={15} />, active: true }, { icon: <Circle size={15} /> }, { icon: <Eye size={15} /> }] },
    { title: "LINHAS DE TENDÊNCIA", items: [{ icon: <TrendingUp size={15} /> }, { icon: <MoveUpRight size={15} /> }, { icon: <ArrowUp size={15} /> }, { icon: <ArrowRight size={15} /> }, { icon: <ArrowDown size={15} /> }, { icon: <Plus size={15} /> }] },
    { title: "CANAIS", items: [{ icon: <GitBranch size={15} /> }, { icon: <BarChart2 size={15} /> }, { icon: <SlidersHorizontal size={15} /> }, { icon: <Grid2X2 size={15} /> }] },
    { title: "GAFOS & GANN", items: [{ icon: <Spline size={15} /> }, { icon: <Network size={15} /> }, { icon: <Square size={15} /> }] },
    { title: "FIBONACCI", items: [{ icon: <Ruler size={15} /> }, { icon: <ArrowRight size={15} /> }] },
  ];

  return (
    <div style={{ width: 74, borderRight: `1px solid ${ui.border}`, background: "linear-gradient(180deg, rgba(8,12,24,0.98), rgba(6,9,17,0.98))", display: "flex", flexDirection: "column", padding: "10px 8px", gap: 12, overflowY: "auto", flexShrink: 0 }}>
      {groups.map((group, gi) => (
        <div key={gi} style={{ display: "grid", gap: 8 }}>
          <div style={{ color: "#536887", fontSize: 8, fontWeight: 900, letterSpacing: 0.9, textTransform: "uppercase", textAlign: "center" }}>{group.title}</div>
          {group.items.map((tool, ti) => (
            <button
              key={ti}
              style={{
                width: 40,
                height: 40,
                margin: "0 auto",
                borderRadius: 12,
                border: tool.active ? "1px solid rgba(45,226,255,0.28)" : "1px solid rgba(255,255,255,0.04)",
                background: tool.active ? "radial-gradient(circle at 50% 50%, rgba(45,226,255,0.18), rgba(45,226,255,0.04))" : "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.008))",
                color: tool.active ? ui.cyan : "#90a4c8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: tool.active ? "0 0 18px rgba(45,226,255,0.18)" : "none",
              }}
            >
              {tool.icon}
            </button>
          ))}
        </div>
      ))}

      <div style={{ flex: 1 }} />

      <button style={{ width: 40, height: 40, margin: "0 auto", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)", color: "#90a4c8", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
        <Settings size={15} />
      </button>
    </div>
  );
}

function ScoreDots({ count, total = 9 }: { count: number; total?: number }) {
  return <div style={{ color: "#7f93b7", fontSize: 12 }}>{count}/{total}</div>;
}

function StructureRow({ item }: { item: StructureItem }) {
  const getColor = (type: StructureItem["type"]) => {
    switch (type) {
      case "positive": return ui.green;
      case "strong": return "#9fffbc";
      case "negative": return ui.red;
      case "neutral": return "#aab7d1";
      default: return "#dbe7ff";
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <ChevronRight size={10} color="#66789d" />
        <span style={{ fontSize: 12, color: "#8ea2c8" }}>{item.label}</span>
      </div>
      {item.type === "dots" && item.dots !== undefined ? <ScoreDots count={item.dots} /> : <span style={{ fontSize: 12, color: getColor(item.type), fontWeight: 700 }}>{item.value}</span>}
    </div>
  );
}

function AIInsightPanel({ insight, topModule }: { insight: AIInsight; topModule: TopModuleKey; }) {
  const scoreColor = insight.score >= 80 ? ui.green : insight.score >= 60 ? ui.yellow : ui.red;
  const moduleLabel = topModule === "Scanner" ? "IA Atlas Insights" : `${topModule} Insights`;

  return (
    <div style={{ height: "100%", background: "linear-gradient(180deg, rgba(6,10,20,0.98), rgba(4,7,15,0.98))", overflowY: "auto" }}>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${ui.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: "#e8f1ff", fontSize: 12, fontWeight: 800, letterSpacing: 0.45 }}>{moduleLabel}</span>
        <ChevronDown size={14} color="#6c7da2" />
      </div>

      <div style={{ padding: 16, borderBottom: `1px solid ${ui.border}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: ui.yellow, fontSize: 12 }}>₿</span>
            <span style={{ color: "#d8e6ff", fontSize: 12, fontFamily: "monospace" }}>{insight.symbol}</span>
          </div>
          <span style={{ color: "#96a8cb", fontSize: 12, fontFamily: "monospace" }}>{insight.price.toLocaleString()}</span>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <span style={{ color: "#f3f8ff", fontSize: 19, fontWeight: 900, letterSpacing: 0.4 }}>{insight.symbol}</span>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
            <span style={{ color: scoreColor, fontSize: 20, fontWeight: 900 }}>{insight.score}</span>
            <TrendingUp size={14} color={scoreColor} />
          </div>
        </div>

        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center" }}>
          <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
            <div style={{ width: `${insight.score}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg, rgba(49,233,255,0.95), rgba(36,245,155,0.95))" }} />
          </div>
          <div style={{ padding: "5px 10px", borderRadius: 7, background: `${scoreColor}22`, color: scoreColor, fontSize: 11, fontWeight: 900 }}>{insight.signal}</div>
        </div>

        <div style={{ marginTop: 14 }}>
          {[
            ["Risco", insight.riskLevel, ui.yellow],
            ["Tipo", insight.riskType, ui.red],
            ["Invalidação", `$${insight.invalidation.toLocaleString()}`, "#eef5ff"],
            ["Fonte", "binance", "#d9e8ff"],
          ].map(([k, v, c]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ color: "#7f93b7", fontSize: 12 }}>{k}</span>
              <span style={{ color: c as string, fontSize: 12, fontWeight: 800 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "12px 16px 4px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ color: "#e8f1ff", fontSize: 12, fontWeight: 800, letterSpacing: 0.45 }}>Estrutura</span>
          <ChevronRight size={12} color="#6c7da2" />
        </div>
        {insight.structure.map((item, i) => <StructureRow key={i} item={item} />)}
      </div>

      <div style={{ margin: 12, borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)", background: "linear-gradient(180deg, rgba(9,15,29,0.98), rgba(7,12,24,0.98))", padding: 12 }}>
        <div style={{ color: "#ecf4ff", fontSize: 12, fontWeight: 900, marginBottom: 10 }}>{topModule}</div>
        {[
          ["Estrutura", insight.structure[0]?.value || "Neutro", ui.green],
          ["Momentum", insight.structure[1]?.value || "Moderado", "#9fffbc"],
          ["Confluência", `${Math.max(2, Math.min(9, Math.round(insight.score / 11)))} / 9`, ui.green],
          ["Razão de Prata", insight.structure2[1]?.value || "Estável", ui.green],
          ["Ciclo", insight.score >= 75 ? "Acelerado" : "Normal", ui.cyan],
        ].map(([a, b, c]) => (
          <div key={a} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12 }}>
            <span style={{ color: "#8397bd" }}>{a}</span>
            <span style={{ color: c as string, fontWeight: 800 }}>{b}</span>
          </div>
        ))}
      </div>

      <div style={{ padding: "0 16px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ color: "#e8f1ff", fontSize: 12, fontWeight: 800, letterSpacing: 0.45 }}>Confluência</span>
          <ChevronRight size={12} color="#6c7da2" />
        </div>
        {insight.structure2.map((item, i) => <StructureRow key={i} item={item} />)}
      </div>
    </div>
  );
}

function MiniSparkline({ data, trend }: { data: number[]; trend: "up" | "down" | "neutral"; }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 86;
  const h = 34;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  const color = trend === "up" ? ui.green : trend === "down" ? ui.red : "#8ea2c8";

  return (
    <svg width={w} height={h}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ScoreBar({ value, max = 100 }: { value: number; max?: number; }) {
  const pct = Math.min(100, (value / max) * 100);
  const visual = getScoreVisual(value);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 62, height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 999, background: visual.color }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 900, color: visual.color }}>{visual.label}</span>
    </div>
  );
}

function ScannerPanelContinuous({ assets, selectedSymbol, onSelectSymbol }: { assets: AssetScore[]; selectedSymbol: string; onSelectSymbol: (symbol: string) => void; }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return assets;
    const q = searchTerm.toLowerCase();
    return assets.filter((a) => a.symbol.toLowerCase().includes(q));
  }, [assets, searchTerm]);

  const sparklines = useMemo(() => filtered.map((a) => generateSparkline(24, 40 + Math.random() * 40, a.trend)), [filtered]);

  return (
    <div style={{ height: "100%", borderRadius: 12, border: `1px solid ${ui.border}`, background: "linear-gradient(180deg, rgba(7,10,19,0.98), rgba(5,8,15,0.98))", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "10px 12px 8px", borderBottom: `1px solid ${ui.border}`, display: "grid", gap: 8, flexShrink: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 178px", gap: 10, alignItems: "center" }}>
          <span style={{ color: "#f1f7ff", fontSize: 13, fontWeight: 900 }}>MESTRE SCANNER</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8, height: 32, padding: "0 10px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)" }}>
            <Search size={13} color="#8ca0c6" />
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar moeda..." style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#e9f3ff", fontSize: 11 }} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.92fr 0.98fr 0.92fr 1fr", gap: 10, color: "#6c7da2", fontSize: 11 }}>
          <span>Top Forge</span>
          <span>Sinal</span>
          <span>Preço</span>
          <span>RSI / MFI</span>
          <span>Mini Chart</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {filtered.map((asset, i) => (
          <div key={asset.symbol} onClick={() => onSelectSymbol(asset.symbol)} style={{ display: "grid", gridTemplateColumns: "1.1fr 0.92fr 0.98fr 0.92fr 1fr", gap: 10, padding: "11px 12px", borderBottom: "1px solid rgba(255,255,255,0.045)", alignItems: "center", cursor: "pointer", background: asset.symbol === selectedSymbol ? "linear-gradient(90deg, rgba(247,201,72,0.10), rgba(45,226,255,0.06))" : "transparent" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: asset.color, display: "inline-block" }} />
              <span style={{ color: "#edf5ff", fontSize: 12, fontWeight: 800 }}>{asset.symbol}</span>
            </div>
            <ScoreBar value={asset.volumeScore} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ color: "#eef5ff", fontSize: 12, fontFamily: "monospace" }}>${asset.price.toLocaleString()}</span>
              <span style={{ color: asset.change >= 0 ? ui.green : ui.red, fontSize: 12, fontFamily: "monospace", fontWeight: 800 }}>{asset.change >= 0 ? "+" : ""}{asset.change.toFixed(1)}%</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {asset.trend === "up" ? <TrendingUp size={11} color={ui.green} /> : asset.trend === "down" ? <TrendingDown size={11} color={ui.red} /> : <Activity size={11} color="#a2b3d3" />}
              <span style={{ color: "#8fd6ff", fontSize: 12, fontFamily: "monospace" }}>{asset.rsiMfi.toFixed(1)}</span>
            </div>
            <MiniSparkline data={sparklines[i]} trend={asset.trend} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SmallStatCard({ title, value, sub, color, accent }: { title: string; value: string; sub?: string; color: string; accent?: string; }) {
  return (
    <div style={{ borderRadius: 14, border: "1px solid rgba(45,226,255,0.12)", background: "linear-gradient(180deg, rgba(5,11,22,0.98), rgba(3,7,14,0.98))", padding: 12, minHeight: 84, boxShadow: accent ? `0 0 18px ${accent}` : "none" }}>
      <div style={{ color: "#6f88af", fontSize: 10, fontWeight: 900, letterSpacing: 0.7, textTransform: "uppercase", marginBottom: 8 }}>{title}</div>
      <div style={{ color, fontSize: 18, fontWeight: 900, marginBottom: 6, textShadow: `0 0 10px ${color}33` }}>{value}</div>
      {sub && <div style={{ color: "#9bb0d4", fontSize: 11 }}>{sub}</div>}
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
    const rightColor = severityLabel === "Alto" ? ui.red : severityLabel === "Médio" ? ui.yellow : ui.green;
    const leftDot = event.tone === "positive" ? ui.green : event.tone === "warning" ? ui.yellow : "#ff5050";

    return { ...event, amountBase, priceBase, exchangeBase, severityWidth, severityLabel, rightColor, leftDot };
  });

  return (
    <div style={{ height: "100%", borderRadius: 12, border: `1px solid ${ui.border}`, background: "linear-gradient(180deg, rgba(6,10,18,0.98), rgba(4,7,14,0.98))", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ height: 42, padding: "0 12px", borderBottom: `1px solid ${ui.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#00e117", display: "inline-block" }} />
          <span style={{ color: "#edf5ff", fontSize: 13, fontWeight: 900 }}>Eventos em Tempo Real</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ padding: "4px 8px", borderRadius: 6, background: "rgba(0,225,23,0.08)", color: "#00e117", fontSize: 10, fontWeight: 900 }}>Live</span>
          <span style={{ color: "#7f93b7", fontSize: 11, fontWeight: 700 }}>{rows.length} eventos</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 8, display: "grid", gap: 8 }}>
        {rows.map((event, i) => (
          <div key={`${event.time}-${i}`} style={{ position: "relative", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", background: "linear-gradient(180deg, rgba(9,14,24,0.98), rgba(7,11,20,0.98))", padding: "12px 12px 12px 28px", overflow: "hidden", minHeight: 62 }}>
            <div style={{ position: "absolute", left: 10, top: 18, width: 10, height: 10, borderRadius: "50%", background: event.leftDot }} />

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr 0.54fr", gap: 12, alignItems: "center" }}>
              <div>
                <div style={{ color: "#f0f7ff", fontSize: 12, fontWeight: 900, marginBottom: 3 }}>{event.title}</div>
                <div style={{ color: "#7f93b7", fontSize: 11 }}>{event.exchangeBase}</div>
              </div>

              <div style={{ textAlign: "center" }}>
                <div style={{ color: "#eef5ff", fontSize: 12, fontWeight: 900, fontFamily: "monospace" }}>{event.amountBase.toFixed(1)} BTC</div>
                <div style={{ color: "#7f93b7", fontSize: 11, fontFamily: "monospace" }}>${event.priceBase.toLocaleString()}</div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#dce8ff", fontSize: 12, fontFamily: "monospace", marginBottom: 4 }}>{event.time}</div>
                <div style={{ color: event.rightColor, fontSize: 12, fontWeight: 900 }}>{event.severityLabel}</div>
              </div>
            </div>

            <div style={{ marginTop: 10, height: 3, borderRadius: 999, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
              <div style={{ width: `${event.severityWidth}%`, height: "100%", borderRadius: 999, background: event.severityLabel === "Alto" ? "linear-gradient(90deg, #29ff72, #ff3c57)" : event.severityLabel === "Médio" ? "linear-gradient(90deg, #ffb300, #ff4b57)" : "linear-gradient(90deg, #29ff72, #24d6ff)" }} />
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
        <div key={r.label} style={{ display: "grid", gridTemplateColumns: "64px 1fr 46px", alignItems: "center", gap: 10 }}>
          <span style={{ color: "#9ab0d4", fontSize: 12, fontFamily: "monospace" }}>{r.label}</span>
          <div style={{ height: 12, borderRadius: 999, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
            <div style={{ width: `${r.value}%`, height: "100%", borderRadius: 999, background: r.color }} />
          </div>
          <span style={{ color: "#e9f3ff", fontSize: 11, fontWeight: 800, textAlign: "right" }}>{r.value}%</span>
        </div>
      ))}
    </div>
  );
}

function LiquidityPanel() {
  const [tab, setTab] = useState("Heatmap");

  return (
    <div style={{ height: "100%", borderRadius: 12, border: `1px solid ${ui.border}`, background: "linear-gradient(180deg, rgba(7,10,19,0.98), rgba(5,8,15,0.98))", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ minHeight: 42, padding: "6px 14px", display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${ui.border}`, flexWrap: "wrap", flexShrink: 0 }}>
        <span style={{ color: "#f2f7ff", fontSize: 13, fontWeight: 900, marginRight: 6 }}>Liquidez Avançada</span>
        {LIQUIDITY_TABS.map((t) => <TopButton key={t} active={tab === t} onClick={() => setTab(t)}>{t}</TopButton>)}
      </div>

      <div style={{ padding: 12, display: "grid", gap: 12, flex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10 }}>
          <SmallStatCard title="Liquidez Superior" value="$72.200" sub="Bloco vendedor forte acima do preço atual." color={ui.yellow} />
          <SmallStatCard title="Liquidez Inferior" value="$69.800" sub="Absorção compradora ganhando espessura." color={ui.green} />
          <SmallStatCard title="Cluster Dominante" value="BTC Core" sub="Maior concentração institucional." color={ui.cyan} />
          <SmallStatCard title="Pressão Instantânea" value="+18.6%" sub="Fluxo favorecendo continuação curta." color={ui.green} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.26fr 0.62fr", gap: 12, flex: 1, minHeight: 0 }}>
          <div style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)", background: "linear-gradient(180deg, rgba(9,15,29,0.98), rgba(7,12,24,0.98))", padding: 14, overflowY: "auto" }}>
            <div style={{ color: "#edf5ff", fontSize: 13, fontWeight: 900, marginBottom: 12 }}>{tab === "Heatmap" ? "Heatmap de Intensidade" : tab}</div>
            {tab === "Heatmap" ? <HeatmapBars /> : <div style={{ height: 180, borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", background: "radial-gradient(circle at 50% 30%, rgba(45,226,255,0.18), transparent 30%), radial-gradient(circle at 72% 52%, rgba(39,245,157,0.18), transparent 26%), radial-gradient(circle at 36% 70%, rgba(247,201,72,0.16), transparent 24%), linear-gradient(180deg, rgba(5,10,20,0.95), rgba(7,11,20,0.98))" }} />}
          </div>

          <div style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)", background: "linear-gradient(180deg, rgba(9,15,29,0.98), rgba(7,12,24,0.98))", padding: 14 }}>
            <div style={{ color: "#edf5ff", fontSize: 13, fontWeight: 900, marginBottom: 12 }}>Leitura rápida</div>
            <div style={{ display: "grid", gap: 10 }}>
              {[
                ["Liquidez acima", "Pesada", ui.red],
                ["Liquidez abaixo", "Saudável", ui.green],
                ["Risco curto", "Controlado", ui.yellow],
                ["Confluência", "8 / 9", ui.cyan],
                ["Fluxo", "Positivo", ui.green],
                ["Volatilidade", "Moderada", "#dce8ff"],
              ].map(([k, v, c]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ color: "#8ea2c8", fontSize: 12 }}>{k}</span>
                  <span style={{ color: c as string, fontSize: 12, fontWeight: 900 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartPanel({ candles, indicators, selectedObject, mode, symbol, timeframe }: { candles: CandleData[]; indicators: IndicatorData[]; selectedObject: DrawObject | null; mode: ModeKey; symbol: string; timeframe: Timeframe; }) {
  const mainRef = useRef<HTMLDivElement>(null);
  const volOverlayRef = useRef<HTMLDivElement>(null);
  const rsiRef = useRef<HTMLDivElement>(null);
  const [livePrice, setLivePrice] = useState<number>(candles[candles.length - 1]?.close ?? 0);
  const [priceChange, setPriceChange] = useState<number>(0);

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

    const mc: IChartApi = createChart(mainRef.current, { ...baseChartOpts, width: mainRef.current.clientWidth, height: mainRef.current.clientHeight });
    const cSeries = mc.addCandlestickSeries({ upColor: "#37f4ad", downColor: "#ff6c8d", borderUpColor: "#37f4ad", borderDownColor: "#ff6c8d", wickUpColor: "#37f4ad", wickDownColor: "#ff6c8d" });
    cSeries.setData(candles.map((c) => ({ time: c.time as Time, open: c.open, high: c.high, low: c.low, close: c.close })));

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

    const rc: IChartApi = createChart(rsiRef.current, { ...baseChartOpts, width: rsiRef.current.clientWidth, height: rsiRef.current.clientHeight });
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
      if (mainRef.current) mc.applyOptions({ width: mainRef.current.clientWidth, height: mainRef.current.clientHeight });
      if (volOverlayRef.current) vc.applyOptions({ width: volOverlayRef.current.clientWidth, height: volOverlayRef.current.clientHeight });
      if (rsiRef.current) rc.applyOptions({ width: rsiRef.current.clientWidth, height: rsiRef.current.clientHeight });
    };

    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      mc.remove();
      vc.remove();
      rc.remove();
    };
  }, [candles, indicators]);

  const isPositive = priceChange >= 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", minWidth: 0, background: "linear-gradient(180deg, rgba(7,12,24,0.98), rgba(6,10,18,0.98))" }}>
      <div style={{ padding: "8px 10px", borderBottom: `1px solid ${ui.border}`, background: "linear-gradient(180deg, rgba(12,19,36,0.94), rgba(8,13,25,0.94))" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr repeat(4, 0.7fr) auto", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, background: "rgba(247,201,72,0.16)", color: ui.yellow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900 }}>SC</div>
            <div>
              <div style={{ color: "#eef6ff", fontSize: 14, fontWeight: 900 }}>{symbol}</div>
              <div style={{ color: "#7d91b6", fontSize: 10, fontWeight: 700 }}>Scanner Atlas • Pasta: Cursor • Item: Navegar • TF: {timeframe}</div>
            </div>
          </div>

          {[
            ["Preço", livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), "#4ef0cb"],
            ["Variação", `${isPositive ? "+" : ""}${priceChange.toFixed(2)}%`, isPositive ? ui.green : ui.red],
            ["Volume", formatCompact(candles[candles.length - 1]?.volume ?? 0), ui.cyan],
            ["Desenhos", selectedObject ? "1" : "0", selectedObject ? ui.yellow : ui.red],
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
          <TopButton active>Objetos</TopButton>
          <TopButton>Travar</TopButton>
          <TopButton>Ocultar</TopButton>
          <TopButton>Limpar desenhos</TopButton>
          <TopButton>Apagar selecionado</TopButton>
        </div>
        <div style={{ color: "#7f93b7", fontSize: 10, fontWeight: 800 }}>{selectedObject ? `${selectedObject.name} • ${selectedObject.type}` : "Nenhum objeto selecionado"}</div>
      </div>

      <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
        <div ref={mainRef} style={{ position: "absolute", inset: 0 }} />
        <div ref={volOverlayRef} style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 140, pointerEvents: "none", opacity: 0.95, borderTop: "1px solid rgba(255,255,255,0.05)" }} />
      </div>

      <div style={{ width: "100%", flexShrink: 0, borderTop: `1px solid ${ui.border}`, borderBottom: `1px solid ${ui.border}`, background: "#0a0f1d" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "5px 14px" }}>
          <span style={{ color: "#7f93b7", fontSize: 10, fontFamily: "monospace" }}>RSI / MFI</span>
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
        <div style={{ minHeight: 0, flex: 1 }}><EventRealtimePanel events={events} /></div>
      </div>
    </div>
  );
}

function EulerModule({ insight }: { insight: AIInsight }) {
  return <div style={{ padding: 20, color: ui.text }}>Euler pronto</div>;
}

function SingularidadeModule({ insight }: { insight: AIInsight }) {
  return <div style={{ padding: 20, color: ui.text }}>Singularidade pronta</div>;
}

function IAAtlasModule({ insight }: { insight: AIInsight }) {
  return <div style={{ padding: 20, color: ui.text }}>IA Atlas pronta</div>;
}

function EstruturaModule({ insight }: { insight: AIInsight }) {
  return <div style={{ padding: 20, color: ui.text }}>Estrutura pronta</div>;
}

function WorkspaceByModule({ activeModule, candles, indicators, selectedObject, mode, symbol, timeframe, events, insight }: { activeModule: TopModuleKey; candles: CandleData[]; indicators: IndicatorData[]; selectedObject: DrawObject | null; mode: ModeKey; symbol: string; timeframe: Timeframe; events: ScannerEvent[]; insight: AIInsight; }) {
  if (activeModule === "Scanner") {
    return <ChartPanel candles={candles} indicators={indicators} selectedObject={selectedObject} mode={mode} symbol={symbol} timeframe={timeframe} />;
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
  const [objects] = useState<DrawObject[]>([{ id: "1", name: "Linha 1", type: "line" }]);
  const [selectedId] = useState<string | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string>("BTC");

  const scannerAssets = useMemo<AssetScore[]>(() => [
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
  ], []);

  const scannerEvents = useMemo<ScannerEvent[]>(() => [
    { time: "23:31:25", title: "Compra Baleia", tag: "Fluxo • Scanner", tone: "positive" },
    { time: "14:30:23", title: "Venda Retail", tag: "Confluência", tone: "neutral" },
    { time: "14:29:47", title: "Compra Baleia", tag: "RSI / MFI", tone: "positive" },
    { time: "14:29:47", title: "Venda Institucional", tag: "Risco Assimétrico", tone: "warning" },
    { time: "14:31:08", title: "Liquidação Long", tag: "Eventos", tone: "warning" },
    { time: "14:30:55", title: "Compra Algorítmica", tag: "Scanner+", tone: "positive" },
    { time: "14:32:15", title: "Compra Grande", tag: "Singularidade", tone: "positive" },
    { time: "14:31:42", title: "Venda Institucional", tag: "Confluência", tone: "neutral" },
  ], []);

  const activeAsset = useMemo(() => scannerAssets.find((a) => a.symbol === selectedSymbol) ?? scannerAssets[0], [scannerAssets, selectedSymbol]);
  const candles = useMemo(() => generateCandles(240, symbolBasePrice(activeAsset.symbol)), [activeAsset.symbol]);
  const indicators = useMemo(() => generateIndicators(candles), [candles]);
  const selectedObject = useMemo(() => objects.find((o) => o.id === selectedId) ?? null, [objects, selectedId]);
  const insight = useMemo(() => symbolToInsight(activeAsset), [activeAsset]);

  return (
    <div style={{ width: "100%", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", background: ui.bg, color: ui.text, fontFamily: "Inter, Arial, sans-serif" }}>
      <TopBar symbol={activeAsset.symbol} price={activeAsset.price} change={activeAsset.change} timeframe={timeframe} onTimeframeChange={setTimeframe} />
      <ModuleStrip activeModule={activeModule} onChange={setActiveModule} />

      <div style={{ display: "flex", minHeight: 0, flex: 1 }}>
        <LeftToolbar />
        <div style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 320px", height: "100%", minHeight: 0 }}>
            <div style={{ minWidth: 0, minHeight: 0 }}>
              <WorkspaceByModule activeModule={activeModule} candles={candles} indicators={indicators} selectedObject={selectedObject} mode={mode} symbol={activeAsset.symbol} timeframe={timeframe} events={scannerEvents} insight={insight} />
            </div>
            <div style={{ minWidth: 0, minHeight: 0, borderLeft: `1px solid ${ui.border}`, background: "linear-gradient(180deg, rgba(7,11,20,0.98), rgba(4,7,14,0.98))", display: "grid", gridTemplateRows: activeModule === "Scanner" ? "1fr" : "1fr auto" }}>
              <AIInsightPanel insight={insight} topModule={activeModule} />
              {activeModule !== "Scanner" && (
                <div style={{ borderTop: `1px solid ${ui.border}`, padding: 10, background: "rgba(255,255,255,0.015)" }}>
                  <ScannerPanelContinuous assets={scannerAssets.slice(0, 6)} selectedSymbol={selectedSymbol} onSelectSymbol={setSelectedSymbol} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

