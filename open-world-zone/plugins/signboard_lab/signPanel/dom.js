/**
 * DOM 操作模块
 * ========
 * 初始化 HTML、事件绑定、拖拽功能
 */

/* global AreaEditor */
import { styleCode } from './style.js';

// 备注框高度本地记忆；只影响 signPanel，不影响其他 textarea。
const REMARK_TEXTAREA_HEIGHT_STORAGE_KEY = 'signpanel_mark_textarea_height';
const REMARK_TEXTAREA_MIN_HEIGHT = 80;
let remarkTextareaResizeObserver = null;

// HTML 模板
const htmlTemplate = `
<div id="signPanelBackdrop" class="sign-panel-backdrop" hidden></div>
<div id="signPanelModal" class="sign-panel-modal" hidden>
    <div class="sign-panel-box" id="signPanelBox">
        <div class="sign-panel-header" id="signPanelHeader">
            <span>
                <span class="sign-panel-title">Board Edit</span>
                <span class="sign-panel-title-id" id="signPanelBoardId"></span>
            </span>
            <button class="sign-panel-close" id="signPanelClose">&times;</button>
        </div>
        <div class="sign-mode-bar">
            <button class="sign-mode-btn active" id="signModeText" data-mode="text">Text</button>
            <button class="sign-mode-btn" id="signModeImage" data-mode="image">Image</button>
            <button class="sign-mode-btn sign-mode-expand-btn" id="signTextExpandToggle" type="button">Expand</button>
            <button class="sign-mode-btn sign-mode-expand-btn" id="signImageUploadBtn" type="button" hidden>Upload</button>
        </div>
        <div class="sign-panel-content">
            <textarea class="sign-panel-textarea" id="signPanelTextarea"
                placeholder="Enter text..."></textarea>
            <div class="sign-image-area" id="signImageArea" style="display:none">
                <input type="text" class="sign-image-input" id="signImageUrl"
                    placeholder="Paste image URL...">
                <div class="sign-image-preview" id="signImagePreview">
                    <span class="placeholder">Preview</span>
                </div>
            </div>
            <div class="sign-remark-section" id="signRemarkSection">
                <div class="sign-remark-header" id="signRemarkHeader">
                    <span class="sign-remark-title">Note (hidden)</span>
                    <span class="sign-remark-toggle" id="signRemarkToggle">▼</span>
                </div>
                <div class="sign-remark-body" id="signRemarkBody">
                    <textarea class="sign-remark-textarea" id="signRemarkTextarea"></textarea>
                </div>
            </div>
        </div>
        <div class="sign-panel-footer">
            <span class="sign-panel-status" id="signPanelStatus"></span>
            <div>
                <button class="sign-save-btn" id="signPanelSave">Save</button>
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
    const { onClose, onSave, onSwitchMode, onImageInput, onToggleRemark } = handlers;

    document.getElementById('signPanelClose')?.addEventListener('click', onClose);
    document.getElementById('signPanelBackdrop')?.addEventListener('click', onClose);
    document.getElementById('signPanelSave')?.addEventListener('click', onSave);

    document.getElementById('signModeText')?.addEventListener('click', () => onSwitchMode('text'));
    document.getElementById('signModeImage')?.addEventListener('click', () => onSwitchMode('image'));
    document.getElementById('signTextExpandToggle')?.addEventListener('click', toggleTextExpand);
    document.getElementById('signImageUploadBtn')?.addEventListener('click', openImageUploadPage);

    const imgUrlInput = document.getElementById('signImageUrl');
    if (imgUrlInput) {
        imgUrlInput.addEventListener('input', () => onImageInput(imgUrlInput.value));
    }

    // 备注区域点击事件
    document.getElementById('signRemarkHeader')?.addEventListener('click', onToggleRemark);
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
        if (modal.classList.contains('text-expand-mode')) return;
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
    syncModeActionButtons(mode);
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
        preview.innerHTML = '<span class="placeholder">Preview</span>';
        return;
    }

    preview.innerHTML = `<img src="${url}" onerror="this.parentElement.innerHTML='<span class=placeholder>Load Err</span>'">`;
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
 * - text 模式：默认从文章开头开始编辑，光标和滚动条都归到最前面
 * - image 模式：强制全选 URL，便于直接粘贴替换
 */
export function focusInput(mode) {
    const el = mode === 'text'
        ? document.getElementById('signPanelTextarea')
        : document.getElementById('signImageUrl');

    if (!el) return;

    // 图片 URL 场景：始终强制 focus + 全选，满足“打开即粘贴替换”的极速流
    if (mode === 'image') {
        el.focus();
        el.select();
        return;
    }

    el.focus();
    el.setSelectionRange(0, 0);
    el.scrollTop = 0;
    el.scrollLeft = 0;

    // 后续可精简标注：旧逻辑曾用 trimEnd + blur/focus 把光标推到末尾；现在默认开头，不再需要那套末尾定位。
    requestAnimationFrame(() => {
        if (document.activeElement !== el) return;
        el.scrollTop = 0;
        el.scrollLeft = 0;
    });
}

/**
 * 获取当前文本编辑视图状态（光标 + 滚动），供业务层按画板记忆。
 */
export function getTextViewState() {
    const textarea = document.getElementById('signPanelTextarea');
    if (!textarea) return null;
    return {
        selectionStart: textarea.selectionStart ?? 0,
        selectionEnd: textarea.selectionEnd ?? 0,
        scrollTop: textarea.scrollTop ?? 0,
        scrollLeft: textarea.scrollLeft ?? 0
    };
}

/**
 * 恢复文本编辑视图状态（光标 + 滚动）；超界时自动夹紧。
 */
export function restoreTextViewState(viewState) {
    const textarea = document.getElementById('signPanelTextarea');
    if (!textarea || !viewState) return;

    const maxPos = textarea.value.length;
    const start = Math.max(0, Math.min(viewState.selectionStart ?? 0, maxPos));
    const end = Math.max(start, Math.min(viewState.selectionEnd ?? start, maxPos));

    textarea.focus();
    textarea.setSelectionRange(start, end);
    textarea.scrollTop = Math.max(0, viewState.scrollTop ?? 0);
    textarea.scrollLeft = Math.max(0, viewState.scrollLeft ?? 0);
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

    globalThis.temp_isAreaEditor ??= new AreaEditor('textarea');  // 只执行一次
}

/**
 * 隐藏面板
 */
export function hideModal() {
    const modal = document.getElementById('signPanelModal');
    const backdrop = document.getElementById('signPanelBackdrop');

    // 关闭面板时仅收起当前视觉状态，不覆盖本次页面会话里的模式偏好。
    exitTextExpand({ rememberPreference: false });
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

// ── 备注区域相关 ──

/**
 * 设置备注区域展开状态
 */
export function setRemarkExpanded(expanded) {
    const body = document.getElementById('signRemarkBody');
    const toggle = document.getElementById('signRemarkToggle');
    if (body) body.classList.toggle('expanded', expanded);
    if (toggle) toggle.classList.toggle('expanded', expanded);
}

/**
 * 切换备注区域展开状态
 */
export function toggleRemarkExpanded() {
    const body = document.getElementById('signRemarkBody');
    const isExpanded = body?.classList.contains('expanded');
    setRemarkExpanded(!isExpanded);
}

/**
 * 设置备注内容
 */
export function setRemarkValue(value) {
    const textarea = document.getElementById('signRemarkTextarea');
    if (textarea) textarea.value = value || '';
}

/**
 * 获取备注内容
 */
export function getRemarkValue() {
    const textarea = document.getElementById('signRemarkTextarea');
    return textarea ? textarea.value : '';
}

/**
 * 初始化备注区域状态；备注编辑器不记忆展开偏好，默认一直折叠。
 */
export function initRemarkState() {
    bindRemarkTextareaResizeMemory();
    applyStoredRemarkTextareaHeight();
    setRemarkExpanded(false);
}

/**
 * 读取本地保存的备注框高度；异常环境下直接回退默认高度。
 */
function getStoredRemarkTextareaHeight() {
    try {
        const value = Number.parseInt(localStorage.getItem(REMARK_TEXTAREA_HEIGHT_STORAGE_KEY), 10);
        return Number.isFinite(value) && value >= REMARK_TEXTAREA_MIN_HEIGHT ? value : null;
    } catch {
        return null;
    }
}

/**
 * 把用户上次手动拖拽后的备注框高度恢复回来。
 */
function applyStoredRemarkTextareaHeight() {
    const textarea = document.getElementById('signRemarkTextarea');
    const storedHeight = getStoredRemarkTextareaHeight();
    if (!textarea || !storedHeight) return;

    textarea.style.height = `${storedHeight}px`;
}

/**
 * 保存备注框当前高度；隐藏折叠态会读到 0，这类值要忽略。
 * @param {number} height - textarea 当前可见高度
 */
function saveRemarkTextareaHeight(height) {
    const roundedHeight = Math.round(height);
    if (!Number.isFinite(roundedHeight) || roundedHeight < REMARK_TEXTAREA_MIN_HEIGHT) return;

    try {
        localStorage.setItem(REMARK_TEXTAREA_HEIGHT_STORAGE_KEY, String(roundedHeight));
    } catch {
        // localStorage 被禁用时不阻断编辑流程。
    }
}

/**
 * 监听备注框的原生拖拽尺寸变化，并记住用户手动调出来的高度。
 */
function bindRemarkTextareaResizeMemory() {
    const textarea = document.getElementById('signRemarkTextarea');
    if (!textarea || textarea.dataset.resizeMemoryBound === '1') return;

    textarea.dataset.resizeMemoryBound = '1';

    if (typeof ResizeObserver === 'function') {
        remarkTextareaResizeObserver = new ResizeObserver(() => {
            saveRemarkTextareaHeight(textarea.getBoundingClientRect().height);
        });
        remarkTextareaResizeObserver.observe(textarea);
        return;
    }

    // 兼容少数没有 ResizeObserver 的环境：拖完鼠标后记一次高度。
    textarea.addEventListener('mouseup', () => {
        saveRemarkTextareaHeight(textarea.getBoundingClientRect().height);
    });
}

/**
 * 切换文字模式下的小屏/全屏显示。
 */
function toggleTextExpand() {
    const modal = document.getElementById('signPanelModal');
    const isExpanded = modal?.classList.contains('text-expand-mode');
    setTextExpand(!isExpanded);
}

/**
 * 记录本次页面会话里用户最后一次选择的文字面板尺寸偏好。
 */
let preferredTextExpanded = false;

/**
 * 退出文字全屏显示。
 * @param {Object} options - 控制是否同时更新用户偏好
 */
function exitTextExpand(options) {
    setTextExpand(false, options);
}

/**
 * 在图片模式中打开上传页面（新窗口）。
 */
function openImageUploadPage() {
    window.open('https://openworld.zone/upload-image/', '_blank', 'noopener,noreferrer');
}

/**
 * 根据当前编辑模式同步右侧动作按钮可见性，并在文字模式下恢复上次尺寸选择。
 * @param {string} mode - 当前编辑模式
 */
function syncModeActionButtons(mode) {
    const toggle = document.getElementById('signTextExpandToggle');
    const uploadBtn = document.getElementById('signImageUploadBtn');
    const isTextMode = mode === 'text';
    const isImageMode = mode === 'image';
    if (toggle) toggle.hidden = !isTextMode;
    if (uploadBtn) uploadBtn.hidden = !isImageMode;
    if (!isTextMode) {
        exitTextExpand({ rememberPreference: false });
        return;
    }

    setTextExpand(preferredTextExpanded, { rememberPreference: false });
}

/**
 * 设置文字模式面板的小屏/全屏状态。
 * @param {boolean} expanded - 是否使用全屏模式
 * @param {Object} options - 控制是否记住本次选择
 */
function setTextExpand(expanded, options = {}) {
    const { rememberPreference = true } = options;
    const modal = document.getElementById('signPanelModal');
    const box = document.getElementById('signPanelBox');
    const toggle = document.getElementById('signTextExpandToggle');
    if (!modal || !box || !toggle) return;

    if (rememberPreference) preferredTextExpanded = expanded;

    modal.classList.toggle('text-expand-mode', expanded);
    box.classList.toggle('text-expand-mode', expanded);
    toggle.textContent = expanded ? 'Compact' : 'Expand';

    if (expanded) {
        modal.style.left = '50%';
        modal.style.top = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
    }
}

/**
 * 读取当前文字全屏状态；面板关闭时回退到上次偏好值。
 */
export function getTextExpandedState() {
    const modal = document.getElementById('signPanelModal');
    return modal?.classList.contains('text-expand-mode') ?? preferredTextExpanded;
}

/**
 * 覆盖本次会话中的文字全屏偏好，供按画板恢复。
 */
export function setPreferredTextExpanded(expanded) {
    preferredTextExpanded = !!expanded;
}
