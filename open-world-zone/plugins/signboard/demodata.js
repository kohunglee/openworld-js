/**
 * 从CSV动态加载数据
 */
export default async function(ccgxkObj, kitInstance, signFunc) {
    console.log('从CSV加载站点数据');

    // 加载CSV数据
    const csvData = await kitInstance.loadCSV('./plugins/signboard/data.csv');

    console.log('加载到的CSV数据:', csvData);
    console.log('传入的signFunc初始包含:', Object.keys(signFunc));

    // 动态生成渲染函数和方块数据
    const data = [];
    const startX = -40; // 起始X坐标
    const spacing = 16; // 每个方块之间的间距
    const y = 8; // Y坐标
    const z = 20; // Z坐标

    console.log(csvData);

    csvData.forEach((item, index) => {
        // 动态添加渲染函数
        const funcName = `site_${item.id}`;
        signFunc[funcName] = (ctx, width, height) => {
            kitInstance.dirSign(ctx, width, height, item.display_name);
        };

        // 生成方块配置
        data.push({
            "x": startX + index * spacing,
            "y": y,
            "z": z,
            "w": 12,
            "h": 8,
            "dz": 0,
            "st": 1,
            "t": funcName,
            "ry": 90 // 旋转角度，让文字朝向玩家
        });
    });

    console.log('最终的signFunc包含的所有函数:', Object.keys(signFunc));

    ccgxkObj.dataProc.process({  // 固定写法，把 data 传进我的实例化渲染里
        data: data,
        name: 'site-signs',
        type: 1,
        invisible: false, noIns: true,  // 纹理使用这种组合
    });
}