/**
 * 信息板测试模块 - 入口
 *
 * 文件结构：
 *   config.js      - 主题/常量配置
 *   store.js       - 数据存储（API 加载 + Canvas 函数编译）
 *   renderer.js    - 渲染器（文本、Canvas）
 *   hotUpdate.js   - 热更新（updateSign + SSE）
 *   signTest.js    - 入口（Hook 注册 + 图片模式处理）
 *   signPanel.js   - 编辑面板（可拖动 HUD 窗口）
 */

import { initData, signContentMap, signIndexMap, lazyLoadSign, setCcgxkObj, setTextureModule, getTextureModule } from './store.js';
import { drawSmartText } from './renderer.js';
import { initSSE } from './hotUpdate.js';
import signPanel from './signPanel.js';
import { initHotInfo } from './hotInfo.js';

/**
 * 图片模式处理器
 *
 * ★ 防范浏览器缓存图片的竞态条件 ★
 * 使用 addEventListener + complete 检查双保险，确保 100% 捕获图片加载完成事件
 */
function handleImageMode(index, id, imgUrl, ccgxkObj) {
    const uniqueImgId = 'dyn_img_' + index + '_' + id;
    let imgEl = document.getElementById(uniqueImgId);

    // h 固定为 1，w 根据图片比例自适应
    const calcAspectScale = (imgW, imgH) => {
        return { w: imgW / imgH * 2, h: 2 };
    };

    // ★ 核心更新函数 - 确保只执行一次且参数有效 ★
    const updateTexture = (img) => {
        // 防御性检查：确保图片尺寸有效
        if (!img.naturalWidth || !img.naturalHeight || img.naturalWidth === 0 || img.naturalHeight === 0) {
            console.warn('[handleImageMode] 图片尺寸无效，稍后重试:', id, img.naturalWidth, img.naturalHeight);
            // 延迟重试
            setTimeout(() => {
                if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                    updateTexture(img);
                }
            }, 50);
            return;
        }

        const { w, h } = calcAspectScale(img.naturalWidth, img.naturalHeight);
        const textureModule = getTextureModule();
        if (textureModule) {
            textureModule.textureMap.set(id, img);
        }
        ccgxkObj.W.plane({
            n: 'T' + index,
            t: img,
            w, h,
            ns: 1,
        });
        const p_offset = index * 8;
        ccgxkObj.physicsProps[p_offset + 1] = w;
        ccgxkObj.physicsProps[p_offset + 2] = h;
    };

    if (!imgEl) {
        imgEl = document.createElement('img');
        imgEl.id = uniqueImgId;
        imgEl.crossOrigin = 'anonymous';
        imgEl.style.display = 'none';
        document.body.appendChild(imgEl);

        // ★ 使用 addEventListener 而不是 onload 赋值，防止被覆盖 ★
        imgEl.addEventListener('load', function onLoad() {
            imgEl.removeEventListener('load', onLoad);
            updateTexture(imgEl);
        });

        imgEl.addEventListener('error', function onError() {
            imgEl.removeEventListener('error', onError);
            console.error("[handleImageMode] 图片加载失败:", imgUrl);
        });

        imgEl.src = imgUrl;

        // ★ 关键：设置 src 后立即检查 complete，防止缓存图片吞掉 load 事件 ★
        if (imgEl.complete && imgEl.naturalWidth > 0) {
            updateTexture(imgEl);
        }
    } else {
        // 图片元素已存在
        if (imgEl.complete && imgEl.naturalWidth > 0) {
            // ★ 图片已加载完成 → 直接更新纹理（带尺寸验证）★
            updateTexture(imgEl);
        } else {
            // 图片正在加载中 → 使用 addEventListener 等待
            const onLoad = () => {
                imgEl.removeEventListener('load', onLoad);
                updateTexture(imgEl);
            };
            imgEl.addEventListener('load', onLoad);
        }
    }
}

/**
 * 设置信息板系统
 */
const setSignBoard = async (instData, ccgxkObj, offsetValue = {x:0}) => {
    ccgxkObj.errExpRatio = 200;

    await initData(); // 先从 API 加载数据

    // 挂载纹理 HOOK
    ccgxkObj.hooks.on('errorTexture_diy', function(ctx, width, height, drawItem, _this) {
        const { index, id } = drawItem;

        setCcgxkObj(ccgxkObj); //+ 供热更新模块使用
        setTextureModule(_this);
        signIndexMap.set(id, { index });

        const info = signContentMap.get(id);

        if (info) {
            const { mode } = info;

            if (mode === 'text') {
                drawSmartText(ctx, width, height, info.t);
            } else if (mode === 'image') {
                drawSmartText(ctx, width, height, 'handleImageMode...');
                handleImageMode(index, id, info.imgUrl, ccgxkObj);
            }

            ccgxkObj.W.next['T' + index].hidden = false;
            _this.indexToArgs.get(index).isInvisible = false;

        } else {
            // 没有数据 → 触发懒加载
            lazyLoadSign(id);
            drawSmartText(ctx, width, height, 'lazyLoadSign...');
        }
    });

    ccgxkObj.dataProc.process({
        data: instData,
        name: 'build_lab_signBoard',
        type: 2,
        model: 'plane',
        mixValue: 0.8,
        invisible: false,
        noIns: true,
        offset: offsetValue,
    });

    initSSE();
};

// ── 导出入口 ──

export default function(ccgxkObj) {
    ccgxkObj.signTest = setSignBoard;
    signPanel(ccgxkObj); // 初始化编辑面板
    initHotInfo(ccgxkObj); // 初始化热点信息显示（mode=1 时）
    ccgxkObj.hooks.on('hot_action', function(ccgxkObj){ // 热点事件
        if(ccgxkObj.mode !== 2){return 0}
        const hotIndex = ccgxkObj.hotPoint;
        ccgxkObj.signPanel.show(hotIndex);  // 显示编辑面板
    });
}
