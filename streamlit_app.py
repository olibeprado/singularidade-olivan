import streamlit as st
import ccxt
import time

st.set_page_config(page_title="Sistema Singularidade Olivan", layout="wide")

st.title("🚀 Sistema Singularidade Olivan")
st.subheader("Sinal Prioritário: Matriz de Mercado Ativa")

def conectar_mercado():
    try:
        exchange = ccxt.binance({
            "enableRateLimit": True
        })

        ticker = exchange.fetch_ticker("BTC/USDT")
        preco = ticker["last"]

        st.metric("BTC/USDT", f"$ {preco:,.2f}")
        st.success("Conexão de Mercado Ativa")

    except Exception as e:
        st.error(f"Erro detectado: {e}")

if st.sidebar.button("Ativar Monitoramento"):

    placeholder = st.empty()

    for i in range(100000):

        with placeholder.container():
            conectar_mercado()

        time.sleep(2)

else:
    st.warning("Aguardando comando para abrir as matrizes...")
