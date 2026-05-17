/**
 * 信息板离线队列
 * ========
 * 把本机浏览器编辑过的信息板写入 IndexedDB，后续由 Tab 面板手动批量同步到服务器。
 */

import { getApiBase, normalizeApiBase } from './config.js';
import { setSignContent, signIndexMap } from './store.js';
import {
    clearOfflineBoardProtectionByServer,
    protectOfflineBoardId,
    resetOfflineBoardProtection,
    unprotectOfflineBoardId
} from './offlineProtection.js';

const DB_NAME = 'owz_signboard_offline';
const DB_VERSION = 2;
const STORE_NAME = 'pending_boards';
const SYNC_LIMIT = 50;
const LEGACY_SYNC_INTERVAL_MS = 500;

let dbPromise = null;
let lastSyncResult = null;

/**
 * 基于当前服务器地址生成离线队列分区 key。
 * 规则：完整 URL 隔离，只忽略末尾斜杠。
 */
function getCurrentServerUrl() {
    return normalizeApiBase(getApiBase());
}

/**
 * 队列主键必须同时包含 serverUrl 和 boardId，避免不同服务器下同名画板互相覆盖。
 */
function makeQueueKey(serverUrl, id) {
    return `${normalizeApiBase(serverUrl)}::${String(id || '').trim()}`;
}

/**
 * 广播离线队列状态，Tab 面板用这个事件刷新调试信息。
 */
function emitOfflineQueueEvent(type, detail = {}) {
    const payload = {
        type,
        time: Date.now(),
        lastSyncResult,
        ...detail
    };
    window.signboardOfflineQueueStatus = payload;
    window.dispatchEvent(new CustomEvent('signboard:offline-queue', { detail: payload }));
}

/**
 * 打开 IndexedDB；重复调用会复用同一个 Promise，避免并发打开多次。
 */
function openDb() {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;
            const tx = request.transaction;

            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'queueKey' });
                store.createIndex('serverUrl', 'serverUrl', { unique: false });
                store.createIndex('updatedAt', 'updatedAt', { unique: false });
                return;
            }

            const oldStore = tx.objectStore(STORE_NAME);
            const legacyRowsRequest = oldStore.getAll();

            legacyRowsRequest.onsuccess = () => {
                const legacyRows = legacyRowsRequest.result || [];
                db.deleteObjectStore(STORE_NAME);

                const newStore = db.createObjectStore(STORE_NAME, { keyPath: 'queueKey' });
                newStore.createIndex('serverUrl', 'serverUrl', { unique: false });
                newStore.createIndex('updatedAt', 'updatedAt', { unique: false });

                // 旧版本没有 serverUrl，只能归到“升级当下的当前服务器”名下。
                // 这至少能避免丢数据；之后用户切换到其他 URL 时就不再串库。
                const currentServerUrl = getCurrentServerUrl();
                for (const row of legacyRows) {
                    const migrated = normalizeBoardDraft(row, currentServerUrl);
                    newStore.put(migrated);
                }
            };
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error('IndexedDB open failed'));
    });

    return dbPromise;
}

/**
 * 执行一次 IndexedDB 事务，并把 request 结果转成 Promise。
 */
async function runStore(mode, executor) {
    const db = await openDb();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const store = tx.objectStore(STORE_NAME);
        let resultValue;

        tx.oncomplete = () => resolve(resultValue);
        tx.onerror = () => reject(tx.error || new Error('IndexedDB transaction failed'));
        tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));

        const request = executor(store);
        if (request && typeof request === 'object' && 'onsuccess' in request) {
            request.onsuccess = () => {
                resultValue = request.result;
            };
            request.onerror = () => reject(request.error || new Error('IndexedDB request failed'));
        } else {
            resultValue = request;
        }
    });
}

/**
 * 规范化要写入离线队列的画板数据，保持和 bulk-upsert API 的请求体一致。
 */
function normalizeBoardDraft(board, serverUrl = getCurrentServerUrl()) {
    const id = String(board?.id || '').trim();
    if (!id) throw new Error('Board id is required');
    const normalizedServerUrl = normalizeApiBase(serverUrl);

    let mode = board.mode;
    if (!['text', 'image', 'empty'].includes(mode)) mode = 'text';

    let extra = board.extra || {};
    if (typeof extra === 'string') {
        try {
            extra = JSON.parse(extra);
        } catch {
            extra = {};
        }
    }
    if (!extra || typeof extra !== 'object' || Array.isArray(extra)) extra = {};

    return {
        queueKey: makeQueueKey(normalizedServerUrl, id),
        serverUrl: normalizedServerUrl,
        id,
        name: String(board.name || id),
        mode,
        content: String(board.content ?? ''),
        extra,
        updatedAt: Number(board.updatedAt) || Date.now()
    };
}

/**
 * 在线模式下的单条实时保存。
 * 沿用老服务器 PATCH 接口，语义与历史版本一致：成功才算保存成功。
 */
export async function saveBoardToLegacyServer(board) {
    const draft = normalizeBoardDraft(board);
    await syncOneBoardToLegacyServer(draft);
    return draft;
}

