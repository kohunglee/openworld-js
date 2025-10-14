function getshelfDefs(type, id){  // 获取规则
    const shelfID = id;
    if(type === 1){
        return [  // 规则 ①，一楼书架
            { id: 2, ref: shelfID, off: [-0.314, 'y'] },
            { id: 1, ref: 'n2', off: [1.28, 'z'] },
            { id: 3, ref: 'n2', off: [-1.22, 'z', -0.09, 'y'], maxlen: 1.08, count: 30 },
            { id: 4, ref: 'n3', off: [-1.28, 'z'] },
            { id: 5, ref: 'n4', off: [-1.2, 'z'] , maxlen: 1.2, count: 35},
            { id: 6, ref: 'n5', off: [-1.36, 'z'] , maxlen: 0.9, count: 25},

            { id: 7, ref: shelfID, off: [1.28, 'z'] },
            { id: 8, ref: shelfID, off: [0, 'z'] },
            { id: 9, ref: 'n3', off: [0.255, 'y'] },
            { id: 10, ref: 'n4', off: [0.255, 'y'] },
            { id: 11, ref: 'n5', off: [0.255, 'y'] , maxlen: 1.2, count: 35},
            { id: 12, ref: 'n6', off: [0.255, 'y'] , maxlen: 0.9, count: 25},

            { id: 13, ref: 'n7', off: [0.28, 'y']},
            { id: 14, ref: 'n8', off: [0.28, 'y']},
            { id: 15, ref: 'n9', off: [0.255, 'y']},
            { id: 16, ref: 'n10', off: [0.255, 'y']},
            { id: 17, ref: 'n11', off: [0.255, 'y'], maxlen: 1.2, count: 35},
            { id: 18, ref: 'n12', off: [0.255, 'y'], maxlen: 0.9, count: 25},

            // 多余的四个
            { id: 19, ref: 'n15', off: [0.2, 'y'] },
            { id: 20, ref: 'n16', off: [0.2, 'y'] },
            { id: 21, ref: 'n17', off: [0.2, 'y'], maxlen: 1.2, count: 35 },
            { id: 22, ref: 'n18', off: [0.2, 'y'], maxlen: 0.9, count: 25 },

            // 大书架 上层
            { id: 23, ref: 'n13', off: [0.45, 'y', 0.3, 'x'] },
            { id: 24, ref: 'n23', off: [-1.28, 'z'] },
            { id: 25, ref: 'n24', off: [-1.2, 'z'] },
            { id: 26, ref: 'n25', off: [-1.27, 'z'] },
            { id: 27, ref: 'n21', off: [0.45, 'y', 0.3, 'x'], maxlen: 1.2, count: 35 },
            { id: 28, ref: 'n22', off: [0.45, 'y', 0.3, 'x'], maxlen: 0.9, count: 25 },

            // 大书架 下层
            { id: 29, ref: 'n23', off: [0.44, 'y',] },
            { id: 30, ref: 'n29', off: [-1.28, 'z'] },
            { id: 31, ref: 'n30', off: [-1.2, 'z'] },
            { id: 32, ref: 'n31', off: [-1.27, 'z'] },
            { id: 33, ref: 'n27', off: [0.45, 'y'], maxlen: 1.2, count: 35 },
            { id: 34, ref: 'n28', off: [0.45, 'y'], maxlen: 0.9, count: 25 },
        ];
    }

    if(type === 2){
        const count = {maxlen: 1.2, count: 35};
        return [  // 规则 ②，二楼书架

            // 1
            { id: 3, ref: shelfID, off: [-0.352 * 3, 'y'], ...count},
            { id: 4, ref: 'n3', off: [-1.316, 'z'], ...count},
            { id: 5, ref: 'n3', off: [-1.316 * 2, 'z'], ...count},
            { id: 1, ref: 'n3', off: [-1.316 * -2, 'z'], ...count},
            { id: 2, ref: 'n3', off: [-1.316 * -1, 'z'], ...count},

            // 2
            { id: 8, ref: shelfID, off: [-0.352 * 2, 'y'], ...count},
            { id: 9, ref: 'n8', off: [-1.316, 'z'], ...count},
            { id: 10, ref: 'n8', off: [-1.316 * 2, 'z'], ...count},
            { id: 6, ref: 'n8', off: [-1.316 * -2, 'z'], ...count},
            { id: 7, ref: 'n8', off: [-1.316 * -1, 'z'], ...count},

            // 3
            { id: 13, ref: shelfID, off: [-0.352, 'y'], ...count},
            { id: 14, ref: 'n13', off: [-1.316, 'z'], ...count},
            { id: 15, ref: 'n13', off: [-1.316 * 2, 'z'], ...count},
            { id: 11, ref: 'n13', off: [-1.316 * -2, 'z'], ...count},
            { id: 12, ref: 'n13', off: [-1.316 * -1, 'z'], ...count},
            
            // 4
            { id: 18, ref: shelfID, off: [-0.352 * 0, 'y'], ...count},
            { id: 19, ref: 'n18', off: [-1.316, 'z'], ...count},
            { id: 20, ref: 'n18', off: [-1.316 * 2, 'z'], ...count},
            { id: 16, ref: 'n18', off: [-1.316 * -2, 'z'], ...count},
            { id: 17, ref: 'n18', off: [-1.316 * -1, 'z'], ...count},

            // 5
            { id: 24, ref: shelfID, off: [-0.352 * -1, 'y'], ...count},
            { id: 25, ref: 'n24', off: [-1.316, 'z'], ...count},
            { id: 21, ref: 'n24', off: [-1.316 * 2, 'z'], ...count},
            { id: 22, ref: 'n24', off: [-1.316 * -2, 'z'], ...count},
            { id: 23, ref: 'n24', off: [-1.316 * -1, 'z'], ...count},

            // 6
            { id: 29, ref: shelfID, off: [-0.352 * -2, 'y'], ...count},
            { id: 30, ref: 'n29', off: [-1.316, 'z'], ...count},
            { id: 26, ref: 'n29', off: [-1.316 * 2, 'z'], ...count},
            { id: 27, ref: 'n29', off: [-1.316 * -2, 'z'], ...count},
            { id: 28, ref: 'n29', off: [-1.316 * -1, 'z'], ...count},

            // 7
            { id: 34, ref: shelfID, off: [-0.352 * -3, 'y'], ...count},
            { id: 35, ref: 'n34', off: [-1.316, 'z'], ...count},
            { id: 31, ref: 'n34', off: [-1.316 * 2, 'z'], ...count},
            { id: 32, ref: 'n34', off: [-1.316 * -2, 'z'], ...count},
            { id: 33, ref: 'n34', off: [-1.316 * -1, 'z'], ...count},
        ];
    }

    if(type === 3){
        const count = {maxlen: 1.0, count: 30};
        return [  // 规则 ③，二楼书架长书架

            // 1
            { id: 3, ref: shelfID, off: [-0.352 * 3, 'y'], ...count},
            { id: 4, ref: 'n3', off: [-1.1, 'z'], ...count},
            { id: 5, ref: 'n3', off: [-1.1 * 2, 'z'], ...count},
            { id: 1, ref: 'n3', off: [-1.1 * -2, 'z'], ...count},
            { id: 2, ref: 'n3', off: [-1.1 * -1, 'z'], ...count},

            // 2
            { id: 8, ref: shelfID, off: [-0.352 * 2, 'y'], ...count},
            { id: 9, ref: 'n8', off: [-1.1, 'z'], ...count},
            { id: 10, ref: 'n8', off: [-1.1 * 2, 'z'], ...count},
            { id: 6, ref: 'n8', off: [-1.1 * -2, 'z'], ...count},
            { id: 7, ref: 'n8', off: [-1.1 * -1, 'z'], ...count},

            // 3
            { id: 13, ref: shelfID, off: [-0.352, 'y'], ...count},
            { id: 14, ref: 'n13', off: [-1.1, 'z'], ...count},
            { id: 15, ref: 'n13', off: [-1.1 * 2, 'z'], ...count},
            { id: 11, ref: 'n13', off: [-1.1 * -2, 'z'], ...count},
            { id: 12, ref: 'n13', off: [-1.1 * -1, 'z'], ...count},
            
            // 4
            { id: 18, ref: shelfID, off: [-0.352 * 0, 'y'], ...count},
            { id: 19, ref: 'n18', off: [-1.1, 'z'], ...count},
            { id: 20, ref: 'n18', off: [-1.1 * 2, 'z'], ...count},
            { id: 16, ref: 'n18', off: [-1.1 * -2, 'z'], ...count},
            { id: 17, ref: 'n18', off: [-1.1 * -1, 'z'], ...count},

            // 5
            { id: 24, ref: shelfID, off: [-0.352 * -1, 'y'], ...count},
            { id: 25, ref: 'n24', off: [-1.1, 'z'], ...count},
            { id: 21, ref: 'n24', off: [-1.1 * 2, 'z'], ...count},
            { id: 22, ref: 'n24', off: [-1.1 * -2, 'z'], ...count},
            { id: 23, ref: 'n24', off: [-1.1 * -1, 'z'], ...count},

            // 6
            { id: 29, ref: shelfID, off: [-0.352 * -2, 'y'], ...count},
            { id: 30, ref: 'n29', off: [-1.1, 'z'], ...count},
            { id: 26, ref: 'n29', off: [-1.1 * 2, 'z'], ...count},
            { id: 27, ref: 'n29', off: [-1.1 * -2, 'z'], ...count},
            { id: 28, ref: 'n29', off: [-1.1 * -1, 'z'], ...count},

            // 7
            { id: 34, ref: shelfID, off: [-0.352 * -3, 'y'], ...count},
            { id: 35, ref: 'n34', off: [-1.1, 'z'], ...count},
            { id: 31, ref: 'n34', off: [-1.1 * 2, 'z'], ...count},
            { id: 32, ref: 'n34', off: [-1.1 * -2, 'z'], ...count},
            { id: 33, ref: 'n34', off: [-1.1 * -1, 'z'], ...count},

            // 最左侧
            { id: 36, ref: 'n1', off: [-1.1 * -1, 'z'], ...count},
            { id: 37, ref: 'n36', off: [-0.352 * -1, 'y'], ...count},
            { id: 38, ref: 'n36', off: [-0.352 * -2, 'y'], ...count},
            { id: 39, ref: 'n36', off: [-0.352 * -3, 'y'], ...count},
            { id: 40, ref: 'n36', off: [-0.352 * -4, 'y'], ...count},
            { id: 41, ref: 'n36', off: [-0.352 * -5, 'y'], ...count},
            { id: 42, ref: 'n36', off: [-0.352 * -6, 'y'], ...count},
        ];
    }

    if(type === 4 || type === 5){
        const count = {maxlen: 1.18, count: 35};
        return [  // 规则 ④，二楼书架长书架

            // 2
            { id: 8, ref: shelfID, off: [-0.345 * 2, 'y'], ...count},
            { id: 9, ref: 'n8', off: [-1.25, 'z'], ...count},
            { id: 7, ref: 'n8', off: [-1.25 * -1, 'z'], ...count},

            // 3
            { id: 13, ref: shelfID, off: [-0.345, 'y'], ...count},
            { id: 14, ref: 'n13', off: [-1.25, 'z'], ...count},
            { id: 12, ref: 'n13', off: [-1.25 * -1, 'z'], ...count},
            
            // 4
            { id: 18, ref: shelfID, off: [-0.345 * 0, 'y'], ...count},
            { id: 19, ref: 'n18', off: [-1.25, 'z'], ...count},
            { id: 17, ref: 'n18', off: [-1.25 * -1, 'z'], ...count},

            // 5
            { id: 24, ref: shelfID, off: [-0.345 * -1, 'y'], ...count},
            { id: 25, ref: 'n24', off: [-1.25, 'z'], ...count},
            { id: 23, ref: 'n24', off: [-1.25 * -1, 'z'], ...count},

            // 6
            { id: 29, ref: shelfID, off: [-0.345 * -2, 'y'], ...count},
            { id: 30, ref: 'n29', off: [-1.25, 'z'], ...count},
            { id: 28, ref: 'n29', off: [-1.25 * -1, 'z'], ...count},

            // 7
            { id: 34, ref: shelfID, off: [-0.345 * -3, 'y'], ...count},
            { id: 35, ref: 'n34', off: [-1.25, 'z'], ...count},
            { id: 33, ref: 'n34', off: [-1.25 * -1, 'z'], ...count},

        ];
    }
}

