/**
 * 本地离线草稿保护表
 * ========
 * 只要某个 boardId 仍在本地待同步队列里，服务器返回的同 id 数据就不能覆盖当前显示内容。
 * 同步成功或手动清空后，再解除这层保护。
 */

const protectedBoardIds = new Set();

/**
 * 标记某个画板仍有本地待同步草稿，服务器数据不能覆盖它。
 */
export function protectOfflineBoardId(id) {
    const normalizedId = String(id || '').trim();
    if (!normalizedId) return;
    protectedBoardIds.add(normalizedId);
}

/**
 * 取消某个画板的本地优先保护；通常用于同步成功后立即恢复正常服务器覆盖逻辑。
 */
export function unprotectOfflineBoardId(id) {
    const normalizedId = String(id || '').trim();
    if (!normalizedId) return;
    protectedBoardIds.delete(normalizedId);
}

/**
 * 用一整组待同步 id 重建当前保护表；页面刷新后可直接用 IndexedDB 队列重建。
 */
export function resetOfflineBoardProtection(ids = []) {
    protectedBoardIds.clear();
    for (const id of ids) protectOfflineBoardId(id);
}

/**
 * 清空所有本地优先保护；只在明确清空离线队列时使用。
 */
export function clearOfflineBoardProtection() {
    protectedBoardIds.clear();
}

/**
 * 判断某个画板当前是否仍受本地待同步草稿保护。
 */
export function isOfflineBoardProtected(id) {
    return protectedBoardIds.has(String(id || '').trim());
}
