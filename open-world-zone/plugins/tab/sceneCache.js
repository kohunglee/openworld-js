/**
 * 场景缓存面板
 * ========
 * 负责展示：
 * 1. scene-config 缓存条目数与体积；
 * 2. 模型入口模块缓存条目数与体积；
 * 3. 分开清除两类缓存，便于现场排障。
 */

import {
    clearModelModuleCache,
    clearSceneConfigCache,
    getSceneModelCacheStats,
} from '../scene_model_loader/scene_cache.js';

/**
 * 字节数格式化。
 * 面板里优先给用户一个直觉尺寸，不展示生硬的纯数字。
 */
function formatBytes(bytes) {
    const value = Number(bytes || 0);
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * 初始化场景缓存状态面板。
 */
export function initSceneCache($) {
    const refreshBtn = $('sceneCacheRefresh');
    const clearSceneBtn = $('sceneCacheClearSceneConfig');
    const clearModelBtn = $('sceneCacheClearModelModules');
    const statusEl = $('sceneCacheStatus');
    const sceneEl = $('sceneCacheSceneConfigStats');
    const modelEl = $('sceneCacheModelModuleStats');

    if (!refreshBtn || !clearSceneBtn || !clearModelBtn || !statusEl || !sceneEl || !modelEl) return;

    /**
     * 统一刷新缓存统计。
     */
    async function render(statusText = '') {
        try {
            const stats = await getSceneModelCacheStats();
            statusEl.textContent = statusText || `Total cached size: ${formatBytes(stats.totalBytes)}`;
            sceneEl.textContent =
                `Scene-config cache: ${stats.sceneConfigCount} item(s), ${formatBytes(stats.sceneConfigBytes)}`;
            modelEl.textContent =
                `Model module cache: ${stats.modelModuleCount} item(s), ${formatBytes(stats.modelModuleBytes)}`;
        } catch (error) {
            statusEl.textContent = `Scene cache error: ${error.message}`;
            sceneEl.textContent = 'Scene-config cache: -';
            modelEl.textContent = 'Model module cache: -';
        }
    }

    refreshBtn.addEventListener('click', async () => {
        statusEl.textContent = 'Refreshing scene cache stats...';
        await render();
    });

    clearSceneBtn.addEventListener('click', async () => {
        const stats = await getSceneModelCacheStats();
        if (stats.sceneConfigCount === 0) {
            await render('Scene-config cache is already empty.');
            return;
        }

        const ok = confirm(
            `Clear all ${stats.sceneConfigCount} cached scene-config item(s)? This only clears local IndexedDB cache.`
        );
        if (!ok) {
            await render('Scene-config clear canceled.');
            return;
        }

        await clearSceneConfigCache();
        await render('Scene-config cache cleared.');
    });

    clearModelBtn.addEventListener('click', async () => {
        const stats = await getSceneModelCacheStats();
        if (stats.modelModuleCount === 0) {
            await render('Model module cache is already empty.');
            return;
        }

        const ok = confirm(
            `Clear all ${stats.modelModuleCount} cached model module item(s)? This only clears local IndexedDB cache.`
        );
        if (!ok) {
            await render('Model module clear canceled.');
            return;
        }

        await clearModelModuleCache();
        await render('Model module cache cleared.');
    });

    window.addEventListener('owz:scene-model-cache', () => render());
    render();
}

