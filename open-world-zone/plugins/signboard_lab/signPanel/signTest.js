/**
 * 信息板编辑面板 - 主控制器
 * ========
 * 状态管理、显示/隐藏、保存逻辑
 */

import { reportSignboardServerStatus, setSignContent, signContentMap, signIndexMap } from '../store.js';
import { saveBoardToLegacyServer, saveOfflineBoardDraft } from '../offlineQueue.js';
import { isOfflineSaveModeEnabled } from '../saveMode.js';
import { getErrorMessage } from '../errorMessage.js';
const areaEditorUrl = new URL('../../../assest/areaeditor.js', import.meta.url).href;
import {
    initDOM, bindEvents, initDrag,
    updateModeButtons, updateContentArea, updateImagePreview,
    updateStatus, updateSaveButton,
    setTextareaValue, setImageUrl, setBoardIdDisplay,
    focusInput, showModal, hideModal,
    getTextareaValue, getImageUrl,
    setRemarkValue, getRemarkValue, initRemarkState, toggleRemarkExpanded, setRemarkExpanded,
    getTextViewState, restoreTextViewState, getTextExpandedState, setPreferredTextExpanded
} from './dom.js';

/**
 * 创建面板控制器
 * @param {Object} ccgxkObj - OpenWorld 引擎对象
 */
