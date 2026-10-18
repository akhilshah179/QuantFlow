import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Optional override for the dev proxy target (defaults to the standard backend port).
const apiTarget = process.env.VITE_API_TARGET || 'http://127.0.0.1:5000';
const wsTarget = apiTarget.replace(/^http/, 'ws');

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', () => {
            // Quietly handle proxy errors when backend restarts
          });
        },
      },
      '/ws': {
        target: wsTarget,
        ws: true,
        configure: (proxy) => {
          proxy.on('error', () => {
            // Quietly handle WebSocket proxy resets during hot reloads
          });
        },
      },
    },
  },
});
