import React, { memo, useEffect, useLayoutEffect, useRef } from 'react';
import { useMarketStore } from '../../store/marketStore';
import { WSTickUpdate } from '../../types/ws';
import { cn } from '../../utils/cn';

type LiveField = 'price' | 'change' | 'changePercent' | 'volume';

interface LiveValueProps {
  /** Symbol whose WebSocket ticks drive this value. */
  symbol: string;
  field?: LiveField;
  /** REST/snapshot value shown until the first tick arrives. */
  value: number | undefined;
  format: (value: number) => string;
  /** Colour the text by sign (for change / P&L fields). */
  signed?: boolean;
  /** Render as a sign-tinted pill. Implies `signed`. */
  pill?: boolean;
  /** Flash a highlight when the value ticks. Defaults to true for price. */
  flash?: boolean;
  className?: string;
}

const SIGN_CLASSES = {
  up: ['text-up'],
  down: ['text-down'],
  flat: ['text-fg-muted'],
  pillUp: ['bg-up/10', 'ring-up/20'],
  pillDown: ['bg-down/10', 'ring-down/20'],
  pillFlat: ['bg-raised', 'ring-line'],
};

const FLASH_UP = 'rgb(var(--qf-up) / 0.22)';
const FLASH_DOWN = 'rgb(var(--qf-down) / 0.22)';

function readLive(symbol: string, field: LiveField): number | undefined {
  const quote: WSTickUpdate | undefined = useMarketStore.getState().quotes[symbol.toUpperCase()];
  const v = quote?.[field];
  return typeof v === 'number' && !isNaN(v) ? v : undefined;
}

/**
 * A number bound to the live tick stream. Updates are applied imperatively so a
 * tick repaints only this span — the surrounding table/card never re-renders.
 */
export const LiveValue: React.FC<LiveValueProps> = memo(
  ({ symbol, field = 'price', value, format, signed, pill, flash, className }) => {
    const rootRef = useRef<HTMLSpanElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    const flashRef = useRef<HTMLSpanElement>(null);
    const lastRef = useRef<number | undefined>(undefined);
    const tintTimer = useRef<ReturnType<typeof setTimeout>>();
    const formatRef = useRef(format);
    formatRef.current = format;

    const isSigned = signed || pill;
    const shouldFlash = flash ?? field === 'price';

    const applySign = (v: number) => {
      const root = rootRef.current;
      if (!root || !isSigned) return;
      const dir = v > 0 ? 'up' : v < 0 ? 'down' : 'flat';
      root.classList.remove(...SIGN_CLASSES.up, ...SIGN_CLASSES.down, ...SIGN_CLASSES.flat);
      root.classList.add(...SIGN_CLASSES[dir]);
      if (pill) {
        root.classList.remove(...SIGN_CLASSES.pillUp, ...SIGN_CLASSES.pillDown, ...SIGN_CLASSES.pillFlat);
        root.classList.add(...SIGN_CLASSES[dir === 'up' ? 'pillUp' : dir === 'down' ? 'pillDown' : 'pillFlat']);
      }
    };

    // Render the snapshot (or the latest tick, if one already arrived).
    useLayoutEffect(() => {
      const current = readLive(symbol, field) ?? value;
      if (!textRef.current) return;
      if (current === undefined) {
        textRef.current.textContent = '—';
        return;
      }
      textRef.current.textContent = formatRef.current(current);
      lastRef.current = current;
      applySign(current);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [symbol, field, value, isSigned, pill]);

    useEffect(() => {
      const upper = symbol.toUpperCase();
      const unsubscribe = useMarketStore.subscribe((state, prev) => {
        const quote = state.quotes[upper];
        if (!quote || quote === prev.quotes[upper]) return;
        const next = quote[field];
        if (typeof next !== 'number' || isNaN(next)) return;
        const last = lastRef.current;
        lastRef.current = next;
        if (textRef.current) textRef.current.textContent = formatRef.current(next);
        applySign(next);
        if (last === undefined || next === last) return;

        const up = next > last;
        if (shouldFlash && flashRef.current) {
          flashRef.current.style.background = up ? FLASH_UP : FLASH_DOWN;
          flashRef.current.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 900, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' });
        }
        if (!isSigned && rootRef.current) {
          const root = rootRef.current;
          root.classList.remove('is-tick-up', 'is-tick-down');
          root.classList.add(up ? 'is-tick-up' : 'is-tick-down');
          clearTimeout(tintTimer.current);
          tintTimer.current = setTimeout(() => root.classList.remove('is-tick-up', 'is-tick-down'), 650);
        }
      });
      return () => {
        unsubscribe();
        clearTimeout(tintTimer.current);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [symbol, field, shouldFlash, isSigned, pill]);

    return (
      <span
        ref={rootRef}
        className={cn('qf-live num', pill && 'rounded px-1.5 py-0.5 ring-1 ring-inset', className)}
      >
        <span ref={flashRef} className="qf-flash" aria-hidden />
        <span ref={textRef} className="relative" />
      </span>
    );
  },
);
LiveValue.displayName = 'LiveValue';
