/**
 * 和模型有关的函数组件 (建造师，初始化建造师（引用中心点插件）)
 * ========
 * 实验中，可以移动物体
 */

export default function(ccgxkObj) {

    var g = {
        // 显示被选中的模型，物体变红
        isDisplayHotModel : false,
        displayHotModel : (clearLast = false, displayIndex = -1) => {
            const G = ccgxkObj.centerDot.init;
            if(G.isDisplayHotModel === false) return 0;
            console.log(G.displayHotModel);
            const obj = ccgxkObj;
            const currHot = obj.hotPoint;
            if(currHot !== G?.lastHotId){
                const currObj = obj.W.next['T' + currHot];
                if(currObj) { currObj.hidden = false;  }
                const lastObj = obj.W.next['T' + G?.lastHotId];
                if(lastObj){ lastObj.hidden = true; }
                G.lastHotId = currHot;
            }
            if(clearLast) {  // 清除所有的变红方格（逻辑可能还需要改，有时候仍存在红色方格）
                const lastObj = obj.W.next['T' + G?.lastHotId];
                if(lastObj){ lastObj.hidden = true; }
                const currObj = obj.W.next['T' + currHot];
                if(currObj) { currObj.hidden = true;  }
                G.lastHotId = -1;
            }
        },

        // 操作方块
        wskId : 0,  // 默认的 wskId，用于建造器使用
        operaCube : (type = 0, vis = false) => {
            const G = ccgxkObj.centerDot.init;
            if(G.isDisplayHotModel === false) { vis = true }  // 显示红色
            const obj = ccgxkObj;
            const newIndex = obj.visCubeLen + 1;  // !!!! 一个临时的解决方案，新开辟了 visCubeLen
            if(type === 0){  // 复制一个方块
                G.modelUpdate(null, newIndex);
                G.music('copyCube');
            }
            if(type === 1){  // 添加一个方块（根据 Z 按键，参考得出的新方块）
                const mVP = obj.mainVPlayer;
                const mvpSize = 0.5;  // （实验）现在主角的大小是 0.5
                const northAngle = obj.calYAngle(mVP.rX, mVP.rY, mVP.rZ);
                const plus_z = 5 * Math.cos(northAngle) * mvpSize;
                const plus_x = 5 * Math.sin(northAngle) * mvpSize;
                const newPos = {
                    X: mVP.X - plus_x,
                    Y: mVP.Y,
                    Z: mVP.Z  - plus_z,
                };
                const new_rY = (G.newCubePosType === 1) ? 0 : northAngle * 180 / Math.PI;  // 是否旋转
                G.modelUpdate(null, newIndex, false, {
                    X: newPos.X, Y: newPos.Y, Z: newPos.Z,
                    rX: 0, rY: new_rY, rZ: 0,
                    width: 1 * mvpSize, height: 1 * mvpSize, depth: 1 * mvpSize,
                    isInvisible: vis,
                });
                G.music('addCube0');  // 添加方块
            }
            obj.visCubeLen++;
            G.indexHotCurr = newIndex;  // 热点 ID 更新成新方块的
            obj.hotPoint = newIndex;
            G.displayHotModel(true);  // 清空当前的红色高亮显示
            objID.value = newIndex;  // 更新一下 ID
        },

        // 编辑区属性值更改后的事件，也就是操作模型
        /**
         * customIndex : 自定义的 index
         * isKeyOk : 当前是否属于单击 确认 键的情况
         * newArgs : 方块自定义的新自身属性参数
         *  */
        modelUpdate : (e, customIndex = -1, isKeyOk = false, newArgs) => {
            const G = ccgxkObj.centerDot.init;
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
                isInvisible: (!G.isDisplayHotModel),
            };
            if(objColor.value !== '#888888'){  // 如果 颜色 不是默认颜色，则添加一个 insColor
                lastArgs.insColor = objColor.value.replace('#', '');
            }
            // lastArgs.isInvisible = false;  // 注意！！！注意！！！注意！！！临时调试
            const orgs_Args = {...ccgxkObj.indexToArgs.get(index)};
            ccgxkObj.indexToArgs.set(index, {...orgs_Args, ...lastArgs});  // 合并操作，赋予源对象
            const newInstanceData = {  // !!!! 下面以 'manyCubes' 为名称进行测试
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
            if(lastArgs.insColor) {  // 如果有 insColor，则实例也更新
                newInstanceData.b = lastArgs.insColor.replace('#', '');
            }
            
            ccgxkObj.W.updateInstance('wsk_' + G.wskId, index, newInstanceData);  // 更新一下实例化模型
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
            if(org_args.isPhysical !== false && org_args.body !== undefined){
                ccgxkObj.world.removeBody(org_args.body);
            }
            ccgxkObj.currentlyActiveIndices.delete(index);  // 重新激活一下这个模型
            if(customIndex !== -1){  // 如果是新加模型，需要重新计算一下区块
                const DPZ = 2;  // 假设 DPZ 是 2
                const _this = ccgxkObj;
                const gridKey = `${DPZ}_${Math.floor(lastArgs.X / _this.gridsize[DPZ])}_${Math.floor(lastArgs.Z / _this.gridsize[DPZ])}`;
                let indicesInCell = _this.spatialGrid.get(gridKey);
                if (!indicesInCell) { indicesInCell = new Set() }
                indicesInCell.add(index);
                _this.spatialGrid.set(gridKey, indicesInCell);
            }
        },
    };
    ccgxkObj.centerDot.init = {...g, ...ccgxkObj.centerDot.init};
}
