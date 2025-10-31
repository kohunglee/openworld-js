const singboard = {

    // 文字自动换行 ctx canvas
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


    // 目前的板子设置函数（测试中）
    setBoard : () => {

        const borderList = [
            {
                id: 'firstTable',
                x: 16.712,
                y: 2.3,
                z: -35.212,
                ry: 90,
                w: 2,
                h: 1.5,
                dpz: 2,
            },
        ];

        for(let i = 0; i < borderList.length; i++) {
            const item = borderList[i];
            k.addTABox({
                DPZ : item?.dpz || 3,
                X: item.x,
                Y: item.y,
                Z: item.z,
                rY: item.ry,
                width : item.w,
                height: item.h,
                shape: 'plane',
                mixValue: 0,
                isPhysical: false,
                texture: item.id,
            })
        }

        k.errExpRatio = 1000;

        k.hooks.on('errorTexture_diy', function(ctx, width, height, drawItem, _this){
            const id = drawItem.id;
            singboard[id](ctx, width, height, drawItem, _this);
        })
    },


    // 第一书架的绘制函数
    firstTable : (ctx, width, height, drawItem, _this) => {
        const wp = width /100;
        const hp = height /100;
        let fontSize;

        ctx.fillStyle = '#d8e1d8ff';  //+ 背景
        ctx.fillRect(0, 0, width, height);

        const contentObj = {
            title : '流量 TOP1000 的网站（实验中...）',
            content : `
    这是本馆第一个被投入使用的书架，内容是一份数据来源于 Tranco List (https://tranco-list.eu/) 的前 1000 个网站列表，可被理解为全球流量最高的前 1000 个网站 😁。

    我们剔除了其中一些不宜展示的网站，然后再根据其排名大小，在书架上，以从左自右、从上到下的顺序依次排列，如：谷歌是第一名，位于最上层最左面。欢迎大家参阅，发现新世界！

    大家在参阅时，需要灵活使用【跳跃E】和【冻结F】两个键位的功能，搭配左右移动键位。当单机鼠标左键，会进入第一视角点选模式，这时，光标选中某个条目，屏幕左上角会出现详细条目，再次单击左键，会回到鼠标模式，于是我们可以单击链接进入网站了。

    手机端设备，目前尚未做完整支持，参阅请打开电脑。（完）
            `,
        }

        // 写文字
        if(true){
            ctx.textAlign = 'left';  //+ 文字要左上角为基点
            ctx.textBaseline = 'top';
            ctx.fillStyle = '#4B3832';  // 颜色

            fontSize = wp * 5;  //+ 标题
            ctx.font = `bold ${fontSize}px sans-serif`;
            singboard.wrapText(ctx, contentObj.title, 5*wp, 5*hp, width - 10*wp, fontSize * 1.5);

            fontSize = wp * 3;  //+ 内容
            ctx.font = `bold ${fontSize}px sans-serif`;
            singboard.wrapText(ctx, contentObj.content, 5*wp, 9*hp, width - 10*wp, fontSize * 1.5);
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
    },

}
