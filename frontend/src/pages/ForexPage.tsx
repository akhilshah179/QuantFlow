import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { DollarSign, TrendingUp, TrendingDown, RefreshCw, Radio, Layers, Info } from 'lucide-react';
import { FinancialChart } from '../charts/FinancialChart';
import { wsClient } from '../websocket/wsClient';
import { WSTickUpdate, ConnectionStatus } from '../types/ws';
import { Candle } from '../types/stock';

interface ForexPairInfo {
  symbol: string;
  name: string;
  price: number | null;
  bid: number | null;
  ask: number | null;
  spreadPips: number | null;
  change: number;
  changePercent: number;
  source: string;
  lastUpdated: number | null;
  flashStatus?: 'up' | 'down' | null;
}

const SUPPORTED_FOREX_PAIRS = [
  { symbol: 'EURUSD', name: 'EUR / USD' },
  { symbol: 'GBPUSD', name: 'GBP / USD' },
  { symbol: 'USDJPY', name: 'USD / JPY' },
  { symbol: 'USDCHF', name: 'USD / CHF' },
  { symbol: 'AUDUSD', name: 'AUD / USD' },
  { symbol: 'USDCAD', name: 'USD / CAD' },
  { symbol: 'NZDUSD', name: 'NZD / USD' },
  { symbol: 'USDINR', name: 'USD / INR' },
];

