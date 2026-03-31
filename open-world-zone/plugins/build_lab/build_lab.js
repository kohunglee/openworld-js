/**
 * 实验中，主要管建筑的毛坯建造
 * 
 * 这个文件是【主入口】
 * 
 * 每个这种文件，都只定一个建筑（我也不知道，先就这样搞吧）
 */

import mydata from './data.js';
import { IS_FULL_STATE } from './constants.js';
import { processFullState } from './full_state.js';

export default function(ccgxkObj) {
    const insts = [...mydata()];  // 导入数据

    // 处理
    if (IS_FULL_STATE) {
        processFullState(insts, ccgxkObj);
    }

    k.visCubeLen = insts.length - 1;  //+ 建造器相关
    for (let i = 0; i < 9990; i++) {
        insts.push({
            x: 1e9, y: 1e9, z: 1e9,
            w: 0.001, d: 0.001, h: 0.001,
            rx: 0, ry: 0, rz: 0,
        });
    }

    const idx = ccgxkObj.dataProc.process({  //+ 渲染 0~1w
        data: insts,
        name: 'build_lab',
        type: 1,
        texture: marble,
        mixValue: 0.8,
    });

    const rootArgs = k.indexToArgs.get(idx);  //+ 设置建造器的操纵 W ID
    if (rootArgs) {  k.wBuildInstName = `sk_${idx}_${rootArgs.dataName}`; }
}