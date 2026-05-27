import { resolve } from 'node:path';
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import { defineConfig } from 'vite';

const cannonSource = readFileSync(resolve(__dirname, 'cannon/cannon29kb.js'), 'utf8');  // 顶部代码注入
const cannonCode = `(0, eval)(${JSON.stringify(cannonSource)});`;

// 把 p001-start 的 HTML 从默认输出路径重定位到 dist/p001-start/index.html
function relocateP001StartHtml() {
  return {
    name: 'relocate-p001-start-html',
    closeBundle() {
      const oldPath = resolve(__dirname, 'dist/example/p001-start/index.html');
      const newDir = resolve(__dirname, 'dist/p001-start');
      const newPath = resolve(newDir, 'index.html');
      if (existsSync(oldPath)) {
        mkdirSync(newDir, { recursive: true });
        renameSync(oldPath, newPath);
        // HTML 被移动后，资源引用层级也要同步改写
        const html = readFileSync(newPath, 'utf8')
          .replaceAll('../../p001-start/', './')
          .replaceAll('../../shared/', '../shared/');
        writeFileSync(newPath, html);
        rmSync(resolve(__dirname, 'dist/example'), { recursive: true, force: true });
      }
    },
  };
}

/**
 * 主站构建配置
 *
 * 这部分继续负责 open-world-zone 和示例页，不动 CDN 模型包。
 */
function createMainSiteConfig() {
  return {
    plugins: [relocateP001StartHtml()],
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
          // 增加示例入口：下次执行一次 build 时会一并产出到 dist/p001-start
          'p001-start': resolve(__dirname, 'example/p001-start/index.html'),
        },
        output: {
          banner: cannonCode,
          // 每个入口独立目录，避免资源命名冲突
          entryFileNames: '[name]/assets/[name].js',
          // 非入口共享 chunk 放到 shared，防止覆盖且便于区分
          chunkFileNames: 'shared/assets/[name].[hash].js',
          // 静态资源统一按入口目录输出，满足 dist/p001-start/assets/* 的需求
          assetFileNames: (assetInfo) => {
            const names = assetInfo?.names || [];
            const firstName = names[0] || assetInfo?.name || '';
            const lowerName = String(firstName).toLowerCase();
            const inP001 = lowerName.includes('p001') || lowerName.includes('start');
            const dir = inP001 ? 'p001-start' : 'open-world-zone';
            return `${dir}/assets/[name].[hash][extname]`;
          },
          // 多入口构建关闭 inlineDynamicImports，避免 Rollup 冲突
          inlineDynamicImports: false,
          manualChunks: undefined,
        },
      },
    },
  };
}

/**
 * 这里继续只导出主站配置。
 *
 * CDN 模型包构建改由 `scripts/build-cdn.mjs` 走 Vite 的 Node API 单独执行，
 * 这样不会碰到 CLI 侧对“配置数组”的限制。
 */
export default defineConfig(createMainSiteConfig());
