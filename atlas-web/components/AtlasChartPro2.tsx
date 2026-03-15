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

export default function AtlasChartPro2() {

  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);

  const [symbol, setSymbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState("1m");
  const [activeModule, setActiveModule] = useState<TopModule>("Scanner");

  const [price, setPrice] = useState("--");
  const [change, setChange] = useState("--");
  const [volume, setVolume] = useState("--");
  const [source, setSource] = useState("carregando");

  const [chartHeight, setChartHeight] = useState(720);

  const [viewMode, setViewMode] = useState<ViewMode>("auto");

  const hasInitialFitRef = useRef(false);

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

    return () => chart.remove();

  }, [chartHeight]);



  useEffect(() => {

    async function loadData() {

      try {

        const res = await fetch(`/api/market?symbol=${symbol}&interval=${timeframe}&limit=200`);

        const data = await res.json();

        if (!data?.candles) return;

        setSource(data.source);

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
              ? "rgba(54,226,154,0.7)"
              : "rgba(255,95,122,0.7)",
        }));

        candleSeriesRef.current?.setData(normalizedCandles);
        volumeSeriesRef.current?.setData(normalizedVolume);

        if (!hasInitialFitRef.current) {
          chartRef.current.timeScale().fitContent();
          hasInitialFitRef.current = true;
        }

        const last = candles[candles.length - 1];
        const prev = candles[candles.length - 2] || last;

        setPrice(last.close.toFixed(2));

        const pct = ((last.close - prev.close) / prev.close) * 100;

        setChange(`${pct.toFixed(2)}%`);

        setVolume(last.volume.toFixed(2));

      } catch (err) {
        console.log(err);
      }
    }

    loadData();

    const timer = setInterval(loadData, 15000);

    return () => clearInterval(timer);

  }, [symbol, timeframe]);



  return (

    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#030712 0%,#040913 100%)",
        color: "#eef4ff",
        fontFamily: "Inter, sans-serif",
      }}
    >

      <div
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: 14,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

          <Image
            src="/logo-singularidade.png"
            alt="logo"
            width={52}
            height={52}
          />

          <div style={{ fontWeight: 900, fontSize: 20 }}>
            SINGULARIDADE
          </div>

        </div>

        <div style={{ display: "flex", gap: 10 }}>

          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
          >
            {symbols.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>

          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              style={{
                padding: "6px 10px",
                background: timeframe === tf ? "#ffd65a" : "#111827",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
              }}
            >
              {tf}
            </button>
          ))}

        </div>

      </div>



      <div style={{ padding: 12 }}>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gap: 10,
            marginBottom: 12,
          }}
        >

          <div>Ativo: {symbol}</div>
          <div>Preço: {price}</div>
          <div>Variação: {change}</div>
          <div>Fonte: {source}</div>

        </div>



        <div
          style={{
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >

          <div
            ref={chartContainerRef}
            style={{
              width: "100%",
              height: chartHeight,
            }}
          />

        </div>

      </div>

    </div>
  );
}
