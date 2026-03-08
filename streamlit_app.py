import streamlit as st
import ccxt
import time

# Configuração da Página
st.set_page_config(page_title="Sistema Singularidade Olivan", layout="wide")
st.title("🚀 Sistema Singularidade Olivan")
st.subheader("Sinal Prioritário: Matriz Bybit Ativa")

def conectar_bybit():
    try:
        # Puxando as chaves da gaveta 'Secrets'
        key = st.secrets["BYBIT_API_KEY"]
        secret = st.secrets["BYBIT_API_SECRET"]

        # Conexão Oficial
        bybit = ccxt.bybit({
            'apiKey': key,
            'secret': secret,
            'enableRateLimit': True
        })
        
        ticker = bybit.fetch_ticker('BTC/USDT')
        preco = ticker['last']
        
        st.metric("BTC/USDT (Bybit)", f"$ {preco:,.2f}")
        st.success("Conexão Criptografada: Sinal 100%")
        
    except Exception as e:
        st.error("Erro de Sincronia: Verifique se o código no Secrets está correto.")

# Painel Lateral
if st.sidebar.button('Ativar Monitoramento'):
    placeholder = st.empty()
    while True:
        with placeholder.container():
            conectar_bybit()
        time.sleep(2)
        st.rerun()
else:
    st.warning("Aguardando comando para abrir as matrizes...")
