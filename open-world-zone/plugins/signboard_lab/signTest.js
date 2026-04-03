/**
 * 信息板测试模块 - 入口
 *
 * 文件结构：
 *   config.js      - 主题/常量配置
 *   store.js       - 数据存储（API 加载 + Canvas 函数编译）
 *   renderer.js    - 渲染器（文本、Canvas）
 *   hotUpdate.js   - 热更新（updateSign + SSE）
 *   signTest.js    - 入口（Hook 注册 + 图片模式处理）
 */

import { initData, signContentMap, signIndexMap, setCcgxkObj, setTextureModule } from './store.js';
import { drawSmartText, drawCanvasMode } from './renderer.js';
import { initSSE } from './hotUpdate.js';

/**
 * 图片模式处理器
 */
function handleImageMode(index, id, imgUrl, ccgxkObj) {
    const uniqueImgId = 'dyn_img_' + index + '_' + id;
    let imgEl = document.getElementById(uniqueImgId);
    if (!imgEl) {
        imgEl = document.createElement('img');
        imgEl.id = uniqueImgId;
        imgEl.crossOrigin = 'anonymous';
        imgEl.style.display = 'none';
        document.body.appendChild(imgEl);
        imgEl.onload = () => {
            ccgxkObj.W.plane({
                n: 'T' + index,
                t: imgEl,
                ns: 1,  // 先这个吧，可能会覆盖，但是图尽量不被光照影响会更好
            });
        };
        imgEl.onerror = () => {
            console.error("图片加载失败:", imgUrl);
        };
        imgEl.src = imgUrl;
    } else {
        if (imgEl.complete) {
            ccgxkObj.W.plane({
                n: 'T' + index,
                t: uniqueImgId
            });
        }
    }
}

/**
 * 设置信息板系统
 */
const setSignBoard = async (instData, ccgxkObj) => {
    ccgxkObj.errExpRatio = 200;

    // 先从 API 加载数据
    await initData();

    // 挂载纹理 HOOK
    ccgxkObj.hooks.on('errorTexture_diy', function(ctx, width, height, drawItem, _this) {
        const { index, id } = drawItem;

        // 供热更新模块使用
        setCcgxkObj(ccgxkObj);
        setTextureModule(_this);
        signIndexMap.set(id, { index });

        const info = signContentMap.get(id);

        if (info) {
            const { mode } = info;

            if (mode === 'text') {
                drawSmartText(ctx, width, height, info.t);
            } else if (mode === 'canvas') {
                drawCanvasMode(ctx, width, height, info.drawName);
            } else if (mode === 'image') {
                drawSmartText(ctx, width, height, 'Loading...');
                handleImageMode(index, id, info.imgUrl, ccgxkObj);
            }

            ccgxkObj.W.next['T' + index].hidden = false;
            _this.indexToArgs.get(index).isInvisible = false;

        } else {
            drawSmartText(ctx, width, height, '本画框编号 ' + id);
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
    });

    initSSE();
};

// ── 导出入口 ──

export default function(ccgxkObj) {
    ccgxkObj.signTest = setSignBoard;
}
