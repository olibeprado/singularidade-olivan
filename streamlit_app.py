import streamlit as st
import requests
import pandas as pd

# CONFIGURAÇÃO DA CHAVE - COPIADA DIRETO DA SUA FOTO
API_KEY_CMC = '910c7033-d8e4-4e19-8489-1d27e4e00' 

st.set_page_config(page_title="Sistema Singularidade Olivan", layout="wide")

st.title("🚀 Sistema Singularidade Olivan")
st.subheader("Scanner de Tendência - Modo CoinMarketCap")

# Lista de moedas atualizada
moedas = ["BTC", "ETH", "SOL", "XRP", "ADA", "FET", "BNB", "RAY", "TAI", "KSM"]

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
            # O CMC organiza os dados por símbolo
            info = dados['data'][simbolo.upper()]['quote']['USD']
            
            preco = info['price']
            variacao = info['percent_change_24h']
            
            # Lógica de tendência baseada na força do movimento (24h)
            if variacao > 0.5:
                sinal = "ALTA"
            elif variacao < -0.5:
                sinal = "QUEDA"
            else:
                sinal = "NEUTRO"
                
            return preco, variacao, sinal
        else:
            # Se der erro 401 é porque a chave está errada
            return None, None, f"ERRO {r.status_code}"
    except Exception as e:
        return None, None, "FALHA"

def colorir_tendencia(valor):
    if valor == "ALTA":
        return "color: #00ff00; font-weight: bold" # Verde neon
    elif valor == "QUEDA":
        return "color: #ff4b4b; font-weight: bold" # Vermelho
    return "color: #ffa500" # Laranja para Neutro

if st.button("Escanear Mercado Agora"):
    tabela = []
    
    # Barra de progresso para dar um toque profissional
    progresso = st.progress(0)
    for i, moeda in enumerate(moedas):
        preco, var, sinal = pegar_dados_cmc(moeda)
        tabela.append([moeda, preco, var, sinal])
        progresso.progress((i + 1) / len(moedas))
    
    # Criando o DataFrame
    df = pd.DataFrame(tabela, columns=["Moeda", "Preço (USD)", "Variação 24h (%)", "Tendência"])
    
    # Exibindo a tabela com estilo
    st.dataframe(
        df.style.applymap(colorir_tendencia, subset=["Tendência"]),
        use_container_width=True
    )

    st.success(f"Consulta finalizada com sucesso via CoinMarketCap às {pd.Timestamp.now().strftime('%H:%M:%S')}")
