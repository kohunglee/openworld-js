// 顺序加载 JS 文件
function loadScriptsSequentially(files) {
    return files.reduce((promise, file) => {
        return promise.then(() => new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = file;
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        }));
    }, Promise.resolve());
}

const files = [
    "./house/script/makegroundmvp.js", // 地面和人物
    "./house/script/newmvp.js",        // 新角色
    
    "./house/script/cubedata.js",      // 模型数据
    "./house/script/startbuild.js",    // 建造初始化
];

// 全部加载完成后自动启动
loadScriptsSequentially(files)
    .then(() => {
        console.log("所有脚本加载完成！");
        if (window.initApp) window.initApp(); // 可选，看你是否需要回调
    })
    .catch(err => console.error("脚本加载失败:", err));
