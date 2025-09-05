/**
 * 数据的管理组件 (建造师，初始化建造师（引用中心点插件）)
 * ========
 * 实验中，可以移动物体
 */

export default function(ccgxkObj) {
    var G = {
        ...ccgxkObj.centerDot.init,

        // 获取（和下载）当前的所有方块数据
        getCubesData : () => {
            var cubeDATA = [];
            for (let i = 0; i < (ccgxkObj.visCubeLen + 1); i++) {
                var p_offset = i * 8;
                const pos = ccgxkObj.positionsStatus;
                const phy = ccgxkObj.physicsProps;
                const euler = ccgxkObj.quaternionToEuler({  // 将四元数转换为欧拉角
                    x: pos[p_offset + 3],
                    y: pos[p_offset + 4],
                    z: pos[p_offset + 5],
                    w: pos[p_offset + 6]
                });
                cubeDATA[i] = {
                    x: pos[p_offset],
                    y: pos[p_offset + 1],
                    z: pos[p_offset + 2],
                    rx: euler.rX,
                    ry: euler.rY,
                    rz: euler.rZ,
                    w: phy[p_offset + 1],
                    h: phy[p_offset + 2],
                    d: phy[p_offset + 3],
                }
                for (const key in cubeDATA[i]) {  // 删去为 0 的值
                    cubeDATA[i][key] = G.f(cubeDATA[i][key]);
                    if (!cubeDATA[i][key] || +cubeDATA[i][key] === 0) {
                        delete cubeDATA[i][key];
                    }
                }
            }
            console.log(cubeDATA);  // 先输出，不下载
            return true;
            const jsonScroll = JSON.stringify(cubeDATA, null, 2);
            const blob = new Blob([jsonScroll], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `cubeData-${new Date(Date.now()).toLocaleString('sv-SE').replace(/[-:T\s]/g, '')}.json`; // 给卷轴起个带时间戳的名字
            link.click();
            URL.revokeObjectURL(url); // 释放这个临时URL
        },

    };

    ccgxkObj.centerDot.init = {...G, ...ccgxkObj.centerDot.init};
}