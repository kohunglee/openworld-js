// 入口
// 加载预设纹理，开始程序
k.loadTexture(k.svgTextureLib).then(loadedImage => {
    makeGroundMvp();
    newMvp();
    startBuild();
    logicFunc();
    logicData();
    bookSystem();
    dataProcess();
});