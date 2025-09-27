// 回原点
// k.mainVPlayer.body.position.x = 7.6;
// k.mainVPlayer.body.position.y = 500;
// k.mainVPlayer.body.position.z = 16.5;

// 初始化 openworld 世界
import openworldApp from '../../src/openworld.js';
window.k = openworldApp;
k.initWorld('openworldCanv');

// 导入插件模块
import xmap from '../../src/plugins/xmap.js';
import cookieSavePos from '../../src/plugins/cookieSavePos.js';
import svgTextureLib from '../../src/plugins/svgTextureLib.js';
import xdashpanel from '../../src/plugins/xdashpanel.js';
import commModel from '../../src/plugins/webgl/commModel.js';
import centerDot from '../../src/plugins/centerDot_clean.js';
import sound from '../../src/plugins/sound.js';
import build from '../../src/plugins/centerDot/build.js';
import testSampleAni from '../../src/plugins/testSampleAni.js';
xmap(k);            // 小地图
cookieSavePos(k);   // 保存当前位置
svgTextureLib(k);   // 纹理预设库
xdashpanel(k);      // 仪表盘
commModel(k);       // 基础模型库
centerDot(k);       // 开启中心点取物
sound(k);           // 声音插件
build(k);           // 构建方块器
testSampleAni(k);   // 简单的人物动画实现

