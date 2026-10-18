/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--qf-${name}) / <alpha-value>)`;

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Terminal surfaces — darkest to lightest
        bg: token('bg'),
        surface: token('surface'),
        raised: token('raised'),
        overlay: token('overlay'),
        line: {
          DEFAULT: token('line'),
          strong: token('line-strong'),
        },
        fg: {
          DEFAULT: token('fg'),
          muted: token('fg-muted'),
          subtle: token('fg-subtle'),
        },
        // Market semantics + the single brand accent
        up: token('up'),
        down: token('down'),
        accent: {
          DEFAULT: token('accent'),
          fg: token('accent-fg'),
        },
        info: token('info'),
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['10px', '14px'],
        '3xs': ['9px', '12px'],
      },
      boxShadow: {
        panel: '0 1px 0 0 rgb(255 255 255 / 0.03) inset, 0 8px 24px -12px rgb(0 0 0 / 0.6)',
        pop: '0 24px 48px -16px rgb(0 0 0 / 0.75), 0 0 0 1px rgb(var(--qf-line-strong))',
        glow: '0 0 0 1px rgb(var(--qf-accent) / 0.35), 0 0 24px -4px rgb(var(--qf-accent) / 0.35)',
      },
      transitionTimingFunction: {
        terminal: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
      keyframes: {
        'live-ping': {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '80%, 100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'live-ping': 'live-ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite',
        shimmer: 'shimmer 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
