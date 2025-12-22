/**
 * 按照块儿删除模型
 * 自动识别 万数块(10000)、百数块(100)、单数块(1)
 */
export default function(ccgxkObj){
    ccgxkObj.deleteModBlock = function(blockIndex, cobj = ccgxkObj){

        // 1. 获取头部的元数据
        const rootArgs = cobj.indexToArgs.get(blockIndex);
        
        // 安全检查：如果试图删除一个不存在的块，直接返回
        if(!rootArgs) {
            // console.warn('尝试删除不存在的索引或已删除:', blockIndex);
            return;
        }

        const dataName = rootArgs.dataName;
        let blockSize = 10000; // 默认默认为万数块

        // 2. 根据索引范围动态决定删除的跨度（逻辑需与 dataProc 保持严格一致）
        if (blockIndex >= 990000) {
            blockSize = 1;      // 单数块区 (990,000 ~ 1,000,000)
        } else if (blockIndex >= 63_0000) {
            blockSize = 300;    // 百数块区 (900,000 ~ 989,999)
        } else {
            blockSize = 10000;  // 万数块区 (0 ~ 899,999)
        }

        // 3. 循环清理物理体和注册表
        for(let i = blockIndex; i < blockIndex + blockSize; i++){
            
            // 稍微做一个检查，确保只处理有效的索引
            if(cobj.indexToArgs.has(i)){
                cobj.hiddenTABox(i);  //+ 档案删除大法（隐藏/回收物理体）
                
                // 删除在 spatialGrid 里的记录
                if(1){
                    const args = cobj.indexToArgs.get(i);
                    const gridkey = args?.initGridKey;
                    if(gridkey && cobj.spatialGrid.has(gridkey)){
                        cobj.spatialGrid.get(gridkey).delete(i);
                    }
                }
                
                // 从总注册表中移除
                cobj.indexToArgs.delete(i);
            }
        }

        // 4. 删除视觉网格 (InstancedMesh)
        // 命名格式：wsk_ + 索引 + _ + 随机后缀
        cobj.W.delete('wsk_' + blockIndex + '_' + dataName);
    }
}