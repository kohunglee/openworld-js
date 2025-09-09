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
            myHUDModal.hidden = true;  // 隐藏模态框
            ccgxkObj.drawPointPause = false;  // 恢复绘制
            G.lockPointer();  // 锁定鼠标
            ccgxkObj.centerDot.closePoint(ccgxkObj);  // 关闭小点
            G.displayHotModel(true);  // 清除所有的变红方格
            G.music('closeEdi');  // 关闭编辑器（音效）
        },

        // 所有属性编辑框的 OnChange 事件
        onchangeForeach : (input) => {
            const G = ccgxkObj.centerDot.init;
            input.addEventListener('change', ()=>{
                G.modelUpdate();
            });  // onchange 事件
            input.addEventListener('mouseover', () => {  // 鼠标悬浮属性值上，自动焦点
                if(isRealTimeUpdata.checked === false){ return 0; }
                if(rollerPlus.checked === false){ return 0; }
                input.focus();
            });  // 悬浮激活焦点
            input.addEventListener('wheel', (event) => {  // 滚轮增减数字大小
                if(isRealTimeUpdata.checked === false){ return 0; }
                if(rollerPlus.checked === false){ return 0; }
                event.preventDefault();
                var step = 0.1;
                var minValue = event.target.min;
                var currentValue = +input.value;
                if (event.deltaY < 0) {
                    currentValue += step;
                } else if (event.deltaY > 0) {
                    currentValue -= step;
                }
                if(!minValue || (minValue && (currentValue > minValue)) ){
                    input.value = currentValue;
                    G.modelUpdate();
                }
            }, { passive: false });
        },

        // 单击画面后的事件（如 退出编辑）
        onclickView : (event) => {
            const G = ccgxkObj.centerDot.init;
            if(event.target.id === 'myHUDModal' || event.target.id === 'textureEditorClose') {  // 暂时退出编辑模式
                myHUDModal.hidden = true;  // 隐藏模态框
                G.lockPointer();  // 锁定鼠标
                ccgxkObj.drawPointPause = false;  // 恢复绘制
                G.displayHotModel(true);
                G.music('closeByClick');
            }
        },

        // 在屏幕左上角显示当前热点的信息
        showScreenHotInfo : () => {
            const G = ccgxkObj.centerDot.init;
            const Curr = ccgxkObj.hotPoint
            if(Curr !== G.showScreenHotInfo_lastId) {
                // console.log('opera');
                G.showScreenHotInfo_lastId = Curr;
            }
        },
        showScreenHotInfo_lastId : -1,
    };

    ccgxkObj.centerDot.init = {...g, ...ccgxkObj.centerDot.init};
}