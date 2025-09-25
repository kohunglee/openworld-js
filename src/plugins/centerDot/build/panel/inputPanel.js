/**
 * 和输入框、模型、屏幕有关的函数组件 (建造师，初始化建造师（引用中心点插件）)
 * ========
 * 实验中，可以移动物体
 */
export default function(ccgxkObj) {
    const g = {
        //从 backupEdi 里拿数据填充编辑区
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
            objColor.value = (backupEdi['insColor']) ? '#' + backupEdi['insColor'] : '#888888';
            G.drawFDico();  // 绘制箭头
        },

        // 面板的移动
        isDragging : false,
        panelMoveInit : (e) => {
            const G = ccgxkObj.centerDot.init;
            G.isDragging = true; // 激活拖拽状态
            G.panelOffsetX = e.clientX - myHUDObjEditor.getBoundingClientRect().left;
            G.panelOffsetY = e.clientY - myHUDObjEditor.getBoundingClientRect().top;
            myHUDObjEditor.style.cursor = 'grabbing'; // 切换为抓紧的手势
        },
        panelMove : (e) => {
            const G = ccgxkObj.centerDot.init;
            if (!G.isDragging) return; // 如果契约未激活，则忽略所有移动
            myHUDObjEditor.style.marginLeft = `${e.clientX - G.panelOffsetX}px`;
            myHUDObjEditor.style.marginTop = `${e.clientY - G.panelOffsetY}px`;
        },
        panelMoveEnd : () => {
            const G = ccgxkObj.centerDot.init;
            G.isDragging = false;
            myHUDObjEditor.style.cursor = 'grab'; // 恢复可抓取手势
        },

        // 在编辑器上绘制【左右变化】、【前后移动】的参考箭头
        drawFDico : () => {
            const G = ccgxkObj.centerDot.init;
            const thisry = G.backupEdi.rY;  //+9 绘制参考箭头
            const mVP = ccgxkObj.mainVPlayer;
            const mVPry = ccgxkObj.calYAngle(mVP.rX, mVP.rY, mVP.rZ) * 180 / Math.PI;
            const axis = G.calForwardAxis(G.nDeg(mVPry), 0);  // 计算出用户自己正朝向的轴
            var icoF = [], icoD = [];
            G.forwardAxis = axis;
            (axis.nega?icoD:icoF).push('etext_' + axis.axis);  // 正/反数组 添加相应的结果（方块移动的正方向）
            const widthDepth = G.calForwardAxis(G.nDeg(mVPry), thisry).axis === 'z' ? 'w': 'd';
            G.axis_widthDepth = widthDepth;  // 记录当前宽/深轴
            icoF.push('etext_' + widthDepth);  // 正向箭头添加【宽/深】计算结果（方块在用户视角的左右正方向）
            G.addFDico(icoF, icoD);  // 绘制箭头
            return 0;
        },

        // 去除所有 前后 标识
        removeFDicon : () => {
            const elements = document
                .querySelectorAll('.e-panel-T, .e-panel-D');
            elements.forEach(el => {
                el.classList.remove('e-panel-T', 'e-panel-D');
            });
        },

        // 添加 前后 标识
        addFDico : (listTOP = [], listDown = []) => {
            const G = ccgxkObj.centerDot.init;
            G._applyClassToIds(listTOP, 'e-panel-T');
            G._applyClassToIds(listDown, 'e-panel-D');
        },
    };

    ccgxkObj.centerDot.init = {...g, ...ccgxkObj.centerDot.init};
}







