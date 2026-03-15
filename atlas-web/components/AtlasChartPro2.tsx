"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, ColorType } from "lightweight-charts";

export default function AtlasChartPro2() {

const chartContainer = useRef<HTMLDivElement | null>(null);
const chart = useRef<any>(null);
const series = useRef<any>(null);

const [score] = useState(92);
const [direction] = useState("Compra Forte");
const [risk] = useState("Médio");

useEffect(()=>{

if(!chartContainer.current) return;

chart.current = createChart(chartContainer.current,{
layout:{
background:{type:ColorType.Solid,color:"#070b11"},
textColor:"#cbd5ff"
},
grid:{
vertLines:{color:"#1b2233"},
horzLines:{color:"#1b2233"}
},
crosshair:{
mode:1
},
height:650
});

series.current = chart.current.addCandlestickSeries();

let price = 41000;
const data:any=[];

for(let i=0;i<160;i++){

const open = price;
const close = open + (Math.random()-0.5)*300;
const high = Math.max(open,close)+Math.random()*120;
const low = Math.min(open,close)-Math.random()*120;

data.push({
time:1700000000+i*60,
open,
high,
low,
close
})

price = close;

}

series.current.setData(data);

},[]);

return(

<div style={{

width:"100%",
height:"100vh",
display:"grid",
gridTemplateColumns:"60px 1fr 340px",
gridTemplateRows:"60px 1fr 260px",
background:"#070b11",
color:"#e2e8ff"

}}>

{/* TOPBAR */}

<div style={{

gridColumn:"1 / span 3",
display:"flex",
alignItems:"center",
gap:20,
padding:"10px 20px",
borderBottom:"1px solid #1b2233"

}}>

<img src="/logo.png" style={{height:34}}/>

<b>SINGULARIDADE</b>

<div style={{marginLeft:20}}>BTCUSDT</div>

<div style={{display:"flex",gap:12}}>

<span>1m</span>
<span>5m</span>
<span>15m</span>
<span>1H</span>
<span>4H</span>
<span>1D</span>

</div>

<div style={{marginLeft:"auto"}}>

IA Atlas Score:

<b style={{color:"#22c55e",marginLeft:6}}>{score}</b>

</div>

</div>

{/* TOOLBAR */}

<div style={{

borderRight:"1px solid #1b2233",
display:"flex",
flexDirection:"column",
alignItems:"center",
gap:24,
paddingTop:20

}}>

<span>✚</span>
<span>／</span>
<span>▭</span>
<span>∿</span>
<span>◎</span>
<span>⤢</span>

</div>

{/* CHART */}

<div

ref={chartContainer}

style={{

position:"relative"

}}

/>

{/* RIGHT PANEL */}

<div style={{

borderLeft:"1px solid #1b2233",
padding:20

}}>

<h3>IA Atlas Insights</h3>

<div style={{marginTop:20}}>

<b>BTCUSDT</b>

<div style={{
fontSize:42,
marginTop:10,
color:"#22c55e"
}}>
{score}
</div>

<div style={{marginTop:14}}>
Direção: {direction}
</div>

<div style={{marginTop:6}}>
Risco: {risk}
</div>

<div style={{marginTop:6}}>
Liquidez: Alta
</div>

<div style={{marginTop:6}}>
Ciclo: Inicial
</div>

<div style={{marginTop:6}}>
Convicção: Forte
</div>

</div>

</div>

{/* BOTTOM PANEL */}

<div style={{

gridColumn:"2 / span 2",
borderTop:"1px solid #1b2233",
display:"grid",
gridTemplateColumns:"1fr 1fr",
padding:20,
gap:40

}}>

{/* SCANNER */}

<div>

<b>Scanner de Mercado</b>

<div style={{marginTop:14}}>
BTCUSDT — Compra Forte
</div>

<div>
ETHUSDT — Compra
</div>

<div>
SOLUSDT — Neutro
</div>

<div>
BNBUSDT — Venda
</div>

<div style={{marginTop:20}}>

<b>Top Volume</b>

<div>BTC</div>
<div>ETH</div>
<div>SOL</div>

</div>

</div>

{/* FLOW */}

<div>

<b>Fluxo Institucional</b>

<div style={{marginTop:14}}>
Volume: Alto
</div>

<div>
Momentum: Crescente
</div>

<div>
Estrutura: Bullish
</div>

<div>
Liquidez: Acumulando
</div>

<div style={{marginTop:20}}>

<b>Eventos</b>

<div>Whale Activity</div>
<div>Alta Liquidez</div>

</div>

</div>

</div>

</div>

);

}
