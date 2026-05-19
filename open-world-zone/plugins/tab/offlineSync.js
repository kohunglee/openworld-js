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
import { isOfflineSaveModeEnabled, setOfflineSaveModeEnabled } from '../signboard_lab/saveMode.js';
import { getErrorMessage } from '../signboard_lab/errorMessage.js';

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
    if (!result) return 'No sync history yet.';
    const modeLabel = result.mode === 'legacy' ? 'Legacy mode' : 'Batch mode';
    if (result.error) return `Failed: ${result.error} | Succeeded ${result.succeeded || 0}, Remaining ${result.remaining || 0}`;
    return `${modeLabel} | Total ${result.total || 0}, Succeeded ${result.succeeded || 0}, Failed ${result.failed || 0}, Remaining ${result.remaining || 0}`;
}

/**
 * 生成逐条同步完成后的 alert 文案。
 */
function formatLegacySyncAlert(result) {
    if (!result) return 'Sync finished, but no result was returned.';
    if (result.total === 0) return 'No pending data to sync.';
    if (result.success) return `Sync complete: ${result.total} total, all succeeded.`;
    return `Sync complete: total ${result.total}, succeeded ${result.succeeded || 0}, failed ${result.failed || 0}, remaining ${result.remaining || 0}.`;
}

/**
 * 切换离线模式会立刻刷新页面；先把鼠标改成加载态，减少等待时的歧义。
 */
function reloadWithProgressCursor() {
    document.body.style.setProperty('cursor', 'progress', 'important');
    document.documentElement.style.setProperty('cursor', 'progress', 'important');
    for (const el of document.querySelectorAll('*')) {
        el.style.setProperty('cursor', 'progress', 'important');
    }

    // 给浏览器一个极短的绘制窗口，确保用户能看到“正在加载”的鼠标状态。
    requestAnimationFrame(() => {
        setTimeout(() => {
            window.location.reload();
        }, 80);
    });
}

/**
 * 初始化离线同步调试面板。
 */
