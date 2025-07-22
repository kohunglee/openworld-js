/**
 * 纹理设置相关
 */
export default {

    // 纹理列表
    textureMap : new Map(),

    // 一个浏览器不知名的特性(bug)，为防止纹理被缓存，所以搞了个递增数，防止重复
    loadTextureIndex : 1,

    // 用于光栅化 canvas 使用的临时 canvas
    rasterizeCanvas : document.createElement('canvas'),

    // 一个异步函数，用于加载纹理
    loadTexture : function(drawFunclist) {
        const texturePromises = [];  // 任务看板（全部完成才返回）
        for(var i = 0; i < drawFunclist.length; i++){
            const drawItem = drawFunclist[i];
            if(this.textureMap.has(drawItem.id) === true) {  // 纹理已经存在
                texturePromises.push(Promise.resolve(this.textureMap.get(drawItem.id)));
                continue;
            }
            const promise = new Promise(resolve => {  // 纹理不存在，异步生成
                if (drawItem.type === 'svg-rasterize') {  // 处理光栅化 svg（异步繁琐，所以放到这里）
                    const svgImage = new Image();
                    svgImage.onload = () => {
                        const canvas = this.rasterizeCanvas;
                        canvas.width = drawItem.width || 400;
                        canvas.height = drawItem.height || 400;
                        const ctx = canvas.getContext('2d');
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(svgImage, 0, 0, canvas.width, canvas.height);
                        const pngBase64 = canvas.toDataURL('image/png');
                        const finalImage = new Image();
                        finalImage.onload = () => {
                            this.textureMap.set(drawItem.id, finalImage);
                            resolve(finalImage); // Promise完成，返回最终的PNG图片对象
                        };
                        finalImage.src = pngBase64;
                    };
                    const svgBlob = new Blob([drawItem.svgCode], { type: 'image/svg+xml' });
                    svgImage.src = URL.createObjectURL(svgBlob);
                } else {
                    const img = new Image();
                    img.onload = () => {
                        this.textureMap.set(drawItem.id, img);
                        this.loadTextureIndex++;
                        resolve(img);
                    }
                    img.id = drawItem.id + '-' + this.loadTextureIndex;
                    img.src = this.dToBase64(drawItem);
                }
            });
            texturePromises.push(promise);
        }
        return Promise.all(texturePromises);
    },

    canvasObj : document.createElement('canvas'),

    // 给定 canvas 绘制程序，可以绘制纹理并返回 base64
    dToBase64 : function(drawItem) {  // 【之后优化】复用同一个 canvas 元素（清空并重绘），可以避免频繁创建和销毁 canvas 元素。
        if(drawItem.type === 'svg') {
            const svgString = drawItem.svgCode;
            const safeSvgString = svgString.replace(/#/g, '%23');  // 对'#'进行编码，确保URL正确
            return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(safeSvgString);
        }
        const canvas = this.canvasObj;
        canvas.width = drawItem.width || 400;
        canvas.height = drawItem.height || 400;
        canvas.style.webkitFontSmoothing = 'antialiased';  // 两款浏览器的平滑字体兼容（可能有效）
        canvas.style.mozOsxFontSmoothing = 'grayscale';
        const ctx = canvas.getContext('2d')
        if(drawItem.type === 'png'){  // 为透明化作铺垫
            drawItem.func(ctx, canvas.width, canvas.height, drawItem, this);
            return canvas.toDataURL('image/png');
        } else if(drawItem.type === 'jpg') {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            drawItem.func(ctx, canvas.width, canvas.height, drawItem, this);
            var quality = drawItem.quality || 0.7;
            return canvas.toDataURL('image/jpeg', quality);
        } else {}
    },

    // 默认纹理（字符串格式的声明的纹理，不存在时，会激活）
    errorTexture : function(ctx, width, height, drawItem, _this) {
        _this.hooks.emitSync('errorTexture_diy', ctx, width, height, drawItem, _this);  // 钩子：'自定义错误纹理' (后续再修改值，记得清除 textureMap)
    },
};