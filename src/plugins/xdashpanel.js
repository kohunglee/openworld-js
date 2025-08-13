/**
 * 简易仪表盘插件
 * ========
 * 显示 FPS 、物体数量、内存占用等
 */

// 插件入口
export default function(ccgxkObj) {
    const template = document.createElement('template');  //+4 将 html 节点添加到文档
    template.innerHTML = htmlCode;
    const content = template.content.cloneNode(true);
    document.body.appendChild(content);

    shiftInfo.textContent = '速度:' + 0 + ' | ' // 【测试，临时】

    ccgxkObj.fpsFrameCount = 0;  //+ FPS 计算的辅助值
    ccgxkObj.lastTime = performance.now();

    ccgxkObj.isFirstShowFPS = true;  //+ 显示 FPS 和 内存 等... (所有一秒一次的函数)
    ccgxkObj.showFPS1S = function(){
        var currentTime = performance.now();
        var deltaTime = currentTime - this.lastTime;
        this.fpsFrameCount++;
        if(deltaTime > 1000 || this.isFirstShowFPS){
            this.isFirstShowFPS = false;
            var fps = this.fpsFrameCount / (deltaTime / 1000);
            this.fpsFrameCount = 0;
            this.lastTime = currentTime;
            this._showMemory();  // 一秒显示一次内存
            this.displayPOS();  // 一秒显示一次显示主角坐标
            const mVP = this.mainVPlayer;
            var dynaNodesCon = this.calPosID(mVP?.X, mVP?.Y, mVP?.Z, 2);
            posIDMVP.textContent = dynaNodesCon.replace(/[Dd]/g,'东').replace(/[Xx]/g,'西').replace(/[Nn]/g,'南').replace(/[Bb]/g,'北');  // 一秒显示一次主角位置编码
            fpsInfo.textContent = ('FPS：' + fps.toFixed(1) + '  ，渲染：' + this.W.drawTime );  // 一秒显示一次 FPS
            modListCount.textContent = ('当前模型数：' + this.bodylist.length +
                                        ' - ❀' + this.bodylistNotPys.length +
                                        ' - 口' + this.bodylistMass0.length +
                                        ' - ⚡️ ' +this.currentlyActiveIndices.size +
                                        `（can ${this.world.bodies.length} | w ${this._calWNotHidden()}）` +
                                        `（${this.indexToArgs.size}）` +
                                        `（纹理：${this.textureMap.size}）` +
                                        ' |');
        }
    }

    ccgxkObj._showMemory = function(){  //+ 显示内存占用情况
        var output = document.getElementById('metrics');
        if (performance.memory) {
            const mem = performance.memory;
            output.textContent = `内存: ${(mem.usedJSHeapSize/1048576).toFixed(1)}MB/` +
                    `${(mem.jsHeapSizeLimit/1048576).toFixed(1)}MB`  + ' | ';
        }
    }

    ccgxkObj._calWNotHidden = function() {  // 计算没有被 hidden 的 Webgl 元素数量
        let length = 0;
        for (var key in this.W.next) {
            const item = this.W.next[key];
            if (item.hidden !== true) {
                length++;
            }
        }
        return length;
    }


    ccgxkObj.hooks.on('animatePreFrame', function(_this){
        _this.showFPS1S(); // 显示 FPS 和 一秒一次 的函数
    });
    
}

const htmlCode = `
<style>
    .myHUD {
        position: absolute;
        bottom: 5px;
        padding: 0.3em;
        color: #ffffff;
    }
</style>
<div id="myHUD" class="myHUD">
    <div id="fpsInfo"></div>
    <span id="shiftInfo"></span>
    <span id="posInfo"></span>
    <span id="metrics"></span>
    <span id="cpuInfo"></span>
    <span id="modListCount"></span>
    <span id="posIDMVP"></span>
</div>
`;