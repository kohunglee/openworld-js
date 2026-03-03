// 初始化
import k from '../../src/openworld.js';
globalThis.k = k;
k.initWorld('openworldCanv', true);

// 导入公共插件模块
import xmap from '@plugins/xmap.js';
import cookieSavePos from '@plugins/cookieSavePos.js';
import svgTextureLib from '@plugins/svgTextureLib.js';
import xdashpanel from '@plugins/xdashpanel.js';
import commModel from '@plugins/webgl/commModel.js';
import centerDot from '@plugins/centerDot_clean.js';
import sound from '@plugins/sound.js';
import testSampleAni from '@plugins/testSampleAni.js';
xmap(k, 2);            // 小地图
cookieSavePos(k);   // 保存当前位置
svgTextureLib(k);   // 纹理预设库
xdashpanel(k);      // 仪表盘
commModel(k);       // 基础模型库
centerDot(k);       // 开启中心点取物
sound(k);           // 声音插件
testSampleAni(k);   // 简单的人物动画实现

// 导入私有的插件模块
import mvp from './plugins/mvp/mvp.js';
mvp(k);

// 添加地面
const gX = 0, gY = -2.5, gZ = 0;
const gW = 250, gD = 250, gH = 6;
k.addPhy({ name:'ground-phy', X:gX, Y:gY, Z:gZ, width:gW, depth:gD, height:gH });  // 物理体
k.W.cube({ n:'ground', x:gX, y:gY, z:gZ, w:gW, d:gD, h:gH, t:marble, mix:0.7, b:'#7B8B6F', tile:[10, 10] });  // 渲染体

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



