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
const DEFAULT_ADDRESS = 'https://openworld.zone/owz-serverapi';  // 默认地址

/**
 * 规范化服务器地址。
 * 需求约定：完整 URL 参与隔离，但末尾多余的 / 一律忽略。
 */
export function normalizeApiBase(address) {
    const normalized = String(address || '').trim();
    if (!normalized) return DEFAULT_ADDRESS;
    return normalized.replace(/\/+$/, '');
}

// 获取 API 的 base URL
export function getApiBase() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return normalizeApiBase(stored || DEFAULT_ADDRESS);
}

// 向后兼容：导出 API_BASE（首次加载时的值）
export const API_BASE = getApiBase();

// 生成图片元素的唯一 DOM ID
export const makeImgId = (index, id) => `dyn_img_${index}_${id}`;
