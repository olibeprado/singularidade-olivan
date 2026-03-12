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

const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"];
const timeframes = ["1m", "5m", "15m", "1h", "4h"];

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
        background: "linear-gradient(180deg, rgba(14,21,39,0.95), rgba(7,11,22,0.98))",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 12,
        padding: "6px 10px",
        minHeight: 50,
        boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "#7f93b9",
          marginBottom: 5,
          letterSpacing: 0.4,
          textTransform: "uppercase",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 800,
          color: positive === undefined ? "#eef4ff" : positive ? "#2fe19a" : "#ff6b81",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function RightRow({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 0",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        gap: 12,
      }}
    >
      <span style={{ color: "#99a9c8", fontSize: 13 }}>{label}</span>
      <span
        style={{
          color: positive === undefined ? "#eef4ff" : positive ? "#34d399" : "#fb7185",
          fontWeight: 700,
          fontSize: 13,
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function ScannerRow({
  asset,
  score,
  trend,
  price,
}: {
  asset: string;
  score: string;
  trend: string;
  price: string;
}) {
  const up = trend.toLowerCase().includes("forte") || trend.toLowerCase().includes("positivo");
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.2fr 1fr 1fr 1fr",
        gap: 10,
        padding: "10px 0",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        color: "#d8e2ff",
        fontSize: 13,
      }}
    >
      <div style={{ fontWeight: 700 }}>{asset}</div>
      <div>{score}</div>
      <div style={{ color: up ? "#34d399" : "#f59e0b", fontWeight: 700 }}>{trend}</div>
      <div style={{ textAlign: "right" }}>{price}</div>
    </div>
  );
}

