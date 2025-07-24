/**
 * 一些 svg 滤镜生成的纹理库源码
 * ========
 * 可用于纹理等等
 */

export default function(ccgxkObj){

    const greenStone = `
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <filter id="ancient-wall" filterUnits="userSpaceOnUse" x="-20" y="-20" width="1060" height="1060">
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

  const greenStoneTwo = `
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <filter id="ancient-wall" filterUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1024">
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

  const greenStoneTest = `
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <filter id="ancient-wall" filterUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1024">
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

    ccgxkObj.svgTextureLib = [
        { id:'greenStoneTwo', type: 'svg-rasterize', svgCode: greenStoneTwo },
        { id:'greenStone', type: 'svg-rasterize', svgCode: greenStone },
        { id:'greenStoneTest', type: 'svg-rasterize', svgCode: greenStoneTest },
    ];
};