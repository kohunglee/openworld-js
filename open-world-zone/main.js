// 初始化
import k from '../../src/openworld.js';
globalThis.k = k;
k.initWorld('openworldCanv', true);
k.mode = +new URLSearchParams(location.search).get('mode');  // 展示模式，自用

// 导入公共插件模块
import xmap from '@plugins/xmap.js';
xmap(k, 1);         // 小地图
import cookieSavePos from '@plugins/cookieSavePos.js';
cookieSavePos(k);   // 保存当前位置
import xdashpanel from '@plugins/xdashpanel.js';
xdashpanel(k);      // 仪表盘
import sound from '@plugins/sound.js';
sound(k);      // 仪表盘
import centerDot from '@plugins/centerDot_clean.js';
centerDot(k);       // 开启中心点取物
import testSampleAni from '@plugins/testSampleAni.js';
testSampleAni(k);   // 简单的人物动画实现
import build from '@plugins/build/build.js';
if (k.mode === 0) { build(k) } // 建造器

// 导入私有的插件模块
import dataProc from './plugins/dataProc/dataProc.js';  // 数据处理，万数块 系统
dataProc(k);
import mvp from './plugins/mvp/mvp.js';  // 主角
mvp(k);
import symoffset from './plugins/symoffset/symoffset.js';  // 对称阵列工具
symoffset(k);
import signBoard_lab from './plugins/signboard_lab/signTest.js';  // 纹理研究测试工具
signBoard_lab(k);
import build_lab from './plugins/build_lab/build_lab.js';  // 建造器使用的容器
build_lab(k);
import xhall from './plugins/xhall/build_lab.js';  // 第一个成品建筑
xhall(k);
import somecube from './plugins/somecube/somecube.js';  // 几个实验块儿
somecube(k);
import normalevent from './plugins/normalevent/normalevent.js';  // 常用的事件
normalevent(k);
import tab from './plugins/tab/tab.js';  // tab 侧边框里的内容
tab(k);

// import signboard from './plugins/signboard/signboard.js';  // 指示牌测试
// signboard(k);



// 添加地面
const gX = 0, gY = -2.5, gZ = 0;
const gW = 2500, gD = 2500, gH = 6;
k.addPhy({ name:'ground-phy', X:gX, Y:gY, Z:gZ, width:gW, depth:gD, height:gH });  // 物理体
k.W.cube({ n:'ground', x:gX, y:gY, z:gZ, w:gW, d:gD, h:gH, t:marble, b: '#ceffa8', mix: 0.6, tile:[50, 50] });  // 渲染体

// 添加主角
const lastPos = k?.lastPos || {x:21 + Math.random() * 10, y:5.00, z:15 + Math.random() * 10, rX:0, rY:0, rZ:0};
k.keys.turnRight = lastPos.rY;
k.mainVPlayer = k.addPhy({ name:'mainPlayer',t:marble,mix:0.3, X:lastPos.x, Y:lastPos.y + 1, Z:lastPos.z, size:1, mass:50, colliGroup:1 });
k.W.cube({ n:'mainPlayer', b:'#FDF9EE' });  // 注意，主角的 n 一定要与物理体的 name 一致

// fps
(function(){var script=document.createElement('script');
script.onload=function(){var stats=new Stats();
document.body.appendChild(stats.dom);
requestAnimationFrame(function loop(){stats.update();requestAnimationFrame(loop)});};
script.src='./assest/fps.js';document.head.appendChild(script);})()

// 其他
k.centerDot.setCamView(2);  // 设置摄像机视角位置为第 2 类型



