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
  ChevronDown,
  ChevronRight,
  Eye,
  Magnet,
  Maximize2,
  MousePointer2,
  PenTool,
  RotateCcw,
  Ruler,
  Search,
  Settings,
  Shapes,
  Square,
  Star,
  Trash2,
  TrendingDown,
  TrendingUp,
  Type,
} from "lucide-react";

type Timeframe = "1m" | "5m" | "15m" | "30m" | "1H" | "4H" | "1D";

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

const TIMEFRAMES: Timeframe[] = ["1m", "5m", "15m", "30m", "1H", "4H", "1D"];
const NAV_TABS = ["Gráfico", "Ordens", "Posições", "IA Atlas", "Fluxo"];
const SCANNER_TABS = ["Volume", "RSI/MFI", "Fluxo", "Singularidade", "Confluência"];
const TOP_SCANNER_TABS = ["Indicadores", "Fluxo", "Scanner", "Scanner+", "Eventos", "1Bs"];

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function generateCandles(count = 240, startPrice = 74500): CandleData[] {
  const now = Math.floor(Date.now() / 1000);
  const candles: CandleData[] = [];
  let prevClose = startPrice;

  for (let i = count; i > 0; i--) {
    const time = now - i * 300;
    const drift = (Math.random() - 0.47) * 180;
    const open = prevClose;
    const close = Math.max(1000, open + drift);
    const high = Math.max(open, close) + Math.random() * 90;
    const low = Math.min(open, close) - Math.random() * 90;
    const volume = 100 + Math.random() * 1200;

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

function generateIndicators(candles: CandleData[]): IndicatorData[] {
  return candles.map((c, i) => {
    const base = 45 + Math.sin(i / 8) * 16 + (Math.random() - 0.5) * 7;
    const base2 = 50 + Math.cos(i / 10) * 18 + (Math.random() - 0.5) * 7;
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
    const drift = trend === "up" ? 1.2 : trend === "down" ? -1.2 : 0.15;
    value += drift + (Math.random() - 0.5) * 3.2;
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

const styles = {
  page: {
    display: "flex",
    flexDirection: "column" as const,
    width: "100%",
    height: "100vh",
    background: "#0a0a10",
    color: "#fff",
    overflow: "hidden",
    fontFamily: "Inter, Arial, sans-serif",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    height: 48,
    padding: "0 12px",
    background: "#0d0d14",
    borderBottom: "1px solid #1e1e2e",
    gap: 8,
    flexShrink: 0,
  },
  main: {
    display: "flex",
    flex: 1,
    minHeight: 0,
  },
  leftToolbar: {
    width: 42,
    background: "#0d0d14",
    borderRight: "1px solid #1e1e2e",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    padding: "8px 4px",
    gap: 4,
    flexShrink: 0,
    overflowY: "auto" as const,
  },
  center: {
    display: "flex",
    flexDirection: "column" as const,
    flex: 1,
    minWidth: 0,
    minHeight: 0,
  },
  chartWrap: {
    flex: 1,
    minHeight: 0,
  },
  bottomScanner: {
    height: 220,
    flexShrink: 0,
  },
  rightPanel: {
    width: 288,
    flexShrink: 0,
    borderLeft: "1px solid #1e1e2e",
    background: "#0d0d14",
    overflowY: "auto" as const,
  },
  btn: {
    border: "1px solid #2a2a3a",
    background: "#161622",
    color: "#cfcfe7",
    borderRadius: 6,
    padding: "4px 8px",
    fontSize: 12,
    cursor: "pointer",
  },
  tabBtn: {
    border: "none",
    background: "transparent",
    color: "#8b8ba3",
    borderRadius: 6,
    padding: "4px 8px",
    fontSize: 12,
    cursor: "pointer",
  },
  activeTabBtn: {
    border: "none",
    background: "rgba(250,204,21,0.14)",
    color: "#facc15",
    borderRadius: 6,
    padding: "4px 8px",
    fontSize: 12,
    cursor: "pointer",
    fontWeight: 600,
  },
  pill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 8px",
    borderRadius: 6,
    background: "#161622",
    border: "1px solid #252535",
    fontSize: 12,
  },
  toolbarBtn: {
    width: 30,
    height: 30,
    border: "none",
    borderRadius: 6,
    background: "transparent",
    color: "#7f7f95",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  toolbarBtnActive: {
    width: 30,
    height: 30,
    border: "none",
    borderRadius: 6,
    background: "rgba(34,211,238,0.12)",
    color: "#22d3ee",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  panelHeader: {
    padding: "12px 16px",
    borderBottom: "1px solid #1e1e2e",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
};

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
            background: i < count ? "#22d3ee" : "#374151",
            display: "inline-block",
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
        return "#4ade80";
      case "strong":
        return "#86efac";
      case "negative":
        return "#f87171";
      case "neutral":
        return "#9ca3af";
      default:
        return "#d1d5db";
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px 0",
        borderBottom: "1px solid #1e1e2e",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <ChevronRight size={10} color="#6b7280" />
        <span style={{ fontSize: 12, color: "#9ca3af" }}>{item.label}</span>
      </div>
      {item.type === "dots" && item.dots !== undefined ? (
        <ScoreDots count={item.dots} />
      ) : (
        <span style={{ fontSize: 12, color: getColor(item.type) }}>{item.value}</span>
      )}
    </div>
  );
}

function AIInsightPanel({ insight }: { insight: AIInsight }) {
  const scoreColor =
    insight.score >= 80 ? "#00ff88" : insight.score >= 60 ? "#facc15" : "#ff4757";

  return (
    <div style={{ height: "100%", background: "#0d0d14", overflowY: "auto" }}>
      <div style={styles.panelHeader}>
        <span style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>
          IA Atlas Insights
        </span>
        <ChevronDown size={14} color="#6b7280" />
      </div>

      <div style={{ padding: 16, borderBottom: "1px solid #1e1e2e" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "#facc15", fontSize: 12 }}>₿</span>
            <span style={{ color: "#d1d5db", fontSize: 13, fontFamily: "monospace" }}>
              {insight.symbol}
            </span>
          </div>
          <span style={{ color: "#9ca3af", fontSize: 12, fontFamily: "monospace" }}>
            {insight.price.toLocaleString()}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginTop: 8,
          }}
        >
          <span style={{ color: "#fff", fontSize: 28, fontWeight: 700, fontFamily: "monospace" }}>
            {insight.symbol}
          </span>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
            <span
              style={{
                fontSize: 42,
                fontWeight: 900,
                fontFamily: "monospace",
                color: scoreColor,
                lineHeight: 1,
              }}
            >
              {insight.score}
            </span>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <TrendingUp size={14} color={scoreColor} />
              <span style={{ color: scoreColor, fontSize: 11 }}>↑</span>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 10,
          }}
        >
          <span style={{ color: "#9ca3af", fontSize: 12 }}>Score</span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              padding: "6px 12px",
              borderRadius: 6,
              background: `${scoreColor}22`,
              color: scoreColor,
            }}
          >
            {insight.signal}
          </span>
        </div>
      </div>

      <div style={{ padding: "10px 16px", borderBottom: "1px solid #1e1e2e" }}>
        <div style={riskRowStyle}>
          <span style={riskLabelStyle}>Risco</span>
          <span style={{ ...riskValueStyle, color: "#facc15" }}>{insight.riskLevel}</span>
        </div>
        <div style={riskRowStyle}>
          <span style={riskLabelStyle}>Tipo</span>
          <span style={{ ...riskValueStyle, color: "#f87171" }}>{insight.riskType}</span>
        </div>
        <div style={riskRowStyle}>
          <span style={riskLabelStyle}>Invalidação</span>
          <span style={{ ...riskValueStyle, color: "#e5e7eb" }}>
            ${insight.invalidation.toLocaleString()}
          </span>
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
          <span style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>Estrutura</span>
          <div style={{ display: "flex", gap: 4 }}>
            <ChevronDown size={12} color="#6b7280" />
            <ChevronRight size={12} color="#6b7280" />
          </div>
        </div>
        {insight.structure.map((item, i) => (
          <StructureRow key={i} item={item} />
        ))}
      </div>

      <div style={{ padding: "12px 16px 16px", borderTop: "1px solid #1e1e2e", marginTop: 8 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <span style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>Confluência</span>
          <ChevronRight size={12} color="#6b7280" />
        </div>
        {insight.structure2.map((item, i) => (
          <StructureRow key={i} item={item} />
        ))}
      </div>
    </div>
  );
}

const riskRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "6px 0",
};

