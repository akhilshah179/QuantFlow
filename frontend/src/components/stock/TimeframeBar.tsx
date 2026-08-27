import React from 'react';
import { Timeframe } from '../../types/stock';
import { ChartType } from '../../types/chart';
import { CandlestickChart, LineChart, AreaChart } from 'lucide-react';

interface Props {
  activeTimeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  activeChartType: ChartType;
  onChartTypeChange: (ct: ChartType) => void;
}

const TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '30m', '1H', '4H', '1D', '1W', '1M', '1Y', 'MAX'];

export const TimeframeBar: React.FC<Props> = ({
  activeTimeframe,
  onTimeframeChange,
  activeChartType,
  onChartTypeChange,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 bg-white border border-[#e0e3eb] rounded-lg px-3 py-1.5 mb-2.5 shadow-xs select-none">
      {/* Timeframes Bar */}
      <div className="flex items-center space-x-1 overflow-x-auto">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf}
            onClick={() => onTimeframeChange(tf)}
            className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-colors ${
              activeTimeframe === tf
                ? 'bg-[#2962ff] text-white shadow-xs'
                : 'text-[#707a8a] hover:text-[#131722] hover:bg-[#f0f3fa]'
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Chart Type Toggle */}
      <div className="flex items-center space-x-1 bg-[#f8f9fd] border border-[#e0e3eb] p-0.5 rounded-md">
        <button
          onClick={() => onChartTypeChange('candlestick')}
          title="Candlestick Chart"
          className={`p-1 rounded transition-colors ${
            activeChartType === 'candlestick' ? 'bg-[#2962ff] text-white' : 'text-[#707a8a] hover:text-[#131722]'
          }`}
        >
          <CandlestickChart className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onChartTypeChange('line')}
          title="Line Chart"
          className={`p-1 rounded transition-colors ${
            activeChartType === 'line' ? 'bg-[#2962ff] text-white' : 'text-[#707a8a] hover:text-[#131722]'
          }`}
        >
          <LineChart className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onChartTypeChange('area')}
          title="Area Chart"
          className={`p-1 rounded transition-colors ${
            activeChartType === 'area' ? 'bg-[#2962ff] text-white' : 'text-[#707a8a] hover:text-[#131722]'
          }`}
        >
          <AreaChart className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
