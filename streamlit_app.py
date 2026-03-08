import streamlit as st
import requests
import pandas as pd
import time

st.set_page_config(page_title="Sistema Singularidade Olivan", layout="wide")

st.title("🚀 Sistema Singularidade Olivan")
st.subheader("Radar de Mercado Cripto")

def pegar_dados():

    url = "https://api.coingecko.com/api/v3/coins/markets"

    parametros = {
        "vs_currency": "usd",
        "order": "market_cap_desc",
        "per_page": 20,
        "page": 1
    }

    r = requests.get(url, params=parametros)

    if r.status_code != 200:
        return None

    data = r.json()

    if not isinstance(data, list):
        return None

    tabela = []

    for moeda in data:

        nome = moeda.get("name")
        simbolo = moeda.get("symbol", "").upper()
        preco = moeda.get("current_price")

        if nome and preco:
            tabela.append([nome, simbolo, preco])

    df = pd.DataFrame(tabela, columns=["Moeda", "Símbolo", "Preço USD"])

    return df


if st.sidebar.button("Ativar Monitoramento"):

    placeholder = st.empty()

    while True:

        try:

            df = pegar_dados()

            if df is not None:

                with placeholder.container():

                    st.dataframe(df, use_container_width=True)

                    for i in range(len(df)):
                        st.metric(
                            f"{df['Moeda'][i]} ({df['Símbolo'][i]})",
                            f"${df['Preço USD'][i]:,.2f}"
                        )

            else:
                st.warning("Não foi possível obter dados da API")

        except Exception as e:
            st.error(f"Erro detectado: {e}")

        time.sleep(10)

else:
    st.warning("Clique em 'Ativar Monitoramento' no menu lateral")
