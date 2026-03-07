/**
 * 侧边栏 插件
 * ========
 * 功能是，控制右上角的侧边栏
 */
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
    
    <div> <button id="closeBtn">关闭</button> </div>

    <div>
        <h3>快捷操作</h3>
            <button id="goOPOS">到原点</button>
            <button id="goHall">到大厅</button>
            <button id="displayPadInPC">显示/隐藏 移动端控件</button>
            <button id="tabView">切换视角(V)</button>
        <hr>
    </div>
    
    <div id="wskStudio"></div><!-- 万数块临时测试使用 -->

    <div> <button id="closeBtn02">关闭</button> </div>
</div>
`;