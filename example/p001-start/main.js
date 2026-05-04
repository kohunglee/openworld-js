// 开发环境按需加载 cannon，生产环境由 Vite banner 注入，不重复引入
async function ensureCannonForDev() {
  // 若 cannon 已存在，直接跳过（兼容生产注入/重复进入）
  if (globalThis.CANNON) return;
  // 兼容多种启动方式：Vite dev、项目根静态服务、dist 静态服务
  const candidates = [
    '/cannon/cannon29kb.js',
    '../../cannon/cannon29kb.js',
    '../cannon/cannon29kb.js',
  ];
  for (const src of candidates) {
    try {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`加载失败: ${src}`));
        document.head.appendChild(script);
      });
      if (globalThis.CANNON) return;
    } catch (_) {
      // 当前路径失败继续尝试下一个候选路径
    }
  }
  throw new Error('CANNON 加载失败：已尝试所有候选路径');
}

// 示例启动入口：确保依赖就绪后再初始化世界和实体
async function boot() {
  await ensureCannonForDev();
  const { default: k } = await import('../../src/openworld.js');
  globalThis.k = k;
  k.initWorld('openworldCanv', true);

  // 添加地面
  const gX = 0, gY = -2.5, gZ = 0;
  const gW = 250, gD = 250, gH = 6;
  k.addPhy({ name:'ground-phy', X:gX, Y:gY, Z:gZ, width:gW, depth:gD, height:gH });  // 物理体
  k.W.cube({ n:'ground', x:gX, y:gY, z:gZ, w:gW, d:gD, h:gH, b:'#7B8B6F' });  // 渲染体

  // 添加主角
  k.mainVPlayer = k.addPhy({ name:'mainPlayer', X:10, Y:3, Z:10, size:1, mass:50, colliGroup:1 });
  k.W.cube({ n:'mainPlayer', b:'#FDF9EE' });  // 注意，主角的 n 一定要与物理体的 name 一致
}

boot();
