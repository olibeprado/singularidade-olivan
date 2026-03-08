import streamlit as st
import ccxt
import time

st.write(st.secrets)

st.set_page_config(page_title="Sistema Singularidade Olivan", layout="wide")

st.title("🚀 Sistema Singularidade Olivan")
st.subheader("Sinal Prioritário: Matriz Bybit Ativa")

def conectar_bybit():
    try:
        key = st.secrets["BYBIT_API_KEY"]
        secret = st.secrets["BYBIT_API_SECRET"]

        bybit = ccxt.bybit({
            "apiKey": key,
            "secret": secret,
            "enableRateLimit": True
        })

        ticker = bybit.fetch_ticker("BTC/USDT:USDT")
        preco = ticker["last"]

        st.metric("BTC/USDT (Bybit)", f"$ {preco:,.2f}")
        st.success("Conexão Criptografada: Sinal 100%")

    except Exception as e:
        st.error(f"Erro real detectado: {e}")

if st.sidebar.button("Ativar Monitoramento"):

    placeholder = st.empty()

    for i in range(100000):

        with placeholder.container():
            conectar_bybit()

        time.sleep(2)

else:
    st.warning("Aguardando comando para abrir as matrizes...")
