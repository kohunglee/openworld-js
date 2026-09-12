import { Blocks, shell, stairs } from './blocks.js';

const palette = ['#b76b48', '#87976a', '#d3ad61', '#607f87', '#a75858', '#bba888'];

// 商品只用原生立方体组成，细节用于包装、封口、罐沿和标签，禁用空实例填预算。
function product(m, x, y, z, type, seed, facing = 1) {
  const start = m.parts.length;
  const c = palette[seed % palette.length];
  if (type === 2) {
    // 金属罐的上下卷边和圆柱罐身，标签保持朝向货架通道。
    m.round(x, y + .125, z, .071, .23, c, 12);
    m.round(x, y + .012, z, .075, .014, '#c6c9b8', 12);
    m.round(x, y + .246, z, .075, .014, '#c6c9b8', 12);
    m.box(x, y + .13, z + .075, .09, .12, .012, '#eee3c7');
    for (const dy of [.105, .155]) m.box(x, y + dy, z + .087, .065, .009, .008, c);
  } else if (type === 1) {
    // 零食袋的鼓起腹部、侧折边、压封口和正面食品图案。
    m.box(x, y + .13, z, .12, .22, .11, c);
    for (let i = 0; i < 3; i++) m.box(x, y + .08 + i * .06, z + .018, .145 - Math.abs(i - 1) * .01, .058, .12, c);
    for (const dy of [.012, .255]) m.box(x, y + dy, z, .15, .018, .12, '#d7c09b');
    m.box(x, y + .155, z + .087, .095, .065, .014, '#f0e2be');
    for (let i = 0; i < 5; i++) m.box(x + (i % 3 - 1) * .025, y + .065 + Math.floor(i / 3) * .018, z + .087, .021, .015, .012, '#c99c54');
    for (let i = 0; i < 8; i++) m.box(x - .04 + i * .011, y + .21, z + .087, .005, .022, .008, '#495451');
    for (const dx of [-.073, .073]) m.box(x + dx, y + .135, z, .009, .21, .095, '#b0946a');
  } else {
    // 纸盒具有侧板、顶底封边、折盖、图案和少量条码，不生成文字网格。
    m.box(x, y + .14, z, .13, .26, .12, c);
    for (const dx of [-.069, .069]) m.box(x + dx, y + .14, z, .008, .26, .12, '#dccbad');
    for (const dy of [.005, .275]) m.box(x, y + dy, z, .145, .01, .13, '#dccbad');
    m.box(x, y + .15, z + .07, .1, .13, .012, '#f1e5c8');
    for (let i = 0; i < 3; i++) m.box(x, y + .115 + i * .03, z + .084, .075 - i * .012, .014, .01, c);
    for (let i = 0; i < 8; i++) m.box(x - .045 + i * .012, y + .045, z + .073, .006, .026, .01, '#4f5750');
    m.box(x, y + .233, z + .074, .038, .018, .012, '#bbaa76');
    for (const dy of [.093, .203]) m.box(x, y + dy, z + .073, .11, .008, .01, '#bbaa76');
    for (const dx of [-.032, .032]) m.box(x + dx, y + .287, z, .06, .012, .12, c);
  }
  // 双面岛架的背面包装绕中心旋转，标签分别朝向两条通道。
  if (facing < 0) for (let i = start; i < m.parts.length; i++) {
    const a = m.parts[i]; a.x = 2 * (x + m.cx) - a.x; a.z = 2 * z - a.z;
  }
}

// 双面杂货岛架：五层，每面两排库存，统一碰撞包络而非逐商品碰撞。
function gondola(m, z, index) {
  m.box(-1, .82, z, 4.9, .24, 1.04, '#677c70');
  m.box(-1, 2, z, 4.8, 2.2, .06, '#b6bea6');
  for (const x of [-3.45, 1.45]) m.box(x, 1.99, z, .07, 2.58, 1.05, '#778879');
  for (let level = 0; level < 5; level++) {
    const y = .98 + level * .43;
    m.box(-1, y, z, 4.85, .055, 1.05, '#cfccb3');
    for (const face of [-1, 1]) {
      m.box(-1, y, z + face * .55, 4.85, .08, .04, '#749382');
      for (let col = 0; col < 24; col++) {
        const x = -3.28 + col * .198;
        for (let depth = 0; depth < 2; depth++) product(m, x, y + .035,
          z + face * (.19 + depth * .235), (col + level + index) % 3, col + index * 2, face);
        // 价签每四列一张，保留现实的商品分组，避免整墙字符阵列。
        if (col % 4 === 0) {
          m.box(x + .25, y, z + face * .585, .22, .052, .012, '#eee3bf');
          m.box(x + .25, y, z + face * .596, .085, .022, .008, '#655c42');
        }
      }
    }
  }
  m.collider(-1, 1.98, z, 4.98, 2.56, 1.16, 'market-gondola');
}

