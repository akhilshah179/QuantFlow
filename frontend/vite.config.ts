import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', () => {
            // Quietly handle proxy errors when backend restarts
          });
        },
      },
      '/ws': {
        target: 'ws://127.0.0.1:5000',
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
