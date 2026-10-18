import React, { useEffect, useRef } from 'react';
import { Activity } from 'lucide-react';
import { getTicksReceived, useConnectionStatus } from '../../store/marketStore';
import { useNow } from '../../hooks/useNow';
import { localTime, sessionPhase, SESSIONS } from '../../utils/marketHours';
import { LiveDot } from '../ui/misc';
import { cn } from '../../utils/cn';

const FeedStatus: React.FC = () => {
  const status = useConnectionStatus();
  const tone = status === 'CONNECTED' ? 'up' : status === 'RECONNECTING' ? 'accent' : 'down';
  const label = status === 'CONNECTED' ? 'FEED LIVE' : status === 'RECONNECTING' ? 'RECONNECTING' : 'FEED OFFLINE';
  return (
    <span className="flex items-center gap-1.5">
      <LiveDot tone={tone} pulse={status !== 'DISCONNECTED'} />
      <span className={cn(status === 'CONNECTED' ? 'text-up' : status === 'RECONNECTING' ? 'text-accent' : 'text-down')}>{label}</span>
    </span>
  );
};

/** Ticks/second, sampled once per second without re-rendering anything else. */
const TickRate: React.FC = () => {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let last = getTicksReceived();
    const id = setInterval(() => {
      const now = getTicksReceived();
      if (ref.current) ref.current.textContent = String(now - last);
      last = now;
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="hidden items-center gap-1 sm:flex" title="WebSocket ticks per second">
      <Activity className="h-3 w-3 text-fg-subtle" />
      <span ref={ref} className="num text-fg-muted">
        0
      </span>
      <span>t/s</span>
    </span>
  );
};

const Clocks: React.FC = () => {
  const now = useNow(1000);
  return (
    <>
      {SESSIONS.map((s) => {
        const phase = sessionPhase(s, now);
        return (
          <span key={s.id} className="hidden items-center gap-1.5 md:flex" title={`${s.city} · ${phase}`}>
            <span className={cn('h-1 w-1 rounded-full', phase === 'OPEN' ? 'bg-up' : phase === 'CLOSED' ? 'bg-fg-subtle/60' : 'bg-accent')} />
            <span>{s.label}</span>
            <span className="num text-fg-muted">{localTime(s, now)}</span>
          </span>
        );
      })}
      <span className="num text-fg">{now.toLocaleTimeString([], { hour12: false })}</span>
    </>
  );
};

export const StatusBar: React.FC = () => (
  <footer className="relative z-30 flex h-7 shrink-0 items-center justify-between gap-4 border-t border-line bg-bg/90 px-3 font-mono text-3xs uppercase tracking-wider text-fg-subtle sm:px-4">
    <div className="flex items-center gap-4">
      <FeedStatus />
      <TickRate />
      <span className="hidden lg:inline">QuantFlow Terminal</span>
    </div>
    <div className="flex items-center gap-4">
      <Clocks />
    </div>
  </footer>
);
