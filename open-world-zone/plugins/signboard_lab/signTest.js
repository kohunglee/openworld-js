/**
 * 文本画板 测试 模块
 */
import signsData from './server/signsData.js';
import CustomCanvasLib from './server/CustomCanvasLib.js';

const THEME = {  // 主题
    bgWhite: '#ffffff',
    bgWarn: '#ff0000',
    textDark: '#2c3e50',
    fontFamily: '"Microsoft YaHei", sans-serif',
    paddingRatio: 0.1 // 内边距占宽度的比例 (10%)
};

const signContentMap = new Map();  //+ 从 signsData.js 提取数据
signsData.boards.forEach(board => {
  if (board.mode === 'text') {
    signContentMap.set(board.id, { mode: 'text', t: board.content });
  } else if (board.mode === 'image') {
    signContentMap.set(board.id, { mode: 'image', imgUrl: board.content });
  } else if (board.mode === 'canvas') {
    signContentMap.set(board.id, { mode: 'canvas', drawName: board.content });
  }
});

// 支持【热更新纹理】的业务逻辑
let _ccgxkObj = null;  // 待引用
let _textureModule = null;  // 待引用的 hook 里的 _this
const signIndexMap = new Map();  // 将 id 和 标识牌 id 对应起来
window.updateSign = function(boardId, content, mode = 'text') {  // 临时全局 updateSign 函数用作测试
    const info = signIndexMap.get(boardId);
    if (!info) { console.error(`[updateSign] 找不到标识牌: ${boardId}`); return; }
    if (!_textureModule) { console.error('[updateSign] 引擎未就绪'); return; }
    const { index } = info;
    const nID = 'T' + index;
    const random = (Math.random() * 1e7) | 0;
    if (mode === 'text') {  //+ 更新各种数据源
        signContentMap.set(boardId, { mode: 'text', t: content });
    } else if (mode === 'image') {
        signContentMap.set(boardId + random, { mode: 'image', imgUrl: content });
    } else if (mode === 'canvas') {
        signContentMap.set(boardId, { mode: 'canvas', drawName: content });
    }
    _textureModule.textureMap.delete(boardId); //+ 清纹理缓存
    window[nID] = undefined;
    if (mode === 'image') { // image 模式：移除旧 img DOM，让 hook 重建新的
        const uniqueImgId = 'dyn_img_' + index + '_' + boardId;
        document.getElementById(uniqueImgId)?.remove();
    }
    _ccgxkObj.W.plane({ n: nID, t: boardId + random }); //+ 触发重绘
    if (mode === 'image') {
        _ccgxkObj.indexToArgs.get(index).texture = boardId + random;
    } else {
        _ccgxkObj.indexToArgs.get(index).texture = boardId;
    }
    console.log(boardId);
    _ccgxkObj.currentlyActiveIndices.delete(index);
    console.log(`[updateSign] ✅ ${boardId} 已更新`);
};

// 渲染器
const drawSmartText = (ctx, width, height, text) => {  

    ctx.fillStyle = THEME.bgWhite; //+ 绘制背景
    ctx.fillRect(0, 0, width, height);
    const padding = width * THEME.paddingRatio;
    const maxWidth = width - padding * 2;
    const maxHeight = height - padding * 2;
    let fontSize = Math.max(16, height * 0.15); //+ 初始字体设置
    let lineHeight = fontSize * 1.4;
    ctx.fillStyle = THEME.textDark;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let lines = [];
    let isFit = false;
    
    while (!isFit && fontSize >= 12) { //+ 字体缩放与换行算法
        ctx.font = `600 ${fontSize}px ${THEME.fontFamily}`;
        lines = [];
        let currentLine = '';
        for (let i = 0; i < text.length; i++) { // 逐字测量，实现精准换行
            const char = text[i];
            const testLine = currentLine + char;
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && i > 0) {
                lines.push(currentLine);
                currentLine = char;
            } else {
                currentLine = testLine;
            }
        }
        lines.push(currentLine); // 推入最后一行
        if (lines.length * lineHeight > maxHeight) { // 检查总高度是否超出画布
            fontSize -= 2; // 缩小字体重试
            lineHeight = fontSize * 1.4;
        } else {
            isFit = true; // 找到了合适的尺寸
        }
    }
    const totalTextHeight = lines.length * lineHeight; //+ 执行最终绘制 (垂直居中)
    let startY = (height - totalTextHeight) / 2 + (lineHeight / 2);
    for (const line of lines) {
        ctx.fillText(line, width / 2, startY);
        startY += lineHeight;
    }
};

