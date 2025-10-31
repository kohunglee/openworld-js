const singboard = {

    setTest : () => {

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
                texture: 'www', 
            });

            k.errExpRatio = 100;

            k.hooks.on('errorTexture_diy', function(ctx, width, height, drawItem, _this){
                console.log('开始造纹理', width, height);
                console.log(drawItem);

                // // 绘制红色背景
                // ctx.fillStyle = 'rgba(216, 202, 175, 1)';
                // ctx.fillRect(0, 0, width, height);

                // // 绘制黑色文字
                // ctx.fillStyle = 'rgba(24, 24, 24, 1)';
                // ctx.font = '20px sans-serif';
                // ctx.textBaseline = 'top';
                // ctx.textAlign = 'left';
                // ctx.fillText('你好，右边这个书架', 10, 40);
                // ctx.fillText('有字了啊啊啊！', 10, 70);



    // 优雅的米白底色
    ctx.fillStyle = '#F5F1E8';
    ctx.fillRect(0, 0, width, height);
    
    // 木质边框装饰
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(0, 0, width, 3);
    ctx.fillRect(0, height-3, width, 3);
    
    // 主标题 - 优雅衬线字体
    ctx.fillStyle = '#2C1810';
    ctx.font = 'bold 18px "Noto Serif SC", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('你好', width/2, height/3);
    
    // 副标题 - 简洁无衬线
    ctx.fillStyle = '#5D4037';
    ctx.font = '14px "Noto Sans SC", sans-serif';
    ctx.fillText('右边这个书架', width/2, height/2);
    ctx.fillText('有内容了', width/2, height*2/3);
    
    // 点缀小箭头 →
    ctx.font = '16px serif';
    ctx.fillText('→', width-15, height/2);




            });
        }
    }

}