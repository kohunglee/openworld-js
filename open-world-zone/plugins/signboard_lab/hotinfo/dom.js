/**
 * 热点信息 DOM 模板与操作
 */

import { signContentMap, signIndexMap, lazyLoadSign } from '../store.js';

// HTML 模板
export const htmlTemplate = `
<button id="signHotInfoToggle" style="display: none;">折叠</button>
<div id="signHotInfo" class="sign-hot-info" style="display: none;">
    <div class="sign-hot-info-body" id="signHotInfoBody">
        <div class="sign-hot-info-row">
            <span class="sign-hot-info-label"></span>
            <span class="sign-hot-info-value" id="signHotInfoId">-</span>
        </div>
        <div class="sign-hot-info-row">
            <span class="sign-hot-info-label"></span>
            <span class="sign-hot-info-value" id="signHotInfoDate">-</span>
        </div>
        <div class="sign-hot-info-view-original" id="signHotInfoViewOriginal" style="display: none;">
            <a>[查看原图]</a>
        </div>
        <div class="sign-hot-info-view-original" id="signHotInfoCopyText" style="display: none;">
            <a>[打开全文]</a>
        </div>
        <div class="sign-hot-info-remark" id="signHotInfoRemark" style="display: none;"></div>
    </div>
</div>
<div id="signHotInfoContentModal" style="display: none;">
    <div class="sign-hot-info-content-modal-backdrop" id="signHotInfoContentModalBackdrop"></div>
    <div class="sign-hot-info-content-modal-panel" role="dialog" aria-modal="true" aria-label="内容预览">
        <div class="sign-hot-info-content-modal-header">
            <span id="signHotInfoContentModalTitle">内容</span>
            <div class="sign-hot-info-text-modal-actions">
                <button type="button" id="signHotInfoContentModalEdit" style="display: none;">编辑</button>
                <button type="button" id="signHotInfoContentModalClose">关闭</button>
            </div>
        </div>
        <div class="sign-hot-info-content-modal-body">
            <pre id="signHotInfoContentModalText"></pre>
            <div class="sign-hot-info-content-modal-image-wrap" id="signHotInfoContentModalImageWrap" hidden>
                <img id="signHotInfoContentModalImage" src="" alt="原图预览" />
            </div>
        </div>
    </div>
</div>
`;

const LINK_PATTERN = /(?:https?:\/\/)?(?:www\.)?(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?::\d+)?(?:\/[^\s<]*)?/g;

function normalizeLinkUrl(rawUrl) {
    if (!rawUrl) return '';
    return /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
}

function renderTextWithLinks(container, text) {
    container.replaceChildren();

    const sourceText = text || '';
    let lastIndex = 0;

    sourceText.replace(LINK_PATTERN, (match, offset) => {
        if (offset > lastIndex) {
            container.appendChild(document.createTextNode(sourceText.slice(lastIndex, offset)));
        }

        const link = document.createElement('a');
        link.href = normalizeLinkUrl(match);
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = match;
        container.appendChild(link);

        lastIndex = offset + match.length;
        return match;
    });

    if (lastIndex < sourceText.length) {
        container.appendChild(document.createTextNode(sourceText.slice(lastIndex)));
    }
}

// 解锁鼠标指针
export function unlockPointer() {
    const exitLock = document.exitPointerLock ||
        document.mozExitPointerLock ||
        document.webkitExitPointerLock;
    if (exitLock) exitLock.call(document);
}

// 根据 index 查找画板 ID
export function findBoardIdByIndex(hotIndex) {
    for (const [id, data] of signIndexMap.entries()) {
        if (data.index === hotIndex) return id;
    }
    return null;
}

