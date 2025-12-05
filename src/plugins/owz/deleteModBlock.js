/**
 * 按照块儿删除模型
 * wsk 删除机制
 * ========
 * 目前设定的块儿大小是 1_0000 个模型
 * （废弃）编号 blockIndex ，为 1 则代表 0~9999 个模型，2 则代表 10000~19999 个模型，以此类推
 * （废弃）备注：后续判断，则判断 blockIndex 对应的 indexToArgs 是否存在，不存在则该块儿已经被删除，目前先这样设计
 */
export default function(ccgxkObj){
    ccgxkObj.deleteModBlock = function(blockIndex, cobj = ccgxkObj){
        for(let i = blockIndex; i < blockIndex + 10000; i++){
            cobj.hiddenTABox(i);  //+ 档案删除大法
            
            // 删除在 spatialGrid 里的记录
            if(1){
                const gridkey = cobj.indexToArgs.get(i)?.initGridKey;
                if(gridkey){
                    cobj.spatialGrid.get(gridkey).delete(i);
                }
            }
            cobj.indexToArgs.delete(i);
            
        }
        cobj.W.delete('wsk_' + blockIndex);
    }
}