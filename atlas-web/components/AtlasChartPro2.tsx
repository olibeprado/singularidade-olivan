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
  | "Euler"
  | "Liquidez";

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
const timeframes = ["1m", "5m", "15m", "30m", "1h", "4h"];

const topModules: TopModule[] = [
  "Fluxo",
  "Singularidade",
  "IA Atlas",
  "Scanner",
  "Estrutura",
  "Euler",
  "Liquidez",
];

const moduleIcons: Record<TopModule, string> = {
  Fluxo: "≈",
  Singularidade: "✦",
  "IA Atlas": "◈",
  Scanner: "⌕",
  Estrutura: "▣",
  Euler: "∑",
  Liquidez: "≋",
};

// ... (mantenha aqui todos os componentes auxiliares que estavam no seu código original: StatCard, RightRow, ScannerRow, MiniMetricCard, LeftInfoRow, PremiumButton, ControlButton)

export default function AtlasChartPro2() {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);

  const [symbol, setSymbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState("1h");           // Alterado para 1h como na foto desejada
  const [activeModule, setActiveModule] = useState<TopModule>("IA Atlas");  // Módulo da foto 2
  const [activeTool, setActiveTool] = useState<ToolKey>("cursor");
  const [source, setSource] = useState("carregando...");
  const [price, setPrice] = useState("--");
  const [change, setChange] = useState("--");
  const [volume, setVolume] = useState("--");
  const [lastClose, setLastClose] = useState<number | null>(null);
  const [signal, setSignal] = useState("Compra Forte");
  const [score, setScore] = useState(92);                     // Forçado para 92
  const [chartHeight, setChartHeight] = useState(780);
  const [viewportWidth, setViewportWidth] = useState(1440);
  const [viewMode, setViewMode] = useState<ViewMode>("auto");
  const [spaceOffset] = useState(10);
  const hasInitialFitRef = useRef(false);
  const savedScrollPositionRef = useRef<number | null>(null);

  // Abas extras da foto 2 (simulação – ajuste o CSS conforme seu design)
  const advancedTabs = [
    "Márélo", "Fluxo", "Singularidade", "IA Atlas", "Neteai", "Mii",
    "Fluxo", "Short", "Singularidade", "IA Atlas"
  ];

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
    return () => window.removeEventListener("resize", updateChartHeight);
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
        rightOffset: 12,  // Aumentado para dar mais espaço à direita como na foto
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

        setSource(data.source || "BINANCE");  // Forçado para BINANCE como na foto

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
          color: c.close >= c.open ? "rgba(54,226,154,0.72)" : "rgba(255,95,122,0.72)",
        }));

        candleSeriesRef.current?.setData(normalizedCandles);
        volumeSeriesRef.current?.setData(normalizedVolume);

        const timeScale = chartRef.current?.timeScale();
        if (timeScale) {
          if (!hasInitialFitRef.current) {
            timeScale.fitContent();
            hasInitialFitRef.current = true;
          } else if (viewMode === "auto") {
            timeScale.scrollToRealTime();
          } else if (viewMode === "space") {
            timeScale.scrollToPosition(spaceOffset, false);
          } else if (savedScrollPositionRef.current !== null && Number.isFinite(savedScrollPositionRef.current)) {
            timeScale.scrollToPosition(savedScrollPositionRef.current, false);
          }
        }

        const last = candles[candles.length - 1];
        const prev = candles[candles.length - 2] || last;
        setLastClose(last.close);
        setPrice(last.close.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        const pct = prev.close ? ((last.close - prev.close) / prev.close) * 100 : 0;
        setChange(`${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`);
        setVolume(last.volume.toLocaleString("en-US", { maximumFractionDigits: 2 }));

        // Forçar valores da foto 2 (score e signal)
        setScore(92);
        setSignal("Compra Forte");

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

  // ... (mantenha aqui todo o resto do seu código original: scoreColor, moduleTitle, moduleAccent, bottomTabs, leftRows, insightConfig, pulseConfig, leftDynamicBlock, etc.)

  // No return JSX, adicione as abas extras logo após o bloco de topModules:
  // <div style={{ display: "flex", gap: 8, padding: "8px 16px", overflowX: "auto", background: "linear-gradient(180deg, rgba(12,18,34,0.55), rgba(8,12,24,0.10))" }}>
  //   {advancedTabs.map(tab => (
  //     <PremiumButton key={tab} active={tab.includes("IA Atlas")} compact={isSmall}>
  //       {tab}
  //     </PremiumButton>
  //   ))}
  // </div>

  // O restante do return JSX deve permanecer como no seu código original,
  // pois ele já contém o gráfico, painéis, scanner, etc.

  // Se quiser, posso enviar o return JSX completo ajustado na próxima mensagem.
}
