import React from 'react';
import { ConnectionStatus } from '../../types/ws';
import { LiveDot } from '../ui/misc';
import { cn } from '../../utils/cn';

interface Props {
  status: ConnectionStatus;
}

export const ConnectionStatusBadge: React.FC<Props> = ({ status }) => {
  const tone = status === 'CONNECTED' ? 'up' : status === 'RECONNECTING' ? 'accent' : 'down';
  const label = status === 'CONNECTED' ? 'Live' : status === 'RECONNECTING' ? 'Reconnecting…' : 'Offline';
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-xs ring-1 ring-inset',
        tone === 'up' && 'bg-up/10 text-up ring-up/30',
        tone === 'accent' && 'bg-accent/10 text-accent ring-accent/30',
        tone === 'down' && 'bg-down/10 text-down ring-down/30',
      )}
    >
      <LiveDot tone={tone} pulse={status !== 'DISCONNECTED'} />
      <span>{label}</span>
    </div>
  );
};
