"use client";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { createChart, ColorType, LineSeriesPartialOptions } from "lightweight-charts";

// ... (mantenha todos os types, interfaces e componentes auxiliares que já existiam: StatCard, RightRow, ScannerRow, etc.)

export default function AtlasChartPro2() {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);

  // Estados forçados para simular a Foto 2
  const [symbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState("1h");          // ← alterado para 1h (mais consolidado)
  const [activeModule, setActiveModule] = useState<TopModule>("IA Atlas");
  const [activeTool] = useState<ToolKey>("cursor");
  const [source] = useState("BINANCE");
  const [price, setPrice] = useState("71,494.65");
  const [change] = useState("+1.88%");                      // ← valor da foto 2
  const [score] = useState(92);                             // ← score alto da foto 2
  const [signal] = useState("Compra Forte");
  const [lastClose] = useState(71494.65);
  const [chartHeight, setChartHeight] = useState(780);      // um pouco mais alto
  const [viewMode] = useState<ViewMode>("auto");

  // Abas extras observadas na foto 2
  const advancedTabs = [
    "Márélo", "Fluxo", "Singularidade", "IA Atlas", "Neteai", "Mii",
    "Fluxo", "Short", "Singularidade", "IA Atlas"
  ];

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartHeight,
      layout: { background: { type: ColorType.Solid, color: "#09111f" }, textColor: "#93a9cf" },
      grid: { vertLines: { color: "rgba(120,140,180,0.10)" }, horzLines: { color: "rgba(120,140,180,0.10)" } },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.10)" },
      timeScale: { borderColor: "rgba(255,255,255,0.10)", timeVisible: true, secondsVisible: false, rightOffset: 12 },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#36e29a", downColor: "#ff5f7a",
      borderUpColor: "#36e29a", borderDownColor: "#ff5f7a",
      wickUpColor: "#36e29a", wickDownColor: "#ff5f7a",
    });

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "",
      color: "#3b82f6",
    });

    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.84, bottom: 0 } });

    // Overlays de linhas (amarelo e azul) como na foto 2
    const yellowLine = chart.addLineSeries({ color: "#ffd65a", lineWidth: 2 });
    const blueLine  = chart.addLineSeries({ color: "#60a5fa", lineWidth: 1.5 });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    // Cleanup
    return () => chart.remove();
  }, [chartHeight]);

  // Simulação de dados de overlays (ajuste conforme sua API real)
  useEffect(() => {
    if (!chartRef.current) return;

    // Exemplo de dados para linhas (substitua pela sua lógica real)
    const times = Array.from({ length: 100 }, (_, i) => Date.now() / 1000 - i * 3600);
    const basePrice = 71000;

    const yellowData = times.map((t, i) => ({ time: t, value: basePrice + Math.sin(i * 0.1) * 800 }));
    const blueData   = times.map((t, i) => ({ time: t, value: basePrice - Math.cos(i * 0.08) * 600 }));

    chartRef.current?.timeScale()?.fitContent();

    // Atualiza as séries de linha
    // yellowLine.setData(yellowData);
    // blueLine.setData(blueData);
  }, []);

  const scoreColor = score >= 85 ? "#29d391" : score >= 70 ? "#f7c948" : "#ff6b81";

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at top, rgba(29,42,84,0.30), transparent 24%), linear-gradient(180deg, #040913 0%, #030712 100%)",
      color: "#eef4ff",
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* Cabeçalho principal */}
      <div style={{
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "linear-gradient(180deg, rgba(5,10,20,0.985), rgba(6,11,22,0.965))",
        position: "sticky",
        top: 0,
        zIndex: 20,
      }}>
        <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Image src="/logo-singularidade.png" alt="Logo" width={60} height={60} />
            <div>
              <span style={{ fontWeight: 900, fontSize: 24 }}>SINGULARIDADE</span>
              <span style={{ color: "#93a7ca", marginLeft: 8 }}>OBP</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <select value={symbol} style={{ background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", padding: "8px 12px", borderRadius: 8 }}>
              <option>BTCUSDT</option>
              <option>ETHUSDT</option>
            </select>

            {["1m", "5m", "15m", "30m", "1h", "4h"].map(tf => (
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

        {/* Abas avançadas (simulando foto 2) */}
        <div style={{ display: "flex", gap: 8, padding: "8px 16px", overflowX: "auto", background: "rgba(0,0,0,0.2)" }}>
          {advancedTabs.map(tab => (
            <button
              key={tab}
              style={{
                padding: "8px 14px",
                background: tab.includes("IA Atlas") ? "rgba(139,92,246,0.18)" : "rgba(255,255,255,0.04)",
                border: tab.includes("IA Atlas") ? "1px solid #8b5cf6" : "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                color: tab.includes("IA Atlas") ? "#d1c4ff" : "#c0d4ff",
                whiteSpace: "nowrap",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Área do gráfico */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 12, padding: 16 }}>
        <div>
          <div ref={chartContainerRef} style={{ width: "100%", height: chartHeight, borderRadius: 16, overflow: "hidden" }} />
        </div>

        {/* Painel direito - IA Atlas Insights */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{
            background: "linear-gradient(180deg, rgba(15,22,40,0.98), rgba(8,12,24,0.98))",
            borderRadius: 16,
            padding: 16,
            border: "1px solid rgba(255,255,255,0.08)",
          }}>
            <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>IA Atlas Insights</div>
            <div style={{ fontSize: 42, fontWeight: 900, color: scoreColor }}>{score}</div>
            <div style={{ color: scoreColor, fontSize: 20, fontWeight: 800, margin: "8px 0" }}>
              {signal} ↑
            </div>

            <div style={{ margin: "12px 0", height: 8, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ width: `${score}%`, height: "100%", background: scoreColor, borderRadius: 4 }} />
            </div>

            <RightRow label="Score" value={score.toString()} positive />
            <RightRow label="Risco" value="Médio → Alta" positive={false} />
            <RightRow label="Invalidação" value="$65,950" positive={false} />
          </div>

          {/* Bloco Mestre Scanner expandido */}
          <div style={{
            background: "linear-gradient(180deg, rgba(20,30,50,0.95), rgba(10,15,30,0.95))",
            borderRadius: 16,
            padding: 16,
            border: "1px solid rgba(139,92,246,0.3)",
          }}>
            <div style={{ fontWeight: 900, fontSize: 15, marginBottom: 12, color: "#8b5cf6" }}>MESTRE SCANNER</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>♦ PET <span style={{ color: "#34d399" }}>68.625</span></div>
              <div>● CORE <span style={{ color: "#60a5fa" }}>98.050</span></div>
              <div>■ INJ <span style={{ color: "#fb923c" }}>10.055</span></div>
              <div>◆ RENDER <span style={{ color: "#fbbf24" }}>16.055</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé / informações adicionais */}
      <div style={{ padding: 16, color: "#a0b0d0", fontSize: 13 }}>
        Estrutura: Positivo • Euler: Forte • Singularidade: 5/6 • Ciclo: Acelerado
      </div>
    </div>
  );
}
