/**
 * 显示控制插件
 * ==================
 * 功能：
 * - 托管 Tab 面板里的 FOV 控制
 * - 新增固定档位清晰度切换，并立即作用到当前 canvas
 * - 使用 localStorage 记住用户上次选择，刷新后自动恢复
 */

const FOV_STORAGE_KEY = 'openworld_tab_fov';
const CLARITY_STORAGE_KEY = 'openworld_tab_clarity';
const DEFAULT_FOV = 60;
const FOV_SLIDER_MAX = 120;
const DEFAULT_CLARITY = 1;
const ALLOWED_CLARITY_VALUES = new Set(['0.05', '0.3', '0.5', '1']);

/**
 * 把滑杆值翻译成 FOV。
 * 这里保留原有“左大右小”的映射方式，避免用户现有手感变化。
 */
function sliderValueToFov(value) {
    return FOV_SLIDER_MAX + 1 - parseInt(value, 10);
}

/**
 * 把 FOV 翻译回滑杆值，便于初始化与重置按钮复用。
 */
function fovToSliderValue(fov) {
    return FOV_SLIDER_MAX + 1 - fov;
}

/**
 * 统一限制 FOV 合法范围，避免 localStorage 或手改 DOM 带来异常值。
 */
function normalizeFov(value) {
    const parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed)) return DEFAULT_FOV;
    return Math.min(FOV_SLIDER_MAX, Math.max(1, parsed));
}

/**
 * 读取保存的 FOV；如果没有保存过，就退回默认值。
 */
function readStoredFov() {
    return normalizeFov(localStorage.getItem(FOV_STORAGE_KEY));
}

/**
 * 保存 FOV，给刷新恢复用。
 */
function saveFov(fov) {
    localStorage.setItem(FOV_STORAGE_KEY, String(normalizeFov(fov)));
}

/**
 * 校验清晰度档位。
 * 只允许你指定的固定档位，其他值一律回退默认值。
 */
function normalizeClarity(value) {
    const text = String(value);
    if (!ALLOWED_CLARITY_VALUES.has(text)) return DEFAULT_CLARITY;
    return Number(text);
}

/**
 * 读取保存的清晰度档位。
 */
function readStoredClarity() {
    return normalizeClarity(localStorage.getItem(CLARITY_STORAGE_KEY));
}

/**
 * 保存清晰度档位，刷新后继续沿用。
 */
function saveClarity(clarity) {
    localStorage.setItem(CLARITY_STORAGE_KEY, String(normalizeClarity(clarity)));
}

/**
 * 把当前清晰度真正作用到 canvas。
 * 做法是直接改 canvas 真实像素尺寸，再调用引擎现成的 resetView 刷新视口。
 * 这样不用改 src，也能达到“点一下立即切换清晰度”的效果。
 */
function applyClarity(ccgxkObj, clarity) {
    const nextClarity = normalizeClarity(clarity);
    const canvas = ccgxkObj?.canvas;
    const wObj = ccgxkObj?.W;
    const currentFov = normalizeFov(ccgxkObj?.fov);

    if (!canvas) return nextClarity;

    ccgxkObj.displayViewTime = nextClarity;
    canvas.width = Math.max(1, Math.round(window.innerWidth * nextClarity));
    canvas.height = Math.max(1, Math.round(window.innerHeight * nextClarity));

    // resetView 依赖 W.next.camera 已经存在；初始化早期这个对象可能还没挂上。
    // 所以这里先判断相机状态，未就绪时手动刷新 viewport，并补一次相机参数。
    if (wObj?.next?.camera?.fov !== undefined) {
        wObj.resetView();
    } else if (wObj?.gl) {
        wObj.gl.viewport(0, 0, canvas.width, canvas.height);
        wObj.camera({ n: 'camera', fov: currentFov });
    }

    saveClarity(nextClarity);
    return nextClarity;
}

/**
 * 同步单选按钮选中态，避免切换或初始化时 UI 和实际状态不一致。
 */
function syncClarityRadios(radios, clarity) {
    const clarityText = String(normalizeClarity(clarity));
    radios.forEach(radio => {
        radio.checked = radio.value === clarityText;
    });
}

/**
 * 初始化 FOV 与清晰度控制。
 * 这里把原先写在 tab.js 里的 FOV 逻辑迁移过来，同时新增 clarity 的即时切换。
 * @param {Function} $ - document.getElementById 快捷函数
 * @param {Object} ccgxkObj - openworld 主对象
 * @param {Object} options - 额外的 UI 协调能力
 * @param {Function} [options.onClarityApplied] - 清晰度切换完成后的回调
 */
export function initDisplayControls($, ccgxkObj, options = {}) {
    const fovSlider = $('fovSlider');
    const fovValue = $('fovValue');
    const fovReset = $('fovReset');
    const clarityRadios = Array.from(document.querySelectorAll('input[name="clarity"]'));
    const onClarityApplied = typeof options.onClarityApplied === 'function' ? options.onClarityApplied : null;

    /**
     * 统一设置 FOV。
     * 同时更新滑杆、右侧数值和引擎相机，并把选择记进 localStorage。
     */
    function setFov(fov) {
        const nextFov = normalizeFov(fov);
        if (fovSlider) fovSlider.value = String(fovToSliderValue(nextFov));
        if (fovValue) fovValue.textContent = nextFov + '°';
        ccgxkObj.fov = nextFov;
        ccgxkObj.W.camera({ fov: nextFov });
        saveFov(nextFov);
        return nextFov;
    }

    if (fovSlider && fovValue) {
        setFov(readStoredFov());

        fovSlider.addEventListener('input', event => {
            const nextFov = sliderValueToFov(event.target.value);
            setFov(nextFov);
        });
    }

    fovReset?.addEventListener('click', () => {
        setFov(DEFAULT_FOV);
    });

    if (clarityRadios.length > 0) {
        const storedClarity = applyClarity(ccgxkObj, readStoredClarity());
        syncClarityRadios(clarityRadios, storedClarity);

        clarityRadios.forEach(radio => {
            radio.addEventListener('change', event => {
                if (!event.target.checked) return;
                const nextClarity = applyClarity(ccgxkObj, event.target.value);
                syncClarityRadios(clarityRadios, nextClarity);
                onClarityApplied?.(nextClarity);
            });
        });

        // 引擎本身会在 resize 时把 canvas 恢复成 window 大小。
        // 这里补一层项目插件级兜底，确保你的清晰度档位在改窗口后仍然生效。
        window.addEventListener('resize', () => {
            const currentClarity = readStoredClarity();
            applyClarity(ccgxkObj, currentClarity);
            syncClarityRadios(clarityRadios, currentClarity);
        });
    }
}
