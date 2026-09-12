import { Blocks, shell, stairs } from './blocks.js';
const colors = ['#375c59', '#9c554a', '#c3a35e', '#47576b', '#83637b', '#8c9869'];

// 单个分区容纳五层、每层二十四册精装书；一次生成全部 32 个分区。
function bookcase(m, x, y, z, index) {
  m.box(x, y + 1.48, z - .24, 1.55, 2.96, .065, '#86684d');
  for (const dx of [-.8, .8]) m.box(x + dx, y + 1.48, z, .075, 2.96, .55, '#664b37');
  for (let row = 0; row <= 5; row++) {
    m.box(x, y + row * .55 + .08, z, 1.55, .07, .55, '#aa8055');
    // 层板边缘包边与标签座，让书架结构具有真实厚度。
    m.box(x, y + row * .55 + .08, z + .3, 1.55, .085, .04, '#c19a68');
    if (row === 5) continue;
    for (let b = 0; b < 24; b++) {
      const h = .36 + ((b * 7 + index * 3) % 8) * .015;
      m.book(x - .72 + b * .062, y + row * .55 + .12, z + .035,
        .052, h, .36, colors[(index + b) % colors.length]);
    }
    m.box(x - .6, y + row * .55 + .07, z + .345, .18, .04, .035, '#ede4ca');
  }
  m.collider(x, y + 1.48, z, 1.7, 2.96, .62, 'bookcase');
}

// 主馆采用温暖石材、深绿窗板、黄铜标识和通透的两层回游动线。
export function folio() {
  const m = new Blocks('folio', 32); shell(m, 18);
  m.box(0, 8.2, 7.58, 15, .68, .12, '#294e43');
  m.sign('FOLIO LIBRARY', 0, 8.2, 7.69, 13.7);
  // 门楣与外墙砌块是真实错缝结构，细节留在室外载体。
  for (let row = 0; row < 24; row++) for (let col = 0; col < 18; col++) {
    const x = -8.5 + col + (row % 2) * .18;
    if (Math.abs(x) < 2.15 || Math.abs(x) > 8.8) continue;
    const y = .85 + row * .3;
    if ((y > 1.35 && y < 3.85) || (y > 5.35 && y < 7.85)) continue;
    m.box(x, y, 7.54, .94, .25, .05, row % 3 ? '#d6cab1' : '#cabc9f');
  }
  // 庭院长椅、花池、路灯与寻路石板。
  for (const x of [-6, 6]) {
    for (const z of [9.5, 13.4]) {
      m.table(x, .7, z, 2.2, .55, '#a5835c');
      m.plant(x, .7, z + 1.1, 1.3);
    }
    m.box(x, 2.6, 15, .08, 3.8, .08, '#344d45', true, 'courtyard-light');
    m.round(x, 4.55, 15, .32, .15, '#f4e2b4');
  }
  for (let i = 0; i < 8; i++) m.box(0, .56, 13.3 + i * .85, 3, .08, .72, '#d9cfbc');
  // 两侧和背立面使用低对比砌块，形成完整的四向建筑外观。
  for (let row = 0; row < 24; row++) {
    for (let col = 0; col < 30; col++) for (const side of [-1, 1])
      m.box(side * 9.04, .9 + row * .32, -7.15 + col * .49, .045, .29, .455,
        row % 4 ? '#cfc4ab' : '#c2b69a');
    for (let col = 0; col < 36; col++) m.box(-8.7 + col * .49, .9 + row * .32, -7.54,
      .455, .29, .045, '#ccc0a8');
  }
  // 庭院的铺石有明确间隙，灯光和植栽仍是主要视觉焦点。
  for (const side of [-1, 1]) for (let ix = 0; ix < 12; ix++) for (let iz = 0; iz < 20; iz++)
    m.box(side * (3.6 + ix * .44), .57, 8 + iz * .44, .41, .06, .41, '#d2c7ad');
  m.parts = m.interior;
  // 二楼楼板仅在东侧楼梯井留洞；后平台与侧主楼板无缝连接。
  m.box(-1.6, 4.58, 0, 14.8, .24, 14.6, '#bdab8d', true, 'upper-floor');
  m.box(7.3, 4.58, -5.7, 3, .24, 3.2, '#bdab8d', true, 'upper-floor-landing');
  m.box(7.3, 4.58, 6.5, 3, .24, 1.6, '#bdab8d', true, 'upper-floor-front');
  stairs(m, 7.35, .7, 4.95, 4, 1.7);
  m.box(5.88, 5.2, .1, .14, 1, 11.1, '#57695a', true, 'upper-balustrade');
  // 两层各十六分区，中央留出 1.8 米以上的主要通道。
  for (let floor = 0; floor < 2; floor++) {
    const y = .7 + floor * 4;
    for (let i = 0; i < 8; i++) bookcase(m, -7.65 + i * 1.72, y, -6.8, i + floor * 16);
    for (let row = 0; row < 2; row++) for (let i = 0; i < 4; i++)
      bookcase(m, -7.3 + i * 2.25, y, -3.2 + row * 3.4, 8 + row * 4 + i + floor * 16);
    for (const x of [-5.6, -1]) {
      m.table(x, y, 3.4, 2.8, 1.05);
      for (const dx of [-.8, .8]) {
        m.chair(x + dx, y, 4.3); m.chair(x + dx, y, 2.5, '#6b7c65', true);
        m.lamp(x + dx, y + .9, 3.4);
      }
      m.lamp(x, y + 3.1, -.9, true);
    }
    m.plant(-8, y, 5.9, 1.2); m.plant(4.9, y, -5.8, .9);
    // 靠窗个人学习位，配小隔板、书本和台灯。
    for (let i = 0; i < 4; i++) {
      const x = -6.8 + i * 2.15;
      m.table(x, y, 6.3, 1.6, .65); m.chair(x, y, 5.4, '#ad8762', true);
      m.box(x + .78, y + 1.12, 6.3, .05, .45, .65, '#849584');
      m.lamp(x - .5, y + .9, 6.3);
      m.book(x + .45, y + .89, 6.3, .12, .28, .25, colors[i]);
    }
  }
  // 服务台、档案柜与新书展台避开东侧楼梯底端。
  m.cabinet(3.4, .7, 5.4, 2.7, 1.05, .85, '#6c806e', 1);
  m.box(3.4, 1.83, 5.4, 2.9, .12, 1, '#cfb582');
  m.box(3.6, 2.12, 5.35, .55, .36, .06, '#263f42');
  m.sign('WELCOME', 3.4, 1.32, 5.91, 2.2, '#f2e8c9', 32);
  for (let i = 0; i < 3; i++) m.cabinet(3.9, 4.7, -3.4 + i * 1.4, 1, 1.8, .6, '#8a7253', 5);
  m.sofa(-6.7, .7, -4.8, 2.1, '#7f9481');
  // 儿童角：低台、彩色座墩和开放绘本盒。
  m.table(3.2, .7, -2.6, 1.7, 1.2, '#c19b5e');
  for (let i = 0; i < 4; i++) {
    m.round(2.4 + i % 2 * 1.7, .9, -1.5 - Math.floor(i / 2) * 2.1, .25, .4, colors[i]);
    m.collider(2.4 + i % 2 * 1.7, .9, -1.5 - Math.floor(i / 2) * 2.1, .5, .4, .5, 'child-seat');
  }
  m.sofa(2.8, 4.7, 2.4, 2.5, '#7b8d7c');
  m.table(2.8, 4.7, 3.65, 1.6, .7);
  m.sign('QUIET READING', -.6, 7.8, -7.23, 7, '#526a56');
  return m;
}
