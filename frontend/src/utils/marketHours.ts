/**
 * Regular-session hours for the major venues, evaluated in each exchange's own
 * time zone. Exchange holidays are not modelled — the backend's per-quote
 * `marketStatus` remains the source of truth for individual instruments.
 */

export type SessionPhase = 'OPEN' | 'PRE' | 'POST' | 'CLOSED';

export interface ExchangeSession {
  id: string;
  label: string;
  city: string;
  timeZone: string;
  open: number; // minutes after local midnight
  close: number;
  pre?: number;
  post?: number;
}

export const SESSIONS: ExchangeSession[] = [
  { id: 'NYSE', label: 'NYSE', city: 'New York', timeZone: 'America/New_York', open: 570, close: 960, pre: 240, post: 1200 },
  { id: 'LSE', label: 'LSE', city: 'London', timeZone: 'Europe/London', open: 480, close: 990 },
  { id: 'NSE', label: 'NSE', city: 'Mumbai', timeZone: 'Asia/Kolkata', open: 555, close: 930 },
  { id: 'TSE', label: 'TSE', city: 'Tokyo', timeZone: 'Asia/Tokyo', open: 540, close: 930 },
];

const partsCache = new Map<string, Intl.DateTimeFormat>();

function zoned(date: Date, timeZone: string) {
  let fmt = partsCache.get(timeZone);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });
    partsCache.set(timeZone, fmt);
  }
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    weekday: parts.weekday as string,
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

export function sessionPhase(session: ExchangeSession, now: Date): SessionPhase {
  const { weekday, hour, minute } = zoned(now, session.timeZone);
  if (weekday === 'Sat' || weekday === 'Sun') return 'CLOSED';
  const mins = hour * 60 + minute;
  if (mins >= session.open && mins < session.close) return 'OPEN';
  if (session.pre !== undefined && mins >= session.pre && mins < session.open) return 'PRE';
  if (session.post !== undefined && mins >= session.close && mins < session.post) return 'POST';
  return 'CLOSED';
}

export function localTime(session: ExchangeSession, now: Date, withSeconds = false): string {
  const { hour, minute, second } = zoned(now, session.timeZone);
  const pad = (n: number) => String(n).padStart(2, '0');
  return withSeconds ? `${pad(hour)}:${pad(minute)}:${pad(second)}` : `${pad(hour)}:${pad(minute)}`;
}

/** Minutes until the next open/close boundary of the regular session (weekdays only). */
export function minutesToBoundary(session: ExchangeSession, now: Date): { label: 'opens' | 'closes'; minutes: number } | null {
  const { weekday, hour, minute } = zoned(now, session.timeZone);
  if (weekday === 'Sat' || weekday === 'Sun') return null;
  const mins = hour * 60 + minute;
  if (mins < session.open) return { label: 'opens', minutes: session.open - mins };
  if (mins < session.close) return { label: 'closes', minutes: session.close - mins };
  return null;
}

export const PHASE_LABEL: Record<SessionPhase, string> = {
  OPEN: 'Open',
  PRE: 'Pre-market',
  POST: 'After-hours',
  CLOSED: 'Closed',
};
