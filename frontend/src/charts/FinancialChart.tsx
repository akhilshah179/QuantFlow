import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  ColorType,
  CrosshairMode,
  CandlestickData,
  LineData,
  HistogramData,
} from 'lightweight-charts';
import { Candle, Timeframe } from '../types/stock';
import { ChartType, IndicatorType } from '../types/chart';
import { WSTickUpdate } from '../types/ws';
import { TrendingUp, Minus, ShieldAlert, RotateCcw } from 'lucide-react';

interface FinancialChartProps {
  candles: Candle[];
  chartType: ChartType;
  indicators: IndicatorType[];
  timeframe?: Timeframe;
  realtimeTick?: WSTickUpdate | null;
  indicatorData?: {
    sma20?: Array<{ timestamp: number; value: number }>;
    sma50?: Array<{ timestamp: number; value: number }>;
    ema12?: Array<{ timestamp: number; value: number }>;
    ema26?: Array<{ timestamp: number; value: number }>;
    rsi14?: Array<{ timestamp: number; value: number }>;
    macd?: Array<{ timestamp: number; macd: number; signal: number; histogram: number }>;
    bollingerBands?: Array<{ timestamp: number; upper: number; middle: number; lower: number }>;
    vwap?: Array<{ timestamp: number; value: number }>;
    atr14?: Array<{ timestamp: number; value: number }>;
  };
}

