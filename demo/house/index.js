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
    k.centerDot.setCamView(2);  // 设置视角 类型2
    /* */
    k.WALK_SPEED = 1/20;  //+ 慢速度
    k.SPRINT_MIN_SPEED = 5;
    k.SPRINT_MAX_SPEED = 15.5;

    const orig_jumpYVel = k.jumpYVel;
    const orig_jumpHoldLimit = k.JUMP_HOLD_LIMIT;
    const mvp = k.mainVPlayer;

    setInterval(  // 动态调整人物的跳跃、地心引力
        () => {
            const x = mvp.X;
            const z = mvp.Z;
            if(x < 52.3 && x > 17.1 && z < -15.7 && z > -44.5) {
                if(x < 50.5  && x > 19.1 &&
                   z < -22.9 && z > -37.1){  // 在大厅
                    k.jumpYVel = orig_jumpYVel;
                    k.JUMP_HOLD_LIMIT = orig_jumpHoldLimit;
                    k.world.gravity.set(0, -9.82, 0);
                } else {  // 在图书区
                    k.jumpYVel = 0.8;
                    k.JUMP_HOLD_LIMIT = 0.5;
                    k.world.gravity.set(0, -9.82/4, 0);
                }
            }
        }
    , 100);

    // k.world.gravity.set(0, -9.82/4, 0);  // 临时
    


    

    

    console.time('load');

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
        cubeDatas = testcubedata;  // 使用我的本地测试数据
    } else {
        cubeDatas = JSON.parse(localStorage.getItem('ow_' + cellpageid));
    }

    
    // console.log(localStorage.getItem('ow_' + cellpageid));


    // console.log(localStorage.getItem('ow_' + cellpageid));
    
    const totalCube = 10000;  // 计划的总方块数
    const cubeInstances = [];  // 立方体对象【实例】的容器
    const isHiddenVis = [];  // 【隐藏显示】表
    var cubeIndex = 0;  // 计数器


    /***
     * ------【实验区】一楼搞好--------------------------------------
     */

    const symopera = (items, axes={}) => {  // 对称操作
        if(k.notSymOff) return 0;
        var orig_data = cubeDatas[items];
        var agent = {...orig_data};
        for (const axis of ["x", "y", "z"]) {
            if (axes[axis] !== undefined) {
                agent[axis] -= (orig_data[axis] - axes[axis]) * 2;
            }
        }
        return cubeDatas.push(agent);
    }

    const offsetopera = (items, distancs, times = 0, axes = 'x') => {  // 偏移操作
        if(k.notSymOff) return 0;
        var orig_data = cubeDatas[items];
        var agent = {...orig_data};
        for (const axis of ["x", "y", "z"]) {
            if (axes === axis) {
                agent[axis] -= distancs * times;
            }
        }
        return cubeDatas.push(agent);
    }
    
    const symo = (items, axes = {}) => {  // 对称数组内的物体
        const addInfo = [];
        for (const it of items) {
            if(it === -1) continue;
            if (Array.isArray(it)) {
                for (let n = it[0]; n <= it[1]; n++) {
                    addInfo.push(symopera(n, axes) - 1); 
                }
            } else {
                addInfo.push(symopera(it, axes) - 1);
            }
        }
        return addInfo;
    }
    
    const offset = (items, distance, times, axes) => {  // 偏移数组内的物体
        const addInfo = [];
        for (let index = 1; index < times; index++) {  // 偏移
            for (const it of items) {
                if(it === -1) continue;
                if (Array.isArray(it)) {
                    for (let n = it[0]; n <= it[1]; n++) {
                        addInfo.push(offsetopera(n, distance, index, axes) - 1);
                    }
                } else {
                    addInfo.push(offsetopera(it, distance, index, axes) - 1);
                }
            }
        }
        return addInfo;
    }


    // --------- 开始逻辑操作

    if(k.isLogicAdd === '1'){

        myHUDObjEditor.style.backgroundColor = 'blue';

        var D = {  // 初始化这个临时变量
            floor1: {},
            floor2: { shelf: { L: {}, C: {}, T: {}, CD: {}, }, }
        }

        // 第一层
        if(true) {
            // 里屋，对称大小书柜
            D.floor1.bookshelf2 = symo([
                [11, 20],  // 小书架
                ...[[22, 35], 60, 61],  // 大书架
            ], {x:45});

            // 整理样板间的内容
            D.floor1.showFlat = [  
                ...D.floor1.bookshelf2,  // 对称后的 大小书架
                [11, 20],  // 小书架
                ...[[22, 35], 60, 61],  // 大书架
                49,  // 屋顶
                10,  // 地板
                [1, 9],  // 桌子
                [41, 48],  // 窗墙
                43, // 隔断墙
                [37, 40]  // 柱子,  // 柱子
            ]

            // 将样板重复到共 6 次偏移
            D.floor1.offset6room = offset([
                ...D.floor1.showFlat,
            ], 5.145, 6);
            
            // 大厅地板重复 6 次
            D.floor1.offsetCenterFloor = offset([
                54,  // 大厅中央地板
            ], 5.145, 6);

            // 将左侧的6房间搞到右侧内容， 按 Z=-30 对称
            D.floor1.leftall = symo([  
                ...D.floor1.offset6room,   // 6 个屋子
                ...D.floor1.showFlat, // 样板间
                55,  // 一号屋后小地板
                [37, 40],  // 柱子
                57,  // 东北墙
                ...[-1,59,62],  // 屋后的2个小墙
            ], {z:-30});
        }

        // 第二层
        if(true){
            // 二楼一些无需分类的杂物
            D.floor2.xthing = [
                -1, 76, 77, 65, 66, 67,
                73, 68, 74, 73, 70, 71, 72,
            ];

            // 三叠型外墙，阵列 6 个
            D.floor2.wall6 = offset([
                [78, 80],  // 三叠型外墙
            ], 5.143, 6, 'x')

            // 栅栏 5 个
            D.floor2.mfence5 = offset([  // 5个栅栏
                69,  // 栅栏
            ], 5.143, 5, 'x');

            // 将 1 楼的西南外墙 Y 轴阵列
            D.floor2.wallSW = offset([
                57,  // 西南外墙（一楼）
            ], -2.7, 2, 'y');

            // 将 1 楼的西中外墙 Y 轴阵列
            D.floor2.wallW = offset([  // 西中墙
                58,  // 西中外墙（一楼）
            ], -2.7, 2, 'y');

            // 二楼的柜子三部曲初始化
            if(true){
                // 侧短柜 三部曲（外加一次对称）
                D.floor2.shelf.CD.offS = offset([  
                    97, // 侧短柜 竖
                ], -0.6, 2, 'x');
                D.floor2.shelf.CD.offS2 = offset([  
                    97, // 侧短柜 竖
                ], -1.79, 2, 'x');
                D.floor2.shelf.CD.offH = offset([
                    99, // 侧短柜 横
                ], 0.352, 8, 'y');
                D.floor2.shelf.CD = [
                    ...D.floor2.shelf.CD.offS2,
                    ...D.floor2.shelf.CD.offS,
                    ...D.floor2.shelf.CD.offH,
                    99, 97, 98, 
                ];
                D.floor2.shelf.CDsymo = symo(
                    D.floor2.shelf.CD, {x:50.143}
                );

                // 廊柜 三部曲
                D.floor2.shelf.L.offS = offset([
                    82, // 廊柜 竖
                ], 1.25, 4, 'z');
                D.floor2.shelf.L.offH = offset([
                    83, // 廊柜 横
                ], 0.345, 7, 'y');
                D.floor2.shelf.L = [
                    82, 83, 85,
                    ...D.floor2.shelf.L.offS,
                    ...D.floor2.shelf.L.offH,
                ];

                // 长柜 三部曲
                D.floor2.shelf.C.offS = offset([
                    90, // 长柜 竖
                ], -1.1, 7, 'z');
                D.floor2.shelf.C.offH = offset([
                    91, // 长柜 横
                ], 0.352, 8, 'y');
                D.floor2.shelf.C = [
                    90, 91, 89,
                    ...D.floor2.shelf.C.offS,
                    ...D.floor2.shelf.C.offH,
                ];

                // 统柜 三部曲
                D.floor2.shelf.T.offS = offset([
                    86, // 统柜 竖
                ], -1.316, 6, 'z');
                D.floor2.shelf.T.offH = offset([
                    87, // 统柜 横
                ], 0.352, 8, 'y');
                D.floor2.shelf.T = [
                    86, 87, 88,
                    ...D.floor2.shelf.T.offS,
                    ...D.floor2.shelf.T.offH,
                ];
            }

            // 二楼柜子的对称镜像操作
            if(true){
                // 对称统柜
                D.floor2.shelf.Tsymo = symo([
                    ...D.floor2.shelf.T,
                ], {x:47.567});

                // 阵列统柜（和隔断门） 11 个
                D.floor2.shelf.T11 = offset([
                    84,  // 隔断门
                    ...D.floor2.shelf.T,
                    ...D.floor2.shelf.Tsymo,
                ], 2.57, 11, 'x');

                // 将长柜、廊柜、对称
                D.floor2.shelf.symo = symo([
                    ...D.floor2.shelf.C,
                    ...D.floor2.shelf.L,
                    ...D.floor2.shelf.CD,
                    ...D.floor2.shelf.CDsymo,
                ], {z: -30});

                // 走廊的书柜偏移一下
                D.floor2.shelf.Loff = offset(
                    D.floor2.shelf.L, 3.907, 2, 'z'
                );

                // 将最东侧的书柜，偏移到最西侧
                D.floor2.shelf.symo2West = symo(
                    [
                        ...D.floor2.shelf.C,
                        ...D.floor2.shelf.L,
                        ...D.floor2.shelf.CD,
                        ...D.floor2.shelf.CDsymo,
                        ...D.floor2.shelf.symo,
                        ...D.floor2.shelf.Loff,
                    ], {x: 34.7}
                );
            }

            // 对称 2 楼南侧的内容
            D.floor2.symoSouth = symo([
                ...D.floor2.xthing,
                95, 93, 94, 69, // 栅栏地板
                ...D.floor2.shelf.T11,
                ...D.floor2.wall6,
                ...D.floor2.mfence5,
                ...D.floor2.shelf.T,
                ...D.floor2.shelf.Tsymo,
                [78, 80],  // 三叠型外墙
                ...D.floor2.wallSW,
            ], {z:-30});
        }

        // 研究第三层
        if(true){
            D.floor3 = {};  // 初始化第三层容器

            // 地板，（由屋顶 Y 轴提上来）
            D.floor3.floor = offset([
                49,  // 屋顶（一楼）
            ], -2.7, 6, 'y');

            // 对称地板
            D.floor3.floorSymo = symo(
                D.floor3.floor, {z: -30},
            );

            // 地板，阵列 6 个
            D.floor3.floor6 = offset([
                ...D.floor3.floor,
                ...D.floor3.floorSymo,
            ], 5.143, 6, 'x')

            // 搜集第二层可直接偏移的内容
            D.floor3.xthing = [
                ...D.floor2.xthing,  // 杂乱
                92, 95, 96, 93, 94, 64, 81, 75, // 栅栏地板
                [78, 80], ...D.floor2.wall6,  // 6外墙
                ...D.floor2.shelf.T11,
                69, ...D.floor2.mfence5,  // 栅栏
                ...D.floor2.wallSW,  // 西南墙
                ...D.floor2.wallW,  // 西中墙
                ...D.floor2.shelf.T,  // 统柜
                ...D.floor2.shelf.Tsymo,  // 统柜（对称版）
                ...D.floor2.symoSouth,  // 南侧对称
                ...D.floor2.shelf.symo,  // 对称后的长柜、廊柜
                ...D.floor2.shelf.C,  //+5 未对称的柜子
                ...D.floor2.shelf.L,
                ...D.floor2.shelf.CD,
                ...D.floor2.shelf.Loff,
                ...D.floor2.shelf.CDsymo,
                ...D.floor2.shelf.symo2West,  // 对称到最西侧的柜子
            ];

            // 第一次阵列
            D.floor3.firstOff = offset(
                D.floor3.xthing,-2.7, 5, 'y'
            );

        }


        D = null;  // 释放内存

    }

    // ---------

    for (let index = 0; index < cubeDatas.length; index++) {  // 数据，填充我的容器
        addInsLD(cubeDatas[index]);
    }
    console.log('共', k.visCubeLen, '个可见方块');
    
    /***
     * ----------【结束】----------------------------------
     */




































    

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

