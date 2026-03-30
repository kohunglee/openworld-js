/**
 * 文本画板 测试 模块
 */
import signsData from './signsData.js';

const THEME = {
    bgWhite: '#ffffff',
    bgWarn: '#ff0000',
    textDark: '#2c3e50',
    fontFamily: '"Microsoft YaHei", sans-serif',
    paddingRatio: 0.1 // 内边距占宽度的比例 (10%)
};

// 从 signsData.js 构建内容映射
const signContentMap = new Map();
signsData.boards.forEach(board => {
  if (board.mode === 'text') {
    signContentMap.set(board.id, { mode: 'text', t: board.content });
  } else if (board.mode === 'image') {
    signContentMap.set(board.id, { mode: 'image', imgUrl: board.content });
  } else if (board.mode === 'canvas') {
    signContentMap.set(board.id, { mode: 'canvas', drawName: board.content });
  }
});

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

const CustomCanvasLib = { // 几个 canvas 示例
  
  drawCircle: (ctx, w, h) => { // 画一个红色的居中圆
    ctx.fillStyle = '#b9e73c'; // 红色
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.3, 0, Math.PI * 2);
    ctx.fill();
  },
  
  drawCross: (ctx, w, h) => { // 画一个蓝色的叉叉
    ctx.strokeStyle = '#3498db'; // 蓝色
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(w * 0.2, h * 0.2); ctx.lineTo(w * 0.8, h * 0.8);
    ctx.moveTo(w * 0.8, h * 0.2); ctx.lineTo(w * 0.2, h * 0.8);
    ctx.stroke();
  }
};

// 入口
export default function(instData, ccgxkObj) {
    ccgxkObj.errExpRatio = 200;

    // 挂载 HOOK
    ccgxkObj.hooks.on('errorTexture_diy', function(ctx, width, height, drawItem, _this) {
        const { index, id } = drawItem;
        console.log(index, id, drawItem.t);
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
                // 1. 同步阶段：给画布画个 Loading，让引擎立刻拿到一个占位纹理，防止黑屏报错
                drawSmartText(ctx, width, height, 'Loading...');

                // 2. 给这张图生成一个独一无二的新 ID，防止引擎复用之前的 ctx 缓存
                const uniqueImgId = 'dyn_img_' + index + '_' + id;

                // 检查页面里是不是已经建过这个标签了（防止多面板加载同一张图时重复创建 DOM）
                let imgEl = document.getElementById(uniqueImgId);
                
                if (!imgEl) {
                    // 动态创建 <img> 标签并挂载到网页上
                    imgEl = document.createElement('img');
                    imgEl.id = uniqueImgId;
                    imgEl.crossOrigin = 'anonymous'; // 保持跨域
                    imgEl.style.display = 'none';    // 隐藏起来，别让用户在网页上看到
                    document.body.appendChild(imgEl); // 【关键】必须挂载到 DOM，引擎才能通过 ID 找到它
                    
                    imgEl.onload = () => {
                        // 原图加载完成后，传入这个全新的 DOM ID 更新面板
                        console.log('idx: ' + index);
                        ccgxkObj.W.plane({
                            n: 'T' + index,
                            t: imgEl  // 直接传入 DOM 元素的 ID
                        });
                    };
                    
                    imgEl.onerror = () => {
                        console.error("图片加载失败:", textInfo.imgUrl);
                    };
                    
                    imgEl.src = textInfo.imgUrl;
                } else {
                    // 如果 DOM 已经存在，且图片已经加载完毕，直接用
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
            ctx.fillStyle = THEME.bgWarn; // 未命中，绘制红色警告块
            ctx.fillRect(0, 0, width, height);
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
}