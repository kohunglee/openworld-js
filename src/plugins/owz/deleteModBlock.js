/**
 * 按照块儿删除模型
 * ========
 * 目前设定的块儿大小是 1_0000 个模型
 * 编号 blockIndex ，为 1 则代表 0~9999 个模型，2 则代表 10000~19999 个模型，以此类推
 * 备注：后续判断，则判断 blockIndex 对应的 indexToArgs 是否存在，不存在则该块儿已经被删除，目前先这样设计
 */
export default function(ccgxkObj){
    ccgxkObj.deleteModBlock = function(blockIndex){
        for(let i = 0; i < 10000; i++){
            k.hiddenTABox(i);  //+ 档案删除大法
            k.indexToArgs.set(i, null)
        }
    }
}