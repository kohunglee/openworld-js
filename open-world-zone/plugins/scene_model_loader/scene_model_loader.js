/**
 * 场景模型加载器
 *
 * 这一版按新的目标重做：
 * 1. 世界总配置永远从“当前已连接的世界 API”推导；
 * 2. `scene-config` 只是一条子接口，不再单独记住另一份地址；
 * 3. 模型位置只由总配置决定，模型包内部不再偷偷决定摆放位置。
 */

import { getApiBase } from '../signboard_lab/config.js';
import { loadModelModule, loadSceneConfigText } from './scene_cache.js';
/**
 * 读取 JSON 配置。
 * 后面切 SaaS 时，这里可以直接换成真实接口返回值。
 */
async function readJson(url, label) {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`${label} 读取失败：${res.status} ${res.statusText}`);
    }
    return res.json();
}

/**
 * 规范位置对象。
 * 现在场景协议只认 position.xyz，缺失时默认补 0。
 */
function normalizePosition(position) {
    return {
        x: Number.isFinite(position?.x) ? position.x : 0,
        y: Number.isFinite(position?.y) ? position.y : 0,
        z: Number.isFinite(position?.z) ? position.z : 0,
    };
}

/**
 * 场景配置永远跟随当前世界服务器。
 * 这里不再保存独立 scene-config 地址，也不再允许另一套来源覆盖它。
 */
function getSceneConfigUrl() {
    return new URL(`${getApiBase()}/scene-config`, window.location.origin).href;
}

/**
 * 解析模型入口 URL。
 *
 * 当前协议：
 * 1. `scene-config.json` 顶层先声明 `models` 注册表。
 * 2. 每个建筑实例只写 `model` 简写 key。
 * 3. 前端再从注册表里取出最终 URL。
 */
function resolveModelEntryUrl(model, models, sceneUrl) {
    const modelKey = typeof model === 'string' ? model.trim() : '';
    if (!modelKey) {
        throwFatalSceneConfigError('存在建筑缺少 model 字段，项目已终止加载。', { model });
    }

    const modelUrl = typeof models?.[modelKey] === 'string' ? models[modelKey].trim() : '';
    if (!modelUrl) {
        throwFatalSceneConfigError(`模型 key "${modelKey}" 没有在 scene-config 的 models 注册表里声明。`, {
            modelKey,
            models,
        });
    }

    return new URL(modelUrl, sceneUrl).href;
}

/**
 * 并发调度器。
 * 这里把建筑加载限制在固定并发数，避免一次把浏览器和本地静态服务同时打满。
 */
async function runWithConcurrencyLimit(items, limit, worker) {
    const queue = [...items];
    const workerCount = Math.max(1, Number(limit) || 1);
    const runners = Array.from({ length: Math.min(workerCount, queue.length) }, async () => {
        while (queue.length > 0) {
            const nextItem = queue.shift();
            if (!nextItem) return;
            await worker(nextItem);
        }
    });
    await Promise.all(runners);
}

/**
 * 解析建筑实例的建筑名。
 *
 * 当前规则：
 * 1. 优先使用 scene-config 里显式声明的 buildingName。
 * 2. 如果没写，就视为“无名建筑”。
 */
function resolveBuildingName(building) {
    return typeof building?.buildingName === 'string' ? building.buildingName.trim() : '';
}

/**
 * 这是一个致命错误处理器。
 *
 * buildingName / 无名实例规则一旦冲突，前端不能偷偷补后缀，否则会和服务器里的内容主键冲突。
 * 所以这里必须：
 * 1. 控制台报错
 * 2. 弹窗报错
 * 3. 直接抛异常终止场景加载
 */
function throwFatalSceneConfigError(message, detail = {}) {
    console.error('[scene_model_loader] 致命配置错误：' + message, detail);
    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
        window.alert(message);
    }
    throw new Error(message);
}

/**
 * 读取场景总配置。
 * 约定字段尽量极简，后端 SaaS 对接时也更省心。
 */
async function loadSceneConfig() {
    // 性能埋点：总配置读取耗时（含 fetch + json parse）
    const loadTimerLabel = '[scene_model_loader] loadSceneConfig(total)';
    console.time(loadTimerLabel);
    const sceneUrl = getSceneConfigUrl();
    const sceneConfigPayload = await loadSceneConfigText(sceneUrl);
    let sceneData;

    try {
        sceneData = JSON.parse(sceneConfigPayload.text);
    } catch (error) {
        console.error('[scene_model_loader] scene-config cache parse failed:', error);
        sceneData = await readJson(sceneUrl, 'scene-config');
    }

    const buildings = Array.isArray(sceneData?.buildings) ? sceneData.buildings : [];
    const models = sceneData && typeof sceneData.models === 'object' ? sceneData.models : {};
    console.info(
        `[scene_model_loader] scene-config source: ${sceneConfigPayload.fromCache ? 'IndexedDB cache' : 'network'}`
    );
    console.timeEnd(loadTimerLabel);
    return { sceneUrl, sceneData, buildings, models };
}

/**
 * 在真正加载建筑前，先校验全场景的 buildingName 和无名实例规则。
 *
 * 这是服务器内容映射的主键之一，不能容忍重复。
 */
