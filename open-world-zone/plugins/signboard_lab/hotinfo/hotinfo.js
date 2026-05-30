/**
 * 热点信息模块入口
 * ========
 * 在 mode=1 时，在 pointObjIndex 下方显示画板热点信息
 */

import { getApiBase } from '../config.js';
import { reportSignboardServerStatus, signContentMap } from '../store.js';
import { styleCode } from './style.js';
import {
    htmlTemplate,
    unlockPointer,
    updateHotInfo,
    openContentModal,
    closeContentModal,
    findBoardIdByIndex,
    LINK_PATTERN,
    normalizeLinkUrl,
    isHtmlRemarkText,
    normalizeRemarkHtml
} from './dom.js';
import { REMARK_FALLBACK_CHANGE_EVENT } from './remarkFallbackPreference.js';

let lastHotIndex = -1;
let isExpanded = true;      // 左侧热点信息面板是否展开
let ccgxkObjRef = null;     // 缓存引擎实例，供事件回调复用
let boardsData = [];        // API 返回的画板元数据缓存
let activeModalState = null; // 当前内容模态框锁定的板子，避免 hover 漂移后编辑错目标
let refreshStatusTimer = null; // 更新按钮的短状态提示计时器

const FROZEN_TEXT_PRE_STYLE = 'white-space:pre-wrap;word-break:break-word;';
const FROZEN_PAGE_WIDTH = 'min(860px, calc(100vw - 48px))';

/**
 * 指定热点在 mode=1 下是否允许调起编辑器。
 */
function canEditHot(hotIndex) {
    return ccgxkObjRef?.mode === 1 && !!ccgxkObjRef?.signPanel && hotIndex >= 0;
}

/**
 * 判断当前是否真的处于中心点探测态，避免关闭探测后残留热点信息框。
 */
function isHotDetecting(ccgxkObj) {
    return ccgxkObj?.mode !== 0 && ccgxkObj?.centerDot?.status === 1;
}

/**
 * 读取当前热点的完整信息，供统一内容模态框与编辑入口复用。
 */
function getCurrentHotPayload() {
    if (!ccgxkObjRef) return null;
    const hotIndex = ccgxkObjRef.hotPoint;
    const boardId = findBoardIdByIndex(hotIndex);
    if (!boardId) return null;
    const info = signContentMap.get(boardId);
    if (!info) return null;
    return { hotIndex, boardId, info };
}

/**
 * 兼容数据库里 extra 可能是字符串的历史数据，统一成普通对象。
 */
function normalizeExtra(extra = {}) {
    if (typeof extra !== 'string') return extra || {};
    try {
        return JSON.parse(extra) || {};
    } catch {
        return {};
    }
}

/**
 * 转义冻结页里的普通文本，避免正文内容被浏览器误当成标签解析。
 */
function escapeFrozenHtml(value = '') {
    return String(value).replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));
}

/**
 * 补齐裸域名链接协议，保持和模态框里的链接识别体验一致。
 */
function linkifyFrozenPlainText(text = '') {
    const sourceText = String(text || '');
    const htmlParts = [];
    let lastIndex = 0;

    LINK_PATTERN.lastIndex = 0;
    sourceText.replace(LINK_PATTERN, (match, offset) => {
        if (offset > lastIndex) {
            htmlParts.push(escapeFrozenHtml(sourceText.slice(lastIndex, offset)));
        }

        const href = escapeFrozenHtml(normalizeLinkUrl(match));
        const label = escapeFrozenHtml(match);
        htmlParts.push(`<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`);
        lastIndex = offset + match.length;
        return match;
    });

    if (lastIndex < sourceText.length) {
        htmlParts.push(escapeFrozenHtml(sourceText.slice(lastIndex)));
    }

    return htmlParts.join('');
}

/**
 * 用正文第一行做临时标签页标题；没有第一行时给浏览器一个很短的兜底标题。
 */
function getFrozenPageTitle(text = '') {
    const firstLine = (String(text || '').split(/\r?\n/)[0] || '').trim() || 'Text';
    return firstLine.length > 20 ? `${firstLine.slice(0, 20)}...` : firstLine;
}

/**
 * Mark 备注如果是 HTML，就保留 HTML 结构；只移除 script，并给已有链接补上新标签页打开属性。
 */
