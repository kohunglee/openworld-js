/**
 * 从CSV动态加载数据，生成板子
 */
export default async function(ccgxkObj, kitInstance, signFunc) {

    // 加载CSV数据
    const csvData = await kitInstance.loadCSV('./plugins/signboard/test.csv');

    // 构建 target -> content 的映射
    const contentMap = {};
    csvData.forEach(item => {
        contentMap[item.target] = item.content;
    });

    // 生成板子 (与CSV数量一致)
    const data = [];
    const totalBoards = csvData.length;
    const startX = -40;
    const spacing = 16;
    const y = 3;
    const z = 20;

    for (let i = 1; i <= totalBoards; i++) {
        const targetId = `sign${String(i).padStart(4, '0')}`;
        const content = contentMap[targetId] || targetId;

        // 动态添加渲染函数
        const funcName = targetId;
        signFunc.set(funcName, (ctx, width, height) => {
            kitInstance.dirSign(ctx, width, height, content);
        });

        // 生成方块配置
        data.push({
            "x": startX + (i - 1) * spacing,
            "y": y,
            "z": z,
            "w": 8,
            "h": 4,
            "dz": 1,
            "st": 1,
            "t": funcName,
            "ry": 90
        });
    }

    ccgxkObj.dataProc.process({
        data: data,
        name: 'site-signs',
        type: 1,
        invisible: false, noIns: true,  // 纹理专用
    });
}
