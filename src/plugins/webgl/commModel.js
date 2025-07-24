/**
 * 几个常见的基础 3D 模型
 * ========
 */

// 插件入口
export default function(ccgxkObj) {
    // 六棱柱 prism
    (
        (
            i,          // 一个计数器，像尺子上的刻度
            angle,      // 旋转的角度，圆规张开的弧度
            vertices = [],
            uv = [],
            indices = [],
            normals = [],
            sides = 6,      // 6 棱柱
            radius = 0.5,   // 底面的半径，决定柱子粗细
            height = 1.0    // 柱子的高度
        ) => {
            
            ccgxkObj.W.add("prism", { vertices, uv, });  // 交付
    })();
}