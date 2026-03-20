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
  Magnet,
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
};

type DrawObject = {
  id: string;
  name: string;
  type: string;
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
const LIQUIDITY_TABS = ["Map", "Heatmap", "Clusters", "Eventos"];
const ANALYTIC_TABS = [
  "Volume",
  "RSI / MFI",
  "Fluxo",
  "Singularidade",
  "Confluência",
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

function generateIndicators(candles: CandleData[]): IndicatorData[] {
  return candles.map((c, i) => {
    const base = 48 + Math.sin(i / 8) * 14 + (Math.random() - 0.5) * 6;
    const base2 = 52 + Math.cos(i / 10) * 16 + (Math.random() - 0.5) * 6;
    return {
      time: c.time,
      rsi: clamp(base, 5, 95),
      mfi: clamp(base2, 5, 95),
    };
  });
}

function generateSparkline(
  count: number,
  start: number,
  trend: "up" | "down" | "neutral"
) {
  const arr: number[] = [];
  let value = start;

  for (let i = 0; i < count; i++) {
    const drift = trend === "up" ? 1.3 : trend === "down" ? -1.2 : 0.12;
    value += drift + (Math.random() - 0.5) * 3;
    arr.push(value);
  }

  return arr;
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

function MiniStatCard({
  title,
  value,
  valueColor,
}: {
  title: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div
      style={{
        borderRadius: 13,
        border: "1px solid rgba(255,255,255,0.06)",
        background:
          "linear-gradient(180deg, rgba(8,15,31,0.98), rgba(7,12,24,0.96))",
        minHeight: 58,
        padding: "10px 13px",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
      }}
    >
      <div
        style={{
          color: "#7f93b7",
          fontSize: 9,
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
          fontSize: 12,
          fontWeight: 900,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
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

function AIInsightPanel({ insight }: { insight: AIInsight }) {
  const scoreColor =
    insight.score >= 80 ? ui.green : insight.score >= 60 ? ui.yellow : ui.red;

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
          IA Atlas Insights
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
            BTCUSDT
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
              <span style={{ color: "#7f93b7", fontSize: 12 }}>{k}</span>
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
          Scanner Atlas
        </div>

        {[
          ["Estrutura", "Positivo", ui.green],
          ["Euler", "Forte", "#9fffbc"],
          ["Singularidade", "5 / 6", ui.green],
          ["Razão de Prata", "Suporte Sólido", ui.green],
          ["Ciclo", "Acelerado", ui.cyan],
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

function LeftToolbar() {
  const tools = [
    { icon: <MousePointer2 size={16} />, active: true, title: "Cursor" },
    { icon: <TrendingUp size={16} />, title: "Linha" },
    { icon: <BarChart2 size={16} />, title: "Fibonacci" },
    { icon: <Shapes size={16} />, title: "Formas" },
    { icon: <PenTool size={16} />, title: "Pincel" },
    { icon: <Type size={16} />, title: "Texto" },
    { icon: <Square size={16} />, title: "Padrões" },
    { icon: <Activity size={16} />, title: "Medição" },
    { icon: <Star size={16} />, title: "Favoritos" },
    { icon: <Ruler size={16} />, title: "Régua" },
    { icon: <Maximize2 size={16} />, title: "Zoom" },
    { icon: <Magnet size={16} />, title: "Magnetismo" },
    { icon: <Eye size={16} />, title: "Ocultar" },
    { icon: <Trash2 size={16} />, title: "Remover" },
  ];

  return (
    <div
      style={{
        width: 56,
        borderRight: `1px solid ${ui.border}`,
        background:
          "linear-gradient(180deg, rgba(8,12,24,0.98), rgba(6,9,17,0.98))",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "12px 0",
        gap: 8,
        flexShrink: 0,
      }}
    >
      {tools.map((tool, i) => (
        <button
          key={i}
          title={tool.title}
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            border: tool.active
              ? "1px solid rgba(45,226,255,0.22)"
              : "1px solid rgba(255,255,255,0.04)",
            background: tool.active
              ? "linear-gradient(180deg, rgba(45,226,255,0.12), rgba(45,226,255,0.04))"
              : "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.01))",
            color: tool.active ? ui.cyan : "#95a8cb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: tool.active ? "0 0 18px rgba(45,226,255,0.12)" : "none",
          }}
        >
          {tool.icon}
        </button>
      ))}

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
  );
}

function MiniSparkline({
  data,
  trend,
}: {
  data: number[];
  trend: "up" | "down" | "neutral";
}) {
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

  const color =
    trend === "up" ? ui.green : trend === "down" ? ui.red : "#8ea2c8";

  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.95"
      />
      <circle
        cx={w}
        cy={h - ((data[data.length - 1] - min) / range) * h}
        r="2.5"
        fill={color}
      />
    </svg>
  );
}

function ScoreBar({
  value,
  max = 100,
  color,
}: {
  value: number;
  max?: number;
  color: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          width: 60,
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
            background: color,
          }}
        />
      </div>
      <span
        style={{
          width: 44,
          textAlign: "right",
          fontSize: 12,
          fontFamily: "monospace",
          color: "#dbe8ff",
        }}
      >
        {value.toFixed(3)}
      </span>
    </div>
  );
}

function EventToneBadge({ tone }: { tone: ScannerEvent["tone"] }) {
  const map = {
    positive: { bg: "rgba(39,245,157,0.12)", color: ui.green, text: "Alta" },
    warning: { bg: "rgba(247,201,72,0.12)", color: ui.yellow, text: "Atenção" },
    neutral: { bg: "rgba(45,226,255,0.10)", color: ui.cyan, text: "Info" },
  }[tone];

  return (
    <span
      style={{
        padding: "3px 8px",
        borderRadius: 999,
        background: map.bg,
        color: map.color,
        fontSize: 10,
        fontWeight: 900,
        whiteSpace: "nowrap",
      }}
    >
      {map.text}
    </span>
  );
}

function AnalyticPreviewPanel() {
  const [activeTab, setActiveTab] = useState("Volume");

  const line1 = Array.from({ length: 34 }, (_, i) => {
    const x = (i / 33) * 420;
    const y = 55 + Math.sin(i / 3) * 16 + Math.cos(i / 5) * 8;
    return `${x},${y}`;
  }).join(" ");

  const line2 = Array.from({ length: 34 }, (_, i) => {
    const x = (i / 33) * 420;
    const y = 52 + Math.cos(i / 2.8) * 12 + Math.sin(i / 4.2) * 6;
    return `${x},${y}`;
  }).join(" ");

  const dots = Array.from({ length: 9 }, (_, i) => ({
    x: 30 + i * 42,
    y: 64 + Math.sin(i * 0.8) * 18,
    c: i % 3 === 0 ? ui.yellow : i % 2 === 0 ? ui.cyan : ui.green,
  }));

  return (
    <div
      style={{
        height: 132,
        borderRadius: 12,
        border: `1px solid ${ui.border}`,
        background:
          "linear-gradient(180deg, rgba(9,14,28,0.98), rgba(7,11,20,0.98))",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          height: 38,
          padding: "0 10px",
          borderBottom: `1px solid ${ui.border}`,
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexShrink: 0,
        }}
      >
        {ANALYTIC_TABS.map((tab) => (
          <TopButton
            key={tab}
            active={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </TopButton>
        ))}
        <span
          style={{
            marginLeft: "auto",
            color: ui.cyan,
            fontSize: 11,
            fontWeight: 900,
            padding: "4px 9px",
            borderRadius: 8,
            background: "rgba(45,226,255,0.1)",
          }}
        >
          +IA Atlas 2350
        </span>
      </div>

      <div style={{ flex: 1, padding: "8px 10px" }}>
        <svg width="100%" height="100%" viewBox="0 0 420 150" preserveAspectRatio="none">
          {Array.from({ length: 10 }, (_, i) => (
            <line
              key={`h-${i}`}
              x1="0"
              y1={i * 15}
              x2="420"
              y2={i * 15}
              stroke="rgba(255,255,255,0.045)"
              strokeWidth="1"
            />
          ))}
          {Array.from({ length: 12 }, (_, i) => (
            <line
              key={`v-${i}`}
              x1={i * 38}
              y1="0"
              x2={i * 38}
              y2="150"
              stroke="rgba(255,255,255,0.035)"
              strokeWidth="1"
            />
          ))}
          {Array.from({ length: 26 }, (_, i) => {
            const x = 8 + i * 15.5;
            const h = 8 + ((i * 17) % 48);
            return (
              <rect
                key={i}
                x={x}
                y={132 - h}
                width="8"
                height={h}
                rx="2"
                fill={i % 2 === 0 ? "rgba(49,233,255,0.45)" : "rgba(247,201,72,0.35)"}
              />
            );
          })}
          <polyline points={line1} fill="none" stroke={ui.cyan} strokeWidth="1.7" />
          <polyline points={line2} fill="none" stroke={ui.yellow} strokeWidth="1.4" opacity="0.85" />
          {dots.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r="3.4" fill={d.c} />
          ))}
        </svg>
      </div>
    </div>
  );
}

function EventsMiniPanel({ events }: { events: ScannerEvent[] }) {
  return (
    <div
      style={{
        height: 132,
        borderRadius: 12,
        border: `1px solid ${ui.border}`,
        background:
          "linear-gradient(180deg, rgba(8,12,24,0.98), rgba(5,8,15,0.98))",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          height: 38,
          padding: "0 12px",
          borderBottom: `1px solid ${ui.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <span style={{ color: "#eaf3ff", fontSize: 12, fontWeight: 900 }}>
          Eventos
        </span>
        <ChevronRight size={12} color="#7f93b7" />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
        <div style={{ display: "grid", gap: 6 }}>
          {events.slice(0, 3).map((event, i) => (
            <div
              key={`${event.time}-${i}`}
              style={{
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.06)",
                background:
                  "linear-gradient(180deg, rgba(11,17,32,0.98), rgba(8,12,22,0.98))",
                padding: "8px 9px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  marginBottom: 5,
                }}
              >
                <span
                  style={{
                    color: "#8ca0c6",
                    fontSize: 10,
                    fontWeight: 800,
                  }}
                >
                  {event.time}
                </span>
                <EventToneBadge tone={event.tone} />
              </div>

              <div
                style={{
                  color: "#edf5ff",
                  fontSize: 11,
                  fontWeight: 800,
                  lineHeight: 1.25,
                  marginBottom: 3,
                }}
              >
                {event.title}
              </div>

              <div
                style={{
                  color: "#7f93b7",
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                {event.tag}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScannerPanelContinuous({ assets }: { assets: AssetScore[] }) {
  const list = useMemo(() => {
    const expanded: AssetScore[] = [];
    for (let i = 0; i < 4; i++) expanded.push(...assets);
    return expanded;
  }, [assets]);

  const sparklines = useMemo(
    () => list.map((a) => generateSparkline(24, 40 + Math.random() * 40, a.trend)),
    [list]
  );

  return (
    <div
      style={{
        borderRadius: 12,
        border: `1px solid ${ui.border}`,
        background:
          "linear-gradient(180deg, rgba(7,10,19,0.98), rgba(5,8,15,0.98))",
        display: "flex",
        flexDirection: "column",
        minHeight: 860,
      }}
    >
      <div
        style={{
          height: 40,
          padding: "0 12px",
          borderBottom: `1px solid ${ui.border}`,
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            color: "#f1f7ff",
            fontSize: 13,
            fontWeight: 900,
            letterSpacing: 0.3,
          }}
        >
          MESTRE SCANNER
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 0.84fr 0.84fr 0.8fr 0.96fr",
          gap: 8,
          padding: "8px 12px",
          borderBottom: `1px solid ${ui.border}`,
          color: "#6c7da2",
          fontSize: 11,
          flexShrink: 0,
          background:
            "linear-gradient(180deg, rgba(7,10,19,0.99), rgba(5,8,15,0.99))",
        }}
      >
        <span>Top Forge</span>
        <span>Score</span>
        <span>Preço</span>
        <span>RSI / MFI</span>
        <span>Mini Chart</span>
      </div>

      <div style={{ display: "grid" }}>
        {list.map((asset, i) => (
          <div
            key={`${asset.symbol}-${i}`}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 0.84fr 0.84fr 0.8fr 0.96fr",
              gap: 8,
              padding: "10px 12px",
              borderBottom: "1px solid rgba(255,255,255,0.045)",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: asset.color,
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              <span style={{ color: "#edf5ff", fontSize: 12, fontWeight: 800 }}>
                {asset.symbol}
              </span>
            </div>

            <ScoreBar value={asset.volumeScore} color={asset.color} />

            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  color: "#eef5ff",
                  fontSize: 12,
                  fontFamily: "monospace",
                }}
              >
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

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                minWidth: 0,
              }}
            >
              {asset.trend === "up" ? (
                <TrendingUp size={11} color={ui.green} />
              ) : asset.trend === "down" ? (
                <TrendingDown size={11} color={ui.red} />
              ) : (
                <Activity size={11} color="#a2b3d3" />
              )}
              <span
                style={{
                  color: "#8fd6ff",
                  fontSize: 12,
                  fontFamily: "monospace",
                }}
              >
                {asset.rsiMfi.toFixed(3)}
              </span>
            </div>

            <MiniSparkline data={sparklines[i]} trend={asset.trend} />
          </div>
        ))}
      </div>
    </div>
  );
}

function LiquidityCard({
  title,
  value,
  sub,
  tone = "neutral",
}: {
  title: string;
  value: string;
  sub: string;
  tone?: "positive" | "warning" | "neutral";
}) {
  const color =
    tone === "positive" ? ui.green : tone === "warning" ? ui.yellow : ui.cyan;

  return (
    <div
      style={{
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.06)",
        background:
          "linear-gradient(180deg, rgba(9,15,29,0.98), rgba(7,12,24,0.98))",
        padding: 12,
        minHeight: 78,
      }}
    >
      <div
        style={{
          color: "#7f93b7",
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: 0.7,
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        {title}
      </div>

      <div
        style={{
          color,
          fontSize: 16,
          fontWeight: 900,
          marginBottom: 6,
        }}
      >
        {value}
      </div>

      <div
        style={{
          color: "#9bb0d4",
          fontSize: 11,
          lineHeight: 1.3,
        }}
      >
        {sub}
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
          <span
            style={{
              color: "#9ab0d4",
              fontSize: 12,
              fontFamily: "monospace",
            }}
          >
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
                boxShadow: "0 0 18px rgba(255,255,255,0.05)",
              }}
            />
          </div>

          <span
            style={{
              color: "#e9f3ff",
              fontSize: 11,
              fontWeight: 800,
              textAlign: "right",
            }}
          >
            {r.value}%
          </span>
        </div>
      ))}
    </div>
  );
}

function LiquiditySection({ events }: { events: ScannerEvent[] }) {
  const [activeLiquidityTab, setActiveLiquidityTab] = useState("Heatmap");

  return (
    <div
      style={{
        borderTop: `1px solid ${ui.border}`,
        background:
          "linear-gradient(180deg, rgba(7,10,19,0.98), rgba(5,8,15,0.98))",
      }}
    >
      <div
        style={{
          height: 42,
          padding: "0 14px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          borderBottom: `1px solid ${ui.border}`,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            color: "#f2f7ff",
            fontSize: 13,
            fontWeight: 900,
            marginRight: 6,
          }}
        >
          Liquidez Avançada
        </span>

        {LIQUIDITY_TABS.map((tab) => (
          <TopButton
            key={tab}
            active={activeLiquidityTab === tab}
            onClick={() => setActiveLiquidityTab(tab)}
          >
            {tab}
          </TopButton>
        ))}
      </div>

      <div
        style={{
          padding: 12,
          display: "grid",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 10,
          }}
        >
          <LiquidityCard
            title="Liquidez superior"
            value="$72.200"
            sub="Bloco vendedor forte acima do preço atual."
            tone="warning"
          />
          <LiquidityCard
            title="Liquidez inferior"
            value="$69.800"
            sub="Absorção compradora ganhando espessura."
            tone="positive"
          />
          <LiquidityCard
            title="Cluster dominante"
            value="BTC Core"
            sub="Maior concentração institucional."
            tone="neutral"
          />
          <LiquidityCard
            title="Pressão instantânea"
            value="+18.6%"
            sub="Fluxo favorecendo continuação curta."
            tone="positive"
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.26fr 0.62fr",
            gap: 12,
          }}
        >
          <div
            style={{
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.06)",
              background:
                "linear-gradient(180deg, rgba(9,15,29,0.98), rgba(7,12,24,0.98))",
              padding: 14,
              minHeight: 220,
            }}
          >
            <div
              style={{
                color: "#edf5ff",
                fontSize: 13,
                fontWeight: 900,
                marginBottom: 12,
              }}
            >
              {activeLiquidityTab === "Map" && "Mapa de Liquidez"}
              {activeLiquidityTab === "Heatmap" && "Heatmap de Intensidade"}
              {activeLiquidityTab === "Clusters" && "Clusters Relevantes"}
              {activeLiquidityTab === "Eventos" && "Eventos de Liquidez"}
            </div>

            {activeLiquidityTab === "Map" && (
              <div
                style={{
                  height: 182,
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.05)",
                  background:
                    "radial-gradient(circle at 50% 30%, rgba(45,226,255,0.18), transparent 30%), radial-gradient(circle at 72% 52%, rgba(39,245,157,0.18), transparent 26%), radial-gradient(circle at 36% 70%, rgba(247,201,72,0.16), transparent 24%), linear-gradient(180deg, rgba(5,10,20,0.95), rgba(7,11,20,0.98))",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {Array.from({ length: 8 }, (_, i) => (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      left: `${8 + i * 11}%`,
                      top: 0,
                      bottom: 0,
                      width: 1,
                      background: "rgba(255,255,255,0.04)",
                    }}
                  />
                ))}
                {Array.from({ length: 6 }, (_, i) => (
                  <div
                    key={`h-${i}`}
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: `${12 + i * 14}%`,
                      height: 1,
                      background: "rgba(255,255,255,0.04)",
                    }}
                  />
                ))}
                <div
                  style={{
                    position: "absolute",
                    left: "14%",
                    top: "28%",
                    width: "26%",
                    height: 18,
                    borderRadius: 999,
                    background: "rgba(255,107,134,0.48)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: "48%",
                    top: "50%",
                    width: "22%",
                    height: 18,
                    borderRadius: 999,
                    background: "rgba(49,233,255,0.45)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: "22%",
                    top: "72%",
                    width: "34%",
                    height: 18,
                    borderRadius: 999,
                    background: "rgba(39,245,157,0.40)",
                  }}
                />
              </div>
            )}

            {activeLiquidityTab === "Heatmap" && <HeatmapBars />}

            {activeLiquidityTab === "Clusters" && (
              <div style={{ display: "grid", gap: 10 }}>
                {[
                  ["Cluster A", "Forte presença acima do preço", ui.red],
                  ["Cluster B", "Absorção parcial no miolo", ui.yellow],
                  ["Cluster C", "Suporte consistente abaixo", ui.green],
                  ["Cluster D", "Pressão curta reduzida", ui.cyan],
                ].map(([a, b, c]) => (
                  <div
                    key={a}
                    style={{
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.06)",
                      background:
                        "linear-gradient(180deg, rgba(11,17,32,0.98), rgba(8,12,22,0.98))",
                      padding: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          color: "#edf5ff",
                          fontSize: 12,
                          fontWeight: 900,
                          marginBottom: 4,
                        }}
                      >
                        {a}
                      </div>
                      <div
                        style={{
                          color: "#8ea2c8",
                          fontSize: 12,
                        }}
                      >
                        {b}
                      </div>
                    </div>
                    <div
                      style={{
                        color: c as string,
                        fontSize: 12,
                        fontWeight: 900,
                      }}
                    >
                      Ativo
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeLiquidityTab === "Eventos" && (
              <div style={{ display: "grid", gap: 8 }}>
                {events.slice(0, 6).map((event, i) => (
                  <div
                    key={`${event.time}-${i}-liq`}
                    style={{
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.06)",
                      background:
                        "linear-gradient(180deg, rgba(11,17,32,0.98), rgba(8,12,22,0.98))",
                      padding: 12,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          color: "#8da1c8",
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        {event.time}
                      </span>
                      <EventToneBadge tone={event.tone} />
                    </div>
                    <div
                      style={{
                        color: "#eef6ff",
                        fontSize: 12,
                        fontWeight: 800,
                        marginBottom: 4,
                      }}
                    >
                      {event.title}
                    </div>
                    <div
                      style={{
                        color: "#7f93b7",
                        fontSize: 11,
                      }}
                    >
                      {event.tag}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            style={{
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.06)",
              background:
                "linear-gradient(180deg, rgba(9,15,29,0.98), rgba(7,12,24,0.98))",
              padding: 14,
            }}
          >
            <div
              style={{
                color: "#edf5ff",
                fontSize: 13,
                fontWeight: 900,
                marginBottom: 12,
              }}
            >
              Leitura rápida
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {[
                ["Liquidez acima", "Pesada", ui.red],
                ["Liquidez abaixo", "Saudável", ui.green],
                ["Risco curto", "Controlado", ui.yellow],
                ["Confluência", "8 / 9", ui.cyan],
                ["Fluxo", "Positivo", ui.green],
                ["Volatilidade", "Moderada", "#dce8ff"],
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
                  <span style={{ color: "#8ea2c8", fontSize: 12 }}>{k}</span>
                  <span style={{ color: c as string, fontSize: 12, fontWeight: 900 }}>
                    {v}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SecondPageSection({
  assets,
  events,
}: {
  assets: AssetScore[];
  events: ScannerEvent[];
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.62fr 0.92fr",
        gap: 10,
        padding: 10,
        background:
          "linear-gradient(180deg, rgba(7,10,19,0.98), rgba(5,8,15,0.98))",
      }}
    >
      <div style={{ display: "grid", gridTemplateRows: "132px 132px auto", gap: 10 }}>
        <AnalyticPreviewPanel />
        <EventsMiniPanel events={events} />
        <LiquiditySection events={events} />
      </div>

      <ScannerPanelContinuous assets={assets} />
    </div>
  );
}

function ChartPanel({
  candles,
  indicators,
  selectedObject,
  mode,
}: {
  candles: CandleData[];
  indicators: IndicatorData[];
  selectedObject: DrawObject | null;
  mode: ModeKey;
}) {
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

    const vc: IChartApi = createChart(volOverlayRef.current, {
      ...baseChartOpts,
      width: volOverlayRef.current.clientWidth,
      height: volOverlayRef.current.clientHeight,
      rightPriceScale: {
        visible: false,
        borderColor: "rgba(255,255,255,0)",
      },
      timeScale: {
        visible: false,
        borderColor: "rgba(255,255,255,0)",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.0)", style: 1 as const },
        horzLines: { color: "rgba(255,255,255,0.0)", style: 1 as const },
      },
    });

    const volSeries = vc.addHistogramSeries({ priceScaleId: "" });
    volSeries.setData(
      candles.map((c) => ({
        time: c.time as Time,
        value: c.volume,
        color: c.close >= c.open ? "rgba(55,244,173,0.42)" : "rgba(255,108,141,0.42)",
      }))
    );
    vc.timeScale().fitContent();

    const rc: IChartApi = createChart(rsiRef.current, {
      ...baseChartOpts,
      width: rsiRef.current.clientWidth,
      height: rsiRef.current.clientHeight,
    });

    const rsiSeries = rc.addLineSeries({
      color: "#9b7cff",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    const mfiSeries = rc.addLineSeries({
      color: "#d2b000",
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    rsiSeries.setData(
      indicators.map((d) => ({
        time: d.time as Time,
        value: clamp(d.rsi, 0, 100),
      }))
    );

    mfiSeries.setData(
      indicators.map((d) => ({
        time: d.time as Time,
        value: clamp(d.mfi, 0, 100),
      }))
    );

    rc.timeScale().fitContent();

    mc.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (range !== null) {
        vc.timeScale().setVisibleLogicalRange(range);
        rc.timeScale().setVisibleLogicalRange(range);
      }
    });

    const resize = () => {
      if (mainRef.current) {
        mc.applyOptions({
          width: mainRef.current.clientWidth,
          height: mainRef.current.clientHeight,
        });
      }
      if (volOverlayRef.current) {
        vc.applyOptions({
          width: volOverlayRef.current.clientWidth,
          height: volOverlayRef.current.clientHeight,
        });
      }
      if (rsiRef.current) {
        rc.applyOptions({
          width: rsiRef.current.clientWidth,
          height: rsiRef.current.clientHeight,
        });
      }
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
          padding: "8px 10px",
          borderBottom: `1px solid ${ui.border}`,
          background:
            "linear-gradient(180deg, rgba(12,19,36,0.94), rgba(8,13,25,0.94))",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr repeat(4, 0.7fr) auto",
            gap: 8,
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 7,
                background: "rgba(247,201,72,0.16)",
                color: ui.yellow,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
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
                  fontSize: 14,
                  fontWeight: 900,
                  lineHeight: 1.1,
                }}
              >
                BTCUSDT
              </div>
              <div
                style={{
                  color: "#7d91b6",
                  fontSize: 10,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Scanner Atlas • Pasta: Cursor • Item: Navegar • TF: 15m
              </div>
            </div>
          </div>

          <MiniStatCard
            title="Preço"
            value={livePrice.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            valueColor="#4ef0cb"
          />
          <MiniStatCard
            title="Variação"
            value={`${isPositive ? "+" : ""}${priceChange.toFixed(2)}%`}
            valueColor={isPositive ? ui.green : ui.red}
          />
          <MiniStatCard
            title="Volume"
            value={formatCompact(candles[candles.length - 1]?.volume ?? 0)}
            valueColor="#51e6ff"
          />
          <MiniStatCard
            title="Desenhos"
            value={selectedObject ? "1" : "0"}
            valueColor={selectedObject ? ui.yellow : ui.red}
          />

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

      <div
        style={{
          height: 32,
          padding: "0 10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${ui.border}`,
          background: "rgba(255,255,255,0.015)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <TopButton active>Objetos</TopButton>
          <TopButton>Travar</TopButton>
          <TopButton>Ocultar</TopButton>
          <TopButton>Limpar desenhos</TopButton>
          <TopButton>Apagar selecionado</TopButton>
        </div>

        <div
          style={{
            color: selectedObject ? "#dce8ff" : "#7f93b7",
            fontSize: 10,
            fontWeight: 800,
          }}
        >
          {selectedObject ? `${selectedObject.name} • ${selectedObject.type}` : "Nenhum objeto selecionado"}
        </div>
      </div>

      <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
        <div ref={mainRef} style={{ position: "absolute", inset: 0 }} />
        <div
          ref={volOverlayRef}
          style={{
            position: "absolute",
            left: 0,
            right: 58,
            bottom: 0,
            height: 88,
            pointerEvents: "none",
            opacity: 0.95,
            borderTop: "1px solid rgba(255,255,255,0.05)",
            background:
              "linear-gradient(180deg, rgba(8,13,25,0.05), rgba(8,13,25,0.4))",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 14,
            bottom: 70,
            color: "#7f93b7",
            fontSize: 10,
            fontFamily: "monospace",
            pointerEvents: "none",
            background: "rgba(5,8,15,0.55)",
            padding: "2px 6px",
            borderRadius: 6,
          }}
        >
          Volume
        </div>
      </div>

      <div style={{ flexShrink: 0, borderTop: `1px solid ${ui.border}` }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "5px 14px",
            background: "#0a0f1d",
          }}
        >
          <span style={{ color: "#7f93b7", fontSize: 10, fontFamily: "monospace" }}>
            RSI / MFI
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#dce8ff", fontSize: 10 }}>
            <span style={{ width: 12, height: 2, background: "#9b7cff", display: "inline-block" }} />
            RSI
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#dce8ff", fontSize: 10 }}>
            <span style={{ width: 12, height: 2, background: "#d2b000", display: "inline-block" }} />
            MFI
          </span>
        </div>
        <div ref={rsiRef} style={{ height: 92, width: "100%" }} />
      </div>
    </div>
  );
}

export default function AtlasChartPro2() {
  const [timeframe, setTimeframe] = useState<Timeframe>("15m");
  const [mode] = useState<ModeKey>("auto");
  const [objects] = useState<DrawObject[]>([{ id: "1", name: "Linha 1", type: "line" }]);
  const [selectedId] = useState<string | null>(null);

  const candles = useMemo(() => generateCandles(240, 70200), []);
  const indicators = useMemo(() => generateIndicators(candles), [candles]);

  const selectedObject = useMemo(
    () => objects.find((o) => o.id === selectedId) ?? null,
    [objects, selectedId]
  );

  const scannerAssets = useMemo<AssetScore[]>(
    () => [
      { symbol: "PET", volumeScore: 63.625, rsiMfi: 46.464, price: 65360, change: 0.8, trend: "up", color: "#27f59d" },
      { symbol: "CORE", volumeScore: 89.650, rsiMfi: 41.925, price: 65907, change: 0.6, trend: "up", color: "#31c8ff" },
      { symbol: "INJ", volumeScore: 10.055, rsiMfi: 82.086, price: 65990, change: 1.1, trend: "up", color: "#4f8dff" },
      { symbol: "RENDER", volumeScore: 16.055, rsiMfi: 53.029, price: 65320, change: -0.4, trend: "down", color: "#f7c948" },
      { symbol: "BTC", volumeScore: 82.410, rsiMfi: 64.820, price: 74682, change: 2.8, trend: "up", color: "#27f59d" },
      { symbol: "ETH", volumeScore: 73.350, rsiMfi: 58.100, price: 3840, change: 1.2, trend: "up", color: "#31c8ff" },
      { symbol: "SOL", volumeScore: 61.180, rsiMfi: 43.700, price: 182, change: -1.6, trend: "down", color: "#ffb14a" },
      { symbol: "BNB", volumeScore: 69.080, rsiMfi: 52.200, price: 612, change: 0.9, trend: "neutral", color: "#f7c948" },
      { symbol: "XRP", volumeScore: 55.630, rsiMfi: 39.900, price: 0.72, change: -2.1, trend: "down", color: "#a783ff" },
      { symbol: "DOGE", volumeScore: 66.140, rsiMfi: 57.600, price: 0.18, change: 1.7, trend: "up", color: "#22c55e" },
      { symbol: "ARB", volumeScore: 44.620, rsiMfi: 48.300, price: 1.21, change: 0.5, trend: "neutral", color: "#52b6ff" },
      { symbol: "SEI", volumeScore: 71.440, rsiMfi: 61.820, price: 0.58, change: 3.1, trend: "up", color: "#31e9ff" },
    ],
    []
  );

  const scannerEvents = useMemo<ScannerEvent[]>(
    () => [
      { time: "21:43", title: "Scanner detectou expansão de fluxo em BTCUSDT", tag: "Fluxo • Scanner", tone: "positive" },
      { time: "21:41", title: "Confluência subiu para 8/9 com suporte de liquidez", tag: "Confluência", tone: "positive" },
      { time: "21:36", title: "RSI/MFI entrou em zona de atenção para INJ", tag: "RSI / MFI", tone: "warning" },
      { time: "21:31", title: "Estrutura de Euler permaneceu forte no cluster principal", tag: "Euler", tone: "neutral" },
      { time: "21:28", title: "Singularidade acelerou em ativos de alta beta", tag: "Singularidade", tone: "positive" },
      { time: "21:22", title: "Risco assimétrico melhorou após absorção de venda", tag: "Risco Assimétrico", tone: "positive" },
      { time: "21:15", title: "Evento macro próximo pode gerar volatilidade adicional", tag: "Eventos", tone: "warning" },
      { time: "21:10", title: "Liquidez abaixo do preço começou a engrossar", tag: "Liquidez", tone: "neutral" },
      { time: "21:04", title: "Scanner+ marcou retomada no ciclo curto", tag: "Scanner+", tone: "positive" },
      { time: "20:58", title: "Estrutura lateral perdeu força em SOL", tag: "Estrutura", tone: "warning" },
      { time: "20:51", title: "Razão de prata confirmou suporte sólido", tag: "Razão de Prata", tone: "positive" },
      { time: "20:45", title: "Pressão de venda reduziu no bloco institucional", tag: "Fluxo", tone: "neutral" },
      { time: "20:36", title: "Eventos de agenda aumentam chance de volatilidade curta", tag: "Eventos", tone: "warning" },
      { time: "20:29", title: "Scanner Atlas marcou alta probabilidade em PET", tag: "Scanner Atlas", tone: "positive" },
      { time: "20:18", title: "Fluxo estabilizou após absorção de venda no miolo", tag: "Fluxo", tone: "neutral" },
      { time: "20:05", title: "Confluência perdeu 1 ponto em ativo de menor liquidez", tag: "Confluência", tone: "warning" },
    ],
    []
  );

  const lastCandle = candles[candles.length - 1];
  const firstCandle = candles[0];
  const priceChange =
    ((lastCandle.close - firstCandle.close) / firstCandle.close) * 100;

  const aiInsight = useMemo<AIInsight>(
    () => ({
      symbol: "BTCUSDT",
      price: lastCandle.close,
      score: 84,
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

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden",
        overflowY: "auto",
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

      <div style={{ display: "flex", minHeight: 0, alignItems: "stretch" }}>
        <LeftToolbar />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              minHeight: "calc(100vh - 114px)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ height: "calc(100vh - 114px)" }}>
              <ChartPanel
                candles={candles}
                indicators={indicators}
                selectedObject={selectedObject}
                mode={mode}
              />
            </div>
          </div>

          <SecondPageSection
            assets={scannerAssets}
            events={scannerEvents}
          />
        </div>

        <div
          style={{
            width: 258,
            flexShrink: 0,
            borderLeft: `1px solid ${ui.border}`,
            background:
              "linear-gradient(180deg, rgba(7,11,20,0.98), rgba(4,7,14,0.98))",
            minHeight: "calc(100vh - 114px)",
          }}
        >
          <AIInsightPanel insight={aiInsight} />
        </div>
      </div>
    </div>
  );
}
