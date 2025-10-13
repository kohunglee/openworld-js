// 入口
// 加载预设纹理，开始程序
k.loadTexture(k.svgTextureLib).then(loadedImage => {
    console.time('load');
    makeGroundMvp();
    newMvp();
    startBuild();
    logicFunc();
    logicData();
    dataProcess();

    /********/
    // bookSystem();
    bookSysRegis();
    /********/

    console.timeEnd('load');
});


// fps 辅助
(function(){var script=document.createElement('script');
script.onload=function(){var stats=new Stats();
document.body.appendChild(stats.dom);
requestAnimationFrame(function loop(){stats.update();requestAnimationFrame(loop)});};
script.src='https://mrdoob.github.io/stats.js/build/stats.min.js';document.head.appendChild(script);})()