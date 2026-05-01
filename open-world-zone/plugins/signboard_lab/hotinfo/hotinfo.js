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
let isExpanded = true;
let ccgxkObjRef = null;
let boardsData = [];

function getCurrentHotText() {
    if (!ccgxkObjRef) return '';
    const boardId = findBoardIdByIndex(ccgxkObjRef.hotPoint);
    if (!boardId) return '';
    const info = signContentMap.get(boardId);
    return info?.mode === 'text' ? (info.t || '') : '';
}

// 加载画板数据
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

    // 打开全文
    const copyTextDiv = document.getElementById('signHotInfoCopyText');
    copyTextDiv.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const text = getCurrentHotText();
        if (text) {
            openTextModal(text);
        }
    });

    // 全文模态框关闭
    const textModal = document.getElementById('signHotInfoTextModal');
    const textModalBackdrop = document.getElementById('signHotInfoTextModalBackdrop');
    const textModalCloseBtn = document.getElementById('signHotInfoTextModalClose');

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

    // 定期检查热点变化
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

    // 热点事件
    ccgxkObj.hooks.on('hot_action', function(ccgxkObj) {
        if (ccgxkObj.mode !== 1) return 0;
        unlockPointer();
    });

    // SSE 更新时只更新本地缓存的那一条（不再全量加载！）
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

        if (textModal.style.display === 'flex' && mode === 'text') {
            openTextModal(content || '');
        }
    };
}
