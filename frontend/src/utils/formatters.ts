export function formatCurrency(value: number, currency: string = 'USD', decimals: number = 2): string {
  if (value === undefined || value === null || isNaN(value)) {
    const symbol = currency === 'INR' ? '₹' : '$';
    return `${symbol}0.00`;
  }
  const currUpper = (currency || 'USD').toUpperCase();
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currUpper,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  } catch {
    return `${currUpper === 'INR' ? '₹' : '$'}${value.toFixed(decimals)}`;
  }
}

export function formatPercent(value: number, includeSign: boolean = true): string {
  if (value === undefined || value === null || isNaN(value)) return '0.00%';
  const sign = includeSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatNumber(value: number): string {
  if (!value) return '0';
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toLocaleString();
}

export function formatTime(timestamp: number): string {
  const d = new Date(timestamp * (timestamp < 1e11 ? 1000 : 1));
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export type AssetKind = 'stock' | 'crypto' | 'forex' | 'futures' | 'index';

/** Precision that suits the instrument: FX quotes need pips, sub-dollar crypto needs more digits. */
export function priceDecimals(value: number, asset: AssetKind = 'stock'): number {
  const abs = Math.abs(value || 0);
  if (asset === 'forex') return abs >= 20 ? 3 : 4;
  if (abs > 0 && abs < 1) return 4;
  if (asset === 'crypto' && abs < 10) return 3;
  return 2;
}

export function formatPrice(value: number, asset: AssetKind = 'stock', currency?: string): string {
  if (value === undefined || value === null || isNaN(value)) return '—';
  const decimals = priceDecimals(value, asset);
  const body = value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  if (asset === 'forex' || asset === 'index') return body;
  return `${currency === 'INR' ? '₹' : '$'}${body}`;
}

export function formatSigned(value: number, decimals: number = 2): string {
  if (value === undefined || value === null || isNaN(value)) return '0.00';
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

export function formatSignedPercent(value: number): string {
  if (value === undefined || value === null || isNaN(value)) return '0.00%';
  return `${formatSigned(value, 2)}%`;
}

export function formatSignedCurrency(value: number, currency: string = 'USD'): string {
  if (value === undefined || value === null || isNaN(value)) return formatCurrency(0, currency);
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}${formatCurrency(Math.abs(value), currency)}`;
}
