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

                // 绘制红色背景
                ctx.fillStyle = '#ff0000ff';
                ctx.fillRect(0, 0, width, height);

                // 绘制黑色文字
                ctx.fillStyle = '#000000ff';
                ctx.font = '20px sans-serif';
                ctx.textBaseline = 'top';
                ctx.textAlign = 'left';
                ctx.fillText('你好，右边这个书架！', 10, 40);
                ctx.fillText('有字了啊啊啊！', 10, 70);
            });
        }


        // (async () => {
        //     // 创建一个 OffscreenCanvas（不依赖 DOM）
        //     const off = new OffscreenCanvas(400, 400);
        //     const ctx = off.getContext('2d');

        //     // 绘制红色背景
        //     ctx.fillStyle = 'red';
        //     ctx.fillRect(0, 0, 400, 400);

        //     // 绘制黑色文字
        //     ctx.fillStyle = 'black';
        //     ctx.font = '40px sans-serif';
        //     ctx.textBaseline = 'middle';
        //     ctx.textAlign = 'center';
        //     ctx.fillText('你好', 200, 200);

        //     // 将 OffscreenCanvas 转为 Blob，再转为 base64
        //     const blob = await off.convertToBlob({ type: 'image/png' });
        //     const reader = new FileReader();
        //     reader.readAsDataURL(blob);
        //     reader.onloadend = () => {
        //         const base64 = reader.result;
        //         console.log(base64); // base64 图片字符串
        //         // 可选：展示出来
        //         // const img = document.createElement('img');
        //         // img.src = base64;
        //         // document.body.appendChild(img);
        //     };
        // })();

    }

}