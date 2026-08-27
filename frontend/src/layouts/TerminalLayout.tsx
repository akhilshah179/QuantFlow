import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  LayoutDashboard,
  BarChart2,
  Globe,
  Sliders,
  Newspaper,
  Briefcase,
  DollarSign,
  Settings,
  Search,
  Bell,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Activity,
  Layers,
  Calendar,
  Award,
  Users,
  Zap,
  Bookmark,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { GlobalSearchModal } from '../components/common/GlobalSearchModal';
import { RightWatchlistPanel } from '../components/common/RightWatchlistPanel';
import { formatCurrency } from '../utils/formatters';

interface Props {
  children: React.ReactNode;
}

export const TerminalLayout: React.FC<Props> = ({ children }) => {
  const [collapsedNav, setCollapsedNav] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Markets', path: '/markets', icon: Globe },
    { label: 'Screener', path: '/screener', icon: Sliders },
    { label: 'Crypto', path: '/crypto', icon: Activity },
    { label: 'Forex', path: '/forex', icon: DollarSign },
    { label: 'Futures & Commodities', path: '/futures', icon: Layers },
    { label: 'Trade Ideas', path: '/community', icon: Users },
    { label: 'Alerts', path: '/alerts', icon: Bell },
    { label: 'Economic Calendar', path: '/calendar/economic', icon: Calendar },
    { label: 'IPO Calendar', path: '/calendar/ipo', icon: Award },
    { label: 'Analytics', path: '/analytics', icon: BarChart2 },
    { label: 'News & Insights', path: '/news', icon: Newspaper },
    { label: 'Paper Trading', path: '/paper-trading', icon: Zap },
    { label: 'Portfolio', path: '/portfolio', icon: Briefcase },
    { label: 'Watchlists', path: '/watchlists', icon: Shield },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#131722] flex flex-col font-sans selection:bg-[#2962ff] selection:text-white">
      {/* Global Top Bar */}
      <header className="h-12 bg-white border-b border-[#e0e3eb] px-4 flex items-center justify-between z-30 sticky top-0">
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded bg-[#2962ff] flex items-center justify-center shadow-sm">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-sm tracking-tight text-[#131722] font-mono">QuantFlow</span>
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#f0f3fa] text-[#2962ff]">PRO</span>
            </div>
          </Link>

          {/* Quick Search Input */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center space-x-2 bg-[#f8f9fd] border border-[#e0e3eb] hover:border-[#2962ff] text-[#707a8a] px-3 py-1 rounded text-xs font-mono transition-colors w-72"
          >
            <Search className="w-3.5 h-3.5 text-[#2962ff]" />
            <span className="flex-1 text-left line-clamp-1">Search symbol, crypto, forex...</span>
            <kbd className="bg-[#e0e3eb] text-[10px] px-1.5 py-0.5 rounded text-[#131722]">Ctrl+K</kbd>
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <div className="hidden lg:flex items-center space-x-2 bg-[#f8f9fd] border border-[#e0e3eb] px-2.5 py-1 rounded text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-[#089981]"></span>
            <span className="text-[#707a8a] text-[11px]">REAL-TIME STREAM</span>
          </div>

          <div className="hidden sm:flex items-center space-x-1.5 bg-[#f8f9fd] border border-[#e0e3eb] px-2.5 py-1 rounded text-xs font-mono">
            <span className="text-[#707a8a]">CASH:</span>
            <span className="text-[#089981] font-bold">
              {formatCurrency(user?.virtualCash || 100000)}
            </span>
          </div>

          <button
            onClick={() => setSearchOpen(true)}
            className="md:hidden text-[#707a8a] hover:text-[#131722] p-1.5"
          >
            <Search className="w-4 h-4" />
          </button>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 bg-[#f8f9fd] hover:bg-[#f0f3fa] px-2.5 py-1 rounded border border-[#e0e3eb] transition-colors cursor-pointer"
              >
                {user.profileImage ? (
                  <img src={user.profileImage} alt={user.name} className="w-5 h-5 rounded-full object-cover border border-[#2962ff]" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-[#e8f0fe] text-[#2962ff] flex items-center justify-center font-bold text-[10px]">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <span className="text-xs font-mono text-[#131722] font-bold max-w-[120px] truncate">{user.name}</span>
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)}></div>
                  <div className="absolute right-0 mt-1.5 w-56 bg-white border border-[#e0e3eb] rounded-lg shadow-lg py-2 z-50 font-mono text-xs text-[#131722]">
                    <div className="px-3 py-2 border-b border-[#f0f3fa]">
                      <div className="font-extrabold text-[#131722] truncate">{user.name}</div>
                      <div className="text-[11px] text-[#707a8a] truncate">{user.email}</div>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center px-3 py-1.5 hover:bg-[#f8f9fd] text-[#131722] transition-colors"
                      >
                        <User className="w-3.5 h-3.5 mr-2 text-[#2962ff]" />
                        <span>Profile & Account</span>
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center px-3 py-1.5 hover:bg-[#f8f9fd] text-[#131722] transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5 mr-2 text-[#707a8a]" />
                        <span>Account Settings</span>
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center px-3 py-1.5 hover:bg-[#f8f9fd] text-[#131722] transition-colors"
                      >
                        <Shield className="w-3.5 h-3.5 mr-2 text-[#089981]" />
                        <span>Security & OAuth</span>
                      </Link>
                    </div>
                    <div className="border-t border-[#f0f3fa] pt-1">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center px-3 py-1.5 hover:bg-[#fdecee] text-[#f23645] font-bold transition-colors text-left cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5 mr-2 text-[#f23645]" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="bg-[#2962ff] hover:bg-[#1e54e4] text-white px-3 py-1 rounded text-xs font-mono font-bold transition-colors"
            >
              Sign In
            </Link>
          )}

          <button
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            className={`p-1.5 rounded border transition-colors ${
              rightPanelOpen
                ? 'bg-[#e8f0fe] border-[#2962ff] text-[#2962ff]'
                : 'bg-[#f8f9fd] border-[#e0e3eb] text-[#707a8a] hover:text-[#131722]'
            }`}
            title="Toggle Right Watchlist Panel"
          >
            <Bookmark className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Nav */}
        <aside
          className={`${
            collapsedNav ? 'w-14' : 'w-52'
          } bg-white border-r border-[#e0e3eb] flex flex-col transition-all duration-200 z-20 select-none`}
        >
          <div className="p-2.5 border-b border-[#e0e3eb] flex items-center justify-between">
            {!collapsedNav && <span className="text-[10px] font-mono text-[#707a8a] font-semibold uppercase tracking-wider">TERMINAL</span>}
            <button
              onClick={() => setCollapsedNav(!collapsedNav)}
              className="text-[#707a8a] hover:text-[#131722] p-1 rounded hover:bg-[#f0f3fa] mx-auto"
            >
              {collapsedNav ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center ${
                    collapsedNav ? 'justify-center px-0' : 'space-x-2.5 px-2.5'
                  } py-2 rounded text-xs font-mono transition-all ${
                    isActive
                      ? 'bg-[#e8f0fe] text-[#2962ff] font-bold border-l-2 border-[#2962ff]'
                      : 'text-[#5d606b] hover:text-[#131722] hover:bg-[#f0f3fa]'
                  }`}
                  title={collapsedNav ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#2962ff]' : 'text-[#707a8a]'}`} />
                  {!collapsedNav && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Central Content Workspace Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#f8f9fd] min-w-0">
          {children}
        </main>

        {/* Right Watchlist Panel */}
        <RightWatchlistPanel isOpen={rightPanelOpen} onClose={() => setRightPanelOpen(false)} />
      </div>

      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
};
