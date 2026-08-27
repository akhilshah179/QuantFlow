import axios from 'axios';
import WebSocket from 'ws';
import { MarketDataProvider, StockQuote, TickUpdate, MarketOverviewData, ScreenerFilters } from './MarketDataProvider';
import { Candle } from '../indicators';
import { MarketDataNormalizer, BinanceKlinePayload, BinanceTradePayload } from './MarketDataNormalizer';

export type BinanceConnectionStatus = 'LIVE' | 'RECONNECTING' | 'DISCONNECTED' | 'UNAVAILABLE';

export class BinanceCryptoDataProvider implements MarketDataProvider {
  private activeStreams: Set<string> = new Set([
    'btcusdt@kline_1m', 'btcusdt@trade',
    'ethusdt@kline_1m', 'ethusdt@trade',
    'solusdt@kline_1m', 'solusdt@trade',
    'bnbusdt@kline_1m', 'bnbusdt@trade',
    'xrpusdt@kline_1m', 'xrpusdt@trade',
    'adausdt@kline_1m', 'adausdt@trade',
    'avaxusdt@kline_1m', 'avaxusdt@trade',
    'dogeusdt@kline_1m', 'dogeusdt@trade',
  ]);

  private liveQuotesCache: Map<string, StockQuote> = new Map();
  private liveCandlesCache: Map<string, Candle> = new Map();
  private onTickCallbacks: Set<(tick: TickUpdate) => void> = new Set();
  
  private ws: WebSocket | null = null;
  private wsReconnectTimer: NodeJS.Timeout | null = null;
  private isStreaming = false;
  private status: BinanceConnectionStatus = 'DISCONNECTED';
  private reqIdCounter = 1;

  constructor() {
    // Auto-start streaming on instantiation
    this.startTickStream(() => {});
  }

  public getStatus(): BinanceConnectionStatus {
    return this.status;
  }

  public async getQuote(symbol: string): Promise<StockQuote | null> {
    const binanceSym = MarketDataNormalizer.toBinanceSymbol(symbol);
    const { symbol: normSymbol, displaySymbol, name } = MarketDataNormalizer.normalizeSymbol(binanceSym);

    // 1. Check live WebSocket cache (valid for 10s)
    const cached = this.liveQuotesCache.get(normSymbol) || this.liveQuotesCache.get(binanceSym);
    if (cached && Date.now() - cached.timestamp < 10000) {
      return cached;
    }

    // 2. Query Binance Public 24hr Ticker REST API (No API Key)
    try {
      const response = await axios.get(`https://api.binance.com/api/v3/ticker/24hr`, {
        params: { symbol: binanceSym },
        timeout: 4000,
      });

      const data = response.data;
      if (data && data.lastPrice) {
        const price = parseFloat(data.lastPrice);
        const change = parseFloat(data.priceChange);
        const changePercent = parseFloat(data.priceChangePercent);
        const dayHigh = parseFloat(data.highPrice);
        const dayLow = parseFloat(data.lowPrice);
        const volume = parseFloat(data.volume);
        const prevClose = parseFloat(data.prevClosePrice) || (price - change);

        const quote: StockQuote = {
          symbol: binanceSym,
          name: `${name} (${displaySymbol})`,
          exchange: 'BINANCE_SPOT',
          country: 'GLOBAL',
          currency: 'USDT',
          sector: 'Digital Assets',
          price,
          change: Number(change.toFixed(4)),
          changePercent: Number(changePercent.toFixed(2)),
          open: parseFloat(data.openPrice) || prevClose,
          previousClose: Number(prevClose.toFixed(4)),
          dayHigh,
          dayLow,
          volume: Math.round(volume),
          marketCap: price * 19500000,
          marketStatus: 'LIVE',
          dataQuality: 'REALTIME',
          isMock: false,
          timestamp: Date.now(),
        };
        (quote as any).displaySymbol = displaySymbol;

        this.liveQuotesCache.set(binanceSym, quote);
        this.liveQuotesCache.set(normSymbol, quote);
        return quote;
      }
    } catch (err: any) {
      console.warn(`[BinanceCryptoProvider] REST quote fetch failed for ${binanceSym}: ${err?.message}`);
    }

    if (cached) return cached;
    return null;
  }

