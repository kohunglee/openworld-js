function bookSystem(){  // 书 系统

    D.book = {};  // 初始化 书 容器
    const bookDataIns = [];

    const shelfDefs = [  // 书格规则表，以 103 为基准
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

    const fix3 = v => Number(v.toFixed(3));  // 保留 3 位小数

    const colors = [  // 书脊颜色 库
        '#A59A8C',
        '#8E8E88',
        '#A8AEB5',
        '#9B928A',
        '#7F8682',
        '#8C8C8C'
    ];

    // 生成书格数据
    function fillBooks(baseBook, totalLength = 1.05, count = 30) {
        const books = [];
        let currentZ = baseBook.z;
        const ks = 3;  // 每本书使用几个随机数
        const seed = baseBook?.seed || 1;  // 随机数种子
        const random = k.genPR(seed, ks * count );
        const baseBottomY = baseBook.y - baseBook.h / 2;  // 计算书的底面 Y 坐标（底边固定）
        const rawDepths = Array.from({ length: count }, (_, i) =>
            baseBook.d * (0.9 + (1 - random[i * ks + 1]) * 0.8) // 深度变化 ±40%（书脊宽）
        );
        const rawSum = rawDepths.reduce((a, b) => a + b, 0);
        const scale = totalLength / rawSum;
        const depths = rawDepths.map(d => d * scale);
        for (let i = 0; i < count; i++) {
            const d = depths[i];
            const w = baseBook.w; // 深度变化 ±10%（书脊对齐）
            const h = baseBook.h * (0.9 + random[i * ks + 1] * 0.1); // 高度变化 ±20%
            if (i > 0) {
                const prev = books[i - 1];
                currentZ = prev.z + (prev.d / 2 + d / 2) + 0.0025;
            }
            const y = baseBottomY + h / 2;  // 调整中心 y，让底面固定
            const color = colors[Math.floor(random[i * ks + 2] * colors.length)];
            books.push({
                x: fix3(baseBook.x), y: fix3(y), z: fix3(currentZ),
                w: fix3(w), h: fix3(h), d: fix3(d),
                b: color,
            });
        }
        return books;
    }

    /**** ---- 【生成书的数据】 ------ */

    // 生成书
    shelfDefs.forEach(registerBookshelf);  // 按格 生成书的数据
    function registerBookshelf({ id, ref, off, maxlen = 1.05, count = 30, }) {  // 整格书 生成 注册函数
        const base = typeof ref === 'number'
            ? [ref]
            : [...D.book[ref]];
        D.book[`n${id}`] = offset(base, off[0], 2, off[1], off[2], off[3]);  // 偏移操作，生成新书格，第一本书
        const firstBook = cubeDatas[D.book[`n${id}`][0]];  // 得到 新书格 第一本书的数据
        const bookSet = fillBooks({ ...firstBook, seed: id }, maxlen, count);  // 生成整格数据
        for (const book of bookSet) {  // 推入数据流
            cubeDatas.push({ ...book, st: 1, iv: true, unIns:1, }); // st:1 表示静态书, unIns:1 代表不统一实例化
            bookDataIns.push({ ...book, st: 1 }); // st:1 表示静态书
        }
        bookDataIns.push({del:1}); // 方便检索数据，按书格添加 del
    }

    for (const key in D.book) {  //+ 删除用于定位的第一本书
        const firstBookIndex = D.book[key][0];
        cubeDatas[firstBookIndex] = {del : 1};
    }
    cubeDatas[103] = {del : 1};  // 删除，书架定位书
    cubeDatas[102] = {del : 1};  // 删除，辅助 svg 片片儿 定位 模型

    /**** ---- 【根据数据，渲染书】 ------ */

    k.testInsData = bookDataIns;

    k.W.cube({  // 渲染实例化
        n: 'testIns001',
        instances: k.testInsData, // 实例属性的数组
        t: greenStoneborder,
        mix: 0.8,
    });

    /**** ---- 【实验 svg】 ------ */

    console.time('svg');

    const svgClearVal = 1;  // 清晰度
    const pool = "憨狗天地玄黄宇宙洪荒日月盈AabcdeFGHIJ昃辰宿列张寒来暑往秋收冬藏";
    const poolLen = pool.length;
    const randCN = () => {  // 输出 1~8 位随机字符
        let len = (Math.random() * 5 | 0) + 4;
        let s = '';
        for (let i = 0; i < len; i++) s += pool[Math.random() * poolLen | 0];
        return s;
    }

    const svgTextCodeBuild = (x, y, w_z, w_y, data) => {  // 生成 SVG 里的文字代码
        let textCode = '';
        for (let i = 0; i < data.length; i++) {
            const x1 = fix3(data[i].z - w_z) * 1000 ;
            const y1 = fix3(data[i].y - w_y) * 1000;
            textCode += `<text x="${(x + x1 + 10) * svgClearVal}" y="${(y - y1  + 20) * svgClearVal}">${randCN()}</text>`;
        }
        return textCode;
    }

    const svgCodeMake = (width, height, textCode) => {  // 生成 SVG 代码
            return svgTestCode = `
    <svg xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 ${width} ${height}"
        width="${width}" height="${height}"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="三个红色方块 与 你好啊" style="width:500px">
        <rect x="0" y="0" width="100%" height="100%" fill="#00000000"/>
        <rect x="60"  y="30" width="40" height="40" fill="#e63946" rx="4"/>
        <rect x="110" y="20" width="40" height="80" fill="#e63946" rx="4"/>
        <rect x="160" y="35" width="40" height="50" fill="#e63946" rx="4"/>

        <g font-family=" 'Noto Sans SC', 'PingFang SC', 'Microsoft Yahei', 'Heiti SC', 'Source Han Sans SC', sans-serif "
            font-size="${15 * svgClearVal}"
            fill="#000000ff"
            writing-mode="vertical-rl"
            text-orientation="upright"
            text-anchor="start"
            dominant-baseline="hanging">

            <text x="60" y="170">水调歌头</text>
            ${textCode}
        </g>
    </svg>
            `;
    }

    const up_TextCode = svgTextCodeBuild(60, 170, -23.116, 2.898, bookDataIns.slice(0, 681));  // 上层 681 个
    const down_TextCode = svgTextCodeBuild(77, 282, -23.116, 1.853, bookDataIns.slice(681, bookDataIns.length));  // 下层 其余的
    const upSvg = svgCodeMake(7400 * svgClearVal, 940 * svgClearVal, up_TextCode);  // 上层的 SVG 数据
    const downSvg = svgCodeMake(7400 * svgClearVal, 935 * svgClearVal, down_TextCode);  // 下层的 SVG 数据

    const textureAlp = [
        { id:'upSvgPng', type: 'svg', svgCode: upSvg },
        { id:'downSvgPng', type: 'svg', svgCode: downSvg },
    ];

    k.loadTexture(textureAlp).then(loadedImage => {
        const upSvgPng = k.textureMap.get('upSvgPng');
        const downSvgPng = k.textureMap.get('downSvgPng');

        k.W.plane({  // 上大书架
            n: 'n010101',
            x: 47.373, y: 2.681, z: -19.478,
            w: 7.4, h: 0.94, ry: -90,
            t: upSvgPng,
        });

        k.W.plane({  // 下小书架
            n: 'n010102',
            x: 47.072, y: 1.75, z: -19.497,
            w: 7.4, h: 0.935, ry: -90,
            t: downSvgPng,
        });
    });

    /**** ---------- */
    console.timeEnd('svg');
}


