/**
 * 模式切换模块
 * 三种模式：0=调整, 1=展示, 2=文字编辑
 *
 * 模式0：调整模式 - 通过URL参数切换（刷新页面）
 * 模式1、2：直接修改 ccgxkObj.mode（不刷新页面，实时更新）
 */

export function initModeSwitch($, ccgxkObj) {
    const MODES = [
        { value: 0, label: '调整模式', color: '#3498db', refresh: true },
        { value: 1, label: '展示模式', color: '#27ae60', refresh: false },
        { value: 2, label: '文字编辑', color: '#9b59b6', refresh: false },
    ];

    // 获取当前模式
    function getCurrentMode() {
        // 模式1和2从 ccgxkObj 获取
        if (ccgxkObj.mode === 1 || ccgxkObj.mode === 2) {
            return ccgxkObj.mode;
        }
        // 模式0从URL参数获取，或默认为0
        return 0;
    }

    // 切换模式
    function switchMode(mode) {
        // 模式1和2：直接修改 ccgxkObj.mode（不刷新页面）
        if (mode === 1 || mode === 2) {
            ccgxkObj.mode = mode;
            updateButtonStates();
            updateModeDisplay();
            console.log(`[ModeSwitch] 切换到模式${mode}，ccgxkObj.mode 已设为 ${ccgxkObj.mode}`);
            return;
        }
        // 模式0：通过URL参数切换（刷新页面）
        ccgxkObj.mode = 0;
        const url = new URL(window.location.href);
        url.searchParams.delete('mode');
        window.location.href = url.toString();
    }

    // 实时显示当前模式（在页面上标注）
    function updateModeDisplay() {
        const currentMode = getCurrentMode();
        const modeInfo = MODES.find(m => m.value === currentMode);

        // 查找或创建模式显示区域
        let displayEl = $('modeDisplay');
        if (!displayEl) {
            displayEl = document.createElement('div');
            displayEl.id = 'modeDisplay';
            displayEl.style.cssText = `
                position: fixed;
                top: -11px;
                right: 10px;
                padding: 8px 16px;
                border-radius: 6px;
                font-size: 14px;
                font-weight: bold;
                z-index: 10000;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            `;
            document.body.appendChild(displayEl);
        }

        displayEl.style.backgroundColor = modeInfo.color;
        displayEl.style.color = '#fff';
        displayEl.textContent = `当前模式: ${modeInfo.label} (${currentMode})`;
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
    updateModeDisplay();

    // 监听 ccgxkObj.mode 变化（模式1、2）
    setInterval(() => {
        updateModeDisplay();
        updateButtonStates();
    }, 500);

    console.log('[ModeSwitch] 当前模式:', getCurrentMode(), 'ccgxkObj.mode:', ccgxkObj.mode);
}
