/**
 * 挂载到 hook 上
 * 
 * 这个就是 引擎 如何处理自定义纹理的逻辑
 */
export default function(ccgxkObj, signFunc) {
    ccgxkObj.errExpRatio = 50;  // 调节绘制分辨率(以 100 为基准，越大越清晰)
    ccgxkObj.hooks.on('errorTexture_diy', function(ctx, width, height, drawItem, _this){  // 调用钩子设定绘制规则
        const index = drawItem.index;
        const id = drawItem.id;
        if(signFunc[id]){  // 这个就是 func
            signFunc[id](ctx, width, height, drawItem, _this);
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