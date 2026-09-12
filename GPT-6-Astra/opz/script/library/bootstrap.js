import { folio } from './model.js';
import { mixue } from './mixue.js';
import { studio } from './studio.js';
import { market } from './market.js';
import { gallery } from './gallery.js';
import { makeEastLibraryPlan, makeEastBindingDetail } from './east-model.js';
import { makeEastMixue } from './east-mixue.js';
import { makeEastStudio } from './east-studio.js';

function eastModels() {
  const physics = list => list.map(p => ({
    ...p,
    X: p.X ?? p.x, Y: p.Y ?? p.y, Z: p.Z ?? p.z,
    width: p.width ?? p.w, height: p.height ?? p.h, depth: p.depth ?? p.d,
  }));
  const plan = makeEastLibraryPlan();
  const detail = [];
  for (const bay of plan.bays) detail.push(...makeEastBindingDetail(bay));
  const shop = makeEastMixue(); const studio = makeEastStudio();
  const libraryOutside = [...plan.groups.shell, ...plan.groups.facade, ...plan.groups.landscape];
  // 源项目在 bootstrap 中补建窗板和迂回入口；迁移时必须与模型一起带入。
  const box = (list, colliders, x, y, z, w, h, d, b, solid = false) => {
    const q = { x, y, z: -25 + z, w, h, d, b };
    list.push(q);
    if (solid) colliders.push({ ...q });
  };
  for (const y of [2.67, 6.77]) for (const x of [-7.28, -4.25, 4.25, 7.28])
    box(libraryOutside, plan.colliders, 32 + x, y, 7.22, 2.74, 2.91, .08, '#263c39');
  box(libraryOutside, plan.colliders, 32, 6.65, 7.22, 5.16, 3.6, .08, '#263c39');
  for (let z = -6; z < 7; z += 2.4)
    box(libraryOutside, plan.colliders, 40.76, 4.9, z, .08, 7.65, 2.22, '#263c39');
  box(libraryOutside, plan.colliders, 32, 8.97, .15, 5.55, .08, 7.1, '#ad7540');
  for (const x of [-5.6, 5.6])
    box(shop.outside, shop.colliders, 70 + x, 2.4, 7.22, 5.9, 2.9, .08, '#fff2da');
  for (const [cx, list, colliders, color, top] of [
    [32, libraryOutside, plan.colliders, '#473222', 4],
    [70, shop.outside, shop.colliders, '#e9163e', 3.25],
  ]) {
    const mid = (top + .5) / 2; const height = top - .5;
    box(list, colliders, cx, mid, 9.65, 6.2, height, .18, color, true);
    box(list, colliders, cx - 3, mid, 8.5, .18, height, 2.3, color, true);
    box(list, colliders, cx, top + .06, 8.55, 6.2, .12, 2.4, color, true);
    box(list, colliders, cx + 4.45, mid, 9.05, .18, height, 3.5, color, true);
    box(list, colliders, cx + 3.8, top + .06, 9.05, 1.12, .12, 3.5, color, true);
    box(list, colliders, cx + .8, mid, 11.5, 7.3, height, .18, color, true);
    box(list, colliders, cx + 4.45, mid, 11.1, .18, height, .65, color, true);
    box(list, colliders, cx + .65, top + .06, 10.66, 7.5, .12, 1.48, color, true);
  }
  return [
    { name: 'east-folio', outside: libraryOutside, interior: [...plan.groups.lower, ...plan.groups.upper, ...plan.groups.shelves0, ...plan.groups.shelves1, ...detail], physics: physics(plan.colliders) },
    { name: 'east-mixue', outside: shop.outside, interior: shop.inside, physics: physics(shop.colliders) },
    { name: 'east-studio', outside: studio.outside, interior: studio.inside, physics: physics(studio.colliders) },
  ];
}

// 几何与碰撞验收共用真实建模入口；没有每帧或进门后重新生成几何的路径。
export function createDistrict() {
  const models = [folio(), mixue(), studio(), market(), gallery(), ...eastModels()];
  models[2].refineCurves(4976);
  return models;
}

// 大型结构碰撞按四米网格分块，避免只按物体中心加载造成局部踩空。
export function collisionTiles(models) {
  const tiles = [];
  for (const m of models) for (const p of m.physics) {
    const nx = Math.ceil(p.width / 4); const nz = Math.ceil(p.depth / 4);
    for (let x = 0; x < nx; x++) for (let z = 0; z < nz; z++) tiles.push({
      ...p, owner: m.name, width: p.width / nx, depth: p.depth / nz,
      X: p.X - p.width / 2 + (x + .5) * p.width / nx,
      Z: p.Z - p.depth / 2 + (z + .5) * p.depth / nz,
    });
  }
  return tiles;
}

