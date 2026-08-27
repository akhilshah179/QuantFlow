import { MarketDataProvider, StockQuote, TickUpdate, MarketOverviewData, ScreenerFilters, MarketStatusType } from './MarketDataProvider';
import { Candle } from '../indicators';
import redisManager from '../redis/client';
import { instrumentService, GLOBAL_INSTRUMENT_CATALOG } from '../services/instrumentService';
import { config } from '../config';

export class MockMarketDataProvider implements MarketDataProvider {
  private quotes: Map<string, StockQuote> = new Map();
  private tickInterval: NodeJS.Timeout | null = null;
  private onTickCallback: ((tick: TickUpdate) => void) | null = null;

  constructor() {
    this.initializeQuotes();
  }

  private initializeQuotes() {
    const now = Date.now();
    GLOBAL_INSTRUMENT_CATALOG.forEach((item) => {
      // Do not write mock 150.00 quotes for Forex pairs into Redis if real market data provider mode is active
      if (item.assetType === 'FOREX' && config.marketDataProvider !== 'mock') {
        return;
      }
      const basePrice = item.symbol === 'AAPL' ? 228.41 : item.symbol === 'TSLA' ? 215.30 : item.symbol === 'NVDA' ? 124.50 : 100.00;
      const prevClose = Number((basePrice * 0.99).toFixed(2));

      const change = Number((basePrice - prevClose).toFixed(2));
      const changePercent = Number(((change / prevClose) * 100).toFixed(2));

      const marketStatus = instrumentService.getMarketStatusForExchange(item.exchange);

      const quote: StockQuote = {
        symbol: item.symbol,
        name: item.name,
        exchange: item.exchange,
        sector: item.sector,
        price: basePrice,
        change,
        changePercent,
        open: prevClose,
        previousClose: prevClose,
        dayHigh: Number((basePrice * 1.01).toFixed(2)),
        dayLow: Number((basePrice * 0.99).toFixed(2)),
        volume: 2500000,
        marketCap: 150000000000,
        fiftyTwoWeekHigh: Number((basePrice * 1.15).toFixed(2)),
        fiftyTwoWeekLow: Number((basePrice * 0.85).toFixed(2)),
        peRatio: 28.5,
        eps: 5.4,
        dividendYield: 1.2,
        beta: 1.05,
        marketStatus,
        dataQuality: 'MOCK',
        isMock: true,
        timestamp: now,
      };

      this.quotes.set(item.symbol, quote);
      redisManager.set(`market:stock:${item.symbol}:latest`, JSON.stringify(quote));
    });
  }

