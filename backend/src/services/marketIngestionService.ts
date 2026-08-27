import redisManager from '../redis/client';
import { marketDataProvider } from '../providers/MarketDataProviderRouter';
import { StockQuote, TickUpdate, MarketStatusType } from '../providers/MarketDataProvider';
import { instrumentService } from './instrumentService';

export class MarketIngestionService {
  private activeSubscriptions: Set<string> = new Set(['AAPL', 'TSLA', 'NVDA', 'MSFT', 'BTCUSD', 'ETHUSD', 'SOLUSD']);

  public initialize() {
    console.log('[IngestionService] Initializing Real Market Data Ingestion Engine...');

    // Subscribe provider to ticks
    marketDataProvider.startTickStream((tick) => {
      this.handleIncomingTick(tick);
    });
  }

  public async handleIncomingTick(tick: TickUpdate) {
    const symbol = tick.symbol.toUpperCase();

    // Fetch existing quote to retain fundamentals if available
    let existingQuote = await this.getLatestQuote(symbol);

    const inst = instrumentService.getInstrument(symbol);
    const exchange = inst ? inst.exchange : tick.exchange || 'US';
    const marketStatus: MarketStatusType = inst
      ? instrumentService.getMarketStatusForExchange(exchange)
      : tick.marketStatus || 'LIVE';

    const isForex = inst?.assetType === 'FOREX' || symbol.length === 6 || symbol.includes('/') || ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD', 'USDINR'].includes(symbol);
    const decimals = isForex ? (symbol.includes('JPY') || symbol.includes('INR') ? 3 : 5) : 2;

    let prevClose = existingQuote ? existingQuote.previousClose : tick.price;
    let change = Number((tick.price - prevClose).toFixed(decimals));
    let changePercent = prevClose > 0 ? Number(((change / prevClose) * 100).toFixed(2)) : 0;


    const updatedQuote: StockQuote = {
      symbol,
      name: inst ? inst.name : existingQuote?.name || `${symbol}`,
      exchange,
      country: inst?.country || existingQuote?.country || 'US',
      currency: inst?.currency || existingQuote?.currency || 'USD',
      sector: inst?.sector || existingQuote?.sector || 'General',
      price: tick.price,
      change,
      changePercent,
      open: existingQuote?.open || tick.price,
      previousClose: prevClose,
      dayHigh: existingQuote?.dayHigh ? Math.max(existingQuote.dayHigh, tick.price) : tick.price,
      dayLow: existingQuote?.dayLow ? Math.min(existingQuote.dayLow, tick.price) : tick.price,
      volume: tick.volume || existingQuote?.volume || 0,
      marketCap: existingQuote?.marketCap,
      fiftyTwoWeekHigh: existingQuote?.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: existingQuote?.fiftyTwoWeekLow,
      peRatio: existingQuote?.peRatio,
      eps: existingQuote?.eps,
      dividendYield: existingQuote?.dividendYield,
      bid: tick.bid,
      ask: tick.ask,
      lastTradeTime: tick.timestamp,
      marketStatus,
      dataQuality: tick.dataQuality || 'REALTIME',
      isMock: tick.isMock || false,
      timestamp: Date.now(),
    };
    (updatedQuote as any).source = tick.source || (existingQuote as any)?.source || 'MarketData';


    // Store in clean Redis key schema
    await redisManager.set(`market:stock:${symbol}:latest`, JSON.stringify(updatedQuote));
    await redisManager.set(`market:stock:${symbol}:quote`, JSON.stringify(updatedQuote));
    await redisManager.set(`market:stock:${symbol}:status`, marketStatus);

    if (inst?.exchange) {
      await redisManager.set(`market:${symbol}:${inst.exchange}:latest`, JSON.stringify(updatedQuote));
    }

    // Publish to Redis Pub/Sub for distributed WebSocket servers
    const payload = JSON.stringify(tick);
    await redisManager.publish(`market:events:${symbol}`, payload);
    await redisManager.publish(`market:events:all`, payload);
  }

  public async getLatestQuote(symbol: string): Promise<StockQuote | null> {
    const upper = symbol.toUpperCase();
    const cached = await redisManager.get(`market:stock:${upper}:latest`);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {}
    }
    return marketDataProvider.getQuote(upper);
  }

  public subscribeSymbol(symbol: string) {
    this.activeSubscriptions.add(symbol.toUpperCase());
    if (typeof (marketDataProvider as any).subscribeSymbol === 'function') {
      (marketDataProvider as any).subscribeSymbol(symbol.toUpperCase());
    }
  }

  public getActiveSubscriptions(): string[] {
    return Array.from(this.activeSubscriptions);
  }
}

export const marketIngestionService = new MarketIngestionService();
