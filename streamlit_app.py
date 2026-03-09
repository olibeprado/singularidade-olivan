import streamlit as st
import requests
import pandas as pd

# 1. COLE SUA CHAVE AQUI
API_KEY_CMC = '910c7033-d8e4-4e19-8489-1d27e4e00' # Use a chave que você copiou

st.set_page_config(page_title="Sistema Singularidade Olivan", layout="wide")

st.title("🚀 Sistema Singularidade Olivan")
st.subheader("Scanner de Tendência - Modo CoinMarketCap")

# Lista de moedas (Usando os símbolos que o CMC entende)
moedas = ["BTC", "ETH", "SOL", "XRP", "ADA", "FET", "BNB", "RAY", "TAI", "KSM", "RENDER"]

def pegar_dados_cmc(simbolo):
    url = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest"
    headers = {
        'Accepts': 'application/json',
        'X-CMC_PRO_API_KEY': API_KEY_CMC,
    }
    parametros = {
        'symbol': simbolo.upper(),
        'convert': 'USD'
    }

    try:
        r = requests.get(url, headers=headers, params=parametros)
        if r.status_code == 200:
            dados = r.json()
            info = dados['data'][simbolo.upper()]['quote']['USD']
            
            preco = info['price']
            # Como a API gratuita não dá histórico pra MME fácil, 
            # vamos usar a variação de 24h para definir a tendência no teste
            variacao = info['percent_change_24h']
            
            if variacao > 0.5:
                sinal = "ALTA"
            elif variacao < -0.5:
                sinal = "QUEDA"
            else:
                sinal = "NEUTRO"
                
            return preco, variacao, sinal
        else:
            return None, None, "ERRO API"
    except:
        return None, None, "FALHA"

def colorir(valor):
    if valor == "ALTA":
        return "color: green"
    elif valor == "QUEDA":
        return "color: red"
    return "color: orange"

if st.button("Escanear Mercado"):
    tabela = []
    
    for moeda in moedas:
        preco, var, sinal = pegar_dados_cmc(moeda)
        # No PVT: Preço exato com centavos
        tabela.append([moeda, preco, var, sinal])
    
    df = pd.DataFrame(tabela, columns=["Moeda", "Preço", "Variação 24h", "Tendência"])
    
    # Exibe a tabela com as cores que você criou
    st.dataframe(df.style.applymap(colorir, subset=["Tendência"]), use_container_width=True)

    # Lembrete do protocolo Nazare
    st.write(f"Consulta realizada às: {pd.Timestamp.now().strftime('%H:%M:%S')} - Fonte: CoinMarketCap")
