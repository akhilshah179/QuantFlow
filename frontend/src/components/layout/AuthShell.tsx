import React from 'react';
import { motion } from 'motion/react';
import { BrandMark } from './BrandMark';
import { TerminalBackdrop } from '../fx/TerminalBackdrop';
import { MarketStreamWall } from '../stream/MarketStreamWall';
import { LiveDot } from '../ui/misc';

/** Split auth layout: live market wall on the left, form on the right. */
export const AuthShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative flex min-h-[100dvh] bg-bg text-fg">
    <TerminalBackdrop />

    {/* Market wall hero */}
    <section className="relative z-10 hidden flex-1 flex-col justify-between overflow-hidden border-r border-line p-10 lg:flex">
      <BrandMark />
      <div className="space-y-6">
        <div>
          <div className="qf-label mb-3 flex items-center gap-2">
            <LiveDot tone="up" /> Live cross-asset feed
          </div>
          <h1 className="max-w-lg text-4xl font-semibold leading-[1.1] tracking-tight">
            The quantitative terminal for{' '}
            <span className="bg-gradient-to-r from-accent to-[#ffd58a] bg-clip-text text-transparent">real-time markets.</span>
          </h1>
          <p className="mt-3 max-w-md text-sm text-fg-muted">
            Equities, crypto, FX and futures streaming into one desk — with charting, alerts and a $100,000 paper-trading book.
          </p>
        </div>
        <div className="qf-panel overflow-hidden">
          <MarketStreamWall bare height={300} />
        </div>
      </div>
      <p className="font-mono text-3xs uppercase tracking-[0.2em] text-fg-subtle">Paper trading only · Not investment advice</p>
    </section>

    {/* Form */}
    <section className="relative z-10 flex w-full items-center justify-center p-4 sm:p-8 lg:w-[480px] lg:shrink-0">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 lg:hidden">
          <BrandMark />
        </div>
        {children}
      </motion.div>
    </section>
  </div>
);
