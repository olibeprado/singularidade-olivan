import { NextRequest, NextResponse } from "next/server";

type Candle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

function mapBinanceInterval(interval: string) {
  return interval;
}

function mapBybitInterval(interval: string) {
  const map: Record<string, string> = {
    "1m": "1",
    "3m": "3",
    "5m": "5",
    "15m": "15",
    "30m": "30",
    "1h": "60",
    "2h": "120",
    "4h": "240",
    "6h": "360",
    "12h": "720",
    "1d": "D",
    "1w": "W",
    "1M": "M",
  };
  return map[interval] ?? "1";
}

async function fetchBinance(symbol: string, interval: string, limit: number) {
  const url =
    `https://data-api.binance.vision/api/v3/klines` +
    `?symbol=${symbol}&interval=${mapBinanceInterval(interval)}&limit=${limit}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Binance failed");

  const raw = await res.json();

  const candles: Candle[] = raw.map((k: any[]) => ({
    time: new Date(k[0]).toISOString().slice(0, 19) + "Z",
    open: Number(k[1]),
    high: Number(k[2]),
    low: Number(k[3]),
    close: Number(k[4]),
    volume: Number(k[5]),
  }));

  return { source: "binance", candles };
}

async function fetchBybit(symbol: string, interval: string, limit: number) {
  const url =
    `https://api.bybit.com/v5/market/kline` +
    `?category=spot&symbol=${symbol}&interval=${mapBybitInterval(interval)}&limit=${limit}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Bybit failed");

  const raw = await res.json();

  if (!raw?.result?.list) {
    throw new Error("Bybit empty");
  }

  const candles: Candle[] = raw.result.list
    .map((k: string[]) => ({
      time: new Date(Number(k[0])).toISOString().slice(0, 19) + "Z",
      open: Number(k[1]),
      high: Number(k[2]),
      low: Number(k[3]),
      close: Number(k[4]),
      volume: Number(k[5]),
    }))
    .reverse();

  return { source: "bybit", candles };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const symbol = (searchParams.get("symbol") || "BTCUSDT").toUpperCase();
  const interval = searchParams.get("interval") || "1m";
  const limit = Number(searchParams.get("limit") || "200");

  try {
    const data = await fetchBinance(symbol, interval, limit);
    return NextResponse.json(data);
  } catch {}

  try {
    const data = await fetchBybit(symbol, interval, limit);
    return NextResponse.json(data);
  } catch {}

  return NextResponse.json(
    { error: "Par não encontrado na Binance nem na Bybit." },
    { status: 404 }
  );
}
