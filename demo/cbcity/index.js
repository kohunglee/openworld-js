import openworldApp from '../../src/openworld.js';

window.k = openworldApp;  // 初始化沙盒
k.initWorld('c');


// ========================= 插件加载 =========================
import calCity from '../../src/plugins/calCity.js';
import xmap from '../../src/plugins/xmap.js';
import xdashpanel from '../../src/plugins/xdashpanel.js';
import cookieSavePos from '../../src/plugins/cookieSavePos.js';
import centerDot from '../../src/plugins/centerDot.js';
calCity(k);  // 计算城市
xmap(k);  // 小地图
xdashpanel(k);  // 简易仪表盘
cookieSavePos(k);  // cookie 保存/还原 位置
centerDot(k);       // 开启中心点取物



// ========================= 城市名显示 =========================
setInterval(() => {
    var currCityName = document.getElementById('currCityName');
    if(currCityName){
        currCityName.innerHTML = k.calCityName(); // 获取当前城市名称
    }
}, 1000)



// ========================= 生成城寨实例化数据 & 模型 =========================
const cubeInstances = [];
var cubeTimes = 1;
var numCubes = 100 * cubeTimes;
const spacing = 2.5;
const areaSpace = 10**1;
const random = k.genPR(17, numCubes * numCubes * 5);  // 伪随机数
for (let i = 0; i < numCubes; i++) {
    for (let j = 0; j < numCubes; j++) {
        var index = i * numCubes + j;
        cubeInstances.push({
            x: Math.floor(random[index] * 99 * areaSpace + 1 - 50 * areaSpace) * cubeTimes,
            y: Math.floor(random[index + 1] * 50),
            z: Math.floor(random[index + 2] * 99 * areaSpace + 1 - 50 * areaSpace) * cubeTimes,
            w: 20,
            d: 30,
            h: Math.floor(random[index + 3] * 19 + 1),
            b:`#${Math.floor(random[index + 4] * 16777216).toString(16).padStart(6, '0')}`,
        });
    }
}
for (let index = 0; index < 1; index++) {  // 实例化物体可视化
  k.W.cube({
    n: 'manyCubes' + index,
    instances: cubeInstances, // 实例属性的数组
    t: marble,
    mix: 0.5,
    y:50 * index * 10,
  });
}
for (let i = 0; i < numCubes; i++) {  // 为实例化加上简单的物理引擎
    for (let j = 0; j < numCubes; j++) {
        var index = i * numCubes + j;
        k.addTABox({
            DPZ : 3,
            isPhysical: true,
            colliGroup: 2,
            X: Math.floor(random[index] * 99 * areaSpace + 1 - 50 * areaSpace) * cubeTimes,
            Y: Math.floor(random[index + 1] * 50),
            Z: Math.floor(random[index + 2] * 99 * areaSpace + 1 - 50 * areaSpace) * cubeTimes,
            mass: 0,
            width: 20,
            depth: 30,
            height: Math.floor(random[index + 3] * 19 + 1),
            background: `#${Math.floor(random[index + 4] * 16777216).toString(16).padStart(6, '0')}`,
            mixValue: 1,
            isShadow: false,
            isVisualMode: false,
            isFictBody: true,
            texture: marble,
        });
    }
}



// ========================= 生成撰写笔记的平面 =========================
k.currTextData = new Map();  // 建立一个 文本数据 与 平面 相互对应的映射
function makeTestObj(indexObj = 8074){  // 生成 文本平面 的坐标数据
    const indexOfArr = indexObj * 8;
    const objWidth  = k.physicsProps[indexOfArr + 1];  // 这样排列写，性能好一点
    const objHeight = k.physicsProps[indexOfArr + 2];
    const objDepth  = k.physicsProps[indexOfArr + 3];
    const objPosX = k.positionsStatus[indexOfArr];
    const objPosY = k.positionsStatus[indexOfArr + 1];
    const objPosZ = k.positionsStatus[indexOfArr + 2];
    const nudge = 0.1;  // 空隙
    const faceConfigs = [  // { 名字, 位置偏移, 旋转角度, 尺寸 }
        { name: '_forward', X: objPosX, Y: objPosY, Z: objPosZ + objDepth / 2 + nudge, rX: 0,   rY: 0,   width: objWidth, height: objHeight },
        { name: '_backward', X: objPosX, Y: objPosY, Z: objPosZ - objDepth / 2 - nudge, rX: 0,   rY: 180, width: objWidth, height: objHeight },
        { name: '_top', X: objPosX, Y: objPosY + objHeight / 2 + nudge, Z: objPosZ, rX: -90,  rY: 0,   width: objWidth, height: objDepth},
        { name: '_down', X: objPosX, Y: objPosY - objHeight / 2 - nudge, Z: objPosZ, rX: 90,   rY: 0,   width: objWidth, height: objDepth },
        { name: '_right', X: objPosX + objWidth / 2 + nudge, Y: objPosY, Z: objPosZ, rX: 0,   rY: 90,  width: objDepth, height: objHeight },
        { name: '_left', X: objPosX - objWidth / 2 - nudge, Y: objPosY, Z: objPosZ, rX: 0,   rY: -90,   width: objDepth, height: objHeight },
    ];
    faceConfigs.forEach(face => {  // 写入 addTABox 档案
            k.addTABox({
                DPZ : 3,
                shape: 'plane',
                isPhysical: false,
                // isVisualMode: false,
                X: face.X, Y: face.Y, Z: face.Z, rX: face.rX, rY: face.rY, rZ: 0,
                mass: 0, width: face.width, depth: 0, height: face.height,
                texture: null, 
                background:'#00000000', mixValue: 0,  // 设置成透明，防止闪烁
                TGtoolText: true,  // 贴逛使用的参数，如果为 true，则表示可以编辑纹理（文字）
                isInvisible: true,  // 为节省内存，在文字等纹理处理前，不显示
        });
    })
    
}



