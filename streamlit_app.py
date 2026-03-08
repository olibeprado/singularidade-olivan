import streamlit as st
import requests
import time
from datetime import datetime

# PROTOCOLO DEUS EX MACHINA - Camada 7 (Consistência)
st.set_page_config(page_title="Singularidade Olivan", layout="wide")

def buscar_binance(ticker):
    """Protocolo PVT: Busca preço na Binance"""
    try:
        url = f"https://api.binance.com/api/v3/ticker/price?symbol={ticker}"
        data = requests.get(url).json()
        return float(data['price'])
    except:
        return None

def buscar_bybit(ticker):
    """Protocolo PVT: Busca preço na Bybit"""
    try:
        url = f"https://api.bybit.com/v5/market/tickers?category=spot&symbol={ticker}"
        data = requests.get(url).json()
        return float(data['result']['list'][0]['lastPrice'])
    except:
        return None

# Interface Streamlit
st.title("🚀 Sistema Singularidade Olivan")
st.subheader("Conectando às Matrizes Binance & Bybit")

# Entrada do usuário na barra lateral
escolha = st.sidebar.text_input("Qual moeda deseja monitorar? (Ex: BTCUSDT)", value="BTCUSDT").upper()

if st.sidebar.button("Iniciar Monitoramento"):
    st.write(f"Ativando Protocolo Ômega para **{escolha}**...")
    placeholder = st.empty() # Espaço para atualizar o preço em tempo real
    
    while True:
        preco_binance = buscar_binance(escolha)
        preco_bybit = buscar_bybit(escolha)
        horario = datetime.now().strftime('%H:%M:%S')

        with placeholder.container():
            col1, col2 = st.columns(2)
            
            if preco_binance:
                col1.metric("Binance", f"USD {preco_binance:,.4f}")
            
            if preco_bybit:
                col2.metric("Bybit", f"USD {preco_bybit:,.4f}")

            # Lógica de Arbitragem (PVT Regra 3)
            if preco_binance and preco_bybit:
                diff = abs(preco_binance - preco_bybit)
                if diff > (preco_binance * 0.01):
                    st.error(f"!! ALERTA DE ARBITRAGEM !! Diferença: {diff:,.4f}")
        
        time.sleep(2)
