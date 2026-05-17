/**
 * 侧边栏 插件
 * ========
 * 功能是，控制右上角的侧边栏
 */
import { initServerConfig } from './serverConfig.js';
import { initModeSwitch } from './modeSwitch.js';
import { initPhonePanel } from './phonepanel.js';
import { initAutoW } from './autoW.js';
import { initKeyGuide } from './keyGuide.js';
import { initWskStatus } from './wskStatus.js';
import { initArrowTurn } from './arrowTurn.js';
import { initOfflineSync } from './offlineSync.js';
import { getCookie, setCookie } from '../../vktool.js';
import { setVK } from '../../vk.js';

export default function(ccgxkObj) {
    const $ = id => document.getElementById(id);

    const template = document.createElement('template');  //+4 将 html 节点添加到文档
    template.innerHTML = htmlCode;
    const content = template.content.cloneNode(true);
    document.body.appendChild(content);

    const modal = $("myinfoModal");
    const showModal = () => modal.classList.remove("zindex-1");
    const hideModal = () => modal.classList.add("zindex-1");

    btn01.addEventListener("mousedown", showModal);
    $("closeBtn").addEventListener("click", hideModal);
    $("closeBtn02").addEventListener("click", hideModal);

    // ========================
    // VK 开关 + Cookie
    // ========================
    {
        const checkbox = $("closeVK");
        const onlineInfo = $("onlineInfo");
        const shiftInfo = $("shiftInfo");
        const onlineCount = $("onlineCount");

        // 从 cookie 恢复原版“下次进来也会自动关闭”的状态。
        const saved = getCookie("closeVK") === "true";
        checkbox.checked = saved;
        onlineInfo.hidden = saved;
        if (saved) {
            shiftInfo.innerText = "Online: 0 | ";
            onlineCount.innerText = "0";
        }

        checkbox.addEventListener("change", () => {
            const isOff = checkbox.checked;

            if (isOff) {
                globalThis.vkSocket?.close?.();
                onlineInfo.hidden = true;
                shiftInfo.innerText = "Online: 0 | ";
                onlineCount.innerText = "0";
            } else {
                setVK();
                onlineInfo.hidden = false;
            }

            setCookie("closeVK", isOff);
        });
    }

    // 虚拟鼠标
    const unlockPointer = () => {
    const exit = document.exitPointerLock || document.mozExitPointerLock || document.webkitExitPointerLock;
    exit && exit.call(document);
    };
    const lockPointer = () => {
    const element = document.getElementById("openworldCanv");
    const request = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
    request && request.call(element);
    };

    window.addEventListener("keydown", e => {
        if (e.key === "Tab") {
            if(document.getElementById('signPanelModal')&&!document.getElementById('signPanelModal').hidden)return;
            if(document.getElementById('myHUDModal')&&!document.getElementById('myHUDModal').hidden)return;
            e.preventDefault(); // 阻止 Tab 切换焦点的默认行为
            const isHidden = modal.classList.contains("zindex-1");
            if (isHidden) {
                showModal();
                k.keys['viewForward'] = 0;
                k.keys['viewBackward'] = 0;
                k.keys['viewLeft'] = 0;
                k.keys['viewRight'] = 0;
                unlockPointer();
            } else {
                hideModal();
                lockPointer();
            }
        }
    });

    // ========================
    // 快捷移动按钮
    // ========================

    function teleportTo(x, y, z, turn = null) {
        const p = k.mainVPlayer.body.position;
        p.x = x; p.y = y; p.z = z;
        if (turn !== null) k.keys.turnRight = turn;
        // 传送后关闭面板并锁定鼠标
        hideModal();
    }

    $("goOPOS").addEventListener("click", () => teleportTo(7.6, 10, 16.5, 0));
    $("goHall").addEventListener("click", () => teleportTo(31, 10, -31, 90));
    $("goH01").addEventListener("click", () => teleportTo(31, 2, 5.45, -90));
    $("goH02").addEventListener("click", () => teleportTo(58, 6.6, 5.43, 90));
    $("goH03").addEventListener("click", () => teleportTo(58, 11.5, 5.43, 90));
    $("goH04").addEventListener("click", () => teleportTo(58, 16.6, 5.43, 90));
    $("goH05").addEventListener("click", () => teleportTo(58, 21.6, 5.43, 90));
    $("goTSG").addEventListener("click", () => teleportTo(92.84, 3, 6.61, -90));
    $("goTOP").addEventListener("click", () => teleportTo(42, 54.12, 5.91, -90));

    // ========================
    // FOV 滑杆控制
    // ========================
    const fovSlider = $("fovSlider");
    const fovValue = $("fovValue");
    const DEFAULT_FOV = 60;
    const FOV_SLIDER_MAX = 120;
    const sliderValueToFov = value => FOV_SLIDER_MAX + 1 - parseInt(value);
    const fovToSliderValue = fov => FOV_SLIDER_MAX + 1 - fov;

    function setFov(fov) {
        fovSlider.value = fovToSliderValue(fov);
        fovValue.textContent = fov + "°";
        k.W.camera({ fov });
    }

    if (fovSlider && fovValue) {
        fovSlider.addEventListener("input", (e) => {
            const fov = sliderValueToFov(e.target.value);
            fovValue.textContent = fov + "°";
            k.W.camera({ fov });
        });
    }

    $("fovReset")?.addEventListener("click", () => setFov(DEFAULT_FOV));

    // ========================
    // 角色速度控制
    // ========================
    document.querySelectorAll('input[name="speed"]').forEach(r => {
        r.addEventListener("change", (e) => {
            const val = e.target.value;
            ccgxkObj.WALK_SPEED = 1 / val;
            ccgxkObj.world.gravity.set(0, val == 50 ? -0.82 : -9.82, 0);
            ccgxkObj.jumpYVel = val == 50 ? 0.5 : 5;
        });
    });

    // ========================
    // 服务器地址配置
    // ========================
    initServerConfig($, (newAddress) => {
        console.log('[serverConfig] 服务器地址已更新:', newAddress);
    });

    // ========================
    // 信息板离线同步
    // ========================
    initOfflineSync($);

    // ========================
    // 模式切换
    // ========================
    initModeSwitch($, ccgxkObj);

    // ========================
    // 移动端控制面板
    // ========================
    initPhonePanel($, ccgxkObj);

    // ========================
    // plane 自动裁剪
    // ========================
    initAutoW($, ccgxkObj);

    // ========================
    // 左下角按键引导器
    // ========================
    initKeyGuide();
    $("showKeyGuideBtn")?.addEventListener("click", () => {
        window.keyGuideAPI?.resetHidden?.();
    });

    // ========================
    // 左右方向键旋转
    // ========================
    initArrowTurn($, ccgxkObj);

    // ========================
    // WSK/BSK/DSK 槽位状态面板
    // ========================
    initWskStatus(ccgxkObj);

    // ========================
    // 手动渲染开关（不做自动失焦逻辑）
    // ========================
    const renderToggleBtn = $("renderToggleBtn");
    const renderStoppedOverlay = $("renderStoppedOverlay");
    if (renderToggleBtn) {
        renderToggleBtn.textContent = "Stop Rendering";
        renderToggleBtn.addEventListener("click", () => {
            const isRendering = ccgxkObj?.W?.toggleRender?.();
            renderToggleBtn.textContent = isRendering ? "Stop Rendering" : "Resume Rendering";
            // 渲染暂停时显示中央提示，恢复渲染时隐藏提示
            if (renderStoppedOverlay) {
                renderStoppedOverlay.classList.toggle("render-stopped-overlay-visible", !isRendering);
            }
        });
    }

    // PC 端显示/隐藏手机控制面板
    $("togglePhonePanel")?.addEventListener("click", () => {
        const panel = $("phonePanel");
        if (panel) {
            panel.classList.toggle("phone-panel-hidden");
        }
    });


    /**
     * 紧急修复地面缺失 bug
     */
    $("fixError").addEventListener("click", () => {
        // 1. 强制重置位置 (回到安全点)
        k.mainVPlayer.body.position.set(0, 100, 0); 

        // 2. 归零速度 (非常重要，否则下一帧继续炸)
        k.mainVPlayer.body.velocity.set(0, 0, 0);
        k.mainVPlayer.body.angularVelocity.set(0, 0, 0);
        k.mainVPlayer.body.force.set(0, 0, 0);
        k.mainVPlayer.body.torque.set(0, 0, 0);

        // 3. 修复旋转
        k.mainVPlayer.body.quaternion.set(0, 0, 0, 1);

        // 4. 重新添加地面
        const gX = 0, gY = -2.5, gZ = 0;
        const gW = 2500, gD = 2500, gH = 6;
        k.addPhy({ name:'ground-phy', X:gX, Y:gY, Z:gZ, width:gW, depth:gD, height:gH });  // 物理体
    });
}

