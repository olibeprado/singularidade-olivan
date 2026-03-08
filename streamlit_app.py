import streamlit as st
import requests
import pandas as pd
import time

st.set_page_config(page_title="Sistema Singularidade Olivan", layout="wide")

st.title("🚀 Sistema Singularidade Olivan")
st.subheader("Radar Global de Criptomoedas")

# lista maior de criptos
criptos = "bitcoin,ethereum,solana,ripple,cardano,binancecoin,tron,polkadot,chainlink,polygon,avalanche-2,litecoin,uniswap,stellar,monero"

def pegar_dados():

    url = f"https://api.coingecko.com/api/v3/simple/price?ids={criptos}&vs_currencies=usd"

    r = requests.get(url)
    data = r.json()

    tabela = []

    for moeda in data:
        preco = data[moeda]["usd"]
        tabela.append([moeda.upper(), preco])

    df = pd.DataFrame(tabela, columns=["Moeda", "Preço USD"])

    return df


if st.sidebar.button("Ativar Monitoramento"):

    placeholder = st.empty()

    while True:

        try:

            df = pegar_dados()

            with placeholder.container():

                st.dataframe(df, use_container_width=True)

                for i in range(len(df)):
                    st.metric(df["Moeda"][i], f"${df['Preço USD'][i]:,.2f}")

        except Exception as e:
            st.error(f"Erro detectado: {e}")

        time.sleep(10)

else:
    st.warning("Clique em 'Ativar Monitoramento' no menu lateral")
