/**
 * 侧边栏 插件
 * ========
 * 功能是，控制右上角的侧边栏
 */
import { initServerConfig } from './serverConfig.js';
import { initModeSwitch } from './modeSwitch.js';

export default function(ccgxkObj) {
    // console.log('导入 侧边栏 插件成功');

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
    }

    $("goOPOS").addEventListener("click", () => teleportTo(7.6, 10, 16.5, 0));
    $("goHall").addEventListener("click", () => teleportTo(31, 10, -31, 90));

    // ========================
    // FOV 滑杆控制
    // ========================
    const fovSlider = $("fovSlider");
    const fovValue = $("fovValue");
    const DEFAULT_FOV = 60;

    function setFov(fov) {
        fovSlider.value = fov;
        fovValue.textContent = fov + "°";
        k.W.camera({ fov });
    }

    if (fovSlider && fovValue) {
        fovSlider.addEventListener("input", (e) => {
            const fov = parseInt(e.target.value);
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
    // 模式切换
    // ========================
    initModeSwitch($, ccgxkObj);


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
    #someCtrl {
        position: fixed;
        top: 25px;
        opacity: 0.5;
        right: 50px;
    }
    #someCtrl button {
        width: 160px;
        height: 50px;
        font-size: 20px;
    }
    .info-modal {
        position: fixed;
        background-color: #ffffff6b;
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
</style>

<div id="someCtrl">
    <button id="btn01" style="width: 105px;">面板(Tab)</button>
</div>

<div class="info-modal zindex-1" id="myinfoModal">
    
    <div> <button id="closeBtn">关闭(Tab)</button> </div>

    <div>
        <h3>快捷操作</h3>
            <button id="goOPOS">到原点</button>
            <button id="goHall">到大厅</button>
            <button id="displayPadInPC">显示/隐藏 移动端控件</button>
            <button id="tabView">切换视角(V)</button>
            <button id="fixError">修NaN</button>
        <hr>
    </div>

    <div>
        <h3>上一个项目的地址</h3>
            <a href="https://ow.ccgxk.com/demo/house?logicadd=1" target="_blank">https://ow.ccgxk.com/demo/house?logicadd=1</a>
        <hr>
    </div>
    

    <div>
        <h3>模式切换</h3>
        <div style="display:flex;gap:8px;margin:8px 0;flex-wrap:wrap">
            <button id="modeBtn0" style="padding:8px 16px;background:#3498db;color:#fff;border-radius:4px;cursor:pointer;">编辑模式</button>
            <button id="modeBtn1" style="padding:8px 16px;background:#27ae60;color:#fff;border-radius:4px;cursor:pointer;">展示模式</button>
            <button id="modeBtn2" style="padding:8px 16px;background:#9b59b6;color:#fff;border-radius:4px;cursor:pointer;">文字编辑</button>
        </div>
        <div style="font-size:12px;color:#888">点击切换模式（会刷新页面）</div>
        <hr>
    </div>

    <div>
        <h3>画面设置</h3>
        <div style="display:flex;align-items:center;gap:10px;margin:8px 0">
            <label>FOV:</label>
            <input type="range" id="fovSlider" min="1" max="120" value="60" step="1" style="flex:1">
            <span id="fovValue" style="min-width:35px;text-align:right">60°</span>
            <button id="fovReset" style="padding:2px 8px;font-size:12px">还原</button>
        </div>
        <hr>
    </div>

    <div>
        <h3>角色速度</h3>
        <div style="display:flex;gap:16px;margin:8px 0">
            <label style="cursor:pointer"><input type="radio" name="speed" value="50"> 慢</label>
            <label style="cursor:pointer"><input type="radio" name="speed" value="8" checked> 正常</label>
        </div>
        <hr>
    </div>

    <div>
        <h3>服务器设置</h3>
        <div style="display:flex;align-items:center;gap:8px;margin:8px 0">
            <label style="white-space:nowrap">地址:</label>
            <input type="text" id="serverAddressInput" placeholder="127.0.0.1:8899"
                style="flex:1;padding:6px 10px;border:1px solid #ccc;border-radius:4px;font-size:14px">
            <button id="serverAddressSave" style="padding:4px 12px;font-size:13px">保存</button>
            <button id="serverAddressReset" style="padding:4px 12px;font-size:13px">默认</button>
        </div>
        <div style="font-size:12px;color:#888;margin-bottom:8px">
            信息板 API 服务器地址，修改后刷新页面才生效
        </div>
        <hr>
    </div>

    <h3>万数块情况</h3>
    <div id="wskStudio"></div><!-- 万数块临时测试使用 -->

    <div> <button id="closeBtn02">关闭(Tab)</button> </div>
</div>
`;