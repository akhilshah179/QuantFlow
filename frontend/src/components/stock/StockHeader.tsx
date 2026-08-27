import React from 'react';
import { StockQuote } from '../../types/stock';
import { WSTickUpdate } from '../../types/ws';
import { formatCurrency, formatPercent, formatNumber } from '../../utils/formatters';
import { MarketStatusBadge } from '../common/MarketStatusBadge';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  quote: StockQuote;
  realtimeTick?: WSTickUpdate | null;
}

export const StockHeader: React.FC<Props> = ({ quote, realtimeTick }) => {
  const prevPriceRef = React.useRef<number>(quote.price);
  const [tickDirection, setTickDirection] = React.useState<'up' | 'down' | null>(null);

  React.useEffect(() => {
    if (!realtimeTick) return;
    if (realtimeTick.price > prevPriceRef.current) {
      setTickDirection('up');
    } else if (realtimeTick.price < prevPriceRef.current) {
      setTickDirection('down');
    }
    prevPriceRef.current = realtimeTick.price;

    const timer = setTimeout(() => setTickDirection(null), 1000);
    return () => clearTimeout(timer);
  }, [realtimeTick]);

  const currentPrice = realtimeTick ? realtimeTick.price : quote.price;
  const previousClose = quote.previousClose > 0 ? quote.previousClose : quote.price;
  const dailyChange = Number((currentPrice - previousClose).toFixed(2));
  const dailyChangePercent = previousClose > 0 ? Number(((dailyChange / previousClose) * 100).toFixed(2)) : 0;
  const isPositiveDaily = dailyChange >= 0;
  const currency = quote.currency || 'USD';

  return (
    <div className="bg-white border border-[#e0e3eb] rounded-lg p-4 mb-3 shadow-xs text-[#131722]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Symbol & Price Info Header */}
        <div>
          <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
            <h1 className="text-2xl font-bold font-mono text-[#131722] tracking-tight">{quote.symbol}</h1>
            <span className="text-xs bg-[#f0f3fa] border border-[#e0e3eb] text-[#707a8a] px-2 py-0.5 rounded font-mono font-semibold">
              {quote.exchange}
            </span>
            {quote.currency && (
              <span className="text-xs bg-[#2962ff] text-white px-2 py-0.5 rounded font-mono font-bold">
                {quote.currency}
              </span>
            )}
            {quote.sector && (
              <span className="text-xs bg-[#e8f0fe] text-[#2962ff] px-2 py-0.5 rounded font-mono font-medium">
                {quote.sector}
              </span>
            )}
            <MarketStatusBadge status={quote.marketStatus} />
          </div>
          <p className="text-xs text-[#707a8a] mt-0.5 font-medium">{quote.name}</p>

          <div className="flex items-baseline space-x-3 mt-2">
            <span className={`text-3xl font-extrabold font-mono tracking-tight transition-colors duration-300 ${
              tickDirection === 'up' ? 'text-[#089981]' : tickDirection === 'down' ? 'text-[#f23645]' : 'text-[#131722]'
            }`}>
              {formatCurrency(currentPrice, currency)}
            </span>
            <div
              className={`flex items-center space-x-1 font-mono text-xs font-bold px-2 py-0.5 rounded ${
                isPositiveDaily
                  ? 'bg-[#e6f4f1] text-[#089981]'
                  : 'bg-[#fdecee] text-[#f23645]'
              }`}
            >
              {isPositiveDaily ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{isPositiveDaily ? '+' : ''}{dailyChange.toFixed(2)}</span>
              <span>({formatPercent(dailyChangePercent)})</span>
            </div>
            {tickDirection && (
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded animate-bounce ${
                tickDirection === 'up' ? 'bg-[#089981] text-white' : 'bg-[#f23645] text-white'
              }`}>
                {tickDirection === 'up' ? '▲ TICK UP' : '▼ TICK DOWN'}
              </span>
            )}
          </div>
        </div>

        {/* Compact Horizontal Market Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 bg-[#f8f9fd] border border-[#e0e3eb] rounded-lg p-2.5 text-xs font-mono">
          <div>
            <div className="text-[#707a8a] text-[10px] uppercase font-semibold">Open</div>
            <div className="text-[#131722] font-bold">{formatCurrency(quote.open, currency)}</div>
          </div>
          <div>
            <div className="text-[#707a8a] text-[10px] uppercase font-semibold">Prev Close</div>
            <div className="text-[#131722] font-bold">{formatCurrency(quote.previousClose, currency)}</div>
          </div>
          <div>
            <div className="text-[#707a8a] text-[10px] uppercase font-semibold">Day High</div>
            <div className="text-[#089981] font-bold">{formatCurrency(quote.dayHigh, currency)}</div>
          </div>
          <div>
            <div className="text-[#707a8a] text-[10px] uppercase font-semibold">Day Low</div>
            <div className="text-[#f23645] font-bold">{formatCurrency(quote.dayLow, currency)}</div>
          </div>
          <div>
            <div className="text-[#707a8a] text-[10px] uppercase font-semibold">Volume</div>
            <div className="text-[#131722] font-bold">{quote.volume ? formatNumber(realtimeTick ? realtimeTick.volume : quote.volume) : 'N/A'}</div>
          </div>
          <div>
            <div className="text-[#707a8a] text-[10px] uppercase font-semibold">Market Cap</div>
            <div className="text-[#131722] font-bold">{quote.marketCap ? formatNumber(quote.marketCap) : 'N/A'}</div>
          </div>
          <div>
            <div className="text-[#707a8a] text-[10px] uppercase font-semibold">P/E Ratio</div>
            <div className="text-[#131722] font-bold">{quote.peRatio ? quote.peRatio.toFixed(1) : 'N/A'}</div>
          </div>
          <div>
            <div className="text-[#707a8a] text-[10px] uppercase font-semibold">EPS</div>
            <div className="text-[#131722] font-bold">{quote.eps ? formatCurrency(quote.eps, currency) : 'N/A'}</div>
          </div>
          <div>
            <div className="text-[#707a8a] text-[10px] uppercase font-semibold">Div Yield</div>
            <div className="text-[#089981] font-bold">{quote.dividendYield !== undefined ? `${quote.dividendYield.toFixed(2)}%` : 'N/A'}</div>
          </div>
          <div>
            <div className="text-[#707a8a] text-[10px] uppercase font-semibold">Beta</div>
            <div className="text-[#131722] font-bold">{quote.beta ? quote.beta.toFixed(2) : 'N/A'}</div>
          </div>
          <div>
            <div className="text-[#707a8a] text-[10px] uppercase font-semibold">52W High</div>
            <div className="text-[#131722] font-bold">{quote.fiftyTwoWeekHigh ? formatCurrency(quote.fiftyTwoWeekHigh, currency) : 'N/A'}</div>
          </div>
          <div>
            <div className="text-[#707a8a] text-[10px] uppercase font-semibold">52W Low</div>
            <div className="text-[#131722] font-bold">{quote.fiftyTwoWeekLow ? formatCurrency(quote.fiftyTwoWeekLow, currency) : 'N/A'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