// 冷饮区采用开放式不透明背板，瓶身、瓶肩、瓶颈、瓶盖分别塑形。
function chillers(m) {
  for (let bay = 0; bay < 5; bay++) {
    const x = -3.7 + bay * 1.18;
    m.box(x, 2.13, -6.93, 1.11, 2.85, .15, '#365b55');
    for (const dx of [-.56, .56]) m.box(x + dx, 2.13, -6.57, .045, 2.85, .8, '#9dab9a');
    m.box(x, 3.58, -6.57, 1.17, .16, .83, '#dde0c8');
    m.box(x, 3.48, -6.1, 1.02, .06, .045, '#f7e8b4');
    for (let row = 0; row < 4; row++) {
      const y = .94 + row * .6;
      m.box(x, y, -6.56, 1.1, .05, .78, '#bfc8b8');
      for (let col = 0; col < 8; col++) {
        const px = x - .455 + col * .13; const color = palette[(bay + row) % palette.length];
        m.round(px, y + .16, -6.3, .052, .26, color, 10);
        m.round(px, y + .303, -6.3, .04, .026, color, 8);
        m.round(px, y + .342, -6.3, .023, .052, color, 6);
        m.round(px, y + .382, -6.3, .027, .02, '#ddcaa0', 6);
        m.box(px, y + .17, -6.239, .07, .12, .013, '#eee4c9');
      }
    }
    m.collider(x, 2.14, -6.57, 1.17, 2.88, .9, 'market-chiller');
  }
}

