
/**
 * 图书模型生成系统
 * @param {*} shelfID 书架定位书的 index
 * @param {*} dirc 方向，原版1、镜像2、对称3、对称镜像4
 * @param {*} type 使用哪个规则生成 第一楼统一样式1、第二楼统一样式2
 */
function bookSystem(shelfID = 103, dirc = 1, type = 1) {  // 书 系统
    // console.time('book');

    k.bookContainer = {};    // 初始化 书 容器，临时储存 ID 使用
    k.bookDataInsTemp = [];      // 书的实例数据，会由 registerBookshelf 生成
    k.currBookDirc = dirc;   // 保存当前方向
    let bookDataIns = k.bookShelfInsData.get(shelfID);  // 书的实例数据

    if(bookDataIns === undefined){  // 该书架没有 ins 数据，生成（先不考虑 svg）

        // 生成书
        if(true){
            const shelfDefs = getshelfDefs(1, shelfID);  // 获取书架规则表
            for (let i = 0, len = shelfDefs.length; i < len; i++) {
                const def = shelfDefs[i];
                registerBookshelf(def, shelfID);
            }
            k.bookShelfInsData.set(shelfID, k.bookDataInsTemp);  // 保存数据，也意味着以后不用再生成了，可以在主函数里判断了
            bookDataIns = k.bookShelfInsData.get(shelfID);
            k.bookDataInsTemp = [];  //+ 清空临时数据
            k.bookContainer = null;
        }

        // 将 book 数据，写入 openworld 档案
        if(true){
            for (let index = 0; index < bookDataIns.length; index++) {  // 为「实例」加上简单的物理引擎
                k.addTABox({
                    DPZ : 5,
                    isPhysical: false,
                    background: '#f6a1a1ff',
                    X: bookDataIns[index].x,
                    Y: bookDataIns[index].y,
                    Z: bookDataIns[index].z,
                    width: bookDataIns[index].w,
                    depth: bookDataIns[index].d,
                    height: bookDataIns[index].h,
                    rX: bookDataIns[index].rx,
                    rY: bookDataIns[index].ry,
                    rZ: bookDataIns[index].rz,
                    isInvisible: true,  // 只被探测，而不可见
                });
            }
        }

        // k.myRestDoFunc.add(()=>{console.log('生成svg，函数', shelfID)});

        // （没有数据）SVG 生成
        if(true){
            const svgClearVal = 1;  // 清晰度
            const baseZ = (dirc === 3 || dirc === 4) ? -36.884 : -23.116;  // 基准 Z 值，定位 svg 文本
            const up_TextCode = svgTextCodeBuild({  // 上层 681 个，svg 字
                x: 60, y: 170, w_z: baseZ, w_y: 2.898, data: bookDataIns.slice(0, 681),
                svgWidth: 7400, svgClearVal: svgClearVal,
            });  
            const down_TextCode = svgTextCodeBuild({  // 下层 其余的，svg 字
                x: 77, y: 282, w_z: baseZ + 0.018, w_y: 1.853, data: bookDataIns.slice(681, bookDataIns.length),
                svgWidth: 7400, svgClearVal: svgClearVal,
            })
            const upSvg = svgCodeMake(7400 * svgClearVal, 940 * svgClearVal, up_TextCode, svgClearVal);      // 上层的 SVG 数据
            const downSvg = svgCodeMake(7400 * svgClearVal, 935 * svgClearVal, down_TextCode, svgClearVal);  // 下层的 SVG 数据
            // console.log(upSvg);
            const textureAlp = [
                { id:'upSvgPng' + shelfID, type: 'svg', svgCode: upSvg },
                { id:'downSvgPng' + shelfID, type: 'svg', svgCode: downSvg },
            ];
            const shelfDefsX = cubeDatas[shelfID].x;
            k.myRestDoFunc.add(()=>{
                k.loadTexture(textureAlp).then(loadedImage => {
                    console.log('实时生成的 svg ' + shelfID);
                    const upSvgPng = k.textureMap.get('upSvgPng' + shelfID);
                    const downSvgPng = k.textureMap.get('downSvgPng' + shelfID);
                    let flip = 1;
                    if(dirc === 2){ flip = -1 }
                    if(dirc === 4){ flip = -1 }
                    let currentZ = -19.478;
                    if(dirc === 3 || dirc === 4){ currentZ = -19.478 - (-19.478 - (-30)) * 2 }  // 对称过来了 
                    k.W.plane({  // 上大书架
                        n: 'bookupsvg' + shelfID,
                        x: shelfDefsX - 0.076 * flip, y: 2.681, z: currentZ,
                        w: 7.4, h: 0.94, 
                        ry: -90 * flip,
                        t: upSvgPng,
                    });
                    k.W.plane({  // 下小书架
                        n: 'bookdnsvg' + shelfID,
                        x: shelfDefsX - 0.377 * flip, y: 1.75, z: currentZ,
                        w: 7.4, h: 0.935, ry: -90 * flip,
                        t: downSvgPng,
                    });
                });
            });
            
        }
    } else {  // 有数据模式

        // （已经有数据了）svg 展示
        if(true){
            // console.log('现成的 svg');
            const shelfDefsX = cubeDatas[shelfID].x;
            const upSvgPng = k.textureMap.get('upSvgPng' + shelfID);
            const downSvgPng = k.textureMap.get('downSvgPng' + shelfID);
            let flip = 1;
            if(dirc === 2){ flip = -1 }
            if(dirc === 4){ flip = -1 }
            let currentZ = -19.478;
            if(dirc === 3 || dirc === 4){ currentZ = -19.478 - (-19.478 - (-30)) * 2 }  // 对称过来了 
            k.W.plane({  // 上大书架
                n: 'bookupsvg' + shelfID,
                x: shelfDefsX - 0.076 * flip, y: 2.681, z: currentZ,
                w: 7.4, h: 0.94, 
                ry: -90 * flip,
                t: upSvgPng,
            });
            k.W.plane({  // 下小书架
                n: 'bookdnsvg' + shelfID,
                x: shelfDefsX - 0.377 * flip, y: 1.75, z: currentZ,
                w: 7.4, h: 0.935, ry: -90 * flip,
                t: downSvgPng,
            });
        }
    }

    // 渲染实例化
    if(true){
        k.W.cube({
            n: 'booksInsDisplay' + shelfID,
            instances: bookDataIns, // 实例属性的数组
            t: greenStoneborder,
            mix: 0.8,
        });
    }

    // console.timeEnd('book');
}


