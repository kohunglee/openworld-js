/**
 * 建造的逻辑代码
 * --------------
 * 就按照这个文件里的步骤指示，建造我的图书柜
 */
function logicData(myData){

    globalThis.D = {  // 初始化临时变量，放置自己的临时计算数据
        floor1: {},
        floor2: { shelf: { L: {}, C: {}, T: {}, CD: {}, }, }
    }
    k.bookS = {};  // 初始化 书 管理系统，储存 书架定位书
    
    var urlParams = new URLSearchParams(globalThis.location.search);  // 获取 URL
    k.isLogicAdd = urlParams.get('logicadd');  // 获取 url 的 id 参数

    if(k.isLogicAdd !== 'no'){
        // if(document.getElementById('myHUDObjEditor')){
        //     document.getElementById('myHUDObjEditor').style.backgroundColor = 'blue';  // 提醒自己，不要按动保存
        // }



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
            if (myData[index]) {  // 添加安全检查，防止undefined错误
                myData[index].st = 1;
            }
        });

        // 将外墙 [44~48] [78~80] 等等等外面那一圈，设置为纹理 t 为第二种材质
        // 另外还有 定位块
        // 现在决定，定位块默认使用 t = 1
        if(true){
            [
                112, 113, 114,
            ].forEach(index => {
                    if (myData[index]) {
                        myData[index].t = 1;
                    }
                }
            );
            [
                44, 45, 46, 47, 48, 78, 79, 80,
                10, 55, 62, 
                65, 66, 49, 77,
                76, 81, 59, 63, 56,
                54, 57, 58,
            ].forEach(index => {
                    if (myData[index]) {
                        myData[index].t = 2;
                    }
                }
            );

            [
                49, 66, 65, 64,
                55, 10, 54, 56,
            ].forEach(index => {
                    if (myData[index]) {
                        myData[index].t = 3;
                    }
                }
            );
        }

        // 建造第一层
        if(true) {
            // 里屋，对称大小书柜、以及【书架定位书 103】
            D.floor1.bookshelf2 = symo([
                [11, 20],  // 小书架
                ...[[22, 35], 60, 61],  // 大书架
                // 103,  // 书架定位书
            ], {x:45});

            // 整理样板间的内容
            D.floor1.showFlat = [  
                ...D.floor1.bookshelf2,  // 对称后的 大小书架
                [11, 20],  // 小书架
                ...[[22, 35], 60, 61],  // 大书架
                // 103,  // 书架定位书
                49,  // 屋顶
                10,  // 地板
                [1, 9],  // 桌子
                [41, 48],  // 窗墙
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

            // 一楼的书（独立的储存逻辑系统）
            if(true){
                k.bookS.floor1 = {};
                k.bookS.floor1.first = 103;  // 一楼的定位书

                // 楼定位书的对称书
                k.bookS.floor1.symo = symo([
                    k.bookS.floor1.first,
                ], {x:45});

                // 楼定位书的偏移（朝向：1）
                k.bookS.floor1.dire1 = offset([
                    k.bookS.floor1.first,
                ], 5.145, 6);
                k.bookS.floor1.dire1.push(k.bookS.floor1.first);

                // 楼定位书的对称书的偏移（朝向：2）
                k.bookS.floor1.dire2 = offset([
                    k.bookS.floor1.symo[0]
                ], 5.145, 6);
                k.bookS.floor1.dire2.push(k.bookS.floor1.symo[0]);

                // 楼定位书的中轴线对称书（朝向：3）
                k.bookS.floor1.dire3 = symo([
                    ...k.bookS.floor1.dire1,
                ], {z:-30});

                // 楼定位书的中轴线对称书（朝向：4）
                k.bookS.floor1.dire4 = symo([
                    ...k.bookS.floor1.dire2,
                ], {z:-30});
            }
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

            // 二楼的书（独立的储存逻辑系统）
            if(true){
                k.bookS.floor2 = {};
                k.bookS.floor2.first = 104;  // 二楼的定位书

                // 楼定位书的对称书
                k.bookS.floor2.symo = symo([
                    k.bookS.floor2.first,
                ], {x:47.567});

                // 楼定位书的偏移（朝向：1）
                k.bookS.floor2.dire1 = offset([
                    k.bookS.floor2.first,
                ], 2.57, 11);
                k.bookS.floor2.dire1.push(k.bookS.floor2.first);

                // 楼定位书的对称书的偏移
                k.bookS.floor2.dire2 = offset([
                    k.bookS.floor2.symo[0]
                ], 2.57, 11);
                k.bookS.floor2.dire2.push(k.bookS.floor2.symo[0]);

                // 楼定位书的中轴线对称书（朝向：3）
                k.bookS.floor2.dire3 = symo([
                    ...k.bookS.floor2.dire1,
                ], {z:-30});

                // 楼定位书的中轴线对称书（朝向：4）
                k.bookS.floor2.dire4 = symo([
                    ...k.bookS.floor2.dire2,
                ], {z:-30});

                // --------

                // 二楼的长柜书的定位书，以及对称一下
                k.bookS.floor2.cdbook = {};  // （朝向：1）
                k.bookS.floor2.cdbook.dire1 = [105];  // （朝向：1）
                k.bookS.floor2.cdbook.dire2 = symo([  // （朝向：2）
                    ...k.bookS.floor2.cdbook.dire1
                ], {x:34.7});

                // 二楼的长柜书的定位书（朝向：3）
                k.bookS.floor2.cdbook.dire3 = symo([
                    ...k.bookS.floor2.cdbook.dire1,
                ], {z:-30});

                // 二楼的长柜书的定位书（朝向：4）
                k.bookS.floor2.cdbook.dire4 = symo([
                    ...k.bookS.floor2.cdbook.dire2,
                ], {z:-30});

                // --------

                // 二楼的廊柜书的定位书，以及对称一下
                k.bookS.floor2.LGbook = {};
                k.bookS.floor2.LGbook.dire1 = [106];  // （朝向：1）
                k.bookS.floor2.LGbook.dire2 = symo([  // （朝向：2）
                    ...k.bookS.floor2.LGbook.dire1,
                ], {x:34.7});
                // 二楼的廊柜书的定位书（朝向：3）
                k.bookS.floor2.LGbook.dire3 = symo([
                    ...k.bookS.floor2.LGbook.dire1,
                ], {z:-29.985});
                // 二楼的廊柜书的定位书（朝向：4）
                k.bookS.floor2.LGbook.dire4 = symo([
                    ...k.bookS.floor2.LGbook.dire2,
                ], {z:-30});

                // 二楼的廊柜书的中间书架
                k.bookS.floor2.LGCbook = {};  // （朝向：1）
                k.bookS.floor2.LGCbook.dire1 = symo([  // （朝向：1）
                    ...k.bookS.floor2.LGbook.dire1,
                ], {z:-28.645});
                k.bookS.floor2.LGCbook.dire2 = symo([  // （朝向：2）
                    ...k.bookS.floor2.LGCbook.dire1,
                ], {x:34.7});
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
                
                ...D.floor2.wall6,
                ...D.floor2.mfence5,

                ...D.floor2.shelf.T11,
                ...D.floor2.shelf.T,
                ...D.floor2.shelf.Tsymo,

                101, ...D.floor2.stairFenceOff,  // 台阶栅栏
                [78, 80],  // 三叠型外墙
                ...D.floor2.wallSW,
            ], {z:-30});
        }

        // 研究第三层及以上
        if(true){
            D.floor3 = {};  // 初始化第三层容器
            const floorNumber = 5;  // 层数

            // 地板，（由屋顶 Y 轴提上来）
            D.floor3.floor = offset([
                49,  // 屋顶（一楼）
            ], -2.7, floorNumber + 1, 'y');

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
                ...D.floor2.stair,
                69, ...D.floor2.mfence5,  // 栅栏
                101, ...D.floor2.stairFenceOff,  // 台阶栅栏
                ...D.floor2.wallSW,  // 西南墙
                ...D.floor2.wallW,  // 西中墙
                ...D.floor2.symoSouth,  // 南侧对称

                ...D.floor2.shelf.T11,
                ...D.floor2.shelf.T,  // 统柜
                ...D.floor2.shelf.Tsymo,  // 统柜（对称版）
                ...D.floor2.shelf.symo,  // 对称后的长柜、廊柜
                ...D.floor2.shelf.C,  //+5 未对称的柜子
                ...D.floor2.shelf.L,
                ...D.floor2.shelf.CD,
                ...D.floor2.shelf.Loff,
                ...D.floor2.shelf.CDsymo,
                ...D.floor2.shelf.symo2West,  // 对称到最西侧的柜子
            ];

            // 阵列
            D.floor3.firstOff = offset(
                D.floor3.xthing, -2.7, floorNumber, 'y'
            );

            // 书系统
            if(true){
                k.bookS.floor3 = {};  // 初始化第三层书

                // -----  普通书柜（统柜）

                k.bookS.floor3.dire1 = offset([  
                    ...k.bookS.floor2.dire1,
                ], -2.7, 5, 'y');

                k.bookS.floor3.dire2 = offset([  
                    ...k.bookS.floor2.dire2,
                ], -2.7, 5, 'y');

                k.bookS.floor3.dire3 = offset([  
                    ...k.bookS.floor2.dire3,
                ], -2.7, 5, 'y');

                k.bookS.floor3.dire4 = offset([  
                    ...k.bookS.floor2.dire4,
                ], -2.7, 5, 'y');

                // -----  长柜

                k.bookS.floor3.cdbook = {};
                k.bookS.floor3.cdbook.dire1 = offset([  
                    ...k.bookS.floor2.cdbook.dire1,
                ], -2.7, 5, 'y');

                k.bookS.floor3.cdbook.dire2 = offset([  
                    ...k.bookS.floor2.cdbook.dire2,
                ], -2.7, 5, 'y');

                k.bookS.floor3.cdbook.dire3 = offset([  
                    ...k.bookS.floor2.cdbook.dire3,
                ], -2.7, 5, 'y');

                k.bookS.floor3.cdbook.dire4 = offset([  
                    ...k.bookS.floor2.cdbook.dire4,
                ], -2.7, 5, 'y');

                // -----  廊柜

                k.bookS.floor3.LGbook = {};
                k.bookS.floor3.LGbook.dire1 = offset([  
                    ...k.bookS.floor2.LGbook.dire1,
                ], -2.7, 5, 'y');

                k.bookS.floor3.LGbook.dire2 = offset([  
                    ...k.bookS.floor2.LGbook.dire2,
                ], -2.7, 5, 'y');

                k.bookS.floor3.LGbook.dire3 = offset([  
                    ...k.bookS.floor2.LGbook.dire3,
                ], -2.7, 5, 'y');

                k.bookS.floor3.LGbook.dire4 = offset([  
                    ...k.bookS.floor2.LGbook.dire4,
                ], -2.7, 5, 'y');

                // -----  廊柜 中央柜

                k.bookS.floor3.LGCbook = {};
                k.bookS.floor3.LGCbook.dire1 = offset([  
                    ...k.bookS.floor2.LGCbook.dire1,
                ], -2.7, 5, 'y');
                k.bookS.floor3.LGCbook.dire2 = offset([  
                    ...k.bookS.floor2.LGCbook.dire2,
                ], -2.7, 5, 'y');
            }
        }

        [58, 63,].forEach(index => {  // 删除门洞
            if (myData[index]) {
                myData[index] = {del : 1};
            }
        });

        // 假书逻辑
        if(true){
            const subBackcolor = '#adadad';  // 假书的颜色

            // 假书 统柜
            if(true){
                // 初始化
                k.bookS.bookSub = {};  // 假书替身
                k.bookS.bookSub.first = 102;
                myData[k.bookS.bookSub.first].st = 1;  // 无物理
                myData[k.bookS.bookSub.first].b = subBackcolor;

                // 二楼 第一统柜的假书 参考假书，后续的书都以此为基准
                k.bookS.bookSub.tgRef = offset([
                    k.bookS.bookSub.first,
                ], -0.352, 7, 'y');
                k.bookS.bookSub.tgRef.push(k.bookS.bookSub.first);

                // 辅助计算值，计算相对位置
                const bookSubx = myData[k.bookS.bookSub.first].x;
                const bookSuby = myData[k.bookS.bookSub.first].y;
                const bookSubz = myData[k.bookS.bookSub.first].z;

                // 假书，二楼统柜方向 1
                k.bookS.floor2.dire1.forEach((v, i) => {
                    const curr_x = myData[v].x;
                    const x_diff = bookSubx - curr_x;
                    k.bookS.bookSub['s'+ v] = offset([
                        ...k.bookS.bookSub.tgRef,
                    ], x_diff, 2)
                });

                // 假书，二楼统柜方向 2
                k.bookS.floor2.dire2.forEach((v, i) => {
                    const curr_x = myData[v].x;
                    const x_diff = bookSubx - curr_x;
                    k.bookS.bookSub['s'+ v] = offset([
                        ...k.bookS.bookSub.tgRef,
                    ], x_diff, 2)
                });

                // 假书，二楼，统柜，方向 3
                k.bookS.floor2.dire3.forEach((v, i) => {
                    const curr_x = myData[v].x;
                    const x_diff = bookSubx - curr_x;

                    const curr_z = myData[v].z;
                    const z_diff = bookSubz - curr_z + 0.61;

                    k.bookS.bookSub['s'+ v] = offset([
                        ...k.bookS.bookSub.tgRef,
                    ], x_diff, 2, 'x', z_diff, 'z')
                });

                // 假书，二楼，统柜，方向 4
                k.bookS.floor2.dire4.forEach((v, i) => {
                    const curr_x = myData[v].x;
                    const x_diff = bookSubx - curr_x;

                    const curr_z = myData[v].z;
                    const z_diff = bookSubz - curr_z + 0.61;

                    k.bookS.bookSub['s'+ v] = offset([
                        ...k.bookS.bookSub.tgRef,
                    ], x_diff, 2, 'x', z_diff, 'z')
                });

                // 假书，三楼 +++ ，统柜，方向 1
                k.bookS.floor3.dire1.forEach((v, i) => {
                    const curr_x = myData[v].x;
                    const x_diff = bookSubx - curr_x;

                    const curr_y = myData[v].y;
                    const y_diff = bookSuby - curr_y + 1.08;


                    k.bookS.bookSub['s'+ v] = offset([
                        ...k.bookS.bookSub.tgRef,
                    ], x_diff, 2, 'x', y_diff, 'y')
                });

                // 假书，三楼 +++ ，统柜，方向 2
                k.bookS.floor3.dire2.forEach((v, i) => {
                    const curr_x = myData[v].x;
                    const x_diff = bookSubx - curr_x;

                    const curr_y = myData[v].y;
                    const y_diff = bookSuby - curr_y + 1.08;


                    k.bookS.bookSub['s'+ v] = offset([
                        ...k.bookS.bookSub.tgRef,
                    ], x_diff, 2, 'x', y_diff, 'y')
                });

                // 假书，三楼 +++ ，统柜，方向 3
                k.bookS.floor3.dire3.forEach((v, i) => {
                    const curr_x = myData[v].x;
                    const x_diff = bookSubx - curr_x;

                    const curr_y = myData[v].y;
                    const y_diff = bookSuby - curr_y + 1.08;

                    const curr_z = myData[v].z;
                    const z_diff = bookSubz - curr_z + 0.61;

                    k.bookS.bookSub['s'+ v] = offset([
                        ...k.bookS.bookSub.tgRef,
                    ], x_diff, 2, 'x', y_diff, 'y', z_diff, 'z')
                });

                // 假书，三楼 +++ ，统柜，方向 4
                k.bookS.floor3.dire4.forEach((v, i) => {
                    const curr_x = myData[v].x;
                    const x_diff = bookSubx - curr_x;

                    const curr_y = myData[v].y;
                    const y_diff = bookSuby - curr_y + 1.08;

                    const curr_z = myData[v].z;
                    const z_diff = bookSubz - curr_z + 0.61;

                    k.bookS.bookSub['s'+ v] = offset([
                        ...k.bookS.bookSub.tgRef,
                    ], x_diff, 2, 'x', y_diff, 'y', z_diff, 'z')
                });
            }

            // 假书 长柜
            if(true){
                // 初始化
                k.bookS.bookSub.cg = {};  // 长柜的假书替身
                k.bookS.bookSub.cg.first = 50;
                myData[k.bookS.bookSub.cg.first].st = 1;  // 无物理
                myData[k.bookS.bookSub.cg.first].b = subBackcolor;

                // 二楼 第一统柜的假书 参考假书，后续的书都以此为基准
                k.bookS.bookSub.cg.tgRef = offset([
                    k.bookS.bookSub.cg.first,
                ], -0.352, 7, 'y');
                k.bookS.bookSub.cg.tgRef.push(k.bookS.bookSub.cg.first);

                // // 辅助计算值，计算相对位置
                const bookSubx = myData[k.bookS.bookSub.cg.first].x;
                const bookSuby = myData[k.bookS.bookSub.cg.first].y;
                const bookSubz = myData[k.bookS.bookSub.cg.first].z;

                // console.log(k.bookS.floor2.cd);

                // 假书，二楼统柜方向 1
                k.bookS.floor2.cdbook.dire1.forEach((v, i) => {
                    const curr_x = myData[v].x;
                    const x_diff = bookSubx - curr_x;
                    k.bookS.bookSub['s'+ v] = offset([
                        ...k.bookS.bookSub.cg.tgRef,
                    ], x_diff, 2)
                });

                // 假书，二楼统柜方向 2
                k.bookS.floor2.cdbook.dire2.forEach((v, i) => {
                    const curr_x = myData[v].x;
                    const x_diff = bookSubx - curr_x;
                    k.bookS.bookSub['s'+ v] = offset([
                        ...k.bookS.bookSub.cg.tgRef,
                    ], x_diff, 2)
                });

                // 假书，二楼，统柜，方向 3
                k.bookS.floor2.cdbook.dire3.forEach((v, i) => {
                    const curr_x = myData[v].x;
                    const x_diff = bookSubx - curr_x;

                    const curr_z = myData[v].z;
                    const z_diff = bookSubz - curr_z - 0.05;

                    k.bookS.bookSub['s'+ v] = offset([
                        ...k.bookS.bookSub.cg.tgRef,
                    ], x_diff, 2, 'x', z_diff, 'z')
                });

                // 假书，二楼，统柜，方向 4
                k.bookS.floor2.cdbook.dire4.forEach((v, i) => {
                    const curr_x = myData[v].x;
                    const x_diff = bookSubx - curr_x;

                    const curr_z = myData[v].z;
                    const z_diff = bookSubz - curr_z - 0.05;

                    k.bookS.bookSub['s'+ v] = offset([
                        ...k.bookS.bookSub.cg.tgRef,
                    ], x_diff, 2, 'x', z_diff, 'z')
                });

                // 假书，三楼 +++ ，统柜，方向 1
                k.bookS.floor3.cdbook.dire1.forEach((v, i) => {
                    const curr_x = myData[v].x;
                    const x_diff = bookSubx - curr_x;

                    const curr_y = myData[v].y;
                    const y_diff = bookSuby - curr_y + 1.08;


                    k.bookS.bookSub['s'+ v] = offset([
                        ...k.bookS.bookSub.cg.tgRef,
                    ], x_diff, 2, 'x', y_diff, 'y')
                });

                // 假书，三楼 +++ ，统柜，方向 2
                k.bookS.floor3.cdbook.dire2.forEach((v, i) => {
                    const curr_x = myData[v].x;
                    const x_diff = bookSubx - curr_x;

                    const curr_y = myData[v].y;
                    const y_diff = bookSuby - curr_y + 1.08;


                    k.bookS.bookSub['s'+ v] = offset([
                        ...k.bookS.bookSub.cg.tgRef,
                    ], x_diff, 2, 'x', y_diff, 'y')
                });

                // 假书，三楼 +++ ，统柜，方向 3
                k.bookS.floor3.cdbook.dire3.forEach((v, i) => {
                    const curr_x = myData[v].x;
                    const x_diff = bookSubx - curr_x;

                    const curr_y = myData[v].y;
                    const y_diff = bookSuby - curr_y + 1.08;

                    const curr_z = myData[v].z;
                    const z_diff = bookSubz - curr_z - 0.05;

                    k.bookS.bookSub['s'+ v] = offset([
                        ...k.bookS.bookSub.cg.tgRef,
                    ], x_diff, 2, 'x', y_diff, 'y', z_diff, 'z')
                });

                // 假书，三楼 +++ ，统柜，方向 4
                k.bookS.floor3.cdbook.dire4.forEach((v, i) => {
                    const curr_x = myData[v].x;
                    const x_diff = bookSubx - curr_x;

                    const curr_y = myData[v].y;
                    const y_diff = bookSuby - curr_y + 1.08;

                    const curr_z = myData[v].z;
                    const z_diff = bookSubz - curr_z - 0.05;

                    k.bookS.bookSub['s'+ v] = offset([
                        ...k.bookS.bookSub.cg.tgRef,
                    ], x_diff, 2, 'x', y_diff, 'y', z_diff, 'z')
                });
            }

            // 假书 廊柜
            if(true){
                // 初始化
                k.bookS.bookSub.lg = {};  // 长柜的假书替身
                k.bookS.bookSub.lg.first = 0;
                myData[k.bookS.bookSub.lg.first].st = 1;  // 无物理
                myData[k.bookS.bookSub.lg.first].b = subBackcolor;

                // 二楼 第一统柜的假书 参考假书，后续的书都以此为基准
                k.bookS.bookSub.lg.tgRef = offset([
                    k.bookS.bookSub.lg.first,
                ], -0.345, 6, 'y');
                k.bookS.bookSub.lg.tgRef.push(k.bookS.bookSub.lg.first);

                // // 辅助计算值，计算相对位置
                const bookSubx = myData[k.bookS.bookSub.lg.first].x;
                const bookSuby = myData[k.bookS.bookSub.lg.first].y;
                const bookSubz = myData[k.bookS.bookSub.lg.first].z;

                // console.log(k.bookS.floor2.cd);

                // 假书，二楼统柜方向 1
                k.bookS.floor2.LGbook.dire1.forEach((v, i) => {
                    const curr_x = myData[v].x;
                    const x_diff = bookSubx - curr_x;
                    k.bookS.bookSub['s'+ v] = offset([
                        ...k.bookS.bookSub.lg.tgRef,
                    ], x_diff, 2)
                });

                // 假书，二楼统柜方向 2
                k.bookS.floor2.LGbook.dire2.forEach((v, i) => {
                    const curr_x = myData[v].x;
                    const x_diff = bookSubx - curr_x;
                    k.bookS.bookSub['s'+ v] = offset([
                        ...k.bookS.bookSub.lg.tgRef,
                    ], x_diff, 2)
                });

                // 假书，二楼，统柜，方向 3
                k.bookS.floor2.LGbook.dire3.forEach((v, i) => {
                    const curr_x = myData[v].x;
                    const x_diff = bookSubx - curr_x;

                    const curr_z = myData[v].z;
                    const z_diff = bookSubz - curr_z + 0.61;

                    k.bookS.bookSub['s'+ v] = offset([
                        ...k.bookS.bookSub.lg.tgRef,
                    ], x_diff, 2, 'x', z_diff, 'z')
                });

                // 假书，二楼，统柜，方向 4
                k.bookS.floor2.LGbook.dire4.forEach((v, i) => {
                    const curr_x = myData[v].x;
                    const x_diff = bookSubx - curr_x;

                    const curr_z = myData[v].z;
                    const z_diff = bookSubz - curr_z + 0.61;

                    k.bookS.bookSub['s'+ v] = offset([
                        ...k.bookS.bookSub.lg.tgRef,
                    ], x_diff, 2, 'x', z_diff, 'z')
                });

                // // 假书，三楼 +++ ，统柜，方向 1
                k.bookS.floor3.LGbook.dire1.forEach((v, i) => {
                    const curr_x = myData[v].x;
                    const x_diff = bookSubx - curr_x;

                    const curr_y = myData[v].y;
                    const y_diff = bookSuby - curr_y + 1.08;


                    k.bookS.bookSub['s'+ v] = offset([
                        ...k.bookS.bookSub.lg.tgRef,
                    ], x_diff, 2, 'x', y_diff, 'y')
                });

                // 假书，三楼 +++ ，统柜，方向 2
                k.bookS.floor3.LGbook.dire2.forEach((v, i) => {
                    const curr_x = myData[v].x;
                    const x_diff = bookSubx - curr_x;

                    const curr_y = myData[v].y;
                    const y_diff = bookSuby - curr_y + 1.08;


                    k.bookS.bookSub['s'+ v] = offset([
                        ...k.bookS.bookSub.lg.tgRef,
                    ], x_diff, 2, 'x', y_diff, 'y')
                });

                // 假书，三楼 +++ ，统柜，方向 3
                k.bookS.floor3.LGbook.dire3.forEach((v, i) => {
                    const curr_x = myData[v].x;
                    const x_diff = bookSubx - curr_x;

                    const curr_y = myData[v].y;
                    const y_diff = bookSuby - curr_y + 1.08;

                    const curr_z = myData[v].z;
                    const z_diff = bookSubz - curr_z + 0.61;

                    k.bookS.bookSub['s'+ v] = offset([
                        ...k.bookS.bookSub.lg.tgRef,
                    ], x_diff, 2, 'x', y_diff, 'y', z_diff, 'z')
                });

                // 假书，三楼 +++ ，统柜，方向 4
                k.bookS.floor3.LGbook.dire4.forEach((v, i) => {
                    const curr_x = myData[v].x;
                    const x_diff = bookSubx - curr_x;

                    const curr_y = myData[v].y;
                    const y_diff = bookSuby - curr_y + 1.08;

                    const curr_z = myData[v].z;
                    const z_diff = bookSubz - curr_z + 0.61;

                    k.bookS.bookSub['s'+ v] = offset([
                        ...k.bookS.bookSub.lg.tgRef,
                    ], x_diff, 2, 'x', y_diff, 'y', z_diff, 'z')
                });

                // 假书，二楼统柜方向 1
                k.bookS.floor2.LGCbook.dire1.forEach((v, i) => {
                    const curr_x = myData[v].x;
                    const x_diff = bookSubx - curr_x;

                    const curr_y = myData[v].y;
                    const y_diff = bookSuby - curr_y + 1.08;

                    const curr_z = myData[v].z;
                    const z_diff = bookSubz - curr_z - 0.6;

                    k.bookS.bookSub['s'+ v] = offset([
                        ...k.bookS.bookSub.lg.tgRef,
                    ], x_diff, 2, 'x', y_diff, 'y', z_diff, 'z')
                });

                // 假书，二楼统柜方向 1
                k.bookS.floor2.LGCbook.dire2.forEach((v, i) => {
                    const curr_x = myData[v].x;
                    const x_diff = bookSubx - curr_x;

                    const curr_y = myData[v].y;
                    const y_diff = bookSuby - curr_y + 1.08;

                    const curr_z = myData[v].z;
                    const z_diff = bookSubz - curr_z - 0.6;

                    k.bookS.bookSub['s'+ v] = offset([
                        ...k.bookS.bookSub.lg.tgRef,
                    ], x_diff, 2, 'x', y_diff, 'y', z_diff, 'z')
                });

                // 假书，二楼统柜方向 1
                k.bookS.floor3.LGCbook.dire1.forEach((v, i) => {
                    const curr_x = myData[v].x;
                    const x_diff = bookSubx - curr_x;

                    const curr_y = myData[v].y;
                    const y_diff = bookSuby - curr_y + 1.08;

                    const curr_z = myData[v].z;
                    const z_diff = bookSubz - curr_z - 0.6;

                    k.bookS.bookSub['s'+ v] = offset([
                        ...k.bookS.bookSub.lg.tgRef,
                    ], x_diff, 2, 'x', y_diff, 'y', z_diff, 'z')
                });

                // 假书，二楼统柜方向 1
                k.bookS.floor3.LGCbook.dire2.forEach((v, i) => {
                    const curr_x = myData[v].x;
                    const x_diff = bookSubx - curr_x;

                    const curr_y = myData[v].y;
                    const y_diff = bookSuby - curr_y + 1.08;

                    const curr_z = myData[v].z;
                    const z_diff = bookSubz - curr_z - 0.6;

                    k.bookS.bookSub['s'+ v] = offset([
                        ...k.bookS.bookSub.lg.tgRef,
                    ], x_diff, 2, 'x', y_diff, 'y', z_diff, 'z')
                });
            }

            // 一楼的假书
            if(true) {
                // 初始化
                k.bookS.floor1.bookSub = {};  // 长柜的假书替身
                k.bookS.floor1.bookSub.b001 = 107;
                k.bookS.floor1.bookSub.b002 = 108;
                k.bookS.floor1.bookSub.b003 = 109;
                myData[k.bookS.floor1.bookSub.b001].st = 1;  // 无物理
                myData[k.bookS.floor1.bookSub.b002].st = 1;  // 无物理
                myData[k.bookS.floor1.bookSub.b003].st = 1;  // 无物理
                myData[k.bookS.floor1.bookSub.b001].b = subBackcolor;
                myData[k.bookS.floor1.bookSub.b002].b = subBackcolor;
                myData[k.bookS.floor1.bookSub.b003].b = subBackcolor;

                // 制作 1 楼的参考假书
                k.bookS.floor1.bookSub.ob001 = offset([
                    k.bookS.floor1.bookSub.b001,
                ], -0.29, 3, 'y');
                k.bookS.floor1.bookSub.ob002 = offset([
                    k.bookS.floor1.bookSub.b002,
                ], -0.22, 4, 'y');
                k.bookS.floor1.bookSub.ob003 = offset([
                    k.bookS.floor1.bookSub.b003,
                ], -0.45, 2, 'y');
                const temp = k.bookS.floor1.bookSub;
                k.bookS.floor1.bookSub.ref = [...temp.ob001, ...temp.ob002, ...temp.ob003, temp.b001, temp.b002, temp.b003];  // 一楼书架假书的参考

                // 对称参考，将参考对称
                k.bookS.floor1.bookSub.refSymo = symo([  // 对称参考
                    ...k.bookS.floor1.bookSub.ref,
                ], {x:45});

                // 大厅另一侧的参考
                k.bookS.floor1.bookSub.refSymoZ = symo([  // 对称参考
                    ...k.bookS.floor1.bookSub.ref,
                ], {z:-30});

                // 大厅另一侧的参考的对称参考
                k.bookS.floor1.bookSub.refSymoZSymo = symo([  // 对称参考
                    ...k.bookS.floor1.bookSub.refSymo,
                ], {z:-30});

                //  辅助计算值，计算相对位置
                const bookSubx = myData[k.bookS.floor1.bookSub.b001].x;

                // 方向 1
                k.bookS.floor1.dire1.forEach((v, i) => {
                    const curr_x = myData[v].x;
                    const x_diff = bookSubx - curr_x;
                    k.bookS.bookSub['s'+ v] = offset([
                        ...k.bookS.floor1.bookSub.ref,
                    ], x_diff, 2)
                });

                // 方向 2
                k.bookS.floor1.dire2.forEach((v, i) => {
                    const curr_x = myData[v].x;
                    const x_diff = bookSubx - curr_x - 4.89;
                    k.bookS.bookSub['s'+ v] = offset([
                        ...k.bookS.floor1.bookSub.refSymo,
                    ], x_diff, 2)
                });

                // 假书，二楼统柜方向 3
                k.bookS.floor1.dire3.forEach((v, i) => {
                    const curr_x = myData[v].x;
                    const x_diff = bookSubx - curr_x;
                    k.bookS.bookSub['s'+ v] = offset([
                        ...k.bookS.floor1.bookSub.refSymoZ,
                    ], x_diff, 2, 'x',)
                });

                // 假书，二楼统柜方向 3
                k.bookS.floor1.dire4.forEach((v, i) => {
                    const curr_x = myData[v].x;
                    const x_diff = bookSubx - curr_x - 4.89;
                    k.bookS.bookSub['s'+ v] = offset([
                        ...k.bookS.floor1.bookSub.refSymoZSymo,
                    ], x_diff, 2, 'x',)
                });
            }

            // 删除所有参考
            if(true){
                [
                    ...k.bookS.floor1.bookSub.ref,  // 一楼方向1
                    ...k.bookS.floor1.bookSub.refSymo,  // 一楼方向2
                    ...k.bookS.floor1.bookSub.refSymoZ,  // 一楼方向3
                    ...k.bookS.floor1.bookSub.refSymoZSymo,  // 一楼方向4
                    ...k.bookS.bookSub.tgRef,  // 二楼
                    ...k.bookS.bookSub.cg.tgRef, // 长柜
                    ...k.bookS.bookSub.lg.tgRef, // 廊柜

                ].forEach((v, i) => {
                    myData[v] = {del:1};
                })
            }
        }
    }

    return myData;
}
