import streamlit as st
import requests
import pandas as pd

st.set_page_config(page_title="Sistema Singularidade Olivan", layout="wide")

st.title("🚀 Sistema Singularidade Olivan")
st.subheader("Scanner de Tendência")

moedas = ["bitcoin","ethereum","solana","ripple","cardano","MNT","FET","BNB","RAY","TAI","KSM","RENDER"]  

def pegar_dados(moeda):

    url = f"https://api.coingecko.com/api/v3/coins/{moeda}/market_chart"

    parametros = {
        "vs_currency":"usd",
        "days":1
    }

    r = requests.get(url, params=parametros)

    if r.status_code != 200:
        return None, None, "NEUTRO"

    data = r.json()

    if "prices" not in data:
        return None, None, "NEUTRO"

    precos = [p[1] for p in data["prices"]]

    df = pd.DataFrame(precos, columns=["preco"])

    df["EMA"] = df["preco"].ewm(span=9).mean()

    preco_atual = df["preco"].iloc[-1]
    ema = df["EMA"].iloc[-1]

    if preco_atual > ema:
        sinal = "ALTA"
    elif preco_atual < ema:
        sinal = "QUEDA"
    else:
        sinal = "NEUTRO"

    return preco_atual, ema, sinal


if st.button("Escanear Mercado"):

    tabela = []

    for moeda in moedas:

        preco, ema, sinal = pegar_dados(moeda)

        tabela.append([moeda.upper(), preco, ema, sinal])

    df = pd.DataFrame(tabela, columns=["Moeda","Preço","MME","Tendência"])

    def colorir(valor):

        if valor == "ALTA":
            return "color: green"

        if valor == "QUEDA":
            return "color: red"

        return "color: orange"

    st.dataframe(df.style.applymap(colorir, subset=["Tendência"]), use_container_width=True)
