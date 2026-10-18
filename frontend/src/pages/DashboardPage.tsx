import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Flame, Gauge, ShieldAlert, Star, TrendingDown, TrendingUp } from 'lucide-react';
import { useMarketOverview } from '../services/queries';
import { useConnectionStatus } from '../store/marketStore';
import { useWatchlistStore } from '../store/watchlistStore';
import { useNow } from '../hooks/useNow';
import { PHASE_LABEL, SESSIONS, sessionPhase } from '../utils/marketHours';
import { formatPrice, formatSignedPercent } from '../utils/formatters';
import { MarketStreamWall } from '../components/stream/MarketStreamWall';
import { IndexCards } from '../components/market/IndexCards';
import { MoversTable } from '../components/market/MoversTable';
import { SessionBoard } from '../components/market/SessionBoard';
import { PortfolioSnapshot } from '../components/market/PortfolioSnapshot';
import { NewsSection } from '../components/news/NewsSection';
import { Panel } from '../components/ui/Panel';
import { LiveValue } from '../components/ui/LiveValue';
import { EmptyState, LiveDot } from '../components/ui/misc';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';

/* Header: live timestamp + market status, isolated so the clock re-renders alone */
const CommandHeader: React.FC<{ backendLive: boolean | undefined }> = ({ backendLive }) => {
  const now = useNow(1000);
  const status = useConnectionStatus();
  const usPhase = sessionPhase(SESSIONS[0], now);

  return (
    <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="qf-label mb-1 flex items-center gap-2">
          <Gauge className="h-3 w-3 text-accent" />
          Overview / Command Center
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-fg sm:text-2xl">
          Global Markets{' '}
          <span className="bg-gradient-to-r from-accent to-[#ffd58a] bg-clip-text text-transparent">Live</span>
        </h1>
        <p className="mt-0.5 text-xs text-fg-subtle">Indices, movers, order flow and your book — streaming in real time.</p>
      </div>

      <div className="flex flex-wrap items-stretch gap-2 font-mono text-2xs">
        <div className="qf-panel flex flex-col justify-center px-3 py-1.5">
          <span className="text-3xs uppercase tracking-wider text-fg-subtle">
            {now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span className="num text-base font-semibold leading-tight text-fg">
            {now.toLocaleTimeString([], { hour12: false })}
            <span className="ml-1.5 text-3xs font-normal text-fg-subtle">
              {Intl.DateTimeFormat().resolvedOptions().timeZone.split('/').pop()?.replace('_', ' ')}
            </span>
          </span>
        </div>
        <div className="qf-panel flex flex-col justify-center px-3 py-1.5">
          <span className="text-3xs uppercase tracking-wider text-fg-subtle">US Session</span>
          <span
            className={cn(
              'flex items-center gap-1.5 text-xs font-semibold',
              usPhase === 'OPEN' ? 'text-up' : usPhase === 'CLOSED' ? 'text-fg-muted' : 'text-accent',
            )}
          >
            <LiveDot tone={usPhase === 'OPEN' ? 'up' : usPhase === 'CLOSED' ? 'muted' : 'accent'} pulse={usPhase === 'OPEN'} />
            {PHASE_LABEL[usPhase]}
          </span>
        </div>
        <div className="qf-panel flex flex-col justify-center px-3 py-1.5">
          <span className="text-3xs uppercase tracking-wider text-fg-subtle">Feed</span>
          <span
            className={cn(
              'flex items-center gap-1.5 text-xs font-semibold',
              status === 'CONNECTED' ? 'text-up' : status === 'RECONNECTING' ? 'text-accent' : 'text-down',
            )}
          >
            <LiveDot tone={status === 'CONNECTED' ? 'up' : status === 'RECONNECTING' ? 'accent' : 'down'} pulse={status !== 'DISCONNECTED'} />
            {status === 'CONNECTED' ? (backendLive === false ? 'Connected · delayed' : 'Streaming') : status === 'RECONNECTING' ? 'Reconnecting' : 'Offline'}
          </span>
        </div>
      </div>
    </header>
  );
};

/* Compact watchlist ----------------------------------------------------------- */

const WatchlistMini: React.FC<{ className?: string }> = ({ className }) => {
  const navigate = useNavigate();
  const watchlists = useWatchlistStore((s) => s.watchlists);
  const activeId = useWatchlistStore((s) => s.activeWatchlistId);
  const active = watchlists.find((w) => w.id === activeId) || watchlists[0];
  const items = active?.items.slice(0, 8) ?? [];

  return (
    <Panel
      title={active ? `Watchlist · ${active.name}` : 'Watchlist'}
      icon={Star}
      className={className}
      bodyClassName="p-0"
      actions={
        <Link to="/watchlists" className="flex items-center gap-0.5 font-mono text-3xs uppercase tracking-wider text-fg-subtle transition-colors hover:text-accent">
          Manage <ArrowUpRight className="h-3 w-3" />
        </Link>
      }
    >
      {items.length === 0 ? (
        <EmptyState icon={Star} title="Your watchlist is empty" hint="Add symbols from the Watchlists page or the side panel." className="m-3.5" />
      ) : (
        <div className="divide-y divide-line/50">
          {items.map((item) => (
            <button
              key={item.id || item.symbol}
              onClick={() => navigate(`/stocks/${item.symbol}`)}
              className="group grid w-full grid-cols-12 items-center px-3.5 py-2 text-left font-mono text-xs transition-colors hover:bg-raised/70"
            >
              <span className="col-span-5 min-w-0">
                <span className="block truncate font-semibold text-fg group-hover:text-accent">{item.symbol}</span>
                <span className="block truncate font-sans text-3xs text-fg-subtle">{item.name}</span>
              </span>
              <span className="col-span-4 text-right">
                <LiveValue symbol={item.symbol} value={item.price || undefined} format={(v) => formatPrice(v)} className="text-fg" />
              </span>
              <span className="col-span-3 text-right">
                <LiveValue symbol={item.symbol} field="changePercent" value={item.changePercent} format={formatSignedPercent} signed />
              </span>
            </button>
          ))}
        </div>
      )}
    </Panel>
  );
};

/* Page ----------------------------------------------------------------------- */

export const DashboardPage: React.FC = () => {
  const { data, isLoading, isError, refetch, isFetching } = useMarketOverview('stocks');
  const backendLive = data?.indices?.some((i) => i.marketStatus === 'LIVE' || i.marketStatus === 'OPEN');

  return (
    <div className="space-y-4">
      <CommandHeader backendLive={data ? backendLive : undefined} />

      {/* Hero: live market wall + sessions/portfolio */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <MarketStreamWall height={318} className="xl:col-span-8" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:col-span-4 xl:grid-cols-1">
          <PortfolioSnapshot />
          <SessionBoard />
        </div>
      </div>

      {!isLoading && (isError || !data) ? (
        <Panel>
          <EmptyState
            icon={ShieldAlert}
            tone="down"
            title="Market overview data currently unavailable."
            action={
              <Button variant="primary" size="sm" loading={isFetching} onClick={() => refetch()}>
                Retry Connection
              </Button>
            }
          />
        </Panel>
      ) : (
        <>
          <IndexCards indices={data?.indices} loading={isLoading} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            <MoversTable title="Top Gainers" icon={TrendingUp} iconTone="up" rows={data?.topGainers} loading={isLoading} />
            <MoversTable title="Top Decliners" icon={TrendingDown} iconTone="down" rows={data?.topLosers} loading={isLoading} />
            <MoversTable
              title="Most Active"
              icon={Flame}
              rows={data?.mostActive}
              loading={isLoading}
              showVolume
              className="lg:col-span-2 2xl:col-span-1"
            />
          </div>
        </>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <WatchlistMini className="xl:col-span-5" />
        <NewsSection limit={7} variant="list" className="xl:col-span-7" />
      </div>
    </div>
  );
};
