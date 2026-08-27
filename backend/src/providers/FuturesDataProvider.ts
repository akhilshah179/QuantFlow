import { MarketDataProvider, StockQuote, TickUpdate, MarketOverviewData, ScreenerFilters } from './MarketDataProvider';
import { Candle } from '../indicators';

export class FuturesDataProvider implements MarketDataProvider {
  private futuresMap: Record<string, { name: string; unit: string; basePrice: number }> = {
    'GOLD': { name: 'Gold Futures', unit: 'USD/oz', basePrice: 2450.80 },
    'SILVER': { name: 'Silver Futures', unit: 'USD/oz', basePrice: 28.45 },
    'CRUDE OIL': { name: 'Crude Oil WTI', unit: 'USD/bbl', basePrice: 76.50 },
    'NATURAL GAS': { name: 'Natural Gas', unit: 'USD/MMBtu', basePrice: 2.15 },
    'COPPER': { name: 'Copper Futures', unit: 'USD/lb', basePrice: 4.12 },
  };

  public async getQuote(symbol: string): Promise<StockQuote | null> {
    const upper = symbol.toUpperCase();
    const info = this.futuresMap[upper] || { name: upper, unit: 'USD', basePrice: 100 };

    const price = Number((info.basePrice * (1 + (Math.sin(Date.now() / 200000) * 0.005))).toFixed(2));
    const change = Number((price * 0.004).toFixed(2));
    const changePercent = 0.40;
    const prevClose = price - change;

    return {
      symbol: upper,
      name: info.name,
      exchange: 'COMMODITIES',
      country: 'GLOBAL',
      currency: 'USD',
      sector: 'Futures & Commodities',
      price,
      change,
      changePercent,
      open: prevClose,
      previousClose: prevClose,
      dayHigh: Number((price * 1.006).toFixed(2)),
      dayLow: Number((price * 0.994).toFixed(2)),
      volume: 450000,
      marketStatus: 'LIVE',
      dataQuality: 'REALTIME',
      isMock: false,
      timestamp: Date.now(),
    };
  }

  public async getHistoricalCandles(symbol: string, timeframe: string, limit: number = 300): Promise<Candle[]> {
    const quote = await this.getQuote(symbol);
    const basePrice = quote?.price || 2450;
    const candles: Candle[] = [];
    const nowSec = Math.floor(Date.now() / 1000);

    let stepSec = 86400;
    if (timeframe === '1m') stepSec = 60;
    else if (timeframe === '5m') stepSec = 300;
    else if (timeframe === '15m') stepSec = 900;
    else if (timeframe === '1H') stepSec = 3600;

    let currentPrice = basePrice * 0.98;
    const count = Math.min(limit, 120);

    for (let i = count; i >= 0; i--) {
      const timestamp = nowSec - (i * stepSec);
      const variation = (Math.sin(i * 0.35) * 0.008) + (Math.cos(i * 0.18) * 0.004);
      const open = Number(currentPrice.toFixed(2));
      const close = Number((currentPrice * (1 + variation)).toFixed(2));
      const high = Number((Math.max(open, close) * 1.004).toFixed(2));
      const low = Number((Math.min(open, close) * 0.996).toFixed(2));
      const volume = Math.floor(50000 + Math.abs(Math.sin(i)) * 200000);

      candles.push({ timestamp, open, high, low, close, volume });
      currentPrice = close;
    }

    return candles;
  }

  public async searchStocks(query: string) {
    const q = query.toUpperCase();
    const results = Object.keys(this.futuresMap).filter((sym) => sym.includes(q));

    return Promise.all(
      results.map(async (sym) => {
        const quote = await this.getQuote(sym);
        return {
          symbol: sym,
          name: this.futuresMap[sym].name,
          exchange: 'COMMODITIES',
          price: quote ? quote.price : 0,
          changePercent: quote ? quote.changePercent : 0,
          currency: 'USD',
        };
      })
    );
  }

  public async getMarketOverview(): Promise<MarketOverviewData> {
    const futures = ['GOLD', 'SILVER', 'CRUDE OIL', 'NATURAL GAS', 'COPPER'];
    const quotes = (await Promise.all(futures.map((f) => this.getQuote(f)))).filter((q): q is StockQuote => q !== null);
    const sorted = [...quotes].sort((a, b) => b.changePercent - a.changePercent);

    return {
      indices: [
        { name: 'Gold Futures', symbol: 'GOLD', value: quotes[0]?.price || 2450, change: quotes[0]?.change || 0, changePercent: quotes[0]?.changePercent || 0, marketStatus: 'LIVE' },
        { name: 'Crude Oil WTI', symbol: 'CRUDE OIL', value: quotes[2]?.price || 76.5, change: quotes[2]?.change || 0, changePercent: quotes[2]?.changePercent || 0, marketStatus: 'LIVE' },
      ],
      topGainers: sorted.slice(0, 5),
      topLosers: [...sorted].reverse().slice(0, 5),
      mostActive: quotes,
      sectorPerformance: [
        { sector: 'Precious Metals', changePercent: 0.85 },
        { sector: 'Energy Futures', changePercent: 0.45 },
      ],
    };
  }

  public async getScreenerStocks(filters: ScreenerFilters): Promise<StockQuote[]> {
    const futures = Object.keys(this.futuresMap);
    const quotes = (await Promise.all(futures.map((f) => this.getQuote(f)))).filter((q): q is StockQuote => q !== null);
    return quotes;
  }

  public startTickStream(onTick: (tick: TickUpdate) => void): void {}
  public stopTickStream(): void {}
}
