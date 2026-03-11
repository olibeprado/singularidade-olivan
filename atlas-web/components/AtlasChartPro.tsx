"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  CandlestickSeries,
  HistogramSeries
} from "lightweight-charts";

type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

const SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"];
const TIMEFRAMES = ["1m", "5m", "15m", "1h"];

function intervalSeconds(tf: string) {
  switch (tf) {
    case "1m":
      return 60;
    case "5m":
      return 300;
    case "15m":
      return 900;
    case "1h":
      return 3600;
    default:
      return 60;
  }
}

function basePrice(symbol: string) {
  switch (symbol) {
    case "BTCUSDT":
      return 70000;
    case "ETHUSDT":
      return 3800;
    case "SOLUSDT":
      return 160;
    case "BNBUSDT":
      return 620;
    default:
      return 100;
  }
}

function generateHistory(symbol: string, tf: string, count = 220): Candle[] {
  const candles: Candle[] = [];
  const step = intervalSeconds(tf);
  const now = Math.floor(Date.now() / 1000);
  let close = basePrice(symbol);

  for (let i = count; i > 0; i--) {
    const t = now - i * step;
    const drift = (Math.random() - 0.5) * (close * 0.004);
    const open = close;
    close = Math.max(0.0001, open + drift);
    const high = Math.max(open, close) + Math.random() * (close * 0.0025);
    const low = Math.min(open, close) - Math.random() * (close * 0.0025);
    const volume = Math.random() * 1000 + 100;
    candles.push({ time: t, open, high, low, close, volume });
  }

  return candles;
}

