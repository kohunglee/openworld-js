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
    // "./house/script/cubedata.js",      // 模型数据
    // "./house/script/csvread.js",       // csv 读取器
    // "./house/script/makegroundmvp.js", // 地面和人物
    // "./house/script/newmvp.js",        // 新角色
    // "./house/script/startbuild.js",    // 建造初始化
    // "./house/script/logicbuild.js",    // 建造逻辑工具
    // "./house/script/logicdata.js",     // 建造逻辑

    // "./house/script/signboard.js",     // 指示板
    // "./house/script/bookhot.js",       // 书本热点
    // "./house/script/textinshelf.js",   // 书架文字
    // "./house/script/booksystem.js",    // 书系统
    // "./house/script/booksystemtool.js",// 书系统工具

    // "./house/script/dataprocess.js",   // 数据处理
    // "./house/script/vktool.js",        // vk 工具
    // "./house/script/vk.js",            // vk 逻辑
    // "./house/script/event.js",         // 事件
    // "./house/script/dog.js"            // 狗


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
