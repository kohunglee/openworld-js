
// 不行，有卡顿，必须得想办法将方块优化到极致


// const cube = {
//   vertices: [
//     .5, .5, .5,  -.5, .5, .5,  -.5,-.5, .5,
//     .5, .5, .5,  -.5,-.5, .5,   .5,-.5, .5,
//     .5, .5,-.5,   .5, .5, .5,   .5,-.5, .5,
//     .5, .5,-.5,   .5,-.5, .5,   .5,-.5,-.5,
// //     .5, .5,-.5,  -.5, .5,-.5,  -.5, .5, .5,
// //     .5, .5,-.5,  -.5, .5, .5,   .5, .5, .5,
// //    -.5, .5, .5,  -.5, .5,-.5,  -.5,-.5,-.5,
// //    -.5, .5, .5,  -.5,-.5,-.5,  -.5,-.5, .5,
// //    -.5, .5,-.5,   .5, .5,-.5,   .5,-.5,-.5,
// //    -.5, .5,-.5,   .5,-.5,-.5,  -.5,-.5,-.5,
// //     .5,-.5, .5,  -.5,-.5, .5,  -.5,-.5,-.5,
// //     .5,-.5, .5,  -.5,-.5,-.5,   .5,-.5,-.5
//   ],
//   uv: Array(8).fill([1,1,0,1,0,0,1,1,0,0,1,0]).flat()
// };

// // 测试合并模型
// function mergeCubes(cube, positions) {
//     const vertices = [];
//     const uvs = [];

//     for (const [dx, dy, dz] of positions) {
//         // 复制顶点并加上偏移
//         for (let i = 0; i < cube.vertices.length; i += 3) {
//             vertices.push(
//                 cube.vertices[i] + dx,
//                 cube.vertices[i + 1] + dy,
//                 cube.vertices[i + 2] + dz
//             );
//         }
//         // UV 直接附加
//         uvs.push(...cube.uv);
//     }

//     return { vertices, uv: uvs };
// }

// console.time('实例合并测试');

// // const num = 4; // 合并 每边立方体数量
// // const kkk = 17; // 实例化 每边数量
// const hbX = 4;
// const hbY = (70/hbX) | 0;
// console.log(hbY);

// const num = hbX; // 合并 每边立方体数量
// const kkk = hbY; // 实例化 每边数量

// const spacing = 2; // 每个立方体之间的间距（例如边长+空隙）

// const positions = [];

// for (let x = 0; x < num; x++) {
//   for (let y = 0; y < num; y++) {
//     for (let z = 0; z < num; z++) {
//       positions.push([
//         x * spacing,
//         y * spacing,
//         z * spacing,
//       ]);
//     }
//   }
// }
// const merged = mergeCubes(cube, positions);
// const objName = 'mylearn';
// // 输入我的模型
// k.W.add("hexahedron", merged);
// k.W.models['hexahedron'].verticesBuffer = null;


// const spacing002 = 20;    // 每个格子间距
// const testHBSLHInst = [];

// for (let x = 0; x < kkk; x++) {
//   for (let y = 0; y < kkk; y++) {
//     for (let z = 0; z < kkk; z++) {
//       testHBSLHInst.push({
//         x: x * spacing002,
//         y: y * spacing002,
//         z: z * spacing002
//       });
//     }
//   }
  
// }

// console.log('合并数量', positions.length);

// console.log('实例数量', testHBSLHInst.length);

// console.log('总数量', positions.length * testHBSLHInst.length);

// k.W.hexahedron({  // 渲染实例化
//     n: 'testHBSLH',
//     t: dls,  // 大理石
//     instances: testHBSLHInst, // 实例属性的数组
//     b:'fffb00',
//     mix: 0.5,
// });

// console.timeEnd('实例合并测试');



    // k.W.cube({  // 渲染实例化
    //     n: 'testIns001',
    //     instances: k.testInsData, // 实例属性的数组
    //     x: 9,
    //     y: 3,
    //     z: 9,
    // });



    // { 
    //     instances: k.testInsData,
    //     x: 9,
    //     y: 3,
    //     z: 9,
    // }

    // const args111 = k.indexToArgs.get(102);
    //         args111.other =     { 
    //     instances: k.testInsData,
    //     x: 9,
    //     y: 3,
    //     z: 9,
    // };

    const  testInsPlane = [
        {
               
            },
    ];

