/**
 * 信息板编辑面板
 * ========
 * 可拖动的 HUD 窗口，用于编辑画板内容
 */

import { signContentMap, signIndexMap } from './store.js';
import { API_BASE } from './config.js';

export default function(ccgxkObj) {
    const g = {
        // 面板是否已初始化
        panelInitialized: false,

        // 当前面板是否显示
        isPanelVisible: false,

        // 当前选中的热点 index
        currentHotIndex: -1,

        // 当前画板 ID
        currentBoardId: null,

        // 快捷键监听器引用（用于卸载）
        _keyHandler: null,

        // 解锁鼠标
        unlockPointer() {
            if ('pointerLockElement' in document ||
                'mozPointerLockElement' in document ||
                'webkitPointerLockElement' in document) {
                const exitLock = document.exitPointerLock ||
                                 document.mozExitPointerLock ||
                                 document.webkitExitPointerLock;
                if (exitLock) {
                    exitLock.call(document);
                }
            }
        },

        // 锁定鼠标
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
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
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
                .sign-panel-title {
                    font-size: 13px;
                    font-weight: bold;
                }
                .sign-panel-title-id {
                    font-size: 11px;
                    color: #bbb;
                    margin-left: 8px;
                    font-weight: normal;
                }
                .sign-panel-close {
                    background: transparent;
                    border: none;
                    color: #ddd;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 0 5px;
                    line-height: 1;
                }
                .sign-panel-close:hover {
                    color: #ff6b6b;
                }
                .sign-panel-content {
                    padding: 12px 14px;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                .sign-panel-textarea {
                    flex: 1;
                    width: 100%;
                    resize: none;
                    background: #fafafa;
                    border: 1px solid #ddd;
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
                    border-color: #4a9eff;
                    background: #fff;
                }
                .sign-panel-footer {
                    padding: 10px 14px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-top: 1px solid #eee;
                }
                .sign-panel-status {
                    font-size: 11px;
                    color: #999;
                }
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
                .sign-save-hint {
                    font-size: 10px;
                    color: #aaa;
                    margin-left: 8px;
                }
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
                    <div class="sign-panel-content">
                        <textarea class="sign-panel-textarea" id="signPanelTextarea"
                            placeholder="输入画板文字内容..."></textarea>
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

        // 初始化 HTML 到页面
        initHTML() {
            if (g.panelInitialized) return;
            const template = document.createElement('template');
            template.innerHTML = g.htmlCode;
            const content = template.content.cloneNode(true);
            document.body.appendChild(content);
            g.panelInitialized = true;
            g.bindEvents();
        },

        // 绑定事件
        bindEvents() {
            // 关闭按钮
            const closeBtn = document.getElementById('signPanelClose');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    g.hidePanel();
                });
            }

            // 点击背景关闭
            const backdrop = document.getElementById('signPanelBackdrop');
            if (backdrop) {
                backdrop.addEventListener('click', () => {
                    g.hidePanel();
                });
            }

            // 保存按钮
            const saveBtn = document.getElementById('signPanelSave');
            if (saveBtn) {
                saveBtn.addEventListener('click', () => {
                    g.saveText();
                });
            }

            // Ctrl/Cmd + S 快捷键
            g._keyHandler = (e) => {
                if (!g.isPanelVisible) return;
                if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                    e.preventDefault();
                    g.saveText();
                }
            };
            document.addEventListener('keydown', g._keyHandler);

            // 拖动功能
            g.initDrag();
        },

        // 初始化拖动功能
        initDrag() {
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

            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                modal.style.left = (e.clientX - offsetX) + 'px';
                modal.style.top = (e.clientY - offsetY) + 'px';
            });

            document.addEventListener('mouseup', () => {
                isDragging = false;
            });
        },

        // 通过 hotIndex 反查画板 ID
        findBoardId(hotIndex) {
            for (const [id, data] of signIndexMap.entries()) {
                if (data.index === hotIndex) {
                    return id;
                }
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

            // 查找画板 ID
            const boardId = g.findBoardId(hotIndex);
            g.currentBoardId = boardId;

            // 更新标题中的 ID 显示
            const idSpan = document.getElementById('signPanelBoardId');
            if (idSpan) {
                idSpan.textContent = boardId ? `#${boardId}` : '(未注册画板)';
            }

            // 填充文字内容
            const textarea = document.getElementById('signPanelTextarea');
            if (textarea) {
                let textContent = '';
                if (boardId) {
                    const info = signContentMap.get(boardId);
                    if (info && info.mode === 'text') {
                        textContent = info.t || '';
                    }
                }
                textarea.value = textContent;
            }

            // 清空状态
            const status = document.getElementById('signPanelStatus');
            if (status) {
                status.textContent = '';
                status.className = 'sign-panel-status';
            }

            // 重置位置到屏幕中心
            modal.style.left = '50%';
            modal.style.top = '50%';
            modal.style.transform = 'translate(-50%, -50%)';

            // 解锁鼠标 + 暂停绘制中心点
            g.unlockPointer();
            ccgxkObj.drawPointPause = true;

            backdrop.hidden = false;
            modal.hidden = false;
            g.isPanelVisible = true;

            // 聚焦文本域
            if (textarea) {
                textarea.focus();
            }
        },

        // 保存文字到数据库
        async saveText() {
            const textarea = document.getElementById('signPanelTextarea');
            const status = document.getElementById('signPanelStatus');
            const saveBtn = document.getElementById('signPanelSave');

            if (!textarea || !g.currentBoardId) {
                if (status) {
                    status.textContent = '无画板 ID，无法保存';
                    status.className = 'sign-panel-status error';
                }
                return;
            }

            const newText = textarea.value;

            if (status) {
                status.textContent = '保存中...';
                status.className = 'sign-panel-status saving';
            }
            if (saveBtn) saveBtn.disabled = true;

            try {
                // 单条 PATCH 更新，不碰 signContentMap，让 SSE 回环触发画布刷新
                const res = await fetch(`${API_BASE}/api/signs/${encodeURIComponent(g.currentBoardId)}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mode: 'text', content: newText })
                });
                if (!res.ok) throw new Error('保存失败');

                if (status) {
                    status.textContent = '已保存';
                    status.className = 'sign-panel-status saved';
                }
            } catch (e) {
                console.error('[signPanel] 保存失败:', e);
                alert('保存失败: ' + e.message + '\n你的文字还在文本框里，不会丢失。');
                if (status) {
                    status.textContent = '保存失败';
                    status.className = 'sign-panel-status error';
                }
            } finally {
                if (saveBtn) saveBtn.disabled = false;
            }
        },

        // 收集热点信息（保留，备用）
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
                if (content) {
                    sections.push({ label: '画板内容', data: g.formatJSON(content) });
                }
            }

            const p_offset = hotIndex * 8;
            if (ccgxkObj.positionsStatus && hotIndex >= 0) {
                sections.push({ label: '位置/状态', data: g.formatJSON({
                    x: ccgxkObj.positionsStatus[p_offset],
                    y: ccgxkObj.positionsStatus[p_offset + 1],
                    z: ccgxkObj.positionsStatus[p_offset + 2],
                    status: ccgxkObj.positionsStatus[p_offset + 7]
                })});
            }
            if (ccgxkObj.physicsProps && hotIndex >= 0) {
                sections.push({ label: '尺寸/物理', data: g.formatJSON({
                    mass: ccgxkObj.physicsProps[p_offset],
                    width: ccgxkObj.physicsProps[p_offset + 1],
                    height: ccgxkObj.physicsProps[p_offset + 2],
                    depth: ccgxkObj.physicsProps[p_offset + 3],
                    DPZ: ccgxkObj.physicsProps[p_offset + 4]
                })});
            }

            return sections.map(s => `<div style="margin-bottom:10px"><div style="font-size:12px;color:#888;font-weight:bold">${s.label}</div><pre style="font-size:11px;background:rgba(0,0,0,0.3);padding:6px;border-radius:4px;overflow:auto;max-height:120px;color:#ccc;margin:4px 0">${s.data}</pre></div>`).join('');
        },

        // 格式化 JSON 为文本
        formatJSON(obj) {
            try {
                return JSON.stringify(obj, null, 2);
            } catch (e) {
                return String(obj);
            }
        },

        // 隐藏面板
        hidePanel() {
            const modal = document.getElementById('signPanelModal');
            const backdrop = document.getElementById('signPanelBackdrop');
            if (modal) modal.hidden = true;
            if (backdrop) backdrop.hidden = true;
            g.isPanelVisible = false;
            g.currentHotIndex = -1;
            g.currentBoardId = null;

            // 恢复绘制 + 重新锁定鼠标
            ccgxkObj.drawPointPause = false;
            g.lockPointer();
        },

        // 切换面板显示
        togglePanel(hotIndex) {
            if (g.isPanelVisible) {
                g.hidePanel();
            } else {
                g.showPanel(hotIndex);
            }
        }
    };

    // 挂载到 ccgxkObj
    ccgxkObj.signPanel = {
        show: g.showPanel,
        hide: g.hidePanel,
        toggle: g.togglePanel,
        init: g.initHTML
    };
}