function prepareFrozenRemarkHtml(remark = '') {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = normalizeRemarkHtml(remark, { shortenDisplay: false });
    wrapper.querySelectorAll('script').forEach((node) => node.remove());
    wrapper.querySelectorAll('a').forEach((link) => {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
    });
    return wrapper.innerHTML;
}

/**
 * 统一生成冻结页里使用的简洁区块，正文和备注通过不同底色避免视觉混淆。
 */
function buildFrozenSectionHtml(label, bodyHtml, background) {
    return [
        `<section style="margin:0 0 18px;padding:16px 18px;background:${background};">`,
        `<div style="margin:0 0 10px;font:600 13px/1.2 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#475569;">${label}</div>`,
        bodyHtml,
        '</section>'
    ].join('');
}

/**
 * 生成冻结页中的 Mark 区块；无备注时直接返回空字符串，避免插入无意义占位。
 */
function buildFrozenRemarkSectionHtml(remark = '') {
    const safeRemark = String(remark || '');
    if (!safeRemark.trim()) return '';

    const remarkIsHtml = isHtmlRemarkText(safeRemark);
    const remarkHtml = remarkIsHtml
        ? prepareFrozenRemarkHtml(safeRemark)
        : `<pre style="margin:0;${FROZEN_TEXT_PRE_STYLE}">${linkifyFrozenPlainText(safeRemark)}</pre>`;

    return buildFrozenSectionHtml('Mark', remarkHtml, '#f8fafc');
}

/**
 * 组装冻结页的最小 HTML 骨架：主体居中，宽度收敛，正文和备注只保留必要的样式。
 */
function buildFrozenPageHtml({ title, mainSectionHtml = '', remarkSectionHtml = '' }) {
    return [
        '<!doctype html><html><head><meta charset="utf-8">',
        `<title>${escapeFrozenHtml(title)}</title>`,
        '</head><body style="margin:0;background:#f3f4f6;color:#111827;">',
        `<main style="box-sizing:border-box;width:${FROZEN_PAGE_WIDTH};margin:28px auto 40px;padding:0 4px;">`,
        mainSectionHtml,
        remarkSectionHtml,
        '</main></body></html>'
    ].join('');
}

/**
 * 生成文本冻结页 HTML：正文与备注分区展示，链接保留可点击。
 */
function buildFrozenTextPageHtml(info) {
    const text = info?.t || '';
    const extra = normalizeExtra(info?.extra);
    const mainSectionHtml = buildFrozenSectionHtml(
        'Content',
        `<pre style="margin:0;${FROZEN_TEXT_PRE_STYLE}">${linkifyFrozenPlainText(text)}</pre>`,
        '#fff7ed'
    );
    const remarkSectionHtml = buildFrozenRemarkSectionHtml(extra.remark);

    return buildFrozenPageHtml({
        title: getFrozenPageTitle(text),
        mainSectionHtml,
        remarkSectionHtml
    });
}

/**
 * 生成图片冻结页 HTML：图片居中显示，必要时在下方补一个 Mark 区块。
 */
function buildFrozenImagePageHtml(info) {
    const imageUrl = info?.imgUrl || '';
    const extra = normalizeExtra(info?.extra);
    const mainSectionHtml = buildFrozenSectionHtml(
        'Content',
        `<div style="display:flex;justify-content:center;"><img src="${escapeFrozenHtml(imageUrl)}" alt="" style="display:block;max-width:100%;max-height:78vh;height:auto;object-fit:contain;" /></div>`,
        '#fff7ed'
    );
    const remarkSectionHtml = buildFrozenRemarkSectionHtml(extra.remark);

    return buildFrozenPageHtml({
        title: 'Image',
        mainSectionHtml,
        remarkSectionHtml
    });
}

/**
 * 基于指定画板信息直接打开冻结页。
 * 左上角的 [POP] 和模态框里的 POP 共用这条路径，保证两边内容一致。
 */
function openFrozenPageForPayload(payload) {
    if (!payload?.info) return;
    const info = payload.info;

    const html = info.mode === 'image' && info.imgUrl
        ? buildFrozenImagePageHtml(info)
        : buildFrozenTextPageHtml(info);
    const blobUrl = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    window.open(blobUrl, '_blank', 'noopener,noreferrer');

    // 新标签页完成加载后即可释放主页面里的 blob 引用；已打开的冻结页内容不会被清空。
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
}

