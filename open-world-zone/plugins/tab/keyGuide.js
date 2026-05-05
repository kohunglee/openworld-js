/**
 * 左下角按键引导器
 * =================
 * 目标：
 * 1. 首次进入默认显示，除非用户明确选择“不再显示”
 * 2. 用尽量少的样式，做一个像键帽的极简按键提示
 * 3. 监听真实键盘按下/抬起状态，让对应按键高亮
 * 4. 先做独立最小版，后续 Tab 侧栏只需要调用 window.keyGuideAPI 即可联动
 */

const STORAGE_KEY = 'openworld_key_guide_hidden';
const STYLE_ID = 'keyGuideStyle';
const MOBILE_BREAKPOINT = 768;

/**
 * 引导器里要展示的按键布局。
 * 这里单独维护，是为了后续你改键位时，不需要翻 UI 结构。
 */
const KEY_UNIT = 42;
const GUIDE_LAYOUT = [
    { code: 'Tab', label: 'TAB', desc: 'Panel', x: 0, y: 48, width: 64 },
    { code: 'KeyQ', label: 'Q', desc: 'Boost', x: 104, y: 48 },
    { code: 'KeyW', label: 'W', desc: 'Forward', x: 154, y: 48 },
    { code: 'KeyE', label: 'E', desc: 'Jump', x: 204, y: 48 },
    { code: 'KeyA', label: 'A', desc: 'Left', x: 104, y: 110 },
    { code: 'KeyS', label: 'S', desc: 'Back', x: 154, y: 110 },
    { code: 'KeyD', label: 'D', desc: 'Right', x: 204, y: 110 },
    { code: 'KeyF', label: 'F', desc: 'Freeze', x: 254, y: 110 },
    { code: 'KeyV', label: 'V', desc: 'View', x: 304, y: 170 },
    { code: 'ShiftLeft', label: 'Shift', desc: 'Boost', x: 0, y: 170, width: 86, aliases: ['ShiftRight'] },
    { code: 'Space', label: 'Space', desc: 'Jump', x: 110, y: 220, width: 138 },
];

/**
 * 引导器样式。
 * 独立成常量后，后续改视觉时不会和逻辑代码混在一起。
 */
const GUIDE_STYLE_CSS = `
#keyGuidePanel {
    position: fixed;
    left: 18px;
    bottom: 70px;
    width: 380px;
    max-width: calc(100vw - 36px);
    min-height: 300px;
    padding: 14px;
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.16);
    background: rgba(10,10,10,0.46);
    backdrop-filter: blur(8px);
    color: #fff;
    z-index: 22;
    box-sizing: border-box;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

#keyGuidePanel .kg-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
    position: relative;
    z-index: 2;
}

#keyGuidePanel .kg-title {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 4px;
}

#keyGuidePanel .kg-subtitle {
    font-size: 12px;
    color: #fff;
}

#keyGuidePanel .kg-close-btn {
    border: 1px solid rgba(255,255,255,0.2);
    background: rgba(255,255,255,0.08);
    color: #fff;
    border-radius: 9px;
    padding: 6px 10px;
    cursor: pointer;
    flex-shrink: 0;
}

#keyGuidePanel .kg-body {
    position: relative;
    height: 268px;
    margin-top: -50px;
    z-index: 1;
}

#keyGuidePanel .kg-shell {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
}

#keyGuidePanel .kg-keycap {
    height: 34px;
    border: 1px solid rgba(255,255,255,0.42);
    border-radius: 9px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,0.08);
    box-shadow: inset 0 -2px 0 rgba(255,255,255,0.08);
    font-size: 14px;
    font-weight: 700;
    color: #ffffff;
    flex-shrink: 0;
    transform: translateY(0);
}

#keyGuidePanel .kg-keycap.is-active {
    background: #facc15;
    color: #000;
    border-color: #fde68a;
    transform: translateY(1px);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.45);
}

#keyGuidePanel .kg-text {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    font-size: 12px;
    color: #fff;
    text-align: center;
    line-height: 1.05;
    min-width: 100%;
}
`;

/**
 * 注入一次样式表。
 * 绝大多数视觉样式都放在这里，JS 只保留动态坐标/宽度和状态切换。
 */
function ensureGuideStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = GUIDE_STYLE_CSS;

    document.head.appendChild(style);
}

/**
 * 规范化按键编码。
 * Shift / Tab / 空格这类键，浏览器里有时拿到的是 key，有时更适合用 code，所以这里统一一下。
 */
function normalizeCode(event) {
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') return 'ShiftLeft';
    if (event.code === 'Space' || event.key === ' ') return 'Space';
    if (event.key === 'Tab') return 'Tab';
    return event.code || event.key;
}

/**
 * 是否移动端视口。
 * 按你要求使用 window.innerWidth + 阈值来判定。
 */
