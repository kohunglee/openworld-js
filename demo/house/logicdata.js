/**
 * 建造的逻辑代码
 * --------------
 * 就按照这个文件里的步骤指示，建造我的图书柜
 */
function logicData(){  // 

    globalThis.D = {  // 初始化临时变量，放置自己的临时计算数据
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

        [58, 63,].forEach(index => {  // 删除门洞
            if (cubeDatas[index]) {
                cubeDatas[index] = {del : 1};
            }
        });
    }
}
