/** 这个世界的实例方块总数；修改四个分区时必须同时维持这个总数。 */
const INSTANCE_COUNT = 5_000;
const TERRAIN_TILE_COUNT = 2_500;
// 预留 1 块给入口平台，使可见世界仍精确保持 5,000 个实例。
const CRYSTAL_COUNT = 1_499;
const AURORA_COUNT = 600;
const PORTAL_COUNT = 400;

/** 用于快速选取不同区域色彩的调色盘。 */
const TERRAIN_COLORS = ['#0f766e', '#0d9488', '#14b8a6', '#0891b2', '#0284c7'];
const CRYSTAL_COLORS = ['#22d3ee', '#38bdf8', '#818cf8', '#a78bfa', '#f0abfc'];
const AURORA_COLORS = ['#67e8f9', '#7dd3fc', '#a5b4fc', '#c4b5fd', '#f0abfc'];
const PORTAL_COLORS = ['#fef08a', '#fbbf24', '#fb7185', '#f0abfc'];

/**
 * 加载 cannon 物理引擎。
 *
 * 这份示例可由 Vite 开发服务器或构建产物运行，因此对物理脚本路径做兼容处理。
 */
async function ensureCannonForDev() {
  if (globalThis.CANNON) return;

  const candidates = ['/cannon/cannon29kb.js', '../../cannon/cannon29kb.js'];
  for (const src of candidates) {
    try {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`加载失败：${src}`));
        document.head.appendChild(script);
      });

      if (globalThis.CANNON) return;
    } catch {
      // 当前候选路径不适用时，继续尝试下一条路径。
    }
  }

  throw new Error('CANNON 加载失败，无法启动物理世界。');
}

/**
 * 创建可复现的伪随机数生成器。
 *
 * 固定种子可让每次刷新都看到同一片世界，便于调试与分享。
 *
 * @param {number} seed 初始种子。
 * @returns {() => number} 返回 [0, 1) 的随机数函数。
 */
function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 4_294_967_296;
  };
}

/**
 * 从调色盘中取色，保证色彩分布仍由固定种子控制。
 *
 * @param {string[]} colors 可选颜色。
 * @param {() => number} random 伪随机数函数。
 * @returns {string} 一个颜色值。
 */
function pickColor(colors, random) {
  return colors[Math.floor(random() * colors.length)];
}

/**
 * 写入一个实例方块，并返回其数组下标，便于后续调用 updateInstance 动画。
 *
 * @param {Array<Record<string, number | string>>} instances 实例化方块列表。
 * @param {Record<string, number | string>} cube 单个方块属性。
 * @returns {number} 新方块的实例下标。
 */
function addInstance(instances, cube) {
  instances.push(cube);
  return instances.length - 1;
}

/**
 * 创建 50 × 50 的发光地毯，共 2,500 块。
 *
 * 地毯贴在真实物理地面上方；每块随后都会登记为 DPZ 托管的静态物理档案。
 *
 * @param {Array<Record<string, number | string>>} instances 实例化方块列表。
 * @param {() => number} random 伪随机数函数。
 */
function createTerrain(instances, random) {
  const side = Math.sqrt(TERRAIN_TILE_COUNT);
  const spacing = 2.35;

  for (let row = 0; row < side; row += 1) {
    for (let column = 0; column < side; column += 1) {
      const x = (column - (side - 1) / 2) * spacing;
      const z = (row - (side - 1) / 2) * spacing - 18;
      const ripple = (Math.sin(column * 0.43) + Math.cos(row * 0.37)) * 0.12;
      const height = 0.18 + random() * 0.26 + ripple;

      addInstance(instances, {
        x,
        y: 0.52 + height / 2,
        z,
        w: 2.22,
        h: height,
        d: 2.22,
        b: pickColor(TERRAIN_COLORS, random),
        // DPZ 4（5 米）只服务于物理按需激活；渲染不会按 DPZ 裁剪。
        physicsDpz: 4,
      });
    }
  }
}

