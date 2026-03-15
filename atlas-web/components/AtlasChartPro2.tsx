"use client";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { createChart, ColorType } from "lightweight-charts";

export default function AtlasChartPro2() {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);

  // Estados forçados / simulados para se aproximar da Foto 2
  const [symbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState("1h");           // Timeframe maior como na foto
  const [activeModule, setActiveModule] = useState<string>("IA Atlas");
  const [activeTool] = useState<string>("cursor");
  const [source] = useState("BINANCE");
  const [price] = useState("71,494.65");
  const [change] = useState("+1.88%");                        // Valor visível na foto 2
  const [score] = useState(92);                               // Score alto da foto
  const [signal] = useState("Compra Forte");
  const [lastClose] = useState(71494.65);
  const [chartHeight] = useState(780);                        // Altura um pouco maior
  const [viewMode] = useState<string>("auto");

  // Abas extras observadas na foto 2 (simulação)
  const advancedTabs = [
    "Márélo", "Fluxo", "Singularidade", "IA Atlas", "Neteai", "Mii",
    "Fluxo", "Short", "Singularidade", "IA Atlas"
  ];

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
      rightPriceScale: { borderColor: "rgba(255,255,255,0.10)" },
      timeScale: {
        borderColor: "rgba(255,255,255,0.10)",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 12,
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
      scaleMargins: { top: 0.84, bottom: 0 },
    });

    // Overlays de linha (amarelo e azul) – descomente quando tiver dados reais
    // const yellowLine = chart.addLineSeries({ color: "#ffd65a", lineWidth: 2 });
    // const blueLine = chart.addLineSeries({ color: "#60a5fa", lineWidth: 1.5 });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    return () => chart.remove();
  }, [chartHeight]);

  const scoreColor = score >= 85 ? "#29d391" : score >= 70 ? "#f7c948" : "#ff6b81";

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(29,42,84,0.30), transparent 24%), linear-gradient(180deg, #040913 0%, #030712 100%)",
        color: "#eef4ff",
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Cabeçalho principal */}
      <div
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background:
            "linear-gradient(180deg, rgba(5,10,20,0.985), rgba(6,11,22,0.965))",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Image src="/logo-singularidade.png" alt="Logo" width={60} height={60} />
            <div>
              <span style={{ fontWeight: 900, fontSize: 24 }}>SINGULARIDADE</span>
              <span style={{ color: "#93a7ca", marginLeft: 8 }}>OBP</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <select
              value={symbol}
              style={{
                background: "transparent",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.2)",
                padding: "8px 12px",
                borderRadius: 8,
              }}
            >
              <option>BTCUSDT</option>
              <option>ETHUSDT</option>
              <option>SOLUSDT</option>
              <option>BNBUSDT</option>
            </select>

            {["1m", "5m", "15m", "30m", "1h", "4h"].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                style={{
                  padding: "8px 14px",
                  background: timeframe === tf ? "rgba(255,213,79,0.18)" : "rgba(255,255,255,0.04)",
                  border: timeframe === tf ? "1px solid #ffd54f" : "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 10,
                  color: timeframe === tf ? "#fff4bf" : "#d0e0ff",
                  fontWeight: 700,
                }}
              >
                {tf}
              </button>
            ))}
          </div>

          <div style={{ color: change.startsWith("+") ? "#2fe19a" : "#ff6b81", fontSize: 18, fontWeight: 900 }}>
            {change}
          </div>
        </div>

        {/* Abas avançadas simulando foto 2 */}
        <div style={{ display: "flex", gap: 8, padding: "8px 16px", overflowX: "auto", background: "rgba(0,0,0,0.2)" }}>
          {advancedTabs.map((tab) => (
            <button
              key={tab}
              style={{
                padding: "8px 14px",
                background: tab.includes("IA Atlas") ? "rgba(139,92,246,0.18)" : "rgba(255,255,255,0.04)",
                border: tab.includes("IA Atlas") ? "1px solid #8b5cf6" : "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                color: tab.includes("IA Atlas") ? "#d1c4ff" : "#c0d4ff",
                whiteSpace: "nowrap",
                fontSize: 13,
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Grid principal: gráfico + painel direito */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, padding: 16, minHeight: "calc(100vh - 140px)" }}>
        {/* Área do gráfico */}
        <div style={{ borderRadius: 16, overflow: "hidden", background: "#0a1322" }}>
          <div ref={chartContainerRef} style={{ width: "100%", height: chartHeight }} />
        </div>

        {/* Painel direito – IA Atlas Insights */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              background: "linear-gradient(180deg, rgba(15,22,40,0.98), rgba(8,12,24,0.98))",
              borderRadius: 16,
              padding: 20,
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 12 }}>IA Atlas Insights</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{score}</div>
            <div style={{ color: scoreColor, fontSize: 22, fontWeight: 800, margin: "12px 0" }}>
              {signal} ↑
            </div>

            <div style={{ margin: "16px 0", height: 10, background: "rgba(255,255,255,0.08)", borderRadius: 5, overflow: "hidden" }}>
              <div style={{ width: `${score}%`, height: "100%", background: scoreColor, borderRadius: 5 }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                <span style={{ color: "#a0b0d0" }}>Score</span>
                <span style={{ color: "#ffffff", fontWeight: 700 }}>{score}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                <span style={{ color: "#a0b0d0" }}>Risco</span>
                <span style={{ color: "#ffaa00", fontWeight: 700 }}>Médio → Alta</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                <span style={{ color: "#a0b0d0" }}>Invalidação</span>
                <span style={{ color: "#ff6b81", fontWeight: 700 }}>$65,950</span>
              </div>
            </div>
          </div>

          {/* Bloco Mestre Scanner expandido */}
          <div
            style={{
              background: "linear-gradient(180deg, rgba(20,30,50,0.95), rgba(10,15,30,0.95))",
              borderRadius: 16,
              padding: 20,
              border: "1px solid rgba(139,92,246,0.3)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 16, color: "#8b5cf6" }}>MESTRE SCANNER</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 14 }}>
              <div>♦ PET <span style={{ color: "#34d399", fontWeight: 700 }}>68.625</span></div>
              <div>● CORE <span style={{ color: "#60a5fa", fontWeight: 700 }}>98.050</span></div>
              <div>■ INJ <span style={{ color: "#fb923c", fontWeight: 700 }}>10.055</span></div>
              <div>◆ RENDER <span style={{ color: "#fbbf24", fontWeight: 700 }}>16.055</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé com informações estruturais */}
      <div style={{ padding: "16px 24px", color: "#a0b0d0", fontSize: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        Estrutura: <strong style={{ color: "#34d399" }}>Positivo</strong> • 
        Euler: <strong style={{ color: "#60a5fa" }}>Forte</strong> • 
        Singularidade: <strong>5/6</strong> • 
        Ciclo: <strong style={{ color: "#fbbf24" }}>Acelerado</strong>
      </div>
    </div>
  );
}
