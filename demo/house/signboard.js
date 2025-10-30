const singboard = {

    setTest : () => {

        k.addTABox({
            DPZ : 2,
            X: 16.712,
            Y: 2.3,
            Z: -35.212,
            rY: 90,
            width : 2,
            height: 1.5,
            shape: 'plane',
            mix: 1,
            isPhysical: false,
            texture: 'www', 
        });

        k.errExpRatio = 100;

        k.hooks.on('errorTexture_diy', function(ctx, width, height, drawItem, _this){
            console.log('开始造纹理');
            console.log(drawItem);

            ctx.fillStyle = '#ff0000ff';
            ctx.fillRect(1, 1, width/2, height/2);
        });
    }

}