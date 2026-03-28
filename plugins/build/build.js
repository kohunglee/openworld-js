/**
 * 建造师，（引用中心点插件）
 * ========
 * 实验中，可以移动物体
 * 
 * 注意，要使用建造器，需要有自己的容器，参照 example/p006-build-tool/plugins/somecube/somecube.js
 */
import init from './build/init.js';

// 插件入口
export default function(ccgxkObj) {
    // console.log('build 搬家了');
    if(!ccgxkObj.centerDot) {console.error('no centerDot plugin'); return;};
    init(ccgxkObj);
};