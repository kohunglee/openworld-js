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
});