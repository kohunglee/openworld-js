/**
 * 场景模型缓存
 * ========
 * 专门负责：
 * 1. 把 scene-config 和模型入口 index.js 放进 IndexedDB；
 * 2. 首次有缓存时优先本地命中，减少二次打开等待；
 * 3. 后台静默检查网络新版本，但不阻塞当前渲染。
 */

const DB_NAME = 'owz_scene_model_cache';
const DB_VERSION = 1;
const SCENE_CONFIG_STORE = 'scene_configs';
const MODEL_MODULE_STORE = 'model_modules';
const RELATIVE_MODULE_RE = /((?:import|export)\s+(?:[^'";]*?\s+from\s+)?)(['"])(\.{1,2}\/[^'"]+)\2/g;

const sceneRefreshTasks = new Map();
const modelRefreshTasks = new Map();
const modulePromiseCache = new Map();

let dbPromise = null;

/**
 * 统一广播缓存状态变化，方便 Tab 面板无耦合刷新。
 */
function emitSceneCacheEvent(type, detail = {}) {
    const payload = {
        type,
        time: Date.now(),
        ...detail,
    };
    window.owzSceneModelCacheStatus = payload;
    window.dispatchEvent(new CustomEvent('owz:scene-model-cache', { detail: payload }));
}

/**
 * 估算文本体积。
 * 这里按 UTF-8 字节数估算，足够用来展示缓存占用。
 */
function getTextByteSize(text) {
    return new TextEncoder().encode(String(text || '')).length;
}

/**
 * 打开缓存数据库。
 * 复用 Promise，避免多个并发加载阶段重复 open。
 */
function openDb() {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;

            if (!db.objectStoreNames.contains(SCENE_CONFIG_STORE)) {
                const sceneStore = db.createObjectStore(SCENE_CONFIG_STORE, { keyPath: 'cacheKey' });
                sceneStore.createIndex('updatedAt', 'updatedAt', { unique: false });
            }

            if (!db.objectStoreNames.contains(MODEL_MODULE_STORE)) {
                const modelStore = db.createObjectStore(MODEL_MODULE_STORE, { keyPath: 'cacheKey' });
                modelStore.createIndex('updatedAt', 'updatedAt', { unique: false });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error('Scene cache DB open failed'));
    });

    return dbPromise;
}

/**
 * 统一执行一次对象仓库事务。
 */
async function runStore(storeName, mode, executor) {
    const db = await openDb();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        let resultValue;

        tx.oncomplete = () => resolve(resultValue);
        tx.onerror = () => reject(tx.error || new Error(`IndexedDB ${storeName} transaction failed`));
        tx.onabort = () => reject(tx.error || new Error(`IndexedDB ${storeName} transaction aborted`));

        const request = executor(store);
        if (request && typeof request === 'object' && 'onsuccess' in request) {
            request.onsuccess = () => {
                resultValue = request.result;
            };
            request.onerror = () => reject(request.error || new Error(`IndexedDB ${storeName} request failed`));
        } else {
            resultValue = request;
        }
    });
}

/**
 * 构造标准缓存行，保持两个仓库结构尽量一致。
 */
function createCacheRow(cacheKey, text) {
    return {
        cacheKey,
        text: String(text || ''),
        byteSize: getTextByteSize(text),
        updatedAt: Date.now(),
    };
}

/**
 * 读取某一条缓存记录。
 */
async function getCacheRow(storeName, cacheKey) {
    return (await runStore(storeName, 'readonly', store => store.get(cacheKey))) || null;
}

/**
 * 覆盖写入某一条缓存记录。
 */
async function putCacheRow(storeName, cacheKey, text) {
    const row = createCacheRow(cacheKey, text);
    await runStore(storeName, 'readwrite', store => store.put(row));
    return row;
}

/**
 * 删除某一条缓存记录。
 */
async function deleteCacheRow(storeName, cacheKey) {
    await runStore(storeName, 'readwrite', store => store.delete(cacheKey));
}

/**
 * 拉取纯文本资源。
 * scene-config 和模型模块都统一走这里，方便缓存前落地原始文本。
 */
async function fetchText(url, label) {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`${label} 读取失败：${res.status} ${res.statusText}`);
    }
    return res.text();
}

/**
 * 缓存命中优先；随后后台静默检查 scene-config 是否变化。
 */
export async function loadSceneConfigText(sceneUrl) {
    const cached = await getCacheRow(SCENE_CONFIG_STORE, sceneUrl);
    if (cached?.text) {
        void refreshSceneConfigInBackground(sceneUrl);
        return {
            text: cached.text,
            fromCache: true,
            updatedAt: cached.updatedAt || null,
        };
    }

    const text = await fetchText(sceneUrl, 'scene-config');
    await putCacheRow(SCENE_CONFIG_STORE, sceneUrl, text);
    emitSceneCacheEvent('scene-config-updated', { sceneUrl });
    return {
        text,
        fromCache: false,
        updatedAt: Date.now(),
    };
}

