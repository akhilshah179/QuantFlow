import React from 'react';
import { IndicatorType } from '../../types/chart';
import { Sliders } from 'lucide-react';

interface Props {
  activeIndicators: IndicatorType[];
  onToggleIndicator: (indicator: IndicatorType) => void;
}

const AVAILABLE_INDICATORS: { id: IndicatorType; label: string; color: string }[] = [
  { id: 'SMA_20', label: 'SMA 20', color: 'border-[#f5a623] text-[#d9822b] bg-[#fff8e1]' },
  { id: 'SMA_50', label: 'SMA 50', color: 'border-[#ff9800] text-[#e65100] bg-[#fff3e0]' },
  { id: 'EMA_12', label: 'EMA 12', color: 'border-[#2196f3] text-[#0d47a1] bg-[#e3f2fd]' },
  { id: 'EMA_26', label: 'EMA 26', color: 'border-[#e91e63] text-[#880e4f] bg-[#fce4ec]' },
  { id: 'VWAP', label: 'VWAP', color: 'border-[#089981] text-[#089981] bg-[#e6f4f1]' },
  { id: 'BB_20', label: 'Bollinger Bands', color: 'border-[#9c27b0] text-[#4a148c] bg-[#f3e5f5]' },
  { id: 'RSI_14', label: 'RSI 14', color: 'border-[#00bcd4] text-[#006064] bg-[#e0f7fa]' },
  { id: 'ATR_14', label: 'ATR 14', color: 'border-[#ff5722] text-[#bf360c] bg-[#fbe9e7]' },
];

export const IndicatorSelector: React.FC<Props> = ({ activeIndicators, onToggleIndicator }) => {
  return (
    <div className="flex items-center space-x-2 bg-white border border-[#e0e3eb] rounded-lg px-3 py-1.5 mb-2.5 overflow-x-auto shadow-xs select-none">
      <div className="flex items-center space-x-1.5 text-xs text-[#707a8a] font-mono shrink-0 mr-2 font-semibold">
        <Sliders className="w-3.5 h-3.5 text-[#2962ff]" />
        <span>Indicators:</span>
      </div>

      <div className="flex items-center space-x-1.5">
        {AVAILABLE_INDICATORS.map((ind) => {
          const isActive = activeIndicators.includes(ind.id);
          return (
            <button
              key={ind.id}
              onClick={() => onToggleIndicator(ind.id)}
              className={`px-2.5 py-0.5 rounded text-xs font-mono border transition-all ${
                isActive
                  ? `${ind.color} font-bold shadow-xs`
                  : 'border-[#e0e3eb] text-[#707a8a] hover:text-[#131722] hover:bg-[#f0f3fa]'
              }`}
            >
              {ind.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