/**
 * 基于当前模态框锁定的板子打开 blob 临时页，实现“冻结当前内容”的独立阅读窗口。
 */
function openFrozenPageForActiveModal() {
    if (!activeModalState) return;
    const info = signContentMap.get(activeModalState.boardId);
    if (!info) return;
    openFrozenPageForPayload({
        hotIndex: activeModalState.hotIndex,
        boardId: activeModalState.boardId,
        info
    });
}

/**
 * 判断服务端返回的画板内容是否和本地缓存不同。
 */
function hasBoardContentChanged(board) {
    const cur = signContentMap.get(board.id);
    const extra = normalizeExtra(board.extra);
    if (!cur) return true;
    return cur.mode !== board.mode
        || (board.mode === 'text' && cur.t !== board.content)
        || (board.mode === 'image' && cur.imgUrl !== board.content)
        || JSON.stringify(normalizeExtra(cur.extra)) !== JSON.stringify(extra);
}

/**
 * 修补 HotInfo 使用的轻量元数据缓存。
 */
function upsertBoardMeta(board) {
    const normalizedBoard = { ...board, extra: normalizeExtra(board.extra) };
    const idx = boardsData.findIndex(b => b.id === normalizedBoard.id);
    if (idx >= 0) {
        boardsData[idx] = { ...boardsData[idx], ...normalizedBoard };
    } else {
        boardsData.push(normalizedBoard);
    }
}

function setRefreshStatus(text, sticky = false) {
    const statusEl = document.getElementById('signHotInfoRefreshStatus');
    if (!statusEl) return;
    statusEl.textContent = text || '';
    if (refreshStatusTimer) clearTimeout(refreshStatusTimer);
    if (text && !sticky) {
        refreshStatusTimer = setTimeout(() => {
            statusEl.textContent = '';
            refreshStatusTimer = null;
        }, 1600);
    }
}

/**
 * 只刷新当前热点对应的画板；未来可见画板低频刷新也可以复用同一批量接口。
 */
