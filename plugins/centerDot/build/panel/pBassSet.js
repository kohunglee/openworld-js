/**
 * 编辑面板里的基点设置 (建造师，初始化建造师（引用中心点插件）)
 * ========
 * 四个基点，分别是左右上下
 */

export default function(ccgxkObj) {
    var g = {
        // 物体形变的基点（边）逻辑
        deformationBaseType : -1,  // 0 左基点，1 上基点，2 右基点，3 下基点
        deformationBase: (inputID, step) => {
            const G = ccgxkObj.centerDot.init;
            const xValue = +objPosX.value;
            const yValue = +objPosY.value;
            const zValue = +objPosZ.value;
            const wOrD = (G.axis_widthDepth === 'w') ? 'objWidth' : 'objDepth';
            var radians = objRotY.value * (Math.PI / 180);  // 旋转角度（当前只支持 Y 轴，未来再加别的吧）
            if(G.deformationBaseType === 0){  // 左基点
                if(inputID === wOrD){
                    if(!G.forwardAxis.nega){step = -step}
                    if((G.axis_widthDepth === 'w')){
                        objPosX.value = (xValue+step/2*Math.cos(radians));
                        objPosZ.value = (zValue-step/2*Math.sin(radians));
                    } else {
                        objPosX.value = (xValue-step/2*Math.sin(radians));  // 为减去，下同
                        objPosZ.value = (zValue-step/2*Math.cos(radians));
                    }
                }
            } else if (G.deformationBaseType === 2){  // 右基点
                if(inputID === wOrD){
                    step = -step;
                    if(!G.forwardAxis.nega){step = -step}
                    if((G.axis_widthDepth === 'w')){
                        objPosX.value = (xValue+step/2*Math.cos(radians));
                        objPosZ.value = (zValue-step/2*Math.sin(radians));
                    } else {
                        objPosX.value = (xValue-step/2*Math.sin(radians));
                        objPosZ.value = (zValue-step/2*Math.cos(radians));
                    }
                }
            } else if (G.deformationBaseType === 1){  // 上基点
                if(inputID === 'objHeight'){
                    step = -step;
                    objPosY.value = (yValue+step/2).toFixed(3);
                }
            } else if (G.deformationBaseType === 3){  // 下基点
                if(inputID === 'objHeight'){
                    objPosY.value = (yValue+step/2).toFixed(3);
                }
            }
        },

        // 基点的设置
        bassSet : (e, type, sound = true) => {
            const G = ccgxkObj.centerDot.init;
            if(type === G.deformationBaseType){
                type = G.deformationBaseType = -1;
            }
            G.deformationBaseType = type;
            e_bassL.style.backgroundColor = (type === 0)? 'red' : 'revert';
            e_bassT.style.backgroundColor = (type === 1)? 'red' : 'revert';
            e_bassR.style.backgroundColor = (type === 2)? 'red' : 'revert';
            e_bassB.style.backgroundColor = (type === 3)? 'red' : 'revert';
            if(sound){
                G.music('bassSet');
            }
        },

    };

    ccgxkObj.centerDot.init = {...g, ...ccgxkObj.centerDot.init};
}