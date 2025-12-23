/**
 * 按照块儿删除模型
 * 自动识别 万数块(10000)、百数块(100)、单数块(1)
 */
export default function(ccgxkObj){
    ccgxkObj.deleteModBlock = function(blockIndex, cobj = ccgxkObj){
        const rootArgs = cobj.indexToArgs.get(blockIndex);  // 头索引 元数据
        if(!rootArgs) { return }
        const dataName = rootArgs.dataName;
        let blockSize;  //+ 确定删除块儿的大小
        if (blockIndex >= 990000) {
            blockSize = 1; 
        } else if (blockIndex >= 63_0000) {
            blockSize = 300;
        } else {
            blockSize = 10000;
        }
        for(let i = blockIndex; i < blockIndex + blockSize; i++) {  // 删除档案
                cobj.hiddenTABox(i);

                // 删除 网格表 里的记录
                if(1){
                    const args = cobj.indexToArgs.get(i);
                    const gridkey = args?.initGridKey;
                    if(gridkey && cobj.spatialGrid.has(gridkey)){
                        cobj.spatialGrid.get(gridkey).delete(i);
                    }
                }

                cobj.indexToArgs.delete(i);
        }

        cobj.W.delete('sk_' + blockIndex + '_' + dataName);  // 删除实例
    }
}