import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Bell, Plus, Trash2, CheckCircle2 } from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [symbol, setSymbol] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = () => {
    api
      .get('/alerts')
      .then((res: any) => {
        const list = Array.isArray(res) ? res : res?.data || [];
        setAlerts(list);
      })
      .catch(() => setAlerts([]));
  };

  const handleDelete = (id: string) => {
    api.delete(`/alerts/${id}`).then(() => fetchAlerts());
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !targetPrice) return;
    api
      .post('/alerts', { symbol, targetPrice: parseFloat(targetPrice), condition })
      .then(() => {
        setShowModal(false);
        setSymbol('');
        setTargetPrice('');
        fetchAlerts();
      })
      .catch((err) => alert(err.message || 'Failed to create price alert'));
  };

  return (
    <div className="space-y-4 font-mono text-[#131722]">
      {/* Header Banner */}
      <div className="flex items-center justify-between bg-white border border-[#e0e3eb] rounded-lg p-4 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded bg-[#e8f0fe] text-[#2962ff] flex items-center justify-center font-bold">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#131722]">Market Price Alerts Engine</h1>
            <p className="text-xs text-[#707a8a] font-medium">Real-time WebSocket price & technical threshold trigger notifications</p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-[#2962ff] hover:bg-[#1e54e4] text-white px-3.5 py-1.5 rounded text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Alert</span>
        </button>
      </div>

      {/* Alerts Table */}
      <div className="bg-white border border-[#e0e3eb] rounded-lg p-3.5 shadow-xs overflow-x-auto">
        {alerts.length > 0 ? (
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#e0e3eb] text-[#707a8a] uppercase text-[10px]">
                <th className="pb-2 px-3">Symbol</th>
                <th className="pb-2 px-3">Condition</th>
                <th className="pb-2 px-3">Target Price</th>
                <th className="pb-2 px-3">Status</th>
                <th className="pb-2 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f3fa]">
              {alerts.map((alt) => (
                <tr key={alt.id} className="hover:bg-[#f8f9fd] transition-colors">
                  <td className="py-2.5 px-3 font-bold text-[#131722]">${alt.symbol}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        alt.condition === 'ABOVE' ? 'bg-[#e6f4f1] text-[#089981]' : 'bg-[#fdecee] text-[#f23645]'
                      }`}
                    >
                      {alt.condition}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-bold text-[#131722]">${Number(alt.targetPrice).toFixed(2)}</td>
                  <td className="py-2.5 px-3">
                    {alt.isActive ? (
                      <span className="text-[#089981] flex items-center space-x-1 font-bold">
                        <span className="w-2 h-2 rounded-full bg-[#089981] animate-pulse"></span>
                        <span>ACTIVE MONITORING</span>
                      </span>
                    ) : (
                      <span className="text-[#707a8a] flex items-center space-x-1 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#089981]" />
                        <span>TRIGGERED</span>
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button onClick={() => handleDelete(alt.id)} className="text-[#707a8a] hover:text-[#f23645] p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-[#707a8a] text-xs font-mono border border-dashed border-[#e0e3eb] rounded-lg">
            No active market alerts. Click "Create New Alert" to set price threshold monitors.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#e0e3eb] w-full max-w-md rounded-xl p-5 space-y-4 shadow-2xl">
            <h2 className="text-sm font-bold text-[#131722] flex items-center space-x-2">
              <Bell className="w-4 h-4 text-[#2962ff]" />
              <span>Create Market Price Alert</span>
            </h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-[#707a8a] block mb-1">SYMBOL</label>
                <input
                  type="text"
                  placeholder="e.g. AAPL, TSLA, BTCUSD"
                  className="w-full bg-[#f8f9fd] border border-[#e0e3eb] rounded p-2 text-xs text-[#131722] outline-none focus:border-[#2962ff]"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-[#707a8a] block mb-1">CONDITION</label>
                <select
                  className="w-full bg-[#f8f9fd] border border-[#e0e3eb] rounded p-2 text-xs text-[#131722] outline-none focus:border-[#2962ff]"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as any)}
                >
                  <option value="ABOVE">PRICE BREAKS ABOVE (&gt;=)</option>
                  <option value="BELOW">PRICE DROPS BELOW (&lt;=)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-[#707a8a] block mb-1">TARGET PRICE ($)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 250.00"
                  className="w-full bg-[#f8f9fd] border border-[#e0e3eb] rounded p-2 text-xs text-[#131722] outline-none focus:border-[#2962ff]"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-1.5 bg-[#f0f3fa] text-[#707a8a] rounded text-xs font-bold hover:text-[#131722]"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-[#2962ff] hover:bg-[#1e54e4] text-white font-bold rounded text-xs">
                  Set Price Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
