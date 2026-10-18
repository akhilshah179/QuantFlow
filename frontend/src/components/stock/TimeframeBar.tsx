import React from 'react';
import { Timeframe } from '../../types/stock';
import { ChartType } from '../../types/chart';
import { CandlestickChart, LineChart, AreaChart } from 'lucide-react';
import { Segmented } from '../ui/Segmented';

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
    <div className="flex select-none flex-wrap items-center justify-between gap-2">
      <div className="max-w-full overflow-x-auto scrollbar-none">
        <Segmented
          id="timeframe"
          size="xs"
          value={activeTimeframe}
          onChange={onTimeframeChange}
          options={TIMEFRAMES.map((tf) => ({ value: tf, label: tf }))}
        />
      </div>

      <Segmented
        id="chart-type"
        size="xs"
        value={activeChartType}
        onChange={onChartTypeChange}
        options={[
          { value: 'candlestick', label: <CandlestickChart className="h-3.5 w-3.5" />, title: 'Candlestick chart' },
          { value: 'line', label: <LineChart className="h-3.5 w-3.5" />, title: 'Line chart' },
          { value: 'area', label: <AreaChart className="h-3.5 w-3.5" />, title: 'Area chart' },
        ]}
      />
    </div>
  );
};
