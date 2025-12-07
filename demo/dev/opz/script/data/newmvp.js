/**
 * 创建一个新人物
 */
function newMvp(){
    const mainVPSize = 0.5;  // 主角的大小，方便建造
    k.W.cube({  // 隐藏显示原主角
        n:'mainPlayer',
        hidden: true,
        size: mainVPSize,
    });
    k.W.sphere({  // 主角的头
        g:'mainPlayer', n:'mvp_head',
        y: 0.82, x: 0, z: 0, s: 1, size: 0.5,
    });
    k.W.cube({  // 主角的脖子
        g:'mainPlayer', n:'mvp_neck', y: 0.6,
        x: 0, z: 0, w:0.1,  h:0.1,  d:0.1,
    });
    k.W.cube({  // 主角的身体
        g:'mainPlayer', n:'mvp_body', y: 0.3, x: 0,
        z: 0, w:0.6,  h:0.5,  d:0.1,
    });
    // 关节
    k.W.cube({  // 关节：主角的右胳膊
        g:'mainPlayer',
        n:'joint_test', y: 0.47, x: 0.30, z: 0,
        rz:15, ry:0, w:0.1,  h:0.1,  d:0.1, 
    });
    k.W.cube({  // 主角的右胳膊
        g:'joint_test', n:'aaa', y: -2,
        x: 0, z: 0, rz:0, w:1,  h:5,  d:1,
    });
    // 关节
    k.W.cube({  // 关节：主角的右胳膊
        g:'mainPlayer', n:'joint_test_left', y: 0.47, x: -0.30,
        z: 0, rz:-15, ry:0, w:0.1,  h:0.1,  d:0.1, 
    });
    k.W.cube({  // 主角的右胳膊
        g:'joint_test_left',
        n:'bbb', y: -2, x: 0, z: 0, rz:0, w:1,  h:5,  d:1,
    });
    // 关节
    k.W.cube({  // 关节：主角的右腿
        g:'mainPlayer',
        n:'joint_test_right_leg',
        y: 0.1, x: 0.15, z: 0, w:0.1,  h:0.1,  d:0.1,
    });
    k.W.cube({  // 主角的右腿
        g:'joint_test_right_leg',
        n:'rightleg',
        y: -3, x: 0, z: 0, rz:0, w:1,  h:6,  d:1,
    });
    // 关节
    k.W.cube({  // 关节：主角的左腿
        g:'mainPlayer',
        n:'joint_test_left_leg',
        y: 0.1, x: -0.15, z: 0, 
        w:0.1,  h:0.1,  d:0.1,
    });
    k.W.cube({  // 主角的右腿
        g:'joint_test_left_leg', n:'leftleg', y: -3,
        x: 0, z: 0, rz:0, w:1,  h:6,  d:1,
    });

// ======================== 实验区 ===================================

    // 特殊队列，试一下吧
    function specialQueue(interval = 200) {

        const queue = [];
        let isRunning = false;

        function runNext() {
            if (queue.length === 0) {
                isRunning = false;
                return;
            }

            isRunning = true;

            const fn = queue.shift(); // 取出第一个
            try {
                fn();
            } catch (e) {
                console.error("specialQueue function error:", e);
            }

            // 下一个函数在 200ms 后执行
            setTimeout(runNext, interval);
        }

        return {
            add(fn) {
                if (typeof fn !== "function") return;
                queue.push(fn);
                if (!isRunning) runNext();
            }
        };
    }
    const q = specialQueue(2000);
    // q.add( ()=>{console.log(1)} );
    // q.add( ()=>{console.log(2)} );
    // q.add( ()=>{console.log(3)} );

    q.add()

    // 生成供 build 插件使用的数据
    if(1){
        const buildCubeData = new Array();
        const buildLen = 9500;  // 保险一点
        for(let i = 0; i < buildLen; i++){  // 生成原始数据
            buildCubeData[i] =  {
                "x": 9999999,
                "y": -9999999,
                "z": 9999999,
                "w": 0.00001,
                "h": 0.00001,
                "d": 0.00001,
                "dz": 0,  // dpz 先设置成 0 ，方便调试
            };
        }
        k.visCubeLen = -1;  // 建造器设置 index 使用
        const id = dataProc.process(buildCubeData, {x:0}, dls);
        k.centerDot.init.wskId = id;
    }

    // 得到图书馆数据
    let get2data;  // 数据容器
    if(1){
        logicFunc(testcubedata)
        const getdata = logicData(testcubedata);  // 图书馆源数据
        function analyzeTexture(myData){  // 分离不同的 t
            const result = new Array();
            const len = myData.length;
            for(let i = 0; i < len; i++){
                const obj = myData[i];
                const texture = obj?.t ?? 0;
                if(result[texture] === undefined){
                    result[texture] = [];
                }
                result[texture].push(obj);
            }
            return result;
        }
        get2data =  analyzeTexture(getdata);  // 得到不同纹理的 3 份数据
    }



    // 定位块 的业务逻辑
    if(1){

        window.mvppos = -1;

        let x, m, m2, l, ll;  // 分别对应 宝石、木板、小屋、天际线 的 wsk idx
        const x_m = get2data[0];  //+ 四种规格对应的模型文件
        const m_m = get2data[2];
        const m2_m = get2data[3];
        const l_m =  [{"x":32.557,"y":9.101,"z":29.457,"w":36,"h":17,"d":30,b:"#ff0000ff"}];
        const ll_m = [{"x":32.557,"y":9.101,"z":29.457,"w":20,"h":17,"d":60,b:"#110d07ff"}];

        const posChangeFunc = (pos) => {
            const  last = mvppos;

            mvppos = pos;
            switch (mvppos) {
                case 1:

                    console.log('宝石');
                    if(!x){
                        x = dataProc.process(x_m, {z:60}, dls);  // 放置宝石
                        // console.log(x);
                    }
                    if(!m){
                        m = dataProc.process(m_m, {z:60}, dls);
                        // console.log(m);
                    }
                    if(!m2){
                        m2 = dataProc.process(m2_m, {z:60}, dls);
                        // console.log(m2);
                    }

                    if(l){
                        // console.log(l);
                        k.deleteModBlock(l);
                        l = null;
                    }

                    break;
                case 2:
                    console.log('木板');

                    if(!m){
                        m = dataProc.process(m_m, {z:60}, dls);
                        // console.log(m);
                    }
                    if(!m2){
                        m2 = dataProc.process(m2_m, {z:60}, dls);  
                        // console.log(m2);
                    }

                    if(x){
                        // console.log(x);
                        k.deleteModBlock(x);
                        x = null;
                    }

                    if(l){
                        k.deleteModBlock(l);
                        l = null;
                    }


                    break;
                case 3:

                    console.log('小屋');
                    if(!l){
                        l = dataProc.process(l_m, {z:60}, dls);
                    }

                    if(x){
                        k.deleteModBlock(x);
                        x = null;
                    }
                    if(m){
                        k.deleteModBlock(m);
                        m = null;
                    }
                    if(m2){
                        k.deleteModBlock(m2);
                        m2 = null;
                    }


                    // l = dataProc.process(l_m, {z:60}, dls);  // 放置小屋
                    // if(ll){
                    //     k.deleteModBlock(ll);
                    // }

                    // if(!l){
                    //     l = dataProc.process(l_m, {z:60}, dls);  
                    // }
                    // if(x){
                    //     k.deleteModBlock(x);
                    //     x = null;
                    // }
                    // if(m){
                    //     k.deleteModBlock(m);
                    //     m = null;
                    // }
                    // if(l){
                    //     k.deleteModBlock(l);
                    //     l = null;
                    // }

                    break;
                case 4:

                    // console.log('天际线');
                    // ll = dataProc.process(ll_m, {z:60}, dls);  // 放置天际线

                    break;
            }
        }

        // 外墙和简模(目前的逻辑，在正常行走内，无误。若角色直接穿越，则会 bug，先不理会)
        if(1){

            if(1){
                const data = [{"x":32.557,"y":1.5,"z":29.457,"w":0.5,"h":0.5,"d":0.5}];  // 花瓶定位块
                data[0].dz = 3;
                const testwsk = dataProc.process(data, {x:0}, dls);
                k.indexToArgs.get(testwsk + 0).activeFunc = () => {  // 近景
                    if(mvppos === 2){
                        posChangeFunc(1);
                    }
                }
                k.indexToArgs.get(testwsk + 0).deleteFunc = () => {  // 删除
                    if(mvppos === 1){
                        posChangeFunc(2);
                    }
                }
            }

            if(1){
                const posBlockMiddle = [{"x":32.557,"y":1.5,"z":29.457,"w":0.5,"h":50.5,"d":0.5}];  // 雨林定位块
                posBlockMiddle[0].dz = 2;
                const posBlockMiddleIdx = dataProc.process(posBlockMiddle, {x:0}, dls);
                k.indexToArgs.get(posBlockMiddleIdx + 0).activeFunc = () => {
                    posChangeFunc(2);
                }
                k.indexToArgs.get(posBlockMiddleIdx + 0).deleteFunc = () => {
                    if(mvppos === 2){
                        posChangeFunc(3);
                    }
                    
                }
            }



            if(false){
                const posBlockLarge = [{"x":32.557,"y":1.5,"z":29.457,"w":0.5,"h":0.5,"d":0.5}];  // 星光定位块
                posBlockLarge[0].dz = 1;
                const posBlockLargeIdx = dataProc.process(posBlockLarge, {x:0}, dls);
                k.indexToArgs.get(posBlockLargeIdx + 0).activeFunc = () => {
                    posChangeFunc(3);
                }
                k.indexToArgs.get(posBlockLargeIdx + 0).deleteFunc = () => {
                    posChangeFunc(4);
                }
            }

        }


    }

    // // 定位块 的业务逻辑
    // let lk001, lk002;  // 简模1 极简模2 的 wsk id
    // const lkmodel      = [{"x":32.557,"y":9.101,"z":29.457,"w":36,"h":17,"d":30,b:"#C7B8A1"}];  // 简模
    // const lkmodelLarge = [{"x":32.557,"y":9.101,"z":29.457,"w":20,"h":17,"d":60,b:"#FFFAF4"}];  // 极其极其简模
    // if(1){

    //     // 外墙和简模(目前的逻辑，在正常行走内，无误。若角色直接穿越，则会 bug，先不理会)
    //     if(1){
    //         const posBlockMiddle = [{"x":32.557,"y":1.5,"z":29.457,"w":0.5,"h":0.5,"d":0.5}];  // 定位块（外墙 - 简模）
    //         posBlockMiddle[0].dz = 2;
    //         const posBlockMiddleIdx = dataProc.process(posBlockMiddle, {x:0}, dls);  // 放置定位块
    //         let outBrickWsk2, outBrickWsk3;
    //         k.indexToArgs.get(posBlockMiddleIdx + 0).activeFunc = () => {  // 近景激活
    //             outBrickWsk2 = dataProc.process(get2data[2], {z:60}, greenStone);  // 外墙 2
    //             outBrickWsk3 = dataProc.process(get2data[3], {z:60}, greenStone);  // 外墙 3
    //             console.log('outBrickWsk2  ' + outBrickWsk2);
    //             console.log('outBrickWsk3  ' + outBrickWsk3);
    //             if(lk001) {  // 删除简模1
    //                 k.deleteModBlock(lk001);
    //                 lk001 = null;
    //             }
    //         }
    //         k.indexToArgs.get(posBlockMiddleIdx + 0).deleteFunc = () => {  // 离开（注意，只能先增后减，以防冲突）
    //             lk001 = dataProc.process(lkmodel, {z:0}, dls);  // 增加简模1
    //             k.deleteModBlock(outBrickWsk2);  //+ 删除外墙
    //             k.deleteModBlock(outBrickWsk3);
    //         }

    //         const posBlockLarge = [{"x":32.557,"y":1.5,"z":29.457,"w":0.5,"h":0.5,"d":0.5}];  // 定位块（极其极其简模）
    //         posBlockLarge[0].dz = 1;
    //         const posBlockLargeIdx = dataProc.process(posBlockLarge, {x:0}, dls);  // 放置定位块
    //         k.indexToArgs.get(posBlockLargeIdx + 0).activeFunc = () => {
    //             lk001 = dataProc.process(lkmodel, {z:0}, dls);  // 增加简模1
    //             if(lk002){
    //                 k.deleteModBlock(lk002);
    //                 lk002 = null;
    //             }

    //         }
    //         k.indexToArgs.get(posBlockLargeIdx + 0).deleteFunc = () => {
    //             lk002 = dataProc.process(lkmodelLarge, {z:0}, dls);
    //             if(lk001) {  // 删除简模1
    //                 k.deleteModBlock(lk001);
    //                 lk001 = null;
    //             }
    //         }
    //     }

    //     // 内部装潢
    //     if(1){
    //         const data = [{"x":32.557,"y":1.5,"z":29.457,"w":0.5,"h":0.5,"d":0.5}];  // 定位块（内部）
    //         data[0].dz = 3;
    //         const testwsk = dataProc.process(data, {x:0}, dls);
    //         console.log('testwsk' + testwsk);
    //         let id0;
    //         k.indexToArgs.get(testwsk + 0).activeFunc = () => {  // 近景
    //             id0 = dataProc.process(get2data[0], {z:60}, dls);
    //             console.log('装潢' + id0);
    //         }
    //         k.indexToArgs.get(testwsk + 0).deleteFunc = () => {  // 删除
    //             k.deleteModBlock(id0);
    //             console.log('删除装潢');
    //         }
    //     }
    // }

    



    // console.log(get2data);





// ======================== 垃圾区 ===================================

    // if(1){
    //     const id = dataProc.process(get2data[1], {x:0}, greenStone, true);  // 定位块
        
    //     console.log('图书馆的 wsk Id ：' + id);
    //     const posblockIdx001 = id;  // 远景（定位块）
    //     const posblockIdx002 = id + 1;  // 中景
    //     const posblockIdx003 = id + 2;  // 近景

    //     let statusL = 0, statusM = 0, statusX = 0;
    //     k.indexToArgs.get(posblockIdx001).activeFunc = () => {  // 远景（在遥远的远方）

    //     }
    //     k.indexToArgs.get(posblockIdx002).activeFunc = () => {  // 中景（在建筑外面，但不至于太远）
    //         if(statusM === 1){return 0}
    //         console.log('渲染中景');
    //         status = 1;
    //     }
    //     k.indexToArgs.get(posblockIdx003).activeFunc = () => {  // 近景（进入建筑）

    //     }
    // }

    /*
    k.tempData = get2data[0];
    if(get2data[0]){
        const id = dataProc.process(get2data[0], {x:0}, greenStone);  // 外墙
    }
    if(get2data[1]){
        const id = dataProc.process(get2data[1], {x:0}, greenStone);  // 外墙
    }
    if(get2data[2]){
        const id = dataProc.process(get2data[2], {x:0}, dls);  // 内部
    }
    */
}