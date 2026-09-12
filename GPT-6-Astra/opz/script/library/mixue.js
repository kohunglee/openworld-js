import { Blocks, shell, stairs, roofRails } from './blocks.js';

// 饮品杯含杯身、杯盖、吸管和红色标签。
function cup(m, x, y, z, variant = 0) {
  m.round(x, y + .13, z, .085, .26, variant % 2 ? '#f2deaa' : '#eeeadd', 10);
  m.round(x, y + .275, z, .098, .025, '#c92737', 10);
  m.box(x + .025, y + .35, z, .018, .15, .018, '#f5eee0');
  m.box(x, y + .14, z + .088, .07, .075, .012, '#c82c3a');
}

// 雪王标志使用圆形分段、皇冠、披风、权杖与表情构成。
function snowKing(m) {
  // 标识面向正门，分段圆盘保持不透明。
  for (let i = -12; i <= 12; i++) {
    const x = i * .065; const h = Math.sqrt(Math.max(0, .8 * .8 - x * x)) * 2;
    if (h > 0) m.box(x, 5.85, 7.8, .065, h, .18, '#fff2de');
  }
  for (const x of [-.25, .25]) m.box(x, 5.96, 7.91, .09, .12, .035, '#42352f');
  m.box(0, 5.62, 7.92, .25, .05, .03, '#a42031');
  m.box(0, 6.66, 7.84, .86, .2, .19, '#d6a94d');
  for (const x of [-.32, 0, .32]) m.box(x, 6.85, 7.84, .16, .28, .19, '#d6a94d');
  m.box(0, 5.08, 7.86, 1.1, .25, .2, '#cc2639');
}

