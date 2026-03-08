import streamlit as st
import requests

st.title("Teste API CoinGecko")

url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"

try:
    r = requests.get(url)
    data = r.json()

    st.write("Resposta da API:")
    st.write(data)

    if "bitcoin" in data:
        preco = data["bitcoin"]["usd"]
        st.success(f"Preço BTC: ${preco}")
    else:
        st.error("Bitcoin não veio na resposta")

except Exception as e:
    st.error(e)
