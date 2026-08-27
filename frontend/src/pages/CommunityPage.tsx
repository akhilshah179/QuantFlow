import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Users, Heart, MessageSquare, Plus, Send } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const CommunityPage: React.FC = () => {
  const [ideas, setIdeas] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [symbol, setSymbol] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const { user } = useAuthStore();

  useEffect(() => {
    fetchIdeas();
  }, []);

  const fetchIdeas = () => {
    api
      .get('/community/ideas')
      .then((res: any) => {
        const list = Array.isArray(res) ? res : res?.data || [];
        setIdeas(list);
      })
      .catch(() => setIdeas([]));
  };

  const handleLike = (id: string) => {
    api.post(`/community/ideas/${id}/like`).then(() => fetchIdeas());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !title || !description) return;
    api
      .post('/community/ideas', { symbol, title, description })
      .then(() => {
        setShowModal(false);
        setSymbol('');
        setTitle('');
        setDescription('');
        fetchIdeas();
      })
      .catch((err) => alert(err.message || 'Failed to publish trade idea'));
  };

  return (
    <div className="space-y-4 font-mono text-[#131722]">
      {/* Header Banner */}
      <div className="flex items-center justify-between bg-white border border-[#e0e3eb] rounded-lg p-4 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded bg-[#e8f0fe] text-[#2962ff] flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#131722]">Trade Ideas & Technical Community</h1>
            <p className="text-xs text-[#707a8a] font-medium">Verified technical setups, trade observations & market charts</p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-[#2962ff] hover:bg-[#1e54e4] text-white px-3.5 py-1.5 rounded text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Publish Trade Idea</span>
        </button>
      </div>

      {/* Ideas Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ideas.map((idea) => (
          <div key={idea.id} className="bg-white border border-[#e0e3eb] rounded-lg p-4 space-y-3 flex flex-col justify-between shadow-xs hover:border-[#2962ff] transition-colors">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="bg-[#e8f0fe] text-[#2962ff] text-xs font-bold px-2 py-0.5 rounded">
                  ${idea.symbol}
                </span>
                <span className="text-[11px] text-[#707a8a] font-medium">
                  by <strong className="text-[#131722]">{idea.user?.name || 'Trader'}</strong>
                </span>
              </div>
              <h2 className="text-xs font-bold text-[#131722] hover:text-[#2962ff] transition-colors">{idea.title}</h2>
              <p className="text-[11px] text-[#5d606b] leading-relaxed line-clamp-4 font-sans">{idea.description}</p>
            </div>

            <div className="pt-2.5 border-t border-[#f0f3fa] flex items-center justify-between text-xs text-[#707a8a]">
              <button
                onClick={() => handleLike(idea.id)}
                className="flex items-center space-x-1.5 hover:text-[#f23645] transition-colors"
              >
                <Heart className="w-4 h-4 text-[#f23645]" />
                <span className="font-bold text-[#131722]">{idea.likesCount || 0}</span>
              </button>

              <div className="flex items-center space-x-1.5 font-medium">
                <MessageSquare className="w-4 h-4 text-[#2962ff]" />
                <span>{idea.comments?.length || 0} Comments</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Publish Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#e0e3eb] w-full max-w-lg rounded-xl p-5 space-y-4 shadow-2xl">
            <h2 className="text-sm font-bold text-[#131722] flex items-center space-x-2">
              <Send className="w-4 h-4 text-[#2962ff]" />
              <span>Publish Technical Trade Idea</span>
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-[#707a8a] block mb-1">SYMBOL</label>
                <input
                  type="text"
                  placeholder="e.g. AAPL, RELIANCE, BTCUSD"
                  className="w-full bg-[#f8f9fd] border border-[#e0e3eb] rounded p-2 text-xs text-[#131722] outline-none focus:border-[#2962ff]"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-[#707a8a] block mb-1">IDEA TITLE</label>
                <input
                  type="text"
                  placeholder="e.g. Bullish Breakout above $250 Support Level"
                  className="w-full bg-[#f8f9fd] border border-[#e0e3eb] rounded p-2 text-xs text-[#131722] outline-none focus:border-[#2962ff]"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-[#707a8a] block mb-1">ANALYSIS & DESCRIPTION</label>
                <textarea
                  rows={4}
                  placeholder="Explain your technical rationale, key indicators, and price targets..."
                  className="w-full bg-[#f8f9fd] border border-[#e0e3eb] rounded p-2 text-xs text-[#131722] outline-none focus:border-[#2962ff]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-1.5 bg-[#f0f3fa] text-[#707a8a] rounded text-xs hover:text-[#131722] font-bold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-[#2962ff] hover:bg-[#1e54e4] text-white font-bold rounded text-xs">
                  Publish Idea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
