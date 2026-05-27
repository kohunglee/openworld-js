/**
 * 场景模型加载器
 *
 * 这一版按新的目标重做：
 * 1. `temp/scene-config.json` 只负责“总配置”。
 * 2. `temp/cdn/.../index.js` 负责“模型整包逻辑”。
 * 3. 模型位置只由总配置决定，模型包内部不再偷偷决定摆放位置。
 */

const DEFAULT_SCENE_CONFIG_URL = new URL('../../temp/scene-config.json', import.meta.url);
const SCENE_CONFIG_STORAGE_KEY = 'owz_scene_config_url';
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
 * 读取本次要使用的总配置地址。
 * 优先级：
 * 1. query 参数仍保留给 manage2/Open Preview 这类临时调试入口；
 * 2. Tab Save 验证通过后写入的世界配置地址；
 * 3. 本地默认 temp 配置。
 */
function getSceneConfigUrl() {
    const raw = new URLSearchParams(window.location.search).get('sceneConfig');
    if (raw) return new URL(raw, window.location.href).href;

    const stored = localStorage.getItem(SCENE_CONFIG_STORAGE_KEY);
    if (stored) return new URL(stored, window.location.href).href;

    return DEFAULT_SCENE_CONFIG_URL.href;
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
    const sceneUrl = getSceneConfigUrl();
    const sceneData = await readJson(sceneUrl, 'scene-config');
    const buildings = Array.isArray(sceneData?.buildings) ? sceneData.buildings : [];
    const models = sceneData && typeof sceneData.models === 'object' ? sceneData.models : {};
    return { sceneUrl, sceneData, buildings, models };
}

/**
 * 在真正加载建筑前，先校验全场景的 buildingName 和无名实例规则。
 *
 * 这是服务器内容映射的主键之一，不能容忍重复。
 */
function validateBuildingNames(buildings, models, sceneUrl) {
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
}

/**
 * 加载某个模型入口，并执行它导出的默认渲染函数。
 * 这里传进去的 runtimeContext，就是未来 SaaS 最关心的那层“实例信息”。
 */
async function renderBuilding(ccgxkObj, building, models, sceneUrl) {
    const id = building?.id;
    const model = building?.model;
    const buildingName = resolveBuildingName(building);

    if (!id) {
        console.error('[scene_model_loader] 跳过一条建筑配置：缺少 id', building);
        return;
    }
    if (!model) {
        console.error(`[scene_model_loader] 跳过建筑 ${id}：缺少 model`);
        return;
    }

    try {
        const entryUrl = resolveModelEntryUrl(model, models, sceneUrl);
        const mod = await import(entryUrl);
        const renderModel = mod?.default;

        if (typeof renderModel !== 'function') {
            throw new Error('index.js 默认导出不是函数');
        }

        await renderModel(ccgxkObj, {
            id,
            modelUrl: entryUrl,
            buildingName,
            position: normalizePosition(building.position),
            enabled: building.enabled !== false,
        });
    } catch (error) {
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
    try {
        const { sceneUrl, sceneData, buildings, models } = await loadSceneConfig();
        validateBuildingNames(buildings, models, sceneUrl);

        window.owzSceneConfig = {
            sceneUrl,
            sceneName: sceneData?.sceneName || 'unnamed-scene',
            buildingCount: buildings.length,
        };

        for (const building of buildings) {
            if (building?.enabled === false) continue;
            await renderBuilding(ccgxkObj, building, models, sceneUrl);
        }
    } catch (error) {
        console.error('[scene_model_loader] 场景总配置加载失败，本次将只保留空白场景。', error);
        throw error;
    }
}
