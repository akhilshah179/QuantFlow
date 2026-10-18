import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Users, Heart, MessageSquare, Plus, Send, AlertCircle } from 'lucide-react';
import { useLikeIdea, usePublishIdea, useTradeIdeas } from '../services/queries';
import { notify } from '../store/notificationStore';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { EmptyState, FieldLabel, Skeleton } from '../components/ui/misc';
import { cn } from '../utils/cn';

const IdeaCard: React.FC<{ idea: any; index: number; onLike: (id: string) => void }> = ({ idea, index, onLike }) => {
  const [burst, setBurst] = useState(0);
  return (
    <motion.article
      layout="position"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.22 }}
      className="qf-panel flex flex-col justify-between gap-3 p-4 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-line-strong"
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="rounded bg-accent/10 px-1.5 py-0.5 font-mono text-xs font-bold text-accent">${idea.symbol}</span>
          <span className="flex items-center gap-1.5 text-[11px] text-fg-subtle">
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-line bg-raised font-mono text-3xs font-bold text-fg-muted">
              {(idea.user?.name || 'T').slice(0, 1).toUpperCase()}
            </span>
            {idea.user?.name || 'Trader'}
          </span>
        </div>
        <h2 className="text-sm font-semibold leading-snug text-fg">{idea.title}</h2>
        <p className="line-clamp-4 text-xs leading-relaxed text-fg-muted">{idea.description}</p>
      </div>

      <div className="flex items-center justify-between border-t border-line/70 pt-2.5 text-xs text-fg-subtle">
        <button
          onClick={() => {
            setBurst((b) => b + 1);
            onLike(idea.id);
          }}
          className="group flex items-center gap-1.5 rounded-md px-1.5 py-1 transition-colors hover:bg-down/10 hover:text-down"
          aria-label="Like idea"
        >
          <motion.span key={burst} initial={burst ? { scale: 1.6 } : false} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 14 }} className="flex">
            <Heart className={cn('h-4 w-4 text-down', burst > 0 && 'fill-down')} />
          </motion.span>
          <span className="num font-semibold text-fg">{idea.likesCount || 0}</span>
        </button>

        <div className="flex items-center gap-1.5">
          <MessageSquare className="h-4 w-4 text-fg-subtle" />
          <span>{idea.comments?.length || 0} Comments</span>
        </div>
      </div>
    </motion.article>
  );
};

export const CommunityPage: React.FC = () => {
  const { data: ideas = [], isLoading } = useTradeIdeas();
  const likeIdea = useLikeIdea();
  const publishIdea = usePublishIdea();

  const [showModal, setShowModal] = useState(false);
  const [symbol, setSymbol] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!showModal) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setShowModal(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showModal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !title || !description) return;
    setFormError(null);
    publishIdea.mutate(
      { symbol, title, description },
      {
        onSuccess: () => {
          notify({ tone: 'success', title: 'Trade idea published', message: `$${symbol.toUpperCase()} · ${title}` });
          setShowModal(false);
          setSymbol('');
          setTitle('');
          setDescription('');
        },
        onError: (err: any) => setFormError(err.message || 'Failed to publish trade idea'),
      },
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader
        icon={Users}
        eyebrow="Social / Community"
        title="Trade Ideas & Technical Community"
        subtitle="Technical setups, trade observations & market charts from traders"
        actions={
          <Button variant="primary" onClick={() => setShowModal(true)}>
            <Plus className="h-3.5 w-3.5" />
            Publish Trade Idea
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : ideas.length === 0 ? (
        <EmptyState icon={Users} title="No trade ideas yet." hint="Be the first to publish a setup." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {ideas.map((idea, i) => (
            <IdeaCard key={idea.id} idea={idea} index={i} onLike={(id) => likeIdea.mutate(id)} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(e) => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 460, damping: 34 }}
              className="w-full max-w-lg overflow-hidden rounded-xl border border-line-strong bg-overlay shadow-pop"
            >
              <div className="flex items-center gap-2 border-b border-line px-5 py-3.5">
                <Send className="h-4 w-4 text-accent" />
                <h2 className="text-sm font-semibold text-fg">Publish Technical Trade Idea</h2>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4 p-5">
                <div>
                  <FieldLabel htmlFor="idea-symbol">Symbol</FieldLabel>
                  <input id="idea-symbol" type="text" placeholder="e.g. AAPL, RELIANCE, BTCUSD" className="qf-input uppercase" value={symbol} onChange={(e) => setSymbol(e.target.value)} autoFocus required />
                </div>
                <div>
                  <FieldLabel htmlFor="idea-title">Idea Title</FieldLabel>
                  <input id="idea-title" type="text" placeholder="e.g. Bullish breakout above $250 support" className="qf-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                <div>
                  <FieldLabel htmlFor="idea-desc">Analysis & Description</FieldLabel>
                  <textarea
                    id="idea-desc"
                    rows={4}
                    placeholder="Explain your technical rationale, key indicators, and price targets…"
                    className="qf-input resize-none font-sans leading-relaxed"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>
                {formError && (
                  <div className="flex items-start gap-2 rounded-md border border-down/30 bg-down/10 p-2 text-xs text-down">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {formError}
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" loading={publishIdea.isPending}>
                    Publish Idea
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
