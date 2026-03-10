import streamlit as st
import requests
import pandas as pd

API_KEY_CMC = '910c7033d8e44e1984891d27e4e00222'

st.set_page_config(page_title="Sistema Singularidade Olivan", layout="wide")

st.markdown("""
<style>
html, body, [class*="css"] {
    background-color: #0b1220;
    color: white;
}

.block-container {
    padding-top: 1.2rem;
    padding-bottom: 1rem;
}

.card {
    background: linear-gradient(180deg, rgba(20,30,50,0.95) 0%, rgba(12,18,32,0.95) 100%);
    border: 1px solid rgba(120,170,255,0.18);
    border-radius: 16px;
    padding: 18px;
    box-shadow: 0 0 20px rgba(0,0,0,0.20);
    min-height: 120px;
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

h1, h2, h3 {
    color: white !important;
}
</style>
""", unsafe_allow_html=True)

st.title("🚀 Sistema Singularidade Olivan")
st.caption("Scanner Multitemporal • Força Relativa • Estrutura • IA")

def buscar_mercado_cmc(limite=50):
    url = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest"
    headers = {
        'Accepts': 'application/json',
        'X-CMC_PRO_API_KEY': API_KEY_CMC
    }
    parametros = {
        'start': '1',
        'limit': str(limite),
        'convert': 'USD'
    }

    try:
        r = requests.get(url, headers=headers, params=parametros, timeout=20)
        if r.status_code == 200:
            payload = r.json()
            return payload.get("data", [])
        else:
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

def calcular_score(p1h, p24h, p7d):
    score = 0
    score += 1 if p1h > 0 else -1
    score += 2 if p24h > 0 else -2
    score += 1 if p7d > 0 else -1
    return score

def classificar_score(score):
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

if "df_mercado" not in st.session_state:
    st.session_state.df_mercado = pd.DataFrame()

if st.button("Escanear Força do Mercado"):
    dados = buscar_mercado_cmc(200)

    if dados:
        tabela = []
        fortes = []
        fracas = []

        soma_1h = 0
        soma_24h = 0

        for moeda in dados:
            simbolo = moeda['symbol']
            q = moeda['quote']['USD']

            preco = q.get('price', 0)
            p_1h = q.get('percent_change_1h', 0)
            p_24h = q.get('percent_change_24h', 0)
            p_7d = q.get('percent_change_7d', 0)

            score = calcular_score(p_1h, p_24h, p_7d)
            status_geral = classificar_score(score)

            soma_1h += p_1h
            soma_24h += p_24h

            if score >= 3:
                fortes.append((simbolo, score))
            elif score <= -3:
                fracas.append((simbolo, score))

            tabela.append([
                simbolo,
                preco,
                p_1h,
                p_24h,
                p_7d,
                definir_status(p_1h),
                definir_status(p_24h),
                definir_status(p_7d),
                score,
                status_geral
            ])

        df = pd.DataFrame(
            tabela,
            columns=[
                "Moeda", "Preço", "%1h", "%24h", "%7d",
                "1 Hora", "24 Horas", "7 Dias",
                "Score", "Status Geral"
            ]
        )

        df = df.sort_values(by="Score", ascending=False).reset_index(drop=True)
        st.session_state.df_mercado = df

        media_1h = soma_1h / len(dados)
        media_24h = soma_24h / len(dados)

        st.session_state.media_1h = media_1h
        st.session_state.media_24h = media_24h
        st.session_state.top_fortes = fortes[:5]
        st.session_state.top_fracas = fracas[:5]
        st.session_state.horario = pd.Timestamp.now().strftime('%H:%M:%S')

df = st.session_state.df_mercado

if not df.empty:
    media_1h = st.session_state.media_1h
    media_24h = st.session_state.media_24h
    top_fortes = st.session_state.top_fortes
    top_fracas = st.session_state.top_fracas
    horario = st.session_state.horario

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
                Esta área pode virar depois:
                scanner avançado • gráfico • confluência • núcleo matemático • sinais IA
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

        st.markdown(f"""
        <div class="card">
            <div class="card-title">IA Insights</div>
            <div class="small">Moeda em destaque</div>
            <div class="big-number">{ativo_top['Moeda']}</div>
            <div class="small">Score</div>
            <div class="big-number">{ativo_top['Score']}</div>
            <div class="small">Status</div>
            <div class="yellow">{ativo_top['Status Geral']}</div>
            <br>
            <div class="small">Leitura inicial</div>
            <div>{"Mercado comprador" if ativo_top['Score'] > 0 else "Mercado vendedor"}</div>
            <br>
            <div class="small">Próximo passo</div>
            <div>Aqui depois entra entrada, saída e stop com IA</div>
        </div>
        """, unsafe_allow_html=True)

else:
    st.info("Clique em 'Escanear Força do Mercado' para carregar os dados.")
