import React from 'react';
import { ConnectionStatus } from '../../types/ws';

interface Props {
  status: ConnectionStatus;
}

export const ConnectionStatusBadge: React.FC<Props> = ({ status }) => {
  if (status === 'CONNECTED') {
    return (
      <div className="flex items-center space-x-1.5 bg-[#089981]/10 text-[#089981] border border-[#089981]/30 text-xs px-2.5 py-1 rounded-full font-mono">
        <span className="w-2 h-2 rounded-full bg-[#089981] animate-pulse" />
        <span>Live</span>
      </div>
    );
  }

  if (status === 'RECONNECTING') {
    return (
      <div className="flex items-center space-x-1.5 bg-[#f5c900]/10 text-[#f5c900] border border-[#f5c900]/30 text-xs px-2.5 py-1 rounded-full font-mono">
        <span className="w-2 h-2 rounded-full bg-[#f5c900] animate-ping" />
        <span>Reconnecting...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1.5 bg-[#f23645]/10 text-[#f23645] border border-[#f23645]/30 text-xs px-2.5 py-1 rounded-full font-mono">
      <span className="w-2 h-2 rounded-full bg-[#f23645]" />
      <span>Offline</span>
    </div>
  );
};
