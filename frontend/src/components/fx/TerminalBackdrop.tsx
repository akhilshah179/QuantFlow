import React, { useEffect, useRef } from 'react';
import { useReducedMotionPref } from '../../hooks/useReducedMotionPref';

/**
 * Understated "data atmosphere": a fine static grid (CSS), plus one canvas with a
 * few scrolling price traces and drifting nodes. Capped at 30fps and DPR 1.5.
 */

interface Trace {
  y: number; // baseline as a fraction of height
  amp: number; // px
  points: number[];
  color: string;
  width: number;
  pulse: number; // position of the travelling highlight (0..1), <0 = idle
}

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const STEP = 14; // px between trace points
const FPS = 30;

const css = (name: string, alpha: number) => {
  const rgb = getComputedStyle(document.documentElement).getPropertyValue(`--qf-${name}`).trim() || '128 128 128';
  return `rgb(${rgb} / ${alpha})`;
};

export const TerminalBackdrop: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduceMotion = useReducedMotionPref();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    let traces: Trace[] = [];
    let nodes: Node[] = [];
    let shift = 0;
    let frame = 0;
    let lastDraw = 0;

    const palette = {
      up: css('up', 0.11),
      down: css('down', 0.09),
      accent: css('accent', 0.08),
      neutral: css('fg-subtle', 0.07),
      node: css('fg-muted', 0.18),
      link: css('fg-subtle', 0.05),
      head: css('accent', 0.55),
    };

    const walk = (count: number, amp: number) => {
      const pts: number[] = [];
      let v = 0;
      for (let i = 0; i < count; i++) {
        v += (Math.random() - 0.5) * amp * 0.35;
        v *= 0.94; // mean-revert so traces stay in their band
        pts.push(v);
      }
      return pts;
    };

    const setup = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.ceil(width / STEP) + 3;
      const colors = [palette.up, palette.neutral, palette.down, palette.accent, palette.neutral];
      traces = [0.18, 0.37, 0.56, 0.74, 0.9].map((y, i) => ({
        y,
        amp: 40 + i * 6,
        points: walk(count, 40 + i * 6),
        color: colors[i],
        width: i === 3 ? 1.25 : 1,
        pulse: -1,
      }));

      const nodeCount = Math.round(Math.min(28, (width * height) / 60000));
      nodes = Array.from({ length: nodeCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 4,
      }));
    };

    const draw = (dt: number) => {
      ctx.clearRect(0, 0, width, height);

      // Price traces scroll left; a fresh point is appended each STEP.
      shift += dt * 9;
      while (shift >= STEP) {
        shift -= STEP;
        for (const t of traces) {
          const lastV = t.points[t.points.length - 1];
          let v = lastV + (Math.random() - 0.5) * t.amp * 0.35;
          v *= 0.94;
          t.points.push(v);
          t.points.shift();
        }
      }

      for (const t of traces) {
        const base = t.y * height;
        ctx.beginPath();
        for (let i = 0; i < t.points.length; i++) {
          const x = i * STEP - shift;
          const y = base + t.points[i];
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = t.color;
        ctx.lineWidth = t.width;
        ctx.stroke();

        // Occasional market-data trace: a bright head travels the line.
        if (t.pulse < 0 && Math.random() < dt * 0.04) t.pulse = 0;
        if (t.pulse >= 0) {
          t.pulse += dt * 0.12;
          if (t.pulse > 1) {
            t.pulse = -1;
          } else {
            const idx = Math.floor(t.pulse * (t.points.length - 1));
            const x = idx * STEP - shift;
            const y = base + t.points[idx];
            const fade = Math.sin(t.pulse * Math.PI);
            ctx.globalAlpha = fade;
            ctx.fillStyle = palette.head;
            ctx.beginPath();
            ctx.arc(x, y, 1.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }
      }

      // Drifting nodes with faint proximity links.
      for (const n of nodes) {
        n.x += n.vx * dt;
        n.y += n.vy * dt;
        if (n.x < -10) n.x = width + 10;
        if (n.x > width + 10) n.x = -10;
        if (n.y < -10) n.y = height + 10;
        if (n.y > height + 10) n.y = -10;
      }
      ctx.strokeStyle = palette.link;
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          if (dx * dx + dy * dy < 150 * 150) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }
      ctx.fillStyle = palette.node;
      for (const n of nodes) {
        ctx.fillRect(n.x - 0.75, n.y - 0.75, 1.5, 1.5);
      }
    };

    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      const elapsed = now - lastDraw;
      if (elapsed < 1000 / FPS) return;
      const dt = Math.min(0.1, elapsed / 1000);
      lastDraw = now;
      draw(dt);
    };

    setup();
    if (reduceMotion) {
      draw(0);
    } else {
      lastDraw = performance.now();
      frame = requestAnimationFrame(loop);
    }

    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        setup();
        if (reduceMotion) draw(0);
      }, 150);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
    };
  }, [reduceMotion]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-60 [mask-image:radial-gradient(ellipse_at_50%_30%,#000_20%,transparent_75%)]" />
      <div className="absolute -left-40 -top-40 h-[480px] w-[480px] rounded-full bg-accent/[0.05] blur-3xl" />
      <div className="absolute -bottom-48 right-0 h-[420px] w-[520px] rounded-full bg-info/[0.035] blur-3xl" />
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
};
