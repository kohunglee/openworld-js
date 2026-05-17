/**
 * 信息板离线同步 Tab 面板
 * ========
 * 独立展示 IndexedDB 队列状态，并提供手动 bulk-upsert 同步和调试按钮。
 */

import {
    clearOfflineQueue,
    getOfflineQueueStats,
    getPendingOfflineBoards,
    syncOfflineBoards,
    syncOfflineBoardsLegacy
} from '../signboard_lab/offlineQueue.js';

/**
 * 把时间戳格式化成容易现场判断的时间。
 */
function formatTime(time) {
    if (!time) return '-';
    return new Date(time).toLocaleString();
}

/**
 * 把一组 id 压缩成短预览，避免 Tab 侧栏被大量画板撑爆。
 */
function formatIdPreview(ids) {
    if (!ids?.length) return '-';
    const shown = ids.slice(0, 8).join(', ');
    return ids.length > 8 ? `${shown} ... +${ids.length - 8}` : shown;
}

/**
 * 渲染最近一次同步结果，重点显示失败原因，方便判断是不是 401/403/207。
 */
function formatLastResult(result) {
    if (!result) return '还没有同步记录。';
    const modeLabel = result.mode === 'legacy' ? '旧版逐条模式' : '批量模式';
    if (result.error) return `失败：${result.error}｜成功 ${result.succeeded || 0}，剩余 ${result.remaining || 0}`;
    return `${modeLabel}｜总数 ${result.total || 0}，成功 ${result.succeeded || 0}，失败 ${result.failed || 0}，剩余 ${result.remaining || 0}`;
}

/**
 * 初始化离线同步调试面板。
 */
export function initOfflineSync($) {
    const syncBtn = $('signboardOfflineSyncNow');
    const legacySyncBtn = $('signboardOfflineSyncLegacy');
    const refreshBtn = $('signboardOfflineRefresh');
    const dumpBtn = $('signboardOfflineDump');
    const clearBtn = $('signboardOfflineClear');
    const statusEl = $('signboardOfflineStatus');
    const idsEl = $('signboardOfflineIds');
    const lastEl = $('signboardOfflineLast');

    if (!syncBtn || !legacySyncBtn || !refreshBtn || !statusEl || !idsEl || !lastEl) return;

    /**
     * 统一刷新 UI；所有按钮操作、IndexedDB 事件都会走这里。
     */
    async function render(statusText = '') {
        try {
            const stats = await getOfflineQueueStats();
            const result = stats.lastSyncResult;

            statusEl.textContent = statusText || `待同步：${stats.pending}｜最近本地修改：${formatTime(stats.latestUpdatedAt)}`;
            idsEl.textContent = `ID：${formatIdPreview(stats.ids)}`;
            lastEl.textContent = `上次同步：${formatLastResult(result)}`;
            syncBtn.disabled = stats.pending === 0;
            legacySyncBtn.disabled = stats.pending === 0;
        } catch (error) {
            statusEl.textContent = `IndexedDB 错误：${error.message}`;
            syncBtn.disabled = true;
            legacySyncBtn.disabled = true;
        }
    }

    /**
     * 刷新按钮只负责重新读取本地队列状态。
     * 这里先给一个瞬时提示，真正刷新完成后要回到默认统计文案，不能把“正在刷新”永久留在界面上。
     */
    refreshBtn.addEventListener('click', async () => {
        statusEl.textContent = '正在刷新离线队列...';
        await render();
    });

    syncBtn.addEventListener('click', async () => {
        syncBtn.disabled = true;
        statusEl.textContent = '正在同步离线画板...';

        try {
            const result = await syncOfflineBoards();
            await render(result.success ? '同步完成。' : '同步完成，但存在失败项。');
        } catch (error) {
            await render(`同步失败：${error.message}`);
        }
    });

    legacySyncBtn.addEventListener('click', async () => {
        syncBtn.disabled = true;
        legacySyncBtn.disabled = true;
        statusEl.textContent = '正在逐条同步到旧版服务器...';

        try {
            const result = await syncOfflineBoardsLegacy();
            await render(result.success ? '旧版同步完成。' : '旧版同步完成，但存在失败项。');
        } catch (error) {
            await render(`旧版同步失败：${error.message}`);
        }
    });

    dumpBtn?.addEventListener('click', async () => {
        const boards = await getPendingOfflineBoards();
        console.log('[Signboard Offline] pending boards:', boards);
        await render(`已输出 ${boards.length} 个待同步画板到控制台。`);
    });

    clearBtn?.addEventListener('click', async () => {
        const stats = await getOfflineQueueStats();
        if (stats.pending === 0) {
            await render('队列本来就是空的。');
            return;
        }

        const ok = confirm(`要清空 ${stats.pending} 个本地离线画板草稿吗？这里只会清空 IndexedDB，不会删除服务器数据。`);
        if (!ok) {
            await render('已取消清空。');
            return;
        }

        await clearOfflineQueue();
        await render('本地离线队列已清空。');
    });

    window.addEventListener('signboard:offline-queue', () => render());
    render();
}
