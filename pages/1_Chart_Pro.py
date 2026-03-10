import streamlit as st

st.set_page_config(
    page_title="Chart Pro",
    layout="wide",
    initial_sidebar_state="collapsed"
)

st.markdown("""
<style>
html, body, [class*="css"] {
    background-color: #070d18;
    color: white;
}

.block-container {
    padding-top: 0.4rem;
    padding-bottom: 0.4rem;
    max-width: 100% !important;
}

section[data-testid="stSidebar"] {
    display: none !important;
}

header[data-testid="stHeader"] {
    background: rgba(0,0,0,0);
}

.chart-topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    border: 1px solid rgba(120,170,255,0.12);
    border-radius: 14px;
    background: linear-gradient(180deg, rgba(20,30,50,0.95) 0%, rgba(12,18,32,0.95) 100%);
    margin-bottom: 12px;
}

.brand {
    font-size: 18px;
    font-weight: 800;
    color: white;
}

.sub {
    font-size: 12px;
    color: #9fb2d9;
}

.tools-pro {
    background: linear-gradient(180deg, rgba(18,26,44,0.90) 0%, rgba(10,16,28,0.95) 100%);
    border: 1px solid rgba(120,170,255,0.14);
    border-radius: 14px;
    padding: 12px;
    min-height: 760px;
}

.chart-box-pro {
    background: radial-gradient(circle at top left, rgba(20,40,80,0.35), rgba(8,12,24,0.98) 55%);
    border: 1px solid rgba(120,170,255,0.15);
    border-radius: 16px;
    min-height: 760px;
    padding: 14px;
    position: relative;
    overflow: hidden;
}

.chart-grid {
    position: absolute;
    inset: 0;
    background-image:
        linear-gradient(rgba(120,170,255,0.06) 1px, transparent 1px),
        linear-gradient(90deg, rgba(120,170,255,0.06) 1px, transparent 1px);
    background-size: 48px 48px;
    pointer-events: none;
}

.chart-watermark-pro {
    position: absolute;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 84px;
    font-weight: 800;
    color: rgba(255,255,255,0.04);
    letter-spacing: 3px;
    pointer-events: none;
}

.panel-pro {
    background: linear-gradient(180deg, rgba(18,26,44,0.90) 0%, rgba(10,16,28,0.95) 100%);
    border: 1px solid rgba(120,170,255,0.14);
    border-radius: 14px;
    padding: 16px;
    min-height: 760px;
}

.indicador-pro {
    background: linear-gradient(180deg, rgba(18,26,44,0.90) 0%, rgba(10,16,28,0.95) 100%);
    border: 1px solid rgba(120,170,255,0.12);
    border-radius: 12px;
    padding: 12px;
    min-height: 150px;
}

.card-title {
    font-size: 15px;
    font-weight: 700;
    color: #cfe0ff;
    margin-bottom: 8px;
}

.small {
    font-size: 13px;
    color: #9fb2d9;
}

.big-number {
    font-size: 28px;
    font-weight: 800;
    color: white;
}

h1, h2, h3 {
    color: white !important;
}

div[data-testid="metric-container"] {
    background: rgba(20,30,50,0.65);
    border: 1px solid rgba(120,170,255,0.12);
    padding: 10px;
    border-radius: 12px;
}
</style>
""", unsafe_allow_html=True)

st.markdown("""
<div class="chart-topbar">
    <div>
        <div class="brand">🖥️ SINGULARIDADE OLIVAN • CHART PRO</div>
        <div class="sub">Modo expandido • visão imersiva • análise profunda • execução</div>
    </div>
    <div class="sub">BTCUSDT • 15m • Estrutural • Volume</div>
</div>
""", unsafe_allow_html=True)

topo1, topo2, topo3, topo4, topo5 = st.columns([1.3, 1, 1, 1, 1])

with topo1:
    ativo = st.selectbox("Ativo", ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"])
with topo2:
    timeframe = st.selectbox("Timeframe", ["1m", "5m", "15m", "1h", "4h", "1D"], index=2)
with topo3:
    modo = st.selectbox("Modo", ["Estrutural", "Operacional", "IA", "Confluência"], index=0)
with topo4:
    camada = st.selectbox("Camada", ["Volume", "Confluência", "Fluxo", "Execução"], index=0)
with topo5:
    layout = st.selectbox("Layout", ["Expandido", "Análise", "Execução"], index=0)

st.write("")

tools, main, right = st.columns([0.6, 4.8, 1.45])

with tools:
    st.markdown("""
    <div class="tools-pro">
        <div class="card-title">Tools</div>
        <div class="small">✚</div><br>
        <div class="small">／</div><br>
        <div class="small">▭</div><br>
        <div class="small">↗</div><br>
        <div class="small">ƒ</div><br>
        <div class="small">⟂</div><br>
        <div class="small">⊣</div><br>
        <div class="small">✎</div><br>
        <div class="small">⚖</div><br>
        <div class="small">◎</div><br>
        <div class="small">◫</div><br>
        <div class="small">⌁</div><br>
        <div class="small">◉</div>
    </div>
    """, unsafe_allow_html=True)

with main:
    st.markdown(f"""
    <div class="chart-box-pro">
        <div class="chart-grid"></div>
        <div class="chart-watermark-pro">{ativo}</div>
        <div class="card-title">Chart Expandido</div>
        <div class="small">
            Ativo: {ativo} • Timeframe: {timeframe} • Modo: {modo} • Camada: {camada} • Layout: {layout}
        </div>
        <br>
        <div class="small">
            Aqui entra o gráfico real em modo imersivo: candles, volume, ferramentas, matemática própria, IA e execução.
        </div>
    </div>
    """, unsafe_allow_html=True)

    st.write("")
    baixo1, baixo2, baixo3 = st.columns([2.2, 1.3, 1.3])

    with baixo1:
        st.markdown("""
        <div class="indicador-pro">
            <div class="card-title">Indicadores / Volume / Fluxo</div>
            <div class="small">
                Área reservada para indicadores inferiores, pressão, volume, fluxo e estrutura.
            </div>
        </div>
        """, unsafe_allow_html=True)

    with baixo2:
        st.markdown("""
        <div class="indicador-pro">
            <div class="card-title">Confluência Matemática</div>
            <div class="small">
                PhiCube • Euler • Razão de Prata • PI • Núcleo Mestre • Score estrutural
            </div>
        </div>
        """, unsafe_allow_html=True)

    with baixo3:
        st.markdown("""
        <div class="indicador-pro">
            <div class="card-title">Execução</div>
            <div class="small">
                Entrada • Stop • Parcial • Alvo • Invalidação
            </div>
        </div>
        """, unsafe_allow_html=True)

with right:
    st.markdown('<div class="panel-pro">', unsafe_allow_html=True)

    st.subheader("Painel Pro")
    st.metric("Ativo", ativo)
    st.metric("Timeframe", timeframe)
    st.metric("Modo", modo)

    st.write("**Operação**")
    st.write("- Entrada: em construção")
    st.write("- Stop: em construção")
    st.write("- Alvo: em construção")
    st.write("- Parcial: em construção")

    st.write("**IA / Estrutura**")
    st.write("- Tendência: Estrutural")
    st.write("- Força: Moderada")
    st.write("- Risco: Médio")
    st.write("- Confluência: Parcial")

    st.markdown("</div>", unsafe_allow_html=True)
