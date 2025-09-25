/**
 * 中心点插件 清爽版
 * ========
 * obj.hotPoint ： 当前的 hot index id
 */

// 全局变量
var globalVar;
let canvas, pointObjIndex;

// 插件入口
export default function(ccgxkObj) {
    ccgxkObj.centerDot = {  // 初始化 公共变量
        /**
         * 绘制中心圆点
         * @function drawPoint
         * @memberof globalVar
         * @param {HTMLCanvasElement} canvas - 要绘制点的画布元素
         * @param {Object} thisObj - openworld obj
         * @param {boolean} [isClear=false] - 是否清空画布，默认为false
         * @returns {number|void} - 无返回值
         */
        drawPoint : (canvas, thisObj, isClear) => {
            if(thisObj.drawPointPause){return 0;}  // 暂停
            if(isClear) { canvas.width = 0; canvas.height = 0; return 0; }  // 清空
            if(canvas.width === 0 || canvas.width === 1){
                canvas.width = 20;
                canvas.height = 20;
            }
            const ctx = canvas.getContext('2d');
            thisObj.W.getColorPickObj();  // 拾取颜色一次
            const colorArray = thisObj.W.tempColor || [255, 0, 0, 255];  //+2 获取当前颜色值并转化为数组
            const color = `rgba(${255 - colorArray[0]}, ${255 - colorArray[1]}, ${255 - colorArray[2]}, ${colorArray[3]/255})`;
            const objIndex = colorArray[0] * 256 ** 2 + colorArray[1] * 256 + colorArray[2] - 1;  // 根据颜色获取到了对应的 index 值
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if(objIndex >= 0 && objIndex < 2_000_000){
                thisObj.hotPoint = objIndex;
                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.arc(
                    canvas.width / 2,
                    canvas.height / 2,
                    9,                
                    0,                
                    Math.PI * 2       
                );
                ctx.lineWidth = 2;
                ctx.stroke(); 
            } else {
                thisObj.hotPoint = -1;
            }
            pointObjIndex.innerHTML = thisObj.hotPoint;
            thisObj.hooks.emitSync('draw_point_before', thisObj);  // 钩子：draw point before
            ctx.beginPath();
            ctx.arc(  
                canvas.width / 2,
                canvas.height / 2,
                5,
                0,
                Math.PI * 2
            );
            ctx.fillStyle = color;
            ctx.fill();  // 绘制圆点
        },

        // 建造师的 html 内容
        htmlCode : `
            <style>
                .pointObjIndex {
                    position: fixed;
                    top: 50px;
                    left: 10px;
                    color: white;
                }
                .EdiArgsInput, #objID {
                    background-color: #fff0f066;
                    width: 50px;
                }
            </style>
            <span id="pointObjIndex" class="pointObjIndex">0</span>
            <canvas id="centerPoint" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);" width="1" height="1"></canvas>
        `,


        /**
         * 开启点
         * 默认用于鼠标左键
         */
        openPoint : (ccgxkObj) => {
            if(W.makeFBOSucess !== true){ W.makeFBO() }
            globalVar.drawPoint(canvas, ccgxkObj, false, 2);
            ccgxkObj.centerPointColorUpdatax = setInterval(() => {
                globalVar.drawPoint(canvas, ccgxkObj, false, 3);
            }, 100);

            if(ccgxkObj.centerDot.init){  // 注意，这是插件测试，在下面的关闭也有，后续再优化位置，现在速度为先！
                ccgxkObj.centerDot.init.setCamView('first');
            } else {
                ccgxkObj.mainCamera.pos = {x:0, y:0.9, z:-0.8};
            }
            
        },


        /**
         * 关闭点
         * 默认用于鼠标右键
         */
        closePoint : (ccgxkObj) => {
            globalVar.drawPoint(canvas, ccgxkObj, true, 1);
            clearInterval(ccgxkObj.centerPointColorUpdatax);
            ccgxkObj.centerPointColorUpdatax = null;  // 避免重复清除
            if(ccgxkObj.centerDot.init){
                ccgxkObj.centerDot.init.setCamView('third');
            } else {
                ccgxkObj.mainCamera.pos = {x: 0, y: 2, z: 4};
            }
        },

 
    };
    globalVar = ccgxkObj.centerDot;
    const template = document.createElement('template');  //+4 将 html 节点添加到文档
    template.innerHTML = globalVar.htmlCode;
    const content = template.content.cloneNode(true);
    document.body.appendChild(content);
    canvas = document.getElementById('centerPoint');  // 画板
    pointObjIndex = document.getElementById('pointObjIndex');  // 热点物体的 index
    globalVar.ccgxkObj = ccgxkObj;
    const W = ccgxkObj.W;
    W.tempColor = new Uint8Array(4);  // 临时储存颜色，供本插件使用
    W.makeFBO = () => {
        W.pickingFBO = W.gl.createFramebuffer();
        W.gl.bindFramebuffer(W.gl.FRAMEBUFFER, W.pickingFBO);
        W.pickingTexture = W.gl.createTexture();  //+4 为FBO创建纹理附件（相当于排练室的“幕布”）
        W.gl.bindTexture(W.gl.TEXTURE_2D, W.pickingTexture);
        W.gl.texImage2D(W.gl.TEXTURE_2D, 0, W.gl.RGBA, W.canvas.width, W.canvas.height, 0, W.gl.RGBA, W.gl.UNSIGNED_BYTE, null);
        W.gl.framebufferTexture2D(W.gl.FRAMEBUFFER, W.gl.COLOR_ATTACHMENT0, W.gl.TEXTURE_2D, W.pickingTexture, 0);
        W.pickingRenderbuffer = W.gl.createRenderbuffer();  //+4 为FBO创建深度附件（相当于排练室的“地板”，保证3D效果正确）
        W.gl.bindRenderbuffer(W.gl.RENDERBUFFER, W.pickingRenderbuffer);
        W.gl.renderbufferStorage(W.gl.RENDERBUFFER, W.gl.DEPTH_COMPONENT16, W.canvas.width, W.canvas.height);
        W.gl.framebufferRenderbuffer(W.gl.FRAMEBUFFER, W.gl.DEPTH_ATTACHMENT, W.gl.RENDERBUFFER, W.pickingRenderbuffer);
        if (W.gl.checkFramebufferStatus(W.gl.FRAMEBUFFER) !== W.gl.FRAMEBUFFER_COMPLETE) {  //+3 检查FBO是否创建成功
            console.error("秘密排练室（FBO）创建失败！");
        } else { W.makeFBOSucess = true; }
        W.whiteTexture = W.gl.createTexture();  //+3 创建一个纯白图片，用于阴影贴图使用
        W.gl.bindTexture(W.gl.TEXTURE_2D, W.whiteTexture);
        W.gl.texImage2D(W.gl.TEXTURE_2D, 0, W.gl.RGBA, 1, 1, 0, W.gl.RGBA, W.gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
        W.gl.bindFramebuffer(W.gl.FRAMEBUFFER, null);  // 解绑，让绘制回到主舞台
    }
    W.getColorPickObj = () => {  // 获取屏幕中心物体颜色值
        const player = W.next['mainPlayer'];
        if (!player) return;
        W.gl.bindFramebuffer(W.gl.FRAMEBUFFER, W.pickingFBO);  // 切换到 FBO 里
        W.gl.clearColor(0.0, 0.0, 0.0, 1.0); // 黑背景
        W.gl.clear(W.gl.COLOR_BUFFER_BIT | W.gl.DEPTH_BUFFER_BIT); // 清空排练室
        for (const index of ccgxkObj.currentlyActiveIndices) {
            const obj = W.next['T' + index];
            if (!obj) continue;
            var obj_proxy = {...obj};  // 创建代理，想办法将代理显示成纯色
            obj_proxy.b = (index+1).toString(16).padStart(6, '0');
            obj_proxy.ns = 1;
            obj_proxy.mix = 1;
            W.gl.activeTexture(W.gl.TEXTURE0);
            W.gl.bindTexture(W.gl.TEXTURE_2D, null);  // 清空纹理贴图
            W.gl.activeTexture(W.gl.TEXTURE0 + 3);
            W.gl.bindTexture(W.gl.TEXTURE_2D, W.whiteTexture);  // 使用 纯白 贴图代替阴影深度图（以便清除阴影）
            W.render(obj_proxy, 0);
        }
        var player_proxy = {...player};  // 创建代理，想办法将代理显示成纯色
        player_proxy.b = '#f00';
        player_proxy.ns = 1;
        player_proxy.mix = 1;
        W.gl.activeTexture(W.gl.TEXTURE0);
        W.gl.bindTexture(W.gl.TEXTURE_2D, null);  // 清空纹理贴图
        W.gl.activeTexture(W.gl.TEXTURE0 + 3);
        W.gl.bindTexture(W.gl.TEXTURE_2D, W.whiteTexture);  // 使用 纯白 贴图代替阴影深度图（以便清除阴影）
        W.render(player_proxy, 0);
        const pixels = new Uint8Array(4);  // 取点
        W.gl.readPixels(W.gl.canvas.width / 2, W.gl.canvas.height / 2, 1, 1, W.gl.RGBA, W.gl.UNSIGNED_BYTE, pixels);
        W.gl.bindFramebuffer(W.gl.FRAMEBUFFER, null);
        W.clearColor(ccgxkObj.colorClear); // 恢复主画布的背景色
        W.tempColor = pixels;
    }

    ccgxkObj.hooks.on('pointer_lock_click', function(ccgxkObj, e){
        if(ccgxkObj.centerPointColorUpdatax || e.button === 2){  
            if(ccgxkObj.hotPoint >= 0 && e.button !== 2) {  // 如果有热点，单击热点后，触发热点事件
                ccgxkObj.hooks.emitSync('hot_action', ccgxkObj, e);  // 钩子：鼠标单击热点事件 hotAction()
            } else {  // 右键关闭小点 // PS: 火狐浏览器无法右键关闭，暂时无解
                ccgxkObj.hooks.emitSync('close_point', ccgxkObj, e);
                globalVar.closePoint(ccgxkObj);
            }
        } else {  // 开启小点
            ccgxkObj.hooks.emitSync('open_point', ccgxkObj, e);  // 钩子：open point
            globalVar.openPoint(ccgxkObj);
        }
    });
}