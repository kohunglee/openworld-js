/**
 * 动态区块管理
 * 
 * 将地图世界分区，以及 n 个优先级，动态加载和卸载模型
 */
export default {

    // 计算位置的简码
    calPosID : function(x, y, z, zindex){
        const foo = {2: 100, 3: 100, 4: 40}[zindex] || 0;
        if (zindex === 2) {zindex = ''};
        if(foo === 0){ return 0 }
        var dirctionA = (Math.sign(x) === -1) ? 'X' : 'D';
        var dirctionB = (Math.sign(z) === -1) ? 'B' : 'N';
        var numberA = Math.ceil(x / foo * Math.sign(x));
        var numberB = Math.ceil(z / foo * Math.sign(z));
        return zindex + dirctionA + numberA + dirctionB + numberB;
    },

    /**
     * DPZ 的单个区块面积大小，可认为该单位半径圆外接方内有效
     * 物理效果生效的前提是，物体最长长度应小于该 DPZ 的值的两倍，如 DPZ=4，就要小于 2*5=10。
     * （与 DPZ 值挨个对应，从 0 开始）
     */
    gridsize : new Uint16Array([10000, 1000, 100, 20, 5, 1]),
    gridsizeY : new Float32Array([10000, 1000, 100, 20, 5, 1]),

    // 新的 dynaNodes（适用于长宽 40 以内的物体），lab 版本
    currentlyActiveIndices : new Set(),  // 当前激活状态的物体。也可保存本次的激活物体列表，供下一次使用
    activationQueue : new Array(),  // 激活任务队列
    minY : null,  // 动态调整 Y 激活高度，比如楼层的高度可使用这个值（如层高 2.7，则可设置为 1.35）
    dynaNodes_lab : function(){
        if(this.mainVPlayer === null || this.stopDynaNodes) {return ''};
        const mVP = this.mainVPlayer;
        const activeGridKeys = [];  // 装 9 * dpz 个格子的区块号
        for (let index = 0; index < this.gridsize.length; index++) {
            const playerGridX = Math.floor(mVP.X / this.gridsize[index]);  //+8 计算主角周围 9 个格子的区块
            const playerGridZ = Math.floor(mVP.Z / this.gridsize[index]);
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    activeGridKeys.push(`${index}_${playerGridX + i}_${playerGridZ + j}`);
                }
            }
        }
        const newActiveIndices = new Set();  // 待做出隐藏动作的物体的 index 列表
        const indicesToHide = new Set(this.currentlyActiveIndices);  // 待做出隐藏动作的物体的 index 列表
        for(const key of activeGridKeys){
            const indicesInGrid = this.spatialGrid.get(key);  // 取物体使用（spatialGrid，物体花名册）
            if (indicesInGrid) {
                for (const index of indicesInGrid) {
                    // const minY = this.minY || this.gridsize[this.physicsProps[index * 8 + 4]];
                    const minY = this.gridsizeY[this.physicsProps[index * 8 + 4]].toFixed(2);
                    // const minY = 1.35;
                    // console.log(minY);
                    if(Math.abs(this.positionsStatus[index * 8 + 1] - mVP.Y) < minY){  // 高度距离（Y）要接近
                        newActiveIndices.add(index);
                    }
                }
            }
        }
        for (const index of newActiveIndices) {  // 剔除本次还应该是激活状态的
            indicesToHide.delete(index);
        }
        for (const index of newActiveIndices) {  // 执行激活动作
            if(!this.currentlyActiveIndices.has(index)){  // 上次被激活过，这次就不激活了
                const p_offset = index * 8;
                this.positionsStatus[p_offset + 7] = this.physicsProps[p_offset];  // 状态码（或 mass） 重新赋予
                this.activeTABox(index); 
            }
        }
        for(const index of indicesToHide){  // 执行隐藏动作
            const p_offset = index * 8;
            this.positionsStatus[p_offset + 7] = -1;
            this.hiddenTABox(index);
        }
        this.currentlyActiveIndices = newActiveIndices;
        if (this.activationQueue.length > 0 && !this.isActivationScheduled) {  // 如果有旧任务，且没有安排新任务
            this.isActivationScheduled = true;
        }
    },
}