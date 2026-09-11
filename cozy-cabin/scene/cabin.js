import { addBlock, addBlockLine } from './primitives.js';

/** 小屋统一配色，方便后续整体换肤。 */
const COLORS = {
  timber: '7A4A2B',
  darkTimber: '4A2B1A',
  plaster: 'D8C7A6',
  floor: '9A6846',
  roof: '8F3B2D',
  glass: '79C7D5',
  cream: 'EADDBF',
  leaf: '557A46',
  ember: 'FF7A2F',
};

/**
 * 建造双层主体、楼梯和屋顶。
 * 二层地板刻意为楼梯留下开口，玩家可以真正从一层走上去。
 */
function buildShell(world) {
  // 一层地板和前后墙；前墙中央留出门洞。
  addBlock(world, { y: 0.2, width: 16, height: 0.4, depth: 13, color: COLORS.floor });
  addBlock(world, { x: -5, y: 2.6, z: 6.35, width: 6, height: 5.2, depth: 0.5, color: COLORS.plaster });
  addBlock(world, { x: 5, y: 2.6, z: 6.35, width: 6, height: 5.2, depth: 0.5, color: COLORS.plaster });
  addBlock(world, { y: 5.05, z: 6.35, width: 4, height: 0.7, depth: 0.5, color: COLORS.timber });
  addBlock(world, { y: 2.6, z: -6.35, width: 16, height: 5.2, depth: 0.5, color: COLORS.plaster });
  addBlock(world, { x: -7.75, y: 2.6, width: 0.5, height: 5.2, depth: 13, color: COLORS.plaster });
  addBlock(world, { x: 7.75, y: 2.6, width: 0.5, height: 5.2, depth: 13, color: COLORS.plaster });

  // 木梁让纯色方块外墙更接近手工搭建的小屋。
  for (const x of [-7.4, -2, 2, 7.4]) {
    addBlock(world, { x, y: 2.6, z: 6.65, width: 0.35, height: 5.2, depth: 0.25, color: COLORS.darkTimber, physical: false });
  }
  for (const z of [-6, 0, 6]) {
    addBlock(world, { x: -8.05, y: 2.6, z, width: 0.25, height: 5.2, depth: 0.35, color: COLORS.darkTimber, physical: false });
    addBlock(world, { x: 8.05, y: 2.6, z, width: 0.25, height: 5.2, depth: 0.35, color: COLORS.darkTimber, physical: false });
  }

  // 二层地板拆成三块，右侧中段留下楼梯井。
  addBlock(world, { x: -2, y: 5.25, width: 12, height: 0.35, depth: 13, color: COLORS.floor });
  addBlock(world, { x: 6, y: 5.25, z: 4.75, width: 4, height: 0.35, depth: 3.2, color: COLORS.floor });
  addBlock(world, { x: 6, y: 5.25, z: -4.8, width: 4, height: 0.35, depth: 3.1, color: COLORS.floor });

  // 台阶向屋后逐级升高，顶部接入二层后侧平台。
  addBlockLine(world, 10, (index) => ({
    x: 5.8,
    y: 0.45 + index * 0.51,
    z: 3.4 - index * 0.67,
    width: 3.1,
    height: 0.45,
    depth: 0.75,
    color: index % 2 === 0 ? COLORS.timber : COLORS.darkTimber,
    physical: false,
  }));
  // 台阶表面下方铺一块不可见斜坡，让物理角色可以平稳上楼而不被台阶边缘卡住。
  world.addTABox({
    DPZ: 0,
    X: 5.8,
    Y: 2.75,
    Z: 0.35,
    width: 3,
    height: 0.25,
    depth: 8.2,
    rX: 34,
    isVisualMode: false,
    isPhysical: true,
  });

  // 二层围护墙比一层稍矮，保留更亲切的小屋比例。
  addBlock(world, { y: 7.45, z: 6.35, width: 16, height: 4.1, depth: 0.5, color: COLORS.plaster });
  addBlock(world, { y: 7.45, z: -6.35, width: 16, height: 4.1, depth: 0.5, color: COLORS.plaster });
  addBlock(world, { x: -7.75, y: 7.45, width: 0.5, height: 4.1, depth: 13, color: COLORS.plaster });
  addBlock(world, { x: 7.75, y: 7.45, width: 0.5, height: 4.1, depth: 13, color: COLORS.plaster });

  // 阶梯式屋顶坚持方块语言，不使用阴影或复杂网格。
  addBlockLine(world, 5, (index) => ({
    y: 9.65 + index * 0.65,
    width: 18 - index * 3.2,
    height: 0.7,
    depth: 15,
    color: index % 2 === 0 ? COLORS.roof : '713126',
  }));
}

