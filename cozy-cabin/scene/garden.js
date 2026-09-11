import { addBlock, addBlockLine } from './primitives.js';

/**
 * 组合一棵低多边形方块树。
 */
function addTree(world, x, z, scale = 1) {
  addBlock(world, { x, y: 1.6 * scale, z, width: 0.8 * scale, height: 3.2 * scale, depth: 0.8 * scale, color: '5D3E28' });
  addBlock(world, { x, y: 3.8 * scale, z, width: 3.2 * scale, height: 2.6 * scale, depth: 3.2 * scale, color: '4E7444', shape: 'sphere', physical: false });
}

/**
 * 添加庭院围栏、池塘、花草、长椅和树木。
 */
export function buildGarden(world) {
  // 大地和通向小屋的石板路。
  addBlock(world, { y: -0.65, width: 58, height: 1.3, depth: 58, color: '70885E' });
  addBlockLine(world, 9, (index) => ({ x: Math.sin(index) * 0.25, y: 0.06, z: 14.5 - index * 1.15, width: 2.4, height: 0.12, depth: 0.9, color: index % 2 ? 'A99B82' : 'B9AB91', physical: false }));

  // 围栏前方留出入口，其余三边完整围合。
  for (const x of [-14, -12, -10, -8, -6, 6, 8, 10, 12, 14]) {
    addBlock(world, { x, y: 0.9, z: 18, width: 0.3, height: 1.8, depth: 0.3, color: '765034' });
    addBlock(world, { x, y: 0.9, z: -14, width: 0.3, height: 1.8, depth: 0.3, color: '765034' });
  }
  addBlock(world, { y: 0.8, z: -14, width: 30, height: 0.24, depth: 0.25, color: '8D6748' });
  for (const x of [-15, 15]) {
    addBlockLine(world, 16, (index) => ({ x, y: 0.9, z: -13 + index * 2, width: 0.3, height: 1.8, depth: 0.3, color: '765034' }));
    addBlock(world, { x, y: 0.8, z: 1, width: 0.25, height: 0.24, depth: 32, color: '8D6748' });
  }

  // 左侧池塘与右侧长椅形成两个明显的庭院目的地。
  addBlock(world, { x: -9.8, y: 0.02, z: 10, width: 6.4, height: 0.12, depth: 4.5, color: '4F9EAD', physical: false, unlit: true });
  addBlock(world, { x: 9.5, y: 0.7, z: 11, width: 4.2, height: 0.45, depth: 1.2, color: '8B5E3C' });
  addBlock(world, { x: 9.5, y: 1.45, z: 11.5, width: 4.2, height: 1.4, depth: 0.3, color: '6C462E' });

  addTree(world, -12, 1, 1.1);
  addTree(world, 12, -4, 1.25);
  addTree(world, -11, -9, 0.95);
  addTree(world, 11.5, 15, 0.8);

  // 花朵使用无碰撞小方块，保持低负载并避免阻碍行走。
  const flowerColors = ['F3B7C7', 'FFD66B', 'AFCBFF', 'F79A6B'];
  addBlockLine(world, 28, (index) => ({
    x: -13 + (index % 7) * 0.75,
    y: 0.25,
    z: -11 + Math.floor(index / 7) * 0.8,
    width: 0.28,
    height: 0.5,
    depth: 0.28,
    color: flowerColors[index % flowerColors.length],
    physical: false,
    unlit: true,
  }));
}

/**
 * 用组合方块创建一只可整体移动的猫。
 */
export function buildCat(world) {
  world.W.group({ n: 'cabin-cat', x: -6, y: 0.7, z: 12 });
  world.W.cube({ n: 'cat-body', g: 'cabin-cat', w: 1.45, h: 0.75, d: 0.7, b: 'D18A45', x: 0, y: 0.2, z: 0 });
  world.W.cube({ n: 'cat-head', g: 'cabin-cat', w: 0.8, h: 0.8, d: 0.75, b: 'DF9952', x: 0, y: 0.75, z: -0.45 });
  world.W.pyramid({ n: 'cat-ear-left', g: 'cabin-cat', w: 0.24, h: 0.35, d: 0.24, b: 'B96F35', x: -0.23, y: 1.28, z: -0.48 });
  world.W.pyramid({ n: 'cat-ear-right', g: 'cabin-cat', w: 0.24, h: 0.35, d: 0.24, b: 'B96F35', x: 0.23, y: 1.28, z: -0.48 });
  world.W.cube({ n: 'cat-tail', g: 'cabin-cat', w: 0.22, h: 0.22, d: 1.2, b: 'B96F35', x: 0, y: 0.45, z: 0.95, rx: -18 });
}
