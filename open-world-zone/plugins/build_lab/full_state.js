/**
 * 详细的建造内容
 */

import { COLORS, D } from './constants.js';

export function processFullState(insts, ccgxkObj) {
    
    let isok = false;if(ccgxkObj.mode !== 0){isok = true}
    // isok = true;


    // 装修（数据破坏型）
    if(isok){
        ['textureGetCubeData'].forEach(id => document.getElementById(id)?.remove());  // 防止误点
        const symoff = new ccgxkObj.SymOffset(insts, ccgxkObj);  // 初始化对称工具

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
            symoff.offset(D.stage1h, 0.94, 16, 'x', 0.3, 'y');  // 阵列 1 楼台阶
            D.stage001of2h = symoff.offset([D.stage2h[0]], 0.7, 16, 'z', 0.3, 'y');  // 阵列 2 楼台阶 1
            D.stage002of2h = symoff.offset([D.stage2h[1]], -0.7, 16, 'z', 0.3, 'y');  // 阵列 2 楼台阶 2
        }

        // 三楼内墙的阵列逻辑
        if(true){
            D.inwall3h.push(...symoff.offset(D.inXWall3h, 10.1, 2, 'x'));  
            D.inwall3h.push(...symoff.offset(D.inXWall3h, 15.05, 2, 'x'));
            const temp = symoff.offset(D.inXWall3h002, 5, 5, 'x');
            D.inwall3h.push( ...temp, ...D.inXWall3h002 );
        }

        // 三楼画板的阵列
        if(true) {
            D.house1H3.push( ...symoff.offset(D.house1H3, 5, 5, 'x') );
        }

        // 前三层的一些对称
        if(true){
            D.stage1hrail.push(...symoff.symo(D.stage1hrail, {z:5.539}));  // 对称楼梯护栏
            D.inwall3h.push( ...symoff.symo(D.inwall3h, {z:5.539}) );  // 对称三楼的建筑
            D.house1H3.push( ...symoff.symo(D.house1H3, {z:5.539}) );  // 对称三楼的左侧的画板
            // D.floorSign.push( ...symoff.symo(D.floorSign, {z:7.639}) );
        }

        // 二楼三楼向上的阵列
        if(true){
            const floorValue = 10;  // 总层数

            D.exwall2h.push( ...symoff.offset([...D.exwall2h,], -5, floorValue - 1, 'y') );  // 二楼外墙

            symoff.offset([
                ...D.floor3h,   // 三楼的地板
                ...D.stage001of2h,D.stage2h[0],  // 二楼楼梯01
                ...D.stage002of2h,D.stage2h[1],  // 二楼楼梯02
                D.stage1hrail[1],D.stage1hrail[3],  // 台阶护栏
            ], -5, floorValue - 1, 'y');  // 把二楼的墙，阵列上去

            symoff.offset([
                ...D.inwall3h, ...D.rail3h, ...D.inXWall3h, ...D.inXWall3h002, // 三楼的建筑
                // ...D.house1H3,  // 二楼的画板
                // ...D.floorSign,  // 三楼的楼板告示
            ], -5, floorValue - 2, 'y');  // 把二楼的墙，阵列上去

            D.house1H3.push( ...symoff.offset(D.house1H3, -5, floorValue - 2, 'y') );
            D.floorSign.push( ...symoff.offset(D.floorSign, -5, floorValue - 2, 'y') );
        }
    }

    // 写入画板（数据破坏型）
    if(isok) {
        ['textureGetCubeData'].forEach(id => document.getElementById(id)?.remove());  // 防止误点
        var arrC = [];  //+ 提取信息板属性到 arrC
        let sign_index = 1;

        console.log('楼上，一共有 ' + D.house1H3.length + ' 个画板');

        D.house1H3.forEach(i => {
            if (insts[i]) {
                insts[i].dz ??= 4;
                insts[i].st = 1;

                if( +(insts[i].z).toFixed(3) === -11.982){  // 弄一下西墙的画板
                    insts[i].z = -11.732;
                }

                insts[i].t = 'house1H3-' + (sign_index++);
                arrC.push({ ...insts[i] });
                insts[i] = { "del": 1 };
            }
        });
        ccgxkObj.signTest(arrC, ccgxkObj, {x:0}, 1);

        var arrD = [];
        sign_index = 0;
        D.board1h.forEach(i => {
            if (insts[i]) {
                insts[i].dz ??= 3;
                insts[i].st = 1;
                insts[i].t = 'board1h-' + (sign_index++);
                arrD.push({ ...insts[i] });
                insts[i] = { "del": 1 };
            }
        });
        ccgxkObj.signTest(arrD, ccgxkObj, {x:0}, 1);

        var arr = [];
        sign_index = 0;
        D.floorSign.forEach(i => {
            if (insts[i]) {
                insts[i].dz ??= 2;
                insts[i].st = 1;
                insts[i].t = 'floorSign-' + (sign_index++);
                arr.push({ ...insts[i] });
                insts[i] = { "del": 1 };
            }
        });
        ccgxkObj.signTest(arr, ccgxkObj, {x:0}, 1);
    }
    return 0;
}
