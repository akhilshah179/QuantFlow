import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Menu, PanelRight, Search, Wallet } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useMarketOverview } from '../../services/queries';
import { useNow } from '../../hooks/useNow';
import { PHASE_LABEL, SESSIONS, sessionPhase } from '../../utils/marketHours';
import { formatCurrency, formatSignedPercent } from '../../utils/formatters';
import { AnimatedNumber } from '../ui/AnimatedNumber';
import { LiveDot } from '../ui/misc';
import { BrandMark } from './BrandMark';
import { NotificationCenter } from './NotificationCenter';
import { cn } from '../../utils/cn';

/* Major index strip (snapshot, refreshed by the shared overview query) ------ */

const IndexStrip: React.FC = memo(() => {
  const { data } = useMarketOverview('stocks');
  const indices = data?.indices?.slice(0, 4) ?? [];
  if (indices.length === 0) return null;
  return (
    <div className="hidden items-center gap-4 2xl:flex">
      {indices.map((idx) => (
        <Link key={idx.symbol} to="/markets" className="group flex items-baseline gap-1.5 font-mono text-[11px]">
          <span className="text-fg-subtle transition-colors group-hover:text-fg-muted">{idx.name}</span>
          <span className="num text-fg">{idx.value.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
          <span className={cn('num', idx.changePercent >= 0 ? 'text-up' : 'text-down')}>{formatSignedPercent(idx.changePercent)}</span>
        </Link>
      ))}
    </div>
  );
});
IndexStrip.displayName = 'IndexStrip';

/* US session pill — re-renders once a minute, isolated from the bar -------- */

const SessionPill: React.FC = () => {
  const now = useNow(30_000);
  const phase = sessionPhase(SESSIONS[0], now);
  const tone = phase === 'OPEN' ? 'up' : phase === 'CLOSED' ? 'muted' : 'accent';
  return (
    <div className="hidden items-center gap-1.5 whitespace-nowrap rounded-md border border-line bg-raised/60 px-2 py-1 font-mono text-2xs md:flex">
      <LiveDot tone={tone} pulse={phase === 'OPEN'} />
      <span className="text-fg-subtle">US</span>
      <span className={cn(phase === 'OPEN' ? 'text-up' : phase === 'CLOSED' ? 'text-fg-muted' : 'text-accent')}>
        {PHASE_LABEL[phase]}
      </span>
    </div>
  );
};

interface TopBarProps {
  onOpenSearch: () => void;
  onOpenNav: () => void;
  rightPanelOpen: boolean;
  onToggleRightPanel: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenSearch, onOpenNav, rightPanelOpen, onToggleRightPanel }) => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <header className="sticky top-0 z-40 flex h-12 shrink-0 items-center justify-between gap-3 border-b border-line bg-bg/85 px-3 backdrop-blur-md sm:px-4">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onOpenNav}
          className="rounded-md p-1.5 text-fg-muted transition-colors hover:bg-raised hover:text-fg lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-4 w-4" />
        </button>
        <BrandMark />

        <button
          onClick={onOpenSearch}
          className="group ml-2 hidden h-8 w-56 items-center gap-2 rounded-md border border-line bg-surface/80 px-2.5 text-left font-mono text-xs text-fg-subtle transition-[border-color,background-color] duration-150 hover:border-line-strong hover:bg-raised lg:flex xl:w-72"
        >
          <Search className="h-3.5 w-3.5 text-fg-subtle transition-colors group-hover:text-accent" />
          <span className="flex-1 truncate">Search symbols, crypto, FX…</span>
          <kbd className="qf-kbd">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
        </button>
      </div>

      <IndexStrip />

      <div className="flex items-center gap-1.5 sm:gap-2">
        <SessionPill />

        <button
          onClick={onOpenSearch}
          className="rounded-md p-1.5 text-fg-muted transition-colors hover:bg-raised hover:text-fg lg:hidden"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </button>

        <Link
          to="/portfolio"
          className="hidden items-center gap-1.5 rounded-md border border-line bg-raised/60 px-2 py-1 font-mono text-2xs transition-colors hover:border-line-strong sm:flex"
          title="Available paper-trading cash"
        >
          <Wallet className="h-3.5 w-3.5 text-up" />
          <span className="text-fg-subtle">CASH</span>
          <AnimatedNumber value={user?.virtualCash || 100000} format={(v) => formatCurrency(v)} tintOnChange className="font-semibold text-fg" />
        </Link>

        <NotificationCenter />

        {user ? (
          <div className="flex items-center gap-1">
            <div className="hidden items-center gap-2 pl-1 sm:flex">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-line-strong bg-raised font-mono text-2xs font-bold text-accent">
                {user.name?.slice(0, 2).toUpperCase() || 'QF'}
              </span>
              <span className="hidden max-w-[120px] truncate text-xs font-medium text-fg-muted xl:inline">{user.name}</span>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="rounded-md p-1.5 text-fg-subtle transition-colors hover:bg-down/10 hover:text-down"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <Link to="/login" className="rounded-md bg-accent px-3 py-1.5 font-mono text-xs font-bold text-accent-fg">
            Sign In
          </Link>
        )}

        <button
          onClick={onToggleRightPanel}
          className={cn(
            'hidden h-8 w-8 items-center justify-center rounded-md border transition-colors md:flex',
            rightPanelOpen ? 'border-accent/40 bg-accent/10 text-accent' : 'border-transparent text-fg-muted hover:bg-raised hover:text-fg',
          )}
          title="Toggle watchlist panel"
          aria-label="Toggle watchlist panel"
        >
          <PanelRight className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};
