import React from 'react';
import { MarketStatusType, DataQualityType } from '../../types/stock';
import { cn } from '../../utils/cn';

interface Props {
  status?: MarketStatusType;
  dataQuality?: DataQualityType;
  isMock?: boolean;
}

type Tone = 'up' | 'down' | 'accent' | 'info' | 'muted';

const TONES: Record<Tone, { wrap: string; dot: string }> = {
  up: { wrap: 'bg-up/10 text-up ring-up/25', dot: 'bg-up' },
  down: { wrap: 'bg-down/10 text-down ring-down/25', dot: 'bg-down' },
  accent: { wrap: 'bg-accent/10 text-accent ring-accent/25', dot: 'bg-accent' },
  info: { wrap: 'bg-info/10 text-info ring-info/25', dot: 'bg-info' },
  muted: { wrap: 'bg-raised text-fg-muted ring-line', dot: 'bg-fg-subtle' },
};

const Badge: React.FC<{ tone: Tone; label: string; pulse?: boolean }> = ({ tone, label, pulse }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 whitespace-nowrap rounded px-1.5 py-0.5 font-mono text-3xs font-bold uppercase tracking-wider ring-1 ring-inset',
      TONES[tone].wrap,
    )}
  >
    <span className="relative flex h-1.5 w-1.5">
      {pulse && <span className={cn('absolute inset-0 rounded-full animate-live-ping', TONES[tone].dot)} />}
      <span className={cn('relative h-1.5 w-1.5 rounded-full', TONES[tone].dot)} />
    </span>
    {label}
  </span>
);

export const MarketStatusBadge: React.FC<Props> = ({ status = 'LIVE', isMock }) => {
  if (isMock) return <Badge tone="accent" label="Mock data" />;

  switch (status) {
    case 'LIVE':
    case 'OPEN':
      return <Badge tone="up" label="Live" pulse />;
    case 'PRE-MARKET':
      return <Badge tone="info" label="Pre-market" />;
    case 'AFTER-HOURS':
      return <Badge tone="info" label="After-hours" />;
    case 'DELAYED':
      return <Badge tone="accent" label="Delayed" />;
    case 'MARKET_CLOSED':
    case 'HOLIDAY':
      return <Badge tone="muted" label="Market closed" />;
    case 'STALE':
      return <Badge tone="accent" label="Stale" />;
    case 'DISCONNECTED':
    default:
      return <Badge tone="down" label="Disconnected" />;
  }
};
