// 各座建筑共享原生立方体几何；视觉实例与粗碰撞体分别登记。
export class Blocks {
  constructor(name, cx) {
    this.name = name; this.cx = cx; this.outside = []; this.interior = [];
    this.parts = this.outside; this.physics = []; this.curves = [];
  }
  // 所有尺寸使用米，位置为中心；碰撞盒保留语义名称供验收。
  box(x, y, z, w, h, d, b = '#e6ddc9', solid = false, tag = 'structure') {
    const a = { x: x + this.cx, y, z, w, h, d, b };
    this.parts.push(a);
    if (solid) this.collider(x, y, z, w, h, d, tag);
    return a;
  }
  // 不使用每实例碰撞，家具整体包络和台阶分别创建物理盒。
  collider(x, y, z, w, h, d, tag = 'furniture') {
    this.physics.push({ X: x + this.cx, Y: y, Z: z, width: w, height: h, depth: d, tag });
  }
  // 字形采样合并连续像素行，避免每个像素一个渲染载体。
  sign(text, x, y, z, width, color = '#f8f1dc', size = 48) {
    const c = document.createElement('canvas'); const ctx = c.getContext('2d');
    c.width = Math.ceil(text.length * size * 1.1); c.height = size * 1.5;
    ctx.font = `bold ${size}px sans-serif`; ctx.fillText(text, 0, size);
    const data = ctx.getImageData(0, 0, c.width, c.height).data;
    const s = width / c.width;
    for (let row = 0; row < c.height; row += 2) {
      let start = -1;
      for (let col = 0; col <= c.width; col++) {
        const filled = col < c.width && data[(row * c.width + col) * 4 + 3] > 100;
        if (filled && start < 0) start = col;
        if (!filled && start >= 0) {
          this.box(x - width / 2 + (start + col) * s / 2, y + (c.height / 2 - row) * s,
            z, (col - start) * s, s * 1.8, .06, color); start = -1;
        }
      }
    }
  }
  // 圆形物件用实心窄截面近似，适合花盆、杯子、镜头和座椅圆角。
  round(x, y, z, radius, h, color, slices = 12) {
    const start = this.parts.length;
    for (let i = 0; i < slices; i++) {
      const dx = (i + .5) * radius * 2 / slices - radius;
      this.box(x + dx, y, z, radius * 2 / slices, h,
        2 * Math.sqrt(radius * radius - dx * dx), color);
    }
    this.curves.push({ x, y, z, radius, h, color, slices, parts: this.parts, blocks: this.parts.slice(start) });
  }
  // 根据实际预算提高圆弧截面的分辨率，不添加无用途的装饰或隐藏填充方块。
  refineCurves(target) {
    let remaining = target - this.outside.length - this.interior.length;
    if (remaining < 0) throw new Error(`${this.name} exceeds block budget`);
    const originals = this.curves.slice(); this.curves = [];
    for (let i = 0; i < originals.length; i++) {
      const curve = originals[i];
      const extra = Math.ceil(remaining / (originals.length - i));
      remaining -= extra;
      const old = new Set(curve.blocks);
      const oldParts = curve.parts;
      const replacement = oldParts.filter(a => !old.has(a));
      if (curve.parts === this.outside) this.outside = replacement;
      else this.interior = replacement;
      // 后续曲线记录同步指向新的数组，避免多次细化时引用旧载体。
      for (const next of originals) if (next.parts === oldParts) next.parts = replacement;
      this.parts = replacement;
      this.round(curve.x, curve.y, curve.z, curve.radius, curve.h, curve.color, curve.slices + extra);
    }
  }
  // 植物由花盆、土壤、分枝和疏密有致的叶片组成。
  plant(x, y, z, scale = 1) {
    this.round(x, y + .23 * scale, z, .27 * scale, .46 * scale, '#ac6b49');
    this.round(x, y + .48 * scale, z, .22 * scale, .035, '#393b28');
    this.box(x, y + .9 * scale, z, .045, .8 * scale, .045, '#68513c');
    for (let i = 0; i < 18; i++) {
      const a = i * 2.399; const r = (.16 + i % 3 * .07) * scale;
      const leaf = this.box(x + Math.cos(a) * r, y + (.65 + i * .045) * scale,
        z + Math.sin(a) * r, .32 * scale, .045 * scale, .13 * scale,
        ['#355b43', '#557957', '#6b895a'][i % 3]);
      leaf.ry = a * 180 / Math.PI; leaf.rz = (i % 2 ? 20 : -20);
    }
    this.collider(x, y + .3 * scale, z, .54 * scale, .6 * scale, .54 * scale, 'planter');
  }
  // 桌面、裙板与四条腿独立建模；碰撞覆盖桌面和腿脚空间。
  table(x, y, z, w = 1.8, d = .9, color = '#a77950') {
    this.box(x, y + .82, z, w, .12, d, color);
    this.box(x, y + .7, z, w - .12, .12, d - .12, '#5c5148');
    for (const dx of [-1, 1]) for (const dz of [-1, 1])
      this.box(x + dx * (w / 2 - .12), y + .34, z + dz * (d / 2 - .12), .09, .68, .09, '#343e3d');
    this.collider(x, y + .44, z, w, .88, d, 'table');
  }
  // 座椅采用开放腿部与厚坐垫，不用单个立方体替代家具造型。
  chair(x, y, z, color = '#557468', reverse = false) {
    const s = reverse ? -1 : 1;
    this.box(x, y + .44, z, .53, .12, .55, color);
    this.box(x, y + .78, z + .23 * s, .53, .56, .09, color);
    for (const dx of [-.2, .2]) for (const dz of [-.2, .2])
      this.box(x + dx, y + .2, z + dz, .055, .4, .055, '#654e3d');
    this.collider(x, y + .5, z, .55, 1, .57, 'chair');
  }
  // 多层沙发含独立坐垫、靠枕、扶手与底脚。
  sofa(x, y, z, w = 2.4, color = '#bb845d') {
    this.box(x, y + .3, z, w, .4, .95, color);
    this.box(x, y + .8, z - .4, w, .8, .18, color);
    for (const s of [-1, 1]) this.box(x + s * (w / 2 - .1), y + .59, z, .2, .58, 1, color);
    for (let i = 0; i < 3; i++) {
      this.box(x + (i - 1) * (w - .45) / 3, y + .55, z + .02, (w - .55) / 3, .16, .7, '#d5ae80');
      this.box(x + (i - 1) * (w - .45) / 3, y + .87, z - .24, (w - .58) / 3, .42, .16, '#dbba91');
    }
    this.collider(x, y + .58, z, w, 1.16, 1, 'sofa');
  }
  // 柜体具备分隔板、门面和金属把手。
  cabinet(x, y, z, w, h, d, color = '#a17b56', rows = 3) {
    this.box(x, y + h / 2, z, w, h, d, color, true, 'cabinet');
    for (let i = 0; i < rows; i++) {
      this.box(x, y + (i + .5) * h / rows, z + d / 2 + .04, w - .08, h / rows - .06, .04, '#d7c6ab');
      this.box(x, y + (i + .5) * h / rows + .08, z + d / 2 + .095, w * .25, .035, .06, '#5c635e');
    }
  }
  // 灯具使用不透明乳白灯罩，全部纳入既有实例载体。
  lamp(x, y, z, hanging = false) {
    this.box(x, y + .25, z, .035, .5, .035, '#394846');
    this.round(x, hanging ? y : y + .51, z, .19, .13, '#f7e4ab');
    if (!hanging) this.round(x, y + .025, z, .14, .05, '#394846');
  }
  // 精装书包含两封面、书脊、纸口、金线和四个包角，无逐页和标题循环。
  book(x, y, z, w, h, d, color, detail = true) {
    this.box(x, y + h / 2, z, w - .016, h - .025, d - .035, '#e9ddbd');
    for (const dx of [-1, 1]) this.box(x + dx * (w / 2 - .004), y + h / 2, z, .008, h, d, color);
    this.box(x, y + h / 2, z + d / 2, w, h, .018, color);
    if (!detail) return;
    for (const a of [.08, .18, .8, .91]) this.box(x, y + h * a, z + d / 2 + .022, w * .76, .012, .01, '#d9b97b');
    this.box(x, y + h * .42, z + d / 2 + .024, w * .35, .025, .012, '#eadfbc');
    for (const dx of [-1, 1]) for (const a of [.03, .97])
      this.box(x + dx * w * .36, y + h * a, z + d / 2 + .024, w * .2, .026, .012, '#cda66a');
    for (const a of [.02, .98]) this.box(x, y + h * a, z, w * .8, .01, d * .85, '#f1e7cf');
    for (const dx of [-1, 1]) this.box(x + dx * w * .27, y + h * .6, z + d / 2 + .024, .009, h * .22, .012, '#cfb582');
  }
}

