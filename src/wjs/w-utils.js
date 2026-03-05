// WebGL框架 - 工具函数模块
// ===============

export default function initWUtils(W) {
  // 在两个值之间插值 (修复版：增加 NaN 防御)
  W.lerp = (item, property) => {
    const next = W.next[item];
    const curr = W.current[item];
    // 1. 如果没有 next，直接返回 0 防止报错
    if (!next) return 0;
    // 2. 获取目标值，如果 undefined 默认为 0
    const targetVal = next[property] || 0;

    // 3. 如果没有过渡时间 a，或者 a <= 0，直接一步到位
    if (!next.a || next.a <= 0) return targetVal;

    // 4. 获取当前值，如果当前值没有，就用目标值代替（防止 undefined 参与计算）
    const currentVal = (curr && curr[property] !== undefined) ? curr[property] : targetVal;

    // 5. 计算进度，限制在 0~1 之间 (防止过冲导致数值溢出)
    let t = next.f / next.a;
    // if (t < 0) t = 0; // 通常不需要，f 从 0 开始
    // if (t > 1) t = 1; // 你的 draw 逻辑里已经限制了 f > a，但为了安全可以加上

    return currentVal + (targetVal - currentVal) * t;
  };

  // 过渡一个项目
  W.animation = (item, m = new DOMMatrix) =>
    W.next[item]
    ? m
      .translateSelf(W.lerp(item, 'x'), W.lerp(item, 'y'), W.lerp(item, 'z'))
      .rotateSelf(W.lerp(item, 'rx'),W.lerp(item, 'ry'),W.lerp(item, 'rz'))
      .scaleSelf(W.lerp(item, 'w'),W.lerp(item, 'h'),W.lerp(item, 'd'))
    : m;

  // 计算两个对象之间的距离平方（用于排序透明项目）
  W.dist = (a, b = W.next.camera) => a?.m && b?.m ? (b.m.m41 - a.m.m41)**2 + (b.m.m42 - a.m.m42)**2 + (b.m.m43 - a.m.m43)**2 : 0;

  // 设置环境光级别（0到1）
  W.ambient = a => W.ambientLight = a;

  // 将rgb/rgba十六进制字符串转换为vec4
  W.col = c => [...c.replace("#","").match(c.length < 5 ? /./g : /../g).map(a => ('0x' + a) / (c.length < 5 ? 15 : 255)), 1], // rgb / rgba / rrggbb / rrggbbaa

  // 添加新的3D模型
  W.add = (name, objects) => {
    W.models[name] = objects;
    if(objects.normals){ W.models[name].customNormals = 1 }
    W[name] = settings => W.setState(settings, name);
  };

  // 根据新的 canvas 大小重置画面
  W.resetView = (displayViewTime = 1) => {  // displayViewTime : 显示清晰度
    W.gl.viewport(0, 0, W.gl.canvas.width * displayViewTime, W.gl.canvas.height * displayViewTime);
    W.setState({ n: 'camera', fov: W.next.camera.fov });
  };

  // 内置对象
  // ----------------
  W.group = t => W.setState(t, 'group');
  W.move = (t, delay) => setTimeout(()=>{ W.setState(t) }, delay || 1);
  W.delete = (t, delay) => setTimeout(()=>{ delete W.next[t] }, delay || 1);
  W.camera = (t, delay) => setTimeout(()=>{ W.setState(t, t.n = 'camera') }, delay || 1);
  W.light = (t, delay) => delay ? setTimeout(()=>{ W.setState(t, t.n = 'light') }, delay) : W.setState(t, t.n = 'light');
}