const htmlCode = `
<style>
    button {
        cursor: pointer;
    }

    #someCtrl {
        position: fixed;
        top: 25px;
        opacity: 0.5;
        right: 50px;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    #someCtrl button {
        width: 160px;
        height: 50px;
        font-size: 20px;
    }

    #btn01 {
        width: 105px;
    }

    #signboardSyncFloatingBtn {
        width: 140px;
    }

    .info-modal {
        position: fixed;
        background-color: #ffffffc9;
        
        backdrop-filter: blur(7px);
        right: 30px;
        top: 30px;
        width: 500px;
        max-width: calc(100vw - 80px);
        height: 80vh;
        z-index: 1;
        overflow: auto;
        padding: 1em;
        font-size: 15px;
        opacity: 1;
        pointer-events: auto;
    }

    .zindex-1 {  /* 使用这个来控制model，或许可以展示 ads ？  */
        position: fixed;
        z-index: -1; /* 不挡住页面 */
        opacity: 0;  /* 肉眼不可见，但仍渲染 */
        pointer-events: none; /* 防止误点 */
        transition: opacity 0.3s ease, z-index 0.3s ease;
    }

    .tab-section-inline {
        display: inline-flex;
        align-items: center;
        padding: 4px 10px;
        margin: 0 0 8px 0;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
        color: #fff;
    }

    .tab-row {
        display: flex;
        margin: 8px 0;
    }

    .tab-row-wrap {
        flex-wrap: wrap;
    }

    .tab-row-gap-8 {
        gap: 8px;
    }

    .tab-row-gap-10 {
        gap: 10px;
    }

    .tab-row-gap-16 {
        gap: 16px;
    }

    .tab-note {
        font-size: 12px;
        color: #000;
    }

    .tab-note-mb8 {
        margin-bottom: 8px;
    }

    .tab-note-mb6 {
        margin-bottom: 6px;
    }

    .tab-tiny {
        font-size: 12px;
    }

    .tab-scale-note {
        font-size: 12px;
        color: #000;
    }

    .tab-fov-slider {
        flex: 1;
    }

    .tab-fov-value {
        min-width: 35px;
        text-align: right;
    }

    .tab-btn-mode {
        padding: 8px 16px;
        color: #fff;
        border-radius: 4px;
        cursor: pointer;
    }

    .tab-btn-mode-0 {
        background: #3498db;
    }

    .tab-btn-mode-1 {
        background: #27ae60;
    }

    .tab-btn-mode-2 {
        background: #9b59b6;
    }

    .tab-btn-sm {
        padding: 2px 8px;
        font-size: 12px;
    }

    .tab-btn-md {
        padding: 4px 12px;
        font-size: 13px;
    }

    .tab-btn-lg {
        padding: 6px 14px;
        font-size: 14px;
    }

    .tab-label-nowrap {
        white-space: nowrap;
    }

    .tab-input-text {
        flex: 1;
        padding: 6px 10px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 14px;
    }

    .tab-input-number {
        width: 100px;
        padding: 6px 10px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 14px;
    }

    .tab-clickable {
        cursor: pointer;
    }

    .tab-server-status-initial {
        color: #000;
    }

    .render-stopped-overlay {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 9999;
        display: none;
        padding: 16px 24px;
        border-radius: 12px;
        background: rgba(0, 0, 0, 0.72);
        color: #fff;
        font-size: 16px;
        font-weight: bold;
        letter-spacing: 0.5px;
        pointer-events: none;
        user-select: none;
    }

    .render-stopped-overlay-visible {
        display: block;
    }

    .signboard-perf-grid {
        display: grid;
        grid-template-columns: 92px 1fr;
        gap: 3px 8px;
        font-family: monospace;
        font-size: 11px;
        line-height: 1.35;
        color: #111;
    }

    .signboard-perf-grid span {
        color: #666;
    }

    .signboard-perf-grid b {
        font-weight: 600;
        overflow-wrap: anywhere;
    }

    .signboard-perf-events {
        margin-top: 8px;
        padding: 6px;
        background: rgba(0, 0, 0, 0.05);
        border-radius: 4px;
        font-family: monospace;
        font-size: 10px;
        color: #333;
    }

    .signboard-perf-event {
        overflow-wrap: anywhere;
    }

    .signboard-offline-box {
        padding: 8px;
        border: 1px solid rgba(0, 0, 0, 0.18);
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.45);
    }

    .signboard-offline-line {
        margin-top: 6px;
        font-family: monospace;
        font-size: 11px;
        line-height: 1.4;
        color: #111;
        overflow-wrap: anywhere;
    }
</style>

<div id="someCtrl">
    <button id="signboardSyncFloatingBtn" hidden>同步(0)</button>
    <button id="btn01">Panel</button>
</div>

<div class="info-modal zindex-1" id="myinfoModal">
    <div><button id="closeBtn">Close (Tab)</button></div>

    <section>
        <h3>Quick Actions</h3>
        <button id="goOPOS">To Origin</button>
        <button id="goHall">To Outside</button>
        <button id="fixError">Fix NaN</button>
        <button id="togglePhonePanel">Mobile Panel</button><br><br>
        floor:
        <button id="goH01">1</button>
        <button id="goH02">2</button>
        <button id="goH03">3</button>
        <button id="goH04">4</button>
        <button id="goH05">5</button>
        <button id="goTSG">Lib</button>
        <button id="goTOP">Top</button>
        <hr>
    </section>

    <section>
        <h3>Online Users</h3>
        <input type="checkbox" id="closeVK"> <span class="moselect">Disable online mode (also disabled next time)</span><br><br>
        <div id="onlineInfo">
            Current online users: <span id="onlineCount">1</span>&nbsp;&nbsp;<span id="isConneting"></span>
            <ul id="frendPosInfo"></ul>
        </div>
        <hr>
    </section>

    <section>
        <h3>Mode</h3>
        <div id="modeDisplay" class="tab-section-inline">Current: loading</div>
        <div class="tab-row tab-row-gap-8 tab-row-wrap">
            <button id="modeBtn0" class="tab-btn-mode tab-btn-mode-0">Cube Edit</button>
            <button id="modeBtn1" class="tab-btn-mode tab-btn-mode-1">View (Def)</button>
            <button id="modeBtn2" class="tab-btn-mode tab-btn-mode-2">Text Edit</button>
        </div>
        <div class="tab-note">Click to switch mode. The page will reload.</div>
        <hr>
    </section>

    <section>
        <h3>Display</h3>
        <div class="tab-row tab-row-gap-10">
            <label>FOV:</label>
            <span class="tab-scale-note">120</span>
            <input type="range" id="fovSlider" min="1" max="120" value="61" step="1" class="tab-fov-slider">
            <span class="tab-scale-note">1</span>
            <span id="fovValue" class="tab-fov-value">60°</span>
            <button id="fovReset" class="tab-btn-sm">Reset</button>
        </div>
        <hr>
    </section>

    <section>
        <h3>Key Guide</h3>
        <div class="tab-row tab-row-gap-10 tab-row-wrap">
            <button id="showKeyGuideBtn" class="tab-btn-lg">Show Guide</button>
        </div>
        <label class="tab-clickable">
            <input type="checkbox" id="arrowTurnToggle">
            Arrow keys turn instead of strafe
        </label>
        <div class="tab-note tab-note-mb8">
            Show key hints in the lower-left corner.<br>
            You can turn it back on here anytime.
        </div>
        <hr>
    </section>

    <section>
        <h3>Move Speed</h3>
        <div class="tab-row tab-row-gap-16">
            <label class="tab-clickable"><input type="radio" name="speed" value="50"> Slow</label>
            <label class="tab-clickable"><input type="radio" name="speed" value="8" checked> Normal</label>
        </div>
        <hr>
    </section>

    <section>
        <h3>服务器</h3>
        <div class="tab-row tab-row-gap-8">
            <label class="tab-label-nowrap">地址：</label>
            <input type="text" id="serverAddressInput" placeholder="127.0.0.1:8899" class="tab-input-text">
            <button id="serverAddressSave" class="tab-btn-md">保存</button>
            <button id="serverAddressReset" class="tab-btn-md">默认</button>
        </div>
        <div id="serverStatusText" class="tab-tiny tab-note-mb6 tab-server-status-initial">
            信息面板服务器已连接。
        </div>
        <div class="tab-note tab-note-mb8">
            修改地址后会自动刷新页面。
        </div>
        <hr>
    </section>

    <section>
        <h3>信息板保存模式</h3>
        <label class="tab-clickable">
            <input type="checkbox" id="signboardOfflineModeToggle">
            启用离线模式
        </label>
        <div id="signboardOfflineModeText" class="tab-note tab-note-mb8">
            默认在线实时保存。开启后，保存只写入本地队列，并需要手动同步。
        </div>
        <hr>
    </section>

    <section id="signboardOfflineSection">
        <h3>信息板离线同步</h3>
        <div class="signboard-offline-box">
            <div class="tab-row tab-row-gap-8 tab-row-wrap">
                <button id="signboardOfflineSyncNow" class="tab-btn-md">同步离线画板</button>
                <button id="signboardOfflineSyncLegacy" class="tab-btn-md">同步旧版服务器</button>
                <button id="signboardOfflineRefresh" class="tab-btn-md">刷新队列</button>
                <button id="signboardOfflineDump" class="tab-btn-md">输出到控制台</button>
                <button id="signboardOfflineClear" class="tab-btn-md">清空本地队列</button>
            </div>
            <div id="signboardOfflineStatus" class="signboard-offline-line">正在加载 IndexedDB 队列。</div>
            <div id="signboardOfflineIds" class="signboard-offline-line">ID：-</div>
            <div id="signboardOfflineLast" class="signboard-offline-line">上次同步：-</div>
            <div class="tab-note tab-note-mb8">
                保存时会先写入当前浏览器。本按钮会通过 bulk-upsert 提交待同步修改。
            </div>
            <div class="tab-note tab-note-mb8">
                旧版模式会每 500ms 发送一次 PATCH 请求，用于兼容老服务器。
            </div>
        </div>
        <hr>
    </section>

    <section>
        <h3>Signboard Render Limit</h3>
        <div class="tab-row tab-row-gap-8 tab-row-wrap">
            <label class="tab-label-nowrap">Keep:</label>
            <input type="number" id="autoWLimitInput" min="0" step="1" class="tab-input-number">
            <span> plane</span>
            <button id="autoWLimitReset" class="tab-btn-md">Reset</button>
            <button id="autoWLimitSave" class="tab-btn-md">Save</button>
        </div>
        <div id="autoWCurrentText" class="tab-scale-note tab-note-mb6">
            Current limit: 30
        </div>
        <div class="tab-note tab-note-mb8">
            Planes are sorted by distance from the player every second.<br>
            Only the nearest planes are rendered. Others are hidden.
        </div>
        <hr>
    </section>

    <section>
        <h3>Signboard Diagnostics</h3>
        <div class="tab-row tab-row-gap-8 tab-row-wrap">
            <button id="signboardPerfReset" class="tab-btn-md">Reset Stats</button>
            <button id="signboardPerfDump" class="tab-btn-md">Dump Console</button>
        </div>
        <div id="signboardPerfStats" class="tab-note tab-note-mb8">
            Signboard diagnostics loading.
        </div>
        <hr>
    </section>

    <section>
        <h3>Rendering</h3>
        <div class="tab-row tab-row-gap-10 tab-row-wrap">
            <button id="renderToggleBtn" class="tab-btn-lg">Stop Rendering</button>
        </div>
        <hr>
    </section>

    <h3>Slot Usage</h3>
    <div id="wskStudio"></div><!-- 万数块临时测试使用 -->

    <section>
        <h3>Previous Project URL</h3>
        <a href="https://ow.ccgxk.com/demo/house?logicadd=1" target="_blank">https://ow.ccgxk.com/demo/house?logicadd=1</a>
        <hr>
    </section>

    <div><button id="closeBtn02">Close (Tab)</button></div>
</div>

<div id="renderStoppedOverlay" class="render-stopped-overlay">Rendering Stopped</div>
`;
