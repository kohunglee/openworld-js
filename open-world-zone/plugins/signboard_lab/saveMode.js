/**
 * 信息板保存模式
 * ========
 * 默认在线保存；只有用户手动开启离线模式后，保存才会进入 IndexedDB 队列。
 */

const STORAGE_KEY = 'signboard_offline_mode_enabled';

/**
 * 读取当前是否启用了离线保存模式。
 */
export function isOfflineSaveModeEnabled() {
    return localStorage.getItem(STORAGE_KEY) === 'true';
}

/**
 * 写入离线保存模式，并广播给 Tab/浮动按钮等 UI。
 */
export function setOfflineSaveModeEnabled(enabled, options = {}) {
    const next = Boolean(enabled);
    const silent = Boolean(options?.silent);
    localStorage.setItem(STORAGE_KEY, next ? 'true' : 'false');

    const payload = {
        enabled: next,
        time: Date.now()
    };
    window.signboardSaveMode = payload;
    if (!silent) {
        window.dispatchEvent(new CustomEvent('signboard:save-mode', { detail: payload }));
    }
    return next;
}

/**
 * 初始化全局快照，方便首屏直接读取。
 */
export function hydrateOfflineSaveModeSnapshot() {
    const enabled = isOfflineSaveModeEnabled();
    window.signboardSaveMode = {
        enabled,
        time: Date.now()
    };
    return enabled;
}
