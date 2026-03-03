// DPZ 示例 - 魔法森林
// 展示如何用 DPZ 实现动态加载的沉浸式场景

import k from '../../src/openworld.js';
globalThis.k = k;
k.initWorld('openworldCanv', true);

// ========== 1. 基础设置 ==========
k.W.clearColor('1a2a3a');
k.W.ambient(0.4);

// 地面（DPZ=0，永远显示）
k.addPhy({name:'ground-phy', X:0, Y:-2.5, Z:0, width:500, depth:500, height:6});
k.W.cube({n:'ground', x:0, y:-2.5, z:0, w:500, d:500, h:6, b:'3a5a4a', t:marble, mix:0.6, tile:[20,20]});

// 主角
k.mainVPlayer = k.addPhy({name:'mainPlayer', X:0, Y:3, Z:0, size:1, mass:50, colliGroup:1});
k.W.cube({n:'mainPlayer', b:'ffd700'});

// ========== 2. DPZ 场景构建 ==========

// 巨型石柱（DPZ=1，超远可见）
for (let i = 0; i < 12; i++) {
  const ang = (i / 12) * Math.PI * 2;
  k.addTABox({
    DPZ: 1,
    X: Math.cos(ang) * 80,
    Y: 10, Z: Math.sin(ang) * 80,
    width: 4, height: 20, depth: 4,
    background: '6a7a8a',
    mass: 0
  });
}

// 小屋群（DPZ=2，中距离可见）
const houseColors = ['8b4513', 'a0522d', 'cd853f', 'd2691e'];
for (let i = 0; i < 30; i++) {
  const x = (Math.random() - 0.5) * 120;
  const z = (Math.random() - 0.5) * 120;
  if (Math.abs(x) < 15 && Math.abs(z) < 15) continue;
  k.addTABox({
    DPZ: 2,
    X: x, Y: 2, Z: z,
    width: 5, height: 4, depth: 5,
    background: houseColors[i % 4],
    mass: 0
  });
}

// 树木（DPZ=3，近距离可见）
for (let i = 0; i < 200; i++) {
  const x = (Math.random() - 0.5) * 80;
  const z = (Math.random() - 0.5) * 80;
  if (Math.abs(x) < 10 && Math.abs(z) < 10) continue;
  k.addTABox({
    DPZ: 3,
    X: x, Y: 2, Z: z,
    width: 0.5, height: 4, depth: 0.5,
    background: '4a3a2a',
    mass: 0
  });
  k.addTABox({
    DPZ: 3,
    X: x, Y: 5, Z: z,
    size: 3, shape: 'sphere',
    background: '2a8a4a',
    mass: 0
  });
}

// 蘑菇和花朵（DPZ=4，很近才可见）
for (let i = 0; i < 500; i++) {
  const x = (Math.random() - 0.5) * 40;
  const z = (Math.random() - 0.5) * 40;
  const col = Math.random() > 0.5 ? 'ff6b6b' : 'ffeb3b';
  k.addTABox({
    DPZ: 4,
    X: x, Y: 2, Z: z,
    size: 0.4,
    background: col,
    mass: 0
  });
}

// 萤火虫（DPZ=5，极近才可见）
for (let i = 0; i < 100; i++) {
  k.addTABox({
    DPZ: 5,
    X: (Math.random() - 0.5) * 20,
    Y: 2 + Math.random() * 3,
    Z: (Math.random() - 0.5) * 20,
    size: 0.15, shape: 'sphere',
    background: 'ffff00',
    isPhysical: false,
    activeFunc: (idx) => {
      let t = 0;
      setInterval(() => {
        t += 0.1;
        const obj = k.W.next['T' + idx];
        if (obj) obj.hidden = Math.sin(t) > 0;
      }, 100);
    }
  });
}

// ========== 3. 启动 DPZ ==========
console.log('DPZ 魔法森林已加载！');
console.log('- 走远点看石柱和小屋消失');
console.log('- 走近点看树木、蘑菇、萤火虫出现');
