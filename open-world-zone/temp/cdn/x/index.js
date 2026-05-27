/**
 * xhall 的 CDN 入口
 *
 * 目标和 build_lab 一样：
 * 1. 尽量复用原有模型逻辑。
 * 2. 位置只吃总配置里的 position。
 * 3. 不再从常量里偷偷拿场景级 offset。
 */

import mydata from './data.js';
import { processFullState } from './full_state.js';

/**
 * 渲染一个 xhall 建筑实例。
 */
export default function renderXhall(ccgxkObj, runtimeContext = {}) {
    const insts = [...mydata()];
    const buildOffset = {
        x: runtimeContext?.position?.x || 0,
        y: runtimeContext?.position?.y || 0,
        z: runtimeContext?.position?.z || 0,
    };

    // 画板 key 在 processFullState 阶段就生成，所以要先挂运行时上下文。
    ccgxkObj.currentBuildingRuntime = {
        id: runtimeContext?.id || '',
        modelUrl: runtimeContext?.modelUrl || '',
        buildingName: runtimeContext?.buildingName || '',
    };

    // 原模型自己的颜色/画板等细节逻辑继续复用，只把 offset 改成外部传入。
    if (ccgxkObj.mode > 0) {
        processFullState(insts, ccgxkObj, buildOffset);
    }

    ccgxkObj.dataProc.process({
        data: insts,
        name: runtimeContext?.id || 'xhall',
        type: 1,
        texture: marble,
        mixValue: 0.8,
        offset: buildOffset,
    });
}