/**
 * 只用本地缓存判断某个模型模块图是否完整。
 * 这里不会发任何网络请求，专门给首屏门控逻辑使用。
 */
async function hasCachedModelModuleGraph(entryUrl, visited = new Set()) {
    if (visited.has(entryUrl)) return true;
    visited.add(entryUrl);

    const cached = await getCacheRow(MODEL_MODULE_STORE, entryUrl);
    if (!cached?.text) return false;

    const relativeSpecs = extractRelativeModuleSpecifiers(cached.text);
    for (const specifier of relativeSpecs) {
        const childUrl = new URL(specifier, entryUrl).href;
        const hasChild = await hasCachedModelModuleGraph(childUrl, visited);
        if (!hasChild) return false;
    }

    return true;
}

/**
 * 判断“当前场景是否已具备完整本地缓存”。
 * 规则：
 * 1. scene-config 必须存在；
 * 2. 当前场景所有启用建筑对应的模型模块图都必须完整存在。
 */
export async function hasCompleteSceneModelCache(sceneUrl) {
    const cached = await getCacheRow(SCENE_CONFIG_STORE, sceneUrl);
    if (!cached?.text) return false;

    let sceneData = null;
    try {
        sceneData = JSON.parse(cached.text);
    } catch {
        return false;
    }

    const buildings = Array.isArray(sceneData?.buildings) ? sceneData.buildings : [];
    const models = sceneData && typeof sceneData.models === 'object' && sceneData.models !== null
        ? sceneData.models
        : {};

    for (const building of buildings) {
        if (building?.enabled === false) continue;

        const modelKey = typeof building?.model === 'string' ? building.model.trim() : '';
        const modelUrl = typeof models?.[modelKey] === 'string' ? models[modelKey].trim() : '';
        if (!modelKey || !modelUrl) return false;

        const entryUrl = new URL(modelUrl, sceneUrl).href;
        const hasModuleGraph = await hasCachedModelModuleGraph(entryUrl);
        if (!hasModuleGraph) return false;
    }

    return true;
}

/**
 * 后台静默刷新 scene-config。
 * 同一个 URL 只允许一个刷新任务，避免并发打爆服务端。
 */
async function refreshSceneConfigInBackground(sceneUrl) {
    if (sceneRefreshTasks.has(sceneUrl)) return sceneRefreshTasks.get(sceneUrl);

    const task = (async () => {
        try {
            const text = await fetchText(sceneUrl, 'scene-config');
            await putCacheRow(SCENE_CONFIG_STORE, sceneUrl, text);
            emitSceneCacheEvent('scene-config-updated', { sceneUrl });
        } catch (error) {
            console.warn('[scene_model_loader] scene-config background refresh failed:', error);
        } finally {
            sceneRefreshTasks.delete(sceneUrl);
        }
    })();

    sceneRefreshTasks.set(sceneUrl, task);
    return task;
}

/**
 * 提取相对 JS 依赖。
 * 这里只处理 `./xx.js` / `../xx.js` 这种本地模块，外链和绝对地址保持不动。
 */
function extractRelativeModuleSpecifiers(text) {
    const specs = new Set();
    const source = String(text || '');
    let match = null;

    RELATIVE_MODULE_RE.lastIndex = 0;
    while ((match = RELATIVE_MODULE_RE.exec(source))) {
        specs.add(match[3]);
    }

    return [...specs];
}

/**
 * 递归读取某个模型模块图。
 * 入口文件、data.js、full_state.js、constants.js 这类本地 JS 依赖都统一缓存起来。
 */
async function collectModelModuleGraph(entryUrl, graph = new Map()) {
    if (graph.has(entryUrl)) return graph;

    const cached = await getCacheRow(MODEL_MODULE_STORE, entryUrl);
    let text = '';

    if (cached?.text) {
        text = cached.text;
        void refreshModelModuleInBackground(entryUrl);
    } else {
        text = await fetchText(entryUrl, `model module ${entryUrl}`);
        await putCacheRow(MODEL_MODULE_STORE, entryUrl, text);
        emitSceneCacheEvent('model-module-updated', { entryUrl });
    }

    graph.set(entryUrl, text);

    const relativeSpecs = extractRelativeModuleSpecifiers(text);
    for (const spec of relativeSpecs) {
        const childUrl = new URL(spec, entryUrl).href;
        await collectModelModuleGraph(childUrl, graph);
    }

    return graph;
}

/**
 * 把缓存好的模块图重写成一组 blob URL，并保持相对依赖关系。
 * 这样就算命中 IndexedDB，本地模块之间的 `./data.js` 依赖仍然可用。
 */
