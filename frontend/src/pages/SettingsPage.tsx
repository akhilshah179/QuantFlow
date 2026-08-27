import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useChartStore } from '../store/chartStore';
import { Settings as SettingsIcon, Shield, Sliders, CheckCircle2 } from 'lucide-react';
import { Timeframe } from '../types/stock';

export const SettingsPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const { timeframe, setTimeframe, activeIndicators, toggleIndicator } = useChartStore();
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl space-y-4 text-[#131722]">
      {/* Title Header */}
      <div className="bg-white border border-[#e0e3eb] rounded-lg p-4 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold font-mono text-[#131722] flex items-center space-x-2">
            <SettingsIcon className="w-5 h-5 text-[#2962ff]" />
            <span>User & Terminal Settings</span>
          </h1>
          <p className="text-xs text-[#707a8a] font-medium mt-0.5">Manage profile details, default chart timeframes & technical indicators</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Profile Card */}
        <div className="bg-white border border-[#e0e3eb] rounded-lg p-4 space-y-3 shadow-xs">
          <h2 className="text-xs font-bold font-mono text-[#131722] flex items-center space-x-1.5 border-b border-[#f0f3fa] pb-2 uppercase tracking-wider">
            <Shield className="w-4 h-4 text-[#089981]" />
            <span>Profile Account Information</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div>
              <label className="block text-[#707a8a] text-[10px] uppercase font-bold mb-1">Full Name</label>
              <input
                type="text"
                disabled
                value={user?.name || ''}
                className="w-full bg-[#f8f9fd] border border-[#e0e3eb] rounded px-3 py-1.5 text-[#131722] font-semibold opacity-75 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-[#707a8a] text-[10px] uppercase font-bold mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full bg-[#f8f9fd] border border-[#e0e3eb] rounded px-3 py-1.5 text-[#131722] font-semibold opacity-75 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Chart Preferences Card */}
        <div className="bg-white border border-[#e0e3eb] rounded-lg p-4 space-y-3 shadow-xs">
          <h2 className="text-xs font-bold font-mono text-[#131722] flex items-center space-x-1.5 border-b border-[#f0f3fa] pb-2 uppercase tracking-wider">
            <Sliders className="w-4 h-4 text-[#2962ff]" />
            <span>Default Chart & Indicator Settings</span>
          </h2>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <label className="block text-[#707a8a] text-[10px] uppercase font-bold mb-1.5">Default Chart Timeframe</label>
              <div className="flex flex-wrap gap-1.5">
                {(['1m', '5m', '15m', '30m', '1H', '4H', '1D', '1W', '1M'] as Timeframe[]).map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => setTimeframe(tf)}
                    className={`px-3 py-1 rounded border text-xs font-bold transition-colors ${
                      timeframe === tf
                        ? 'bg-[#2962ff] border-[#2962ff] text-white shadow-xs'
                        : 'border-[#e0e3eb] bg-[#f8f9fd] text-[#707a8a] hover:text-[#131722] hover:bg-[#f0f3fa]'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[#707a8a] text-[10px] uppercase font-bold mb-1.5">Enabled Default Technical Indicators</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'SMA_20', label: 'SMA 20' },
                  { id: 'SMA_50', label: 'SMA 50' },
                  { id: 'EMA_12', label: 'EMA 12' },
                  { id: 'EMA_26', label: 'EMA 26' },
                  { id: 'BB_20', label: 'Bollinger Bands' },
                  { id: 'RSI_14', label: 'RSI 14' },
                ].map((ind: any) => {
                  const isActive = activeIndicators.includes(ind.id);
                  return (
                    <button
                      key={ind.id}
                      type="button"
                      onClick={() => toggleIndicator(ind.id)}
                      className={`p-2 rounded border text-left flex items-center justify-between transition-colors ${
                        isActive
                          ? 'bg-[#e8f0fe] border-[#2962ff] text-[#2962ff] font-bold shadow-xs'
                          : 'border-[#e0e3eb] bg-[#f8f9fd] text-[#707a8a] hover:text-[#131722]'
                      }`}
                    >
                      <span className="text-xs font-semibold">{ind.label}</span>
                      {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-[#2962ff]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {saved && (
          <div className="flex items-center space-x-2 bg-[#e6f4f1] border border-[#089981]/30 p-2.5 rounded text-xs font-mono text-[#089981] font-bold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Preferences saved successfully!</span>
          </div>
        )}

        <button
          type="submit"
          className="bg-[#2962ff] hover:bg-[#1e54e4] text-white font-mono font-bold text-xs px-5 py-2 rounded transition-all shadow-xs"
        >
          Save Terminal Preferences
        </button>
      </form>
    </div>
  );
};
