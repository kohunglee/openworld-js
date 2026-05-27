/**
 * build_lab 的 CDN 入口
 *
 * 这个文件的职责很单纯：
 * 1. 保留原模型的主要逻辑和数据。
 * 2. 位置只吃总配置传进来的 runtimeContext.position。
 * 3. 以后如果 SaaS 返回新的建筑列表，前端只需要继续调这个入口。
 */

import mydata from './data.js';
import { processFullState } from './full_state.js';

/**
 * 渲染一个 build_lab 建筑实例。
 * runtimeContext.id 先保留下来，给后续画板/后端对接继续使用。
 */
export default function renderBuildLab(ccgxkObj, runtimeContext = {}) {
    const insts = [...mydata()];
    const buildOffset = {
        x: runtimeContext?.position?.x || 0,
        y: runtimeContext?.position?.y || 0,
        z: runtimeContext?.position?.z || 0,
    };

    // 原模型的主要加工逻辑继续复用，只是把位置改成外部传入。
    processFullState(insts, ccgxkObj, buildOffset);

    // 先把建筑 id 暂存到运行时上下文，方便后续画板系统继续挂接。
    ccgxkObj.currentBuildingRuntime = {
        id: runtimeContext?.id || '',
        modelUrl: runtimeContext?.modelUrl || '',
    };

    // 这一段沿用原模型的渲染准备逻辑，尽量少改旧代码。
    ccgxkObj.visCubeLen = insts.length - 1;
    for (let i = 0; i < 9990; i++) {
        insts.push({
            x: 1e9, y: 1e9, z: 1e9,
            w: 0.001, d: 0.001, h: 0.001,
            rx: 0, ry: 0, rz: 0,
        });
    }

    const idx = ccgxkObj.dataProc.process({
        data: insts,
        name: runtimeContext?.id || 'build_lab',
        type: 1,
        texture: marble,
        mixValue: 0.7,
        offset: buildOffset,
    });

    // 原来建造模式里要记住根实例名，这里继续保留。
    const rootArgs = k.indexToArgs.get(idx);
    if (rootArgs) {
        k.wBuildInstName = `sk_${idx}_${rootArgs.dataName}`;
    }

    // 原模型自带的 Y 向加载范围修正，也继续保留。
    if (ccgxkObj.gridsizeY) {
        ccgxkObj.gridsizeY[2] = 7;
        ccgxkObj.gridsizeY[3] = 5;
    }
}
