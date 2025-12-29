/**
 * 主 HTML 上的一些事件，比如模态框的显示隐藏、移动端的控制等
 */

// ========================
// 工具函数
// ========================

// 简化获取元素
const $ = id => document.getElementById(id);

// 为元素绑定按下/抬起事件（支持鼠标 + 触屏）
function addPressAction(el, onPress, onRelease) {
    let pressed = false;

    const press = () => { pressed = true; onPress(); };
    const release = () => {
        if (pressed) { onRelease(); pressed = false; }
    };

    el.addEventListener('mousedown', press);
    el.addEventListener('touchstart', press, { passive: true });

    el.addEventListener('mouseup', release);
    el.addEventListener('touchend', release);

    // 全局兜底
    window.addEventListener('mouseup', release);
    window.addEventListener('touchend', release);
}

// 给某个 key 开关绑定（比如 viewForward）
function bindKeyToggle(id, keyName, onValue = 1, offValue = 0) {
    addPressAction($(id),
        () => { k.keys[keyName] = onValue },
        () => { k.keys[keyName] = offValue }
    );
}


// ========================
// 模态框控制
// ========================

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

$("goOPOS").addEventListener("click", () => teleportTo(7.6, 10, 16.5, -146));
$("goHall").addEventListener("click", () => teleportTo(31, 10, -31, 180));
$("goFar").addEventListener("click", () => teleportTo(-42, 0.75, 358, 328));


// ========================
// PC 控制面板显示切换
// ========================

$("displayPadInPC").addEventListener("click", () => {
    $("mCtrl").classList.toggle("onlymobile");
});


// ========================
// 切换视角
// ========================

$("tabView").addEventListener("click", () => {
    k.centerDot.setCamView();
});


// ========================
// VK 开关 + Cookie
// ========================

{
    const checkbox = $("closeVK");

    window.addEventListener("DOMContentLoaded", () => {
        const saved = getCookie("closeVK") === "true";
        checkbox.checked = saved;
        $("onlineInfo").hidden = saved;
    });

    checkbox.addEventListener("change", () => {
        const isOff = checkbox.checked;

        if (isOff) {
            vkSocket.close();
            $("onlineInfo").hidden = true;
            $("shiftInfo").innerText = "当前人数: 0 | ";
        } else {
            setVK();
            $("onlineInfo").hidden = false;
        }

        setCookie("closeVK", isOff);
    });
}


// ========================
// 移动 /视角操作（手机）
// ========================

bindKeyToggle("goF",  "viewForward");
bindKeyToggle("goB",  "viewBackward");
bindKeyToggle("goL",  "viewLeft");
bindKeyToggle("goR",  "viewRight");

// 跳跃（只有按下动作，无抬起）
addPressAction($("goJump"),
    () => { k.mainVPlayer.body.velocity.y = k.jumpYVel },
    () => {}
);


// ========================
// 持续动作（旋转 / 抬头 /低头）
// ========================

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

const turnNum = 0.7;

bindIntervalControl("turnL", () => { k.keys.turnRight += turnNum });
bindIntervalControl("turnR", () => { k.keys.turnRight -= turnNum });
bindIntervalControl("lookUp", () => { k.keys.turnUp   += turnNum });
bindIntervalControl("lookDn", () => { k.keys.turnUp   -= turnNum });


// ========================
// FOV 设置
// ========================

function applyFOV() {
    k.W.next.camera.fov = $("wFovValue").value;
    k.W.resetView();
}

$("wFovSet").onclick = applyFOV;
$("wFovValue").onchange = applyFOV;

// ========================
// 疾跑最高速度 设置
// ========================

function applyHSpeed() {
    k.SPRINT_MAX_SPEED = parseFloat($("hSpeedValue").value);
}

$("hSpeedSet").onclick = applyHSpeed;
$("hSpeedValue").onchange = applyHSpeed;


hSpeedSet