import streamlit as st
import ccxt
import time

# Configuração da página
st.set_page_config(page_title="Sistema Singularidade Olivan", layout="wide")

st.title("🚀 Sistema Singularidade Olivan")
st.subheader("Sinal Prioritário: Matriz de Mercado Ativa")

# Função para conectar e puxar preço
def conectar_bybit():
    try:
        exchange = ccxt.bybit({
            "enableRateLimit": True
        })

        ticker = exchange.fetch_ticker("BTC/USDT")
        preco = ticker["last"]

        st.metric("BTC/USDT", f"$ {preco:,.2f}")
        st.success("Conexão de Mercado Ativa")

    except Exception as e:
        st.error(f"Erro detectado: {e}")


# Botão lateral
if st.sidebar.button("Ativar Monitoramento"):

    placeholder = st.empty()

    for i in range(100000):

        with placeholder.container():
            conectar_bybit()

        time.sleep(2)

else:
    st.warning("Aguardando comando para abrir as matrizes...")
