/**
 * 自动按距离裁剪 plane 渲染
 * ========
 * 每秒扫描一次所有 w 对象，只保留离主角最近的 N 个 plane 可见
 */

const STORAGE_KEY = 'tab_auto_w_plane_limit';
const DEFAULT_LIMIT = 90;
const TICK_MS = 100;

// 把外部传来的坐标/输入值兜底成有限数字，避免 NaN 搅乱排序
function toFiniteNumber(value, fallback = 0) {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
}

// 统一限制数量的合法性，负数或异常值都回退到默认值
function normalizeLimit(value) {
    const parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed < 0) return DEFAULT_LIMIT;
    return parsed;
}

// 读取当前保存的限制数量，页面初始化和定时器都会用到
export function getAutoWLimit() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return normalizeLimit(stored);
}

// 保存用户设置的限制数量，并立即返回规范化后的结果
export function saveAutoWLimit(limit) {
    const nextLimit = normalizeLimit(limit);
    localStorage.setItem(STORAGE_KEY, String(nextLimit));
    return nextLimit;
}

// 恢复默认限制数量
export function resetAutoWLimit() {
    localStorage.setItem(STORAGE_KEY, String(DEFAULT_LIMIT));
    return DEFAULT_LIMIT;
}

// 暴露默认值，给外部需要时直接取
export function getAutoWDefaultLimit() {
    return DEFAULT_LIMIT;
}

// 优先取主角对象上的坐标，没有的话再退回到物理 body.position
function getMainPlayerPosition(ccgxkObj) {
    const bodyPos = ccgxkObj?.mainVPlayer?.body?.position;
    return {
        x: toFiniteNumber(ccgxkObj?.mainVPlayer?.X ?? bodyPos?.x),
        y: toFiniteNumber(ccgxkObj?.mainVPlayer?.Y ?? bodyPos?.y),
        z: toFiniteNumber(ccgxkObj?.mainVPlayer?.Z ?? bodyPos?.z),
    };
}

// 从单个 w 对象里抽出可参与距离计算的位置
function getWPosition(wObj) {
    return {
        x: toFiniteNumber(wObj?.x),
        y: toFiniteNumber(wObj?.y),
        z: toFiniteNumber(wObj?.z),
    };
}

// 从形如 T10038 的名字里提取索引，再去 indexToArgs 里拿 dpz 优先级
function getPlaneDpz(ccgxkObj, name) {
    const index = parseInt(String(name).replace(/^T/, ''), 10);
    if (!Number.isFinite(index)) return Number.MAX_SAFE_INTEGER;
    const dpz = ccgxkObj?.indexToArgs?.get(index)?.dpz;
    return toFiniteNumber(dpz, Number.MAX_SAFE_INTEGER);
}

// 核心逻辑：先按 dpz 排序，再按距离排序，最后批量切 hidden
function updatePlaneVisibility(ccgxkObj, limit) {
    const nextMap = ccgxkObj?.W?.next;
    if (!nextMap || typeof nextMap !== 'object') return 0;

    const playerPos = getMainPlayerPosition(ccgxkObj);
    const planeList = Object.entries(nextMap)
        .filter(([, wObj]) => wObj?.type === 'plane')
        .map(([name, wObj]) => {
            const pos = getWPosition(wObj);
            const dx = pos.x - playerPos.x;
            const dy = pos.y - playerPos.y;
            const dz = pos.z - playerPos.z;
            return {
                name,
                dpz: getPlaneDpz(ccgxkObj, name),
                distanceSq: dx * dx + dy * dy + dz * dz,
            };
        })
        .sort((a, b) => {
            if (a.dpz !== b.dpz) return a.dpz - b.dpz;
            return a.distanceSq - b.distanceSq;
        });

    planeList.forEach((item, index) => {
        ccgxkObj.W.plane({ n: item.name, hidden: index >= limit });
    });
    return planeList.length;
}

/**
 * 初始化自动裁剪 UI 与定时任务
 * @param {Function} $ - document.getElementById 快捷方式
 * @param {Object} ccgxkObj - openworld 主对象
 */
export function initAutoW($, ccgxkObj) {
    const input = $('autoWLimitInput');
    const saveBtn = $('autoWLimitSave');
    const resetBtn = $('autoWLimitReset');
    const currentText = $('autoWCurrentText');

    let currentLimit = getAutoWLimit();

    if (input) input.value = String(currentLimit);

    // 统一刷新当前文字和 plane 显隐，避免按钮逻辑重复
    const applyNow = () => {
        const planeCount = updatePlaneVisibility(ccgxkObj, currentLimit);
        if (currentText) currentText.textContent = '当前的限制个数是 ' + currentLimit + '，当前 plane 总数是 ' + planeCount;
    };

    if (saveBtn && input) {
        saveBtn.addEventListener('click', () => {
            currentLimit = saveAutoWLimit(input.value);
            input.value = String(currentLimit);
            applyNow();
        });
    }

    if (resetBtn && input) {
        resetBtn.addEventListener('click', () => {
            currentLimit = resetAutoWLimit();
            input.value = String(currentLimit);
            applyNow();
        });
    }

    applyNow();
    window.setInterval(() => {
        currentLimit = getAutoWLimit();
        applyNow();
    }, TICK_MS);
}
