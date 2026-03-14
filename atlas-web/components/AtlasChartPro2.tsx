"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType } from "lightweight-charts";

export default function AtlasChartPro2() {

  const chartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {

    if (!chartRef.current) return;

    const chart = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: 820,
      layout: {
        background: { type: ColorType.Solid, color: "#071022" },
        textColor: "#8ea3c7",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      }
    });

    const series = chart.addCandlestickSeries();

    const data = [
      { time: "2024-03-14", open: 70000, high: 70800, low: 69500, close: 70500 },
      { time: "2024-03-15", open: 70500, high: 71000, low: 70000, close: 70700 },
      { time: "2024-03-16", open: 70700, high: 71500, low: 70200, close: 71000 }
    ];

    series.setData(data);

    return () => chart.remove();

  }, []);

  return (

    <div style={{ padding: 20 }}>

      <h1 style={{ color: "white" }}>
        SINGULARIDADE ATLAS
      </h1>

      <div
        ref={chartRef}
        style={{
          width: "100%",
          height: 820
        }}
      />

    </div>

  );

}