// 连续楼梯每级提升 0.2 米；平台与楼板边缘对接，不用斜视觉板冒充楼梯。
export function stairs(m, x, base, zStart, rise = 4, width = 1.55) {
  const count = Math.round(rise / .2); const tread = .46;
  for (let i = 0; i < count; i++) {
    const top = base + rise * (i + 1) / count;
    m.box(x, (base + top) / 2, zStart - i * tread, width, top - base, tread, '#c4b59b', true, 'stair');
  }
  m.box(x, base + rise - .12, zStart - count * tread - .37, width, .24, 1.2, '#c4b59b', true, 'landing');
  // 楼梯两侧扶手沿坡度逐段升高，碰撞盒限制跌落。
  for (const side of [-1, 1]) for (let i = 0; i < count; i += 2) {
    const z = zStart - i * tread; const top = base + rise * (i + 1) / count;
    m.box(x + side * (width / 2 + .065), top + .45, z, .075, .9, .075, '#566158');
    const rail = m.box(x + side * (width / 2 + .065), top + .94, z - .23, .075, .075, 1.01, '#566158');
    rail.rx = -Math.atan(.2 / tread) * 180 / Math.PI;
    m.collider(x + side * (width / 2 + .065), top + .5, z - .23, .1, 1, .92, 'stair-rail');
  }
}

