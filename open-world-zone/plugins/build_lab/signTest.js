/**
 * 测试一下哈
 * 
 * 怎么弄那个纹理，研究一下
 * 
 */

export default function(instData, ccgxkObj) {

    let kit = {};
    if(true){
        // 初始化工具函数
        kit = {

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
                fontSize = 10;
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
            
        }

        // 用于钩子使用的函数 (使用 Map 存储，适合大量数据)
        kit.signFunc = new Map();

        kit.signFunc.set('testSign1', (ctx, width, height, drawItem, _this) => {
            kit.dirSign(ctx, width, height, '野狗不需要墓碑，奔跑到腐烂即可。');
        });
    }

    // 挂载 hook
    if(true){
        ccgxkObj.errExpRatio = 100;  // 调节绘制分辨率(以 100 为基准，越大越清晰)
        ccgxkObj.hooks.on('errorTexture_diy', function(ctx, width, height, drawItem, _this){
            const index = drawItem.index;
            const id = drawItem.id;
            console.log(id);  // 临时输出使用
            if(kit.signFunc.has(id)){
                kit.signFunc.get(id)(ctx, width, height, drawItem, _this);
                ccgxkObj.W.next['T' + index].hidden = false;
                _this.indexToArgs.get(index).isInvisible = false;
            } else {
                ctx.fillStyle = '#ff0000ff';  //+ 警告背景，警告未设置背景绘制函数
                ctx.fillRect(0, 0, width, height);
                if(false){  // 如果要发布，则这个要 false 掉，这是未填充内容的板块
                    ccgxkObj.W.next['T' + index].hidden = false;
                    _this.indexToArgs.get(index).isInvisible = false;
                }
            }
        })
    }



    ccgxkObj.dataProc.process({  //+ 显示 arrC 信息板
        data: instData,
        name: 'build_lab_signBoard',
        type: 2,
        texture: paper02,
        model: 'plane',
        mixValue: 0.8,
        invisible: false, noIns: true,  // 纹理专用
    });

}