/**
 * 保存本机编辑稿；同一个 id 使用 put 覆盖，所以只保留最后一次编辑。
 */
export async function saveOfflineBoardDraft(board) {
    const draft = normalizeBoardDraft(board);

    await runStore('readwrite', store => store.put(draft));
    protectOfflineBoardId(draft.serverUrl, draft.id);
    const stats = await getOfflineQueueStats();
    emitOfflineQueueEvent('saved', { board: draft, stats });
    return draft;
}

/**
 * 读取所有待同步画板，按更新时间从旧到新排列，便于调试。
 */
export async function getPendingOfflineBoards() {
    const boards = await runStore('readonly', store => store.getAll());
    const currentServerUrl = getCurrentServerUrl();
    return (boards || [])
        .filter(board => normalizeApiBase(board.serverUrl) === currentServerUrl)
        .sort((a, b) => (a.updatedAt || 0) - (b.updatedAt || 0));
}

/**
 * 获取队列摘要，避免 Tab 面板为了显示数量到处重复查库。
 */
export async function getOfflineQueueStats() {
    const boards = await getPendingOfflineBoards();
    const latest = boards.length ? boards[boards.length - 1] : null;

    return {
        pending: boards.length,
        ids: boards.map(board => board.id),
        latestUpdatedAt: latest?.updatedAt || null,
        lastSyncResult
    };
}

/**
 * 把 IndexedDB 里的离线草稿重新灌回运行时内存。
 * 刷新页面后，场景默认只知道服务器数据；没有这一步，本地草稿会“还在数据库里但画板看不见”。
 */
export async function hydrateOfflineBoardsIntoMemory() {
    const boards = await getPendingOfflineBoards();
    resetOfflineBoardProtection(getCurrentServerUrl(), boards.map(board => board.id));

    for (const board of boards) {
        setSignContent(board.id, board.mode, board.content, board.extra || {});

        // 当前板子如果已经在场景里注册过，就立即强制刷新一次可见内容。
        if (signIndexMap.has(board.id) && typeof window.updateSign === 'function') {
            window.updateSign(board.id, board.content, board.mode, board.extra || {});
        }
    }

    emitOfflineQueueEvent('hydrated', {
        stats: await getOfflineQueueStats()
    });
    return boards;
}

/**
 * 删除指定 id 的待同步项；同步成功后只清理成功项，失败项继续留队。
 */
async function deleteOfflineBoards(ids) {
    if (!ids.length) return;
    const currentServerUrl = getCurrentServerUrl();

    await runStore('readwrite', store => {
        for (const id of ids) store.delete(makeQueueKey(currentServerUrl, id));
        return ids.length;
    });

    for (const id of ids) {
        unprotectOfflineBoardId(currentServerUrl, id);
    }
}

/**
 * 简单延时工具。
 * 旧服务器兼容模式要求每 500ms 才发下一条请求，这里统一复用。
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 清空本机离线队列。这个能力只给 Tab 调试面板使用。
 */
export async function clearOfflineQueue() {
    const boards = await getPendingOfflineBoards();
    const currentServerUrl = getCurrentServerUrl();

    await runStore('readwrite', store => {
        for (const board of boards) {
            store.delete(board.queueKey || makeQueueKey(currentServerUrl, board.id));
        }
        return boards.length;
    });

    clearOfflineBoardProtectionByServer(currentServerUrl);
    lastSyncResult = {
        success: true,
        message: 'Offline queue cleared locally for current server.',
        time: Date.now()
    };
    const stats = await getOfflineQueueStats();
    emitOfflineQueueEvent('cleared', { stats });
    return stats;
}

/**
 * 把一批待同步画板提交到新的 bulk-upsert API。
 */
async function syncChunk(boards) {
    const res = await fetch(`${getApiBase()}/api/signs/bulk-upsert`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boards })
    });

    let data = null;
    try {
        data = await res.json();
    } catch {
        data = null;
    }

    if (![200, 207].includes(res.status)) {
        const message = data?.message || data?.error || `HTTP ${res.status}`;
        throw new Error(message);
    }

    const results = Array.isArray(data?.boards) ? data.boards : [];
    const failedItems = results.filter(item => item && item.success === false);
    const succeededIds = res.status === 200
        ? boards.filter(board => !failedItems.some(item => item.id === board.id)).map(board => board.id)
        : results.filter(item => item?.success).map(item => item.id);

    return {
        status: res.status,
        total: boards.length,
        succeededIds,
        failedItems,
        response: data
    };
}

/**
 * 向旧服务器发送单条 PATCH 请求。
 * 这个接口兼容老的保存路径：每次只更新一个 board。
 */
