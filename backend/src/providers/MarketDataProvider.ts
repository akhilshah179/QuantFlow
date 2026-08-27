import { Candle } from '../indicators';

export type MarketStatusType =
  | 'LIVE'
  | 'PRE-MARKET'
  | 'AFTER-HOURS'
  | 'OPEN'
  | 'MARKET_CLOSED'
  | 'HOLIDAY'
  | 'DELAYED'
  | 'STALE'
  | 'DISCONNECTED';

export type DataQualityType = 'REALTIME' | 'DELAYED' | 'EOD' | 'MOCK';

export interface MarketTick {
  symbol: string;
  exchange: string;
  price: number;
  quantity?: number;
  volume?: number;
  bid?: number;
  ask?: number;
  timestamp: number;
  source: string;
}

export interface Instrument {
  symbol: string;
  name: string;
  exchange: string;
  country: string;
  currency: string;
  assetType: string;
  providerSymbol: string;
  timezone: string;
  provider?: string;
  sector?: string;
  industry?: string;
  marketStatus: MarketStatusType;
}

export interface StockQuote {
  symbol: string;
  name: string;
  exchange: string;
  country?: string;
  currency?: string;
  sector?: string;
  industry?: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  previousClose: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  marketCap?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  peRatio?: number;
  eps?: number;
  dividendYield?: number;
  beta?: number;
  bid?: number | null;
  ask?: number | null;
  bidSize?: number;
  askSize?: number;

  lastTradeTime?: number;
  marketStatus: MarketStatusType;
  dataQuality?: DataQualityType;
  isMock?: boolean;
  timestamp: number;
}

export interface TickUpdate {
  type: 'PRICE_UPDATE';
  symbol: string;
  exchange?: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  bid?: number | null;
  ask?: number | null;

  marketStatus?: MarketStatusType;
  dataQuality?: DataQualityType;
  isMock?: boolean;
  timestamp: number;
  source?: string;
}

export interface ScreenerFilters {
  exchange?: string;
  sector?: string;
  minPrice?: number;
  maxPrice?: number;
  minMarketCap?: number;
  maxMarketCap?: number;
  minVolume?: number;
  minPeRatio?: number;
  maxPeRatio?: number;
  minDividendYield?: number;
  query?: string;
}

export interface MarketOverviewData {
  indices: Array<{
    name: string;
    symbol: string;
    value: number;
    change: number;
    changePercent: number;
    marketStatus: MarketStatusType;
  }>;
  topGainers: StockQuote[];
  topLosers: StockQuote[];
  mostActive: StockQuote[];
  sectorPerformance: Array<{ sector: string; changePercent: number }>;
}

export interface MarketDataProvider {
  getQuote(symbol: string): Promise<StockQuote | null>;
  getHistoricalCandles(symbol: string, timeframe: string, limit?: number): Promise<Candle[]>;
  searchStocks(query: string): Promise<Array<{ symbol: string; name: string; exchange: string; price: number; changePercent: number; currency?: string }>>;
  getMarketOverview(): Promise<MarketOverviewData>;
  getScreenerStocks(filters: ScreenerFilters): Promise<StockQuote[]>;
  startTickStream(onTick: (tick: TickUpdate) => void): void;
  stopTickStream(): void;
  subscribeSymbol?(symbol: string): void;
}

