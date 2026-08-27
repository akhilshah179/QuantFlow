import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { StockQuote, Candle } from '../types/stock';
import { StockHeader } from '../components/stock/StockHeader';
import { TimeframeBar } from '../components/stock/TimeframeBar';
import { IndicatorSelector } from '../components/stock/IndicatorSelector';
import { FinancialChart } from '../charts/FinancialChart';
import { QuickTradePanel } from '../components/trading/QuickTradePanel';
import { NewsSection } from '../components/news/NewsSection';
import { useChartStore } from '../store/chartStore';
import { useRealtimeQuote } from '../hooks/useRealtimeQuote';
import { ShieldAlert } from 'lucide-react';

export const StockDetailPage: React.FC = () => {
  const { symbol = 'AAPL' } = useParams<{ symbol: string }>();
  const upperSymbol = symbol.toUpperCase();

  const [resolvedSymbol, setResolvedSymbol] = useState<any>(null);
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [indicatorData, setIndicatorData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const {
    timeframe,
    chartType,
    activeIndicators,
    setActiveSymbol,
    setTimeframe,
    setChartType,
    toggleIndicator,
  } = useChartStore();

  const activeProviderSymbol = resolvedSymbol?.providerSymbol || upperSymbol;
  const realtimeTick = useRealtimeQuote(activeProviderSymbol);

  useEffect(() => {
    setActiveSymbol(activeProviderSymbol);
  }, [activeProviderSymbol, setActiveSymbol]);

  const fetchStockData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Resolve symbol
      const resolveRes: any = await api.get(`/stocks/${upperSymbol}/resolve`);
      const resolved = resolveRes?.data || resolveRes;
      setResolvedSymbol(resolved);

      if (resolved && resolved.supported === false) {
        setError(resolved.unsupportedReason || `Market data unavailable for this exchange/provider (${resolved.exchange || upperSymbol}).`);
        setLoading(false);
        return;
      }

      const targetSym = resolved?.providerSymbol || upperSymbol;

      // 2. Fetch Quote & History using providerSymbol
      const [quoteRes, historyRes]: [any, any] = await Promise.all([
        api.get(`/stocks/${targetSym}`),
        api.get(`/stocks/${targetSym}/history?timeframe=${timeframe}`),
      ]);

      const quoteObj = quoteRes?.price !== undefined ? quoteRes : (quoteRes?.data || null);
      const historyObj = historyRes?.candles ? historyRes : (historyRes?.data || {});

      if (!quoteObj) {
        setError(`Market data unavailable for this exchange/provider (${resolved?.exchange || upperSymbol}).`);
      } else {
        setQuote({
          ...quoteObj,
          symbol: resolved?.symbol || quoteObj.symbol,
          name: resolved?.companyName || quoteObj.name,
        });
      }

      setCandles(historyObj?.candles || []);
      setIndicatorData(historyObj?.indicators || {});
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || `Market data unavailable for this exchange/provider.`);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData();
  }, [upperSymbol, timeframe]);

  if (loading) {
    return (
      <div className="p-8 text-center text-[#707a8a] font-mono animate-pulse">
        Resolving symbol and fetching real market data for {upperSymbol}...
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="p-8 text-center space-y-4 bg-white border border-[#e0e3eb] rounded-lg text-[#131722]">
        <div className="text-[#f23645] font-mono text-xs flex items-center justify-center space-x-2 font-bold">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{error || `Market data unavailable for this exchange/provider.`}</span>
        </div>
        <p className="text-xs font-mono text-[#707a8a]">
          The symbol '{upperSymbol}' was located, but real-time stream and kline candles are not served by active exchange data feeds.
        </p>
        <button
          onClick={fetchStockData}
          className="bg-[#2962ff] hover:bg-[#1e54e4] text-white px-4 py-1.5 rounded text-xs font-mono font-bold transition-colors cursor-pointer"
        >
          Retry Provider Query
        </button>
      </div>
    );
  }

  const currentPrice = realtimeTick ? realtimeTick.price : quote.price;

  return (
    <div className="space-y-3 text-[#131722]">
      {/* Header Market Statistics Terminal */}
      <StockHeader quote={quote} realtimeTick={realtimeTick} />

      {/* Main Workspace Grid: Technical Chart + Order Book / Trade Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {/* Technical Chart Workspace (3 cols) */}
        <div className="lg:col-span-3 flex flex-col space-y-2">
          <TimeframeBar
            activeTimeframe={timeframe}
            onTimeframeChange={setTimeframe}
            activeChartType={chartType}
            onChartTypeChange={setChartType}
          />

          <IndicatorSelector
            activeIndicators={activeIndicators}
            onToggleIndicator={toggleIndicator}
          />

          <div className="h-[540px]">
            <FinancialChart
              candles={candles}
              chartType={chartType}
              indicators={activeIndicators}
              timeframe={timeframe}
              realtimeTick={realtimeTick}
              indicatorData={indicatorData}
            />
          </div>
        </div>

        {/* Paper Order Entry Terminal Column (1 col) */}
        <div className="lg:col-span-1">
          <QuickTradePanel symbol={upperSymbol} currentPrice={currentPrice} />
        </div>
      </div>

      {/* Symbol Intelligence & News */}
      <div className="pt-2">
        <NewsSection symbol={upperSymbol} limit={6} />
      </div>
    </div>
  );
};
