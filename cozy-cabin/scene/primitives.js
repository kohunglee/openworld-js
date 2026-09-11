/**
 * 创建一个同时支持渲染、碰撞与动态区块管理的方块。
 * 本项目统一关闭阴影，保留方块色彩与环境光，以降低旧设备负担。
 */
export function addBlock(world, {
  x = 0,
  y = 0,
  z = 0,
  width = 1,
  height = 1,
  depth = 1,
  color = '888888',
  physical = true,
  shape = 'cube',
  rotationY = 0,
  unlit = false,
} = {}) {
  return world.addTABox({
    DPZ: 0,
    X: x,
    Y: y,
    Z: z,
    width,
    height,
    depth,
    background: color,
    isPhysical: physical,
    shape,
    rY: rotationY,
    isShadow: 0,
    mixValue: 0.86,
    nS: unlit,
  });
}

/**
 * 批量摆放等间距方块，适合台阶、栅栏与装饰线条。
 */
export function addBlockLine(world, count, createArgs) {
  const indices = [];
  for (let index = 0; index < count; index += 1) {
    indices.push(addBlock(world, createArgs(index)));
  }
  return indices;
}
