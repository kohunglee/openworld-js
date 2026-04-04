/**
 * DOM 操作模块
 * ========
 * 初始化 HTML、事件绑定、拖拽功能
 */

import { styleCode } from './style.js';

// HTML 模板
const htmlTemplate = `
<div id="signPanelBackdrop" class="sign-panel-backdrop" hidden></div>
<div id="signPanelModal" class="sign-panel-modal" hidden>
    <div class="sign-panel-box" id="signPanelBox">
        <div class="sign-panel-header" id="signPanelHeader">
            <span>
                <span class="sign-panel-title">信息板编辑</span>
                <span class="sign-panel-title-id" id="signPanelBoardId"></span>
            </span>
            <button class="sign-panel-close" id="signPanelClose">&times;</button>
        </div>
        <div class="sign-mode-bar">
            <button class="sign-mode-btn active" id="signModeText" data-mode="text">文字</button>
            <button class="sign-mode-btn" id="signModeImage" data-mode="image">图片</button>
        </div>
        <div class="sign-panel-content">
            <textarea class="sign-panel-textarea" id="signPanelTextarea"
                placeholder="输入画板文字内容..."></textarea>
            <div class="sign-image-area" id="signImageArea" style="display:none">
                <input type="text" class="sign-image-input" id="signImageUrl"
                    placeholder="输入图片 URL...">
                <div class="sign-image-preview" id="signImagePreview">
                    <span class="placeholder">图片预览</span>
                </div>
            </div>
        </div>
        <div class="sign-panel-footer">
            <span class="sign-panel-status" id="signPanelStatus"></span>
            <div>
                <button class="sign-save-btn" id="signPanelSave">保存</button>
                <span class="sign-save-hint">Ctrl/Cmd+S</span>
            </div>
        </div>
    </div>
</div>
`;

/**
 * 初始化 DOM
 */
export function initDOM() {
    if (document.getElementById('signPanelModal')) return;

    // 注入样式
    const styleEl = document.createElement('style');
    styleEl.textContent = styleCode;
    document.head.appendChild(styleEl);

    // 注入 HTML
    const template = document.createElement('template');
    template.innerHTML = htmlTemplate;
    document.body.appendChild(template.content.cloneNode(true));
}

/**
 * 绑定事件
 * @param {Object} handlers - 事件处理器
 */
export function bindEvents(handlers) {
    const { onClose, onSave, onSwitchMode, onImageInput } = handlers;

    document.getElementById('signPanelClose')?.addEventListener('click', onClose);
    document.getElementById('signPanelBackdrop')?.addEventListener('click', onClose);
    document.getElementById('signPanelSave')?.addEventListener('click', onSave);

    document.getElementById('signModeText')?.addEventListener('click', () => onSwitchMode('text'));
    document.getElementById('signModeImage')?.addEventListener('click', () => onSwitchMode('image'));

    const imgUrlInput = document.getElementById('signImageUrl');
    if (imgUrlInput) {
        imgUrlInput.addEventListener('input', () => onImageInput(imgUrlInput.value));
    }
}

/**
 * 初始化拖拽
 */
export function initDrag() {
    const header = document.getElementById('signPanelHeader');
    const modal = document.getElementById('signPanelModal');
    if (!header || !modal) return;

    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    header.addEventListener('mousedown', (e) => {
        isDragging = true;
        const rect = modal.getBoundingClientRect();
        modal.style.left = rect.left + 'px';
        modal.style.top = rect.top + 'px';
        modal.style.transform = 'none';
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        e.preventDefault();
    });

    const onMouseMove = (e) => {
        if (!isDragging) return;
        modal.style.left = (e.clientX - offsetX) + 'px';
        modal.style.top = (e.clientY - offsetY) + 'px';
    };

    const onMouseUp = () => {
        isDragging = false;
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

/**
 * 更新模式切换按钮状态
 */
export function updateModeButtons(mode) {
    const textBtn = document.getElementById('signModeText');
    const imgBtn = document.getElementById('signModeImage');

    textBtn?.classList.toggle('active', mode === 'text');
    imgBtn?.classList.toggle('active', mode === 'image');
}

/**
 * 更新内容区显示
 */
export function updateContentArea(mode) {
    const textarea = document.getElementById('signPanelTextarea');
    const imageArea = document.getElementById('signImageArea');

    if (textarea) textarea.style.display = mode === 'text' ? '' : 'none';
    if (imageArea) imageArea.style.display = mode === 'image' ? '' : 'none';
}

/**
 * 更新图片预览
 */
export function updateImagePreview(url) {
    const preview = document.getElementById('signImagePreview');
    if (!preview) return;

    if (!url) {
        preview.innerHTML = '<span class="placeholder">图片预览</span>';
        return;
    }

    preview.innerHTML = `<img src="${url}" onerror="this.parentElement.innerHTML='<span class=placeholder>加载失败</span>'">`;
}

/**
 * 更新状态文本
 */
export function updateStatus(text, type = '') {
    const status = document.getElementById('signPanelStatus');
    if (status) {
        status.textContent = text;
        status.className = 'sign-panel-status' + (type ? ` ${type}` : '');
    }
}

/**
 * 更新保存按钮状态
 */
export function updateSaveButton(disabled) {
    const btn = document.getElementById('signPanelSave');
    if (btn) btn.disabled = disabled;
}

/**
 * 设置文本内容
 */
export function setTextareaValue(value) {
    const textarea = document.getElementById('signPanelTextarea');
    if (textarea) textarea.value = value;
}

/**
 * 设置图片 URL
 */
export function setImageUrl(value) {
    const input = document.getElementById('signImageUrl');
    if (input) input.value = value;
}

/**
 * 设置画板 ID 显示
 */
export function setBoardIdDisplay(text) {
    const span = document.getElementById('signPanelBoardId');
    if (span) span.textContent = text;
}

/**
 * 聚焦输入框
 */
export function focusInput(mode) {
    if (mode === 'text') {
        document.getElementById('signPanelTextarea')?.focus();
    } else {
        document.getElementById('signImageUrl')?.focus();
    }
}

/**
 * 显示面板
 */
export function showModal() {
    const modal = document.getElementById('signPanelModal');
    const backdrop = document.getElementById('signPanelBackdrop');

    modal.style.left = '50%';
    modal.style.top = '50%';
    modal.style.transform = 'translate(-50%, -50%)';

    if (backdrop) backdrop.hidden = false;
    if (modal) modal.hidden = false;
}

/**
 * 隐藏面板
 */
export function hideModal() {
    const modal = document.getElementById('signPanelModal');
    const backdrop = document.getElementById('signPanelBackdrop');

    if (modal) modal.hidden = true;
    if (backdrop) backdrop.hidden = true;
}

/**
 * 获取文本内容
 */
export function getTextareaValue() {
    const textarea = document.getElementById('signPanelTextarea');
    return textarea ? textarea.value : '';
}

/**
 * 获取图片 URL
 */
export function getImageUrl() {
    const input = document.getElementById('signImageUrl');
    return input ? input.value : '';
}
