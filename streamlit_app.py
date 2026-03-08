import streamlit as st
import requests
import pandas as pd

st.set_page_config(page_title="Sistema Singularidade Olivan", layout="wide")

st.title("🚀 Sistema Singularidade Olivan")
st.subheader("Scanner de Tendência e Breakout")

moedas = ["bitcoin","ethereum","solana","ripple","cardano"]

def pegar_dados(moeda):

    url = f"https://api.coingecko.com/api/v3/coins/{moeda}/market_chart"

    parametros = {
        "vs_currency":"usd",
        "days":1
    }

    r = requests.get(url, params=parametros)

    data = r.json()

    precos = [p[1] for p in data["prices"]]

    df = pd.DataFrame(precos, columns=["preco"])

    df["EMA"] = df["preco"].ewm(span=9).mean()

    preco_atual = df["preco"].iloc[-1]
    ema = df["EMA"].iloc[-1]

    maxima = df["preco"].tail(20).max()

    if preco_atual > ema and preco_atual > maxima:
        sinal = "COMPRA 🚀"
    elif preco_atual < ema:
        sinal = "BAIXA 🔻"
    else:
        sinal = "AGUARDAR"

    return preco_atual, ema, sinal


if st.button("Escanear Mercado"):

    tabela = []

    for moeda in moedas:

        preco, ema, sinal = pegar_dados(moeda)

        tabela.append([moeda.upper(), preco, ema, sinal])

    df = pd.DataFrame(tabela, columns=["Moeda","Preço","MME","Sinal"])

    st.dataframe(df, use_container_width=True)
