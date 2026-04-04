/**
 * 信息板配置
 *
 * 定义一些全局变量
 */

export const THEME = {
    bgWhite: '#ffffff',
    bgWarn: '#ff0000',
    textDark: '#2c3e50',
    fontFamily: '"Microsoft YaHei", sans-serif',
    paddingRatio: 0.1  // 内边距占宽度的比例 (10%)
};

// 服务器地址存储 key
const STORAGE_KEY = 'signboard_server_address';
const DEFAULT_ADDRESS = '127.0.0.1:8899';

/**
 * 获取 API 基础 URL（动态从 localStorage 读取）
 * 手动配置完整地址（含协议）
 */
export function getApiBase() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored || 'http://' + DEFAULT_ADDRESS;
}

// 向后兼容：导出 API_BASE（首次加载时的值）
export const API_BASE = getApiBase();
