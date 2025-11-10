/**
 * 动画进程相关
 */
export default {
    // 按照列表将 物理体 逐个 物理计算可视化 更新
    gridKeyCurrentTime : 0,  // 辅助更新 gridKey 的工具时间值
    updataBodylist : function(){
        this.dynaNodes_lab();  // 一帧计算区块一次
        for (const index of this.currentlyActiveIndices) {  // 暂时选择遍历吧，反正也显示不了几个，也兼容后续的 mass 改变
            const p_offset = index * 8;
            if(this.positionsStatus[p_offset + 7] > 0){  // 选择 状态码/mass 大于 0 的物体
                const indexItem = this.indexToArgs.get(index);
                const canBody = indexItem.body;
                if(!canBody) continue;
                const disxX = canBody.position.x - this.positionsStatus[p_offset];
                const disyY = canBody.position.y - this.positionsStatus[p_offset + 1];
                const diszZ = canBody.position.z - this.positionsStatus[p_offset + 2];
                const disten = Math.sqrt(disxX*disxX + disyY*disyY + diszZ*diszZ);  // 计算与自身上次的距离（必须大于 某个值 才能被可视化）
                this.positionsStatus[p_offset] = canBody.position.x;  //+7 位置储存到变量里（这种挨个赋值的方式性能最好）
                this.positionsStatus[p_offset + 1] = canBody.position.y;
                this.positionsStatus[p_offset + 2] = canBody.position.z;
                this.positionsStatus[p_offset + 3] = canBody.quaternion.x;
                this.positionsStatus[p_offset + 4] = canBody.quaternion.y;
                this.positionsStatus[p_offset + 5] = canBody.quaternion.z;
                this.positionsStatus[p_offset + 6] = canBody.quaternion.w;
                if(indexItem.isVisualMode !== false && this.W.next['T' + index] && disten > 0.0001){  // 可视化
                    const eulerQuat = this.quaternionToEuler(canBody.quaternion);
                    this.W.move({
                        n: 'T' + index,
                        x: this.positionsStatus[p_offset],
                        y: this.positionsStatus[p_offset + 1],
                        z: this.positionsStatus[p_offset + 2],
                        rx: eulerQuat.rX,
                        ry: eulerQuat.rY,
                        rz: eulerQuat.rZ,
                    });
                    if(disten > 0.01 && (performance.now() - this.gridKeyCurrentTime > 500)){  //+ 略大一点的距离更改，500ms 间隔以上，计算区块 key，更新表
                        const orginGridKey = indexItem.gridkey || 0;
                        const thisDPZ = this.physicsProps[p_offset + 4];
                        const currentGridKey = `${thisDPZ}_${Math.floor(this.positionsStatus[p_offset] / this.gridsize[thisDPZ])}_${Math.floor(this.positionsStatus[p_offset + 2] / this.gridsize[thisDPZ])}`;
                        if(orginGridKey) {
                            if(currentGridKey !== orginGridKey){
                                var indicesInCell_orige = this.spatialGrid.get(orginGridKey);  //+8 删去已失效的 key
                                if(indicesInCell_orige){
                                    const indexInCell = indicesInCell_orige.indexOf(index);
                                    if(indexInCell > -1){
                                        indicesInCell_orige.splice(indexInCell, 1);
                                        this.spatialGrid.set(orginGridKey, indicesInCell_orige);
                                    }
                                }
                                var indicesInCell = this.spatialGrid.get(currentGridKey);  //+4 添加新的 key
                                if (!indicesInCell) { indicesInCell = [] }
                                indicesInCell.push(index);
                                this.spatialGrid.set(currentGridKey, indicesInCell);
                            }
                        }
                        indexItem.gridkey = currentGridKey; 
                        this.gridKeyCurrentTime = performance.now();
                    }
                }
            }
        }
    },

    // 计算一次物理世界
    cannonAni : function(){
        this.world.step(1 / 60); // 时间步长 1/60，用于更新物理世界
    },

    // 物理世界稳定 75 帧计算
    targetFps : 75, // 物理目标帧率
    animatePhy: function() {
        const _this = this;
        let lastTime = performance.now();
        const frameDuration = 1000 / _this.targetFps; // 算出每帧的间隔
        function loop() {
            const now = performance.now();
            const delta = now - lastTime;
            if (delta >= frameDuration) {  // 循环的业务逻辑
                lastTime = now - (delta % frameDuration);
                _this.cannonAni();
            }
            setTimeout(loop, 0);
        }
        loop();
    },

    // 其他业务，还是自适应调节帧率
    fps: 0,  // 实时 FPS，辅助角色移动计算
    animateRen: function() {
        var _this = this;
        let last = performance.now(), fps = 75;
        const viewAnimate = function() {
            const now = performance.now();  //+ 计算 fps
            fps = 1000 / (now - last); last = now;

            // 每帧要计算的业务逻辑
            if(true){
                _this.updataBodylist(); // 更新物体列表
                _this.mainVPlayerMove(_this.mainVPlayer, fps); // 摄像机和主角的移动和旋转 
                _this.hooks.emit('animatePreFrame', _this); // 钩子：'每一帧的计算' 
            }

            requestAnimationFrame(viewAnimate); 
        } 
        viewAnimate();
    },

    // 物理世界稳定 75 帧计算
    // targetFps2 : 300, // 物理目标帧率
    // fpsframeMs : 0,
    // animateRen: function() {
    //     const _this = this;
    //     let lastTime = performance.now();
    //     let last = performance.now(), fps = 75; // ← 新增行
    //     const frameDuration = 1000 / 300; // 算出每帧的间隔
    //     function loop() {
    //         const now = performance.now();  //+ 计算 fps
    //         const delta = now - lastTime;
    //         fps = 1000 / (now - last); last = now;
    //         if (delta >= frameDuration) {  // 循环的业务逻辑
    //             lastTime = now - (delta % frameDuration);
    //             _this.updataBodylist(); // 更新物体列表
    //             _this.mainVPlayerMove(_this.mainVPlayer, fps); // 摄像机和主角的移动和旋转 
    //             _this.hooks.emit('animatePreFrame', _this); // 钩子：'每一帧的计算' 
    //         }
    //         setTimeout(loop, 0);
    //     }
    //     loop();
    // },


}