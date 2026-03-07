/**
 * 从CSV动态加载数据，生成10个板子
 */
export default async function(ccgxkObj, kitInstance, signFunc) {
    console.log('从CSV加载站点数据');

    // 加载CSV数据
    const csvData = await kitInstance.loadCSV('./plugins/signboard/data.csv');
    console.log('加载到的CSV数据:', csvData);

    // 构建 target -> content 的映射
    const contentMap = {};
    csvData.forEach(item => {
        contentMap[item.target] = item.content;
    });

    // 生成10个板子 (sign001 - sign010)
    const data = [];
    const totalBoards = 10;
    const startX = -40;
    const spacing = 16;
    const y = 8;
    const z = 20;

    for (let i = 1; i <= totalBoards; i++) {
        const targetId = `sign${String(i).padStart(3, '0')}`;  // sign001, sign002, ...
        const content = contentMap[targetId] || targetId;  // 有内容显示内容，没内容显示targetId

        // 动态添加渲染函数
        const funcName = targetId;
        signFunc[funcName] = (ctx, width, height) => {
            kitInstance.dirSign(ctx, width, height, content);
        };

        // 生成方块配置
        data.push({
            "x": startX + (i - 1) * spacing,
            "y": y,
            "z": z,
            "w": 12,
            "h": 8,
            "dz": 0,
            "st": 1,
            "t": funcName,
            "ry": 90
        });
    }

    console.log('最终的signFunc包含的所有函数:', Object.keys(signFunc));

    ccgxkObj.dataProc.process({
        data: data,
        name: 'site-signs',
        type: 1,
        invisible: false, noIns: true,
    });
}