// 保留三位小数
function fix3(v) {
    return Number(v.toFixed(3));
}

// 书脊颜色 库
globalThis.book_colors = [
    '#A59A8C',
    '#8E8E88',
    '#A8AEB5',
    '#9B928A',
    '#7F8682',
    '#8C8C8C'
];

// 生成书格数据
function fillBooks(baseBook, dirc, totalLength = 1.05, count = 30) {
    const books = [];
    let currentZ = baseBook.z;
    const ks = 3;  // 每本书使用几个随机数
    const seed = baseBook.seed || 1;  // 随机数种子
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
            if(dirc === 3 || dirc === 4){
                currentZ = prev.z - (prev.d / 2 + d / 2);  // 书与书之间的距离
            } else {
                currentZ = prev.z + (prev.d / 2 + d / 2);
            }
        }
        const y = baseBottomY + h / 2;  // 调整中心 y，让底面固定
        const color = book_colors[Math.floor(random[i * ks + 2] * book_colors.length)];  // 随机书脊颜色
        books.push({
            x: fix3(baseBook.x), y: fix3(y), z: fix3(currentZ),
            w: fix3(w), h: fix3(h), d: fix3(d),
            b: color,
        });
    }
    return books;
}

// 生成 SVG 代码
function svgCodeMake(width, height, textCode, svgClearVal = 1) {  
            return svgTestCode = `
    <svg xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 ${width} ${height}"
        width="${width}" height="${height}"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="三个红色方块 与 你好啊" style="width:500px">
        <rect x="0" y="0" width="100%" height="100%" fill="rgba(0, 0, 0, 0)"/>
        <rect x="60"  y="30" width="40" height="40" fill="#e63946" rx="4"/>
        <rect x="110" y="20" width="40" height="80" fill="#e63946" rx="4"/>
        <rect x="160" y="35" width="40" height="50" fill="#e63946" rx="4"/>

        <g font-family=" 'Noto Sans SC', 'PingFang SC', 'Microsoft Yahei', 'Heiti SC', 'Source Han Sans SC', sans-serif "
            font-size="${15 * svgClearVal}"
            fill="#000"
            stroke="#000"
            stroke-width="${0.7 * svgClearVal}"
            paint-order="stroke"
            writing-mode="vertical-rl"
            text-orientation="upright"
            text-anchor="start"
            dominant-baseline="hanging">
        <text x="60" y="170">水调歌头</text>
            ${textCode}
        </g>
    </svg>
    `;  // PS：stroke 颜色，后期也可以研究一下，有用
    }

