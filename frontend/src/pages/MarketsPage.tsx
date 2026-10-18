import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useMarketOverview } from '../services/queries';
import { formatCurrency, formatNumber, formatSigned, formatSignedPercent } from '../utils/formatters';
import { MarketStatusBadge } from '../components/common/MarketStatusBadge';
import { NewsSection } from '../components/news/NewsSection';
import { Globe2, Grid3x3, Layers, ShieldAlert } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { IndexCards } from '../components/market/IndexCards';
import { LiveValue } from '../components/ui/LiveValue';
import { Button } from '../components/ui/Button';
import { EmptyState, Skeleton, SkeletonRows } from '../components/ui/misc';

/** Map a % move onto a tinted tile background (±3% saturates). */
const heat = (pct: number) => {
  const a = Math.min(1, Math.abs(pct) / 3) * 0.32 + 0.05;
  return pct >= 0 ? `rgb(var(--qf-up) / ${a})` : `rgb(var(--qf-down) / ${a})`;
};

export const MarketsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch, isFetching } = useMarketOverview('stocks');

  if (!isLoading && (isError || !data)) {
    return (
      <Panel>
        <EmptyState
          icon={ShieldAlert}
          tone="down"
          title={(error as Error)?.message || 'Global market overview data is currently unavailable.'}
          action={
            <Button variant="primary" loading={isFetching} onClick={() => refetch()}>
              Retry Connection
            </Button>
          }
        />
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        icon={Globe2}
        eyebrow="Markets / Global"
        title="Global Markets & Exchange Discovery"
        subtitle="Cross-exchange equity tracking across US, Indian & European markets"
      />

      <IndexCards indices={data?.indices} loading={isLoading} showStatus />

      {/* Sector heat-map */}
      <Panel title="Sector Relative Performance" icon={Grid3x3}>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {data!.sectorPerformance.map((sec, i) => (
              <motion.div
                key={sec.sector}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04, duration: 0.22 }}
                className="flex h-20 flex-col justify-between rounded-md border border-line/60 p-3 transition-transform duration-200 hover:-translate-y-0.5"
                style={{ background: heat(sec.changePercent) }}
              >
                <div className="truncate text-xs font-medium text-fg">{sec.sector}</div>
                <div className="num text-lg font-semibold text-fg">{formatSignedPercent(sec.changePercent)}</div>
              </motion.div>
            ))}
          </div>
        )}
      </Panel>

      {/* Cross-exchange equities */}
      <Panel title="Active Cross-Border Stocks" icon={Layers} bodyClassName="p-0">
        {isLoading ? (
          <SkeletonRows rows={5} className="p-3.5" />
        ) : (
          <div className="overflow-x-auto">
            <table className="qf-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Exchange</th>
                  <th>Sector</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">24h Change</th>
                  <th className="text-right">Market Cap</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {data!.mostActive.map((stock) => (
                  <tr key={stock.symbol} className="group cursor-pointer" onClick={() => navigate(`/stocks/${stock.symbol}`)}>
                    <td>
                      <div className="font-semibold text-fg group-hover:text-accent">{stock.symbol}</div>
                      <div className="max-w-[180px] truncate font-sans text-3xs text-fg-subtle">{stock.name}</div>
                    </td>
                    <td className="text-fg-muted">{stock.exchange}</td>
                    <td className="text-fg-muted">{stock.sector || 'General'}</td>
                    <td className="text-right">
                      <LiveValue symbol={stock.symbol} value={stock.price} format={(v) => formatCurrency(v, stock.currency)} className="font-semibold text-fg" />
                    </td>
                    <td className="text-right">
                      <span className="inline-flex items-center gap-1.5">
                        <LiveValue symbol={stock.symbol} field="change" value={stock.change} format={(v) => formatSigned(v)} signed className="text-[11px]" />
                        <LiveValue symbol={stock.symbol} field="changePercent" value={stock.changePercent} format={formatSignedPercent} pill className="text-[11px] font-semibold" />
                      </span>
                    </td>
                    <td className="num text-right text-fg-muted">{stock.marketCap ? formatNumber(stock.marketCap) : 'N/A'}</td>
                    <td>
                      <MarketStatusBadge status={stock.marketStatus} />
                    </td>
                    <td className="text-right">
                      <Button
                        size="xs"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/stocks/${stock.symbol}`);
                        }}
                      >
                        Terminal View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <NewsSection limit={6} />
    </div>
  );
};
