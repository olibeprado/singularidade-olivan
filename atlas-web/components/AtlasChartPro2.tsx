"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { createChart, ColorType } from "lightweight-charts";

type Candle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type TopModule =
  | "Fluxo"
  | "Singularidade"
  | "IA Atlas"
  | "Scanner"
  | "Estrutura"
  | "Euler";

type ToolKey =
  | "cursor"
  | "zoom"
  | "line"
  | "zones"
  | "levels"
  | "measure"
  | "magnet"
  | "clock"
  | "settings";

type ViewMode = "auto" | "manual" | "space";

const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"];
const timeframes = ["1m", "5m", "15m", "1h", "4h"];
const topModules: TopModule[] = [
  "Fluxo",
  "Singularidade",
  "IA Atlas",
  "Scanner",
  "Estrutura",
  "Euler",
];

const moduleIcons: Record<TopModule, string> = {
  Fluxo: "≈",
  Singularidade: "✦",
  "IA Atlas": "◈",
  Scanner: "⌕",
  Estrutura: "▣",
  Euler: "∑",
};

const chartTools: { key: ToolKey; icon: string; label: string }[] = [
  { key: "cursor", icon: "⌖", label: "Cursor" },
  { key: "zoom", icon: "⊕", label: "Zoom" },
  { key: "line", icon: "╱", label: "Linha" },
  { key: "zones", icon: "◫", label: "Zonas" },
  { key: "levels", icon: "≡", label: "Níveis" },
  { key: "measure", icon: "⎘", label: "Medida" },
  { key: "magnet", icon: "⌬", label: "Magnet" },
  { key: "clock", icon: "◷", label: "Replay" },
  { key: "settings", icon: "⚙", label: "Config" },
];

function StatCard({
  title,
  value,
  positive,
}: {
  title: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div
      style={{
        background:
          "linear-gradient(180deg, rgba(14,21,39,0.96), rgba(7,11,22,0.985))",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 14,
        padding: "10px 12px",
        minHeight: 64,
        boxShadow: "0 10px 28px rgba(0,0,0,0.18)",
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "#7f93b9",
          marginBottom: 6,
          letterSpacing: 0.45,
          textTransform: "uppercase",
          fontWeight: 700,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 19,
          fontWeight: 900,
          color:
            positive === undefined ? "#eef4ff" : positive ? "#2fe19a" : "#ff6b81",
          lineHeight: 1.08,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function RightRow({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 0",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        gap: 12,
      }}
    >
      <span style={{ color: "#99a9c8", fontSize: 13 }}>{label}</span>
      <span
        style={{
          color: positive === undefined ? "#eef4ff" : positive ? "#34d399" : "#fb7185",
          fontWeight: 800,
          fontSize: 13,
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function ScannerRow({
  asset,
  score,
  trend,
  price,
}: {
  asset: string;
  score: string;
  trend: string;
  price: string;
}) {
  const up =
    trend.toLowerCase().includes("forte") ||
    trend.toLowerCase().includes("positivo") ||
    trend.toLowerCase().includes("compra") ||
    trend.toLowerCase().includes("alta") ||
    trend.toLowerCase().includes("validação") ||
    trend.toLowerCase().includes("confluência") ||
    trend.toLowerCase().includes("assistida");

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.2fr 1fr 1fr 1fr",
        gap: 10,
        padding: "12px 0",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        color: "#d8e2ff",
        fontSize: 13,
      }}
    >
      <div style={{ fontWeight: 800 }}>{asset}</div>
      <div>{score}</div>
      <div style={{ color: up ? "#34d399" : "#f59e0b", fontWeight: 800 }}>
        {trend}
      </div>
      <div style={{ textAlign: "right" }}>{price}</div>
    </div>
  );
}

function MiniMetricCard({
  title,
  value,
  subtitle,
  positive = true,
}: {
  title: string;
  value: string;
  subtitle: string;
  positive?: boolean;
}) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14,
        padding: 12,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015))",
      }}
    >
      <div
        style={{
          color: "#8ea4c8",
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: 0.45,
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div
        style={{
          color: positive ? "#eaf2ff" : "#ff8ea0",
          fontSize: 22,
          fontWeight: 900,
          lineHeight: 1,
          marginBottom: 8,
        }}
      >
        {value}
      </div>
      <div style={{ color: "#9eb0cf", fontSize: 12 }}>{subtitle}</div>
    </div>
  );
}

function LeftInfoRow({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        padding: "11px 0",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div style={{ color: "#8ea4c8", fontSize: 13 }}>{label}</div>
      <div
        style={{
          color: positive === false ? "#ff8ea0" : positive ? "#34d399" : "#eaf2ff",
          fontWeight: 800,
          fontSize: 13,
          textAlign: "right",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function PremiumButton({
  active,
  onClick,
  children,
  compact,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "relative",
        border: active
          ? "1px solid rgba(255,220,110,0.42)"
          : "1px solid rgba(255,255,255,0.08)",
        background: active
          ? "linear-gradient(180deg, rgba(255,213,79,0.24), rgba(255,170,0,0.08))"
          : "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.018))",
        color: active ? "#fff4bf" : "#bfd0ea",
        borderRadius: 12,
        padding: compact ? "10px 14px" : "11px 16px",
        minHeight: 44,
        fontWeight: 800,
        fontSize: compact ? 13 : 14,
        cursor: "pointer",
        whiteSpace: "nowrap",
        flexShrink: 0,
        boxShadow: active
          ? "0 0 0 1px rgba(255,215,90,0.12) inset, 0 8px 22px rgba(255,180,20,0.10)"
          : "0 6px 18px rgba(0,0,0,0.10)",
        transition: "all 0.18s ease",
      }}
    >
      {active && (
        <span
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 12,
            background:
              "linear-gradient(90deg, rgba(255,255,255,0.00), rgba(255,255,255,0.10), rgba(255,255,255,0.00))",
            pointerEvents: "none",
          }}
        />
      )}
      <span style={{ position: "relative" }}>{children}</span>
    </button>
  );
}