export const FinancialChart: React.FC<FinancialChartProps> = ({
  candles,
  chartType,
  indicators,
  timeframe = '1D',
  realtimeTick,
  indicatorData,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const indicatorSeriesRef = useRef<Map<string, ISeriesApi<any>>>(new Map());
  const [drawnLines, setDrawnLines] = useState<Array<{ id: string; price: number; label: string; color: string }>>([]);

  // Initialize Chart in White TradingView Theme
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#131722',
        fontSize: 11,
        fontFamily: 'Inter, -apple-system, sans-serif',
      },
      grid: {
        vertLines: { color: '#f0f3fa' },
        horzLines: { color: '#f0f3fa' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#9598a1', width: 1, style: 1 },
        horzLine: { color: '#9598a1', width: 1, style: 1 },
      },
      rightPriceScale: {
        borderColor: '#e0e3eb',
        scaleMargins: {
          top: 0.1,
          bottom: 0.25,
        },
      },
      timeScale: {
        borderColor: '#e0e3eb',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    });

    chartRef.current = chart;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  // Update Main Price & Volume Series
  useEffect(() => {
    if (!chartRef.current) return;

    if (mainSeriesRef.current) {
      try { chartRef.current.removeSeries(mainSeriesRef.current); } catch {}
      mainSeriesRef.current = null;
    }
    if (volumeSeriesRef.current) {
      try { chartRef.current.removeSeries(volumeSeriesRef.current); } catch {}
      volumeSeriesRef.current = null;
    }

    if (!candles || candles.length === 0) return;

    const sanitized = candles
      .filter((c) => c && typeof c.timestamp === 'number' && !isNaN(c.timestamp) && Number(c.open) > 0)
      .map((c) => ({
        timestamp: c.timestamp > 1e11 ? Math.floor(c.timestamp / 1000) : c.timestamp,
        open: Number(c.open),
        high: Number(c.high),
        low: Number(c.low),
        close: Number(c.close),
        volume: Number(c.volume || 0),
      }))
      .sort((a, b) => a.timestamp - b.timestamp);

    const cleanCandles: Candle[] = [];
    const seenTimes = new Set<number>();
    for (const c of sanitized) {
      if (!seenTimes.has(c.timestamp)) {
        seenTimes.add(c.timestamp);
        cleanCandles.push(c);
      }
    }

    if (cleanCandles.length === 0) return;

    const volumeSeries = chartRef.current.addHistogramSeries({
      color: '#089981',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    chartRef.current.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.75,
        bottom: 0,
      },
    });

    const volumeData: HistogramData[] = cleanCandles.map((c) => ({
      time: c.timestamp as any,
      value: c.volume,
      color: c.close >= c.open ? 'rgba(8, 153, 129, 0.35)' : 'rgba(242, 54, 69, 0.35)',
    }));
    volumeSeries.setData(volumeData);
    volumeSeriesRef.current = volumeSeries;

    const samplePrice = cleanCandles[cleanCandles.length - 1]?.close || 1;
    const isJpyOrInr = samplePrice > 20;
    const precision = isJpyOrInr ? 3 : 5;
    const minMove = isJpyOrInr ? 0.001 : 0.00001;

    if (chartType === 'candlestick') {
      const candlestickSeries = chartRef.current.addCandlestickSeries({
        upColor: '#089981',
        downColor: '#f23645',
        borderVisible: false,
        wickUpColor: '#089981',
        wickDownColor: '#f23645',
        priceFormat: { type: 'price', precision, minMove },
      });

      const formattedData: CandlestickData[] = cleanCandles.map((c) => ({
        time: c.timestamp as any,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));

      candlestickSeries.setData(formattedData);
      mainSeriesRef.current = candlestickSeries;
    } else if (chartType === 'area') {
      const areaSeries = chartRef.current.addAreaSeries({
        topColor: 'rgba(41, 98, 255, 0.28)',
        bottomColor: 'rgba(41, 98, 255, 0.02)',
        lineColor: '#2962ff',
        lineWidth: 2,
        priceFormat: { type: 'price', precision, minMove },
      });

      const formattedData: LineData[] = cleanCandles.map((c) => ({
        time: c.timestamp as any,
        value: c.close,
      }));

      areaSeries.setData(formattedData);
      mainSeriesRef.current = areaSeries;
    } else {
      const lineSeries = chartRef.current.addLineSeries({
        color: '#2962ff',
        lineWidth: 2,
        priceFormat: { type: 'price', precision, minMove },
      });

      const formattedData: LineData[] = cleanCandles.map((c) => ({
        time: c.timestamp as any,
        value: c.close,
      }));

      lineSeries.setData(formattedData);
      mainSeriesRef.current = lineSeries;
    }


    chartRef.current.priceScale('right').applyOptions({
      autoScale: true,
      scaleMargins: {
        top: 0.1,
        bottom: 0.25,
      },
    });

    chartRef.current.timeScale().fitContent();

  }, [candles, chartType]);

  // Render Technical Indicators
  useEffect(() => {
    if (!chartRef.current || !indicatorData) return;

    indicatorSeriesRef.current.forEach((series) => {
      try { chartRef.current?.removeSeries(series); } catch {}
    });
    indicatorSeriesRef.current.clear();

    if (indicators.includes('SMA_20') && indicatorData.sma20) {
      const smaSeries = chartRef.current.addLineSeries({ color: '#f5a623', lineWidth: 1, title: 'SMA 20' });
      smaSeries.setData(indicatorData.sma20.map((pt) => ({ time: pt.timestamp as any, value: pt.value })));
      indicatorSeriesRef.current.set('SMA_20', smaSeries);
    }

    if (indicators.includes('SMA_50') && indicatorData.sma50) {
      const sma50Series = chartRef.current.addLineSeries({ color: '#ff9800', lineWidth: 1, title: 'SMA 50' });
      sma50Series.setData(indicatorData.sma50.map((pt) => ({ time: pt.timestamp as any, value: pt.value })));
      indicatorSeriesRef.current.set('SMA_50', sma50Series);
    }

    if (indicators.includes('EMA_12') && indicatorData.ema12) {
      const ema12Series = chartRef.current.addLineSeries({ color: '#2196f3', lineWidth: 1, title: 'EMA 12' });
      ema12Series.setData(indicatorData.ema12.map((pt) => ({ time: pt.timestamp as any, value: pt.value })));
      indicatorSeriesRef.current.set('EMA_12', ema12Series);
    }

    if (indicators.includes('EMA_26') && indicatorData.ema26) {
      const ema26Series = chartRef.current.addLineSeries({ color: '#e91e63', lineWidth: 1, title: 'EMA 26' });
      ema26Series.setData(indicatorData.ema26.map((pt) => ({ time: pt.timestamp as any, value: pt.value })));
      indicatorSeriesRef.current.set('EMA_26', ema26Series);
    }

    if (indicators.includes('VWAP') && indicatorData.vwap) {
      const vwapSeries = chartRef.current.addLineSeries({ color: '#089981', lineWidth: 2, title: 'VWAP' });
      vwapSeries.setData(indicatorData.vwap.map((pt) => ({ time: pt.timestamp as any, value: pt.value })));
      indicatorSeriesRef.current.set('VWAP', vwapSeries);
    }

    if (indicators.includes('ATR_14') && indicatorData.atr14) {
      const atrSeries = chartRef.current.addLineSeries({ color: '#ff5722', lineWidth: 1, title: 'ATR (14)' });
      atrSeries.setData(indicatorData.atr14.map((pt) => ({ time: pt.timestamp as any, value: pt.value })));
      indicatorSeriesRef.current.set('ATR_14', atrSeries);
    }

    if (indicators.includes('BB_20') && indicatorData.bollingerBands) {
      const upperSeries = chartRef.current.addLineSeries({ color: 'rgba(156, 39, 176, 0.8)', lineWidth: 1, title: 'BB Upper' });
      const lowerSeries = chartRef.current.addLineSeries({ color: 'rgba(156, 39, 176, 0.8)', lineWidth: 1, title: 'BB Lower' });
      upperSeries.setData(indicatorData.bollingerBands.map((pt) => ({ time: pt.timestamp as any, value: pt.upper })));
      lowerSeries.setData(indicatorData.bollingerBands.map((pt) => ({ time: pt.timestamp as any, value: pt.lower })));

      indicatorSeriesRef.current.set('BB_20_UPPER', upperSeries);
      indicatorSeriesRef.current.set('BB_20_LOWER', lowerSeries);
    }
  }, [indicators, indicatorData]);

  // Handle Real-time Tick Updates
  useEffect(() => {
    if (!realtimeTick || !mainSeriesRef.current || candles.length === 0) return;

    const lastCandle = candles[candles.length - 1];
    const tickTime = realtimeTick.timestamp;
    const price = realtimeTick.price;

    let stepSec = 86400;
    switch (timeframe) {
      case '1m': stepSec = 60; break;
      case '5m': stepSec = 300; break;
      case '15m': stepSec = 900; break;
      case '30m': stepSec = 1800; break;
      case '1H': stepSec = 3600; break;
      case '4H': stepSec = 14400; break;
      case '1D': stepSec = 86400; break;
    }

    const bucketTime = Math.floor(tickTime / stepSec) * stepSec;
    const targetTime = (bucketTime <= lastCandle.timestamp || Math.abs(tickTime - lastCandle.timestamp) < stepSec)
      ? lastCandle.timestamp
      : bucketTime;

    if (targetTime === lastCandle.timestamp) {
      lastCandle.high = Math.max(lastCandle.high, price);
      lastCandle.low = Math.min(lastCandle.low, price);
      lastCandle.close = price;
    }

    if (chartType === 'candlestick') {
      mainSeriesRef.current.update({
        time: targetTime as any,
        open: lastCandle.open,
        high: Math.max(lastCandle.high, price),
        low: Math.min(lastCandle.low, price),
        close: price,
      });
    } else {
      mainSeriesRef.current.update({
        time: targetTime as any,
        value: price,
      });
    }

    if (volumeSeriesRef.current) {
      volumeSeriesRef.current.update({
        time: targetTime as any,
        value: realtimeTick.volume,
        color: price >= lastCandle.open ? 'rgba(8, 153, 129, 0.45)' : 'rgba(242, 54, 69, 0.45)',
      });
    }
  }, [realtimeTick, chartType, candles, timeframe]);

  const handleAddPriceLine = (tool: string) => {
    if (!mainSeriesRef.current || candles.length === 0) return;
    const lastPrice = candles[candles.length - 1].close;
    const color = tool === 'support' ? '#089981' : tool === 'resistance' ? '#f23645' : '#2962ff';

    mainSeriesRef.current.createPriceLine({
      price: lastPrice,
      color,
      lineWidth: 2,
      lineStyle: 2,
      axisLabelVisible: true,
      title: `${tool.toUpperCase()} LEVEL`,
    });

    setDrawnLines((prev) => [
      ...prev,
      { id: Math.random().toString(), price: lastPrice, label: tool.toUpperCase(), color },
    ]);
  };

  const handleClearLines = () => {
    setDrawnLines([]);
  };

  return (
    <div className="relative w-full h-full min-h-[440px] bg-white rounded-lg overflow-hidden border border-[#e0e3eb] flex">
      {/* Drawing Toolbar Left */}
      <div className="w-10 bg-[#f8f9fd] border-r border-[#e0e3eb] flex flex-col items-center py-2 space-y-2 select-none z-10">
        <button
          onClick={() => handleAddPriceLine('trend')}
          title="Add Trend Level"
          className="p-1.5 rounded text-[#707a8a] hover:text-[#131722] hover:bg-[#e8f0fe] transition-colors"
        >
          <TrendingUp className="w-4 h-4 text-[#2962ff]" />
        </button>
        <button
          onClick={() => handleAddPriceLine('support')}
          title="Add Support Level"
          className="p-1.5 rounded text-[#707a8a] hover:text-[#131722] hover:bg-[#e6f4f1] transition-colors"
        >
          <Minus className="w-4 h-4 text-[#089981]" />
        </button>
        <button
          onClick={() => handleAddPriceLine('resistance')}
          title="Add Resistance Level"
          className="p-1.5 rounded text-[#707a8a] hover:text-[#131722] hover:bg-[#fdecee] transition-colors"
        >
          <ShieldAlert className="w-4 h-4 text-[#f23645]" />
        </button>
        {drawnLines.length > 0 && (
          <button
            onClick={handleClearLines}
            title="Clear Drawing Lines"
            className="p-1.5 rounded text-[#707a8a] hover:text-[#f23645] hover:bg-[#f0f3fa] transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Chart Canvas */}
      <div className="flex-1 relative">
        <div ref={chartContainerRef} className="w-full h-full min-h-[440px]" />
      </div>
    </div>
  );
};
