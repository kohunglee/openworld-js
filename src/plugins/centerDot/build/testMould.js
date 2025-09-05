/**
 * 测试完全模组化组件 (建造师，初始化建造师（引用中心点插件）)
 * ========
 */

export default function(ccgxkObj) {
    
    var G = {
        ...ccgxkObj.centerDot.init,


        // 将 HTML 绘制到页面上
        initHTML : () => {
            const template = document.createElement('template');  //+4 将 html 节点添加到文档
            template.innerHTML = G.htmlCode;
            const content = template.content.cloneNode(true);
            document.body.appendChild(content);
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

        

    };

    ccgxkObj.centerDot.init = {...G, ...ccgxkObj.centerDot.init};
}