function ControlButton({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        border: active
          ? "1px solid rgba(94,231,255,0.35)"
          : "1px solid rgba(255,255,255,0.08)",
        background: active
          ? "linear-gradient(180deg, rgba(94,231,255,0.16), rgba(94,231,255,0.05))"
          : "rgba(255,255,255,0.03)",
        color: active ? "#bff8ff" : "#d7e4ff",
        borderRadius: 10,
        padding: "7px 10px",
        fontWeight: 800,
        fontSize: 11,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

export default function AtlasChartPro() {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);

  const [symbol, setSymbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState("1m");
  const [activeModule, setActiveModule] = useState<TopModule>("Scanner");
  const [activeTool, setActiveTool] = useState<ToolKey>("cursor");
  const [source, setSource] = useState("carregando...");
  const [price, setPrice] = useState("--");
  const [change, setChange] = useState("--");
  const [volume, setVolume] = useState("--");
  const [lastClose, setLastClose] = useState<number | null>(null);
  const [signal, setSignal] = useState("Compra Forte");
  const [score, setScore] = useState(92);
  const [chartHeight, setChartHeight] = useState(730);
  const [viewportWidth, setViewportWidth] = useState(1440);
  const [viewMode, setViewMode] = useState<ViewMode>("auto");
  const [spaceOffset] = useState(10);

  const hasInitialFitRef = useRef(false);
  const savedScrollPositionRef = useRef<number | null>(null);

  useEffect(() => {
    const handleViewport = () => setViewportWidth(window.innerWidth);
    handleViewport();
    window.addEventListener("resize", handleViewport);
    return () => window.removeEventListener("resize", handleViewport);
  }, []);

  const isCompact = viewportWidth < 1280;
  const isMedium = viewportWidth < 1024;
  const isSmall = viewportWidth < 860;

  useEffect(() => {
    const updateChartHeight = () => {
      const offset = isSmall ? 360 : isMedium ? 340 : 315;
      const nextHeight = Math.max(560, Math.min(window.innerHeight - offset, 900));
      setChartHeight(nextHeight);
    };

    updateChartHeight();
    window.addEventListener("resize", updateChartHeight);

    return () => {
      window.removeEventListener("resize", updateChartHeight);
    };
  }, [isMedium, isSmall]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartHeight,
      layout: {
        background: { type: ColorType.Solid, color: "#09111f" },
        textColor: "#93a9cf",
      },
      grid: {
        vertLines: { color: "rgba(120,140,180,0.10)" },
        horzLines: { color: "rgba(120,140,180,0.10)" },
      },
      crosshair: {
        vertLine: { color: "rgba(255,255,255,0.12)" },
        horzLine: { color: "rgba(255,255,255,0.12)" },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.10)",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.10)",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 6,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#36e29a",
      downColor: "#ff5f7a",
      borderUpColor: "#36e29a",
      borderDownColor: "#ff5f7a",
      wickUpColor: "#36e29a",
      wickDownColor: "#ff5f7a",
    });

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "",
      color: "#3b82f6",
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.84,
        bottom: 0,
      },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    const handleResize = () => {
      if (!chartContainerRef.current || !chartRef.current) return;
      chartRef.current.applyOptions({
        width: chartContainerRef.current.clientWidth,
        height: chartHeight,
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [chartHeight]);

  useEffect(() => {
    setViewMode("auto");
    savedScrollPositionRef.current = null;
    hasInitialFitRef.current = false;
  }, [symbol, timeframe]);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const res = await fetch(
          `/api/market?symbol=${symbol}&interval=${timeframe}&limit=220`,
          { cache: "no-store" }
        );
        const data = await res.json();

        if (cancelled) return;
        if (!res.ok || !data?.candles?.length) {
          setSource("erro");
          return;
        }

        const timeScale = chartRef.current?.timeScale();

        if (timeScale && viewMode === "manual") {
          const currentScrollPosition = timeScale.scrollPosition();
          if (
            typeof currentScrollPosition === "number" &&
            Number.isFinite(currentScrollPosition)
          ) {
            savedScrollPositionRef.current = currentScrollPosition;
          }
        }

        setSource(data.source || "desconhecida");

        const candles: Candle[] = data.candles;

        const normalizedCandles = candles.map((c) => ({
          time: Math.floor(new Date(c.time).getTime() / 1000),
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }));

        const normalizedVolume = candles.map((c) => ({
          time: Math.floor(new Date(c.time).getTime() / 1000),
          value: c.volume,
          color:
            c.close >= c.open
              ? "rgba(54,226,154,0.72)"
              : "rgba(255,95,122,0.72)",
        }));

        candleSeriesRef.current?.setData(normalizedCandles);
        volumeSeriesRef.current?.setData(normalizedVolume);

        if (timeScale) {
          if (!hasInitialFitRef.current) {
            timeScale.fitContent();
            hasInitialFitRef.current = true;
          } else if (viewMode === "auto") {
            timeScale.scrollToRealTime();
          } else if (viewMode === "space") {
            timeScale.scrollToPosition(spaceOffset, false);
          } else if (
            savedScrollPositionRef.current !== null &&
            Number.isFinite(savedScrollPositionRef.current)
          ) {
            timeScale.scrollToPosition(savedScrollPositionRef.current, false);
          }
        }

        const last = candles[candles.length - 1];
        const prev = candles[candles.length - 2] || last;

        setLastClose(last.close);

        setPrice(
          last.close.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        );

        const pct = prev.close
          ? ((last.close - prev.close) / prev.close) * 100
          : 0;

        setChange(`${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`);

        setVolume(
          last.volume.toLocaleString("en-US", {
            maximumFractionDigits: 2,
          })
        );

        const strength = Math.min(
          99,
          Math.max(51, Math.round(70 + Math.abs(pct) * 12))
        );
        setScore(strength);
        setSignal(pct >= 0 ? "Compra Forte" : "Pressão Vendedora");
      } catch {
        if (!cancelled) setSource("erro");
      }
    }

    loadData();
    const timer = window.setInterval(loadData, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [symbol, timeframe, viewMode, spaceOffset]);

  const scoreColor = useMemo(() => {
    if (score >= 85) return "#29d391";
    if (score >= 70) return "#f7c948";
    return "#ff6b81";
  }, [score]);

  const moduleTitle = useMemo(() => {
    switch (activeModule) {
      case "Fluxo":
        return "Fluxo de Mercado";
      case "Singularidade":
        return "Pulso da Singularidade";
      case "IA Atlas":
        return "Leitura IA Atlas";
      case "Scanner":
        return "Scanner Atlas";
      case "Estrutura":
        return "Estrutura do Mercado";
      case "Euler":
        return "Leitura Euler";
      default:
        return "Scanner Atlas";
    }
  }, [activeModule]);

  const moduleAccent = useMemo(() => {
    switch (activeModule) {
      case "Fluxo":
        return "#29d391";
      case "Singularidade":
        return "#5ee7ff";
      case "IA Atlas":
        return "#8b5cf6";
      case "Scanner":
        return "#ffd65a";
      case "Estrutura":
        return "#34d399";
      case "Euler":
        return "#60a5fa";
      default:
        return "#ffd65a";
    }
  }, [activeModule]);

  const bottomTabs =
    activeModule === "Fluxo"
      ? ["Fluxo", "Pressão", "Volume", "Eventos"]
      : activeModule === "Singularidade"
      ? ["Singularidade", "Confluência", "Pulso", "Eventos"]
      : activeModule === "IA Atlas"
      ? ["IA Atlas", "Score", "Risco", "Eventos"]
      : activeModule === "Estrutura"
      ? ["Estrutura", "Euler", "Ciclo", "Eventos"]
      : activeModule === "Euler"
      ? ["Euler", "Curvatura", "Validação", "Eventos"]
      : ["Indicadores", "Fluxo", "Scanner", "Eventos"];

  const leftPanelTitle =
    activeModule === "Scanner"
      ? "Mestre Scanner"
      : activeModule === "Fluxo"
      ? "Mapa de Fluxo"
      : activeModule === "IA Atlas"
      ? "Radar IA Atlas"
      : activeModule === "Estrutura"
      ? "Mapa Estrutural"
      : activeModule === "Euler"
      ? "Validação Euler"
      : "Pulso Singularidade";

  const leftRows =
    activeModule === "Fluxo"
      ? [
          { asset: "BTCUSDT", score: "91.7", trend: "Pressão Compradora", price: "$69,489" },
          { asset: "ETHUSDT", score: "84.1", trend: "Fluxo Positivo", price: "$3,745" },
          { asset: "SOLUSDT", score: "79.4", trend: "Absorção", price: "$168.40" },
          { asset: "BNBUSDT", score: "72.3", trend: "Aceleração", price: "$611.22" },
        ]
      : activeModule === "IA Atlas"
      ? [
          { asset: "BTCUSDT", score: "94.2", trend: "Convicção Alta", price: "$69,489" },
          { asset: "ETHUSDT", score: "88.8", trend: "Compra Assistida", price: "$3,745" },
          { asset: "SOLUSDT", score: "81.0", trend: "Positivo", price: "$168.40" },
          { asset: "BNBUSDT", score: "76.4", trend: "Neutro Forte", price: "$611.22" },
        ]
      : activeModule === "Estrutura"
      ? [
          { asset: "BTCUSDT", score: "93.1", trend: "Estrutura Forte", price: "$69,489" },
          { asset: "ETHUSDT", score: "86.7", trend: "Positivo", price: "$3,745" },
          { asset: "SOLUSDT", score: "80.5", trend: "Continuidade", price: "$168.40" },
          { asset: "BNBUSDT", score: "74.8", trend: "Base Sólida", price: "$611.22" },
        ]
      : activeModule === "Euler"
      ? [
          { asset: "BTCUSDT", score: "90.6", trend: "Validação Forte", price: "$69,489" },
          { asset: "ETHUSDT", score: "83.3", trend: "Curvatura Positiva", price: "$3,745" },
          { asset: "SOLUSDT", score: "78.1", trend: "Confirmação", price: "$168.40" },
          { asset: "BNBUSDT", score: "71.9", trend: "Assimetria", price: "$611.22" },
        ]
      : activeModule === "Singularidade"
      ? [
          { asset: "BTCUSDT", score: "92.8", trend: "Pulso Forte", price: "$69,489" },
          { asset: "ETHUSDT", score: "87.1", trend: "Confluência", price: "$3,745" },
          { asset: "SOLUSDT", score: "82.2", trend: "Positivo", price: "$168.40" },
          { asset: "BNBUSDT", score: "75.0", trend: "Aceleração", price: "$611.22" },
        ]
      : [
          { asset: "BTCUSDT", score: "92.4", trend: "Compra Forte", price: "$69,489" },
          { asset: "ETHUSDT", score: "87.2", trend: "Positivo", price: "$3,745" },
          { asset: "SOLUSDT", score: "82.8", trend: "Positivo", price: "$168.40" },
          { asset: "BNBUSDT", score: "74.9", trend: "Aceleração", price: "$611.22" },
        ];

  const insightConfig = useMemo(() => {
    switch (activeModule) {
      case "Fluxo":
        return {
          panelTitle: "Fluxo",
          scoreValue: Math.max(70, score - 4),
          scoreLabel: "Pressão Compradora",
          rowsTop: [
            { label: "Resumo", value: "Fluxo", positive: true },
            { label: "Ferramenta", value: chartTools.find((t) => t.key === activeTool)?.label || "--", positive: true },
            { label: "Força", value: "Alta", positive: true },
            {
              label: "Invalidação",
              value:
                lastClose
                  ? `$${(lastClose * 0.987).toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                    })}`
                  : "--",
            },
          ],
          rowsBottomTitle: "Fluxo de Mercado",
          rowsBottomDescription:
            "Mapeamento do fluxo, volume e pressão compradora versus vendedora.",
          rowsBottom: [
            { label: "Volume", value: "Elevado", positive: true },
            { label: "Dominância", value: "Compradora", positive: true },
            { label: "Absorção", value: "Ativa", positive: true },
            { label: "Impulso", value: "Acelerando", positive: true },
            { label: "Ciclo", value: "Forte", positive: true },
          ],
        };

      case "Singularidade":
        return {
          panelTitle: "Singularidade",
          scoreValue: Math.max(72, score - 1),
          scoreLabel: "Pulso Forte",
          rowsTop: [
            { label: "Resumo", value: "Singularidade", positive: true },
            { label: "Ferramenta", value: chartTools.find((t) => t.key === activeTool)?.label || "--", positive: true },
            { label: "Pulso", value: "Expandindo", positive: true },
            {
              label: "Invalidação",
              value:
                lastClose
                  ? `$${(lastClose * 0.986).toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                    })}`
                  : "--",
            },
          ],
          rowsBottomTitle: "Pulso da Singularidade",
          rowsBottomDescription:
            "Resumo estrutural com leitura de aceleração, confluência e estabilidade.",
          rowsBottom: [
            { label: "Confluência", value: "Alta", positive: true },
            { label: "Expansão", value: "Ativa", positive: true },
            { label: "Estabilidade", value: "Boa", positive: true },
            { label: "Ritmo", value: "Crescente", positive: true },
            { label: "Ciclo", value: "Acelerado", positive: true },
          ],
        };

      case "IA Atlas":
        return {
          panelTitle: "IA Atlas",
          scoreValue: Math.min(99, score + 3),
          scoreLabel: "Convicção Alta",
          rowsTop: [
            { label: "Resumo", value: "IA Atlas", positive: true },
            { label: "Ferramenta", value: chartTools.find((t) => t.key === activeTool)?.label || "--", positive: true },
            { label: "Risco", value: "Médio", positive: true },
            {
              label: "Invalidação",
              value:
                lastClose
                  ? `$${(lastClose * 0.985).toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                    })}`
                  : "--",
            },
          ],
          rowsBottomTitle: "Leitura IA Atlas",
          rowsBottomDescription:
            "Camada de interpretação sintética com score, risco e invalidação.",
          rowsBottom: [
            { label: "Direção", value: "Positiva", positive: true },
            { label: "Convicção", value: "Alta", positive: true },
            { label: "Risco", value: "Médio", positive: true },
            { label: "Confiança", value: "Elevada", positive: true },
            { label: "Assistência", value: "Ativa", positive: true },
          ],
        };

      case "Estrutura":
        return {
          panelTitle: "Estrutura",
          scoreValue: Math.max(74, score),
          scoreLabel: "Base Sólida",
          rowsTop: [
            { label: "Resumo", value: "Estrutura", positive: true },
            { label: "Ferramenta", value: chartTools.find((t) => t.key === activeTool)?.label || "--", positive: true },
            { label: "Força", value: "Alta", positive: true },
            {
              label: "Invalidação",
              value:
                lastClose
                  ? `$${(lastClose * 0.984).toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                    })}`
                  : "--",
            },
          ],
          rowsBottomTitle: "Estrutura do Mercado",
          rowsBottomDescription:
            "Leitura estrutural com suporte, inclinação, continuidade e zonas principais.",
          rowsBottom: [
            { label: "Base", value: "Estável", positive: true },
            { label: "Suporte", value: "Sólido", positive: true },
            { label: "Inclinação", value: "Positiva", positive: true },
            { label: "Força", value: "Forte", positive: true },
            { label: "Ciclo", value: "Sustentado", positive: true },
          ],
        };

      case "Euler":
        return {
          panelTitle: "Euler",
          scoreValue: Math.max(73, score - 2),
          scoreLabel: "Validação Forte",
          rowsTop: [
            { label: "Resumo", value: "Euler", positive: true },
            { label: "Ferramenta", value: chartTools.find((t) => t.key === activeTool)?.label || "--", positive: true },
            { label: "Validação", value: "Alta", positive: true },
            {
              label: "Invalidação",
              value:
                lastClose
                  ? `$${(lastClose * 0.983).toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                    })}`
                  : "--",
            },
          ],
          rowsBottomTitle: "Leitura Euler",
          rowsBottomDescription:
            "Camada matemática complementar com curvatura, simetria e sustentação.",
          rowsBottom: [
            { label: "Curvatura", value: "Positiva", positive: true },
            { label: "Validação", value: "Forte", positive: true },
            { label: "Simetria", value: "Boa", positive: true },
            { label: "Assimetria", value: "Favorável", positive: true },
            { label: "Modelo", value: "Validado", positive: true },
          ],
        };

      default:
        return {
          panelTitle: "Scanner",
          scoreValue: score,
          scoreLabel: signal,
          rowsTop: [
            { label: "Resumo", value: "Scanner", positive: true },
            { label: "Ferramenta", value: chartTools.find((t) => t.key === activeTool)?.label || "--", positive: true },
            { label: "Força", value: score >= 85 ? "Alta" : "Moderada", positive: true },
            {
              label: "Invalidação",
              value:
                lastClose
                  ? `$${(lastClose * 0.985).toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                    })}`
                  : "--",
            },
          ],
          rowsBottomTitle: "Scanner Atlas",
          rowsBottomDescription:
            "Leitura estrutural dos ativos monitorados em tempo real com força relativa.",
          rowsBottom: [
            { label: "Estrutura", value: "Positivo", positive: true },
            { label: "Euler", value: "Forte", positive: true },
            { label: "Singularidade", value: "5 / 6", positive: true },
            { label: "Razão de Prata", value: "Suporte Sólido", positive: true },
            { label: "Ciclo", value: "Acelerado", positive: true },
          ],
        };
    }
  }, [activeModule, activeTool, lastClose, score, signal]);

  const pulseConfig = useMemo(() => {
    switch (activeModule) {
      case "Fluxo":
        return {
          title: "Fluxo de Mercado",
          description:
            "Mapeamento do fluxo, volume e pressão compradora versus vendedora com leitura de impulso e continuidade.",
          stats: [
            { title: "Fluxo", value: "Forte", positive: true },
            {
              title: "Volume",
              value: volume === "--" ? "18.4" : volume,
              positive: true,
            },
            { title: "Pressão", value: "Compradora", positive: true },
          ],
          path1:
            "M0,98 C40,102 80,96 120,88 C170,72 210,68 250,58 C295,48 330,38 380,30 C430,22 470,18 520,16 C555,15 580,18 600,14",
          path2:
            "M0,116 C45,118 80,110 120,106 C170,100 210,92 250,88 C300,78 350,72 400,62 C455,56 510,48 600,36",
          biasLabel: "Bias",
          biasValue: "Alta",
        };

      case "Singularidade":
        return {
          title: "Pulso da Singularidade",
          description:
            "Resumo estrutural com leitura de aceleração, confluência e estabilidade do movimento dominante.",
          stats: [
            { title: "Pulso", value: "Expandindo", positive: true },
            { title: "Confluência", value: "Alta", positive: true },
            { title: "Ciclo", value: "Acelerado", positive: true },
          ],
          path1:
            "M0,108 C40,104 70,94 100,90 C150,82 180,64 220,54 C255,44 300,42 345,34 C395,28 440,18 490,16 C535,14 565,18 600,20",
          path2:
            "M0,118 C35,122 70,120 110,112 C150,104 190,94 235,90 C280,84 320,76 370,66 C420,56 480,48 600,42",
          biasLabel: "Pulso",
          biasValue: "Forte",
        };

      case "IA Atlas":
        return {
          title: "Leitura IA Atlas",
          description:
            "Camada de interpretação sintética com score, risco, invalidação e direção provável do mercado.",
          stats: [
            { title: "Convicção", value: "Alta", positive: true },
            { title: "Score", value: `${score}`, positive: true },
            { title: "Risco", value: "Médio", positive: true },
          ],
          path1:
            "M0,104 C35,104 60,108 90,100 C130,88 165,82 210,66 C250,54 280,50 330,38 C390,26 430,18 475,16 C515,14 555,16 600,10",
          path2:
            "M0,118 C45,116 85,114 130,110 C180,102 220,94 260,90 C305,82 350,76 405,64 C470,50 520,44 600,30",
          biasLabel: "Bias",
          biasValue: "Assistido",
        };

      case "Scanner":
        return {
          title: "Scanner Atlas",
          description:
            "Leitura resumida dos ativos monitorados em tempo real com prioridade, tendência e força relativa.",
          stats: [
            { title: "Top Score", value: "BTC", positive: true },
            {
              title: "Volume",
              value: volume === "--" ? "10.29" : volume,
              positive: true,
            },
            { title: "Radar", value: "Ativo", positive: true },
          ],
          path1:
            "M0,96 C40,96 60,98 90,88 C140,68 180,72 210,58 C250,42 285,52 320,38 C370,18 410,26 450,22 C490,18 530,8 600,16",
          path2:
            "M0,105 C60,110 110,98 160,94 C220,88 255,92 320,74 C370,60 410,62 470,52 C520,43 560,46 600,36",
          biasLabel: "Radar",
          biasValue: "Ativo",
        };

      case "Estrutura":
        return {
          title: "Estrutura do Mercado",
          description:
            "Leitura estrutural com base em suporte, continuidade, inclinação e força das zonas principais.",
          stats: [
            { title: "Estrutura", value: "Positiva", positive: true },
            { title: "Suporte", value: "Sólido", positive: true },
            { title: "Ciclo", value: "Forte", positive: true },
          ],
          path1:
            "M0,112 C35,108 70,102 120,94 C170,86 210,76 250,62 C300,48 340,42 390,34 C440,26 500,24 600,18",
          path2:
            "M0,122 C45,122 80,118 130,108 C180,98 220,92 270,84 C330,74 390,68 450,58 C510,50 555,46 600,40",
          biasLabel: "Base",
          biasValue: "Estável",
        };

      case "Euler":
        return {
          title: "Leitura Euler",
          description:
            "Camada matemática complementar com validação de curvatura, simetria e sustentação do movimento.",
          stats: [
            { title: "Curvatura", value: "Positiva", positive: true },
            { title: "Validação", value: "Forte", positive: true },
            { title: "Assimetria", value: "Favorável", positive: true },
          ],
          path1:
            "M0,118 C40,110 80,100 125,90 C175,76 215,64 250,54 C290,44 320,36 360,30 C410,24 460,20 520,18 C555,18 580,20 600,22",
          path2:
            "M0,126 C50,122 95,118 150,106 C210,92 260,84 320,72 C380,62 430,54 500,46 C545,42 575,40 600,36",
          biasLabel: "Modelo",
          biasValue: "Validado",
        };

      default:
        return {
          title: "Scanner Atlas",
          description:
            "Leitura resumida dos ativos monitorados em tempo real com prioridade, tendência e força relativa.",
          stats: [
            { title: "Top Score", value: "BTC", positive: true },
            {
              title: "Volume",
              value: volume === "--" ? "10.29" : volume,
              positive: true,
            },
            { title: "Radar", value: "Ativo", positive: true },
          ],
          path1:
            "M0,96 C40,96 60,98 90,88 C140,68 180,72 210,58 C250,42 285,52 320,38 C370,18 410,26 450,22 C490,18 530,8 600,16",
          path2:
            "M0,105 C60,110 110,98 160,94 C220,88 255,92 320,74 C370,60 410,62 470,52 C520,43 560,46 600,36",
          biasLabel: "Radar",
          biasValue: "Ativo",
        };
    }
  }, [activeModule, score, volume]);

  const leftDynamicBlock = useMemo(() => {
    switch (activeModule) {
      case "Fluxo":
        return {
          type: "cards" as const,
          title: "Mapa de Pressão",
          subtitle:
            "Leitura do fluxo dominante com ênfase em agressão, absorção e continuidade.",
          cards: [
            { title: "Pressão", value: "Compra", subtitle: "Agressão dominante", positive: true },
            { title: "Absorção", value: "Ativa", subtitle: "Defesa compradora", positive: true },
            { title: "Volume", value: "Elevado", subtitle: "Entrada acima da média", positive: true },
            { title: "Ritmo", value: "Forte", subtitle: "Impulso sustentado", positive: true },
          ],
          rows: [
            { label: "Dominância", value: "Compradora", positive: true },
            { label: "Spread", value: "Controlado", positive: true },
            { label: "Aceleração", value: "Crescente", positive: true },
            { label: "Liquidez", value: "Saudável", positive: true },
          ],
        };

      case "Singularidade":
        return {
          type: "cards" as const,
          title: "Núcleo da Singularidade",
          subtitle:
            "Leitura integrada de pulso, confluência e expansão estrutural do ativo.",
          cards: [
            { title: "Pulso", value: "Forte", subtitle: "Movimento ativo", positive: true },
            { title: "Confluência", value: "Alta", subtitle: "Sinais alinhados", positive: true },
            { title: "Expansão", value: "Ativa", subtitle: "Mercado abrindo espaço", positive: true },
            { title: "Ritmo", value: "Crescente", subtitle: "Continuidade", positive: true },
          ],
          rows: [
            { label: "Nível", value: "5 / 6", positive: true },
            { label: "Estabilidade", value: "Boa", positive: true },
            { label: "Transição", value: "Favorável", positive: true },
            { label: "Ciclo", value: "Acelerado", positive: true },
          ],
        };

      case "IA Atlas":
        return {
          type: "cards" as const,
          title: "Radar de Convicção",
          subtitle:
            "Síntese de confiança, risco, direção e suporte operacional da IA Atlas.",
          cards: [
            { title: "Convicção", value: "Alta", subtitle: "Sinal robusto", positive: true },
            { title: "Risco", value: "Médio", subtitle: "Exposição controlada", positive: true },
            { title: "Direção", value: "Alta", subtitle: "Bias positivo", positive: true },
            { title: "Assistência", value: "Ativa", subtitle: "Leitura complementar", positive: true },
          ],
          rows: [
            { label: "Confiança", value: "Elevada", positive: true },
            { label: "Probabilidade", value: "Favorável", positive: true },
            { label: "Suporte IA", value: "Presente", positive: true },
            { label: "Condição", value: "Operável", positive: true },
          ],
        };

      case "Estrutura":
        return {
          type: "cards" as const,
          title: "Mapa Estrutural",
          subtitle:
            "Visão organizada de base, suporte, inclinação e continuidade do movimento.",
          cards: [
            { title: "Base", value: "Sólida", subtitle: "Fundação estável", positive: true },
            { title: "Suporte", value: "Firme", subtitle: "Zona respeitada", positive: true },
            { title: "Inclinação", value: "Positiva", subtitle: "Direção favorável", positive: true },
            { title: "Força", value: "Alta", subtitle: "Estrutura íntegra", positive: true },
          ],
          rows: [
            { label: "Continuidade", value: "Provável", positive: true },
            { label: "Compressão", value: "Baixa", positive: true },
            { label: "Resposta", value: "Boa", positive: true },
            { label: "Ciclo", value: "Sustentado", positive: true },
          ],
        };

      case "Euler":
        return {
          type: "cards" as const,
          title: "Validação Matemática",
          subtitle:
            "Leitura de curvatura, simetria e assimetria para apoio matemático da decisão.",
          cards: [
            { title: "Curvatura", value: "Positiva", subtitle: "Trajetória saudável", positive: true },
            { title: "Validação", value: "Forte", subtitle: "Modelo confirma", positive: true },
            { title: "Simetria", value: "Boa", subtitle: "Consistência estrutural", positive: true },
            { title: "Assimetria", value: "Favorável", subtitle: "Boa relação risco/retorno", positive: true },
          ],
          rows: [
            { label: "Modelo", value: "Validado", positive: true },
            { label: "Sustentação", value: "Presente", positive: true },
            { label: "Regularidade", value: "Alta", positive: true },
            { label: "Leitura", value: "Confiável", positive: true },
          ],
        };

      default:
        return {
          type: "table" as const,
          title: "Mestre Scanner",
          subtitle:
            "Ativos priorizados por score, tendência e leitura geral do momento.",
        };
    }
  }, [activeModule]);

  const summaryGridColumns = isSmall
    ? "1fr"
    : isMedium
    ? "repeat(2, minmax(0, 1fr))"
    : "1.3fr 1fr 1fr 1fr";

  const mainGridColumns = isSmall
    ? "1fr"
    : isMedium
    ? "minmax(0, 1fr)"
    : isCompact
    ? "46px minmax(0, 1fr) 270px"
    : "50px minmax(0, 1fr) 292px";

  const bottomGridColumns = isSmall ? "1fr" : "1.2fr 1fr";

  const zoomIn = () => {
    const timeScale = chartRef.current?.timeScale();
    if (!timeScale) return;
    const range = timeScale.getVisibleLogicalRange();
    if (!range) return;

    const center = (range.from + range.to) / 2;
    const currentWidth = range.to - range.from;
    const nextWidth = Math.max(10, currentWidth * 0.8);

    timeScale.setVisibleLogicalRange({
      from: center - nextWidth / 2,
      to: center + nextWidth / 2,
    });
  };

  const zoomOut = () => {
    const timeScale = chartRef.current?.timeScale();
    if (!timeScale) return;
    const range = timeScale.getVisibleLogicalRange();
    if (!range) return;

    const center = (range.from + range.to) / 2;
    const currentWidth = range.to - range.from;
    const nextWidth = currentWidth * 1.25;

    timeScale.setVisibleLogicalRange({
      from: center - nextWidth / 2,
      to: center + nextWidth / 2,
    });
  };

  const goToCurrent = () => {
    const timeScale = chartRef.current?.timeScale();
    if (!timeScale) return;

    if (viewMode === "space") {
      timeScale.scrollToPosition(spaceOffset, false);
    } else {
      timeScale.scrollToRealTime();
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(29,42,84,0.30), transparent 24%), linear-gradient(180deg, #040913 0%, #030712 100%)",
        color: "#eef4ff",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background:
            "linear-gradient(180deg, rgba(5,10,20,0.985), rgba(6,11,22,0.965))",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 20,
          boxShadow: "0 12px 32px rgba(0,0,0,0.22)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: isSmall ? "flex-start" : "center",
            justifyContent: "space-between",
            gap: 18,
            padding: "10px 16px 10px",
            flexWrap: "wrap",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            minHeight: isSmall ? "auto" : 82,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: isSmall ? "flex-start" : "center",
              gap: 16,
              minWidth: 0,
              flexWrap: "wrap",
              flex: 1,
              width: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  width: isSmall ? 58 : 66,
                  height: isSmall ? 58 : 66,
                  borderRadius: 14,
                  background:
                    "radial-gradient(circle at 30% 30%, rgba(94,231,255,0.16), rgba(255,255,255,0.02))",
                  border: "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  boxShadow:
                    "0 0 14px rgba(114,160,255,0.10), 0 0 24px rgba(94,231,255,0.05)",
                  flexShrink: 0,
                }}
              >
                <Image
                  src="/logo-singularidade.png"
                  alt="Logo Singularidade"
                  width={isSmall ? 52 : 60}
                  height={isSmall ? 52 : 60}
                  style={{ objectFit: "cover" }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: 8, minWidth: 0 }}>
                <span
                  style={{
                    fontWeight: 900,
                    fontSize: isSmall ? 20 : 24,
                    letterSpacing: 0.55,
                    whiteSpace: "nowrap",
                    textShadow: "0 0 18px rgba(94,231,255,0.08)",
                  }}
                >
                  SINGULARIDADE
                </span>
                <span
                  style={{
                    color: "#93a7ca",
                    fontSize: 13,
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                  }}
                >
                  OBP
                </span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 9,
                alignItems: "center",
                flexWrap: "nowrap",
                overflowX: "auto",
                scrollbarWidth: "none",
                width: isSmall ? "100%" : "auto",
                paddingBottom: 2,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.025))",
                  border: "1px solid rgba(255,255,255,0.09)",
                  borderRadius: 12,
                  padding: "10px 14px",
                  minHeight: 46,
                  flexShrink: 0,
                  boxShadow: "0 8px 18px rgba(0,0,0,0.12)",
                }}
              >
                <span style={{ color: "#f4c24e", fontSize: 15 }}>🪙</span>
                <select
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  style={{
                    background: "transparent",
                    color: "#eef4ff",
                    border: "none",
                    outline: "none",
                    fontWeight: 900,
                    fontSize: 15,
                    cursor: "pointer",
                  }}
                >
                  {symbols.map((s) => (
                    <option key={s} value={s} style={{ color: "#000" }}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {timeframes.map((tf) => {
                const active = timeframe === tf;
                return (
                  <PremiumButton
                    key={tf}
                    active={active}
                    onClick={() => setTimeframe(tf)}
                    compact={isSmall}
                  >
                    {tf}
                  </PremiumButton>
                );
              })}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              color: "#9cb0d2",
              fontSize: 13,
              flexShrink: 0,
              whiteSpace: "nowrap",
              width: isSmall ? "100%" : "auto",
              justifyContent: isSmall ? "space-between" : "flex-end",
            }}
          >
            <span>Replay</span>
            <span>IA Atlas</span>
            <span
              style={{
                color: change.startsWith("-") ? "#ff6b81" : "#2fe19a",
                fontWeight: 900,
                fontSize: 14,
                textShadow: change.startsWith("-")
                  ? "0 0 12px rgba(255,107,129,0.12)"
                  : "0 0 12px rgba(47,225,154,0.14)",
              }}
            >
              {change}
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 16px 12px",
            overflowX: "auto",
            scrollbarWidth: "none",
            background:
              "linear-gradient(180deg, rgba(12,18,34,0.55), rgba(8,12,24,0.10))",
          }}
        >
          {topModules.map((item) => {
            const active = activeModule === item;
            return (
              <PremiumButton
                key={item}
                active={active}
                onClick={() => setActiveModule(item)}
                compact={isSmall}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      width: 18,
                      textAlign: "center",
                      color: active ? "#fff0ad" : "#96abd0",
                    }}
                  >
                    {moduleIcons[item]}
                  </span>
                  <span>{item}</span>
                </span>
              </PremiumButton>
            );
          })}
        </div>
      </div>

      <div style={{ padding: 12 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: summaryGridColumns,
            gap: 10,
            marginBottom: 10,
          }}
        >
          <StatCard title="Ativo" value={symbol} />
          <StatCard title="Preço" value={price} positive />
          <StatCard
            title="Variação"
            value={change}
            positive={!change.startsWith("-")}
          />
          <StatCard title="Fonte" value={source.toUpperCase()} />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: mainGridColumns,
            gap: 10,
            alignItems: "start",
          }}
        >
          {!isSmall && (
            <div
              style={{
                background:
                  "linear-gradient(180deg, rgba(14,21,38,0.98), rgba(8,12,24,0.98))",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 16,
                padding: "10px 4px",
                display: "flex",
                flexDirection: isMedium ? "row" : "column",
                flexWrap: isMedium ? "wrap" : "nowrap",
                gap: 8,
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 16px 40px rgba(0,0,0,0.24)",
              }}
            >
              {chartTools.map((tool) => {
                const active = activeTool === tool.key;
                return (
                  <button
                    key={tool.key}
                    title={tool.label}
                    onClick={() => setActiveTool(tool.key)}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 9,
                      border: active
                        ? `1px solid ${moduleAccent}55`
                        : "1px solid rgba(255,255,255,0.06)",
                      background: active
                        ? `linear-gradient(180deg, ${moduleAccent}28, rgba(255,255,255,0.03))`
                        : "rgba(255,255,255,0.025)",
                      color: active ? "#eef4ff" : "#9fb3d4",
                      fontSize: 13,
                      cursor: "pointer",
                      boxShadow: active
                        ? `0 0 18px ${moduleAccent}22`
                        : "none",
                    }}
                  >
                    {tool.icon}
                  </button>
                );
              })}
            </div>
          )}

          <div
            style={{
              background:
                "linear-gradient(180deg, rgba(13,20,38,0.98), rgba(8,12,24,0.98))",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: "0 18px 50px rgba(0,0,0,0.30)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 14px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 26,
                    height: 26,
                    borderRadius: 8,
                    background: `${moduleAccent}20`,
                    color: moduleAccent,
                    fontWeight: 900,
                    fontSize: 12,
                    border: `1px solid ${moduleAccent}33`,
                    padding: "0 8px",
                    boxShadow: `0 0 16px ${moduleAccent}22`,
                  }}
                >
                  {activeModule.slice(0, 2).toUpperCase()}
                </div>

                <div>
                  <div style={{ fontWeight: 900, fontSize: 17 }}>{symbol}</div>
                  <div style={{ color: "#8fa3c7", fontSize: 11 }}>
                    {moduleTitle} • Ferramenta:{" "}
                    {chartTools.find((t) => t.key === activeTool)?.label} • TF:{" "}
                    {timeframe}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  color: "#8fa3c7",
                  fontSize: 13,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <ControlButton
                  active={viewMode === "auto"}
                  onClick={() => {
                    setViewMode("auto");
                    savedScrollPositionRef.current = 0;
                    chartRef.current?.timeScale()?.scrollToRealTime();
                  }}
                >
                  Auto
                </ControlButton>

                <ControlButton
                  active={viewMode === "manual"}
                  onClick={() => {
                    setViewMode("manual");
                    const currentScroll =
                      chartRef.current?.timeScale()?.scrollPosition();
                    if (
                      typeof currentScroll === "number" &&
                      Number.isFinite(currentScroll)
                    ) {
                      savedScrollPositionRef.current = currentScroll;
                    }
                  }}
                >
                  Manual
                </ControlButton>

                <ControlButton
                  active={viewMode === "space"}
                  onClick={() => {
                    setViewMode("space");
                    savedScrollPositionRef.current = spaceOffset;
                    chartRef.current?.timeScale()?.scrollToPosition(spaceOffset, false);
                  }}
                >
                  Seguir + Espaço
                </ControlButton>

                <ControlButton onClick={zoomOut}>Zoom -</ControlButton>
                <ControlButton onClick={zoomIn}>Zoom +</ControlButton>
                <ControlButton onClick={goToCurrent}>Agora</ControlButton>

                <ControlButton
                  onClick={() => {
                    savedScrollPositionRef.current = 0;
                    setViewMode("auto");
                    const timeScale = chartRef.current?.timeScale();
                    if (timeScale) {
                      timeScale.fitContent();
                      window.setTimeout(() => {
                        chartRef.current?.timeScale()?.scrollToRealTime();
                      }, 20);
                    }
                  }}
                >
                  Reset
                </ControlButton>

                <span>♡</span>
                <span>⚡</span>
                <span>◎</span>
                <span>⚙</span>
              </div>
            </div>

            {isSmall && (
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  padding: "10px 12px",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  overflowX: "auto",
                  scrollbarWidth: "none",
                }}
              >
                {chartTools.map((tool) => {
                  const active = activeTool === tool.key;
                  return (
                    <button
                      key={tool.key}
                      title={tool.label}
                      onClick={() => setActiveTool(tool.key)}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        border: active
                          ? `1px solid ${moduleAccent}55`
                          : "1px solid rgba(255,255,255,0.06)",
                        background: active
                          ? `linear-gradient(180deg, ${moduleAccent}28, rgba(255,255,255,0.03))`
                          : "rgba(255,255,255,0.025)",
                        color: active ? "#eef4ff" : "#9fb3d4",
                        fontSize: 14,
                        cursor: "pointer",
                        flexShrink: 0,
                        boxShadow: active
                          ? `0 0 18px ${moduleAccent}22`
                          : "none",
                      }}
                    >
                      {tool.icon}
                    </button>
                  );
                })}
              </div>
            )}

            <div
              ref={chartContainerRef}
              style={{
                width: "100%",
                height: chartHeight,
              }}
            />
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <div
              style={{
                background:
                  "linear-gradient(180deg, rgba(15,22,40,0.98), rgba(8,12,24,0.98))",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 18,
                padding: 14,
                boxShadow: "0 18px 50px rgba(0,0,0,0.30)",
              }}
            >
              <div
                style={{
                  color: "#dfe8ff",
                  fontWeight: 900,
                  fontSize: 14,
                  marginBottom: 14,
                }}
              >
                {insightConfig.panelTitle}
              </div>

              <div
                style={{ color: "#8fa3c7", fontSize: 12, marginBottom: 8 }}
              >
                {symbol}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  marginBottom: 12,
                  gap: 12,
                }}
              >
                <div style={{ fontSize: 28, fontWeight: 900 }}>{symbol}</div>
                <div
                  style={{
                    fontSize: 42,
                    lineHeight: 1,
                    fontWeight: 900,
                    color: scoreColor,
                    textShadow: `0 0 18px ${moduleAccent}22`,
                  }}
                >
                  {insightConfig.scoreValue}
                </div>
              </div>

              <div
                style={{
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 12,
                  overflow: "hidden",
                  marginBottom: 10,
                }}
              >
                <div
                  style={{ height: 6, background: "rgba(255,255,255,0.05)" }}
                >
                  <div
                    style={{
                      width: `${insightConfig.scoreValue}%`,
                      height: "100%",
                      background: `linear-gradient(90deg, ${moduleAccent}70, rgba(61,229,255,0.95))`,
                      boxShadow: `0 0 18px ${moduleAccent}35`,
                    }}
                  />
                </div>
                <div
                  style={{
                    padding: "10px 11px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontWeight: 800,
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: "#8fa3c7" }}>Score</span>
                  <span style={{ color: "#eef4ff" }}>{insightConfig.scoreLabel}</span>
                </div>
              </div>

              {insightConfig.rowsTop.map((row) => (
                <RightRow
                  key={`${activeModule}-top-${row.label}`}
                  label={row.label}
                  value={row.value}
                  positive={row.positive}
                />
              ))}
            </div>

            <div
              style={{
                background:
                  "linear-gradient(180deg, rgba(15,22,40,0.98), rgba(8,12,24,0.98))",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 18,
                padding: 14,
                boxShadow: "0 18px 50px rgba(0,0,0,0.30)",
              }}
            >
              <div
                style={{
                  color: "#dfe8ff",
                  fontWeight: 900,
                  fontSize: 14,
                  marginBottom: 8,
                }}
              >
                {insightConfig.rowsBottomTitle}
              </div>

              <div style={{ color: "#8fa3c7", fontSize: 12, marginBottom: 12 }}>
                {insightConfig.rowsBottomDescription}
              </div>

              {insightConfig.rowsBottom.map((row) => (
                <RightRow
                  key={`${activeModule}-bottom-${row.label}`}
                  label={row.label}
                  value={row.value}
                  positive={row.positive}
                />
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 10,
            background:
              "linear-gradient(180deg, rgba(13,20,38,0.98), rgba(8,12,24,0.98))",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 20,
            padding: 14,
            boxShadow: "0 18px 50px rgba(0,0,0,0.30)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 14,
            }}
          >
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {bottomTabs.map((tab, i) => (
                <div
                  key={tab}
                  style={{
                    padding: "9px 13px",
                    borderRadius: 11,
                    border: "1px solid rgba(255,255,255,0.06)",
                    background:
                      i === 0
                        ? `linear-gradient(180deg, ${moduleAccent}24, rgba(255,255,255,0.03))`
                        : "rgba(255,255,255,0.025)",
                    color: i === 0 ? "#eef4ff" : "#a8b8d8",
                    fontWeight: 800,
                    fontSize: 12,
                  }}
                >
                  {tab}
                </div>
              ))}
            </div>

            <div style={{ color: "#88a0c9", fontSize: 12 }}>
              {moduleTitle} • Volume • RSI • Fluxo
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: bottomGridColumns,
              gap: 16,
            }}
          >
            <div>
              <div
                style={{
                  color: "#dfe8ff",
                  fontWeight: 900,
                  marginBottom: 8,
                  fontSize: 15,
                }}
              >
                {leftPanelTitle}
              </div>

              <div
                style={{
                  color: "#8ea4c8",
                  fontSize: 12,
                  marginBottom: 12,
                }}
              >
                {leftDynamicBlock.subtitle}
              </div>

              {leftDynamicBlock.type === "table" ? (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isSmall ? "1.3fr 1fr 1fr" : "1.2fr 1fr 1fr 1fr",
                      gap: 10,
                      color: "#7f95bb",
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: 0.4,
                      paddingBottom: 10,
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div>Ativo</div>
                    <div>Score</div>
                    <div>Tendência</div>
                    {!isSmall && <div style={{ textAlign: "right" }}>Preço</div>}
                  </div>

                  {leftRows.map((row) =>
                    isSmall ? (
                      <div
                        key={`${activeModule}-${row.asset}`}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1.3fr 1fr 1fr",
                          gap: 10,
                          padding: "12px 0",
                          borderBottom: "1px solid rgba(255,255,255,0.05)",
                          color: "#d8e2ff",
                          fontSize: 13,
                        }}
                      >
                        <div style={{ fontWeight: 800 }}>{row.asset}</div>
                        <div>{row.score}</div>
                        <div style={{ color: "#34d399", fontWeight: 800 }}>
                          {row.trend}
                        </div>
                      </div>
                    ) : (
                      <ScannerRow
                        key={`${activeModule}-${row.asset}`}
                        asset={row.asset}
                        score={row.score}
                        trend={row.trend}
                        price={row.price}
                      />
                    )
                  )}
                </>
              ) : (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isSmall
                        ? "1fr"
                        : "repeat(2, minmax(0, 1fr))",
                      gap: 10,
                      marginBottom: 12,
                    }}
                  >
                    {leftDynamicBlock.cards.map((card) => (
                      <MiniMetricCard
                        key={`${activeModule}-${card.title}`}
                        title={card.title}
                        value={card.value}
                        subtitle={card.subtitle}
                        positive={card.positive}
                      />
                    ))}
                  </div>

                  <div
                    style={{
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: 16,
                      padding: 14,
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))",
                    }}
                  >
                    <div
                      style={{
                        color: "#dfe8ff",
                        fontWeight: 800,
                        marginBottom: 6,
                        fontSize: 14,
                      }}
                    >
                      {leftDynamicBlock.title}
                    </div>

                    {leftDynamicBlock.rows.map((row) => (
                      <LeftInfoRow
                        key={`${activeModule}-${row.label}`}
                        label={row.label}
                        value={row.value}
                        positive={row.positive}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            <div
              style={{
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 16,
                padding: 14,
                background:
                  "radial-gradient(circle at top, rgba(38,106,255,0.18), transparent 35%), rgba(255,255,255,0.02)",
                minHeight: 210,
              }}
            >
              <div style={{ color: "#dfe8ff", fontWeight: 900, marginBottom: 8 }}>
                {pulseConfig.title}
              </div>

              <div style={{ color: "#8fa3c7", fontSize: 12, marginBottom: 15 }}>
                {pulseConfig.description}
              </div>

              <div
                style={{
                  height: 104,
                  borderRadius: 14,
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(90deg, rgba(61,229,255,0.0), rgba(61,229,255,0.12), rgba(255,213,79,0.10), rgba(61,229,255,0.0))",
                  }}
                />
                <svg
                  viewBox="0 0 600 140"
                  width="100%"
                  height="100%"
                  style={{ position: "relative" }}
                >
                  <path
                    d={pulseConfig.path1}
                    fill="none"
                    stroke="#5ee7ff"
                    strokeWidth="3"
                  />
                  <path
                    d={pulseConfig.path2}
                    fill="none"
                    stroke="#ffd65a"
                    strokeWidth="2"
                    opacity="0.9"
                  />
                </svg>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isSmall ? "1fr" : "repeat(3, 1fr)",
                  gap: 10,
                  marginTop: 12,
                }}
              >
                <StatCard
                  title={pulseConfig.stats[0].title}
                  value={pulseConfig.stats[0].value}
                  positive={pulseConfig.stats[0].positive}
                />
                <StatCard
                  title={pulseConfig.stats[1].title}
                  value={pulseConfig.stats[1].value}
                  positive={pulseConfig.stats[1].positive}
                />
                <StatCard
                  title={pulseConfig.biasLabel}
                  value={pulseConfig.biasValue}
                  positive
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
