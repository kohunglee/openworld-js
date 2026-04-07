/**
 * 详细的建造内容
 */

import { COLORS, D } from './constants.js';

export function processFullState(insts, ccgxkObj) {
    ['textureGetCubeData'].forEach(id => document.getElementById(id)?.remove());  // 防止误点
    const symer = new ccgxkObj.SymOffset(insts, ccgxkObj);  // 初始化对称工具

    insts.forEach(item => { //+ 全部涂装颜色
        if (!item.b) item.b = "#ff0000";
    });

    
    D.test.forEach(i => insts[i] && (insts[i].b = "#0004ff"));  // （测试）便于标识
    
    // 区分颜色
    if(true){
        const COLORS = [ // 预定义一组高区分度的颜色（避开蓝色 #0004ff）
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
        Object.keys(D).forEach(key => {  // 涂装颜色方便区分
            if (key === "test") return;
            const color = COLORS[colorIdx++ % COLORS.length];
            D[key].forEach(i => insts[i] && (insts[i].b = color));
        });
    }
    
    // 一楼二楼台阶的阵列
    if(true){
        symer.offset(D.stage1h, 0.94, 16, 'x', 0.3, 'y');  // 阵列 1 楼台阶
        D.stage001of2h = symer.offset([D.stage2h[0]], 0.7, 16, 'z', 0.3, 'y');  // 阵列 2 楼台阶 1
        D.stage002of2h = symer.offset([D.stage2h[1]], -0.7, 16, 'z', 0.3, 'y');  // 阵列 2 楼台阶 2
    }

    // 三楼内墙的阵列逻辑
    if(true){
        D.inwall3h.push(...symer.offset(D.inXWall3h, 10.1, 2, 'x'));  
        D.inwall3h.push(...symer.offset(D.inXWall3h, 15.05, 2, 'x'));
        const temp = symer.offset(D.inXWall3h002, 5, 5, 'x');
        D.inwall3h.push( ...temp, ...D.inXWall3h002 );
    }

    // 前三层的一些对称
    if(true){
        D.stage1hrail.push(...symer.symo(D.stage1hrail, {z:5.539}));  // 对称楼梯护栏
        symer.symo(D.inwall3h, {z:5.539});  // 对称三楼的建筑
    }

    // 二楼三楼向上的阵列
    if(true){
        symer.offset([
            ...D.exwall2h,  // 二楼外墙
        ], -5, 2, 'y');  // 把二楼的墙，阵列上去

        symer.offset([
            ...D.exwall2h,  // 二楼外墙
            ...D.floor3h,   // 三楼的地板
            ...D.stage001of2h,D.stage2h[0],  // 二楼楼梯01
            ...D.stage002of2h,D.stage2h[1],  // 二楼楼梯02
            D.stage1hrail[1],D.stage1hrail[3],  // 台阶护栏
            ...D.rail3h,  // 小护栏
        ], -5, 2, 'y');  // 把二楼的墙，阵列上去
    }

    return 0;















    symer.offset([93], -0.9, 8, 'x', -0.48, 'y');  // 阵列台阶

    

    const arrB = [];  //+ 提取地板属性到 arrB
    D.floor.forEach(i => {
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
    D.signBoard.forEach(i => {
        if (insts[i]) {
            insts[i].dz ??= 3;
            insts[i].t = 'lab' + (sign_index++);
            arrC.push({ ...insts[i] });
            insts[i] = { "del": 1 };
        }
    });
    ccgxkObj.signTest(arrC, ccgxkObj);
}