export function initOfflineSync($) {
    const modeToggle = $('signboardOfflineModeToggle');
    const modeText = $('signboardOfflineModeText');
    const sectionEl = $('signboardOfflineSection');
    const floatingSyncBtn = $('signboardSyncFloatingBtn');
    const syncBtn = $('signboardOfflineSyncNow');
    const legacySyncBtn = $('signboardOfflineSyncLegacy');
    const refreshBtn = $('signboardOfflineRefresh');
    const dumpBtn = $('signboardOfflineDump');
    const clearBtn = $('signboardOfflineClear');
    const statusEl = $('signboardOfflineStatus');
    const idsEl = $('signboardOfflineIds');
    const lastEl = $('signboardOfflineLast');
    let floatingButtonRestoreTimer = null;

    if (!modeToggle || !modeText || !sectionEl || !floatingSyncBtn || !syncBtn || !legacySyncBtn || !refreshBtn || !statusEl || !idsEl || !lastEl) return;

    /**
     * 更新 someCtrl 左侧的浮动同步按钮。
     * 只在离线模式下显示，数字始终反映当前服务器下的待同步数量。
     */
    function renderFloatingButton(stats, syncing = false) {
        if (floatingButtonRestoreTimer) {
            clearTimeout(floatingButtonRestoreTimer);
            floatingButtonRestoreTimer = null;
        }
        floatingSyncBtn.hidden = !isOfflineSaveModeEnabled();
        floatingSyncBtn.textContent = syncing ? 'Syncing...' : `Sync (${stats?.pending || 0})`;
        floatingSyncBtn.disabled = syncing;
    }

    /**
     * 同步成功后，按钮文本短暂显示 ok，随后恢复为默认计数。
     */
    function showFloatingButtonOk() {
        if (floatingButtonRestoreTimer) {
            clearTimeout(floatingButtonRestoreTimer);
        }
        floatingSyncBtn.hidden = false;
        floatingSyncBtn.textContent = 'ok';
        floatingSyncBtn.disabled = true;
        floatingButtonRestoreTimer = setTimeout(() => {
            floatingButtonRestoreTimer = null;
            render();
        }, 1500);
    }

    /**
     * 更新“离线模式”开关区。
     * 切换模式需要刷新页面，避免当前场景混用服务器态和本地离线态。
     */
    function renderModeBlock() {
        const enabled = isOfflineSaveModeEnabled();
        modeToggle.checked = enabled;
        sectionEl.hidden = !enabled;
        modeText.textContent = enabled
            ? 'Offline mode: saves go to local queue only. Use the top-left Sync button to submit to legacy server one-by-one.'
            : 'Online mode: saves are sent to server immediately. Offline queue and Sync button are hidden.';
    }

    /**
     * 执行旧版逐条同步；浮动按钮和 tab 按钮共用这条路径。
     */
    async function runLegacySync(showAlert = false) {
        const beforeStats = await getOfflineQueueStats();
        if (beforeStats.pending === 0) {
            await render('Queue is already empty.');
            if (showAlert) alert('No pending data to sync.');
            return null;
        }

        syncBtn.disabled = true;
        legacySyncBtn.disabled = true;
        renderFloatingButton(beforeStats, true);
        statusEl.textContent = 'Syncing to legacy server one-by-one...';

        try {
            const result = await syncOfflineBoardsLegacy();
            await render(result.success ? 'Legacy sync complete.' : 'Legacy sync complete with failures.');
            if (showAlert) {
                if (result.success) {
                    showFloatingButtonOk();
                } else {
                    alert(formatLegacySyncAlert(result));
                }
            }
            return result;
        } catch (error) {
            const message = getErrorMessage(error);
            await render(message);
            if (showAlert) alert(message);
            return null;
        }
    }

    /**
     * 统一刷新 UI；所有按钮操作、IndexedDB 事件都会走这里。
     */
    async function render(statusText = '') {
        try {
            const stats = await getOfflineQueueStats();
            const result = stats.lastSyncResult;

            renderModeBlock();
            renderFloatingButton(stats, false);
            statusEl.textContent = statusText || `Pending: ${stats.pending} | Last local update: ${formatTime(stats.latestUpdatedAt)}`;
            idsEl.textContent = `IDs: ${formatIdPreview(stats.ids)}`;
            lastEl.textContent = `Last sync: ${formatLastResult(result)}`;
            syncBtn.disabled = stats.pending === 0;
            legacySyncBtn.disabled = stats.pending === 0;
        } catch (error) {
            renderModeBlock();
            renderFloatingButton({ pending: 0 }, false);
            statusEl.textContent = `IndexedDB error: ${error.message}`;
            syncBtn.disabled = true;
            legacySyncBtn.disabled = true;
        }
    }

    /**
     * 用户手动切换在线/离线模式后，刷新页面重新应用完整数据流。
     */
    modeToggle.addEventListener('change', () => {
        const nextEnabled = modeToggle.checked;
        // 当前页不提前切换离线面板显隐，避免在即将 reload 前出现一次无意义跳动。
        modeToggle.checked = !nextEnabled;
        setOfflineSaveModeEnabled(nextEnabled, { silent: true });
        reloadWithProgressCursor();
    });

    /**
     * 刷新按钮只负责重新读取本地队列状态。
     * 这里先给一个瞬时提示，真正刷新完成后要回到默认统计文案，不能把“正在刷新”永久留在界面上。
     */
    refreshBtn.addEventListener('click', async () => {
        statusEl.textContent = 'Refreshing offline queue...';
        await render();
    });

    syncBtn.addEventListener('click', async () => {
        syncBtn.disabled = true;
        statusEl.textContent = 'Syncing offline boards...';

        try {
            const result = await syncOfflineBoards();
            await render(result.success ? 'Sync complete.' : 'Sync complete with failures.');
        } catch (error) {
            await render(getErrorMessage(error));
        }
    });

    legacySyncBtn.addEventListener('click', async () => {
        await runLegacySync(false);
    });

    floatingSyncBtn.addEventListener('click', async () => {
        await runLegacySync(true);
    });

    dumpBtn?.addEventListener('click', async () => {
        const boards = await getPendingOfflineBoards();
        console.log('[Signboard Offline] pending boards:', boards);
        await render(`Dumped ${boards.length} pending boards to console.`);
    });

    clearBtn?.addEventListener('click', async () => {
        const stats = await getOfflineQueueStats();
        if (stats.pending === 0) {
            await render('Queue is already empty.');
            return;
        }

        const ok = confirm(`Clear ${stats.pending} local offline drafts for current server? This only clears IndexedDB queue for current URL and will not delete server data.`);
        if (!ok) {
            await render('Clear canceled.');
            return;
        }

        await clearOfflineQueue();
        await render('Local offline queue cleared.');
    });

    window.addEventListener('signboard:offline-queue', () => render());
    window.addEventListener('signboard:save-mode', () => render());
    render();
}
