/**
 * 测试 信息板 插件
 * ========
 * 测试一下，信息板怎么用
 */

import kit from './kit.js';
import demodata from './demodata.js';
import hookon from './hookon.js';

// 入口
export default async function(ccgxkObj) {

    const kitfunc = kit(ccgxkObj);  //+ 引入函数
    const signFunc = kitfunc.signFunc;
    hookon(ccgxkObj, signFunc);  // 挂载钩子

    await demodata(ccgxkObj, kitfunc, signFunc);  // 引入数据（异步加载CSV），传入kit实例和signFunc
}