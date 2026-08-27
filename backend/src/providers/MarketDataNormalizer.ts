import { StockQuote, TickUpdate } from './MarketDataProvider';
import { Candle } from '../indicators';

export interface BinanceKlinePayload {
  e: string; // "kline"
  E: number; // Event time
  s: string; // Symbol "BTCUSDT"
  k: {
    t: number; // Candle start time
    T: number; // Candle close time
    s: string; // Symbol
    i: string; // Interval "1m"
    f: number;
    L: number;
    o: string; // Open
    c: string; // Close
    h: string; // High
    l: string; // Low
    v: string; // Base asset volume
    n: number; // Number of trades
    x: boolean; // Is closed
    q: string; // Quote asset volume
    V: string;
    Q: string;
    B: string;
  };
}

export interface BinanceTradePayload {
  e: string; // "trade"
  E: number; // Event time
  s: string; // Symbol "BTCUSDT"
  t: number; // Trade ID
  p: string; // Price
  q: string; // Quantity
  b: number; // Buyer order ID
  a: number; // Seller order ID
  T: number; // Trade time
  m: boolean; // Is buyer market maker
  M: boolean;
}

export class MarketDataNormalizer {
  private static symbolInfoMap: Record<string, { symbol: string; displaySymbol: string; name: string }> = {
    'BTCUSDT': { symbol: 'BTCUSDT', displaySymbol: 'BTC/USDT', name: 'Bitcoin' },
    'ETHUSDT': { symbol: 'ETHUSDT', displaySymbol: 'ETH/USDT', name: 'Ethereum' },
    'SOLUSDT': { symbol: 'SOLUSDT', displaySymbol: 'SOL/USDT', name: 'Solana' },
    'BNBUSDT': { symbol: 'BNBUSDT', displaySymbol: 'BNB/USDT', name: 'Binance Coin' },
    'XRPUSDT': { symbol: 'XRPUSDT', displaySymbol: 'XRP/USDT', name: 'XRP' },
    'ADAUSDT': { symbol: 'ADAUSDT', displaySymbol: 'ADA/USDT', name: 'Cardano' },
    'AVAXUSDT': { symbol: 'AVAXUSDT', displaySymbol: 'AVAX/USDT', name: 'Avalanche' },
    'DOGEUSDT': { symbol: 'DOGEUSDT', displaySymbol: 'DOGE/USDT', name: 'Dogecoin' },
    'DOTUSDT': { symbol: 'DOTUSDT', displaySymbol: 'DOT/USDT', name: 'Polkadot' },
    'LINKUSDT': { symbol: 'LINKUSDT', displaySymbol: 'LINK/USDT', name: 'Chainlink' },
    'NEARUSDT': { symbol: 'NEARUSDT', displaySymbol: 'NEAR/USDT', name: 'NEAR Protocol' },
  };

  public static toBinanceSymbol(input: string): string {
    if (!input) return 'BTCUSDT';
    const upper = input.toUpperCase().trim().replace('/', '').replace(':', '');
    if (upper.endsWith('USDT')) return upper;
    if (upper.endsWith('USD')) return `${upper}T`;
    return `${upper}USDT`;
  }

  public static normalizeSymbol(binanceSymbol: string): { symbol: string; displaySymbol: string; name: string } {
    const upper = binanceSymbol.toUpperCase().trim();
    if (this.symbolInfoMap[upper]) {
      return this.symbolInfoMap[upper];
    }
    const clean = upper.replace('USDT', '');
    return { symbol: upper, displaySymbol: `${clean}/USDT`, name: clean };
  }

  public static normalizeTrade(raw: BinanceTradePayload): { tick: TickUpdate; price: number; quantity: number } {
    const { symbol, displaySymbol } = this.normalizeSymbol(raw.s);
    const price = parseFloat(raw.p);
    const quantity = parseFloat(raw.q);
    const timestampSec = Math.floor(raw.T / 1000);

    const tick: TickUpdate = {
      type: 'PRICE_UPDATE',
      symbol,
      exchange: 'BINANCE_SPOT',
      price,
      change: 0,
      changePercent: 0,
      volume: Math.round(quantity),
      marketStatus: 'LIVE',
      dataQuality: 'REALTIME',
      isMock: false,
      timestamp: timestampSec,
      source: 'Binance',
    };

    (tick as any).displaySymbol = displaySymbol;
    (tick as any).tradeQuantity = quantity;

    return { tick, price, quantity };
  }

