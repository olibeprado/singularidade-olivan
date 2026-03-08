import streamlit as st
import ccxt
import time

# Visual Nazare Interface
st.set_page_config(page_title="Olivan Singularity System", layout="wide")
st.title("🚀 Olivan Singularity System")
st.subheader("Priority Signal: Active Bybit Matrix")

def connect_bybit_with_key():

try:

# Here the code pulls the keys from the 'Secrets' drawer that you saved

key = st.secrets["BYBIT_API_KEY"]

secret = st.secrets["BYBIT_API_SECRET"]

# Official connection with Bybit
bybit = ccxt.bybit({

'apiKey': key,

'secret': secret,

'enableRateLimit': True

})

ticker = bybit.fetch_ticker('BTC/USDT')
price = ticker['last']

st.metric("BTC/USDT (Bybit)", f"$ {preco:,.2f}")

st.success("Encrypted Connection: Signal 100%")

except Exception as e:

# If there's an error here, it's because the name in the drawer is different from the code

st.error("Waiting for key synchronization... Check the Secrets.")

# Protocol Activation Button
if st.sidebar.button('Activate Monitoring'):
placeholder = st.empty()

while True:

with placeholder.container():
connect_bybit_with_key()

time.sleep(2) # Updates the price every 2 seconds

st.rerun()
else:

st.warning("Waiting for command to open the matrices...")
