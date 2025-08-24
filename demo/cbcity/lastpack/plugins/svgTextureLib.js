/**
 * 一些 svg 滤镜生成的纹理库源码
 * ========
 * 可用于纹理等等
 */

export default function(ccgxkObj){

  const greenStone = genStone(-20, -20, 1060, 1060);

  const greenStoneborder = genStone(0, 0, 1024, 1024);

  const frosted = `
<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
  <filter id="opaque-frost">
    <feFlood flood-color="#000" result="background" />
    <feTurbulence type="fractalNoise" baseFrequency="0.1" numOctaves="1" result="noise" />
    <feMerge>
      <feMergeNode in="background" />
      <feMergeNode in="noise" />
    </feMerge>
  </filter>
  <rect width="100%" height="100%" filter="url(#opaque-frost)" />
</svg>
`;

  // 日本国旗
  const drawjpflag = function(ctx, w, h) {
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
    const radius = 150;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'red';
    ctx.fill();
    ctx.stroke();
  };

  // 5*5 棋格图
  const drawCheckerboard = function(ctx, w, h) {
    // 第一步：确定“设计蓝图”
    // 计算出每一块“瓷砖”（小方格）的精确宽度和高度。
    const squareWidth = w / 5;
    const squareHeight = h / 5;

    // 第二步：开始“铺设工作”
    // 工匠需要一个系统性的方法来遍历整个 5x5 的工作区域。
    // 外层循环控制“行”（从上到下）。
    for (let i = 0; i < 5; i++) {
      // 内层循环控制“列”（从左到右）。
      for (let j = 0; j < 5; j++) {

        // 第三步：遵循“神圣的铺设法则”
        // 这是决定棋盘样式的核心规则：根据当前格子的坐标和来决定颜色。
        // (行号 + 列号) 如果是偶数，就用白色；如果是奇数，就用黑色。
        if ((i + j) % 2 === 0) {
          ctx.fillStyle = '#fff'; // 白色瓷砖
        } else {
          ctx.fillStyle = '#000'; // 黑色瓷砖
        }

        // 第四步：放置“瓷砖”
        // 计算出当前这块瓷砖在画布上的确切左上角坐标。
        const x = j * squareWidth;
        const y = i * squareHeight;

        // 在计算好的位置，画下这块填满颜色的小方格。
        ctx.fillRect(x, y, squareWidth, squareHeight);
      }
    }
  };


  ccgxkObj.svgTextureLib = [
      // 有边界的石头纹理
      { id:'greenStoneborder', type: 'svg-rasterize', svgCode: greenStoneborder },

      // 石头纹理
      { id:'greenStone', type: 'svg-rasterize', svgCode: greenStone },

      // 磨砂
      { id:'frosted', type: 'svg-rasterize', svgCode: frosted },

      // 日本国旗
      {func:drawjpflag, id:'jpflag', type: 'jpg'},

      // 5*5 棋格图
      {func:drawCheckerboard, id:'checkerboard', type: 'jpg'},
  ];
};

function genStone(x, y, w, d){
  return `
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <filter id="ancient-wall" filterUnits="userSpaceOnUse" x="${x}" y="${y}" width="${w}" height="${d}">
    <feTurbulence type="fractalNoise" baseFrequency="0.005" numOctaves="4" seed="10" result="base_plaster" />
    <feDiffuseLighting in="base_plaster" surfaceScale="15" lighting-color="white" result="lit_plaster">
      <feDistantLight azimuth="145" elevation="30" />
    </feDiffuseLighting>
    <feTurbulence type="turbulence" baseFrequency="0.04" numOctaves="3" seed="20" result="fine_grit" />
    <feDisplacementMap in="lit_plaster" in2="fine_grit" scale="20" xChannelSelector="R" yChannelSelector="G" result="distressed_surface" />
    <feComponentTransfer in="distressed_surface" result="colored_wall">
      <feFuncR type="table" tableValues="0.0 0.1 0.7" />
      <feFuncG type="table" tableValues="0.1 0.4 0.8" />
      <feFuncB type="table" tableValues="0.1 0.4 0.75" />
    </feComponentTransfer>
    <feRadialGradient id="vignette" cx="25%" cy="25%" r="75%" fx="25%" fy="25%">
        <stop offset="0%" stop-color="white" stop-opacity="1" />
        <stop offset="100%" stop-color="black" stop-opacity="1" />
    </feRadialGradient>
    <feBlend in="colored_wall" in2="vignette" mode="multiply" />
  </filter>
  <rect width="100%" height="100%" filter="url(#ancient-wall)" />
</svg>
  `;
}