/**
 * Tab 开发模式开关
 * ==================
 * 只管理当前浏览器里的开发模式状态：
 * - localStorage 负责刷新后记住开关
 * - ccgxkObj.isDevMode 负责把状态暴露给其他插件临时读取
 * - Tab 面板加 tab-dev-mode 类后，由 tab.js 里的 CSS 变成红色背景
 */

const STORAGE_KEY = 'openworld_tab_dev_mode_enabled';

/**
 * 读取本地开发模式状态。
 * 没有保存过时默认关闭，避免普通访问者误看到红色 Tab 面板。
 */
function readDevMode() {
    return localStorage.getItem(STORAGE_KEY) === 'true';
}

/**
 * 保存本地开发模式状态。
 * 用字符串布尔值，和项目里其他 Tab 开关的存储习惯保持一致。
 */
function saveDevMode(enabled) {
    localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
}

/**
 * 应用开发模式状态。
 * 这里集中同步 UI class、主对象字段和 window 兜底字段，避免后面逻辑分叉。
 */
function applyDevMode(modal, ccgxkObj, enabled) {
    const nextEnabled = Boolean(enabled);
    modal.classList.toggle('tab-dev-mode', nextEnabled);
    ccgxkObj.isDevMode = nextEnabled;
    window.openworldDevMode = nextEnabled;
    return nextEnabled;
}

/**
 * 初始化 Tab 面板里的开发模式开关。
 * @param {Function} $ - document.getElementById 快捷函数
 * @param {Object} ccgxkObj - openworld 主对象
 */
export function initDevMode($, ccgxkObj) {
    const checkbox = $('devModeToggle');
    const modal = $('myinfoModal');
    if (!checkbox || !modal || !ccgxkObj) return;

    const storedEnabled = applyDevMode(modal, ccgxkObj, readDevMode());
    checkbox.checked = storedEnabled;

    checkbox.addEventListener('change', () => {
        const nextEnabled = applyDevMode(modal, ccgxkObj, checkbox.checked);
        saveDevMode(nextEnabled);
    });
}
