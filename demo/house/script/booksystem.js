/**
 * 图书模型生成系统
 * @param {*} shelfID 书架定位书的 index
 * @param {*} dirc 方向，原版1、镜像2、对称3、对称镜像4
 * @param {*} type 使用哪个规则生成 第一楼统一样式1、第二楼统一样式2
 */
function bookSystem(shelfID = 103, dirc = 1, type = 1) {  // 书 系统
    const noBookRender = document.getElementById('noBookRender').checked;  // 关闭书本渲染
    if(noBookRender) return;
    hiddenBookSub(shelfID);  // 隐藏假书
    k.bookContainer = {};    // 初始化 书 容器，临时储存 ID 使用
    k.bookDataInsTemp = [];      // 书的实例数据，会由 registerBookshelf 生成
    k.currBookDirc = dirc;   // 保存当前方向
    let bookDataIns = k.bookShelfInsData.get(shelfID);  // 书的实例数据
    const mvpPos = k.mainVPlayer.body.position;
    const shelfInfo = cubeDatas[shelfID];
    const bassY = shelfInfo.y;  // Y 基准值

    if(bookDataIns === undefined){  // 该书架没有 ins 数据，生成

        // 生成书的实例模型
        if(true){
            const shelfDefs = getshelfDefs(type, shelfID);  // 获取书架规则表
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
                const currIndex = k.addTABox({
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
                const org_args = k.indexToArgs.get(currIndex);
                org_args.book = {  // 用于，光标寻书时，定位书目的线索
                    _shelf : shelfID,
                    _index: index,
                    _type: type,
                };
            }
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

    // svg 内容
    if(true){
        let currentZ, flip;

        // 根据 type 和 dirc 计算翻转和 Z 值，供 webgl 使用
        if(true){
            const baseZMap = {
                1: -19.478,  // 一楼书架
                2: -19.88,   // 二楼书架
                3: -19.88,   // 二楼长书架
                4: -26.093,  // 二楼廊柜
                5: -30,
            };
            if (baseZMap[type]) {
                const baseZ = baseZMap[type];
                const isMirror = dirc === 2 || dirc === 4;
                const isSymmetric = dirc === 3 || dirc === 4;
                flip = isMirror ? -1 : 1;
                currentZ = isSymmetric ? baseZ - (baseZ - -30) * 2 : baseZ;
            }
        }

        let upSvgPng, downSvgPng;
        upSvgPng = k.textureMap.get('upSvgPng' + shelfID);
        downSvgPng = type === 1 ? k.textureMap.get('downSvgPng' + shelfID) : 1;  // 只有一楼书架，才有下书架
        const shelfDefsX = cubeDatas[shelfID].x;

        // 有数据，直接上 webgl
        if(upSvgPng && downSvgPng){
            const typeConfig = {  // 定义各类型的书架参数
                1: [  // 一楼书架（上下两层）
                    { name: 'bookupsvg', y: 2.681, w: 7.4, h: 0.94, offsetX: -0.076, t: () => upSvgPng },
                    { name: 'bookdownsvg', y: 1.75,  w: 7.4, h: 0.935, offsetX: -0.377, t: () => downSvgPng },
                ],
                2: [  // 二楼书架
                    { name: 'bookupsvg', y: bassY + 0.067, w: 6.625, h: 2.501, offsetX: -0.076, t: () => upSvgPng },
                ],
                3: [  // 二楼长书架
                    { name: 'bookupsvg', y: bassY + 0.067, w: 6.625, h: 2.501, offsetX: -0.076, t: () => upSvgPng },
                ],
                4: [  // 二楼廊柜
                    { name: 'bookupsvg', y: bassY - 0.106, w: 3.749, h: 2.1, offsetX: -0.076, t: () => upSvgPng },
                ],
                5: [  // 二楼廊柜 中央柜
                    { name: 'bookupsvg', y: bassY - 0.106, w: 3.749, h: 2.1, offsetX: -0.076, t: () => upSvgPng },
                ],
            };

            const configs = typeConfig[type];  // 获取该 type 书架的 svg 绘制配置
            if (configs) {
                for (const cfg of configs) {
                    k.W.plane({
                        n: cfg.name + shelfID,
                        x: shelfDefsX + cfg.offsetX * flip,
                        y: cfg.y,
                        z: currentZ,
                        w: cfg.w,
                        h: cfg.h,
                        ry: -90 * flip,
                        t: cfg.t(),
                    });
                }
            }
        } else {  // 没有数据，生成和渲染 svg
            
            let textureAlp;
            const svgClearVal = 0.85;  // 清晰度

            const baseZmap = {  // 基准 Z 表（神秘 Z 值）
                2: {1:-23.121,2:-23.895,3:-36.085,4:-36.86},
                3: {1:-23.121,2:-23.895,3:-36.085,4:-36.86},
                4: {1:-27.894,2:-31.546,3:-28.433,4:-32.085},
                5: {1:-31.8 - 0.001,2:-35.453},
            };

            // 计算 textureAlp（送给 openworld.js 去渲染 img 的数据）
            switch(type){
                case 1: { // 一楼书架，上下两层
                    const baseZ = (dirc===3||dirc===4)?-36.884:-23.116;
                    Promise.all([
                        svgTextCodeBuild({x:60,y:170,w_z:baseZ,w_y:2.898,data:bookDataIns.slice(0,681),svgWidth:7400,svgClearVal,sId:shelfID,tp:1}),
                        svgTextCodeBuild({x:77,y:282,w_z:baseZ+0.018,w_y:1.853,data:bookDataIns.slice(681),svgWidth:7400,svgClearVal,sId:shelfID,tp:2})
                    ]).then(([upTxt, dnTxt]) => {
                        textureAlp = [
                            { id: `upSvgPng${shelfID}`, type: 'svg', svgCode: svgCodeMake(7400*svgClearVal,940*svgClearVal, upTxt, svgClearVal) },
                            { id: `downSvgPng${shelfID}`, type: 'svg', svgCode: svgCodeMake(7400*svgClearVal,935*svgClearVal, dnTxt, svgClearVal) }
                        ];
                    });
                    break;
                }
                case 2: case 3: { // 二楼普通 / 长书架
                    const z = baseZmap[type][dirc];
                    const thistp = (type === 2) ? 3 : 4;

                    Promise.all([
                        svgTextCodeBuild({x:70,y:185,w_z:z,w_y:bassY+1.049,data:bookDataIns,svgWidth:7400,svgClearVal,sId:shelfID,tp:thistp})
                    ]).then(([txt]) => {
                        textureAlp = [{id:`upSvgPng${shelfID}`,type:'svg',svgCode:svgCodeMake(6625*svgClearVal,2501*svgClearVal,txt,svgClearVal)}];
                    })
                    break;
                }
                case 4: { // 二楼廊柜
                    const z = baseZmap[4][dirc];
                    Promise.all([
                        svgTextCodeBuild({x:70,y:185,w_z:z,w_y:bassY+0.67,data:bookDataIns,svgWidth:7400,svgClearVal,sId:shelfID,tp:5})
                    ]).then(([txt]) => {
                        textureAlp = [{id:`upSvgPng${shelfID}`,type:'svg',svgCode:svgCodeMake(3749*svgClearVal,2100*svgClearVal,txt,svgClearVal)}];
                    })
                    break;
                }
                case 5: { // 二楼廊柜
                    const z = baseZmap[5][dirc];
                    
                    Promise.all([
                        svgTextCodeBuild({x:70,y:185,w_z:z,w_y:bassY+0.67,data:bookDataIns,svgWidth:7400,svgClearVal,sId:shelfID,tp:5})
                    ]).then(([txt]) => {
                        textureAlp = [{id:`upSvgPng${shelfID}`,type:'svg',svgCode:svgCodeMake(3749*svgClearVal,2100*svgClearVal,txt,svgClearVal)}]
                    })
                    break;
                }
            }

            const renderSvg = () => {  // 挂载到【任务队列模式】的内容，人物静止时执行
                
                const xDistence = Math.abs(mvpPos.x - shelfInfo.x);
                const yDistence = Math.abs(mvpPos.y - shelfInfo.y);
                if(xDistence > 3 || yDistence > 1.5){  // 距离过远，不渲染，同时删除
                    k.myRestDoFunc.add(renderSvg);
                    return 0
                }
                k.loadTexture(textureAlp).then(v => {
                    const shelfMap = {  // 不同 type 的渲染配置
                        1: [
                            {id:'up',   y:2.681, xOff:-0.076, w:7.4, h:0.94},
                            {id:'down', y:1.75,  xOff:-0.377, w:7.4, h:0.935},
                        ],
                        2: [{id:'up', y:bassY + 0.067, xOff:-0.076, w:6.625, h:2.501}],
                        3: [{id:'up', y:bassY + 0.067, xOff:-0.076, w:6.625, h:2.501}],
                        4: [{id:'up', y:bassY - 0.106, xOff:-0.076, w:3.749, h:2.1}],
                        5: [{id:'up', y:bassY - 0.106, xOff:-0.076, w:3.749, h:2.1}],
                    };

                    (shelfMap[type] || []).forEach(v=>{  // 渲染书架贴图
                        const tex = k.textureMap.get(`${v.id}SvgPng${shelfID}`);
                        if(!tex) return;
                        k.W.plane({
                            n: `book${v.id}svg${shelfID}`,
                            x: shelfDefsX + v.xOff * flip,
                            y: v.y, z: currentZ,
                            w: v.w, h: v.h,
                            ry: -90 * flip,
                            t: tex,
                        });
                    });
                });
            }

            k.myRestDoFunc.add(renderSvg);  // 挂载到【任务队列模式】
        }
    }
}


/*-------------*/



// 为每本书都注册一下渲染和显示事件，也就是在激活时执行 bookSystem， 删除时 removeBookShelf
function bookSysRegis(){
    k.bookShelfInsData = new Map();
    const get = k.indexToArgs.get.bind(k.indexToArgs);

    const bindFuncs = (v, dir, type=1) => {
        const o = get(v);
        o.activeFunc = () => bookSystem(v, dir, type);
        o.deleteFunc = () => removeBookShelf(v);
    };

    const regisFloor = (floor, type=1) => {
        [1,2,3,4].forEach(dir => (
            floor[`dire${dir}`]||[]).forEach(
                v => bindFuncs(v, dir, type)
            )
        );
    }

    regisFloor(k.bookS.floor1, 1);  // 一楼
    regisFloor(k.bookS.floor2, 2);   // 统柜
    regisFloor(k.bookS.floor2.cdbook, 3);  // 长柜
    regisFloor(k.bookS.floor2.LGbook, 4);  // 廊柜
    regisFloor(k.bookS.floor2.LGCbook, 5);  // 廊柜 中央柜

    // --- 三楼以及以上
    regisFloor(k.bookS.floor3, 2);   // 统柜
    regisFloor(k.bookS.floor3.cdbook, 3);   // 长柜
    regisFloor(k.bookS.floor3.LGbook, 4);   // 廊柜
    regisFloor(k.bookS.floor3.LGCbook, 5);   // 廊柜
}


// 隐藏假书（当主角走近时），也可恢复原样
function hiddenBookSub(index, isRecover = false){
    const getBookSub = k.bookS.bookSub['s'+index];
    if(getBookSub){
        if(isRecover === false){  // 软删除
            getBookSub.forEach((v, i) => {
                k.W.updateInstance('manyCubes', v, {y:-100});
            });
        } else {  // 恢复原样
            getBookSub.forEach((v, i) => {
                k.W.updateInstance('manyCubes', v, {y:cubeDatas[v].y});
            });
        }
    }
}

// 当主角走远后，临时卸载书架内容
function removeBookShelf(shelfID){
    k.W.delete('booksInsDisplay' + shelfID);
    k.W.delete('bookupsvg' + shelfID);
    k.W.delete('bookdownsvg' + shelfID);
    hiddenBookSub(shelfID, true);
}
