/**
 * 详细的建造内容
 */

import { COLORS, INDICES } from './constants.js';

export function processFullState(insts, ccgxkObj) {
    ['textureGetCubeData'].forEach(id => document.getElementById(id)?.remove());  // 防止误点
    const symer = new ccgxkObj.SymOffset(insts, ccgxkObj);  // 初始化对称工具

    insts.forEach(item => { //+ 全部涂装颜色
        if (!item.b) item.b = "#ff0000";
    });

    
    INDICES.test.forEach(i => insts[i] && (insts[i].b = "#0004ff"));
    // 预定义一组高区分度的颜色（避开蓝色 #0004ff）
    const COLORS = [
        "#8e1d1d", // 红
        "#00cc00", // 绿
        "#ff8800", // 橙
        "#cc00ff", // 紫
        "#00cccc", // 青
        "#ffcc00", // 黄
        "#ff0088", // 玫红
        "#88ff00", // 黄绿
        "#ff6666", // 浅红
        "#00ff88", // 薄荷绿
        "#aa5500", // 棕
        "#8888ff", // 淡紫蓝
        "#cc0044", // 深玫红
        "#00aa88", // 暗青
        "#ffaa88", // 杏色
        "#668800", // 橄榄绿
        "#ff44cc", // 粉紫
        "#44dddd", // 亮青
        "#bb8800", // 暗金
        "#77ff77", // 浅绿
    ];

    let colorIdx = 0;
    Object.keys(INDICES).forEach(key => {  // 涂装颜色方便区分
        if (key === "test") return;
        const color = COLORS[colorIdx++ % COLORS.length];
        INDICES[key].forEach(i => insts[i] && (insts[i].b = color));
    });


    symer.offset(INDICES.stage1h, 0.94, 16, 'x', 0.3, 'y');  // 阵列 1 楼台阶
    symer.offset([INDICES.stage2h[0]], 0.7, 16, 'z', 0.3, 'y');  // 阵列 1 楼台阶
    symer.offset([INDICES.stage2h[1]], -0.7, 16, 'z', 0.3, 'y');  // 阵列 1 楼台阶

    symer.offset([19], 5, 5, 'x')

    INDICES.inwall3h.push(symer.offset([269,270], 10.1, 2, 'x'));  
    INDICES.inwall3h.push(symer.offset([269,270], 15.05, 2, 'x'));

    // ----

    symer.symo([287,288], {z:5.539});  // 对称楼梯护栏
    symer.symo(INDICES.inwall3h, {z:5.539});  // 对称三楼的建筑

    // INDICES.exwall2h
    symer.offset(INDICES.exwall2h, -5, 2, 'y');






    return 0;

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
            insts[i].t = 'lab' + (sign_index++);
            arrC.push({ ...insts[i] });
            insts[i] = { "del": 1 };
        }
    });
    ccgxkObj.signTest(arrC, ccgxkObj);
}
