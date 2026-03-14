"use client";

import { atlasScore } from "@/lib/atlasMath"
import { useEffect, useRef, useState } from "react"
import { createChart, ColorType } from "lightweight-charts"

type Candle = {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export default function AtlasChartPro2() {

  const chartRef = useRef<HTMLDivElement | null>(null)
  const chartInstance = useRef<any>(null)
  const candleSeries = useRef<any>(null)
  const volumeSeries = useRef<any>(null)

  const [symbol] = useState("BTCUSDT")
  const [price, setPrice] = useState<number | null>(null)
  const [score, setScore] = useState<number>(0)
  const [direction, setDirection] = useState("Neutro")

  useEffect(() => {

    if (!chartRef.current) return

    const chart = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: 650,
      layout: {
        background: { type: ColorType.Solid, color: "#070f22" },
        textColor: "#9aa4c7"
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" }
      },
      rightPriceScale: {
        borderColor: "#222"
      },
      timeScale: {
        borderColor: "#222"
      }
    })

    chartInstance.current = chart

    candleSeries.current = chart.addCandlestickSeries({
      upColor: "#2ecc71",
      downColor: "#ff4d6d",
      borderUpColor: "#2ecc71",
      borderDownColor: "#ff4d6d",
      wickUpColor: "#2ecc71",
      wickDownColor: "#ff4d6d"
    })

    volumeSeries.current = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: ""
    })

    async function loadData() {

      const res = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1m&limit=200`
      )

      const data = await res.json()

      const candles: Candle[] = data.map((d: any) => ({
        time: new Date(d[0]).toISOString().slice(0, 10),
        open: parseFloat(d[1]),
        high: parseFloat(d[2]),
        low: parseFloat(d[3]),
        close: parseFloat(d[4]),
        volume: parseFloat(d[5])
      }))

      candleSeries.current.setData(candles)

      volumeSeries.current.setData(
        candles.map(c => ({
          time: c.time,
          value: c.volume,
          color: c.close >= c.open ? "#2ecc71" : "#ff4d6d"
        }))
      )

      const last = candles[candles.length - 1]
      const prev = candles[candles.length - 2] || last

      const score = atlasScore(
        last.close,
        prev.close,
        last.volume,
        prev.volume
      )

      setScore(score)
      setPrice(last.close)

      if (score > 70) {
        setDirection("Bullish")
      }
      else if (score < 40) {
        setDirection("Bearish")
      }
      else {
        setDirection("Neutro")
      }

    }

    loadData()

    const handleResize = () => {
      chart.applyOptions({
        width: chartRef.current?.clientWidth || 800
      })
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      chart.remove()
    }

  }, [symbol])

  return (

    <div style={{display:"flex",height:"100vh",background:"#020817"}}>

      <div style={{flex:1,padding:"20px"}}>

        <h2 style={{color:"#fff",marginBottom:"10px"}}>
          SINGULARIDADE • {symbol}
        </h2>

        <div ref={chartRef} />

      </div>

      <div style={{
        width:"280px",
        background:"#060f2c",
        padding:"20px",
        borderLeft:"1px solid #111"
      }}>

        <h3 style={{color:"#fff"}}>IA Atlas</h3>

        <div style={{marginTop:"20px",color:"#9aa4c7"}}>
          <p>Ativo</p>
          <h2 style={{color:"#fff"}}>{symbol}</h2>
        </div>

        <div style={{marginTop:"20px",color:"#9aa4c7"}}>
          <p>Preço</p>
          <h2 style={{color:"#2ecc71"}}>
            {price ? price.toFixed(2) : "..."}
          </h2>
        </div>

        <div style={{marginTop:"20px",color:"#9aa4c7"}}>
          <p>Score Atlas</p>
          <h1 style={{color:"#f1c40f"}}>
            {score}
          </h1>
        </div>

        <div style={{marginTop:"20px",color:"#9aa4c7"}}>
          <p>Direção</p>
          <h2 style={{color:"#fff"}}>
            {direction}
          </h2>
        </div>

      </div>

    </div>

  )

}
