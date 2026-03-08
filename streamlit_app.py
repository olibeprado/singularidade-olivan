import streamlit as st
import pandas as pd
import ccxt
import time

# Interface Visual Nazare
st.set_page_config(page_title="Sistema Singularidade Olivan", layout="wide")
st.title("🚀 Sistema Singularidade Olivan")
st.subheader("Monitoramento em Tempo Real: Binance & Bybit")

def conectar_matrizes():
    # Configuração das corretoras com Timeout de 10 segundos
    binance = ccxt.binance({'timeout': 10000, 'enableRateLimit': True})
    bybit = ccxt.bybit({'timeout': 10000, 'enableRateLimit': True})
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.write("### Matriz Binance")
        try:
            ticker_bn = binance.fetch_ticker('BTC/USDT')
            st.metric("BTC/USDT (Binance)", f"$ {ticker_bn['last']:.2f}")
            st.success("Conexão Estável")
        except Exception as e:
            st.error(f"Erro na Binance: Link instável")

    with col2:
        st.write("### Matriz Bybit")
        try:
            ticker_bb = bybit.fetch_ticker('BTC/USDT')
            st.metric("BTC/USDT (Bybit)", f"$ {ticker_bb['last']:.2f}")
            st.success("Conexão Estável")
        except Exception as e:
            st.error(f"Erro na Bybit: Link instável")

# Botão de Ativação
if st.sidebar.button('Iniciar Monitoramento'):
    st.info("Ativando Protocolo Ômega...")
    while True:
        conectar_matrizes()
        time.sleep(5) # Atualiza a cada 5 segundos para não travar
        st.rerun()
else:
    st.warning("Aguardando comando para iniciar...")
