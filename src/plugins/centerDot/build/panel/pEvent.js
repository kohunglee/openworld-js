/**
 * 面板里的各种事件 (建造师，初始化建造师（引用中心点插件）)
 * ========
 * 键盘事件、删除、归零事件...
 */

export default function(ccgxkObj) {
    var g = {
        // 单击画面后的事件（如 退出编辑）
        onclickView : (event) => {
            const G = ccgxkObj.centerDot.init;
            if(event.target.id === 'myHUDModal' || event.target.id === 'textureEditorClose') {  // 暂时退出编辑模式
                G.quitPanel(G);
            }
        },

        // 单击取消键后
        cancelAction : () => {
            const G = ccgxkObj.centerDot.init;
            G.quitPanel(G);
            ccgxkObj.centerDot.closePoint(ccgxkObj);  // 关闭小点
            hotPointInfo.innerHTML = '';
        },

        // 退出编辑器，等同于单击画面
        quitPanel : (G) => {
            myHUDModal.hidden = true;  // 隐藏模态框
            ccgxkObj.drawPointPause = false;  // 恢复绘制
            G.lockPointer();  // 锁定鼠标
            G.displayHotModel(true);
            G.removeFDicon();  // 清除绘制的箭头标识
            G.music('closeEdi');
            G.bassSet(null, -1, false);
        },

        // 形状的预设事件
        e_presets: ()=>{
            // console.log('形状预设');
            const G = ccgxkObj.centerDot.init;
            const temp =  objWidth.value;
            objWidth.value = objDepth.value;
            objDepth.value = temp;
            G.modelUpdate();
        },
        
        // 位置的归整事件
        e_round: ()=>{
            const G = ccgxkObj.centerDot.init;
            const x = +objPosX.value;
            const y = +objPosY.value;
            const z = +objPosZ.value;
            const roundedX = Math.round(x);
            const roundedY = Math.round(y);
            const roundedZ = Math.round(z);
            if (x !== roundedX) objPosX.value = roundedX;
            if (y !== roundedY) objPosY.value = roundedY;
            if (z !== roundedZ) objPosZ.value = roundedZ;
            G.modelUpdate();
        },
        
        // 旋转的归零事件
        e_zero: ()=>{
            const G = ccgxkObj.centerDot.init;
            objRotX.value = 0;
            objRotY.value = 0;
            objRotZ.value = 0;
            G.modelUpdate();
        },

        // 删除物体
        e_delete: ()=>{
            const G = ccgxkObj.centerDot.init;
            const N = 999999999;
            const M = 0.001;
            objPosX.value = N;
            objPosY.value = N;
            objPosZ.value = N;
            objWidth.value = M;
            objHeight.value = M;
            objDepth.value = M;
            G.modelUpdate();
            G.quitPanel(G);
        },

        // 魔法数字的离开事件
        magicNumBlur : (e) => {
            if(!(e.key >= 0 && e.key <= 9)){
                if(e.key !== 'Backspace' && e.key !== '.'){
                    e.preventDefault();
                    e.target.blur();
                }
            }
        },

        // 魔法数字的 clear
        clearMagicNum : () => {
            magicNum.value = '';
            magicNum.hidden = true;
        }
    };

    ccgxkObj.centerDot.init = {...g, ...ccgxkObj.centerDot.init};
}