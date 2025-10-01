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
        tiling : 200,
        name: 'groundPlane', X: 0, Y: -0.5, Z: 0,
        mass: 0, width: 2000, depth: 2000, height: 2,
        texture: greenStoneborder, background: '#287A17', mixValue: 0.5,
    });

    var lastPos = k?.lastPos || {x:21, y:5.00, z:15, rX:0, rY:0, rZ:0};
    k.keys.turnRight = lastPos.rY;
    const mainVPSize = 0.5;  // 主角的大小，方便建造
    k.mainVPlayer = k.addBox({  // 创建一个立方体，并设置为主角
        name: 'mainPlayer',
        DPZ : 1,
        colliGroup: 1,
        isShadow: 'ok',
        X:lastPos.x, Y:lastPos.y + 1, Z:lastPos.z,
        mixValue:0.7,
        // width: mainVPSize, depth: mainVPSize, height: mainVPSize * 1.12,  // 脚会悬空，等待其他解决方式吧
        size: mainVPSize,
        mass: 50,
        background : '#333',
        texture: greenStone,
    });
    // k.centerDot.setCamView(2);  // 设置视角 类型2
    /* */
    // k.WALK_SPEED = 1/90;  //+ 慢速度
    // k.SPRINT_MIN_SPEED = 1;
    // k.SPRINT_MAX_SPEED = 1.5;
    // k.jumpYVel = 0.8;
    // k.world.gravity.set(0, -9.82/4, 0);  // 临时
    // k.JUMP_HOLD_LIMIT = 0.5;
    

    /* ---------------------------------------------[ 新主角 ]------------------------- */
    k.W.cube({  // 隐藏显示原主角
        n:'mainPlayer',
        // b : '#f0f8ff42',
        hidden: true,
        size: mainVPSize,
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

    /***
     * ------【实验区】一楼搞好--------------------------------------
     */

    // k.notSymOff = true;  // 禁止 对称 排列

    const d_floor = 10;
    const d_ceil = 49;
    const d_table = [1, 9];
    const d_tinybookshelf = [11, 20];  // 小书架
    const d_bigbookshelf = [22, 35];  // 大书架
    const d_Pillar = [37, 40];  // 柱子
    const d_thinwall = 43;  // 隔断墙
    const d_windoWall = [40, 48];

    const d_bigPillar = 37;  // 大柱子
    // const test = 12;
    // const space_x = 5.143;  // 里屋宽

    const sym_axis_x = 45;

    const items = [  // 对称队列
        d_tinybookshelf,
        d_bigbookshelf,
    ];

    const items_0 = [  // 偏移队列
        [54, 63],  // 对称后的 小柜子
        [64, 77],  // 对称后的 大柜子
        d_tinybookshelf,
        d_bigbookshelf,
        d_thinwall,
        d_Pillar,
        d_ceil,  // 屋顶
        d_floor,  // 地板
        d_table,
        d_windoWall,
    ];

    

    const symopera = (items) => {  // 对称操作
        if(k.notSymOff) return 0;
        var orig_data = cubeDatas[items];
        var agent = {...orig_data};
        agent.x -= (orig_data.x - sym_axis_x) * 2;
        cubeDatas.push(agent);
    }

    const offsetopera = (items, times) => {  // 偏移操作
        if(k.notSymOff) return 0;
        var orig_data = cubeDatas[items];
        var agent = {...orig_data};
        agent.x -= 5.145 * times;
        addInsLD(agent);
    }

    // console.log('开始对称');

    // 对称数组内的物体
    const symo = (items) => {  
        for (const it of items) {
            if (Array.isArray(it)) {
                for (let n = it[0]; n <= it[1]; n++) {
                    symopera(n);
                }
            } else {
                symopera(it);
            }
        }
    }

    // 偏移数组内的物体
    const offset = (items, n) => {
        for (let index = 0; index < n; index++) {  // 偏移
            for (const it of items) {
                if (Array.isArray(it)) {
                    for (let n = it[0]; n <= it[1]; n++) {
                        // console.log(n);
                        offsetopera(n, index);
                    }
                    // console.log('---');
                } else {
                    offsetopera(it, index);
                    // console.log('------');
                }
            }
        }
    }

    symo(items);  // 第一次对称，对称大小书柜
    offset(items_0, 5);  // 第二次，将样板重复到共 6 次

    
    // for (let index = 0; index < 5; index++) {  // 偏移
    //     for (const it of items_0) {
    //         if (Array.isArray(it)) {
    //             for (let n = it[0]; n <= it[1]; n++) {
    //                 // console.log(n);
    //                 offsetopera(n, index);
    //             }
    //             // console.log('---');
    //         } else {
    //             offsetopera(it, index);
    //             // console.log('------');
    //         }
    //     }
    // }

    








    console.log('共', k.visCubeLen, '个可见方块');
    
    /***
     * ----------【结束】----------------------------------
     */



    // console.log(totalCube - k.visCubeLen);  // 空模型总数
    for (let index = 0; index < totalCube - k.visCubeLen; index++) {  // 空模型
        addInsLD({
            x: 999999999, y: 999999999, z: 999999999,
            w: 0.001, d: 0.001, h: 0.001,
        }, true);
    }
    for (let index = 0; index < cubeInstances.length; index++) {  // 为「实例」加上简单的物理引擎
        k.addTABox({
            DPZ : 4,
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
        if(cubeInstances[index]?.b){  // 别忘了，还要把颜色加入到档案 insColor 里
            const args = k.indexToArgs.get(index);
            args.insColor = cubeInstances[index].b;
        }
    }
    k.W.cube({  // 渲染实例化
        n: 'manyCubes',
        // t: checkerboard,  // 棋格
        t: dls,  // 大理石
        instances: cubeInstances, // 实例属性的数组
        mix: 0.7,
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
            w: data?.w || 1, d: data?.d || 1, h: data?.h || 1,
            rx: data?.rx||0, ry:data?.ry||0, rz:data?.rz||0,
        };
        if(data?.b){
            result.b = data.b;
        }
        cubeInstances.push(result);
        if(isHidden !== true){
            k.visCubeLen = cubeIndex;  // 记录，有多少显示的，不过用处不大
        }
        isHiddenVis[cubeIndex] = isHidden;
        return cubeIndex++;
    }
    console.timeEnd('load');

});

k.star = (index) => {
    if(k.starInt){
        clearInterval(k.starInt);
        if(k.W.next['T'+ k.starID]?.hidden){
            k.W.next['T'+ k.starID].hidden = true;
        }
    }
    if(index){
        k.starInt = setInterval( (i = index) => {
            if(k.W?.next['T'+ i]){
                k.W.next['T'+ i].hidden = !k.W.next['T'+ i].hidden;
            }
        }, 100 );
        k.starID = index;
    }
}



// k.offAudio = true;
