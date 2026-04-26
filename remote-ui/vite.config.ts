import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Essential for access from phone on local network
    port: 5173,
    strictPort: true,
    hmr: {
      clientPort: 5173, // Fix for HMR through proxies/termux
    },
  },
  build: {
    target: 'esnext', // 2026 browsers support esnext
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'framer-motion', 'lucide-react'],
        },
      },
    },
  },
});
