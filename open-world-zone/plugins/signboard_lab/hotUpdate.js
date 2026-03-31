/**
 * 热更新模块
 * updateSign + SSE 实时监听
 */

import { API_BASE } from './config.js';
import { signContentMap, signIndexMap, getCcgxkObj, getTextureModule } from './store.js';

// ── 全局热更新函数 ──
window.updateSign = function(boardId, content, mode = 'text') {
    const ccgxkObj = getCcgxkObj();
    const textureModule = getTextureModule();
    const info = signIndexMap.get(boardId);
    if (!info) { console.error(`[updateSign] 找不到标识牌: ${boardId}`); return; }
    if (!ccgxkObj) { console.error('[updateSign] 引擎未就绪'); return; }
    const { index } = info;
    const nID = 'T' + index;
    const random = ((Math.random() * 1e7) | 0);
    if (mode === 'text') { // 更新数据源
        signContentMap.set(boardId, { mode: 'text', t: content });
    } else if (mode === 'image') {
        signContentMap.set(boardId + random, { mode: 'image', imgUrl: content });
    } else if (mode === 'canvas') {
        signContentMap.set(boardId, { mode: 'canvas', drawName: content });
    }
    if (textureModule) { // 清纹理缓存
        textureModule.textureMap.delete(boardId);
    }
    window[nID] = undefined;
    if (mode === 'image') { // image 模式：移除旧 img DOM
        const uniqueImgId = 'dyn_img_' + index + '_' + boardId;
        document.getElementById(uniqueImgId)?.remove();
    }
    ccgxkObj.W.plane({ n: nID, t: boardId + random }); // 触发重绘
    if (mode === 'image') {
        ccgxkObj.indexToArgs.get(index).texture = boardId + random;
    } else {
        ccgxkObj.indexToArgs.get(index).texture = boardId;
    }
    ccgxkObj.currentlyActiveIndices.delete(index);
    console.log(`[updateSign] ✅ ${boardId} 已更新`);
};

// ── SSE 客户端 ──

export function initSSE() {
    try {
        const es = new EventSource(`${API_BASE}/api/signs/stream`);
        es.onmessage = function(e) {
            const data = JSON.parse(e.data);
            if (data.boards) {
                data.boards.forEach(board => {
                    if (!signIndexMap.has(board.id)) return;
                    const cur = signContentMap.get(board.id);
                    if (!cur) return;
                    const changed = cur.mode !== board.mode // 只更新内容真正变化的
                        || (board.mode === 'text' && cur.t !== board.content)
                        || (board.mode === 'image' && cur.imgUrl !== board.content)
                        || (board.mode === 'canvas' && cur.drawName !== board.content);
                    if (changed) {
                        window.updateSign(board.id, board.content, board.mode);
                    }
                });
            }
        };
        es.onerror = () => console.log('[SSE] 连接断开，自动重连中...');
        console.log(`[SSE] 已连接 ${API_BASE}`);
    } catch (e) {
        console.log('[SSE] 连接失败（开发服务器未启动？）');
    }
}
