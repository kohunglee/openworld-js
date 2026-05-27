/**
 * 场景模型加载器
 *
 * 这一版按新的目标重做：
 * 1. `temp/scene-config.json` 只负责“总配置”。
 * 2. `temp/cdn/.../index.js` 负责“模型整包逻辑”。
 * 3. 模型位置只由总配置决定，模型包内部不再偷偷决定摆放位置。
 */

const DEFAULT_SCENE_CONFIG_URL = new URL('../../temp/scene-config.json', import.meta.url);
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
 * 支持通过 query 参数临时切换总配置文件。
 * 这样本地可以模拟不同 server 的场景，而不需要反复改源码。
 */
function getSceneConfigUrl() {
    const raw = new URLSearchParams(window.location.search).get('sceneConfig');
    if (!raw) return DEFAULT_SCENE_CONFIG_URL.href;
    return new URL(raw, window.location.href).href;
}

/**
 * 解析模型入口 URL。
 *
 * 现在总配置里直接写 `modelUrl`，
 * 所以前端不再帮忙拼 modelName，也不再依赖固定目录规则。
 */
function resolveModelEntryUrl(modelUrl, sceneUrl) {
    return new URL(modelUrl, sceneUrl).href;
}

/**
 * 读取场景总配置。
 * 约定字段尽量极简，后端 SaaS 对接时也更省心。
 */
async function loadSceneConfig() {
    const sceneUrl = getSceneConfigUrl();
    const sceneData = await readJson(sceneUrl, 'scene-config');
    const buildings = Array.isArray(sceneData?.buildings) ? sceneData.buildings : [];
    return { sceneUrl, sceneData, buildings };
}

/**
 * 加载某个模型入口，并执行它导出的默认渲染函数。
 * 这里传进去的 runtimeContext，就是未来 SaaS 最关心的那层“实例信息”。
 */
async function renderBuilding(ccgxkObj, building, sceneUrl) {
    const id = building?.id;
    const modelUrl = building?.modelUrl;

    if (!id) {
        console.error('[scene_model_loader] 跳过一条建筑配置：缺少 id', building);
        return;
    }
    if (!modelUrl) {
        console.error(`[scene_model_loader] 跳过建筑 ${id}：缺少 modelUrl`);
        return;
    }

    try {
        const entryUrl = resolveModelEntryUrl(modelUrl, sceneUrl);
        const mod = await import(entryUrl);
        const renderModel = mod?.default;

        if (typeof renderModel !== 'function') {
            throw new Error('index.js 默认导出不是函数');
        }

        await renderModel(ccgxkObj, {
            id,
            modelUrl: entryUrl,
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
        const { sceneUrl, sceneData, buildings } = await loadSceneConfig();

        window.owzSceneConfig = {
            sceneUrl,
            sceneName: sceneData?.sceneName || 'unnamed-scene',
            buildingCount: buildings.length,
        };

        for (const building of buildings) {
            if (building?.enabled === false) continue;
            await renderBuilding(ccgxkObj, building, sceneUrl);
        }
    } catch (error) {
        console.error('[scene_model_loader] 场景总配置加载失败，本次将只保留空白场景。', error);
    }
}
