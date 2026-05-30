/**
 * 左上角备注回退显示偏好
 * ======================
 * 作用：
 * 1. 统一管理“备注为空时显示正文”的本地开关
 * 2. 让 Tab 面板和 hotinfo 面板共用同一套读写逻辑
 * 3. 切换时通过自定义事件通知左上角面板立即刷新
 */

const STORAGE_KEY = 'openworld_sign_hotinfo_content_fallback';
export const REMARK_FALLBACK_CHANGE_EVENT = 'signboard:remark-fallback-change';

/**
 * 读取开关状态。
 * 默认关闭，只有用户明确存成 1 时才开启。
 */
export function isRemarkContentFallbackEnabled() {
    return localStorage.getItem(STORAGE_KEY) === '1';
}

/**
 * 保存开关状态，并广播给正在显示的热点信息面板。
 */
export function setRemarkContentFallbackEnabled(enabled) {
    localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
    window.dispatchEvent(new CustomEvent(REMARK_FALLBACK_CHANGE_EVENT, {
        detail: { enabled }
    }));
}

/**
 * 初始化 Tab 面板里的复选框。
 * 这里只接管状态同步，不关心具体展示位置。
 */
export function initRemarkFallbackToggle($) {
    const checkbox = $('remarkContentFallbackToggle');
    if (!checkbox) return;

    checkbox.checked = isRemarkContentFallbackEnabled();
    checkbox.addEventListener('change', () => {
        setRemarkContentFallbackEnabled(checkbox.checked);
    });
}
