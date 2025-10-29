
/**
 * 图书模型生成系统
 * @param {*} shelfID 书架定位书的 index
 * @param {*} dirc 方向，原版1、镜像2、对称3、对称镜像4
 * @param {*} type 使用哪个规则生成 第一楼统一样式1、第二楼统一样式2
 */
function bookSystem(shelfID = 103, dirc = 1, type = 1) {  // 书 系统
    k.bookContainer = {};    // 初始化 书 容器，临时储存 ID 使用
    k.bookDataInsTemp = [];      // 书的实例数据，会由 registerBookshelf 生成
    k.currBookDirc = dirc;   // 保存当前方向
    let bookDataIns = k.bookShelfInsData.get(shelfID);  // 书的实例数据
    const mvpPos = k.mainVPlayer.body.position;
    const shelfInfo = cubeDatas[shelfID];

    if(bookDataIns === undefined){  // 该书架没有 ins 数据，生成（先不考虑 svg）

        // 生成书
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

        // 类型 1，一楼书架（目前想的就是，把 5 个类型，一口气全搞完吧，最后稳定了，再优化缩减代码.... 反正也不影响性能）
        if (type === 1) {
            flip = 1;  //+ 几行兼容不同朝向的数据
            currentZ = -19.478;
            if(dirc === 2){ flip = -1 }
            if(dirc === 4){ flip = -1 }
            if(dirc === 3 || dirc === 4){ currentZ = -19.478 - (-19.478 - (-30)) * 2 }  // 对称过来了 
        }

        // 类型 2，二楼书架
        if (type === 2 || type === 3 || type === 4) {
            flip = 1;  //+ 几行兼容不同朝向的数据
            currentZ = -19.88;
            if(dirc === 2){ flip = -1 }
            if(dirc === 4){ flip = -1 }
            if(dirc === 3 || dirc === 4){ currentZ = -19.88 - (-19.88 - (-30)) * 2 }  // 对称过来了 
        }

        // 类型 4，二楼书架廊柜
        if (type === 2 || type === 3 || type === 4) {
            flip = 1;  //+ 几行兼容不同朝向的数据
            currentZ = -26.093;
            if(dirc === 2){ flip = -1 }
            if(dirc === 4){ flip = -1 }
            if(dirc === 3 || dirc === 4){ currentZ = -19.88 - (-19.88 - (-30)) * 2 }  // 对称过来了 
        }


        const shelfDefsX = cubeDatas[shelfID].x;

        let upSvgPng, downSvgPng;

        // 类型 1，一楼书架
        if(type === 1){
            upSvgPng = k.textureMap.get('upSvgPng' + shelfID);
            downSvgPng = k.textureMap.get('downSvgPng' + shelfID);
        }

        // 类型 2，二楼书架
        if(type === 2 || type === 3 || type === 4){
            upSvgPng = k.textureMap.get('upSvgPng' + shelfID);
            downSvgPng = 1;
        }

        if(upSvgPng && downSvgPng){  // 有数据，直接上 webgl

            // 类型 1，一楼书架
            if(type === 1){
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

            // 类型 2，二楼书架
            if(type === 2 || type === 3 || type === 4){
                k.W.plane({  // 上大书架
                    n: 'bookupsvg' + shelfID,
                    x: shelfDefsX - 0.076 * flip, y: 5.397, z: currentZ,
                    w: 6.625, h: 2.501, 
                    ry: -90 * flip,
                    t: upSvgPng,
                });
            }
        } else {  // 没有数据，生成和渲染 svg

            let textureAlp;

            // 类型 1，一楼书架
            if(type === 1){
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
                textureAlp = [
                    { id:'upSvgPng' + shelfID, type: 'svg', svgCode: upSvg },
                    { id:'downSvgPng' + shelfID, type: 'svg', svgCode: downSvg },
                ];
            }

            // 类型 2，二楼书架
            if(type === 2 || type === 3){
                const svgClearVal = 1;  // 清晰度
                let baseZ;  // 不同方向的神秘 Z 基准
                if(dirc === 1){ baseZ = -23.121; }
                if(dirc === 2){ baseZ = -23.895; }
                if(dirc === 3){ baseZ = -36.085; }
                if(dirc === 4){ baseZ = -36.86; }
                const up_TextCode = svgTextCodeBuild({  // 上层 681 个，svg 字
                    x: 70, y: 185,  // 左上第三本的 svg 坐标
                    w_z: baseZ, w_y: 6.379,  // 左上第三本的 webgl 坐标
                    data: bookDataIns,
                    svgWidth: 7400, svgClearVal: svgClearVal,
                });
                const upSvg = svgCodeMake(6625 * svgClearVal, 2501 * svgClearVal, up_TextCode, svgClearVal);      // 上层的 SVG 数据
                textureAlp = [
                    { id:'upSvgPng' + shelfID, type: 'svg', svgCode: upSvg },
                ];
            }

            // 类型 4，二楼书架廊柜
            if(type === 4){
                const svgClearVal = 1;  // 清晰度
                let baseZ;  // 不同方向的神秘 Z 基准
                if(dirc === 1){ baseZ = -27.939 + 0.045; }
                if(dirc === 2){ baseZ = -23.895; }
                if(dirc === 3){ baseZ = -36.085; }
                if(dirc === 4){ baseZ = -36.86; }
                const up_TextCode = svgTextCodeBuild({  // 上层 681 个，svg 字
                    x: 70, y: 185,  // 左上第三本的 svg 坐标
                    w_z: baseZ, w_y: 5.984,  // 左上第三本的 webgl 坐标
                    data: bookDataIns,
                    svgWidth: 7400, svgClearVal: svgClearVal,
                });
                const upSvg = svgCodeMake(3749 * svgClearVal, 2100 * svgClearVal, up_TextCode, svgClearVal);      // 上层的 SVG 数据
                // console.log(upSvg);
                textureAlp = [
                    { id:'upSvgPng' + shelfID, type: 'svg', svgCode: upSvg },
                ];
            }

   
            

            const renderSvg = () => {  // 挂载到【任务队列模式】的内容，人物静止时执行

                const xzDistence = dist2D(mvpPos.x, mvpPos.z, shelfInfo.x, shelfInfo.z);  // 人物与书架的 xy 距离
                const yDistence = Math.abs(mvpPos.y - shelfInfo.y);

                if(xzDistence > 4.5 || yDistence > 1.5){  // 距离过远，不渲染，同时删除
                    k.myRestDoFunc.add(renderSvg);
                    return 0
                }

                k.loadTexture(textureAlp).then(loadedImage => {

                    // 类型 1，一楼书架
                    if(type === 1){
                        const upSvgPng_live = k.textureMap.get('upSvgPng' + shelfID);
                        const downSvgPng_live = k.textureMap.get('downSvgPng' + shelfID);
                        k.W.plane({  // 上大书架
                            n: 'bookupsvg' + shelfID,
                            x: shelfDefsX - 0.076 * flip, y: 2.681, z: currentZ,
                            w: 7.4, h: 0.94, 
                            ry: -90 * flip,
                            t: upSvgPng_live,
                        });
                        k.W.plane({  // 下小书架
                            n: 'bookdnsvg' + shelfID,
                            x: shelfDefsX - 0.377 * flip, y: 1.75, z: currentZ,
                            w: 7.4, h: 0.935, ry: -90 * flip,
                            t: downSvgPng_live,
                        });
                    }

                    // 类型 2，二楼书架
                    if(type === 2 || type === 3){
                        const upSvgPng_live = k.textureMap.get('upSvgPng' + shelfID);
                        k.W.plane({  // 上大书架
                            n: 'bookupsvg' + shelfID,
                            x: shelfDefsX - 0.076 * flip, y: 5.397, z: currentZ,
                            w: 6.625, h: 2.501, 
                            ry: -90 * flip,
                            // t: upSvgPng_live,
                        });
                    }

                    // 类型 4，二楼书架廊柜
                    if(type === 4){
                        const upSvgPng_live = k.textureMap.get('upSvgPng' + shelfID);
                        k.W.plane({  // 上大书架
                            n: 'bookupsvg' + shelfID,
                            x: shelfDefsX - 0.076 * flip, y: 5.196, z: currentZ,
                            w: 3.749, h: 2.1, 
                            ry: -90 * flip,
                            t: upSvgPng_live,
                        });
                    }
                });
            }

            k.myRestDoFunc.add(renderSvg);  // 挂载到【任务队列模式】
        }
    }
}


















// 当主角走远后，临时卸载书架内容
function removeBookShelf(shelfID){
    k.W.delete('booksInsDisplay' + shelfID);
    // k.W.delete('bookupsvg' + shelfID);
    // k.W.delete('bookdnsvg' + shelfID);
}

// 为每本书都注册一下渲染和显示事件
function bookSysRegis(){
    k.bookShelfInsData = new Map();  // 初始化 book 实例化数据表，储存已经计算好的实例数据
    
    const get = k.indexToArgs.get.bind(k.indexToArgs);
    function makeActive(v, dir){ bookSystem(v, dir); }  //+ 激活和释放函数
    function makeDelete(v){ removeBookShelf(v); }

    let floor;

    floor = k.bookS.floor1;  
    for (let dir = 1; dir <= 4; dir++) {  // 遍历 4 个方向
        const arr = floor[`dire${dir}`];
        for (let i = 0, n = arr.length; i < n; i++) {  // 遍历每个方向的数组
            const v = arr[i];  // 当前的元素 index
            const o = get(v);  // 当前的元素属性
            o.activeFunc = makeActive.bind(null, v, dir);
            o.deleteFunc = makeDelete.bind(null, v);
        }
    }

    /** ----【开始试验第二层】----- */
    // bookSystem(104, 1, 2);
    let arr;
    arr = k.bookS.floor2.dire1; // 朝向为 1
    for (let i = 0, n = arr.length; i < n; i++) {
        const v = arr[i];
        k.indexToArgs.get(v).activeFunc = (i)=>{
            bookSystem(v, 1, 2); 
        } 
        k.indexToArgs.get(v).deleteFunc = (i)=>{
            removeBookShelf(v); 
        } 
    }

    arr = k.bookS.floor2.dire2; // 朝向为 2
    for (let i = 0, n = arr.length; i < n; i++) {
        const v = arr[i];
        k.indexToArgs.get(v).activeFunc = (i)=>{
            bookSystem(v, 2, 2); 
        } 
        k.indexToArgs.get(v).deleteFunc = (i)=>{
            removeBookShelf(v); 
        } 
    }

    arr = k.bookS.floor2.dire3; // 朝向为 3
    for (let i = 0, n = arr.length; i < n; i++) {
        const v = arr[i];
        k.indexToArgs.get(v).activeFunc = (i)=>{
            bookSystem(v, 3, 2); 
        } 
        k.indexToArgs.get(v).deleteFunc = (i)=>{
            removeBookShelf(v); 
        } 
    }

    arr = k.bookS.floor2.dire4; // 朝向为 4
    for (let i = 0, n = arr.length; i < n; i++) {
        const v = arr[i];
        k.indexToArgs.get(v).activeFunc = (i)=>{
            bookSystem(v, 4, 2); 
        } 
        k.indexToArgs.get(v).deleteFunc = (i)=>{
            removeBookShelf(v); 
        } 
    }
    
    /** ----【试验长柜，类型 3】----- */
    bookSystem(k.bookS.floor2.cdbook, 1, 3);  // 朝向 1
    bookSystem(k.bookS.floor2.cdbookdire2[0], 2, 3);  // 朝向 2
    bookSystem(k.bookS.floor2.cdbookdire3[0], 3, 3);  // 朝向 3
    bookSystem(k.bookS.floor2.cdbookdire4[0], 4, 3);  // 朝向 4

    /** -----【试验廊柜，类型 4】------ */
    bookSystem(106, 1, 4);
}