/**
 * 马里奥模型测试 插件
 * ========
 * 功能是导入马里奥模型
 */
export default async function (ccgxkObj) {
  console.log('导入 mario 插件成功');

  const { data } = await import('https://selfcdn.openworld.zone/test/mario/mario.js');

  const img = new Image();

  img.crossOrigin = 'anonymous';
  img.id = 'mario';
  img.hidden = true;

  img.onload = () => {
    document.body.appendChild(img);

    globalThis.mario_uv = img;

    ccgxkObj.W.add('mario_txt', data);

    ccgxkObj.W.mario_txt({
      n: 'mario',
      x: 37.88,
      y: 0.7,
      z: -7.44,
      size: 2,
      rx: -90,
      ry: 180,
      s: 1,
      t: img,
    });
  };

  img.onerror = () => {
    console.error('Failed to load mario.png');
  };

  img.src = 'https://selfcdn.openworld.zone/test/mario/mario.png';
}