export default function createSignPanel(ccgxkObj) {
    // 仅内存级记忆：按画板保存上次文本视图（刷新/关浏览器后自动失效）。
    const boardEditViewMemory = new Map();

    // 面板会话状态；这里只管一次打开期间的 UI 状态，不持久化业务数据。
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
     * mode=1 下如果全文模态框还开着，就不要急着重新锁鼠标，
     * 否则用户虽然还在看全文，却会被强行切回第一人称控制。
     */
    function shouldKeepPointerUnlocked() {
        const contentModal = document.getElementById('signHotInfoContentModal');
        return ccgxkObj.mode === 1 && contentModal?.style.display === 'flex';
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
     * 将当前画板的文本视图状态写入内存（光标、滚动条、全屏/小屏）。
     */
    function rememberCurrentBoardEditView() {
        if (!state.boardId) return;
        const prev = boardEditViewMemory.get(state.boardId) || {};
        const snapshot = { ...prev };

        // 仅在文字模式下有光标/滚动语义，图片模式保留已有文本快照即可。
        if (state.mode === 'text') {
            snapshot.textExpanded = getTextExpandedState();
            const textView = getTextViewState();
            if (textView) snapshot.textView = textView;
        }

        boardEditViewMemory.set(state.boardId, snapshot);
    }

    /**
     * 恢复指定画板的文本视图状态；无记忆时保持原有默认行为。
     */
    function restoreBoardTextView(boardId) {
        if (!boardId) return false;
        const snapshot = boardEditViewMemory.get(boardId);
        if (!snapshot?.textView) return false;
        restoreTextViewState(snapshot.textView);
        return true;
    }

    /**
     * 切换编辑模式
     */
    function switchMode(mode) {
        if (state.mode === 'text' && mode !== 'text') {
            rememberCurrentBoardEditView(); // 切离文字前先记一份当前光标与滚动
        }

        state.mode = mode;
        const snapshot = state.boardId ? boardEditViewMemory.get(state.boardId) : null;
        if (mode === 'text' && typeof snapshot?.textExpanded === 'boolean') {
            setPreferredTextExpanded(snapshot.textExpanded);
        }
        updateModeButtons(mode);
        updateContentArea(mode);

        if (mode === 'text' && restoreBoardTextView(state.boardId)) return;
        focusInput(mode);
    }

    /**
     * 初始化面板
     */
    function init() {
        if (state.initialized) return;

        initDOM();  // 只注入一次 DOM，后续 show/hide 都复用同一套节点

        bindEvents({
            onClose: hide,
            onSave: save,
            onSwitchMode: switchMode,
            onImageInput: updateImagePreview,
            onToggleRemark: toggleRemarkExpanded
        });

        initDrag();         // 面板可拖动，避免挡住场景中心
        initRemarkState();  // 备注区默认折叠，展开状态不持久化

        // Ctrl/Cmd + S 快捷键
        state.keyHandler = (e) => {
            if (!state.visible) return;
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                save();
            }
        };
        document.addEventListener('keydown', state.keyHandler);

        /**
         * 当窗口重新获得焦点或页面从后台切回前台时：
         * 若当前正处于图片 URL 编辑模式且面板可见，强制重新聚焦并全选 URL。
         * 这样可以保证你切回页面后直接 Cmd/Ctrl+V 覆盖，不需要额外点选。
         */
        window.addEventListener('focus', () => {
            if (!state.visible || state.mode !== 'image') return;
            focusInput('image');
        });
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState !== 'visible') return;
            if (!state.visible || state.mode !== 'image') return;
            focusInput('image');
        });

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
        setBoardIdDisplay(state.boardId ? `#${state.boardId}` : '(No Board)');

        // 按当前热点回填内容。面板每次打开都重新读 store，避免显示上一次残留值。
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
                // 备注不渲染到画板纹理里，但编辑时需要一起带出
                const extra = info.extra || {};
                setRemarkValue(extra.remark || '');
            } else {
                setTextareaValue('');
                setRemarkValue('');
            }
        } else {
            setTextareaValue('');
            setRemarkValue('');
        }

        // 切换模式（不聚焦，等面板显示后再聚焦）
        state.mode = detectedMode;
        const snapshot = state.boardId ? boardEditViewMemory.get(state.boardId) : null;
        if (detectedMode === 'text' && typeof snapshot?.textExpanded === 'boolean') {
            setPreferredTextExpanded(snapshot.textExpanded); // 先喂偏好，再刷新内容区，避免尺寸闪烁
        }
        updateModeButtons(detectedMode);
        updateContentArea(detectedMode);
        setRemarkExpanded(false); // 每次打开都从折叠态开始，不记 cookie/本地状态

        // 清空状态
        updateStatus('');

        // 显示面板
        showModal();

        // 面板显示后优先恢复本画板上次文本视图；没有历史时退回默认末尾光标。
        if (!(detectedMode === 'text' && restoreBoardTextView(state.boardId))) {
            focusInput(detectedMode);
        }

        // 打开编辑器时暂停热点追踪，避免你编辑过程中 hotPoint 继续漂移。
        unlockPointer();
        ccgxkObj.drawPointPause = true;

        state.visible = true;
    }

    /**
     * 隐藏面板
     */
    function hide() {
        rememberCurrentBoardEditView(); // 先记忆，再执行 hideModal() 内部的视觉重置
        hideModal();

        state.visible = false;
        state.hotIndex = -1;
        state.boardId = null;

        // 不管是否重新锁鼠标，都必须恢复热点追踪；
        // 否则 signHotInfo 会卡死在刚刚编辑的那块板子上。
        ccgxkObj.drawPointPause = false;

        // 预览模式下如果全文模态框还在，就继续保持解锁，避免打断阅读。
        if (shouldKeepPointerUnlocked()) return;

        // 只有在全文模态框也已经不看了时，才恢复鼠标锁定。
        lockPointer();
    }

    /**
     * 判断这次保存是否真的改到了画板可见内容。
     * 备注只存在 extra 中，不应该触发 3D 纹理重新加载。
     */
    function hasRenderableContentChanged(prevInfo, mode, content) {
        if (!prevInfo) return true;
        if (prevInfo.mode !== mode) return true;
        if (mode === 'image') return prevInfo.imgUrl !== content;
        if (mode === 'text') return prevInfo.t !== content;
        return false;
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
            updateStatus('No Board ID', 'error');
            return;
        }

        const mode = state.mode;
        const content = mode === 'text' ? getTextareaValue() : getImageUrl();
        const remark = getRemarkValue();

        // 构建 extra 对象，尽量保留其他扩展字段，只覆盖 remark。
        const info = signContentMap.get(state.boardId);
        let extra = info?.extra || {};
        // 确保 extra 是对象；历史数据里数据库可能存的是 JSON 字符串。
        if (typeof extra === 'string') {
            extra = JSON.parse(extra);
        }
        extra.remark = remark;
        const renderChanged = hasRenderableContentChanged(info, mode, content);

        const offlineModeEnabled = isOfflineSaveModeEnabled();
        updateStatus(offlineModeEnabled ? 'Saving offline...' : 'Saving online...', 'saving');
        updateSaveButton(true);

        try {
            /**
             * 离线模式：保存只写本机 IndexedDB，真正上云交给手动同步按钮。
             * 在线模式：直接走老服务器 PATCH，成功后才算保存完成。
             */
            if (offlineModeEnabled) {
                await saveOfflineBoardDraft({
                    id: state.boardId,
                    name: state.boardId,
                    mode,
                    content,
                    extra
                });
                reportSignboardServerStatus('idle', { message: 'Saved locally. Waiting for manual sync.' });
            } else {
                await saveBoardToLegacyServer({
                    id: state.boardId,
                    name: state.boardId,
                    mode,
                    content,
                    extra
                });
                reportSignboardServerStatus('online', { message: 'Saved online.' });
            }

            if (renderChanged && typeof window.updateSign === 'function') {
                window.updateSign(state.boardId, content, mode, extra);  // 服务端成功或离线入队成功后，本地统一立即刷新
            } else {
                setSignContent(state.boardId, mode, content, extra); // 备注等非渲染内容也要进入当前内存态
            }

            updateStatus(offlineModeEnabled ? 'Saved offline' : 'Saved online', 'saved');
            hide();  // 保存成功后沿用统一收口逻辑，避免漏掉热点/鼠标状态恢复
        } catch (e) {
            console.error('[signPanel] 保存失败:', e);
            const message = getErrorMessage(e);
            alert(message);
            reportSignboardServerStatus('offline', { message });
            updateStatus('Save failed', 'error');
        } finally {
            updateSaveButton(false);
        }
    }

    // 暴露 API，供 mode=2 热点点击和 mode=1 全文模态框里的“编辑”按钮共用。
    ccgxkObj.signPanel = {
        show,
        hide,
        toggle,
        init
    };

    // 启用全局 tab 友好
    var ae = document.createElement('script');  // 所有的 textarea 都 tab 友好
    ae.src = areaEditorUrl;
    ae.onload = function() { new AreaEditor('textarea') };
    document.head.appendChild(ae);
}
