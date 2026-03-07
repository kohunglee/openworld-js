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

            // 自适应字体大小，确保文字完全显示
            let fontSize = 50 * hp;
            ctx.font = `900 ${fontSize}px "Microsoft YaHei", sans-serif`;
            let textWidth = ctx.measureText(text).width;
            const maxWidth = width - padding * 2;

            // 如果文字太宽，缩小字体
            while (textWidth > maxWidth && fontSize > 16) {
                fontSize *= 0.9;
                ctx.font = `900 ${fontSize}px "Microsoft YaHei", sans-serif`;
                textWidth = ctx.measureText(text).width;
            }

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = kit.libRed;
            ctx.fillText(text, 50 * wp, 50 * hp);
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

    // 用于钩子使用的函数
    kit.signFunc = {

        // 东 标
        eastSign : (ctx, width, height, drawItem, _this) => {
            kit.dirSign(ctx, width, height, '东');
        },

        // 静夜思 第一句
        poemLine1 : (ctx, width, height, drawItem, _this) => {
            kit.dirSign(ctx, width, height, '床前明月光');
        },

        // 静夜思 第二句
        poemLine2 : (ctx, width, height, drawItem, _this) => {
            kit.dirSign(ctx, width, height, '疑是地上霜');
        },

        // 静夜思 第三句
        poemLine3 : (ctx, width, height, drawItem, _this) => {
            kit.dirSign(ctx, width, height, '举头望明月');
        },

        // 静夜思 第四句
        poemLine4 : (ctx, width, height, drawItem, _this) => {
            kit.dirSign(ctx, width, height, '低头思故乡');
        },

    };

    return kit;
}