"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { createChart, ColorType } from "lightweight-charts";

import { singularidadeValue, singularidadeScore } from "@/lib/singularidade";

/* ======================================
TIPOS
====================================== */

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

/* ======================================
CONFIG
====================================== */

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

/* ======================================
UI COMPONENTS
====================================== */

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
            positive === undefined
              ? "#eef4ff"
              : positive
              ? "#2fe19a"
              : "#ff6b81",
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
          ? "1px solid rgba(255,220,110,0.42)"
          : "1px solid rgba(255,255,255,0.08)",
        background: active
          ? "linear-gradient(180deg, rgba(255,213,79,0.24), rgba(255,170,0,0.08))"
          : "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.018))",
        color: active ? "#fff4bf" : "#bfd0ea",
        borderRadius: 12,
        padding: "11px 16px",
        fontWeight: 800,
        fontSize: 14,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {children}
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

/* ======================================
COMPONENTE PRINCIPAL
====================================== */

export default function AtlasChartPro() {

  const chartContainerRef = useRef<HTMLDivElement | null>(null);

  const chartRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);

  const [symbol, setSymbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState("1m");

  const [price, setPrice] = useState("--");
  const [change, setChange] = useState("--");
  const [source, setSource] = useState("carregando...");

  const [score, setScore] = useState(70);

  const [chartHeight, setChartHeight] = useState(820);

  const [activeModule, setActiveModule] =
    useState<TopModule>("Scanner");

  const [activeTool, setActiveTool] =
    useState<ToolKey>("cursor");

  const [viewMode, setViewMode] =
    useState<ViewMode>("auto");
  /* ======================================
  CRIAÇÃO DO GRÁFICO
  ====================================== */

  useEffect(() => {

    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartHeight,
      layout: {
        background: { type: ColorType.Solid, color: "#071022" },
        textColor: "#8ea3c7",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.08)",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.08)",
        rightOffset: 12,
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#2fe19a",
      downColor: "#ff6b81",
      borderUpColor: "#2fe19a",
      borderDownColor: "#ff6b81",
      wickUpColor: "#2fe19a",
      wickDownColor: "#ff6b81",
    });

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.85,
        bottom: 0,
      },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    const resize = () => {

      if (!chartContainerRef.current) return;

      chart.applyOptions({
        width: chartContainerRef.current.clientWidth,
      });

    };

    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      chart.remove();
    };

  }, [chartHeight]);


  /* ======================================
  CARREGAMENTO DE MERCADO
  ====================================== */

  useEffect(() => {

    async function loadMarket() {

      try {

        const res = await fetch(
          `/api/market?symbol=${symbol}&interval=${timeframe}&limit=200`
        );

        const data = await res.json();

        if (!data.candles) return;

        const candles: Candle[] = data.candles;

        candleSeriesRef.current.setData(
          candles.map(c => ({
            time: Math.floor(new Date(c.time).getTime() / 1000),
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close
          }))
        );

        volumeSeriesRef.current.setData(
          candles.map(c => ({
            time: Math.floor(new Date(c.time).getTime() / 1000),
            value: c.volume,
            color:
              c.close >= c.open
                ? "rgba(47,225,154,0.7)"
                : "rgba(255,107,129,0.7)"
          }))
        );

        chartRef.current.timeScale().fitContent();

        const last = candles[candles.length - 1];
        const prev = candles[candles.length - 2] || last;

        setPrice(last.close.toFixed(2));

        const diff = ((last.close - prev.close) / prev.close) * 100;

        setChange(
          (diff > 0 ? "+" : "") + diff.toFixed(2) + "%"
        );

        setSource("BINANCE");

        /* ======================================
        SINGULARIDADE OLIVAN
        ====================================== */

        const ve = singularidadeValue(last.close);

        const atlasScore =
          singularidadeScore(last.close, prev.close);

        setScore(atlasScore);

      } catch (err) {

        console.error("Erro mercado:", err);

      }

    }

    loadMarket();

    const interval = setInterval(loadMarket, 15000);

    return () => clearInterval(interval);

  }, [symbol, timeframe]);
  /* ======================================
  INTERFACE
  ====================================== */

  return (

    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 20% 0%, #0b1730 0%, #040814 70%)",
        padding: 18,
        color: "#d7e4ff",
        fontFamily: "Inter, sans-serif",
      }}
    >

      {/* HEADER */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 14,
        }}
      >

        <Image
          src="/logo-singularidade.png"
          width={38}
          height={38}
          alt="logo"
        />

        <div
          style={{
            fontSize: 18,
            fontWeight: 900,
            letterSpacing: 0.5,
          }}
        >
          SINGULARIDADE
        </div>

        <div style={{ flex: 1 }} />

        <div
          style={{
            fontSize: 12,
            color: "#7fa2ff",
            fontWeight: 700,
          }}
        >
          Replay
        </div>

        <div
          style={{
            fontSize: 12,
            color: "#2fe19a",
            fontWeight: 800,
          }}
        >
          IA Atlas +0.00%
        </div>

      </div>


      {/* BARRA DE MÓDULOS */}

      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >

        {topModules.map((m) => (

          <PremiumButton
            key={m}
            active={activeModule === m}
            onClick={() => setActiveModule(m)}
          >
            {moduleIcons[m]} {m}
          </PremiumButton>

        ))}

      </div>


      {/* CARDS SUPERIORES */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: 12,
          marginBottom: 14,
        }}
      >

        <StatCard title="ATIVO" value={symbol} />

        <StatCard title="PREÇO" value={price} positive />

        <StatCard title="VARIAÇÃO" value={change} positive />

        <StatCard title="FONTE" value={source} />

      </div>


      {/* CONTAINER PRINCIPAL */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 260px",
          gap: 14,
        }}
      >

        {/* GRÁFICO */}

        <div
          style={{
            background:
              "linear-gradient(180deg,#0a1327,#050a18)",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.06)",
            padding: 10,
          }}
        >

          {/* TOOLBAR */}

          <div
            style={{
              display: "flex",
              gap: 6,
              marginBottom: 6,
            }}
          >

            {chartTools.map((t) => (

              <ControlButton
                key={t.key}
                active={activeTool === t.key}
                onClick={() => setActiveTool(t.key)}
              >
                {t.icon}
              </ControlButton>

            ))}

          </div>


          {/* GRÁFICO */}

          <div
            ref={chartContainerRef}
            style={{
              width: "100%",
              height: chartHeight,
            }}
          />

        </div>


        {/* PAINEL DIREITO */}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >

          <div
            style={{
              background:
                "linear-gradient(180deg,#0e1527,#050a16)",
              borderRadius: 14,
              padding: 12,
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >

            <div
              style={{
                fontSize: 11,
                color: "#7f93b9",
                marginBottom: 6,
                textTransform: "uppercase",
                fontWeight: 800,
              }}
            >
              Euler
            </div>

            <div
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: "#ffd36f",
              }}
            >
              {symbol}
            </div>

            <div
              style={{
                fontSize: 42,
                fontWeight: 900,
                marginTop: 6,
              }}
            >
              {score}
            </div>

            <div
              style={{
                marginTop: 6,
                fontSize: 12,
                color: "#8ea3c7",
              }}
            >
              Score — Validação Forte
            </div>

          </div>


          <div
            style={{
              background:
                "linear-gradient(180deg,#0e1527,#050a16)",
              borderRadius: 14,
              padding: 12,
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >

            <div
              style={{
                fontSize: 11,
                color: "#7f93b9",
                marginBottom: 8,
                textTransform: "uppercase",
                fontWeight: 800,
              }}
            >
              Leitura Euler
            </div>

            <div style={{ fontSize: 12 }}>
              Curvatura
              <span
                style={{
                  float: "right",
                  color: "#2fe19a",
                }}
              >
                Positiva
              </span>
            </div>

            <div style={{ fontSize: 12 }}>
              Validação
              <span
                style={{
                  float: "right",
                  color: "#2fe19a",
                }}
              >
                Forte
              </span>
            </div>

            <div style={{ fontSize: 12 }}>
              Simetria
              <span
                style={{
                  float: "right",
                  color: "#2fe19a",
                }}
              >
                Boa
              </span>
            </div>

            <div style={{ fontSize: 12 }}>
              Modelo
              <span
                style={{
                  float: "right",
                  color: "#2fe19a",
                }}
              >
                Validado
              </span>
            </div>

          </div>

        </div>

      </div>

    </div>

  );

}
