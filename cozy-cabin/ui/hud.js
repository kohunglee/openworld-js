/**
 * 初始化覆盖在 3D 世界上方的轻量 HUD。
 */
export function createHud(canvas) {
  const intro = document.getElementById('intro');
  const enterButton = document.getElementById('enterButton');
  const interactionHint = document.getElementById('interactionHint');
  const toastElement = document.getElementById('toast');
  let toastTimer = 0;

  // 首次点击只关闭说明页；随后单击画布使用引擎自带的鼠标锁定。
  enterButton?.addEventListener('click', () => {
    intro?.classList.add('hidden');
    window.setTimeout(() => canvas.focus(), 0);
  });

  return {
    /** 显示或隐藏当前可用互动。 */
    hint(message) {
      if (!interactionHint) return;
      interactionHint.textContent = message;
      interactionHint.classList.toggle('hidden', message.length === 0);
    },

    /** 显示短暂的世界反馈。 */
    toast(message) {
      if (!toastElement) return;
      window.clearTimeout(toastTimer);
      toastElement.textContent = message;
      toastElement.classList.remove('hidden');
      toastTimer = window.setTimeout(() => toastElement.classList.add('hidden'), 2600);
    },
  };
}
