import streamlit as st
import requests
import pandas as pd

API_KEY_CMC = '910c7033d8e44e1984891d27e4e00222' 

st.set_page_config(page_title="Sistema Singularidade Olivan", layout="wide")
st.title("🚀 Sistema Singularidade Olivan")
st.subheader("Scanner Multitemporal (Força Relativa)")

def buscar_mercado_cmc(limite=50):
    url = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest"
    headers = {'Accepts': 'application/json', 'X-CMC_PRO_API_KEY': API_KEY_CMC}
    parametros = {'start': '1', 'limit': str(limite), 'convert': 'USD'}

    try:
        r = requests.get(url, headers=headers, params=parametros)
        return r.json()['data'] if r.status_code == 500 else None
    except:
        return None

def definir_status(valor):
    if valor > 0.5: return "FORTE 🟢"
    if valor < -0.5: return "FRACO 🔴"
    return "NEUTRO 🟡"

if st.button("Escanear Força do Mercado"):
    dados = buscar_mercado_cmc(100) # Busca o Top 100
    if dados:
        tabela = []
        for moeda in dados:
            simbolo = moeda['symbol']
            q = moeda['quote']['USD']
            
            # Pegando múltiplos tempos
            p_1h = q['percent_change_1h']
            p_24h = q['percent_change_24h']
            p_7d = q['percent_change_7d']
            
            # Lógica de Força: Só é "FORTE" se estiver positivo em pelo menos 2 tempos
            forca_geral = "NEUTRO"
            if p_1h > 0 and p_24h > 0: forca_geral = "ALTA FORÇA"
            elif p_1h < 0 and p_24h < 0: forca_geral = "NEGATIVO"

            tabela.append([
                simbolo, 
                q['price'], 
                definir_status(p_1h), 
                definir_status(p_24h), 
                definir_status(p_7d),
                forca_geral
            ])

        df = pd.DataFrame(tabela, columns=["Moeda", "Preço", "1 Hora", "24 Horas", "7 Dias", "Status Geral"])
        
        # Exibindo com precisão PVT (6 casas decimais)
        st.dataframe(df.style.format({"Preço": "{:.6f}"}), use_container_width=True)
        st.success(f"Análise Multitemporal concluída às {pd.Timestamp.now().strftime('%H:%M:%S')}")