  public async getQuote(symbol: string): Promise<StockQuote | null> {
    const upper = symbol.toUpperCase();
    const cached = await redisManager.get(`market:stock:${upper}:latest`);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {}
    }
    return this.quotes.get(upper) || null;
  }

  public async searchStocks(query: string): Promise<Array<{ symbol: string; name: string; exchange: string; price: number; changePercent: number }>> {
    const results = instrumentService.searchInstruments(query);
    return results.map((inst) => {
      const q = this.quotes.get(inst.symbol);
      return {
        symbol: inst.symbol,
        name: inst.name,
        exchange: inst.exchange,
        price: q ? q.price : 100,
        changePercent: q ? q.changePercent : 0,
      };
    });
  }

  public async getMarketOverview(): Promise<MarketOverviewData> {
    const allQuotes = Array.from(this.quotes.values());
    const sortedByGain = [...allQuotes].sort((a, b) => b.changePercent - a.changePercent);
    const sortedByVolume = [...allQuotes].sort((a, b) => b.volume - a.volume);

    return {
      indices: [
        { name: 'S&P 500', symbol: '^GSPC', value: 5452.10, change: 32.40, changePercent: 0.60, marketStatus: 'LIVE' },
        { name: 'NASDAQ', symbol: '^IXIC', value: 17150.30, change: 145.20, changePercent: 0.85, marketStatus: 'LIVE' },
        { name: 'Dow Jones', symbol: '^DJI', value: 39750.80, change: -45.10, changePercent: -0.11, marketStatus: 'LIVE' },
        { name: 'NIFTY 50', symbol: '^NSEI', value: 24320.50, change: 180.60, changePercent: 0.75, marketStatus: 'LIVE' },
        { name: 'FTSE 100', symbol: '^FTSE', value: 8210.40, change: 25.10, changePercent: 0.31, marketStatus: 'LIVE' },
        { name: 'Nikkei 225', symbol: '^N225', value: 36200.15, change: -120.30, changePercent: -0.33, marketStatus: 'LIVE' },
      ],
      topGainers: sortedByGain.slice(0, 5),
      topLosers: [...sortedByGain].reverse().slice(0, 5),
      mostActive: sortedByVolume.slice(0, 5),
      sectorPerformance: [
        { sector: 'Technology', changePercent: 1.84 },
        { sector: 'Consumer Cyclical', changePercent: 1.12 },
        { sector: 'Communication Services', changePercent: 0.95 },
        { sector: 'Energy', changePercent: 0.48 },
        { sector: 'Financial Services', changePercent: -0.15 },
      ],
    };
  }

  public async getScreenerStocks(filters: ScreenerFilters): Promise<StockQuote[]> {
    let results = Array.from(this.quotes.values());

    if (filters.exchange && filters.exchange !== 'ALL') {
      results = results.filter((q) => q.exchange.toUpperCase() === filters.exchange?.toUpperCase());
    }

    if (filters.sector && filters.sector !== 'ALL') {
      results = results.filter((q) => q.sector?.toUpperCase() === filters.sector?.toUpperCase());
    }

    if (filters.minPrice !== undefined) {
      results = results.filter((q) => q.price >= filters.minPrice!);
    }

    if (filters.maxPrice !== undefined) {
      results = results.filter((q) => q.price <= filters.maxPrice!);
    }

    if (filters.query?.trim()) {
      const q = filters.query.trim().toUpperCase();
      results = results.filter((item) => item.symbol.includes(q) || item.name.toUpperCase().includes(q));
    }

    return results;
  }

  public async getHistoricalCandles(symbol: string, timeframe: string, limit: number = 300): Promise<Candle[]> {
    const quote = await this.getQuote(symbol);
    const basePrice = quote ? quote.price : 100;

    let stepMs = 24 * 60 * 60 * 1000;
    switch (timeframe) {
      case '1m': stepMs = 60 * 1000; break;
      case '5m': stepMs = 5 * 60 * 1000; break;
      case '15m': stepMs = 15 * 60 * 1000; break;
      case '1H': stepMs = 60 * 60 * 1000; break;
      case '1D': default: stepMs = 24 * 60 * 60 * 1000; break;
    }

    const candles: Candle[] = [];
    const now = Date.now();
    let currentClose = basePrice * 0.85;

    for (let i = limit; i >= 0; i--) {
      const timestamp = now - i * stepMs;
      const open = currentClose;
      currentClose = Math.max(1, open * (1 + (Math.random() - 0.49) * 0.015));
      const high = Math.max(open, currentClose) * 1.005;
      const low = Math.min(open, currentClose) * 0.995;

      candles.push({
        timestamp: Math.floor(timestamp / 1000),
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(currentClose.toFixed(2)),
        volume: Math.floor(5000 + Math.random() * 50000),
      });
    }

    return candles;
  }

  public startTickStream(onTick: (tick: TickUpdate) => void): void {
    // In strict DEV MOCK mode only, emit mock ticks
    if (config.marketDataProvider !== 'mock') return;

    this.onTickCallback = onTick;
    if (this.tickInterval) clearInterval(this.tickInterval);

    this.tickInterval = setInterval(() => {
      const symbols = Array.from(this.quotes.keys());
      const selectedSymbols = symbols.sort(() => 0.5 - Math.random()).slice(0, 3);

      selectedSymbols.forEach((sym) => {
        const quote = this.quotes.get(sym);
        if (!quote) return;

        // Check if market is LIVE before moving price
        if (quote.marketStatus !== 'LIVE') return;

        const deltaPercent = (Math.random() - 0.495) * 0.004;
        const newPrice = Number(Math.max(1, quote.price * (1 + deltaPercent)).toFixed(2));
        const change = Number((newPrice - quote.previousClose).toFixed(2));
        const changePercent = Number(((change / quote.previousClose) * 100).toFixed(2));

        quote.price = newPrice;
        quote.change = change;
        quote.changePercent = changePercent;
        quote.timestamp = Date.now();

        redisManager.set(`market:stock:${sym}:latest`, JSON.stringify(quote));

        const tick: TickUpdate = {
          type: 'PRICE_UPDATE',
          symbol: sym,
          price: newPrice,
          change,
          changePercent,
          volume: quote.volume + 100,
          marketStatus: quote.marketStatus,
          dataQuality: 'MOCK',
          isMock: true,
          timestamp: Math.floor(quote.timestamp / 1000),
        };

        redisManager.publish(`market:events:${sym}`, JSON.stringify(tick));

        if (this.onTickCallback) {
          this.onTickCallback(tick);
        }
      });
    }, 2000);
  }

  public stopTickStream(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }
}

export const mockMarketDataProvider = new MockMarketDataProvider();
export { marketDataProvider } from './MarketDataProviderRouter';

