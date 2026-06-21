/**
 * Tab 清屏开关
 * ==================
 * 清屏只改变页面 DOM 的可见性，不删除任何节点：
 * - 保留 WebGL canvas，世界本身继续渲染
 * - 保留左上角信息，方便用户继续查看当前画板提示
 * - 保留 Tab 面板本体，所以按 Tab 后右侧栏仍然可以正常显示
 */

const BODY_CLASS = 'owz-clear-screen-mode';
const STYLE_ID = 'owzClearScreenStyle';

/**
 * 注入清屏样式。
 * 用 body class 做总开关，可以避免逐个改 hidden 属性后忘记恢复原始状态。
 */
function ensureClearScreenStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
    body.${BODY_CLASS} > *:not(#openworldCanv):not(#myinfoModal):not(#pointObjIndex):not(#currCityName):not(#centerPoint):not(#signHotInfo):not(#signHotInfoContentModal) {
        visibility: hidden !important;
        pointer-events: none !important;
    }

    /* 清屏模式下强制隐藏左上角热点数字（即使它仍在动态更新） */
    body.${BODY_CLASS} #pointObjIndex,
    body.${BODY_CLASS} .pointObjIndex {
        visibility: hidden !important;
        display: none !important;
        opacity: 0 !important;
        pointer-events: none !important;
    }

    /* 清屏模式下热点信息切换按钮隐藏（覆盖它的内联 display:block） */
    body.${BODY_CLASS} #signHotInfoToggle,
    body.${BODY_CLASS} #signHotInfoToggle {
        visibility: hidden !important;
        display: none !important;
        opacity: 0 !important;
        pointer-events: none !important;
    }

    /* 清屏模式下保留热点信息面板可见性，但 display 仍由 JS 按准心状态控制 */
    body.${BODY_CLASS} #signHotInfo {
        visibility: visible !important;
        opacity: 1 !important;
        pointer-events: auto !important;
    }
    `;
    document.head.appendChild(style);
}

/**
 * 更新按钮文案。
 * 清屏状态下按钮本身在 Tab 面板里仍可见，方便用户一键恢复。
 */
function syncButtonText(button, enabled) {
    if (!button) return;
    button.textContent = enabled ? 'Restore UI' : 'Clear Screen';
}

/**
 * 初始化 Tab 面板里的清屏按钮。
 * @param {Function} $ - document.getElementById 快捷函数
 */
export function initClearScreen($) {
    const button = $('clearScreenToggle');
    if (!button) return;

    const hotInfoToggle = $('signHotInfoToggle');

    /**
     * 清屏模式下我们会隐藏热点切换按钮。
     * 为了不让“准心瞄到画板却看不到信息”，进入清屏前先确保热点面板是开启态。
     */
    function ensureHotInfoEnabledForClearScreen() {
        if (!hotInfoToggle) return;
        const isEnabled = hotInfoToggle.textContent?.trim().toLowerCase() === 'hide';
        if (!isEnabled) hotInfoToggle.click();
    }

    ensureClearScreenStyle();
    syncButtonText(button, document.body.classList.contains(BODY_CLASS));

    button.addEventListener('click', () => {
        const enabled = document.body.classList.toggle(BODY_CLASS);
        if (enabled) ensureHotInfoEnabledForClearScreen();
        syncButtonText(button, enabled);
    });
}
