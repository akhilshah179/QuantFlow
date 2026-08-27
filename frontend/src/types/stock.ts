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
  bid?: number;
  ask?: number;
  marketStatus: MarketStatusType;
  dataQuality?: DataQualityType;
  isMock?: boolean;
  timestamp: number;
}

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type Timeframe = '1m' | '5m' | '15m' | '30m' | '1H' | '4H' | '1D' | '1W' | '1M' | '1Y' | 'MAX';

export interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  price: number;
  changePercent?: number;
  currency?: string;
}

export interface MarketIndex {
  name: string;
  symbol: string;
  value: number;
  change: number;
  changePercent: number;
  marketStatus: MarketStatusType;
}

export interface MarketOverviewData {
  indices: MarketIndex[];
  topGainers: StockQuote[];
  topLosers: StockQuote[];
  mostActive: StockQuote[];
  sectorPerformance: Array<{ sector: string; changePercent: number }>;
}

export interface ScreenerFilters {
  exchange?: string;
  sector?: string;
  minPrice?: number;
  maxPrice?: number;
  minMarketCap?: number;
  maxMarketCap?: number;
  minVolume?: number;
  maxPeRatio?: number;
  minDividendYield?: number;
  query?: string;
}
