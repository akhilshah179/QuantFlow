import axios from 'axios';
import WebSocket from 'ws';
import { MarketDataProvider, StockQuote, TickUpdate, MarketOverviewData, ScreenerFilters } from './MarketDataProvider';
import { Candle } from '../indicators';
import { config } from '../config';
import { instrumentService } from '../services/instrumentService';
import { mockMarketDataProvider } from './MockMarketDataProvider';

export class FinnhubMarketDataProvider implements MarketDataProvider {
  private apiKey: string;
  private baseUrl = 'https://finnhub.io/api/v1';
  private wsUrl = 'wss://ws.finnhub.io';
  private ws: WebSocket | null = null;
  private subscribedSymbols: Set<string> = new Set(['AAPL', 'TSLA', 'NVDA', 'MSFT']);
  private onTickCallback: ((tick: TickUpdate) => void) | null = null;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || config.finnhubApiKey || config.marketDataApiKey || '';
    if (this.apiKey) {
      this.initWebSocket();
    }
  }

  private initWebSocket() {
    if (!this.apiKey) return;

    try {
      this.ws = new WebSocket(`${this.wsUrl}?token=${this.apiKey}`);

      this.ws.on('open', () => {
        console.log('[FinnhubWS] Connected to Finnhub Real-Time Trade Stream');
        this.subscribedSymbols.forEach((symbol) => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'subscribe', symbol }));
          }
        });
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.type === 'trade' && Array.isArray(parsed.data)) {
            parsed.data.forEach((trade: any) => {
              const symbol = trade.s;
              const price = trade.p;
              const volume = trade.v || 0;
              const timestamp = Math.floor((trade.t || Date.now()) / 1000);

              const inst = instrumentService.getInstrument(symbol);
              const exchange = inst ? inst.exchange : 'NASDAQ';
              const status = instrumentService.getMarketStatusForExchange(exchange);

              const tick: TickUpdate = {
                type: 'PRICE_UPDATE',
                symbol,
                exchange,
                price,
                change: 0,
                changePercent: 0,
                volume,
                marketStatus: status,
                dataQuality: 'REALTIME',
                isMock: false,
                timestamp,
                source: 'finnhub',
              };

              if (this.onTickCallback) {
                this.onTickCallback(tick);
              }
            });
          }
        } catch {
          // Ignore non-JSON
        }
      });

      this.ws.on('close', () => {
        setTimeout(() => this.initWebSocket(), 10000);
      });

      this.ws.on('error', () => {});
    } catch {
      // Ignore WebSocket init failures
    }
  }

  public async getQuote(symbol: string): Promise<StockQuote | null> {
    const upper = symbol.toUpperCase();
    if (!this.apiKey) {
      return mockMarketDataProvider.getQuote(upper);
    }

    try {
      const response = await axios.get(`${this.baseUrl}/quote`, {
        params: { symbol: upper, token: this.apiKey },
        timeout: 2000,
      });
      const data = response.data;
      if (!data || data.c === 0) {
        return mockMarketDataProvider.getQuote(upper);
      }

      const currentPrice = data.c;
      const prevClose = data.pc;
      const change = Number((currentPrice - prevClose).toFixed(2));
      const changePercent = prevClose > 0 ? Number(((change / prevClose) * 100).toFixed(2)) : 0;

      const inst = instrumentService.getInstrument(upper);
      const exchange = inst ? inst.exchange : 'US';
      const marketStatus = instrumentService.getMarketStatusForExchange(exchange);

      return {
        symbol: upper,
        name: inst ? inst.name : `${upper} Corp.`,
        exchange,
        country: inst?.country || 'US',
        currency: inst?.currency || 'USD',
        sector: inst?.sector || 'General',
        price: currentPrice,
        change,
        changePercent,
        open: data.o || currentPrice,
        previousClose: prevClose,
        dayHigh: data.h || currentPrice,
        dayLow: data.l || currentPrice,
        volume: data.v || 0,
        marketStatus,
        dataQuality: 'REALTIME',
        isMock: false,
        timestamp: data.t ? data.t * 1000 : Date.now(),
      };
    } catch {
      return mockMarketDataProvider.getQuote(upper);
    }
  }

  public async getHistoricalCandles(symbol: string, timeframe: string, limit: number = 300): Promise<Candle[]> {
    const upper = symbol.toUpperCase();
    if (!this.apiKey) {
      return mockMarketDataProvider.getHistoricalCandles(upper, timeframe, limit);
    }

    try {
      const to = Math.floor(Date.now() / 1000);
      let multiplierSeconds = 30 * 86400;
      let resolution = 'D';

      switch (timeframe) {
        case '1m': resolution = '1'; multiplierSeconds = 2 * 86400; break;
        case '5m': resolution = '5'; multiplierSeconds = 5 * 86400; break;
        case '15m': resolution = '15'; multiplierSeconds = 10 * 86400; break;
        case '30m': resolution = '30'; multiplierSeconds = 15 * 86400; break;
        case '1H': resolution = '60'; multiplierSeconds = 30 * 86400; break;
        case '4H': resolution = '60'; multiplierSeconds = 60 * 86400; break;
        case '1D': resolution = 'D'; multiplierSeconds = 365 * 86400; break;
        case '1W': resolution = 'W'; multiplierSeconds = 2 * 365 * 86400; break;
        case '1M': resolution = 'M'; multiplierSeconds = 5 * 365 * 86400; break;
        default: resolution = 'D'; multiplierSeconds = 365 * 86400; break;
      }

      const from = to - multiplierSeconds;

      const response = await axios.get(`${this.baseUrl}/stock/candle`, {
        params: { symbol: upper, resolution, from, to, token: this.apiKey },
        timeout: 2500,
      });

      const data = response.data;
      if (!data || data.s !== 'ok' || !Array.isArray(data.t)) {
        return mockMarketDataProvider.getHistoricalCandles(upper, timeframe, limit);
      }

      const candles: Candle[] = [];
      for (let i = 0; i < data.t.length; i++) {
        candles.push({
          timestamp: data.t[i],
          open: data.o[i],
          high: data.h[i],
          low: data.l[i],
          close: data.c[i],
          volume: data.v[i],
        });
      }
      return candles.slice(-limit);
    } catch {
      return mockMarketDataProvider.getHistoricalCandles(upper, timeframe, limit);
    }
  }

  public async searchStocks(query: string): Promise<Array<{ symbol: string; name: string; exchange: string; price: number; changePercent: number; currency?: string }>> {
    if (!query.trim()) return [];

    if (!this.apiKey) {
      return mockMarketDataProvider.searchStocks(query);
    }

    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: { q: query, token: this.apiKey },
        timeout: 2000,
      });
      const result = response.data.result || [];
      const topResults = result.slice(0, 8);

      const items = await Promise.all(
        topResults.map(async (r: any) => {
          const sym = r.symbol;
          const q = await this.getQuote(sym);
          return {
            symbol: sym,
            name: r.description || sym,
            exchange: r.type || 'US',
            price: q ? q.price : 0,
            changePercent: q ? q.changePercent : 0,
            currency: 'USD',
          };
        })
      );

      return items;
    } catch {
      return mockMarketDataProvider.searchStocks(query);
    }
  }

  public async getMarketOverview(): Promise<MarketOverviewData> {
    try {
      const indicesSymbols = [
        { name: 'S&P 500', symbol: 'SPY' },
        { name: 'NASDAQ Tech', symbol: 'QQQ' },
        { name: 'Apple Inc.', symbol: 'AAPL' },
        { name: 'NVIDIA Corp.', symbol: 'NVDA' },
      ];

      const indicesData = await Promise.all(
        indicesSymbols.map(async (idx) => {
          const q = await this.getQuote(idx.symbol);
          const status = instrumentService.getMarketStatusForExchange('NASDAQ');
          return {
            name: idx.name,
            symbol: idx.symbol,
            value: q ? q.price : 0,
            change: q ? q.change : 0,
            changePercent: q ? q.changePercent : 0,
            marketStatus: status,
          };
        })
      );

      const catalog = instrumentService.getAllInstruments().filter((i) => i.provider === 'finnhub');
      const quotesList = (
        await Promise.all(catalog.slice(0, 8).map((item) => this.getQuote(item.symbol)))
      ).filter((q): q is StockQuote => q !== null);

      const sortedByGain = [...quotesList].sort((a, b) => b.changePercent - a.changePercent);

      const sectorPerformance = [
        { sector: 'Technology', changePercent: 1.84 },
        { sector: 'Consumer Cyclical', changePercent: 1.12 },
        { sector: 'Communication Services', changePercent: 0.95 },
        { sector: 'Energy', changePercent: 0.48 },
        { sector: 'Financial Services', changePercent: -0.15 },
      ];

      return {
        indices: indicesData,
        topGainers: sortedByGain.slice(0, 5),
        topLosers: [...sortedByGain].reverse().slice(0, 5),
        mostActive: quotesList.slice(0, 5),
        sectorPerformance,
      };
    } catch {
      return mockMarketDataProvider.getMarketOverview();
    }
  }

  public async getScreenerStocks(filters: ScreenerFilters): Promise<StockQuote[]> {
    return mockMarketDataProvider.getScreenerStocks(filters);
  }

  public startTickStream(onTick: (tick: TickUpdate) => void): void {
    this.onTickCallback = onTick;
  }

  public subscribeSymbol(symbol: string): void {
    const upper = symbol.toUpperCase();
    this.subscribedSymbols.add(upper);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'subscribe', symbol: upper }));
    }
  }

  public stopTickStream(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
