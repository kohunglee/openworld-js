/**
 * 处理 mode === 'image' 的情况
 *
 * 图片模式处理器
 */
import { makeImgId } from '../config.js';
import { getApiBase } from '../config.js';
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

/**
 * 判断一个 URL 看起来是不是 SVG。
 * 这里不用只看扩展名，还兼容 `?xxx` 之类的后缀形式。
 */
const isSvgUrl = (imgUrl = '') => /\.svg(?:$|[?#])/i.test(String(imgUrl).trim());

/**
 * 安全解析 SVG 的宽高。
 * 优先使用 width/height；没有的话再尝试 viewBox。
 */
const getSvgSize = (svgCode = '') => {
    const widthMatch = svgCode.match(/\bwidth=["']\s*([\d.]+)(px)?\s*["']/i);
    const heightMatch = svgCode.match(/\bheight=["']\s*([\d.]+)(px)?\s*["']/i);
    const viewBoxMatch = svgCode.match(/\bviewBox=["']([^"']+)["']/i);
    const width = Number(widthMatch?.[1] || 0);
    const height = Number(heightMatch?.[1] || 0);

    if (width > 0 && height > 0) {
        return { width, height };
    }

    const [, , vbW, vbH] = viewBoxMatch?.[1]?.trim().split(/\s+/).map(Number) || [];
    if (vbW > 0 && vbH > 0) {
        return { width: vbW, height: vbH };
    }

    return { width: 300, height: 120 };
};

/**
 * 把原始 SVG 补成更适合贴图的版本。
 * 主要目的：
 * 1. 给透明 SVG 一个白底，避免贴到深色场景里一眼看过去像“黑块”
 * 2. 给没有 fill 的文本一个更稳的默认颜色，避免透明背景下误判
 */
const normalizeSvgForTexture = (svgCode = '', renderW, renderH) => {
    const hasRectBackground = /<rect\b[^>]*data-owz-bg=["']1["'][^>]*>/i.test(svgCode);
    const backgroundRect = hasRectBackground
        ? ''
        : `<rect data-owz-bg="1" x="0" y="0" width="100%" height="100%" fill="#ffffff"></rect>`;
    const fillStyle = `<style data-owz-style="1">text:not([fill]){fill:#111827;}svg{color:#111827;}</style>`;

    let nextSvg = svgCode;

    // 给根节点补上明确尺寸，避免不同浏览器对 SVG intrinsic size 处理不一致。
    nextSvg = nextSvg.replace(/<svg\b([^>]*)>/i, (_match, attrs) => {
        const cleanedAttrs = String(attrs || '')
            .replace(/\swidth=["'][^"']*["']/i, '')
            .replace(/\sheight=["'][^"']*["']/i, '');
        return `<svg${cleanedAttrs} width="${renderW}" height="${renderH}">`;
    });

    // 把兜底样式和白底插到 SVG 内部最前面，尽量不干扰原内容结构。
    nextSvg = nextSvg.replace(/<svg\b[^>]*>/i, match => `${match}${fillStyle}${backgroundRect}`);
    return nextSvg;
};

/**
 * 浏览器原生把 SVG 文本转成位图 canvas。
 * 这样最终喂给 WebGL 的就是普通 canvas/image，跨域和透明背景都更可控。
 */
const rasterizeSvgToCanvas = (svgCode, renderW, renderH) => new Promise((resolve, reject) => {
    const svgBlob = new Blob([svgCode], { type: 'image/svg+xml;charset=utf-8' });
    const objectUrl = URL.createObjectURL(svgBlob);
    const img = new Image();

    img.onload = () => {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = renderW;
            canvas.height = renderH;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, renderW, renderH);
            ctx.drawImage(img, 0, 0, renderW, renderH);
            URL.revokeObjectURL(objectUrl);
            resolve(canvas);
        } catch (error) {
            URL.revokeObjectURL(objectUrl);
            reject(error);
        }
    };

    img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('SVG 位图化失败'));
    };

    img.src = objectUrl;
});

/**
 * 抓取 SVG 文本。
 * 先尝试浏览器直连；跨域被拦时，再回退到信息板服务端代理。
 */
const fetchSvgText = async (imgUrl) => {
    const attemptUrls = [imgUrl];
    const apiBase = getApiBase();
    const proxyUrl = apiBase
        ? `${apiBase}/api/signs/image-proxy?url=${encodeURIComponent(imgUrl)}`
        : '';
    if (proxyUrl) attemptUrls.push(proxyUrl);

    let lastError = null;
    for (const url of attemptUrls) {
        try {
            const response = await fetch(url, { cache: 'no-store' });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const contentType = response.headers.get('content-type') || '';
            const text = await response.text();
            if (/image\/svg\+xml/i.test(contentType) || /^\s*(<\?xml|<svg)/i.test(text)) {
                return text;
            }
            throw new Error('响应不是 SVG');
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError || new Error('SVG 抓取失败');
};

// 把图放进画板内
const applyImage = (imgEl, ccgxkObj, index, id) => {
    const { p_offset, canvasH } = getCanvasInfo(ccgxkObj, index);
    const { w, h } = calcAspectScale(imgEl.naturalWidth, imgEl.naturalHeight, canvasH);
    const textureModule = getTextureModule();
    if (textureModule) textureModule.textureMap.set(id, imgEl);
    if(ccgxkObj.W.next['T' + index]){
        ccgxkObj.W.plane({ n: 'T' + index, t: imgEl, w, h, ns: 1 });
    }
    ccgxkObj.physicsProps[p_offset + 1] = w;
    ccgxkObj.physicsProps[p_offset + 2] = h;
};

/**
 * 单独处理 SVG。
 * 这里不再直接把远程 SVG URL 交给 WebGL，而是先转成本地白底位图，减少黑贴图概率。
 */
const handleSvg = async (svgCode, uniqueImgId, ccgxkObj, index, id, imgUrl) => {
    const { canvasH } = getCanvasInfo(ccgxkObj, index);
    const ratio = ccgxkObj.errExpRatio || 200;
    const { width: svgW, height: svgH } = getSvgSize(svgCode);
    const aspectRatio = svgW > 0 && svgH > 0 ? svgW / svgH : 1;
    const renderW = Math.round(canvasH * aspectRatio * ratio);
    const renderH = Math.round(canvasH * ratio);
    const normalizedSvg = normalizeSvgForTexture(svgCode, renderW, renderH);
    const canvas = await rasterizeSvgToCanvas(normalizedSvg, renderW, renderH);
    const imgEl = document.getElementById(uniqueImgId) || document.createElement('img');

    imgEl.id = uniqueImgId;
    imgEl.style.display = 'none';
    if (!imgEl.parentElement) document.body.appendChild(imgEl);
    imgEl.onload = () => applyImage(imgEl, ccgxkObj, index, id);
    imgEl.onerror = () => console.error("SVG 加载失败:", imgUrl);
    imgEl.src = canvas.toDataURL('image/png');
};

/**
 * 入口
 */
export function handleImageMode(index, id, imgUrl, ccgxkObj) {
    const uniqueImgId = makeImgId(index, id);
    let imgEl = document.getElementById(uniqueImgId);
    const makeBustUrl = () => `${imgUrl}${imgUrl.includes('?') ? '&' : '?'}try=${1}`;  // 加上这个才显示（原理不太清楚）
    const tryLoadSvg = async () => {
        try {
            const svgText = await fetchSvgText(imgUrl);
            await handleSvg(svgText, uniqueImgId, ccgxkObj, index, id, imgUrl);
        } catch (error) {
            console.error('SVG 处理失败:', imgUrl, error);
        }
    };

    if (imgEl?.complete) return applyImage(imgEl, ccgxkObj, index, id);
    if (imgEl) return; // 加载中
    if (isSvgUrl(imgUrl)) {
        imgEl = document.createElement('img');
        imgEl.id = uniqueImgId;
        imgEl.style.display = 'none';
        document.body.appendChild(imgEl);
        void tryLoadSvg();
        return;
    }

    // 直接加载图片
    imgEl = document.createElement('img');
    imgEl.id = uniqueImgId;
    imgEl.crossOrigin = 'anonymous';
    imgEl.style.display = 'none';
    document.body.appendChild(imgEl);
    let retryCount = 0;
    const maxRetry = 1;

    imgEl.onload = () => {
        if (imgEl.naturalWidth === 0) {  // naturalWidth 为 0 可能是 SVG，尝试 fetch 处理
            void tryLoadSvg();
        } else {
            applyImage(imgEl, ccgxkObj, index, id);
        }
    };
    imgEl.onerror = () => {
        if (retryCount < maxRetry) {  // 绕过 cloudflare 的坏缓存或风控瞬时状态 
            retryCount += 1;
            return void setTimeout(() => {
                imgEl.src = makeBustUrl();
            }, 500);
        }
    };
    imgEl.src = makeBustUrl();
}