  public static normalizeKline(raw: BinanceKlinePayload): {
    tick: TickUpdate;
    quote: StockQuote;
    candle: Candle;
    isClosed: boolean;
  } {
    const k = raw.k;
    const { symbol, displaySymbol, name } = this.normalizeSymbol(k.s);

    const open = parseFloat(k.o);
    const high = parseFloat(k.h);
    const low = parseFloat(k.l);
    const close = parseFloat(k.c);
    const volume = parseFloat(k.v);
    const isClosed = k.x;
    const timestampSec = Math.floor(k.t / 1000);

    const change = Number((close - open).toFixed(4));
    const changePercent = open > 0 ? Number((((close - open) / open) * 100).toFixed(2)) : 0;

    const candle: Candle = {
      timestamp: timestampSec,
      open,
      high,
      low,
      close,
      volume,
    };

    const quote: StockQuote = {
      symbol,
      name,
      exchange: 'BINANCE_SPOT',
      country: 'GLOBAL',
      currency: 'USDT',
      sector: 'Digital Assets',
      price: close,
      change,
      changePercent,
      open,
      previousClose: open,
      dayHigh: high,
      dayLow: low,
      volume: Math.round(volume),
      marketCap: close * 19500000,
      marketStatus: 'LIVE',
      dataQuality: 'REALTIME',
      isMock: false,
      timestamp: Date.now(),
    };
    (quote as any).displaySymbol = displaySymbol;

    const tick: TickUpdate = {
      type: 'PRICE_UPDATE',
      symbol,
      exchange: 'BINANCE_SPOT',
      price: close,
      change,
      changePercent,
      volume: Math.round(volume),
      marketStatus: 'LIVE',
      dataQuality: 'REALTIME',
      isMock: false,
      timestamp: timestampSec,
      source: 'Binance',
    };
    (tick as any).displaySymbol = displaySymbol;
    (tick as any).candle = candle;
    (tick as any).isClosed = isClosed;
    (tick as any).interval = k.i;

    return { tick, quote, candle, isClosed };
  }

  public static normalizeRestKlines(binanceKlines: any[]): Candle[] {
    if (!Array.isArray(binanceKlines)) return [];
    return binanceKlines.map((item: any) => ({
      timestamp: Math.floor(item[0] / 1000), // Candle start time in seconds
      open: parseFloat(item[1]),
      high: parseFloat(item[2]),
      low: parseFloat(item[3]),
      close: parseFloat(item[4]),
      volume: parseFloat(item[5]),
    }));
  }

  private static forexSpreadPipsMap: Record<string, number> = {
    'EURUSD': 0.00015,
    'GBPUSD': 0.00020,
    'USDJPY': 0.020,
    'USDCHF': 0.00020,
    'AUDUSD': 0.00018,
    'USDCAD': 0.00020,
    'NZDUSD': 0.00025,
    'USDINR': 0.030,
  };

  public static toForexSymbol(input: string): string {
    if (!input) return 'EUR/USD';
    const clean = input.toUpperCase().trim().replace(':', '');
    if (clean.includes('/')) return clean;
    if (clean.length === 6) {
      return `${clean.substring(0, 3)}/${clean.substring(3)}`;
    }
    return clean;
  }

  public static fromForexSymbol(tdSymbol: string): string {
    if (!tdSymbol) return 'EURUSD';
    return tdSymbol.toUpperCase().trim().replace('/', '').replace(':', '');
  }

  public static toTwelveDataSymbol(input: string): string {
    return this.toForexSymbol(input);
  }

  public static fromTwelveDataSymbol(tdSymbol: string): string {
    return this.fromForexSymbol(tdSymbol);
  }

  public static formatForexPrice(symbol: string, price: number): number {
    const upper = this.fromForexSymbol(symbol);
    const decimals = upper.includes('JPY') || upper.includes('INR') ? 3 : 5;
    return Number(price.toFixed(decimals));
  }

  public static getForexBidAsk(symbol: string, price: number, rawBid?: number, rawAsk?: number): { bid: number | null; ask: number | null; spreadPips: number | null } {
    const upper = this.fromForexSymbol(symbol);
    if (rawBid !== undefined && rawAsk !== undefined && rawBid > 0 && rawAsk > 0) {
      const pipsFactor = upper.includes('JPY') || upper.includes('INR') ? 100 : 10000;
      const spreadPips = Number(((rawAsk - rawBid) * pipsFactor).toFixed(1));
      return { bid: rawBid, ask: rawAsk, spreadPips };
    }
    return { bid: null, ask: null, spreadPips: null };
  }

  public static normalizeForexTimeSeries(timeSeriesValues: any[]): Candle[] {
    if (!Array.isArray(timeSeriesValues)) return [];
    const candles: Candle[] = [];
    for (let i = timeSeriesValues.length - 1; i >= 0; i--) {
      const item = timeSeriesValues[i];
      const open = parseFloat(item.open);
      const high = parseFloat(item.high);
      const low = parseFloat(item.low);
      const close = parseFloat(item.close);
      const volume = item.volume ? parseFloat(item.volume) : 100000;
      const timestamp = Math.floor(new Date(item.datetime).getTime() / 1000);
      if (!isNaN(timestamp) && !isNaN(open) && !isNaN(close)) {
        candles.push({ timestamp, open, high, low, close, volume });
      }
    }
    return candles;
  }

  public static normalizeTwelveDataTimeSeries(timeSeriesValues: any[]): Candle[] {
    return this.normalizeForexTimeSeries(timeSeriesValues);
  }

}

