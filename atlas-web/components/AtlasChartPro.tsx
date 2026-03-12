"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, IChartApi, ISeriesApi } from "lightweight-charts";

type Candle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export default function AtlasChartPro() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  const [symbol, setSymbol] = useState("BTCUSDT");
  const [interval, setInterval] = useState("1m");
  const [source, setSource] = useState("");

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 520,
      layout: {
        background: { type: ColorType.Solid, color: "#0b1020" },
        textColor: "#d1d5db",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.06)" },
        horzLines: { color: "rgba(255,255,255,0.06)" },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.15)",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.15)",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    chartRef.current = chart;
    candleRef.current = candleSeries;
    volumeRef.current = volumeSeries;

    const onResize = () => {
      if (!containerRef.current || !chartRef.current) return;
      chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      const res = await fetch(`/api/market?symbol=${symbol}&interval=${interval}&limit=200`);
      const data = await res.json();

      if (cancelled || !candleRef.current || !volumeRef.current) return;
      if (!res.ok) return;

      setSource(data.source);

      const candles: Candle[] = data.candles;

      candleRef.current.setData(
        candles.map((c) => ({
          time: c.time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }))
      );

      volumeRef.current.setData(
        candles.map((c) => ({
          time: c.time,
          value: c.volume,
          color: c.close >= c.open ? "#22c55e" : "#ef4444",
        }))
      );

      chartRef.current?.timeScale().fitContent();
    }

    loadData();
    const timer = setInterval(loadData, 15000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [symbol, interval]);

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <button onClick={() => setSymbol("BTCUSDT")}>BTCUSDT</button>
        <button onClick={() => setSymbol("ETHUSDT")}>ETHUSDT</button>
        <button onClick={() => setSymbol("SOLUSDT")}>SOLUSDT</button>
        <button onClick={() => setInterval("1m")}>1m</button>
        <button onClick={() => setInterval("5m")}>5m</button>
        <button onClick={() => setInterval("15m")}>15m</button>
        <button onClick={() => setInterval("1h")}>1h</button>
      </div>

      <div style={{ color: "#cbd5e1", marginBottom: 8 }}>
        Fonte: {source || "carregando..."} | Par: {symbol} | Timeframe: {interval}
      </div>

      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: 520,
          borderRadius: 16,
          overflow: "hidden",
        }}
      />
    </div>
  );
}
