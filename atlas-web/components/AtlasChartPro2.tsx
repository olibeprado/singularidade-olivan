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
  Bell,
  BrainCircuit,
  ChevronDown,
  ChevronRight,
  Droplets,
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
  Sigma,
  Square,
  Star,
  Trash2,
  TrendingUp,
  Waves,
  Layers3,
  ScanSearch,
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

type DrawObject = {
  id: string;
  name: string;
  type: string;
  locked?: boolean;
  hidden?: boolean;
};

const TIMEFRAMES: Timeframe[] = ["1m", "5m", "15m", "30m", "1H", "4H", "1D"];
const NAV_TABS = ["Gráfico", "Ordens", "Posições", "IA Atlas", "Fluxo"];

const ui = {
  bg: "#060913",
  panel: "#0b1222",
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
        {sectionTitle("IA Atlas Insights")}
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
          {sectionTitle("Estrutura")}
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
          {sectionTitle("Confluência")}
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

function ChartPanel({
  candles,
  selectedObject,
  mode,
}: {
  candles: CandleData[];
  selectedObject: DrawObject | null;
  mode: ModeKey;
}) {
  const mainRef = useRef<HTMLDivElement>(null);
  const [livePrice, setLivePrice] = useState<number>(candles[candles.length - 1]?.close ?? 0);
  const [priceChange, setPriceChange] = useState<number>(0);

  useEffect(() => {
    if (!mainRef.current) return;

    const chart: IChartApi = createChart(mainRef.current, {
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

    const cSeries = chart.addCandlestickSeries({
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

    chart.timeScale().fitContent();

    const last = candles[candles.length - 1];
    const prev = candles[candles.length - 2] ?? last;
    setLivePrice(last.close);
    setPriceChange(((last.close - prev.close) / prev.close) * 100);

    const resize = () => {
      if (mainRef.current) {
        chart.applyOptions({
          width: mainRef.current.clientWidth,
          height: mainRef.current.clientHeight,
        });
      }
    };

    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      chart.remove();
    };
  }, [candles]);

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
                Scanner Atlas • Pasta: Cursor • Item: Navegar • TF: 15m
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
            value={candleVol(candles[candles.length - 1]?.volume ?? 0)}
            valueColor="#51e6ff"
          />
          <StatCard
            title="Desenhos"
            value={selectedObject ? "1" : "0"}
            valueColor={selectedObject ? ui.yellow : ui.red}
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
          <TopButton active>Objetos</TopButton>
          <TopButton>Travar</TopButton>
          <TopButton>Ocultar</TopButton>
          <TopButton>Limpar desenhos</TopButton>
          <TopButton>Apagar selecionado</TopButton>
        </div>

        <div
          style={{
            color: selectedObject ? "#dce8ff" : "#7f93b7",
            fontSize: 11,
            fontWeight: 800,
          }}
        >
          {selectedObject ? `${selectedObject.name} • ${selectedObject.type}` : "Nenhum objeto selecionado"}
        </div>
      </div>

      <div ref={mainRef} style={{ flex: 1, minHeight: 0, width: "100%" }} />
    </div>
  );
}

function candleVol(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  return n.toFixed(2);
}

export default function AtlasChartPro2() {
  const [timeframe, setTimeframe] = useState<Timeframe>("15m");
  const [mode] = useState<ModeKey>("auto");
  const [objects] = useState<DrawObject[]>([
    { id: "1", name: "Linha 1", type: "line" },
  ]);
  const [selectedId] = useState<string | null>(null);

  const candles = useMemo(() => generateCandles(240, 70200), []);

  const selectedObject = useMemo(
    () => objects.find((o) => o.id === selectedId) ?? null,
    [objects, selectedId]
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
        <LeftToolbar />

        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, minHeight: 0 }}>
          <ChartPanel
            candles={candles}
            selectedObject={selectedObject}
            mode={mode}
          />
        </div>

        <div
          style={{
            width: 258,
            flexShrink: 0,
            borderLeft: `1px solid ${ui.border}`,
            background:
              "linear-gradient(180deg, rgba(7,11,20,0.98), rgba(4,7,14,0.98))",
          }}
        >
          <AIInsightPanel insight={aiInsight} />
        </div>
      </div>
    </div>
  );
}