/**
 * 创建四片有不同尺度的晶石森林，共 1,499 块。
 *
 * @param {Array<Record<string, number | string>>} instances 实例化方块列表。
 * @param {() => number} random 伪随机数函数。
 */
function createCrystalForests(instances, random) {
  const groves = [
    { x: -42, z: -18, radius: 24 },
    { x: 42, z: -18, radius: 24 },
    { x: -31, z: -70, radius: 21 },
    { x: 31, z: -70, radius: 21 },
  ];

  for (let index = 0; index < CRYSTAL_COUNT; index += 1) {
    const grove = groves[index % groves.length];
    const angle = random() * Math.PI * 2;
    const radius = Math.sqrt(random()) * grove.radius;
    const width = 0.28 + random() * 0.78;
    const height = 1.4 + random() * 7.6;

    addInstance(instances, {
      x: grove.x + Math.cos(angle) * radius,
      y: 0.54 + height / 2,
      z: grove.z + Math.sin(angle) * radius,
      w: width,
      h: height,
      d: width,
      ry: random() * 45,
      rz: (random() - 0.5) * 13,
      b: pickColor(CRYSTAL_COLORS, random),
      // 晶石不必在整片森林常驻刚体，DPZ 4 足以保证近身碰撞。
        physicsDpz: 4,
    });
  }
}

/**
 * 创建环绕中央区域的悬浮极光，共 600 块。
 *
 * @param {Array<Record<string, number | string>>} instances 实例化方块列表。
 * @param {Array<{index: number, baseY: number, phase: number}>} animatedCubes 动画方块索引。
 * @param {() => number} random 伪随机数函数。
 */
function createAurora(instances, animatedCubes, random) {
  for (let index = 0; index < AURORA_COUNT; index += 1) {
    const progress = index / AURORA_COUNT;
    const angle = progress * Math.PI * 7;
    const radius = 24 + Math.sin(angle * 1.7) * 6;
    const height = 15 + Math.sin(angle * 2.2) * 4 + Math.cos(angle * 0.55) * 2;
    const cube = {
      x: Math.cos(angle) * radius,
      y: height,
      z: -35 + Math.sin(angle) * radius,
      w: 0.35 + random() * 0.32,
      h: 0.35 + random() * 0.72,
      d: 0.35 + random() * 0.32,
      ry: angle * 57.3,
      b: pickColor(AURORA_COLORS, random),
      // 天空方块只有玩家真正抵达同一米级空间时才会创建碰撞体。
        physicsDpz: 5,
    };

    const instanceIndex = addInstance(instances, cube);
    // 只更新其中一部分方块，让魔法感不牺牲整批实例化渲染性能。
    if (index % 5 === 0) animatedCubes.push({ index: instanceIndex, baseY: height, phase: angle });
  }
}

/**
 * 创建四座垂直传送门，共 400 块。
 *
 * 每座门由 100 块组成，既是远方地标，也让世界边界有可被看见的方向感。
 *
 * @param {Array<Record<string, number | string>>} instances 实例化方块列表。
 * @param {() => number} random 伪随机数函数。
 */
function createPortals(instances, random) {
  const portals = [
    { x: -57, z: -46 },
    { x: 57, z: -46 },
    { x: -50, z: -86 },
    { x: 50, z: -86 },
  ];
  const blocksPerPortal = PORTAL_COUNT / portals.length;

  for (const portal of portals) {
    for (let index = 0; index < blocksPerPortal; index += 1) {
      const angle = (index / blocksPerPortal) * Math.PI * 2;
      const radius = 8.5;

      addInstance(instances, {
        x: portal.x + Math.cos(angle) * radius,
        y: 10 + Math.sin(angle) * radius,
        z: portal.z,
        w: 0.6 + random() * 0.22,
        h: 0.6 + random() * 0.22,
        d: 0.6 + random() * 0.22,
        rz: angle * 57.3,
        b: pickColor(PORTAL_COLORS, random),
        // 传送门保留较远可见性，但物理仍进入 5 米级近景 DPZ。
        physicsDpz: 4,
      });
    }
  }
}

