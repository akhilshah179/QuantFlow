import { create } from 'zustand';
import { WSTickUpdate, ConnectionStatus } from '../types/ws';
import { wsClient } from '../websocket/wsClient';

interface MarketState {
  quotes: Record<string, WSTickUpdate>;
  connectionStatus: ConnectionStatus;
  updateTick: (tick: WSTickUpdate) => void;
  updateTicks: (ticks: WSTickUpdate[]) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  subscribeSymbols: (symbols: string | string[]) => void;
}

/** Merge a tick over the previous quote so partial payloads never blank a field. */
function mergeTick(prev: WSTickUpdate | undefined, tick: WSTickUpdate): WSTickUpdate {
  if (!prev) return tick;
  return {
    ...prev,
    ...tick,
    change: tick.change ?? prev.change,
    changePercent: tick.changePercent ?? prev.changePercent,
    volume: tick.volume ?? prev.volume,
  };
}

export const useMarketStore = create<MarketState>((set) => ({
  quotes: {},
  connectionStatus: 'DISCONNECTED',

  updateTick: (tick: WSTickUpdate) => {
    set((state) => ({
      quotes: {
        ...state.quotes,
        [tick.symbol]: mergeTick(state.quotes[tick.symbol], tick),
      },
    }));
  },

  updateTicks: (ticks: WSTickUpdate[]) => {
    if (ticks.length === 0) return;
    set((state) => {
      const quotes = { ...state.quotes };
      for (const tick of ticks) {
        quotes[tick.symbol] = mergeTick(quotes[tick.symbol], tick);
      }
      return { quotes };
    });
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

/* ---------------------------------------------------------------------------
 * Fine-grained selectors — components subscribe to one symbol, not the map.
 * ------------------------------------------------------------------------- */

export function useQuote(symbol: string | undefined): WSTickUpdate | undefined {
  return useMarketStore((state) => (symbol ? state.quotes[symbol.toUpperCase()] : undefined));
}

export function useConnectionStatus(): ConnectionStatus {
  return useMarketStore((state) => state.connectionStatus);
}

/* ---------------------------------------------------------------------------
 * Tick ingestion — coalesce bursts into one store write per animation frame.
 * ------------------------------------------------------------------------- */

const pendingTicks = new Map<string, WSTickUpdate>();
let flushHandle: number | null = null;
let ticksReceived = 0;

function flushTicks() {
  flushHandle = null;
  if (pendingTicks.size === 0) return;
  const batch = Array.from(pendingTicks.values());
  pendingTicks.clear();
  useMarketStore.getState().updateTicks(batch);
}

function scheduleFlush() {
  if (flushHandle !== null) return;
  // rAF pauses in background tabs; fall back to a timer so quotes stay fresh.
  flushHandle =
    typeof document !== 'undefined' && document.visibilityState === 'visible'
      ? requestAnimationFrame(flushTicks)
      : (setTimeout(flushTicks, 250) as unknown as number);
}

/** Total ticks received since load — read by the status bar for a tick-rate meter. */
export function getTicksReceived(): number {
  return ticksReceived;
}

// Bind WebSocket listeners once
wsClient.onTick((tick) => {
  ticksReceived++;
  const symbol = tick.symbol?.toUpperCase();
  if (!symbol) return;
  pendingTicks.set(symbol, mergeTick(pendingTicks.get(symbol), { ...tick, symbol }));
  scheduleFlush();
});

wsClient.onStatusChange((status) => {
  useMarketStore.getState().setConnectionStatus(status);
});