// 整格书 生成 注册函数
function registerBookshelf({ id, ref, off, maxlen = 1.05, count = 30}, currentShelfID) {
    const dirc = k.currBookDirc;
    const base = typeof ref === 'number'
        ? [ref]
        : [...k.bookContainer[ref]];
    if(dirc === 3 || dirc === 4 || dirc === 2) {  // 对称到对面、对称到另一侧、对称到对面，的情况
        if(off[1] === 'z' && (dirc === 3 || dirc === 4)){  // 中轴线另侧的 Z 方向，要反向
            off[0] = -off[0];
        }
        if(dirc === 2 || dirc === 4) {  // 对称型
            if(off[1] === 'x'){
                off[0] = -off[0];
            }
            if(off[3] === 'x'){
                off[2] = -off[2];
            }
        }
        k.bookContainer[`n${id}`] = offset(base, off[0], 2, off[1], off[2], off[3]);  // 偏移操作，生成新书格，第一本书
    } else {
        k.bookContainer[`n${id}`] = offset(base, off[0], 2, off[1], off[2], off[3]);  // 偏移操作，生成新书格，第一本书
    }
    const firstBook = cubeDatas[k.bookContainer[`n${id}`][0]];  // 得到 新书格 第一本书的数据  // 未来可以考虑 哈希表
    const bookSet = fillBooks({ ...firstBook, seed: currentShelfID + id }, dirc, maxlen, count);  // 生成整格数据
    if(dirc === 2 || dirc === 3) {  // 对称到另一侧、对称到对面，的情况
        const off = (dirc === 2) ? 1 : -1;
        for(let i = 0; i < bookSet.length; i++){  // 对称到另一侧的情况，要 Z 平移一下，看起来更自然一点
            bookSet[i].z += off * 0.03;
        }
    }
    for (const book of bookSet) {  // 推入数据流
        k.bookDataInsTemp.push({ ...book, st: 1 }); // st:1 表示静态书
    }
    k.bookDataInsTemp.push({del:1}); // 方便检索数据，按书格添加 del
}

