import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'motion/react';
import { TerminalLayout } from './layouts/TerminalLayout';
import { DashboardPage } from './pages/DashboardPage';
import { MarketsPage } from './pages/MarketsPage';
import { StockDetailPage } from './pages/StockDetailPage';
import { WatchlistPage } from './pages/WatchlistPage';
import { ScreenerPage } from './pages/ScreenerPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { PaperTradingPage } from './pages/PaperTradingPage';
import { SettingsPage } from './pages/SettingsPage';
import { CryptoPage } from './pages/CryptoPage';
import { ForexPage } from './pages/ForexPage';
import { FuturesPage } from './pages/FuturesPage';
import { EconomicCalendarPage } from './pages/EconomicCalendarPage';
import { IPOCalendarPage } from './pages/IPOCalendarPage';
import { CommunityPage } from './pages/CommunityPage';
import { AlertsPage } from './pages/AlertsPage';
import { NewsPage } from './pages/NewsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useAuthStore } from './store/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const LayoutWrapper: React.FC = () => (
  <TerminalLayout>
    <Outlet />
  </TerminalLayout>
);

export const App: React.FC = () => {
  const fetchUser = useAuthStore((state) => state.fetchUser);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Honour prefers-reduced-motion across every Motion component. */}
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Main Terminal Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<LayoutWrapper />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/markets" element={<MarketsPage />} />
                <Route path="/stocks/:symbol" element={<StockDetailPage />} />
                <Route path="/watchlists" element={<WatchlistPage />} />
                <Route path="/watchlist" element={<WatchlistPage />} />
                <Route path="/screener" element={<ScreenerPage />} />
                <Route path="/crypto" element={<CryptoPage />} />
                <Route path="/forex" element={<ForexPage />} />
                <Route path="/futures" element={<FuturesPage />} />
                <Route path="/news" element={<NewsPage />} />
                <Route path="/calendar/economic" element={<EconomicCalendarPage />} />
                <Route path="/calendar/ipo" element={<IPOCalendarPage />} />
                <Route path="/community" element={<CommunityPage />} />
                <Route path="/alerts" element={<AlertsPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/portfolio" element={<PortfolioPage />} />
                <Route path="/paper-trading" element={<PaperTradingPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </MotionConfig>
    </QueryClientProvider>
  );
};

export default App;
