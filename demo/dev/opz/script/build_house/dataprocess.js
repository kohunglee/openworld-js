/**
 * 数据处理
 * -----------
 * 开始按照既定的规则，把 myData 给绘制出来
 */
function dataProcess(myData, blockName = 'manyCubes', offset={}) {

    // offset.x = 100;
    const myCubeInstances = [];
    const isHiddenVis = [];  // 【隐藏显示】表
    let cubeIndex = 0;  // 计数器
    let totalCube = 10000;  // 总方块数

    D = null;  // 释放内存（删去临时数据产生的内存）

    for (let index = 0; index < myData.length; index++) {  // 数据，填充我的容器
        addInsLD(myData[index], false, offset);
    }
    console.log('共', k.visCubeLen, '个可见方块');


    for (let index = 0; index < totalCube - k.visCubeLen; index++) {  // 空模型，填充容器里多余的空间
        addInsLD({
            x: 999999999, y: 999999999, z: 999999999,
            w: 0.001, d: 0.001, h: 0.001,
        }, true);
    }
    for (let index = 0; index < myCubeInstances.length; index++) {  // 为「实例」加上简单的物理引擎
        k.addTABox({
            DPZ : 4,
            isPhysical: (myData[index]?.st) ? false : true,
            mass: 0,
            background: '#4dff00ff',
            mixValue: 0.5,
            // colliGroup: 2,
            isShadow: false,
            X: myCubeInstances[index].x,
            Y: myCubeInstances[index].y,
            Z: myCubeInstances[index].z,
            width: myCubeInstances[index].w,
            depth: myCubeInstances[index].d,
            height: myCubeInstances[index].h,
            rX: myCubeInstances[index].rx,
            rY: myCubeInstances[index].ry,
            rZ: myCubeInstances[index].rz,
            // isInvisible: true,  // 只被探测，而不可见
            // hidden: true,
            // isInvisible: (myData[index]?.iv) ? true : false,
        });
        if(myCubeInstances[index]?.unIns === 1){  // 不在实例化里显示（unIns），则剔除
            myCubeInstances[index] = { x:999999999 }
        }
    }

    k.W.cube({  // 渲染实例化
        n: blockName,
        t: dls,  // 大理石
        instances: myCubeInstances, // 实例属性的数组
        mix: 0.7,
    });

    // myCubeInstances = null;  // 释放内存

    // 添加方块的函数
    function addInsLD (data, isHidden = false, offset = {}) {  
        if(data.del) {  // 【删除】标记，按照【空模型】处理
            data = {
                x: 999999999, y: 999999999, z: 999999999,
                w: 0.001, d: 0.001, h: 0.001,
            };
        }
        const result = {  // 添加一个立方体
            x: data.x + (offset?.x ?? 0), y: data?.y||1, z: data.z,
            w: data?.w || 1, d: data?.d || 1, h: data?.h || 1,
            rx: data?.rx||0, ry:data?.ry||0, rz:data?.rz||0,
        };
        if(data?.b){
            result.b = data.b;
        }
        if(data?.unIns){
            result.unIns = data.unIns;
        }
        myCubeInstances.push(result);
        if(isHidden !== true){
            k.visCubeLen = cubeIndex;  // 记录，有多少显示的，不过用处不大
        }
        isHiddenVis[cubeIndex] = isHidden;
        return cubeIndex++;
    }

}



        