export default function AtlasChartPro() {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);

  const [symbol, setSymbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState("1m");
  const [source, setSource] = useState("carregando...");
  const [price, setPrice] = useState("--");
  const [change, setChange] = useState("--");
  const [volume, setVolume] = useState("--");
  const [lastClose, setLastClose] = useState<number | null>(null);
  const [signal, setSignal] = useState("Compra Forte");
  const [score, setScore] = useState(92);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 700,
      layout: {
        background: { type: ColorType.Solid, color: "#09111f" },
        textColor: "#8ea2c7",
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
        secondsVisible: false,
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
        top: 0.85,
        bottom: 0,
      },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    const handleResize = () => {
      if (!chartContainerRef.current || !chartRef.current) return;
      chartRef.current.applyOptions({
        width: chartContainerRef.current.clientWidth,
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
          `/api/market?symbol=${symbol}&interval=${timeframe}&limit=220`,
          { cache: "no-store" }
        );
        const data = await res.json();

        if (cancelled) return;
        if (!res.ok || !data?.candles?.length) {
          setSource("erro");
          return;
        }

        setSource(data.source || "desconhecida");

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
          color: c.close >= c.open ? "rgba(54,226,154,0.72)" : "rgba(255,95,122,0.72)",
        }));

        candleSeriesRef.current?.setData(normalizedCandles);
        volumeSeriesRef.current?.setData(normalizedVolume);
        chartRef.current?.timeScale().fitContent();

        const last = candles[candles.length - 1];
        const prev = candles[candles.length - 2] || last;

        setLastClose(last.close);

        setPrice(
          last.close.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        );

        const pct = prev.close ? ((last.close - prev.close) / prev.close) * 100 : 0;
        setChange(`${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`);

        setVolume(
          last.volume.toLocaleString("en-US", {
            maximumFractionDigits: 2,
          })
        );

        const strength = Math.min(99, Math.max(51, Math.round(70 + Math.abs(pct) * 12)));
        setScore(strength);
        setSignal(pct >= 0 ? "Compra Forte" : "Pressão Vendedora");
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
  }, [symbol, timeframe]);

  const scoreColor = useMemo(() => {
    if (score >= 85) return "#29d391";
    if (score >= 70) return "#f7c948";
    return "#ff6b81";
  }, [score]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(29,42,84,0.30), transparent 24%), linear-gradient(180deg, #040913 0%, #030712 100%)",
        color: "#eef4ff",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(4,9,18,0.95)",
          backdropFilter: "blur(10px)",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
            padding: "6px 14px 5px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  boxShadow: "0 0 10px rgba(114,160,255,0.08)",
                }}
              >
                <Image
                  src="/logo-singularidade.png"
                  alt="Logo Singularidade"
                  width={46}
                  height={46}
                  style={{
                    objectFit: "cover",
                    opacity: 1,
                  }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
                <span style={{ fontWeight: 900, fontSize: 16, letterSpacing: 0.45 }}>
                  SINGULARIDADE
                </span>
                <span style={{ color: "#93a7ca", fontSize: 11, fontWeight: 800 }}>OBP</span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 10,
                padding: "6px 9px",
              }}
            >
              <span style={{ color: "#f4c24e", fontSize: 13 }}>🪙</span>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                style={{
                  background: "transparent",
                  color: "#eef4ff",
                  border: "none",
                  outline: "none",
                  fontWeight: 800,
                  fontSize: 12,
                }}
              >
                {symbols.map((s) => (
                  <option key={s} value={s} style={{ color: "#000" }}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {timeframes.map((tf) => {
                const active = timeframe === tf;
                return (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    style={{
                      border: "1px solid rgba(255,255,255,0.07)",
                      background: active
                        ? "linear-gradient(180deg, rgba(255,213,79,0.28), rgba(255,170,0,0.13))"
                        : "rgba(255,255,255,0.025)",
                      color: active ? "#ffd95b" : "#9cb0d2",
                      borderRadius: 8,
                      padding: "6px 10px",
                      fontWeight: 800,
                      fontSize: 11,
                      cursor: "pointer",
                    }}
                  >
                    {tf}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#9cb0d2", fontSize: 12 }}>
            <span>Replay</span>
            <span>IA Atlas</span>
            <span style={{ color: change.startsWith("-") ? "#ff6b81" : "#2fe19a", fontWeight: 800 }}>
              {change}
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 7,
            padding: "0 14px 6px",
            flexWrap: "wrap",
          }}
        >
          {["Fluxo", "Singularidade", "IA Atlas", "Scanner", "Estrutura", "Euler"].map((item, i) => (
            <div
              key={item}
              style={{
                padding: "6px 11px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.06)",
                background:
                  i === 3
                    ? "linear-gradient(180deg, rgba(255,214,90,0.22), rgba(255,180,20,0.10))"
                    : "rgba(255,255,255,0.025)",
                color: i === 3 ? "#ffd65a" : "#b4c3df",
                fontWeight: 700,
                fontSize: 11,
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: 12 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.35fr 0.95fr 0.95fr 0.95fr",
            gap: 8,
            marginBottom: 10,
          }}
        >
          <StatCard title="Ativo" value={symbol} />
          <StatCard title="Preço" value={price} positive />
          <StatCard title="Variação" value={change} positive={!change.startsWith("-")} />
          <StatCard title="Fonte" value={source.toUpperCase()} />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "54px minmax(0, 1fr) 300px",
            gap: 10,
            alignItems: "start",
          }}
        >
          <div
            style={{
              background: "linear-gradient(180deg, rgba(14,21,38,0.98), rgba(8,12,24,0.98))",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 15,
              padding: "9px 5px",
              display: "flex",
              flexDirection: "column",
              gap: 9,
              alignItems: "center",
              boxShadow: "0 16px 40px rgba(0,0,0,0.24)",
            }}
          >
            {["⌖", "◔", "⌁", "⊕", "⌗", "⎘", "⌬", "◷", "⚙"].map((icon) => (
              <button
                key={icon}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.06)",
                  background: "rgba(255,255,255,0.025)",
                  color: "#9fb3d4",
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                {icon}
              </button>
            ))}
          </div>

          <div
            style={{
              background: "linear-gradient(180deg, rgba(13,20,38,0.98), rgba(8,12,24,0.98))",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: "0 18px 50px rgba(0,0,0,0.30)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 12px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
              }}
            >
              <div>
                <div style={{ fontWeight: 900, fontSize: 16 }}>{symbol}</div>
                <div style={{ color: "#8fa3c7", fontSize: 11 }}>
                  Singularidade Atlas • Fonte: {source} • TF: {timeframe}
                </div>
              </div>

              <div style={{ display: "flex", gap: 9, color: "#8fa3c7", fontSize: 13 }}>
                <span>♡</span>
                <span>⚡</span>
                <span>◎</span>
                <span>⚙</span>
              </div>
            </div>

            <div
              ref={chartContainerRef}
              style={{
                width: "100%",
                height: 700,
              }}
            />
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <div
              style={{
                background: "linear-gradient(180deg, rgba(15,22,40,0.98), rgba(8,12,24,0.98))",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 18,
                padding: 14,
                boxShadow: "0 18px 50px rgba(0,0,0,0.30)",
              }}
            >
              <div
                style={{
                  color: "#dfe8ff",
                  fontWeight: 900,
                  fontSize: 14,
                  marginBottom: 14,
                }}
              >
                IA Atlas Insights
              </div>

              <div style={{ color: "#8fa3c7", fontSize: 12, marginBottom: 8 }}>{symbol}</div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  marginBottom: 12,
                }}
              >
                <div style={{ fontSize: 27, fontWeight: 900 }}>{symbol}</div>
                <div style={{ fontSize: 40, fontWeight: 900, color: scoreColor }}>{score}</div>
              </div>

              <div
                style={{
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 12,
                  overflow: "hidden",
                  marginBottom: 10,
                }}
              >
                <div style={{ height: 5, background: "rgba(255,255,255,0.05)" }}>
                  <div
                    style={{
                      width: `${score}%`,
                      height: "100%",
                      background:
                        "linear-gradient(90deg, rgba(41,211,145,0.35), rgba(61,229,255,0.95))",
                    }}
                  />
                </div>
                <div
                  style={{
                    padding: "9px 11px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontWeight: 800,
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: "#8fa3c7" }}>Score</span>
                  <span style={{ color: "#eef4ff" }}>{signal}</span>
                </div>
              </div>

              <RightRow label="Risco" value="Médio" />
              <RightRow label="Força" value={score >= 85 ? "Alta" : "Moderada"} positive />
              <RightRow
                label="Invalidação"
                value={
                  lastClose
                    ? `$${(lastClose * 0.985).toLocaleString("en-US", {
                        maximumFractionDigits: 2,
                      })}`
                    : "--"
                }
              />
            </div>

            <div
              style={{
                background: "linear-gradient(180deg, rgba(15,22,40,0.98), rgba(8,12,24,0.98))",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 18,
                padding: 14,
                boxShadow: "0 18px 50px rgba(0,0,0,0.30)",
              }}
            >
              <div
                style={{
                  color: "#dfe8ff",
                  fontWeight: 900,
                  fontSize: 14,
                  marginBottom: 8,
                }}
              >
                Estrutura
              </div>

              <RightRow label="Estrutura" value="Positivo" positive />
              <RightRow label="Euler" value="Forte" positive />
              <RightRow label="Singularidade" value="5 / 6" positive />
              <RightRow label="Razão de Prata" value="Suporte Sólido" positive />
              <RightRow label="Ciclo" value="Acelerado" positive />
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 12,
            background: "linear-gradient(180deg, rgba(13,20,38,0.98), rgba(8,12,24,0.98))",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 20,
            padding: 14,
            boxShadow: "0 18px 50px rgba(0,0,0,0.30)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 14,
            }}
          >
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["Indicadores", "Fluxo", "Scanner", "Eventos"].map((tab, i) => (
                <div
                  key={tab}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 11,
                    border: "1px solid rgba(255,255,255,0.06)",
                    background:
                      i === 2
                        ? "linear-gradient(180deg, rgba(255,215,90,0.18), rgba(255,180,20,0.10))"
                        : "rgba(255,255,255,0.025)",
                    color: i === 2 ? "#ffd45a" : "#a8b8d8",
                    fontWeight: 800,
                    fontSize: 11,
                  }}
                >
                  {tab}
                </div>
              ))}
            </div>

            <div style={{ color: "#88a0c9", fontSize: 12 }}>Scanner Atlas • Volume • RSI • Fluxo</div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr",
              gap: 16,
            }}
          >
            <div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 1fr 1fr 1fr",
                  gap: 10,
                  color: "#7f95bb",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                  paddingBottom: 10,
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div>Ativo</div>
                <div>Score</div>
                <div>Tendência</div>
                <div style={{ textAlign: "right" }}>Preço</div>
              </div>

              <ScannerRow asset="BTCUSDT" score="92.4" trend="Compra Forte" price="$69,489" />
              <ScannerRow asset="ETHUSDT" score="87.2" trend="Positivo" price="$3,745" />
              <ScannerRow asset="SOLUSDT" score="82.8" trend="Positivo" price="$168.40" />
              <ScannerRow asset="BNBUSDT" score="74.9" trend="Aceleração" price="$611.22" />
            </div>

            <div
              style={{
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 16,
                padding: 14,
                background:
                  "radial-gradient(circle at top, rgba(38,106,255,0.18), transparent 35%), rgba(255,255,255,0.02)",
                minHeight: 215,
              }}
            >
              <div style={{ color: "#dfe8ff", fontWeight: 900, marginBottom: 8 }}>
                Pulso da Singularidade
              </div>
              <div style={{ color: "#8fa3c7", fontSize: 12, marginBottom: 15 }}>
                Leitura resumida do comportamento do mercado com base em preço, volume e estrutura.
              </div>

              <div
                style={{
                  height: 105,
                  borderRadius: 14,
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(90deg, rgba(61,229,255,0.0), rgba(61,229,255,0.12), rgba(255,213,79,0.10), rgba(61,229,255,0.0))",
                  }}
                />
                <svg viewBox="0 0 600 140" width="100%" height="100%" style={{ position: "relative" }}>
                  <path
                    d="M0,90 C40,88 60,96 90,84 C140,65 180,70 210,58 C250,42 285,52 320,38 C370,18 410,26 450,22 C490,18 530,8 600,16"
                    fill="none"
                    stroke="#5ee7ff"
                    strokeWidth="3"
                  />
                  <path
                    d="M0,105 C60,110 110,98 160,94 C220,88 255,92 320,74 C370,60 410,62 470,52 C520,43 560,46 600,36"
                    fill="none"
                    stroke="#ffd65a"
                    strokeWidth="2"
                    opacity="0.9"
                  />
                </svg>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 10,
                  marginTop: 12,
                }}
              >
                <StatCard title="Fluxo" value="Forte" positive />
                <StatCard title="Volume" value={volume} positive />
                <StatCard title="Bias" value="Alta" positive />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
