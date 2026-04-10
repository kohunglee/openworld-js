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
const DEFAULT_ADDRESS = '127.0.0.1:8899';  // 默认地址

/**
 * 获取 API 的基 URL
 * 
 * 动态从 localStorage 读取
 */
export function getApiBase() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored || 'http://' + DEFAULT_ADDRESS;
}

// 向后兼容：导出 API_BASE（首次加载时的值）
export const API_BASE = getApiBase();