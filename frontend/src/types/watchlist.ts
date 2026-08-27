export interface WatchlistItem {
  id: string;
  watchlistId: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  addedAt: string;
}

export interface Watchlist {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  items: WatchlistItem[];
  createdAt: string;
}
