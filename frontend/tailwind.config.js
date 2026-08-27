/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        tv: {
          bg: '#ffffff',
          'bg-subtle': '#f8f9fd',
          panel: '#ffffff',
          border: '#e0e3eb',
          'border-light': '#f0f3fa',
          hover: '#f0f3fa',
          selected: '#e8f0fe',
          text: '#131722',
          secondary: '#707a8a',
          muted: '#9598a1',
          blue: '#2962ff',
          'blue-hover': '#1e54e4',
          green: '#089981',
          'green-bg': '#e6f4f1',
          red: '#f23645',
          'red-bg': '#fdecee',
        },
        dark: {
          bg: '#ffffff',
          card: '#ffffff',
          panel: '#f8f9fd',
          border: '#e0e3eb',
          hover: '#f0f3fa',
          text: '#131722',
          muted: '#707a8a',
        },
        market: {
          green: '#089981',
          'green-dark': '#066d5c',
          red: '#f23645',
          'red-dark': '#b22833',
          blue: '#2962ff',
          yellow: '#f5c900',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
