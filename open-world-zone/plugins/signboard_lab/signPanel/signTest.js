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
    getTextareaValue, getImageUrl,
    setRemarkValue, getRemarkValue, initRemarkState, toggleRemarkExpanded, setRemarkExpanded
} from './dom.js';

/**
 * 创建面板控制器
 * @param {Object} ccgxkObj - OpenWorld 引擎对象
 */
export default function createSignPanel(ccgxkObj) {
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
        const textModal = document.getElementById('signHotInfoTextModal');
        return ccgxkObj.mode === 1 && textModal?.style.display === 'flex';
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

        initDOM();  // 只注入一次 DOM，后续 show/hide 都复用同一套节点

        bindEvents({
            onClose: hide,
            onSave: save,
            onSwitchMode: switchMode,
            onImageInput: updateImagePreview,
            onToggleRemark: toggleRemarkExpanded
        });

        initDrag();         // 面板可拖动，避免挡住场景中心
        initRemarkState();  // 备注区折叠状态走 cookie 记忆

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
        updateModeButtons(detectedMode);
        updateContentArea(detectedMode);

        // 清空状态
        updateStatus('');

        // 显示面板
        showModal();

        // 面板显示后聚焦输入框
        focusInput(detectedMode);

        // 打开编辑器时暂停热点追踪，避免你编辑过程中 hotPoint 继续漂移。
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

        // 不管是否重新锁鼠标，都必须恢复热点追踪；
        // 否则 signHotInfo 会卡死在刚刚编辑的那块板子上。
        ccgxkObj.drawPointPause = false;

        // 预览模式下如果全文模态框还在，就继续保持解锁，避免打断阅读。
        if (shouldKeepPointerUnlocked()) return;

        // 只有在全文模态框也已经不看了时，才恢复鼠标锁定。
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
        const remark = getRemarkValue();

        // 构建 extra 对象，尽量保留其他扩展字段，只覆盖 remark。
        const info = signContentMap.get(state.boardId);
        let extra = info?.extra || {};
        // 确保 extra 是对象；历史数据里数据库可能存的是 JSON 字符串。
        if (typeof extra === 'string') {
            extra = JSON.parse(extra);
        }
        extra.remark = remark;

        updateStatus('保存中...', 'saving');
        updateSaveButton(true);

        try {
            const res = await fetch(`${getApiBase()}/api/signs/${encodeURIComponent(state.boardId)}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode, content, extra })
            });

            if (!res.ok) throw new Error('保存失败');

            updateStatus('已保存', 'saved');
            hide();  // 保存成功后沿用统一收口逻辑，避免漏掉热点/鼠标状态恢复
        } catch (e) {
            console.error('[signPanel] 保存失败:', e);
            alert('保存失败: ' + e.message + '\n你的内容还在，不会丢失。');
            updateStatus('保存失败', 'error');
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
    ae.src = './assest/areaeditor.js';
    ae.onload = function() { new AreaEditor('textarea') };
    document.head.appendChild(ae);
}