const riskLabelStyle: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: 12,
};

const riskValueStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
};

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
    <div style={styles.topBar}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 12 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #22d3ee, #7c3aed)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Activity size={14} color="#fff" />
        </div>
        <span style={{ color: "#fff", fontWeight: 700, fontSize: 14, letterSpacing: 0.8 }}>
          SINGULARIDADE
        </span>
        <span
          style={{
            color: "#22d3ee",
            fontSize: 11,
            fontFamily: "monospace",
            background: "rgba(34,211,238,0.1)",
            padding: "2px 6px",
            borderRadius: 6,
          }}
        >
          OBP
        </span>
      </div>

      <div style={{ width: 1, height: 24, background: "#1e1e2e" }} />

      <button style={styles.pill}>
        <span style={{ color: "#facc15", fontSize: 12 }}>₿</span>
        <span style={{ color: "#fff", fontSize: 13, fontWeight: 500 }}>{symbol}</span>
        <ChevronDown size={12} color="#6b7280" />
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 4 }}>
        <span style={{ color: "#fff", fontFamily: "monospace", fontSize: 13, fontWeight: 600 }}>
          ${price.toLocaleString()}
        </span>
        <span
          style={{
            color: isPositive ? "#4ade80" : "#f87171",
            fontSize: 12,
            fontFamily: "monospace",
            fontWeight: 600,
          }}
        >
          {isPositive ? "+" : ""}
          {change.toFixed(2)}%
        </span>
      </div>

      <div style={{ width: 1, height: 24, background: "#1e1e2e", margin: "0 6px" }} />

      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf}
            onClick={() => onTimeframeChange(tf)}
            style={
              timeframe === tf
                ? {
                    ...styles.btn,
                    background: "rgba(34,211,238,0.12)",
                    color: "#22d3ee",
                    border: "1px solid rgba(34,211,238,0.18)",
                  }
                : {
                    ...styles.btn,
                    background: "transparent",
                    border: "none",
                    color: "#9ca3af",
                  }
            }
          >
            {tf}
          </button>
        ))}
      </div>

      <div style={{ width: 1, height: 24, background: "#1e1e2e", margin: "0 6px" }} />

      <button
        onClick={() => setReplayMode(!replayMode)}
        style={
          replayMode
            ? {
                ...styles.btn,
                background: "rgba(250,204,21,0.12)",
                color: "#facc15",
                border: "1px solid rgba(250,204,21,0.18)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }
            : {
                ...styles.btn,
                background: "transparent",
                border: "none",
                color: "#9ca3af",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }
        }
      >
        <RotateCcw size={11} />
        <span>Replay</span>
      </button>

      <div style={{ flex: 1 }} />

      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        {NAV_TABS.map((tab, i) => (
          <button key={tab} style={i === 0 ? styles.activeTabBtn : styles.tabBtn}>
            {tab}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: 10 }}>
        <span style={{ color: "#4ade80", fontSize: 12, fontWeight: 600 }}>+1.88%</span>
        <Search size={15} color="#9ca3af" />
        <Bell size={15} color="#9ca3af" />
        <Settings size={15} color="#9ca3af" />
      </div>
    </div>
  );
}

