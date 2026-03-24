<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PROMETEUS — O Fogo do Conhecimento</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Syne:wght@400;600;700;800&display=swap');
:root{
  --bg0:#07090d;--bg1:#0c0e14;--bg2:#10131a;--bg3:#151820;
  --bd:#1c2030;--bd2:#242a3a;
  --t0:#e4e8f2;--t1:#7a859a;--t2:#424e63;
  --cyan:#00d4ff;--green:#00e676;--red:#ff3060;
  --yellow:#ffd54f;--orange:#ff9100;--purple:#c77dff;--blue:#448aff;
  --up:#00c853;--dn:#ff1744;
}
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Syne',sans-serif;background:var(--bg0);color:var(--t0);height:100vh;overflow:hidden;display:flex;flex-direction:column;user-select:none;}

/* NAV */
.nav{display:flex;align-items:center;height:40px;background:var(--bg1);border-bottom:1px solid var(--bd);padding:0 10px;gap:6px;flex-shrink:0;}
.logo{display:flex;align-items:center;gap:7px;margin-right:8px;}
.logo-sym{width:24px;height:24px;background:linear-gradient(135deg,var(--cyan),var(--blue));border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;color:#000;}
.logo-txt{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;letter-spacing:2.5px;color:var(--t0);}
.sep{width:1px;height:20px;background:var(--bd);margin:0 6px;}
.asset-sel{display:flex;align-items:center;gap:6px;background:var(--bg2);border:1px solid var(--bd);border-radius:5px;padding:3px 8px;cursor:pointer;font-size:12px;font-weight:700;transition:.15s;}
.asset-sel:hover{border-color:var(--cyan);}
.abadge{background:var(--cyan);color:#000;border-radius:3px;padding:1px 5px;font-size:10px;font-weight:800;}
.price{display:flex;align-items:center;gap:8px;padding:0 10px;}
.cprice{font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:600;}
.cchg{font-size:12px;font-weight:700;color:var(--green);}
.cchg.neg{color:var(--red);}
.tfs{display:flex;gap:1px;}
.tf{padding:3px 7px;border-radius:4px;font-size:11px;font-weight:600;cursor:pointer;color:var(--t1);background:transparent;border:1px solid transparent;font-family:'JetBrains Mono',monospace;transition:.12s;}
.tf:hover{color:var(--t0);background:var(--bg2);}
.tf.on{background:var(--cyan);color:#000;border-color:var(--cyan);}
.navr{margin-left:auto;display:flex;align-items:center;gap:4px;}
.ntab{padding:3px 10px;border-radius:4px;font-size:11px;font-weight:600;cursor:pointer;color:var(--t1);background:transparent;border:none;transition:.12s;}
.ntab:hover,.ntab.on{color:var(--t0);background:var(--bg2);}
.pnl{background:rgba(0,230,118,.1);border:1px solid rgba(0,230,118,.25);color:var(--green);padding:2px 9px;border-radius:4px;font-size:11px;font-weight:700;font-family:'JetBrains Mono',monospace;}
.ibtn{width:26px;height:26px;display:flex;align-items:center;justify-content:center;border-radius:4px;cursor:pointer;color:var(--t1);font-size:13px;transition:.12s;background:transparent;border:none;}
.ibtn:hover{color:var(--t0);background:var(--bg2);}
.pulse{width:6px;height:6px;border-radius:50%;background:var(--green);animation:pulse 2s infinite;}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.5;transform:scale(.8);}}
.live{display:flex;align-items:center;gap:4px;font-size:10px;color:var(--cyan);margin-right:4px;}

/* TABNAV */
.tabnav{display:flex;align-items:center;height:34px;background:var(--bg1);border-bottom:1px solid var(--bd);padding:0 10px;gap:3px;flex-shrink:0;}
.tab2{display:flex;align-items:center;gap:5px;padding:3px 10px;border-radius:5px;font-size:11px;font-weight:600;cursor:pointer;color:var(--t1);background:transparent;border:1px solid transparent;transition:.12s;}
.tab2:hover{color:var(--t0);background:var(--bg2);}
.tab2.on{color:var(--cyan);background:rgba(0,212,255,.08);border-color:rgba(0,212,255,.2);}

/* MAIN */
.main{display:flex;flex:1;overflow:hidden;}

/* LEFT TOOLBAR */
.ltb{width:42px;background:var(--bg1);border-right:1px solid var(--bd);display:flex;flex-direction:column;align-items:center;padding:6px 0;gap:1px;flex-shrink:0;overflow:hidden;}
.tsep{width:26px;height:1px;background:var(--bd);margin:3px 0;}
.tgrp{font-size:7px;color:var(--t2);letter-spacing:.8px;text-transform:uppercase;writing-mode:vertical-rl;transform:rotate(180deg);margin:3px 0;}
.tbtn{width:30px;height:30px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:5px;cursor:pointer;color:var(--t1);font-size:13px;transition:.12s;position:relative;}
.tbtn:hover{color:var(--t0);background:var(--bg2);}
.tbtn.on{color:var(--cyan);background:rgba(0,212,255,.1);}
.tbtn .tlbl{font-size:6px;color:inherit;line-height:1;margin-top:1px;opacity:.7;}
.tbtn[title]:hover::after{content:attr(title);position:absolute;left:36px;top:50%;transform:translateY(-50%);background:var(--bg3);border:1px solid var(--bd2);color:var(--t0);font-size:10px;padding:3px 7px;border-radius:4px;white-space:nowrap;z-index:999;font-family:'JetBrains Mono',monospace;}

/* CHART AREA */
.chart-area{flex:1;display:flex;flex-direction:column;overflow:hidden;}
.ctb{display:flex;align-items:center;height:36px;background:var(--bg1);border-bottom:1px solid var(--bd);padding:0 10px;gap:8px;flex-shrink:0;}
.cinfo{display:flex;align-items:center;gap:14px;flex:1;}
.csym{font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;color:var(--cyan);}
.cstat{display:flex;flex-direction:column;}
.csl{font-size:8px;color:var(--t2);text-transform:uppercase;letter-spacing:.5px;}
.csv{font-size:11px;font-weight:700;font-family:'JetBrains Mono',monospace;}
.csv.g{color:var(--green)}.csv.r{color:var(--red)}.csv.y{color:var(--yellow)}
.ctbr{display:flex;align-items:center;gap:3px;}
.cbtn{padding:2px 7px;border:1px solid var(--bd);border-radius:4px;font-size:10px;font-weight:600;cursor:pointer;color:var(--t1);background:transparent;transition:.12s;}
.cbtn:hover{color:var(--t0);border-color:var(--bd2);background:var(--bg2);}
.cbtn.on{color:var(--cyan);border-color:var(--cyan);background:rgba(0,212,255,.08);}

/* DRAWING TOOLBAR */
.dtb{display:flex;align-items:center;height:30px;background:var(--bg1);border-bottom:1px solid var(--bd);padding:0 10px;gap:2px;flex-shrink:0;}
.dbtn{padding:2px 8px;border-radius:3px;font-size:10px;font-weight:600;cursor:pointer;color:var(--t1);background:transparent;border:none;transition:.12s;}
.dbtn:hover{color:var(--t0);background:var(--bg2);}
.dbtn.danger{color:rgba(255,48,96,.7);}
.dbtn.danger:hover{color:var(--red);background:rgba(255,48,96,.08);}
.atool{font-size:10px;color:var(--cyan);font-weight:700;margin-left:auto;}

/* CANVAS */
.cwrap{flex:1;position:relative;overflow:hidden;background:var(--bg0);}
#C{display:block;width:100%;height:100%;}

/* OSCILLATOR */
.oscpan{height:90px;background:var(--bg0);border-top:1px solid var(--bd);flex-shrink:0;position:relative;}
.osclbl{position:absolute;top:3px;left:8px;display:flex;gap:8px;z-index:2;}
.oscind{display:flex;align-items:center;gap:3px;font-size:9px;font-family:'JetBrains Mono',monospace;}
.osd{width:10px;height:2px;border-radius:1px;}
#OC{display:block;width:100%;height:100%;}

/* RIGHT PANEL */
.rp{width:215px;background:var(--bg1);border-left:1px solid var(--bd);display:flex;flex-direction:column;flex-shrink:0;}
.rph{padding:7px 10px;border-bottom:1px solid var(--bd);display:flex;align-items:center;justify-content:space-between;}
.rpt{font-size:11px;font-weight:700;letter-spacing:.5px;}
.rpc{cursor:pointer;color:var(--t2);font-size:11px;}
.rpc:hover{color:var(--t0);}
.rpb{flex:1;overflow-y:auto;padding:8px;scrollbar-width:thin;scrollbar-color:var(--bd) transparent;}

.acard{background:var(--bg2);border:1px solid var(--bd);border-radius:7px;padding:9px;margin-bottom:8px;}
.acardh{display:flex;align-items:center;justify-content:space-between;margin-bottom:7px;}
.aico{width:22px;height:22px;background:linear-gradient(135deg,#f7931a,#ff9100);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:#fff;}
.aname{font-size:11px;font-weight:700;}
.aprx{font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;}
.sbar{display:flex;gap:1px;margin:5px 0;}
.sseg{height:4px;border-radius:2px;flex:1;background:var(--bd);transition:.3s;}
.sseg.f{background:var(--green);}
.cbadge{display:inline-block;background:rgba(0,230,118,.12);border:1px solid rgba(0,230,118,.28);color:var(--green);font-size:9px;font-weight:800;padding:2px 8px;border-radius:3px;letter-spacing:1px;}
.vbadge{display:inline-block;background:rgba(255,48,96,.1);border:1px solid rgba(255,48,96,.25);color:var(--red);font-size:9px;font-weight:800;padding:2px 8px;border-radius:3px;letter-spacing:1px;}
.mgrid{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:7px;}
.ml{font-size:8px;color:var(--t2);text-transform:uppercase;letter-spacing:.5px;margin-bottom:1px;}
.mv{font-size:10px;font-weight:700;}
.mv.g{color:var(--green)}.mv.r{color:var(--red)}.mv.y{color:var(--yellow)}.mv.o{color:var(--orange)}.mv.c{color:var(--cyan)}.mv.w{color:var(--t0)}
.stitle{font-size:9px;font-weight:700;color:var(--t1);text-transform:uppercase;letter-spacing:1px;margin:9px 0 4px;padding-bottom:3px;border-bottom:1px solid var(--bd);}
.srow{display:flex;align-items:center;justify-content:space-between;padding:2px 0;border-bottom:1px solid rgba(28,32,48,.5);}
.slbl{font-size:10px;color:var(--t1);}
.sval{font-size:10px;font-weight:700;}
.cdots{display:flex;gap:2px;}
.cdot{width:7px;height:7px;border-radius:50%;background:var(--green);opacity:.2;transition:.3s;}
.cdot.a{opacity:1;}
.qbtn{width:100%;padding:6px;border-radius:5px;font-size:10px;font-weight:700;cursor:pointer;border:none;transition:.15s;margin-bottom:4px;}

/* TOOLTIP */
.tt{position:fixed;background:var(--bg3);border:1px solid var(--bd2);border-radius:5px;padding:7px 10px;font-size:10px;pointer-events:none;z-index:1000;display:none;font-family:'JetBrains Mono',monospace;min-width:150px;box-shadow:0 8px 24px rgba(0,0,0,.5);}
.ttr{display:flex;justify-content:space-between;gap:14px;margin-bottom:1px;}
.ttl{color:var(--t2)}.ttv{font-weight:600;}
.ttv.u{color:var(--up)}.ttv.d{color:var(--dn)}

/* NOTIF */
.nc{position:fixed;top:48px;right:225px;z-index:999;display:flex;flex-direction:column;gap:4px;pointer-events:none;}
.notif{background:var(--bg3);border:1px solid var(--bd2);border-left:3px solid var(--cyan);border-radius:5px;padding:6px 10px;font-size:10px;animation:slin .25s ease,flout .25s ease 2.75s forwards;pointer-events:auto;font-family:'JetBrains Mono',monospace;}
@keyframes slin{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
@keyframes flout{to{opacity:0;transform:translateX(16px)}}

/* MODAL */
.mo{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:500;display:none;align-items:center;justify-content:center;}
.md{background:var(--bg2);border:1px solid var(--bd2);border-radius:9px;padding:18px;min-width:270px;}
.mdt{font-size:13px;font-weight:700;margin-bottom:11px;}
.mdi{width:100%;background:var(--bg0);border:1px solid var(--bd);border-radius:4px;padding:7px 9px;color:var(--t0);font-size:11px;font-family:inherit;margin-bottom:6px;}
.mdi:focus{outline:none;border-color:var(--cyan);}
.mdl{font-size:9px;color:var(--t2);margin-bottom:2px;display:block;}
.mda{display:flex;gap:6px;margin-top:10px;}
.mdbtn{flex:1;padding:7px;border-radius:4px;font-size:11px;font-weight:700;cursor:pointer;border:none;transition:.15s;}
.mdbtn.p{background:var(--cyan);color:#000;}
.mdbtn.s{background:var(--bg3);color:var(--t1);border:1px solid var(--bd);}

/* CONTEXT MENU */
.ctx{position:fixed;background:var(--bg2);border:1px solid var(--bd2);border-radius:6px;padding:4px 0;z-index:800;display:none;min-width:160px;box-shadow:0 8px 24px rgba(0,0,0,.5);}
.cxi{padding:6px 12px;font-size:11px;cursor:pointer;color:var(--t0);display:flex;align-items:center;gap:7px;transition:.1s;}
.cxi:hover{background:var(--bg3);}
.cxi.danger{color:var(--red);}
.cxsep{height:1px;background:var(--bd);margin:3px 0;}


.swatch{width:22px;height:22px;border-radius:4px;cursor:pointer;border:2px solid transparent;transition:.12s;flex-shrink:0;}
.swatch:hover{border-color:var(--t0);transform:scale(1.1);}
.swatch.sel{border-color:#fff;}
.stab{padding:4px 10px;border-radius:4px;font-size:10px;font-weight:600;cursor:pointer;color:var(--t1);background:transparent;border:1px solid var(--bd);transition:.12s;}
.stab:hover{color:var(--t0);}
.stab.on{background:var(--cyan);color:#000;border-color:var(--cyan);}
.fib-row{display:grid;grid-template-columns:auto 1fr auto auto;gap:5px;align-items:center;}
.fib-row input[type=number]{background:var(--bg0);border:1px solid var(--bd);border-radius:3px;padding:3px 5px;color:var(--t0);font-size:10px;font-family:'JetBrains Mono',monospace;width:70px;}
.fib-row input[type=color]{width:20px;height:20px;border:none;padding:0;border-radius:3px;cursor:pointer;background:transparent;}
.fib-row .del-fib{background:transparent;border:none;color:var(--red);cursor:pointer;font-size:12px;padding:2px 4px;}
.fib-row input[type=checkbox]{accent-color:var(--cyan);}
::-webkit-scrollbar{width:3px;}
::-webkit-scrollbar-thumb{background:var(--bd);border-radius:2px;}
</style>
</head>
<body>

<!-- NAV -->
<div class="nav">
  <div class="logo"><div class="logo-sym">🔥</div><div class="logo-txt">PROMETEUS</div></div>
  <div class="asset-sel" onclick="openAssetModal()"><span class="abadge">8</span><span>BTC</span><span style="color:var(--t2);font-size:9px;">▼</span></div>
  <div class="price"><span class="cprice" id="tp">$84,273</span><span class="cchg" id="tc">+2.80%</span></div>
  <div class="sep"></div>
  <div class="tfs">
    <button class="tf" onclick="setTF('1m',this)">1m</button>
    <button class="tf" onclick="setTF('5m',this)">5m</button>
    <button class="tf on" onclick="setTF('15m',this)">15m</button>
    <button class="tf" onclick="setTF('30m',this)">30m</button>
    <button class="tf" onclick="setTF('1H',this)">1H</button>
    <button class="tf" onclick="setTF('4H',this)">4H</button>
    <button class="tf" onclick="setTF('1D',this)">1D</button>
  </div>
  <button class="cbtn" onclick="toggleReplay()" id="rbtn">▶ Replay</button>
  <div class="live"><div class="pulse"></div>AO VIVO</div>
  <div class="navr">
    <button class="ntab on" onclick="ntab(this,'grafico')">Gráfico</button>
    <button class="ntab" onclick="ntab(this,'ordens')">Ordens</button>
    <button class="ntab" onclick="ntab(this,'posicoes')">Posições</button>
    <button class="ntab" onclick="ntab(this,'iaatlas')">IA Atlas</button>
    <button class="ntab" onclick="ntab(this,'fluxo')">Fluxo</button>
    <div class="sep"></div>
    <div class="pnl" id="pnl">+2.80%</div>
    <button class="ibtn" onclick="openAlertModal()">🔔</button>
    <button class="ibtn" onclick="notify('Configurações abertas','cyan')">⚙</button>
  </div>
</div>

<!-- TABNAV -->
<div class="tabnav">
  <div class="tab2" onclick="t2(this)">📊 Fluxo</div>
  <div class="tab2" onclick="t2(this)">🌀 Singularidade</div>
  <div class="tab2" onclick="t2(this)">⭐ IA Atlas</div>
  <div class="tab2 on" onclick="t2(this)">🔭 Scanner</div>
  <div class="tab2" onclick="t2(this)">🎯 Mestre Scanner</div>
  <div class="tab2" onclick="t2(this)">📐 Estrutura</div>
  <div class="tab2" onclick="t2(this)">🔢 Euler</div>
  <div class="tab2" onclick="t2(this)">💧 Liquidez</div>
</div>

<!-- MAIN -->
<div class="main">

  <!-- LEFT TOOLBAR -->
  <div class="ltb">
    <!-- CURSOR group -->
    <div class="tbtn on" id="tool_cursor" onclick="setTool('cursor',this)" title="Cursor (V)">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M1 1l3.5 10 2-3 3-1.5L1 1z"/></svg>
      <span class="tlbl">CURSOR</span>
    </div>
    <div class="tbtn" id="tool_cross" onclick="setTool('cross',this)" title="Mira (C)">✛</div>
    <div class="tsep"></div>

    <!-- LINE group -->
    <div class="tgrp">LINHAS</div>
    <div class="tbtn" id="tool_trendline" onclick="setTool('trendline',this)" title="Tendência (T)">╱</div>
    <div class="tbtn" id="tool_hline" onclick="setTool('hline',this)" title="Horizontal (H)">—</div>
    <div class="tbtn" id="tool_vline" onclick="setTool('vline',this)" title="Vertical (K)">│</div>
    <div class="tbtn" id="tool_ray" onclick="setTool('ray',this)" title="Raio (R)">→</div>
    <div class="tbtn" id="tool_extended" onclick="setTool('extended',this)" title="Estendida">⟷</div>
    <div class="tsep"></div>

    <!-- CHANNEL group -->
    <div class="tgrp">CANAIS</div>
    <div class="tbtn" id="tool_channel" onclick="setTool('channel',this)" title="Canal Paralelo">⦀</div>
    <div class="tbtn" id="tool_pitchfork" onclick="setTool('pitchfork',this)" title="Pitchfork">⑂</div>
    <div class="tsep"></div>

    <!-- FIBONACCI group -->
    <div class="tgrp">FIBO</div>
    <div class="tbtn" id="tool_fib" onclick="setTool('fib',this)" title="Fibonacci Retr. (F)">
      <span style="font-size:9px;font-weight:700;font-family:'JetBrains Mono',monospace;">FIB</span>
    </div>
    <div class="tbtn" id="tool_fibext" onclick="setTool('fibext',this)" title="Fib Extensão">
      <span style="font-size:8px;font-family:'JetBrains Mono',monospace;">EXT</span>
    </div>
    <div class="tbtn" id="tool_fibarc" onclick="setTool('fibarc',this)" title="Fib Arcos">◌</div>
    <div class="tbtn" id="tool_fibfan" onclick="setTool('fibfan',this)" title="Fib Fan">⋱</div>
    <div class="tsep"></div>

    <!-- SHAPES group -->
    <div class="tgrp">FORMAS</div>
    <div class="tbtn" id="tool_rect" onclick="setTool('rect',this)" title="Retângulo (G)">▭</div>
    <div class="tbtn" id="tool_triangle" onclick="setTool('triangle',this)" title="Triângulo">△</div>
    <div class="tbtn" id="tool_ellipse" onclick="setTool('ellipse',this)" title="Elipse">◯</div>
    <div class="tsep"></div>

    <!-- OTHER -->
    <div class="tgrp">MISC</div>
    <div class="tbtn" id="tool_measure" onclick="setTool('measure',this)" title="Medir (M)">⟺</div>
    <div class="tbtn" id="tool_text" onclick="setTool('text',this)" title="Texto (X)">T</div>
    <div class="tbtn" id="tool_magnet" onclick="toggleMagnet(this)" title="Magneto">⦿</div>
    <div class="tsep"></div>
    <div class="tbtn" onclick="undoDrawing()" title="Desfazer (Z)">↩</div>
    <div class="tbtn" onclick="clearDrawings()" title="Limpar tudo">✕</div>
  </div>

  <!-- CHART AREA -->
  <div class="chart-area">
    <!-- CHART TOOLBAR -->
    <div class="ctb">
      <div class="cinfo">
        <span class="csym">BTC/USDT</span>
        <div class="cstat"><span class="csl">PREÇO</span><span class="csv" id="cp">84,273.62</span></div>
        <div class="cstat"><span class="csl">VAR</span><span class="csv g" id="cc">+0.16%</span></div>
        <div class="cstat"><span class="csl">VOL</span><span class="csv" id="cv">680.47</span></div>
        <div class="cstat"><span class="csl">ALTO</span><span class="csv g" id="ch">88,234</span></div>
        <div class="cstat"><span class="csl">BAIXO</span><span class="csv r" id="cl">79,102</span></div>
        <div class="cstat"><span class="csl">DESENHOS</span><span class="csv y" id="dc">0</span></div>
      </div>
      <div class="ctbr">
        <button class="cbtn on" id="autoB" onclick="setMode('auto',this)">Auto</button>
        <button class="cbtn" id="manB" onclick="setMode('manual',this)">Manual</button>
        <button class="cbtn" onclick="followPrice()">Seguir</button>
        <button class="cbtn" onclick="zoomOut()">−</button>
        <button class="cbtn" onclick="zoomIn()">+</button>
        <button class="cbtn" onclick="goNow()">Agora</button>
        <button class="cbtn" onclick="resetChart()">Reset</button>
      </div>
    </div>

    <!-- DRAWING TOOLBAR -->
    <div class="dtb">
      <button class="dbtn" onclick="lockAllDrawings()">🔒 Travar</button>
      <button class="dbtn" onclick="toggleHideDrawings()">👁 Ocultar</button>
      <button class="dbtn" onclick="clearDrawings()">🗑 Limpar</button>
      <button class="dbtn danger" onclick="deleteSelectedDrawing()">✕ Apagar sel.</button>
      <div class="sep" style="margin:0 4px;"></div>
      <button class="dbtn" onclick="setDrawColor('#ffd54f')">🟡</button>
      <button class="dbtn" onclick="setDrawColor('#00d4ff')">🔵</button>
      <button class="dbtn" onclick="setDrawColor('#00e676')">🟢</button>
      <button class="dbtn" onclick="setDrawColor('#ff3060')">🔴</button>
      <button class="dbtn" onclick="setDrawColor('#c77dff')">🟣</button>
      <div class="sep" style="margin:0 4px;"></div>
      <button class="dbtn" onclick="toggleMA(21,'#ffd54f')">MA21</button>
      <button class="dbtn" onclick="toggleMA(55,'#448aff')">MA55</button>
      <button class="dbtn" onclick="toggleMA(89,'#c77dff')">MA89</button>
      <button class="dbtn" onclick="toggleMA(200,'#ff9100')">MA200</button>
      <span class="atool" id="atool">Ferramenta: Cursor</span>
    </div>

    <!-- CANVAS WRAPPER -->
    <div class="cwrap" id="CW">
      <canvas id="C"></canvas>
    </div>

    <!-- OSCILLATOR -->
    <div class="oscpan">
      <div class="osclbl">
        <div class="oscind"><div class="osd" style="background:#c77dff;"></div><span style="color:#c77dff;">RSI</span><span id="rsiV" style="color:#c77dff;margin-left:3px;">—</span></div>
        <div class="oscind"><div class="osd" style="background:#00e5ff;"></div><span style="color:#00e5ff;">MFI</span><span id="mfiV" style="color:#00e5ff;margin-left:3px;">—</span></div>
        <div class="oscind"><div class="osd" style="background:#ffd54f;"></div><span style="color:#ffd54f;">MACD</span></div>
      </div>
      <canvas id="OC"></canvas>
    </div>
  </div>

  <!-- RIGHT PANEL -->
  <div class="rp">
    <div class="rph">
      <span class="rpt">IA Atlas Insights</span>
      <span class="rpc" onclick="this.closest('.rp').style.display='none'">✕</span>
    </div>
    <div class="rpb">
      <div class="acard">
        <div class="acardh">
          <div style="display:flex;align-items:center;gap:6px;">
            <div class="aico">₿</div>
            <div><div style="font-size:8px;color:var(--t2);">8 BTC</div><div class="aname">BTC</div></div>
          </div>
          <div style="text-align:right;">
            <div class="aprx" id="pp">74,682</div>
            <div style="font-size:9px;color:var(--t2);">84 ↑</div>
          </div>
        </div>
        <div class="sbar" id="sb"></div>
        <span class="cbadge" id="sig">COMPRA</span>
        <div class="mgrid">
          <div><div class="ml">Risco</div><div class="mv y">Moderado</div></div>
          <div><div class="ml">Tipo</div><div class="mv o">Volatilidade</div></div>
          <div><div class="ml">Invalidação</div><div class="mv w">$69,180</div></div>
          <div><div class="ml">Fonte</div><div class="mv c">binance</div></div>
        </div>
      </div>

      <div class="stitle">Estrutura</div>
      <div class="srow"><span class="slbl">Fluxo</span><span class="sval" style="color:var(--green)">Positivo</span></div>
      <div class="srow"><span class="slbl">Momentum</span><span class="sval" style="color:var(--green)">Forte</span></div>
      <div class="srow"><span class="slbl">Liquidez</span><span class="sval" style="color:var(--cyan)">Ativo</span></div>
      <div class="srow">
        <span class="slbl">Confluência</span>
        <div class="cdots" id="cdots"></div>
      </div>

      <div class="stitle">Scanner</div>
      <div class="srow"><span class="slbl">Estrutura</span><span class="sval" style="color:var(--green)">Positivo</span></div>
      <div class="srow"><span class="slbl">Momentum</span><span class="sval" style="color:var(--green)">Forte</span></div>
      <div class="srow"><span class="slbl">Confluência</span><span class="sval" style="color:var(--t0)">8 / 9</span></div>
      <div class="srow"><span class="slbl">Razão Prata</span><span class="sval" style="color:var(--green)">Forte</span></div>
      <div class="srow"><span class="slbl">Ciclo</span><span class="sval" style="color:var(--cyan)">Acelerado</span></div>

      <div class="stitle">Confluência</div>
      <div class="srow"><span class="slbl">Euler</span><span class="sval" style="color:var(--green)">Alinhado</span></div>
      <div class="srow"><span class="slbl">Razão Prata</span><span class="sval" style="color:var(--green)">Forte</span></div>
      <div class="srow"><span class="slbl">Risco Assimét.</span><span class="sval" style="color:var(--yellow)">Bom</span></div>
      <div class="srow"><span class="slbl">Invalidação</span><span class="sval" style="color:var(--t0)">Controlada</span></div>

      <div class="stitle" style="margin-top:12px;">Ações Rápidas</div>
      <button class="qbtn" onclick="qa('long')" style="background:rgba(0,230,118,.1);border:1px solid rgba(0,230,118,.25);color:var(--green);">▲ LONG BTC</button>
      <button class="qbtn" onclick="qa('short')" style="background:rgba(255,48,96,.08);border:1px solid rgba(255,48,96,.2);color:var(--red);">▼ SHORT BTC</button>
      <button class="qbtn" onclick="openAlertModal()" style="background:rgba(255,213,79,.08);border:1px solid rgba(255,213,79,.2);color:var(--yellow);">🔔 ALERTA PREÇO</button>
    </div>
  </div>
</div>

<!-- TOOLTIP -->
<div class="tt" id="TT">
  <div class="ttr"><span class="ttl">Abertura</span><span class="ttv" id="tO">—</span></div>
  <div class="ttr"><span class="ttl">Máxima</span><span class="ttv u" id="tH">—</span></div>
  <div class="ttr"><span class="ttl">Mínima</span><span class="ttv d" id="tL">—</span></div>
  <div class="ttr"><span class="ttl">Fechamento</span><span class="ttv" id="tC">—</span></div>
  <div class="ttr" style="margin-top:3px;"><span class="ttl">Volume</span><span class="ttv" id="tV">—</span></div>
</div>

<!-- NOTIF CONTAINER -->
<div class="nc" id="NC"></div>

<!-- ALERT MODAL -->
<div class="mo" id="alertMo">
  <div class="md">
    <div class="mdt">🔔 Criar Alerta de Preço</div>
    <span class="mdl">Preço alvo</span>
    <input class="mdi" id="aPrice" type="number" placeholder="Ex: 85000">
    <span class="mdl">Condição</span>
    <select class="mdi" id="aCond">
      <option value="above">Acima do preço</option>
      <option value="below">Abaixo do preço</option>
    </select>
    <div class="mda">
      <button class="mdbtn s" onclick="closeMo('alertMo')">Cancelar</button>
      <button class="mdbtn p" onclick="createAlert()">Criar Alerta</button>
    </div>
  </div>
</div>

<!-- TEXT MODAL -->
<div class="mo" id="textMo">
  <div class="md">
    <div class="mdt">✏ Adicionar Texto</div>
    <input class="mdi" id="tText" placeholder="Digite o texto..." autofocus>
    <select class="mdi" id="tSize">
      <option value="11">Pequeno</option>
      <option value="13" selected>Médio</option>
      <option value="16">Grande</option>
      <option value="20">Muito Grande</option>
    </select>
    <div class="mda">
      <button class="mdbtn s" onclick="closeMo('textMo')">Cancelar</button>
      <button class="mdbtn p" onclick="addText()">Adicionar</button>
    </div>
  </div>
</div>

<!-- ASSET MODAL -->
<div class="mo" id="assetMo">
  <div class="md">
    <div class="mdt">🔍 Selecionar Ativo</div>
    <input class="mdi" id="assetSearch" placeholder="Buscar... BTC, ETH, SOL" oninput="filterAssets(this.value)">
    <div id="assetList" style="max-height:200px;overflow-y:auto;"></div>
    <div class="mda"><button class="mdbtn s" onclick="closeMo('assetMo')">Fechar</button></div>
  </div>
</div>


<!-- SETTINGS MODAL -->
<div class="mo" id="settingsMo">
  <div class="md" style="min-width:340px;max-width:420px;max-height:85vh;overflow-y:auto;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
      <div class="mdt" id="settingsTitle" style="margin-bottom:0;">⚙ Configurações</div>
      <span onclick="closeMo('settingsMo')" style="cursor:pointer;color:var(--t2);font-size:14px;">✕</span>
    </div>

    <!-- TABS -->
    <div style="display:flex;gap:3px;margin-bottom:12px;border-bottom:1px solid var(--bd);padding-bottom:8px;">
      <button class="stab on" id="stab_style" onclick="switchSettingsTab('style')">🎨 Estilo</button>
      <button class="stab" id="stab_levels" onclick="switchSettingsTab('levels')">📊 Níveis</button>
      <button class="stab" id="stab_visibility" onclick="switchSettingsTab('visibility')">👁 Visibilidade</button>
    </div>

    <!-- STYLE TAB -->
    <div id="sTab_style">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div>
          <span class="mdl">Cor da linha</span>
          <div style="display:flex;gap:3px;flex-wrap:wrap;margin-top:5px;">
            <div class="swatch" style="background:#ffd54f" onclick="setSwatch('#ffd54f')"></div>
            <div class="swatch" style="background:#00d4ff" onclick="setSwatch('#00d4ff')"></div>
            <div class="swatch" style="background:#00e676" onclick="setSwatch('#00e676')"></div>
            <div class="swatch" style="background:#ff3060" onclick="setSwatch('#ff3060')"></div>
            <div class="swatch" style="background:#c77dff" onclick="setSwatch('#c77dff')"></div>
            <div class="swatch" style="background:#ff9100" onclick="setSwatch('#ff9100')"></div>
            <div class="swatch" style="background:#448aff" onclick="setSwatch('#448aff')"></div>
            <div class="swatch" style="background:#ffffff" onclick="setSwatch('#ffffff')"></div>
            <input type="color" id="sColorPicker" style="width:22px;height:22px;border:none;padding:0;border-radius:3px;cursor:pointer;" onchange="setSwatch(this.value)">
          </div>
        </div>
        <div>
          <span class="mdl">Prévia da cor</span>
          <div id="sColorPreview" style="width:100%;height:22px;border-radius:4px;margin-top:5px;border:1px solid var(--bd2);background:#ffd54f;"></div>
        </div>
        <div>
          <span class="mdl">Espessura</span>
          <select class="mdi" id="sWidth" style="margin-top:4px;">
            <option value="1">Fina (1px)</option>
            <option value="1.5">Normal (1.5px)</option>
            <option value="2" selected>Média (2px)</option>
            <option value="3">Grossa (3px)</option>
            <option value="4">Muito Grossa (4px)</option>
          </select>
        </div>
        <div>
          <span class="mdl">Estilo da linha</span>
          <select class="mdi" id="sLineStyle" style="margin-top:4px;">
            <option value="solid">Sólida ───</option>
            <option value="dashed">Tracejada ─ ─</option>
            <option value="dotted">Pontilhada · · ·</option>
          </select>
        </div>
        <div>
          <span class="mdl">Opacidade fundo <span id="sFillOpacityVal">10%</span></span>
          <input type="range" id="sFillOpacity" min="0" max="40" value="10" style="width:100%;margin-top:6px;accent-color:var(--cyan);" oninput="document.getElementById('sFillOpacityVal').textContent=this.value+'%'">
        </div>
        <div>
          <span class="mdl">Mostrar preço</span>
          <select class="mdi" id="sShowPrice" style="margin-top:4px;">
            <option value="1">Sim</option>
            <option value="0">Não</option>
          </select>
        </div>
      </div>

      <!-- FIB SPECIFIC -->
      <div id="sFibSection" style="display:none;margin-top:12px;">
        <div style="font-size:10px;font-weight:700;color:var(--t1);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;border-top:1px solid var(--bd);padding-top:8px;">Níveis Fibonacci</div>
        <div style="display:grid;grid-template-columns:auto 1fr auto auto;gap:4px;align-items:center;font-size:9px;color:var(--t2);margin-bottom:4px;padding:0 2px;">
          <span>Vis.</span><span>Valor %</span><span>Cor</span><span>Del.</span>
        </div>
        <div id="sFibLevels" style="display:flex;flex-direction:column;gap:4px;max-height:170px;overflow-y:auto;"></div>
        <button onclick="addFibLevel()" style="margin-top:7px;padding:4px 12px;background:var(--bg3);border:1px solid var(--bd);border-radius:4px;color:var(--cyan);font-size:10px;cursor:pointer;width:100%;">+ Adicionar nível</button>
      </div>

      <!-- TEXT SPECIFIC -->
      <div id="sTextSection" style="display:none;margin-top:10px;border-top:1px solid var(--bd);padding-top:10px;">
        <span class="mdl">Conteúdo do texto</span>
        <input class="mdi" id="sTextContent" style="margin-top:4px;">
        <span class="mdl" style="margin-top:6px;display:block;">Tamanho da fonte</span>
        <select class="mdi" id="sTextSize" style="margin-top:4px;">
          <option value="10">Pequeno (10px)</option>
          <option value="13" selected>Médio (13px)</option>
          <option value="16">Grande (16px)</option>
          <option value="20">Muito Grande (20px)</option>
          <option value="26">Enorme (26px)</option>
        </select>
        <label style="display:flex;align-items:center;gap:6px;margin-top:8px;font-size:11px;">
          <input type="checkbox" id="sTextBold" style="accent-color:var(--cyan);">
          <span>Negrito</span>
        </label>
      </div>

      <!-- HLINE SPECIFIC -->
      <div id="sHLineSection" style="display:none;margin-top:10px;border-top:1px solid var(--bd);padding-top:10px;">
        <span class="mdl">Preço exato</span>
        <input class="mdi" id="sHLinePrice" type="number" step="1" style="margin-top:4px;">
        <span class="mdl" style="margin-top:6px;display:block;">Rótulo personalizado</span>
        <input class="mdi" id="sHLineLabel" placeholder="Ex: Suporte, Resistência..." style="margin-top:4px;">
      </div>

      <!-- CHANNEL SPECIFIC -->
      <div id="sChannelSection" style="display:none;margin-top:10px;border-top:1px solid var(--bd);padding-top:10px;">
        <span class="mdl">Largura do canal (offset) <span id="sChannelVal"></span></span>
        <input type="range" id="sChannelOffset" min="-8000" max="8000" value="0" style="width:100%;margin-top:6px;accent-color:var(--cyan);" oninput="previewChannel(this.value)">
      </div>

      <!-- RECT SPECIFIC -->
      <div id="sRectSection" style="display:none;margin-top:10px;border-top:1px solid var(--bd);padding-top:10px;">
        <label style="display:flex;align-items:center;gap:6px;font-size:11px;margin-bottom:6px;">
          <input type="checkbox" id="sRectPercent" checked style="accent-color:var(--cyan);">
          <span>Mostrar variação %</span>
        </label>
        <label style="display:flex;align-items:center;gap:6px;font-size:11px;">
          <input type="checkbox" id="sRectPrices" checked style="accent-color:var(--cyan);">
          <span>Mostrar preços</span>
        </label>
      </div>

      <!-- TRENDLINE SPECIFIC -->
      <div id="sTrendSection" style="display:none;margin-top:10px;border-top:1px solid var(--bd);padding-top:10px;">
        <label style="display:flex;align-items:center;gap:6px;font-size:11px;margin-bottom:6px;">
          <input type="checkbox" id="sTrendArrow" checked style="accent-color:var(--cyan);">
          <span>Mostrar seta</span>
        </label>
        <label style="display:flex;align-items:center;gap:6px;font-size:11px;">
          <input type="checkbox" id="sTrendAngle" style="accent-color:var(--cyan);">
          <span>Mostrar ângulo</span>
        </label>
        <label style="display:flex;align-items:center;gap:6px;font-size:11px;margin-top:6px;">
          <input type="checkbox" id="sTrendVariation" style="accent-color:var(--cyan);">
          <span>Mostrar variação %</span>
        </label>
      </div>
    </div>

    <!-- LEVELS TAB -->
    <div id="sTab_levels" style="display:none;">
      <div id="sLevelsContent" style="font-size:11px;color:var(--t1);"></div>
    </div>

    <!-- VISIBILITY TAB -->
    <div id="sTab_visibility" style="display:none;">
      <div style="display:flex;flex-direction:column;gap:10px;">
        <label style="display:flex;align-items:center;justify-content:space-between;font-size:11px;padding:6px 0;border-bottom:1px solid var(--bd);">
          <span>Visível no gráfico</span>
          <input type="checkbox" id="sVisible" checked style="accent-color:var(--cyan);width:15px;height:15px;">
        </label>
        <label style="display:flex;align-items:center;justify-content:space-between;font-size:11px;padding:6px 0;border-bottom:1px solid var(--bd);">
          <span>Travado (não mover)</span>
          <input type="checkbox" id="sLocked" style="accent-color:var(--cyan);width:15px;height:15px;">
        </label>
        <label style="display:flex;align-items:center;justify-content:space-between;font-size:11px;padding:6px 0;border-bottom:1px solid var(--bd);">
          <span>Mostrar em todas as TFs</span>
          <input type="checkbox" id="sShowAllTF" checked style="accent-color:var(--cyan);width:15px;height:15px;">
        </label>
        <div style="margin-top:4px;">
          <span class="mdl">Nota / Descrição</span>
          <textarea class="mdi" id="sNote" placeholder="Adicione uma nota..." rows="3" style="resize:vertical;margin-top:5px;"></textarea>
        </div>
      </div>
    </div>

    <div class="mda" style="margin-top:14px;">
      <button class="mdbtn s" onclick="closeMo('settingsMo')">Cancelar</button>
      <button class="mdbtn p" onclick="applySettings()">✓ Aplicar</button>
    </div>
  </div>
</div>

<!-- CONTEXT MENU -->
<div class="ctx" id="CTX">
  <div class="cxi" onclick="ctxAction('edit')">⚙ Configurações</div>
  <div class="cxi" onclick="ctxAction('lock')">🔒 Travar / Destravar</div>
  <div class="cxi" onclick="ctxAction('hide')">👁 Ocultar / Mostrar</div>
  <div class="cxsep"></div>
  <div class="cxi danger" onclick="ctxAction('delete')">🗑 Apagar</div>
</div>

<script>
// ========================================
// STATE
// ========================================
let TF = '15m';
let tool = 'cursor';
let drawColor = '#ffd54f';
let drawings = [];
let selDraw = null;
let isDrawing = false;
let drawPt1 = null;
let pendingText = null;
let alerts = [];
let magnetOn = false;
let hideDrawings = false;
let mas = { 21: true, 55: true, 89: true, 200: false };
let visN = 80;
let panOff = 0;
let panStart = null;
let mouse = { x: -1, y: -1 };
let hoverIdx = null;
let replayMode = false;
let animId;
let CW, canvas, ctx, oscCanvas, oscCtx;
let W = 0, H = 0;

const ASSETS = ['BTC','ETH','SOL','BNB','XRP','DOGE','ADA','AVAX','MATIC','DOT','LINK','UNI','ATOM','LTC','TRX'];

// FIB LEVELS
const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0, 1.272, 1.618];
const FIB_COLORS = ['#ffd54f','#00d4ff','#00e676','#ff9100','#c77dff','#ff3060','#ffd54f','#448aff','#00e676'];

const DEFAULT_FIB_LEVELS = [
  { pct: 0,     color: '#ffd54f', visible: true },
  { pct: 0.236, color: '#00d4ff', visible: true },
  { pct: 0.382, color: '#00e676', visible: true },
  { pct: 0.5,   color: '#ff9100', visible: true },
  { pct: 0.618, color: '#c77dff', visible: true },
  { pct: 0.786, color: '#ff3060', visible: true },
  { pct: 1.0,   color: '#ffd54f', visible: true },
  { pct: 1.272, color: '#448aff', visible: false },
  { pct: 1.618, color: '#00e676', visible: false },
];

// ========================================
// CANDLE GENERATION
// ========================================
function genCandles(n = 200) {
  const cs = [];
  let p = 82000 + Math.random() * 5000;
  const now = Date.now();
  const ms = { '1m':60e3,'5m':300e3,'15m':900e3,'30m':1800e3,'1H':3600e3,'4H':14400e3,'1D':86400e3 };
  const iv = ms[TF] || 900e3;
  for (let i = n - 1; i >= 0; i--) {
    const o = p;
    const chg = (Math.random() - 0.475) * p * 0.009;
    const c = p + chg;
    const hi = Math.max(o, c) + Math.random() * p * 0.004;
    const lo = Math.min(o, c) - Math.random() * p * 0.004;
    const vol = 150 + Math.random() * 700;
    cs.push({ o, h: hi, l: lo, c, v: vol, t: now - i * iv });
    p = c;
  }
  return cs;
}
let candles = genCandles(200);

// ========================================
// INDICATORS
// ========================================
function calcRSI(cs, p = 14) {
  const r = new Array(cs.length).fill(null);
  if (cs.length < p + 1) return r;
  let g = 0, l = 0;
  for (let i = 1; i <= p; i++) {
    const d = cs[i].c - cs[i - 1].c;
    if (d >= 0) g += d; else l -= d;
  }
  let ag = g / p, al = l / p;
  r[p] = al === 0 ? 100 : 100 - 100 / (1 + ag / al);
  for (let i = p + 1; i < cs.length; i++) {
    const d = cs[i].c - cs[i - 1].c;
    ag = (ag * (p - 1) + Math.max(0, d)) / p;
    al = (al * (p - 1) + Math.max(0, -d)) / p;
    r[i] = al === 0 ? 100 : 100 - 100 / (1 + ag / al);
  }
  return r;
}

function calcMA(cs, p) {
  return cs.map((_, i) => {
    if (i < p - 1) return null;
    let s = 0;
    for (let j = i - p + 1; j <= i; j++) s += cs[j].c;
    return s / p;
  });
}

// ========================================
// CANVAS SETUP
// ========================================
function init() {
  CW = document.getElementById('CW');
  canvas = document.getElementById('C');
  if (!canvas) { console.error('Canvas #C não encontrado'); return; }
  ctx = canvas.getContext('2d');
  oscCanvas = document.getElementById('OC');
  if (!oscCanvas) { console.error('Canvas #OC não encontrado'); return; }
  oscCtx = oscCanvas.getContext('2d');

  // Bind canvas events after canvas is confirmed to exist
  bindCanvasEvents();

  resize();
  buildScoreBars(84);
  buildConfDots(8, 9);
  updatePrice();
}

function bindCanvasEvents() {
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseleave', onMouseLeave);
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('wheel', e => { e.preventDefault(); e.deltaY < 0 ? zoomIn() : zoomOut(); }, { passive: false });
  canvas.addEventListener('dblclick', onDblClick);
  canvas.addEventListener('contextmenu', onContextMenu);
}

function resize() {
  W = CW.clientWidth; H = CW.clientHeight;
  canvas.width = W; canvas.height = H;
  const op = document.querySelector('.oscpan');
  oscCanvas.width = op.clientWidth; oscCanvas.height = op.clientHeight;
  draw(); drawOsc();
}

// ========================================
// PRICE UTILS
// ========================================
function getRange() {
  const s = Math.max(0, candles.length - visN - Math.round(panOff));
  const e = Math.min(candles.length, s + visN);
  const vis = candles.slice(s, e);
  if (!vis.length) return { min: 0, max: 1 };
  let mn = Infinity, mx = -Infinity;
  for (const c of vis) { if (c.l < mn) mn = c.l; if (c.h > mx) mx = c.h; }
  const pad = (mx - mn) * 0.12;
  return { min: mn - pad, max: mx + pad };
}

function p2y(price, rng, chartH) {
  return chartH - ((price - rng.min) / (rng.max - rng.min)) * chartH + 8;
}

function y2p(y, rng, chartH) {
  return rng.max - ((y - 8) / chartH) * (rng.max - rng.min);
}

function getVis() {
  const s = Math.max(0, candles.length - visN - Math.round(panOff));
  const e = Math.min(candles.length, s + visN);
  return { vis: candles.slice(s, e), si: s };
}

function x2candleIdx(x) {
  const cw = (W - 62) / visN;
  return Math.floor(x / cw);
}

// ========================================
// MAIN DRAW
// ========================================
function draw() {
  ctx.clearRect(0, 0, W, H);
  const rng = getRange();
  const chartH = H * 0.78;
  const volH = H * 0.16;
  const volY = chartH + 10;
  const cw = (W - 62) / visN;
  const bw = Math.max(1.5, cw * 0.65);
  const { vis, si } = getVis();

  // === GRID ===
  ctx.strokeStyle = '#1c2030'; ctx.lineWidth = 0.5;
  for (let i = 0; i <= 7; i++) {
    const price = rng.min + (rng.max - rng.min) * (i / 7);
    const y = p2y(price, rng, chartH);
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W - 62, y); ctx.stroke();
    ctx.fillStyle = '#424e63'; ctx.font = '9px JetBrains Mono'; ctx.textAlign = 'left';
    ctx.fillText(price.toFixed(0), W - 60, y + 3);
  }
  // Vertical grid
  for (let i = 0; i < vis.length; i += Math.max(1, Math.floor(vis.length / 8))) {
    const x = i * cw + cw / 2;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, chartH); ctx.stroke();
  }

  // === MAs ===
  const maConf = [
    { p: 21, c: '#ffd54f', w: 1.5 },
    { p: 55, c: '#448aff', w: 1.5 },
    { p: 89, c: '#c77dff', w: 1.2 },
    { p: 200, c: '#ff9100', w: 1.2 }
  ];
  for (const m of maConf) {
    if (!mas[m.p]) continue;
    const ma = calcMA(candles, m.p);
    ctx.strokeStyle = m.c; ctx.lineWidth = m.w; ctx.globalAlpha = 0.85;
    ctx.beginPath(); let st = false;
    for (let i = 0; i < vis.length; i++) {
      const v = ma[si + i];
      if (v == null) continue;
      const x = i * cw + cw / 2;
      const y = p2y(v, rng, chartH);
      st ? ctx.lineTo(x, y) : (ctx.moveTo(x, y), st = true);
    }
    ctx.stroke(); ctx.globalAlpha = 1;
  }

  // === VOLUME ===
  let maxV = 0;
  for (const c of vis) if (c.v > maxV) maxV = c.v;
  for (let i = 0; i < vis.length; i++) {
    const c = vis[i];
    const x = i * cw + cw / 2;
    const vh = (c.v / maxV) * volH;
    ctx.fillStyle = c.c >= c.o ? 'rgba(0,200,83,.35)' : 'rgba(255,23,68,.35)';
    ctx.fillRect(x - bw / 2, volY + volH - vh, bw, vh);
  }

  // === CANDLES ===
  for (let i = 0; i < vis.length; i++) {
    const c = vis[i];
    const x = i * cw + cw / 2;
    const up = c.c >= c.o;
    const col = up ? '#00c853' : '#ff1744';
    const alpha = hoverIdx === i ? 1 : 0.88;

    ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.globalAlpha = alpha;
    ctx.beginPath(); ctx.moveTo(x, p2y(c.h, rng, chartH)); ctx.lineTo(x, p2y(c.l, rng, chartH)); ctx.stroke();

    const by = p2y(Math.max(c.o, c.c), rng, chartH);
    const bh = Math.max(1, p2y(Math.min(c.o, c.c), rng, chartH) - by);
    ctx.fillStyle = col;
    ctx.fillRect(x - bw / 2, by, bw, bh);
    ctx.globalAlpha = 1;
  }

  // === CURRENT PRICE LINE ===
  const last = candles[candles.length - 1].c;
  const ly = p2y(last, rng, chartH);
  ctx.strokeStyle = 'rgba(0,230,118,.5)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(W - 62, ly); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#00c853';
  ctx.fillRect(W - 62, ly - 9, 62, 18);
  ctx.fillStyle = '#000'; ctx.font = 'bold 9px JetBrains Mono'; ctx.textAlign = 'center';
  ctx.fillText(last.toFixed(0), W - 31, ly + 3);

  // === TIME AXIS ===
  ctx.fillStyle = '#424e63'; ctx.font = '9px JetBrains Mono'; ctx.textAlign = 'center';
  const step = Math.max(1, Math.floor(vis.length / 8));
  for (let i = 0; i < vis.length; i += step) {
    const d = new Date(vis[i].t);
    const lbl = `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
    ctx.fillText(lbl, i * cw + cw / 2, H - 2);
  }

  // === CROSSHAIR ===
  if (mouse.x >= 0 && mouse.y >= 0) {
    ctx.strokeStyle = 'rgba(122,133,154,.35)'; ctx.setLineDash([3, 3]); ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(mouse.x, 0); ctx.lineTo(mouse.x, chartH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, mouse.y); ctx.lineTo(W - 62, mouse.y); ctx.stroke();
    ctx.setLineDash([]);
    if (mouse.y > 0 && mouse.y < chartH) {
      const hp = y2p(mouse.y, rng, chartH);
      ctx.fillStyle = '#1c2030';
      ctx.fillRect(W - 62, mouse.y - 9, 62, 18);
      ctx.fillStyle = '#7a859a'; ctx.font = '9px JetBrains Mono'; ctx.textAlign = 'center';
      ctx.fillText(hp.toFixed(0), W - 31, mouse.y + 3);
    }
  }

  // === DRAWINGS ===
  if (!hideDrawings) drawAllDrawings(rng, chartH, vis, cw, si);
}

// ========================================
// DRAWING ENGINE
// ========================================
function drawAllDrawings(rng, chartH, vis, cw, si) {
  for (const d of drawings) {
    if (d.hidden) continue;
    const isSel = d === selDraw;
    ctx.strokeStyle = d.color || '#ffd54f';
    ctx.fillStyle = d.color || '#ffd54f';
    ctx.lineWidth = isSel ? 2.5 : 1.8;
    ctx.globalAlpha = isSel ? 1 : 0.85;

    switch (d.type) {
      case 'hline': drawHLine(d, rng, chartH, isSel); break;
      case 'vline': drawVLine(d, cw, chartH, isSel); break;
      case 'trendline': drawTrendLine(d, rng, chartH, isSel); break;
      case 'ray': drawRay(d, rng, chartH, isSel); break;
      case 'extended': drawExtended(d, rng, chartH, isSel); break;
      case 'channel': drawChannel(d, rng, chartH, isSel); break;
      case 'pitchfork': drawPitchfork(d, rng, chartH, isSel); break;
      case 'fib': drawFib(d, rng, chartH, isSel); break;
      case 'fibext': drawFibExt(d, rng, chartH, isSel); break;
      case 'fibarc': drawFibArc(d, rng, chartH, isSel); break;
      case 'fibfan': drawFibFan(d, rng, chartH, isSel); break;
      case 'rect': drawRect(d, rng, chartH, isSel); break;
      case 'triangle': drawTriangle(d, rng, chartH, isSel); break;
      case 'ellipse': drawEllipse(d, rng, chartH, isSel); break;
      case 'measure': drawMeasure(d, rng, chartH, isSel); break;
      case 'text': drawTextDraw(d, rng, chartH); break;
    }
    ctx.globalAlpha = 1;
  }

  // Preview while drawing
  if (isDrawing && drawPt1) {
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
    drawPreview(rng, chartH);
    ctx.setLineDash([]);
  }

  // Selection handles
  if (selDraw) drawHandles(selDraw, rng, chartH);
}

function drawHLine(d, rng, chartH, sel) {
  const y = p2y(d.price, rng, chartH);
  if (y < 0 || y > chartH) return;
  ctx.lineWidth = d.lineWidth || 1.5;
  const ls = d.lineStyle || 'solid';
  ctx.setLineDash(ls === 'dashed' ? [5,3] : ls === 'dotted' ? [2,3] : d.dashed ? [5,3] : []);
  ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W - 62, y); ctx.stroke();
  ctx.setLineDash([]);
  if (d.showPrice !== false) {
    ctx.font = 'bold 9px JetBrains Mono'; ctx.textAlign = 'left';
    ctx.fillText(d.price.toFixed(2), 4, y - 3);
    if (d.label) {
      ctx.font = 'bold 10px JetBrains Mono';
      ctx.fillText(d.label, 80, y - 3);
    }
  }
}

function drawVLine(d, cw, chartH, sel) {
  const x = d.xi * cw + cw / 2;
  ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, chartH); ctx.stroke();
  ctx.setLineDash([]);
}

function drawTrendLine(d, rng, chartH, sel) {
  const y1 = p2y(d.p1, rng, chartH);
  const y2 = p2y(d.p2, rng, chartH);
  ctx.lineWidth = d.lineWidth || 1.8;
  const ls = d.lineStyle || 'solid';
  ctx.setLineDash(ls === 'dashed' ? [5,3] : ls === 'dotted' ? [2,3] : []);
  ctx.beginPath(); ctx.moveTo(d.x1, y1); ctx.lineTo(d.x2, y2); ctx.stroke();
  ctx.setLineDash([]);
  if (d.showArrow !== false) {
    const angle = Math.atan2(y2 - y1, d.x2 - d.x1);
    ctx.lineWidth = d.lineWidth || 1.8;
    ctx.beginPath();
    ctx.moveTo(d.x2, y2);
    ctx.lineTo(d.x2 - 10 * Math.cos(angle - 0.4), y2 - 10 * Math.sin(angle - 0.4));
    ctx.moveTo(d.x2, y2);
    ctx.lineTo(d.x2 - 10 * Math.cos(angle + 0.4), y2 - 10 * Math.sin(angle + 0.4));
    ctx.stroke();
  }
  if (d.showAngle) {
    const angle = Math.atan2(-(y2 - y1), d.x2 - d.x1) * 180 / Math.PI;
    ctx.fillStyle = d.color; ctx.font = '9px JetBrains Mono'; ctx.textAlign = 'left';
    ctx.fillText(angle.toFixed(1) + '°', (d.x1 + d.x2)/2 + 4, (y1 + y2)/2 - 4);
  }
  if (d.showVariation && d.p1 && d.p2) {
    const pct = ((d.p2 - d.p1) / d.p1 * 100).toFixed(2);
    ctx.fillStyle = d.color; ctx.font = 'bold 9px JetBrains Mono'; ctx.textAlign = 'center';
    ctx.fillText((pct > 0 ? '+' : '') + pct + '%', (d.x1 + d.x2)/2, (y1 + y2)/2 + 12);
  }
}

function drawRay(d, rng, chartH, sel) {
  const y = p2y(d.p1, rng, chartH);
  const y2 = p2y(d.p2, rng, chartH);
  const dx = d.x2 - d.x1; const dy = y2 - y;
  const ext = W * 2;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ex = d.x1 + (dx / len) * ext;
  const ey = y + (dy / len) * ext;
  ctx.beginPath(); ctx.moveTo(d.x1, y); ctx.lineTo(ex, ey); ctx.stroke();
}

function drawExtended(d, rng, chartH, sel) {
  const y1 = p2y(d.p1, rng, chartH);
  const y2 = p2y(d.p2, rng, chartH);
  const dx = d.x2 - d.x1; const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ext = W * 2;
  ctx.beginPath();
  ctx.moveTo(d.x1 - (dx / len) * ext, y1 - (dy / len) * ext);
  ctx.lineTo(d.x2 + (dx / len) * ext, y2 + (dy / len) * ext);
  ctx.stroke();
}

function drawChannel(d, rng, chartH, sel) {
  const y1 = p2y(d.p1, rng, chartH);
  const y2 = p2y(d.p2, rng, chartH);
  const offset = p2y(d.p1, rng, chartH) - p2y(d.p1 + d.offset, rng, chartH);
  ctx.beginPath(); ctx.moveTo(d.x1, y1); ctx.lineTo(d.x2, y2); ctx.stroke();
  ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.moveTo(d.x1, y1 + offset); ctx.lineTo(d.x2, y2 + offset); ctx.stroke();
  ctx.setLineDash([]);
  // Fill
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = d.color;
  ctx.beginPath();
  ctx.moveTo(d.x1, y1); ctx.lineTo(d.x2, y2);
  ctx.lineTo(d.x2, y2 + offset); ctx.lineTo(d.x1, y1 + offset);
  ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 0.85;
}

function drawPitchfork(d, rng, chartH, sel) {
  if (!d.p3) return;
  const y1 = p2y(d.p1, rng, chartH);
  const y2 = p2y(d.p2, rng, chartH);
  const y3 = p2y(d.p3, rng, chartH);
  const midX = (d.x2 + d.x3) / 2;
  const midY = (y2 + y3) / 2;
  ctx.beginPath(); ctx.moveTo(d.x1, y1); ctx.lineTo(midX, midY); ctx.stroke();
  ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(d.x1, y1); ctx.lineTo(midX + (midX - d.x1) * 2, midY - (y2 - y3) / 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(d.x1, y1); ctx.lineTo(midX + (midX - d.x1) * 2, midY + (y2 - y3) / 2); ctx.stroke();
  ctx.setLineDash([]);
}

function drawFib(d, rng, chartH, sel) {
  const y1 = p2y(d.p1, rng, chartH);
  const y2 = p2y(d.p2, rng, chartH);
  const x1 = d.x1, x2 = d.x2;
  const priceDiff = d.p2 - d.p1;
  const minX = Math.min(x1, x2);
  const lw = d.lineWidth || 1.5;
  const ls = d.lineStyle || 'solid';
  const fillAlpha = (d.fillOpacity !== undefined ? d.fillOpacity : 10) / 100;
  const levels = d.fibLevels || DEFAULT_FIB_LEVELS;

  levels.forEach((lvl, i) => {
    if (!lvl.visible) return;
    const price = d.p1 + priceDiff * lvl.pct;
    const y = p2y(price, rng, chartH);
    if (y < -50 || y > chartH + 50) return;
    ctx.strokeStyle = lvl.color;
    ctx.lineWidth = (lvl.pct === 0 || lvl.pct === 1) ? lw + 0.5 : lw;
    ctx.globalAlpha = 0.8;
    const dash = ls === 'dashed' ? [5,3] : ls === 'dotted' ? [2,3] : (lvl.pct === 0.5 ? [4,3] : []);
    ctx.setLineDash(dash);
    ctx.beginPath(); ctx.moveTo(minX, y); ctx.lineTo(W - 62, y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    if (d.showPrice !== false) {
      ctx.fillStyle = lvl.color;
      ctx.font = 'bold 9px JetBrains Mono'; ctx.textAlign = 'left';
      ctx.fillText(((lvl.pct) * 100).toFixed(1) + '%  ' + price.toFixed(0), minX + 4, y - 3);
    }
  });

  // Shading between consecutive visible levels
  const vis = levels.filter(l => l.visible);
  for (let i = 0; i < vis.length - 1; i++) {
    const py1 = p2y(d.p1 + priceDiff * vis[i].pct, rng, chartH);
    const py2 = p2y(d.p1 + priceDiff * vis[i+1].pct, rng, chartH);
    ctx.globalAlpha = fillAlpha;
    ctx.fillStyle = vis[i].color;
    ctx.fillRect(minX, Math.min(py1, py2), W - 62 - minX, Math.abs(py2 - py1));
  }
  ctx.globalAlpha = 1;

  // Side bracket
  ctx.strokeStyle = d.color; ctx.lineWidth = lw + 0.5;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}

function drawFibExt(d, rng, chartH, sel) {
  if (!d.p3) return;
  const extLevels = [0, 0.618, 1.0, 1.272, 1.618, 2.0, 2.618];
  const priceDiff = d.p2 - d.p1;
  extLevels.forEach((lvl, i) => {
    const price = d.p3 + priceDiff * lvl;
    const y = p2y(price, rng, chartH);
    if (y < -20 || y > chartH + 20) return;
    ctx.strokeStyle = FIB_COLORS[i % FIB_COLORS.length];
    ctx.lineWidth = 1; ctx.globalAlpha = 0.7;
    ctx.beginPath(); ctx.moveTo(Math.min(d.x1, d.x2), y); ctx.lineTo(W - 62, y); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = FIB_COLORS[i % FIB_COLORS.length];
    ctx.font = '9px JetBrains Mono'; ctx.textAlign = 'left';
    ctx.fillText(`Ext ${(lvl * 100).toFixed(0)}%  ${price.toFixed(0)}`, Math.min(d.x1, d.x2) + 4, y - 3);
  });
}

function drawFibArc(d, rng, chartH, sel) {
  const y1 = p2y(d.p1, rng, chartH);
  const y2 = p2y(d.p2, rng, chartH);
  const r = Math.sqrt((d.x2 - d.x1) ** 2 + (y2 - y1) ** 2);
  [0.382, 0.5, 0.618, 1.0].forEach((lvl, i) => {
    ctx.strokeStyle = FIB_COLORS[i]; ctx.lineWidth = 1; ctx.globalAlpha = 0.7;
    ctx.beginPath(); ctx.arc(d.x1, y1, r * lvl, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = FIB_COLORS[i]; ctx.font = '9px JetBrains Mono';
    ctx.fillText(`${(lvl * 100).toFixed(0)}%`, d.x1 + r * lvl + 3, y1);
  });
}

function drawFibFan(d, rng, chartH, sel) {
  const y1 = p2y(d.p1, rng, chartH);
  const y2 = p2y(d.p2, rng, chartH);
  const priceDiff = Math.abs(d.p2 - d.p1);
  [0.236, 0.382, 0.5, 0.618, 0.786].forEach((lvl, i) => {
    const targetY = y1 + (y2 - y1) * lvl;
    const ext = W * 2;
    const dx = d.x2 - d.x1; const dy = targetY - y1;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    ctx.strokeStyle = FIB_COLORS[i]; ctx.lineWidth = 1; ctx.globalAlpha = 0.7;
    ctx.beginPath(); ctx.moveTo(d.x1, y1);
    ctx.lineTo(d.x1 + (dx / len) * ext, y1 + (dy / len) * ext); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = FIB_COLORS[i]; ctx.font = '9px JetBrains Mono';
    const tx = d.x1 + (dx / len) * 120, ty = y1 + (dy / len) * 120;
    ctx.fillText(`${(lvl * 100).toFixed(1)}%`, tx + 3, ty);
  });
}

function drawRect(d, rng, chartH, sel) {
  const y1 = p2y(d.p1, rng, chartH);
  const y2 = p2y(d.p2, rng, chartH);
  const rx = Math.min(d.x1, d.x2), ry = Math.min(y1, y2);
  const rw = Math.abs(d.x2 - d.x1), rh = Math.abs(y2 - y1);
  ctx.globalAlpha = 0.12; ctx.fillStyle = d.color;
  ctx.fillRect(rx, ry, rw, rh);
  ctx.globalAlpha = 0.85; ctx.strokeStyle = d.color;
  ctx.strokeRect(rx, ry, rw, rh);
  // Price labels
  ctx.fillStyle = d.color; ctx.font = '9px JetBrains Mono'; ctx.textAlign = 'left';
  ctx.fillText(d.p1.toFixed(0), rx + 3, y1 - 3);
  ctx.fillText(d.p2.toFixed(0), rx + 3, y2 + 10);
  const pct = ((d.p2 - d.p1) / d.p1 * 100).toFixed(2);
  ctx.textAlign = 'center';
  ctx.fillText(`${pct > 0 ? '+' : ''}${pct}%`, rx + rw / 2, ry + rh / 2 + 4);
}

function drawTriangle(d, rng, chartH, sel) {
  if (!d.p3) return;
  const y1 = p2y(d.p1, rng, chartH);
  const y2 = p2y(d.p2, rng, chartH);
  const y3 = p2y(d.p3, rng, chartH);
  ctx.globalAlpha = 0.1; ctx.fillStyle = d.color;
  ctx.beginPath(); ctx.moveTo(d.x1, y1); ctx.lineTo(d.x2, y2); ctx.lineTo(d.x3, y3); ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 0.85;
  ctx.beginPath(); ctx.moveTo(d.x1, y1); ctx.lineTo(d.x2, y2); ctx.lineTo(d.x3, y3); ctx.closePath(); ctx.stroke();
}

function drawEllipse(d, rng, chartH, sel) {
  const y1 = p2y(d.p1, rng, chartH);
  const y2 = p2y(d.p2, rng, chartH);
  const cx = (d.x1 + d.x2) / 2, cy = (y1 + y2) / 2;
  const rx = Math.abs(d.x2 - d.x1) / 2, ry = Math.abs(y2 - y1) / 2;
  ctx.globalAlpha = 0.08; ctx.fillStyle = d.color;
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.85;
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
}

function drawMeasure(d, rng, chartH, sel) {
  const y1 = p2y(d.p1, rng, chartH);
  const y2 = p2y(d.p2, rng, chartH);
  const diff = d.p2 - d.p1;
  const pct = (diff / d.p1 * 100).toFixed(2);
  ctx.globalAlpha = 0.1; ctx.fillStyle = diff >= 0 ? '#00e676' : '#ff3060';
  ctx.fillRect(Math.min(d.x1, d.x2), Math.min(y1, y2), Math.abs(d.x2 - d.x1), Math.abs(y2 - y1));
  ctx.globalAlpha = 0.85;
  ctx.strokeStyle = diff >= 0 ? '#00e676' : '#ff3060'; ctx.lineWidth = 1.5;
  ctx.strokeRect(Math.min(d.x1, d.x2), Math.min(y1, y2), Math.abs(d.x2 - d.x1), Math.abs(y2 - y1));
  // Labels
  ctx.fillStyle = diff >= 0 ? '#00e676' : '#ff3060';
  ctx.font = 'bold 11px JetBrains Mono'; ctx.textAlign = 'center';
  const mx = (d.x1 + d.x2) / 2, my = (y1 + y2) / 2;
  ctx.fillText(`${diff >= 0 ? '+' : ''}${pct}%`, mx, my - 6);
  ctx.font = '9px JetBrains Mono';
  ctx.fillText(`${diff >= 0 ? '+' : ''}${diff.toFixed(0)} USDT`, mx, my + 8);
  // Price tags
  ctx.textAlign = 'left';
  ctx.fillText(d.p1.toFixed(0), Math.min(d.x1, d.x2) + 3, y1 - 2);
  ctx.fillText(d.p2.toFixed(0), Math.min(d.x1, d.x2) + 3, y2 + 10);
}

function drawTextDraw(d, rng, chartH) {
  const y = p2y(d.p1, rng, chartH);
  ctx.fillStyle = d.color;
  ctx.font = `${d.size || 13}px JetBrains Mono`;
  ctx.textAlign = 'left';
  ctx.fillText(d.text, d.x1, y);
}

function drawPreview(rng, chartH) {
  const x1 = drawPt1.x, y1 = drawPt1.y;
  const x2 = mouse.x, y2 = mouse.y;
  ctx.strokeStyle = drawColor; ctx.lineWidth = 1.5;

  if (tool === 'hline') {
    ctx.beginPath(); ctx.moveTo(0, y1); ctx.lineTo(W - 62, y1); ctx.stroke();
    ctx.fillStyle = drawColor; ctx.font = '9px JetBrains Mono'; ctx.textAlign = 'left';
    ctx.fillText(y2p(y1, rng, chartH).toFixed(0), 4, y1 - 3);
  } else if (tool === 'vline') {
    ctx.beginPath(); ctx.moveTo(x1, 0); ctx.lineTo(x1, chartH); ctx.stroke();
  } else if (tool === 'trendline') {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  } else if (tool === 'ray') {
    const dx = x2 - x1; const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 + (dx / len) * W * 2, y1 + (dy / len) * W * 2); ctx.stroke();
  } else if (tool === 'extended') {
    const dx = x2 - x1; const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    ctx.beginPath();
    ctx.moveTo(x1 - (dx / len) * W * 2, y1 - (dy / len) * W * 2);
    ctx.lineTo(x2 + (dx / len) * W * 2, y2 + (dy / len) * W * 2); ctx.stroke();
  } else if (tool === 'channel') {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(x1, y1 + 30); ctx.lineTo(x2, y2 + 30); ctx.stroke();
    ctx.setLineDash([]);
  } else if (tool === 'fib') {
    const p1 = y2p(y1, rng, chartH);
    const p2 = y2p(y2, rng, chartH);
    const pDiff = p2 - p1;
    FIB_LEVELS.forEach((lvl, i) => {
      const py = p2y(p1 + pDiff * lvl, rng, chartH);
      if (py < -20 || py > chartH + 20) return;
      ctx.strokeStyle = FIB_COLORS[i % FIB_COLORS.length]; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(Math.min(x1, x2), py); ctx.lineTo(W - 62, py); ctx.stroke();
      ctx.fillStyle = FIB_COLORS[i % FIB_COLORS.length]; ctx.font = '9px JetBrains Mono'; ctx.textAlign = 'left';
      ctx.fillText(`${(lvl * 100).toFixed(1)}%`, Math.min(x1, x2) + 3, py - 2);
    });
    ctx.strokeStyle = drawColor; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  } else if (tool === 'rect' || tool === 'measure') {
    const rx = Math.min(x1, x2), ry = Math.min(y1, y2);
    const rw = Math.abs(x2 - x1), rh = Math.abs(y2 - y1);
    ctx.globalAlpha = 0.1; ctx.fillStyle = drawColor; ctx.fillRect(rx, ry, rw, rh);
    ctx.globalAlpha = 1; ctx.strokeRect(rx, ry, rw, rh);
    if (tool === 'measure') {
      const p1 = y2p(y1, rng, chartH), p2 = y2p(y2, rng, chartH);
      const pct = ((p2 - p1) / p1 * 100).toFixed(2);
      ctx.fillStyle = drawColor; ctx.font = 'bold 11px JetBrains Mono'; ctx.textAlign = 'center';
      ctx.fillText(`${pct > 0 ? '+' : ''}${pct}%`, rx + rw / 2, ry + rh / 2 + 4);
    }
  } else if (tool === 'ellipse') {
    const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
    const rx = Math.abs(x2 - x1) / 2, ry2 = Math.abs(y2 - y1) / 2;
    ctx.globalAlpha = 0.08; ctx.fillStyle = drawColor;
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry2, 0, 0, Math.PI * 2); ctx.stroke();
  } else if (tool === 'fibarc') {
    const r = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    [0.382, 0.5, 0.618, 1.0].forEach((lvl, i) => {
      ctx.strokeStyle = FIB_COLORS[i]; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x1, y1, r * lvl, 0, Math.PI * 2); ctx.stroke();
    });
  } else if (tool === 'fibfan') {
    [0.236, 0.382, 0.5, 0.618, 0.786].forEach((lvl, i) => {
      const ty = y1 + (y2 - y1) * lvl;
      const dx = x2 - x1; const dy = ty - y1;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      ctx.strokeStyle = FIB_COLORS[i]; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 + (dx / len) * W * 2, y1 + (dy / len) * W * 2); ctx.stroke();
    });
  }
}

function drawHandles(d, rng, chartH) {
  ctx.fillStyle = '#fff'; ctx.strokeStyle = d.color; ctx.lineWidth = 1.5;
  const pts = getHandlePoints(d, rng, chartH);
  for (const pt of pts) {
    ctx.beginPath(); ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
}

function getHandlePoints(d, rng, chartH) {
  const pts = [];
  if (d.x1 !== undefined) pts.push({ x: d.x1, y: p2y(d.p1, rng, chartH) });
  if (d.x2 !== undefined && d.p2 !== undefined) pts.push({ x: d.x2, y: p2y(d.p2, rng, chartH) });
  return pts;
}

// ========================================
// OSCILLATOR
// ========================================
function drawOsc() {
  const ow = oscCanvas.width, oh = oscCanvas.height;
  oscCtx.clearRect(0, 0, ow, oh);
  const rsi = calcRSI(candles);
  const { vis, si } = getVis();
  const cw = (ow - 40) / visN;

  // Grid
  oscCtx.strokeStyle = '#1c2030'; oscCtx.lineWidth = 0.5;
  [30, 50, 70].forEach(l => {
    const y = oh - (l / 100) * (oh - 14) - 4;
    oscCtx.beginPath(); oscCtx.moveTo(0, y); oscCtx.lineTo(ow - 40, y); oscCtx.stroke();
    oscCtx.fillStyle = '#424e63'; oscCtx.font = '8px JetBrains Mono';
    oscCtx.fillText(l, ow - 36, y + 3);
  });

  // RSI
  oscCtx.strokeStyle = '#c77dff'; oscCtx.lineWidth = 1.5; oscCtx.beginPath();
  let st = false;
  for (let i = 0; i < vis.length; i++) {
    const v = rsi[si + i]; if (!v) continue;
    const x = i * cw + cw / 2, y = oh - (v / 100) * (oh - 14) - 4;
    st ? oscCtx.lineTo(x, y) : (oscCtx.moveTo(x, y), st = true);
  }
  oscCtx.stroke();

  // MFI (approx)
  oscCtx.strokeStyle = '#00e5ff'; oscCtx.lineWidth = 1; oscCtx.setLineDash([2, 2]);
  oscCtx.beginPath(); st = false;
  for (let i = 0; i < vis.length; i++) {
    const v = rsi[si + i]; if (!v) continue;
    const mfi = Math.max(0, Math.min(100, v + (Math.sin(i * 0.3) * 8)));
    const x = i * cw + cw / 2, y = oh - (mfi / 100) * (oh - 14) - 4;
    st ? oscCtx.lineTo(x, y) : (oscCtx.moveTo(x, y), st = true);
  }
  oscCtx.stroke(); oscCtx.setLineDash([]);

  const lr = rsi[rsi.length - 1];
  document.getElementById('rsiV').textContent = lr ? lr.toFixed(1) : '—';
  document.getElementById('mfiV').textContent = lr ? (lr + 3).toFixed(1) : '—';
}

// ========================================
// CANVAS EVENTS (named functions)
// ========================================
function onMouseMove(e) {
  const r = canvas.getBoundingClientRect();
  mouse = { x: e.clientX - r.left, y: e.clientY - r.top };
  const { vis } = getVis();
  const cw = (W - 62) / visN;
  const ci = Math.floor(mouse.x / cw);
  hoverIdx = (ci >= 0 && ci < vis.length) ? ci : null;

  if (hoverIdx !== null) {
    const c = vis[hoverIdx];
    document.getElementById('tO').textContent = c.o.toFixed(2);
    document.getElementById('tH').textContent = c.h.toFixed(2);
    document.getElementById('tL').textContent = c.l.toFixed(2);
    document.getElementById('tC').textContent = c.c.toFixed(2);
    document.getElementById('tV').textContent = c.v.toFixed(2);
    document.getElementById('tC').className = 'ttv ' + (c.c >= c.o ? 'u' : 'd');
    const tt = document.getElementById('TT');
    tt.style.display = 'block';
    tt.style.left = (e.clientX + 15) + 'px';
    tt.style.top = (e.clientY - 70) + 'px';
  } else {
    document.getElementById('TT').style.display = 'none';
  }

  if (panStart && e.buttons === 1 && tool === 'cursor') {
    const cw2 = (W - 62) / visN;
    panOff = panStart.off + (e.clientX - panStart.x) / cw2;
    panOff = Math.max(-(candles.length - visN), Math.min(0, panOff));
  }
  draw();
}

function onMouseLeave() {
  mouse = { x: -1, y: -1 }; hoverIdx = null;
  document.getElementById('TT').style.display = 'none';
  draw();
}

function onMouseDown(e) {
  if (e.button === 2) return;
  const r = canvas.getBoundingClientRect();
  const mx = e.clientX - r.left, my = e.clientY - r.top;

  if (tool === 'cursor') {
    panStart = { x: e.clientX, off: panOff };
    selDraw = hitTestDrawings(mx, my);
    draw(); return;
  }
  if (tool === 'text') {
    pendingText = { x: mx, y: my };
    document.getElementById('textMo').style.display = 'flex';
    document.getElementById('tText').focus();
    return;
  }
  if (!isDrawing) { isDrawing = true; drawPt1 = { x: mx, y: my }; }
}

function onMouseUp(e) {
  const r = canvas.getBoundingClientRect();
  const mx = e.clientX - r.left, my = e.clientY - r.top;
  panStart = null;
  if (!isDrawing || !drawPt1) return;
  if (tool === 'cursor') return;

  const rng = getRange(); const chartH = H * 0.78;
  const p1 = y2p(drawPt1.y, rng, chartH);
  const p2 = y2p(my, rng, chartH);
  const cw = (W - 62) / visN;

  let d = null;
  switch (tool) {
    case 'hline':     d = { type:'hline', price:p1, color:drawColor, dashed:true }; break;
    case 'vline':     d = { type:'vline', xi:Math.floor(drawPt1.x/cw), color:drawColor }; break;
    case 'trendline': d = { type:'trendline', x1:drawPt1.x, y1:drawPt1.y, x2:mx, y2:my, p1, p2, color:drawColor }; break;
    case 'ray':       d = { type:'ray', x1:drawPt1.x, x2:mx, p1, p2, color:drawColor }; break;
    case 'extended':  d = { type:'extended', x1:drawPt1.x, x2:mx, p1, p2, color:drawColor }; break;
    case 'channel':   d = { type:'channel', x1:drawPt1.x, x2:mx, p1, p2, offset:-(p1-p2)*0.3, color:drawColor }; break;
    case 'pitchfork': d = { type:'pitchfork', x1:drawPt1.x, p1, x2:mx, p2, color:drawColor }; break;
    case 'fib':       d = { type:'fib', x1:drawPt1.x, x2:mx, p1, p2, color:drawColor }; break;
    case 'fibext':    d = { type:'fibext', x1:drawPt1.x, x2:mx, p1, p2, p3:p2-Math.abs(p2-p1)*0.5, color:drawColor }; break;
    case 'fibarc':    d = { type:'fibarc', x1:drawPt1.x, x2:mx, p1, p2, color:drawColor }; break;
    case 'fibfan':    d = { type:'fibfan', x1:drawPt1.x, x2:mx, p1, p2, color:drawColor }; break;
    case 'rect':      d = { type:'rect', x1:drawPt1.x, x2:mx, p1, p2, color:drawColor }; break;
    case 'triangle':  d = { type:'triangle', x1:drawPt1.x, p1, x2:mx, p2, x3:(drawPt1.x+mx)/2, p3:Math.max(p1,p2)+Math.abs(p2-p1)*0.5, color:drawColor }; break;
    case 'ellipse':   d = { type:'ellipse', x1:drawPt1.x, x2:mx, p1, p2, color:drawColor }; break;
    case 'measure':   d = { type:'measure', x1:drawPt1.x, x2:mx, p1, p2, color:drawColor }; break;
  }

  if (d) {
    drawings.push(d); selDraw = d;
    document.getElementById('dc').textContent = drawings.length;
    notify(`✓ ${tool.toUpperCase()} adicionado`, 'green');
  }
  isDrawing = false; drawPt1 = null;
  draw();
}

function onDblClick(e) {
  const r = canvas.getBoundingClientRect();
  const mx = e.clientX - r.left, my = e.clientY - r.top;
  if (tool === 'cursor') {
    const hit = hitTestDrawings(mx, my);
    if (hit) {
      openSettings(hit);
      return;
    }
    const rng = getRange(); const chartH = H * 0.78;
    drawings.push({ type:'hline', price:y2p(my,rng,chartH), color:drawColor, dashed:true });
    document.getElementById('dc').textContent = drawings.length;
    notify('Linha horizontal rápida — duplo clique para configurar'); draw();
  }
}

function onContextMenu(e) {
  e.preventDefault();
  const r = canvas.getBoundingClientRect();
  const hit = hitTestDrawings(e.clientX - r.left, e.clientY - r.top);
  if (hit) {
    selDraw = hit;
    const ctxMenu = document.getElementById('CTX');
    ctxMenu.style.display = 'block';
    ctxMenu.style.left = e.clientX + 'px';
    ctxMenu.style.top = e.clientY + 'px';
  }
  draw();
}

document.addEventListener('click', () => {
  document.getElementById('CTX').style.display = 'none';
});

function hitTestDrawings(mx, my) {
  const rng = getRange(); const chartH = H * 0.78;
  for (let i = drawings.length - 1; i >= 0; i--) {
    const d = drawings[i];
    if (d.type === 'hline') {
      const y = p2y(d.price, rng, chartH);
      if (Math.abs(my - y) < 6) return d;
    } else if (d.type === 'rect' || d.type === 'fib' || d.type === 'measure' || d.type === 'ellipse') {
      const y1 = p2y(d.p1, rng, chartH), y2 = p2y(d.p2, rng, chartH);
      if (mx >= Math.min(d.x1, d.x2) - 5 && mx <= Math.max(d.x1, d.x2) + 5 &&
          my >= Math.min(y1, y2) - 5 && my <= Math.max(y1, y2) + 5) return d;
    } else if (d.x1 !== undefined) {
      const y1 = p2y(d.p1, rng, chartH);
      const y2 = d.p2 ? p2y(d.p2, rng, chartH) : y1;
      const dist = pointToSegDist(mx, my, d.x1, y1, (d.x2 || d.x1 + 100), y2);
      if (dist < 8) return d;
    }
  }
  return null;
}

function pointToSegDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy + 0.001)));
  return Math.sqrt((px - x1 - t * dx) ** 2 + (py - y1 - t * dy) ** 2);
}


// ========================================
// SETTINGS MODAL
// ========================================

function openSettings(d) {
  if (!d) return;
  selDraw = d;

  const titles = {
    hline:'Linha Horizontal', trendline:'Linha de Tendência', ray:'Raio',
    extended:'Linha Estendida', channel:'Canal Paralelo', fib:'Fibonacci Retração',
    fibext:'Fib Extensão', fibarc:'Fib Arcos', fibfan:'Fib Fan',
    rect:'Retângulo', triangle:'Triângulo', ellipse:'Elipse',
    measure:'Medição', text:'Texto', vline:'Linha Vertical', pitchfork:'Pitchfork'
  };
  document.getElementById('settingsTitle').textContent = '⚙ ' + (titles[d.type] || 'Configurações');

  // Populate style tab
  const color = d.color || '#ffd54f';
  document.getElementById('sColorPreview').style.background = color;
  document.getElementById('sColorPicker').value = color;
  document.querySelectorAll('.swatch').forEach(s => s.classList.toggle('sel', s.style.background === color || s.getAttribute('onclick')?.includes(color)));
  document.getElementById('sWidth').value = d.lineWidth || 2;
  document.getElementById('sLineStyle').value = d.lineStyle || 'solid';
  document.getElementById('sFillOpacity').value = d.fillOpacity !== undefined ? d.fillOpacity : 10;
  document.getElementById('sFillOpacityVal').textContent = (d.fillOpacity || 10) + '%';
  document.getElementById('sShowPrice').value = d.showPrice !== false ? '1' : '0';
  document.getElementById('sVisible').checked = !d.hidden;
  document.getElementById('sLocked').checked = !!d.locked;
  document.getElementById('sNote').value = d.note || '';

  // Hide all specific sections
  ['sFibSection','sTextSection','sHLineSection','sChannelSection','sRectSection','sTrendSection'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });

  // Show type-specific sections
  if (d.type === 'fib' || d.type === 'fibext' || d.type === 'fibarc' || d.type === 'fibfan') {
    document.getElementById('sFibSection').style.display = 'block';
    if (!d.fibLevels) d.fibLevels = JSON.parse(JSON.stringify(DEFAULT_FIB_LEVELS));
    renderFibLevels(d.fibLevels);
    renderLevelsTab(d);
  } else if (d.type === 'text') {
    document.getElementById('sTextSection').style.display = 'block';
    document.getElementById('sTextContent').value = d.text || '';
    document.getElementById('sTextSize').value = d.size || 13;
    document.getElementById('sTextBold').checked = !!d.bold;
  } else if (d.type === 'hline') {
    document.getElementById('sHLineSection').style.display = 'block';
    document.getElementById('sHLinePrice').value = d.price ? d.price.toFixed(2) : '';
    document.getElementById('sHLineLabel').value = d.label || '';
  } else if (d.type === 'channel') {
    document.getElementById('sChannelSection').style.display = 'block';
    document.getElementById('sChannelOffset').value = d.offset || 0;
    document.getElementById('sChannelVal').textContent = (d.offset || 0).toFixed(0);
  } else if (d.type === 'rect') {
    document.getElementById('sRectSection').style.display = 'block';
    document.getElementById('sRectPercent').checked = d.showPercent !== false;
    document.getElementById('sRectPrices').checked = d.showPrices !== false;
  } else if (d.type === 'trendline' || d.type === 'ray' || d.type === 'extended') {
    document.getElementById('sTrendSection').style.display = 'block';
    document.getElementById('sTrendArrow').checked = d.showArrow !== false;
    document.getElementById('sTrendAngle').checked = !!d.showAngle;
    document.getElementById('sTrendVariation').checked = !!d.showVariation;
  }

  switchSettingsTab('style');
  document.getElementById('settingsMo').style.display = 'flex';
}

function renderFibLevels(levels) {
  var container = document.getElementById('sFibLevels');
  container.innerHTML = '';
  for (var i = 0; i < levels.length; i++) {
    var lvl = levels[i];
    var row = document.createElement('div');
    row.className = 'fib-row';
    var chk = lvl.visible ? 'checked' : '';
    var pct = (lvl.pct * 100).toFixed(1);
    row.innerHTML = '<input type="checkbox" ' + chk + ' onchange="updateFibLevel(' + i + ',\'visible\',this.checked)">'
      + '<input type="number" value="' + pct + '" step="0.1" min="-500" max="500" onchange="updateFibLevel(' + i + ',\'pct\',parseFloat(this.value)/100)">'
      + '<input type="color" value="' + lvl.color + '" onchange="updateFibLevel(' + i + ',\'color\',this.value)">'
      + '<button class="del-fib" onclick="removeFibLevel(' + i + ')">&#x2715;</button>';
    container.appendChild(row);
  }
}

function updateFibLevel(i, key, val) {
  if (selDraw && selDraw.fibLevels) {
    selDraw.fibLevels[i][key] = val;
    draw();
  }
}

function removeFibLevel(i) {
  if (selDraw && selDraw.fibLevels) {
    selDraw.fibLevels.splice(i, 1);
    renderFibLevels(selDraw.fibLevels);
    draw();
  }
}

function addFibLevel() {
  if (selDraw) {
    if (!selDraw.fibLevels) selDraw.fibLevels = JSON.parse(JSON.stringify(DEFAULT_FIB_LEVELS));
    selDraw.fibLevels.push({ pct: 2.0, color: '#00d4ff', visible: true });
    renderFibLevels(selDraw.fibLevels);
  }
}

function renderLevelsTab(d) {
  var cont = document.getElementById('sLevelsContent');
  if (!d.fibLevels) { cont.innerHTML = '<div style="color:var(--t2);padding:12px;font-size:10px;text-align:center;">Sem n\u00edveis configur\u00e1veis</div>'; return; }
  var rng = getRange(); var chartH = H * 0.78;
  var pDiff = d.p2 - d.p1;
  var html = '<div style="font-size:9px;color:var(--t2);margin-bottom:8px;">N\u00edveis calculados com base nos pontos do desenho</div>';
  d.fibLevels.filter(function(l){ return l.visible; }).forEach(function(l) {
    var price = d.p1 + pDiff * l.pct;
    html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--bd);">'
      + '<div style="display:flex;align-items:center;gap:6px;">'
      + '<div style="width:10px;height:10px;border-radius:2px;background:' + l.color + ';"></div>'
      + '<span style="font-size:10px;font-family:JetBrains Mono,monospace;">' + (l.pct*100).toFixed(1) + '%</span>'
      + '</div>'
      + '<span style="font-family:JetBrains Mono,monospace;font-size:11px;font-weight:600;color:' + l.color + ';"> ' + price.toFixed(2) + '</span>'
      + '</div>';
  });
  cont.innerHTML = html;
}

function switchSettingsTab(tab) {
  ['style','levels','visibility'].forEach(t => {
    document.getElementById('sTab_' + t).style.display = t === tab ? 'block' : 'none';
    document.getElementById('stab_' + t).classList.toggle('on', t === tab);
  });
}

function setSwatch(color) {
  drawColor = color;
  document.getElementById('sColorPreview').style.background = color;
  document.getElementById('sColorPicker').value = color;
  document.querySelectorAll('.swatch').forEach(s => s.classList.remove('sel'));
  if (selDraw) { selDraw.color = color; draw(); }
}

function previewChannel(val) {
  document.getElementById('sChannelVal').textContent = parseFloat(val).toFixed(0);
  if (selDraw && selDraw.type === 'channel') { selDraw.offset = parseFloat(val); draw(); }
}

function applySettings() {
  if (!selDraw) { closeMo('settingsMo'); return; }
  const d = selDraw;

  // Style
  d.color = document.getElementById('sColorPreview').style.background || d.color;
  d.lineWidth = parseFloat(document.getElementById('sWidth').value);
  d.lineStyle = document.getElementById('sLineStyle').value;
  d.fillOpacity = parseInt(document.getElementById('sFillOpacity').value);
  d.showPrice = document.getElementById('sShowPrice').value === '1';

  // Visibility
  d.hidden = !document.getElementById('sVisible').checked;
  d.locked = document.getElementById('sLocked').checked;
  d.note = document.getElementById('sNote').value;

  // Type-specific
  if (d.type === 'text') {
    d.text = document.getElementById('sTextContent').value;
    d.size = parseInt(document.getElementById('sTextSize').value);
    d.bold = document.getElementById('sTextBold').checked;
  } else if (d.type === 'hline') {
    const p = parseFloat(document.getElementById('sHLinePrice').value);
    if (!isNaN(p)) d.price = p;
    d.label = document.getElementById('sHLineLabel').value;
  } else if (d.type === 'channel') {
    d.offset = parseFloat(document.getElementById('sChannelOffset').value);
  } else if (d.type === 'rect') {
    d.showPercent = document.getElementById('sRectPercent').checked;
    d.showPrices = document.getElementById('sRectPrices').checked;
  } else if (d.type === 'trendline' || d.type === 'ray' || d.type === 'extended') {
    d.showArrow = document.getElementById('sTrendArrow').checked;
    d.showAngle = document.getElementById('sTrendAngle').checked;
    d.showVariation = document.getElementById('sTrendVariation').checked;
  }

  draw();
  closeMo('settingsMo');
  notify('✓ Configurações aplicadas', 'cyan');
}

// ========================================
// TOOLBAR ACTIONS
// ========================================
function setTool(t, el) {
  tool = t;
  document.querySelectorAll('.tbtn').forEach(b => b.classList.remove('on'));
  if (el) el.classList.add('on');
  const labels = {
    cursor:'Cursor', cross:'Mira', trendline:'Tendência', hline:'Linha Horizontal',
    vline:'Linha Vertical', ray:'Raio', extended:'Estendida', channel:'Canal',
    pitchfork:'Pitchfork', fib:'Fibonacci Retração', fibext:'Fib Extensão',
    fibarc:'Fib Arcos', fibfan:'Fib Fan', rect:'Retângulo', triangle:'Triângulo',
    ellipse:'Elipse', measure:'Medir', text:'Texto', magnet:'Magneto'
  };
  document.getElementById('atool').textContent = 'Ferramenta: ' + (labels[t] || t);
  canvas.style.cursor = t === 'cursor' ? 'default' : 'crosshair';
  isDrawing = false; drawPt1 = null;
}

function toggleMagnet(el) {
  magnetOn = !magnetOn;
  el.classList.toggle('on', magnetOn);
  notify(magnetOn ? '🧲 Magneto ON' : '🧲 Magneto OFF');
}

function setDrawColor(c) {
  drawColor = c;
  if (selDraw) { selDraw.color = c; draw(); }
  notify(`Cor: ${c}`);
}

function toggleMA(p, c) { mas[p] = !mas[p]; draw(); notify(`MA${p} ${mas[p] ? 'ON' : 'OFF'}`); }
function lockAllDrawings() { drawings.forEach(d => d.locked = !d.locked); notify('Desenhos travados'); }
function toggleHideDrawings() { hideDrawings = !hideDrawings; draw(); notify(hideDrawings ? '🙈 Ocultos' : '👁 Visíveis'); }
function deleteSelectedDrawing() {
  if (selDraw) {
    drawings = drawings.filter(d => d !== selDraw);
    selDraw = null;
    document.getElementById('dc').textContent = drawings.length;
    draw();
    notify('🗑 Desenho apagado — Delete', 'red');
  } else {
    notify('⚠ Clique em um desenho para selecionar', 'orange');
  }
}
function clearDrawings() { drawings = []; selDraw = null; document.getElementById('dc').textContent = 0; draw(); notify('Limpo'); }
function undoDrawing() {
  if (drawings.length) { drawings.pop(); document.getElementById('dc').textContent = drawings.length; draw(); notify('Desfeito'); }
}

function ctxAction(a) {
  if (!selDraw) return;
  document.getElementById('CTX').style.display = 'none';
  if (a === 'edit') { openSettings(selDraw); return; }
  if (a === 'delete') { drawings = drawings.filter(d => d !== selDraw); selDraw = null; document.getElementById('dc').textContent = drawings.length; notify('🗑 Apagado','red'); }
  else if (a === 'lock') { selDraw.locked = !selDraw.locked; notify(selDraw.locked ? '🔒 Travado' : '🔓 Destravado'); }
  else if (a === 'hide') { selDraw.hidden = !selDraw.hidden; notify(selDraw.hidden ? '🙈 Oculto' : '👁 Visível'); }
  else if (a === 'settings') { openSettings(selDraw); return; }
  draw();
}

function addText() {
  const txt = document.getElementById('tText').value;
  const sz = parseInt(document.getElementById('tSize').value);
  if (txt && pendingText) {
    const rng = getRange(); const chartH = H * 0.78;
    const price = y2p(pendingText.y, rng, chartH);
    drawings.push({ type: 'text', x1: pendingText.x, p1: price, text: txt, size: sz, color: drawColor });
    document.getElementById('dc').textContent = drawings.length;
    draw(); notify(`Texto: "${txt}"`);
  }
  closeMo('textMo');
}

// ========================================
// CHART CONTROLS
// ========================================
function setTF(tf, el) {
  TF = tf;
  document.querySelectorAll('.tf').forEach(b => b.classList.remove('on'));
  el.classList.add('on');
  candles = genCandles(200); draw(); drawOsc();
  notify(`TF: ${tf}`);
}

function setMode(m, el) {
  document.getElementById('autoB').classList.toggle('on', m === 'auto');
  document.getElementById('manB').classList.toggle('on', m === 'manual');
  notify(`Modo: ${m}`);
}

function followPrice() { panOff = 0; draw(); notify('Seguindo preço'); }
function goNow() { panOff = 0; draw(); notify('Agora'); }
function zoomIn() { visN = Math.max(15, visN - 8); draw(); drawOsc(); }
function zoomOut() { visN = Math.min(200, visN + 8); draw(); drawOsc(); }
function resetChart() { panOff = 0; visN = 80; clearDrawings(); notify('Reset'); }

function toggleReplay() {
  replayMode = !replayMode;
  document.getElementById('rbtn').textContent = replayMode ? '⏸ Pausado' : '▶ Replay';
  if (!replayMode) updatePrice();
  notify(replayMode ? 'Pausado' : 'Ao vivo');
}

// ========================================
// LIVE PRICE
// ========================================
function updatePrice() {
  const last = candles[candles.length - 1];
  const chg = (Math.random() - 0.49) * last.c * 0.0007;
  last.c += chg; last.h = Math.max(last.h, last.c); last.l = Math.min(last.l, last.c);
  if (Math.random() < 0.004) {
    candles.push({ o: last.c, h: last.c, l: last.c, c: last.c, v: 100 + Math.random() * 500, t: Date.now() });
    if (candles.length > 300) candles.shift();
  }
  const p = last.c;
  const firstP = candles[0].c;
  const pct = ((p - firstP) / firstP * 100);
  const fmt = n => n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  document.getElementById('tp').textContent = '$' + fmt(p);
  document.getElementById('tc').textContent = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
  document.getElementById('tc').className = 'cchg' + (pct < 0 ? ' neg' : '');
  document.getElementById('cp').textContent = p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  document.getElementById('pp').textContent = fmt(p);
  document.getElementById('pnl').textContent = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
  // Alert check
  alerts.forEach(a => {
    if (!a.triggered && ((a.cond === 'above' && p >= a.price) || (a.cond === 'below' && p <= a.price))) {
      a.triggered = true;
      notify(`🔔 ALERTA! BTC ${a.cond === 'above' ? '>' : '<'} $${a.price.toLocaleString()}`, 'yellow');
    }
  });
  draw(); drawOsc();
  if (!replayMode) setTimeout(updatePrice, 450);
}

// ========================================
// MODALS
// ========================================
function openAlertModal() {
  document.getElementById('aPrice').value = Math.round(candles[candles.length - 1].c + 500);
  document.getElementById('alertMo').style.display = 'flex';
}
function createAlert() {
  const p = parseFloat(document.getElementById('aPrice').value);
  const c = document.getElementById('aCond').value;
  if (!isNaN(p)) { alerts.push({ price: p, cond: c, triggered: false }); notify(`🔔 Alerta criado: $${p.toLocaleString()}`, 'yellow'); }
  closeMo('alertMo');
}
function openAssetModal() {
  const list = document.getElementById('assetList');
  list.innerHTML = ASSETS.map(a => `<div onclick="selectAsset('${a}')" style="padding:7px 10px;cursor:pointer;font-size:11px;border-radius:4px;transition:.1s;" onmouseover="this.style.background='var(--bg3)'" onmouseout="this.style.background=''">${a}/USDT</div>`).join('');
  document.getElementById('assetMo').style.display = 'flex';
}
function filterAssets(q) {
  const list = document.getElementById('assetList');
  list.innerHTML = ASSETS.filter(a => a.toLowerCase().includes(q.toLowerCase())).map(a => `<div onclick="selectAsset('${a}')" style="padding:7px 10px;cursor:pointer;font-size:11px;border-radius:4px;">${a}/USDT</div>`).join('');
}
function selectAsset(a) { notify(`Ativo: ${a}`); closeMo('assetMo'); }
function closeMo(id) { document.getElementById(id).style.display = 'none'; }


// ========================================
// UI HELPERS
// ========================================
function t2(el) { document.querySelectorAll('.tab2').forEach(t => t.classList.remove('on')); el.classList.add('on'); notify(el.textContent.trim()); }
function ntab(el, t) { document.querySelectorAll('.ntab').forEach(n => n.classList.remove('on')); el.classList.add('on'); notify(t); }

function buildScoreBars(score) {
  const sb = document.getElementById('sb'); sb.innerHTML = '';
  for (let i = 0; i < 10; i++) {
    const s = document.createElement('div');
    s.className = 'sseg' + (i < Math.round(score / 10) ? ' f' : '');
    sb.appendChild(s);
  }
}
function buildConfDots(n, max) {
  const cd = document.getElementById('cdots'); cd.innerHTML = '';
  for (let i = 0; i < max; i++) {
    const d = document.createElement('div');
    d.className = 'cdot' + (i < n ? ' a' : '');
    cd.appendChild(d);
  }
}

function qa(t) {
  if (t === 'long') notify('✅ LONG BTC simulado', 'green');
  else if (t === 'short') notify('⚠ SHORT BTC simulado', 'red');
}

function notify(msg, type = 'cyan') {
  const colors = { cyan: 'var(--cyan)', green: 'var(--green)', red: 'var(--red)', yellow: 'var(--yellow)', orange: 'var(--orange)' };
  const nc = document.getElementById('NC');
  const el = document.createElement('div');
  el.className = 'notif';
  el.style.borderLeftColor = colors[type] || colors.cyan;
  el.textContent = msg;
  nc.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

// ========================================
// KEYBOARD SHORTCUTS
// ========================================
document.addEventListener('keydown', e => {
  if (['alertMo','textMo','assetMo','settingsMo'].some(id => document.getElementById(id).style.display === 'flex')) return;
  const map = {
    'v': () => setTool('cursor', document.getElementById('tool_cursor')),
    'c': () => setTool('cross', document.getElementById('tool_cross')),
    't': () => setTool('trendline', document.getElementById('tool_trendline')),
    'h': () => setTool('hline', document.getElementById('tool_hline')),
    'k': () => setTool('vline', document.getElementById('tool_vline')),
    'r': () => setTool('ray', document.getElementById('tool_ray')),
    'f': () => setTool('fib', document.getElementById('tool_fib')),
    'g': () => setTool('rect', document.getElementById('tool_rect')),
    'm': () => setTool('measure', document.getElementById('tool_measure')),
    'x': () => setTool('text', document.getElementById('tool_text')),
    'z': () => undoDrawing(),
    'Delete': () => deleteSelectedDrawing(),
    'Backspace': () => deleteSelectedDrawing(),
    'Escape': () => { selDraw = null; isDrawing = false; drawPt1 = null; setTool('cursor', document.getElementById('tool_cursor')); draw(); },
    'Enter': () => { if (selDraw) openSettings(selDraw); },
    '+': zoomIn, '=': zoomIn, '-': zoomOut,
    ' ': () => { e.preventDefault(); followPrice(); },
  };
  if (map[e.key]) map[e.key]();
});

document.addEventListener('DOMContentLoaded', function() { document.querySelectorAll('.mo').forEach(function(m){ m.addEventListener('click', function(e){ if(e.target===m) m.style.display='none'; }); }); init(); });
window.addEventListener('resize', function(){ if(canvas) resize(); });
</script>
</body>
</html>
