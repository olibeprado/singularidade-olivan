"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, ColorType } from "lightweight-charts";

type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

export default function AtlasChartPro2() {
  const chartContainer = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);

  const [symbol] = useState("BTCUSDT");
  const [direction, setDirection] = useState("Neutro");

  const [scanner, setScanner] = useState([
    { symbol: "BTCUSDT", signal: "Compra Forte" },
    { symbol: "ETHUSDT", signal: "Compra" },
    { symbol: "SOLUSDT", signal: "Neutro" },
    { symbol: "BNBUSDT", signal: "Venda" },
  ]);

  useEffect(() => {
    if (!chartContainer.current) return;

    chartRef.current = createChart(chartContainer.current, {
      height: 520,
      layout: {
        background: {
          type: ColorType.Solid,
          color: "#0b0f17",
        },
        textColor: "#9aa4c7",
      },
      grid: {
        vertLines: { color: "#1e2330" },
        horzLines: { color: "#1e2330" },
      },
    });

    seriesRef.current = chartRef.current.addCandlestickSeries();

    const data: Candle[] = [];

    let price = 40000;

    for (let i = 0; i < 120; i++) {
      const open = price;
      const close = open + (Math.random() - 0.5) * 400;
      const high = Math.max(open, close) + Math.random() * 200;
      const low = Math.min(open, close) - Math.random() * 200;

      data.push({
        time: 1700000000 + i * 60,
        open,
        high,
        low,
        close,
      });

      price = close;
    }

    seriesRef.current.setData(data);

    const interval = setInterval(() => {
      const move = (Math.random() - 0.5) * 150;
      price += move;

      seriesRef.current.update({
        time: Math.floor(Date.now() / 1000),
        open: price - move,
        high: price + Math.random() * 50,
        low: price - Math.random() * 50,
        close: price,
      });

      if (move > 40) setDirection("Alta");
      else if (move < -40) setDirection("Baixa");
      else setDirection("Neutro");
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: "#070b11",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* TOP BAR */}

      <div
        style={{
          display: "flex",
          gap: 20,
          padding: "10px 20px",
          borderBottom: "1px solid #1b2233",
          color: "#cbd5ff",
        }}
      >
        <b>{symbol}</b>

        <span>Fluxo</span>
        <span>Singularidade</span>
        <span>Scanner</span>

        <span
          style={{
            marginLeft: "auto",
            color:
              direction === "Alta"
                ? "#22c55e"
                : direction === "Baixa"
                ? "#ef4444"
                : "#eab308",
          }}
        >
          Direção: {direction}
        </span>
      </div>

      {/* CHART */}

      <div
        ref={chartContainer}
        style={{
          flex: 1,
        }}
      />

      {/* PAINEL INFERIOR */}

      <div
        style={{
          height: 160,
          borderTop: "1px solid #1b2233",
          display: "flex",
          padding: 10,
          gap: 20,
        }}
      >
        {/* LIQUIDITY MAP */}

        <div
          style={{
            flex: 1,
            background: "#0f1420",
            padding: 10,
          }}
        >
          <b>Mapa de Liquidez</b>

          <div
            style={{
              marginTop: 10,
              height: 80,
              background:
                "linear-gradient(90deg,#1f2937,#3b82f6,#22c55e,#f59e0b,#ef4444)",
            }}
          />
        </div>

        {/* SCANNER */}

        <div
          style={{
            flex: 1,
            background: "#0f1420",
            padding: 10,
          }}
        >
          <b>Scanner de Mercado</b>

          {scanner.map((s, i) => (
            <div key={i}>
              {s.symbol} — {s.signal}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
