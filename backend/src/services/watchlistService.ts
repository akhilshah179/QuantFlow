import prisma from '../database/client';
import { marketDataProvider } from '../providers/MockMarketDataProvider';
import { marketIngestionService } from './marketIngestionService';
import { memoryWatchlists } from './authService';

export class WatchlistService {
  public async getUserWatchlists(userId: string) {
    try {
      const watchlists = await prisma.watchlist.findMany({
        where: { userId },
        include: {
          items: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      if (watchlists && watchlists.length > 0) {
        const watchlistsWithQuotes = await Promise.all(
          watchlists.map(async (wl) => {
            const itemsWithQuotes = await Promise.all(
              wl.items.map(async (item) => {
                const quote = await marketIngestionService.getLatestQuote(item.symbol);
                return {
                  ...item,
                  price: quote ? quote.price : 0,
                  change: quote ? quote.change : 0,
                  changePercent: quote ? quote.changePercent : 0,
                  name: quote ? quote.name : item.symbol,
                };
              })
            );
            return {
              ...wl,
              items: itemsWithQuotes,
            };
          })
        );
        return watchlistsWithQuotes;
      }
    } catch {
      // Fall through to memory
    }

    // In-memory fallback
    let memLists = memoryWatchlists.get(userId);
    if (!memLists) {
      memLists = [
        {
          id: 'wl_default_' + userId,
          userId,
          name: 'Main Tech Watchlist',
          isDefault: true,
          items: [
            { id: '1', symbol: 'AAPL', name: 'Apple Inc.' },
            { id: '2', symbol: 'TSLA', name: 'Tesla, Inc.' },
            { id: '3', symbol: 'NVDA', name: 'NVIDIA Corp.' },
            { id: '4', symbol: 'MSFT', name: 'Microsoft Corp.' },
          ],
        },
      ];
      memoryWatchlists.set(userId, memLists);
    }

    return Promise.all(
      memLists.map(async (wl) => {
        const itemsWithQuotes = await Promise.all(
          wl.items.map(async (item: any) => {
            const quote = await marketIngestionService.getLatestQuote(item.symbol);
            return {
              ...item,
              price: quote ? quote.price : 0,
              change: quote ? quote.change : 0,
              changePercent: quote ? quote.changePercent : 0,
              name: quote ? quote.name : item.symbol,
            };
          })
        );
        return {
          ...wl,
          items: itemsWithQuotes,
        };
      })
    );
  }

  public async createWatchlist(userId: string, name: string) {
    try {
      return await prisma.watchlist.create({
        data: {
          userId,
          name,
        },
        include: { items: true },
      });
    } catch {
      // Memory fallback
      let memLists = memoryWatchlists.get(userId) || [];
      const newWl = {
        id: 'wl_' + Math.random().toString(36).substring(2, 9),
        userId,
        name,
        isDefault: false,
        items: [],
      };
      memLists.push(newWl);
      memoryWatchlists.set(userId, memLists);
      return newWl;
    }
  }

  public async addStockToWatchlist(userId: string, watchlistId: string, symbol: string) {
    const upperSymbol = symbol.toUpperCase();

    try {
      const watchlist = await prisma.watchlist.findFirst({
        where: { id: watchlistId, userId },
      });
      if (watchlist) {
        const existing = await prisma.watchlistItem.findFirst({
          where: { watchlistId, symbol: upperSymbol },
        });

        if (existing) return existing;

        return await prisma.watchlistItem.create({
          data: {
            watchlistId,
            symbol: upperSymbol,
          },
        });
      }
    } catch {
      // Memory fallback
    }

    let memLists = memoryWatchlists.get(userId) || [];
    const targetWl = memLists.find((w) => w.id === watchlistId) || memLists[0];
    if (targetWl) {
      if (!targetWl.items.some((i: any) => i.symbol === upperSymbol)) {
        const item = { id: 'item_' + Date.now(), symbol: upperSymbol, name: upperSymbol };
        targetWl.items.push(item);
      }
      return targetWl;
    }
    return { symbol: upperSymbol };
  }

  public async removeStockFromWatchlist(userId: string, watchlistId: string, symbol: string) {
    const upperSymbol = symbol.toUpperCase();

    try {
      await prisma.watchlistItem.deleteMany({
        where: {
          watchlistId,
          symbol: upperSymbol,
        },
      });
      return { success: true };
    } catch {
      // Memory fallback
    }

    let memLists = memoryWatchlists.get(userId) || [];
    const targetWl = memLists.find((w) => w.id === watchlistId);
    if (targetWl) {
      targetWl.items = targetWl.items.filter((i: any) => i.symbol !== upperSymbol);
    }
    return { success: true };
  }
}

export const watchlistService = new WatchlistService();