// 一层 9×15 米邻里超市；右侧室内楼梯直接连到天台，开洞范围避开主体承重板。
export function market() {
  const m = new Blocks('market', 107); shell(m, 9, 1, '#dcd5bb');
  m.outside = m.outside.filter(a => !(a.h === .26 && a.y === 4.83));
  m.physics = m.physics.filter(a => a.tag !== 'roof'); m.parts = m.outside;
  m.box(-.9, 4.58, 0, 7.2, .24, 15, '#c3b699', true, 'market-roof');
  m.box(3.5, 4.58, -6.1, 1.6, .24, 2.4, '#c3b699', true, 'market-roof-landing');
  m.box(3.5, 4.58, 6.65, 1.6, .24, 1.3, '#c3b699', true, 'market-roof-front');
  // 登顶楼梯常驻外部载体，到达天台的瞬间不会把脚下台阶隐藏。
  stairs(m, 3.5, .7, 5.1, 4, 1.35);
  m.box(2.68, 5.2, .55, .12, 1, 10.6, '#506f60', true, 'market-well-rail');
  // 四周金属栏杆带踢脚板；透明区域用留空表达，不使用透明立方体。
  for (const side of [-1, 1]) {
    m.collider(side * 4.34, 5.25, 0, .14, 1.1, 14.7, 'market-roof-rail');
    m.collider(0, 5.25, side * 7.24, 8.6, 1.1, .14, 'market-roof-rail');
    for (const y of [4.84, 5.35, 5.83]) {
      m.box(side * 4.34, y, 0, .08, .07, 14.6, '#506f60');
      m.box(0, y, side * 7.24, 8.7, .07, .08, '#506f60');
    }
    for (let i = 0; i < 15; i++) m.box(side * 4.34, 5.26, -7 + i, .06, 1.1, .06, '#506f60');
    for (let i = 0; i < 9; i++) m.box(-4 + i, 5.26, side * 7.24, .06, 1.1, .06, '#506f60');
  }
  m.box(0, 4.08, 7.63, 8.7, .75, .14, '#3b6b54');
  m.sign('邻里A小超市', 0, 4.1, 7.79, 7.6, '#f2e8bd');
  m.sign('MARKET 107', 0, 2.12, 11.38, 3.7, '#477252', 32);
  // 帆布条纹只用于门前遮阳篷，不以密集重复纹理填充整体预算。
  for (let i = 0; i < 12; i++) m.box(-2.75 + i * .5, 3.3, 10.35, .47, .09, 4.3, i % 2 ? '#c4c9a6' : '#6c8c70');
  for (const x of [-3.75, 3.75]) m.plant(x, .7, 10.7, 1.05);
  // 三张小茶桌、恰好两把椅子，集中在远离楼梯口的天台西侧。
  for (const z of [-3, .2, 3.4]) {
    m.table(-1.6, 4.7, z, .9, .75, '#b49a70');
    m.round(-1.6, 5.59, z, .115, .08, '#8c7657', 12);
    m.round(-1.34, 5.57, z + .13, .052, .06, '#dcd3b5', 10);
  }
  m.chair(-2.7, 4.7, .2, '#6f8a75'); m.chair(-.5, 4.7, .2, '#6f8a75', true);
  m.plant(-3.55, 4.7, -6.4, 1.2); m.plant(-3.55, 4.7, 6.3, 1.2);
  m.parts = m.interior;
  for (let i = 0; i < 3; i++) gondola(m, -4.25 + i * 2.8, i);
  chillers(m);
  // 收银台靠前左侧，右侧主通道及楼梯起步区保持畅通。
  m.cabinet(-2.5, .7, 5.5, 2.8, .95, 1.1, '#708b72', 2);
  m.box(-2.5, 1.73, 5.5, 3, .12, 1.2, '#c6b58e');
  m.box(-2.75, 1.82, 5.5, 1.2, .055, .65, '#3e4944');
  m.box(-1.6, 1.86, 5.35, .45, .08, .36, '#515f55');
  m.box(-1.6, 2.02, 5.29, .055, .3, .055, '#515f55');
  m.box(-1.6, 2.25, 5.29, .58, .38, .07, '#294f51');
  m.box(-1.6, 2.25, 5.34, .5, .29, .025, '#b4c2a7');
  m.box(-2.12, 1.9, 5.63, .22, .16, .25, '#d0cbb6');
  m.box(-2.12, 2, 5.69, .14, .04, .04, '#527465');
  // 前区蔬果木箱与开放烘焙柜提供区别于标准货架的商品轮廓。
  for (let bin = 0; bin < 4; bin++) {
    const x = -.1 + bin % 2 * 1.1; const z = 3.7 + Math.floor(bin / 2) * 1.15;
    m.box(x, 1.08, z, .95, .75, .85, '#a48657', true, 'market-produce');
    m.box(x, 1.49, z, .87, .065, .78, '#696d49');
    for (const side of [-1, 1]) m.box(x + side * .47, 1.57, z, .055, .22, .85, '#b59864');
    for (let i = 0; i < 12; i++) {
      const px = x - .3 + i % 4 * .2; const pz = z - .24 + Math.floor(i / 4) * .24;
      m.round(px, 1.59, pz, .083, .14, ['#bc6f43', '#98a363', '#c8a855', '#997c88'][bin], 8);
      m.box(px, 1.677, pz, .013, .025, .013, '#646849');
    }
  }
  m.cabinet(-3.8, .7, 3.4, .8, 1.15, 1, '#aa8d61', 2);
  for (let i = 0; i < 9; i++) {
    const x = -4.03 + i % 3 * .23; const z = 3.11 + Math.floor(i / 3) * .29;
    m.round(x, 1.96, z, .095, .13, '#c99e65', 10);
    for (const dx of [-.035, .035]) m.box(x + dx, 2.035, z, .018, .014, .1, '#e4c38c');
  }
  // 线性吊灯、挂钟、导购牌和回收箱补齐邻里便利店的日常细节。
  for (const z of [-4.25, -1.45, 1.35, 4.3]) {
    m.box(-1, 4.08, z, 4.5, .08, .2, '#f4e6ba');
    for (const x of [-2.7, .7]) m.box(x, 4.3, z, .028, .36, .028, '#5d6e5c');
  }
  m.sign('FRESH / DAILY', -1, 3.9, -7.22, 5.5, '#526c51', 28);
  m.cabinet(-3.85, .7, 6.65, .6, .85, .5, '#6b8070', 1);
  m.inventory = { packagedGoods: 1440, drinks: 160, fruit: 48, bread: 9, rooftopTables: 3, rooftopChairs: 2 };
  const total = m.outside.length + m.interior.length;
  if (total < 40000 || total > 50000) throw new Error(`超市方块预算超限：${total}`);
  return m;
}
