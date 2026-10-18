import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pause, Radio } from 'lucide-react';
import { LiveValue } from '../ui/LiveValue';
import { LiveDot, Skeleton } from '../ui/misc';
import { useReducedMotionPref } from '../../hooks/useReducedMotionPref';
import { formatPrice, formatSignedPercent } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import { routeForInstrument, StreamColumnData, StreamInstrument, useStreamData } from './useStreamData';

const ROW_HEIGHT = 30;

/* ---------------------------------------------------------------------------
 * Row
 * ------------------------------------------------------------------------- */

const StreamRow: React.FC<{ item: StreamInstrument; onSelect: (item: StreamInstrument) => void }> = memo(
  ({ item, onSelect }) => (
    <button
      type="button"
      tabIndex={-1}
      onClick={() => onSelect(item)}
      style={{ height: ROW_HEIGHT }}
      className="group/row flex w-full items-center justify-between gap-2 px-3 font-mono text-[11.5px] transition-colors duration-150 hover:bg-raised/90"
      title={item.name}
    >
      <span className="min-w-0 truncate font-semibold tracking-wide text-fg group-hover/row:text-accent">
        {item.symbol.replace('^', '')}
      </span>
      <span className="flex shrink-0 items-center gap-2.5">
        <LiveValue
          symbol={item.symbol}
          value={item.price}
          format={(v) => formatPrice(v, item.asset, item.currency)}
          className="text-fg-muted"
        />
        <LiveValue
          symbol={item.symbol}
          field="changePercent"
          value={item.changePercent}
          format={formatSignedPercent}
          signed
          className="w-[54px] text-right"
        />
      </span>
    </button>
  ),
);
StreamRow.displayName = 'StreamRow';

/* ---------------------------------------------------------------------------
 * Column — one continuously looping vertical stream
 * ------------------------------------------------------------------------- */

interface StreamColumnProps {
  column: StreamColumnData;
  /** Pixels per second. */
  speed: number;
  /** -1 scrolls upward, 1 scrolls downward. */
  direction: -1 | 1;
  height: number;
  onSelect: (item: StreamInstrument) => void;
  className?: string;
}

