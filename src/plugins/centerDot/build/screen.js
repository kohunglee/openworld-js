/**
 * 和屏幕鼠标锁定有关的函数组件 (建造师，初始化建造师（引用中心点插件）)
 * ========
 * 实验中，可以移动物体
 */

export default function(ccgxkObj) {

    
    
    var G = {
        ...ccgxkObj.centerDot.init,

        // 热点事件
        hotAction : (index) => {
            G = ccgxkObj.centerDot.init;
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

    };

    ccgxkObj.centerDot.init = {...G, ...ccgxkObj.centerDot.init};
}
