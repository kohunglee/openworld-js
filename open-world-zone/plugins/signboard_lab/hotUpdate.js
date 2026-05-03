/**
 * 画板本地刷新模块
 * updateSign 是渲染层的统一刷新入口，保存成功、懒加载、手动刷新都走这里。
 */

import { makeImgId } from './config.js';
import { signContentMap, signIndexMap, setSignContent, getCcgxkObj, getTextureModule } from './store.js';

// 热更新函数（放到全局，方便调用）
window.updateSign = function(boardId, content, mode = 'text', extra = {}) {
    const ccgxkObj = getCcgxkObj();
    const textureModule = getTextureModule();
    const info = signIndexMap.get(boardId);
    if (!info) { console.error(`[updateSign] 找不到标识牌: ${boardId}`); return; }
    if (!ccgxkObj) { console.error('[updateSign] 引擎未就绪'); return; }
    const { index } = info;
    const nID = 'T' + index;
    const random = ((Math.random() * 1e7) | 0);  // 莫名其妙的 bug，需要用 random 后缀强制刷新
    setSignContent(boardId, mode, content, extra);
    if (mode === 'image') {
        signContentMap.set(boardId + random, { mode: 'image', imgUrl: content, extra }); // hook 查找（保险）
    }
    if (textureModule) {  // 清除缓存（多重保险）
        textureModule.textureMap.delete(boardId);
        textureModule.textureMap.delete(boardId + random); // 保险
    }
    window[nID] = undefined;
    if (mode === 'image') {  // image 模式：移除旧 img DOM，用 random 后缀对抗浏览器图片缓存
        const uniqueImgId = makeImgId(index, boardId);
        document.getElementById(uniqueImgId)?.remove();
        ccgxkObj.indexToArgs.get(index).texture = boardId + random;
        ccgxkObj.indexToArgs.get(index).nS = 1;
    } else {  // text 模式
        ccgxkObj.indexToArgs.get(index).texture = boardId;
    }
    ccgxkObj.currentlyActiveIndices.delete(index);  // 让引擎重新加载一次图片（注意，接下来就是走 hook 流程了）
};