const StreamColumn: React.FC<StreamColumnProps> = memo(({ column, speed, direction, height, onSelect, className }) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const hoveredRef = useRef(false);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotionPref();

  const items = column.items;
  // Repeat the list so one copy is always taller than the viewport, then render two copies for a seamless wrap.
  const copyRepeat = Math.max(1, Math.ceil(height / Math.max(1, items.length * ROW_HEIGHT)));
  const copyHeight = items.length * ROW_HEIGHT * copyRepeat;
  const copy = useMemo(() => Array.from({ length: copyRepeat }, () => items).flat(), [items, copyRepeat]);

  useEffect(() => {
    const track = trackRef.current;
    const viewport = viewportRef.current;
    if (!track || !viewport || reduceMotion || copyHeight === 0) {
      if (track) track.style.transform = 'translate3d(0,0,0)';
      return;
    }

    let offset = direction === -1 ? 0 : -copyHeight / 2;
    let velocity = 1; // eased multiplier: 1 = full speed, 0 = paused
    let last = performance.now();
    let frame = 0;
    let visible = true;

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const target = hoveredRef.current ? 0 : 1;
      velocity += (target - velocity) * Math.min(1, dt * 7);
      offset += direction * speed * velocity * dt;
      // Wrap into (-copyHeight, 0] — the second copy makes the seam invisible.
      offset = ((offset % copyHeight) - copyHeight) % copyHeight;
      track.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
      frame = requestAnimationFrame(step);
    };

    const start = () => {
      if (frame) return;
      last = performance.now();
      frame = requestAnimationFrame(step);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    // Only animate while on screen.
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(viewport);
    if (visible) start();

    return () => {
      io.disconnect();
      stop();
    };
  }, [speed, direction, copyHeight, reduceMotion]);

  const setHover = (on: boolean) => {
    hoveredRef.current = on;
    setPaused(on);
  };

  return (
    <div
      className={cn('flex min-w-0 flex-col', className)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
    >
      <div className="flex items-center justify-between border-b border-line/70 px-3 py-1.5">
        <span className="font-mono text-3xs font-semibold uppercase tracking-[0.18em] text-fg-subtle">{column.label}</span>
        <span className="flex items-center gap-1 font-mono text-3xs text-fg-subtle">
          {paused && !reduceMotion ? (
            <>
              <Pause className="h-2.5 w-2.5 text-accent" />
              <span className="text-accent">HOLD</span>
            </>
          ) : (
            <span className="num">{items.length}</span>
          )}
        </span>
      </div>
      <div
        ref={viewportRef}
        style={{ height }}
        className={cn('relative', reduceMotion ? 'overflow-y-auto' : 'mask-fade-y overflow-hidden')}
      >
        <div ref={trackRef} className="will-change-transform">
          <div>
            {copy.map((item, i) => (
              <StreamRow key={`a-${i}-${item.symbol}`} item={item} onSelect={onSelect} />
            ))}
          </div>
          {!reduceMotion && (
            <div aria-hidden>
              {copy.map((item, i) => (
                <StreamRow key={`b-${i}-${item.symbol}`} item={item} onSelect={onSelect} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
StreamColumn.displayName = 'StreamColumn';

/* ---------------------------------------------------------------------------
 * Wall
 * ------------------------------------------------------------------------- */

// Slightly different speeds + alternating direction keep the wall from feeling mechanical.
const LANES: Array<{ speed: number; direction: -1 | 1 }> = [
  { speed: 19, direction: -1 },
  { speed: 14, direction: 1 },
  { speed: 23, direction: -1 },
  { speed: 16.5, direction: 1 },
];

interface MarketStreamWallProps {
  /** Minimum lane height in px; the wall grows to fill a taller parent. */
  height?: number;
  className?: string;
  /** Bare variant drops the chrome (used as a decorative backdrop on auth screens). */
  bare?: boolean;
}

const LANE_MIN_WIDTH = 190;
const LANE_HEADER = 29;

/** Measures the wall body so lane count follows its own width and lanes fill its height. */
function useWallSize(minHeight: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ lanes: 2, height: minHeight });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const lanes = Math.max(1, Math.min(LANES.length, Math.floor(width / LANE_MIN_WIDTH)));
      const laneHeight = Math.max(minHeight, Math.floor(height) - LANE_HEADER);
      setSize((prev) => (prev.lanes === lanes && prev.height === laneHeight ? prev : { lanes, height: laneHeight }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [minHeight]);
  return { ref, ...size };
}

export const MarketStreamWall: React.FC<MarketStreamWallProps> = ({ height = 300, className, bare }) => {
  const navigate = useNavigate();
  const { columns, isLoading } = useStreamData();
  const { ref, lanes, height: laneHeight } = useWallSize(height);
  const total = columns.reduce((n, c) => n + c.items.length, 0);
  const onSelect = useMemo(() => (item: StreamInstrument) => navigate(routeForInstrument(item)), [navigate]);
  const visible = columns.slice(0, lanes);

  const body = (
    // Content is absolutely positioned so it never drives the measured size.
    <div ref={ref} className="relative min-w-0 flex-1" style={{ minHeight: height + LANE_HEADER }}>
      {isLoading ? (
        <div className="absolute inset-0 grid gap-px" style={{ gridTemplateColumns: `repeat(${lanes}, minmax(0, 1fr))` }}>
          {Array.from({ length: lanes }).map((_, i) => (
            <div key={i} className="space-y-2 p-3">
              {Array.from({ length: 8 }).map((__, j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div
          className="absolute inset-0 grid divide-x divide-line/70"
          style={{ gridTemplateColumns: `repeat(${visible.length || 1}, minmax(0, 1fr))` }}
        >
          {visible.map((col, i) => (
            <StreamColumn
              key={col.id}
              column={col}
              speed={LANES[i % LANES.length].speed}
              direction={LANES[i % LANES.length].direction}
              height={laneHeight}
              onSelect={onSelect}
            />
          ))}
          {/* Reading line across the wall */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 border-y border-accent/[0.08] bg-accent/[0.025]"
            style={{ top: LANE_HEADER + laneHeight / 2 - ROW_HEIGHT / 2, height: ROW_HEIGHT }}
          />
        </div>
      )}
    </div>
  );

  if (bare) return <div className={cn('flex flex-col', className)}>{body}</div>;

  return (
    <section className={cn('qf-panel flex flex-col overflow-hidden', className)}>
      <header className="qf-panel-header">
        <div className="flex items-center gap-2">
          <Radio className="h-3.5 w-3.5 text-accent" />
          <h2 className="font-mono text-2xs font-semibold uppercase tracking-[0.14em] text-fg">Live Market Stream</h2>
          <LiveDot tone="up" />
        </div>
        <div className="flex items-center gap-3 font-mono text-3xs uppercase tracking-wider text-fg-subtle">
          <span className="hidden sm:inline">Hover a lane to hold</span>
          <span className="num rounded border border-line bg-raised px-1.5 py-0.5 text-fg-muted">{total} instruments</span>
        </div>
      </header>
      {body}
    </section>
  );
};
