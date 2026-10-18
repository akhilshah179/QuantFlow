import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { usePortfolioStore } from '../store/portfolioStore';
import { useLivePortfolio } from '../hooks/useLivePortfolio';
import { formatCurrency, formatPrice, formatSignedCurrency, formatSignedPercent } from '../utils/formatters';
import { Briefcase, Wallet, TrendingUp, TrendingDown, DollarSign, PieChart, ArrowUpRight } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { LiveValue } from '../components/ui/LiveValue';
import { Button } from '../components/ui/Button';
import { EmptyState, Skeleton, signTone } from '../components/ui/misc';
import { cn } from '../utils/cn';

const ALLOC_COLORS = ['#f5b142', '#60a5fa', '#2dd4bf', '#c084fc', '#f472b6', '#fb923c', '#a3e635'];

export const PortfolioPage: React.FC = () => {
  const navigate = useNavigate();
  const summary = usePortfolioStore((s) => s.summary);
  const fetchPortfolio = usePortfolioStore((s) => s.fetchPortfolio);
  const isLoading = usePortfolioStore((s) => s.isLoading);
  const live = useLivePortfolio();

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  if ((isLoading && !summary) || !summary || !live) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-72" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  const { liveHoldings, totalNetWorth, totalUnrealizedPnL, totalCost } = live;
  const isUnrealizedPos = totalUnrealizedPnL >= 0;
  const isRealizedPos = summary.realizedPnL >= 0;
  const pnlPct = totalCost > 0 ? (totalUnrealizedPnL / totalCost) * 100 : 0;
  const sorted = [...liveHoldings].sort((a, b) => b.currentValue - a.currentValue);

  const cards = [
    { label: 'Total Net Worth', icon: PieChart, value: totalNetWorth, format: (v: number) => formatCurrency(v), tone: 'text-fg', iconTone: 'text-accent', from: summary.cashBalance },
    { label: 'Available Cash', icon: Wallet, value: summary.cashBalance, format: (v: number) => formatCurrency(v), tone: 'text-up', iconTone: 'text-up' },
    { label: 'Invested Amount', icon: DollarSign, value: summary.investedAmount, format: (v: number) => formatCurrency(v), tone: 'text-fg', iconTone: 'text-fg-subtle' },
    {
      label: 'Unrealized P/L',
      icon: isUnrealizedPos ? TrendingUp : TrendingDown,
      value: totalUnrealizedPnL,
      format: formatSignedCurrency,
      tone: signTone(totalUnrealizedPnL),
      iconTone: isUnrealizedPos ? 'text-up' : 'text-down',
      sub: formatSignedPercent(pnlPct),
    },
    {
      label: 'Realized P/L',
      icon: isRealizedPos ? TrendingUp : TrendingDown,
      value: summary.realizedPnL,
      format: formatSignedCurrency,
      tone: signTone(summary.realizedPnL),
      iconTone: isRealizedPos ? 'text-up' : 'text-down',
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        icon={Briefcase}
        eyebrow="Trading / Portfolio"
        title="Paper Portfolio & Holdings"
        subtitle="Live mark-to-market performance and equity asset allocation"
        actions={
          <Button variant="primary" onClick={() => navigate('/paper-trading')}>
            Trade <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.25 }}
              className={cn('qf-panel p-3.5', i === 0 && 'sm:col-span-2 lg:col-span-1')}
            >
              <div className="flex items-center gap-1.5 font-mono text-2xs uppercase tracking-wider text-fg-subtle">
                <Icon className={cn('h-3.5 w-3.5', c.iconTone)} />
                <span>{c.label}</span>
              </div>
              <AnimatedNumber
                value={c.value}
                initialFrom={c.from ?? 0}
                format={c.format}
                tintOnChange={i === 0}
                className={cn('mt-1.5 text-xl font-semibold tracking-tight', c.tone)}
              />
              {c.sub && <div className={cn('num mt-0.5 text-xs', c.tone)}>{c.sub}</div>}
            </motion.div>
          );
        })}
      </div>

      {/* Allocation */}
      {sorted.length > 0 && (
        <Panel title="Allocation" icon={PieChart}>
          <div className="flex h-2.5 overflow-hidden rounded-full bg-line">
            {sorted.map((h, i) => (
              <motion.span
                key={h.symbol}
                title={`${h.symbol} ${((h.currentValue / totalNetWorth) * 100).toFixed(1)}%`}
                className="h-full border-r border-bg/60 last:border-0"
                style={{ background: ALLOC_COLORS[i % ALLOC_COLORS.length] }}
                initial={{ width: 0 }}
                animate={{ width: `${(h.currentValue / totalNetWorth) * 100}%` }}
                transition={{ type: 'spring', stiffness: 140, damping: 24 }}
              />
            ))}
            <motion.span
              className="h-full bg-fg-subtle/35"
              initial={{ width: 0 }}
              animate={{ width: `${(summary.cashBalance / totalNetWorth) * 100}%` }}
              transition={{ type: 'spring', stiffness: 140, damping: 24 }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 font-mono text-2xs text-fg-muted">
            {sorted.map((h, i) => (
              <span key={h.symbol} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm" style={{ background: ALLOC_COLORS[i % ALLOC_COLORS.length] }} />
                {h.symbol}
                <span className="num text-fg-subtle">{((h.currentValue / totalNetWorth) * 100).toFixed(1)}%</span>
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-fg-subtle/35" />
              Cash
              <span className="num text-fg-subtle">{((summary.cashBalance / totalNetWorth) * 100).toFixed(1)}%</span>
            </span>
          </div>
        </Panel>
      )}

      {/* Holdings */}
      <Panel title="Open Positions" icon={Briefcase} bodyClassName="p-0">
        {liveHoldings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="qf-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th className="text-right">Quantity</th>
                  <th className="text-right">Avg Price</th>
                  <th className="text-right">Live Price</th>
                  <th className="text-right">Market Value</th>
                  <th className="text-right">Unrealized P/L</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {liveHoldings.map((h) => (
                  <tr key={h.id} className="group">
                    <td>
                      <div className="font-semibold text-fg">{h.symbol}</div>
                      <div className="font-sans text-3xs text-fg-subtle">{h.name}</div>
                    </td>
                    <td className="num text-right text-fg-muted">{h.quantity}</td>
                    <td className="num text-right text-fg-muted">{formatCurrency(h.averageBuyPrice)}</td>
                    <td className="text-right">
                      <LiveValue symbol={h.symbol} value={h.currentPrice} format={(v) => formatPrice(v)} className="font-semibold text-fg" />
                    </td>
                    <td className="text-right">
                      <AnimatedNumber value={h.currentValue} format={(v) => formatCurrency(v)} duration={0.4} className="font-semibold text-fg" />
                    </td>
                    <td className="text-right">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 font-semibold ring-1 ring-inset',
                          h.unrealizedPnL >= 0 ? 'bg-up/10 text-up ring-up/20' : 'bg-down/10 text-down ring-down/20',
                        )}
                      >
                        <AnimatedNumber value={h.unrealizedPnL} format={formatSignedCurrency} duration={0.4} />
                        <span className="num text-[11px] opacity-80">{formatSignedPercent(h.unrealizedPnLPercent)}</span>
                      </span>
                    </td>
                    <td className="text-right">
                      <Button size="xs" variant="secondary" onClick={() => navigate(`/stocks/${h.symbol}`)}>
                        Trade / Analyze
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Briefcase}
            title="You currently hold no open stock positions."
            hint="Use Paper Trading to execute orders."
            action={
              <Button variant="primary" onClick={() => navigate('/paper-trading')}>
                Open Paper Trading
              </Button>
            }
            className="m-3.5"
          />
        )}
      </Panel>
    </div>
  );
};