// 入室触发线位于两块屏风之间，0.45 米滞后避免站在边缘闪烁。
export function roomAt(p, previous) {
  const zones = [ ['folio', 32, 9, 8.85], ['mixue', 70, 9, 4.82], ['studio', 90, 4.5, 8.69], ['market', 107, 4.5, 4.69], ['gallery', 126, 9, 4.82], ['east-folio', 32, 9, 9], ['east-mixue', 70, 9, 4.8], ['east-studio', 90, 4.5, 7.8] ];
  for (const [name, cx, half, top] of zones) {
    const margin = previous === name ? .45 : 0;
    const centerZ = name.startsWith('east-') ? -25 : 0;
    const inBody = Math.abs(p.x - cx) < half - .2 + margin && p.z > centerZ - 7.3 - margin && p.z < centerZ + 7.4;
    const inEntry = Math.abs(p.x - cx) < 3 + margin && p.z >= centerZ + 7.4 && p.z < centerZ + 10.2 + margin;
    // 头部位置在楼顶上方时隐藏室内；上下楼过程均保持整栋室内可见。
    if ((inBody || inEntry) && p.y < top + margin && p.y > .1) return name;
  }
  return null;
}

// 纹理就绪后初始化；每栋两个实例载体上传一次，原插件与原角色保持原状。
export function buildLibrary() {
  const k = globalThis.k;
  const texture = window.dls || document.getElementById('dls');
  // 原页面图像和 SVG 纹理是两条加载链，等待原贴图后再上传 GPU。
  if (!texture.complete || !texture.naturalWidth) {
    texture.addEventListener('load', buildLibrary, { once: true });
    return;
  }
  if (k.libraryDistrict) return;
  const models = createDistrict(); const tiles = collisionTiles(models);
  const carrierCount = models.length * 2;
  let root = 0;
  // 万数块仅登记元数据，每个建筑始终只有室外、室内两个 W 对象。
  for (const m of models) for (const kind of ['outside', 'interior']) {
    const name = `${m.name}-${kind}`; const instances = m[kind];
    for (let offset = 0; offset < instances.length; offset += 10000) {
      while (k.indexToArgs.has(root)) root += 10000;
      if (root >= 630000) throw new Error('万数块登记空间不足');
      k.indexToArgs.set(root, { dataName: name, name, offset,
        instances: instances.slice(offset, offset + 10000), isPhysical: false, isVisualMode: false });
      root += 10000;
    }
    k.W.cube({ n: name, instances, t: texture, mix: .8, hidden: kind === 'interior' });
  }
  // 独立使用单数块区域，避免物理档案覆盖万数块根索引。
  let index = 990000;
  for (const p of tiles) {
    while (k.indexToArgs.has(index)) index++;
    k.addTABox({ ...p, customIdx: index++, DPZ: 3, isPhysical: true,
      isVisualMode: false, mass: 0, colliGroup: 2, isInvisible: true });
  }
  // 仅设置出生位置与朝向，绝不覆盖速度、跳跃、相机或动画参数。
  k.mainVPlayer.body.position.set(33.9, 1.5, 19.2);
  k.mainVPlayer.body.velocity.set(0, 0, 0);
  k.keys.turnRight = 0;
  const metrics = document.createElement('pre'); metrics.id = 'libraryMetrics';
  document.getElementById('wskStudio').before(metrics);
  const count = m => m.outside.length + m.interior.length;
  let active = null;
  // 只有房间变化时更新隐藏标记和统计，不上传或改写实例矩阵。
  function update(next) {
    active = next;
    for (const m of models) k.W.next[`${m.name}-interior`].hidden = m.name !== next;
    const visible = models.reduce((sum, m) => sum + m.outside.length + (m.name === next ? m.interior.length : 0), 0);
    metrics.textContent = `FOLIO 图书馆 ${count(models[0]).toLocaleString()} 块\n` +
      `MIXUE 蜜雪冰城 ${count(models[1]).toLocaleString()} 块\n` +
      `私人工作室 ${count(models[2]).toLocaleString()} 块\n` +
      `邻里小超市 ${count(models[3]).toLocaleString()} 块\n` +
      `艺术展览馆 ${count(models[4]).toLocaleString()} / 10,000 块\n` +
      `万数块 ${root / 10000} / 63 ｜实例载体 ${carrierCount}\n` +
      `已登记物理体 ${tiles.length} ｜当前可见 ${visible.toLocaleString()} 块\n` +
      `图书馆室内 ${next === 'folio' ? '显示（32 分区全部）' : '隐藏'}\n当前区域 ${next || '室外'}`;
    k.libraryDistrict.active = next;
  }
  k.libraryDistrict = { models, collisions: tiles, active, carriers: carrierCount,
    counts: Object.fromEntries(models.map(m => [m.name, count(m)])) };
  update(null);
  k.hooks.on('animatePreFrame', () => {
    const next = roomAt(k.mainVPlayer.body.position, active);
    if (next !== active) update(next);
  });
}
