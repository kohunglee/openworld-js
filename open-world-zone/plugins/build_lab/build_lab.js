/**
 * 供【建造器】使用的 实验块儿
 * ========
 * 
 */

import mydata from './data.js';

export default function(ccgxkObj) {

    const insts = [];

    // 这里开始写我的屋子 ----------------
    
    insts.push(...mydata());  // 导入我的数据












    // 屋子逻辑结束 ----------------

    console.log(insts);

    k.visCubeLen = insts.length - 1;


    // 其余 9990 个扔到很远的地方
    for (let i = 0; i < 9990; i++) {
        insts.push({
            x: 999999999, y: 999999999, z: 999999999,
            w: 0.001, d: 0.001, h: 0.001,
            rx: 0, ry: 0, rz: 0,
        });
    }

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