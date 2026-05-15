/**
 * 方向键旋转插件
 * ==================
 * 功能：
 * - 不修改引擎 control.js，只在项目插件层拦截左右方向键
 * - 开启后：ArrowLeft / ArrowRight 改为控制角色左右旋转
 * - 关闭后：方向键恢复引擎默认行为，也就是左右平移
 */

const STORAGE_KEY = 'openworld_arrow_turn_enabled';
const TURN_STEP = 1.5;
const TURN_INTERVAL_MS = 10;

/**
 * 判断当前是否锁定鼠标。
 * 和引擎 control.js 的判断保持一致，避免打开 Tab 面板或编辑输入框时误触发。
 */
function isPointerLocked(ccgxkObj) {
    const canvas = ccgxkObj?.canvas;
    return (
        document.pointerLockElement === canvas ||
        document.mozPointerLockElement === canvas ||
        document.webkitPointerLockElement === canvas
    );
}

/**
 * 读取方向键旋转开关。
 * 默认开启；只有用户明确存成 0 时才关闭，方便保持当前使用习惯。
 */
function readEnabled() {
    return localStorage.getItem(STORAGE_KEY) !== '0';
}

/**
 * 保存方向键旋转开关。
 * 使用 localStorage 是为了刷新页面后保留用户在 Tab 面板里的选择。
 */
function saveEnabled(enabled) {
    localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
}

/**
 * 初始化左右方向键旋转逻辑。
 * 这里用 document 捕获键盘事件，但只处理 pointer lock 状态下的左右方向键。
 */
export function initArrowTurn($, ccgxkObj) {
    const checkbox = $('arrowTurnToggle');
    const pressedKeys = new Set();
    const timers = new Map();
    let enabled = readEnabled();

    /**
     * 清除引擎默认左右平移状态。
     * 引擎自己的 keydown 会先把方向键写进 viewLeft/viewRight，所以插件层需要马上归零。
     */
    function clearStrafeState() {
        ccgxkObj.keys.viewLeft = 0;
        ccgxkObj.keys.viewRight = 0;
    }

    /**
     * 停止某个方向键对应的持续旋转。
     * 旋转角度是累加值，不需要回滚，只需要停止后续 interval。
     */
    function stopTurn(code) {
        const timer = timers.get(code);
        if (timer) {
            clearInterval(timer);
            timers.delete(code);
        }
        pressedKeys.delete(code);
        clearStrafeState();
    }

    /**
     * 停止所有方向键旋转。
     * 切换开关、窗口失焦或鼠标锁释放时调用，避免留下持续旋转的计时器。
     */
    function stopAllTurns() {
        timers.forEach(timer => clearInterval(timer));
        timers.clear();
        pressedKeys.clear();
        clearStrafeState();
    }

    /**
     * 启动某个方向键的持续旋转。
     * TURN_STEP 与 phonepanel.js 保持一致，左键为 +0.7，右键为 -0.7。
     */
    function startTurn(code) {
        if (pressedKeys.has(code)) return;

        const direction = code === 'ArrowLeft' ? 1 : -1;
        pressedKeys.add(code);
        clearStrafeState();

        timers.set(code, setInterval(() => {
            ccgxkObj.keys.turnRight += TURN_STEP * direction;
            clearStrafeState();
        }, TURN_INTERVAL_MS));
    }

    /**
     * 判断事件是否是本插件要接管的左右方向键。
     * 使用 event.key 是为了兼容不同键盘布局下的方向键命名。
     */
    function getArrowCode(event) {
        if (event.key === 'ArrowLeft') return 'ArrowLeft';
        if (event.key === 'ArrowRight') return 'ArrowRight';
        return null;
    }

    /**
     * 初始化 Tab 面板里的开关。
     * 勾选代表“方向键旋转”，取消勾选代表“方向键平移”。
     */
    if (checkbox) {
        checkbox.checked = enabled;
        checkbox.addEventListener('change', () => {
            enabled = checkbox.checked;
            saveEnabled(enabled);
            stopAllTurns();
        });
    }

    document.addEventListener('keydown', event => {
        const code = getArrowCode(event);
        if (!code || !enabled || !isPointerLocked(ccgxkObj)) return;

        event.preventDefault();
        clearStrafeState();
        startTurn(code);
    });

    document.addEventListener('keyup', event => {
        const code = getArrowCode(event);
        if (!code || !enabled || !isPointerLocked(ccgxkObj)) return;

        event.preventDefault();
        stopTurn(code);
    });

    window.addEventListener('blur', stopAllTurns);
    document.addEventListener('pointerlockchange', () => {
        if (!isPointerLocked(ccgxkObj)) stopAllTurns();
    });
}
