import { MarketDataProvider, StockQuote, TickUpdate, MarketOverviewData, ScreenerFilters } from './MarketDataProvider';
import { Candle } from '../indicators';
import { FinnhubMarketDataProvider } from './FinnhubMarketDataProvider';
import { UpstoxMarketDataProvider } from './UpstoxMarketDataProvider';
import { MockMarketDataProvider } from './MockMarketDataProvider';
import { BinanceCryptoDataProvider } from './BinanceCryptoDataProvider';
import { ForexDataProvider } from './ForexDataProvider';
import { FuturesDataProvider } from './FuturesDataProvider';
import { config } from '../config';
import { instrumentService } from '../services/instrumentService';
import { upstoxInstrumentService } from '../services/upstoxInstrumentService';

export class MarketDataProviderRouter implements MarketDataProvider {
  private finnhubProvider: FinnhubMarketDataProvider;
  private upstoxProvider: UpstoxMarketDataProvider;
  private mockProvider: MockMarketDataProvider;
  private cryptoProvider: BinanceCryptoDataProvider;
  private forexProvider: ForexDataProvider;
  private futuresProvider: FuturesDataProvider;

  constructor() {
    this.finnhubProvider = new FinnhubMarketDataProvider();
    this.upstoxProvider = new UpstoxMarketDataProvider();
    this.mockProvider = new MockMarketDataProvider();
    this.cryptoProvider = new BinanceCryptoDataProvider();
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
    const upperClean = upper.replace('/', '');
    const cleanSymbol = upper.includes(':') ? upper.split(':')[0] : upper.split('.')[0];

    if (upperClean === 'EURUSD' || upperClean === 'GBPUSD' || upperClean === 'USDJPY' || upperClean === 'USDINR' || upperClean === 'AUDUSD' || upperClean === 'USDCHF' || upperClean === 'USDCAD' || upperClean === 'NZDUSD') {
      return this.forexProvider;
    }

    if (upper.endsWith('USD') || upper.endsWith('USDT') || upper.endsWith('BTC') || upper.endsWith('ETH') || upper.endsWith('SOL') || upper === 'BTC' || upper === 'ETH') {
      return this.cryptoProvider;
    }


    if (upper === 'GOLD' || upper === 'SILVER' || upper === 'CRUDE OIL' || upper === 'NATURAL GAS' || upper === 'COPPER') {
      return this.futuresProvider;
    }

    const inst = instrumentService.getInstrument(upper);
    const upstoxInst = upstoxInstrumentService.getInstrument(cleanSymbol) || upstoxInstrumentService.getInstrument(upper);

    if (
      upper.endsWith('.NS') ||
      upper.endsWith('.BO') ||
      upper.endsWith(':NSE') ||
      upper.endsWith(':BSE') ||
      upstoxInst !== null ||
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
  private overviewCacheTTL = 15000;

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

    if (filters.exchange === 'NSE' || filters.exchange === 'BSE') {
      return this.upstoxProvider.getScreenerStocks(filters);
    }

    return this.finnhubProvider.getScreenerStocks(filters);
  }

  public startTickStream(onTick: (tick: TickUpdate) => void): void {
    this.finnhubProvider.startTickStream(onTick);
    this.upstoxProvider.startTickStream(onTick);
    this.cryptoProvider.startTickStream(onTick);
    this.forexProvider.startTickStream(onTick);
    this.futuresProvider.startTickStream(onTick);
    this.mockProvider.startTickStream(onTick);
  }

  public stopTickStream(): void {
    this.finnhubProvider.stopTickStream();
    this.upstoxProvider.stopTickStream();
    this.cryptoProvider.stopTickStream();
    this.forexProvider.stopTickStream();
    this.futuresProvider.stopTickStream();
    this.mockProvider.stopTickStream();
  }
}

export const marketDataProvider = new MarketDataProviderRouter();