/**
 * 创建不可见但始终存在的基础物理设施。
 *
 * 五千个可见方块全部放在同一个实例化批次；地基层不参与视觉，仅承担兜底碰撞。
 *
 * @param {object} k OpenWorld.js 主对象。
 * @param {string} name 方块唯一名称。
 * @param {number} x X 坐标。
 * @param {number} y Y 坐标。
 * @param {number} z Z 坐标。
 * @param {number} width X 方向尺寸。
 * @param {number} height Y 方向尺寸。
 * @param {number} depth Z 方向尺寸。
 */
function addInvisiblePhysicalBlock(k, name, x, y, z, width, height, depth) {
  k.addPhy({ name: `${name}-phy`, X: x, Y: y, Z: z, width, height, depth });
}

/**
 * 为每个实例化方块登记静态物理档案，但不重复创建可见模型。
 *
 * 这与大型 Open World Zone 的 dataProc 链路一致：addTABox 先把 5,000 块写入
 * 类型化数组与空间网格；dynaNodes_lab 只为玩家附近的格子调用 activeTABox 创建
 * Cannon 静态刚体，离开后会移除刚体。这样每个方块都有物理属性，计算量却不随
 * 全世界 5,000 块线性常驻增长。
 *
 * @param {object} k OpenWorld.js 主对象。
 * @param {Array<Record<string, number | string>>} instances 所有实例化方块。
 * @returns {number} 实际登记的物理档案数。
 */
function registerInstancedPhysics(k, instances) {
  const startIndex = k.cursorIdx;

  for (const cube of instances) {
    k.addTABox({
      // DPZ 4/5 仅决定物理体何时驻留；视觉不参与这套距离调度。
      DPZ: cube.physicsDpz ?? 3,
      isPhysical: true,
      // 渲染仍完全交给 wonder-cubes 这个实例化批次，不能创建 5,000 份重复模型。
      isVisualMode: false,
      mass: 0,
      colliGroup: k.stoneGroupNum,
      X: cube.x,
      Y: cube.y,
      Z: cube.z,
      width: cube.w,
      height: cube.h,
      depth: cube.d,
      rX: cube.rx ?? 0,
      rY: cube.ry ?? 0,
      rZ: cube.rz ?? 0,
    });
  }

  const registeredCount = k.cursorIdx - startIndex;
  if (registeredCount !== instances.length) {
    throw new Error(`物理档案数量错误：期望 ${instances.length}，实际 ${registeredCount}`);
  }
  return registeredCount;
}

/**
 * 低频小批量更新极光的实例矩阵。
 *
 * 可见世界始终是一个 wonder-cubes 实例化批次；这里不会进行任何按距离隐藏。
 *
 * @param {object} k OpenWorld.js 主对象。
 * @param {Array<{index: number, baseY: number, phase: number}>} animatedCubes 动画方块索引。
 */
