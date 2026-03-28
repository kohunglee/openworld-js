/**
 * 一些辅助库
 */
export default function(ccgxkObj) {

    // 工具函数
    const kit = {

        // 统一几个主要配色
        libRed : '#e27b7bff',  // 主题色 红色
        libWhite : '#d8e1d8ff',  // 主题色 白色

        // 方向标
        dirSign : (ctx, width, height, text) => {
            const wp = width / 100;
            const hp = height / 100;
            const padding = 10 * wp; // 内边距

            ctx.fillStyle = '#ffffff';  //+ 背景
            ctx.fillRect(0, 0, width, height);

            // 每20个字符换行
            const charsPerLine = 20;
            const lines = [];
            for (let i = 0; i < text.length; i += charsPerLine) {
                lines.push(text.slice(i, i + charsPerLine));
            }

            // 根据行数自适应字体大小
            const lineCount = lines.length;
            let fontSize = lineCount <= 1 ? 50 * hp : Math.max(16, (50 * hp) / lineCount);
            const lineHeight = fontSize * 1.2;
            const maxWidth = width - padding * 2;

            // 确保每行文字不超宽，必要时缩小字体
            ctx.font = `900 ${fontSize}px "Microsoft YaHei", sans-serif`;
            for (const line of lines) {
                let textWidth = ctx.measureText(line).width;
                while (textWidth > maxWidth && fontSize > 16) {
                    fontSize *= 0.9;
                    ctx.font = `900 ${fontSize}px "Microsoft YaHei", sans-serif`;
                    textWidth = ctx.measureText(line).width;
                }
            }

            // 计算整体高度，让所有行垂直居中
            const totalHeight = lineCount * lineHeight;
            let startY = (height - totalHeight) / 2 + lineHeight / 2;

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#000';

            // 逐行居中绘制
            for (const line of lines) {
                ctx.fillText(line, 50 * wp, startY);
                startY += lineHeight;
            }
        },

        // 文字自动换行 ctx canvas，排版工具
        wrapText : (_ctx, text, x, y, maxWidth, lineHeight) => {
                text = text.split('/*')[0];  // 去掉注释
                const words = text.split(''); // 按单个字符来拆分，保证中英文都能换行
                let line = ''; // 当前正在排版的行内容
                for(let n = 0; n < words.length; n++) {
                    if (words[n] === '\n') {  //+ 处理 \n 来换行的逻辑
                        _ctx.fillText(line, x, y);
                        y += lineHeight; line = '';
                        continue;
                    }
                    const testLine = line + words[n];  //+ 长度够了，换行的逻辑
                    const metrics = _ctx.measureText(testLine);  // 计算长度
                    const testWidth = metrics.width;
                    if (testWidth > maxWidth && n > 0) {  // 超长了
                        _ctx.fillText(line, x, y);
                        line = words[n];  // 另起一行
                        y += lineHeight;
                    } else {
                        line = testLine;
                    }
                }
                _ctx.fillText(line, x, y);  // 最后剩下的一行
        },

        // 阅读 csv
        loadCSV : async (url) => {
            const res = await fetch(url);
            const text = await res.text();
            const [headerLine, ...rows] = text.trim().split(/\r?\n/);

            // 获取表头（例如：x,y,z,w,h,t）
            const headers = headerLine.split(',');

            return rows.map(line => {
                const cols = line.split(',');
                const obj = {};
                headers.forEach((key, i) => {
                    const val = cols[i];
                    // 自动转换数字类型，保留字符串类型（如 t 参数）
                    obj[key] = isNaN(val) ? val : parseFloat(val);
                });
                return obj;
            });
        },
    };

    // 用于钩子使用的函数 (使用 Map 存储，适合大量数据)
    kit.signFunc = new Map();

    // 预置函数
    kit.signFunc.set('eastSign', (ctx, width, height, drawItem, _this) => {
        kit.dirSign(ctx, width, height, '东');
    });
    kit.signFunc.set('poemLine1', (ctx, width, height, drawItem, _this) => {
        kit.dirSign(ctx, width, height, '床前明月光');
    });
    kit.signFunc.set('poemLine2', (ctx, width, height, drawItem, _this) => {
        kit.dirSign(ctx, width, height, '疑是地上霜');
    });
    kit.signFunc.set('poemLine3', (ctx, width, height, drawItem, _this) => {
        kit.dirSign(ctx, width, height, '举头望明月');
    });
    kit.signFunc.set('poemLine4', (ctx, width, height, drawItem, _this) => {
        kit.dirSign(ctx, width, height, '低头思故乡');
    });

    return kit;
}