function DrawingToolbar() {
  const tools = [
    { icon: <MousePointer2 size={16} />, tooltip: "Cursor" },
    { icon: <TrendingUp size={16} />, tooltip: "Linha de Tendência" },
    { icon: <BarChart2 size={16} />, tooltip: "Gann & Fibonacci" },
    { icon: <Shapes size={16} />, tooltip: "Formas Geométricas" },
    { icon: <PenTool size={16} />, tooltip: "Pincel" },
    { icon: <Type size={16} />, tooltip: "Texto" },
    { icon: <Square size={16} />, tooltip: "Padrões" },
    { icon: <Activity size={16} />, tooltip: "Previsão e Medição" },
    { icon: <Star size={16} />, tooltip: "Favoritos" },
    { icon: <Ruler size={16} />, tooltip: "Medir" },
    { icon: <Maximize2 size={16} />, tooltip: "Zoom" },
    { icon: <Magnet size={16} />, tooltip: "Magnetismo" },
    { icon: <Eye size={16} />, tooltip: "Ocultar Desenhos" },
    { icon: <Trash2 size={16} />, tooltip: "Remover Objetos" },
  ];

  return (
    <div style={styles.leftToolbar}>
      {tools.map((t, i) => (
        <button
          key={i}
          title={t.tooltip}
          style={i === 0 ? styles.toolbarBtnActive : styles.toolbarBtn}
        >
          {t.icon}
        </button>
      ))}
      <div style={{ flex: 1 }} />
      <button style={styles.toolbarBtn}>
        <Settings size={14} />
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
  const w = 80;
  const h = 32;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");

  const color =
    trend === "up" ? "#00d26a" : trend === "down" ? "#ff4757" : "#6b7280";

  const lastX = w;
  const lastY = h - ((data[data.length - 1] - min) / range) * h;

  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
      <circle cx={lastX} cy={lastY} r="2" fill={color} />
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
          width: 64,
          height: 6,
          background: "#1e1e2e",
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
          width: 40,
          textAlign: "right",
          fontSize: 12,
          fontFamily: "monospace",
          color: "#d1d5db",
        }}
      >
        {value.toFixed(3)}
      </span>
    </div>
  );
}

