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
            ccgxkObj.drawPointPause = true;  // 暂停绘制
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
            if(org_args.isPhysical !== false && org_args.cannonBody !== undefined){
                ccgxkObj.world.removeBody(org_args.cannonBody);
            }
            ccgxkObj.currentlyActiveIndices.delete(index);  // 重新激活一下这个模型

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

        // 一些键盘事件
        keyEvent : (event) => {
            if(G.disListen() === false) {return 0}
            const key = event.key.toLowerCase();
            if(key === 'f') {  // 键盘上的 f 键被按下（冻结物体）
                const mvpBody = ccgxkObj.mainVPlayer.body;
                if(mvpBody.mass === 0){
                    mvpBody.mass = 50;  // 重量还原
                    G.music('unfrozen');
                } else {
                    mvpBody.mass = 0;  // 重量归 0
                    mvpBody.velocity.set(0, 0, 0);  // 设置线速度为0
                    mvpBody.angularVelocity.set(0, 0, 0);  // 设置角速度为0
                    mvpBody.force.set(0, 0, 0);  // 清除所有作用力
                    mvpBody.torque.set(0, 0, 0);  // 清除所有扭矩
                    G.music('frozen');
                }
            }

            if(key === 'r') {  // 添加一个新的方块（跟随）
                G.operaCube(1);
                G.hotAction(ccgxkObj.visCubeLen + 1 );
                ccgxkObj.centerDot.openPoint(ccgxkObj);  // 关闭小点
            }

            if(key === 'x') {  // 添加一个新的方块（固定）
                G.operaCube(1, true);
                G.music('addCube0');
            }

            if ((event.keyCode === 32 || key === 'e')) {  // 跳跃的声音
                G.music('jump');
            }

            if(key === 'p'){}
            document.removeEventListener('keydown', G.keyEvent);
        },


        // 一些禁止监听键盘事件的场景
        disListen : () => {
            if(myHUDModal.hidden === false){ return false;}
        },

        // 操作方块
        operaCube : (type = 0, vis = false) => {
            // !!!! 一个临时的解决方案，新开辟了 visCubeLen
            const obj = ccgxkObj;
            const newIndex = obj.visCubeLen + 2;
            if(type === 0){  // 复制一个方块
                G.modelUpdate(null, newIndex);
            }
            if(type === 1){  // 添加一个方块
                const mVP = obj.mainVPlayer;
                const northAngle = obj.calYAngle(mVP.rX, mVP.rY, mVP.rZ);
                const plus_z = 5 * Math.cos(northAngle);
                const plus_x = 5 * Math.sin(northAngle);
                G.modelUpdate(null, newIndex, false, {
                    X: mVP.X - plus_x,
                    Y: mVP.Y,
                    Z: mVP.Z  - plus_z,
                    rX: 0,
                    rY: northAngle * 180 / Math.PI,
                    rZ: 0,
                    width: 1,
                    height: 1,
                    depth: 1,
                    isInvisible: vis,
                });
            }
            obj.visCubeLen++;
            G.indexHotCurr = newIndex;  // 热点 ID 更新成新方块的
            obj.hotPoint = newIndex;
            G.displayHotModel(true);  // 清空当前的红色高亮显示
            objID.value = newIndex;  // 更新一下 ID
        },

        /**
         * 从 backupEdi 里拿数据填充编辑区
         * @function insertEdiFromBackUp
         * @returns {void}
         */
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

        // 获取（和下载）当前的所有方块数据
        getCubesData : () => {
            var cubeDATA = [];
            for (let i = 0; i < (ccgxkObj.visCubeLen + 1); i++) {
                var p_offset = i * 8;
                const pos = ccgxkObj.positionsStatus;
                const phy = ccgxkObj.physicsProps;
                const euler = ccgxkObj.quaternionToEuler({  // 将四元数转换为欧拉角
                    x: pos[p_offset + 3],
                    y: pos[p_offset + 4],
                    z: pos[p_offset + 5],
                    w: pos[p_offset + 6]
                });
                cubeDATA[i] = {
                    x: pos[p_offset],
                    y: pos[p_offset + 1],
                    z: pos[p_offset + 2],
                    rx: euler.rX,
                    ry: euler.rY,
                    rz: euler.rZ,
                    w: phy[p_offset + 1],
                    h: phy[p_offset + 2],
                    d: phy[p_offset + 3],
                }
                for (const key in cubeDATA[i]) {  // 删去为 0 的值
                    cubeDATA[i][key] = G.f(cubeDATA[i][key]);
                    if (!cubeDATA[i][key] || +cubeDATA[i][key] === 0) {
                        delete cubeDATA[i][key];
                    }
                }
            }
            console.log(cubeDATA);  // 先输出，不下载
            return true;
            const jsonScroll = JSON.stringify(cubeDATA, null, 2);
            const blob = new Blob([jsonScroll], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `cubeData-${new Date(Date.now()).toLocaleString('sv-SE').replace(/[-:T\s]/g, '')}.json`; // 给卷轴起个带时间戳的名字
            link.click();
            URL.revokeObjectURL(url); // 释放这个临时URL
        },

        // 保留小数使用，智能修剪
        f : (num, digits = 2) => {
            if (typeof num !== 'number' || num % 1 === 0) {
                return num;
            }
            const shifter = Math.pow(10, digits); // 创造一个放大/缩小的工具 (100)
            return Math.trunc(num * shifter) / shifter;
        },

        // 辅助函数，批量设置 EdiArgsInput 的 number 的 step
        setInputsStep : (stepValue) => {
            EdiArgsInput.forEach(input => {
                input.step = stepValue;
            })
        },


    };

    /* -------------------------------------------------------------------- */















    k.W.cube({  //  参考位置
        g:'mainPlayer',
        n:'new_cube_pos',
        y: 0,
        x: 0,
        z: -5,
        w:1,  h:1,  d:1,
        b:'#bbbbbb46',
    });









    ccgxkObj.centerDot.init = G;  // 方便浏览器调试

    G.initHTML();  // 绘制 HTML
    ccgxkObj.hooks.on('hot_action', function(ccgxkObj, e){  // 热点事件
        G.hotAction();
    });

    ccgxkObj.hooks.on('draw_point_before', function(ccgxkObj, e){  // 热点事件
        G.displayHotModel();  // 显示变红方块
    });

    ccgxkObj.hooks.on('close_point', function(ccgxkObj, e){  // 右键关点事件
        G.displayHotModel(true);  // 清除所有变红方块
    });

    document.getElementById('textureEditorCancel').addEventListener('click', function(){  // 单击 CANCEL (取消)按钮后
        myHUDModal.hidden = true;  // 隐藏模态框
        ccgxkObj.drawPointPause = false;  // 恢复绘制
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
        input.addEventListener('mouseover', () => {  // 鼠标悬浮属性值上，自动焦点
            if(isRealTimeUpdata.checked === false){ return 0; }
            if(rollerPlus.checked === false){ return 0; }
            input.focus();
         });  // 悬浮激活焦点
        input.addEventListener('wheel', (event) => {  // 滚轮增减数字大小
            if(isRealTimeUpdata.checked === false){ return 0; }
            if(rollerPlus.checked === false){ return 0; }
            event.preventDefault();
            var step = 0.1;
            var minValue = event.target.min;
            var currentValue = +input.value;
            if (event.deltaY < 0) {
                currentValue += step;
            } else if (event.deltaY > 0) {
                currentValue -= step;
            }
            if(!minValue || (minValue && (currentValue > minValue)) ){
                input.value = currentValue;
                G.modelUpdate();
            }
        }, { passive: false });
    });

    // 一些键盘事件
    document.addEventListener('keydown', G.keyEvent);
    document.addEventListener('keyup', function(){
        document.addEventListener('keydown', G.keyEvent);
    });

    // 单击画面，退出编辑
    document.getElementById('myHUDModal').addEventListener('click', (event)=>{
        if(event.target.id === 'myHUDModal' || event.target.id === 'textureEditorClose') {
            myHUDModal.hidden = true;  // 隐藏模态框
            G.lockPointer();  // 锁定鼠标
            ccgxkObj.drawPointPause = false;  // 恢复绘制
            G.displayHotModel(true);
            G.music('closeByClick');
        }
    });

    // 单击确认按钮（更新模型）
    textureEditorOk.addEventListener('click',  function(){
        G.modelUpdate(null, -1, true);
    } );

    // 【实时更新】勾选框 和 确认按钮 两个只显示一个
    isRealTimeUpdata.addEventListener('change', ()=>{
        textureEditorOk.hidden = isRealTimeUpdata.checked;
    });
    textureEditorOk.hidden = isRealTimeUpdata.checked;

    // 单击复制 +1 按钮
    textureCopyCubes.addEventListener('click', () => {
        G.operaCube(0);
    });

    // 单击恢复按钮
    textureEditorReset.addEventListener('click', () => {
        G.insertEdiFromBackUp();  // 填充数据
        G.modelUpdate();  // 根据数据更新模型
    });
    
    // 获取方块的数据
    textureGetCubeData.addEventListener('click', () => {
        G.getCubesData();
    });

    // 所有编辑框在按住 shift 的同时，增幅变为 1
    G.setInputsStep('0.1');
    document.addEventListener('keydown', (event) => { if (event.key === 'Shift') { G.setInputsStep('1') } });
    document.addEventListener('keyup', (event) => { if (event.key === 'Shift') { G.setInputsStep('0.1') } });
    window.addEventListener('blur', () => { G.setInputsStep('0.1') });  // 窗口失去焦点时，增幅变为 0.1
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