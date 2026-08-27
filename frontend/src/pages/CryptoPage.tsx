import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Activity, TrendingUp, TrendingDown, Wifi, Clock, RefreshCw, ShieldCheck, AlertCircle } from 'lucide-react';
import { FinancialChart } from '../charts/FinancialChart';
import { wsClient } from '../websocket/wsClient';
import { WSTickUpdate } from '../types/ws';
import { Timeframe } from '../types/stock';

interface CryptoCoin {
  symbol: string;
  displaySymbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  dayHigh?: number;
  dayLow?: number;
  flash?: 'up' | 'down' | null;
}

export const CryptoPage: React.FC = () => {
  const [selectedCoin, setSelectedCoin] = useState<string>('BTCUSDT');
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const [wsStatus, setWsStatus] = useState<'LIVE' | 'RECONNECTING' | 'DISCONNECTED' | 'UNAVAILABLE'>('LIVE');
  const [coinsList, setCoinsList] = useState<CryptoCoin[]>([
    { symbol: 'BTCUSDT', displaySymbol: 'BTC/USDT', name: 'Bitcoin', price: 0, change: 0, changePercent: 0 },
    { symbol: 'ETHUSDT', displaySymbol: 'ETH/USDT', name: 'Ethereum', price: 0, change: 0, changePercent: 0 },
    { symbol: 'SOLUSDT', displaySymbol: 'SOL/USDT', name: 'Solana', price: 0, change: 0, changePercent: 0 },
    { symbol: 'BNBUSDT', displaySymbol: 'BNB/USDT', name: 'Binance Coin', price: 0, change: 0, changePercent: 0 },
    { symbol: 'XRPUSDT', displaySymbol: 'XRP/USDT', name: 'XRP', price: 0, change: 0, changePercent: 0 },
    { symbol: 'ADAUSDT', displaySymbol: 'ADA/USDT', name: 'Cardano', price: 0, change: 0, changePercent: 0 },
    { symbol: 'AVAXUSDT', displaySymbol: 'AVAX/USDT', name: 'Avalanche', price: 0, change: 0, changePercent: 0 },
    { symbol: 'DOGEUSDT', displaySymbol: 'DOGE/USDT', name: 'Dogecoin', price: 0, change: 0, changePercent: 0 },
  ]);
  const [candles, setCandles] = useState<any[]>([]);
  const [realtimeTick, setRealtimeTick] = useState<WSTickUpdate | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [chartLoading, setChartLoading] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // Format Binance Symbol for UI Display
  const getDisplaySymbol = (sym: string) => {
    const s = sym.toUpperCase().replace('/', '');
    if (s.endsWith('USDT')) return `${s.replace('USDT', '')}/USDT`;
    if (s.endsWith('USD')) return `${s.replace('USD', '')}/USDT`;
    return `${s}/USDT`;
  };

  // 1. Fetch initial Binance Spot Overview
  useEffect(() => {
    setLoading(true);
    api.get('/crypto/overview')
      .then((res: any) => {
        const data = res?.data || res;
        if (data && data.mostActive && Array.isArray(data.mostActive)) {
          const mapped: CryptoCoin[] = data.mostActive.map((item: any) => ({
            symbol: item.symbol,
            displaySymbol: getDisplaySymbol(item.symbol),
            name: item.name,
            price: item.price,
            change: item.change,
            changePercent: item.changePercent,
            volume: item.volume,
            dayHigh: item.dayHigh,
            dayLow: item.dayLow,
          }));
          setCoinsList(mapped);
          setWsStatus('LIVE');
        }
        setLoading(false);
      })
      .catch(() => {
        setWsStatus('UNAVAILABLE');
        setLoading(false);
      });
  }, []);

  // 2. Fetch Real Historical Binance Candlesticks
  useEffect(() => {
    setChartLoading(true);
    setRealtimeTick(null);
    api.get(`/stocks/${selectedCoin}/history?timeframe=${timeframe}`)
      .then((res: any) => {
        const histData = res?.candles ? res : (res?.data || {});
        setCandles(histData.candles || []);
        setChartLoading(false);
      })
      .catch(() => {
        setCandles([]);
        setChartLoading(false);
      });
  }, [selectedCoin, timeframe]);

  // 3. Connect WebSocket & Subscribe to Binance Live Trades & Klines
  useEffect(() => {
    wsClient.connect();

    coinsList.forEach((c) => {
      wsClient.subscribe(c.symbol);
    });

    const unsubscribeStatus = wsClient.onStatusChange((status) => {
      if (status === 'CONNECTED') setWsStatus('LIVE');
      else if (status === 'RECONNECTING') setWsStatus('RECONNECTING');
      else setWsStatus('DISCONNECTED');
    });

    const unsubscribeTicks = wsClient.onTick((tick: WSTickUpdate) => {
      const tickSym = tick.symbol.toUpperCase();
      const selSym = selectedCoin.toUpperCase();

      if (tickSym === selSym || tickSym.replace('USDT', 'USD') === selSym || selSym.replace('USDT', 'USD') === tickSym) {
        setRealtimeTick(tick);
      }

      setCoinsList((prevList) =>
        prevList.map((coin) => {
          const cSym = coin.symbol.toUpperCase();
          if (cSym === tickSym || cSym.replace('USDT', 'USD') === tickSym || tickSym.replace('USDT', 'USD') === cSym) {
            const flashType = tick.price > coin.price ? 'up' : tick.price < coin.price ? 'down' : null;
            return {
              ...coin,
              price: tick.price,
              change: tick.change !== undefined ? tick.change : coin.change,
              changePercent: tick.changePercent !== undefined ? tick.changePercent : coin.changePercent,
              volume: tick.volume || coin.volume,
              flash: flashType,
            };
          }
          return coin;
        })
      );
      setLastUpdate(new Date().toLocaleTimeString());
    });

    return () => {
      unsubscribeStatus();
      unsubscribeTicks();
    };
  }, [coinsList.length, selectedCoin]);

  const selectedCoinData = coinsList.find((c) => c.symbol.toUpperCase() === selectedCoin.toUpperCase() || c.symbol.replace('USDT', 'USD') === selectedCoin.toUpperCase()) || coinsList[0];

  return (
    <div className="space-y-4 text-[#131722]">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white border border-[#e0e3eb] rounded-lg p-4 shadow-xs gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-[#e8f0fe] text-[#2962ff] flex items-center justify-center font-bold">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold font-mono text-[#131722]">Binance Spot Market Workstation</h1>
              <span className={`flex items-center text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                wsStatus === 'LIVE'
                  ? 'bg-[#e6f4ea] text-[#137333] border-[#ceead6]'
                  : wsStatus === 'RECONNECTING'
                  ? 'bg-[#fef7e0] text-[#b06000] border-[#feefc3]'
                  : 'bg-[#fce8e6] text-[#c5221f] border-[#fad2cf]'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${wsStatus === 'LIVE' ? 'bg-[#137333] animate-pulse' : 'bg-[#c5221f]'}`}></span>
                STATUS: {wsStatus}
              </span>
            </div>
            <p className="text-xs font-mono text-[#707a8a] font-medium">
              Source: Binance Public Spot Market WebSockets & REST Klines
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-6 font-mono text-xs">
          <div>
            <div className="text-[#707a8a] text-[10px] uppercase font-bold">ACTIVE PAIR</div>
            <div className="text-[#131722] font-extrabold">{getDisplaySymbol(selectedCoinData?.symbol || selectedCoin)}</div>
          </div>
          <div>
            <div className="text-[#707a8a] text-[10px] uppercase font-bold">SPOT PRICE</div>
            <div className="text-[#2962ff] font-extrabold">
              {selectedCoinData?.price > 0 ? `$${selectedCoinData.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}` : 'UNAVAILABLE'}
            </div>
          </div>
          {lastUpdate && (
            <div className="hidden sm:block">
              <div className="text-[#707a8a] text-[10px] uppercase font-bold">LAST TRADE</div>
              <div className="text-[#707a8a] font-medium flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {lastUpdate}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Chart + Coin List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Technical Chart */}
        <div className="lg:col-span-2 bg-white border border-[#e0e3eb] rounded-lg p-3.5 flex flex-col space-y-3 shadow-xs">
          <div className="flex flex-wrap items-center justify-between border-b border-[#f0f3fa] pb-2 gap-2">
            <div className="flex items-center space-x-2 font-mono">
              <span className="text-sm font-extrabold text-[#131722]">{getDisplaySymbol(selectedCoinData?.symbol || selectedCoin)}</span>
              <span className="text-[10px] bg-[#e8f0fe] text-[#2962ff] px-2 py-0.5 rounded font-bold">BINANCE SPOT</span>
            </div>

            {/* Timeframe Controls */}
            <div className="flex items-center space-x-1 font-mono text-xs">
              {['1m', '3m', '5m', '15m', '30m', '1H', '4H', '1D', '1W'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf as Timeframe)}
                  className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${
                    timeframe === tf
                      ? 'bg-[#2962ff] text-white shadow-xs'
                      : 'bg-[#f8f9fd] text-[#707a8a] hover:bg-[#e0e3eb] hover:text-[#131722]'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[460px] w-full relative">
            {chartLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 font-mono text-xs text-[#707a8a]">
                <RefreshCw className="w-5 h-5 animate-spin mr-2 text-[#2962ff]" />
                Loading Binance Historical Klines...
              </div>
            ) : candles.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-10 font-mono text-xs text-[#707a8a]">
                <AlertCircle className="w-6 h-6 text-[#f23645] mb-1" />
                Market data unavailable
              </div>
            ) : null}
            <FinancialChart
              candles={candles}
              chartType="candlestick"
              indicators={['SMA_20', 'RSI_14']}
              timeframe={timeframe}
              realtimeTick={realtimeTick}
            />
          </div>
        </div>

        {/* Right Col: Top Crypto Coins Stream */}
        <div className="bg-white border border-[#e0e3eb] rounded-lg p-3.5 space-y-3 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#f0f3fa] pb-2">
              <h2 className="text-xs font-mono font-bold text-[#707a8a] uppercase tracking-wider">Binance Spot Markets</h2>
              <span className="text-[10px] font-mono font-semibold text-[#089981] flex items-center">
                <Wifi className="w-3 h-3 mr-1 animate-pulse" /> Live Stream
              </span>
            </div>

            <div className="space-y-2 mt-3">
              {coinsList.map((coin) => {
                const isSelected = selectedCoin.toUpperCase() === coin.symbol.toUpperCase() || selectedCoin.toUpperCase() === coin.symbol.replace('USDT', 'USD');
                const isUp = coin.change >= 0;

                return (
                  <div
                    key={coin.symbol}
                    onClick={() => setSelectedCoin(coin.symbol)}
                    className={`p-2.5 rounded border cursor-pointer flex items-center justify-between font-mono transition-all duration-300 ${
                      isSelected
                        ? 'bg-[#e8f0fe] border-[#2962ff] shadow-xs'
                        : coin.flash === 'up'
                        ? 'bg-[#e6f4ea] border-[#089981]'
                        : coin.flash === 'down'
                        ? 'bg-[#fce8e6] border-[#f23645]'
                        : 'bg-[#f8f9fd] border-[#e0e3eb] hover:bg-[#f0f3fa]'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-[#131722]">{coin.displaySymbol || getDisplaySymbol(coin.symbol)}</div>
                      <div className="text-[11px] text-[#707a8a] font-medium">{coin.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-extrabold text-[#131722]">
                        {coin.price > 0 ? `$${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}` : 'UNAVAILABLE'}
                      </div>
                      <div className={`text-[11px] font-bold flex items-center justify-end ${isUp ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                        {isUp ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                        {isUp ? '+' : ''}{coin.changePercent?.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-[#f0f3fa] text-[11px] font-mono text-[#707a8a] text-center flex items-center justify-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#089981] mr-1" />
            <span>Source: Binance (Direct Public WS & REST)</span>
          </div>
        </div>
      </div>
    </div>
  );
};


