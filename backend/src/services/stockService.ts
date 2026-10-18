import { marketDataProvider } from '../providers/MarketDataProviderRouter';
import { marketIngestionService } from './marketIngestionService';
import {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateVWAP,
  calculateATR,
  Candle,
} from '../indicators';
import { ScreenerFilters } from '../providers/MarketDataProvider';

export class StockService {
  public async searchStocks(query: string) {
    return marketDataProvider.searchStocks(query);
  }

  public async getStockQuote(symbol: string) {
    const quote = await marketIngestionService.getLatestQuote(symbol);
    if (!quote) {
      throw { statusCode: 404, message: `Stock with symbol '${symbol}' not found.` };
    }
    return quote;
  }

  public async getHistoricalData(symbol: string, timeframe: string = '1D', limit: number = 300) {
    const quote = await this.getStockQuote(symbol);
    let candles = await marketDataProvider.getHistoricalCandles(symbol, timeframe, limit);

    if (!candles || candles.length === 0) {
      candles = this.generateBaselineCandles(quote, timeframe, limit);
    }

    const sma20 = calculateSMA(candles, 20);
    const sma50 = calculateSMA(candles, 50);
    const ema12 = calculateEMA(candles, 12);
    const ema26 = calculateEMA(candles, 26);
    const rsi14 = calculateRSI(candles, 14);
    const macd = calculateMACD(candles, 12, 26, 9);
    const bollingerBands = calculateBollingerBands(candles, 20, 2);
    const vwap = calculateVWAP(candles);
    const atr14 = calculateATR(candles, 14);

    return {
      symbol: symbol.toUpperCase(),
      timeframe,
      candles,
      indicators: {
        sma20,
        sma50,
        ema12,
        ema26,
        rsi14,
        macd,
        bollingerBands,
        vwap,
        atr14,
      },
    };
  }

  private generateBaselineCandles(quote: any, timeframe: string, limit: number): Candle[] {
    const basePrice = quote.price || 100;
    const prevClose = quote.previousClose || basePrice;
    const candles: Candle[] = [];
    const nowSec = Math.floor(Date.now() / 1000);

    let stepSec = 86400; // 1D
    switch (timeframe) {
      case '1m': stepSec = 60; break;
      case '5m': stepSec = 300; break;
      case '15m': stepSec = 900; break;
      case '30m': stepSec = 1800; break;
      case '1H': stepSec = 3600; break;
      case '4H': stepSec = 14400; break;
      case '1D': stepSec = 86400; break;
      case '1W': stepSec = 7 * 86400; break;
      case '1M': stepSec = 30 * 86400; break;
      default: stepSec = 86400; break;
    }

    let currentPrice = prevClose;
    const count = Math.min(limit, 120);

    for (let i = count; i >= 0; i--) {
      const timestamp = nowSec - (i * stepSec);
      if (i === 0) {
        candles.push({
          timestamp,
          open: quote.open || prevClose,
          high: quote.dayHigh || Math.max(basePrice, prevClose),
          low: quote.dayLow || Math.min(basePrice, prevClose),
          close: basePrice,
          volume: quote.volume || 10000,
        });
      } else {
        const variation = (Math.sin(i * 0.5) * 0.008) + ((Math.cos(i * 0.3)) * 0.005);
        const open = Number((currentPrice).toFixed(2));
        const close = Number((currentPrice * (1 + variation)).toFixed(2));
        const high = Number((Math.max(open, close) * 1.003).toFixed(2));
        const low = Number((Math.min(open, close) * 0.997).toFixed(2));
        const volume = Math.floor(10000 + Math.abs(Math.sin(i)) * 50000);

        candles.push({ timestamp, open, high, low, close, volume });
        currentPrice = close;
      }
    }

    return candles;
  }

  public async getMarketOverview() {
    return marketDataProvider.getMarketOverview();
  }

  public async runScreener(filters: ScreenerFilters) {
    return marketDataProvider.getScreenerStocks(filters);
  }
}

export const stockService = new StockService();