  public async getHistoricalCandles(symbol: string, timeframe: string, limit: number = 300): Promise<Candle[]> {
    const binanceSym = MarketDataNormalizer.toBinanceSymbol(symbol);

    // Map QuantFlow/Binance timeframe string to valid Binance interval
    const validIntervals = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'];
    let interval = timeframe.toLowerCase();
    if (timeframe === '1H') interval = '1h';
    else if (timeframe === '4H') interval = '4h';
    else if (timeframe === '1D') interval = '1d';
    else if (timeframe === '1W') interval = '1w';
    else if (timeframe === '1M') interval = '1M';

    if (!validIntervals.includes(interval)) {
      interval = '1m';
    }

    // Query Binance Public Klines REST API (No API Key)
    try {
      const response = await axios.get(`https://api.binance.com/api/v3/klines`, {
        params: {
          symbol: binanceSym,
          interval,
          limit: Math.min(limit, 1000),
        },
        timeout: 6000,
      });

      if (Array.isArray(response.data) && response.data.length > 0) {
        return MarketDataNormalizer.normalizeRestKlines(response.data);
      }
    } catch (err: any) {
      console.warn(`[BinanceCryptoProvider] Failed to fetch Binance historical klines for ${binanceSym}: ${err?.message}`);
    }

    // Return empty array if data unavailable (No fake data!)
    return [];
  }

  public async searchStocks(query: string) {
    const q = query.toUpperCase().trim().replace('/', '');
    const activeSymbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'AVAXUSDT', 'DOGEUSDT'];
    const matched = activeSymbols.filter((sym) => sym.includes(q) || MarketDataNormalizer.normalizeSymbol(sym).displaySymbol.includes(q));

    const quotes = await Promise.all(matched.map((sym) => this.getQuote(sym)));

