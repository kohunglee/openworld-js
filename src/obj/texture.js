/**
 * 纹理设置相关
 */
export default {

    // 纹理列表
    textureMap : new Map(),

    // 一个浏览器不知名的特性，为防止纹理被缓存，所以来个递增数防止重复
    loadTextureIndex : 1,

    // 一个异步函数，用于加载纹理
    loadTexture : function(drawFunclist) {
        return new Promise(resolve => {  // 避免重复添加纹理
            var allExist = true;
            for(var i = 0; i < drawFunclist.length; i++){
                if(this.textureMap.has(drawFunclist[i].id) === false) {  // 不重复添加
                    allExist = false;
                    const img = new Image();
                    img.onload = () => resolve(img);  // 或许可以直接传入 wjs，以后优化吧
                    img.id = drawFunclist[i].id + '-' + this.loadTextureIndex;
                    img.src = this.dToBase64(drawFunclist[i]);
                    this.textureMap.set(drawFunclist[i].id, img);
                    this.loadTextureIndex++;
                }
            }
            if(allExist) {resolve(null)};
        });
    },

    canvasObj : document.createElement('canvas'),

    // 给定 canvas 绘制程序，可以绘制纹理并返回 base64
    dToBase64 : function(drawItem) {  // 【之后优化】复用同一个 canvas 元素（清空并重绘），可以避免频繁创建和销毁 canvas 元素。
        const canvas = this.canvasObj;
        canvas.width = drawItem.width || 400;
        canvas.height = drawItem.height || 400;
        const ctx = canvas.getContext('2d')
        if(drawItem.type === 'png'){  // 为透明化作铺垫
            drawItem.func(ctx, canvas.width, canvas.height, drawItem, this);
            return canvas.toDataURL('image/png');
        } else {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            drawItem.func(ctx, canvas.width, canvas.height, drawItem, this);
            var quality = drawItem.quality || 0.7;
            return canvas.toDataURL('image/jpeg', quality);
        }
    },

    // 默认纹理（字符串声明的纹理不存在）
    errorTexture : function(ctx, width, height, drawItem, _this) {
        _this.hooks.emitSync('errorTexture_diy', ctx, width, height, drawItem, _this);  // 钩子：'自定义错误纹理' (后续再修改值，记得清除 textureMap)
    },
};