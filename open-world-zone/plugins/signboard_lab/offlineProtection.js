/**
 * 本地离线草稿保护表
 * ========
 * 只要某个 serverUrl + boardId 仍在本地待同步队列里，服务器返回的同组合数据就不能覆盖当前显示内容。
 * 同步成功或手动清空后，再解除这层保护。
 */

const protectedBoardKeys = new Set();

/**
 * 统一生成保护 key，保证不同服务器下同名 boardId 完全隔离。
 */
function makeProtectionKey(serverUrl, id) {
    return `${String(serverUrl || '').trim()}::${String(id || '').trim()}`;
}

/**
 * 标记某个画板仍有本地待同步草稿，服务器数据不能覆盖它。
 */
export function protectOfflineBoardId(serverUrl, id) {
    const key = makeProtectionKey(serverUrl, id);
    if (!key || key === '::') return;
    protectedBoardKeys.add(key);
}

/**
 * 取消某个画板的本地优先保护；通常用于同步成功后立即恢复正常服务器覆盖逻辑。
 */
export function unprotectOfflineBoardId(serverUrl, id) {
    protectedBoardKeys.delete(makeProtectionKey(serverUrl, id));
}

/**
 * 用一整组待同步 id 重建当前保护表；页面刷新后可直接用 IndexedDB 队列重建。
 */
export function resetOfflineBoardProtection(serverUrl, ids = []) {
    clearOfflineBoardProtectionByServer(serverUrl);
    for (const id of ids) protectOfflineBoardId(serverUrl, id);
}

/**
 * 清空指定服务器下的保护状态；切换服务器或重建保护表时用它收口。
 */
export function clearOfflineBoardProtectionByServer(serverUrl) {
    const prefix = `${String(serverUrl || '').trim()}::`;
    for (const key of [...protectedBoardKeys]) {
        if (key.startsWith(prefix)) protectedBoardKeys.delete(key);
    }
}

/**
 * 清空所有本地优先保护；仅在明确清空整份运行时保护集时使用。
 */
export function clearOfflineBoardProtection() {
    protectedBoardKeys.clear();
}

/**
 * 判断某个画板当前是否仍受本地待同步草稿保护。
 */
export function isOfflineBoardProtected(serverUrl, id) {
    return protectedBoardKeys.has(makeProtectionKey(serverUrl, id));
}
