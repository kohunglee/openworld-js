/**
 * 服务器配置模块
 * ========
 * 管理服务器地址设置，存储到 localStorage
 */

const STORAGE_KEY = 'signboard_server_address';
const DEFAULT_ADDRESS = 'http://127.0.0.1:8899';

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

/**
 * 初始化服务器配置 UI
 * @param {Function} $ - document.getElementById 快捷方式
 * @param {Function} onAddressChange - 地址变更回调（可选）
 */
export function initServerConfig($, onAddressChange) {
    const input = $('serverAddressInput');
    const saveBtn = $('serverAddressSave');
    const resetBtn = $('serverAddressReset');

    if (!input || !saveBtn || !resetBtn) return;

    // 初始化显示当前地址
    input.value = getServerAddress();

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
        if (onAddressChange) onAddressChange(address);
    });

    // 默认按钮
    resetBtn.addEventListener('click', () => {
        const defaultAddr = resetServerAddress();
        input.value = defaultAddr;
        if (onAddressChange) onAddressChange(defaultAddr);
    });
}
