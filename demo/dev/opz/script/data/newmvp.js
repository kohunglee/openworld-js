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

    // 生成供 build 插件使用的数据
    if(1){
        const buildCubeData = new Array();  
        for(let i = 0; i < 1000; i++){  // 生成原始数据
            buildCubeData[i] =  {
                "x": 20,
                "y": 10,
                "z": 20,
                "w": 1,
                "h": 1,
                "d": 1,
            };
        }
        const id = dataProc.process(buildCubeData, {x:0}, dls);
        k.centerDot.init.wskId = id;
    }

    // ----------

    logicFunc(testcubedata)
    const getdata = logicData(testcubedata)

    // 分离不同的 t
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
    const get2data =  analyzeTexture(getdata);  // 得到不同纹理的 3 份数据

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

// ======================== 垃圾区 ===================================
}