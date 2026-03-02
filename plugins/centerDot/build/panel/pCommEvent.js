/**
 * 面板里的各种事件之公共事件 (建造师，初始化建造师（引用中心点插件）)
 * ========
 * 主要是为了 onchange 事件
 */

export default function(ccgxkObj) {
    var g = {
        // 所有属性编辑框共同事件（主要是为了 onchange 事件）
        onchangeForeach : (input) => {
            const G = ccgxkObj.centerDot.init;
            input.addEventListener('focus', (e)=>{  // focus 事件，记录 change 之前的值，方便计算 step
                G.lastInputValue = e.target.value;
            });
            input.addEventListener('keydown', (e)=>{  // 主要用于处理魔法数字
                if(magicNum.value){
                    if(e.key === 'ArrowUp') {
                        input.value = (+magicNum.value + +input.value);
                        G.modelUpdate();
                    }
                    if(e.key.slice(0, 5) === 'Arrow') {
                        G.clearMagicNum();
                    }
                }
            })
            input.addEventListener('change', (e)=>{  // onchange 事件
                const step = (e.target.value - G.lastInputValue).toFixed(4);
                G.lastInputValue = e.target.value;
                G.deformationBase(input.id, step);
                G.modelUpdate();
            });
            input.addEventListener('mousedown', function(event) {  // 鼠标滚轮中键，处理魔法数字
                if (event.button === 1) {
                    var step;
                    if(magicNum.value) {
                        step = Number(magicNum.value);
                        G.clearMagicNum();
                    } else {return 0}
                    var currentValue = +input.value;
                    input.value = G.f(currentValue+step);
                    G.deformationBase(input.id, step);
                    input.select();
                    G.modelUpdate();
                    event.preventDefault();
                }
            });
            input.addEventListener('mouseover', () => {  // 鼠标悬浮属性值上，自动焦点
                if(isRealTimeUpdata.checked === false){ return 0; }
                if(rollerPlus.checked === false){ return 0; }
                input.focus();
                input.select();
            });
            input.addEventListener('wheel', (event) => {  // 滚轮增减数字大小
                if(isRealTimeUpdata.checked === false){ return 0; }
                if(rollerPlus.checked === false){ return 0; }
                event.preventDefault();
                var step = 0.001;  // 滚轮精确到毫米
                var minValue = input.min;
                var currentValue = +input.value;
                if (event.deltaY > 0) { step = -step }  // 滚轮向下，step 负值
                if(!minValue || (minValue && (currentValue > minValue)) ){
                    if(magicNum.value) {  // 处理魔法数字
                        if(step > 0){
                            step = Number(magicNum.value);
                        }
                        G.clearMagicNum();
                    }
                    input.value = G.f(currentValue+step);
                    G.deformationBase(input.id, step);  // 基点操作的逻辑
                    input.select();
                    G.modelUpdate();
                }
            }, { passive: false });
            input.addEventListener('mouseout', () => { // 鼠标移出，焦点失去
                if(isRealTimeUpdata.checked === false){ return 0; }
                if(rollerPlus.checked === false){ return 0; }
                input.blur(); // 主动失去焦点
            });
        },
    };

    ccgxkObj.centerDot.init = {...g, ...ccgxkObj.centerDot.init};
}