/**
 * 供【建造器】使用的 实验块儿
 * ========
 * 
 */
export default function(ccgxkObj) {
    console.log('导入自己的 方块 插件成功');

    const insts = [];

    // 9 个正常摆放（3×3 阵列）
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            insts.push({
                x: col * 2, y: 1, z: row * 2 + 10,
                w: 1, d: 1, h: 1,
                rx: 0, ry: 0, rz: 0,
            });
        }
    }

    insts.push({"x":4,"z":4,"y":4},);


    // 这里开始写我的屋子 ----------------














    // 屋子逻辑结束 ----------------

    k.visCubeLen = insts.length - 1;

    // 其余 9990 个扔到很远的地方
    for (let i = 0; i < 9990; i++) {
        insts.push({
            x: 999999999, y: 999999999, z: 999999999,
            w: 0.001, d: 0.001, h: 0.001,
            rx: 0, ry: 0, rz: 0,
        });
    }
    
    k.visCubeLen = 9;  // build 插件必要的！

    // 写入档案（基于 万数块 系统）
    const idx = ccgxkObj.dataProc.process({
        data: insts,
        name: 'build_lab',
        type: 1,
    });

    const rootArgs = k.indexToArgs.get(idx);  // 头索引 元数据
    if (!rootArgs) { return }
    const dataName = rootArgs.dataName;
    k.wBuildInstName = 'sk_' + idx + '_' + dataName;  // 建造器就操作这个

}