"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, ColorType } from "lightweight-charts";

type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export default function AtlasChartPro() {

  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);

  const [symbol, setSymbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState("1m");

  const [price, setPrice] = useState("--");
  const [change, setChange] = useState("--");

  const [chartHeight] = useState(820);

  /* =============================
     CRIAR GRÁFICO
  ============================== */

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


  /* =============================
     CARREGAR MERCADO
  ============================== */

  useEffect(() => {

    async function loadMarket() {

      try {

        const res = await fetch(
          `/api/market?symbol=${symbol}&interval=${timeframe}&limit=200`
        );

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

        candleSeriesRef.current.setData(
          candles.map(c => ({
            time: c.time,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close
          }))
        );

        volumeSeriesRef.current.setData(
          candles.map(c => ({
            time: c.time,
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

        setChange((diff > 0 ? "+" : "") + diff.toFixed(2) + "%");

      } catch (err) {

        console.error("Erro mercado:", err);

      }

    }

    loadMarket();

    const interval = setInterval(loadMarket, 15000);

    return () => clearInterval(interval);

  }, [symbol, timeframe]);


  /* =============================
     INTERFACE
  ============================== */

  return (

    <div style={{ padding: 20 }}>

      <h2>Singularidade Atlas</h2>

      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>

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

      <div style={{ marginBottom: 10 }}>
        Preço: {price} | Variação: {change}
      </div>

      <div
        ref={chartContainerRef}
        style={{
          width: "100%",
          height: chartHeight,
        }}
      />

    </div>

  );

}
