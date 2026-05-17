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
 * 生成逐条同步完成后的 alert 文案。
 */
function formatLegacySyncAlert(result) {
    if (!result) return '离线同步结束，但没有拿到结果。';
    if (result.total === 0) return '当前没有待同步数据。';
    if (result.success) return `离线同步完成：共 ${result.total} 条，全部成功。`;
    return `离线同步完成：总数 ${result.total}，成功 ${result.succeeded || 0}，失败 ${result.failed || 0}，剩余 ${result.remaining || 0}。`;
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
        floatingSyncBtn.textContent = syncing ? '同步中...' : `同步(${stats?.pending || 0})`;
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
            ? '当前为离线模式。保存只写入本地队列；点击左上角同步按钮逐条提交到旧版服务器。'
            : '当前为在线模式。保存会实时提交到服务器；离线队列与同步按钮会隐藏。';
    }

    /**
     * 执行旧版逐条同步；浮动按钮和 tab 按钮共用这条路径。
     */
    async function runLegacySync(showAlert = false) {
        const beforeStats = await getOfflineQueueStats();
        if (beforeStats.pending === 0) {
            await render('队列本来就是空的。');
            if (showAlert) alert('当前没有待同步数据。');
            return null;
        }

        syncBtn.disabled = true;
        legacySyncBtn.disabled = true;
        renderFloatingButton(beforeStats, true);
        statusEl.textContent = '正在逐条同步到旧版服务器...';

        try {
            const result = await syncOfflineBoardsLegacy();
            await render(result.success ? '旧版同步完成。' : '旧版同步完成，但存在失败项。');
            if (showAlert) {
                if (result.success) {
                    showFloatingButtonOk();
                } else {
                    alert(formatLegacySyncAlert(result));
                }
            }
            return result;
        } catch (error) {
            await render(`旧版同步失败：${error.message}`);
            if (showAlert) alert(`离线同步失败：${error.message}`);
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
            statusEl.textContent = statusText || `待同步：${stats.pending}｜最近本地修改：${formatTime(stats.latestUpdatedAt)}`;
            idsEl.textContent = `ID：${formatIdPreview(stats.ids)}`;
            lastEl.textContent = `上次同步：${formatLastResult(result)}`;
            syncBtn.disabled = stats.pending === 0;
            legacySyncBtn.disabled = stats.pending === 0;
        } catch (error) {
            renderModeBlock();
            renderFloatingButton({ pending: 0 }, false);
            statusEl.textContent = `IndexedDB 错误：${error.message}`;
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
        await runLegacySync(false);
    });

    floatingSyncBtn.addEventListener('click', async () => {
        await runLegacySync(true);
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

        const ok = confirm(`要清空当前服务器下的 ${stats.pending} 个本地离线画板草稿吗？这里只会清空当前 URL 对应的 IndexedDB 队列，不会删除服务器数据。`);
        if (!ok) {
            await render('已取消清空。');
            return;
        }

        await clearOfflineQueue();
        await render('本地离线队列已清空。');
    });

    window.addEventListener('signboard:offline-queue', () => render());
    window.addEventListener('signboard:save-mode', () => render());
    render();
}
