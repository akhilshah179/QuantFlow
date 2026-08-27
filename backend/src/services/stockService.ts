import { marketDataProvider } from '../providers/MarketDataProviderRouter';
import { marketIngestionService } from './marketIngestionService';
import { symbolResolver, NormalizedSymbol } from './SymbolResolver';
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
  public resolveSymbol(symbol: string): NormalizedSymbol {
    return symbolResolver.resolve(symbol);
  }

  public async searchStocks(query: string) {
    const results = await marketDataProvider.searchStocks(query);

    // Map each result through symbolResolver to attach displaySymbol, providerSymbol, exchange, supported
    return results.map((item: any) => {
      const resolved = symbolResolver.resolve(item.symbol);
      return {
        ...item,
        symbol: resolved.symbol,
        displaySymbol: resolved.displaySymbol,
        providerSymbol: resolved.providerSymbol,
        exchange: resolved.exchange,
        name: resolved.companyName || item.name,
        supported: resolved.supported,
        unsupportedReason: resolved.unsupportedReason,
      };
    });
  }

  public async getStockQuote(symbol: string) {
    const resolved = symbolResolver.resolve(symbol);

    if (!resolved.supported) {
      throw {
        statusCode: 400,
        message: resolved.unsupportedReason || `Market data is currently unavailable for exchange/provider '${resolved.exchange}'.`,
      };
    }

    // Try Redis cache via providerSymbol
    let quote = await marketIngestionService.getLatestQuote(resolved.providerSymbol);
    if (!quote || quote.price <= 0) {
      quote = await marketDataProvider.getQuote(resolved.providerSymbol);
    }

    if (!quote || quote.price <= 0) {
      // Try resolving via displaySymbol or input symbol
      quote = await marketDataProvider.getQuote(resolved.displaySymbol);
    }

    if (!quote || quote.price <= 0) {
      throw {
        statusCode: 400,
        message: `Market data is currently unavailable for exchange/provider '${resolved.exchange}'.`,
      };
    }

    return {
      ...quote,
      symbol: resolved.symbol,
      displaySymbol: resolved.displaySymbol,
      providerSymbol: resolved.providerSymbol,
      exchange: resolved.exchange,
      name: resolved.companyName || quote.name,
    };
  }

  public async getHistoricalData(symbol: string, timeframe: string = '1D', limit: number = 300) {
    const resolved = symbolResolver.resolve(symbol);

    if (!resolved.supported) {
      throw {
        statusCode: 400,
        message: resolved.unsupportedReason || `Market data is currently unavailable for exchange/provider '${resolved.exchange}'.`,
      };
    }

    let candles = await marketDataProvider.getHistoricalCandles(resolved.providerSymbol, timeframe, limit);
    if (!candles || candles.length === 0) {
      candles = await marketDataProvider.getHistoricalCandles(resolved.displaySymbol, timeframe, limit);
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
      symbol: resolved.symbol,
      displaySymbol: resolved.displaySymbol,
      providerSymbol: resolved.providerSymbol,
      exchange: resolved.exchange,
      companyName: resolved.companyName,
      supported: resolved.supported,
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

  public async getMarketOverview() {
    return marketDataProvider.getMarketOverview();
  }

  public async runScreener(filters: ScreenerFilters) {
    return marketDataProvider.getScreenerStocks(filters);
  }
}

export const stockService = new StockService();
