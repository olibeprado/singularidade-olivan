"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, ColorType } from "lightweight-charts";

/* ===============================
   CONSTANTES MATEMÁTICAS
================================ */

const PHI = 1.6180339887;
const PHI3 = Math.pow(PHI, 3);
const SILVER = 1 + Math.sqrt(2);
const EULER = Math.E;
const PI = Math.PI;

/* ===============================
   FUNÇÕES DA SINGULARIDADE
================================ */

function singularidadeValue(price: number) {

  const core = (PHI3 + SILVER + EULER) / 3;

  const noise = PI - 3;

  return price * (core - noise);
}

function singularidadeScore(price: number, prev: number) {

  const ve = singularidadeValue(price);

  const momentum = (price - prev) / prev;

  let score = 70;

  if (price < ve) score += 10;
  if (momentum > 0) score += 10;
  if (price > prev) score += 6;

  return Math.max(50, Math.min(99, score));
}

/* ===============================
   TIPOS
================================ */

type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

/* ===============================
   COMPONENTE
================================ */

export default function AtlasChartPro() {

  const chartRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [symbol, setSymbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState("1m");

  const [price, setPrice] = useState("--");
  const [score, setScore] = useState(0);
  const [veValue, setVeValue] = useState(0);

  const [chartHeight, setChartHeight] = useState(820);

  /* ===============================
     CRIAR GRÁFICO
  ================================ */

  useEffect(() => {

    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: chartHeight,
      layout: {
        background: { type: ColorType.Solid, color: "#09111f" },
        textColor: "#9bb1d4",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.1)",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.1)",
        rightOffset: 12,
      },
    });

    const candles = chart.addCandlestickSeries({
      upColor: "#36e29a",
      downColor: "#ff5f7a",
      borderUpColor: "#36e29a",
      borderDownColor: "#ff5f7a",
      wickUpColor: "#36e29a",
      wickDownColor: "#ff5f7a",
    });

    const volume = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "",
      color: "#3b82f6",
    });

    volume.priceScale().applyOptions({
      scaleMargins: {
        top: 0.85,
        bottom: 0,
      },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candles;
    volumeSeriesRef.current = volume;

    const handleResize = () => {

      if (!containerRef.current) return;

      chart.applyOptions({
        width: containerRef.current.clientWidth,
      });

    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };

  }, [chartHeight]);

  /* ===============================
     CARREGAR MERCADO
  ================================ */

  useEffect(() => {

    async function loadData() {

      const res = await fetch(`/api/market?symbol=${symbol}&interval=${timeframe}&limit=200`);

      const data = await res.json();

      if (!data.candles) return;

      const candles: Candle[] = data.candles.map((c: any) => ({
        time: Math.floor(new Date(c.time).getTime() / 1000),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume
      }));

      candleSeriesRef.current.setData(candles);

      volumeSeriesRef.current.setData(
        candles.map(c => ({
          time: c.time,
          value: c.volume,
          color: c.close >= c.open
            ? "rgba(54,226,154,0.7)"
            : "rgba(255,95,122,0.7)"
        }))
      );

      chartRef.current.timeScale().fitContent();

      const last = candles[candles.length - 1];
      const prev = candles[candles.length - 2] || last;

      setPrice(last.close.toFixed(2));

      const ve = singularidadeValue(last.close);
      const sc = singularidadeScore(last.close, prev.close);

      setVeValue(ve);
      setScore(sc);

    }

    loadData();

    const interval = setInterval(loadData, 15000);

    return () => clearInterval(interval);

  }, [symbol, timeframe]);

  /* ===============================
     UI
  ================================ */

  return (

    <div style={{ padding: 16, color: "#e6edf7" }}>

      <h2 style={{ marginBottom: 10 }}>
        Singularidade Atlas
      </h2>

      <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>

        <select value={symbol} onChange={e => setSymbol(e.target.value)}>
          <option>BTCUSDT</option>
          <option>ETHUSDT</option>
          <option>SOLUSDT</option>
          <option>BNBUSDT</option>
        </select>

        <select value={timeframe} onChange={e => setTimeframe(e.target.value)}>
          <option>1m</option>
          <option>5m</option>
          <option>15m</option>
          <option>1h</option>
          <option>4h</option>
        </select>

      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 250px", gap: 12 }}>

        <div
          ref={containerRef}
          style={{
            height: chartHeight,
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          <div style={{ padding: 12, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }}>
            <div>Preço</div>
            <b>{price}</b>
          </div>

          <div style={{ padding: 12, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }}>
            <div>Score IA Atlas</div>
            <b>{score}</b>
          </div>

          <div style={{ padding: 12, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }}>
            <div>Valor Singularidade (Vₑ)</div>
            <b>{veValue.toFixed(2)}</b>
          </div>

        </div>

      </div>

    </div>

  );
}
