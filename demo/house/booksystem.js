function bookSystem(){  // 书 系统

    D.book = {};  // 初始化 书 容器
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
    shelfDefs.forEach(registerBookshelf);  // 按格 生成书的数据
    function registerBookshelf({ id, ref, off, maxlen = 1.05, count = 30, }) {  // 整格书 注册函数
        const base = typeof ref === 'number'
            ? [ref]
            : [...D.book[ref]];
        D.book[`n${id}`] = offset(base, off[0], 2, off[1], off[2], off[3]);  // 偏移
        const firstBook = cubeDatas[D.book[`n${id}`][0]];  // 得到左侧第一本书的数据
        const bookSet = fillBooks({ ...firstBook, seed: id }, maxlen, count);  // 生成整格数据
        for (const book of bookSet) {  // 推入数据流
            cubeDatas.push({ ...book, st: 1, iv: true, unIns:1, }); // st:1 表示静态书, unIns:1 代表不统一实例化
            // bookDataIns.push({ ...book, st: 1 }); // st:1 表示静态书
        }
    }
    

    for (const key in D.book) {  //+ 删除用于定位的第一本书
        const firstBookIndex = D.book[key][0];
        cubeDatas[firstBookIndex] = {del : 1};
    }
    // cubeDatas[103] = {del : 1};


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



