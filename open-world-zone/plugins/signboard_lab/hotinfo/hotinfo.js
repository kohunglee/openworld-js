/**
 * 热点信息模块入口
 * ========
 * 在 mode=1 时，在 pointObjIndex 下方显示画板热点信息
 */

import { getApiBase } from '../config.js';
import { signContentMap } from '../store.js';
import { styleCode } from './style.js';
import { htmlTemplate, unlockPointer, updateHotInfo, openContentModal, closeContentModal, findBoardIdByIndex } from './dom.js';

let lastHotIndex = -1;
let isExpanded = true;      // 左侧热点信息面板是否展开
let ccgxkObjRef = null;     // 缓存引擎实例，供事件回调复用
let boardsData = [];        // API 返回的画板元数据缓存
let activeModalState = null; // 当前内容模态框锁定的板子，避免 hover 漂移后编辑错目标

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
            titleText: '原图',
            imageUrl: info.imgUrl,
            allowEdit
        });
        return;
    }

    if (info.mode === 'text' && info.t) {
        openContentModal({
            type: 'text',
            titleText: '全文',
            text: info.t,
            allowEdit
        });
        return;
    }

    openContentModal({
        type: 'text',
        titleText: '内容',
        text: '当前画板还没有图片或正文内容。',
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
        }
    } catch (e) {
        console.error('[HotInfo] 加载画板数据失败:', e);
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

    // 切换展开状态
    toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        isExpanded = !isExpanded;
        toggleBtn.textContent = isExpanded ? '折叠' : '展开';
        container.style.display = isExpanded && isHotDetecting(ccgxkObjRef) ? 'block' : 'none';
        if (isExpanded && isHotDetecting(ccgxkObjRef)) {
            updateHotInfo(ccgxkObjRef.hotPoint, boardsData, isExpanded);
        }
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

    // SSE 更新时只修补当前这条缓存，避免每次保存后重新全量拉取。
    const originalUpdateSign = window.updateSign;
    window.updateSign = function(boardId, content, mode, extra) {
        if (originalUpdateSign) originalUpdateSign(boardId, content, mode, extra);
        // 只更新本地 boardsData 中对应 ID 的那条
        const idx = boardsData.findIndex(b => b.id === boardId);
        const newBoard = { id: boardId, content, mode, extra: extra || {} };
        if (idx >= 0) {
            boardsData[idx] = { ...boardsData[idx], ...newBoard };
        } else {
            boardsData.push(newBoard);
        }

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
