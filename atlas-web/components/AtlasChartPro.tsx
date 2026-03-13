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

  useEffect(() => {
    const updateChartHeight = () => {
      const nextHeight = Math.max(650, Math.min(window.innerHeight - 315, 900));
      setChartHeight(nextHeight);
    };

    updateChartHeight();
    window.addEventListener("resize", updateChartHeight);

    return () => {
      window.removeEventListener("resize", updateChartHeight);
    };
  }, []);

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
        chartRef.current?.timeScale().fitContent();

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
  }, [symbol, timeframe]);

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

  const moduleDescription = useMemo(() => {
    switch (activeModule) {
      case "Fluxo":
        return "Mapeamento do fluxo, volume e pressão compradora versus vendedora.";
      case "Singularidade":
        return "Resumo estrutural com leitura de força, aceleração e continuidade.";
      case "IA Atlas":
        return "Camada de interpretação sintética com score, risco e invalidação.";
      case "Scanner":
        return "Ativos monitorados em tempo real com score e tendência.";
      case "Estrutura":
        return "Leitura de ciclo, suporte, força estrutural e estabilidade.";
      case "Euler":
        return "Camada matemática complementar para validação estrutural.";
      default:
        return "Ativos monitorados em tempo real com score e tendência.";
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
          {
            asset: "BTCUSDT",
            score: "91.7",
            trend: "Pressão Compradora",
            price: "$69,489",
          },
          {
            asset: "ETHUSDT",
            score: "84.1",
            trend: "Fluxo Positivo",
            price: "$3,745",
          },
          {
            asset: "SOLUSDT",
            score: "79.4",
            trend: "Absorção",
            price: "$168.40",
          },
          {
            asset: "BNBUSDT",
            score: "72.3",
            trend: "Aceleração",
            price: "$611.22",
          },
        ]
      : activeModule === "IA Atlas"
      ? [
          {
            asset: "BTCUSDT",
            score: "94.2",
            trend: "Convicção Alta",
            price: "$69,489",
          },
          {
            asset: "ETHUSDT",
            score: "88.8",
            trend: "Compra Assistida",
            price: "$3,745",
          },
          {
            asset: "SOLUSDT",
            score: "81.0",
            trend: "Positivo",
            price: "$168.40",
          },
          {
            asset: "BNBUSDT",
            score: "76.4",
            trend: "Neutro Forte",
            price: "$611.22",
          },
        ]
      : activeModule === "Estrutura"
      ? [
          {
            asset: "BTCUSDT",
            score: "93.1",
            trend: "Estrutura Forte",
            price: "$69,489",
          },
          {
            asset: "ETHUSDT",
            score: "86.7",
            trend: "Positivo",
            price: "$3,745",
          },
          {
            asset: "SOLUSDT",
            score: "80.5",
            trend: "Continuidade",
            price: "$168.40",
          },
          {
            asset: "BNBUSDT",
            score: "74.8",
            trend: "Base Sólida",
            price: "$611.22",
          },
        ]
      : activeModule === "Euler"
      ? [
          {
            asset: "BTCUSDT",
            score: "90.6",
            trend: "Validação Forte",
            price: "$69,489",
          },
          {
            asset: "ETHUSDT",
            score: "83.3",
            trend: "Curvatura Positiva",
            price: "$3,745",
          },
          {
            asset: "SOLUSDT",
            score: "78.1",
            trend: "Confirmação",
            price: "$168.40",
          },
          {
            asset: "BNBUSDT",
            score: "71.9",
            trend: "Assimetria",
            price: "$611.22",
          },
        ]
      : activeModule === "Singularidade"
      ? [
          {
            asset: "BTCUSDT",
            score: "92.8",
            trend: "Pulso Forte",
            price: "$69,489",
          },
          {
            asset: "ETHUSDT",
            score: "87.1",
            trend: "Confluência",
            price: "$3,745",
          },
          {
            asset: "SOLUSDT",
            score: "82.2",
            trend: "Positivo",
            price: "$168.40",
          },
          {
            asset: "BNBUSDT",
            score: "75.0",
            trend: "Aceleração",
            price: "$611.22",
          },
        ]
      : [
          {
            asset: "BTCUSDT",
            score: "92.4",
            trend: "Compra Forte",
            price: "$69,489",
          },
          {
            asset: "ETHUSDT",
            score: "87.2",
            trend: "Positivo",
            price: "$3,745",
          },
          {
            asset: "SOLUSDT",
            score: "82.8",
            trend: "Positivo",
            price: "$168.40",
          },
          {
            asset: "BNBUSDT",
            score: "74.9",
            trend: "Aceleração",
            price: "$611.22",
          },
        ];

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
            alignItems: "center",
            justifyContent: "space-between",
            gap: 18,
            padding: "10px 16px 10px",
            flexWrap: "wrap",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            minHeight: 82,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              minWidth: 0,
              flexWrap: "wrap",
              flex: 1,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 66,
                  height: 66,
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  boxShadow: "0 0 14px rgba(114,160,255,0.10)",
                  flexShrink: 0,
                }}
              >
                <Image
                  src="/logo-singularidade.png"
                  alt="Logo Singularidade"
                  width={60}
                  height={60}
                  style={{ objectFit: "cover" }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span
                  style={{
                    fontWeight: 900,
                    fontSize: 24,
                    letterSpacing: 0.55,
                    whiteSpace: "nowrap",
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
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.025))",
                  border: "1px solid rgba(255,255,255,0.08)",
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
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    style={{
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: active
                        ? "linear-gradient(180deg, rgba(255,213,79,0.34), rgba(255,170,0,0.16))"
                        : "rgba(255,255,255,0.03)",
                      color: active ? "#ffd95b" : "#afc1df",
                      borderRadius: 11,
                      padding: "11px 16px",
                      minHeight: 46,
                      fontWeight: 900,
                      fontSize: 15,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {tf}
                  </button>
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
            }}
          >
            <span>Replay</span>
            <span>IA Atlas</span>
            <span
              style={{
                color: change.startsWith("-") ? "#ff6b81" : "#2fe19a",
                fontWeight: 900,
                fontSize: 14,
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
              <button
                key={item}
                onClick={() => setActiveModule(item)}
                style={{
                  padding: "11px 16px",
                  minHeight: 44,
                  display: "flex",
                  alignItems: "center",
                  borderRadius: 11,
                  border: active
                    ? `1px solid ${moduleAccent}55`
                    : "1px solid rgba(255,255,255,0.07)",
                  background: active
                    ? `linear-gradient(180deg, ${moduleAccent}30, rgba(255,255,255,0.04))`
                    : "rgba(255,255,255,0.03)",
                  color: active ? "#f4f8ff" : "#c2cee4",
                  fontWeight: 800,
                  fontSize: 14,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  cursor: "pointer",
                  boxShadow: active ? `0 0 0 1px ${moduleAccent}20 inset` : "none",
                }}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: 12 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.3fr 1fr 1fr 1fr",
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
            gridTemplateColumns: "50px minmax(0, 1fr) 292px",
            gap: 10,
            alignItems: "start",
          }}
        >
          <div
            style={{
              background:
                "linear-gradient(180deg, rgba(14,21,38,0.98), rgba(8,12,24,0.98))",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 16,
              padding: "10px 4px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              alignItems: "center",
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
                  }}
                >
                  {tool.icon}
                </button>
              );
            })}
          </div>

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
                  gap: 10,
                  color: "#8fa3c7",
                  fontSize: 13,
                  alignItems: "center",
                }}
              >
                <span>♡</span>
                <span>⚡</span>
                <span>◎</span>
                <span>⚙</span>
              </div>
            </div>

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
                {activeModule}
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
                  }}
                >
                  {score}
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
                      width: `${score}%`,
                      height: "100%",
                      background: `linear-gradient(90deg, ${moduleAccent}70, rgba(61,229,255,0.95))`,
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
                  <span style={{ color: "#eef4ff" }}>{signal}</span>
                </div>
              </div>

              <RightRow label="Resumo" value={activeModule} positive />
              <RightRow
                label="Ferramenta"
                value={
                  chartTools.find((t) => t.key === activeTool)?.label || "--"
                }
                positive
              />
              <RightRow
                label="Força"
                value={score >= 85 ? "Alta" : "Moderada"}
                positive
              />
              <RightRow
                label="Invalidação"
                value={
                  lastClose
                    ? `$${(lastClose * 0.985).toLocaleString("en-US", {
                        maximumFractionDigits: 2,
                      })}`
                    : "--"
                }
              />
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
                {moduleTitle}
              </div>

              <div style={{ color: "#8fa3c7", fontSize: 12, marginBottom: 12 }}>
                {moduleDescription}
              </div>

              <RightRow label="Estrutura" value="Positivo" positive />
              <RightRow label="Euler" value="Forte" positive />
              <RightRow label="Singularidade" value="5 / 6" positive />
              <RightRow
                label="Razão de Prata"
                value="Suporte Sólido"
                positive
              />
              <RightRow label="Ciclo" value="Acelerado" positive />
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
              gridTemplateColumns: "1.2fr 1fr",
              gap: 16,
            }}
          >
            <div>
              <div
                style={{
                  color: "#dfe8ff",
                  fontWeight: 900,
                  marginBottom: 10,
                  fontSize: 15,
                }}
              >
                {leftPanelTitle}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 1fr 1fr 1fr",
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
                <div style={{ textAlign: "right" }}>Preço</div>
              </div>

              {leftRows.map((row) => (
                <ScannerRow
                  key={`${activeModule}-${row.asset}`}
                  asset={row.asset}
                  score={row.score}
                  trend={row.trend}
                  price={row.price}
                />
              ))}
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
                  gridTemplateColumns: "repeat(3, 1fr)",
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
