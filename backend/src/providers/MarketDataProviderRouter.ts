import { MarketDataProvider, StockQuote, TickUpdate, MarketOverviewData, ScreenerFilters } from './MarketDataProvider';
import { FinnhubMarketDataProvider } from './FinnhubMarketDataProvider';
import { UpstoxMarketDataProvider } from './UpstoxMarketDataProvider';
import { MockMarketDataProvider } from './MockMarketDataProvider';
import { CryptoDataProvider } from './CryptoDataProvider';
import { ForexDataProvider } from './ForexDataProvider';
import { FuturesDataProvider } from './FuturesDataProvider';
import { Candle } from '../indicators';
import { config } from '../config';
import { instrumentService } from '../services/instrumentService';

export class MarketDataProviderRouter implements MarketDataProvider {
  private finnhubProvider: FinnhubMarketDataProvider;
  private upstoxProvider: UpstoxMarketDataProvider;
  private mockProvider: MockMarketDataProvider;
  private cryptoProvider: CryptoDataProvider;
  private forexProvider: ForexDataProvider;
  private futuresProvider: FuturesDataProvider;
  private onTickCallback: ((tick: TickUpdate) => void) | null = null;

  constructor() {
    this.finnhubProvider = new FinnhubMarketDataProvider();
    this.upstoxProvider = new UpstoxMarketDataProvider();
    this.mockProvider = new MockMarketDataProvider();
    this.cryptoProvider = new CryptoDataProvider();
    this.forexProvider = new ForexDataProvider();
    this.futuresProvider = new FuturesDataProvider();
  }

  private isMockMode(): boolean {
    return config.marketDataProvider === 'mock';
  }

  private resolveProvider(symbol: string): MarketDataProvider {
    if (this.isMockMode()) {
      return this.mockProvider;
    }

    const upper = symbol.toUpperCase();

    if (upper.endsWith('USD') || upper.endsWith('BTC') || upper.endsWith('ETH') || upper.endsWith('SOL') || upper === 'BTC' || upper === 'ETH') {
      if (upper === 'EURUSD' || upper === 'GBPUSD' || upper === 'USDJPY' || upper === 'USDINR' || upper === 'AUDUSD' || upper === 'USDCHF' || upper === 'USDCAD' || upper === 'NZDUSD') {
        return this.forexProvider;
      }
      return this.cryptoProvider;
    }

    if (upper === 'GOLD' || upper === 'SILVER' || upper === 'CRUDE OIL' || upper === 'NATURAL GAS' || upper === 'COPPER') {
      return this.futuresProvider;
    }

    const inst = instrumentService.getInstrument(upper);

    if (
      upper.endsWith(':NSE') ||
      upper.endsWith(':BSE') ||
      inst?.exchange === 'NSE' ||
      inst?.exchange === 'BSE' ||
      inst?.country === 'IN' ||
      inst?.provider === 'upstox'
    ) {
      return this.upstoxProvider;
    }

    return this.finnhubProvider;
  }

  public async getQuote(symbol: string): Promise<StockQuote | null> {
    const provider = this.resolveProvider(symbol);
    return provider.getQuote(symbol);
  }

  public async getHistoricalCandles(symbol: string, timeframe: string, limit: number = 300): Promise<Candle[]> {
    const provider = this.resolveProvider(symbol);
    return provider.getHistoricalCandles(symbol, timeframe, limit);
  }

  public async searchStocks(query: string): Promise<Array<{ symbol: string; name: string; exchange: string; price: number; changePercent: number; currency?: string }>> {
    if (this.isMockMode()) {
      return this.mockProvider.searchStocks(query);
    }

    const [usResults, inResults, cryptoResults, forexResults, futuresResults] = await Promise.all([
      this.finnhubProvider.searchStocks(query).catch(() => []),
      this.upstoxProvider.searchStocks(query).catch(() => []),
      this.cryptoProvider.searchStocks(query).catch(() => []),
      this.forexProvider.searchStocks(query).catch(() => []),
      this.futuresProvider.searchStocks(query).catch(() => []),
    ]);

    const combined = [...usResults, ...inResults, ...cryptoResults, ...forexResults, ...futuresResults];
    const uniqueMap = new Map<string, any>();
    combined.forEach((item) => {
      if (!uniqueMap.has(item.symbol)) {
        uniqueMap.set(item.symbol, item);
      }
    });

    return Array.from(uniqueMap.values());
  }

