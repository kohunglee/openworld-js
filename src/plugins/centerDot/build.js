/**
 * 建造师，（引用中心点插件）
 * ========
 * 实验中，可以移动物体
 */

var globalVar;

// 插件入口
export default function(ccgxkObj) {
    if(!ccgxkObj.centerDot) {console.log('no centerDot'); return;};
    globalVar = ccgxkObj;
    globalVar.ccgxkObj = ccgxkObj;
    // console.log('build');
};