/**
 * 计算玩家与互动点之间的平面距离。
 */
function distanceToPlayer(world, point) {
  const position = world.mainVPlayer?.body?.position;
  if (!position) return Number.POSITIVE_INFINITY;
  return Math.hypot(position.x - point.x, position.z - point.z);
}

/**
 * 建立小屋全部互动：门窗、灯、壁炉、收音机与猫。
 * 采用就近触发，避免让玩家精确瞄准微小物体。
 */
export function setupInteractions(world, cabinObjects, ui) {
  const state = {
    doorOpen: false,
    windowsOpen: false,
    lightOn: true,
    fireOn: true,
    radioOn: false,
    catHappy: false,
  };

  const actions = [
    {
      x: 0,
      z: 6.5,
      radius: 3.2,
      label: '推开 / 关上木门',
      run() {
        state.doorOpen = !state.doorOpen;
        world.W.move({ n: `T${cabinObjects.door}`, ry: state.doorOpen ? -105 : 0, x: state.doorOpen ? -1.25 : 0 });
        ui.toast(state.doorOpen ? '木门吱呀一声打开了。' : '木门轻轻合上了。');
      },
    },
    {
      x: -5,
      z: 5.7,
      radius: 3,
      label: '打开 / 关上窗户',
      run() {
        state.windowsOpen = !state.windowsOpen;
        cabinObjects.windows.forEach((index, position) => {
          world.W.move({ n: `T${index}`, ry: state.windowsOpen ? (position % 2 ? -25 : 25) : 0 });
        });
        ui.toast(state.windowsOpen ? '清新的风吹进了小屋。' : '窗户关好了，屋里暖和起来。');
      },
    },
    {
      x: -3.8,
      z: -0.5,
      radius: 3.5,
      label: '开关客厅吊灯',
      run() {
        state.lightOn = !state.lightOn;
        world.W.cube({ n: `T${cabinObjects.lamp}`, b: state.lightOn ? 'FFE08A' : '5C564A', ns: state.lightOn ? 1 : 0 });
        world.W.ambient(state.lightOn ? 0.58 : 0.34);
        ui.toast(state.lightOn ? '暖黄色的灯亮了。' : '灯灭了，月色留在窗边。');
      },
    },
    {
      x: -1.8,
      z: -5.4,
      radius: 3,
      label: '点燃 / 熄灭壁炉',
      run() {
        state.fireOn = !state.fireOn;
        world.W.cube({ n: `T${cabinObjects.fire}`, b: state.fireOn ? 'FF7A2F' : '3E3531', ns: state.fireOn ? 1 : 0 });
        ui.toast(state.fireOn ? '火苗重新跳了起来。' : '壁炉只剩下一点余温。');
      },
    },
    {
      x: 1.3,
      z: -5.5,
      radius: 2.8,
      label: '开关老收音机',
      run() {
        state.radioOn = !state.radioOn;
        world.W.cube({ n: `T${cabinObjects.radio}`, b: state.radioOn ? '70A889' : '39434A' });
        ui.toast(state.radioOn ? '收音机传来沙沙的森林气象播报。' : '收音机安静了。');
      },
    },
    {
      x: -3,
      z: 12,
      radius: 5.5,
      label: '摸摸方块猫',
      run() {
        state.catHappy = !state.catHappy;
        ui.toast(state.catHappy ? '喵——它决定陪着陛下逛庭院。' : '方块猫伸了个懒腰。');
      },
    },
  ];

  let nearestAction = null;

  // 低频更新提示即可，不需要每帧做 DOM 操作。
  window.setInterval(() => {
    nearestAction = actions
      .map((action) => ({ action, distance: distanceToPlayer(world, action) }))
      .filter(({ action, distance }) => distance <= action.radius)
      .sort((left, right) => left.distance - right.distance)[0]?.action ?? null;
    ui.hint(nearestAction ? `按 R · ${nearestAction.label}` : '');
  }, 140);

  // R 键只在按下瞬间触发一次，避免长按反复切换。
  document.addEventListener('keydown', (event) => {
    if (event.repeat || event.key.toLowerCase() !== 'r' || !nearestAction) return;
    nearestAction.run();
  });

  return state;
}
