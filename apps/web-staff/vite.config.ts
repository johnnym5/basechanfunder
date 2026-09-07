import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mkcert from 'vite-plugin-mkcert';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    mkcert(),
    /*
    VitePWA({
      registerType: 'autoUpdate',
      ...
    })
    */
  ],
  server: {
    https: true,
    host: '0.0.0.0',
    port: 3001,
    hmr: {
      protocol: 'wss',
      clientPort: 3001,
    },
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 3001,
  },
});
