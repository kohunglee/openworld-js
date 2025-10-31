const singboard = {

    // 文字自动换行 ctx canvas
    wrapText : (_ctx, text, x, y, maxWidth, lineHeight) => {
            text = text.split('/*')[0];  // 去掉注释
            const words = text.split(''); // 按单个字符来拆分，保证中英文都能换行
            let line = ''; // 当前正在排版的行内容
            maxWidth = maxWidth - x;
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

    // 测试
    setTest : () => {

        k.singboardMap = new Map();

        k.singboardMap.set('firstTable', {
            title : '流量 TOP1000 的网站（实验中...）',
            content : `
            
    如何把书架给填充？第一个书架，我决定使用网站来做测试。

网站是个好东西。
            `,
            date : '2025年10月31日',
        })

        if(true) {
            k.addTABox({
                DPZ : 2,
                X: 16.712,
                Y: 2.3,
                Z: -35.212,
                rY: 90,
                width : 2,
                height: 1.5,
                shape: 'plane',
                mixValue: 0,
                isPhysical: false,
                texture: 'firstTable', 
            });

            k.errExpRatio = 1000;

            k.hooks.on('errorTexture_diy', function(ctx, width, height, drawItem, _this){
                console.log('开始造纹理', width, height);
                console.log(drawItem);

                const id = drawItem.id;
                const contentObj = k.singboardMap.get(id);
                console.log(contentObj);

                const wp = width /100;
                const hp = height /100;
                let fontSize;

                ctx.fillStyle = '#d8e1d8ff';  //+ 背景
                ctx.fillRect(0, 0, width, height);

                // 写文字
                if(true){
                    ctx.textAlign = 'left';  //+ 文字要左上角为基点
                    ctx.textBaseline = 'top';
                    ctx.fillStyle = '#4B3832';  // 颜色

                    fontSize = wp * 5;  //+ 标题
                    ctx.font = `bold ${fontSize}px sans-serif`;
                    singboard.wrapText(ctx, contentObj.title, 5*wp, 5*hp, width, fontSize);

                    fontSize = wp * 3;  //+ 内容
                    ctx.font = `bold ${fontSize}px sans-serif`;
                    singboard.wrapText(ctx, contentObj.content, 5*wp, 15*hp, width, fontSize);
                }

                // 画箭头
                if(true){
                    ctx.save();
                    ctx.translate(width - 15*wp, 3.5*wp);  // 绘制箭头位置
                    const arrowSize = 0.1*wp;  // 箭头大小
                    ctx.fillStyle = '#865555';  // 箭头颜色
                    ctx.beginPath();  //+ 开始绘制
                    ctx.moveTo(0 * arrowSize, 14 * arrowSize);
                    ctx.lineTo(64 * arrowSize, 14 * arrowSize);
                    ctx.lineTo(64 * arrowSize, 6 * arrowSize);
                    ctx.lineTo(96 * arrowSize, 28 * arrowSize);
                    ctx.lineTo(64 * arrowSize, 50 * arrowSize);
                    ctx.lineTo(64 * arrowSize, 42 * arrowSize);
                    ctx.lineTo(0 * arrowSize, 42 * arrowSize);
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                }
                

            });
        }
    }

}