// 蜜雪门店：红白立面、开放点单区、饮品制作区和室外登顶楼梯。
export function mixue() {
  const m = new Blocks('mixue', 70); shell(m, 18, 1, '#efe9d9');
  m.box(0, 4.25, 7.62, 17.8, .9, .15, '#c82439');
  m.sign('蜜雪冰城', -4.5, 4.3, 7.77, 6.6, '#fff4e0');
  m.sign('MIXUE', 4.8, 4.3, 7.77, 6.2, '#fff4e0');
  m.box(0, 5.75, 7.58, 2.1, 2.6, .2, '#c82439'); snowKing(m);
  for (let i = 0; i < 18; i++) m.box(-8.5 + i, 3.65, 7.85, .95, .16, .5, i % 2 ? '#cb2f3e' : '#ede4ce');
  roofRails(m, 18, 4.96);
  // 右侧楼梯从前往后升高，顶部经侧开口踏上完整屋顶。
  stairs(m, 10.1, .7, 4.7, 4.26, 1.5);
  m.box(9.2, 4.84, -5.05, 2.7, .24, 1.7, '#d0bfa4', true, 'roof-bridge');
  // 侧栏杆在登顶桥处预留口，不让碰撞墙堵住出口。
  m.outside = m.outside.filter(a => !(a.x > 78.7 && a.x < 79 && (a.h === 1 || a.h === .06) && a.d > 10));
  m.parts = m.outside;
  m.physics = m.physics.filter(a => !(a.tag === 'roof-rail' && a.X > 78.7 && a.depth > 10));
  m.box(8.84, 5.46, 1.5, .16, 1, 11.2, '#b8baac', true, 'roof-rail');
  m.box(8.84, 5.46, -6.7, .16, 1, 1, '#b8baac', true, 'roof-rail');
  for (const x of [-5, 0, 5]) {
    m.table(x, 4.96, 0, 1.8, 1); m.chair(x, 4.96, 1); m.chair(x, 4.96, -1, '#c65354', true);
    m.plant(x, 4.96, -5.8, 1.2);
  }
  // 屋顶遮阳架和长椅保持低密度的休息区布局。
  for (const x of [-6, 6]) for (const z of [-3, 3]) m.box(x, 6.3, z, .13, 2.7, .13, '#965b4c', true, 'pergola-post');
  for (let i = 0; i < 7; i++) m.box(-6 + i * 2, 7.71, 0, .15, .12, 6.3, '#a97155');
  for (const x of [-6.5, 6.5]) { m.plant(x, .7, 10.3, 1.4); m.table(x, .7, 13.1, 2.6, .6); }
  // 室外石板与屋顶铺装独立抬高，不与楼板表面重合。
  for (const y of [.73, 5.0]) for (let ix = 0; ix < 50; ix++) for (let iz = 0; iz < 42; iz++) {
    m.box(-8.65 + ix * .35, y, -7.175 + iz * .35, .325, .04, .325,
      (ix + iz) % 7 ? '#dcd5c1' : '#cec8b3');
  }
  m.parts = m.interior;
  // 长柜台与后厨设备之间留出员工通道，客区位于前半部。
  m.cabinet(0, .7, -2.1, 12.5, 1.05, 1.1, '#cc2e40', 1);
  m.box(0, 1.84, -2.1, 12.8, .13, 1.25, '#e9dfc8');
  m.sign('FRESH TEA · ICE CREAM', 0, 1.28, -1.48, 8, '#f5e7cf', 32);
  for (let i = 0; i < 3; i++) {
    const x = -4.4 + i * 4.3;
    m.box(x, 3.2, -6.95, 3.7, 1.4, .12, '#263d40');
    m.sign(['ICE CREAM', 'FRUIT TEA', 'MILK TEA'][i], x, 3.55, -6.85, 3.2, '#f1d392', 28);
    for (let row = 0; row < 4; row++) {
      m.box(x - .65, 3.22 - row * .19, -6.84, 1.5, .035, .035, '#d8dec8');
      m.box(x + 1.12, 3.22 - row * .19, -6.84, .28, .04, .035, '#e6b965');
    }
  }
  for (let i = 0; i < 6; i++) m.cabinet(-5.4 + i * 2.15, .7, -6.15, 2, .95, 1, '#c8d1c6', 2);
  // 双收银机、扫码底座和小票打印机。
  for (const x of [-4.4, 3.8]) {
    m.box(x, 1.96, -2.1, .58, .1, .45, '#424c48');
    m.box(x, 2.14, -2.2, .06, .28, .06, '#66736c');
    m.box(x, 2.35, -2.2, .65, .36, .055, '#244c51');
    m.box(x + .6, 2.03, -2.1, .32, .22, .32, '#d7d8cb');
  }
  // 冷柜、冰淇淋机、咖啡机和搅拌机均由独立面板组成。
  for (let i = 0; i < 4; i++) {
    const x = -5.4 + i * 2.6;
    m.cabinet(x, 1.65, -6.15, 1.35, 1.12, .72, '#a5b3ae', 1);
    m.box(x, 2.3, -5.73, .85, .5, .08, '#324e4c');
    for (const dx of [-.32, .32]) {
      m.box(x + dx, 1.98, -5.58, .07, .22, .25, '#414d48');
      m.round(x + dx, 1.73, -5.48, .16, .04, '#d9d7c3');
    }
    for (let n = 0; n < 3; n++) cup(m, x - .4 + n * .4, 2.8, -6.1, n);
  }
  m.cabinet(7.5, .7, -5.9, 1.4, 2.7, 1.25, '#e0ded0', 2);
  m.box(7.5, 2.1, -5.21, 1.15, 1.85, .05, '#315851');
  // 水槽四边包围凹下的内胆，龙头采用立管加横向出水口。
  m.box(5.5, 1.71, -6.1, 1.25, .08, .7, '#637b79');
  for (const s of [-1, 1]) m.box(5.5 + s * .64, 1.82, -6.1, .07, .18, .85, '#bbc5be');
  m.box(5.5, 2.02, -6.48, .05, .5, .05, '#bfc9c3');
  m.box(5.5, 2.28, -6.3, .05, .05, .4, '#bfc9c3');
  for (let i = 0; i < 24; i++) cup(m, -2.4 + i % 12 * .4, 1.92, -2.3 + Math.floor(i / 12) * .4, i);
  for (const x of [-6.2, -2.9, 2.9, 6.2]) for (const z of [1, 4.7]) {
    m.table(x, .7, z, 1.7, .9, '#e4d6ba');
    m.chair(x, .7, z + .95, '#cd4350'); m.chair(x, .7, z - .95, '#cd4350', true);
    cup(m, x, 1.6, z); m.lamp(x, 3.5, z, true);
  }
  // 两侧备料架存放纸杯、茶罐与外卖包装；整架使用一个碰撞包络。
  for (const side of [-1, 1]) for (let rack = 0; rack < 3; rack++) {
    const x = side * 7.65; const z = -4.2 + rack * 1.2;
    for (let level = 0; level < 6; level++) {
      const y = .8 + level * .45;
      m.box(x, y, z, 1.15, .06, .95, '#9aa99e');
      for (let row = 0; row < 2; row++) for (let col = 0; col < 6; col++)
        cup(m, x - .475 + col * .19, y + .045, z - .25 + row * .4, level + col);
    }
    for (const dx of [-.61, .61]) m.box(x + dx, 2, z, .065, 2.5, 1.05, '#c6ccba');
    m.collider(x, 2, z, 1.3, 2.6, 1.05, 'supply-rack');
  }
  m.plant(-8, .7, 6.5); m.plant(8, .7, 6.5);
  return m;
}