// ========================= 生成 文字板 物体 =========================
let currentIndex_obj = 0;
const totalTasks = numCubes * numCubes;
function addPlaneObj2Memory(deadline) {  // 添加物体
    while (deadline.timeRemaining() > 0 && currentIndex_obj < totalTasks) {
        makeTestObj(currentIndex_obj);  // 执行任务
        currentIndex_obj++;
    }
    if (currentIndex_obj < totalTasks) {
        requestIdleCallback(addPlaneObj2Memory);
    } else {
        // console.log("所有 add obj 步已优雅地完成！");
    }
}
if(window.requestIdleCallback === undefined){  // safari bug
    for (let i = 0; i < totalTasks; i++) {
        makeTestObj(i);
    }
} else {
    requestIdleCallback(addPlaneObj2Memory);
}



// ========================= 杂项，生成一些必要的模型 =========================
// 从 COOKIE 里取出上一次的位置
var lastPos = k?.lastPos;
if(!lastPos){
    lastPos = {x:33, y:5.00, z:498};
}
k.mainVPlayer = k.addBox({  // 创建一个立方体，并设置为主角
        name: 'mainPlayer', DPZ : 1,
        colliGroup: 1,
        isShadow: 'ok',
        X:lastPos.x, Y:lastPos.y + 1, Z:lastPos.z,
        rX: 0, rY: 0, rZ: 0, size:1, mixValue:0.7,
        mass: 50,
        background : '#333',
        texture: marble
    });

/* 主角模型 */
const mStr = 'mainPlayer';
k.W.cube({  // 隐藏显示原主角
    n:mStr,
    b : '#f0f8ff42',
    hidden: true,
});
k.W.sphere({g:mStr,n:"mvp_head",y:.82,x:0,z:0,s:1,size:.5,b:"#FFD700"}),
k.W.cube({g:mStr,n:"mvp_neck",y:.6,x:0,z:0,w:.1,h:.1,d:.1,b:"#C0C0C0"}),
k.W.cube({g:mStr,n:"mvp_body",y:.3,x:0,z:0,w:.6,h:.5,d:.1,b:"#4A90E2"}),
k.W.cube({g:mStr,n:"mvp_leg_l",y:-.15,x:-.15,z:0,w:.1,h:.7,d:.05,b:"#333333"}),
k.W.cube({g:mStr,n:"mvp_leg_r",y:-.15,x:.15,z:0,w:.1,h:.7,d:.05,b:"#333333"}),
k.W.cube({g:mStr,n:"mvp_arm_l",y:.25,x:-.36,z:0,rz:-15,w:.1,h:.6,d:.05,b:"#FFFFFF"}),
k.W.cube({g:mStr,n:"mvp_arm_r",y:.25,x:.36,z:0,rz:15,w:.1,h:.6,d:.05,b:"#FFFFFF"});

k.addTABox({  // 创建一个 小方块
    DPZ : 3,
    colliGroup: 1,
    name: 'longThin', X: 113, Y: 10, Z: 483,
    mass: 1, width: 3, depth: 2, height: 2, texture: 'marble'
});

k.addTABox({  // 创建一个 旋转测试 细长物理体
    DPZ : 1,
    colliGroup: 2,
    name: 'longThin02', X: 20, Y: 10, Z: 546,
    mass: 10, width: 40, depth: 2, height: 2, background: '#333',
    texture: 'gourou',
});
var groundPlanesize = 10000;
k.addBox({  // 创建地面
    DPZ : 1,
    colliGroup: 1,
    tiling : 100,
    // isShadow: 1,
    name: 'groundPlane', X: 0, Y: -0.5, Z: 0,
    mass: 0, width: groundPlanesize, depth: groundPlanesize, height: 2,
    texture: marble, background: '#287A17', mixValue: 0.5,
});
document.addEventListener('keydown', (e)=>{
    if(e.key.toUpperCase() === 'I'){
        k.mainVPlayer.body.position.y = 150;
    }
});
