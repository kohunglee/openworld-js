/**
 * 万数块/百数块/单数块系统 + 删除模型插件
 *
 * 功能：
 * 1. process() - 处理数据，创建万数块/百数块/单数块
 * 2. deleteModBlock() - 按照块儿删除模型
 * 3. typesMeta - 各数块的元数据
 */

// 插件主入口
export default function (ccgxkObj) {

    // 数据处理模块
    const dataProc = {

        // 一些参数
        buildMode: 0,       // 是否是建造模式，如果不是，则不渲染空模型
        totalCube: 10000,   // 总方块数 (根据 type 动态改变)
        cubeIndex: 0,       // 计数器
        myCubeInstances: [],// 最终生成的实例数据，的容器
        wskIdx: -1,         // 当前万数块的 ID
        dataName: '',       // 当前数据的随机别名

        // 各[数块]的占比情况
        // 注意，默认 63、1、300 
        typesMeta: (() => {
            const W1 = 63, W3 = 1, step2 = 300;
            const types = [
                [W1 * 1_0000,                                           1_0000],  // 万数块
                [Math.floor((100 - W1 - W3) * 1_0000 / step2) * step2,  step2],   // 百数块
                [W3 * 1_0000,                                                1],  // 单数块
            ];
            let cursor = 0;
            return types.map(([span, cap]) => {
                const meta = { startIdx: cursor, endIdx: cursor + span, step: cap, total: span / cap };
                cursor += span;
                return meta;
            });
        })(),

        // 读取数据，预处理
        readData: function (data, offset) {
            if (dataProc.cubeIndex >= dataProc.totalCube) { return -1 }// 超出容量（如 300 个），不再处理
            if (data.del) {  // 处理已被标记 删除 的数据，按照【空模型】处理
                data = {
                    x: 999999999, y: 999999999, z: 999999999,
                    w: 0.001, d: 0.001, h: 0.001,
                };
            }
            const result = {  // 初始化一个模型，填充位置、大小、旋转，智能处理未定义的参数
                x: (data?.x || 0) + (offset?.x ?? 0), y: (data?.y || 1) + (offset?.y ?? 0), z: (data?.z || 0) + (offset?.z ?? 0),
                w: data?.w || 1, d: data?.d || 1, h: data?.h || 1,
                rx: data?.rx || 0, ry: data?.ry || 0, rz: data?.rz || 0,
            };
            if (data?.b) {  // 有颜色
                result.b = data.b;
            }
            if (data?.t) {  // 有纹理
                result.t = data.t;
            }
            dataProc.myCubeInstances.push(result);  // 数据放入（填充）实例化容器
            return dataProc.cubeIndex++;  // 返回当前模型的索引
        },

        // 填充 myCubeInstances，填满
        fullInst: function (data, offset) {
            const len = data.length;

            for (let index = 0; index < len; index++) {  // 填充实心数据
                if (dataProc.cubeIndex >= dataProc.totalCube) break; // 防止数据溢出
                dataProc.readData(data[index], offset);
            }
        },

        // 遍历 instData，添加物理体
        addPhysical: function (data, instData, invisible) {
            const boxLen = instData.length;
            for (let index = 0; index < boxLen; index++) {  // 入档案，添加物理体
                const args = {
                    DPZ: data[index]?.dz ?? 4,
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
                    isInvisible: invisible,  // 是否只被探测，而不可见
                };
                if(instData[index].t) { args.texture = instData[index].t }
                if (index === 0) { args.dataName = dataProc.dataName }  // 只在第一个模型上添加。供删除时使用
                ccgxkObj.addTABox(args);
            }
        },

        // 索引计算器
        calcFreeIdx: function (start, end, step) {
            for (let idx = start; idx < end; idx += step) {  // 寻找空闲的索引（头索引未占用则为空闲）
                if (ccgxkObj.indexToArgs.get(idx) === undefined) {
                    return idx;
                }
            }
            return -1; // 没有空位
        },

        // 渲染实例化
        renderInst: function (texture, model) {
            ccgxkObj.W[model]({
                n: 'sk_' + dataProc.wskIdx + '_' + dataProc.dataName,
                t: texture,
                instances: dataProc.myCubeInstances,
                mix: 0.7,
            });
        },

        // 数据处理总入口
        // data 是数组格式的 实例化 数据
        // offset 是 json 格式的偏移
        // texture 是纹理
        // name 是名称，写在第一块的 indexToArgs 的 n 参数里。
        // type: 1=万数块(0-90w), 2=百数块(63w-99w), 3=单数块(99w-100w)
        // noIns: 是否不渲染实例化，也就是仅仅写入档案，物理档案
        // invisible: 是否不可见，默认不可见（只在 实例化 里可看到）
        process: function ({ 
            data, offset, texture, name = 'untitle', 
            type = 1, noIns = false, model = 'cube', invisible = true } = {}) 
        {
            texture = texture || window.marble;

            const { startIdx, endIdx, step } = dataProc.typesMeta[type - 1] ?? dataProc.typesMeta[0];
            const cap = step;  // cap 就是单块容量，等于 step

            dataProc.wskIdx = dataProc.calcFreeIdx(startIdx, endIdx, step);  // 计算索引
            if (dataProc.wskIdx === -1) {
                console.error(`Type ${type} 类型的存储空间已满（${startIdx}~${endIdx}），无法创建！`);
                return -1;
            }

            dataProc.totalCube = cap; // 设置总容量
            dataProc.dataName = Math.floor(Math.random() * 1000000);  // 为了防止删除 W 元素冲突
            ccgxkObj.indexToArgs.set(dataProc.wskIdx, { n: name, type: type });  //（暂时无用）可以在这里记录 type，供未来删除模块优化使用

            dataProc.fullInst(data, offset);  // 填充容器
            dataProc.addPhysical(data, dataProc.myCubeInstances, invisible);  // 添加物理体
            if (!noIns) { dataProc.renderInst(texture, model) };  // 渲染

            const wskID = dataProc.wskIdx;

            // 重置
            if (true) {
                dataProc.myCubeInstances = [];
                dataProc.buildMode = 0;
                dataProc.totalCube = 10000; // 恢复默认值
                dataProc.cubeIndex = 0;
                dataProc.wskIdx = -1;
            }

            return wskID;
        },
    };

    // 暴露 dataProc 到引擎对象
    ccgxkObj.dataProc = dataProc;

    // 也暴露到 window，兼容旧代码
    window.dataProc = dataProc;

    // 按照块儿删除模型
    // 自动识别 万数块、百数块、单数块（通过 typesMeta 动态获取）
    ccgxkObj.deleteModBlock = function (blockIndex, cobj) {
        cobj = cobj || ccgxkObj;
        const rootArgs = cobj.indexToArgs.get(blockIndex);  // 头索引 元数据
        if (!rootArgs) { return }
        const dataName = rootArgs.dataName;

        // 通过 typesMeta 动态判断 blockSize
        let blockSize = dataProc.typesMeta[0].step; // 默认万数块
        for (let i = 0; i < dataProc.typesMeta.length; i++) {
            const meta = dataProc.typesMeta[i];
            if (blockIndex >= meta.startIdx && blockIndex < meta.endIdx) {
                blockSize = meta.step;
                break;
            }
        }
        for (let i = blockIndex; i < blockIndex + blockSize; i++) {  // 删除档案
            cobj.hiddenTABox(i);

            // 删除 网格表 里的记录
            if (1) {
                const args = cobj.indexToArgs.get(i);
                const gridkey = args?.initGridKey;
                if (gridkey && cobj.spatialGrid.has(gridkey)) {
                    cobj.spatialGrid.get(gridkey).delete(i);
                }
            }

            cobj.indexToArgs.delete(i);
        }

        cobj.W.delete('sk_' + blockIndex + '_' + dataName);  // 删除实例
    };

    // 显示万数块状况（一秒一更新）
    if(true) {
        function updateWskStudio() {
            const container = document.getElementById('wskStudio');
            if (!container) return;

            // ===== 扫描数据 =====
            const type1 = [], type2 = [], type3 = [];
            const [m1, m2, m3] = ccgxkObj.dataProc.typesMeta;

            for (let i = m1.startIdx; i < m1.endIdx; i += m1.step) if (ccgxkObj.indexToArgs.has(i)) type1.push(i);
            for (let i = m2.startIdx; i < m2.endIdx; i += m2.step) if (ccgxkObj.indexToArgs.has(i)) type2.push(i);
            for (let i = m3.startIdx; i < m3.endIdx; i += m3.step) if (ccgxkObj.indexToArgs.has(i)) type3.push(i);

            // ===== 万数块网格 =====
            let gridHTML = '';
            for (let i = 0; i < m1.total; i++) {
                const idx = m1.startIdx + i * m1.step;
                const has = ccgxkObj.indexToArgs.has(idx);
                const info = has ? ccgxkObj.indexToArgs.get(idx) : null;
                gridHTML += `<span title="idx:${idx} ${info ? info?.n : '空'}"
                    style="display:inline-block;width:18px;height:18px;line-height:18px;text-align:center;
                    font-size:11px;margin:1px;cursor:default;border-radius:2px;
                    background:${has ? '#3a7bd5' : '#e0e0e0'};color:${has ? '#fff' : '#999'};">
                    ${has ? '■' : '·'}
                </span>`;
                if ((i + 1) % 10 === 0) gridHTML += '<br>';
            }

            // ===== 进度条生成函数 =====
            const bar = (used, total, color) => {
                const pct = Math.round((used / total) * 100);
                return `
                    <div style="display:flex;align-items:center;gap:8px;margin:4px 0;">
                        <div style="flex:1;height:10px;background:#e0e0e0;border-radius:5px;overflow:hidden;">
                            <div style="width:${pct}%;height:100%;background:${color};border-radius:5px;transition:width 0.3s;"></div>
                        </div>
                        <span style="font-size:11px;color:#555;min-width:80px;">${used} / ${total} (${pct}%)</span>
                    </div>`;
            };

            const w = n => Math.round(n / 1_0000);  // 转换为 w 单位显示

            // ===== 拼装 HTML =====
            container.innerHTML = `
                <div style="font-family:monospace;font-size:12px;line-height:1.6;">

                    <div style="margin-bottom:10px;">
                        <div style="font-size:11px;color:#888;margin-bottom:4px;">
                            万数块 &nbsp;${type1.length} / ${m1.total} 已用
                            &nbsp;<span style="color:#3a7bd5;">■ 占用</span>
                            &nbsp;<span style="color:#999;">· 空闲</span>
                        </div>
                        ${gridHTML}
                    </div>

                    <hr style="border:none;border-top:1px solid #ddd;margin:8px 0;">

                    <div>
                        <div style="font-size:11px;color:#555;margin-bottom:2px;">万数块 (0 ~ ${w(m1.endIdx)}w)</div>
                        ${bar(type1.length, m1.total, '#3a7bd5')}

                        <div style="font-size:11px;color:#555;margin:6px 0 2px;">百数块 (${w(m2.startIdx)}w ~ ${w(m2.endIdx)}w)</div>
                        ${bar(type2.length, m2.total, '#9b59b6')}

                        <div style="font-size:11px;color:#555;margin:6px 0 2px;">单数块 (${w(m3.startIdx)}w ~ ${w(m3.endIdx)}w)</div>
                        ${bar(type3.length, m3.total, '#27ae60')}
                    </div>

                    <div style="font-size:10px;color:#aaa;margin-top:8px;text-align:right;">
                        更新于 ${new Date().toLocaleTimeString()}
                    </div>

                </div>
            `;
        }

        // 更新
        let _wskTimer = null;
        if (_wskTimer) clearInterval(_wskTimer);
        _wskTimer = setInterval(updateWskStudio, 1000);
    }
}
