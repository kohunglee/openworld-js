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

    // 方向标
    dirSign : (ctx, width, height, text) => {
        const wp = width / 100;
        const hp = height / 100;

        ctx.fillStyle = '#d8e1d8ff';  //+ 背景
        ctx.fillRect(0, 0, width, height);

        // 主标题
        ctx.font = `900 ${50 * hp}px "Microsoft YaHei", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = singboard.libRed;
        ctx.fillText(text, 50 * wp, 50 * hp);
    },

    // 统一几个主要配色，防止颜色杂乱难看
    libRed : '#e27b7bff',  // 主题色 红色
    libWhite : '#d8e1d8ff',  // 主题色 白色

    // 目前的板子设置函数（测试中）
    setBoard : () => {

        const borderList = [
            {  // 第一书架提示语
                id: 'firstTable',
                x: 16.712,
                y: 2.3,
                z: -35.212,
                ry: 90,
                w: 2,
                h: 1.5,
                dpz: 2,
            },
            {  // 入口标识 1
                id: 'enterSign1',
                x: 18.6,
                y: 5,
                z: -14.5,
                w: 2.2,
                h: 1,
                dpz: 2,
            },
            {  // 大门标识
                id: 'mainDoorSign',
                x: 16.2,
                y: 4.7,
                z: -30,
                w: 5,
                h: 1,
                dpz: 2,
                ry: -90,
            },
            {  // 右1 信息板
                id: 'right1Table',
                x: 16.273,
                y: 2.4,
                z: -24.165,
                w: 2.401,
                h: 1.601,
                dpz: 2,
                ry: -90,
            },
            {  // 右2 信息板
                id: 'right2Table',
                x: 16.273,
                y: 2.4,
                z: -21.3,
                w: 2.401,
                h: 1.601,
                dpz: 2,
                ry: -90,    
            },
            {   // 西 方向标
                id: "westSign",
                x: 19.152,
                y: 4.359,
                z: -30,
                w: 0.5,
                h: 0.5,
                dpz: 2,
                ry: 90,
            },

            {  // 东
                id: "eastSign",
                x: 50.303,
                y: 4.359,
                z: -30,
                w: 0.5,
                h: 0.5,
                dpz: 2,
                ry: -90,
            },

            { // 南
                id: "southSign",
                x: 34.7,
                y: 4.359,
                z: -24.3,
                w: 0.5,
                h: 0.5,
                dpz: 2,
                ry: 180,
            },     
            
            { // 北
                id: "northSign",
                x: 34.7,
                y: 4.359,
                z: -35.7,
                w: 0.5,
                h: 0.5,
                dpz: 2,
            },   

            {  // 二楼楼层标内
                id: "secondFloorSignIn",
                x: 49.644,
                y: 4.488,
                z: -24.15,
                w: 0.4,
                h: 0.2,
                dpz: 2,
                ry: 0,
            },

            {  // 二楼楼层标外
                id: "secondFloorSignOut",
                x: 52.7,
                y: 5.224,
                z: -15.763,
                w: 0.4,
                h: 0.2,
                dpz: 2,
                ry: -90,

            },   

            {  // 施工标识牌
                id: "constructionSign",
                x: 29.254,
                y: 2,
                z: -7.35,
                w: 1.8,
                h: 0.8,
                dpz: 2,
                ry: 0,
            },

        ];

        for(let i = 0; i < borderList.length; i++) {
            const item = borderList[i];
            k.addTABox({
                DPZ : item?.dpz || 3,
                X: item.x,
                Y: item.y,
                Z: item.z,
                rY: item.ry || 0,
                width : item.w,
                height: item.h,
                shape: 'plane',
                mixValue: 0,
                isInvisible: true,  // 在 W 引擎里，要先 hidden
                isPhysical: false,
                texture: item.id,
            })
        }

        k.errExpRatio = 500;

        k.hooks.on('errorTexture_diy', function(ctx, width, height, drawItem, _this){  // 调用钩子设定绘制规则
            const index = drawItem.index;
            const id = drawItem.id;
            if(singboard[id]){
                singboard[id](ctx, width, height, drawItem, _this);
                k.W.next['T' + index].hidden = false;
                _this.indexToArgs.get(index).isInvisible = false;
            } else {
                ctx.fillStyle = '#ff0000ff';  //+ 警告背景，警告未设置背景绘制函数
                ctx.fillRect(0, 0, width, height);
                // k.W.next['T' + index].hidden = false;  // 如果要发布，则这个要注释掉，这是未填充内容的板块
                //  _this.indexToArgs.get(index).isInvisible = false;
            }
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
    这是本馆第一个被投入使用的书架，内容是一份网站列表，可被理解为全球流量最高的前 1000 个网站 😁。（数据来源于权威的网站分析团队 Tranco List: https://tranco-list.eu/ ）

    我们剔除了其中一些不宜展示的网站，然后再根据其排名大小，在书架上，以从左自右、从上到下的顺序依次排列，如：谷歌是第一名，位于最上层最左面。欢迎大家参阅，发现新世界！

    大家参阅时，要灵活使用【跳跃E】和【冻结F】两个键盘键位，同时搭配左右移动键位。如果单击鼠标左键，会进入第一视角点选模式，这时，光标选中某个条目，屏幕左上角会出现详细条目，再次单击左键，会回到鼠标模式，于是我们可以单击链接进入网站了。

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
            ctx.fillStyle = '#e27b7bff';  // 箭头颜色
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

    // 入口标识 1 的绘制函数
    enterSign1 : (ctx, width, height, drawItem, _this) => {
        const wp = width /100;
        const hp = height /100;
        let fontSize;

        ctx.fillStyle = '#d8e1d8ff';  //+ 背景
        ctx.fillRect(0, 0, width, height);
        
        // 绘制向左箭头（从右指向左）
        ctx.fillStyle = '#e27b7bff';
        ctx.beginPath();
        ctx.moveTo(8 * wp, 50 * hp);  // 箭头尖端
        ctx.lineTo(20 * wp, 30 * hp);  // 右上角
        ctx.lineTo(20 * wp, 70 * hp);  // 右下角
        ctx.closePath();
        ctx.fill();
        
        // 绘制"入口在此"文字
        ctx.fillStyle = '#333333';
        ctx.font = `bold ${30 * hp}px sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('入口在这边', 25 * wp, 50 * hp);
    },

    // 大门标识的绘制函数
    mainDoorSign : (ctx, width, height, drawItem, _this) => {
        const wp = width / 100;
        const hp = height / 100;

        // 主标题
        ctx.font = `900 ${50 * hp}px "Microsoft YaHei", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = singboard.libRed;
        ctx.fillText('网 站 收 藏 馆', 50 * wp, 50 * hp);
    },

    // 西 标
    westSign : (ctx, width, height, drawItem, _this) => {
        singboard.dirSign(ctx, width, height, '西');
    },

    // 东 标
    eastSign : (ctx, width, height, drawItem, _this) => {
       singboard.dirSign(ctx, width, height, '东');
    },

    // 南 标
    southSign : (ctx, width, height, drawItem, _this) => {
       singboard.dirSign(ctx, width, height, '南');
    },

    // 北 标
    northSign : (ctx, width, height, drawItem, _this) => {
        singboard.dirSign(ctx, width, height, '北');
    },

    // 二楼 标 in
    secondFloorSignIn : (ctx, width, height, drawItem, _this) => {
        singboard.dirSign(ctx, width, height, '二楼');
    },

    // 二楼 标 out
    secondFloorSignOut : (ctx, width, height, drawItem, _this) => {
        singboard.dirSign(ctx, width, height, '二楼');
    },

    // 施工牌
    constructionSign : (ctx, width, height, drawItem, _this) => {
      
    const wp = width / 100;
    const hp = height / 100;

    // 背景 - 明亮的黄色警示色
    ctx.fillStyle = '#FFF9C4';
    ctx.fillRect(0, 0, width, height);

    // 斑马条纹装饰
    ctx.fillStyle = 'rgba(255, 87, 34, 0.15)';
    for (let i = 0; i < 8; i++) {
        const y = i * 12 * hp;
        if (i % 2 === 0) {
            ctx.fillRect(0, y, width, 6 * hp);
        }
    }

    // 橙色边框
    ctx.strokeStyle = '#FF9800';
    ctx.lineWidth = 3 * wp;
    ctx.strokeRect(5 * wp, 5 * hp, width - 10 * wp, height - 10 * hp);


    // 可爱的施工图标 - 安全帽
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#FFC107';
    ctx.beginPath();
    ctx.arc(50 * wp, 85 * hp, 12 * wp, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#FF9800';
    ctx.beginPath();
    ctx.arc(50 * wp, 85 * hp, 10 * wp, 0, Math.PI);
    ctx.fill();


    
    ctx.beginPath();
    ctx.arc(80 * wp, 25 * hp, 4 * wp, 0, Math.PI * 2);
    ctx.fill();


    // 第一行文字 - 仍在施工
    ctx.font = `bold ${32 * hp}px "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FF5722';
    ctx.shadowBlur = 8 * hp;
    ctx.fillText('仍 在 施 工', 50 * wp, 40 * hp);

    // 第二行文字 - 敬请期待
    ctx.font = `bold ${28 * hp}px "Microsoft YaHei", sans-serif`;
    ctx.fillStyle = '#E64A19';
    ctx.shadowBlur = 6 * hp;
    ctx.fillText('敬 请 期 待', 50 * wp, 70 * hp);
        
    },

}
