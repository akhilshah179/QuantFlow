import { create } from 'zustand';
import { Watchlist } from '../types/watchlist';
import api from '../services/api';
import { wsClient } from '../websocket/wsClient';

interface WatchlistState {
  watchlists: Watchlist[];
  activeWatchlistId: string | null;
  isLoading: boolean;
  fetchWatchlists: () => Promise<void>;
  createWatchlist: (name: string) => Promise<void>;
  addStock: (watchlistId: string, symbol: string) => Promise<void>;
  removeStock: (watchlistId: string, symbol: string) => Promise<void>;
  setActiveWatchlist: (id: string) => void;
}

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  watchlists: [],
  activeWatchlistId: null,
  isLoading: false,

  fetchWatchlists: async () => {
    set({ isLoading: true });
    try {
      const res: any = await api.get('/watchlists');
      const watchlists: Watchlist[] = Array.isArray(res) ? res : (res?.data || []);
      set({
        watchlists,
        activeWatchlistId: watchlists.length > 0 ? watchlists[0].id : null,
        isLoading: false,
      });

      // Automatically subscribe WS to all symbols across user watchlists
      const allSymbols = watchlists.flatMap((w) => w.items.map((i) => i.symbol));
      if (allSymbols.length > 0) {
        allSymbols.forEach((s) => wsClient.subscribe(s));
      }
    } catch {
      set({ isLoading: false });
    }
  },

  createWatchlist: async (name: string) => {
    try {
      const res: any = await api.post('/watchlists', { name });
      const newWl: Watchlist = res?.id ? res : (res?.data || res);
      set((state) => ({
        watchlists: [...state.watchlists, newWl],
        activeWatchlistId: newWl.id,
      }));
    } catch (err: any) {
      throw new Error(err.message);
    }
  },

  addStock: async (watchlistId: string, symbol: string) => {
    try {
      await api.post(`/watchlists/${watchlistId}/stocks`, { symbol });
      wsClient.subscribe(symbol);
      await get().fetchWatchlists();
    } catch (err: any) {
      throw new Error(err.message);
    }
  },

  removeStock: async (watchlistId: string, symbol: string) => {
    try {
      await api.delete(`/watchlists/${watchlistId}/stocks/${symbol}`);
      await get().fetchWatchlists();
    } catch (err: any) {
      throw new Error(err.message);
    }
  },

  setActiveWatchlist: (id: string) => set({ activeWatchlistId: id }),
}));
