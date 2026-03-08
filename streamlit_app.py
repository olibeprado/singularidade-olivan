import streamlit as st
import requests
import pandas as pd

st.set_page_config(page_title="Sistema Singularidade Olivan", layout="wide")

st.title("🚀 Sistema Singularidade Olivan")
st.subheader("Radar Global de Criptomoedas")

def pegar_dados():

    url = "https://api.coingecko.com/api/v3/coins/markets"

    parametros = {
        "vs_currency": "usd",
        "order": "market_cap_desc",
        "per_page": 100,
        "page": 1
    }

    headers = {
        "accept": "application/json",
        "User-Agent": "Mozilla/5.0"
    }

    r = requests.get(url, params=parametros, headers=headers)

    if r.status_code != 200:
        st.write("Status da API:", r.status_code)
        return pd.DataFrame()

    data = r.json()

    tabela = []

    for moeda in data:

        nome = moeda.get("name")
        simbolo = moeda.get("symbol","").upper()
        preco = moeda.get("current_price")

        tabela.append([nome, simbolo, preco])

    df = pd.DataFrame(tabela, columns=["Moeda","Símbolo","Preço USD"])

    return df


if st.button("Carregar Mercado"):

    df = pegar_dados()

    if not df.empty:

        st.dataframe(df, use_container_width=True)
        st.success(f"{len(df)} moedas carregadas")

    else:

        st.error("Não foi possível carregar dados da API")