// 入口
// 加载预设纹理，开始程序
k.loadTexture(k.svgTextureLib).then(loadedImage => {
    // 主题变量
    const greenStone = k.textureMap.get('greenStone');
    const greenStoneborder = k.textureMap.get('greenStoneborder');
    const frosted = k.textureMap.get('frosted');
    const jpflag = k.textureMap.get('jpflag');
    const checkerboard = k.textureMap.get('checkerboard');

    k.addBox({  // 创建地面
        DPZ : 1,
        colliGroup: 1,
        tiling : 100,
        name: 'groundPlane', X: 0, Y: -0.5, Z: 0,
        mass: 0, width: 300, depth: 300, height: 2,
        texture: greenStoneborder, background: '#287A17', mixValue: 0.5,
    });

    var lastPos = k?.lastPos || {x:21, y:5.00, z:15, rX:0, rY:0, rZ:0};
    k.keys.turnRight = lastPos.rY;
    k.mainVPlayer = k.addBox({  // 创建一个立方体，并设置为主角
        name: 'mainPlayer',
        DPZ : 1,
        colliGroup: 1,
        isShadow: 'ok',
        X:lastPos.x, Y:lastPos.y + 1, Z:lastPos.z,
        mixValue:0.7,
        width: 1, depth: 1, height: 1,
        mass: 50,
        background : '#333',
        texture: greenStone,
    });

    /* ---------------------------------------------[ 新主角 ]------------------------- */
    k.W.cube({  // 隐藏显示原主角
        n:'mainPlayer',
        // b : '#f0f8ff42',
        hidden: true,
    });

    k.W.sphere({  // 主角的头
        g:'mainPlayer',
        n:'mvp_head',
        y: 0.82,
        x: 0,
        z: 0,
        s: 1,
        size: 0.5,
    });

    k.W.cube({  // 主角的脖子
        g:'mainPlayer',
        n:'mvp_neck',
        y: 0.6,
        x: 0,
        z: 0,
        w:0.1,  h:0.1,  d:0.1,
    });

    k.W.cube({  // 主角的身体
        g:'mainPlayer',
        n:'mvp_body',
        y: 0.3,
        x: 0,
        z: 0,
        // b:'#0088ff8f',
        w:0.6,  h:0.5,  d:0.1,
    });

/************* 研究动画实验区 */

    // 关节
    k.W.cube({  // 关节：主角的右胳膊
        g:'mainPlayer',
        n:'joint_test',
        y: 0.47,
        x: 0.30,
        z: 0,
        rz:15,
        ry:0,
        w:0.1,  h:0.1,  d:0.1,
        // hidden: true,
    });


    k.W.cube({  // 主角的右胳膊
        g:'joint_test',
        n:'aaa',
        y: -2,
        x: 0,
        z: 0,
        rz:0,
        // b:'#0088ff8f',
        w:1,  h:5,  d:1,
    });

    // 关节
    k.W.cube({  // 关节：主角的右胳膊
        g:'mainPlayer',
        n:'joint_test_left',
        y: 0.47,
        x: -0.30,
        z: 0,
        rz:-15,
        ry:0,
        w:0.1,  h:0.1,  d:0.1,
        // hidden: true,
    });


    k.W.cube({  // 主角的右胳膊
        g:'joint_test_left',
        n:'bbb',
        y: -2,
        x: 0,
        z: 0,
        rz:0,
        // b:'#0088ff8f',
        w:1,  h:5,  d:1,
    });

    /* ------------   测试腿了！  -------------- */
    // 关节
    k.W.cube({  // 关节：主角的右腿
        g:'mainPlayer',
        n:'joint_test_right_leg',
        y: 0.1,
        x: 0.15,
        z: 0,
        
        w:0.1,  h:0.1,  d:0.1,
        // hidden: true,
    });

    k.W.cube({  // 主角的右腿
        g:'joint_test_right_leg',
        n:'rightleg',
        y: -3,
        x: 0,
        z: 0,
        rz:0,
        w:1,  h:6,  d:1,
    });

    // 关节
    k.W.cube({  // 关节：主角的左腿
        g:'mainPlayer',
        n:'joint_test_left_leg',
        y: 0.1,
        x: -0.15,
        z: 0,
        
        w:0.1,  h:0.1,  d:0.1,
    });

    k.W.cube({  // 主角的右腿
        g:'joint_test_left_leg',
        n:'leftleg',
        y: -3,
        x: 0,
        z: 0,
        rz:0,
        w:1,  h:6,  d:1,
    });

/**************** 结束 */

    console.time('load');

    // Url 参数
    var cellpageid, cubeDatas;
    var urlParams = new URLSearchParams(window.location.search);  // 获取 URL
    k.cellpageid_geturl = urlParams.get('id');  // 获取 url 的 id 参数
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
        // cubeDatas = [];
        cubeDatas = testcubedata;  // 使用我的本地测试数据
    } else {
        cubeDatas = JSON.parse(localStorage.getItem('ow_' + cellpageid));
    }
    
    const totalCube = 10000;  // 计划的总方块数
    const cubeInstances = [];  // 立方体对象【实例】的容器
    const isHiddenVis = [];  // 【隐藏显示】表
    var cubeIndex = 0;  // 计数器
    for (let index = 0; index < cubeDatas.length; index++) {  // 数据，填充我的容器
        addInsLD(cubeDatas[index]);
    }
    // console.log(totalCube - k.visCubeLen);  // 空模型总数
    for (let index = 0; index < totalCube - k.visCubeLen; index++) {  // 空模型
        addInsLD({
            x: 999999999, y: 999999999, z: 999999999,
            w: 0.001, d: 0.001, h: 0.001,
        }, true);
    }
    for (let index = 0; index < cubeInstances.length; index++) {  // 为「实例」加上简单的物理引擎
        k.addTABox({
            DPZ : 2,
            isPhysical: true,
            mass: 0,
            background: '#f6a1a1ff',
            mixValue: 0.5,
            // colliGroup: 2,
            isShadow: false,
            // isVisualMode: false,
            X: cubeInstances[index].x,
            Y: cubeInstances[index].y,
            Z: cubeInstances[index].z,
            width: cubeInstances[index].w,
            depth: cubeInstances[index].d,
            height: cubeInstances[index].h,
            rX: cubeInstances[index].rx,
            rY: cubeInstances[index].ry,
            rZ: cubeInstances[index].rz,
            isInvisible: true,  // 只被探测，而不可见
            // isFictBody: true,
        });
    }
    k.W.cube({  // 渲染实例化
        n: 'manyCubes',
        // t: checkerboard,  // 棋格
        t: dls,  // 大理石
        instances: cubeInstances, // 实例属性的数组
        mix: 0.5,
    });
    function addInsLD (data, isHidden = false) {  // 添加方块的函数
        if(data.del) {  // 【删除】标记，按照【空模型】处理
            data = {
                x: 999999999, y: 999999999, z: 999999999,
                w: 0.001, d: 0.001, h: 0.001,
            };
        }
        const result = {  // 添加一个立方体
            x: data.x, y: data?.y||1, z: data.z,
            w: data?.w || 1, d: data?.d || 1, h: data?.h || 1, b: data.b,
            rx: data?.rx||0, ry:data?.ry||0, rz:data?.rz||0,
        };
        cubeInstances.push(result);
        if(isHidden !== true){
            k.visCubeLen = cubeIndex;  // 记录，有多少显示的，不过用处不大
        }
        isHiddenVis[cubeIndex] = isHidden;
        cubeIndex++;
    }
    console.timeEnd('load');

});



// k.offAudio = true;
