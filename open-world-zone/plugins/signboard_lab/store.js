/**
 * 数据存储模块（前端 3D 引擎）
 * 懒加载 + 请求合并
 */

import { getApiBase } from './config.js';

// ── 内容映射 ──

export const signContentMap = new Map();   // id → { mode, t/imgUrl/drawName }
export const signIndexMap = new Map();     // id → { index }

// ── 引擎引用（需 getter/setter）──

let _ccgxkObj = null;
let _textureModule = null;

export function getCcgxkObj() { return _ccgxkObj; }
export function setCcgxkObj(obj) { _ccgxkObj = obj; }
export function getTextureModule() { return _textureModule; }
export function setTextureModule(mod) { _textureModule = mod; }

// ── 初始化：只加载 Canvas 函数库（数据量小）──

let initPromise = null;

export async function initData() {
    if (initPromise) return initPromise;

    initPromise = (async () => {
        console.log('[Store] 信息板数据将按需懒加载');
    })();

    return initPromise;
}

// ── 懒加载：请求合并 + 批量获取 ──

const pendingIds = new Set();      // 待请求的画板 ID
let fetchTimer = null;             // 合并计时器
let isFetching = false;            // 防止重复请求

/**
 * 懒加载单个画板（自动合并请求）
 * @param {string} id - 画板 ID
 */
export function lazyLoadSign(id) {
    // 已有数据，跳过
    if (signContentMap.has(id)) return;

    // 加入待请求队列
    pendingIds.add(id);

    // 100ms 内的请求合并成一次批量请求
    if (!fetchTimer && !isFetching) {
        fetchTimer = setTimeout(() => {
            fetchTimer = null;
            doBatchFetch();
        }, 100);
    }
}

/**
 * 执行批量请求
 */
async function doBatchFetch() {
    if (pendingIds.size === 0) return;

    // 取出待请求的 IDs
    const ids = [...pendingIds];
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
                if (board.mode === 'text') {
                    signContentMap.set(board.id, { mode: 'text', t: board.content, extra: board.extra });
                } else if (board.mode === 'image') {
                    signContentMap.set(board.id, { mode: 'image', imgUrl: board.content, extra: board.extra });
                }

                // 触发重绘
                if (typeof window.updateSign === 'function') {
                    window.updateSign(board.id, board.content, board.mode);
                }
            }
            console.log(`[Store] 懒加载 ${data.boards.length} 个信息板`);
        }
    } catch (e) {
        console.error('[Store] 批量获取失败:', e);
        // 失败的 ID 放回队列，下次重试
        ids.forEach(id => pendingIds.add(id));
    } finally {
        isFetching = false;

        // 如果还有待请求的 ID，继续处理
        if (pendingIds.size > 0 && !fetchTimer) {
            fetchTimer = setTimeout(() => {
                fetchTimer = null;
                doBatchFetch();
            }, 100);
        }
    }
}

