import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Layers, TrendingUp, TrendingDown } from 'lucide-react';
import { FinancialChart } from '../charts/FinancialChart';

export const FuturesPage: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<string>('GOLD');
  const [candles, setCandles] = useState<any[]>([]);

  useEffect(() => {
    api
      .get(`/stocks/${selectedItem}/history?timeframe=1D`)
      .then((res: any) => {
        const histData = res?.candles ? res : (res?.data || {});
        setCandles(histData.candles || []);
      })
      .catch(() => setCandles([]));
  }, [selectedItem]);

  const items = [
    { symbol: 'GOLD', name: 'Gold Futures (USD/oz)', price: 2450.80, change: 0.85 },
    { symbol: 'SILVER', name: 'Silver Futures (USD/oz)', price: 28.45, change: 1.12 },
    { symbol: 'CRUDE OIL', name: 'Crude Oil WTI (USD/bbl)', price: 76.50, change: -0.42 },
    { symbol: 'NATURAL GAS', name: 'Natural Gas (USD/MMBtu)', price: 2.15, change: 2.30 },
    { symbol: 'COPPER', name: 'Copper Futures (USD/lb)', price: 4.12, change: 0.65 },
  ];

  return (
    <div className="space-y-4 text-[#131722]">
      {/* Top Banner */}
      <div className="flex items-center justify-between bg-white border border-[#e0e3eb] rounded-lg p-4 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded bg-[#e8f0fe] text-[#2962ff] flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-mono text-[#131722]">Futures & Commodities Platform</h1>
            <p className="text-xs font-mono text-[#707a8a] font-medium">Precious Metals, Energy & Soft Commodities Futures Market Feed</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Technical Chart + Futures Commodities List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-[#e0e3eb] rounded-lg p-3.5 flex flex-col space-y-3 shadow-xs">
          <div className="flex items-center justify-between font-mono border-b border-[#f0f3fa] pb-2">
            <span className="text-xs font-bold text-[#131722]">{selectedItem}</span>
            <span className="text-[10px] bg-[#e8f0fe] text-[#2962ff] px-2 py-0.5 rounded font-bold">COMMODITY FUTURES</span>
          </div>
          <div className="h-[460px] w-full">
            <FinancialChart candles={candles} chartType="candlestick" indicators={['SMA_20', 'RSI_14']} timeframe="1D" />
          </div>
        </div>

        <div className="bg-white border border-[#e0e3eb] rounded-lg p-3.5 space-y-3 shadow-xs">
          <h2 className="text-xs font-mono font-bold text-[#707a8a] uppercase tracking-wider border-b border-[#f0f3fa] pb-2">Commodities & Futures</h2>
          <div className="space-y-2">
            {items.map((it) => (
              <div
                key={it.symbol}
                onClick={() => setSelectedItem(it.symbol)}
                className={`p-2.5 rounded border cursor-pointer flex items-center justify-between font-mono transition-all ${
                  selectedItem === it.symbol
                    ? 'bg-[#e8f0fe] border-[#2962ff] shadow-xs'
                    : 'bg-[#f8f9fd] border-[#e0e3eb] hover:bg-[#f0f3fa]'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-[#131722]">{it.symbol}</div>
                  <div className="text-[11px] text-[#707a8a] font-medium">{it.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-[#131722]">${it.price.toLocaleString()}</div>
                  <div className={`text-[11px] font-bold flex items-center justify-end ${it.change >= 0 ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                    {it.change >= 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                    {it.change}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
