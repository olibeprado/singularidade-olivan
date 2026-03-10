import streamlit as st
import requests
import pandas as pd

API_KEY_CMC = '910c7033d8e44e1984891d27e4e00222'

st.set_page_config(
    page_title="Sistema Singularidade Olivan",
    layout="wide",
    initial_sidebar_state="expanded"
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

section[data-testid="stSidebar"] {
    background: linear-gradient(180deg, #0a1120 0%, #0d1528 100%);
    border-right: 1px solid rgba(120,170,255,0.12);
}

.card {
    background: linear-gradient(180deg, rgba(20,30,50,0.95) 0%, rgba(12,18,32,0.95) 100%);
    border: 1px solid rgba(120,170,255,0.18);
    border-radius: 16px;
    padding: 18px;
    box-shadow: 0 0 20px rgba(0,0,0,0.20);
    min-height: 120px;
}

.soft-card {
    background: linear-gradient(180deg, rgba(18,26,44,0.85) 0%, rgba(10,16,28,0.90) 100%);
    border: 1px solid rgba(120,170,255,0.12);
    border-radius: 14px;
    padding: 16px;
    box-shadow: 0 0 14px rgba(0,0,0,0.16);
}

.chart-box {
    background: radial-gradient(circle at top left, rgba(20,40,80,0.35), rgba(8,12,24,0.95) 55%);
    border: 1px solid rgba(120,170,255,0.15);
    border-radius: 16px;
    min-height: 430px;
    padding: 18px;
    position: relative;
    overflow: hidden;
}

.chart-box-pro {
    background: radial-gradient(circle at top left, rgba(20,40,80,0.35), rgba(8,12,24,0.98) 55%);
    border: 1px solid rgba(120,170,255,0.18);
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
    font-size: 64px;
    font-weight: 800;
    color: rgba(255,255,255,0.04);
    letter-spacing: 2px;
    pointer-events: none;
}

.chart-watermark-pro {
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

.toolbar-box {
    background: linear-gradient(180deg, rgba(18,26,44,0.90) 0%, rgba(10,16,28,0.95) 100%);
    border: 1px solid rgba(120,170,255,0.14);
    border-radius: 14px;
    padding: 14px;
    min-height: 430px;
}

.card-title {
    font-size: 15px;
    font-weight: 700;
    color: #cfe0ff;
    margin-bottom: 8px;
}

.big-number {
    font-size: 30px;
    font-weight: 800;
    color: white;
}

.small {
    font-size: 13px;
    color: #9fb2d9;
}

.green { color: #56f287; }
.red { color: #ff6b81; }
.yellow { color: #ffd166; }
.blue { color: #7ab8ff; }

h1, h2, h3 {
    color: white !important;
}

div[data-testid="metric-container"] {
    background: rgba(20,30,50,0.65);
    border: 1px solid rgba(120,170,255,0.12);
    padding: 10px;
    border-radius: 12px;
}

hr {
    border: none;
    border-top: 1px solid rgba(120,170,255,0.12);
    margin: 0.6rem 0 1rem 0;
}
</style>
""", unsafe_allow_html=True)

STABLECOINS = {
    "USDT", "USDC", "BUSD", "DAI", "TUSD", "FDUSD", "USDE", "PYUSD",
    "USDD", "FRAX", "GUSD", "LUSD", "SUSD", "USDP", "EURC", "USDK"
}


def buscar_mercado_cmc(limite=300):
    url = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest"
    headers = {
        "Accepts": "application/json",
        "X-CMC_PRO_API_KEY": API_KEY_CMC
    }
    parametros = {
        "start": "1",
        "limit": str(limite),
        "convert": "USD"
    }

    try:
        r = requests.get(url, headers=headers, params=parametros, timeout=20)
        if r.status_code == 200:
            payload = r.json()
            return payload.get("data", [])
        st.error(f"Erro na API: {r.status_code}")
        return []
    except Exception as e:
        st.error(f"Erro ao buscar dados: {e}")
        return []


def definir_status(valor):
    if valor > 0.5:
        return "FORTE 🟢"
    if valor < -0.5:
        return "FRACO 🔴"
    return "NEUTRO 🟡"


def calcular_score_base(p1h, p24h, p7d):
    score = 0
    score += 1 if p1h > 0 else -1
    score += 2 if p24h > 0 else -2
    score += 1 if p7d > 0 else -1
    return score


def score_0_100(p1h, p24h, p7d):
    score = 50
    score += max(-12, min(12, p1h * 3))
    score += max(-20, min(20, p24h * 2))
    score += max(-18, min(18, p7d * 0.8))
    return max(0, min(100, round(score)))


def classificar_score_base(score):
    if score >= 3:
        return "ALTA FORÇA 🚀"
    elif score <= -3:
        return "NEGATIVO 🔻"
    return "NEUTRO ⚖️"


def sentimento_mercado(media_1h, media_24h):
    if media_1h > 0 and media_24h > 0:
        return "Mercado em força"
    elif media_1h < 0 and media_24h < 0:
        return "Mercado pressionado"
    return "Mercado indefinido"


def confianca_texto(score100):
    if score100 >= 80:
        return "Alta"
    elif score100 >= 60:
        return "Moderada"
    elif score100 >= 40:
        return "Neutra"
    return "Baixa"


def risco_texto(score100):
    if score100 >= 80:
        return "Baixo"
    elif score100 >= 60:
        return "Médio"
    return "Alto"


def sinal_texto(score100):
    if score100 >= 80:
        return "Compra forte"
    elif score100 >= 60:
        return "Compra moderada"
    elif score100 >= 40:
        return "Observação"
    elif score100 >= 20:
        return "Venda moderada"
    return "Venda forte"


def gerar_dataset_mercado():
    dados = buscar_mercado_cmc(300)
    if not dados:
        return None

    tabela = []
    fortes = []
    fracas = []

    soma_1h = 0
    soma_24h = 0
    contador_validos = 0

    for moeda in dados:
        simbolo = moeda["symbol"].upper()

        if simbolo in STABLECOINS:
            continue

        q = moeda["quote"]["USD"]

        preco = q.get("price", 0)
        p_1h = q.get("percent_change_1h", 0)
        p_24h = q.get("percent_change_24h", 0)
        p_7d = q.get("percent_change_7d", 0)

        score_base = calcular_score_base(p_1h, p_24h, p_7d)
        score100 = score_0_100(p_1h, p_24h, p_7d)
        status_geral = classificar_score_base(score_base)

        soma_1h += p_1h
        soma_24h += p_24h
        contador_validos += 1

        if score100 >= 75:
            fortes.append((simbolo, score100))
        elif score100 <= 25:
            fracas.append((simbolo, score100))

        tabela.append([
            simbolo,
            preco,
            p_1h,
            p_24h,
            p_7d,
            definir_status(p_1h),
            definir_status(p_24h),
            definir_status(p_7d),
            score_base,
            score100,
            status_geral
        ])

    if not tabela:
        return None

    df = pd.DataFrame(
        tabela,
        columns=[
            "Moeda", "Preço", "%1h", "%24h", "%7d",
            "1 Hora", "24 Horas", "7 Dias",
            "Score Base", "Score", "Status Geral"
        ]
    )

    df = df.sort_values(by="Score", ascending=False).reset_index(drop=True)

    media_1h = soma_1h / contador_validos if contador_validos else 0
    media_24h = soma_24h / contador_validos if contador_validos else 0

    fortes = sorted(fortes, key=lambda x: x[1], reverse=True)[:5]
    fracas = sorted(fracas, key=lambda x: x[1])[:5]

    return {
        "df": df,
        "media_1h": media_1h,
        "media_24h": media_24h,
        "top_fortes": fortes,
        "top_fracas": fracas,
        "horario": pd.Timestamp.now().strftime("%H:%M:%S")
    }


def inicializar_estado():
    if "market_data" not in st.session_state:
        st.session_state.market_data = None
    if "chart_expandido" not in st.session_state:
        st.session_state.chart_expandido = False


def botao_atualizar():
    if st.button("Escanear Força do Mercado", use_container_width=True):
        st.session_state.market_data = gerar_dataset_mercado()


def cabecalho_principal():
    st.title("🚀 Sistema Singularidade Olivan")
    st.caption("Terminal Modular • Radar • Scanner • Fluxo • IA • Estrutura")


def sidebar_terminal():
    with st.sidebar:
        st.markdown("## ⚡ Singularidade")
        st.caption("Terminal de análise")
        st.markdown("---")

        modulo = st.radio(
            "Módulos",
            ["Radar", "Chart", "Scanner", "Fluxo", "IA"],
            index=0
        )

        st.markdown("---")
        botao_atualizar()

        st.markdown("---")
        st.caption("Status do sistema")
        if st.session_state.market_data:
            st.success("Base carregada")
            st.caption(f"Última leitura: {st.session_state.market_data['horario']}")
        else:
            st.info("Aguardando leitura")

    return modulo


def tela_radar():
    cabecalho_principal()

    if not st.session_state.market_data:
        st.info("Clique em 'Escanear Força do Mercado' na barra lateral para carregar os dados.")
        return

    market = st.session_state.market_data
    df = market["df"]
    media_1h = market["media_1h"]
    media_24h = market["media_24h"]
    top_fortes = market["top_fortes"]
    top_fracas = market["top_fracas"]
    horario = market["horario"]

    t1, t2, t3, t4 = st.columns(4)

    with t1:
        st.markdown(f"""
        <div class="card">
            <div class="card-title">Sentimento Geral</div>
            <div class="big-number">{sentimento_mercado(media_1h, media_24h)}</div>
            <div class="small">Leitura baseada na média do scanner</div>
        </div>
        """, unsafe_allow_html=True)

    with t2:
        cor = "green" if media_1h > 0 else "red"
        st.markdown(f"""
        <div class="card">
            <div class="card-title">Média 1 Hora</div>
            <div class="big-number {cor}">{media_1h:.2f}%</div>
            <div class="small">Pulso curto do mercado</div>
        </div>
        """, unsafe_allow_html=True)

    with t3:
        cor = "green" if media_24h > 0 else "red"
        st.markdown(f"""
        <div class="card">
            <div class="card-title">Média 24 Horas</div>
            <div class="big-number {cor}">{media_24h:.2f}%</div>
            <div class="small">Força média do mercado</div>
        </div>
        """, unsafe_allow_html=True)

    with t4:
        st.markdown(f"""
        <div class="card">
            <div class="card-title">Última Análise</div>
            <div class="big-number">{horario}</div>
            <div class="small">Atualização concluída</div>
        </div>
        """, unsafe_allow_html=True)

    st.write("")

    left, center, right = st.columns([1.1, 2.2, 1.1])

    with left:
        fortes_html = "<br>".join([f"• {m} ({s})" for m, s in top_fortes]) if top_fortes else "Sem destaque"
        st.markdown(f"""
        <div class="card">
            <div class="card-title">Top Forças</div>
            <div class="green">{fortes_html}</div>
        </div>
        """, unsafe_allow_html=True)

        st.write("")

        fracas_html = "<br>".join([f"• {m} ({s})" for m, s in top_fracas]) if top_fracas else "Sem destaque"
        st.markdown(f"""
        <div class="card">
            <div class="card-title">Top Fraquezas</div>
            <div class="red">{fracas_html}</div>
        </div>
        """, unsafe_allow_html=True)

    with center:
        st.markdown("""
        <div class="card">
            <div class="card-title">Radar de Mercado</div>
            <div class="small">
                Área central do terminal. Depois aqui entram: gráfico, confluência, heatmap, alertas e leitura estrutural.
            </div>
        </div>
        """, unsafe_allow_html=True)

        st.write("")
        st.subheader("📊 Tabela Mestre do Mercado")

        df_exibir = df[[
            "Moeda", "Preço", "1 Hora", "24 Horas", "7 Dias", "Score", "Status Geral"
        ]]

        st.dataframe(
            df_exibir.style.format({"Preço": "{:.6f}"}),
            use_container_width=True
        )

    with right:
        ativo_top = df.iloc[0]
        score_top = int(ativo_top["Score"])

        st.subheader("IA Insights")
        st.caption("Moeda em destaque")
        st.markdown(f"## {ativo_top['Moeda']}")

        c1, c2 = st.columns(2)
        with c1:
            st.metric("Score", score_top)
        with c2:
            st.metric("Status", ativo_top["Status Geral"])

        st.caption("Sinal")
        st.write(sinal_texto(score_top))

        st.caption("Confiança")
        st.write(confianca_texto(score_top))

        st.caption("Risco")
        st.write(risco_texto(score_top))

        st.caption("Próximo passo")
        st.write("Aqui depois entra entrada, saída e stop com IA")


def tela_chart():
    cabecalho_principal()

    if not st.session_state.chart_expandido:
        st.subheader("📈 Atlas Chart")

        topo1, topo2, topo3, topo4 = st.columns([1.2, 1, 1, 1])

        with topo1:
            ativo = st.selectbox("Ativo", ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"])
        with topo2:
            timeframe = st.selectbox("Timeframe", ["5m", "15m", "1h", "4h", "1D"], index=1)
        with topo3:
            modo = st.selectbox("Modo", ["Limpo", "Estrutural", "Operacional", "IA"], index=1)
        with topo4:
            overlay = st.selectbox("Camada", ["Volume", "Confluência", "Fluxo", "Execução"], index=0)

        st.write("")

        if st.button("Abrir Chart Pro Expandido", use_container_width=True):
            st.session_state.chart_expandido = True
            st.rerun()

        st.write("")

        tools, main, right = st.columns([0.8, 3.8, 1.3])

        with tools:
            st.markdown("""
            <div class="toolbar-box">
                <div class="card-title">Ferramentas</div>
                <div class="small">✚ Cursor</div><br>
                <div class="small">／ Linha</div><br>
                <div class="small">▭ Zona</div><br>
                <div class="small">↗ Tendência</div><br>
                <div class="small">ƒ Fibonacci</div><br>
                <div class="small">⟂ Horizontal</div><br>
                <div class="small">⊣ Vertical</div><br>
                <div class="small">✎ Texto</div><br>
                <div class="small">⚖ Risco/Retorno</div><br>
                <div class="small">◎ IA</div>
            </div>
            """, unsafe_allow_html=True)

        with main:
            st.markdown(f"""
            <div class="chart-box">
                <div class="chart-grid"></div>
                <div class="chart-watermark">{ativo}</div>
                <div class="card-title">Gráfico Principal</div>
                <div class="small">Ativo: {ativo} • Timeframe: {timeframe} • Modo: {modo} • Camada: {overlay}</div>
                <br>
                <div class="small">
                    Aqui entra o gráfico próprio do terminal:
                    candles • volume • crosshair • ferramentas • Fibonacci autoral • confluência • IA
                </div>
            </div>
            """, unsafe_allow_html=True)

            st.write("")

            sub1, sub2 = st.columns([2.2, 1])

            with sub1:
                st.markdown("""
                <div class="soft-card">
                    <div class="card-title">Indicadores / Volume</div>
                    <div class="small">
                        Espaço reservado para volume, oscilador, fluxo, força e sinais secundários.
                    </div>
                </div>
                """, unsafe_allow_html=True)

            with sub2:
                st.markdown("""
                <div class="soft-card">
                    <div class="card-title">Confluência</div>
                    <div class="small">
                        PhiCube • Euler • Razão de Prata • PI • Score estrutural
                    </div>
                </div>
                """, unsafe_allow_html=True)

        with right:
            st.subheader("Painel do Ativo")
            st.metric("Ativo", ativo)
            st.metric("Timeframe", timeframe)
            st.metric("Modo", modo)

            st.write("**Leitura rápida**")
            st.write("- Tendência: Estrutural")
            st.write("- Força: Moderada")
            st.write("- Risco: Médio")
            st.write("- Confluência: Em construção")

            st.write("**Próxima etapa**")
            st.write("Adicionar gráfico real e ferramentas autorais.")

    else:
        st.subheader("📈 Atlas Chart Pro Expandido")

        topo1, topo2, topo3, topo4 = st.columns([1.3, 1, 1, 1])

        with topo1:
            ativo = st.selectbox("Ativo", ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"], key="pro_ativo")
        with topo2:
            timeframe = st.selectbox("Timeframe", ["5m", "15m", "1h", "4h", "1D"], index=1, key="pro_tf")
        with topo3:
            modo = st.selectbox("Modo", ["Limpo", "Estrutural", "Operacional", "IA"], index=1, key="pro_modo")
        with topo4:
            overlay = st.selectbox("Camada", ["Volume", "Confluência", "Fluxo", "Execução"], index=0, key="pro_overlay")

        st.write("")

        if st.button("⬅ Voltar ao Chart Normal", use_container_width=True):
            st.session_state.chart_expandido = False
            st.rerun()

        st.write("")

        st.markdown(f"""
        <div class="chart-box-pro">
            <div class="chart-grid"></div>
            <div class="chart-watermark-pro">{ativo}</div>
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


def tela_scanner():
    cabecalho_principal()
    st.subheader("🛰️ Scanner Avançado")

    if not st.session_state.market_data:
        st.info("Clique em 'Escanear Força do Mercado' na barra lateral para carregar os dados.")
        return

    df = st.session_state.market_data["df"].copy()

    col1, col2, col3 = st.columns([1, 1, 1])

    with col1:
        minimo = st.slider("Score mínimo", 0, 100, 60)

    with col2:
        qtd = st.selectbox("Quantidade", [10, 25, 50, 100], index=1)

    with col3:
        busca = st.text_input("Buscar moeda", "")

    filtrado = df[df["Score"] >= minimo]

    if busca:
        filtrado = filtrado[filtrado["Moeda"].str.contains(busca.upper(), na=False)]

    filtrado = filtrado.head(qtd)

    st.dataframe(
        filtrado[["Moeda", "Preço", "1 Hora", "24 Horas", "7 Dias", "Score", "Status Geral"]].style.format({"Preço": "{:.6f}"}),
        use_container_width=True
    )


def tela_fluxo():
    cabecalho_principal()
    st.subheader("🌊 Fluxo de Mercado")

    a, b, c = st.columns(3)

    with a:
        st.markdown("""
        <div class="card">
            <div class="card-title">Volume Anormal</div>
            <div class="small">Aqui vai entrar a leitura de atividade fora do padrão.</div>
        </div>
        """, unsafe_allow_html=True)

    with b:
        st.markdown("""
        <div class="card">
            <div class="card-title">Pressão Compradora</div>
            <div class="small">Aqui entra a força compradora x vendedora.</div>
        </div>
        """, unsafe_allow_html=True)

    with c:
        st.markdown("""
        <div class="card">
            <div class="card-title">Liquidez</div>
            <div class="small">Aqui entram zonas, absorção e defesa estrutural.</div>
        </div>
        """, unsafe_allow_html=True)

    st.write("")
    st.info("Próxima etapa: ligar volume, fluxo, eventos e anomalias.")


def tela_ia():
    cabecalho_principal()
    st.subheader("🧠 IA Atlas")

    if not st.session_state.market_data:
        st.info("Clique em 'Escanear Força do Mercado' na barra lateral para carregar os dados.")
        return

    df = st.session_state.market_data["df"]
    ativo_top = df.iloc[0]
    score_top = int(ativo_top["Score"])

    left, right = st.columns([1.2, 1.8])

    with left:
        st.metric("Ativo em destaque", ativo_top["Moeda"])
        st.metric("Score", score_top)
        st.metric("Confiança", confianca_texto(score_top))
        st.metric("Risco", risco_texto(score_top))

    with right:
        st.markdown("""
        <div class="card">
            <div class="card-title">Leitura IA</div>
            <div class="small">Sinal</div>
        </div>
        """, unsafe_allow_html=True)
        st.write(sinal_texto(score_top))
        st.write("")
        st.write("**Próximo passo do módulo IA:**")
        st.write("- entrada ideal")
        st.write("- stop técnico")
        st.write("- saída parcial")
        st.write("- invalidação")
        st.write("- score por confluência")


inicializar_estado()
modulo = sidebar_terminal()

if modulo == "Radar":
    tela_radar()
elif modulo == "Chart":
    tela_chart()
elif modulo == "Scanner":
    tela_scanner()
elif modulo == "Fluxo":
    tela_fluxo()
elif modulo == "IA":
    tela_ia()
