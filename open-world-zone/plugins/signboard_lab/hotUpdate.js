/**
 * 热更新模块
 * updateSign + SSE 实时监听
 */

import { getApiBase, makeImgId } from './config.js';
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
        ccgxkObj.W.plane({ n: nID, t: boardId + random });  // 更新纹理
        ccgxkObj.indexToArgs.get(index).texture = boardId + random;
    } else {
        ccgxkObj.W.plane({ n: nID, t: boardId });
        ccgxkObj.indexToArgs.get(index).texture = boardId;
    }
    ccgxkObj.currentlyActiveIndices.delete(index);  // 让引擎重新加载一次图片
};

// SSE 客户端（带自动重连）
let es = null;
let reconnectTimer = null;
export function initSSE() {
    if (es) {
        es.close();
        es = null;
    }
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }
    try {
        const apiBase = getApiBase();
        es = new EventSource(`${apiBase}/api/signs/stream`);
        es.onopen = () => {
            console.log(`[SSE] 已连接 ${apiBase}`);
        };
        es.onmessage = function(e) {
            const data = JSON.parse(e.data);
            if (data.boards) {
                data.boards.forEach(board => {
                    if (!signIndexMap.has(board.id)) return;
                    const cur = signContentMap.get(board.id);
                    if (cur) {  // cur 为空说明是新板子，直接更新；否则检查是否有变化
                        const changed = cur.mode !== board.mode
                            || (board.mode === 'text' && cur.t !== board.content)
                            || (board.mode === 'image' && cur.imgUrl !== board.content)
                            || JSON.stringify(cur.extra) !== JSON.stringify(board.extra);  // 也检查 extra 是否变化
                        if (!changed) return;
                    }
                    window.updateSign(board.id, board.content, board.mode, board.extra || {});
                });
            }
        };
        es.onerror = () => {
            console.log('[SSE] 连接断开，3秒后重连...');
            es.close();
            es = null;
            reconnectTimer = setTimeout(initSSE, 3000);
        };
    } catch (e) {
        console.log('[SSE] 连接失败（开发服务器未启动？）');
        reconnectTimer = setTimeout(initSSE, 5000);
    }
}
