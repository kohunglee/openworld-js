/**
 * 建造师，初始化建造师（引用中心点插件）
 * ========
 * 实验中，可以移动物体
 */

export default function(ccgxkObj) {
    console.log('centerDot init');

    var G = {  // 公共变量

        // 需要建造的 html 内容
        htmlCode : htmlCode,

        // 当前的索引的固定值（防止被更改）
        indexHotCurr : -1,

        // 备份当前的编辑器内容，用于恢复
        backupEdi : null,

        // 将 HTML 绘制到页面上
        initHTML : () => {
            const template = document.createElement('template');  //+4 将 html 节点添加到文档
            template.innerHTML = G.htmlCode;
            const content = template.content.cloneNode(true);
            document.body.appendChild(content);
        },

        // 音效映射关系
        musicMap : {  // 映射关系
            'closeEdi' : 'coin0',
            'openEdi'  : 'coin0',
            'closeByClick' : 'coin0',
            'closePoint'   : 'wood',
            'openPoint'    : 'wood',
            'jump'         : 'nudge',
            'frozen'       : 'alien',
            'unfrozen'     : 'unfrozen',
            'addCube0'     : 'ting',
        },

        // 音乐播放器
        music : (myevent) => {
            const obj = ccgxkObj;
            const list = obj.sound;
            obj.audio(list[G.musicMap[myevent]]);
        },

        // 热点事件
        hotAction : (index) => {
            const thisObj = ccgxkObj;
            if(thisObj.hotPoint + 0 > 1_000_000) return 0;
            G.indexHotCurr = index || thisObj.hotPoint + 0;  // 将 index 数字定格，防止被更改
            G.unlockPointer();  // 解锁鼠标
            myHUDModal.hidden = false;  // 显示模态框
            G.music('openEdi');  // 打开编辑器（音效）
            const _index = G.indexHotCurr;
            G.backupEdi = ccgxkObj.indexToArgs.get(_index);
            objID.value = _index;
            G.insertEdiFromBackUp();
        },

        // 从 backupEdi 里拿数据填充编辑区
        insertEdiFromBackUp : () => {
            const indexArgs = G.backupEdi;
            objWidth.value = indexArgs.width;
            objHeight.value = indexArgs.height;
            objDepth.value = indexArgs.depth;
            objPosX.value = indexArgs.X;
            objPosY.value = indexArgs.Y;
            objPosZ.value = indexArgs.Z;
            objRotX.value = indexArgs.rX;
            objRotY.value = indexArgs.rY;
            objRotZ.value = indexArgs.rZ;
        },

        // 解锁鼠标
        unlockPointer : () => {
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
        },

        // 锁定鼠标
        lockPointer : () => {
            const canvas = ccgxkObj.canvas;
            canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
            canvas.requestPointerLock();
            G.backupEdi = null;  // 清空备份，鼠标锁定状态 没备份
        },

        // 显示被选中的模型，物体变红
// function displayHotModel(clearLast = false, displayIndex = -1){
//     const obj = globalVar.ccgxkObj;
//     const currHot = obj.hotPoint;
//     if(currHot !== globalVar?.lastHotId){
//         const currObj = obj.W.next['T' + currHot];
//         if(currObj) { currObj.hidden = false;  }
//         const lastObj = obj.W.next['T' + globalVar?.lastHotId];
//         if(lastObj){ lastObj.hidden = true; }
//         globalVar.lastHotId = currHot;
//     }
//     if(clearLast) {  // 清除所有的变红方格
//         const lastObj = obj.W.next['T' + globalVar?.lastHotId];
//         if(lastObj){ lastObj.hidden = true; }
//         const currObj = obj.W.next['T' + currHot];
//         if(currObj) { currObj.hidden = true;  }
//         globalVar.lastHotId = -1;
//     }
// }
        // 显示被选中的模型，物体变红
        displayHotModel : (clearLast = false, displayIndex = -1) => {
            const obj = ccgxkObj;
            const currHot = obj.hotPoint;
            if(currHot !== G?.lastHotId){
                const currObj = obj.W.next['T' + currHot];
                if(currObj) { currObj.hidden = false;  }
                const lastObj = obj.W.next['T' + G?.lastHotId];
                if(lastObj){ lastObj.hidden = true; }
                G.lastHotId = currHot;
            }
            if(clearLast) {  // 清除所有的变红方格
                const lastObj = obj.W.next['T' + G?.lastHotId];
                if(lastObj){ lastObj.hidden = true; }
                const currObj = obj.W.next['T' + currHot];
                if(currObj) { currObj.hidden = true;  }
                G.lastHotId = -1;
            }
        },

        // 编辑区属性值更改后的事件，也就是操作模型
        /**
         * customIndex : 自定义的 index
         * isKeyOk : 当前是否属于单击 确认 键的情况
         * newArgs : 方块自定义的新自身属性参数
         *  */
        modelUpdate : (e, customIndex = -1, isKeyOk = false, newArgs) => {
            if(isRealTimeUpdata.checked === false && isKeyOk === false){ return 0; }  // 临时退出，不更新模型
            var index = G.indexHotCurr;
            if(customIndex !== -1){ index = customIndex };
            const lastArgs = newArgs || {  // 生成(或使用)新的 Args，以便于与源 Args 合并
                X: parseFloat(objPosX.value),
                Y: parseFloat(objPosY.value),
                Z: parseFloat(objPosZ.value),
                rX: parseFloat(objRotX.value),
                rY: parseFloat(objRotY.value),
                rZ: parseFloat(objRotZ.value),
                width: parseFloat(objWidth.value),
                height: parseFloat(objHeight.value),
                depth: parseFloat(objDepth.value),
                isInvisible: false,
            };

            const orgs_Args = {...ccgxkObj.indexToArgs.get(index)};
            ccgxkObj.indexToArgs.set(index, {...orgs_Args, ...lastArgs});  // 合并操作，赋予源对象


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
            ccgxkObj.W.updateInstance('manyCubes', index, newInstanceData);  // 更新一下实例化模型



            const quat = ccgxkObj.eulerToQuaternion({  // 将欧拉角转换为四元数
                rX: newInstanceData.rx,
                rY: newInstanceData.ry,
                rZ: newInstanceData.rz
            });
            const p_offset = index * 8;
            ccgxkObj.positionsStatus[p_offset] = newInstanceData.x;  
            ccgxkObj.positionsStatus[p_offset + 1] = newInstanceData.y;
            ccgxkObj.positionsStatus[p_offset + 2] = newInstanceData.z;
            ccgxkObj.positionsStatus[p_offset + 3] = quat.x;
            ccgxkObj.positionsStatus[p_offset + 4] = quat.y;
            ccgxkObj.positionsStatus[p_offset + 5] = quat.z;
            ccgxkObj.positionsStatus[p_offset + 6] = quat.w;
            ccgxkObj.physicsProps[p_offset + 1] = newInstanceData.w;
            ccgxkObj.physicsProps[p_offset + 2] = newInstanceData.h;
            ccgxkObj.physicsProps[p_offset + 3] = newInstanceData.d;
            const org_args = ccgxkObj.indexToArgs.get(index);  //+4 先去除物理体
            // console.log(org_args);
            if(org_args.isPhysical !== false && org_args.cannonBody !== undefined){
                ccgxkObj.world.removeBody(org_args.cannonBody);
                // console.log('remove');
            }
            ccgxkObj.currentlyActiveIndices.delete(index);  // 重新激活一下这个模型

            // G.test();

            if(customIndex !== -1){  // 如果是新加模型，需要重新计算一下区块
                const DPZ = 2;  // 假设 DPZ 是 2
                const _this = ccgxkObj;
                const gridKey = `${DPZ}_${Math.floor(lastArgs.X / _this.gridsize[DPZ])}_${Math.floor(lastArgs.Z / _this.gridsize[DPZ])}`;
                let indicesInCell = _this.spatialGrid.get(gridKey);
                if (!indicesInCell) { indicesInCell = [] }
                indicesInCell.push(index);
                _this.spatialGrid.set(gridKey, indicesInCell);
            } else {
                //ccgxkObj.currentlyActiveIndices.add(index);  // 此句用法疑问
            }
        },
    };

    ccgxkObj.centerDot.init = G;  // 方便浏览器调试

    G.initHTML();  // 绘制 HTML
    ccgxkObj.hooks.on('hot_action', function(ccgxkObj, e){  // 热点事件
        G.hotAction();
    });

    ccgxkObj.hooks.on('draw_point_before', function(ccgxkObj, e){  // 热点事件
        G.displayHotModel();  // 显示变红方块
    });
    
    document.getElementById('textureEditorCancel').addEventListener('click', function(){  // 单击 CANCEL (取消)按钮后
        myHUDModal.hidden = true;  // 隐藏模态框
        G.lockPointer();  // 锁定鼠标
        ccgxkObj.centerDot.closePoint(ccgxkObj);  // 关闭小点
        G.displayHotModel(true);  // 清除所有的变红方格
        G.music('closeEdi');  // 关闭编辑器（音效）
    });

    // 所有属性编辑框的 OnChange 事件
    const EdiArgsInput = document.querySelectorAll('.EdiArgsInput');  // 那一大堆 OBJ 属性框
    EdiArgsInput.forEach(input => {
        input.addEventListener('change', ()=>{
            G.modelUpdate();
        });  // onchange 事件
        // input.addEventListener('mouseover', () => {  // 鼠标悬浮属性值上，自动焦点
        //     if(isRealTimeUpdata.checked === false){ return 0; }
        //     if(rollerPlus.checked === false){ return 0; }
        //     input.focus();
        //  });  // 悬浮激活焦点
        // input.addEventListener('wheel', (event) => {  // 滚轮增减数字大小
        //     if(isRealTimeUpdata.checked === false){ return 0; }
        //     if(rollerPlus.checked === false){ return 0; }
        //     event.preventDefault();
        //     var step = 0.1;
        //     var minValue = event.target.min;
        //     var currentValue = +input.value;
        //     if (event.deltaY < 0) {
        //         currentValue += step;
        //     } else if (event.deltaY > 0) {
        //         currentValue -= step;
        //     }
        //     if(!minValue || (minValue && (currentValue > minValue)) ){
        //         input.value = currentValue;
        //         modelUpdate();
        //     }
        // }, { passive: false });
    });
    
}


/* 不知道有用没有 */
function id(name){
    return document.getElementById(name);
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
`;