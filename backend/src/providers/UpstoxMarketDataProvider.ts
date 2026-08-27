import axios from 'axios';
import WebSocket from 'ws';
import * as protobuf from 'protobufjs';
import { MarketDataProvider, StockQuote, TickUpdate, MarketOverviewData, ScreenerFilters } from './MarketDataProvider';
import { Candle } from '../indicators';
import { config } from '../config';
import { instrumentService } from '../services/instrumentService';
import { upstoxInstrumentService } from '../services/upstoxInstrumentService';

// Upstox V3 Market Data Feed Protobuf Schema Text
const UPSTOX_PROTO_TEXT = `
syntax = "proto3";
package com.upstox.marketdata.feed.v3;

enum Type {
  initial_feed = 0;
  live_feed = 1;
}

message FeedResponse {
  Type type = 1;
  map<string, Feed> feeds = 2;
  int64 currentTs = 3;
}

message Feed {
  LTPC ltpc = 1;
  FullFeed fullFeed = 2;
}

message LTPC {
  double ltp = 1;
  int64 ltt = 2;
  int64 ltq = 3;
  double cp = 4;
}

message FullFeed {
  MarketFullFeed marketFF = 1;
  IndexFullFeed indexFF = 2;
}

message MarketFullFeed {
  LTPC ltpc = 1;
  MarketLevel marketLevel = 2;
  OHLC ohlc = 3;
}

message IndexFullFeed {
  LTPC ltpc = 1;
  OHLC ohlc = 2;
}

message MarketLevel {
  repeated Quote quote = 1;
}

message Quote {
  int32 bidQ = 1;
  double bidP = 2;
  int32 askQ = 3;
  double askP = 4;
}

message OHLC {
  double open = 1;
  double high = 2;
  double low = 3;
  double close = 4;
}
`;

const parsedProto = protobuf.parse(UPSTOX_PROTO_TEXT);
const FeedResponseType = parsedProto.root.lookupType('com.upstox.marketdata.feed.v3.FeedResponse');

export class UpstoxMarketDataProvider implements MarketDataProvider {
  private apiKey: string;
  private accessToken: string;
  private baseUrl = 'https://api.upstox.com/v3';
  private ws: WebSocket | null = null;
  private subscribedSymbols: Set<string> = new Set(['RELIANCE:NSE', 'TCS:NSE', 'INFY:NSE', 'HDFCBANK:NSE']);
  private onTickCallback: ((tick: TickUpdate) => void) | null = null;
  private isConnecting = false;

  private instrumentKeyMap: Record<string, string> = {
    'RELIANCE': 'NSE_EQ|INE002A01018',
    'RELIANCE:NSE': 'NSE_EQ|INE002A01018',
    'TCS': 'NSE_EQ|INE467B01029',
    'TCS:NSE': 'NSE_EQ|INE467B01029',
    'INFY': 'NSE_EQ|INE009A01021',
    'INFY:NSE': 'NSE_EQ|INE009A01021',
    'HDFCBANK': 'NSE_EQ|INE040A01034',
    'HDFCBANK:NSE': 'NSE_EQ|INE040A01034',
    'ICICIBANK': 'NSE_EQ|INE090A01021',
    'ICICIBANK:NSE': 'NSE_EQ|INE090A01021',
    'SBIN': 'NSE_EQ|INE062A01020',
    'SBIN:NSE': 'NSE_EQ|INE062A01020',
    'TATAMOTORS': 'NSE_EQ|INE155A01022',
    'TATAMOTORS:NSE': 'NSE_EQ|INE155A01022',
    'BHARTIARTL': 'NSE_EQ|INE397D01024',
    'BHARTIARTL:NSE': 'NSE_EQ|INE397D01024',
  };

