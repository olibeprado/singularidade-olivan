"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType } from "lightweight-charts";

export default function AtlasChartPro() {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
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

    candleSeries.setData([
      { time: "2025-03-01", open: 42000, high: 42800, low: 41750, close: 42650 },
      { time: "2025-03-02", open: 42650, high: 43100, low: 42300, close: 42920 },
      { time: "2025-03-03", open: 42920, high: 43450, low: 42520, close: 42780 },
      { time: "2025-03-04", open: 42780, high: 43800, low: 42600, close: 43620 },
      { time: "2025-03-05", open: 43620, high: 44200, low: 43350, close: 43910 },
      { time: "2025-03-06", open: 43910, high: 44580, low: 43700, close: 44320 },
      { time: "2025-03-07", open: 44320, high: 44800, low: 44000, close: 44110 },
    ]);

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "",
      color: "#3b82f6",
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    volumeSeries.setData([
      { time: "2025-03-01", value: 1200, color: "#22c55e" },
      { time: "2025-03-02", value: 980, color: "#22c55e" },
      { time: "2025-03-03", value: 1500, color: "#ef4444" },
      { time: "2025-03-04", value: 1800, color: "#22c55e" },
      { time: "2025-03-05", value: 1350, color: "#22c55e" },
      { time: "2025-03-06", value: 1600, color: "#22c55e" },
      { time: "2025-03-07", value: 1100, color: "#ef4444" },
    ]);

    const handleResize = () => {
      if (!chartContainerRef.current) return;
      chart.applyOptions({
        width: chartContainerRef.current.clientWidth,
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  return (
    <div
      ref={chartContainerRef}
      style={{
        width: "100%",
        height: "500px",
        borderRadius: "16px",
        overflow: "hidden",
      }}
    />
  );
}
