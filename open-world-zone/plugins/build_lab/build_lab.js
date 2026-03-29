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

    // 更进一步操作
    if(true){
        logicFunc(insts);
        
        // const test = offset([ 93 ], -1, 8, 'x', -0.5, 'y');
    }

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

    // 写入档案（基于 万数块 系统）
    const idx = ccgxkObj.dataProc.process({
        data: insts,
        name: 'build_lab',
        type: 1,
        texture: paper,
        mixValue: 0.1,
    });

    const rootArgs = k.indexToArgs.get(idx);  // 头索引 元数据
    if (!rootArgs) { return }
    const dataName = rootArgs.dataName;
    k.wBuildInstName = 'sk_' + idx + '_' + dataName;  // 建造器就操作这个
}



/**
 * 逻辑建造工具（临时在此，先不优化）
 * ----------
 * 定义建造时的 偏移阵列、镜像 逻辑函数
 */
function logicFunc(myData){  // 
    globalThis.symopera = (items, axes={}) => {  // 对称操作
        if(k.notSymOff) return 0;
        var orig_data = myData[items];
        var agent = {...orig_data};
        for (const axis of ["x", "y", "z"]) {
            if (axes[axis] !== undefined) {
                agent[axis] -= (orig_data[axis] - axes[axis]) * 2;
                const rot = (axis === 'z') ? 'x' : 'z';
                if(agent['r' + rot]){
                    agent['r' + rot] = - orig_data['r' + rot];
                }
            }
        }
        return myData.push(agent);
    }

    globalThis.offsetopera = (items, distance, times = 0, axes = 'x', distance2, axes2, distance3, axes3) => {  // 偏移操作
        if(k.notSymOff) return 0;
        var orig_data = myData[items];
        var agent = {...orig_data};
        for (const axis of ["x", "y", "z"]) {
            if (axes === axis) {
                agent[axis] -= distance * times;
            }
        }
        if(distance2) {
            for (const axis of ["x", "y", "z"]) {
                if (axes2 === axis) {
                    agent[axis] -= distance2 * times;
                }
            }
        }
        if(distance3) {
            for (const axis of ["x", "y", "z"]) {
                if (axes3 === axis) {
                    agent[axis] -= distance3 * times;
                }
            }
        }
        return myData.push(agent);
    }
    
    globalThis.symo = (items, axes = {}) => {  // 对称数组内的物体
        const addInfo = [];
        for (const it of items) {
            if(it === -1) continue;
            if (Array.isArray(it)) {
                for (let n = it[0]; n <= it[1]; n++) {
                    addInfo.push(symopera(n, axes) - 1); 
                }
            } else {
                addInfo.push(symopera(it, axes) - 1);
            }
        }
        return addInfo;
    }
    
    globalThis.offset = (items, distance, times, axes, distance2, axes2, distance3, axes3) => {  // 偏移数组内的物体
        const addInfo = [];
        for (let index = 1; index < times; index++) {  // 偏移
            for (const it of items) {
                if(it === -1) continue;
                if (Array.isArray(it)) {
                    for (let n = it[0]; n <= it[1]; n++) {
                        addInfo.push(offsetopera(n, distance, index, axes, distance2, axes2, distance3, axes3) - 1);
                    }
                } else {
                    addInfo.push(offsetopera(it, distance, index, axes, distance2, axes2, distance3, axes3) - 1);
                }
            }
        }
        return addInfo;
    }
}

