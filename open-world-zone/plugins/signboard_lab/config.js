/**
 * 配置（全局变量）
 */

export const THEME = {
    bgWhite: '#ffffff',
    bgWarn: '#ff0000',
    textDark: '#2c3e50',
    fontFamily: 'monospace ,"Microsoft YaHei", sans-serif',
    paddingRatio: 0.06  // 内边距占宽度的比例
};

// 服务器地址存储 key
const STORAGE_KEY = 'signboard_server_address';
const DEFAULT_ADDRESS = '/owz-serverapi';  // 默认始终跟随当前站点域名
const WORLD_SHARE_PREFIX = '/w/';

/**
 * 解析当前路径里的分享 slug。
 * 例如：/w/oliver-first -> oliver-first
 */
function getWorldShareSlugFromPath(pathname = window.location.pathname) {
    const normalizedPath = String(pathname || '').trim();
    if (!normalizedPath.startsWith(WORLD_SHARE_PREFIX)) return '';

    const slug = normalizedPath.slice(WORLD_SHARE_PREFIX.length).split('/')[0] || '';
    return decodeURIComponent(slug).trim().toLowerCase();
}

/**
 * 判断当前页面是不是“用户分享世界”入口。
 * 这里只看 URL path，不依赖 query，避免以后扩展坐标参数时互相影响。
 */
export function isWorldShareRoute(pathname = window.location.pathname) {
    return Boolean(getWorldShareSlugFromPath(pathname));
}

/**
 * 规范化服务器地址。
 * 需求约定：完整 URL 参与隔离，但末尾多余的 / 一律忽略。
 */
export function normalizeApiBase(address) {
    const normalized = String(address || '').trim();
    if (!normalized) return DEFAULT_ADDRESS;
    return normalized.replace(/\/+$/, '');
}

/**
 * 读取用户手动保存的服务器地址。
 * 这份地址只属于“通用入口 /World”那种模式，不应该被分享链接永久污染。
 */
export function getStoredApiBase() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return normalizeApiBase(stored || DEFAULT_ADDRESS);
}

/**
 * 设置当前页面的运行时服务器地址。
 * 只影响本次页面生命周期，不写回 localStorage。
 */
export function setRuntimeApiBase(address) {
    window.__OWZ_RUNTIME_API_BASE__ = normalizeApiBase(address);
}

/**
 * 读取当前页面的运行时服务器地址。
 * 如果没有分享页注入，就返回空串，让调用方继续回退到 localStorage。
 */
export function getRuntimeApiBase() {
    const runtimeValue = String(window.__OWZ_RUNTIME_API_BASE__ || '').trim();
    if (!runtimeValue) return '';
    return normalizeApiBase(runtimeValue);
}

/**
 * 分享页启动前，先用 slug 向 SaaS 后端解析真正的世界 API。
 * 这样 `/w/oliver-first` 就能直接连上 `/owzapi/8/oliver-first`。
 */
export async function primeRuntimeApiBaseFromSharePath() {
    const slug = getWorldShareSlugFromPath();
    if (!slug) return '';

    const response = await fetch(`/wapi/${encodeURIComponent(slug)}`, { cache: 'no-store' });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`World share resolve failed: ${response.status} ${errorText}`);
    }

    const payload = await response.json();
    const resolvedApiBase = normalizeApiBase(payload?.apiUrl);
    if (!resolvedApiBase) {
        throw new Error('World share resolve failed: apiUrl missing.');
    }

    setRuntimeApiBase(resolvedApiBase);
    return resolvedApiBase;
}

// 获取 API 的 base URL
export function getApiBase() {
    if (isWorldShareRoute()) {
        const runtimeApiBase = getRuntimeApiBase();
        if (runtimeApiBase) return runtimeApiBase;
    }

    return getStoredApiBase();
}

// 向后兼容：导出 API_BASE（首次加载时的值）
export const API_BASE = getApiBase();

// 生成图片元素的唯一 DOM ID
export const makeImgId = (index, id) => `dyn_img_${index}_${id}`;
