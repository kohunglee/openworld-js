/**
 * 信息板编辑面板
 * ========
 * 可拖动的 HUD 窗口，用于编辑画板内容
 */

import { signContentMap, signIndexMap } from './store.js';

export default function(ccgxkObj) {
    const g = {
        // 面板是否已初始化
        panelInitialized: false,

        // 当前面板是否显示
        isPanelVisible: false,

        // 当前选中的热点 index
        currentHotIndex: -1,

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
                /* 信息板编辑面板背景层 - 点击可关闭 */
                .sign-panel-backdrop {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    z-index: 999;
                    cursor: pointer;
                }
                /* 信息板编辑面板 */
                .sign-panel-modal {
                    position: fixed;
                    z-index: 1000;
                }
                .sign-panel-box {
                    width: 400px;
                    max-height: 80vh;
                    background-color: rgba(255, 255, 255, 0.85);
                    backdrop-filter: blur(4px);
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                /* 面板头部 - 可拖动 */
                .sign-panel-header {
                    background-color: rgba(60, 60, 60, 0.9);
                    color: #fff;
                    padding: 10px 15px;
                    cursor: move;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    user-select: none;
                }
                .sign-panel-title {
                    font-size: 14px;
                    font-weight: bold;
                }
                .sign-panel-close {
                    background: transparent;
                    border: none;
                    color: #fff;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 0 5px;
                    line-height: 1;
                }
                .sign-panel-close:hover {
                    color: #ff6b6b;
                }
                /* 面板内容区 */
                .sign-panel-content {
                    padding: 15px;
                    overflow-y: auto;
                    flex: 1;
                    color: #333;
                }
                /* 信息区块 */
                .sign-info-section {
                    margin-bottom: 12px;
                    border-bottom: 1px solid rgba(0,0,0,0.1);
                    padding-bottom: 10px;
                }
                .sign-info-section:last-child {
                    border-bottom: none;
                    margin-bottom: 0;
                }
                .sign-info-label {
                    font-size: 12px;
                    color: #666;
                    font-weight: bold;
                    margin-bottom: 4px;
                }
                .sign-info-data {
                    font-size: 12px;
                    font-family: 'Monaco', 'Menlo', monospace;
                    white-space: pre-wrap;
                    word-break: break-all;
                    background: rgba(0,0,0,0.05);
                    padding: 8px;
                    border-radius: 4px;
                    line-height: 1.5;
                    max-height: 150px;
                    overflow-y: auto;
                }
            </style>
            <div id="signPanelBackdrop" class="sign-panel-backdrop" hidden></div>
            <div id="signPanelModal" class="sign-panel-modal" hidden>
                <div class="sign-panel-box" id="signPanelBox">
                    <div class="sign-panel-header" id="signPanelHeader">
                        <span class="sign-panel-title">信息板编辑</span>
                        <button class="sign-panel-close" id="signPanelClose">&times;</button>
                    </div>
                    <div class="sign-panel-content" id="signPanelContent">
                        <!-- 动态填充热点信息 -->
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
                // 先固定当前位置为像素值，移除 transform
                modal.style.left = rect.left + 'px';
                modal.style.top = rect.top + 'px';
                modal.style.transform = 'none';
                // 计算鼠标在面板内的偏移
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

        // 显示面板
        showPanel(hotIndex) {
            let modal = document.getElementById('signPanelModal');
            let backdrop = document.getElementById('signPanelBackdrop');
            const contentDiv = document.getElementById('signPanelContent');

            if (!modal || !backdrop) {
                g.initHTML();
                return g.showPanel(hotIndex);
            }

            g.currentHotIndex = hotIndex;

            // 收集热点信息并渲染
            const infoHtml = g.collectHotInfo(hotIndex);
            if (contentDiv) {
                contentDiv.innerHTML = infoHtml;
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
        },

        // 收集热点信息，生成 HTML
        collectHotInfo(hotIndex) {
            const sections = [];

            // 1. 基础热点信息
            sections.push({
                label: '热点 Index',
                data: hotIndex
            });

            // 2. indexToArgs（openworld 档案）
            const args = ccgxkObj.indexToArgs.get(hotIndex);
            if (args) {
                // 过滤掉不需要显示的字段
                const filteredArgs = {};
                for (const [key, value] of Object.entries(args)) {
                    if (typeof value !== 'function' && key !== 'deleteFunc') {
                        filteredArgs[key] = value;
                    }
                }
                sections.push({
                    label: 'Openworld 档案',
                    data: g.formatJSON(filteredArgs)
                });
            }

            // 3. W 引擎信息
            const wNode = ccgxkObj.W.next['T' + hotIndex];
            if (wNode) {
                const wInfo = {
                    name: wNode.name || ('T' + hotIndex),
                    hidden: wNode.hidden,
                    // 其他可能的属性
                };
                // 尝试获取更多 W 信息
                if (wNode.position) wInfo.position = wNode.position;
                if (wNode.rotation) wInfo.rotation = wNode.rotation;
                if (wNode.scale) wInfo.scale = wNode.scale;
                sections.push({
                    label: 'W 引擎对象',
                    data: g.formatJSON(wInfo)
                });
            }

            // 4. 画板内容信息（从 signIndexMap 反向查找 id）
            let boardId = null;
            for (const [id, data] of signIndexMap.entries()) {
                if (data.index === hotIndex) {
                    boardId = id;
                    break;
                }
            }

            if (boardId) {
                sections.push({
                    label: '画板 ID',
                    data: boardId
                });

                const content = signContentMap.get(boardId);
                if (content) {
                    sections.push({
                        label: '画板内容',
                        data: g.formatJSON(content)
                    });
                }
            }

            // 5. 物理属性（从 TA 数组读取）
            const p_offset = hotIndex * 8;
            if (ccgxkObj.positionsStatus && hotIndex >= 0) {
                const posInfo = {
                    x: ccgxkObj.positionsStatus[p_offset],
                    y: ccgxkObj.positionsStatus[p_offset + 1],
                    z: ccgxkObj.positionsStatus[p_offset + 2],
                    qx: ccgxkObj.positionsStatus[p_offset + 3],
                    qy: ccgxkObj.positionsStatus[p_offset + 4],
                    qz: ccgxkObj.positionsStatus[p_offset + 5],
                    qw: ccgxkObj.positionsStatus[p_offset + 6],
                    status: ccgxkObj.positionsStatus[p_offset + 7]
                };
                sections.push({
                    label: '位置/状态',
                    data: g.formatJSON(posInfo)
                });
            }

            if (ccgxkObj.physicsProps && hotIndex >= 0) {
                const physInfo = {
                    mass: ccgxkObj.physicsProps[p_offset],
                    width: ccgxkObj.physicsProps[p_offset + 1],
                    height: ccgxkObj.physicsProps[p_offset + 2],
                    depth: ccgxkObj.physicsProps[p_offset + 3],
                    DPZ: ccgxkObj.physicsProps[p_offset + 4]
                };
                sections.push({
                    label: '尺寸/物理',
                    data: g.formatJSON(physInfo)
                });
            }

            // 渲染成 HTML
            return sections.map(s => `
                <div class="sign-info-section">
                    <div class="sign-info-label">${s.label}</div>
                    <div class="sign-info-data">${s.data}</div>
                </div>
            `).join('');
        },

        // 格式化 JSON 为文本（更省 token）
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
            if (modal) {
                modal.hidden = true;
            }
            if (backdrop) {
                backdrop.hidden = true;
            }
            g.isPanelVisible = false;
            g.currentHotIndex = -1;

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
