import { create } from 'zustand';
import { PortfolioSummary, Transaction } from '../types/portfolio';
import api from '../services/api';
import { useAuthStore } from './authStore';

interface PortfolioState {
  summary: PortfolioSummary | null;
  transactions: Transaction[];
  isLoading: boolean;
  isOrdering: boolean;
  error: string | null;
  fetchPortfolio: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  buyStock: (symbol: string, quantity: number) => Promise<any>;
  sellStock: (symbol: string, quantity: number) => Promise<any>;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  summary: null,
  transactions: [],
  isLoading: false,
  isOrdering: false,
  error: null,

  fetchPortfolio: async () => {
    set({ isLoading: true });
    try {
      const res: any = await api.get('/portfolio');
      const summaryObj = res?.cashBalance !== undefined ? res : (res?.data || res);
      set({ summary: summaryObj, isLoading: false, error: null });
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
    }
  },

  fetchTransactions: async () => {
    try {
      const res: any = await api.get('/transactions');
      const txs = Array.isArray(res) ? res : (res?.data || []);
      set({ transactions: txs });
    } catch {
      // Ignore
    }
  },

  buyStock: async (symbol: string, quantity: number) => {
    set({ isOrdering: true, error: null });
    try {
      const res: any = await api.post('/orders/buy', { symbol, quantity });
      await get().fetchPortfolio();
      await get().fetchTransactions();
      await useAuthStore.getState().fetchUser();
      set({ isOrdering: false });
      return res.data;
    } catch (err: any) {
      set({ isOrdering: false, error: err.message });
      throw err;
    }
  },

  sellStock: async (symbol: string, quantity: number) => {
    set({ isOrdering: true, error: null });
    try {
      const res: any = await api.post('/orders/sell', { symbol, quantity });
      await get().fetchPortfolio();
      await get().fetchTransactions();
      await useAuthStore.getState().fetchUser();
      set({ isOrdering: false });
      return res.data;
    } catch (err: any) {
      set({ isOrdering: false, error: err.message });
      throw err;
    }
  },
}));
