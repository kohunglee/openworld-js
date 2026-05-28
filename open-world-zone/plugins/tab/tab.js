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
import { initDisplayControls } from './displayControls.js';
import { initSceneCache } from './sceneCache.js';
import { getCookie, setCookie } from '../../vktool.js';
import { setVK } from '../../vk.js';

export default function(ccgxkObj) {
    const $ = id => document.getElementById(id);
    const FALLBACK_SAFE_POS = { x: 0, y: 100, z: 0, rX: 0, rY: 0, rZ: 0 };
    let isAutoFixingBadPos = false;

    /**
     * 坏坐标的定义要统一。
     * 这里只接受有限数字，自动排除 null / undefined / NaN / Infinity。
     */
    function isValidNum(num) {
        return typeof num === "number" && Number.isFinite(num);
    }

    /**
     * 判断一份位置快照是否健康。
     * 当前只把位置三轴作为硬门槛，旋转缺失时允许回退为 0。
     */
    function isValidPose(pose) {
        return !!pose && isValidNum(pose.x) && isValidNum(pose.y) && isValidNum(pose.z);
    }

    /**
     * 读取最近一次可靠位置。
     * 优先使用 cookieSavePos.js 持续同步的 lastPos，失效时再回到安全点。
     */
    function getSafePoseSnapshot() {
        const lastPos = ccgxkObj?.lastPos;
        if (isValidPose(lastPos)) {
            return {
                x: lastPos.x,
                y: lastPos.y,
                z: lastPos.z,
                rX: isValidNum(lastPos.rX) ? lastPos.rX : 0,
                rY: isValidNum(lastPos.rY) ? lastPos.rY : 0,
                rZ: isValidNum(lastPos.rZ) ? lastPos.rZ : 0,
            };
        }

        return { ...FALLBACK_SAFE_POS };
    }

    /**
     * 取主角物理体时统一做防空。
     * 插件初始化比主角更早时，这里直接返回 null，避免读属性报错。
     */
    function getMainPlayerBody() {
        return ccgxkObj?.mainVPlayer?.body || null;
    }

    /**
     * 当前主角是否已经出现坏坐标。
     * 这里只盯位置三轴，因为这正是会污染 cookie 的关键数据。
     */
    function hasBrokenPlayerPosition() {
        const body = getMainPlayerBody();
        const pos = body?.position;
        if (!pos) return false;
        return !isValidNum(pos.x) || !isValidNum(pos.y) || !isValidNum(pos.z);
    }

    /**
     * 应用恢复后的朝向信息。
     * 你现在的可稳定恢复信息主要是 turnRight，因此这里尽量把可写的旋转状态一起补回去。
     */
    function restorePlayerRotation(pose) {
        const mvp = ccgxkObj?.mainVPlayer;
        const body = mvp?.body;
        if (!body) return;

        body.quaternion.set(0, 0, 0, 1);
        if (isValidNum(pose.rY)) ccgxkObj.keys.turnRight = pose.rY;
        if (isValidNum(pose.rX)) mvp.rX = pose.rX;
        if (isValidNum(pose.rZ)) mvp.rZ = pose.rZ;
    }

    /**
     * 复用同一套修复逻辑：
     * 先把角色拖回安全位置，再清空速度/受力，最后补地面。
     * 这样手动修复和自动修复不会分叉成两套行为。
     */
    function repairBrokenPlayerPosition(reason = "manual") {
        const body = getMainPlayerBody();
        if (!body) return false;

        const safePose = getSafePoseSnapshot();

        // 1. 强制重置位置（优先回到最近一次健康位置，兜底才回安全点）
        body.position.set(safePose.x, safePose.y, safePose.z);

        // 2. 归零速度（非常重要，否则下一帧继续炸）
        body.velocity.set(0, 0, 0);
        body.angularVelocity.set(0, 0, 0);
        body.force.set(0, 0, 0);
        body.torque.set(0, 0, 0);

        // 3. 尽量恢复朝向
        restorePlayerRotation(safePose);

        // 4. 重新添加地面
        const gX = 0, gY = -2.5, gZ = 0;
        const gW = 2500, gD = 2500, gH = 6;
        ccgxkObj.addPhy({ name:'ground-phy', X:gX, Y:gY, Z:gZ, width:gW, depth:gD, height:gH });

        console.log(`[tab] fix bad player position by ${reason}`, safePose);
        return true;
    }

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
                ccgxkObj.keys['viewForward'] = 0;
                ccgxkObj.keys['viewBackward'] = 0;
                ccgxkObj.keys['viewLeft'] = 0;
                ccgxkObj.keys['viewRight'] = 0;
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
        const p = ccgxkObj.mainVPlayer.body.position;
        p.x = x; p.y = y; p.z = z;
        if (turn !== null) ccgxkObj.keys.turnRight = turn;
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
    // 显示控制
    // ========================
    initDisplayControls($, ccgxkObj, {
        // 清晰度切换后立即关闭 Tab，并把鼠标重新锁回画布。
        // 这样用户单击档位后，无需再手动关面板。
        onClarityApplied: () => {
            hideModal();
            lockPointer();
        },
    });

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
    // 场景缓存状态
    // ========================
    initSceneCache($);

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
        repairBrokenPlayerPosition("manual-button");
    });

    /**
     * 自动巡检主角坐标。
     * 一旦发现位置三轴坏掉，就立刻走同一套紧急修复流程，并避免同一波异常重复触发。
     */
    setInterval(() => {
        if (ccgxkObj?.isMVPInit !== true) return;
        if (!hasBrokenPlayerPosition()) {
            isAutoFixingBadPos = false;
            return;
        }
        if (isAutoFixingBadPos) return;

        isAutoFixingBadPos = true;
        repairBrokenPlayerPosition("auto-bad-position");
    }, 200);
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

    .tab-version-badge {
        margin: 8px 0 10px 0;
        margin-top: 25px;
        padding: 5px 10px;
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.04);
        color: rgba(0, 0, 0, 0.6);
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.08em;
        display: inline-block;
    }
