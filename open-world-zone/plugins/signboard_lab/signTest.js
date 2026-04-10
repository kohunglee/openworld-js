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

// 计算出 画板 应该有的宽度（高度）
const calcAspectScale = (imgW, imgH, canvasH) => {
    return { w: imgW / imgH * canvasH, h: canvasH };
};

// 把 图 放进 画板 内
const applyImage = (imgEl, ccgxkObj, index, id) => {
    const p_offset = index * 8;
    const canvasH = ccgxkObj.physicsProps[p_offset + 2] || 1;
    const { w, h } = calcAspectScale(imgEl.naturalWidth, imgEl.naturalHeight, canvasH);
    const textureModule = getTextureModule();
    if (textureModule) textureModule.textureMap.set(id, imgEl);
    ccgxkObj.W.plane({ n: 'T' + index, t: imgEl, w, h, ns: 1 });
    ccgxkObj.physicsProps[p_offset + 1] = w;
    ccgxkObj.physicsProps[p_offset + 2] = h;
};

// 用引擎处理 SVG
const handleSvg = (svgCode, uniqueImgId, ccgxkObj, index, id, imgUrl) => {
    const p_offset = index * 8;
    const canvasH = ccgxkObj.physicsProps[p_offset + 2] || 1;
    const ratio = ccgxkObj.errExpRatio || 200;
    const viewBoxMatch = svgCode.match(/viewBox=["']([^"']+)["']/i);
    const [, , vbW, vbH] = viewBoxMatch?.[1]?.split(/\s+/).map(Number) || [];
    const aspectRatio = (vbW && vbH) ? vbW / vbH : 1;
    const renderW = Math.round(canvasH * aspectRatio * ratio);
    const renderH = Math.round(canvasH * ratio);
    const svgWithSize = svgCode.replace(/<svg/i, `<svg width="${renderW}" height="${renderH}"`);
    const textureModule = getTextureModule();
    const dataUri = textureModule.dToBase64({ type: 'svg', svgCode: svgWithSize });
    const imgEl = document.getElementById(uniqueImgId) || document.createElement('img');
    imgEl.id = uniqueImgId;
    imgEl.style.display = 'none';
    if (!imgEl.parentElement) document.body.appendChild(imgEl);
    imgEl.onload = () => applyImage(imgEl, ccgxkObj, index, id);
    imgEl.onerror = () => console.error("SVG 加载失败:", imgUrl);
    imgEl.src = dataUri;
};

/**
 * 图片 画板 处理器
 */
function handleImageMode(index, id, imgUrl, ccgxkObj) {
    const uniqueImgId = 'dyn_img_' + index + '_' + id;
    let imgEl = document.getElementById(uniqueImgId);

    if (imgEl?.complete) return applyImage(imgEl, ccgxkObj, index, id);
    if (imgEl) return; // 加载中

    // 直接加载图片
    imgEl = document.createElement('img');
    imgEl.id = uniqueImgId;
    imgEl.crossOrigin = 'anonymous';
    imgEl.style.display = 'none';
    document.body.appendChild(imgEl);
    imgEl.onload = () => {
        // naturalWidth 为 0 可能是 SVG，尝试 fetch 处理
        if (imgEl.naturalWidth === 0) {
            fetch(imgUrl).then(r => r.text()).then(text => {
                if (/^\s*(<\?xml|<svg)/i.test(text)) {
                    handleSvg(text, uniqueImgId, ccgxkObj, index, id, imgUrl);
                }
            });
        } else {
            applyImage(imgEl, ccgxkObj, index, id);
        }
    };
    imgEl.onerror = () => console.error("图片加载失败:", imgUrl);
    imgEl.src = imgUrl;
}

/**
 * 设置信息板系统
 */
const setSignBoard = async (instData, ccgxkObj, offsetValue = {x:0}, wskType = 2) => {
    ccgxkObj.errExpRatio = 200;  // 图片的质量（以100为基准）
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
                drawSmartText(ctx, width, height, 'Loading...');
                handleImageMode(index, id, info.imgUrl, ccgxkObj);
            } else if (mode === 'empty') {
                drawSmartText(ctx, width, height, id);
            }

            ccgxkObj.W.next['T' + index].hidden = false;
            _this.indexToArgs.get(index).isInvisible = false;

        } else {
            // 没有数据 → 触发懒加载，先显示 ID
            lazyLoadSign(id);
            drawSmartText(ctx, width, height, id + '(...)');
        }
    });

    ccgxkObj.dataProc.process({
        data: instData,
        name: 'build_lab_signBoard',
        type: wskType,  // 默认为 2
        model: 'plane',
        mixValue: 0.8,
        invisible: false,
        noIns: true,
        offset: offsetValue,
    });

    initSSE();
};

// 入口
export default function(ccgxkObj) {
    ccgxkObj.signTest = setSignBoard;  // 设置画板的业务逻辑
    signPanel(ccgxkObj); // 初始化编辑面板
    initHotInfo(ccgxkObj); // 初始化热点信息显示（mode=1 时）
    ccgxkObj.hooks.on('hot_action', function(ccgxkObj, e){ // 热点事件
        if(ccgxkObj.mode !== 2){return 0}
        const hotIndex = ccgxkObj.hotPoint;
        ccgxkObj.signPanel.show(hotIndex);  // 显示编辑面板
    });
}
