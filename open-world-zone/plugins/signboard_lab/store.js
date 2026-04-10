/**
 * 获取数据
 *
 * 请求了，懒加载（每 100 毫秒汇总一次，集中请求）了等等
 */

import { getApiBase } from './config.js';

// 映射表，储存我的本地临时数据
export const signContentMap = new Map();   // 画板id → { mode, t/imgUrl/drawName, fromServer }
export const signIndexMap = new Map();     // 画板id → { index }

// 获取引擎引用（需 getter/setter）
let _ccgxkObj = null;
let _textureModule = null;

export function getCcgxkObj() { return _ccgxkObj; }
export function setCcgxkObj(obj) { _ccgxkObj = obj; }
export function getTextureModule() { return _textureModule; }
export function setTextureModule(mod) { _textureModule = mod; }

/**
 * 获取当前引擎模式（1=只看模式，2=编辑模式）
 */
export function getCcgxkMode() {
    const ccgxkObj = getCcgxkObj();
    return ccgxkObj ? ccgxkObj.mode : 2;  // 默认为编辑模式
}

/**
 * 计算画板是否应该隐藏（动态计算，响应 mode 切换）
 * @param {object} info - signContentMap 中的信息
 * @param {number} ccgxkMode - 当前引擎模式
 * @returns {boolean}
 */
export function computeShouldBeHidden(info, ccgxkMode) {
    if (!info) return false;
    // pending 状态不隐藏（正在加载）
    if (info.mode === 'pending') return false;
    // 有内容（text/image）不隐藏
    if (info.mode === 'text' || info.mode === 'image') return false;
    // empty 模式：只有当 fromServer=true（服务器确认无数据）且 ccgxkMode=1（只看模式）时才隐藏
    if (info.mode === 'empty') {
        // 使用 == 而不是 ===，兼容字符串 '1' 和数字 1
        return info.fromServer && ccgxkMode == 1;
    }
    return false;
}

/**
 * 统一设置画板内容（避免重复的 set 逻辑）
 * @param {string} id - 画板 ID
 * @param {string} mode - 'text' | 'image' | 'empty' | 'pending'
 * @param {string} content - 文本内容或图片URL
 * @param {object} extra - 额外参数
 * @param {boolean} fromServer - 是否来自服务器（决定 empty 时是否应该隐藏）
 */
export function setSignContent(id, mode, content, extra = {}, fromServer = false) {
    // 关键修复：如果 content 为空，视为 empty 模式
    const hasContent = content && content.trim() !== '';

    if (mode === 'text' && hasContent) {
        signContentMap.set(id, {
            mode: 'text',
            t: content,
            extra,
            fromServer  // 记录数据来源
        });
    } else if (mode === 'image' && hasContent) {
        signContentMap.set(id, {
            mode: 'image',
            imgUrl: content,
            extra,
            fromServer  // 记录数据来源
        });
    } else {
        // 无内容或 mode 是 'empty' 或 'pending'
        if (mode === 'pending') {
            signContentMap.set(id, {
                mode: 'pending',
                fromServer: false
            });
        } else {
            // text/image 但无内容，或 empty
            signContentMap.set(id, {
                mode: 'empty',
                fromServer  // 关键：记录服务器确认无数据
            });
        }
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
    const info = signContentMap.get(id);
    // 已有确定数据（非 pending），跳过
    if (info && info.mode !== 'pending') return;
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

        // 标记找到的 ID
        const foundIds = new Set();

        if (data.boards) {
            for (const board of data.boards) {
                foundIds.add(board.id);
                // fromServer=true 表示这是服务器确认的数据
                setSignContent(board.id, board.mode, board.content, board.extra, true);
                if (typeof window.updateSign === 'function') {
                    // 懒加载返回的数据，fromServer=true
                    window.updateSign(board.id, board.content, board.mode, board.extra || {}, true);
                }
            }
            console.log(`[Store] 懒加载 ${data.boards.length} 个信息板`);
        }

        // 未找到内容的画板，设置 empty（fromServer=true 表示服务器确认无数据）
        for (const id of ids) {
            if (!foundIds.has(id)) {
                setSignContent(id, 'empty', '', {}, true);  // fromServer=true
                if (typeof window.updateSign === 'function') {
                    // empty 时，fromServer=true 触发隐藏逻辑（mode=1 时）
                    window.updateSign(id, '', 'empty', {}, true);
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
