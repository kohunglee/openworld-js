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

    // 开发者模式
    if(k.isDEV === '1'){
       document.body.insertAdjacentHTML('beforeend', '<div style="position:fixed;top:20px;left:50%;transform:translateX(-50%);font:bold 48px sans-serif;color:rgba(0,0,0,0.7);pointer-events:none;z-index:9999;">DEV</div>'); 
    }

    globalThis.cubeDatas = testcubedata;  // 使用我的本地测试数据
    // console.log(localStorage.getItem('ow_' + cellpageid));
    
    globalThis.totalCube = 1_0000;  // 计划的总方块数
    globalThis.cubeInstances = [];  // 立方体对象【实例】的容器
    globalThis.isHiddenVis = [];  // 【隐藏显示】表
    globalThis.cubeIndex = 0;  // 计数器
}