import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { StockHeader } from '../components/stock/StockHeader';
import { TimeframeBar } from '../components/stock/TimeframeBar';
import { IndicatorSelector } from '../components/stock/IndicatorSelector';
import { FinancialChart } from '../charts/FinancialChart';
import { QuickTradePanel } from '../components/trading/QuickTradePanel';
import { NewsSection } from '../components/news/NewsSection';
import { useChartStore } from '../store/chartStore';
import { useRealtimeQuote } from '../hooks/useRealtimeQuote';
import { useStockHistory, useStockQuote } from '../services/queries';
import { Panel } from '../components/ui/Panel';
import { Button } from '../components/ui/Button';
import { EmptyState, Skeleton } from '../components/ui/misc';

const EMPTY: never[] = [];

export const StockDetailPage: React.FC = () => {
  const { symbol = 'AAPL' } = useParams<{ symbol: string }>();
  const upperSymbol = symbol.toUpperCase();

  const timeframe = useChartStore((s) => s.timeframe);
  const chartType = useChartStore((s) => s.chartType);
  const activeIndicators = useChartStore((s) => s.activeIndicators);
  const setActiveSymbol = useChartStore((s) => s.setActiveSymbol);
  const setTimeframe = useChartStore((s) => s.setTimeframe);
  const setChartType = useChartStore((s) => s.setChartType);
  const toggleIndicator = useChartStore((s) => s.toggleIndicator);

  const realtimeTick = useRealtimeQuote(upperSymbol);
  const quoteQuery = useStockQuote(upperSymbol);
  const historyQuery = useStockHistory(upperSymbol, timeframe);

  useEffect(() => {
    setActiveSymbol(upperSymbol);
  }, [upperSymbol, setActiveSymbol]);

  const fetchStockData = () => {
    quoteQuery.refetch();
    historyQuery.refetch();
  };

  const quote = quoteQuery.data;

  if (quoteQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-[148px] w-full rounded-lg" />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <Skeleton className="h-[560px] rounded-lg lg:col-span-3" />
          <Skeleton className="h-[560px] rounded-lg" />
        </div>
      </div>
    );
  }

  if (quoteQuery.isError || !quote) {
    return (
      <Panel>
        <EmptyState
          icon={ShieldAlert}
          tone="down"
          title={(quoteQuery.error as Error)?.message || `Stock symbol ${upperSymbol} not found or market data unavailable.`}
          action={
            <Button variant="primary" onClick={fetchStockData} loading={quoteQuery.isFetching}>
              Retry Connection
            </Button>
          }
        />
      </Panel>
    );
  }

  const currentPrice = realtimeTick ? realtimeTick.price : quote.price;
  const candles = historyQuery.data?.candles ?? EMPTY;
  // Placeholder candles belong to the previous symbol/timeframe — don't apply new ticks to them.
  const chartTick = historyQuery.isPlaceholderData ? null : realtimeTick;

  return (
    <div className="space-y-3">
      <div className={quoteQuery.isPlaceholderData ? 'pointer-events-none opacity-50 transition-opacity' : 'transition-opacity'}>
        <StockHeader quote={quote} realtimeTick={quoteQuery.isPlaceholderData ? null : realtimeTick} />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
        {/* Technical chart workspace */}
        <div className="flex flex-col gap-2 lg:col-span-3">
          <div className="qf-panel flex flex-col gap-2 px-3 py-2">
            <TimeframeBar
              activeTimeframe={timeframe}
              onTimeframeChange={setTimeframe}
              activeChartType={chartType}
              onChartTypeChange={setChartType}
            />
            <div className="h-px bg-line" />
            <IndicatorSelector activeIndicators={activeIndicators} onToggleIndicator={toggleIndicator} />
          </div>

          <div className="h-[460px] sm:h-[560px]">
            <FinancialChart
              symbol={upperSymbol}
              candles={candles}
              chartType={chartType}
              indicators={activeIndicators}
              timeframe={timeframe}
              realtimeTick={chartTick}
              indicatorData={historyQuery.data?.indicators}
              loading={historyQuery.isFetching}
            />
          </div>
        </div>

        {/* Paper order entry */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-0">
            <QuickTradePanel symbol={upperSymbol} currentPrice={currentPrice} />
          </div>
        </div>
      </div>

      <NewsSection symbol={upperSymbol} limit={6} />
    </div>
  );
};
