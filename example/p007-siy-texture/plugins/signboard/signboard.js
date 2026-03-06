/**
 * 测试 信息板 插件
 * ========
 * 测试一下，信息板怎么用
 */

import kit from './kit.js';
import demodata from './demodata.js';
import hookon from './hookon.js';

// 入口
export default function(ccgxkObj) {

    const kitfunc = kit(ccgxkObj);
    const signFunc = kitfunc.signFunc;
    hookon(ccgxkObj, signFunc);

    demodata(ccgxkObj);

    const data = [
        {"x":11.902,"y":10,"z":11.769,"w":10,"h":10, "dz": 1, "st": 1, "t":"eastSign"},
    ];

    ccgxkObj.dataProc.process({
        data: data,
        name: 'texture-test',
        type: 1,
        invisible: false, noIns: true,  // 纹理使用这种组合
    });

}