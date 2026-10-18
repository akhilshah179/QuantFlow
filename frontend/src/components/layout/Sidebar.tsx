import React, { memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeftRight,
  BarChart3,
  BellRing,
  Bitcoin,
  Briefcase,
  CalendarDays,
  CandlestickChart,
  ChevronsLeft,
  ChevronsRight,
  Globe2,
  Layers,
  LayoutDashboard,
  LucideIcon,
  Newspaper,
  Rocket,
  Settings,
  SlidersHorizontal,
  Star,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useChartStore } from '../../store/chartStore';
import { cn } from '../../utils/cn';
import { BrandMark } from './BrandMark';

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  /** Extra paths that should light this item up. */
  match?: (pathname: string) => boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

function useSections(): NavSection[] {
  const activeSymbol = useChartStore((s) => s.activeSymbol);
  return [
    {
      title: 'Markets',
      items: [
        { label: 'Overview', path: '/', icon: LayoutDashboard },
        { label: 'Markets', path: '/markets', icon: Globe2 },
        { label: 'Stocks', path: `/stocks/${activeSymbol}`, icon: CandlestickChart, match: (p) => p.startsWith('/stocks/') },
        { label: 'Crypto', path: '/crypto', icon: Bitcoin },
        { label: 'Forex', path: '/forex', icon: ArrowLeftRight },
        { label: 'Futures', path: '/futures', icon: Layers },
      ],
    },
    {
      title: 'Research',
      items: [
        { label: 'Screener', path: '/screener', icon: SlidersHorizontal },
        { label: 'Analytics', path: '/analytics', icon: BarChart3 },
        { label: 'News', path: '/news', icon: Newspaper },
        { label: 'Calendar', path: '/calendar/economic', icon: CalendarDays },
        { label: 'IPO Calendar', path: '/calendar/ipo', icon: Rocket },
      ],
    },
    {
      title: 'Trading',
      items: [
        { label: 'Watchlists', path: '/watchlists', icon: Star, match: (p) => p === '/watchlist' },
        { label: 'Alerts', path: '/alerts', icon: BellRing },
        { label: 'Paper Trading', path: '/paper-trading', icon: Zap },
        { label: 'Portfolio', path: '/portfolio', icon: Briefcase },
      ],
    },
    {
      title: 'Social',
      items: [{ label: 'Community', path: '/community', icon: Users }],
    },
  ];
}

const NavLinkItem: React.FC<{ item: NavItem; active: boolean; collapsed: boolean; layoutGroup: string; onNavigate?: () => void }> = memo(
  ({ item, active, collapsed, layoutGroup, onNavigate }) => {
    const Icon = item.icon;
    return (
      <Link
        to={item.path}
        onClick={onNavigate}
        aria-current={active ? 'page' : undefined}
        aria-label={collapsed ? item.label : undefined}
        className={cn(
          'group/nav relative flex h-8 items-center rounded-md text-[12.5px] font-medium outline-none transition-colors duration-150',
          collapsed ? 'justify-center px-0' : 'gap-2.5 px-2.5',
          active ? 'text-fg' : 'text-fg-muted hover:bg-raised/70 hover:text-fg',
        )}
      >
        {active && (
          <motion.span
            layoutId={`nav-active-${layoutGroup}`}
            className="absolute inset-0 rounded-md border border-line-strong bg-raised"
            transition={{ type: 'spring', stiffness: 500, damping: 40, mass: 0.7 }}
          >
            <span className="absolute -left-px top-1.5 bottom-1.5 w-[2px] rounded-full bg-accent shadow-[0_0_10px_rgb(var(--qf-accent)/0.8)]" />
          </motion.span>
        )}
        <Icon
          className={cn(
            'relative h-[15px] w-[15px] shrink-0 transition-[color,transform] duration-150 group-hover/nav:scale-110',
            active ? 'text-accent' : 'text-fg-subtle group-hover/nav:text-fg-muted',
          )}
          strokeWidth={2}
        />
        {!collapsed && <span className="relative truncate">{item.label}</span>}
        {collapsed && (
          <span className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-md border border-line-strong bg-overlay px-2 py-1 font-mono text-2xs text-fg opacity-0 shadow-pop transition-[opacity,transform] duration-150 -translate-x-1 group-hover/nav:translate-x-0 group-hover/nav:opacity-100">
            {item.label}
          </span>
        )}
      </Link>
    );
  },
);
NavLinkItem.displayName = 'NavLinkItem';

