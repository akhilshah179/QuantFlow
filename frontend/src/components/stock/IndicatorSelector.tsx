import React from 'react';
import { IndicatorType } from '../../types/chart';
import { Activity } from 'lucide-react';
import { INDICATOR_COLORS } from '../../charts/FinancialChart';
import { cn } from '../../utils/cn';

interface Props {
  activeIndicators: IndicatorType[];
  onToggleIndicator: (indicator: IndicatorType) => void;
}

const AVAILABLE_INDICATORS: { id: IndicatorType; label: string; group: 'Overlay' | 'Oscillator' }[] = [
  { id: 'SMA_20', label: 'SMA 20', group: 'Overlay' },
  { id: 'SMA_50', label: 'SMA 50', group: 'Overlay' },
  { id: 'EMA_12', label: 'EMA 12', group: 'Overlay' },
  { id: 'EMA_26', label: 'EMA 26', group: 'Overlay' },
  { id: 'VWAP', label: 'VWAP', group: 'Overlay' },
  { id: 'BB_20', label: 'Bollinger', group: 'Overlay' },
  { id: 'RSI_14', label: 'RSI 14', group: 'Oscillator' },
  { id: 'MACD', label: 'MACD', group: 'Oscillator' },
  { id: 'ATR_14', label: 'ATR 14', group: 'Oscillator' },
];

export const IndicatorSelector: React.FC<Props> = ({ activeIndicators, onToggleIndicator }) => {
  return (
    <div className="flex select-none items-center gap-2 overflow-x-auto scrollbar-none">
      <div className="flex shrink-0 items-center gap-1.5 pr-1 font-mono text-2xs font-semibold uppercase tracking-wider text-fg-subtle">
        <Activity className="h-3.5 w-3.5 text-accent" />
        <span>Studies</span>
      </div>

      {AVAILABLE_INDICATORS.map((ind, i) => {
        const isActive = activeIndicators.includes(ind.id);
        const color = INDICATOR_COLORS[ind.id];
        const groupBreak = i > 0 && AVAILABLE_INDICATORS[i - 1].group !== ind.group;
        return (
          <React.Fragment key={ind.id}>
            {groupBreak && <span className="h-4 w-px shrink-0 bg-line" />}
            <button
              onClick={() => onToggleIndicator(ind.id)}
              aria-pressed={isActive}
              className={cn(
                'flex h-6 shrink-0 items-center gap-1.5 rounded-md border px-2 font-mono text-2xs font-semibold transition-[background-color,border-color,color,transform] duration-150 active:scale-95',
                isActive ? 'border-line-strong bg-raised text-fg' : 'border-transparent text-fg-subtle hover:bg-raised/60 hover:text-fg-muted',
              )}
            >
              <span
                className="h-1.5 w-1.5 rounded-full transition-[transform,opacity] duration-200"
                style={{ background: color, opacity: isActive ? 1 : 0.35, transform: isActive ? 'scale(1.15)' : 'scale(1)' }}
              />
              {ind.label}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
};
