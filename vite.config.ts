import { defineConfig } from 'vite';

export default defineConfig({
  base: '/apex-prime-2/',
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: true
  }
});