</style>

<div id="someCtrl">
    <button id="signboardSyncFloatingBtn" hidden>Sync (0)</button>
    <button id="btn01">Panel</button>
</div>

<div class="info-modal zindex-1" id="myinfoModal">
    <div><button id="closeBtn">Close (Tab)</button></div>
    <div class="tab-version-badge">OWZ V1.0</div>

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
        <div class="tab-row tab-row-gap-16 tab-row-wrap">
            <label class="tab-clickable"><input type="radio" name="clarity" value="0.05">Tiny (0.05)</label>
            <label class="tab-clickable"><input type="radio" name="clarity" value="0.3">Low (0.3)</label>
            <label class="tab-clickable"><input type="radio" name="clarity" value="0.5">Mid (0.5)</label>
            <label class="tab-clickable"><input type="radio" name="clarity" value="1" checked>High (1)</label>
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
        <h3>Server</h3>
        <div class="tab-row tab-row-gap-8">
            <label class="tab-label-nowrap">World API:</label>
            <input type="text" id="serverAddressInput" placeholder="http://127.0.0.1:3000/owzapi/8/mytest001" class="tab-input-text">
            <button id="serverAddressSave" class="tab-btn-md">Save</button>
            <button id="serverAddressReset" class="tab-btn-md">Default</button>
        </div>
        <div id="serverStatusText" class="tab-tiny tab-note-mb6 tab-server-status-initial">
            Signboard service connected.
        </div>
        <div class="tab-note tab-note-mb8">
            Save checks /scene-config first, then reloads the world.
        </div>
        <hr>
    </section>

    <section>
        <h3>Signboard Save Mode</h3>
        <label class="tab-clickable">
            <input type="checkbox" id="signboardOfflineModeToggle">
            Enable offline mode
        </label>
        <div id="signboardOfflineModeText" class="tab-note tab-note-mb8">
            Online mode saves directly to server. Offline mode saves to local queue and needs manual sync.
        </div>
        <hr>
    </section>

    <section id="signboardOfflineSection">
        <h3>Signboard Offline Sync</h3>
        <div class="signboard-offline-box">
            <div class="tab-row tab-row-gap-8 tab-row-wrap">
                <button id="signboardOfflineSyncNow" class="tab-btn-md">Sync Offline Boards</button>
                <button id="signboardOfflineSyncLegacy" class="tab-btn-md">Sync Legacy Server</button>
                <button id="signboardOfflineRefresh" class="tab-btn-md">Refresh Queue</button>
                <button id="signboardOfflineDump" class="tab-btn-md">Dump to Console</button>
                <button id="signboardOfflineClear" class="tab-btn-md">Clear Local Queue</button>
            </div>
            <div id="signboardOfflineStatus" class="signboard-offline-line">Loading IndexedDB queue...</div>
            <div id="signboardOfflineIds" class="signboard-offline-line">IDs: -</div>
            <div id="signboardOfflineLast" class="signboard-offline-line">Last sync: -</div>
            <div class="tab-note tab-note-mb8">
                Saves go to this browser first. This button submits pending changes through bulk-upsert.
            </div>
            <div class="tab-note tab-note-mb8">
                Legacy mode sends one PATCH every 500ms for older servers.
            </div>
        </div>
        <hr>
    </section>

    <section>
        <h3>Scene Cache</h3>
        <div class="signboard-offline-box">
            <div class="tab-row tab-row-gap-8 tab-row-wrap">
                <button id="sceneCacheRefresh" class="tab-btn-md">Refresh Cache Stats</button>
                <button id="sceneCacheClearSceneConfig" class="tab-btn-md">Clear Scene Config Cache</button>
                <button id="sceneCacheClearModelModules" class="tab-btn-md">Clear Model Cache</button>
            </div>
            <div id="sceneCacheStatus" class="signboard-offline-line">Loading scene cache stats...</div>
            <div id="sceneCacheSceneConfigStats" class="signboard-offline-line">Scene-config cache: -</div>
            <div id="sceneCacheModelModuleStats" class="signboard-offline-line">Model module cache: -</div>
            <div class="tab-note tab-note-mb8">
                Scene-config and model entry modules are cached in IndexedDB for faster reopen.
            </div>
            <div class="tab-note tab-note-mb8">
                Clear buttons only remove local browser cache. Server files are untouched.
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

    <div><button id="closeBtn02">Close (Tab)</button></div>
</div>

<div id="renderStoppedOverlay" class="render-stopped-overlay">Rendering Stopped</div>
`;
