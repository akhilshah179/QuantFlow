import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useAuthStore } from '../store/authStore';
import { useWatchlistStore } from '../store/watchlistStore';
import { wsClient } from '../websocket/wsClient';
import { GlobalSearchModal } from '../components/common/GlobalSearchModal';
import { RightWatchlistPanel } from '../components/common/RightWatchlistPanel';
import { Sidebar } from '../components/layout/Sidebar';
import { TopBar } from '../components/layout/TopBar';
import { StatusBar } from '../components/layout/StatusBar';
import { TerminalBackdrop } from '../components/fx/TerminalBackdrop';
import { Toaster } from '../components/ui/Toaster';

interface Props {
  children: React.ReactNode;
}

const NAV_KEY = 'quantflow_nav_collapsed';

const readCollapsed = () => {
  try {
    return localStorage.getItem(NAV_KEY) === '1';
  } catch {
    return false;
  }
};

const isWide = () => typeof window !== 'undefined' && window.innerWidth >= 1280;

export const TerminalLayout: React.FC<Props> = ({ children }) => {
  const [collapsedNav, setCollapsedNav] = useState(readCollapsed);
  const [rightPanelOpen, setRightPanelOpen] = useState(isWide);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const fetchWatchlists = useWatchlistStore((s) => s.fetchWatchlists);
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  // Open the market feed for the lifetime of the terminal.
  useEffect(() => {
    wsClient.connect();
  }, []);

  // Watchlists feed the side panel and pre-subscribe their symbols to the stream.
  useEffect(() => {
    if (user) fetchWatchlists();
  }, [user?.id, fetchWatchlists]);

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

  // Fresh scroll position per page.
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [location.pathname]);

  const toggleCollapsed = useCallback(() => {
    setCollapsedNav((c) => {
      try {
        localStorage.setItem(NAV_KEY, c ? '0' : '1');
      } catch {
        // Storage unavailable — keep in-memory state only.
      }
      return !c;
    });
  }, []);

  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden bg-bg font-sans text-fg">
      <TerminalBackdrop />

      <TopBar
        onOpenSearch={() => setSearchOpen(true)}
        onOpenNav={() => setMobileNavOpen(true)}
        rightPanelOpen={rightPanelOpen}
        onToggleRightPanel={() => setRightPanelOpen((o) => !o)}
      />

      <div className="relative z-10 flex min-h-0 flex-1">
        <Sidebar
          collapsed={collapsedNav}
          onToggleCollapsed={toggleCollapsed}
          mobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
        />

        <main ref={mainRef} className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
          <motion.div
            // Keyed by section so /stocks/AAPL → /stocks/TSLA updates the chart in place.
            key={`/${location.pathname.split('/')[1]}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            className="mx-auto w-full max-w-[1920px] p-3 pb-8 sm:p-4 lg:p-5"
          >
            {children}
          </motion.div>
        </main>

        {/* Inline panel on wide screens */}
        <div className="hidden xl:flex">
          <RightWatchlistPanel isOpen={rightPanelOpen} onClose={() => setRightPanelOpen(false)} />
        </div>

        {/* Overlay panel below xl */}
        <AnimatePresence>
          {rightPanelOpen && (
            <motion.div
              key="wl-overlay"
              className="fixed inset-y-0 right-0 z-50 flex pt-12 xl:hidden"
              initial={{ x: 300 }}
              animate={{ x: 0 }}
              exit={{ x: 300 }}
              transition={{ type: 'spring', stiffness: 420, damping: 40 }}
            >
              <RightWatchlistPanel isOpen onClose={() => setRightPanelOpen(false)} className="shadow-pop" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <StatusBar />

      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <Toaster />
    </div>
  );
};
