import streamlit as st
import requests
import pandas as pd
import time

st.set_page_config(page_title="Sistema Singularidade Olivan", layout="wide")

st.title("🚀 Sistema Singularidade Olivan")
st.subheader("Radar Global de Criptomoedas")

def pegar_dados():

    tabela = []

    for pagina in range(1,5):  # 4 páginas = até 1000 moedas

        url = "https://api.coingecko.com/api/v3/coins/markets"

        parametros = {
            "vs_currency": "usd",
            "order": "market_cap_desc",
            "per_page": 250,
            "page": pagina
        }

        r = requests.get(url, params=parametros)

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


if st.sidebar.button("Ativar Monitoramento"):

    placeholder = st.empty()

    while True:

        try:

            df = pegar_dados()

            with placeholder.container():

                st.dataframe(df, use_container_width=True)

                st.success(f"{len(df)} moedas carregadas")

        except Exception as e:

            st.error(f"Erro detectado: {e}")

        time.sleep(30)

else:
    st.warning("Clique em 'Ativar Monitoramento'")
