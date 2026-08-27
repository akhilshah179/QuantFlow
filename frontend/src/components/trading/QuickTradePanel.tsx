import React, { useState } from 'react';
import { usePortfolioStore } from '../../store/portfolioStore';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency } from '../../utils/formatters';
import { DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  symbol: string;
  currentPrice: number;
}

export const QuickTradePanel: React.FC<Props> = ({ symbol, currentPrice }) => {
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [executionType, setExecutionType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [quantity, setQuantity] = useState<number>(10);
  const [limitPrice, setLimitPrice] = useState<number>(currentPrice || 100);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { buyStock, sellStock, isOrdering, error, summary } = usePortfolioStore();
  const user = useAuthStore((state) => state.user);

  const activePrice = executionType === 'LIMIT' ? limitPrice : currentPrice;
  const totalCost = (activePrice || 0) * (quantity || 0);
  const availableCash = user ? user.virtualCash : 0;
  const holding = summary?.holdings.find((h) => h.symbol === symbol.toUpperCase());
  const ownedQty = holding ? holding.quantity : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    if (!quantity || quantity <= 0) return;

    try {
      if (tradeType === 'BUY') {
        const res = await buyStock(symbol, quantity);
        setSuccessMsg(res.message || `Successfully executed order for ${quantity} shares of ${symbol}`);
      } else {
        const res = await sellStock(symbol, quantity);
        setSuccessMsg(res.message || `Successfully executed order for ${quantity} shares of ${symbol}`);
      }
    } catch {
      // Error handled by store
    }
  };

  return (
    <div className="bg-white border border-[#e0e3eb] rounded-lg p-3.5 shadow-xs text-[#131722]">
      <div className="flex items-center justify-between border-b border-[#f0f3fa] pb-2 mb-3">
        <h3 className="text-xs font-bold font-mono text-[#131722] flex items-center space-x-1.5 uppercase tracking-wider">
          <DollarSign className="w-4 h-4 text-[#089981]" />
          <span>Paper Order Entry</span>
        </h3>
        <span className="text-xs font-mono font-bold text-[#2962ff]">{symbol}</span>
      </div>

      {/* Trade Type Selector */}
      <div className="grid grid-cols-2 gap-2 mb-2.5">
        <button
          type="button"
          onClick={() => { setTradeType('BUY'); setSuccessMsg(null); }}
          className={`py-1.5 rounded text-xs font-mono font-bold transition-all ${
            tradeType === 'BUY'
              ? 'bg-[#089981] text-white shadow-xs'
              : 'bg-[#f8f9fd] border border-[#e0e3eb] text-[#707a8a] hover:text-[#131722]'
          }`}
        >
          BUY
        </button>
        <button
          type="button"
          onClick={() => { setTradeType('SELL'); setSuccessMsg(null); }}
          className={`py-1.5 rounded text-xs font-mono font-bold transition-all ${
            tradeType === 'SELL'
              ? 'bg-[#f23645] text-white shadow-xs'
              : 'bg-[#f8f9fd] border border-[#e0e3eb] text-[#707a8a] hover:text-[#131722]'
          }`}
        >
          SELL
        </button>
      </div>

      {/* Execution Type Selector */}
      <div className="flex items-center justify-between bg-[#f8f9fd] p-0.5 rounded border border-[#e0e3eb] mb-3">
        <button
          type="button"
          onClick={() => setExecutionType('MARKET')}
          className={`flex-1 py-1 text-[10px] font-mono font-bold rounded transition-colors ${
            executionType === 'MARKET' ? 'bg-[#2962ff] text-white' : 'text-[#707a8a] hover:text-[#131722]'
          }`}
        >
          MARKET
        </button>
        <button
          type="button"
          onClick={() => { setExecutionType('LIMIT'); setLimitPrice(currentPrice); }}
          className={`flex-1 py-1 text-[10px] font-mono font-bold rounded transition-colors ${
            executionType === 'LIMIT' ? 'bg-[#2962ff] text-white' : 'text-[#707a8a] hover:text-[#131722]'
          }`}
        >
          LIMIT ORDER
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 font-mono">
        {executionType === 'MARKET' ? (
          <div>
            <label className="block text-[10px] font-mono text-[#707a8a] uppercase font-bold mb-1">
              Market Price
            </label>
            <div className="bg-[#f8f9fd] border border-[#e0e3eb] rounded px-3 py-1.5 text-xs font-bold text-[#131722]">
              {formatCurrency(currentPrice)}
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-[10px] font-mono text-[#707a8a] uppercase font-bold mb-1">
              Limit Target Price ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={limitPrice}
              onChange={(e) => setLimitPrice(parseFloat(e.target.value) || currentPrice)}
              className="w-full bg-[#f8f9fd] border border-[#e0e3eb] rounded px-3 py-1.5 text-xs font-bold text-[#131722] focus:outline-none focus:border-[#2962ff]"
            />
          </div>
        )}

        <div>
          <div className="flex items-center justify-between text-[10px] font-mono text-[#707a8a] uppercase font-bold mb-1">
            <span>Shares Quantity</span>
            {tradeType === 'SELL' && <span>Owned: {ownedQty}</span>}
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 0))}
              className="flex-1 bg-[#f8f9fd] border border-[#e0e3eb] rounded px-3 py-1.5 text-xs font-bold text-[#131722] focus:outline-none focus:border-[#2962ff]"
            />
            <div className="flex space-x-1">
              {[10, 50, 100].map((qty) => (
                <button
                  key={qty}
                  type="button"
                  onClick={() => setQuantity(qty)}
                  className="px-2 py-1 bg-[#f8f9fd] border border-[#e0e3eb] hover:bg-[#e8f0fe] text-xs font-mono text-[#131722] font-bold rounded"
                >
                  +{qty}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Estimated Order Summary */}
        <div className="bg-[#f8f9fd] border border-[#e0e3eb] rounded p-2.5 space-y-1 text-xs font-mono">
          <div className="flex justify-between text-[#707a8a]">
            <span>Estimated Value:</span>
            <span className="text-[#131722] font-bold">{formatCurrency(totalCost)}</span>
          </div>
          <div className="flex justify-between text-[#707a8a]">
            <span>Available Cash:</span>
            <span className="text-[#089981] font-bold">{formatCurrency(availableCash)}</span>
          </div>
        </div>

        {error && (
          <div className="flex items-start space-x-2 bg-[#fdecee] border border-[#f23645]/30 p-2 rounded text-xs text-[#f23645]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center space-x-2 bg-[#e6f4f1] border border-[#089981]/30 p-2 rounded text-xs text-[#089981] font-bold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isOrdering}
          className={`w-full py-2 rounded font-mono font-bold text-xs text-white transition-all shadow-xs ${
            tradeType === 'BUY'
              ? 'bg-[#089981] hover:bg-[#066d5c]'
              : 'bg-[#f23645] hover:bg-[#b22833]'
          } ${isOrdering ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isOrdering ? 'Executing...' : `PLACE ${executionType} ${tradeType} ORDER`}
        </button>
      </form>
    </div>
  );
};