function isMobileViewport() {
    return window.innerWidth < MOBILE_BREAKPOINT;
}

/**
 * 读取是否永久隐藏。
 * 只认明确写入的 1，避免未来扩展时误判。
 */
function isGuideHiddenForever() {
    return localStorage.getItem(STORAGE_KEY) === '1';
}

/**
 * 持久化“以后都不显示”状态。
 */
function setGuideHiddenForever(hidden) {
    if (hidden) {
        localStorage.setItem(STORAGE_KEY, '1');
        return;
    }
    localStorage.removeItem(STORAGE_KEY);
}

/**
 * 创建单个按键节点。
 * 仅在这里保留 x/y/width 这类布局动态参数。
 */
function createKeyItem(item) {
    const shell = document.createElement('div');
    shell.className = 'kg-shell';
    shell.style.left = `${item.x}px`;
    shell.style.top = `${item.y}px`;
    shell.style.width = `${item.width ?? KEY_UNIT}px`;

    const keycap = document.createElement('div');
    keycap.className = 'kg-keycap';
    keycap.dataset.code = item.code;
    keycap.style.width = `${item.width ?? KEY_UNIT}px`;
    keycap.textContent = item.label;

    const text = document.createElement('div');
    text.className = 'kg-text';

    const desc = document.createElement('span');
    desc.textContent = item.desc;

    text.appendChild(desc);
    shell.appendChild(keycap);
    shell.appendChild(text);

    return { shell, keycap };
}

/**
 * 初始化按键引导器。
 * 这个模块不依赖 tab.js 的具体结构，只往 body 挂一个浮层。
 */
export function initKeyGuide() {
    if (document.getElementById('keyGuidePanel')) return;
    ensureGuideStyle();

    const panel = document.createElement('div');
    panel.id = 'keyGuidePanel';

    const header = document.createElement('div');
    header.className = 'kg-header';

    const titleWrap = document.createElement('div');

    const title = document.createElement('div');
    title.className = 'kg-title';
    title.textContent = 'Key Guide';

    const subtitle = document.createElement('div');
    subtitle.className = 'kg-subtitle';
    subtitle.textContent = 'Recommended: Q / E for boost & jump';

    titleWrap.appendChild(title);
    titleWrap.appendChild(subtitle);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'kg-close-btn';
    closeBtn.textContent = 'Close';

    header.appendChild(titleWrap);
    header.appendChild(closeBtn);

    const body = document.createElement('div');
    body.className = 'kg-body';

    /**
     * 建立 code -> DOM 的映射，后面按键激活时不用到处 query。
     */
    const keycapMap = new Map();

    GUIDE_LAYOUT.forEach((item) => {
        const { shell, keycap } = createKeyItem(item);
        body.appendChild(shell);
        keycapMap.set(item.code, keycap);

        item.aliases?.forEach((aliasCode) => {
            keycapMap.set(aliasCode, keycap);
        });
    });

    panel.appendChild(header);
    panel.appendChild(body);
    document.body.appendChild(panel);

    /**
     * 统一处理显示与隐藏。
     * 先给未来边栏联动留一个全局入口，避免下次还得改模块内部结构。
     */
    const api = {
        show(force = false) {
            if (!force && isGuideHiddenForever()) return;
            panel.hidden = false;
        },
        hide() {
            panel.hidden = true;
        },
        resetHidden() {
            setGuideHiddenForever(false);
            panel.hidden = false;
        },
    };
    window.keyGuideAPI = api;

    /**
     * 首次进入默认显示；
     * 但移动端按要求默认隐藏（仍可通过边栏按钮手动显示）。
     */
    panel.hidden = isGuideHiddenForever() || isMobileViewport();

    /**
     * 按下高亮。
     * 用 class 切换状态，减少重复样式写入。
     */
    const setActive = (code, active) => {
        const keycap = keycapMap.get(code);
        if (!keycap) return;
        keycap.classList.toggle('is-active', active);
    };

    /**
     * 监听真实键位状态，让引导器不只是说明书，还能变成即时反馈。
     */
    const handleKeyDown = (event) => {
        setActive(normalizeCode(event), true);
    };

    const handleKeyUp = (event) => {
        setActive(normalizeCode(event), false);
    };

    const handleBlur = () => {
        keycapMap.forEach((keycap) => keycap.classList.remove('is-active'));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    /**
     * 关闭时只给“以后都不显示”的确认。
     * 因为你已经明确说过：关闭就等价于走永久关闭，后续由边栏再次打开。
     */
    const handleClose = (event) => {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        const confirmed = window.confirm('Hide this key guide? You can turn it back on in the panel.');
        if (!confirmed) return;
        setGuideHiddenForever(true);
        panel.hidden = true;
    };
    closeBtn.addEventListener('click', handleClose);
}