const NavBody: React.FC<{ collapsed: boolean; layoutGroup: string; onNavigate?: () => void }> = ({ collapsed, layoutGroup, onNavigate }) => {
  const sections = useSections();
  const { pathname } = useLocation();

  return (
    // Collapsed rail stays overflow-visible so hover tooltips aren't clipped.
    <nav className={cn('flex-1 space-y-4 px-2 py-3 scrollbar-none', collapsed ? 'overflow-visible' : 'overflow-y-auto')}>
      {sections.map((section) => (
        <div key={section.title}>
          {collapsed ? (
            <div className="mx-auto mb-1.5 h-px w-6 bg-line" />
          ) : (
            <div className="qf-label mb-1 px-2.5 text-3xs">{section.title}</div>
          )}
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const active = item.path === '/' ? pathname === '/' : pathname === item.path || !!item.match?.(pathname);
              return (
                <NavLinkItem
                  key={item.label}
                  item={item}
                  active={active}
                  collapsed={collapsed}
                  layoutGroup={layoutGroup}
                  onNavigate={onNavigate}
                />
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
};

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapsed, mobileOpen, onCloseMobile }) => {
  const { pathname } = useLocation();
  const settingsActive = pathname === '/settings';

  const footer = (isCollapsed: boolean, onNavigate?: () => void) => (
    <div className={cn('flex items-center border-t border-line p-2', isCollapsed ? 'flex-col gap-1' : 'gap-1')}>
      <Link
        to="/settings"
        onClick={onNavigate}
        title="Settings"
        className={cn(
          'flex h-8 items-center gap-2.5 rounded-md text-[12.5px] font-medium transition-colors',
          isCollapsed ? 'w-8 justify-center' : 'flex-1 px-2.5',
          settingsActive ? 'bg-raised text-fg' : 'text-fg-muted hover:bg-raised/70 hover:text-fg',
        )}
      >
        <Settings className={cn('h-[15px] w-[15px]', settingsActive ? 'text-accent' : 'text-fg-subtle')} />
        {!isCollapsed && 'Settings'}
      </Link>
    </div>
  );

  return (
    <>
      {/* Desktop rail */}
      <aside
        className={cn(
          'relative z-20 hidden shrink-0 flex-col border-r border-line bg-surface/80 transition-[width] duration-200 ease-terminal lg:flex',
          collapsed ? 'w-[60px]' : 'w-[212px]',
        )}
      >
        <NavBody collapsed={collapsed} layoutGroup="desktop" />
        {footer(collapsed)}
        <button
          onClick={onToggleCollapsed}
          className="absolute -right-3 top-5 z-30 flex h-6 w-6 items-center justify-center rounded-full border border-line-strong bg-overlay text-fg-subtle shadow-pop transition-colors hover:text-accent"
          title={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
        >
          {collapsed ? <ChevronsRight className="h-3 w-3" /> : <ChevronsLeft className="h-3 w-3" />}
        </button>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="scrim"
              className="fixed inset-0 z-50 bg-black/60 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={onCloseMobile}
            />
            <motion.aside
              key="drawer"
              className="fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-line-strong bg-surface shadow-pop lg:hidden"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 420, damping: 40 }}
            >
              <div className="flex h-12 items-center justify-between border-b border-line px-3">
                <BrandMark />
                <button onClick={onCloseMobile} className="rounded-md p-1.5 text-fg-muted hover:bg-raised hover:text-fg" aria-label="Close navigation">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <NavBody collapsed={false} layoutGroup="mobile" onNavigate={onCloseMobile} />
              {footer(false, onCloseMobile)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
