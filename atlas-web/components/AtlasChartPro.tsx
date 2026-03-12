"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, ColorType } from "lightweight-charts";

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
  const chartRef = useRef<any>(null);
  const candleRef = useRef<any>(null);
  const volumeRef = useRef<any>(null);

  const [symbol, setSymbol] = useState("BTCUSDT");
  const [interval, setChartInterval] = useState("1m");
  const [source, setSource] = useState("carregando...");

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
      color: "#3b82f6",
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

    const handleResize = () => {
      if (!containerRef.current || !chartRef.current) return;
      chartRef.current.applyOptions({
        width: containerRef.current.clientWidth,
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const res = await fetch(
          `/api/market?symbol=${symbol}&interval=${interval}&limit=200`
        );
        const data = await res.json();

        if (cancelled) return;

        if (!res.ok || !data?.candles) {
          setSource("erro");
          return;
        }

        setSource(data.source || "desconhecida");

        const candles: Candle[] = data.candles;

        if (candleRef.current) {
          candleRef.current.setData(
            candles.map((c) => ({
              time: c.time,
              open: c.open,
              high: c.high,
              low: c.low,
              close: c.close,
            }))
          );
        }

        if (volumeRef.current) {
          volumeRef.current.setData(
            candles.map((c) => ({
              time: c.time,
              value: c.volume,
              color: c.close >= c.open ? "#22c55e" : "#ef4444",
            }))
          );
        }

        if (chartRef.current) {
          chartRef.current.timeScale().fitContent();
        }
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
  }, [symbol, interval]);

  return (
    <div style={{ width: "100%", padding: "12px", background: "#070b16", minHeight: "100vh" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <button onClick={() => setSymbol("BTCUSDT")}>BTCUSDT</button>
        <button onClick={() => setSymbol("ETHUSDT")}>ETHUSDT</button>
        <button onClick={() => setSymbol("SOLUSDT")}>SOLUSDT</button>
        <button onClick={() => setChartInterval("1m")}>1m</button>
        <button onClick={() => setChartInterval("5m")}>5m</button>
        <button onClick={() => setChartInterval("15m")}>15m</button>
        <button onClick={() => setChartInterval("1h")}>1h</button>
      </div>

      <div style={{ color: "#cbd5e1", marginBottom: 10 }}>
        Fonte: {source} | Par: {symbol} | Timeframe: {interval}
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