  private cachedOverview: { data: MarketOverviewData; timestamp: number } | null = null;
  private overviewCacheTTL = 15000; // 15s cache

  public async getMarketOverview(): Promise<MarketOverviewData> {
    if (this.cachedOverview && Date.now() - this.cachedOverview.timestamp < this.overviewCacheTTL) {
      return this.cachedOverview.data;
    }

    if (this.isMockMode()) {
      const mockData = await this.mockProvider.getMarketOverview();
      this.cachedOverview = { data: mockData, timestamp: Date.now() };
      return mockData;
    }

    const [finnhubOverview, upstoxOverview] = await Promise.all([
      this.finnhubProvider.getMarketOverview().catch(() => null),
      this.upstoxProvider.getMarketOverview().catch(() => null),
    ]);

    const indices = [
      ...(finnhubOverview?.indices || []),
      ...(upstoxOverview?.indices || []),
    ];

    const topGainers = [
      ...(finnhubOverview?.topGainers || []),
      ...(upstoxOverview?.topGainers || []),
    ].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);

    const topLosers = [
      ...(finnhubOverview?.topLosers || []),
      ...(upstoxOverview?.topLosers || []),
    ].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);

    const mostActive = [
      ...(finnhubOverview?.mostActive || []),
      ...(upstoxOverview?.mostActive || []),
    ].slice(0, 5);

    const sectorPerformance = [
      ...(finnhubOverview?.sectorPerformance || []),
      ...(upstoxOverview?.sectorPerformance || []),
    ];

    const result: MarketOverviewData = {
      indices,
      topGainers,
      topLosers,
      mostActive,
      sectorPerformance,
    };

    this.cachedOverview = { data: result, timestamp: Date.now() };
    return result;
  }

  public async getScreenerStocks(filters: ScreenerFilters): Promise<StockQuote[]> {
    if (this.isMockMode()) {
      return this.mockProvider.getScreenerStocks(filters);
    }

    const [usStocks, inStocks] = await Promise.all([
      this.finnhubProvider.getScreenerStocks(filters),
      this.upstoxProvider.getScreenerStocks(filters),
    ]);

    return [...usStocks, ...inStocks];
  }

  public startTickStream(onTick: (tick: TickUpdate) => void): void {
    this.onTickCallback = onTick;

    if (this.isMockMode()) {
      this.mockProvider.startTickStream((tick) => {
        if (this.onTickCallback) this.onTickCallback(tick);
      });
      return;
    }

    // Start real streams for both Finnhub & Upstox
    this.finnhubProvider.startTickStream((tick) => {
      if (this.onTickCallback) this.onTickCallback(tick);
    });

    this.upstoxProvider.startTickStream((tick) => {
      if (this.onTickCallback) this.onTickCallback(tick);
    });
  }

  public subscribeSymbol(symbol: string): void {
    const provider = this.resolveProvider(symbol);
    if (typeof (provider as any).subscribeSymbol === 'function') {
      (provider as any).subscribeSymbol(symbol);
    }
  }

  public stopTickStream(): void {
    if (this.isMockMode()) {
      this.mockProvider.stopTickStream();
      return;
    }
    this.finnhubProvider.stopTickStream();
    this.upstoxProvider.stopTickStream();
  }
}

export const marketDataProviderRouter = new MarketDataProviderRouter();
export const marketDataProvider: MarketDataProvider = marketDataProviderRouter;
