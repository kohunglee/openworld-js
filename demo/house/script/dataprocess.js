/**
 * 数据处理
 * -----------
 * 开始按照既定的规则，把 cubeDatas 给绘制出来
 */
function dataProcess() {

    D = null;  // 释放内存（删去临时数据产生的内存）

    for (let index = 0; index < cubeDatas.length; index++) {  // 数据，填充我的容器
        addInsLD(cubeDatas[index]);
    }
    console.log('共', k.visCubeLen, '个可见方块');

    for (let index = 0; index < totalCube - k.visCubeLen; index++) {  // 空模型，填充容器里多余的空间
        addInsLD({
            x: 999999999, y: 999999999, z: 999999999,
            w: 0.001, d: 0.001, h: 0.001,
        }, true);
    }
    for (let index = 0; index < cubeInstances.length; index++) {  // 为「实例」加上简单的物理引擎
        k.addTABox({
            DPZ : 4,
            isPhysical: (cubeDatas[index]?.st) ? false : true,
            mass: 0,
            background: '#f6a1a1ff',
            mixValue: 0.5,
            // colliGroup: 2,
            isShadow: false,
            X: cubeInstances[index].x,
            Y: cubeInstances[index].y,
            Z: cubeInstances[index].z,
            width: cubeInstances[index].w,
            depth: cubeInstances[index].d,
            height: cubeInstances[index].h,
            rX: cubeInstances[index].rx,
            rY: cubeInstances[index].ry,
            rZ: cubeInstances[index].rz,
            isInvisible: true,  // 只被探测，而不可见
            // hidden: true,
            // isInvisible: (cubeDatas[index]?.iv) ? true : false,
        });
        if(cubeInstances[index]?.b){  // 别忘了，还要把颜色加入到档案 insColor 里
            const args = k.indexToArgs.get(index);
            args.insColor = cubeInstances[index].b;
        }
        if(cubeInstances[index]?.unIns === 1){  // 不在实例化里显示（unIns），则剔除
            cubeInstances[index] = { x:999999999 }
        }
    }

    k.W.cube({  // 渲染实例化
        n: 'manyCubes',
        t: dls,  // 大理石
        instances: cubeInstances, // 实例属性的数组
        mix: 0.7,
    });

    cubeInstances = null;  // 释放内存
}

// 添加方块的函数
function addInsLD (data, isHidden = false) {  
    if(data.del) {  // 【删除】标记，按照【空模型】处理
        data = {
            x: 999999999, y: 999999999, z: 999999999,
            w: 0.001, d: 0.001, h: 0.001,
        };
    }
    const result = {  // 添加一个立方体
        x: data.x, y: data?.y||1, z: data.z,
        w: data?.w || 1, d: data?.d || 1, h: data?.h || 1,
        rx: data?.rx||0, ry:data?.ry||0, rz:data?.rz||0,
    };
    if(data?.b){
        result.b = data.b;
    }
    if(data?.unIns){
        result.unIns = data.unIns;
    }
    cubeInstances.push(result);
    if(isHidden !== true){
        k.visCubeLen = cubeIndex;  // 记录，有多少显示的，不过用处不大
    }
    isHiddenVis[cubeIndex] = isHidden;
    return cubeIndex++;
}


        