function ScannerPanel({
  assets,
  activeTab,
  onTabChange,
}: {
  assets: AssetScore[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  const sparklines = useMemo(
    () => assets.map((a) => generateSparkline(24, 40 + Math.random() * 40, a.trend)),
    [assets]
  );

  return (
    <div
      style={{
        height: "100%",
        background: "#0d0d14",
        borderTop: "1px solid #1e1e2e",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "8px 12px",
          borderBottom: "1px solid #1e1e2e",
          flexShrink: 0,
        }}
      >
        {TOP_SCANNER_TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => onTabChange(t)}
            style={
              i === 2
                ? { ...styles.tabBtn, color: "#facc15" }
                : activeTab === t
                ? { ...styles.btn, background: "#1e1e2e", color: "#fff", border: "none" }
                : styles.tabBtn
            }
          >
            {t}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ color: "#6b7280", fontSize: 12 }}>⊞ ≡ ⊟</span>
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              borderBottom: "1px solid #1e1e2e",
              flexShrink: 0,
            }}
          >
            <span style={{ color: "#fff", fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }}>
              MESTRE SCANNER
            </span>
            <div style={{ flex: 1 }} />
            {SCANNER_TABS.map((t) => (
              <button
                key={t}
                onClick={() => onTabChange(t)}
                style={
                  activeTab === t
                    ? { ...styles.btn, background: "#1e1e2e", color: "#fff", border: "none" }
                    : styles.tabBtn
                }
              >
                {t}
              </button>
            ))}
            <span
              style={{
                color: "#22d3ee",
                fontSize: 12,
                padding: "4px 8px",
                borderRadius: 6,
                background: "rgba(34,211,238,0.1)",
              }}
            >
              IA Atlas 2350
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr 1fr 1fr 1fr",
              gap: 8,
              padding: "8px 12px",
              borderBottom: "1px solid #1e1e2e",
              color: "#6b7280",
              fontSize: 12,
              flexShrink: 0,
            }}
          >
            <span>Top Forge</span>
            <span>Score</span>
            <span>RSI/MFI</span>
            <span>Preço</span>
            <span>Mini Chart</span>
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {assets.map((asset, i) => (
              <div
                key={asset.symbol}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 1fr 1fr 1fr 1fr",
                  gap: 8,
                  padding: "10px 12px",
                  borderBottom: "1px solid #1e1e2e",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: asset.color,
                      display: "inline-block",
                    }}
                  />
                  <span style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>
                    {asset.symbol}
                  </span>
                </div>

                <ScoreBar value={asset.volumeScore} color={asset.color} />

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {asset.trend === "up" ? (
                    <TrendingUp size={10} color="#4ade80" />
                  ) : asset.trend === "down" ? (
                    <TrendingDown size={10} color="#f87171" />
                  ) : (
                    <Activity size={10} color="#9ca3af" />
                  )}
                  <span style={{ color: "#d1d5db", fontSize: 12, fontFamily: "monospace" }}>
                    {asset.rsiMfi.toFixed(3)}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ color: "#e5e7eb", fontSize: 12, fontFamily: "monospace" }}>
                    ${asset.price.toLocaleString()}
                  </span>
                  <span
                    style={{
                      color: asset.change >= 0 ? "#4ade80" : "#f87171",
                      fontSize: 12,
                      fontFamily: "monospace",
                    }}
                  >
                    {asset.change >= 0 ? "+" : ""}
                    {asset.change.toFixed(1)}%
                  </span>
                </div>

                <MiniSparkline data={sparklines[i]} trend={asset.trend} />
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            width: 256,
            borderLeft: "1px solid #1e1e2e",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              padding: "8px 12px",
              borderBottom: "1px solid #1e1e2e",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ color: "#9ca3af", fontSize: 12 }}>IA Atlas 2350</span>
          </div>

          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: 12,
              gap: 10,
            }}
          >
            <svg width="100%" height="80" viewBox="0 0 200 80">
              <line x1="0" y1="40" x2="200" y2="40" stroke="#1e1e2e" strokeWidth="1" />
              <polyline
                points={Array.from({ length: 30 }, (_, i) => {
                  const x = (i / 29) * 200;
                  const y = 40 + Math.sin(i / 3) * 20 + (Math.random() - 0.5) * 10;
                  return `${x},${y}`;
                }).join(" ")}
                fill="none"
                stroke="#00d9ff"
                strokeWidth="1.5"
              />
            </svg>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { label: "Estrutura", value: "▲ Positivo", c: "#4ade80" },
                { label: "Euler", value: "Forte", c: "#86efac" },
                { label: "Razão de Prata", value: "Suporte Sólido", c: "#4ade80" },
                { label: "Ciclo", value: "Acelerado", c: "#22d3ee" },
              ].map((row) => (
                <div
                  key={row.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: "#6b7280" }}>{row.label}</span>
                  <span style={{ color: row.c }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartPanel({
  candles,
  indicators,
}: {
  candles: CandleData[];
  indicators: IndicatorData[];
}) {
  const mainRef = useRef<HTMLDivElement>(null);
  const volRef = useRef<HTMLDivElement>(null);
  const rsiRef = useRef<HTMLDivElement>(null);

  const [livePrice, setLivePrice] = useState<number>(candles[candles.length - 1]?.close ?? 0);
  const [priceChange, setPriceChange] = useState<number>(0);

  useEffect(() => {
    if (!mainRef.current || !volRef.current || !rsiRef.current) return;

    const baseChartOpts = {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#6b7280",
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: "#1e1e2e", style: 1 as const },
        horzLines: { color: "#1e1e2e", style: 1 as const },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: {
        borderColor: "#1e1e2e",
      },
      timeScale: {
        borderColor: "#1e1e2e",
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
      upColor: "#00d26a",
      downColor: "#ff4757",
      borderUpColor: "#00d26a",
      borderDownColor: "#ff4757",
      wickUpColor: "#00d26a",
      wickDownColor: "#ff4757",
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
      color: "#facc15",
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    ma20.setData(computeSMA(candles, 20).map((d) => ({ time: d.time as Time, value: d.value })));

    const ma50 = mc.addLineSeries({
      color: "#fb923c",
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    ma50.setData(computeSMA(candles, 50).map((d) => ({ time: d.time as Time, value: d.value })));

    const ema9 = mc.addLineSeries({
      color: "#67e8f9",
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

    const volSeries = vc.addHistogramSeries({ priceScaleId: "right" });
    volSeries.setData(
      candles.map((c) => ({
        time: c.time as Time,
        value: c.volume,
        color: c.close >= c.open ? "#00d26a55" : "#ff475755",
      }))
    );
    vc.timeScale().fitContent();

    const rc: IChartApi = createChart(rsiRef.current, {
      ...baseChartOpts,
      width: rsiRef.current.clientWidth,
      height: rsiRef.current.clientHeight,
    });

    const rsiSeries = rc.addLineSeries({
      color: "#a78bfa",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    });
    const mfiSeries = rc.addLineSeries({
      color: "#facc15",
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
      if (volRef.current) {
        vc.applyOptions({
          width: volRef.current.clientWidth,
          height: volRef.current.clientHeight,
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
        background: "#0a0a10",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "8px 16px",
          borderBottom: "1px solid #1e1e2e",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#9ca3af", fontSize: 12 }}>BTCUSDT</span>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 18,
              fontWeight: 700,
              color: isPositive ? "#4ade80" : "#f87171",
            }}
          >
            ${livePrice.toFixed(2)}
          </span>
          <span
            style={{
              fontSize: 12,
              fontFamily: "monospace",
              padding: "3px 6px",
              borderRadius: 6,
              background: isPositive ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
              color: isPositive ? "#4ade80" : "#f87171",
            }}
          >
            {isPositive ? "▲" : "▼"} {Math.abs(priceChange).toFixed(2)}%
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 12,
            fontFamily: "monospace",
            color: "#d1d5db",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 12, height: 2, background: "#facc15", display: "inline-block" }} />
            MA20
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 12, height: 2, background: "#fb923c", display: "inline-block" }} />
            MA50
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 12, height: 2, background: "#67e8f9", display: "inline-block" }} />
            EMA9
          </span>
        </div>
      </div>

      <div ref={mainRef} style={{ flex: 1, minHeight: 0, width: "100%" }} />

      <div style={{ flexShrink: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 16px",
            borderTop: "1px solid #1e1e2e",
            background: "#0a0a10",
          }}
        >
          <span style={{ color: "#6b7280", fontSize: 12, fontFamily: "monospace" }}>Volume</span>
          <span
            style={{ width: 8, height: 8, borderRadius: 2, background: "rgba(34,197,94,0.5)", display: "inline-block" }}
          />
          <span
            style={{ width: 8, height: 8, borderRadius: 2, background: "rgba(239,68,68,0.5)", display: "inline-block" }}
          />
        </div>
        <div ref={volRef} style={{ height: 80, width: "100%" }} />
      </div>

      <div style={{ flexShrink: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "6px 16px",
            borderTop: "1px solid #1e1e2e",
            background: "#0a0a10",
          }}
        >
          <span style={{ color: "#6b7280", fontSize: 12, fontFamily: "monospace" }}>RSI / MFI</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#d1d5db", fontSize: 12, fontFamily: "monospace" }}>
            <span style={{ width: 12, height: 2, background: "#a78bfa", display: "inline-block" }} />
            RSI
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#d1d5db", fontSize: 12, fontFamily: "monospace" }}>
            <span style={{ width: 12, height: 2, background: "#facc15", display: "inline-block" }} />
            MFI
          </span>
        </div>
        <div ref={rsiRef} style={{ height: 80, width: "100%" }} />
      </div>
    </div>
  );
}

export default function AtlasChartPro2() {
  const [timeframe, setTimeframe] = useState<Timeframe>("5m");
  const [activeTab, setActiveTab] = useState("Volume");

  const candles = useMemo(() => generateCandles(240, 74200), []);
  const indicators = useMemo(() => generateIndicators(candles), [candles]);

  const scannerAssets = useMemo<AssetScore[]>(
    () => [
      { symbol: "BTC", volumeScore: 82.41, rsiMfi: 64.82, price: 74682, change: 2.8, trend: "up", color: "#00d26a" },
      { symbol: "ETH", volumeScore: 73.35, rsiMfi: 58.1, price: 3840, change: 1.2, trend: "up", color: "#00c2ff" },
      { symbol: "SOL", volumeScore: 61.18, rsiMfi: 43.7, price: 182, change: -1.6, trend: "down", color: "#ff9f43" },
      { symbol: "BNB", volumeScore: 69.08, rsiMfi: 52.2, price: 612, change: 0.9, trend: "neutral", color: "#facc15" },
      { symbol: "XRP", volumeScore: 55.63, rsiMfi: 39.9, price: 0.72, change: -2.1, trend: "down", color: "#a78bfa" },
      { symbol: "DOGE", volumeScore: 66.14, rsiMfi: 57.6, price: 0.18, change: 1.7, trend: "up", color: "#22c55e" },
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
      invalidation: 73480,
      structure: [
        { label: "Fluxo", value: "Positivo", type: "positive" },
        { label: "Momentum", value: "Forte", type: "strong" },
        { label: "Liquidez", value: "Acima", type: "positive" },
        { label: "Confluência", type: "dots", dots: 7 },
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
    <div style={styles.page}>
      <TopBar
        symbol="BTCUSDT"
        price={lastCandle.close}
        change={priceChange}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
      />

      <div style={styles.main}>
        <DrawingToolbar />

        <div style={styles.center}>
          <div style={styles.chartWrap}>
            <ChartPanel candles={candles} indicators={indicators} />
          </div>

          <div style={styles.bottomScanner}>
            <ScannerPanel
              assets={scannerAssets}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>
        </div>

        <div style={styles.rightPanel}>
          <AIInsightPanel insight={aiInsight} />
        </div>
      </div>
    </div>
  );
}
