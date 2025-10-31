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
            content : '书架在被填充如何填满这数个书架是件第一个书架我使用了全球流量可以进行欣赏书架在被填充如何填满这数个书架是件第一个书架我使用了全球流量可以进行欣赏书架在被填充如何填满这数个书架是件第一个书架我使用了全球流量可以进行欣赏',
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

                ctx.fillStyle = '#F5E8C7';  //+ 背景
                ctx.fillRect(0, 0, width, height);

                ctx.textAlign = 'left';  //+ 文字要左上角为基点
                ctx.textBaseline = 'top';
                ctx.fillStyle = '#4B3832';  // 颜色

                fontSize = wp * 5;  //+ 标题
                ctx.font = `bold ${fontSize}px sans-serif`;  // 无衬线
                singboard.wrapText(ctx, contentObj.title, 5*wp, 5*hp, width, fontSize);

                fontSize = wp * 3;  //+ 标题
                ctx.font = `bold ${fontSize}px sans-serif`;  // 无衬线
                singboard.wrapText(ctx, contentObj.content, 5*wp, 15*hp, width, fontSize);
            });
        }
    }

}
