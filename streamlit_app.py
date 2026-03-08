import streamlit as st
import requests
import time

st.set_page_config(page_title="Sistema Singularidade Olivan", layout="wide")

st.title("🚀 Sistema Singularidade Olivan")
st.subheader("Sinal Prioritário: Matriz de Mercado Ativa")

def pegar_preco():

    try:
        url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"

        resposta = requests.get(url).json()

        preco = resposta["bitcoin"]["usd"]

        st.metric("BTC/USD", f"$ {preco:,.2f}")
        st.success("Conexão com CoinGecko ativa")

    except Exception as e:
        st.error(f"Erro detectado: {e}")


if st.sidebar.button("Ativar Monitoramento"):

    placeholder = st.empty()

    while True:

        with placeholder.container():
            pegar_preco()

        time.sleep(5)

else:
    st.warning("Aguardando comando para abrir as matrizes...")