  private reverseKeyMap: Record<string, string> = {
    'NSE_EQ|INE002A01018': 'RELIANCE:NSE',
    'NSE_EQ|INE467B01029': 'TCS:NSE',
    'NSE_EQ|INE009A01021': 'INFY:NSE',
    'NSE_EQ|INE040A01034': 'HDFCBANK:NSE',
    'NSE_EQ|INE090A01021': 'ICICIBANK:NSE',
    'NSE_EQ|INE062A01020': 'SBIN:NSE',
    'NSE_EQ|INE155A01022': 'TATAMOTORS:NSE',
    'NSE_EQ|INE397D01024': 'BHARTIARTL:NSE',
  };

  constructor(apiKey?: string, accessToken?: string) {
    this.apiKey = apiKey || config.upstoxApiKey || '';
    this.accessToken = accessToken || config.upstoxAccessToken || '';
    if (this.accessToken) {
      this.initWebSocket();
    }
  }

  private getInstrumentKey(symbol: string): string {
    const dynamicKey = upstoxInstrumentService.getInstrumentKey(symbol);
    if (dynamicKey) return dynamicKey;
    const upper = symbol.toUpperCase();
    const cleanSymbol = upper.includes(':') ? upper.split(':')[0] : upper;
    return this.instrumentKeyMap[upper] || ('NSE_EQ|' + cleanSymbol);
  }

  private getHeaders() {
    return {
      Accept: 'application/json',
      Authorization: `Bearer ${this.accessToken}`,
    };
  }

  private async getAuthorizedWebSocketUrl(): Promise<string> {
    try {
      const response = await axios.get('https://api.upstox.com/v3/feed/market-data-feed/authorize', {
        headers: this.getHeaders(),
      });
      return response.data?.data?.authorizedRedirectUri || '';
    } catch {
      return '';
    }
  }