export default function AtlasChartPro() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState("1m");
  const [live, setLive] = useState(true);
  const [price, setPrice] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const dataRef = useRef<Candle[]>([]);

  useEffect(() => {
    const data = generateHistory(symbol, timeframe, 220);
    dataRef.current = data;
    setPrice(data[data.length - 1]?.close ?? null);
  }, [symbol, timeframe]);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#08111f" },
        textColor: "#cbd5e1",
        attributionLogo: false
      },
      grid: {
        vertLines: { color: "rgba(120,170,255,0.08)" },
        horzLines: { color: "rgba(120,170,255,0.08)" }
      },
      rightPriceScale: {
        borderColor: "rgba(120,170,255,0.16)"
      },
      timeScale: {
        borderColor: "rgba(120,170,255,0.16)",
        timeVisible: true,
        secondsVisible: false
      },
      crosshair: {
        vertLine: { color: "rgba(255,255,255,0.20)" },
        horzLine: { color: "rgba(255,255,255,0.20)" }
      },
      width: containerRef.current.clientWidth,
      height: 620
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#72f3a0",
      downColor: "#ff9ca9",
      borderUpColor: "#72f3a0",
      borderDownColor: "#ff9ca9",
      wickUpColor: "#72f3a0",
      wickDownColor: "#ff9ca9"
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: ""
    });

    candleSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.08, bottom: 0.24 }
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.80, bottom: 0 }
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    const handleResize = () => {
      if (!containerRef.current) return;
      chart.applyOptions({ width: containerRef.current.clientWidth });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || dataRef.current.length === 0) return;

    candleSeriesRef.current.setData(
      dataRef.current.map(({ time, open, high, low, close }) => ({
        time,
        open,
        high,
        low,
        close
      }))
    );

    volumeSeriesRef.current.setData(
      dataRef.current.map((d) => ({
        time: d.time,
        value: d.volume,
        color: d.close >= d.open ? "rgba(86,242,135,0.90)" : "rgba(255,107,129,0.90)"
      }))
    );

    chartRef.current.timeScale().fitContent();
  }, [symbol, timeframe]);

  useEffect(() => {
    if (!live) return;
    if (!candleSeriesRef.current || !volumeSeriesRef.current) return;

    const id = setInterval(() => {
      const candles = dataRef.current;
      if (!candles.length) return;

      const last = candles[candles.length - 1];
      const step = intervalSeconds(timeframe);
      const now = Math.floor(Date.now() / 1000);
      const currentBucket = Math.floor(now / step) * step;
      const randomMove = (Math.random() - 0.5) * (last.close * 0.0018);

      if (last.time === currentBucket) {
        const nextClose = Math.max(0.0001, last.close + randomMove);
        last.close = nextClose;
        last.high = Math.max(last.high, nextClose);
        last.low = Math.min(last.low, nextClose);
        last.volume += Math.random() * 80;
      } else {
        const open = last.close;
        const close = Math.max(0.0001, open + randomMove);
        candles.push({
          time: currentBucket,
          open,
          high: Math.max(open, close),
          low: Math.min(open, close),
          close,
          volume: Math.random() * 200 + 50
        });
        if (candles.length > 260) candles.shift();
      }

      const latest = candles[candles.length - 1];
      setPrice(latest.close);

      candleSeriesRef.current.update({
        time: latest.time,
        open: latest.open,
        high: latest.high,
        low: latest.low,
        close: latest.close
      });

      volumeSeriesRef.current.update({
        time: latest.time,
        value: latest.volume,
        color: latest.close >= latest.open ? "rgba(86,242,135,0.90)" : "rgba(255,107,129,0.90)"
      });
    }, 1200);

    return () => clearInterval(id);
  }, [live, timeframe]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b1220",
        color: "white",
        padding: "24px",
        fontFamily: "Arial, sans-serif"
      }}
    >
      <div style={{ maxWidth: 1700, margin: "0 auto" }}>
        <h1 style={{ fontSize: 42, marginBottom: 8 }}>🚀 Sistema Singularidade Olivan</h1>
        <p style={{ color: "#94a3b8", marginBottom: 24 }}>
          Terminal Modular • Radar • Scanner • Fluxo • IA • Estrutura
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
            gap: 12,
            marginBottom: 16
          }}
        >
          <select value={symbol} onChange={(e) => setSymbol(e.target.value)} style={inputStyle}>
            {SYMBOLS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>

          <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} style={inputStyle}>
            {TIMEFRAMES.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>

          <div style={boxStyle}>Estrutural</div>
          <div style={boxStyle}>Volume</div>

          <button onClick={() => setLive((v) => !v)} style={buttonStyle}>
            {live ? "Pausar" : "Ao vivo"}
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "220px 1fr 280px",
            gap: 16
          }}
        >
          <div style={panelStyle}>
            <h3>Ferramentas</h3>
            <p>✚ Cursor</p>
            <p>／ Linha</p>
            <p>▭ Zona</p>
            <p>↗ Tendência</p>
            <p>ƒ Fibonacci</p>
            <p>⟂ Horizontal</p>
            <p>⊣ Vertical</p>
            <p>✎ Texto</p>
            <p>⚖ Risco/Retorno</p>
            <p>◎ IA</p>
          </div>

          <div style={panelStyle}>
            <div style={{ marginBottom: 10, color: "#94a3b8" }}>Chart Pro • tempo real</div>
            <div ref={containerRef} />
          </div>

          <div style={panelStyle}>
            <h2>Painel do Ativo</h2>
            <p><strong>Ativo:</strong> {symbol}</p>
            <p><strong>Timeframe:</strong> {timeframe}</p>
            <p><strong>Modo:</strong> Estrutural</p>
            <p><strong>Preço atual:</strong> {price?.toFixed(4) ?? "--"}</p>
            <p><strong>Status:</strong> {live ? "Ao vivo" : "Pausado"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  height: 48,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.05)",
  color: "white",
  padding: "0 14px"
};

const boxStyle: React.CSSProperties = {
  height: 48,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.05)",
  color: "white",
  display: "flex",
  alignItems: "center",
  padding: "0 14px"
};

const buttonStyle: React.CSSProperties = {
  height: 48,
  borderRadius: 14,
  border: "none",
  background: "#22d3ee",
  color: "#082f49",
  fontWeight: 700,
  cursor: "pointer"
};

const panelStyle: React.CSSProperties = {
  borderRadius: 20,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "linear-gradient(180deg, rgba(10,18,34,.95), rgba(8,14,26,.98))",
  padding: 16
};
