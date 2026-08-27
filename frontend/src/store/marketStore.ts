import { create } from 'zustand';
import { WSTickUpdate, ConnectionStatus } from '../types/ws';
import { wsClient } from '../websocket/wsClient';

interface MarketState {
  quotes: Record<string, WSTickUpdate>;
  connectionStatus: ConnectionStatus;
  updateTick: (tick: WSTickUpdate) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  subscribeSymbols: (symbols: string | string[]) => void;
}

export const useMarketStore = create<MarketState>((set) => ({
  quotes: {},
  connectionStatus: 'DISCONNECTED',

  updateTick: (tick: WSTickUpdate) => {
    set((state) => ({
      quotes: {
        ...state.quotes,
        [tick.symbol]: tick,
      },
    }));
  },

  setConnectionStatus: (status: ConnectionStatus) => {
    set({ connectionStatus: status });
  },

  subscribeSymbols: (symbols: string | string[]) => {
    if (Array.isArray(symbols)) {
      symbols.forEach((s) => wsClient.subscribe(s));
    } else {
      wsClient.subscribe(symbols);
    }
  },
}));

// Bind WebSocket listeners once
wsClient.onTick((tick) => {
  useMarketStore.getState().updateTick(tick);
});

wsClient.onStatusChange((status) => {
  useMarketStore.getState().setConnectionStatus(status);
});