// 更新热点信息显示
export function updateHotInfo(hotIndex, boardsData, isExpanded) {
    const container = document.getElementById('signHotInfo');
    const idSpan = document.getElementById('signHotInfoId');
    const dateSpan = document.getElementById('signHotInfoDate');
    const remarkDiv = document.getElementById('signHotInfoRemark');
    const viewOriginalDiv = document.getElementById('signHotInfoViewOriginal');

    if (hotIndex < 0) {
        container.style.display = 'none';
        return;
    }

    const boardId = findBoardIdByIndex(hotIndex);
    if (!boardId) {
        container.style.display = 'none';
        return;
    }

    const info = signContentMap.get(boardId);
    if (!info) {
        lazyLoadSign(boardId);
        container.style.display = 'none';
        return;
    }

    container.style.display = isExpanded ? 'block' : 'none';
    idSpan.textContent = boardId;

    // 更新日期
    const boardData = boardsData.find(b => b.id === boardId);
    if (boardData && boardData.updated_at) {
        const date = new Date(boardData.updated_at);
        dateSpan.textContent = date.toLocaleString('zh-CN', {
            year: 'numeric', month: 'numeric', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    } else {
        dateSpan.textContent = '-';
    }

    // 图片/文本模式
    const copyTextDiv = document.getElementById('signHotInfoCopyText');
    if (info.mode === 'image' && info.imgUrl) {
        viewOriginalDiv.style.display = 'block';
        copyTextDiv.style.display = 'none';
        viewOriginalDiv.dataset.imgUrl = info.imgUrl;
    } else if (info.mode === 'text' && info.t) {
        viewOriginalDiv.style.display = 'none';
        copyTextDiv.style.display = 'block';
        copyTextDiv.dataset.text = info.t;
    } else {
        viewOriginalDiv.style.display = 'none';
        copyTextDiv.style.display = 'none';
        viewOriginalDiv.dataset.imgUrl = '';
    }

    // 更新备注
    let extra = info.extra || {};
    if (typeof extra === 'string') extra = JSON.parse(extra);
    const remark = extra.remark;
    if (remark) {
        const isHtml = /^\s*</.test(remark) && remark.includes('>');
        if (isHtml) remarkDiv.innerHTML = remark;
        else remarkDiv.textContent = remark;
        remarkDiv.style.display = 'block';
    } else {
        remarkDiv.style.display = 'none';
    }
}

/**
 * 打开统一内容模态框，可承载文本或图片。
 * @param {Object} options - 模态框展示选项
 */
export function openContentModal(options = {}) {
    const modal = document.getElementById('signHotInfoContentModal');
    const title = document.getElementById('signHotInfoContentModalTitle');
    const textEl = document.getElementById('signHotInfoContentModalText');
    const imageWrap = document.getElementById('signHotInfoContentModalImageWrap');
    const imageEl = document.getElementById('signHotInfoContentModalImage');
    const editBtn = document.getElementById('signHotInfoContentModalEdit');
    if (!modal || !title || !textEl || !imageWrap || !imageEl) return;

    const {
        type = 'text',
        titleText = '内容',
        text = '',
        imageUrl = '',
        allowEdit = false
    } = options;

    title.textContent = titleText;
    textEl.hidden = type !== 'text';
    imageWrap.hidden = type !== 'image';

    if (type === 'text') {
        renderTextWithLinks(textEl, text);
        imageEl.src = '';
    } else {
        textEl.replaceChildren();
        imageEl.src = imageUrl || '';
    }

    if (editBtn) editBtn.style.display = allowEdit ? '' : 'none';
    modal.style.display = 'flex';
}

/**
 * 关闭统一内容模态框，并清理上一次的展示内容。
 */
export function closeContentModal() {
    const modal = document.getElementById('signHotInfoContentModal');
    const title = document.getElementById('signHotInfoContentModalTitle');
    const textEl = document.getElementById('signHotInfoContentModalText');
    const imageWrap = document.getElementById('signHotInfoContentModalImageWrap');
    const imageEl = document.getElementById('signHotInfoContentModalImage');
    const editBtn = document.getElementById('signHotInfoContentModalEdit');
    if (!modal || !title || !textEl || !imageWrap || !imageEl) return;

    modal.style.display = 'none';
    title.textContent = '内容';
    if (editBtn) editBtn.style.display = 'none';
    textEl.hidden = false;
    textEl.replaceChildren();
    imageWrap.hidden = true;
    imageEl.src = '';
}