  private async initWebSocket() {
    if (!this.accessToken || this.isConnecting) return;
    this.isConnecting = true;

    try {
      const wsUrl = await this.getAuthorizedWebSocketUrl();
      if (!wsUrl) {
        this.isConnecting = false;
        return;
      }

      console.log('[UpstoxV3] Connecting to Authorized Upstox V3 Feed...');
      this.ws = new WebSocket(wsUrl, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });

      this.ws.on('open', () => {
        this.isConnecting = false;
        console.log('[UpstoxV3] Connected to Upstox Market Data Feed V3');
        this.sendSubscription();
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        this.handleWebSocketMessage(data);
      });

      this.ws.on('close', () => {
        this.isConnecting = false;
        setTimeout(() => this.initWebSocket(), 5000);
      });

      this.ws.on('error', () => {
        this.isConnecting = false;
      });
    } catch {
      this.isConnecting = false;
    }
  }

  private sendSubscription() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const instrumentKeys = Array.from(this.subscribedSymbols).map((s) => this.getInstrumentKey(s));
    if (instrumentKeys.length === 0) return;

    const subPayload = {
      guid: 'quantflow_v3_sub_' + Date.now(),
      method: 'sub',
      data: {
        mode: 'ltpc',
        instrumentKeys,
      },
    };
    this.ws.send(JSON.stringify(subPayload));
  }

  private handleWebSocketMessage(data: WebSocket.Data) {
    try {
      const buffer = Buffer.isBuffer(data)
        ? data
        : ArrayBuffer.isView(data)
        ? Buffer.from(data.buffer, data.byteOffset, data.byteLength)
        : typeof data === 'string'
        ? Buffer.from(data)
        : Buffer.from(data as any);

      let decodedMessage: any = null;
      try {
        decodedMessage = FeedResponseType.decode(buffer);
      } catch {}

      if (decodedMessage) {
        const parsed: any = FeedResponseType.toObject(decodedMessage, {
          longs: Number,
          enums: String,
          bytes: String,
          defaults: true,
          oneofs: true,
        });

        if (parsed && parsed.feeds) {
          Object.keys(parsed.feeds).forEach((key) => {
            const feed = parsed.feeds[key] || {};
            const fullFeed = feed.fullFeed || {};
            const marketFF = fullFeed.marketFF || {};
            const indexFF = fullFeed.indexFF || {};
            const ltpc = feed.ltpc || marketFF.ltpc || indexFF.ltpc;

            if (ltpc && ltpc.ltp !== undefined && ltpc.ltp !== null) {
              const ltp = Number(ltpc.ltp);
              const ltt = Number(ltpc.ltt || Date.now());
              const ltq = Number(ltpc.ltq || 0);
              const cp = Number(ltpc.cp || 0);

              const canonicalSymbol = this.reverseKeyMap[key] || (key.includes('|') ? `${key.split('|')[1]}:NSE` : key);
              const change = cp > 0 ? Number((ltp - cp).toFixed(2)) : 0;
              const changePercent = cp > 0 ? Number(((change / cp) * 100).toFixed(2)) : 0;
              const timestamp = Math.floor(ltt > 1e11 ? ltt / 1000 : ltt);
              const marketStatus = instrumentService.getMarketStatusForExchange('NSE');

              const tick: TickUpdate = {
                type: 'PRICE_UPDATE',
                symbol: canonicalSymbol,
                exchange: 'NSE',
                price: ltp,
                change,
                changePercent,
                volume: ltq,
                marketStatus,
                dataQuality: 'REALTIME',
                isMock: false,
                timestamp,
                source: 'upstox_v3',
              };

              if (this.onTickCallback) {
                this.onTickCallback(tick);
              }
            }
          });
        }
      }
    } catch {}
  }

  public async getQuote(symbol: string): Promise<StockQuote | null> {
    const upper = symbol.toUpperCase();
    const cleanSymbol = upper.includes(':') ? upper.split(':')[0] : upper.split('.')[0];
    const instKey = this.getInstrumentKey(upper);
    const inst = instrumentService.getInstrument(upper) || instrumentService.getInstrument(cleanSymbol);
    const upstoxMasterInst = upstoxInstrumentService.getInstrument(cleanSymbol);
    const companyName = upstoxMasterInst?.name || inst?.name || `${cleanSymbol} Ltd.`;
    const marketStatus = instrumentService.getMarketStatusForExchange('NSE');

    // 1. If Authorized Access Token is available, query Upstox REST endpoint
    if (this.accessToken) {
      try {
        const response = await axios.get(`https://api.upstox.com/v2/market-quote/quotes`, {
          params: { instrument_key: instKey },
          headers: this.getHeaders(),
          timeout: 4000,
        });

        const data = response.data;
        if (data && data.status === 'success' && data.data) {
          const quoteData = data.data[instKey] || Object.values(data.data)[0];
          if (quoteData) {
            const ohlc = quoteData.ohlc || {};
            const price = Number(quoteData.last_price || ohlc.close || 0);
            const prevClose = Number(ohlc.close || price);
            const open = Number(ohlc.open || price);
            const dayHigh = Number(ohlc.high || price);
            const dayLow = Number(ohlc.low || price);
            const volume = Number(quoteData.volume || 0);

            const change = Number((price - prevClose).toFixed(2));
            const changePercent = prevClose > 0 ? Number(((change / prevClose) * 100).toFixed(2)) : 0;

            return {
              symbol: cleanSymbol,
              name: companyName,
              exchange: 'NSE',
              country: 'IN',
              currency: 'INR',
              sector: inst?.sector || 'General',
              price,
              change,
              changePercent,
              open,
              previousClose: prevClose,
              dayHigh,
              dayLow,
              volume,
              marketStatus,
              dataQuality: 'REALTIME',
              isMock: false,
              timestamp: Date.now(),
            };
          }
        }
      } catch {}
    }

    // 2. Real Market Data Fallback: Yahoo Finance Public REST API for Indian Equities (.NS)
    try {
      const yahooSymbol = `${cleanSymbol}.NS`;
      const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}`, {
        params: { interval: '1d', range: '1mo' },
        timeout: 4000,
      });

      const chartResult = response.data?.chart?.result?.[0];
      if (chartResult && chartResult.meta) {
        const meta = chartResult.meta;
        const price = Number(meta.regularMarketPrice || meta.chartPreviousClose || 0);
        const prevClose = Number(meta.chartPreviousClose || price);
        const open = Number(meta.regularMarketDayOpen || price);
        const dayHigh = Number(meta.regularMarketDayHigh || price);
        const dayLow = Number(meta.regularMarketDayLow || price);
        const volume = Number(meta.regularMarketVolume || 0);

        const change = Number((price - prevClose).toFixed(2));
        const changePercent = prevClose > 0 ? Number(((change / prevClose) * 100).toFixed(2)) : 0;

        return {
          symbol: cleanSymbol,
          name: meta.longName || meta.shortName || companyName,
          exchange: 'NSE',
          country: 'IN',
          currency: 'INR',
          sector: inst?.sector || 'General',
          price,
          change,
          changePercent,
          open,
          previousClose: prevClose,
          dayHigh,
          dayLow,
          volume,
          marketStatus,
          dataQuality: 'REALTIME',
          isMock: false,
          timestamp: Date.now(),
        };
      }
    } catch (err: any) {
      console.warn(`[UpstoxMarketDataProvider] Yahoo fallback warning for ${cleanSymbol}:`, err.message);
    }

    return null;
  }

  public async getHistoricalCandles(symbol: string, timeframe: string, limit: number = 300): Promise<Candle[]> {
    const upper = symbol.toUpperCase();
    const cleanSymbol = upper.includes(':') ? upper.split(':')[0] : upper.split('.')[0];
    const instKey = this.getInstrumentKey(upper);

    // 1. Try Upstox Public Historical Candle API (Does NOT require access token)
    try {
      let unit = 'day';
      if (timeframe === '1m') unit = '1minute';
      else if (timeframe === '5m') unit = '5minute';
      else if (timeframe === '15m') unit = '15minute';
      else if (timeframe === '30m') unit = '30minute';
      else if (timeframe === '1H') unit = '60minute';
      else unit = 'day';

      const toDate = new Date().toISOString().slice(0, 10);
      const fromDate = new Date(Date.now() - 365 * 86400 * 1000).toISOString().slice(0, 10);

      const url = `https://api.upstox.com/v2/historical-candle/${encodeURIComponent(instKey)}/${unit}/${toDate}/${fromDate}`;
      const headers = this.accessToken ? this.getHeaders() : {};
      const response = await axios.get(url, { headers, timeout: 5000 });

      const data = response.data;
      if (data && data.status === 'success' && data.data && Array.isArray(data.data.candles) && data.data.candles.length > 0) {
        const rawCandles: any[] = data.data.candles;
        const candles: Candle[] = rawCandles.map((c: any) => ({
          timestamp: Math.floor(new Date(String(c[0])).getTime() / 1000),
          open: Number(c[1]),
          high: Number(c[2]),
          low: Number(c[3]),
          close: Number(c[4]),
          volume: Number(c[5]),
        }));

        return candles.reverse().slice(-limit);
      }
    } catch {}

    // 2. Real Market Data Fallback: Yahoo Finance Public REST API Historical Candles (.NS)
    try {
      let interval = '1d';
      let range = '1y';
      if (timeframe === '1m') { interval = '1m'; range = '5d'; }
      else if (timeframe === '5m') { interval = '5m'; range = '1mo'; }
      else if (timeframe === '15m') { interval = '15m'; range = '1mo'; }
      else if (timeframe === '30m') { interval = '30m'; range = '1mo'; }
      else if (timeframe === '1H') { interval = '60m'; range = '3mo'; }

      const yahooSymbol = `${cleanSymbol}.NS`;
      const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}`, {
        params: { interval, range },
        timeout: 5000,
      });

      const result = response.data?.chart?.result?.[0];
      if (result && result.timestamp && result.indicators?.quote?.[0]) {
        const timestamps: number[] = result.timestamp;
        const quoteObj = result.indicators.quote[0];
        const opens = quoteObj.open || [];
        const highs = quoteObj.high || [];
        const lows = quoteObj.low || [];
        const closes = quoteObj.close || [];
        const volumes = quoteObj.volume || [];

        const candles: Candle[] = [];
        for (let i = 0; i < timestamps.length; i++) {
          if (closes[i] !== null && closes[i] !== undefined) {
            candles.push({
              timestamp: timestamps[i],
              open: Number(opens[i] || closes[i]),
              high: Number(highs[i] || closes[i]),
              low: Number(lows[i] || closes[i]),
              close: Number(closes[i]),
              volume: Number(volumes[i] || 0),
            });
          }
        }

        if (candles.length > 0) {
          return candles.slice(-limit);
        }
      }
    } catch {}

    return [];
  }

  public async searchStocks(query: string): Promise<Array<{ symbol: string; name: string; exchange: string; price: number; changePercent: number; currency?: string }>> {
    const matches = upstoxInstrumentService.searchInstruments(query, 10);

    return Promise.all(
      matches.map(async (inst) => {
        const q = await this.getQuote(inst.trading_symbol);
        return {
          symbol: inst.trading_symbol,
          name: inst.name,
          exchange: 'NSE',
          price: q ? q.price : 0,
          changePercent: q ? q.changePercent : 0,
          currency: 'INR',
        };
      })
    );
  }

  public async getMarketOverview(): Promise<MarketOverviewData> {
    const indicesSymbols = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN'];
    const quotesList = (
      await Promise.all(indicesSymbols.map((sym) => this.getQuote(sym)))
    ).filter((q): q is StockQuote => q !== null);

    const sortedByGain = [...quotesList].sort((a, b) => b.changePercent - a.changePercent);

    const sectorMap: Record<string, { totalChange: number; count: number }> = {};
    quotesList.forEach((q) => {
      if (q.sector && q.sector !== 'General') {
        if (!sectorMap[q.sector]) sectorMap[q.sector] = { totalChange: 0, count: 0 };
        sectorMap[q.sector].totalChange += q.changePercent;
        sectorMap[q.sector].count += 1;
      }
    });

    const sectorPerformance = Object.keys(sectorMap).map((sector) => ({
      sector,
      changePercent: Number((sectorMap[sector].totalChange / sectorMap[sector].count).toFixed(2)),
    }));

    return {
      indices: quotesList.slice(0, 4).map((q) => ({
        name: q.name,
        symbol: q.symbol,
        value: q.price,
        change: q.change,
        changePercent: q.changePercent,
        marketStatus: q.marketStatus,
      })),
      topGainers: sortedByGain.slice(0, 5),
      topLosers: sortedByGain.slice().reverse().slice(0, 5),
      mostActive: quotesList,
      sectorPerformance,
    };
  }

  public async getScreenerStocks(filters: ScreenerFilters): Promise<StockQuote[]> {
    const popularSymbols = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'TATAMOTORS', 'PAYTM', 'JIOFIN'];
    const quotes = (await Promise.all(popularSymbols.map((sym) => this.getQuote(sym)))).filter(
      (q): q is StockQuote => q !== null
    );

    return quotes.map((q) => ({
      ...q,
      marketCap: q.price * 1000000,
      peRatio: 22.4,
      eps: q.price / 22.4,
      dividendYield: 1.2,
      beta: 0.95,
    }));
  }

  public startTickStream(onTick: (tick: TickUpdate) => void): void {
    this.onTickCallback = onTick;
  }

  public stopTickStream(): void {
    this.onTickCallback = null;
  }

  public subscribeToTicks(callback: (tick: TickUpdate) => void): void {
    this.onTickCallback = callback;
  }

  public subscribeSymbols(symbols: string[]): void {
    symbols.forEach((s) => this.subscribedSymbols.add(s));
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendSubscription();
    }
  }

  public unsubscribeSymbols(symbols: string[]): void {
    symbols.forEach((s) => this.subscribedSymbols.delete(s));
  }
}

export const upstoxMarketDataProvider = new UpstoxMarketDataProvider();
