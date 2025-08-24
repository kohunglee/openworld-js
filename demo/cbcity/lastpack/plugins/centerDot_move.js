/**
 * 中心点插件（移动物体版）
 * ========
 * 实验中，可以移动物体
 */

// 全局变量
const globalVar = {};  // 用于指向 ccgxkObj
let canvas, pointObjIndex, textureEditorTG, textureEditorOffsetX, textureEditorOffsetXR, textureEditorOffsetY, textureEditorInfo;  // 全局 ID DOM 的变量
let objID, objWidth, objHeight, objDepth, objPosX,
    objPosY, objPosZ, objRotX, objRotY, objRotZ,
    isRealTimeUpdata, EdiArgsInput, textureEditorReset,
    textureEditorOk;  // 同上


// 插件入口
export default function(ccgxkObj) {
    const template = document.createElement('template');  //+4 将 html 节点添加到文档
    template.innerHTML = htmlCode;
    const content = template.content.cloneNode(true);
    document.body.appendChild(content);
    canvas = document.getElementById('centerPoint');  // 画板
    pointObjIndex = document.getElementById('pointObjIndex');  // 热点物体的 index
    textureEditorInfo = document.getElementById('textureEditorInfo');  // 警告有没有保存
    objWidth = document.getElementById('objWidth');  // 宽度显示框
    objID = document.getElementById('objID');  // 物体 ID 显示框
    objHeight = document.getElementById('objHeight');  // 高度显示框
    objDepth = document.getElementById('objDepth');  // 深度显示框
    objPosX = document.getElementById('objPosX');  // X 位置显示框
    objPosY = document.getElementById('objPosY');  // Y 位置显示框
    objPosZ = document.getElementById('objPosZ');  // Z 位置显示框
    objRotX = document.getElementById('objRotX');  // X 旋转显示框
    objRotY = document.getElementById('objRotY');  // Y 旋转显示框
    objRotZ = document.getElementById('objRotZ');  // Z 旋转显示框
    isRealTimeUpdata = document.getElementById('isRealTimeUpdata');  // 是否实时更新
    EdiArgsInput = document.querySelectorAll('.EdiArgsInput');  // 那一大堆 OBJ 属性框
    textureEditorReset = document.getElementById('textureEditorReset');  // 恢复打开时的属性 按钮
    textureEditorOk = document.getElementById('textureEditorOk');  // 确认 按钮
    globalVar.ccgxkObj = ccgxkObj;
    const W = ccgxkObj.W;
    W.tempColor = new Uint8Array(4);  // 临时储存颜色，供本插件使用
    W.makeFBO = () => {
        W.pickingFBO = W.gl.createFramebuffer();
        W.gl.bindFramebuffer(W.gl.FRAMEBUFFER, W.pickingFBO);
        W.pickingTexture = W.gl.createTexture();  //+4 为FBO创建纹理附件（相当于排练室的“幕布”）
        W.gl.bindTexture(W.gl.TEXTURE_2D, W.pickingTexture);
        W.gl.texImage2D(W.gl.TEXTURE_2D, 0, W.gl.RGBA, W.canvas.width, W.canvas.height, 0, W.gl.RGBA, W.gl.UNSIGNED_BYTE, null);
        W.gl.framebufferTexture2D(W.gl.FRAMEBUFFER, W.gl.COLOR_ATTACHMENT0, W.gl.TEXTURE_2D, W.pickingTexture, 0);
        W.pickingRenderbuffer = W.gl.createRenderbuffer();  //+4 为FBO创建深度附件（相当于排练室的“地板”，保证3D效果正确）
        W.gl.bindRenderbuffer(W.gl.RENDERBUFFER, W.pickingRenderbuffer);
        W.gl.renderbufferStorage(W.gl.RENDERBUFFER, W.gl.DEPTH_COMPONENT16, W.canvas.width, W.canvas.height);
        W.gl.framebufferRenderbuffer(W.gl.FRAMEBUFFER, W.gl.DEPTH_ATTACHMENT, W.gl.RENDERBUFFER, W.pickingRenderbuffer);
        if (W.gl.checkFramebufferStatus(W.gl.FRAMEBUFFER) !== W.gl.FRAMEBUFFER_COMPLETE) {  //+3 检查FBO是否创建成功
            console.error("秘密排练室（FBO）创建失败！");
        } else { W.makeFBOSucess = true; }
        W.whiteTexture = W.gl.createTexture();  //+3 创建一个纯白图片，用于阴影贴图使用
        W.gl.bindTexture(W.gl.TEXTURE_2D, W.whiteTexture);
        W.gl.texImage2D(W.gl.TEXTURE_2D, 0, W.gl.RGBA, 1, 1, 0, W.gl.RGBA, W.gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
        W.gl.bindFramebuffer(W.gl.FRAMEBUFFER, null);  // 解绑，让绘制回到主舞台
    }
    W.getColorPickObj = () => {  // 获取屏幕中心物体颜色值
        const player = W.next['mainPlayer'];
        if (!player) return;
        W.gl.bindFramebuffer(W.gl.FRAMEBUFFER, W.pickingFBO);  // 切换到 FBO 里
        W.gl.clearColor(0.0, 0.0, 0.0, 1.0); // 黑背景
        W.gl.clear(W.gl.COLOR_BUFFER_BIT | W.gl.DEPTH_BUFFER_BIT); // 清空排练室
        for (const index of ccgxkObj.currentlyActiveIndices) {
            const obj = W.next['T' + index];
            if (!obj) continue;
            var obj_proxy = {...obj};  // 创建代理，想办法将代理显示成纯色
            obj_proxy.b = (index+1).toString(16).padStart(6, '0');
            obj_proxy.ns = 1;
            obj_proxy.mix = 1;
            W.gl.activeTexture(W.gl.TEXTURE0);
            W.gl.bindTexture(W.gl.TEXTURE_2D, null);  // 清空纹理贴图
            W.gl.activeTexture(W.gl.TEXTURE0 + 3);
            W.gl.bindTexture(W.gl.TEXTURE_2D, W.whiteTexture);  // 使用 纯白 贴图代替阴影深度图（以便清除阴影）
            W.render(obj_proxy, 0);
        }
        var player_proxy = {...player};  // 创建代理，想办法将代理显示成纯色
        player_proxy.b = '#f00';
        player_proxy.ns = 1;
        player_proxy.mix = 1;
        W.gl.activeTexture(W.gl.TEXTURE0);
        W.gl.bindTexture(W.gl.TEXTURE_2D, null);  // 清空纹理贴图
        W.gl.activeTexture(W.gl.TEXTURE0 + 3);
        W.gl.bindTexture(W.gl.TEXTURE_2D, W.whiteTexture);  // 使用 纯白 贴图代替阴影深度图（以便清除阴影）
        W.render(player_proxy, 0);
        const pixels = new Uint8Array(4);  // 取点
        W.gl.readPixels(W.gl.canvas.width / 2, W.gl.canvas.height / 2, 1, 1, W.gl.RGBA, W.gl.UNSIGNED_BYTE, pixels);
        W.gl.bindFramebuffer(W.gl.FRAMEBUFFER, null);
        W.clearColor(ccgxkObj.colorClear); // 恢复主画布的背景色
        W.tempColor = pixels;
    }
    ccgxkObj.hooks.on('pointer_lock_click', function(obj, e){
        if(ccgxkObj.centerPointColorUpdatax || e.button === 2){  
            if(ccgxkObj.hotPoint >= 0 && e.button !== 2) {  // 如果有热点，单击热点后，触发热点事件
                hotAction(ccgxkObj);
            } else {  // 关闭小点 // PS: 火狐浏览器无法右键关闭，暂时无解
                drawCenterPoint(canvas, ccgxkObj, true);
                clearInterval(ccgxkObj.centerPointColorUpdatax);
                ccgxkObj.centerPointColorUpdatax = null;  // 避免重复清除
                ccgxkObj.mainCamera.pos = {x: 0, y: 2, z: 4};
            }
        } else {  // 开启小点
            if(W.makeFBOSucess !== true){ W.makeFBO() }
            drawCenterPoint(canvas, ccgxkObj);
            ccgxkObj.centerPointColorUpdatax = setInterval(() => { drawCenterPoint(canvas, ccgxkObj) }, 500);
            ccgxkObj.mainCamera.pos = {x:0, y:0.9, z:0};
        }
    });

    // 单击 CANCEL (取消)按钮后
    document.getElementById('textureEditorCancel').addEventListener('click', function(){
        myHUDModal.hidden = true;  // 隐藏模态框
        lockPointer();  // 锁定鼠标
        closePoint();  // 关闭小点
    });

    // 所有属性编辑框的 OnChange 事件
    EdiArgsInput.forEach(input => {
        input.addEventListener('change', modelUpdate);
    });

    // 单击确认按钮（更新模型）
    textureEditorOk.addEventListener('click', modelUpdate);

    // 【实时更新】勾选框 和 确认按钮 两个只显示一个
    isRealTimeUpdata.addEventListener('change', ()=>{
        textureEditorOk.hidden = isRealTimeUpdata.checked;
    });
    textureEditorOk.hidden = isRealTimeUpdata.checked;

    // 所有编辑框在按住 shift 的同时，增幅变为 1
    document.addEventListener('keydown', (event) => { if (event.key === 'Shift') { setInputsStep('0.1') } });
    document.addEventListener('keyup', (event) => { if (event.key === 'Shift') { setInputsStep('1') } });
    window.addEventListener('blur', () => { setInputsStep('1') });  // 窗口失去焦点时，增幅变为 0.1

    // 键盘上的 r 键被按下（冻结物体）
    document.addEventListener('keydown', frozenMVP);
    document.addEventListener('keyup', function(){
        document.addEventListener('keydown', frozenMVP);
    });
    function frozenMVP(event) {
        if (event.key === 'f') {
            const mvpBody = globalVar.ccgxkObj.mainVPlayer.body;
            if(mvpBody.mass === 0){
                mvpBody.mass = 50;  // 重量还原
            } else {
                mvpBody.mass = 0;  // 重量归 0
                mvpBody.velocity.set(0, 0, 0);  // 设置线速度为0
                mvpBody.angularVelocity.set(0, 0, 0);  // 设置角速度为0
                mvpBody.force.set(0, 0, 0);  // 清除所有作用力
                mvpBody.torque.set(0, 0, 0);  // 清除所有扭矩
            }
        }
        document.removeEventListener('keydown', frozenMVP);
    }


    // 单击画面，退出编辑
    document.getElementById('myHUDModal').addEventListener('click', (event)=>{
        if(event.target.id === 'myHUDModal') {
            myHUDModal.hidden = true;  // 隐藏模态框
            lockPointer();  // 锁定鼠标
        }
    });

    // 单击恢复按钮
    textureEditorReset.addEventListener('click', () => {
        insertEdiFromBackUp();  // 填充数据
        modelUpdate();  // 根据数据更新模型
    });
}

/* ---------------------------------------------------------------------------- */

/**
 * 单击热点后的事件
 * @param {*} thisObj 
 */
function hotAction(thisObj){
    if(thisObj.hotPoint + 0 > 1_000_000) return 0;
    globalVar.indexHotCurr = thisObj.hotPoint + 0;  // 将 index 数字定格，防止被更改
    unlockPointer();  // 解锁鼠标
    myHUDModal.hidden = false;  // 显示模态框
    const index = globalVar.indexHotCurr;
    globalVar.backupEdi = globalVar.ccgxkObj.indexToArgs.get(index);
    objID.value = index;
    insertEdiFromBackUp();
}


// 从 backupEdi 里拿数据填充编辑区
function insertEdiFromBackUp(){
    const indexArgs = globalVar.backupEdi;
    objWidth.value = indexArgs.width;
    objHeight.value = indexArgs.height;
    objDepth.value = indexArgs.depth;
    objPosX.value = indexArgs.X;
    objPosY.value = indexArgs.Y;
    objPosZ.value = indexArgs.Z;
    objRotX.value = indexArgs.rX;
    objRotY.value = indexArgs.rY;
    objRotZ.value = indexArgs.rZ;
}


// 编辑区属性值更改后的事件
function modelUpdate(e) {
    console.log('hei hei');
    const index = globalVar.indexHotCurr;
    const lastArgs = {  // 生成新的 Args，以便于与源 Args 合并
        X: parseFloat(objPosX.value),
        Y: parseFloat(objPosY.value),
        Z: parseFloat(objPosZ.value),
        rX: parseFloat(objRotX.value),
        rY: parseFloat(objRotY.value),
        rZ: parseFloat(objRotZ.value),
        width: parseFloat(objWidth.value),
        height: parseFloat(objHeight.value),
        depth: parseFloat(objDepth.value),
    };
    const orgs_Args = {...globalVar.ccgxkObj.indexToArgs.get(index)};
    globalVar.ccgxkObj.indexToArgs.set(index, {...orgs_Args, ...lastArgs});  // 合并操作，赋予源对象
    // !!!! 下面以 'manyCubes' 为名称进行测试
    const newInstanceData = {
        x: lastArgs.X,
        y: lastArgs.Y,
        z: lastArgs.Z,
        rx: lastArgs.rX,
        ry: lastArgs.rY,
        rz: lastArgs.rZ,
        w: lastArgs.width,
        h: lastArgs.height,
        d: lastArgs.depth,
    };
    globalVar.ccgxkObj.W.updateInstance('manyCubes', index, newInstanceData);  // 更新一下实例化模型
    const quat = globalVar.ccgxkObj.eulerToQuaternion({rX: newInstanceData.rx, rY: newInstanceData.ry, rZ: newInstanceData.rz});  // 将欧拉角转换为四元数
    const p_offset = index * 8;
    globalVar.ccgxkObj.positionsStatus[p_offset] = newInstanceData.x;  
    globalVar.ccgxkObj.positionsStatus[p_offset + 1] = newInstanceData.y;
    globalVar.ccgxkObj.positionsStatus[p_offset + 2] = newInstanceData.z;
    globalVar.ccgxkObj.positionsStatus[p_offset + 3] = quat.x;
    globalVar.ccgxkObj.positionsStatus[p_offset + 4] = quat.y;
    globalVar.ccgxkObj.positionsStatus[p_offset + 5] = quat.z;
    globalVar.ccgxkObj.positionsStatus[p_offset + 6] = quat.w;
    globalVar.ccgxkObj.physicsProps[p_offset + 1] = newInstanceData.w;
    globalVar.ccgxkObj.physicsProps[p_offset + 2] = newInstanceData.h;
    globalVar.ccgxkObj.physicsProps[p_offset + 3] = newInstanceData.d;
    const org_args = globalVar.ccgxkObj.indexToArgs.get(index);  //+4 先去除物理体
    if(org_args.isPhysical !== false && org_args.cannonBody !== undefined){
        globalVar.ccgxkObj.world.removeBody(org_args.cannonBody);
    }
    globalVar.ccgxkObj.currentlyActiveIndices.delete(index);  // 重新激活一下这个模型
}


// 关闭小点
function closePoint(){
    drawCenterPoint(canvas, globalVar.ccgxkObj, true);  //+4 关闭小点
    clearInterval(globalVar.ccgxkObj.centerPointColorUpdatax);
    globalVar.ccgxkObj.centerPointColorUpdatax = null;
    globalVar.ccgxkObj.mainCamera.pos = {x: 0, y: 2, z: 4};
}


// 解锁鼠标
function unlockPointer() {
  if ('pointerLockElement' in document || 
      'mozPointerLockElement' in document || 
      'webkitPointerLockElement' in document) {
    const exitLock = document.exitPointerLock || 
                     document.mozExitPointerLock || 
                     document.webkitExitPointerLock;
    if (exitLock) {
      exitLock.call(document);
    }
  }
}


// 锁定鼠标
function lockPointer(){
    const canvas = globalVar.ccgxkObj.canvas;
    canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
    canvas.requestPointerLock();
    globalVar.upbackEdi = null;  // 清空备份，鼠标锁定状态 没备份
}


// 辅助函数，批量设置 EdiArgsInput 的 number 的 step
function setInputsStep(stepValue) {
    EdiArgsInput.forEach(input => {
        input.step = stepValue;
    });
}


// 绘制屏幕中心的点
function drawCenterPoint(canvas, thisObj, isClear){
    if(isClear) { canvas.width = 0; canvas.height = 0; return; }  // 清空
    if(canvas.width === 0 || canvas.width === 1){
        canvas.width = 20;
        canvas.height = 20;
    }
    const ctx = canvas.getContext('2d');
    thisObj.W.getColorPickObj();  // 拾取颜色一次
    const colorArray = thisObj.W.tempColor || [255, 0, 0, 255];  //+2 获取当前颜色值并转化为数组
    const color = `rgba(${255 - colorArray[0]}, ${255 - colorArray[1]}, ${255 - colorArray[2]}, ${colorArray[3]/255})`;
    const objIndex = colorArray[0] * 256 ** 2 + colorArray[1] * 256 + colorArray[2] - 1;  // 根据颜色获取到了对应的 index 值
    pointObjIndex.innerHTML = objIndex;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if(objIndex >= 0 && objIndex < 2_000_000){
        thisObj.hotPoint = objIndex;
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.arc(
            canvas.width / 2,
            canvas.height / 2,
            9,                
            0,                
            Math.PI * 2       
        );
        ctx.lineWidth = 2;
        ctx.stroke(); 
    } else if (thisObj.hotPoint) {
        thisObj.hotPoint = -1;
    }
    ctx.beginPath();
    ctx.arc(  
        canvas.width / 2,
        canvas.height / 2,
        5,
        0,
        Math.PI * 2
    );
    ctx.fillStyle = color;
    ctx.fill();  // 绘制圆点
}

// html 内容
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
        margin-left: calc(100% - 350px);
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
            index: <input type="number" id="objID" name="objID" min="0" max="10000000" step="1">
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
            <input type="checkbox" name="isRealTimeUpdata" id="isRealTimeUpdata" checked> 实时更新 <br><br>
            <button class="texture-editorBtn" id="textureEditorReset">恢复</button>
            <button class="texture-editorBtn" id="textureEditorOk">确认</button>
            <button class="texture-editorBtn" id="textureEditorCancel">关闭</button>
        </div>
    </div>
</div>
<span id="pointObjIndex" class="pointObjIndex">0</span>
<canvas id="centerPoint" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);" width="1" height="1"></canvas>
`;