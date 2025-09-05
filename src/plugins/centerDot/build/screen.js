/**
 * 和屏幕鼠标锁定有关的函数组件 (建造师，初始化建造师（引用中心点插件）)
 * ========
 * 实验中，可以移动物体
 */

export default function(ccgxkObj) {
    
    var G = {
        ...ccgxkObj.centerDot.init,


    };

    ccgxkObj.centerDot.init = {...G, ...ccgxkObj.centerDot.init};
}
