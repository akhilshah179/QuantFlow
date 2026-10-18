import React from 'react';
import { Layers } from 'lucide-react';
import { AssetWorkstation, WorkstationItem } from '../components/market/AssetWorkstation';

// Shown only if /futures/overview returns nothing.
const FALLBACK: WorkstationItem[] = [
  { symbol: 'GOLD', name: 'Gold Futures (USD/oz)', price: 2450.8, change: 0.85 },
  { symbol: 'SILVER', name: 'Silver Futures (USD/oz)', price: 28.45, change: 1.12 },
  { symbol: 'CRUDE OIL', name: 'Crude Oil WTI (USD/bbl)', price: 76.5, change: -0.42 },
  { symbol: 'NATURAL GAS', name: 'Natural Gas (USD/MMBtu)', price: 2.15, change: 2.3 },
  { symbol: 'COPPER', name: 'Copper Futures (USD/lb)', price: 4.12, change: 0.65 },
];

export const FuturesPage: React.FC = () => (
  <AssetWorkstation
    asset="futures"
    icon={Layers}
    eyebrow="Markets / Futures"
    title="Futures & Commodities Platform"
    subtitle="Precious metals, energy & industrial commodities futures feed"
    badge="Commodity futures"
    listTitle="Commodities & Futures"
    defaultSymbol="GOLD"
    fallbackItems={FALLBACK}
  />
);