const pool = "憨狗担友号显却监材且春居适除红半买充陈火搞";
const poolLen = pool.length;
const randCN = () => {  // 输出 1~8 位随机字符
    let len = (Math.random() * 5 | 0) + 4;
    let s = '';
    for (let i = 0; i < len; i++) s += pool[Math.random() * poolLen | 0];
    return s;
}

// 生成 SVG 里的文字代码
function svgTextCodeBuild(param = { x, y, w_z, w_y, data, svgWidth, svgClearVal }) {
    const dirc = k.currBookDirc;
    let { x, y, w_z, w_y, data, svgWidth, svgClearVal } = param;
    let flip = 1, off = 10;

    if (dirc === 2) {  //+ 处理对称
        flip = -1;
        off = -5;
    } else if (dirc === 4) {
        flip = -1;
        svgWidth = 0;
        off = -130;
    } else if (dirc === 1) {
        svgWidth = 0;
    } else if (dirc === 3) {
        off = -115;
    }
    const texts = new Array(data.length); // 预分配数组
    for (let i = 0; i < data.length; i++) {
        const x1 = fix3(data[i].z - w_z) * 1000;
        const y1 = fix3(data[i].y - w_y) * 1000;
        const result_x = (svgWidth + (x + x1 + off) * flip) * svgClearVal;
        texts[i] = `<text x="${result_x}" y="${((y - y1 + 20)) * svgClearVal}">${randCN() + ' ' + i}</text>`;
    }
    return texts.join('');
};

// 计算 2 维距离
function dist2D(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

// // 调试使用，按下 R 键渲染 svg
// let mKeyPressed = false;
// document.addEventListener('keydown', e => {
//     if ((e.key === 'r' || e.key === 'R') && !mKeyPressed) {
//         mKeyPressed = true;
//         doSomething();
//     }
// });
// document.addEventListener('keyup', e => {
//     if (e.key === 'r' || e.key === 'R') {
//         mKeyPressed = false;
//     }
// });
// function doSomething() {
//     // console.log('执行 M 事件逻辑');
//     k.myRestDoFunc();
// }