// 建筑外壳与不透明窗板；入口两道错位屏风形成两次转向。
export function shell(m, w, floors = 2, color = '#ded3bc') {
  m.parts = m.outside; const height = floors * 4;
  m.box(0, .6, 0, w, .2, 15, '#c8bba4', true, 'ground-floor');
  m.box(0, height + .83, 0, w + .35, .26, 15.35, '#e5d9c3', true, 'roof');
  m.box(0, height / 2 + .7, -7.4, w, height, .2, color, true, 'wall');
  for (const s of [-1, 1]) {
    m.box(s * (w / 2 - .1), height / 2 + .7, 0, .2, height, 15, color, true, 'wall');
    m.box(s * (w / 4 + 1), height / 2 + .7, 7.4, w / 2 - 2, height, .2, color, true, 'wall');
    for (let f = 0; f < floors; f++) for (let i = 0; i < 3; i++) {
      const x = s * (2.65 + i * (w / 2 - 3.3) / 3);
      m.box(x, 2.6 + f * 4, 7.535, (w / 2 - 3) / 3, 2.2, .06, '#294944');
      m.box(x, 3.77 + f * 4, 7.58, (w / 2 - 3) / 3 + .08, .1, .13, '#b39561');
      m.box(x, 1.43 + f * 4, 7.58, (w / 2 - 3) / 3 + .08, .1, .13, '#b39561');
    }
  }
  m.box(0, 3.85, 7.4, 4, .5, .2, color, true, 'door-lintel');
  if (floors > 1) m.box(0, 6.45, 7.4, 4, 4.3, .2, color, true, 'front-upper');
  // 入口走廊天花只高 3.1 米，始终低于门店中文招牌。
  m.box(0, 3.15, 10, 6.4, .2, 5, color, true, 'vestibule-roof');
  m.box(0, .6, 10, 6.4, .2, 5, '#c8bba4', true, 'vestibule-floor');
  for (const s of [-1, 1]) m.box(s * 3.1, 1.9, 10, .2, 2.4, 5, color, true, 'vestibule-side');
  m.box(-.85, 1.9, 11.25, 4.5, 2.4, .2, color, true, 'entry-screen');
  m.box(.85, 1.9, 8.8, 4.5, 2.4, .2, color, true, 'entry-screen');
}

// 屋顶与二层护栏采用实心矮墙加顶部金属压条。
export function roofRails(m, w, y) {
  for (const s of [-1, 1]) {
    m.box(s * (w / 2 - .16), y + .5, 0, .16, 1, 14.7, '#b8baac', true, 'roof-rail');
    m.box(s * (w / 2 - .16), y + 1.04, 0, .2, .06, 14.7, '#4c6058');
    m.box(0, y + .5, s * 7.22, w - .5, 1, .16, '#b8baac', true, 'roof-rail');
  }
}
