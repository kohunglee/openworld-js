/**
 * 模式切换模块
 * 三种模式：0=编辑, 1=展示, 2=文字编辑
 */

export function initModeSwitch($, ccgxkObj) {
    const MODES = [
        { value: 0, label: '编辑模式', color: '#3498db' },
        { value: 1, label: '展示模式', color: '#27ae60' },
        { value: 2, label: '文字编辑', color: '#9b59b6' },
    ];

    // 获取当前模式
    function getCurrentMode() {
        const params = new URLSearchParams(window.location.search);
        return parseInt(params.get('mode')) || 0;
    }

    // 切换模式
    function switchMode(mode) {
        const url = new URL(window.location.href);
        url.searchParams.set('mode', mode);
        window.location.href = url.toString();
    }

    // 更新按钮状态
    function updateButtonStates() {
        const currentMode = getCurrentMode();
        MODES.forEach(m => {
            const btn = $(`modeBtn${m.value}`);
            if (btn) {
                btn.style.fontWeight = m.value === currentMode ? 'bold' : 'normal';
                btn.style.opacity = m.value === currentMode ? '1' : '0.6';
                btn.style.border = m.value === currentMode ? '2px solid ' + m.color : '1px solid #ccc';
            }
        });
    }

    // 绑定点击事件
    MODES.forEach(m => {
        const btn = $(`modeBtn${m.value}`);
        if (btn) {
            btn.addEventListener('click', () => switchMode(m.value));
        }
    });

    // 初始化状态
    updateButtonStates();

    console.log('[ModeSwitch] 当前模式:', getCurrentMode());
}
