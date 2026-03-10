import streamlit as st
from pathlib import Path

st.set_page_config(
    page_title="Atlas Chart Pro",
    layout="wide",
    initial_sidebar_state="collapsed"
)

st.markdown("""
<style>
html, body, [class*="css"] {
    background-color: #0b1220;
    color: white;
}

.block-container {
    padding-top: 1.0rem;
    padding-bottom: 1rem;
}

.chart-box-pro {
    background: radial-gradient(circle at top left, rgba(20,40,80,0.35), rgba(8,12,24,0.95) 55%);
    border: 1px solid rgba(120,170,255,0.15);
    border-radius: 18px;
    min-height: 760px;
    padding: 20px;
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

.chart-watermark {
    position: absolute;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 88px;
    font-weight: 800;
    color: rgba(255,255,255,0.04);
    letter-spacing: 2px;
    pointer-events: none;
}

.soft-card {
    background: linear-gradient(180deg, rgba(18,26,44,0.85) 0%, rgba(10,16,28,0.90) 100%);
    border: 1px solid rgba(120,170,255,0.12);
    border-radius: 14px;
    padding: 16px;
    box-shadow: 0 0 14px rgba(0,0,0,0.16);
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

h1, h2, h3, label, div, p, span {
    color: white !important;
}
</style>
""", unsafe_allow_html=True)

st.title("📈 Atlas Chart Pro Expandido")
st.caption("Visualização expandida do gráfico principal")

topo1, topo2, topo3, topo4 = st.columns([1.3, 1, 1, 1])

with topo1:
    ativo = st.selectbox("Ativo", ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"])
with topo2:
    timeframe = st.selectbox("Timeframe", ["5m", "15m", "1h", "4h", "1D"], index=1)
with topo3:
    modo = st.selectbox("Modo", ["Limpo", "Estrutural", "Operacional", "IA"], index=1)
with topo4:
    overlay = st.selectbox("Camada", ["Volume", "Confluência", "Fluxo", "Execução"], index=0)

st.write("")

st.markdown(f"""
<div class="chart-box-pro">
    <div class="chart-grid"></div>
    <div class="chart-watermark">{ativo}</div>
    <div class="card-title">Chart Pro Expandido</div>
    <div class="small">Ativo: {ativo} • Timeframe: {timeframe} • Modo: {modo} • Camada: {overlay}</div>
    <br>
    <div class="small">
        Aqui entra a versão ampla do gráfico com:
        candles • zoom • ferramentas • fluxo • Fibonacci autoral • IA • confluência
    </div>
</div>
""", unsafe_allow_html=True)

st.write("")

a, b, c = st.columns([1.4, 1.4, 1])

with a:
    st.markdown("""
    <div class="soft-card">
        <div class="card-title">Painel Estrutural</div>
        <div class="small">Tendência, zonas, pivôs, rompimentos e continuação.</div>
    </div>
    """, unsafe_allow_html=True)

with b:
    st.markdown("""
    <div class="soft-card">
        <div class="card-title">Confluência</div>
        <div class="small">PhiCube • Euler • Razão de Prata • PI • níveis autorais.</div>
    </div>
    """, unsafe_allow_html=True)

with c:
    st.markdown("""
    <div class="soft-card">
        <div class="card-title">Execução</div>
        <div class="small">Entrada, stop, alvo e invalidação.</div>
    </div>
    """, unsafe_allow_html=True)

st.write("")

if st.button("⬅ Voltar ao painel principal", use_container_width=True):
    app_path = Path("streamlit_app.py")
    if app_path.exists():
        st.switch_page(str(app_path))
    else:
        st.error("Arquivo principal não encontrado: streamlit_app.py")
