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
import centerDot from '../../src/plugins/centerDot_move.js';
xmap(k);            // 小地图
cookieSavePos(k);   // 保存当前位置
svgTextureLib(k);   // 纹理预设库
xdashpanel(k);      // 仪表盘
commModel(k);       // 基础模型库
centerDot(k);       // 开启中心点取物

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
        mass: 0, width: 1000, depth: 1000, height: 2,
        texture: greenStoneborder, background: '#287A17', mixValue: 0.5,
    });

    var lastPos = k?.lastPos || {x:21, y:5.00, z:15, rX:0, rY:0, rZ:0};
    k.mainVPlayer = k.addBox({  // 创建一个立方体，并设置为主角
        name: 'mainPlayer',
        DPZ : 1,
        colliGroup: 1,
        isShadow: 'ok',
        X:lastPos.x, Y:lastPos.y + 1, Z:lastPos.z,
        rX: 45, rY: 45, rZ: 45, size:1, mixValue:0.7,
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
        w:0.6,  h:0.5,  d:0.1,
    });

    k.W.cube({  // 主角的左腿
        g:'mainPlayer',
        n:'mvp_leg_l',
        y: -0.15,
        x: -0.15,
        z: 0,
        w:0.1,  h:0.7,  d:0.1,
    });

    k.W.cube({  // 主角的右腿
        g:'mainPlayer',
        n:'mvp_leg_r',
        y: -0.15,
        x: 0.15,
        z: 0,
        w:0.1,  h:0.7,  d:0.1,
    });

    k.W.cube({  // 主角的左胳膊
        g:'mainPlayer',
        n:'mvp_arm_l',
        y: 0.25,
        x: -0.36,
        z: 0,
        rz: -15,
        w:0.1,  h:0.6,  d:0.1,
    });

    k.W.cube({  // 主角的右胳膊
        g:'mainPlayer',
        n:'mvp_arm_r',
        y: 0.25,
        x: 0.36,
        z: 0,
        rz:15,
        w:0.1,  h:0.6,  d:0.1,
    });


    const cubeInstances = [];  // 定义单个立方体对象的「实例」
    const isHiddenVis = [];  // 隐藏显示表
    var cubeIndex = 0;
    const addInsLD = (data, isHidden = false) => {  // 使用左下角定位来添加方块
        // cubeInstances.push({  // 添加一个立方体
        //     x: data.x + 0.5*data.w, y: data.y + 0.5*data.h, z: data.z - 0.5*data.d,
        //     w: data.w, d: data.d, h: data.h,
        //     rx: data?.rx||0, ry:data?.ry||0, rz:data?.rz||0,
        // });
        cubeInstances.push({  // 添加一个立方体
            x: data.x, y: data.y, z: data.z,
            w: data.w, d: data.d, h: data.h,
            rx: data?.rx||0, ry:data?.ry||0, rz:data?.rz||0,
        });
        if(isHidden !== true){
            k.visCubeLen = cubeIndex;
        }
        isHiddenVis[cubeIndex] = isHidden;
        cubeIndex++;
    }

    // addInsLD({  // 添加一个立方体
    //     x: 10, y: 0, z: -10,
    //     w: 10, d: 9, h: 10,
    // });

    // addInsLD({
    //     x: -30, y: 0, z: -40,
    //     w: 10, d: 10, h: 1,
    //     ry:45,
    // });

    // addInsLD({  // 地皮 40 * 100
    //     x: 30, y: 0.5, z: -40,
    //     w: 100, d: 40, h: 1,
    // });

    // /* ---------------------------------------------[ 招待大楼一楼墙壁 ]------------------------- */

    // addInsLD({  // 招待大楼南墙
    //     x: 30 + 5, y: 1.5 + 0, z: -40 - 5,
    //     w: 10, d: 0.4, h: 4,
    //     // x: 35, y: 1.5, z: -45,
    //     // w: 10, d: 0.4, h: 4,
    // });

    // addInsLD({  // 招待大楼北墙
    //     x: 30 + 5, y: 1.5 + 0, z: -40 - 5 - 20,
    //     w: 10, d: 0.4, h: 4,
    // });

    // addInsLD({  // 招待大楼东墙
    //     x: 30 + 5, y: 1.5 + 0, z: -40 - 5 - 0.4,
    //     w: 0.4, d: 20 - 0.4, h: 4,
    // });

    // addInsLD({  // 招待大楼西墙
    //     x: 30 + 5 + 10 - 0.4, y: 1.5 + 0, z: -40 - 5 - 0.4,
    //     w: 0.4, d: 20 - 0.4, h: 4,
    // });
    for (let index = 0; index < testcubedata.length; index++) {  // 使用下载好的数据
        addInsLD(testcubedata[index]);
    }

    for (let index = 0; index < 9000; index++) {  // 添加占位空模型
        addInsLD({  // 招待大楼西墙
            x: 999999999, y: -999999999, z: 999999999,
            w: 0.001, d: 0.001, h: 0.001,
        }, true);
    }

    // 为「实例」加上简单的物理引擎
    for (let index = 0; index < cubeInstances.length; index++) {
        k.addTABox({
            DPZ : 2,
            isPhysical: true,
            mass: 0,
            background: '#6c1d1dff',
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

    // 渲染实例化
    k.W.cube({
        n: 'manyCubes',
        t: checkerboard,
        instances: cubeInstances, // 实例属性的数组
        mix: 0.9,
    });

});
