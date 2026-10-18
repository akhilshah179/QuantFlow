import React from 'react';
import { Bitcoin } from 'lucide-react';
import { AssetWorkstation, WorkstationItem } from '../components/market/AssetWorkstation';

// Shown only if /crypto/overview returns nothing.
const FALLBACK: WorkstationItem[] = [
  { symbol: 'BTCUSD', name: 'Bitcoin', price: 64200.5, change: 2.45 },
  { symbol: 'ETHUSD', name: 'Ethereum', price: 3450.2, change: 1.85 },
  { symbol: 'SOLUSD', name: 'Solana', price: 148.75, change: 4.12 },
  { symbol: 'BNBUSD', name: 'Binance Coin', price: 575.4, change: -0.65 },
  { symbol: 'XRPUSD', name: 'XRP', price: 0.58, change: 1.15 },
];

export const CryptoPage: React.FC = () => (
  <AssetWorkstation
    asset="crypto"
    icon={Bitcoin}
    eyebrow="Markets / Crypto"
    title="Crypto Market Workstation"
    subtitle="Spot digital assets, order flow and technical candlestick analysis"
    badge="Crypto spot"
    listTitle="Major Crypto Coins"
    defaultSymbol="BTCUSD"
    fallbackItems={FALLBACK}
  />
);
