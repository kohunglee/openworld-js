/**
 * 信息板编辑面板 - 主控制器
 * ========
 * 状态管理、显示/隐藏、保存逻辑
 */

import { signContentMap, signIndexMap } from '../store.js';
import { getApiBase } from '../config.js';
import {
    initDOM, bindEvents, initDrag,
    updateModeButtons, updateContentArea, updateImagePreview,
    updateStatus, updateSaveButton,
    setTextareaValue, setImageUrl, setBoardIdDisplay,
    focusInput, showModal, hideModal,
    getTextareaValue, getImageUrl
} from './dom.js';

/**
 * 创建面板控制器
 * @param {Object} ccgxkObj - OpenWorld 引擎对象
 */
export default function createSignPanel(ccgxkObj) {
    // 状态
    const state = {
        initialized: false,
        visible: false,
        hotIndex: -1,
        boardId: null,
        mode: 'text',
        keyHandler: null
    };

    /**
     * 解锁鼠标指针
     */
    function unlockPointer() {
        const exitLock = document.exitPointerLock ||
            document.mozExitPointerLock ||
            document.webkitExitPointerLock;
        if (exitLock) exitLock.call(document);
    }

    /**
     * 锁定鼠标指针
     */
    function lockPointer() {
        const canvas = ccgxkObj.canvas;
        if (!canvas) return;

        canvas.requestPointerLock = canvas.requestPointerLock ||
            canvas.mozRequestPointerLock ||
            canvas.webkitRequestPointerLock;
        canvas.requestPointerLock();
    }

    /**
     * 根据 hotIndex 查找画板 ID
     */
    function findBoardId(hotIndex) {
        for (const [id, data] of signIndexMap.entries()) {
            if (data.index === hotIndex) return id;
        }
        return null;
    }

    /**
     * 切换编辑模式
     */
    function switchMode(mode) {
        state.mode = mode;
        updateModeButtons(mode);
        updateContentArea(mode);
        focusInput(mode);
    }

    /**
     * 初始化面板
     */
    function init() {
        if (state.initialized) return;

        initDOM();

        bindEvents({
            onClose: hide,
            onSave: save,
            onSwitchMode: switchMode,
            onImageInput: updateImagePreview
        });

        initDrag();

        // Ctrl/Cmd + S 快捷键
        state.keyHandler = (e) => {
            if (!state.visible) return;
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                save();
            }
        };
        document.addEventListener('keydown', state.keyHandler);

        state.initialized = true;
    }

    /**
     * 显示面板
     */
    function show(hotIndex) {
        if (!state.initialized) {
            init();
            return show(hotIndex);
        }

        state.hotIndex = hotIndex;
        state.boardId = findBoardId(hotIndex);

        // 显示画板 ID
        setBoardIdDisplay(state.boardId ? `#${state.boardId}` : '(未注册画板)');

        // 填充内容
        let detectedMode = 'text';

        if (state.boardId) {
            const info = signContentMap.get(state.boardId);
            if (info) {
                detectedMode = info.mode || 'text';
                if (detectedMode === 'text') {
                    setTextareaValue(info.t || '');
                } else if (detectedMode === 'image') {
                    setImageUrl(info.imgUrl || '');
                    updateImagePreview(info.imgUrl || '');
                }
            } else {
                setTextareaValue('');
            }
        } else {
            setTextareaValue('');
        }

        // 切换模式（不聚焦，等面板显示后再聚焦）
        state.mode = detectedMode;
        updateModeButtons(detectedMode);
        updateContentArea(detectedMode);

        // 清空状态
        updateStatus('');

        // 显示面板
        showModal();

        // 面板显示后聚焦输入框
        focusInput(detectedMode);

        // 解锁鼠标
        unlockPointer();
        ccgxkObj.drawPointPause = true;

        state.visible = true;
    }

    /**
     * 隐藏面板
     */
    function hide() {
        hideModal();

        state.visible = false;
        state.hotIndex = -1;
        state.boardId = null;

        // 恢复鼠标锁定
        ccgxkObj.drawPointPause = false;
        lockPointer();
    }

    /**
     * 切换面板
     */
    function toggle(hotIndex) {
        if (state.visible) {
            hide();
        } else {
            show(hotIndex);
        }
    }

    /**
     * 保存内容
     */
    async function save() {
        if (!state.boardId) {
            updateStatus('无画板 ID', 'error');
            return;
        }

        const mode = state.mode;
        const content = mode === 'text' ? getTextareaValue() : getImageUrl();

        updateStatus('保存中...', 'saving');
        updateSaveButton(true);

        try {
            const res = await fetch(`${getApiBase()}/api/signs/${encodeURIComponent(state.boardId)}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode, content })
            });

            if (!res.ok) throw new Error('保存失败');

            updateStatus('已保存', 'saved');
            hide();
        } catch (e) {
            console.error('[signPanel] 保存失败:', e);
            alert('保存失败: ' + e.message + '\n你的内容还在，不会丢失。');
            updateStatus('保存失败', 'error');
        } finally {
            updateSaveButton(false);
        }
    }

    // 暴露 API
    ccgxkObj.signPanel = {
        show,
        hide,
        toggle,
        init
    };
}
