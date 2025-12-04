/**
 * 数据处理（等待被转化为插件）
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
    wskIdx: -1,  // 当前万数块的 ID

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
        console.log('-----');

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
    /**
     * 按照块儿来计算。
     * 一共是 100 万的数量，相当于 100 块，每个占用 1 万个索引
     * 比如：
     * 第一块的 index 是 0~9999 ，在档案数量里，就是 1~10000 个
     * 而 0 就是这个万数块儿的 ID。
     */
    addPhysical: (data, instData) => {
        const boxLen = instData.length;  // 正常添加的数量
        const restLen = dataProc.totalCube - boxLen;  // 空置的数量
        // dataProc.wskIdx = k.cursorIdx;  // 计算出 万数块 ID
        dataProc.wskIdx = dataProc.calWskIdx();
        console.log('万数块 ID: ', dataProc.wskIdx);
        for (let index = 0; index < boxLen; index++) {  // 入档案，添加物理体
            k.addTABox({
                DPZ : 4,
                isPhysical: (data[index]?.st) ? false : true,  // 是否有物理属性
                mass: 0,
                background: '#4dff00ff',  // 调试时的高亮颜色
                mixValue: 0.5,
                customIdx: dataProc.wskIdx + index,  // 按照计算的索引
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
            });
        }
    },

    // 计算当前的 万数块 idx
    // 从 0 开始，一万一万数，哪个空缺，哪个就申请为当前的 万数块
    calWskIdx: () => {
        const len = k.MAX_BODIES;
        for(let index = 0; index < len; index += 10000){
            if(k.indexToArgs.get(index) === undefined) {  // 发现空缺
                return index;
            }
        }
        return 0;  // 理论上这行根本执行不到
    },

    // 渲染实例化
    /**
     * 每个实例 cube 容器，都使用 wsk_ + 万数块 ID 格式，方便删除
     */
    renderInst: (texture) => {
        k.W.cube({  // 渲染实例化
            n: 'wsk_' + dataProc.wskIdx,
            t: texture,  // 大理石
            instances: dataProc.myCubeInstances, // 实例属性的数组
            mix: 0.7,
        });
    },

    // 数据处理总入口
    // 默认的纹理是 dls，也就是大理石
    process: (data, offset, texture = dls) => {
        console.log(data.length, '个方块数据，开始处理');

        D = null;  // 释放内存（删去临时数据产生的内存）后续不用这个了，先放着

        dataProc.fullInst(data, offset);  // 填充实例化容器
        dataProc.addPhysical(data, dataProc.myCubeInstances);  // 添加物理体
        dataProc.renderInst(texture);  // 渲染实例化

        const wskID = dataProc.wskIdx;

        // 重新置空
        if(true){
            dataProc.myCubeInstances = [];
            dataProc.buildMode = 0;
            dataProc.totalCube = 10000;
            dataProc.cubeIndex = 0;
            dataProc.wskIdx = -1;
        }

        return wskID;
    },
}
