import streamlit as st
import requests
import pandas as pd

st.set_page_config(page_title="Sistema Singularidade Olivan", layout="wide")

st.title("🚀 Sistema Singularidade Olivan")
st.subheader("Radar Global de Criptomoedas")

def pegar_dados():

    tabela = []

    headers = {
        "accept": "application/json",
        "User-Agent": "Mozilla/5.0"
    }

    for pagina in range(1,3):  # 2 páginas = 500 moedas

        url = "https://api.coingecko.com/api/v3/coins/markets"

        parametros = {
            "vs_currency": "usd",
            "order": "market_cap_desc",
            "per_page": 250,
            "page": pagina
        }

        r = requests.get(url, params=parametros, headers=headers)

        if r.status_code != 200:
            continue

        data = r.json()

        for moeda in data:

            nome = moeda.get("name")
            simbolo = moeda.get("symbol","").upper()
            preco = moeda.get("current_price")

            tabela.append([nome, simbolo, preco])

    df = pd.DataFrame(tabela, columns=["Moeda","Símbolo","Preço USD"])

    return df


if st.button("Carregar Mercado"):

    df = pegar_dados()

    st.dataframe(df, use_container_width=True)
    st.success(f"{len(df)} moedas carregadas")
