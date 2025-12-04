/**
 * 数据的管理组件 (建造师，初始化建造师（引用中心点插件）)
 * ========
 * 实验中，可以移动物体
 */

export default function(ccgxkObj) {
    var g = {

        // 获取（和下载）当前的所有方块数据
        getCubesData : (isDownload = false, rangeA = 0, rangeB = ccgxkObj.visCubeLen, isJson = false) => {
            // console.time('生成所有数据');
            const G = ccgxkObj.centerDot.init;
            var cubeDATA = [];
            rangeB++;
            for (let i = rangeA; i < rangeB; i++) {
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
                    cubeDATA[i][key] = G.f( +cubeDATA[i][key].toFixed(3) );
                    if (!cubeDATA[i][key] || +cubeDATA[i][key] === 0) {
                        delete cubeDATA[i][key];
                    }
                    if (cubeDATA[i][key] === g.defaultData[key]) {
                        delete cubeDATA[i][key];
                    }
                }
            }
            for (let i = rangeA; i < rangeB; i++) {  // 单独其他选项，后续测试一下是否有性能区别
                const insColor = ccgxkObj.indexToArgs.get(i).insColor;  //+ 颜色的设置
                if(insColor) {
                    cubeDATA[i].b = insColor;
                }
                if(cubeDATA[i].x > 999_999_999){  // 被删除内容的标识
                    cubeDATA[i] = {del:1};
                }
            }
            if(isDownload){  // 下载
                const jsonScroll = JSON.stringify(cubeDATA, null, 2);
                const blob = new Blob([jsonScroll], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `cubeData-${ccgxkObj.cellpageid_geturl}-${new Date(Date.now()).toLocaleString('sv-SE').replace(/[-:T\s]/g, '')}.json`; // 给卷轴起个带时间戳的名字
                link.click();
                URL.revokeObjectURL(url); // 释放这个临时URL
            } else {
                return isJson ?  JSON.stringify(cubeDATA) : cubeDATA;
            }

            
        },

        // 保存到本地的浏览器里
        saveToLocalSt : () => {
            const cubeDATA = g.getCubesData();
            if (ccgxkObj.cellpageid_geturl) {
                localStorage.setItem(`ow_${ccgxkObj.cellpageid_geturl}`, JSON.stringify(cubeDATA));
                alert('保存到 localStorage 成功！');
            } else {
                alert('当前页面没有 id 参数，无法保存到本地');
            }
        },

        // 默认的参数
        defaultData : {
            w: 1, h: 1, d: 1, y: 1, b: '888888',
        },


    };

    ccgxkObj.centerDot.init = {...g, ...ccgxkObj.centerDot.init};
}