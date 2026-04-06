/**
 * 热点信息显示模块
 * ========
 * 在 mode=1 时，在 pointObjIndex 下方显示画板热点信息
 * 点击可解锁鼠标，和 Panel 逻辑一致
 */

import { signContentMap, signIndexMap, lazyLoadSign } from './store.js';
import { getApiBase } from './config.js';

// 样式
const styleCode = `
#signHotInfoToggle {
    position: fixed;
    top: 50px;
    left: 60px;
    background: rgba(255, 255, 255, 0.85);
    border: 1px solid rgba(200, 200, 200, 0.6);
    border-radius: 6px;
    padding: 4px 10px;
    font-size: 12px;
    cursor: pointer;
    color: #555;
    z-index: 100;
    transition: all 0.2s;
}

#signHotInfoToggle:hover {
    background: rgba(255, 255, 255, 0.95);
    border-color: rgba(100, 160, 255, 0.6);
}

#signHotInfoToggle:active {
    transform: scale(0.95);
}

.sign-hot-info {
    position: fixed;
    top: 75px;
    left: 10px;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(200, 200, 200, 0.5);
    border-radius: 8px;
    padding: 8px 12px;
    min-width: 180px;
    max-width: 300px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 12px;
    color: #333;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    z-index: 100;
}

.sign-hot-info-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(200, 200, 200, 0.5);
}

.sign-hot-info-title {
    font-weight: 600;
    color: #555;
}

.sign-hot-info-body {
    display: block;
}

.sign-hot-info-body.collapsed {
    display: none;
}

.sign-hot-info-row {
    margin: 4px 0;
    line-height: 1.5;
}

.sign-hot-info-label {
    color: #888;
    font-size: 11px;
}

.sign-hot-info-value {
    color: #333;
    word-break: break-all;
}

.sign-hot-info-remark {
    background: rgba(255, 250, 220, 0.8);
    padding: 6px 8px;
    border-radius: 4px;
    margin-top: 6px;
    white-space: pre-wrap;
    max-height: 100px;
    overflow-y: auto;
}
`;

// HTML 模板
const htmlTemplate = `
<button id="signHotInfoToggle" style="display: none;">📋 画板信息</button>
<div id="signHotInfo" class="sign-hot-info" style="display: none;">
    <div class="sign-hot-info-header">
        <span class="sign-hot-info-title" id="signHotInfoTitle">画板信息</span>
    </div>
    <div class="sign-hot-info-body" id="signHotInfoBody">
        <div class="sign-hot-info-row">
            <span class="sign-hot-info-label">ID: </span>
            <span class="sign-hot-info-value" id="signHotInfoId">-</span>
        </div>
        <div class="sign-hot-info-row">
            <span class="sign-hot-info-label">类型: </span>
            <span class="sign-hot-info-value" id="signHotInfoMode">-</span>
        </div>
        <div class="sign-hot-info-row">
            <span class="sign-hot-info-label">更新: </span>
            <span class="sign-hot-info-value" id="signHotInfoDate">-</span>
        </div>
        <div class="sign-hot-info-remark" id="signHotInfoRemark" style="display: none;"></div>
    </div>
</div>
`;

let lastHotIndex = -1;
let isExpanded = true;
let ccgxkObjRef = null;
let boardsData = [];

/**
 * 解锁鼠标指针（和 Panel 完全一致）
 */
function unlockPointer() {
    const exitLock = document.exitPointerLock ||
        document.mozExitPointerLock ||
        document.webkitExitPointerLock;
    if (exitLock) exitLock.call(document);
}

/**
 * 根据 index 查找画板 ID
 */
function findBoardIdByIndex(hotIndex) {
    for (const [id, data] of signIndexMap.entries()) {
        if (data.index === hotIndex) return id;
    }
    return null;
}

/**
 * 更新热点信息显示
 */
function updateHotInfo(hotIndex) {
    const container = document.getElementById('signHotInfo');
    const idSpan = document.getElementById('signHotInfoId');
    const modeSpan = document.getElementById('signHotInfoMode');
    const dateSpan = document.getElementById('signHotInfoDate');
    const remarkDiv = document.getElementById('signHotInfoRemark');
    const titleSpan = document.getElementById('signHotInfoTitle');
    const bodyDiv = document.getElementById('signHotInfoBody');

    if (hotIndex < 0) {
        container.style.display = 'none';
        return;
    }

    const boardId = findBoardIdByIndex(hotIndex);
    if (!boardId) {
        container.style.display = 'none';
        return;
    }

    // 检查是否是画板热点
    const info = signContentMap.get(boardId);
    console.log('[HotInfo] boardId:', boardId, 'info:', info);
    if (!info) {
        // 尝试懒加载
        lazyLoadSign(boardId);
        container.style.display = 'none';
        return;
    }

    // 显示容器（如果展开）
    container.style.display = isExpanded ? 'block' : 'none';

    // 更新标题
    titleSpan.textContent = `画板: ${boardId}`;

    // 更新 ID
    idSpan.textContent = boardId;

    // 更新类型
    const modeText = info.mode === 'text' ? '文字' : info.mode === 'image' ? '图片' : info.mode;
    modeSpan.textContent = modeText;

    // 更新日期（从 boardsData 获取）
    const boardData = boardsData.find(b => b.id === boardId);
    if (boardData && boardData.updated_at) {
        const date = new Date(boardData.updated_at);
        dateSpan.textContent = date.toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } else {
        dateSpan.textContent = '-';
    }

    // 更新备注
    const remark = info.extra?.remark;
    console.log('[HotInfo] remark:', remark);
    if (remark) {
        remarkDiv.textContent = remark;
        remarkDiv.style.display = 'block';
    } else {
        remarkDiv.style.display = 'none';
    }
}

/**
 * 加载画板数据
 */
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
    const bodyDiv = document.getElementById('signHotInfoBody');

    // 点击按钮：解锁鼠标 + 切换展开状态
    toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        // 解锁鼠标（和 Panel 完全一致）
        unlockPointer();
        ccgxkObjRef.drawPointPause = true;

        // 切换展开状态
        isExpanded = !isExpanded;
        bodyDiv.classList.toggle('collapsed', !isExpanded);
        container.style.display = 'block';

        // 如果展开，更新当前热点信息
        if (isExpanded && ccgxkObjRef) {
            updateHotInfo(ccgxkObjRef.hotPoint);
        }
    });

    // 点击信息框也能解锁鼠标
    container.addEventListener('mousedown', () => {
        unlockPointer();
        if (ccgxkObjRef) {
            ccgxkObjRef.drawPointPause = true;
        }
    });

    // 初始加载画板数据
    loadBoardsData();

    // 定期检查热点变化
    setInterval(() => {
        // 只在 mode=1 时生效
        if (ccgxkObj.mode !== 1) {
            toggleBtn.style.display = 'none';
            container.style.display = 'none';
            return;
        }

        // 显示按钮
        toggleBtn.style.display = 'block';

        const hotIndex = ccgxkObj.hotPoint;
        if (hotIndex !== lastHotIndex) {
            lastHotIndex = hotIndex;
            if (isExpanded) {
                updateHotInfo(hotIndex);
            }
        }
    }, 100);

    // SSE 更新时重新加载数据
    const originalUpdateSign = window.updateSign;
    window.updateSign = function(boardId, content, mode, extra) {
        if (originalUpdateSign) {
            originalUpdateSign(boardId, content, mode, extra);
        }
        loadBoardsData();
    };
}
