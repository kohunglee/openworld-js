/**
 * 服务器配置模块
 * ========
 * 管理服务器地址设置，存储到 localStorage
 */

import { normalizeApiBase } from '../signboard_lab/config.js';

const STORAGE_KEY = 'signboard_server_address';
const DEFAULT_ADDRESS = 'https://openworld.zone/owz-serverapi';

/**
 * 获取当前服务器地址
 */
export function getServerAddress() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return normalizeApiBase(stored || DEFAULT_ADDRESS);
}

/**
 * 保存服务器地址
 */
export function saveServerAddress(address) {
    localStorage.setItem(STORAGE_KEY, normalizeApiBase(address));
}

/**
 * 重置为默认地址
 */
export function resetServerAddress() {
    const normalized = normalizeApiBase(DEFAULT_ADDRESS);
    localStorage.setItem(STORAGE_KEY, normalized);
    return normalized;
}

/**
 * 获取默认地址
 */
export function getDefaultAddress() {
    return normalizeApiBase(DEFAULT_ADDRESS);
}

function emitServerStatus(status, detail = {}) {
    const payload = { status, time: Date.now(), ...detail };
    window.signboardServerStatus = payload;
    window.dispatchEvent(new CustomEvent('signboard:server-status', { detail: payload }));
}

async function testServerConnection(address) {
    const apiBase = address || getServerAddress();
    emitServerStatus('connecting');
    try {
        const res = await fetch(`${apiBase}/api/signs`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        emitServerStatus('online');
    } catch (e) {
        emitServerStatus('offline', { message: e.message });
    }
}

/**
 * 初始化服务器配置 UI
 * @param {Function} $ - document.getElementById 快捷方式
 * @param {Function} onAddressChange - 地址变更回调（可选）
 */
export function initServerConfig($, onAddressChange) {
    const input = $('serverAddressInput');
    const saveBtn = $('serverAddressSave');
    const resetBtn = $('serverAddressReset');
    const retryBtn = $('serverAddressRetry');
    const statusText = $('serverStatusText');

    if (!input || !saveBtn || !resetBtn) return;

    // 初始化显示当前地址
    input.value = getServerAddress();

    /**
     * 更新 Tab 侧栏里的服务器状态提示。
     */
    function renderStatus(detail = window.signboardServerStatus || { status: 'unknown' }) {
        const status = detail.status || 'unknown';
        const pending = detail.pending || 0;
        const statusMap = {
            online: { text: '信息面板已连接', color: '#000' },
            offline: { text: `信息面板离线，重试已暂停${pending ? `（待处理 ${pending}）` : ''}`, color: '#000' },
            connecting: { text: '正在重新连接信息面板...', color: '#000' },
            idle: { text: '信息面板空闲中', color: '#000' },
            unknown: { text: '正在检查信息面板连接...', color: '#000' }
        };
        const info = statusMap[status] || statusMap.unknown;

        if (statusText) {
            statusText.textContent = info.text;
            statusText.style.color = info.color;
        }
        if (retryBtn) retryBtn.disabled = status === 'connecting';
    }

    renderStatus();
    window.addEventListener('signboard:server-status', e => renderStatus(e.detail));

    // 保存按钮
    saveBtn.addEventListener('click', () => {
        const address = normalizeApiBase(input.value);
        if (!address) {
            alert('服务器地址不能为空');
            input.value = getServerAddress();
            return;
        }
        saveServerAddress(address);
        renderStatus({ status: 'idle' });
        if (onAddressChange) onAddressChange(address);
        window.location.reload();
    });

    // 默认按钮
    resetBtn.addEventListener('click', () => {
        const defaultAddr = resetServerAddress();
        input.value = defaultAddr;
        renderStatus({ status: 'idle' });
        if (onAddressChange) onAddressChange(defaultAddr);
        window.location.reload();
    });

    retryBtn?.addEventListener('click', () => {
        renderStatus({ status: 'connecting' });
        const pending = window.signboardServerStatus?.pending || 0;
        if (typeof window.retrySignboardLazyLoad === 'function') {
            window.retrySignboardLazyLoad();
        }
        if (!pending) testServerConnection(normalizeApiBase(input.value)); // 没有待加载画板时，重试按钮才单独测一次连接
    });
}
