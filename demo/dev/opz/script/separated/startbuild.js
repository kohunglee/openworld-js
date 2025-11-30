/**
 * 开始建造的准备工作
 * --------
 * 获取浏览器参数、设定一些数据标准和容器
 */
// function startBuild(){
//     // Url 参数
//     var cellpageid, cubeDatas;
//     var urlParams = new URLSearchParams(globalThis.location.search);  // 获取 URL
//     k.cellpageid_geturl = urlParams.get('id');  // 获取 url 的 id 参数
//     k.isLogicAdd = urlParams.get('logicadd');  // 获取 url 的 id 参数
//     k.isDEV = urlParams.get('dev');  // 获取 url 的 vk 参数

//     // 开发者模式
//     if(k.isDEV === '1'){
//        document.body.insertAdjacentHTML('beforeend', '<div style="position:fixed;top:20px;left:50%;transform:translateX(-50%);font:bold 48px sans-serif;color:rgba(0,0,0,0.7);pointer-events:none;z-index:9999;">DEV</div>'); 
//     }
// }