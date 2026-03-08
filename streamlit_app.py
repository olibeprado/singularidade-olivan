import streamlit as st
import requests
import time

st.title("🚀 Sistema Singularidade Olivan")

def pegar_preco():

    try:
        url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"

        r = requests.get(url)
        data = r.json()

        if "bitcoin" in data:
            preco = data["bitcoin"]["usd"]
            st.metric("BTC/USD", f"${preco:,.2f}")
        else:
            st.error("Dados do Bitcoin não encontrados")

    except Exception as e:
        st.error(f"Erro detectado: {e}")


if st.button("Ativar Monitoramento"):

    placeholder = st.empty()

    while True:
        with placeholder.container():
            pegar_preco()

        time.sleep(5)
