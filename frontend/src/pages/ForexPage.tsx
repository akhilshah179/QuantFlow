import React from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { AssetWorkstation, WorkstationItem } from '../components/market/AssetWorkstation';

// Shown only if /forex/overview returns nothing.
const FALLBACK: WorkstationItem[] = [
  { symbol: 'EURUSD', name: 'EUR / USD', price: 1.0854, change: 0.18 },
  { symbol: 'GBPUSD', name: 'GBP / USD', price: 1.2842, change: 0.32 },
  { symbol: 'USDJPY', name: 'USD / JPY', price: 147.25, change: -0.45 },
  { symbol: 'USDINR', name: 'USD / INR', price: 83.94, change: 0.05 },
  { symbol: 'AUDUSD', name: 'AUD / USD', price: 0.658, change: 0.22 },
];

export const ForexPage: React.FC = () => (
  <AssetWorkstation
    asset="forex"
    icon={ArrowLeftRight}
    eyebrow="Markets / Forex"
    title="Forex Currency Platform"
    subtitle="G10 & emerging market FX currency pairs, live exchange quotes"
    badge="Live FX stream"
    listTitle="Currency Pairs"
    defaultSymbol="EURUSD"
    fallbackItems={FALLBACK}
  />
);
