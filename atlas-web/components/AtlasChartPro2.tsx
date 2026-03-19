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
    const drift =
      trend === "up" ? 1.2 : trend === "down" ? -1.2 : 0.15;
    value += drift + (Math.random() - 0.5) * 3.2;
    arr.push(value);
  }

  return arr;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
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

function ScoreDots({ count, total = 9 }: { count: number; total?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${
            i < count ? "bg-cyan-400" : "bg-gray-700"
          }`}
        />
      ))}
    </div>
  );
}

function StructureRow({ item }: { item: StructureItem }) {
  const getValueClass = (type: StructureItem["type"]) => {
    switch (type) {
      case "positive":
        return "text-green-400";
      case "strong":
        return "text-green-300 font-semibold";
      case "negative":
        return "text-red-400";
      case "neutral":
        return "text-gray-400";
      default:
        return "text-gray-300";
    }
  };

  return (
    <div className="flex items-center justify-between py-1.5 border-b border-[#1e1e2e] last:border-0">
      <div className="flex items-center gap-1.5">
        <ChevronRight size={10} className="text-gray-600" />
        <span className="text-gray-400 text-xs">{item.label}</span>
      </div>
      {item.type === "dots" && item.dots !== undefined ? (
        <ScoreDots count={item.dots} />
      ) : (
        <span className={`text-xs ${getValueClass(item.type)}`}>{item.value}</span>
      )}
    </div>
  );
}

function AIInsightPanel({ insight }: { insight: AIInsight }) {
  const scoreColor =
    insight.score >= 80 ? "#00ff88" : insight.score >= 60 ? "#facc15" : "#ff4757";

  return (
    <div className="flex flex-col h-full bg-[#0d0d14] overflow-y-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e2e]">
        <span className="text-white text-sm font-semibold">IA Atlas Insights</span>
        <ChevronDown size={14} className="text-gray-500" />
      </div>

      <div className="px-4 py-3 border-b border-[#1e1e2e]">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <span className="text-yellow-400 text-xs">₿</span>
            <span className="text-gray-300 text-sm font-mono">{insight.symbol}</span>
          </div>
          <span className="text-gray-400 font-mono text-xs">
            {insight.price.toLocaleString()}
          </span>
        </div>

        <div className="flex items-end justify-between mt-2">
          <span className="text-white text-2xl font-bold font-mono">
            {insight.symbol}
          </span>
          <div className="flex items-end gap-1">
            <span
              className="text-4xl font-black font-mono"
              style={{ color: scoreColor }}
            >
              {insight.score}
            </span>
            <div className="flex flex-col items-center mb-1">
              <TrendingUp size={14} style={{ color: scoreColor }} />
              <span style={{ color: scoreColor }} className="text-xs">
                ↑
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-gray-400 text-xs">Score</span>
          <span
            className="text-sm font-semibold px-3 py-1 rounded"
            style={{ backgroundColor: `${scoreColor}22`, color: scoreColor }}
          >
            {insight.signal}
          </span>
        </div>
      </div>

      <div className="px-4 py-2 border-b border-[#1e1e2e] space-y-1">
        <div className="flex items-center justify-between py-1">
          <span className="text-gray-400 text-xs">Risco</span>
          <span className="text-yellow-400 text-xs font-medium">
            {insight.riskLevel}
          </span>
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="text-gray-400 text-xs">Tipo</span>
          <span className="text-red-400 text-xs font-medium">
            {insight.riskType}
          </span>
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="text-gray-400 text-xs">Invalidação</span>
          <span className="text-gray-200 text-xs font-mono">
            ${insight.invalidation.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white text-xs font-semibold">Estrutura</span>
          <div className="flex gap-1">
            <ChevronDown size={12} className="text-gray-500" />
            <ChevronRight size={12} className="text-gray-500" />
          </div>
        </div>
        {insight.structure.map((item, i) => (
          <StructureRow key={i} item={item} />
        ))}
      </div>

      <div className="px-4 pt-3 pb-3 border-t border-[#1e1e2e] mt-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white text-xs font-semibold">Confluência</span>
          <ChevronRight size={12} className="text-gray-500" />
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
    <div className="flex items-center h-12 px-3 bg-[#0d0d14] border-b border-[#1e1e2e] gap-2 select-none flex-shrink-0">
      <div className="flex items-center gap-2 mr-3">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center">
          <Activity size={14} className="text-white" />
        </div>
        <span className="text-white font-bold text-sm tracking-wider">
          SINGULARIDADE
        </span>
        <span className="text-xs text-cyan-400 font-mono bg-cyan-400/10 px-1.5 py-0.5 rounded">
          OBP
        </span>
      </div>

      <div className="w-px h-6 bg-[#1e1e2e]" />

      <button className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#1a1a2e] hover:bg-[#1e1e38] transition-colors">
        <span className="text-yellow-400 text-xs">₿</span>
        <span className="text-white text-sm font-medium">{symbol}</span>
        <ChevronDown size={12} className="text-gray-500" />
      </button>

      <div className="flex items-center gap-2 ml-1">
        <span className="text-white font-mono text-sm font-semibold">
          ${price.toLocaleString()}
        </span>
        <span
          className={`text-xs font-mono font-medium ${
            isPositive ? "text-green-400" : "text-red-400"
          }`}
        >
          {isPositive ? "+" : ""}
          {change.toFixed(2)}%
        </span>
      </div>

      <div className="w-px h-6 bg-[#1e1e2e] mx-1" />

      <div className="flex items-center gap-0.5">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf}
            onClick={() => onTimeframeChange(tf)}
            className={`px-2.5 py-1 text-xs font-mono rounded transition-all ${
              timeframe === tf
                ? "bg-cyan-500/20 text-cyan-400 font-semibold"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      <div className="w-px h-6 bg-[#1e1e2e] mx-1" />

      <button
        onClick={() => setReplayMode(!replayMode)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-all ${
          replayMode
            ? "bg-yellow-500/20 text-yellow-400"
            : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
        }`}
      >
        <RotateCcw size={11} />
        <span>Replay</span>
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        {NAV_TABS.map((tab, i) => (
          <button
            key={tab}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              i === 0
                ? "bg-yellow-500/20 text-yellow-400 font-medium"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 ml-2">
        <span className="text-green-400 text-xs font-medium">+1.88%</span>
        <Search size={15} className="text-gray-400 hover:text-white cursor-pointer" />
        <Bell size={15} className="text-gray-400 hover:text-white cursor-pointer" />
        <Settings
          size={15}
          className="text-gray-400 hover:text-white cursor-pointer"
        />
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
    <div className="flex flex-col items-center py-2 px-1 bg-[#0d0d14] border-r border-[#1e1e2e] w-10 flex-shrink-0 gap-0.5 overflow-y-auto">
      {tools.map((t, i) => (
        <button
          key={i}
          title={t.tooltip}
          className={`p-2 rounded transition-all ${
            i === 0
              ? "text-cyan-400 bg-cyan-400/10"
              : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
          }`}
        >
          {t.icon}
        </button>
      ))}

      <div className="flex-1" />

      <button className="p-2 text-gray-600 hover:text-white transition-colors">
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

  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
      <circle
        cx={w}
        cy={h - ((data[data.length - 1] - min) / range) * h}
        r="2"
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
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-[#1e1e2e] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-mono text-gray-300 w-10 text-right">
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
    () =>
      assets.map((a) => generateSparkline(24, 40 + Math.random() * 40, a.trend)),
    [assets]
  );

  return (
    <div className="flex flex-col h-full bg-[#0d0d14] border-t border-[#1e1e2e]">
      <div className="flex items-center gap-1 px-3 py-2 border-b border-[#1e1e2e] flex-shrink-0">
        {TOP_SCANNER_TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => onTabChange(t)}
            className={`flex items-center gap-1 px-3 py-1 text-xs rounded transition-colors ${
              i === 2
                ? "text-yellow-400"
                : activeTab === t
                ? "bg-[#1e1e2e] text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {i === 1 && <BarChart2 size={10} />}
            {i === 2 && <Activity size={10} />}
            {t}
          </button>
        ))}
        <div className="flex-1" />
        <span className="text-gray-600 text-xs">⊞ ≡ ⊟</span>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex flex-col flex-1 overflow-auto">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[#1e1e2e] flex-shrink-0">
            <span className="text-white text-xs font-bold tracking-wide">
              MESTRE SCANNER
            </span>
            <div className="flex-1" />
            {SCANNER_TABS.map((t) => (
              <button
                key={t}
                onClick={() => onTabChange(t)}
                className={`text-xs px-2 py-0.5 rounded transition-colors ${
                  activeTab === t
                    ? "text-white bg-[#1e1e2e]"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {t}
              </button>
            ))}
            <span className="text-xs text-cyan-400 px-2 py-0.5 rounded bg-cyan-400/10 ml-1">
              IA Atlas 2350
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2 px-3 py-1.5 border-b border-[#1e1e2e] text-xs text-gray-500 flex-shrink-0">
            <span>Top Forge</span>
            <span>Score</span>
            <span>RSI/MFI</span>
            <span>Preço</span>
            <span>Mini Chart</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {assets.map((asset, i) => (
              <div
                key={asset.symbol}
                className="grid grid-cols-5 gap-2 px-3 py-2 border-b border-[#1e1e2e] items-center hover:bg-white/5 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: asset.color }}
                  />
                  <span className="text-xs font-semibold text-white">
                    {asset.symbol}
                  </span>
                </div>

                <ScoreBar value={asset.volumeScore} color={asset.color} />

                <div className="flex items-center gap-1">
                  {asset.trend === "up" ? (
                    <TrendingUp size={10} className="text-green-400 flex-shrink-0" />
                  ) : asset.trend === "down" ? (
                    <TrendingDown size={10} className="text-red-400 flex-shrink-0" />
                  ) : (
                    <Activity size={10} className="text-gray-400 flex-shrink-0" />
                  )}
                  <span className="text-xs font-mono text-gray-300">
                    {asset.rsiMfi.toFixed(3)}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-xs font-mono text-gray-200">
                    ${asset.price.toLocaleString()}
                  </span>
                  <span
                    className={`text-xs font-mono ${
                      asset.change >= 0 ? "text-green-400" : "text-red-400"
                    }`}
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

        <div className="w-64 border-l border-[#1e1e2e] flex flex-col">
          <div className="px-3 py-2 border-b border-[#1e1e2e] flex items-center justify-between">
            <span className="text-xs text-gray-400">IA Atlas 2350</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-3 gap-2">
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
            <div className="w-full flex flex-col gap-1">
              {[
                { label: "Estrutura", value: "▲ Positivo", c: "text-green-400" },
                { label: "Euler", value: "Forte", c: "text-green-300" },
                {
                  label: "Razão de Prata",
                  value: "Suporte Sólido",
                  c: "text-green-400",
                },
                { label: "Ciclo", value: "Acelerado", c: "text-cyan-400" },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-xs">
                  <span className="text-gray-500">{row.label}</span>
                  <span className={row.c}>{row.value}</span>
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

  const mainChart = useRef<IChartApi | null>(null);
  const volChart = useRef<IChartApi | null>(null);
  const rsiChart = useRef<IChartApi | null>(null);

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

    const mc = createChart(mainRef.current, {
      ...baseChartOpts,
      width: mainRef.current.clientWidth,
      height: mainRef.current.clientHeight,
    });
    mainChart.current = mc;

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

    const vc = createChart(volRef.current, {
      ...baseChartOpts,
      width: volRef.current.clientWidth,
      height: volRef.current.clientHeight,
    });
    volChart.current = vc;

    const volSeries = vc.addHistogramSeries({ priceScaleId: "right" });
    volSeries.setData(
      candles.map((c) => ({
        time: c.time as Time,
        value: c.volume,
        color: c.close >= c.open ? "#00d26a55" : "#ff475755",
      }))
    );
    vc.timeScale().fitContent();

    const rc = createChart(rsiRef.current, {
      ...baseChartOpts,
      width: rsiRef.current.clientWidth,
      height: rsiRef.current.clientHeight,
    });
    rsiChart.current = rc;

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
    <div className="flex flex-col h-full bg-[#0a0a10]">
      <div className="flex items-center gap-4 px-4 py-2 border-b border-[#1e1e2e] flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs">BTCUSDT</span>
          <span
            className={`font-mono text-lg font-bold ${
              isPositive ? "text-green-400" : "text-red-400"
            }`}
          >
            ${livePrice.toFixed(2)}
          </span>
          <span
            className={`text-xs font-mono px-1.5 py-0.5 rounded ${
              isPositive
                ? "bg-green-400/10 text-green-400"
                : "bg-red-400/10 text-red-400"
            }`}
          >
            {isPositive ? "▲" : "▼"} {Math.abs(priceChange).toFixed(2)}%
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-yellow-400 inline-block" />
            MA20
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-orange-400 inline-block" />
            MA50
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-cyan-400 inline-block" />
            EMA9
          </span>
        </div>
      </div>

      <div ref={mainRef} className="flex-1 min-h-0 w-full" />

      <div className="flex-shrink-0">
        <div className="flex items-center gap-2 px-4 py-1 border-t border-[#1e1e2e] bg-[#0a0a10]">
          <span className="text-xs text-gray-500 font-mono">Volume</span>
          <span className="w-2 h-2 rounded-sm bg-green-500/50 inline-block" />
          <span className="w-2 h-2 rounded-sm bg-red-500/50 inline-block" />
        </div>
        <div ref={volRef} style={{ height: "80px" }} className="w-full" />
      </div>

      <div className="flex-shrink-0">
        <div className="flex items-center gap-3 px-4 py-1 border-t border-[#1e1e2e] bg-[#0a0a10]">
          <span className="text-xs text-gray-500 font-mono">RSI / MFI</span>
          <span className="flex items-center gap-1 text-xs font-mono">
            <span className="w-3 h-0.5 bg-purple-400 inline-block" />
            RSI
          </span>
          <span className="flex items-center gap-1 text-xs font-mono">
            <span className="w-3 h-0.5 bg-yellow-400 inline-block" />
            MFI
          </span>
        </div>
        <div ref={rsiRef} style={{ height: "80px" }} className="w-full" />
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
      {
        symbol: "BTC",
        volumeScore: 82.41,
        rsiMfi: 64.82,
        price: 74682,
        change: 2.8,
        trend: "up",
        color: "#00d26a",
      },
      {
        symbol: "ETH",
        volumeScore: 73.35,
        rsiMfi: 58.1,
        price: 3840,
        change: 1.2,
        trend: "up",
        color: "#00c2ff",
      },
      {
        symbol: "SOL",
        volumeScore: 61.18,
        rsiMfi: 43.7,
        price: 182,
        change: -1.6,
        trend: "down",
        color: "#ff9f43",
      },
      {
        symbol: "BNB",
        volumeScore: 69.08,
        rsiMfi: 52.2,
        price: 612,
        change: 0.9,
        trend: "neutral",
        color: "#facc15",
      },
      {
        symbol: "XRP",
        volumeScore: 55.63,
        rsiMfi: 39.9,
        price: 0.72,
        change: -2.1,
        trend: "down",
        color: "#a78bfa",
      },
      {
        symbol: "DOGE",
        volumeScore: 66.14,
        rsiMfi: 57.6,
        price: 0.18,
        change: 1.7,
        trend: "up",
        color: "#22c55e",
      },
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
    <div
      className="flex flex-col w-full h-screen bg-[#0a0a10] overflow-hidden"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <TopBar
        symbol="BTCUSDT"
        price={lastCandle.close}
        change={priceChange}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
      />

      <div className="flex flex-1 min-h-0">
        <DrawingToolbar />

        <div className="flex flex-col flex-1 min-w-0 min-h-0">
          <div className="flex-1 min-h-0" style={{ height: "calc(100% - 220px)" }}>
            <ChartPanel candles={candles} indicators={indicators} />
          </div>

          <div style={{ height: "220px" }} className="flex-shrink-0">
            <ScannerPanel
              assets={scannerAssets}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>
        </div>

        <div className="w-72 flex-shrink-0 border-l border-[#1e1e2e]">
          <AIInsightPanel insight={aiInsight} />
        </div>
      </div>
    </div>
  );
}
