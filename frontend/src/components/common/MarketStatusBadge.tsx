import React from 'react';
import { MarketStatusType, DataQualityType } from '../../types/stock';

interface Props {
  status?: MarketStatusType;
  dataQuality?: DataQualityType;
  isMock?: boolean;
}

export const MarketStatusBadge: React.FC<Props> = ({ status = 'LIVE', isMock }) => {
  if (isMock) {
    return (
      <div className="inline-flex items-center space-x-1.5 bg-[#f5c900]/10 text-[#f5c900] border border-[#f5c900]/30 text-[11px] px-2.5 py-0.5 rounded font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-[#f5c900]" />
        <span className="font-bold tracking-wider">MOCK DATA</span>
      </div>
    );
  }

  switch (status) {
    case 'LIVE':
    case 'OPEN':
      return (
        <div className="inline-flex items-center space-x-1.5 bg-[#089981]/10 text-[#089981] border border-[#089981]/30 text-[11px] px-2.5 py-0.5 rounded font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#089981] animate-pulse" />
          <span className="font-bold tracking-wider">LIVE ●</span>
        </div>
      );
    case 'PRE-MARKET':
      return (
        <div className="inline-flex items-center space-x-1.5 bg-[#2962ff]/10 text-[#2962ff] border border-[#2962ff]/30 text-[11px] px-2.5 py-0.5 rounded font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2962ff]" />
          <span className="font-bold tracking-wider">PRE-MARKET</span>
        </div>
      );
    case 'AFTER-HOURS':
      return (
        <div className="inline-flex items-center space-x-1.5 bg-[#9c27b0]/10 text-[#9c27b0] border border-[#9c27b0]/30 text-[11px] px-2.5 py-0.5 rounded font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#9c27b0]" />
          <span className="font-bold tracking-wider">AFTER-HOURS</span>
        </div>
      );
    case 'DELAYED':
      return (
        <div className="inline-flex items-center space-x-1.5 bg-[#f5c900]/10 text-[#f5c900] border border-[#f5c900]/30 text-[11px] px-2.5 py-0.5 rounded font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f5c900]" />
          <span className="font-bold tracking-wider">DELAYED</span>
        </div>
      );
    case 'MARKET_CLOSED':
    case 'HOLIDAY':
      return (
        <div className="inline-flex items-center space-x-1.5 bg-[#787b86]/10 text-[#787b86] border border-[#787b86]/30 text-[11px] px-2.5 py-0.5 rounded font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#787b86]" />
          <span className="font-bold tracking-wider">MARKET CLOSED</span>
        </div>
      );
    case 'STALE':
      return (
        <div className="inline-flex items-center space-x-1.5 bg-[#ff9800]/10 text-[#ff9800] border border-[#ff9800]/30 text-[11px] px-2.5 py-0.5 rounded font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff9800]" />
          <span className="font-bold tracking-wider">STALE</span>
        </div>
      );
    case 'DISCONNECTED':
    default:
      return (
        <div className="inline-flex items-center space-x-1.5 bg-[#f23645]/10 text-[#f23645] border border-[#f23645]/30 text-[11px] px-2.5 py-0.5 rounded font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f23645]" />
          <span className="font-bold tracking-wider">DISCONNECTED</span>
        </div>
      );
  }
};
