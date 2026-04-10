/**
 * 处理 mode === 'image' 的情况
 *
 * 图片模式处理器
 */
import { makeImgId } from '../config.js';
import { getTextureModule } from '../store.js';

// 获取画板物理信息
const getCanvasInfo = (ccgxkObj, index) => {
    const p_offset = index * 8;
    const canvasH = ccgxkObj.physicsProps[p_offset + 2] || 1;
    return { p_offset, canvasH };
};

// 计算画板应有的宽度（高度）
const calcAspectScale = (imgW, imgH, canvasH) => {
    return { w: imgW / imgH * canvasH, h: canvasH };
};

// 把图放进画板内
const applyImage = (imgEl, ccgxkObj, index, id) => {
    const { p_offset, canvasH } = getCanvasInfo(ccgxkObj, index);
    const { w, h } = calcAspectScale(imgEl.naturalWidth, imgEl.naturalHeight, canvasH);
    const textureModule = getTextureModule();
    if (textureModule) textureModule.textureMap.set(id, imgEl);
    ccgxkObj.W.plane({ n: 'T' + index, t: imgEl, w, h, ns: 1 });
    ccgxkObj.physicsProps[p_offset + 1] = w;
    ccgxkObj.physicsProps[p_offset + 2] = h;
};

// 用引擎处理 SVG
const handleSvg = (svgCode, uniqueImgId, ccgxkObj, index, id, imgUrl) => {
    const { canvasH } = getCanvasInfo(ccgxkObj, index);
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
 * 入口
 */
export function handleImageMode(index, id, imgUrl, ccgxkObj) {
    const uniqueImgId = makeImgId(index, id);
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
