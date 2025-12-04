/**
 * 创建一个新人物
 */
function newMvp(){
    const mainVPSize = 0.5;  // 主角的大小，方便建造
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

// ======================== 实验区 ===================================



    logicFunc(testcubedata)
    const getdata = logicData(testcubedata)

    // 临时函数
    // 注意，这是一个失败的案例，没有考虑 内外层 纹理, 所以这个函数，就在这里用
    function analyzeTexture(myData){
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
    const get2data =  analyzeTexture(getdata);  // 得到不同纹理的两份数据

    k.tempData = get2data[0];
    if(get2data[1]){
        const id = dataProc.process(get2data[1], {x:0}, greenStone);
    }
    if(get2data[2]){
        const id = dataProc.process(get2data[2], {x:0}, dls);
    }










// ======================== 垃圾区 ===================================




    /**    */

    // 内部的监测
    /**
     * 位置: X:16.54, Y:0.75, Z:-14.36
     * X 53
     * Z -45.7
     * Y 18.5
     * 
     * X: 16.5 ~ 53
     * Y: 0.75 ~ 18.5
     * Z: -14.4 ~ -45.7
     */

    // // 1. 定义检测配置 (将数据提取出来，方便以后扩展为数组)
    // const targetZone = {
    //     x: [16.5, 53],
    //     y: [0.75, 18.5],
    //     z: [-14.4, -45.7] // 即使顺序写反，我们在逻辑里也能处理
    // };

    // let inSetOK = false;
    // let inSetIndex = -1;  // 内部装修的 万数块 id

    // // 是否在盒子里
    // const isInside = (val, range) => {
    //     const min = Math.min(range[0], range[1]);
    //     const max = Math.max(range[0], range[1]);
    //     return val >= min && val <= max;
    // };

    // const checkPlayerPosition = () => {
    //     const { X, Y, Z } = k.mainVPlayer;
        
    //     // 核心判断逻辑，读起来像英语句子一样自然
    //     const inRange = 
    //         isInside(X, targetZone.x) &&
    //         isInside(Y, targetZone.y) &&
    //         isInside(Z, targetZone.z);

    //     if (inRange) {  // 在范围内
    //         if(inSetOK === false) {  // 还没有建造
    //             inSetIndex = dataProc.process(get2data[0], {x:0}, dls);
    //             inSetOK = true;
    //             console.log('wsk id 为 ', inSetIndex);
    //         }
    //     } else {  // 不在范围内
    //         if(inSetOK === true) {  // 如果建造了
    //             k.deleteModBlock(inSetIndex);
    //             inSetOK = false;
    //             inSetIndex = -1;
    //             console.log('delete 了');
    //         }
    //     }
    // };

    // // 3. 启动定时器 (100ms = 1秒10次)
    // const timerId = setInterval(checkPlayerPosition, 100);

    // /**
    //  * 启动区域检测监听器
    //  * @param {Object} zoneRange - 检测范围 { x: [min, max], y: [min, max], z: [min, max] }
    //  * @param {Object} modelData - 要生成的模型数据 (即 get2data[0])
    //  * @param {Object} dls - 传递给 dataProc 的 dls 对象 (如果它是全局的，也可以不传)
    //  * @returns {Function} stop - 返回一个停止函数，调用它可以清除定时器
    //  */
    // const startZoneMonitor = (zoneRange, modelData, dls) => {
    //     // 1. 状态变量 (闭包，每个监听器独享一份状态)
    //     let inSetOK = false;
    //     let inSetIndex = -1;

    //     // 2. 辅助函数：判断数值是否在范围内 (自动处理最大最小值)
    //     const isInside = (val, range) => {
    //         if (!range) return true; // 如果没定义该轴，默认通过
    //         const min = Math.min(range[0], range[1]);
    //         const max = Math.max(range[0], range[1]);
    //         return val >= min && val <= max;
    //     };

    //     // 3. 核心检测逻辑
    //     const checkPlayerPosition = () => {
    //         // 确保 k 和 mainVPlayer 存在，防止报错
    //         if (!k || !k.mainVPlayer) return;

    //         const { X, Y, Z } = k.mainVPlayer;
            
    //         // 判断 XYZ 是否都在范围内
    //         const inRange = 
    //             isInside(X, zoneRange.x) &&
    //             isInside(Y, zoneRange.y) &&
    //             isInside(Z, zoneRange.z);

    //         if (inRange) {  
    //             // --- 进入区域 ---
    //             if (!inSetOK) { 
    //                 // 这里的 {x:0} 如果是动态的，也可以作为参数传入
    //                 inSetIndex = dataProc.process(modelData, {x:0}, dls);
    //                 inSetOK = true;
    //                 console.log(`[ZoneMonitor] 进入区域，生成 ID: ${inSetIndex}`);
    //             }
    //         } else {  
    //             // --- 离开区域 ---
    //             if (inSetOK) { 
    //                 k.deleteModBlock(inSetIndex);
    //                 inSetOK = false;
    //                 inSetIndex = -1;
    //                 console.log('[ZoneMonitor] 离开区域，已删除');
    //             }
    //         }
    //     };

    //     // 4. 启动定时器
    //     const timerId = setInterval(checkPlayerPosition, 100);

    //     // 5. 返回停止函数 (方便以后需要销毁这个监听器时使用)
    //     return () => clearInterval(timerId);
    // };

    // // 区域 1
    // const zone1 = {
    //     x: [16.5, 53],
    //     y: [0.75, 18.5],
    //     z: [-14.4, -45.7]
    // };
    // const data1 = get2data[0]; 

    // // 区域 2
    // const zone2 = {
    //     x: [16.5, 53],
    //     y: [0.75, 18.5],
    //     z: [-14.4, -45.7]
    // };
    // const data2 = get2data[1]; 

    // const stopMonitor1 = startZoneMonitor(zone1, data1, dls);
    // const stopMonitor2 = startZoneMonitor(zone2, data2, dls);

    // const testData = [
    //     {
    //         x: 10, y: 10, z: 10,
    //         w: 1, d: 1, h: 1,
    //     },
    //     {
    //         x: 20, y: 10, z: 10,
    //         w: 1, d: 1, h: 1,
    //     },
    //     {
    //         del: 1,
    //     },
    //     {
    //         x: 40, y: 10, z: 10,
    //         w: 1, d: 1, h: 1,
    //     },
    // ];


}