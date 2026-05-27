/**
 * CDN 模型包构建脚本
 *
 * 目标：
 * 1. 把 temp/cdn/build_lab/index.js 打成一个独立压缩文件。
 * 2. 把 temp/cdn/xhall/index.js 打成一个独立压缩文件。
 * 3. 不生成共享 chunk，方便你单文件上传 CDN。
 */

import { resolve } from 'node:path';
import { rmSync, readFileSync, writeFileSync } from 'node:fs';
import { gzipSync, brotliCompressSync, constants as zlibConstants } from 'node:zlib';
import { build } from 'vite';
import { transform } from 'esbuild';

const ROOT = '/Users/kehongli/studio/openworld-js';
const MODELS = ['build_lab', 'xhall'];

/**
 * 为单个模型生成一份独立的 Vite 构建配置。
 * 这里直接走 library 模式，保证每个模型最后只落一个 index.js。
 */
function createCdnModelConfig(modelName) {
  return {
    configFile: false,
    root: ROOT,
    base: './',
    resolve: {
      alias: {
        '@plugins': resolve(ROOT, 'plugins'),
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
      outDir: resolve(ROOT, `dist/cdn/${modelName}`),
      emptyOutDir: true,
      lib: {
        entry: resolve(ROOT, `open-world-zone/temp/cdn/${modelName}/index.js`),
        formats: ['es'],
        fileName: () => 'index.js',
      },
      rollupOptions: {
        output: {
          // 强制把依赖都卷进单文件，避免额外 chunk。
          inlineDynamicImports: true,
          manualChunks: undefined,
          entryFileNames: 'index.js',
          chunkFileNames: 'index.js',
          assetFileNames: 'assets/[name].[hash][extname]',
        },
      },
    },
  };
}

/**
 * 二次压缩产物
 *
 * Vite/esbuild 首轮已经会做压缩，但 data.js 里原有的注释和格式有时还会残留。
 * 这里再对最终 index.js 做一次极限压缩，并顺手产出 .gz / .br，方便直接传 CDN。
 */
async function postMinifyAndCompress(modelName) {
  const filePath = resolve(ROOT, `dist/cdn/${modelName}/index.js`);
  const source = readFileSync(filePath, 'utf8');
  const result = await transform(source, {
    loader: 'js',
    minify: true,
    legalComments: 'none',
    charset: 'utf8',
  });

  writeFileSync(filePath, result.code);
  writeFileSync(`${filePath}.gz`, gzipSync(result.code, { level: 9 }));
  writeFileSync(`${filePath}.br`, brotliCompressSync(result.code, {
    params: {
      [zlibConstants.BROTLI_PARAM_QUALITY]: 11,
    },
  }));
}

/**
 * 主执行流程
 *
 * 先清掉旧的 dist/cdn，再顺序打两个模型，避免旧文件残留干扰判断。
 */
async function main() {
  rmSync(resolve(ROOT, 'dist/cdn'), { recursive: true, force: true });

  for (const modelName of MODELS) {
    await build(createCdnModelConfig(modelName));
    await postMinifyAndCompress(modelName);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
