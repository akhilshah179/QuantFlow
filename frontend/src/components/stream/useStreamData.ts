import { useEffect, useMemo } from 'react';
import { useMarketOverview } from '../../services/queries';
import { MarketOverviewData } from '../../types/stock';
import { AssetKind } from '../../utils/formatters';
import { wsClient } from '../../websocket/wsClient';

export interface StreamInstrument {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  currency?: string;
  asset: AssetKind;
}

export interface StreamColumnData {
  id: string;
  label: string;
  asset: AssetKind;
  items: StreamInstrument[];
}

function collect(data: MarketOverviewData | null | undefined, asset: AssetKind, includeIndices = false): StreamInstrument[] {
  if (!data) return [];
  const seen = new Set<string>();
  const out: StreamInstrument[] = [];
  const push = (item: StreamInstrument) => {
    if (!item.symbol || seen.has(item.symbol) || !isFinite(item.price)) return;
    seen.add(item.symbol);
    out.push(item);
  };
  if (includeIndices) {
    data.indices?.forEach((i) =>
      push({ symbol: i.symbol, name: i.name, price: i.value, changePercent: i.changePercent, asset: asset === 'stock' ? 'index' : asset }),
    );
  }
  [...(data.topGainers || []), ...(data.mostActive || []), ...(data.topLosers || [])].forEach((q) =>
    push({ symbol: q.symbol, name: q.name, price: q.price, changePercent: q.changePercent, currency: q.currency, asset }),
  );
  return out;
}

// Symbols this session has already asked the gateway to stream.
const requested = new Set<string>();

export function subscribeOnce(symbols: string[]) {
  symbols.forEach((s) => {
    const upper = s.toUpperCase();
    if (requested.has(upper)) return;
    requested.add(upper);
    wsClient.subscribe(upper);
  });
}

/** Builds the stream-wall columns from the four overview endpoints (shared, cached queries). */
export function useStreamData() {
  const stocks = useMarketOverview('stocks');
  const crypto = useMarketOverview('crypto');
  const forex = useMarketOverview('forex');
  const futures = useMarketOverview('futures');

  const columns = useMemo<StreamColumnData[]>(() => {
    const indices: StreamInstrument[] = (stocks.data?.indices || []).map((i) => ({
      symbol: i.symbol,
      name: i.name,
      price: i.value,
      changePercent: i.changePercent,
      asset: 'index',
    }));
    return [
      { id: 'equities', label: 'Equities', asset: 'stock' as AssetKind, items: collect(stocks.data, 'stock') },
      { id: 'crypto', label: 'Crypto', asset: 'crypto' as AssetKind, items: collect(crypto.data, 'crypto', true) },
      { id: 'forex', label: 'FX', asset: 'forex' as AssetKind, items: collect(forex.data, 'forex', true) },
      {
        id: 'macro',
        label: 'Indices · Futures',
        asset: 'futures' as AssetKind,
        items: [...indices, ...collect(futures.data, 'futures', true)],
      },
    ].filter((c) => c.items.length > 0);
  }, [stocks.data, crypto.data, forex.data, futures.data]);

  // Stream equities over the socket. Crypto/FX/futures quotes come from their own
  // overview endpoints (refetched every minute) — the tick gateway serves equities.
  useEffect(() => {
    subscribeOnce(columns.flatMap((c) => c.items.filter((i) => i.asset === 'stock').map((i) => i.symbol)));
  }, [columns]);

  const isLoading = stocks.isLoading && crypto.isLoading && forex.isLoading && futures.isLoading;
  return { columns, isLoading };
}

export function routeForInstrument(item: Pick<StreamInstrument, 'symbol' | 'asset'>): string {
  switch (item.asset) {
    case 'crypto':
      return `/crypto?symbol=${encodeURIComponent(item.symbol)}`;
    case 'forex':
      return `/forex?symbol=${encodeURIComponent(item.symbol)}`;
    case 'futures':
      return `/futures?symbol=${encodeURIComponent(item.symbol)}`;
    case 'index':
      return '/markets';
    default:
      return `/stocks/${encodeURIComponent(item.symbol)}`;
  }
}
