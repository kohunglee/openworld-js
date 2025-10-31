/**
 * 开始建造的准备工作
 * --------
 * 获取浏览器参数、设定一些数据标准和容器
 */
function startBuild(){
    // Url 参数
    var cellpageid, cubeDatas;
    var urlParams = new URLSearchParams(globalThis.location.search);  // 获取 URL
    k.cellpageid_geturl = urlParams.get('id');  // 获取 url 的 id 参数
    k.isLogicAdd = urlParams.get('logicadd');  // 获取 url 的 id 参数
    k.isDEV = urlParams.get('dev');  // 获取 url 的 vk 参数

    // if(k.cellpageid_geturl) {
    //     cellpageid = k.cellpageid_geturl;
    // } else {
    //     cellpageid = Math.random().toString(36).slice(2,7);  // 随机5字符作为ID
    // }
    // const url = new URL(globalThis.location.href);
    // url.searchParams.set('id',cellpageid);
    // history.pushState({}, '', url.toString());  // 将这个新的随机字符放置到地址栏

    // // 浏览器储存
    // if (!localStorage.getItem('ow_' + cellpageid)) {  // 初始化存储
    //     localStorage.setItem('ow_' + cellpageid, JSON.stringify([]));
    //     globalThis.cubeDatas = testcubedata;  // 使用我的本地测试数据
    // } else {
    //     globalThis.cubeDatas = JSON.parse(localStorage.getItem('ow_' + cellpageid));
    // }

    globalThis.cubeDatas = testcubedata;  // 使用我的本地测试数据
    // console.log(localStorage.getItem('ow_' + cellpageid));
    
    globalThis.totalCube = 1_0000;  // 计划的总方块数
    globalThis.cubeInstances = [];  // 立方体对象【实例】的容器
    globalThis.isHiddenVis = [];  // 【隐藏显示】表
    globalThis.cubeIndex = 0;  // 计数器
}