async function refreshCurrentBoard() {
    if (!ccgxkObjRef) return;
    const hotIndex = ccgxkObjRef.hotPoint;
    const boardId = findBoardIdByIndex(hotIndex);
    const refreshBtn = document.getElementById('signHotInfoRefresh');

    if (!boardId) {
        setRefreshStatus('No ID');
        return;
    }

    if (refreshBtn) refreshBtn.setAttribute('aria-disabled', 'true');
    setRefreshStatus('Sync...', true);

    try {
        const res = await fetch(`${getApiBase()}/api/signs/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: [boardId] })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        reportSignboardServerStatus('online');

        const data = await res.json();
        const board = data.boards?.[0];
        if (!board) {
            if (hasBoardContentChanged({ id: boardId, mode: 'empty', content: '', extra: {} })) {
                window.updateSign?.(boardId, '', 'empty', {});
            }
            setRefreshStatus('No Data');
            return;
        }

        const normalizedBoard = { ...board, extra: normalizeExtra(board.extra) };
        const changed = hasBoardContentChanged(normalizedBoard);
        upsertBoardMeta(normalizedBoard);

        if (changed) {
            window.updateSign?.(normalizedBoard.id, normalizedBoard.content, normalizedBoard.mode, normalizedBoard.extra);
            setRefreshStatus('Synced');
        } else {
            updateHotInfo(hotIndex, boardsData, isExpanded);  // 内容没变也刷新日期等元信息
            setRefreshStatus('No Diff');
        }
    } catch (e) {
        console.error('[HotInfo] 刷新当前画板失败:', e);
        reportSignboardServerStatus('offline', { message: e.message });
        setRefreshStatus('Failed');
    } finally {
        if (refreshBtn) refreshBtn.removeAttribute('aria-disabled');
    }
}

/**
 * 将指定画板内容渲染进统一模态框，并锁定当前查看目标。
 */
function openContentModalForBoard(payload) {
    if (!payload) return;
    const { hotIndex, boardId, info } = payload;
    const allowEdit = canEditHot(hotIndex);

    activeModalState = { hotIndex, boardId };

    if (info.mode === 'image' && info.imgUrl) {
        openContentModal({
            type: 'image',
            titleText: 'Image',
            imageUrl: info.imgUrl,
            allowEdit,
            allowOpen: true
        });
        return;
    }

    if (info.mode === 'text' && info.t) {
        openContentModal({
            type: 'text',
            titleText: 'Text',
            text: info.t,
            allowEdit,
            allowOpen: true
        });
        return;
    }

    openContentModal({
        type: 'text',
        titleText: 'Info',
        // 空内容保持空白展示，避免给用户造成“系统写入了默认文案”的误解。
        text: '',
        allowEdit
    });
}

/**
 * 关闭统一内容模态框，并清掉当前锁定的板子上下文。
 */
function closeActiveContentModal() {
    activeModalState = null;
    closeContentModal();
}

function openEditorForCurrentHot() {
    const payload = getCurrentHotPayload();
    if (!payload || !canEditHot(payload.hotIndex)) return;
    ccgxkObjRef.signPanel.show(payload.hotIndex);  // 左上角入口也直接复用原编辑器
}

/**
 * 拉取画板基础数据；这里只维护热点侧栏要用到的轻量元信息。
 */
async function loadBoardsData() {
    try {
        const res = await fetch(`${getApiBase()}/api/signs`);
        if (res.ok) {
            const data = await res.json();
            boardsData = data.boards || [];
            reportSignboardServerStatus('online');
        }
    } catch (e) {
        reportSignboardServerStatus('offline', { message: e.message });
    }
}

/**
 * 初始化热点信息模块
 */
export function initHotInfo(ccgxkObj) {
    ccgxkObjRef = ccgxkObj;

    // 注入样式
    const styleEl = document.createElement('style');
    styleEl.textContent = styleCode;
    document.head.appendChild(styleEl);

    // 注入 HTML
    const template = document.createElement('template');
    template.innerHTML = htmlTemplate;
    document.body.appendChild(template.content.cloneNode(true));

    const toggleBtn = document.getElementById('signHotInfoToggle');
    const container = document.getElementById('signHotInfo');
    const refreshBtn = document.getElementById('signHotInfoRefresh');

    // 切换展开状态
    toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        isExpanded = !isExpanded;
        toggleBtn.textContent = isExpanded ? 'Hide' : 'Show';
        container.style.display = isExpanded && isHotDetecting(ccgxkObjRef) ? 'block' : 'none';
        if (isExpanded && isHotDetecting(ccgxkObjRef)) {
            updateHotInfo(ccgxkObjRef.hotPoint, boardsData, isExpanded);
        }
    });

    refreshBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (refreshBtn.getAttribute('aria-disabled') === 'true') return;
        refreshCurrentBoard();
    });

    // 图片与文字都走统一内容模态框，只是渲染类型不同。
    const viewOriginalDiv = document.getElementById('signHotInfoViewOriginal');

    viewOriginalDiv.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openContentModalForBoard(getCurrentHotPayload());
    });

    // 打开全文。这里每次按当前热点重新取值，避免内容过期。
    const copyTextDiv = document.getElementById('signHotInfoCopyText');
    copyTextDiv.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openContentModalForBoard(getCurrentHotPayload());
    });

    const viewEmptyDiv = document.getElementById('signHotInfoViewEmpty');
    viewEmptyDiv.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openContentModalForBoard(getCurrentHotPayload());
    });

    /**
     * 左上角信息栏里的 [POP] 直接打开冻结页。
     * 这里单独拦截点击，避免冒泡到父容器后又顺手把 View 模态框打开。
     */
    const popImageBtn = document.getElementById('signHotInfoPopImage');
    const popTextBtn = document.getElementById('signHotInfoPopText');
    const popEmptyBtn = document.getElementById('signHotInfoPopEmpty');
    [popImageBtn, popTextBtn, popEmptyBtn].forEach((btn) => {
        btn?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openFrozenPageForPayload(getCurrentHotPayload());
        });
    });

    const editImageBtn = document.getElementById('signHotInfoEditImage');
    const editTextBtn = document.getElementById('signHotInfoEditText');
    const editEmptyBtn = document.getElementById('signHotInfoEditEmpty');
    [editImageBtn, editTextBtn, editEmptyBtn].forEach((btn) => {
        btn?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openEditorForCurrentHot();
        });
    });

    // 统一内容模态框关闭 / 编辑动作
    const contentModal = document.getElementById('signHotInfoContentModal');
    const contentModalBackdrop = document.getElementById('signHotInfoContentModalBackdrop');
    const contentModalCloseBtn = document.getElementById('signHotInfoContentModalClose');
    const contentModalEditBtn = document.getElementById('signHotInfoContentModalEdit');
    const contentModalOpenBtn = document.getElementById('signHotInfoContentModalOpen');

    contentModalBackdrop.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeActiveContentModal();
    });

    contentModalCloseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeActiveContentModal();
    });

    contentModalEditBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!activeModalState || !canEditHot(activeModalState.hotIndex)) return;
        ccgxkObjRef.signPanel.show(activeModalState.hotIndex);  // 以模态框锁定的那块板子为准
    });

    contentModalOpenBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openFrozenPageForActiveModal();
    });

    contentModal.addEventListener('click', (e) => {
        if (e.target === contentModal) {
            closeActiveContentModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && contentModal.style.display === 'flex') {
            closeActiveContentModal();
        }
    });

    /**
     * Tab 面板切换“备注为空时显示正文”后，当前热点信息要立即重绘。
     * 这样用户不需要再把准星移开又移回来一次。
     */
    window.addEventListener(REMARK_FALLBACK_CHANGE_EVENT, () => {
        if (!ccgxkObjRef || !isExpanded || !isHotDetecting(ccgxkObjRef)) return;
        updateHotInfo(ccgxkObjRef.hotPoint, boardsData, isExpanded);
    });

    // 初始加载数据
    loadBoardsData();

    // 轮询热点变化。这里依赖 hotPoint 持续变化，因此 signPanel 关闭时必须恢复 drawPointPause。
    setInterval(() => {
        if (!isHotDetecting(ccgxkObj)) {
            toggleBtn.style.display = 'none';
            container.style.display = 'none';
            lastHotIndex = -1;
            return;
        }
        toggleBtn.style.display = 'block';
        const hotIndex = ccgxkObj.hotPoint;
        if (hotIndex !== lastHotIndex) {
            lastHotIndex = hotIndex;
            if (isExpanded) updateHotInfo(hotIndex, boardsData, isExpanded);
        }
    }, 100);

    // mode=1 下点击热点只需要解锁鼠标，不直接弹编辑器。
    ccgxkObj.hooks.on('hot_action', function(ccgxkObj) {
        if (ccgxkObj.mode !== 1) return 0;
        unlockPointer();
    });

    // 关闭中心点探测时立即收起，避免等下一次轮询才消失。
    ccgxkObj.hooks.on('close_point', function() {
        toggleBtn.style.display = 'none';
        container.style.display = 'none';
        lastHotIndex = -1;
    });

    // updateSign 触发时只修补当前这条缓存，避免每次保存后重新全量拉取。
    const originalUpdateSign = window.updateSign;
    window.updateSign = function(boardId, content, mode, extra) {
        if (originalUpdateSign) originalUpdateSign(boardId, content, mode, extra);
        upsertBoardMeta({ id: boardId, content, mode, extra: extra || {} }); // 只更新本地 boardsData 中对应 ID 的那条

        if (!ccgxkObjRef) return;

        const currentBoardId = findBoardIdByIndex(ccgxkObjRef.hotPoint);
        if (currentBoardId === boardId && isExpanded && isHotDetecting(ccgxkObjRef)) {
            updateHotInfo(ccgxkObjRef.hotPoint, boardsData, isExpanded);
        }

        // 只要当前模态框锁定的就是这块板子，就立即刷新预览；文字/图片切换也能同步切过去。
        if (contentModal.style.display === 'flex' && activeModalState?.boardId === boardId) {
            openContentModalForBoard({
                hotIndex: activeModalState.hotIndex,
                boardId,
                info: mode === 'image'
                    ? { mode, imgUrl: content || '', extra: extra || {} }
                    : { mode, t: content || '', extra: extra || {} }
            });
        }
    };
}
