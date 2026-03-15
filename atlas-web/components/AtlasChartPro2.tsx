"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createChart, ColorType } from "lightweight-charts";

export default function AtlasChartPro2() {

const chartRef = useRef<any>(null);
const chartContainerRef = useRef<HTMLDivElement | null>(null);
const candleSeriesRef = useRef<any>(null);

const [symbol,setSymbol] = useState("BTCUSDT");
const [price,setPrice] = useState("--");
const [change,setChange] = useState("--");

useEffect(()=>{

if(!chartContainerRef.current) return;

const chart = createChart(chartContainerRef.current,{
layout:{
background:{type:ColorType.Solid,color:"#070d18"},
textColor:"#8fa3c7"
},
grid:{
vertLines:{color:"rgba(255,255,255,0.05)"},
horzLines:{color:"rgba(255,255,255,0.05)"}
},
rightPriceScale:{
borderColor:"rgba(255,255,255,0.08)"
},
timeScale:{
borderColor:"rgba(255,255,255,0.08)"
},
width:chartContainerRef.current.clientWidth,
height:650
});

const candleSeries = chart.addCandlestickSeries({
upColor:"#34d399",
downColor:"#fb7185",
borderUpColor:"#34d399",
borderDownColor:"#fb7185",
wickUpColor:"#34d399",
wickDownColor:"#fb7185"
});

chartRef.current = chart;
candleSeriesRef.current = candleSeries;

let priceBase = 40000;

const candles:any = [];

for(let i=0;i<120;i++){

const open = priceBase;
const close = open + (Math.random()-0.5)*300;
const high = Math.max(open,close)+Math.random()*150;
const low = Math.min(open,close)-Math.random()*150;

candles.push({
time:1700000000+i*60,
open,
high,
low,
close
});

priceBase = close;

}

candleSeries.setData(candles);

setPrice(candles[candles.length-1].close.toFixed(2));
setChange("+1.23%");

},[]);

return(

<div style={{
minHeight:"100vh",
background:"#030712",
color:"#e5edff",
fontFamily:"Inter"
}}>

{/* TOPBAR */}

<div style={{
display:"flex",
alignItems:"center",
gap:14,
padding:"12px 16px",
borderBottom:"1px solid rgba(255,255,255,0.06)"
}}>

<Image
src="/logo-singularidade.png"
alt="logo"
width={44}
height={44}
/>

<div style={{fontWeight:900,fontSize:20}}>
SINGULARIDADE
</div>

<div style={{marginLeft:20,fontWeight:700}}>
{symbol}
</div>

<div style={{marginLeft:"auto",fontWeight:800}}>
{price}
</div>

<div style={{
color:"#34d399",
fontWeight:800
}}>
{change}
</div>

</div>

{/* MAIN */}

<div style={{
display:"grid",
gridTemplateColumns:"50px 1fr 280px",
gap:10,
padding:10
}}>

{/* TOOLS */}

<div style={{
display:"flex",
flexDirection:"column",
gap:10,
alignItems:"center"
}}>

<button>⌖</button>
<button>╱</button>
<button>◫</button>
<button>≡</button>
<button>⚙</button>

</div>

{/* CHART */}

<div style={{
background:"#081022",
borderRadius:12,
border:"1px solid rgba(255,255,255,0.06)",
overflow:"hidden"
}}>

<div ref={chartContainerRef}/>

</div>

{/* RIGHT PANEL */}

<div style={{
background:"#081022",
borderRadius:12,
border:"1px solid rgba(255,255,255,0.06)",
padding:14
}}>

<div style={{fontWeight:800,marginBottom:10}}>
IA Atlas
</div>

<div style={{
fontSize:34,
fontWeight:900,
color:"#34d399"
}}>
92
</div>

<div style={{marginTop:10}}>
Direção: Compra Forte
</div>

<div>
Risco: Médio
</div>

<div>
Liquidez: Alta
</div>

</div>

</div>

{/* BOTTOM PANEL */}

<div style={{
marginTop:10,
padding:10
}}>

<div style={{
background:"#081022",
borderRadius:12,
border:"1px solid rgba(255,255,255,0.06)",
padding:14
}}>

<div style={{fontWeight:800,marginBottom:10}}>
Scanner Atlas
</div>

<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10}}>

<div>BTCUSDT</div>
<div>92</div>
<div style={{color:"#34d399"}}>Compra</div>
<div>$69489</div>

<div>ETHUSDT</div>
<div>87</div>
<div style={{color:"#34d399"}}>Alta</div>
<div>$3745</div>

<div>SOLUSDT</div>
<div>82</div>
<div>Neutro</div>
<div>$168</div>

</div>

</div>

</div>

</div>

);

}
