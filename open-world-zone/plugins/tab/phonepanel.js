/**
 * 移动端控制面板插件
 * ==================
 * 功能：
 * - 在移动端自动显示操控面板
 * - 在 PC 端，通过 tab 栏设置才能显示
 */

export function initPhonePanel($, ccgxkObj) {
    const template = document.createElement('template');
    template.innerHTML = htmlCode;
    document.body.appendChild(template.content.cloneNode(true));

    // ========================
    // 工具函数
    // ========================

    // 为元素绑定按下/抬起事件（支持鼠标 + 触屏）
    function addPressAction(el, onPress, onRelease) {
        let pressed = false;

        const press = () => { pressed = true; onPress(); };
        const release = () => {
            if (pressed) { onRelease(); pressed = false; }
        };

        el.addEventListener('mousedown', press);
        el.addEventListener('touchstart', press);

        el.addEventListener('mouseup', release);
        el.addEventListener('touchend', release);

        // 全局兜底
        window.addEventListener('mouseup', release);
        window.addEventListener('touchend', release);
    }

    // 给某个 key 开关绑定
    function bindKeyToggle(id, keyName, onValue = 1, offValue = 0) {
        addPressAction($(id),
            () => { k.keys[keyName] = onValue },
            () => { k.keys[keyName] = offValue }
        );
    }

    // 持续动作（旋转 / 抬头 / 低头）
    function bindIntervalControl(id, updateFn) {
        let timer = null;
        addPressAction($(id),
            () => {
                if (!timer) timer = setInterval(updateFn, 10);
            },
            () => {
                clearInterval(timer);
                timer = null;
            }
        );
    }

    // ========================
    // 移动 / 视角操作绑定
    // ========================

    bindKeyToggle("ppGoF",  "viewForward");
    bindKeyToggle("ppGoB",  "viewBackward");
    bindKeyToggle("ppGoL",  "viewLeft");
    bindKeyToggle("ppGoR",  "viewRight");

    // 跳跃（只有按下动作）
    addPressAction($("ppGoJump"),
        () => { k.mainVPlayer.body.velocity.y = k.jumpYVel },
        () => {}
    );

    // ========================
    // 旋转 / 抬头 / 低头
    // ========================

    const turnNum = 0.7;

    bindIntervalControl("ppTurnL", () => { k.keys.turnRight += turnNum });
    bindIntervalControl("ppTurnR", () => { k.keys.turnRight -= turnNum });
    bindIntervalControl("ppLookUp", () => { k.keys.turnUp   += turnNum });
    bindIntervalControl("ppLookDn", () => { k.keys.turnUp   -= turnNum });

    console.log('[PhonePanel] 移动端控制面板插件加载完成');
}

// HTML 和 CSS 模板
const htmlCode = `
<style>
    /* 移动端控制面板 */
    .phone-panel {
        background: transparent;
        width: 150px;
        height: 150px;
        position: fixed;
        z-index: 1000;
        bottom: 80px;
        right: 10%;
        user-select: none;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(3, 1fr);
        gap: 6px;
        padding: 6px;
        box-sizing: border-box;
        touch-action: none;
    }

    .phone-panel-cell {
        user-select: none;
        border: none;
        background: #ffffff82;
        font-size: 22px;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
        cursor: pointer;
    }

    .phone-panel-cell:active {
        color: #0ff;
        transform: scale(1.1);
    }

    /* 默认隐藏（PC 端） */
    .phone-panel-hidden {
        display: none;
    }

    /* 移动端自动显示 */
    @media (max-width: 820px) and (hover: none) and (pointer: coarse) {
        .phone-panel-hidden {
            display: grid;
        }
    }
</style>

<div id="phonePanel" class="phone-panel phone-panel-hidden">
    <button class="phone-panel-cell" id="ppTurnL">←</button>
    <button class="phone-panel-cell" id="ppGoF">前</button>
    <button class="phone-panel-cell" id="ppTurnR">→</button>

    <button class="phone-panel-cell" id="ppGoL">左</button>
    <button class="phone-panel-cell" id="ppGoJump">蹦</button>
    <button class="phone-panel-cell" id="ppGoR">右</button>

    <button class="phone-panel-cell" id="ppLookUp">上</button>
    <button class="phone-panel-cell" id="ppGoB">后</button>
    <button class="phone-panel-cell" id="ppLookDn">下</button>
</div>
`;

export default function(ccgxkObj) {
    const $ = id => document.getElementById(id);
    initPhonePanel($, ccgxkObj);
}
