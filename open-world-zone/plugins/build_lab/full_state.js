/**
 * 详细的建造内容
 */

import { COLORS, INDICES } from './constants.js';

export function processFullState(insts, ccgxkObj) {
    ['textureGetCubeData'].forEach(id => document.getElementById(id)?.remove());  // 防止误点
    const symer = new ccgxkObj.SymOffset(insts, ccgxkObj);  // 初始化对称工具

    insts.forEach(item => { //+ 涂装颜色
        if (!item.b) item.b = COLORS.BASE;
    });
    INDICES.floor.forEach(i => insts[i] && (insts[i].b = COLORS.FLOOR));
    INDICES.decorations.forEach(i => insts[i] && (insts[i].b = COLORS.DECO));

    symer.offset([93], -0.9, 8, 'x', -0.48, 'y');  // 阵列台阶

    const arrB = [];  //+ 提取地板属性到 arrB
    INDICES.floor.forEach(i => {
        if (insts[i]) {
            arrB.push({ ...insts[i] });
            insts[i] = { "del": 1 };
        }
    });

    ccgxkObj.dataProc.process({  //+ 显示 arrB 地板
        data: arrB,
        name: 'build_lab_stage',
        type: 2,
        texture: paper02,
        mixValue: 0.8,
    });

    const arrC = [];  //+ 提取信息板属性到 arrC
    let sign_index = 1;
    INDICES.signBoard.forEach(i => {
        if (insts[i]) {
            insts[i].dz ??= 3;
            insts[i].t = 'testSign' + (sign_index++);
            arrC.push({ ...insts[i] });
            insts[i] = { "del": 1 };
        }
    });
    ccgxkObj.signTest(arrC, ccgxkObj);
}
