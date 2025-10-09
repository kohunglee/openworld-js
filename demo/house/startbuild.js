function startBuild(){
    // Url 参数
    var cellpageid, cubeDatas;
    var urlParams = new URLSearchParams(window.location.search);  // 获取 URL
    k.cellpageid_geturl = urlParams.get('id');  // 获取 url 的 id 参数
    k.isLogicAdd = urlParams.get('logicadd');  // 获取 url 的 id 参数
    if(k.cellpageid_geturl) {
        cellpageid = k.cellpageid_geturl;
    } else {
        cellpageid = Math.random().toString(36).slice(2,7);  // 随机5字符作为ID
    }
    const url = new URL(window.location.href);
    url.searchParams.set('id',cellpageid);
    history.pushState({}, '', url.toString());  // 将这个新的随机字符放置到地址栏

    // 浏览器储存
    if (!localStorage.getItem('ow_' + cellpageid)) {  // 初始化存储
        localStorage.setItem('ow_' + cellpageid, JSON.stringify([]));
        window.cubeDatas = testcubedata;  // 使用我的本地测试数据
    } else {
        window.cubeDatas = JSON.parse(localStorage.getItem('ow_' + cellpageid));
    }
    // console.log(localStorage.getItem('ow_' + cellpageid));
    
    window.totalCube = 2_0000;  // 计划的总方块数
    window.cubeInstances = [];  // 立方体对象【实例】的容器
    window.isHiddenVis = [];  // 【隐藏显示】表
    window.cubeIndex = 0;  // 计数器
}