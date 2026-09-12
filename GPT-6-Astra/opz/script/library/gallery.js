import { Blocks, shell } from './blocks.js';

// 空白画框由背板与四根木边组成；侧墙版本交换横向和纵深尺寸。
function frame(m, x, z, side = false) {
  const width = 2; const height = 1.6; const edge = .08;
  // 画框贴墙布置，不在中央观展通道增加家具或障碍。
  function piece(u, v, w, h, color) {
    m.box(x + (side ? 0 : u), 2.6 + v, z + (side ? u : 0),
      side ? .12 : w, h, side ? w : .12, color);
  }
  piece(0, 0, width - edge * 2, height - edge * 2, '#f8f5ee');
  for (const s of [-1, 1]) {
    piece(s * (width - edge) / 2, 0, edge, height, '#665344');
    piece(0, s * (height - edge) / 2, width - edge * 2, edge, '#665344');
  }
  m.collider(x, 2.6, z, side ? .12 : width, height, side ? width : .12, 'picture-frame');
}

// 单层艺术展览馆：与蜜雪冰城共用 18 × 15 米主体及入口，内部仅陈列画框。
export function gallery() {
  const m = new Blocks('gallery', 126);
  shell(m, 18, 1, '#eeeae2');
  // 深色门楣与浅色檐口勾勒简洁立面，避免额外招牌纹理依赖。
  m.box(0, 4.25, 7.62, 17.8, .6, .15, '#454c4b');
  m.box(0, 4.62, 7.62, 18, .1, .2, '#faf7f0');
  m.parts = m.interior;
  // 后墙四幅、两侧各四幅，保留完整中央展厅和入口动线。
  for (const x of [-6, -2, 2, 6]) frame(m, x, -7.22);
  for (const x of [-8.72, 8.72]) {
    for (const z of [-5.2, -1.8, 1.6, 5]) frame(m, x, z, true);
  }
  // 预算覆盖室内外所有可视立方体，后续扩展也不能悄然超额。
  if (m.outside.length + m.interior.length > 10000) {
    throw new Error('艺术展览馆超过 10000 个立方体预算');
  }
  return m;
}
