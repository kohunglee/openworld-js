/**
 * 信息板编辑面板
 * ========
 * 可拖动的 HUD 窗口，用于编辑画板内容
 */

import { signContentMap, signIndexMap } from './store.js';
import { API_BASE } from './config.js';

export default function(ccgxkObj) {
    const g = {
        panelInitialized: false,
        isPanelVisible: false,
        currentHotIndex: -1,
        currentBoardId: null,
        currentMode: 'text',
        _keyHandler: null,

        unlockPointer() {
            if ('pointerLockElement' in document ||
                'mozPointerLockElement' in document ||
                'webkitPointerLockElement' in document) {
                const exitLock = document.exitPointerLock ||
                                 document.mozExitPointerLock ||
                                 document.webkitExitPointerLock;
                if (exitLock) exitLock.call(document);
            }
        },

        lockPointer() {
            const canvas = ccgxkObj.canvas;
            if (!canvas) return;
            canvas.requestPointerLock = canvas.requestPointerLock ||
                                        canvas.mozRequestPointerLock ||
                                        canvas.webkitRequestPointerLock;
            canvas.requestPointerLock();
        },

        // 面板 HTML 内容
        htmlCode: `
            <style>
                .sign-panel-backdrop {
                    position: fixed;
                    top: 0; left: 0;
                    width: 100vw; height: 100vh;
                    z-index: 999;
                    cursor: pointer;
                }
                .sign-panel-modal {
                    position: fixed;
                    z-index: 1000;
                }
                .sign-panel-box {
                    width: 500px;
                    height: 400px;
                    background-color: rgba(255, 255, 255, 0.75);
                    backdrop-filter: blur(6px);
                    border-radius: 10px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                .sign-panel-header {
                    background-color: rgba(60, 60, 60, 0.9);
                    color: #fff;
                    padding: 8px 14px;
                    cursor: move;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    user-select: none;
                }
                .sign-panel-title { font-size: 13px; font-weight: bold; }
                .sign-panel-title-id { font-size: 11px; color: #bbb; margin-left: 8px; font-weight: normal; }
                .sign-panel-close {
                    background: transparent; border: none; color: #ddd;
                    font-size: 18px; cursor: pointer; padding: 0 5px; line-height: 1;
                }
                .sign-panel-close:hover { color: #ff6b6b; }

                /* 模式切换栏 */
                .sign-mode-bar {
                    padding: 6px 14px;
                    display: flex;
                    gap: 6px;
                    border-bottom: 1px solid rgba(0,0,0,0.08);
                }
                .sign-mode-btn {
                    padding: 4px 14px;
                    border: 1px solid rgba(0,0,0,0.15);
                    border-radius: 4px;
                    background: transparent;
                    color: #666;
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.15s;
                }
                .sign-mode-btn:hover { background: rgba(0,0,0,0.05); }
                .sign-mode-btn.active {
                    background: #4a9eff;
                    color: #fff;
                    border-color: #4a9eff;
                }

                /* 内容区 */
                .sign-panel-content {
                    padding: 10px 14px;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }

                /* text 模式 */
                .sign-panel-textarea {
                    flex: 1;
                    width: 100%;
                    resize: none;
                    background: transparent;
                    border: 1px solid rgba(0,0,0,0.15);
                    border-radius: 6px;
                    color: #333;
                    font-size: 14px;
                    font-family: 'Microsoft YaHei', sans-serif;
                    padding: 10px 12px;
                    line-height: 1.6;
                    outline: none;
                    box-sizing: border-box;
                }
                .sign-panel-textarea:focus {
                    border-color: rgba(74, 158, 255, 0.5);
                    background: transparent;
                }

                /* image 模式 */
                .sign-image-area {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    overflow: hidden;
                }
                .sign-image-input {
                    width: 100%;
                    padding: 8px 10px;
                    border: 1px solid rgba(0,0,0,0.15);
                    border-radius: 6px;
                    background: transparent;
                    color: #333;
                    font-size: 13px;
                    outline: none;
                    box-sizing: border-box;
                }
                .sign-image-input:focus {
                    border-color: rgba(74, 158, 255, 0.5);
                }
                .sign-image-preview {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px dashed rgba(0,0,0,0.15);
                    border-radius: 6px;
                    overflow: hidden;
                    min-height: 0;
                }
                .sign-image-preview img {
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain;
                }
                .sign-image-preview .placeholder {
                    color: #aaa;
                    font-size: 12px;
                }

                /* 底部栏 */
                .sign-panel-footer {
                    padding: 8px 14px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-top: 1px solid rgba(0,0,0,0.08);
                }
                .sign-panel-status { font-size: 11px; color: #999; }
                .sign-panel-status.saving { color: #f0ad4e; }
                .sign-panel-status.saved { color: #5cb85c; }
                .sign-panel-status.error { color: #d9534f; }
                .sign-save-btn {
                    padding: 6px 20px;
                    background: #4a9eff;
                    color: #fff;
                    border: none;
                    border-radius: 5px;
                    font-size: 13px;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .sign-save-btn:hover { background: #3a8eef; }
                .sign-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                .sign-save-hint { font-size: 10px; color: #aaa; margin-left: 8px; }
            </style>
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
                        <!-- text 模式 -->
                        <textarea class="sign-panel-textarea" id="signPanelTextarea"
                            placeholder="输入画板文字内容..."></textarea>
                        <!-- image 模式 -->
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
        `,

        initHTML() {
            if (g.panelInitialized) return;
            const template = document.createElement('template');
            template.innerHTML = g.htmlCode;
            const content = template.content.cloneNode(true);
            document.body.appendChild(content);
            g.panelInitialized = true;
            g.bindEvents();
        },

        bindEvents() {
            document.getElementById('signPanelClose')?.addEventListener('click', () => g.hidePanel());
            document.getElementById('signPanelBackdrop')?.addEventListener('click', () => g.hidePanel());
            document.getElementById('signPanelSave')?.addEventListener('click', () => g.save());

            // 模式切换
            document.getElementById('signModeText')?.addEventListener('click', () => g.switchMode('text'));
            document.getElementById('signModeImage')?.addEventListener('click', () => g.switchMode('image'));

            // image URL 输入实时预览
            const imgUrlInput = document.getElementById('signImageUrl');
            if (imgUrlInput) {
                imgUrlInput.addEventListener('input', () => {
                    g.previewImage(imgUrlInput.value);
                });
            }

            // Ctrl/Cmd + S
            g._keyHandler = (e) => {
                if (!g.isPanelVisible) return;
                if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                    e.preventDefault();
                    g.save();
                }
            };
            document.addEventListener('keydown', g._keyHandler);

            g.initDrag();
        },

        initDrag() {
            const header = document.getElementById('signPanelHeader');
            const modal = document.getElementById('signPanelModal');
            if (!header || !modal) return;

            let isDragging = false, offsetX = 0, offsetY = 0;

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

            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                modal.style.left = (e.clientX - offsetX) + 'px';
                modal.style.top = (e.clientY - offsetY) + 'px';
            });

            document.addEventListener('mouseup', () => { isDragging = false; });
        },

        // 切换模式
        switchMode(mode) {
            g.currentMode = mode;
            const textBtn = document.getElementById('signModeText');
            const imgBtn = document.getElementById('signModeImage');
            const textarea = document.getElementById('signPanelTextarea');
            const imageArea = document.getElementById('signImageArea');

            if (textBtn) textBtn.classList.toggle('active', mode === 'text');
            if (imgBtn) imgBtn.classList.toggle('active', mode === 'image');

            if (textarea) textarea.style.display = mode === 'text' ? '' : 'none';
            if (imageArea) imageArea.style.display = mode === 'image' ? '' : 'none';

            // 聚焦对应的输入框
            if (mode === 'text') {
                textarea?.focus();
            } else {
                document.getElementById('signImageUrl')?.focus();
            }
        },

        // 图片预览
        previewImage(url) {
            const preview = document.getElementById('signImagePreview');
            if (!preview) return;
            if (!url) {
                preview.innerHTML = '<span class="placeholder">图片预览</span>';
                return;
            }
            preview.innerHTML = `<img src="${url}" onerror="this.parentElement.innerHTML='<span class=placeholder>加载失败</span>'">`;
        },

        findBoardId(hotIndex) {
            for (const [id, data] of signIndexMap.entries()) {
                if (data.index === hotIndex) return id;
            }
            return null;
        },

        // 显示面板
        showPanel(hotIndex) {
            let modal = document.getElementById('signPanelModal');
            let backdrop = document.getElementById('signPanelBackdrop');

            if (!modal || !backdrop) {
                g.initHTML();
                return g.showPanel(hotIndex);
            }

            g.currentHotIndex = hotIndex;

            const boardId = g.findBoardId(hotIndex);
            g.currentBoardId = boardId;

            const idSpan = document.getElementById('signPanelBoardId');
            if (idSpan) idSpan.textContent = boardId ? `#${boardId}` : '(未注册画板)';

            // 根据 signContentMap 中的模式填充内容
            let detectedMode = 'text';
            const textarea = document.getElementById('signPanelTextarea');
            const imgUrlInput = document.getElementById('signImageUrl');

            if (boardId) {
                const info = signContentMap.get(boardId);
                if (info) {
                    detectedMode = info.mode || 'text';
                    if (detectedMode === 'text') {
                        if (textarea) textarea.value = info.t || '';
                    } else if (detectedMode === 'image') {
                        if (imgUrlInput) {
                            imgUrlInput.value = info.imgUrl || '';
                            g.previewImage(info.imgUrl || '');
                        }
                    }
                } else {
                    if (textarea) textarea.value = '';
                }
            } else {
                if (textarea) textarea.value = '';
            }

            // 切换到对应模式
            g.switchMode(detectedMode);

            const status = document.getElementById('signPanelStatus');
            if (status) { status.textContent = ''; status.className = 'sign-panel-status'; }

            modal.style.left = '50%';
            modal.style.top = '50%';
            modal.style.transform = 'translate(-50%, -50%)';

            g.unlockPointer();
            ccgxkObj.drawPointPause = true;

            backdrop.hidden = false;
            modal.hidden = false;
            g.isPanelVisible = true;
        },

        // 统一保存（根据当前模式）
        async save() {
            const status = document.getElementById('signPanelStatus');
            const saveBtn = document.getElementById('signPanelSave');

            if (!g.currentBoardId) {
                if (status) { status.textContent = '无画板 ID'; status.className = 'sign-panel-status error'; }
                return;
            }

            // 根据模式收集内容
            let content = '';
            const mode = g.currentMode;

            if (mode === 'text') {
                const textarea = document.getElementById('signPanelTextarea');
                content = textarea ? textarea.value : '';
            } else if (mode === 'image') {
                const imgUrlInput = document.getElementById('signImageUrl');
                content = imgUrlInput ? imgUrlInput.value : '';
            }

            if (status) { status.textContent = '保存中...'; status.className = 'sign-panel-status saving'; }
            if (saveBtn) saveBtn.disabled = true;

            try {
                const res = await fetch(`${API_BASE}/api/signs/${encodeURIComponent(g.currentBoardId)}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mode, content })
                });
                if (!res.ok) throw new Error('保存失败');

                if (status) { status.textContent = '已保存'; status.className = 'sign-panel-status saved'; }
            } catch (e) {
                console.error('[signPanel] 保存失败:', e);
                alert('保存失败: ' + e.message + '\n你的内容还在，不会丢失。');
                if (status) { status.textContent = '保存失败'; status.className = 'sign-panel-status error'; }
            } finally {
                if (saveBtn) saveBtn.disabled = false;
            }
        },

        // 保留备用
        collectHotInfo(hotIndex) {
            const sections = [];
            sections.push({ label: '热点 Index', data: hotIndex });
            const args = ccgxkObj.indexToArgs.get(hotIndex);
            if (args) {
                const filteredArgs = {};
                for (const [key, value] of Object.entries(args)) {
                    if (typeof value !== 'function' && key !== 'deleteFunc') {
                        filteredArgs[key] = value;
                    }
                }
                sections.push({ label: 'Openworld 档案', data: g.formatJSON(filteredArgs) });
            }
            const wNode = ccgxkObj.W.next['T' + hotIndex];
            if (wNode) {
                const wInfo = { name: wNode.name || ('T' + hotIndex), hidden: wNode.hidden };
                if (wNode.position) wInfo.position = wNode.position;
                if (wNode.rotation) wInfo.rotation = wNode.rotation;
                if (wNode.scale) wInfo.scale = wNode.scale;
                sections.push({ label: 'W 引擎对象', data: g.formatJSON(wInfo) });
            }
            let boardId = g.findBoardId(hotIndex);
            if (boardId) {
                sections.push({ label: '画板 ID', data: boardId });
                const content = signContentMap.get(boardId);
                if (content) sections.push({ label: '画板内容', data: g.formatJSON(content) });
            }
            const p_offset = hotIndex * 8;
            if (ccgxkObj.positionsStatus && hotIndex >= 0) {
                sections.push({ label: '位置/状态', data: g.formatJSON({
                    x: ccgxkObj.positionsStatus[p_offset], y: ccgxkObj.positionsStatus[p_offset + 1],
                    z: ccgxkObj.positionsStatus[p_offset + 2], status: ccgxkObj.positionsStatus[p_offset + 7]
                })});
            }
            if (ccgxkObj.physicsProps && hotIndex >= 0) {
                sections.push({ label: '尺寸/物理', data: g.formatJSON({
                    mass: ccgxkObj.physicsProps[p_offset], width: ccgxkObj.physicsProps[p_offset + 1],
                    height: ccgxkObj.physicsProps[p_offset + 2], depth: ccgxkObj.physicsProps[p_offset + 3],
                    DPZ: ccgxkObj.physicsProps[p_offset + 4]
                })});
            }
            return sections.map(s => `<div style="margin-bottom:10px"><div style="font-size:12px;color:#888;font-weight:bold">${s.label}</div><pre style="font-size:11px;background:rgba(0,0,0,0.05);padding:6px;border-radius:4px;overflow:auto;max-height:120px;color:#333;margin:4px 0">${s.data}</pre></div>`).join('');
        },

        formatJSON(obj) {
            try { return JSON.stringify(obj, null, 2); }
            catch (e) { return String(obj); }
        },

        hidePanel() {
            const modal = document.getElementById('signPanelModal');
            const backdrop = document.getElementById('signPanelBackdrop');
            if (modal) modal.hidden = true;
            if (backdrop) backdrop.hidden = true;
            g.isPanelVisible = false;
            g.currentHotIndex = -1;
            g.currentBoardId = null;

            ccgxkObj.drawPointPause = false;
            g.lockPointer();
        },

        togglePanel(hotIndex) {
            if (g.isPanelVisible) g.hidePanel();
            else g.showPanel(hotIndex);
        }
    };

    ccgxkObj.signPanel = {
        show: g.showPanel,
        hide: g.hidePanel,
        toggle: g.togglePanel,
        init: g.initHTML
    };
}