async function syncOneBoardToLegacyServer(board) {
    const res = await fetch(`${getApiBase()}/api/signs/${encodeURIComponent(board.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            mode: board.mode,
            content: board.content,
            extra: board.extra || {}
        })
    });

    let data = null;
    try {
        data = await res.json();
    } catch {
        data = null;
    }

    if (!res.ok) {
        const message = data?.message || data?.error || `HTTP ${res.status}`;
        throw new Error(message);
    }

    return data;
}

/**
 * 手动批量同步全部离线编辑稿；每批最多 50 条，符合后端接口限制。
 */
export async function syncOfflineBoards() {
    const pendingBoards = await getPendingOfflineBoards();
    const startedAt = Date.now();

    if (pendingBoards.length === 0) {
        lastSyncResult = {
            success: true,
            total: 0,
            succeeded: 0,
            failed: 0,
            message: 'No offline boards to sync.',
            time: startedAt
        };
        emitOfflineQueueEvent('sync-empty', { stats: await getOfflineQueueStats() });
        return lastSyncResult;
    }

    emitOfflineQueueEvent('sync-start', {
        stats: { pending: pendingBoards.length, ids: pendingBoards.map(board => board.id) }
    });

    const succeededIds = [];
    const failedItems = [];
    const chunks = [];
    for (let i = 0; i < pendingBoards.length; i += SYNC_LIMIT) {
        chunks.push(pendingBoards.slice(i, i + SYNC_LIMIT));
    }

    try {
        for (const chunk of chunks) {
            const result = await syncChunk(chunk);
            succeededIds.push(...result.succeededIds);
            failedItems.push(...result.failedItems);
        }

        await deleteOfflineBoards(succeededIds);
        const stats = await getOfflineQueueStats();

        lastSyncResult = {
            success: failedItems.length === 0,
            total: pendingBoards.length,
            succeeded: succeededIds.length,
            failed: failedItems.length,
            failedItems,
            remaining: stats.pending,
            time: Date.now(),
            durationMs: Date.now() - startedAt
        };

        emitOfflineQueueEvent('sync-finished', { stats });
        return lastSyncResult;
    } catch (error) {
        if (succeededIds.length) await deleteOfflineBoards(succeededIds);
        const stats = await getOfflineQueueStats();

        lastSyncResult = {
            success: false,
            total: pendingBoards.length,
            succeeded: succeededIds.length,
            failed: stats.pending,
            error: error.message,
            remaining: stats.pending,
            time: Date.now(),
            durationMs: Date.now() - startedAt
        };

        emitOfflineQueueEvent('sync-failed', { stats, error: error.message });
        throw error;
    }
}

/**
 * 兼容老服务器的逐条同步模式。
 * 每次只发一条 PATCH，请求之间强制等待 500ms，避免把老服务压挂。
 */
export async function syncOfflineBoardsLegacy() {
    const pendingBoards = await getPendingOfflineBoards();
    const startedAt = Date.now();

    if (pendingBoards.length === 0) {
        lastSyncResult = {
            success: true,
            mode: 'legacy',
            total: 0,
            succeeded: 0,
            failed: 0,
            message: 'No offline boards to sync.',
            time: startedAt
        };
        emitOfflineQueueEvent('legacy-sync-empty', { stats: await getOfflineQueueStats() });
        return lastSyncResult;
    }

    emitOfflineQueueEvent('legacy-sync-start', {
        stats: { pending: pendingBoards.length, ids: pendingBoards.map(board => board.id) }
    });

    const succeededIds = [];
    const failedItems = [];

    for (let i = 0; i < pendingBoards.length; i += 1) {
        const board = pendingBoards[i];

        try {
            await syncOneBoardToLegacyServer(board);
            succeededIds.push(board.id);
            await deleteOfflineBoards([board.id]);
        } catch (error) {
            failedItems.push({
                id: board.id,
                success: false,
                message: error.message
            });
        }

        const stats = await getOfflineQueueStats();
        lastSyncResult = {
            success: false,
            mode: 'legacy',
            total: pendingBoards.length,
            succeeded: succeededIds.length,
            failed: failedItems.length,
            failedItems,
            remaining: stats.pending,
            currentId: board.id,
            time: Date.now(),
            durationMs: Date.now() - startedAt
        };
        emitOfflineQueueEvent('legacy-sync-progress', { stats });

        // 最后一条不需要再等；其余请求之间保持 500ms 间隔。
        if (i < pendingBoards.length - 1) {
            await delay(LEGACY_SYNC_INTERVAL_MS);
        }
    }

    const stats = await getOfflineQueueStats();
    lastSyncResult = {
        success: failedItems.length === 0,
        mode: 'legacy',
        total: pendingBoards.length,
        succeeded: succeededIds.length,
        failed: failedItems.length,
        failedItems,
        remaining: stats.pending,
        time: Date.now(),
        durationMs: Date.now() - startedAt
    };
    emitOfflineQueueEvent('legacy-sync-finished', { stats });
    return lastSyncResult;
}

/**
 * 暴露给控制台和 Tab 插件使用，方便现场排查 IndexedDB 队列状态。
 */
window.signboardOfflineQueue = {
    saveOfflineBoardDraft,
    getPendingOfflineBoards,
    getOfflineQueueStats,
    hydrateOfflineBoardsIntoMemory,
    syncOfflineBoards,
    syncOfflineBoardsLegacy,
    clearOfflineQueue
};
