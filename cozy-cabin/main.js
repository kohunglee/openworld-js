import { buildCabin } from './scene/cabin.js';
import { buildCat, buildGarden } from './scene/garden.js';
import { setupInteractions } from './scene/interactions.js';
import { createHud } from './ui/hud.js';

/**
 * 开发环境按需载入物理引擎；生产构建由 Vite 顶部代码自动注入。
 */
async function ensureCannon() {
  if (globalThis.CANNON) return;
  const candidates = ['/cannon/cannon29kb.js', '../cannon/cannon29kb.js'];
  for (const source of candidates) {
    try {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = source;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
      if (globalThis.CANNON) return;
    } catch {
      // 当前路径不可用时继续尝试下一条本地候选路径。
    }
  }
  throw new Error('无法载入 CANNON 物理引擎。');
}

/**
 * 启动世界并创建玩家、场景、互动和环境动画。
 */
async function boot() {
  await ensureCannon();
  // OpenWorld-JS 的部分模块在求值阶段就会读取全局 CANNON，必须等物理引擎就绪后再导入。
  const { default: world } = await import('../src/openworld.js');
  globalThis.k = world;
  world.initWorld('openworldCanv', true);
  world.W.clearColor('9BC1C8');
  world.W.ambient(0.58);
  world.W.light({ x: -0.6, y: -1, z: 0.4 });

  // 玩家出生在庭院门口，默认朝向小屋正门。
  world.mainVPlayer = world.addPhy({ name: 'mainPlayer', X: 0, Y: 2, Z: 21, size: 1, mass: 50, colliGroup: 1 });
  world.W.cube({ n: 'mainPlayer', b: 'F6D58A', s: 1 });
  world.mainCamera.pos = { x: 0, y: 0.55, z: -0.45 };

  buildGarden(world);
  const cabinObjects = buildCabin(world);
  buildCat(world);

  const canvas = document.getElementById('openworldCanv');
  const ui = createHud(canvas);
  const interactionState = setupInteractions(world, cabinObjects, ui);

  // 猫沿庭院缓慢散步；壁炉在开启时轻微闪烁。
  let time = 0;
  function animateScene() {
    time += 0.018;
    const catX = -3 + Math.sin(time * 0.45) * 3.2;
    const catZ = 12 + Math.cos(time * 0.45) * 1.2;
    world.W.move({ n: 'cabin-cat', x: catX, y: 0.7 + Math.sin(time * 2) * 0.03, z: catZ, ry: Math.sin(time * 0.45) > 0 ? 90 : -90 });
    if (interactionState.fireOn && Math.floor(time * 12) % 2 === 0) {
      world.W.cube({ n: `T${cabinObjects.fire}`, b: Math.sin(time * 8) > 0 ? 'FF7A2F' : 'FFB347', ns: 1 });
    }
    window.requestAnimationFrame(animateScene);
  }
  animateScene();

  ui.toast('庭院已经准备好，先单击画面开始行走。');
}

boot().catch((error) => {
  console.error(error);
  const intro = document.getElementById('intro');
  if (intro) intro.innerHTML = '<div class="rounded-2xl bg-red-950 p-6 text-red-100">小屋启动失败，请从项目开发服务器打开此页面。</div>';
});
