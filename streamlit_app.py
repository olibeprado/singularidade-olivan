import streamlit as st
import requests
import pandas as pd

# CHAVE CORRIGIDA CONFORME SUA FOTO
API_KEY_CMC = '910c7033-d8e4-4e19-8489-1d27e4e00222' 

st.set_page_config(page_title="Sistema Singularidade Olivan", layout="wide")

st.title("🚀 Sistema Singularidade Olivan")
st.subheader("Scanner de Tendência Global - Top Mercado")

def buscar_mercado_completo(limite=100):
    # Usamos 'listings/latest' para pegar o ranking atualizado
    url = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest"
    headers = {
        'Accepts': 'application/json',
        'X-CMC_PRO_API_KEY': API_KEY_CMC,
    }
    parametros = {
        'start': '1',
        'limit': str(limite), # Define quantas moedas quer ver (ex: 100)
        'convert': 'USD'
    }

    try:
        r = requests.get(url, headers=headers, params=parametros)
        if r.status_code == 200:
            return r.json()['data']
        else:
            st.error(f"Erro na API: {r.status_code}")
            return None
    except Exception as e:
        st.error(f"Falha de conexão: {e}")
        return None

def colorir_tendencia(valor):
    if valor == "ALTA":
        return "color: #00ff00; font-weight: bold"
    elif valor == "QUEDA":
        return "color: #ff4b4b; font-weight: bold"
    return "color: #ffa500"

# Seletor para o usuário escolher o tamanho do scan
qtd_moedas = st.sidebar.slider("Quantidade de moedas para escanear", 10, 200, 100)

if st.button(f"Escanear Top {qtd_moedas} do Mercado"):
    dados_api = buscar_mercado_completo(qtd_moedas)
    
    if dados_api:
        tabela = []
        for moeda in dados_api:
            simbolo = moeda['symbol']
            info = moeda['quote']['USD']
            preco = info['price']
            variacao = info['percent_change_24h']
            
            # Lógica de tendência baseada na variação
            if variacao > 0.5:
                sinal = "ALTA"
            elif variacao < -0.5:
                sinal = "QUEDA"
            else:
                sinal = "NEUTRO"
            
            tabela.append([simbolo, preco, variacao, sinal])

        df = pd.DataFrame(tabela, columns=["Moeda", "Preço (USD)", "Variação 24h (%)", "Tendência"])
        
        # Formatação seguindo o Protocolo PVT (Precisão total)
        st.dataframe(
            df.style.format({
                "Preço (USD)": "{:.6f}", 
                "Variação 24h (%)": "{:.2f}%"
            }).applymap(colorir_tendencia, subset=["Tendência"]),
            use_container_width=True
        )

        st.success(f"Scanner completo finalizado às {pd.Timestamp.now().strftime('%H:%M:%S')} - Fonte: CoinMarketCap")
