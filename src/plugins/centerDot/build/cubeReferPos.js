
/**
 * 添加方块时的位置参考组件 (建造师，初始化建造师（引用中心点插件）)
 * ========
 * 实验中，可以移动物体
 */

export default function(ccgxkObj) {
    var g = {

        // 显示参考位置
        displayRefer : () => {
            const G = ccgxkObj.centerDot.init;
            ccgxkObj.W.cube({  //  参考位置
                g:'mainPlayer',
                n:'new_cube_pos',
                y: 0,
                x: 0,
                z: -5,
                w:1,  h:1,  d:1,
                b:'#bbbbbb46',
            });
        },

    };

    ccgxkObj.centerDot.init = {...g, ...ccgxkObj.centerDot.init};
}