/**
 * 地址收藏与一键到达
 * ==================
 * 这个模块专门服务 Tab 侧栏里的地点收藏：
 * - 收藏以当前 World API 为分区，不同服务器不会混在一起
 * - 保存当前位置只需要点一次，不强制用户先输入名字
 * - 点击收藏按钮会立刻传送到目标位置，并交给 Tab 收起面板
 */

import { getServerAddress } from './serverConfig.js';

const STORAGE_PREFIX = 'openworld_tab_address_favorites:';
const STYLE_ID = 'addressFavoritesStyle';
const MAX_FAVORITES = 12;

/**
 * 给地址收藏模块注入自己的样式。
 * 样式留在模块里，tab.js 只保留挂载点，避免继续把 Tab 主文件撑大。
 */
function ensureAddressFavoritesStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
    .address-favorite-server {
        max-width: 100%;
        margin-bottom: 8px;
        padding: 4px 8px;
        border-radius: 4px;
        background: rgba(0, 0, 0, 0.05);
        color: #111;
        font-family: monospace;
        font-size: 11px;
        line-height: 1.35;
        overflow-wrap: anywhere;
    }

    .address-favorite-tools {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
    }

    .address-favorite-name {
        flex: 1;
        min-width: 0;
        height: 32px;
        padding: 5px 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 13px;
    }

    .address-favorite-save {
        min-width: 112px;
        height: 32px;
        white-space: nowrap;
    }

    .address-favorite-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin: 8px 0;
    }

    .address-favorite-item {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 30px;
        gap: 6px;
        min-height: 34px;
    }

    .address-favorite-chip {
        display: flex;
        align-items: center;
        min-width: 0;
        min-height: 34px;
        padding: 6px 9px;
        border: 1px solid rgba(0, 0, 0, 0.16);
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.72);
        color: #111;
        text-align: left;
    }

    .address-favorite-index {
        flex: 0 0 22px;
        width: 22px;
        height: 22px;
        margin-right: 8px;
        border-radius: 50%;
        background: #111;
        color: #fff;
        font-size: 12px;
        line-height: 22px;
        text-align: center;
    }

    .address-favorite-text {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .address-favorite-delete {
        width: 30px;
        min-width: 30px;
        min-height: 34px;
        padding: 0;
        border: 1px solid rgba(0, 0, 0, 0.14);
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.58);
        color: #333;
        font-size: 15px;
        line-height: 1;
    }

    .address-favorite-empty {
        padding: 6px 0;
        color: #333;
        font-size: 12px;
    }
    `;
    document.head.appendChild(style);
}

/**
 * 把地址收藏 UI 挂到 Tab 面板里。
 * 这里集中创建 HTML，避免 tab.js 关心每个输入框和列表容器的细节。
 */
function mountAddressFavorites($) {
    const mount = $('addressFavoritesMount');
    if (!mount) return null;

    mount.innerHTML = `
        <h3>Places</h3>
        <div id="addressFavoriteServer" class="address-favorite-server">World: loading</div>
        <div class="address-favorite-tools">
            <input type="text" id="addressFavoriteName" class="address-favorite-name" maxlength="28" placeholder="Optional name">
            <button id="addressFavoriteSave" class="tab-btn-md address-favorite-save">Save Here</button>
        </div>
        <div id="addressFavoriteList" class="address-favorite-list"></div>
        <div id="addressFavoriteStatus" class="tab-note tab-note-mb8">Places are saved for this World API only.</div>
        <hr>
    `;

    return {
        serverEl: $('addressFavoriteServer'),
        nameInput: $('addressFavoriteName'),
        saveBtn: $('addressFavoriteSave'),
        listEl: $('addressFavoriteList'),
        statusEl: $('addressFavoriteStatus'),
    };
}

/**
 * 判断数字是否可安全用于坐标。
 * 任何 NaN / Infinity 都不能进收藏，避免之后一键传送炸位置。
 */
function isValidNum(num) {
    return typeof num === 'number' && Number.isFinite(num);
}

/**
 * 统一把坐标压成短数字。
 * 收藏不需要十几位小数，短一点更容易看，也更适合按钮展示。
 */
function roundCoord(num) {
    return Math.round(num * 100) / 100;
}

/**
 * 当前服务器对应的 localStorage key。
 * 注意：这里以 getServerAddress() 的规范化结果为准，确保服务器不同收藏也不同。
 */
function getStorageKey() {
    return STORAGE_PREFIX + encodeURIComponent(getServerAddress());
}

/**
 * 从当前角色物理体读取位置快照。
 * 这里直接取 mainVPlayer.body.position，保证保存的是用户此刻站着的位置。
 */
function readCurrentPose(ccgxkObj) {
    const mvp = ccgxkObj?.mainVPlayer;
    const pos = mvp?.body?.position;
    if (!pos || !isValidNum(pos.x) || !isValidNum(pos.y) || !isValidNum(pos.z)) return null;

    return {
        x: roundCoord(pos.x),
        y: roundCoord(pos.y),
        z: roundCoord(pos.z),
        rX: isValidNum(mvp?.rX) ? roundCoord(mvp.rX) : 0,
        rY: isValidNum(ccgxkObj?.keys?.turnRight) ? roundCoord(ccgxkObj.keys.turnRight) : 0,
        rZ: isValidNum(mvp?.rZ) ? roundCoord(mvp.rZ) : 0,
    };
}

/**
 * 校验一条收藏记录。
 * localStorage 可能被手动改坏，所以读取时必须做一次轻量清洗。
 */
function normalizeFavorite(raw) {
    if (!raw || !raw.pose) return null;
    const pose = raw.pose;
    if (!isValidNum(pose.x) || !isValidNum(pose.y) || !isValidNum(pose.z)) return null;

    return {
        id: String(raw.id || Date.now()),
        label: String(raw.label || 'Point').trim().slice(0, 28) || 'Point',
        pose: {
            x: roundCoord(pose.x),
            y: roundCoord(pose.y),
            z: roundCoord(pose.z),
            rX: isValidNum(pose.rX) ? roundCoord(pose.rX) : 0,
            rY: isValidNum(pose.rY) ? roundCoord(pose.rY) : 0,
            rZ: isValidNum(pose.rZ) ? roundCoord(pose.rZ) : 0,
        },
        createdAt: Number.isFinite(raw.createdAt) ? raw.createdAt : Date.now(),
    };
}

/**
 * 读取当前服务器分区下的收藏列表。
 * 解析失败时直接回到空列表，避免坏数据阻塞 Tab 面板。
 */
function readFavorites() {
    try {
        const parsed = JSON.parse(localStorage.getItem(getStorageKey()) || '[]');
        if (!Array.isArray(parsed)) return [];
        return parsed.map(normalizeFavorite).filter(Boolean).slice(0, MAX_FAVORITES);
    } catch (error) {
        console.warn('[addressFavorites] read failed:', error);
        return [];
    }
}

/**
 * 保存当前服务器分区下的收藏列表。
 */
function saveFavorites(favorites) {
    localStorage.setItem(getStorageKey(), JSON.stringify(favorites.slice(0, MAX_FAVORITES)));
}

/**
 * 生成默认收藏名。
 * 用户不输入也能一键保存，名字里带简短坐标，后面更容易认出来。
 */
function makeDefaultLabel(favorites, pose) {
    return `P${favorites.length + 1} ${pose.x},${pose.y},${pose.z}`;
}

/**
 * 生成收藏 id。
 * 用时间 + 随机短串，足够应对本地按钮列表的增删。
 */
function makeFavoriteId() {
    return `place_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * 把角色传送到收藏位置。
 * 同时清空速度和受力，避免刚落点后继续沿着旧速度飞出去。
 */
