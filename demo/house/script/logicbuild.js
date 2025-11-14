/**
 * 逻辑建造工具
 * ----------
 * 定义建造时的 偏移阵列、镜像 逻辑函数
 */
function logicFunc(){  // 
    globalThis.symopera = (items, axes={}) => {  // 对称操作
        if(k.notSymOff) return 0;
        var orig_data = cubeDatas[items];
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
        return cubeDatas.push(agent);
    }

    globalThis.offsetopera = (items, distance, times = 0, axes = 'x', distance2, axes2, distance3, axes3) => {  // 偏移操作
        if(k.notSymOff) return 0;
        var orig_data = cubeDatas[items];
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
        return cubeDatas.push(agent);
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

