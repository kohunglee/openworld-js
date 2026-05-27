/**
 * 服务器配置模块
 * ========
 * 管理服务器地址设置，存储到 localStorage
 */

import { normalizeApiBase } from '../signboard_lab/config.js';
import { readServerErrorMessage, getErrorMessage } from '../signboard_lab/errorMessage.js';

const STORAGE_KEY = 'signboard_server_address';
const SCENE_CONFIG_STORAGE_KEY = 'owz_scene_config_url';
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
 * 保存已验证过的世界总配置地址。
 * 注意：只有 `/scene-config` 请求成功后才能写入，避免下次打开直接进坏世界。
 */
function saveSceneConfigUrl(sceneConfigUrl) {
    localStorage.setItem(SCENE_CONFIG_STORAGE_KEY, sceneConfigUrl);
}

/**
 * 重置为默认地址
 */
export function resetServerAddress() {
    const normalized = normalizeApiBase(DEFAULT_ADDRESS);
    localStorage.setItem(STORAGE_KEY, normalized);
    localStorage.removeItem(SCENE_CONFIG_STORAGE_KEY);
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

/**
 * 从世界 API 根地址推导场景配置地址。
 * 前端不解析 slug，也不关心路径叫什么；只要求服务端遵守 `{apiBase}/scene-config` 协议。
 */
function getSceneConfigUrlFromApiBase(apiBase) {
    return `${normalizeApiBase(apiBase)}/scene-config`;
}

/**
 * 验证世界 API 是否真的能提供 scene-config。
 * 第一版 Save 必须先验证成功，再写 localStorage；失败时保持旧服务器不变。
 */
async function assertSceneConfigAvailable(apiBase) {
    const sceneConfigUrl = getSceneConfigUrlFromApiBase(apiBase);
    const res = await fetch(sceneConfigUrl, { cache: 'no-store' });

    if (!res.ok) {
        const message = await readServerErrorMessage(res);
        throw new Error(`Scene config unavailable: ${message}`);
    }

    const data = await res.json();
    const hasModels = data && typeof data.models === 'object' && data.models !== null;
    const hasBuildings = Array.isArray(data?.buildings);
    if (!hasModels || !hasBuildings) {
        throw new Error('Scene config format invalid: models/buildings missing.');
    }

    return sceneConfigUrl;
}

/**
 * 在即将刷新页面前，先把鼠标和页面交互态切到“加载中”，避免用户误以为没点上。
 */
function reloadWithProgressCursor() {
    document.body.style.setProperty('cursor', 'progress', 'important');
    document.documentElement.style.setProperty('cursor', 'progress', 'important');
    for (const el of document.querySelectorAll('*')) {
        el.style.setProperty('cursor', 'progress', 'important');
    }

    // 给浏览器一个极短的绘制窗口，确保用户能看到“正在加载”的鼠标状态。
    requestAnimationFrame(() => {
        setTimeout(() => {
            window.location.reload();
        }, 80);
    });
}

async function testServerConnection(address) {
    const apiBase = address || getServerAddress();
    emitServerStatus('connecting');
    try {
        const res = await fetch(`${apiBase}/api/signs`);
        if (!res.ok) {
            const message = await readServerErrorMessage(res);
            throw new Error(message);
        }
        emitServerStatus('online');
    } catch (e) {
        emitServerStatus('offline', { message: getErrorMessage(e) });
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
            online: { text: 'Signboard service connected', color: '#000' },
            offline: { text: detail.message || `World API unavailable${pending ? ` (pending ${pending})` : ''}`, color: '#000' },
            connecting: { text: 'Checking world API...', color: '#000' },
            idle: { text: 'Signboard service idle', color: '#000' },
            unknown: { text: 'Checking signboard service...', color: '#000' }
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

    // 保存按钮：先确认世界配置可读，再一次性切换“建筑世界 + 画板服务”。
    saveBtn.addEventListener('click', async () => {
        const address = normalizeApiBase(input.value);
        if (!address) {
            alert('Server address cannot be empty');
            input.value = getServerAddress();
            return;
        }

        saveBtn.disabled = true;
        renderStatus({ status: 'connecting' });
        try {
            const sceneConfigUrl = await assertSceneConfigAvailable(address);
            saveServerAddress(address);
            saveSceneConfigUrl(sceneConfigUrl);
            renderStatus({ status: 'idle' });
            if (onAddressChange) onAddressChange(address);
            reloadWithProgressCursor();
        } catch (error) {
            const message = getErrorMessage(error, 'World API unavailable.');
            renderStatus({ status: 'offline', message });
            alert(message);
            input.value = getServerAddress();
        } finally {
            saveBtn.disabled = false;
        }
    });

    // 默认按钮
    resetBtn.addEventListener('click', () => {
        const defaultAddr = resetServerAddress();
        input.value = defaultAddr;
        renderStatus({ status: 'idle' });
        if (onAddressChange) onAddressChange(defaultAddr);
        reloadWithProgressCursor();
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