function teleportToPose(ccgxkObj, pose) {
    const mvp = ccgxkObj?.mainVPlayer;
    const body = mvp?.body;
    if (!body || !pose) return false;

    body.position.set(pose.x, pose.y, pose.z);
    body.velocity?.set?.(0, 0, 0);
    body.angularVelocity?.set?.(0, 0, 0);
    body.force?.set?.(0, 0, 0);
    body.torque?.set?.(0, 0, 0);

    if (isValidNum(pose.rY) && ccgxkObj?.keys) ccgxkObj.keys.turnRight = pose.rY;
    if (isValidNum(pose.rX)) mvp.rX = pose.rX;
    if (isValidNum(pose.rZ)) mvp.rZ = pose.rZ;
    ccgxkObj.lastPos = { ...pose };
    return true;
}

/**
 * 生成一行可点击收藏。
 * 主按钮负责一键到达，小 x 负责一键删除，尽量减少用户鼠标操作。
 */
function createFavoriteRow(favorite, index, onGo, onDelete) {
    const row = document.createElement('div');
    row.className = 'address-favorite-item';

    const goBtn = document.createElement('button');
    goBtn.type = 'button';
    goBtn.className = 'address-favorite-chip';
    goBtn.title = `Go: ${favorite.pose.x}, ${favorite.pose.y}, ${favorite.pose.z}`;

    const badge = document.createElement('span');
    badge.className = 'address-favorite-index';
    badge.textContent = String(index + 1);

    const text = document.createElement('span');
    text.className = 'address-favorite-text';
    text.textContent = favorite.label;

    goBtn.append(badge, text);
    goBtn.addEventListener('click', () => onGo(favorite));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'address-favorite-delete';
    deleteBtn.title = 'Delete';
    deleteBtn.textContent = 'x';
    deleteBtn.addEventListener('click', () => onDelete(favorite.id));

    row.append(goBtn, deleteBtn);
    return row;
}

