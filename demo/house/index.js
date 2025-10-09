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
        size: mainVPSize,
        mass: 50,
        background : '#333',
        texture: greenStone,
    });
    k.centerDot.setCamView(2);  // 设置默认视角 类型2
    k.WALK_SPEED = 1/20;  //+ 慢速度
    k.SPRINT_MIN_SPEED = 5;
    k.SPRINT_MAX_SPEED = 15.5;
    const orig_jumpYVel = k.jumpYVel;
    const orig_jumpHoldLimit = k.JUMP_HOLD_LIMIT;
    const mvp = k.mainVPlayer;
    const mvpBody = k.mainVPlayer.body;
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
            } else {
                k.jumpYVel = orig_jumpYVel;
                k.JUMP_HOLD_LIMIT = orig_jumpHoldLimit;
                k.world.gravity.set(0, -9.82, 0);
            }

            // 保证人物不掉地面
            if(k.mainVPlayer.body.position.y < 0){
                k.mainVPlayer.body.position.y = 50;
            }

            if(mvpBody.mass === 0){
                mvpBody.velocity.set(0, 0, 0);  // 设置线速度为0
                mvpBody.angularVelocity.set(0, 0, 0);  // 设置角速度为0
                mvpBody.force.set(0, 0, 0);  // 清除所有作用力
                mvpBody.torque.set(0, 0, 0);  // 清除所有扭矩
            }
        }
    , 100);

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
    
    const totalCube = 2_0000;  // 计划的总方块数
    const cubeInstances = [];  // 立方体对象【实例】的容器
    const isHiddenVis = [];  // 【隐藏显示】表
    var cubeIndex = 0;  // 计数器

    /***
     * ------【实验区】搞好建筑--------------------------------------
     */

    const symopera = (items, axes={}) => {  // 对称操作
        if(k.notSymOff) return 0;
        var orig_data = cubeDatas[items];
        var agent = {...orig_data};
        for (const axis of ["x", "y", "z"]) {
            if (axes[axis] !== undefined) {
                agent[axis] -= (orig_data[axis] - axes[axis]) * 2;
                const rot = (axis === 'z') ? 'x' : 'z';
                if(agent['r' + rot]){
                    agent['r' + rot] = - orig_data['r' + rot];
                }
            }
        }
        return cubeDatas.push(agent);
    }

    const offsetopera = (items, distance, times = 0, axes = 'x', distance2, axes2, distance3, axes3) => {  // 偏移操作
        if(k.notSymOff) return 0;
        var orig_data = cubeDatas[items];
        var agent = {...orig_data};
        for (const axis of ["x", "y", "z"]) {
            if (axes === axis) {
                agent[axis] -= distance * times;
            }
        }
        if(distance2) {
            for (const axis of ["x", "y", "z"]) {
                if (axes2 === axis) {
                    agent[axis] -= distance2 * times;
                }
            }
        }
        if(distance3) {
            for (const axis of ["x", "y", "z"]) {
                if (axes3 === axis) {
                    agent[axis] -= distance3 * times;
                }
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
    
    const offset = (items, distance, times, axes, distance2, axes2, distance3, axes3) => {  // 偏移数组内的物体
        const addInfo = [];
        for (let index = 1; index < times; index++) {  // 偏移
            for (const it of items) {
                if(it === -1) continue;
                if (Array.isArray(it)) {
                    for (let n = it[0]; n <= it[1]; n++) {
                        addInfo.push(offsetopera(n, distance, index, axes, distance2, axes2, distance3, axes3) - 1);
                    }
                } else {
                    addInfo.push(offsetopera(it, distance, index, axes, distance2, axes2, distance3, axes3) - 1);
                }
            }
        }
        return addInfo;
    }


    // --------- 开始建造的逻辑操作

    var D = {  // 初始化临时变量，放置自己的临时计算数据
        floor1: {},
        floor2: { shelf: { L: {}, C: {}, T: {}, CD: {}, }, }
    }

    if(k.isLogicAdd === '1'){
        myHUDObjEditor.style.backgroundColor = 'blue';  // 提醒自己，不要按动保存

        const indices = [  // 静态物体，不参与物理计算
            82, 83, 85,
            89, 90, 91,
            86, 87, 88,
            99, 97, 98, 
            11, 12, 13, 14, 15, 16, 17, 18, 19, 20,  // 小书架
            22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,  //+ 大书架
            60, 61,
        ];
        indices.forEach(index => {
            if (cubeDatas[index]) {  // 添加安全检查，防止undefined错误
                cubeDatas[index].st = 1;
            }
        });



        // 建造第一层
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
                -1, 76, 77, 65, 66, 67, 100,
                73, 68, 74, 73, 70, 71, 72,
            ];

            // 台阶阵列
            D.floor2.stair = offset([
                73,
            ], 0.25, 12, 'y', 0.45, 'z');

            // 台阶栅栏偏移
            D.floor2.stairFenceOff = offset([
                101,
            ], 1.05, 2, 'x');


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
                ...D.floor2.stair,
                95, 93, 94, 69, // 栅栏地板
                84,
                ...D.floor2.shelf.T11,
                ...D.floor2.wall6,
                ...D.floor2.mfence5,
                ...D.floor2.shelf.T,
                ...D.floor2.shelf.Tsymo,
                101, ...D.floor2.stairFenceOff,  // 台阶栅栏
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
                92, 95, 96, 93, 94, 64, 81, 75, 84, // 栅栏地板
                [78, 80], ...D.floor2.wall6,  // 6外墙
                ...D.floor2.shelf.T11,
                ...D.floor2.stair,
                69, ...D.floor2.mfence5,  // 栅栏
                ...D.floor2.wallSW,  // 西南墙
                ...D.floor2.wallW,  // 西中墙
                ...D.floor2.shelf.T,  // 统柜
                ...D.floor2.shelf.Tsymo,  // 统柜（对称版）
                ...D.floor2.symoSouth,  // 南侧对称
                ...D.floor2.shelf.symo,  // 对称后的长柜、廊柜
                ...D.floor2.shelf.C,  //+5 未对称的柜子
                101, ...D.floor2.stairFenceOff,  // 台阶栅栏
                ...D.floor2.shelf.L,
                ...D.floor2.shelf.CD,
                ...D.floor2.shelf.Loff,
                ...D.floor2.shelf.CDsymo,
                ...D.floor2.shelf.symo2West,  // 对称到最西侧的柜子
            ];

            // 阵列
            D.floor3.firstOff = offset(
                D.floor3.xthing,-2.7, 5, 'y'
            );
        }
        [58, 63,].forEach(index => {  // 门洞
            if (cubeDatas[index]) {
                cubeDatas[index] = {del : 1};
            }
        });
    }

        // 书 系统
        if(true) {
            D.book = {};  // 初始化 书 容器
















/**
 * 书 实验区 ⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️
 */
            const bookDataIns = [];

            const shelfDefs = [  // 书格规则表
                { id: 30102, ref: 103, off: [-0.314, 'y'] },
                { id: 30101, ref: 'n30102', off: [1.28, 'z'] },
                { id: 30103, ref: 'n30102', off: [-1.22, 'z', -0.09, 'y'], maxlen: 1.08, count: 30 },
                { id: 30104, ref: 'n30103', off: [-1.28, 'z'] },
                { id: 30105, ref: 'n30104', off: [-1.2, 'z'] , maxlen: 1.2, count: 35},
                { id: 30106, ref: 'n30105', off: [-1.36, 'z'] , maxlen: 0.9, count: 25},

                { id: 30107, ref: 103, off: [1.28, 'z'] },
                { id: 30108, ref: 103, off: [0, 'z'] },
                { id: 30109, ref: 'n30103', off: [0.255, 'y'] },
                { id: 30110, ref: 'n30104', off: [0.255, 'y'] },
                { id: 30111, ref: 'n30105', off: [0.255, 'y'] , maxlen: 1.2, count: 35},
                { id: 30112, ref: 'n30106', off: [0.255, 'y'] , maxlen: 0.9, count: 25},

                { id: 30113, ref: 'n30107', off: [0.28, 'y']},
                { id: 30114, ref: 'n30108', off: [0.28, 'y']},
                { id: 30115, ref: 'n30109', off: [0.255, 'y']},
                { id: 30116, ref: 'n30110', off: [0.255, 'y']},
                { id: 30117, ref: 'n30111', off: [0.255, 'y'], maxlen: 1.2, count: 35},
                { id: 30118, ref: 'n30112', off: [0.255, 'y'], maxlen: 0.9, count: 25},

                // 多余的四个
                { id: 30119, ref: 'n30115', off: [0.2, 'y'] },
                { id: 30120, ref: 'n30116', off: [0.2, 'y'] },
                { id: 30121, ref: 'n30117', off: [0.2, 'y'], maxlen: 1.2, count: 35 },
                { id: 30122, ref: 'n30118', off: [0.2, 'y'], maxlen: 0.9, count: 25 },

                // 大书架 上层
                { id: 30123, ref: 'n30113', off: [0.45, 'y', 0.3, 'x'] },
                { id: 30124, ref: 'n30123', off: [-1.28, 'z'] },
                { id: 30125, ref: 'n30124', off: [-1.2, 'z'] },
                { id: 30126, ref: 'n30125', off: [-1.27, 'z'] },
                { id: 30127, ref: 'n30121', off: [0.45, 'y', 0.3, 'x'], maxlen: 1.2, count: 35 },
                { id: 30128, ref: 'n30122', off: [0.45, 'y', 0.3, 'x'], maxlen: 0.9, count: 25 },

                // 大书架 下层
                { id: 30129, ref: 'n30123', off: [0.44, 'y',] },
                { id: 30130, ref: 'n30129', off: [-1.28, 'z'] },
                { id: 30131, ref: 'n30130', off: [-1.2, 'z'] },
                { id: 30132, ref: 'n30131', off: [-1.27, 'z'] },
                { id: 30133, ref: 'n30127', off: [0.45, 'y'], maxlen: 1.2, count: 35 },
                { id: 30134, ref: 'n30128', off: [0.45, 'y'], maxlen: 0.9, count: 25 },

            ];


            // 生成书格数据
            function fillBooks(baseBook, totalLength = 1.05, count = 30) {
                const books = [];
                let currentZ = baseBook.z;
                const ks = 3;  // 每本书使用几个随机数
                const seed = baseBook?.seed || 1;  // 随机数种子
                const random = k.genPR(seed, ks * count );
                const baseBottomY = baseBook.y - baseBook.h / 2;  // 计算书的底面 Y 坐标（底边固定）
                const rawDepths = Array.from({ length: count }, () =>
                    baseBook.d * (0.9 + Math.random() * 0.8) // 深度变化 ±40% （书脊宽）
                );
                const rawSum = rawDepths.reduce((a, b) => a + b, 0);
                const scale = totalLength / rawSum;
                const depths = rawDepths.map(d => d * scale);
                for (let i = 0; i < count; i++) {
                    const d = depths[i];
                    // const w = baseBook.w * (0.7 + random[i * ks] * 0.3); // 深度变化 ±10%（书脊对齐）
                    const w = baseBook.w; // 深度变化 ±10%（书脊对齐）
                    const h = baseBook.h * (0.9 + random[i * ks + 1] * 0.1); // 高度变化 ±20%
                    if (i > 0) {
                        const prev = books[i - 1];
                        currentZ = prev.z + (prev.d / 2 + d / 2) + 0.0025;
                    }
                    const y = baseBottomY + h / 2;  // 调整中心 y，让底面固定
                    const colors = [
                        '#A59A8C', // 咖啡灰 —— 底色稳定
                        '#8E8E88', // 铁灰 —— 提供视觉重心
                        '#A8AEB5',  // 石墨蓝灰 —— 提供视觉重量
                        '#9B928A', // 淡褐灰 —— 稍带暖感，接近书脊旧化色
                        '#7F8682', // 炭灰 —— 视觉锚点
                        '#8C8C8C'  // 中灰 —— 平衡整体明暗
                    ];

                    const color = colors[Math.floor(random[i * ks + 2] * colors.length)];
                    books.push({
                        x: baseBook.x,
                        y,
                        z: currentZ,
                        w,
                        h,
                        d,
                        b: color,
                    });
                }
                return books;
            }



            // 生成书
            // shelfDefs.forEach(registerBookshelf);  // 按格 生成书的数据
            function registerBookshelf({ id, ref, off, maxlen = 1.05, count = 30, }) {  // 整格书 注册函数
                const base = typeof ref === 'number'
                    ? [ref]
                    : [...D.book[ref]];
                D.book[`n${id}`] = offset(base, off[0], 2, off[1], off[2], off[3]);  // 偏移
                const firstBook = cubeDatas[D.book[`n${id}`][0]];  // 得到左侧第一本书的数据
                const bookSet = fillBooks({ ...firstBook, seed: id }, maxlen, count);  // 生成整格数据
                for (const book of bookSet) {  // 推入数据流
                    // cubeDatas.push({ ...book, st: 1, iv: true, unIns:1, }); // st:1 表示静态书, unIns:1 代表不统一实例化
                    // bookDataIns.push({ ...book, st: 1 }); // st:1 表示静态书
                }
            }
            

            for (const key in D.book) {  //+ 删除用于定位的第一本书
                const firstBookIndex = D.book[key][0];
                cubeDatas[firstBookIndex] = {del : 1};
            }
            cubeDatas[103] = {del : 1};


            console.log(bookDataIns);
            k.testInsData = bookDataIns;
            k.W.cube({  // 渲染实例化
                n: 'testIns001',
                instances: k.testInsData, // 实例属性的数组
                t: greenStoneborder,
                mix: 0.8,
            });

            console.log(testimg);

            k.W.cube({  // 渲染实例化
                n: 'testInsPlane',
                x: 47.073, y: 1.75, z: -22.555,
                w: 1.19, h: 0.83, ry: 0,
                t: testimg,
                mix: 1,
            });



        }

        

        // [103].forEach(index => {  // 书 103
        //     if (cubeDatas[index]) {
        //         cubeDatas[index] = {del : 1};
        //     }
        // });