function validateBuildingNames(buildings, models, sceneUrl) {
    // 性能埋点：配置校验耗时（含唯一性检查 + model URL 解析）
    const validateTimerLabel = '[scene_model_loader] validateBuildingNames(total)';
    console.time(validateTimerLabel);
    const namedUsed = new Map();
    const unnamedModelUsed = new Map();

    for (const building of buildings) {
        if (building?.enabled === false) continue;

        const id = String(building?.id || '').trim();
        const buildingName = resolveBuildingName(building);
        const model = String(building?.model || '').trim();

        if (!id) {
            throwFatalSceneConfigError('scene-config 中存在缺少 id 的建筑配置，项目已终止加载。', {
                building,
            });
        }

        if (!model) {
            throwFatalSceneConfigError(`建筑 ${id} 缺少 model，项目已终止加载。`, {
                building,
            });
        }

        const resolvedModelUrl = resolveModelEntryUrl(model, models, sceneUrl);

        // 有建筑名：全服务器范围内必须唯一，和模型无关。
        if (buildingName) {
            const previous = namedUsed.get(buildingName);
            if (previous) {
                throwFatalSceneConfigError(
                    `检测到重复的 buildingName: "${buildingName}"。`
                    + ` 它同时出现在建筑 "${previous.id}" 和 "${id}" 中。`
                    + ' buildingName 在同一个服务器里必须唯一，请先修正服务器配置后再刷新。',
                    { previous, current: building }
                );
            }
            namedUsed.set(buildingName, building);
            continue;
        }

        // 无建筑名：为了兼容老代码，一个模型在同一个服务器里只允许出现一次无名实例。
        const previousUnnamed = unnamedModelUsed.get(resolvedModelUrl);
        if (previousUnnamed) {
            throwFatalSceneConfigError(
                `模型 "${resolvedModelUrl}" 出现了多个无 buildingName 的建筑实例。`
                + ` 当前冲突建筑为 "${previousUnnamed.id}" 和 "${id}"。`
                + ' 为了兼容老画板 key（如 testSign12），同一个模型在同一服务器里只允许一个无名实例；'
                + ' 如果要再放第二个同模型建筑，必须给其中一个设置 buildingName。',
                { previous: previousUnnamed, current: building }
            );
        }
        unnamedModelUsed.set(resolvedModelUrl, building);
    }
    console.timeEnd(validateTimerLabel);
}

/**
 * 加载某个模型入口，并执行它导出的默认渲染函数。
 * 这里传进去的 runtimeContext，就是未来 SaaS 最关心的那层“实例信息”。
 */
async function renderBuilding(ccgxkObj, building, models, sceneUrl) {
    const id = building?.id;
    const model = building?.model;
    const buildingName = resolveBuildingName(building);
    const buildingTimerLabel = `[scene_model_loader] building(${String(id || 'unknown')}) total`;

    if (!id) {
        console.error('[scene_model_loader] 跳过一条建筑配置：缺少 id', building);
        return;
    }
    if (!model) {
        console.error(`[scene_model_loader] 跳过建筑 ${id}：缺少 model`);
        return;
    }

    try {
        // 性能埋点：单建筑总耗时（import + render）
        console.time(buildingTimerLabel);
        const entryUrl = resolveModelEntryUrl(model, models, sceneUrl);
        const importTimerLabel = `[scene_model_loader] building(${id}) import`;
        console.time(importTimerLabel);
        const mod = await loadModelModule(entryUrl);
        console.timeEnd(importTimerLabel);
        const renderModel = mod?.default;

        if (typeof renderModel !== 'function') {
            throw new Error('index.js 默认导出不是函数');
        }

        const renderTimerLabel = `[scene_model_loader] building(${id}) renderModel`;
        console.time(renderTimerLabel);
        await renderModel(ccgxkObj, {
            id,
            modelUrl: entryUrl,
            buildingName,
            position: normalizePosition(building.position),
            enabled: building.enabled !== false,
        });
        console.timeEnd(renderTimerLabel);
        console.timeEnd(buildingTimerLabel);
    } catch (error) {
        // 异常路径也收尾，避免控制台里出现未结束计时器。
        try {
            console.timeEnd(buildingTimerLabel);
        } catch (_) {}
        console.error(`[scene_model_loader] 建筑加载失败，已跳过：${id}`, error);
    }
}

/**
 * 主入口：
 * 1. 读取总配置；
 * 2. 按配置逐个加载 CDN 模型包；
 * 3. 模型包内部只管“怎么渲染这个模型”，不再管“放在哪里”。
 */
export default async function sceneModelLoader(ccgxkObj) {
    // 性能埋点：整次场景模型加载总耗时
    const sceneTimerLabel = '[scene_model_loader] sceneModelLoader(total)';
    console.time(sceneTimerLabel);
    try {
        const { sceneUrl, sceneData, buildings, models } = await loadSceneConfig();
        validateBuildingNames(buildings, models, sceneUrl);

        window.owzSceneConfig = {
            sceneUrl,
            sceneName: sceneData?.sceneName || 'unnamed-scene',
            buildingCount: buildings.length,
        };

        const enabledBuildings = buildings.filter(building => building?.enabled !== false);
        await runWithConcurrencyLimit(enabledBuildings, 8, building =>
            renderBuilding(ccgxkObj, building, models, sceneUrl)
        );
        console.timeEnd(sceneTimerLabel);
    } catch (error) {
        try {
            console.timeEnd(sceneTimerLabel);
        } catch (_) {}
        console.error('[scene_model_loader] 场景总配置加载失败，本次将只保留空白场景。', error);
        throw error;
    }
}
