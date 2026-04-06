/**
 * 热更新模块
 * updateSign + SSE 实时监听
 */

import { getApiBase } from './config.js';
import { signContentMap, signIndexMap, getCcgxkObj, getTextureModule } from './store.js';

// ── 全局热更新函数 ──
window.updateSign = function(boardId, content, mode = 'text', extra = {}) {
    const ccgxkObj = getCcgxkObj();
    const textureModule = getTextureModule();
    const info = signIndexMap.get(boardId);
    if (!info) { console.error(`[updateSign] 找不到标识牌: ${boardId}`); return; }
    if (!ccgxkObj) { console.error('[updateSign] 引擎未就绪'); return; }
    const { index } = info;
    const nID = 'T' + index;
    const random = ((Math.random() * 1e7) | 0);

    // 更新数据源
    // 策略：存储在 boardId 下（面板读取），同时存储在 boardId+random 下（hook 查找）
    if (mode === 'text') {
        signContentMap.set(boardId, { mode: 'text', t: content, extra });
    } else if (mode === 'image') {
        signContentMap.set(boardId, { mode: 'image', imgUrl: content, extra });          // 面板读取
        signContentMap.set(boardId + random, { mode: 'image', imgUrl: content, extra }); // hook 查找
    }

    // 清除缓存（多重保险）
    if (textureModule) {
        textureModule.textureMap.delete(boardId);
        textureModule.textureMap.delete(boardId + random); // 保险
    }
    window[nID] = undefined;

    if (mode === 'image') {
        // image 模式：移除旧 img DOM，用 random 后缀对抗浏览器图片缓存
        const uniqueImgId = 'dyn_img_' + index + '_' + boardId;
        document.getElementById(uniqueImgId)?.remove();

        // 更新纹理（用 random 后缀强制刷新）
        ccgxkObj.W.plane({ n: nID, t: boardId + random });
        ccgxkObj.indexToArgs.get(index).texture = boardId + random;
    } else {
        ccgxkObj.W.plane({ n: nID, t: boardId });
        ccgxkObj.indexToArgs.get(index).texture = boardId;
    }

    ccgxkObj.currentlyActiveIndices.delete(index);
    // console.log(`[updateSign] ✅ ${boardId} 已更新 (mode: ${mode})`);
};

// ── SSE 客户端（带自动重连）──

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
                    // cur 为空说明是新板子，直接更新；否则检查是否有变化
                    if (cur) {
                        const changed = cur.mode !== board.mode
                            || (board.mode === 'text' && cur.t !== board.content)
                            || (board.mode === 'image' && cur.imgUrl !== board.content);
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
