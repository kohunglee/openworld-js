/**
 * 一些 svg 滤镜生成的纹理库源码
 * ========
 * 可用于纹理等等
 */

export default function(ccgxkObj){

  const greenStoneborder = genStone(0, 0, 1024, 1024);

  const greenStone = genStone(-5, -20, 1024 + 5, 1024 + 20);

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
    ctx.fillStyle = '#00000046';
    ctx.fillRect(0, 0, w, h);
    const radius = 150;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'red';
    ctx.fill();
    ctx.stroke();
  };

  // 5*5 棋格图
  const drawCheckerboard = function(ctx, w, h) {
    const number = 5;
    const squareWidth = w / number;
    const squareHeight = h / number;
    for (let i = 0; i < number; i++) {
      for (let j = 0; j < number; j++) {
        if ((i + j) % 2 === 0) {
          ctx.fillStyle = '#fff'; // 白色瓷砖
        } else {
          ctx.fillStyle = '#000000ff'; // 黑色瓷砖
        }
        const x = j * squareWidth;
        const y = i * squareHeight;
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
      // { id:'frosted', type: 'svg-rasterize', svgCode: frosted },

      // 日本国旗
      // {func:drawjpflag, id:'jpflag', type: 'png'},

      // 5*5 棋格图
      // {func:drawCheckerboard, id:'checkerboard', type: 'jpg'},
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