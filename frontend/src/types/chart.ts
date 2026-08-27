export type ChartType = 'candlestick' | 'line' | 'area';

export type IndicatorType = 'SMA_20' | 'SMA_50' | 'EMA_12' | 'EMA_26' | 'RSI_14' | 'MACD' | 'BB_20' | 'VWAP' | 'ATR_14';

export interface IndicatorConfig {
  id: IndicatorType;
  name: string;
  category: 'Overlay' | 'Oscillator';
  color: string;
}