/**
 * 初始化地址收藏 UI。
 * @param {Function} $ - document.getElementById 快捷函数
 * @param {Object} ccgxkObj - openworld 主对象
 * @param {Object} options - Tab 层回调
 * @param {Function} [options.onArrive] - 到达后收起 Tab / 锁鼠标
 */
export function initAddressFavorites($, ccgxkObj, options = {}) {
    ensureAddressFavoritesStyle();
    const elements = mountAddressFavorites($);
    if (!elements) return;

    const { serverEl, nameInput, saveBtn, listEl, statusEl } = elements;
    const onArrive = typeof options.onArrive === 'function' ? options.onArrive : null;

    if (!serverEl || !nameInput || !saveBtn || !listEl) return;

    /**
     * 显示一个短状态。
     * 只做轻反馈，不弹窗，减少用户被迫点击确认的次数。
     */
    function setStatus(text) {
        if (!statusEl) return;
        statusEl.textContent = text;
    }

    /**
     * 重绘当前服务器的收藏列表。
     * 每次都从本服务器 key 读取，确保 UI 和隔离规则保持一致。
     */
    function render() {
        const favorites = readFavorites();
        serverEl.textContent = `World: ${getServerAddress()}`;
        listEl.innerHTML = '';

        if (favorites.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'address-favorite-empty';
            empty.textContent = 'No saved places yet.';
            listEl.appendChild(empty);
            return;
        }

        favorites.forEach((favorite, index) => {
            listEl.appendChild(createFavoriteRow(
                favorite,
                index,
                item => {
                    if (!teleportToPose(ccgxkObj, item.pose)) {
                        setStatus('Player is not ready yet.');
                        return;
                    }
                    setStatus(`Arrived: ${item.label}`);
                    onArrive?.(item);
                },
                favoriteId => {
                    const nextFavorites = readFavorites().filter(item => item.id !== favoriteId);
                    saveFavorites(nextFavorites);
                    setStatus('Deleted.');
                    render();
                },
            ));
        });
    }

    /**
     * 保存当前位置。
     * 输入框只是可选项，空着也会自动生成好认的短名字。
     */
    function saveCurrentPlace() {
        const pose = readCurrentPose(ccgxkObj);
        if (!pose) {
            setStatus('Player is not ready yet.');
            return;
        }

        const favorites = readFavorites();
        const customLabel = nameInput.value.trim().slice(0, 28);
        const favorite = {
            id: makeFavoriteId(),
            label: customLabel || makeDefaultLabel(favorites, pose),
            pose,
            createdAt: Date.now(),
        };

        saveFavorites([favorite, ...favorites].slice(0, MAX_FAVORITES));
        nameInput.value = '';
        setStatus(`Saved: ${favorite.label}`);
        render();
    }

    saveBtn.addEventListener('click', saveCurrentPlace);
    nameInput.addEventListener('keydown', event => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
            event.preventDefault();
            saveCurrentPlace();
            return;
        }

        if (event.key !== 'Enter') return;
        event.preventDefault();
        saveCurrentPlace();
    });

    render();
}
