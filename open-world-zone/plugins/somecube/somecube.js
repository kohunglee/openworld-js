/**
 * 一些方块 插件
 * ========
 * 功能是....
 */
export default function(ccgxkObj) {
    console.log('导入自己的 方块 插件成功');

    const insts = [

        {"x":13.041,"y":2.1,"z":31.406,"w":3,"d":0.2, st:1, "b": "888"}, // 灰色

    ];

    // 写入档案（基于 万数块 系统）
    ccgxkObj.dataProc.process({
        data: insts,
        name: 'first',
        type: 2,
        invisible: false,
         noIns: true,  // 纹理使用这种组合
    });


}