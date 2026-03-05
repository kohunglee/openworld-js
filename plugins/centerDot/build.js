/**
 * 建造师，（引用中心点插件）
 * ========
 * 实验中，可以移动物体
 */
import init from './build/init.js';

// 插件入口
export default function(ccgxkObj) {
    console.log('📢 ⚠️ 本 centerDot 不再维护，已经作废！');
    if(!ccgxkObj.centerDot) {console.error('no centerDot plugin'); return;};
    init(ccgxkObj);
};