import { create } from 'zustand';
import { Timeframe } from '../types/stock';
import { ChartType, IndicatorType } from '../types/chart';

interface ChartState {
  activeSymbol: string;
  timeframe: Timeframe;
  chartType: ChartType;
  activeIndicators: IndicatorType[];
  setActiveSymbol: (symbol: string) => void;
  setTimeframe: (tf: Timeframe) => void;
  setChartType: (ct: ChartType) => void;
  toggleIndicator: (ind: IndicatorType) => void;
}

export const useChartStore = create<ChartState>((set) => ({
  activeSymbol: 'AAPL',
  timeframe: '1D',
  chartType: 'candlestick',
  activeIndicators: ['SMA_20', 'RSI_14'],

  setActiveSymbol: (symbol: string) => set({ activeSymbol: symbol.toUpperCase() }),
  setTimeframe: (timeframe: Timeframe) => set({ timeframe }),
  setChartType: (chartType: ChartType) => set({ chartType }),
  toggleIndicator: (indicator: IndicatorType) =>
    set((state) => ({
      activeIndicators: state.activeIndicators.includes(indicator)
        ? state.activeIndicators.filter((i) => i !== indicator)
        : [...state.activeIndicators, indicator],
    })),
}));
