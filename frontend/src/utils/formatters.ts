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
