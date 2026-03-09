import streamlit as st
import requests
import pandas as pd

# Chave confirmada conforme sua última correção
API_KEY_CMC = '910c7033d8e44e1984891d27e4e00222' 

st.set_page_config(page_title="Sistema Singularidade Olivan", layout="wide")
st.title("🚀 Sistema Singularidade Olivan")
st.subheader("Scanner de Força Multitemporal (Visão além do Platinum)")

def buscar_ranking_cmc(limite=100):
    url = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest"
    headers = {'Accepts': 'application/json', 'X-CMC_PRO_API_KEY': API_KEY_CMC}
    parametros = {'start': '1', 'limit': str(limite), 'convert': 'USD'}
    try:
        r = requests.get(url, headers=headers, params=parametros)
        return r.json()['data'] if r.status_code == 200 else None
    except:
        return None

def formatar_status(valor):
    if valor > 1.0: return f"FORTE 🟢 ({valor:.2f}%)"
    if valor < -1.0: return f"FRACO 🔴 ({valor:.2f}%)"
    return f"NEUTRO 🟡 ({valor:.2f}%)"

# Controle de quantidade na lateral
qtd = st.sidebar.slider("Moedas no Radar", 10, 200, 100, 500)

if st.button(f"Escanear Top {qtd} do Mercado"):
    dados = buscar_ranking_cmc(qtd)
    if dados:
        tabela = []
        for moeda in dados:
            q = moeda['quote']['USD']
            
            # Capturando todos os tempos disponíveis na API
            h1 = q['percent_change_1h']
            h24 = q['percent_change_24h']
            d7 = q['percent_change_7d']
            d30 = q['percent_change_30d']
            
            # Lógica de Força Real (Onde ela está forte ou negativa)
            forca = "CONSOLIDAÇÃO"
            if h1 > 0 and h24 > 0 and d7 > 0: forca = "ALTA FORÇA (BULLISH)"
            elif h1 < 0 and h24 < 0 and d7 < 0: forca = "FORTE QUEDA (BEARISH)"
            
            tabela.append([
                moeda['symbol'], 
                q['price'], 
                formatar_status(h1), 
                formatar_status(h24), 
                formatar_status(d7),
                formatar_status(d30),
                forca
            ])

        df = pd.DataFrame(tabela, columns=["Moeda", "Preço USD", "1 Hora", "24 Horas", "7 Dias", "30 Dias", "Sentimento"])
        
        # Estilização para ficar "Além"
        st.dataframe(
            df.style.format({"Preço USD": "{:.6f}"}),
            use_container_width=True
        )
        
        st.success(f"Radar Olivan atualizado: {pd.Timestamp.now().strftime('%H:%M:%S')} - Fonte: CoinMarketCap")
