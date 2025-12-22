/**
 * 数据处理（等待被转化为插件）
 * -----------
 * 开始按照既定的规则，把 myData 给绘制出来
 * del: 完全删除没数据的
 */
const dataProc = {

    // 一些参数
    buildMode: 0,       // 是否是建造模式，如果不是，则不渲染空模型
    totalCube: 10000,   // 总方块数 (根据 type 动态改变)
    cubeIndex: 0,       // 计数器
    myCubeInstances: [],// 最终生成的实例数据，的容器
    wskIdx: -1,         // 当前万数块的 ID
    dataName: '',       // 当前数据的随机别名

    // 读取和理解单个数据，放入 myCubeInstances 里，返回 index
    readData : (data, isHidden = false, offset = {}) => {
        // 安全检查：如果超出当前类型的容量，不再处理
        if(dataProc.cubeIndex >= dataProc.totalCube){
            return -1;
        }

        if(data.del) {  // 处理已被标记 删除 的数据，按照【空模型】处理默认参数
            data = {
                x: 999999999, y: 999999999, z: 999999999,
                w: 0.001, d: 0.001, h: 0.001,
            };
        }
        const result = {  // 初始化一个模型，填充位置、大小、旋转，智能处理未定义的参数
            x: data.x + (offset?.x ?? 0), y: (data?.y||1)  + (offset?.y ?? 0), z: data.z + (offset?.z ?? 0),
            w: data?.w || 1, d: data?.d || 1, h: data?.h || 1,
            rx: data?.rx||0, ry:data?.ry||0, rz:data?.rz||0,
        };
        if(data?.b) {  // 有颜色参数
            result.b = data.b;
        }
        dataProc.myCubeInstances.push(result);  // 数据放入（填充）实例化容器
        return dataProc.cubeIndex++;  // 返回当前模型的索引
    },

    // 填充 myCubeInstances
    fullInst: (data, offset)=>{
        const len = data.length;
        // 1. 填充实心数据
        for (let index = 0; index < len; index++) {
            if(dataProc.cubeIndex >= dataProc.totalCube) break; // 防止数据溢出
            dataProc.readData(data[index], false, offset);
        }

        // 2. 填充空模型（仅非建造模式）
        // 这里的 totalCube 已经根据 type 被修改了（10000 或 100 或 1）
        if(dataProc.buildMode) {
            const remaining = dataProc.totalCube - dataProc.cubeIndex;
            for (let index = 0; index < remaining; index++) {
                dataProc.readData({
                    x: 999999999, y: 999999999, z: 999999999,
                    w: 0.001, d: 0.001, h: 0.001,
                }, true);
            }
        }
    },

    // 遍历 instData，添加物理体
    addPhysical: (data, instData) => {
        const boxLen = instData.length;
        for (let index = 0; index < boxLen; index++) {  // 入档案，添加物理体
            const args = {
                DPZ : (data[index]?.dz) ? data[index]?.dz : 4,
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
            };
            if(index === 0){ args.dataName = dataProc.dataName }  // 只在第一个模型上添加。供删除时使用
            k.addTABox(args);
        }
    },

    // 通用索引计算器：根据范围和步长寻找空位
    calcFreeIdx: (start, end, step) => {
        for(let idx = start; idx < end; idx += step){
            // 只需要判断“头”索引是否被占用，因为占用时会锁住一整块
            if(k.indexToArgs.get(idx) === undefined) {
                return idx;
            }
        }
        return -1; // 没有空位
    },

    // 渲染实例化
    renderInst: (texture) => {

        // 注意：名字依然保留 wsk_ 前缀，为了兼容现有的删除逻辑（它按前缀查找或按索引删除）
        // 如果需要区分，可以在这里把 n 改成 'bsk_' 等，但需要同步修改删除模块
        k.W.cube({
            n: 'wsk_' + dataProc.wskIdx + '_' + dataProc.dataName,
            t: texture,
            instances: dataProc.myCubeInstances,
            mix: 0.7,
        });
    },

    // 数据处理总入口
    // type: 1=万数块(0-90w), 2=百数块(90w-99w), 3=单数块(99w-100w)
    process: (data, offset, texture = dls, name = 'noName', type = 1, noIns = false) => {
        D = null;  // 释放内存

        // 1. 根据 type 定义规则配置
        let startIdx, endIdx, step, cap;
        
        switch (type) {
            case 1: // 万数块
                startIdx = 0; 
                endIdx = 900000; 
                step = 10000; 
                cap = 10000;
                break;
            case 2: // 百数块 (新增)
                startIdx = 63_0000; 
                endIdx = 990000; 
                step = 300; 
                cap = 300;
                break;
            case 3: // 单数块
                startIdx = 990000; 
                endIdx = 1000000; 
                step = 1; 
                cap = 1;
                break;
            default: // 默认回滚到万数块
                startIdx = 0; endIdx = 900000; step = 10000; cap = 10000;
                break;
        }

        // 2. 检查数据量是否合规
        if(data.length > cap){
            console.error(`数据量(${data.length}) 超出 type=${type} 的最大容量(${cap})!`);
            return -1;
        }

        // 3. 计算索引
        dataProc.wskIdx = dataProc.calcFreeIdx(startIdx, endIdx, step);

        if(dataProc.wskIdx === -1){
            console.error(`Type ${type} 类型的存储空间已满（${startIdx}~${endIdx}），无法创建！`);
            return -1;
        }

        // 4. 设置当前处理的环境变量
        dataProc.totalCube = cap; // 设置总容量
        dataProc.dataName = Math.floor(Math.random() * 1000000);
        
        // 占位
        k.indexToArgs.set(dataProc.wskIdx, {n: 'is has data', type: type}); // 可以在这里记录 type，供未来删除模块优化使用

        // 5. 执行创建流程
        dataProc.fullInst(data, offset);        // 填充容器
        dataProc.addPhysical(data, dataProc.myCubeInstances); // 添加物理体
        if(!noIns) { dataProc.renderInst(texture) };           // 渲染

        const wskID = dataProc.wskIdx;

        // 6. 重置状态
        if(true){
            dataProc.myCubeInstances = [];
            dataProc.buildMode = 0;
            dataProc.totalCube = 10000; // 恢复默认值
            dataProc.cubeIndex = 0;
            dataProc.wskIdx = -1;
        }

        return wskID;
    },
}