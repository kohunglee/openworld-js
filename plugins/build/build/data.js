/**
 * 数据的管理组件 (建造师，初始化建造师（引用中心点插件）)
 * ========
 * 实验中，可以移动物体
 */

export default function(ccgxkObj) {
    var g = {

        // 获取（和下载）当前的所有方块数据
        getCubesData : (isDownload = false, rangeA = 0, rangeB = ccgxkObj.visCubeLen, isJson = false) => {
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
            if(isDownload){  // 在新标签页打开
                let lines = ['['];
                for (let i = rangeA; i < rangeB; i++) {
                    if ((i - rangeA) % 5 === 0) {
                        lines.push(`\n\n/* ——— ${i} ——— */`);  // 构建带注释的 JSON 文本
                    }
                    const isLast = (i === rangeB - 1);
                    lines.push('  ' + JSON.stringify(cubeDATA[i]) + (isLast ? '' : ','));
                }
                lines.push('\n\n]');
                const textContent = lines.join('\n');

                const blob = new Blob([textContent], { type: 'text/plain; charset=utf-8' });
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
            } else {
                return isJson ?  JSON.stringify(cubeDATA) : cubeDATA;
            }
        },

        // 保存到本地的浏览器里（目前的功能是，单个模型，写到 粘贴框 里，函数名还没变）
        saveToLocalSt : () => {
            const cubeDATA = g.getCubesData();

            // 将数据写入到 剪切板 里
            if(1){
                const index = +document.getElementById('objID').value;
                const copydata = JSON.stringify(cubeDATA[index]);
                const t = document.createElement('textarea');
                t.value = copydata + ',';
                document.body.appendChild(t);
                t.select();
                document.execCommand('copy');
                t.remove();
                console.log(index + ' : ' + copydata);
            }
        },

        // 默认的参数
        defaultData : {
            w: 1, h: 1, d: 1, y: 1, b: '888888',
        },


    };

    ccgxkObj.centerDot.init = {...g, ...ccgxkObj.centerDot.init};
}