const setSignBoard = (instData, ccgxkObj) => {
    ccgxkObj.errExpRatio = 200;

    // 挂载 HOOK
    ccgxkObj.hooks.on('errorTexture_diy', function(ctx, width, height, drawItem, _this) {
        const { index, id } = drawItem;

        // 保存引擎引用（首次触发时）
        if (!_ccgxkObj) { _ccgxkObj = ccgxkObj };
        if (!_textureModule) { _textureModule = _this };
        signIndexMap.set(id, { index });

        const textInfo = signContentMap.get(id);
        if (textInfo) {
            
        
            const type = textInfo.mode;

            if(type === 'text') {
                drawSmartText(ctx, width, height, textInfo.t);  // 执行智能排版绘制
            }

            if(type === 'canvas') {
                ctx.fillStyle = THEME.bgWhite;
                ctx.fillRect(0, 0, width, height);
                const drawFunc = CustomCanvasLib[textInfo.drawName];
                if (drawFunc) { drawFunc(ctx, width, height) }
            }

            if (type === 'image') {
                drawSmartText(ctx, width, height, 'Loading...');
                const uniqueImgId = 'dyn_img_' + index + '_' + id;
                let imgEl = document.getElementById(uniqueImgId);
                if (!imgEl) {
                    imgEl = document.createElement('img');
                    imgEl.id = uniqueImgId;
                    imgEl.crossOrigin = 'anonymous'; // 保持跨域
                    imgEl.style.display = 'none';    // 隐藏起来，别让用户在网页上看到
                    document.body.appendChild(imgEl); // 【关键】必须挂载到 DOM，引擎才能通过 ID 找到它
                    imgEl.onload = () => {
                        ccgxkObj.W.plane({
                            n: 'T' + index,
                            t: imgEl  // 直接传入 DOM 元素的 ID
                        });
                    };
                    imgEl.onerror = () => {
                        drawSmartText(ctx, width, height, 'img error');  // 执行智能排版绘制
                        console.error("图片加载失败:", textInfo.imgUrl);
                    };
                    imgEl.src = textInfo.imgUrl;
                } else {
                    if (imgEl.complete) {
                        ccgxkObj.W.plane({
                            n: 'T' + index,
                            t: uniqueImgId
                        });
                    }
                }
            }
            ccgxkObj.W.next['T' + index].hidden = false;
            _this.indexToArgs.get(index).isInvisible = false;

        } else {
            // ctx.fillStyle = THEME.bgWarn; // 未命中，绘制红色警告块
            // ctx.fillRect(0, 0, width, height);
            
            drawSmartText(ctx, width, height, '本画框编号' + id);  // 执行智能排版绘制
        }
    });

    // 将这些画板实例送入档案系统
    ccgxkObj.dataProc.process({
        data: instData,
        name: 'build_lab_signBoard',
        type: 2,           // 存入百数块区域
        model: 'plane',    // 使用平面模型作为墙上的画板
        mixValue: 0.8,
        invisible: false,  // 必须可见
        noIns: true,       // 使用独立纹理，不走实例化渲染
    });

    // SSE 监听：admin 保存时自动热更新
    try {
        const es = new EventSource('http://localhost:8899/api/signs/stream');
        es.onmessage = function(e) {
            const data = JSON.parse(e.data);
            if (data.boards) {
                data.boards.forEach(board => {
                    if (!signIndexMap.has(board.id)) return;
                    const cur = signContentMap.get(board.id);
                    if (!cur) return;
                    // 只更新内容真正变化的
                    const changed = cur.mode !== board.mode
                        || (board.mode === 'text' && cur.t !== board.content)
                        || (board.mode === 'image' && cur.imgUrl !== board.content)
                        || (board.mode === 'canvas' && cur.drawName !== board.content);
                    if (changed) {
                        window.updateSign(board.id, board.content, board.mode);
                    }
                });
            }
        };
        es.onerror = () => console.log('[SSE] 连接断开，自动重连中...');
        console.log('[SSE] 已连接 http://localhost:8899');
    } catch(e) {
        console.log('[SSE] 连接失败（开发服务器未启动？）');
    }
}

// 入口
export default function(ccgxkObj) {
    ccgxkObj.signTest = setSignBoard;
}