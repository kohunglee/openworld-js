/**
 * 热点信息模块入口
 * ========
 * 在 mode=1 时，在 pointObjIndex 下方显示画板热点信息
 */

import { getApiBase } from '../config.js';
import { signContentMap } from '../store.js';
import { styleCode } from './style.js';
import { htmlTemplate, unlockPointer, updateHotInfo, openTextModal, closeTextModal, findBoardIdByIndex } from './dom.js';

let lastHotIndex = -1;
let isExpanded = true;      // 左侧热点信息面板是否展开
let ccgxkObjRef = null;     // 缓存引擎实例，供事件回调复用
let boardsData = [];        // API 返回的画板元数据缓存

/**
 * 只有在 mode=1 且 signPanel 已初始化时，全文模态框才显示“编辑”按钮。
 */
function canEditCurrentHot() {
    return ccgxkObjRef?.mode === 1 && !!ccgxkObjRef?.signPanel && ccgxkObjRef.hotPoint >= 0;
}

/**
 * 读取当前热点对应的纯文本内容，供“打开全文”模态框复用。
 */
function getCurrentHotText() {
    if (!ccgxkObjRef) return '';
    const boardId = findBoardIdByIndex(ccgxkObjRef.hotPoint);
    if (!boardId) return '';
    const info = signContentMap.get(boardId);
    return info?.mode === 'text' ? (info.t || '') : '';
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
        container.style.display = isExpanded ? 'block' : 'none';
        if (isExpanded && ccgxkObjRef) {
            updateHotInfo(ccgxkObjRef.hotPoint, boardsData, isExpanded);
        }
    });

    // 查看原图
    const viewOriginalDiv = document.getElementById('signHotInfoViewOriginal');
    const overlay = document.getElementById('signHotInfoOverlay');
    const overlayImg = document.getElementById('signHotInfoOverlayImg');

    viewOriginalDiv.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const imgUrl = viewOriginalDiv.dataset.imgUrl;
        if (imgUrl) {
            overlayImg.src = imgUrl;
            overlay.style.display = 'flex';
        }
    });

    // 打开全文。这里不直接读 dataset.text，而是每次按当前热点重新取值，避免内容过期。
    const copyTextDiv = document.getElementById('signHotInfoCopyText');
    copyTextDiv.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const text = getCurrentHotText();
        if (text) {
            openTextModal(text, { allowEdit: canEditCurrentHot() });
        }
    });

    // 全文模态框关闭 / 编辑动作
    const textModal = document.getElementById('signHotInfoTextModal');
    const textModalBackdrop = document.getElementById('signHotInfoTextModalBackdrop');
    const textModalCloseBtn = document.getElementById('signHotInfoTextModalClose');
    const textModalEditBtn = document.getElementById('signHotInfoTextModalEdit');

    textModalBackdrop.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeTextModal();
    });

    textModalCloseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeTextModal();
    });

    textModalEditBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!canEditCurrentHot()) return;
        const hotIndex = ccgxkObjRef.hotPoint;  // 保持全文模态框不关，只额外拉起编辑器
        ccgxkObjRef.signPanel.show(hotIndex);
    });

    textModal.addEventListener('click', (e) => {
        if (e.target === textModal) {
            closeTextModal();
        }
    });

    // 关闭全屏图片
    overlayImg.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        overlay.style.display = 'none';
        overlayImg.src = '';
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.style.display = 'none';
            overlayImg.src = '';
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.style.display === 'flex') {
            overlay.style.display = 'none';
            overlayImg.src = '';
            return;
        }

        if (e.key === 'Escape' && textModal.style.display === 'flex') {
            closeTextModal();
        }
    });

    // 初始加载数据
    loadBoardsData();

    // 轮询热点变化。这里依赖 hotPoint 持续变化，因此 signPanel 关闭时必须恢复 drawPointPause。
    setInterval(() => {
        if (ccgxkObj.mode === 0) {
            toggleBtn.style.display = 'none';
            container.style.display = 'none';
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
        if (currentBoardId !== boardId) return;

        if (isExpanded) {
            updateHotInfo(ccgxkObjRef.hotPoint, boardsData, isExpanded);
        }

        // 全文模态框开着时，保存后的新文本要立即反映到模态框里。
        if (textModal.style.display === 'flex' && mode === 'text') {
            openTextModal(content || '', { allowEdit: canEditCurrentHot() });
        }
    };
}
