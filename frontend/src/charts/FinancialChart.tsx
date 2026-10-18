import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  IPriceLine,
  ColorType,
  CrosshairMode,
  LineStyle,
  LastPriceAnimationMode,
  CandlestickData,
  LineData,
  HistogramData,
  MouseEventParams,
} from 'lightweight-charts';
import { Candle, Timeframe } from '../types/stock';
import { ChartType, IndicatorType } from '../types/chart';
import { WSTickUpdate } from '../types/ws';
import { Maximize2, Minus, RotateCcw, ShieldAlert, TrendingUp } from 'lucide-react';
import { cn } from '../utils/cn';

interface FinancialChartProps {
  candles: Candle[];
  chartType: ChartType;
  indicators: IndicatorType[];
  timeframe?: Timeframe;
  realtimeTick?: WSTickUpdate | null;
  /** Shown in the legend and as a faint watermark. */
  symbol?: string;
  /** True while a new series is being fetched — dims the canvas instead of unmounting it. */
  loading?: boolean;
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

/* Palette (mirrors the CSS tokens; the canvas can't read Tailwind classes) */
const C = {
  up: '#22c584',
  down: '#f25262',
  accent: '#f5b142',
  text: '#7d8799',
  grid: 'rgba(255, 255, 255, 0.035)',
  border: 'rgba(255, 255, 255, 0.07)',
  crosshair: 'rgba(245, 177, 66, 0.45)',
  label: '#1b212b',
  upVol: 'rgba(34, 197, 132, 0.28)',
  downVol: 'rgba(242, 82, 98, 0.28)',
};

export const INDICATOR_COLORS: Record<IndicatorType, string> = {
  SMA_20: '#f5b142',
  SMA_50: '#e07b39',
  EMA_12: '#60a5fa',
  EMA_26: '#c084fc',
  VWAP: '#2dd4bf',
  BB_20: '#a78bfa',
  RSI_14: '#38bdf8',
  MACD: '#f472b6',
  ATR_14: '#fb923c',
};

const OSCILLATORS: IndicatorType[] = ['RSI_14', 'MACD', 'ATR_14'];

const fmt = (v: number) =>
  v >= 1000 ? v.toLocaleString('en-US', { maximumFractionDigits: 2 }) : v.toFixed(v < 1 ? 4 : 2);

const fmtVol = (v: number) =>
  v >= 1e9 ? `${(v / 1e9).toFixed(2)}B` : v >= 1e6 ? `${(v / 1e6).toFixed(2)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(1)}K` : `${Math.round(v)}`;

export const FinancialChart: React.FC<FinancialChartProps> = ({
  candles,
  chartType,
  indicators,
  timeframe = '1D',
  realtimeTick,
  symbol,
  loading,
  indicatorData,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const indicatorSeriesRef = useRef<Map<string, ISeriesApi<any>>>(new Map());
  const priceLinesRef = useRef<IPriceLine[]>([]);
  const candleMapRef = useRef<Map<number, Candle>>(new Map());
  const lastCandleRef = useRef<Candle | null>(null);
  const crosshairActiveRef = useRef(false);
  const legendRef = useRef<{ o: HTMLSpanElement | null; h: HTMLSpanElement | null; l: HTMLSpanElement | null; c: HTMLSpanElement | null; chg: HTMLSpanElement | null; v: HTMLSpanElement | null }>({
    o: null,
    h: null,
    l: null,
    c: null,
    chg: null,
    v: null,
  });
  const [drawnLines, setDrawnLines] = useState<Array<{ id: string; price: number; label: string; color: string }>>([]);

  /* Legend writes go straight to the DOM — crosshair moves never re-render React. */
  const writeLegend = (c: Candle | null | undefined) => {
    const L = legendRef.current;
    if (!c || !L.c) return;
    const up = c.close >= c.open;
    const change = c.close - c.open;
    const pct = c.open ? (change / c.open) * 100 : 0;
    if (L.o) L.o.textContent = fmt(c.open);
    if (L.h) L.h.textContent = fmt(c.high);
    if (L.l) L.l.textContent = fmt(c.low);
    L.c.textContent = fmt(c.close);
    L.c.style.color = up ? C.up : C.down;
    if (L.chg) {
      L.chg.textContent = `${change >= 0 ? '+' : '−'}${fmt(Math.abs(change))} (${pct >= 0 ? '+' : '−'}${Math.abs(pct).toFixed(2)}%)`;
      L.chg.style.color = up ? C.up : C.down;
    }
    if (L.v) L.v.textContent = fmtVol(c.volume || 0);
  };

  // Initialize chart in the terminal theme
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: C.text,
        fontSize: 10,
        fontFamily: '"JetBrains Mono", ui-monospace, monospace',
      },
      grid: {
        vertLines: { color: C.grid },
        horzLines: { color: C.grid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: C.crosshair, width: 1, style: LineStyle.Dashed, labelBackgroundColor: C.label },
        horzLine: { color: C.crosshair, width: 1, style: LineStyle.Dashed, labelBackgroundColor: C.label },
      },
      rightPriceScale: {
        borderColor: C.border,
        scaleMargins: { top: 0.08, bottom: 0.25 },
      },
      timeScale: {
        borderColor: C.border,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 6,
        barSpacing: 7,
      },
      watermark: {
        visible: !!symbol,
        text: symbol || '',
        color: 'rgba(255, 255, 255, 0.025)',
        fontSize: 72,
        fontFamily: '"JetBrains Mono", monospace',
        fontStyle: 'bold',
      },
      handleScroll: true,
      handleScale: true,
    });

    chartRef.current = chart;

    const onCrosshair = (param: MouseEventParams) => {
      if (!param.time || !param.point) {
        crosshairActiveRef.current = false;
        writeLegend(lastCandleRef.current);
        return;
      }
      crosshairActiveRef.current = true;
      writeLegend(candleMapRef.current.get(param.time as number));
    };
    chart.subscribeCrosshairMove(onCrosshair);

    return () => {
      chart.unsubscribeCrosshairMove(onCrosshair);
      chart.remove();
      chartRef.current = null;
      mainSeriesRef.current = null;
      volumeSeriesRef.current = null;
      indicatorSeriesRef.current.clear();
      priceLinesRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chartRef.current?.applyOptions({ watermark: { visible: !!symbol, text: symbol || '' } });
  }, [symbol]);

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
    // Price lines belong to the removed series.
    priceLinesRef.current = [];
    setDrawnLines([]);

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

    candleMapRef.current = new Map(cleanCandles.map((c) => [c.timestamp, c]));
    lastCandleRef.current = cleanCandles[cleanCandles.length - 1];
    writeLegend(lastCandleRef.current);

    const volumeSeries = chartRef.current.addHistogramSeries({
      color: C.upVol,
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
      lastValueVisible: false,
      priceLineVisible: false,
    });

    const volumeData: HistogramData[] = cleanCandles.map((c) => ({
      time: c.timestamp as any,
      value: c.volume,
      color: c.close >= c.open ? C.upVol : C.downVol,
    }));
    volumeSeries.setData(volumeData);
    volumeSeriesRef.current = volumeSeries;

    const priceLine = {
      priceLineVisible: true,
      priceLineColor: C.accent,
      priceLineStyle: LineStyle.Dashed,
      priceLineWidth: 1 as const,
      lastValueVisible: true,
    };

    if (chartType === 'candlestick') {
      const candlestickSeries = chartRef.current.addCandlestickSeries({
        upColor: C.up,
        downColor: C.down,
        borderVisible: false,
        wickUpColor: C.up,
        wickDownColor: C.down,
        ...priceLine,
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
        topColor: 'rgba(245, 177, 66, 0.22)',
        bottomColor: 'rgba(245, 177, 66, 0)',
        lineColor: C.accent,
        lineWidth: 2,
        lastPriceAnimation: LastPriceAnimationMode.OnDataUpdate,
        ...priceLine,
      });

      const formattedData: LineData[] = cleanCandles.map((c) => ({
        time: c.timestamp as any,
        value: c.close,
      }));

      areaSeries.setData(formattedData);
      mainSeriesRef.current = areaSeries;
    } else {
      const lineSeries = chartRef.current.addLineSeries({
        color: C.accent,
        lineWidth: 2,
        lastPriceAnimation: LastPriceAnimationMode.OnDataUpdate,
        ...priceLine,
      });

      const formattedData: LineData[] = cleanCandles.map((c) => ({
        time: c.timestamp as any,
        value: c.close,
      }));

      lineSeries.setData(formattedData);
      mainSeriesRef.current = lineSeries;
    }

    chartRef.current.timeScale().fitContent();

    // Soft fade-in for a fresh series (opacity only).
    canvasWrapRef.current?.animate([{ opacity: 0.25 }, { opacity: 1 }], { duration: 320, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' });
  }, [candles, chartType]);

  // Render Technical Indicators + lay out the stacked oscillator band
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    indicatorSeriesRef.current.forEach((series) => {
      try { chart.removeSeries(series); } catch {}
    });
    indicatorSeriesRef.current.clear();

    const data = indicatorData || {};
    const has = (id: IndicatorType) => indicators.includes(id);
    const toLine = (pts: Array<{ timestamp: number; value: number }>) => pts.map((pt) => ({ time: pt.timestamp as any, value: pt.value }));
    const overlay = (id: string, color: string, pts: Array<{ timestamp: number; value: number }>, title: string, width: 1 | 2 = 1) => {
      const s = chart.addLineSeries({ color, lineWidth: width, title, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
      s.setData(toLine(pts));
      indicatorSeriesRef.current.set(id, s);
    };

    if (has('SMA_20') && data.sma20) overlay('SMA_20', INDICATOR_COLORS.SMA_20, data.sma20, 'SMA 20');
    if (has('SMA_50') && data.sma50) overlay('SMA_50', INDICATOR_COLORS.SMA_50, data.sma50, 'SMA 50');
    if (has('EMA_12') && data.ema12) overlay('EMA_12', INDICATOR_COLORS.EMA_12, data.ema12, 'EMA 12');
    if (has('EMA_26') && data.ema26) overlay('EMA_26', INDICATOR_COLORS.EMA_26, data.ema26, 'EMA 26');
    if (has('VWAP') && data.vwap) overlay('VWAP', INDICATOR_COLORS.VWAP, data.vwap, 'VWAP', 2);

    if (has('BB_20') && data.bollingerBands) {
      const bbStyle = { color: 'rgba(167, 139, 250, 0.7)', lineWidth: 1 as const, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false };
      const upperSeries = chart.addLineSeries({ ...bbStyle, title: 'BB Upper' });
      const middleSeries = chart.addLineSeries({ ...bbStyle, color: 'rgba(167, 139, 250, 0.35)', lineStyle: LineStyle.Dotted, title: '' });
      const lowerSeries = chart.addLineSeries({ ...bbStyle, title: 'BB Lower' });
      upperSeries.setData(data.bollingerBands.map((pt) => ({ time: pt.timestamp as any, value: pt.upper })));
      middleSeries.setData(data.bollingerBands.map((pt) => ({ time: pt.timestamp as any, value: pt.middle })));
      lowerSeries.setData(data.bollingerBands.map((pt) => ({ time: pt.timestamp as any, value: pt.lower })));
      indicatorSeriesRef.current.set('BB_20_UPPER', upperSeries);
      indicatorSeriesRef.current.set('BB_20_MIDDLE', middleSeries);
      indicatorSeriesRef.current.set('BB_20_LOWER', lowerSeries);
    }

    // Oscillators each get their own scale, stacked in a band under the volume bars.
    const activeOsc = OSCILLATORS.filter((id) =>
      has(id) && (id === 'RSI_14' ? !!data.rsi14?.length : id === 'MACD' ? !!data.macd?.length : !!data.atr14?.length),
    );
    const band = activeOsc.length === 0 ? 0 : activeOsc.length === 1 ? 0.2 : 0.32;
    const slot = activeOsc.length ? band / activeOsc.length : 0;

    chart.priceScale('right').applyOptions({ scaleMargins: { top: 0.08, bottom: 0.2 + band } });
    if (volumeSeriesRef.current) {
      chart.priceScale('volume').applyOptions({ scaleMargins: { top: 1 - band - 0.17, bottom: band + 0.01 } });
    }

    activeOsc.forEach((id, i) => {
      const start = 1 - band + i * slot;
      const scaleId = `osc-${id}`;
      const margins = { top: start + 0.02, bottom: Math.max(0, 1 - (start + slot)) };
      const color = INDICATOR_COLORS[id];

      if (id === 'RSI_14' && data.rsi14) {
        const s = chart.addLineSeries({ color, lineWidth: 1, priceScaleId: scaleId, title: 'RSI 14', priceLineVisible: false, crosshairMarkerVisible: false });
        s.setData(toLine(data.rsi14));
        s.createPriceLine({ price: 70, color: 'rgba(242, 82, 98, 0.35)', lineWidth: 1, lineStyle: LineStyle.Dotted, axisLabelVisible: false, title: '' });
        s.createPriceLine({ price: 30, color: 'rgba(34, 197, 132, 0.35)', lineWidth: 1, lineStyle: LineStyle.Dotted, axisLabelVisible: false, title: '' });
        indicatorSeriesRef.current.set('RSI_14', s);
      }
      if (id === 'MACD' && data.macd) {
        const hist = chart.addHistogramSeries({ priceScaleId: scaleId, priceLineVisible: false, lastValueVisible: false });
        hist.setData(data.macd.map((pt) => ({ time: pt.timestamp as any, value: pt.histogram, color: pt.histogram >= 0 ? C.upVol : C.downVol })));
        const macdLine = chart.addLineSeries({ color, lineWidth: 1, priceScaleId: scaleId, title: 'MACD', priceLineVisible: false, crosshairMarkerVisible: false });
        macdLine.setData(data.macd.map((pt) => ({ time: pt.timestamp as any, value: pt.macd })));
        const signal = chart.addLineSeries({ color: 'rgba(255,255,255,0.45)', lineWidth: 1, priceScaleId: scaleId, title: '', priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
        signal.setData(data.macd.map((pt) => ({ time: pt.timestamp as any, value: pt.signal })));
        indicatorSeriesRef.current.set('MACD_HIST', hist);
        indicatorSeriesRef.current.set('MACD', macdLine);
        indicatorSeriesRef.current.set('MACD_SIGNAL', signal);
      }
      if (id === 'ATR_14' && data.atr14) {
        const s = chart.addLineSeries({ color, lineWidth: 1, priceScaleId: scaleId, title: 'ATR 14', priceLineVisible: false, crosshairMarkerVisible: false });
        s.setData(toLine(data.atr14));
        indicatorSeriesRef.current.set('ATR_14', s);
      }
      chart.priceScale(scaleId).applyOptions({ scaleMargins: margins, borderVisible: false });
    });
  }, [indicators, indicatorData, candles]);

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

    try {
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
          color: price >= lastCandle.open ? C.upVol : C.downVol,
        });
      }
    } catch {
      // A tick older than the loaded series (e.g. mid timeframe switch) is safe to drop.
    }

    // Keep the legend on the live bar unless the user is inspecting history.
    const live = { ...lastCandle, close: price, volume: realtimeTick.volume ?? lastCandle.volume };
    candleMapRef.current.set(targetTime, live);
    lastCandleRef.current = live;
    if (!crosshairActiveRef.current) writeLegend(live);
  }, [realtimeTick, chartType, candles, timeframe]);

  const handleAddPriceLine = (tool: string) => {
    if (!mainSeriesRef.current || candles.length === 0) return;
    const lastPrice = lastCandleRef.current?.close ?? candles[candles.length - 1].close;
    const color = tool === 'support' ? C.up : tool === 'resistance' ? C.down : C.accent;

    const line = mainSeriesRef.current.createPriceLine({
      price: lastPrice,
      color,
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: `${tool.toUpperCase()}`,
    });
    priceLinesRef.current.push(line);

    setDrawnLines((prev) => [
      ...prev,
      { id: Math.random().toString(), price: lastPrice, label: tool.toUpperCase(), color },
    ]);
  };

  const handleClearLines = () => {
    priceLinesRef.current.forEach((line) => {
      try { mainSeriesRef.current?.removePriceLine(line); } catch {}
    });
    priceLinesRef.current = [];
    setDrawnLines([]);
  };

  const tools = [
    { id: 'trend', title: 'Add trend level at last price', icon: TrendingUp, tone: 'hover:text-accent hover:bg-accent/10' },
    { id: 'support', title: 'Add support level', icon: Minus, tone: 'hover:text-up hover:bg-up/10' },
    { id: 'resistance', title: 'Add resistance level', icon: ShieldAlert, tone: 'hover:text-down hover:bg-down/10' },
  ];

  const activeLegend = indicators.filter((id) => id in INDICATOR_COLORS);

  return (
    <div className="relative flex h-full min-h-[440px] w-full overflow-hidden rounded-lg border border-line bg-surface/90">
      {/* Drawing toolbar */}
      <div className="z-10 flex w-10 shrink-0 select-none flex-col items-center gap-1 border-r border-line bg-bg/40 py-2">
        {tools.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => handleAddPriceLine(t.id)}
              title={t.title}
              aria-label={t.title}
              className={cn('rounded-md p-1.5 text-fg-subtle transition-[color,background-color,transform] duration-150 active:scale-90', t.tone)}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
        <div className="my-1 h-px w-5 bg-line" />
        <button
          onClick={() => chartRef.current?.timeScale().fitContent()}
          title="Fit chart to data"
          aria-label="Fit chart to data"
          className="rounded-md p-1.5 text-fg-subtle transition-[color,background-color,transform] duration-150 hover:bg-raised hover:text-fg active:scale-90"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
        {drawnLines.length > 0 && (
          <button
            onClick={handleClearLines}
            title="Clear drawn levels"
            aria-label="Clear drawn levels"
            className="relative rounded-md p-1.5 text-fg-subtle transition-[color,background-color,transform] duration-150 hover:bg-down/10 hover:text-down active:scale-90"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="num absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-accent px-0.5 text-[8px] font-bold text-accent-fg">
              {drawnLines.length}
            </span>
          </button>
        )}
      </div>

      {/* Main chart canvas */}
      <div ref={canvasWrapRef} className="relative min-w-0 flex-1">
        <div ref={chartContainerRef} className="absolute inset-0" />

        {/* OHLC legend */}
        <div className="pointer-events-none absolute left-3 top-2 z-10 space-y-1 font-mono text-[10.5px]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
            {symbol && <span className="font-semibold text-fg">{symbol}</span>}
            <span className="text-fg-subtle">{timeframe}</span>
            <span className="text-fg-subtle">
              O <span ref={(el) => (legendRef.current.o = el)} className="num text-fg-muted" />
            </span>
            <span className="text-fg-subtle">
              H <span ref={(el) => (legendRef.current.h = el)} className="num text-fg-muted" />
            </span>
            <span className="text-fg-subtle">
              L <span ref={(el) => (legendRef.current.l = el)} className="num text-fg-muted" />
            </span>
            <span className="text-fg-subtle">
              C <span ref={(el) => (legendRef.current.c = el)} className="num" />
            </span>
            <span ref={(el) => (legendRef.current.chg = el)} className="num" />
            <span className="text-fg-subtle">
              Vol <span ref={(el) => (legendRef.current.v = el)} className="num text-fg-muted" />
            </span>
          </div>
          {activeLegend.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
              {activeLegend.map((id) => (
                <span key={id} className="flex items-center gap-1 text-fg-subtle">
                  <span className="h-0.5 w-2.5 rounded-full" style={{ background: INDICATOR_COLORS[id] }} />
                  {id.replace('_', ' ')}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Loading veil — keeps the old series visible underneath */}
        <div
          className={cn(
            'pointer-events-none absolute inset-0 z-10 transition-opacity duration-200',
            loading ? 'opacity-100' : 'opacity-0',
          )}
        >
          <div className="absolute inset-0 bg-bg/30" />
          <div className="absolute inset-x-0 top-0 h-px overflow-hidden">
            <div className="h-full w-1/3 animate-shimmer bg-gradient-to-r from-transparent via-accent to-transparent" />
          </div>
        </div>

        {candles.length === 0 && !loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center font-mono text-xs text-fg-subtle">
            No historical data available for this instrument.
          </div>
        )}
      </div>
    </div>
  );
};
