// WJS 初级使用示例 - 开放世界引擎版
import k from '../../src/openworld.js';
globalThis.k = k;
k.initWorld('openworldCanv', true);

// 地面（物理+渲染）
const gX = 0, gY = -2.5, gZ = 0, gW = 250, gD = 250, gH = 6;
k.addPhy({name:'ground-phy', X:gX, Y:gY, Z:gZ, width:gW, depth:gD, height:gH});
k.W.cube({n:'ground', x:gX, y:gY, z:gZ, w:gW, d:gD, h:gH, b:'7B8B6F', t:marble, mix:0.7, tile:[10,10], s:1});

// 主角（物理+渲染）
k.mainVPlayer = k.addPhy({name:'mainPlayer', X:10, Y:3, Z:10, size:1, mass:50, colliGroup:1});
k.W.cube({n:'mainPlayer', b:'FDF9EE', t:marble, mix:0.3, s:1});

// ----------

k.W.clearColor('1a1a2e');  // 背景色
k.W.ambient(0.3);  // 环境光 0~1
k.W.light({x: 0.5, y: -1, z: 0.5});  // 光源方向

// 装饰物体 - 展示各种基础几何体
k.W.cube({n:'box1', x:5, y:1, z:5, w:2, h:2, d:2, b:'e94560', s:1});  // 红色立方体
k.W.cube({n:'box2', x:10, y:1, z:5, w:2, h:2, d:2, b:'0f4c75', s:1});  // 蓝色立方体
k.W.pyramid({n:'pyr', x:15, y:1.5, z:5, w:2, h:2, d:2, b:'ffd93d', s:1});  // 金字塔
k.W.sphere({n:'ball', x:20, y:1.5, z:5, w:2, h:2, d:2, b:'6bcb77', s:1});  // 球体
k.W.plane({n:'sign', x:25, y:2, z:5, w:3, h:2, b:'ff6b6b', s:1, ry:-45});  // 平面标牌

// 动画循环
let t = 0;
function anim() {
  t += 0.02;
  k.W.move({n:'box1', ry: t * 50});  // 红色立方体旋转
  k.W.move({n:'box2', y: 1 + Math.sin(t) * 0.5});  // 蓝色立方体上下动
  k.W.move({n:'pyr', ry: t * 30, y: 1.5 + Math.sin(t * 1.5) * 0.3});  // 金字塔旋转+跳动
  k.W.move({n:'ball', rx: t * 40, ry: t * 60});  // 球体自转
  k.W.move({n:'sign', ry: -45 + Math.sin(t) * 20});  // 标牌摆动
  requestAnimationFrame(anim);
}
anim();
