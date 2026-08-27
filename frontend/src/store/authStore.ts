import { create } from 'zustand';
import { User } from '../types/user';
import api from '../services/api';
import { usePortfolioStore } from './portfolioStore';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('quantflow_token'),
  isAuthenticated: !!localStorage.getItem('quantflow_token'),
  isLoading: true,

  login: (token: string, user: User) => {
    localStorage.setItem('quantflow_token', token);
    set({ token, user, isAuthenticated: true, isLoading: false });
    usePortfolioStore.getState().fetchPortfolio();
    usePortfolioStore.getState().fetchTransactions();
  },

  logout: () => {
    localStorage.removeItem('quantflow_token');
    usePortfolioStore.setState({ summary: null, transactions: [] });
    set({ token: null, user: null, isAuthenticated: false, isLoading: false });
  },

  fetchUser: async () => {
    const token = localStorage.getItem('quantflow_token');
    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const res: any = await api.get('/auth/me');
      const userData = res?.id ? res : (res?.data || res);
      set({ user: userData, isAuthenticated: true, isLoading: false });
      usePortfolioStore.getState().fetchPortfolio();
      usePortfolioStore.getState().fetchTransactions();
    } catch {
      localStorage.removeItem('quantflow_token');
      usePortfolioStore.setState({ summary: null, transactions: [] });
      set({ token: null, user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

