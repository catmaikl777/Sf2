import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'es2023',
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    host: true,
    port: 5173,
  },
});
