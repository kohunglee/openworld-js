// 回原点
// k.mainVPlayer.body.position.x = 7.6;
// k.mainVPlayer.body.position.y = 500;
// k.mainVPlayer.body.position.z = 16.5;

// 初始化 openworld 世界
import openworldApp from '../../src/openworld.js';
globalThis.k = openworldApp;
k.initWorld('openworldCanv');

// 导入插件模块
import xmap from '../../src/plugins/xmap.js';
import cookieSavePos from '../../src/plugins/cookieSavePos.js';
import svgTextureLib from '../../src/plugins/svgTextureLib.js';
import xdashpanel from '../../src/plugins/xdashpanel.js';
import commModel from '../../src/plugins/webgl/commModel.js';
import centerDot from '../../src/plugins/centerDot_clean.js';
import sound from '../../src/plugins/sound.js';
import build from '../../src/plugins/centerDot/build.js';
import testSampleAni from '../../src/plugins/testSampleAni.js';
xmap(k);            // 小地图
cookieSavePos(k);   // 保存当前位置
svgTextureLib(k);   // 纹理预设库
xdashpanel(k);      // 仪表盘
commModel(k);       // 基础模型库
centerDot(k);       // 开启中心点取物
sound(k);           // 声音插件
build(k);           // 构建方块器
testSampleAni(k);   // 简单的人物动画实现

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

k.minY = 1.35;



// 入口
// 加载预设纹理，开始程序
k.loadTexture(k.svgTextureLib).then(loadedImage => {
    console.time('load');
    makeGroundMvp();
    newMvp();
    startBuild();
    logicFunc();
    logicData();
    dataProcess();
    bookSysRegis();
    setVK();
    console.timeEnd('load');
});


// fps 辅助
(function(){var script=document.createElement('script');
script.onload=function(){var stats=new Stats();
document.body.appendChild(stats.dom);
requestAnimationFrame(function loop(){stats.update();requestAnimationFrame(loop)});};
script.src='https://mrdoob.github.io/stats.js/build/stats.min.js';document.head.appendChild(script);})()

// baidu tongji
var _hmt = _hmt || [];
(function() {
    var hm = document.createElement("script");
    hm.src = "https://hm.baidu.com/hm.js?7f32626143786db9efbf3749f9a87aed";
    var s = document.getElementsByTagName("script")[0]; 
    s.parentNode.insertBefore(hm, s);
})();