/**
 * 获取数据
 * 
 * 请求了，懒加载（每 100 毫秒汇总一次，集中请求）了等等
 */

import { getApiBase } from './config.js';

// 映射表，储存我的本地临时数据
export const signContentMap = new Map();   // 画板id → { mode, t/imgUrl/drawName }
export const signIndexMap = new Map();     // 画板id → { index }

// 获取引擎引用（需 getter/setter）
let _ccgxkObj = null;
let _textureModule = null;

export function getCcgxkObj() { return _ccgxkObj; }
export function setCcgxkObj(obj) { _ccgxkObj = obj; }
export function getTextureModule() { return _textureModule; }
export function setTextureModule(mod) { _textureModule = mod; }

/**
 * 统一设置画板内容（避免重复的 set 逻辑）
 */
export function setSignContent(id, mode, content, extra = {}) {
    if (mode === 'text') {
        signContentMap.set(id, { mode: 'text', t: content, extra });
    } else if (mode === 'image') {
        signContentMap.set(id, { mode: 'image', imgUrl: content, extra });
    } else {
        signContentMap.set(id, { mode: 'empty' });
    }
}

// 懒加载
const pendingIds = new Set();      // 待请求的画板 ID
let fetchTimer = null;             // 合并计时器
let isFetching = false;            // 防止重复请求

/**
 * 懒加载，自动合并请求
 * @param {string} id - 画板 ID
 */
export function lazyLoadSign(id) {
    if (signContentMap.has(id)) return;  // 已有数据，跳过
    pendingIds.add(id);  // 加入待请求队列
    if (!fetchTimer && !isFetching) {  // 100ms 内的请求合并成一次批量请求
        fetchTimer = setTimeout(() => {
            fetchTimer = null;
            doBatchFetch();  // 批量请求
        }, 100);
    }
}

/**
 * 向服务器，执行批量请求
 */
async function doBatchFetch() {
    if (pendingIds.size === 0) return;
    const ids = [...pendingIds];  // 取出待请求的 IDs
    pendingIds.clear();
    isFetching = true;
    try {
        const res = await fetch(`${getApiBase()}/api/signs/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.boards) {
            for (const board of data.boards) {
                setSignContent(board.id, board.mode, board.content, board.extra);
                if (typeof window.updateSign === 'function') {
                    window.updateSign(board.id, board.content, board.mode, board.extra || {});
                }
            }
            console.log(`[Store] 懒加载 ${data.boards.length} 个信息板`);
        }
        for (const id of ids) {  // 未找到内容
            if (!signContentMap.has(id)) {
                setSignContent(id, 'empty');
                if (typeof window.updateSign === 'function') {  // （调试）把无内容的，设置成 text，并显示 id
                    window.updateSign(id, '', 'text', {});
                }
            }
        }
    } catch (e) {
        console.error('[Store] 批量获取失败:', e);
        ids.forEach(id => pendingIds.add(id));  // 失败的 ID 放回队列，下次重试
    } finally {  // 收尾，无论如何，都会执行的代码
        isFetching = false;
        if (pendingIds.size > 0 && !fetchTimer) {  // 如果还有待请求的 ID，继续处理
            fetchTimer = setTimeout(() => {
                fetchTimer = null;
                doBatchFetch();
            }, 100);
        }
    }
}

