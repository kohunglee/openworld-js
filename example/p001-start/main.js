// 初始化
import k from '../../src/openworld.js';
globalThis.k = k;
k.initWorld('openworldCanv', true);

// 添加地面
const gX = 0, gY = -2.5, gZ = 0;
const gW = 250, gD = 250, gH = 6;
k.addPhy({ name:'ground-phy', X:gX, Y:gY, Z:gZ, width:gW, depth:gD, height:gH });  // 物理体
k.W.cube({ n:'ground', x:gX, y:gY, z:gZ, w:gW, d:gD, h:gH, b:'#7B8B6F' });  // 渲染体

// 添加主角
k.mainVPlayer = k.addPhy({ name:'mainPlayer', X:10, Y:3, Z:10, size:1, mass:50, colliGroup:1 });
k.W.cube({ n:'mainPlayer', b:'#FDF9EE' });  // 注意，主角的 n 一定要与物理体的 name 一致