function animateAurora(k, animatedCubes) {
  const updatesPerTick = 8;
  const updateInterval = 1_000 / 24;
  let cursor = 0;
  let lastUpdateTime = 0;

  function update(now) {
    if (now - lastUpdateTime >= updateInterval) {
      const time = now / 1_000;
      for (let offset = 0; offset < updatesPerTick; offset += 1) {
        const cube = animatedCubes[(cursor + offset) % animatedCubes.length];
        k.W.updateInstance('wonder-cubes', cube.index, {
          y: cube.baseY + Math.sin(time * 1.9 + cube.phase) * 1.15,
        });
      }
      cursor = (cursor + updatesPerTick) % animatedCubes.length;
      lastUpdateTime = now;
    }
    requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

/**
 * 将渲染帧率与当前 DPZ 激活的物理块数显示在页面上。
 *
 * 这只测量与展示，不改变任何渲染批次的可见性；完整世界始终由同一个实例化对象绘制。
 *
 * @param {object} k OpenWorld.js 主对象。
 */
function startFpsMonitor(k) {
  const fpsElement = document.querySelector('#fps-value');
  const renderCountElement = document.querySelector('#render-count');
  const physicsCountElement = document.querySelector('#physics-count');
  let sampleStart = performance.now();
  let frames = 0;

  function update(now) {
    frames += 1;
    if (now - sampleStart >= 1_000) {
      fpsElement.textContent = String(Math.round(frames * 1_000 / (now - sampleStart)));
      renderCountElement.textContent = '5,000';
      physicsCountElement.textContent = `5,000（附近 ${k.currentlyActiveIndices.size} 块已激活）`;
      sampleStart = now;
      frames = 0;
    }
    requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

/**
 * 启动世界：用一个实例化批次渲染 5,000 个方块，并让其中一小部分轻柔浮动。
 */
async function boot() {
  await ensureCannonForDev();
  const { default: k } = await import('../../src/openworld.js');
  const random = createRandom(0x5_000_c0de);
  const instances = [];
  const animatedCubes = [];

  globalThis.k = k;
  k.initWorld('openworldCanv', false);
  k.W.viewLimit = 350;
  k.W.camera({ fov: 64 });
  k.W.clearColor('#071326');
  k.W.light({ x: 0.4, y: -1, z: 0.35 });

  // 玩家真正行走在不可见的物理地基上，视觉地毯位于它的表面之上。
  addInvisiblePhysicalBlock(k, 'world-ground', 0, -2.5, -28, 180, 6, 180);

  createTerrain(instances, random);
  createCrystalForests(instances, random);
  createAurora(instances, animatedCubes, random);
  createPortals(instances, random);

  // 入口平台同样放进世界唯一的实例化批次；碰撞稍后由物理档案统一登记。
  addInstance(instances, {
    x: 0,
    y: 0.7,
    z: 44,
    w: 18,
    h: 0.4,
    d: 13,
    b: '#1d4ed8',
    physicsDpz: 4,
  });

  // 图书馆同款结构：整个可见世界始终由一个实例化对象绘制，不按 DPZ 隐藏视觉方块。
  if (instances.length !== INSTANCE_COUNT) {
    throw new Error(`实例方块数量错误：期望 ${INSTANCE_COUNT}，实际 ${instances.length}`);
  }
  k.W.cube({ n: 'wonder-cubes', instances });

  // 玩家出生在入口平台，正前方就是晶石森林和中央极光。
  k.mainVPlayer = k.addPhy({
    name: 'mainPlayer',
    X: 0,
    Y: 3,
    Z: 44,
    size: 1,
    mass: 50,
    colliGroup: 1,
  });
  k.W.cube({ n: 'mainPlayer', b: '#f8fafc' });

  // 登记所有实例的物理档案，再立即激活出生点周围的碰撞体。
  const registeredPhysicsCount = registerInstancedPhysics(k, instances);
  k.dynaNodes_lab();

  document.querySelector('#cube-count').textContent = instances.length.toLocaleString('en-US');
  document.querySelector('#physics-count').textContent = `${registeredPhysicsCount.toLocaleString('en-US')}（附近 ${k.currentlyActiveIndices.size} 块已激活）`;
  animateAurora(k, animatedCubes);
  startFpsMonitor(k);
}

/** 在页面上保留启动错误，避免只在浏览器控制台中丢失关键故障信息。 */
boot().catch((error) => {
  console.error(error);
  document.body.insertAdjacentHTML(
    'beforeend',
    `<p class="fixed bottom-4 left-4 rounded-lg bg-rose-950 p-3 text-sm text-rose-100">启动失败：${error.message}</p>`,
  );
});
