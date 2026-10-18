import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowUpRight, Briefcase } from 'lucide-react';
import { usePortfolioStore } from '../../store/portfolioStore';
import { useLivePortfolio } from '../../hooks/useLivePortfolio';
import { formatCurrency, formatSignedCurrency, formatSignedPercent } from '../../utils/formatters';
import { AnimatedNumber } from '../ui/AnimatedNumber';
import { Panel } from '../ui/Panel';
import { Skeleton, signTone } from '../ui/misc';
import { cn } from '../../utils/cn';

const ALLOC_COLORS = ['#f5b142', '#60a5fa', '#2dd4bf', '#c084fc', '#f472b6', '#fb923c', '#a3e635'];

/** Compact live portfolio card for the dashboard. */
export const PortfolioSnapshot: React.FC<{ className?: string }> = ({ className }) => {
  const fetchPortfolio = usePortfolioStore((s) => s.fetchPortfolio);
  const summary = usePortfolioStore((s) => s.summary);
  const live = useLivePortfolio();

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  const pnlPct = live && live.totalCost > 0 ? (live.totalUnrealizedPnL / live.totalCost) * 100 : 0;
  const top = live ? [...live.liveHoldings].sort((a, b) => b.currentValue - a.currentValue) : [];
  const allocBase = live ? live.totalNetWorth : 0;

  return (
    <Panel
      title="Portfolio"
      icon={Briefcase}
      className={className}
      actions={
        <Link to="/portfolio" className="flex items-center gap-0.5 font-mono text-3xs uppercase tracking-wider text-fg-subtle transition-colors hover:text-accent">
          Open <ArrowUpRight className="h-3 w-3" />
        </Link>
      }
    >
      {!summary || !live ? (
        <div className="space-y-3">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <div className="space-y-3.5">
          <div>
            <div className="qf-label">Net worth · mark-to-market</div>
            <AnimatedNumber
              value={live.totalNetWorth}
              initialFrom={summary.cashBalance}
              format={(v) => formatCurrency(v)}
              tintOnChange
              className="mt-1 text-2xl font-semibold tracking-tight text-fg"
            />
            <div className="mt-1 flex items-center gap-2 font-mono text-xs">
              <AnimatedNumber
                value={live.totalUnrealizedPnL}
                format={formatSignedCurrency}
                className={cn('font-semibold', signTone(live.totalUnrealizedPnL))}
              />
              <span className={cn('num', signTone(pnlPct))}>{formatSignedPercent(pnlPct)}</span>
              <span className="text-fg-subtle">unrealized</span>
            </div>
          </div>

          {/* Allocation bar: holdings by value, then cash */}
          <div>
            <div className="flex h-1.5 overflow-hidden rounded-full bg-line">
              {top.map((h, i) => (
                <motion.span
                  key={h.symbol}
                  className="h-full"
                  style={{ background: ALLOC_COLORS[i % ALLOC_COLORS.length] }}
                  initial={{ width: 0 }}
                  animate={{ width: `${allocBase ? (h.currentValue / allocBase) * 100 : 0}%` }}
                  transition={{ type: 'spring', stiffness: 140, damping: 24 }}
                />
              ))}
              <motion.span
                className="h-full bg-fg-subtle/40"
                initial={{ width: 0 }}
                animate={{ width: `${allocBase ? (summary.cashBalance / allocBase) * 100 : 0}%` }}
                transition={{ type: 'spring', stiffness: 140, damping: 24 }}
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-3xs text-fg-subtle">
              {top.slice(0, 4).map((h, i) => (
                <span key={h.symbol} className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-sm" style={{ background: ALLOC_COLORS[i % ALLOC_COLORS.length] }} />
                  {h.symbol}
                </span>
              ))}
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-sm bg-fg-subtle/40" />
                Cash
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-px overflow-hidden rounded-md border border-line bg-line">
            {[
              { label: 'Cash', value: summary.cashBalance, tone: 'text-fg' },
              { label: 'Invested', value: summary.investedAmount, tone: 'text-fg' },
              { label: 'Realized', value: summary.realizedPnL, tone: signTone(summary.realizedPnL), signed: true },
            ].map((s) => (
              <div key={s.label} className="bg-surface px-2.5 py-2">
                <div className="font-mono text-3xs uppercase tracking-wider text-fg-subtle">{s.label}</div>
                <AnimatedNumber
                  value={s.value}
                  format={(v) => (s.signed ? formatSignedCurrency(v) : formatCurrency(v))}
                  className={cn('mt-0.5 text-xs font-semibold', s.tone)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
};
