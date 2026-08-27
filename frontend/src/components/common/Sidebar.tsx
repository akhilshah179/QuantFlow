import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Globe,
  CandlestickChart,
  Bookmark,
  Filter,
  BarChart3,
  DollarSign,
  Briefcase,
  Settings,
} from 'lucide-react';
import { useChartStore } from '../../store/chartStore';

export const Sidebar: React.FC = () => {
  const activeSymbol = useChartStore((state) => state.activeSymbol);

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/markets', label: 'Markets', icon: Globe },
    { to: `/stocks/${activeSymbol}`, label: 'Stock Details', icon: CandlestickChart },
    { to: '/watchlist', label: 'Watchlists', icon: Bookmark },
    { to: '/screener', label: 'Screener', icon: Filter },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/paper-trading', label: 'Paper Trading', icon: DollarSign },
    { to: '/portfolio', label: 'Portfolio', icon: Briefcase },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-16 md:w-52 bg-white border-r border-[#e0e3eb] flex flex-col shrink-0 min-h-[calc(100vh-49px)] select-none">
      <nav className="p-2 space-y-0.5 mt-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded text-xs font-mono transition-colors ${
                  isActive
                    ? 'bg-[#e8f0fe] text-[#2962ff] font-bold border-l-2 border-[#2962ff]'
                    : 'text-[#5d606b] hover:text-[#131722] hover:bg-[#f0f3fa]'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0 text-[#707a8a]" />
              <span className="hidden md:inline truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};
