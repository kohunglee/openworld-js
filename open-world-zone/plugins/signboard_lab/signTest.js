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

/**
 * 图片模式处理器
 */
function handleImageMode(index, id, imgUrl, ccgxkObj) {
    const uniqueImgId = 'dyn_img_' + index + '_' + id;
    let imgEl = document.getElementById(uniqueImgId);

    // h 固定为 1，w 根据图片比例自适应
    const calcAspectScale = (imgW, imgH) => {
        return { w: imgW / imgH * 2, h: 2 };
    };

    if (!imgEl) {
        imgEl = document.createElement('img');
        imgEl.id = uniqueImgId;
        imgEl.crossOrigin = 'anonymous';
        imgEl.style.display = 'none';
        document.body.appendChild(imgEl);
        imgEl.onload = () => {
            const { w, h } = calcAspectScale(imgEl.naturalWidth, imgEl.naturalHeight);
            const textureModule = getTextureModule();
            if (textureModule) {
                textureModule.textureMap.set(id, imgEl);
            }
            ccgxkObj.W.plane({
                n: 'T' + index,
                t: imgEl,
                w, h,  // 通过 w, h 调整比例
                ns: 1,
            });
        };
        imgEl.onerror = () => {
            console.error("图片加载失败:", imgUrl);
        };
        imgEl.src = imgUrl;
    } else {
        if (imgEl.complete) {
            const { w, h } = calcAspectScale(imgEl.naturalWidth, imgEl.naturalHeight);
            const textureModule = getTextureModule();
            if (textureModule) {
                textureModule.textureMap.set(id, imgEl);
            }
            ccgxkObj.W.plane({
                n: 'T' + index,
                t: imgEl,
                w, h,
                ns: 1,
            });
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
    ccgxkObj.hooks.on('hot_action', function(ccgxkObj, e){ // 热点事件
        if(ccgxkObj.mode !== 2){return 0}
        const hotIndex = ccgxkObj.hotPoint;
        ccgxkObj.signPanel.show(hotIndex);  // 显示编辑面板
    });
}
