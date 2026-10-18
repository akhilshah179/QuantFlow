import React from 'react';
import { motion } from 'motion/react';
import { MarketIndex } from '../../types/stock';
import { formatSigned, formatSignedPercent } from '../../utils/formatters';
import { MarketStatusBadge } from '../common/MarketStatusBadge';
import { Skeleton } from '../ui/misc';
import { cn } from '../../utils/cn';

interface IndexCardsProps {
  indices: MarketIndex[] | undefined;
  loading?: boolean;
  showStatus?: boolean;
  className?: string;
}

/** Benchmark tiles. The change gauge maps ±2% onto the bar from the centre line. */
export const IndexCards: React.FC<IndexCardsProps> = ({ indices, loading, showStatus, className }) => {
  if (loading) {
    return (
      <div className={cn('grid grid-cols-2 gap-2.5 md:grid-cols-3 2xl:grid-cols-6', className)}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[92px]" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-2 gap-2.5 md:grid-cols-3 2xl:grid-cols-6', className)}>
      {(indices ?? []).map((idx, i) => {
        const up = idx.changePercent >= 0;
        const gauge = Math.min(1, Math.abs(idx.changePercent) / 2) * 50;
        return (
          <motion.div
            key={idx.symbol}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            className="qf-panel group overflow-hidden p-3 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-line-strong"
          >
            <span
              aria-hidden
              className={cn('absolute inset-x-0 top-0 h-px opacity-60', up ? 'bg-gradient-to-r from-transparent via-up to-transparent' : 'bg-gradient-to-r from-transparent via-down to-transparent')}
            />
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-xs font-medium text-fg-muted">{idx.name}</span>
              {showStatus ? (
                <MarketStatusBadge status={idx.marketStatus} />
              ) : (
                <span className="font-mono text-3xs text-fg-subtle">{idx.symbol.replace('^', '')}</span>
              )}
            </div>
            <div className="num mt-1.5 text-lg font-semibold tracking-tight text-fg">
              {idx.value.toLocaleString('en-US', { maximumFractionDigits: idx.value < 10 ? 4 : 2 })}
            </div>
            <div className="mt-0.5 flex items-center gap-2 font-mono text-[11px] font-semibold">
              <span className={cn('num', up ? 'text-up' : 'text-down')}>{formatSigned(idx.change)}</span>
              <span className={cn('num', up ? 'text-up' : 'text-down')}>{formatSignedPercent(idx.changePercent)}</span>
            </div>
            <div className="relative mt-2.5 h-[3px] overflow-hidden rounded-full bg-line">
              <span className="absolute inset-y-0 left-1/2 w-px bg-line-strong" />
              <motion.span
                className={cn('absolute inset-y-0 rounded-full', up ? 'left-1/2 bg-up' : 'right-1/2 bg-down')}
                initial={{ width: 0 }}
                animate={{ width: `${gauge}%` }}
                transition={{ delay: 0.15 + i * 0.04, type: 'spring', stiffness: 160, damping: 24 }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