/**
 * 添加窗户、门和室内家具，返回需要互动的物体编号。
 */
function furnishCabin(world) {
  const door = addBlock(world, { y: 2.45, z: 6.1, width: 2.7, height: 4.6, depth: 0.25, color: COLORS.darkTimber, physical: false });
  const windows = [];
  for (const x of [-5, 5]) {
    windows.push(addBlock(world, { x, y: 3.05, z: 6.03, width: 2.6, height: 2.1, depth: 0.12, color: COLORS.glass, physical: false, unlit: true }));
    windows.push(addBlock(world, { x, y: 7.5, z: 6.03, width: 2.6, height: 1.8, depth: 0.12, color: COLORS.glass, physical: false, unlit: true }));
  }

  // 客厅：沙发、茶几、壁炉与会发光的吊灯。
  addBlock(world, { x: -4.5, y: 1, z: 1.8, width: 4.6, height: 1.1, depth: 1.4, color: '58706A' });
  addBlock(world, { x: -4.5, y: 1.75, z: 2.45, width: 4.6, height: 1.7, depth: 0.35, color: '40534F' });
  addBlock(world, { x: -4.5, y: 0.75, z: -0.2, width: 3, height: 0.45, depth: 1.8, color: COLORS.timber });
  addBlock(world, { x: -4.5, y: 0.38, z: -0.2, width: 0.35, height: 0.8, depth: 0.35, color: COLORS.darkTimber });
  addBlock(world, { x: -1.8, y: 1.7, z: -5.95, width: 3.2, height: 3.2, depth: 0.6, color: '5A514B' });
  const fire = addBlock(world, { x: -1.8, y: 1.05, z: -5.55, width: 1.8, height: 1.3, depth: 0.3, color: COLORS.ember, physical: false, unlit: true });
  const lamp = addBlock(world, { x: -3.8, y: 4.45, z: -0.5, width: 0.9, height: 0.9, depth: 0.9, color: 'FFE08A', physical: false, unlit: true });

  // 厨房：柜台与收音机形成第二个互动角落。
  addBlock(world, { x: 1.9, y: 1.05, z: -5.85, width: 4.5, height: 1.7, depth: 0.8, color: '8D765B' });
  addBlock(world, { x: 3.7, y: 1.05, z: -3.2, width: 0.9, height: 1.7, depth: 4.5, color: '8D765B' });
  const radio = addBlock(world, { x: 1.3, y: 2.15, z: -5.55, width: 1.4, height: 0.75, depth: 0.55, color: '39434A', physical: false });

  // 二层卧室与阅读区。
  addBlock(world, { x: -4.5, y: 5.85, z: -2.8, width: 4.8, height: 0.65, depth: 3.8, color: 'B8867C' });
  addBlock(world, { x: -4.5, y: 6.25, z: -4.5, width: 4.8, height: 1.4, depth: 0.4, color: COLORS.darkTimber });
  addBlock(world, { x: -4.5, y: 6.25, z: -0.9, width: 4.8, height: 0.45, depth: 0.3, color: COLORS.cream });
  addBlock(world, { x: -4.8, y: 7.1, z: 5.9, width: 4.2, height: 3, depth: 0.7, color: COLORS.darkTimber });
  addBlockLine(world, 4, (index) => ({ x: -4.8, y: 6.1 + index * 0.72, z: 5.5, width: 3.8, height: 0.26, depth: 0.45, color: index % 2 ? 'C68A53' : '6D8C7A' }));
  addBlock(world, { x: 2, y: 5.85, z: 2.4, width: 3.2, height: 0.5, depth: 1.7, color: COLORS.timber });

  return { door, windows, lamp, fire, radio };
}

/** 建造并布置完整小屋。 */
export function buildCabin(world) {
  buildShell(world);
  return furnishCabin(world);
}
