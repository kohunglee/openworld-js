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

// ===========================================================



    logicFunc(testcubedata)
    const getdata = logicData(testcubedata)

    // dataProc.process(getdata, 'test0002', {x:0})

    const testData = [
        {
            x: 10, y: 10, z: 10,
            w: 1, d: 1, h: 1,
        },
        {
            x: 20, y: 10, z: 10,
            w: 1, d: 1, h: 1,
        },
        {
            del: 1,
        },
        {
            x: 40, y: 10, z: 10,
            w: 1, d: 1, h: 1,
        },
    ];
        
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
        const id = dataProc.process(get2data[1], 'texture_1', {x:0}, greenStone);
    }
    if(get2data[2]){
        const id = dataProc.process(get2data[2], 'texture_2', {x:0}, dls);
    }

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

    // 1. 定义检测配置 (将数据提取出来，方便以后扩展为数组)
    // 这里的 range 只是一个示例，以后你可以从服务器加载一个巨大的数组
    const targetZone = {
        x: [16.5, 53],
        y: [0.75, 18.5],
        z: [-14.4, -45.7] // 即使顺序写反，我们在逻辑里也能处理
    };

    let inSetOK = false;
    let inSetIndex = -1;  // 内部装修的 万数块 id

    // 2. 封装一个通用的判断函数
    // 这个函数不关心具体业务，只关心“点”是否在“盒子”里
    const isInside = (val, range) => {
        const min = Math.min(range[0], range[1]);
        const max = Math.max(range[0], range[1]);
        return val >= min && val <= max;
    };

    const checkPlayerPosition = () => {
        const { X, Y, Z } = k.mainVPlayer;
        
        // 核心判断逻辑，读起来像英语句子一样自然
        const inRange = 
            isInside(X, targetZone.x) &&
            isInside(Y, targetZone.y) &&
            isInside(Z, targetZone.z);

        if (inRange) {  // 在范围内
            if(inSetOK === false) {  // 还没有建造
                inSetIndex = dataProc.process(get2data[0], 'texture_0', {x:0}, dls);
                inSetOK = true;
                console.log('wsk id 为 ', inSetIndex);
            }
        } else {  // 不在范围内
            if(inSetOK === true) {  // 如果建造了
                k.deleteModBlock(inSetIndex);
                inSetOK = false;
                inSetIndex = -1;
                console.log('delete 了');
            }
        }
    };

    // 3. 启动定时器 (100ms = 1秒10次)
    // 建议保存 timer ID 以便后续可以 clearInterval 停止它
    // const timerId = setInterval(checkPlayerPosition, 100);


    

}