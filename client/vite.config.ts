import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  // /api/tutor is served by `npm run dev:server`; set TUTOR_API if it runs on another port
  server: { port: 5280, strictPort: true, proxy: { '/api': process.env.TUTOR_API ?? 'http://localhost:3001' } },
  preview: { port: 5281, strictPort: true },
  build: {
    rollupOptions: {
      output: {
        // vendor code changes rarely: separate chunks stay cached between content updates
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (/[\\/](react|react-dom|react-router|scheduler)[\\/]/.test(id)) return 'react';
          if (id.includes('motion') || id.includes('framer')) return 'motion';
          if (id.includes('prism-react-renderer')) return 'prism';
          if (id.includes('lucide-react')) return 'icons';
        },
      },
    },
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
});
