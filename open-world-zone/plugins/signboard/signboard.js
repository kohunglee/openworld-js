/**
 * 测试 信息板 插件
 * ========
 * 测试一下，信息板怎么用
 */
export default function(ccgxkObj) {

    const signboard = {

        // 东 标
        eastSign : (ctx, width, height, drawItem, _this) => {
            signboard.dirSign(ctx, width, height, '东');
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
            ctx.fillStyle = signboard.libRed;
            ctx.fillText(text, 50 * wp, 50 * hp);
        },

    };

    ccgxkObj.errExpRatio = 500;
    ccgxkObj.hooks.on('errorTexture_diy', function(ctx, width, height, drawItem, _this){  // 调用钩子设定绘制规则
        const index = drawItem.index;
        const id = drawItem.id;
        if(signboard[id]){
            signboard[id](ctx, width, height, drawItem, _this);
            ccgxkObj.W.next['T' + index].hidden = false;
            _this.indexToArgs.get(index).isInvisible = false;
        } else {
            ctx.fillStyle = '#ff0000ff';  //+ 警告背景，警告未设置背景绘制函数
            ctx.fillRect(0, 0, width, height);
            // ccgxkObj.W.next['T' + index].hidden = false;  // 如果要发布，则这个要注释掉，这是未填充内容的板块
            //  _this.indexToArgs.get(index).isInvisible = false;
        }
    })

    const data = [
        {"x":11.902,"y":10,"z":11.769,"w":10,"h":10, "dz": 1, "st": 1, "t":"eastSign"},
    ];

    ccgxkObj.dataProc.process({
        data: data,
        name: 'texture-test',
        type: 1,
        invisible: false, noIns: true,  // 纹理使用这种组合
    });

}