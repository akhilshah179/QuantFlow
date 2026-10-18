import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useMarketOverview, useScreener } from '../services/queries';
import { formatCurrency, formatNumber, formatSignedPercent } from '../utils/formatters';
import { BarChart3, PieChart, Activity } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { Button } from '../components/ui/Button';
import { EmptyState, Skeleton, SkeletonRows } from '../components/ui/misc';
import { cn } from '../utils/cn';

export const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const overview = useMarketOverview('stocks');
  const screener = useScreener('');
  const data = overview.data;
  const screenerData = screener.data ?? [];
  const loading = overview.isLoading || screener.isLoading;

  if (!loading && !data) {
    return <EmptyState icon={BarChart3} title="Fundamental market analytics data is currently unavailable." />;
  }

  const maxAbs = Math.max(0.01, ...(data?.sectorPerformance ?? []).map((s) => Math.abs(s.changePercent)));

  return (
    <div className="space-y-4">
      <PageHeader
        icon={BarChart3}
        eyebrow="Research / Analytics"
        title="Fundamental Analytics & Valuation Engine"
        subtitle="Cross-sector capital allocation, valuation multiples & beta distribution"
      />

      <Panel title="Sector Capital Allocation & Performance" icon={PieChart} iconTone="up">
        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : data!.sectorPerformance && data!.sectorPerformance.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {data!.sectorPerformance.map((sec, i) => {
              const isUp = sec.changePercent >= 0;
              return (
                <div key={sec.sector} className="rounded-md border border-line bg-bg/40 p-3">
                  <div className="truncate text-xs text-fg-muted">{sec.sector}</div>
                  <div className={cn('num mt-1 text-lg font-semibold', isUp ? 'text-up' : 'text-down')}>{formatSignedPercent(sec.changePercent)}</div>
                  <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-line">
                    <motion.div
                      className={cn('h-full rounded-full', isUp ? 'bg-up' : 'bg-down')}
                      initial={{ width: 0 }}
                      animate={{ width: `${(Math.abs(sec.changePercent) / maxAbs) * 100}%` }}
                      transition={{ delay: i * 0.05, type: 'spring', stiffness: 140, damping: 22 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState title="Sector relative performance data is currently unavailable." />
        )}
      </Panel>

      <Panel title="Top Equities Valuation & Beta Matrix" icon={Activity} bodyClassName="p-0">
        {loading ? (
          <SkeletonRows rows={8} className="p-3.5" />
        ) : (
          <div className="overflow-x-auto">
            <table className="qf-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Company</th>
                  <th className="text-right">Market Cap</th>
                  <th className="text-right">P/E Ratio</th>
                  <th className="text-right">EPS</th>
                  <th className="text-right">Dividend Yield</th>
                  <th>Beta (Risk)</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {screenerData.slice(0, 10).map((stock) => {
                  const beta = stock.beta ?? 0;
                  return (
                    <tr key={stock.symbol}>
                      <td className="font-semibold text-fg">{stock.symbol}</td>
                      <td className="max-w-xs truncate font-sans text-fg-subtle">{stock.name}</td>
                      <td className="num text-right font-semibold text-fg">{stock.marketCap ? formatNumber(stock.marketCap) : 'N/A'}</td>
                      <td className="num text-right text-fg-muted">{stock.peRatio ? stock.peRatio.toFixed(1) : 'N/A'}</td>
                      <td className="num text-right text-fg-muted">{stock.eps ? formatCurrency(stock.eps, stock.currency) : 'N/A'}</td>
                      <td className="num text-right text-up">{stock.dividendYield !== undefined ? `${stock.dividendYield.toFixed(2)}%` : 'N/A'}</td>
                      <td>
                        {stock.beta ? (
                          <span className="flex items-center gap-2">
                            <span className="relative h-1 w-16 overflow-hidden rounded-full bg-line">
                              <span
                                className={cn('absolute inset-y-0 left-0 rounded-full', beta > 1.2 ? 'bg-down' : beta < 0.8 ? 'bg-up' : 'bg-accent')}
                                style={{ width: `${Math.min(100, (beta / 2) * 100)}%` }}
                              />
                            </span>
                            <span className="num text-fg">{beta.toFixed(2)}</span>
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="text-right">
                        <Button size="xs" variant="secondary" onClick={() => navigate(`/stocks/${stock.symbol}`)}>
                          Deep Analysis
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
};
