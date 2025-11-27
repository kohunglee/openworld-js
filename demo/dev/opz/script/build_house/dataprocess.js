/**
 * 数据处理
 * -----------
 * 开始按照既定的规则，把 myData 给绘制出来
 * del: 完全删除没数据的
 */
const dataProc = {

    // 一些参数
    buildMode: 0,  // 是否是建造模式，如果不是，则不渲染空模型
    totalCube: 10000,  // 总方块数
    cubeIndex: 0,  // 计数器
    myCubeInstances: [],  // 最终生成的实例数据，的容器

    // 读取和理解单个数据，放入 myCubeInstances 里，返回 index
    readData : (data, isHidden = false, offset = {}) => {
        if(data.del) {  // 处理已被标记 删除 的数据，按照【空模型】处理默认参数
            data = {
                x: 999999999, y: 999999999, z: 999999999,
                w: 0.001, d: 0.001, h: 0.001,
            };
        }
        const result = {  // 初始化一个模型，填充位置、大小、旋转，智能处理未定义的参数
            x: data.x + (offset?.x ?? 0), y: data?.y||1, z: data.z,
            w: data?.w || 1, d: data?.d || 1, h: data?.h || 1,
            rx: data?.rx||0, ry:data?.ry||0, rz:data?.rz||0,
        };
        if(data?.b) {  // 有颜色参数
            result.b = data.b;
        }
        dataProc.myCubeInstances.push(result);  // 数据放入（填充）实例化容器

        if(isHidden !== true) {  // K 记录当前有多少存入实例化的模型
            k.visCubeLen = dataProc.cubeIndex;
        }

        return dataProc.cubeIndex++;  // 返回当前模型的索引
    },

    // 填充 myCubeInstances
    fullInst: (data, offset)=>{
        const len = data.length;

        for (let index = 0; index < len; index++) {  // 实心数据，填充实例化容器
            dataProc.readData(data[index], false, offset);
        }
        console.log('共', dataProc.cubeIndex, '个可见方块（包括 del）');

        if(dataProc.buildMode) {  // 非建造模式，补全空模型
            for (let index = 0; index < dataProc.totalCube - k.visCubeLen; index++) {  // 空模型，填充容器里多余的空间（建造模式）
                dataProc.readData({
                    x: 999999999, y: 999999999, z: 999999999,
                    w: 0.001, d: 0.001, h: 0.001,
                }, true);
            }
        }
    },

    // 遍历 instData，添加物理体
    addPhysical: (data, instData) => {
        for (let index = 0; index < instData.length; index++) {
            k.addTABox({
                DPZ : 4,
                isPhysical: (data[index]?.st) ? false : true,  // 是否有物理属性
                mass: 0,
                background: '#4dff00ff',  // 调试时的高亮颜色
                mixValue: 0.5,
                // colliGroup: 2,
                isShadow: false,
                X: instData[index].x,
                Y: instData[index].y,
                Z: instData[index].z,
                width: instData[index].w,
                depth: instData[index].d,
                height: instData[index].h,
                rX: instData[index].rx,
                rY: instData[index].ry,
                rZ: instData[index].rz,
                isInvisible: true,  // 只被探测，而不可见
                // hidden: true,
                // isInvisible: (myData[index]?.iv) ? true : false,
            });
        }
    },

    // 渲染实例化
    renderInst: (instName) => {
        k.W.cube({  // 渲染实例化
            n: instName,
            t: dls,  // 大理石
            instances: dataProc.myCubeInstances, // 实例属性的数组
            mix: 0.7,
        });
    },

    // 数据处理总入口
    process: (data, instName = 'manyCubes', offset) => {
        console.log(data.length, '个方块数据，开始处理');

        D = null;  // 释放内存（删去临时数据产生的内存）后续不用这个了，先放着

        dataProc.fullInst(data, offset);  // 填充实例化容器
        dataProc.addPhysical(data, dataProc.myCubeInstances);  // 添加物理体
        dataProc.renderInst(instName);  // 渲染实例化

        dataProc.myCubeInstances = null;  // 释放内存
    },
}
