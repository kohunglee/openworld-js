// 初始化 openworld 世界
import openworldApp from '@src/openworld.js';
globalThis.k = openworldApp;
k.initWorld('openworldCanv');

// 导入插件模块
import xmap from '@src/plugins/xmap.js';
import cookieSavePos from '@src/plugins/cookieSavePos.js';
import svgTextureLib from '@src/plugins/svgTextureLib.js';
import xdashpanel from '@src/plugins/xdashpanel.js';
import commModel from '@src/plugins/webgl/commModel.js';
import centerDot from '@src/plugins/centerDot_clean.js';
import sound from '@src/plugins/sound.js';
import build from '@src/plugins/centerDot/build.js';
import testSampleAni from '@src/plugins/testSampleAni.js';
xmap(k, 100, {x: -33, z: 32});            // 小地图
cookieSavePos(k);   // 保存当前位置
svgTextureLib(k);   // 纹理预设库
xdashpanel(k);      // 仪表盘
commModel(k);       // 基础模型库
centerDot(k);       // 开启中心点取物
sound(k);           // 声音插件
// build(k);           // 构建方块器
testSampleAni(k);   // 简单的人物动画实现

// 配置 DPZ 的参数
if(true){
    k.gridsize[4] = 6;
    k.gridsizeY[2] = 20;  // 指示牌（这三行是 Y 方向的 dpz 设定）
    k.gridsizeY[3] = 1.35;  // 大部分物体
    k.gridsizeY[4] = 1.35;  // 书本分层渲染
}

// 发布模式，不使用毛坯构建器
if(true){
    // 一些键盘事件
    const keyHandler = e => myevent.keyEvent(e, k);
    document.addEventListener('keydown', keyHandler);
    document.addEventListener('keyup', function(){
        document.addEventListener('keydown', keyHandler);
    });

    // 圆点单击事件
    k.hooks.on('hot_action', function(ccgxkObj, e){  // 热点事件
        const data = bookHot.getInfo(k.hotPoint);
        if(data){
            bookHot.jumpUrl(data[1]);
        }
    });
} else {
    document.body.insertAdjacentHTML('beforeend', '<div style="position:fixed;top:20px;left:50%;transform:translateX(-50%);font:bold 48px sans-serif;color:rgba(0,0,0,0.7);pointer-events:none;z-index:9999;">建造⚠️⚠️⚠️模式<br>请<br>退<br>出<br>⚠️</div>'); 
    build(k);// 毛坯构建器
}

// fps
(function(){var script=document.createElement('script');
script.onload=function(){var stats=new Stats();
document.body.appendChild(stats.dom);
requestAnimationFrame(function loop(){stats.update();requestAnimationFrame(loop)});};
script.src='./house/fps/fps.js';document.head.appendChild(script);})()

// baidu tongji
var _hmt = _hmt || [];
(function() {
    var hm = document.createElement("script");
    hm.src = "https://hm.baidu.com/hm.js?7f32626143786db9efbf3749f9a87aed";
    var s = document.getElementsByTagName("script")[0]; 
    s.parentNode.insertBefore(hm, s);
})();

k.star = (index) => {  // 闪烁按照 ID 寻找方块
    if(k.starInt){
        clearInterval(k.starInt);
        if(k.W.next['T'+ k.starID]?.hidden){
            k.W.next['T'+ k.starID].hidden = true;
        }
    }
    if(index){
        k.starInt = setInterval( (i = index) => {
            if(k.W?.next['T'+ i]){
                k.W.next['T'+ i].hidden = !k.W.next['T'+ i].hidden;
            }
        }, 100 );
        k.starID = index;
    }
}

// ------------------------------------

// 入口
k.loadTexture(k.svgTextureLib).then(loadedImage => {
    console.time('load-------------------');

    const funcs = [  // 详细看清楚各个函数的耗时
        makeGroundMvp,
        newMvp,
        startBuild,
        logicFunc,
        logicData,
        dataProcess,

        bookSysRegis,

        singboard.setBoard,
        setVK,
        dog.addDogM,
    ];

    for (const fn of funcs) {
        const name = fn.name || 'anonymous';
        console.time(name);
        fn();
        console.timeEnd(name);
    }

    console.timeEnd('load-------------------');
});

