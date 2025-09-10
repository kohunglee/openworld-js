/**
 * 和输入框、模型、屏幕有关的函数组件 (建造师，初始化建造师（引用中心点插件）)
 * ========
 * 实验中，可以移动物体
 */
export default function(ccgxkObj) {
    const g = {
        /**
         * 从 backupEdi 里拿数据填充编辑区 (优化版)
         * @function insertEdiFromBackUp
         * @returns {void}
         */
        insertEdiFromBackUp: () => {
            const G = ccgxkObj.centerDot.init;
            const { backupEdi, f } = G;
            const propertyMap = {
                width: objWidth,
                height: objHeight,
                depth: objDepth,
                X: objPosX,
                Y: objPosY,
                Z: objPosZ,
                rX: objRotX,
                rY: objRotY,
                rZ: objRotZ,
            };
            for (const key in propertyMap) {
                if (Object.hasOwnProperty.call(propertyMap, key) && backupEdi[key] !== undefined) {
                    propertyMap[key].value = f(backupEdi[key]);
                }
            }
        },


        // 单击取消键后
        cancelAction : () => {
            const G = ccgxkObj.centerDot.init;
            G.quitPanel(G);
            ccgxkObj.centerDot.closePoint(ccgxkObj);  // 关闭小点
            hotPointInfo.innerHTML = '';
        },

        // 所有属性编辑框共同事件（主要是为了 onchange 事件）
        onchangeForeach : (input) => {
            const G = ccgxkObj.centerDot.init;
            input.addEventListener('change', ()=>{
                G.modelUpdate();
            });  // onchange 事件
            input.addEventListener('mouseover', () => {  // 鼠标悬浮属性值上，自动焦点
                if(isRealTimeUpdata.checked === false){ return 0; }
                if(rollerPlus.checked === false){ return 0; }
                input.focus();
                input.select();
            });  // 悬浮激活焦点
            input.addEventListener('wheel', (event) => {  // 滚轮增减数字大小
                if(isRealTimeUpdata.checked === false){ return 0; }
                if(rollerPlus.checked === false){ return 0; }
                event.preventDefault();
                var step = 0.1;
                var minValue = input.min;
                var currentValue = +input.value;
                if (event.deltaY < 0) {
                    currentValue += step;
                } else if (event.deltaY > 0) {
                    currentValue -= step;
                }
                if(!minValue || (minValue && (currentValue > minValue)) ){
                    input.value = G.f(currentValue);
                    input.select();
                    G.modelUpdate();
                }
            }, { passive: false });
        },

        // 单击画面后的事件（如 退出编辑）
        onclickView : (event) => {
            const G = ccgxkObj.centerDot.init;
            if(event.target.id === 'myHUDModal' || event.target.id === 'textureEditorClose') {  // 暂时退出编辑模式
                G.quitPanel(G);
            }
        },

        // 退出编辑器，等同于单击画面
        quitPanel : (G) => {
            myHUDModal.hidden = true;  // 隐藏模态框
            ccgxkObj.drawPointPause = false;  // 恢复绘制
            G.lockPointer();  // 锁定鼠标
            G.displayHotModel(true);
            G.music('closeEdi');
        },

        // 在屏幕左上角显示当前热点的信息
        showScreenHotInfo: () => {
            const G = ccgxkObj.centerDot.init;
            const Curr = ccgxkObj.hotPoint;
            if (Curr === G.showScreenHotInfo_lastId) { return }
            const info = ccgxkObj.indexToArgs.get(Curr);
            const { f } = G;
            const newHtml = info
                ? `<table class="data-table">
                    <tr>
                        <td>宽: ${f(info.width)},</td>
                        <td>高: ${f(info.height)},</td>
                        <td>深: ${f(info.depth)}</td>
                    </tr>
                    <tr>
                        <td>X: ${f(info.X)},</td>
                        <td>Y: ${f(info.Y)},</td>
                        <td>Z: ${f(info.Z)}</td>
                    </tr>
                    <tr>
                        <td>rX: ${f(info.rX)},</td>
                        <td>rY: ${f(info.rY)},</td>
                        <td>rZ: ${f(info.rZ)}</td>
                    </tr>
                </table>`
                : '';
            hotPointInfo.innerHTML = newHtml;
            G.showScreenHotInfo_lastId = Curr;
        },
        showScreenHotInfo_lastId: -1,


        // 形状的预设事件
        e_presets: ()=>{
            console.log('形状预设');
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




    };

    ccgxkObj.centerDot.init = {...g, ...ccgxkObj.centerDot.init};
}