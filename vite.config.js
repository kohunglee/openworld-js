import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

const cannonSource = readFileSync(resolve(__dirname, 'cannon/cannon29kb.js'), 'utf8');  // 顶部代码注入
const cannonCode = `(0, eval)(${JSON.stringify(cannonSource)});`;

// 生产包只面向现代浏览器，核心目标是少文件、低体积、资源不内联。
export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@plugins': resolve(__dirname, 'plugins'),
    },
  },
  esbuild: {
    drop: ['console', 'debugger'],
    legalComments: 'none',
  },
  build: {
    target: 'esnext',
    sourcemap: false,
    minify: 'esbuild',
    cssCodeSplit: false,
    assetsInlineLimit: 0,
    modulePreload: { polyfill: false },
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        'open-world-zone': resolve(__dirname, 'open-world-zone/index.html'),
      },
      output: {
        banner: cannonCode,
        entryFileNames: 'assets/open-world-zone.js',
        chunkFileNames: 'assets/open-world-zone.[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]',
        inlineDynamicImports: true,
        manualChunks: undefined,
      },
    },
  },
});
