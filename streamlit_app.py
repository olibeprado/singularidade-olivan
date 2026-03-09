import streamlit as st
import requests
import pandas as pd

# CHAVE DA SUA FOTO - VERIFICADA
API_KEY_CMC = '910c7033-d8e4-4e19-8489-1d27e4e00' 

st.set_page_config(page_title="Sistema Singularidade Olivan", layout="wide")

st.title("🚀 Sistema Singularidade Olivan")
st.subheader("Scanner de Tendência - Versão Otimizada")

# Lista de moedas
moedas_lista = ["BTC", "ETH", "SOL", "XRP", "ADA", "FET", "BNB", "RAY", "TAI", "KSM"]

def buscar_tudo_uma_vez(lista_simbolos):
    url = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest"
    headers = {
        'Accepts': 'application/json',
        'X-CMC_PRO_API_KEY': API_KEY_CMC,
    }
    # Transformamos a lista em uma string separada por vírgula: "BTC,ETH,SOL..."
    parametros = {
        'symbol': ','.join(lista_simbolos),
        'convert': 'USD'
    }

    try:
        r = requests.get(url, headers=headers, params=parametros)
        if r.status_code == 200:
            return r.json()
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

if st.button("Escanear Mercado Agora"):
    dados_api = buscar_tudo_uma_vez(moedas_lista)
    
    if dados_api:
        tabela = []
        for moeda in moedas_lista:
            try:
                info = dados_api['data'][moeda]['quote']['USD']
                preco = info['price']
                variacao = info['percent_change_24h']
                
                # Definindo a tendência
                if variacao > 0.5:
                    sinal = "ALTA"
                elif variacao < -0.5:
                    sinal = "QUEDA"
                else:
                    sinal = "NEUTRO"
                
                tabela.append([moeda, preco, variacao, sinal])
            except:
                tabela.append([moeda, None, None, "NÃO ENCONTRADO"])

        df = pd.DataFrame(tabela, columns=["Moeda", "Preço (USD)", "Variação 24h (%)", "Tendência"])
        
        # Exibindo a tabela com o seu protocolo de precisão (centavos)
        st.dataframe(
            df.style.format({"Preço (USD)": "{:.6f}", "Variação 24h (%)": "{:.2f}%"})
            .applymap(colorir_tendencia, subset=["Tendência"]),
            use_container_width=True
        )

        st.success(f"Consulta finalizada via CoinMarketCap às {pd.Timestamp.now().strftime('%H:%M:%S')}")
