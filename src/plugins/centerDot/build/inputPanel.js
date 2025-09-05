/**
 * 和输入框有关的函数组件 (建造师，初始化建造师（引用中心点插件）)
 * ========
 * 实验中，可以移动物体
 */

export default function(ccgxkObj) {
    
    var G = {
        ...ccgxkObj.centerDot.init,

        // 辅助函数，批量设置 EdiArgsInput 的 number 的 step
        setInputsStep : (stepValue) => {
            const EdiArgsInput = document.querySelectorAll('.EdiArgsInput');  // 那一大堆 OBJ 属性框
            EdiArgsInput.forEach(input => {
                input.step = stepValue;
            })
        },
    };

    ccgxkObj.centerDot.init = {...G, ...ccgxkObj.centerDot.init};
}
