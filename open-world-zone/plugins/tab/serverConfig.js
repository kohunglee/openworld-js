/**
 * 服务器配置模块
 * ========
 * 管理服务器地址设置，存储到 localStorage
 */

const STORAGE_KEY = 'signboard_server_address';
const DEFAULT_ADDRESS = 'https://selfdb.ccgxk.com';

/**
 * 获取当前服务器地址
 */
export function getServerAddress() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored || DEFAULT_ADDRESS;
}

/**
 * 保存服务器地址
 */
export function saveServerAddress(address) {
    localStorage.setItem(STORAGE_KEY, address);
}

/**
 * 重置为默认地址
 */
export function resetServerAddress() {
    localStorage.setItem(STORAGE_KEY, DEFAULT_ADDRESS);
    return DEFAULT_ADDRESS;
}

/**
 * 获取默认地址
 */
export function getDefaultAddress() {
    return DEFAULT_ADDRESS;
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
            online: { text: '信息板服务器已连接', color: '#15803d' },
            offline: { text: `信息板服务器未连接，已暂停自动重试${pending ? `（待加载 ${pending} 块）` : ''}`, color: '#b91c1c' },
            connecting: { text: '正在重新连接信息板服务器...', color: '#92400e' },
            idle: { text: '信息板服务器未请求', color: '#64748b' },
            unknown: { text: '信息板服务器状态待检测', color: '#64748b' }
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
        const address = input.value.trim();
        if (!address) {
            alert('服务器地址不能为空');
            input.value = getServerAddress();
            return;
        }
        saveServerAddress(address);
        alert('已保存: ' + address);
        renderStatus({ status: 'idle' });
        if (onAddressChange) onAddressChange(address);
    });

    // 默认按钮
    resetBtn.addEventListener('click', () => {
        const defaultAddr = resetServerAddress();
        input.value = defaultAddr;
        renderStatus({ status: 'idle' });
        if (onAddressChange) onAddressChange(defaultAddr);
    });

    retryBtn?.addEventListener('click', () => {
        renderStatus({ status: 'connecting' });
        const pending = window.signboardServerStatus?.pending || 0;
        if (typeof window.retrySignboardLazyLoad === 'function') {
            window.retrySignboardLazyLoad();
        }
        if (!pending) testServerConnection(input.value.trim()); // 没有待加载画板时，重试按钮才单独测一次连接
    });
}
