/**
 * 场景建筑首屏门控
 * ========
 * 目标：
 * 1. 若完整缓存已存在，就先把建筑加载完，再渲染地面和主角；
 * 2. 若本地没有完整缓存，就只给建筑加载 1 秒窗口；
 * 3. 1 秒内没完成，则先放行首屏，其余建筑继续后台补齐。
 */

import { getApiBase } from '../signboard_lab/config.js';
import { hasCompleteSceneModelCache } from './scene_cache.js';
import sceneModelLoader from './scene_model_loader.js';

const DEFAULT_TIMEOUT_MS = 1000;

/**
 * 小型延时器，专门给首屏门控 race 使用。
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 从当前世界 API 推导 scene-config 地址。
 */
function getSceneConfigUrl() {
    return new URL(`${getApiBase()}/scene-config`, window.location.origin).href;
}

/**
 * 统一决定 scene_model_loader 与首屏渲染的先后关系。
 */
export async function createSceneModelBootGate(ccgxkObj, options = {}) {
    const timeoutMs = Number(options.timeoutMs) || DEFAULT_TIMEOUT_MS;
    const sceneConfigUrl = getSceneConfigUrl();
    const hasFullCache = await hasCompleteSceneModelCache(sceneConfigUrl);
    console.info(`[scene_boot_gate] full-cache: ${hasFullCache ? 'yes' : 'no'}`);
    const loadPromise = sceneModelLoader(ccgxkObj);

    if (hasFullCache) {
        await loadPromise;
        console.info('[scene_boot_gate] path: cache-blocking');
        return {
            mode: 'cache-blocking',
            backgroundTask: Promise.resolve(),
        };
    }

    const winner = await Promise.race([
        loadPromise.then(() => 'loaded'),
        delay(timeoutMs).then(() => 'timeout'),
    ]);

    if (winner === 'loaded') {
        console.info(`[scene_boot_gate] path: loaded-within-${timeoutMs}ms`);
        return {
            mode: 'network-finished-before-timeout',
            backgroundTask: Promise.resolve(),
        };
    }

    console.info(`[scene_boot_gate] path: timeout-${timeoutMs}ms-then-background`);
    return {
        mode: 'timeout-background',
        backgroundTask: loadPromise,
    };
}
