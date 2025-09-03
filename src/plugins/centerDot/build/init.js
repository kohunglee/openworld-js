/**
 * 建造师，初始化建造师（引用中心点插件）
 * ========
 * 实验中，可以移动物体
 */

export default function(ccgxkObj) {
    console.log('centerDot init');

    // const template = document.createElement('template');  //+4 将 html 节点添加到文档
    // template.innerHTML = htmlCode;
    // const content = template.content.cloneNode(true);
    // document.body.appendChild(content);
}


// 建造师的 html 内容
const htmlCode = `
<style>
    /* 模态框 */
    .myHUD-modal {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 100vw;
        height: 100vh;
        transform: translate(-50%, -50%);
        z-index: 999;
    }
    .myHUD-modalPos {
        margin-left: calc(50% - 140px);
        margin-top: 1em;
        /* transform: translate(-50%, -50%); */
        width: 280px;
        text-align: center;
        background-color: rgba(51, 204, 111, 0.07);
        padding: 20px;
        backdrop-filter: blur(1px);
        /* background-color: aliceblue; */
    }
    .texture-editorBtn-lab {
        display: inline-block;
        background: rgb(32 32 32);
        color: rgb(255, 255, 255);
        padding: 5px 5px;
        border: none;
        cursor: pointer;
        margin: 5px;
        font-size: 14;
        color: #bbbbbb;
    }
    .pointObjIndex {
        position: fixed;
        top: 50px;
        left: 10px;
    }
    .EdiArgsInput, #objID {
        background-color: #fff0f066;
        width: 50px;
    }

    /* webgl canvas */
    /* 可提醒用户单击画面 */
    #vistaCanv, .myHUD-modal {
        cursor: pointer;
    }
</style>
<div id="myHUDModal" class="myHUD-modal" hidden>
    <div class="myHUD-modalPos">
        <div>
            <div>
                <span id="textureEditorInfo"></span>
            </div>
            index: <input type="number" id="objID" name="objID" min="0" max="99999999" step="1" readonly>
            <button class="texture-copyCubes" id="textureCopyCubes">复制(+1)</button>
            <hr>
            宽: <input type="number" class="EdiArgsInput" id="objWidth" name="objWidth" min="0.1">
            高: <input type="number" class="EdiArgsInput" id="objHeight" name="objHeight" min="0.1">
            纵: <input type="number" class="EdiArgsInput" id="objDepth" name="objDepth" min="0.1"><br><br>
            X: <input type="number" class="EdiArgsInput" id="objPosX" name="objPosX">
            Y: <input type="number" class="EdiArgsInput" id="objPosY" name="objPosY">
            Z: <input type="number" class="EdiArgsInput" id="objPosZ" name="objPosZ"><br><br>
            rx: <input type="number" class="EdiArgsInput" id="objRotX" name="objRotX">
            ry: <input type="number" class="EdiArgsInput" id="objRotY" name="objRotY">
            rz: <input type="number" class="EdiArgsInput" id="objRotZ" name="objRotZ"><br><br>
            <hr>
            <input type="checkbox" name="isRealTimeUpdata" id="isRealTimeUpdata" checked> 实时更新 
            <input type="checkbox" name="rollerPlus" id="rollerPlus" checked> 滚轮加减
            <br><br>
            <button class="texture-editorBtn" id="textureEditorReset">恢复</button>
            <button class="texture-editorBtn" id="textureEditorOk">确认</button>
            <button class="texture-editorBtn" id="textureEditorClose">关闭</button>
            <button class="texture-editorBtn" id="textureEditorCancel">退出</button>
            <hr>
            <button class="texture-getCubeData" id="textureGetCubeData">获取数据</button>
        </div>
    </div>
</div>
<span id="pointObjIndex" class="pointObjIndex">0</span>
<canvas id="centerPoint" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);" width="1" height="1"></canvas>
`;