export const ForexPage: React.FC = () => {
  const [selectedPair, setSelectedPair] = useState<string>('EURUSD');
  const [timeframe, setTimeframe] = useState<string>('1D');
  const [chartType, setChartType] = useState<'candlestick' | 'area'>('candlestick');
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loadingCandles, setLoadingCandles] = useState<boolean>(false);
  const [wsStatus, setWsStatus] = useState<ConnectionStatus>('DISCONNECTED');
  const [latestTick, setLatestTick] = useState<WSTickUpdate | null>(null);


  const [pairsData, setPairsData] = useState<Record<string, ForexPairInfo>>(() => {
    const initialMap: Record<string, ForexPairInfo> = {};
    SUPPORTED_FOREX_PAIRS.forEach((p) => {
      initialMap[p.symbol] = {
        symbol: p.symbol,
        name: p.name,
        price: null,
        bid: null,
        ask: null,
        spreadPips: null,
        change: 0,
        changePercent: 0,
        source: 'TwelveData',
        lastUpdated: null,
      };
    });
    return initialMap;
  });

  const formatPrice = (symbol: string, price: number | null | undefined): string => {
    if (price === null || price === undefined || isNaN(price)) return '--';
    const isJpyOrInr = symbol.includes('JPY') || symbol.includes('INR');
    return price.toFixed(isJpyOrInr ? 3 : 5);
  };

  // Fetch real market quotes from backend API
  const fetchQuotes = () => {
    SUPPORTED_FOREX_PAIRS.forEach((p) => {
      api
        .get(`/stocks/${p.symbol}`)
        .then((res: any) => {
          if (res?.data) {
            const q = res.data;
            setPairsData((prev) => {
              const oldPrice = prev[p.symbol]?.price;
              const newPrice = q.price;
              let flashStatus: 'up' | 'down' | null = null;
              if (oldPrice && newPrice && newPrice !== oldPrice) {
                flashStatus = newPrice > oldPrice ? 'up' : 'down';
              }

              return {
                ...prev,
                [p.symbol]: {
                  symbol: p.symbol,
                  name: q.name || p.name,
                  price: newPrice,
                  bid: q.bid ?? null,
                  ask: q.ask ?? null,
                  spreadPips: q.spreadPips ?? null,
                  change: q.change || 0,
                  changePercent: q.changePercent || 0,
                  source: q.source || 'TwelveData',
                  lastUpdated: q.timestamp || Date.now(),
                  flashStatus,
                },
              };
            });
          }
        })
        .catch(() => {});
    });
  };

  useEffect(() => {
    fetchQuotes();
    const interval = setInterval(fetchQuotes, 15000);
    return () => clearInterval(interval);
  }, []);

  // Fetch historical OHLC candles for selected pair and timeframe
  useEffect(() => {
    setLoadingCandles(true);
    api
      .get(`/stocks/${selectedPair}/history?timeframe=${timeframe}`)
      .then((res: any) => {
        const candleArray = Array.isArray(res)
          ? res
          : Array.isArray(res?.candles)
          ? res.candles
          : Array.isArray(res?.data?.candles)
          ? res.data.candles
          : [];
        setCandles(candleArray);
      })
      .catch(() => setCandles([]))
      .finally(() => setLoadingCandles(false));
  }, [selectedPair, timeframe]);


  // Connect WebSocket and receive streaming updates
  useEffect(() => {
    wsClient.connect();

    const unsubStatus = wsClient.onStatusChange((status) => {
      setWsStatus(status);
    });

    SUPPORTED_FOREX_PAIRS.forEach((p) => {
      wsClient.subscribe(p.symbol);
    });

    const unsubTick = wsClient.onTick((tick: WSTickUpdate) => {
      const symUpper = tick.symbol.toUpperCase();
      if (!SUPPORTED_FOREX_PAIRS.some((p) => p.symbol === symUpper)) return;

      setPairsData((prev) => {
        const oldPrice = prev[symUpper]?.price;
        const newPrice = tick.price;
        let flashStatus: 'up' | 'down' | null = null;
        if (oldPrice && newPrice && newPrice !== oldPrice) {
          flashStatus = newPrice > oldPrice ? 'up' : 'down';
        }

        return {
          ...prev,
          [symUpper]: {
            ...prev[symUpper],
            price: newPrice,
            bid: tick.bid ?? null,
            ask: tick.ask ?? null,
            spreadPips: tick.spreadPips ?? null,
            change: tick.change,
            changePercent: tick.changePercent,
            source: tick.source || 'TwelveData',
            lastUpdated: tick.timestamp ? tick.timestamp * 1000 : Date.now(),
            flashStatus,
          },
        };
      });

      if (symUpper === selectedPair) {
        setLatestTick(tick);
      }
    });

    return () => {
      unsubStatus();
      unsubTick();
    };
  }, []);


  const activePairInfo = pairsData[selectedPair] || {
    symbol: selectedPair,
    name: selectedPair,
    price: null,
    bid: null,
    ask: null,
    spreadPips: null,
    change: 0,
    changePercent: 0,
    source: 'TwelveData',
    lastUpdated: null,
  };

  return (
    <div className="space-y-4 text-[#131722]">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white border border-[#e0e3eb] rounded-lg p-4 shadow-xs gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-[#e8f0fe] text-[#2962ff] flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold font-mono text-[#131722]">Real Forex Market Platform</h1>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#e6f4f1] text-[#089981]">
                FEED: REAL-TIME MARKET
              </span>
            </div>
            <p className="text-xs font-mono text-[#707a8a]">Live real-market prices powered by QuantFlow Forex Terminal Engine</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs">
          <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded border font-semibold ${
            wsStatus === 'CONNECTED'
              ? 'bg-[#e6f4f1] text-[#089981] border-[#a3e2d6]'
              : wsStatus === 'RECONNECTING'
              ? 'bg-[#fff8e6] text-[#b7791f] border-[#fbd38d]'
              : 'bg-[#fde8e8] text-[#f23645] border-[#fbb6b6]'
          }`}>
            <Radio className={`w-3.5 h-3.5 ${wsStatus === 'CONNECTED' ? 'animate-pulse' : ''}`} />
            <span>{wsStatus}</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Interactive Technical Chart */}
        <div className="lg:col-span-2 bg-white border border-[#e0e3eb] rounded-lg p-4 flex flex-col space-y-3 shadow-xs">
          <div className="flex flex-wrap items-center justify-between font-mono border-b border-[#f0f3fa] pb-3 gap-2">
            <div className="flex items-center space-x-3">
              <div>
                <span className="text-base font-bold text-[#131722]">{activePairInfo.name}</span>
                <span className="ml-2 text-xs text-[#707a8a] font-medium">({activePairInfo.symbol})</span>
              </div>
              <div className="flex items-center space-x-2 bg-[#f8f9fd] px-2.5 py-1 rounded border border-[#e0e3eb] text-xs font-semibold">
                <span className="text-[#707a8a]">MARKET PRICE:</span>
                <span className="text-[#131722] font-mono font-bold">{formatPrice(selectedPair, activePairInfo.price)}</span>
              </div>
            </div>

            {/* Controls: Chart Type & Timeframe Buttons */}
            <div className="flex items-center space-x-2 font-mono text-xs">
              <div className="flex items-center space-x-1 bg-[#f0f3fa] p-1 rounded">
                <button
                  onClick={() => setChartType('candlestick')}
                  title="Candlestick Chart"
                  className={`px-2.5 py-1 rounded font-bold transition-all ${
                    chartType === 'candlestick'
                      ? 'bg-[#2962ff] text-white shadow-xs'
                      : 'text-[#707a8a] hover:text-[#131722]'
                  }`}
                >
                  Candles
                </button>
                <button
                  onClick={() => setChartType('area')}
                  title="Area Line Chart (Investing.com Style)"
                  className={`px-2.5 py-1 rounded font-bold transition-all ${
                    chartType === 'area'
                      ? 'bg-[#2962ff] text-white shadow-xs'
                      : 'text-[#707a8a] hover:text-[#131722]'
                  }`}
                >
                  Area
                </button>
              </div>

              <div className="flex items-center space-x-1 bg-[#f0f3fa] p-1 rounded font-mono text-xs">
                {['1m', '5m', '15m', '1H', '1D'].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-2.5 py-1 rounded font-bold transition-all ${
                      timeframe === tf
                        ? 'bg-[#2962ff] text-white shadow-xs'
                        : 'text-[#707a8a] hover:text-[#131722]'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Real Price & Bid/Ask Info Bar */}
          <div className="grid grid-cols-3 gap-2 font-mono bg-[#f8f9fd] border border-[#e0e3eb] rounded-lg p-2.5 text-center text-xs">
            <div>
              <div className="text-[10px] text-[#707a8a] uppercase font-semibold">BID PRICE</div>
              <div className="text-sm font-bold text-[#f23645] mt-0.5">
                {activePairInfo.bid !== null ? formatPrice(selectedPair, activePairInfo.bid) : formatPrice(selectedPair, activePairInfo.price)}
              </div>
            </div>
            <div className="border-x border-[#e0e3eb]">
              <div className="text-[10px] text-[#707a8a] uppercase font-semibold">SPREAD</div>
              <div className="text-sm font-bold text-[#2962ff] mt-0.5">
                {activePairInfo.spreadPips !== null ? `${activePairInfo.spreadPips} PIPS` : 'MID PRICE ONLY'}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[#707a8a] uppercase font-semibold">ASK PRICE</div>
              <div className="text-sm font-bold text-[#089981] mt-0.5">
                {activePairInfo.ask !== null ? formatPrice(selectedPair, activePairInfo.ask) : formatPrice(selectedPair, activePairInfo.price)}
              </div>
            </div>
          </div>

          {/* Lightweight Chart */}
          <div className="h-[440px] w-full relative">
            {loadingCandles && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-10 font-mono text-xs text-[#707a8a]">
                <RefreshCw className="w-5 h-5 animate-spin mr-2 text-[#2962ff]" />
                Loading Real Forex Candlestick Data...
              </div>
            )}
            <FinancialChart
              candles={candles}
              chartType={chartType}
              indicators={['SMA_20', 'RSI_14']}
              timeframe={timeframe as any}
              realtimeTick={latestTick}
            />

          </div>
        </div>

        {/* Right Column: Real-Time Forex Pairs List */}
        <div className="bg-white border border-[#e0e3eb] rounded-lg p-4 space-y-3 shadow-xs flex flex-col">
          <div className="flex items-center justify-between border-b border-[#f0f3fa] pb-2 font-mono">
            <h2 className="text-xs font-bold text-[#707a8a] uppercase tracking-wider">All Active Forex Pairs</h2>
            <span className="text-[10px] text-[#089981] font-bold">REAL MARKET PRICES</span>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[580px] pr-1">
            {SUPPORTED_FOREX_PAIRS.map((p) => {
              const info = pairsData[p.symbol] || {
                symbol: p.symbol,
                name: p.name,
                price: null,
                bid: null,
                ask: null,
                spreadPips: null,
                change: 0,
                changePercent: 0,
                source: 'TwelveData',
                lastUpdated: null,
              };

              const isSelected = selectedPair === p.symbol;

              return (
                <div
                  key={p.symbol}
                  onClick={() => setSelectedPair(p.symbol)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all font-mono space-y-1.5 ${
                    isSelected
                      ? 'bg-[#e8f0fe] border-[#2962ff] shadow-xs'
                      : 'bg-[#f8f9fd] border-[#e0e3eb] hover:bg-[#f0f3fa]'
                  } ${
                    info.flashStatus === 'up'
                      ? 'ring-1 ring-[#089981]'
                      : info.flashStatus === 'down'
                      ? 'ring-1 ring-[#f23645]'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#131722]">{p.symbol}</div>
                      <div className="text-[11px] text-[#707a8a] font-medium">{p.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-[#131722]">{formatPrice(p.symbol, info.price)}</div>
                      <div className={`text-[11px] font-bold flex items-center justify-end ${info.changePercent >= 0 ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                        {info.changePercent >= 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                        {info.changePercent >= 0 ? '+' : ''}{info.changePercent}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#707a8a] border-t border-[#e0e3eb]/60 pt-1.5">
                    <div>LAST UPDATE: <span className="font-medium text-[#131722]">{info.lastUpdated ? new Date(info.lastUpdated).toLocaleTimeString() : '--'}</span></div>
                    <div>SPREAD: <span className="font-bold text-[#2962ff]">{info.spreadPips !== null ? `${info.spreadPips} pips` : 'N/A'}</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
