// 入口
// 加载预设纹理，开始程序
k.loadTexture(k.svgTextureLib).then(loadedImage => {
    console.time('load');
    makeGroundMvp();
    newMvp();
    startBuild();
    logicFunc();
    logicData();
    bookSystem();
    dataProcess();
    console.timeEnd('load');


    // globalThis.jpflag = k.textureMap.get('jpflag');


});



// // svg test
// const svgTestCode = `
// <svg xmlns="http://www.w3.org/2000/svg" width="1190" height="840" viewBox="0 0 360 120" role="img" aria-label="三个红色方块 与 你好">
//   <!-- 背景（可选） -->
//   <rect width="100%" height="100%" fill="#00000046"/>

//   <!-- 三个红色方块 -->
//   <rect x="20"  y="20" width="60" height="60" fill="#e63946" rx="4" />
//   <rect x="110" y="20" width="60" height="60" fill="#e63946" rx="4" />
//   <rect x="200" y="20" width="60" height="60" fill="#e63946" rx="4" />

//   <!-- 汉字 "你好" -->
//   <text x="290" y="62" font-family="Noto Sans SC, PingFang SC, 'Microsoft Yahei', sans-serif"
//         font-size="3" text-anchor="middle" dominant-baseline="middle" fill="#0a0a0a">
//     你好
//   </text>
// </svg>
// `;
// const textureAlp = [
//       { id:'svgTest', type: 'svg', svgCode: svgTestCode },
// ];
// k.loadTexture(textureAlp).then(loadedImage => {
//     const mySvg = k.textureMap.get('svgTest');
//     // console.log(mySvg);
//     k.W.cube({
//         n: 'testPng',
//         x: 14.39, y: 1.5, z: -35.61,
//         w: 1.19, h: 0.84, d: 1.19,
//         t:mySvg,
//     });
// })