// 当主角走远后，临时卸载书架内容
function removeBookShelf(shelfID){
    k.W.delete('booksInsDisplay' + shelfID);
    k.W.delete('bookupsvg' + shelfID);
    k.W.delete('bookdnsvg' + shelfID);
}

// 为每本书都注册一下渲染和显示事件
function bookSysRegis(){
    k.bookShelfInsData = new Map();  // 初始化 book 实例化数据表，储存已经计算好的实例数据，也用于判断该书架有没有被初始化过

    let arr;

    arr = [103, 184, 262, 340, 418, 496];  // 朝向为 1
    for (let i = 0, n = arr.length; i < n; i++) {
        const v = arr[i];
        k.indexToArgs.get(v).activeFunc = (i)=>{  // 激活函数
            bookSystem(v, 1);
        }
        k.indexToArgs.get(v).deleteFunc = (i)=>{  // 删除函数
            removeBookShelf(v);
        }
    }

    arr = [130, 157, 235, 313, 391, 469];  // 朝向为 2
    for (let i = 0, n = arr.length; i < n; i++) {
        const v = arr[i];
        k.indexToArgs.get(v).activeFunc = (i)=>{  // 激活函数
            bookSystem(v, 2);
        }
        k.indexToArgs.get(v).deleteFunc = (i)=>{  // 删除函数
            removeBookShelf(v);
        }
    }

    arr = [891, 813, 735, 657, 579, 969];  // 朝向为 3
    for (let i = 0, n = arr.length; i < n; i++) {
        const v = arr[i];
        k.indexToArgs.get(v).activeFunc = (i)=>{  // 激活函数
            bookSystem(v, 3);
        }
        k.indexToArgs.get(v).deleteFunc = (i)=>{  // 删除函数
            removeBookShelf(v);
        }
    }

    arr = [942, 552, 630, 708, 786, 864];  // 朝向为 4
    for (let i = 0, n = arr.length; i < n; i++) {
        const v = arr[i];
        k.indexToArgs.get(v).activeFunc = (i)=>{  // 激活函数
            bookSystem(v, 4);
        }
        k.indexToArgs.get(v).deleteFunc = (i)=>{  // 删除函数
            removeBookShelf(v);
        }
    }
}

/**** -----[ 下面都是函数或变量库了...... 不要太去管了啊啊 ]----- */

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
                currentZ = prev.z - (prev.d / 2 + d / 2);
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
        const off = (dirc === 2) ? 0.1 : -0.1;
        for(let i = 0; i < bookSet.length; i++){  // 对称到另一侧的情况，要 Z 平移一下，看起来更自然一点
            bookSet[i].z += off;
        }
    }
    for (const book of bookSet) {  // 推入数据流
        k.bookDataInsTemp.push({ ...book, st: 1 }); // st:1 表示静态书
    }
    k.bookDataInsTemp.push({del:1}); // 方便检索数据，按书格添加 del
}

const pool = "憨狗天地玄黄宇宙洪荒月盈昃辰宿列张寒来暑往秋收冬藏";
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