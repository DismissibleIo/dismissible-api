import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default defineConfig({
  plugins: [react()],
  root: __dirname,
  // Use relative paths so assets work in both hosted and local CLI contexts
  base: './',
  build: {
    outDir: '../dist/wizard',
    emptyOutDir: true,
    reportCompressedSize: true,
  },
  server: {
    port: 3002,
    host: 'localhost',
  },
  css: {
    postcss: {
      plugins: [tailwindcss(resolve(__dirname, './tailwind.config.js')), autoprefixer()],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