async function importModuleGraphFromCache(entryUrl, graph) {
    const blobUrlMap = new Map();
    const importedBlobUrls = [];

    function getBlobUrl(moduleUrl) {
        if (blobUrlMap.has(moduleUrl)) return blobUrlMap.get(moduleUrl);

        const rawSource = graph.get(moduleUrl);
        if (typeof rawSource !== 'string') {
            throw new Error(`Cached module missing: ${moduleUrl}`);
        }

        const rewrittenSource = rawSource.replace(
            RELATIVE_MODULE_RE,
            (full, prefix, quote, specifier) => {
                const childUrl = new URL(specifier, moduleUrl).href;
                const childBlobUrl = getBlobUrl(childUrl);
                return `${prefix}${quote}${childBlobUrl}${quote}`;
            }
        );

        const finalSource = `${rewrittenSource}\n//# sourceURL=${moduleUrl}`;
        const blobUrl = URL.createObjectURL(new Blob([finalSource], { type: 'text/javascript' }));
        blobUrlMap.set(moduleUrl, blobUrl);
        importedBlobUrls.push(blobUrl);
        return blobUrl;
    }

    try {
        const rootBlobUrl = getBlobUrl(entryUrl);
        return await import(/* @vite-ignore */ rootBlobUrl);
    } finally {
        for (const blobUrl of importedBlobUrls) {
            URL.revokeObjectURL(blobUrl);
        }
    }
}

/**
 * 模型模块优先命中内存，再命中 IndexedDB，最后才回网络。
 * 同页重复实例会直接复用已解析模块，不再重复处理模块图。
 */
export async function loadModelModule(entryUrl) {
    if (modulePromiseCache.has(entryUrl)) {
        return modulePromiseCache.get(entryUrl);
    }

    const task = (async () => {
        try {
            const graph = await collectModelModuleGraph(entryUrl);
            return await importModuleGraphFromCache(entryUrl, graph);
        } catch (error) {
            console.warn('[scene_model_loader] cached model graph failed, retrying network import:', entryUrl, error);
            await deleteCacheRow(MODEL_MODULE_STORE, entryUrl);
            const mod = await import(/* @vite-ignore */ entryUrl);

            // 网络兜底成功后，仍然静默把入口重新拉回缓存，为下一次打开做准备。
            void refreshModelModuleInBackground(entryUrl);
            return mod;
        }
    })();

    modulePromiseCache.set(entryUrl, task);
    return task;
}

/**
 * 后台静默刷新模型模块文本。
 * 入口文件和它依赖的相对 JS 都一起更新，保证下一次打开时缓存图谱是完整的。
 */
async function refreshModelModuleInBackground(entryUrl) {
    if (modelRefreshTasks.has(entryUrl)) return modelRefreshTasks.get(entryUrl);

    const task = (async () => {
        try {
            const text = await fetchText(entryUrl, `model module ${entryUrl}`);
            await putCacheRow(MODEL_MODULE_STORE, entryUrl, text);
            emitSceneCacheEvent('model-module-updated', { entryUrl });

            const relativeSpecs = extractRelativeModuleSpecifiers(text);
            await Promise.all(
                relativeSpecs.map(specifier =>
                    refreshModelModuleInBackground(new URL(specifier, entryUrl).href)
                )
            );
        } catch (error) {
            console.warn('[scene_model_loader] model background refresh failed:', entryUrl, error);
        } finally {
            modelRefreshTasks.delete(entryUrl);
        }
    })();

    modelRefreshTasks.set(entryUrl, task);
    return task;
}

/**
 * 读取缓存统计信息。
 * 第一版直接扫描两个仓库求和，便于先把“体积感知”和清理入口做出来。
 */
export async function getSceneModelCacheStats() {
    const [sceneRows, modelRows] = await Promise.all([
        runStore(SCENE_CONFIG_STORE, 'readonly', store => store.getAll()),
        runStore(MODEL_MODULE_STORE, 'readonly', store => store.getAll()),
    ]);

    const sceneConfigBytes = (sceneRows || []).reduce((sum, row) => sum + Number(row?.byteSize || 0), 0);
    const modelModuleBytes = (modelRows || []).reduce((sum, row) => sum + Number(row?.byteSize || 0), 0);

    return {
        sceneConfigCount: (sceneRows || []).length,
        sceneConfigBytes,
        modelModuleCount: (modelRows || []).length,
        modelModuleBytes,
        totalBytes: sceneConfigBytes + modelModuleBytes,
    };
}

/**
 * 单独清空 scene-config 缓存。
 */
export async function clearSceneConfigCache() {
    await runStore(SCENE_CONFIG_STORE, 'readwrite', store => store.clear());
    emitSceneCacheEvent('scene-config-cleared');
}

/**
 * 单独清空模型模块缓存。
 * 同时把本页内存去重表一起清空，保证后续 reload 前后行为一致。
 */
export async function clearModelModuleCache() {
    await runStore(MODEL_MODULE_STORE, 'readwrite', store => store.clear());
    modulePromiseCache.clear();
    emitSceneCacheEvent('model-module-cleared');
}
