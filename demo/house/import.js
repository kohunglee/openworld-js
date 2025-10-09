// 回原点
// k.mainVPlayer.body.position.x = 7.6;
// k.mainVPlayer.body.position.y = 500;
// k.mainVPlayer.body.position.z = 16.5;

// 初始化 openworld 世界
import openworldApp from '../../src/openworld.js';
window.k = openworldApp;
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