    return matched.map((sym, idx) => {
      const qObj = quotes[idx];
      const norm = MarketDataNormalizer.normalizeSymbol(sym);
      return {
        symbol: sym,
        name: `${norm.name} (${norm.displaySymbol})`,
        exchange: 'BINANCE_SPOT',
        price: qObj ? qObj.price : 0,
        changePercent: qObj ? qObj.changePercent : 0,
        currency: 'USDT',
        displaySymbol: norm.displaySymbol,
      };
    });
  }

  public async getMarketOverview(): Promise<MarketOverviewData> {
    const activeSymbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'AVAXUSDT', 'DOGEUSDT'];
    const quotes = (await Promise.all(activeSymbols.map((s) => this.getQuote(s)))).filter((q): q is StockQuote => q !== null);
    const sorted = [...quotes].sort((a, b) => b.changePercent - a.changePercent);

    return {
      indices: [
        { name: 'Bitcoin (BTC/USDT)', symbol: 'BTCUSDT', value: quotes[0]?.price || 0, change: quotes[0]?.change || 0, changePercent: quotes[0]?.changePercent || 0, marketStatus: 'LIVE' },
        { name: 'Ethereum (ETH/USDT)', symbol: 'ETHUSDT', value: quotes[1]?.price || 0, change: quotes[1]?.change || 0, changePercent: quotes[1]?.changePercent || 0, marketStatus: 'LIVE' },
        { name: 'Solana (SOL/USDT)', symbol: 'SOLUSDT', value: quotes[2]?.price || 0, change: quotes[2]?.change || 0, changePercent: quotes[2]?.changePercent || 0, marketStatus: 'LIVE' },
      ],
      topGainers: sorted.slice(0, 5),
      topLosers: [...sorted].reverse().slice(0, 5),
      mostActive: quotes.slice(0, 8),
      sectorPerformance: [
        { sector: 'Layer 1 Digital Assets', changePercent: quotes[0]?.changePercent || 0 },
        { sector: 'DeFi Protocols', changePercent: quotes[1]?.changePercent || 0 },
        { sector: 'Smart Contract Platforms', changePercent: quotes[2]?.changePercent || 0 },
      ],
    };
  }

  public async getScreenerStocks(filters: ScreenerFilters): Promise<StockQuote[]> {
    const activeSymbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'AVAXUSDT', 'DOGEUSDT'];
    const quotes = (await Promise.all(activeSymbols.map((s) => this.getQuote(s)))).filter((q): q is StockQuote => q !== null);
    return quotes;
  }

  public subscribeSymbol(symbol: string, interval: string = '1m'): void {
    const binanceSym = MarketDataNormalizer.toBinanceSymbol(symbol).toLowerCase();
    const klineStream = `${binanceSym}@kline_${interval.toLowerCase()}`;
    const tradeStream = `${binanceSym}@trade`;

    const newStreams = [klineStream, tradeStream].filter((st) => !this.activeStreams.has(st));
    if (newStreams.length === 0) return;

    newStreams.forEach((st) => this.activeStreams.add(st));

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const payload = {
        method: 'SUBSCRIBE',
        params: newStreams,
        id: this.reqIdCounter++,
      };
      this.ws.send(JSON.stringify(payload));
    }
  }

  public unsubscribeSymbol(symbol: string, interval: string = '1m'): void {
    const binanceSym = MarketDataNormalizer.toBinanceSymbol(symbol).toLowerCase();
    const klineStream = `${binanceSym}@kline_${interval.toLowerCase()}`;
    const tradeStream = `${binanceSym}@trade`;

    const streamsToRemove = [klineStream, tradeStream].filter((st) => this.activeStreams.has(st));
    if (streamsToRemove.length === 0) return;

    streamsToRemove.forEach((st) => this.activeStreams.delete(st));

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const payload = {
        method: 'UNSUBSCRIBE',
        params: streamsToRemove,
        id: this.reqIdCounter++,
      };
      this.ws.send(JSON.stringify(payload));
    }
  }

  public startTickStream(onTick: (tick: TickUpdate) => void): void {
    this.onTickCallbacks.add(onTick);

    if (!this.isStreaming) {
      this.isStreaming = true;
      this.connectBinanceWebSocket();
    }
  }

  private connectBinanceWebSocket(): void {
    if (this.ws) {
      try { this.ws.close(); } catch {}
    }

    const wsUrl = `wss://stream.binance.com:9443/stream`;
    this.status = 'RECONNECTING';
    console.log(`[BinanceCryptoProvider] Connecting to Binance Combined Public WebSocket: ${wsUrl}`);

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.on('open', () => {
        this.status = 'LIVE';
        console.log('[BinanceCryptoProvider] Connected to Binance Public WebSocket (wss://stream.binance.com:9443)');

        // Restore active stream subscriptions
        if (this.activeStreams.size > 0 && this.ws && this.ws.readyState === WebSocket.OPEN) {
          const params = Array.from(this.activeStreams);
          const payload = {
            method: 'SUBSCRIBE',
            params,
            id: this.reqIdCounter++,
          };
          this.ws.send(JSON.stringify(payload));
        }
      });

      this.ws.on('message', (data: WebSocket.RawData) => {
        try {
          const raw = JSON.parse(data.toString());
          const payload = raw.data || raw;

          if (!payload || !payload.e) return;

          // 1. Handle Kline events (@kline)
          if (payload.e === 'kline' && payload.k) {
            const klinePayload: BinanceKlinePayload = payload;
            const { tick, quote, candle, isClosed } = MarketDataNormalizer.normalizeKline(klinePayload);

            // Update caches
            this.liveQuotesCache.set(quote.symbol, quote);
            this.liveCandlesCache.set(quote.symbol, candle);

            // Emit to tick subscribers
            this.onTickCallbacks.forEach((cb) => cb(tick));
          }

          // 2. Handle Trade events (@trade)
          if (payload.e === 'trade') {
            const tradePayload: BinanceTradePayload = payload;
            const { tick, price } = MarketDataNormalizer.normalizeTrade(tradePayload);

            // Update latest quote price dynamically
            const existing = this.liveQuotesCache.get(tick.symbol);
            if (existing) {
              existing.price = price;
              existing.timestamp = Date.now();
              this.liveQuotesCache.set(tick.symbol, existing);
            }

            this.onTickCallbacks.forEach((cb) => cb(tick));
          }
        } catch (err: any) {
          // Ignore parse errors
        }
      });

      this.ws.on('error', (err: Error) => {
        console.warn('[BinanceCryptoProvider] Binance WS Error, reconnecting...', err.message);
        this.status = 'RECONNECTING';
        this.scheduleWSReconnect();
      });

      this.ws.on('close', () => {
        console.warn('[BinanceCryptoProvider] Binance WS closed, scheduling reconnect...');
        this.status = 'DISCONNECTED';
        this.scheduleWSReconnect();
      });
    } catch (err: any) {
      console.warn('[BinanceCryptoProvider] Failed to open Binance WS socket', err?.message);
      this.status = 'UNAVAILABLE';
      this.scheduleWSReconnect();
    }
  }

  private scheduleWSReconnect(): void {
    if (this.wsReconnectTimer) return;
    this.wsReconnectTimer = setTimeout(() => {
      this.wsReconnectTimer = null;
      if (this.isStreaming) {
        this.connectBinanceWebSocket();
      }
    }, 4000);
  }

  public stopTickStream(): void {
    this.isStreaming = false;
    this.status = 'DISCONNECTED';
    this.onTickCallbacks.clear();

    if (this.wsReconnectTimer) {
      clearTimeout(this.wsReconnectTimer);
      this.wsReconnectTimer = null;
    }
    if (this.ws) {
      try { this.ws.close(); } catch {}
      this.ws = null;
    }
  }
}

export const binanceCryptoDataProvider = new BinanceCryptoDataProvider();
