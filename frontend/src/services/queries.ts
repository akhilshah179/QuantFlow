import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from './api';
import { Candle, MarketOverviewData, StockQuote, Timeframe } from '../types/stock';
import type { NewsArticle } from '../components/news/NewsSection';

/* ---------------------------------------------------------------------------
 * Response unwrapping — mirrors the defensive shapes the pages always handled.
 * ------------------------------------------------------------------------- */

const asList = <T,>(res: any): T[] => (Array.isArray(res) ? res : res?.data || []);
const asOverview = (res: any): MarketOverviewData | null => (res && res.indices ? res : res?.data || null);

export type AssetClass = 'stocks' | 'crypto' | 'forex' | 'futures';

const OVERVIEW_ENDPOINT: Record<AssetClass, string> = {
  stocks: '/stocks/market/overview',
  crypto: '/crypto/overview',
  forex: '/forex/overview',
  futures: '/futures/overview',
};

export const queryKeys = {
  overview: (asset: AssetClass) => ['overview', asset] as const,
  news: (symbol?: string) => ['news', symbol ?? 'market'] as const,
  quote: (symbol: string) => ['quote', symbol] as const,
  history: (symbol: string, timeframe: Timeframe) => ['history', symbol, timeframe] as const,
  screener: (params: string) => ['screener', params] as const,
  alerts: ['alerts'] as const,
  economic: ['calendar', 'economic'] as const,
  ipo: ['calendar', 'ipo'] as const,
  ideas: ['community', 'ideas'] as const,
};

/* ---------------------------------------------------------------------------
 * Market data
 * ------------------------------------------------------------------------- */

export function useMarketOverview(asset: AssetClass = 'stocks') {
  return useQuery({
    queryKey: queryKeys.overview(asset),
    queryFn: async () => asOverview(await api.get(OVERVIEW_ENDPOINT[asset])),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useNews(symbol?: string) {
  return useQuery({
    queryKey: queryKeys.news(symbol),
    queryFn: async () => asList<NewsArticle>(await api.get(symbol ? `/news/${encodeURIComponent(symbol)}` : '/news')),
    staleTime: 5 * 60_000,
  });
}

export function useStockQuote(symbol: string) {
  return useQuery({
    queryKey: queryKeys.quote(symbol),
    queryFn: async () => {
      const res: any = await api.get(`/stocks/${symbol}`);
      const quote: StockQuote | null = res?.price !== undefined ? res : res?.data || null;
      if (!quote) throw new Error(`Market quote for ${symbol} is unavailable from configured providers.`);
      return quote;
    },
    enabled: !!symbol,
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });
}

export interface HistoryPayload {
  candles: Candle[];
  indicators: any;
}

export function useStockHistory(symbol: string, timeframe: Timeframe) {
  return useQuery({
    queryKey: queryKeys.history(symbol, timeframe),
    queryFn: async (): Promise<HistoryPayload> => {
      const res: any = await api.get(`/stocks/${encodeURIComponent(symbol)}/history?timeframe=${timeframe}`);
      const historyObj = res?.candles ? res : res?.data || {};
      return { candles: historyObj?.candles || [], indicators: historyObj?.indicators || {} };
    },
    enabled: !!symbol,
    staleTime: 60_000,
    // Keep the previous series on screen while a new timeframe/symbol loads.
    placeholderData: keepPreviousData,
  });
}

export function useScreener(params: string) {
  return useQuery({
    queryKey: queryKeys.screener(params),
    queryFn: async () => asList<StockQuote>(await api.get(`/stocks/screener${params ? `?${params}` : ''}`)),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

/* ---------------------------------------------------------------------------
 * Alerts
 * ------------------------------------------------------------------------- */

export interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: 'ABOVE' | 'BELOW';
  isActive: boolean;
  createdAt?: string;
  triggeredAt?: string;
}

export function useAlerts() {
  return useQuery({
    queryKey: queryKeys.alerts,
    queryFn: async () => asList<PriceAlert>(await api.get('/alerts')),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useCreateAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { symbol: string; targetPrice: number; condition: 'ABOVE' | 'BELOW' }) => api.post('/alerts', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.alerts }),
  });
}

export function useDeleteAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/alerts/${id}`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.alerts });
      const previous = qc.getQueryData<PriceAlert[]>(queryKeys.alerts);
      qc.setQueryData<PriceAlert[]>(queryKeys.alerts, (old) => old?.filter((a) => a.id !== id));
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.alerts, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.alerts }),
  });
}

/* ---------------------------------------------------------------------------
 * Calendars & community
 * ------------------------------------------------------------------------- */

export function useEconomicCalendar() {
  return useQuery({
    queryKey: queryKeys.economic,
    queryFn: async () => asList<any>(await api.get('/calendar/economic')),
    staleTime: 5 * 60_000,
  });
}

export function useIpoCalendar() {
  return useQuery({
    queryKey: queryKeys.ipo,
    queryFn: async () => asList<any>(await api.get('/calendar/ipo')),
    staleTime: 5 * 60_000,
  });
}

export function useTradeIdeas() {
  return useQuery({
    queryKey: queryKeys.ideas,
    queryFn: async () => asList<any>(await api.get('/community/ideas')),
    staleTime: 30_000,
  });
}

export function useLikeIdea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/community/ideas/${id}/like`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.ideas });
      const previous = qc.getQueryData<any[]>(queryKeys.ideas);
      qc.setQueryData<any[]>(queryKeys.ideas, (old) =>
        old?.map((idea) => (idea.id === id ? { ...idea, likesCount: (idea.likesCount || 0) + 1 } : idea)),
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.ideas, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.ideas }),
  });
}

export function usePublishIdea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { symbol: string; title: string; description: string }) => api.post('/community/ideas', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.ideas }),
  });
}
