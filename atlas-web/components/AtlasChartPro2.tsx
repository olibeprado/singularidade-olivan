"use client";

import { atlasScore } from "@/lib/atlasMath";
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

export default function AtlasChartPro2() {

  const chartRef = useRef<HTMLDivElement | null>(null);
  const chart = useRef<any>(null);
  const candleSeries = useRef<any>(null);
  const volumeSeries = useRef<any>(null);

  const [symbol] = useState("BTCUSDT");
  const [price,setPrice] = useState<number | null>(null);
  const [score,setScore] = useState(0);
  const [direction,setDirection] = useState("Neutro");

  const [activeBottom,setActiveBottom] = useState("Euler");

  const [scanner,setScanner] = useState<any[]>([]);

  useEffect(()=>{

    if(!chartRef.current) return;

    chart.current = createChart(chartRef.current,{
      width:chartRef.current.clientWidth,
      height:520,
      layout:{
        background:{type:ColorType.Solid,color:"#070f22"},
        textColor:"#9aa4c7"
      },
      grid:{
        vertLines:{color:"rgba(255,255,255,0.04)"},
        horzLines:{color:"rgba(255,255,255,0.04)"}
      }
    });

    candleSeries.current = chart.current.addCandlestickSeries({
      upColor:"#2ecc71",
      downColor:"#ff4d6d",
      borderUpColor:"#2ecc71",
      borderDownColor:"#ff4d6d",
      wickUpColor:"#2ecc71",
      wickDownColor:"#ff4d6d"
    });

    volumeSeries.current = chart.current.addHistogramSeries({
      priceFormat:{type:"volume"},
      priceScaleId:""
    });

    loadChart();

    window.addEventListener("resize",resize);

    return()=>{
      window.removeEventListener("resize",resize);
      chart.current.remove();
    }

  },[]);

  function resize(){

    if(!chartRef.current) return;

    chart.current.applyOptions({
      width:chartRef.current.clientWidth
    });

  }

  async function loadChart(){

    const res = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1m&limit=200`
    );

    const data = await res.json();

    const candles:Candle[] = data.map((d:any)=>({
      time:new Date(d[0]).toISOString().slice(0,10),
      open:parseFloat(d[1]),
      high:parseFloat(d[2]),
      low:parseFloat(d[3]),
      close:parseFloat(d[4]),
      volume:parseFloat(d[5])
    }));

    candleSeries.current.setData(candles);

    volumeSeries.current.setData(
      candles.map(c=>({
        time:c.time,
        value:c.volume,
        color:c.close>=c.open?"#2ecc71":"#ff4d6d"
      }))
    );

    const last = candles[candles.length-1];
    const prev = candles[candles.length-2] || last;

    const s = atlasScore(
      last.close,
      prev.close,
      last.volume,
      prev.volume
    );

    setScore(s);
    setPrice(last.close);

    if(s>70) setDirection("Bullish");
    else if(s<40) setDirection("Bearish");
    else setDirection("Neutro");

    // MAPA DE LIQUIDEZ
    const liquidityLevels = candles
      .slice(-50)
      .sort((a,b)=>b.volume-a.volume)
      .slice(0,3);

    liquidityLevels.forEach(level=>{

      candleSeries.current.createPriceLine({
        price:level.close,
        color:"#f1c40f",
        lineWidth:1,
        lineStyle:2,
        axisLabelVisible:true,
        title:"Liquidez"
      });

    });

  }

  useEffect(()=>{

    async function runScanner(){

      const symbols=[
        "BTCUSDT",
        "ETHUSDT",
        "SOLUSDT",
        "BNBUSDT",
        "INJUSDT",
        "LINKUSDT"
      ];

      const results:any[]=[];

      for(const s of symbols){

        const res=await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${s}&interval=5m&limit=2`
        );

        const data=await res.json();

        const last=data[1];
        const prev=data[0];

        const sc=atlasScore(
          parseFloat(last[4]),
          parseFloat(prev[4]),
          parseFloat(last[5]),
          parseFloat(prev[5])
        );

        results.push({
          symbol:s,
          score:sc
        });

      }

      results.sort((a,b)=>b.score-a.score);

      setScanner(results);

    }

    runScanner();

  },[]);

  return(

<div style={{display:"flex",flexDirection:"column",height:"100vh",background:"#020817"}}>

<div style={{display:"flex",flex:1}}>

<div style={{flex:1,padding:"20px"}}>

<h2 style={{color:"#fff"}}>SINGULARIDADE • {symbol}</h2>

<div ref={chartRef} />

</div>

<div style={{
width:"280px",
background:"#060f2c",
padding:"20px",
borderLeft:"1px solid #111"
}}>

<h3 style={{color:"#fff"}}>IA Atlas</h3>

<p style={{color:"#9aa4c7"}}>Preço</p>
<h2 style={{color:"#2ecc71"}}>
{price?price.toFixed(2):"..."}
</h2>

<p style={{color:"#9aa4c7",marginTop:"20px"}}>Score</p>
<h1 style={{color:"#f1c40f"}}>{score}</h1>

<p style={{color:"#9aa4c7",marginTop:"20px"}}>Direção</p>
<h2 style={{color:"#fff"}}>{direction}</h2>

</div>

</div>

<div style={{
background:"#060f2c",
padding:"15px",
borderTop:"1px solid #111"
}}>

<div style={{display:"flex",gap:"10px",marginBottom:"15px"}}>

<button onClick={()=>setActiveBottom("Euler")}>Euler</button>
<button onClick={()=>setActiveBottom("Curvatura")}>Curvatura</button>
<button onClick={()=>setActiveBottom("Validação")}>Validação</button>
<button onClick={()=>setActiveBottom("Eventos")}>Eventos</button>
<button onClick={()=>setActiveBottom("Scanner")}>Scanner</button>

</div>

{activeBottom==="Scanner"&&(

<div>

<h3 style={{color:"#fff"}}>Scanner Atlas</h3>

{scanner.map((s,i)=>(
<div key={i}
style={{
display:"flex",
justifyContent:"space-between",
padding:"8px 0",
borderBottom:"1px solid #111"
}}
>

<span style={{color:"#9aa4c7"}}>{s.symbol}</span>
<span style={{color:"#f1c40f"}}>{s.score}</span>

</div>
))}

</div>

)}

</div>

</div>

  );

}
