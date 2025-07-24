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

    // 四面体 Tetrahedron
    ccgxkObj.W.add("Tetra", {
        vertices: [
            0, 0, 0,
            1, 0, 0,
            1, 0, 1,
            0, 0, 1,
        ],
  
        indices: [
            0, 1, 2,
            0, 3, 2,
        ]
    });

    // 学习 uv 使用的面
    ccgxkObj.W.add("uvplane", {
        vertices: [
            1,1,0,  //  口'
            0,1,0,  // '口
            0,0,0,  // .口
            1,0,0,  //  口.
        ],
        uv: [
            1,1,
            0,1,
            0.5,0.5,
            1,0,
        ],
        indices: [  // 沿着对角线来画三角
            0,1,2,
            0,2,3
        ],
    });
      

    // // （测试）两个四面体 Tetrahedron2
    // ccgxkObj.W.add("Tetrahedron2", {
    //     vertices: [5,0,0,0,0,5,5,5,5,5,0,5,10,0,0,5,0,5,10,5,5,10,0,5].map(x=>x/10),
    //     uv: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    //     indices: [0,1,2,0,3,1,2,3,0,2,1,3,4,5,6,4,7,5,6,7,4,6,5,7]
    // });
}