/**
 * 书 实验区 🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫
 */



    
    D = null;  // 释放内存



   




























   

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
            isPhysical: (cubeDatas[index]?.st) ? false : true,
            mass: 0,
            background: '#f6a1a1ff',
            mixValue: 0.5,
            // colliGroup: 2,
            isShadow: false,
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
            // hidden: true,
            // isInvisible: (cubeDatas[index]?.iv) ? true : false,
        });
        if(cubeInstances[index]?.b){  // 别忘了，还要把颜色加入到档案 insColor 里
            const args = k.indexToArgs.get(index);
            args.insColor = cubeInstances[index].b;
        }

        if(cubeInstances[index]?.unIns === 1){  // 不在实例化里显示（unIns），则剔除
            cubeInstances[index] = { x:999999999 }
        }
    }
    k.W.cube({  // 渲染实例化
        n: 'manyCubes',
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
        if(data?.unIns){
            result.unIns = data.unIns;
        }
        cubeInstances.push(result);
        if(isHidden !== true){
            k.visCubeLen = cubeIndex;  // 记录，有多少显示的，不过用处不大
        }
        isHiddenVis[cubeIndex] = isHidden;
        return cubeIndex++;
    }





        // const args111 = k.indexToArgs.get(102);
        // args111.other =     { 
        //     instances: k.testInsData,
        //     hidden: false,
        // };


















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




// 不行，有卡顿，必须得想办法将方块优化到极致


// const cube = {
//   vertices: [
//     .5, .5, .5,  -.5, .5, .5,  -.5,-.5, .5,
//     .5, .5, .5,  -.5,-.5, .5,   .5,-.5, .5,
//     .5, .5,-.5,   .5, .5, .5,   .5,-.5, .5,
//     .5, .5,-.5,   .5,-.5, .5,   .5,-.5,-.5,
// //     .5, .5,-.5,  -.5, .5,-.5,  -.5, .5, .5,
// //     .5, .5,-.5,  -.5, .5, .5,   .5, .5, .5,
// //    -.5, .5, .5,  -.5, .5,-.5,  -.5,-.5,-.5,
// //    -.5, .5, .5,  -.5,-.5,-.5,  -.5,-.5, .5,
// //    -.5, .5,-.5,   .5, .5,-.5,   .5,-.5,-.5,
// //    -.5, .5,-.5,   .5,-.5,-.5,  -.5,-.5,-.5,
// //     .5,-.5, .5,  -.5,-.5, .5,  -.5,-.5,-.5,
// //     .5,-.5, .5,  -.5,-.5,-.5,   .5,-.5,-.5
//   ],
//   uv: Array(8).fill([1,1,0,1,0,0,1,1,0,0,1,0]).flat()
// };

// // 测试合并模型
// function mergeCubes(cube, positions) {
//     const vertices = [];
//     const uvs = [];

//     for (const [dx, dy, dz] of positions) {
//         // 复制顶点并加上偏移
//         for (let i = 0; i < cube.vertices.length; i += 3) {
//             vertices.push(
//                 cube.vertices[i] + dx,
//                 cube.vertices[i + 1] + dy,
//                 cube.vertices[i + 2] + dz
//             );
//         }
//         // UV 直接附加
//         uvs.push(...cube.uv);
//     }

//     return { vertices, uv: uvs };
// }

// console.time('实例合并测试');

// // const num = 4; // 合并 每边立方体数量
// // const kkk = 17; // 实例化 每边数量
// const hbX = 4;
// const hbY = (70/hbX) | 0;
// console.log(hbY);

// const num = hbX; // 合并 每边立方体数量
// const kkk = hbY; // 实例化 每边数量

// const spacing = 2; // 每个立方体之间的间距（例如边长+空隙）

// const positions = [];

// for (let x = 0; x < num; x++) {
//   for (let y = 0; y < num; y++) {
//     for (let z = 0; z < num; z++) {
//       positions.push([
//         x * spacing,
//         y * spacing,
//         z * spacing,
//       ]);
//     }
//   }
// }
// const merged = mergeCubes(cube, positions);
// const objName = 'mylearn';
// // 输入我的模型
// k.W.add("hexahedron", merged);
// k.W.models['hexahedron'].verticesBuffer = null;


// const spacing002 = 20;    // 每个格子间距
// const testHBSLHInst = [];

// for (let x = 0; x < kkk; x++) {
//   for (let y = 0; y < kkk; y++) {
//     for (let z = 0; z < kkk; z++) {
//       testHBSLHInst.push({
//         x: x * spacing002,
//         y: y * spacing002,
//         z: z * spacing002
//       });
//     }
//   }
  
// }

// console.log('合并数量', positions.length);

// console.log('实例数量', testHBSLHInst.length);

// console.log('总数量', positions.length * testHBSLHInst.length);

// k.W.hexahedron({  // 渲染实例化
//     n: 'testHBSLH',
//     t: dls,  // 大理石
//     instances: testHBSLHInst, // 实例属性的数组
//     b:'fffb00',
//     mix: 0.5,
// });

// console.timeEnd('实例合并测试');



    // k.W.cube({  // 渲染实例化
    //     n: 'testIns001',
    //     instances: k.testInsData, // 实例属性的数组
    //     x: 9,
    //     y: 3,
    //     z: 9,
    // });



    // { 
    //     instances: k.testInsData,
    //     x: 9,
    //     y: 3,
    //     z: 9,
    // }

    // const args111 = k.indexToArgs.get(102);
    //         args111.other =     { 
    //     instances: k.testInsData,
    //     x: 9,
    //     y: 3,
    //     z: 9,
    // };

    const  testInsPlane = [
        {
               
            },
    ];



