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

    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    c.width = 1024;
    c.height = 512;

    // 1. 背景主渐变（纯蓝 → 淡蓝）
    let g = ctx.createLinearGradient(0, 0, 0, c.height);

    g.addColorStop(0.00, '#4fa9ff');   // 顶部：纯蓝，极点不易失真
    g.addColorStop(0.17, '#6ec3ff');   // 中段
    g.addColorStop(0.35, '#a9e0ff');   // 接近地平线
    g.addColorStop(0.50, '#ffffff');   // 底部：白（云带）

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, c.width, c.height);

    // 2. 用轻微噪声制造“云雾感”（但顶部不绘制）
    // const id = ctx.getImageData(0, 0, c.width, c.height);
    // const d = id.data;
    // for (let y = c.height * 0.2; y < c.height; y++) {
    //     for (let x = 0; x < c.width; x++) {
    //         const i = (y * c.width + x) * 4;
    //         const n = (Math.random() - 0.5) * 40; // 云的细节（非常轻）
    //         d[i] += n;
    //         d[i+1] += n;
    //         d[i+2] += n;
    //     }
    // }
    // ctx.putImageData(id, 0, 0);


    // 输出 img，用于 WebGL
    const skyTexture = new Image();
    skyTexture.src = c.toDataURL();
    document.body.appendChild(c);  // 用于预览，可删

    skyTexture.onload = () => {
        // console.log('skyTexture ready, size:', img.width, 'x', img.height);

        // 天空盒测试
        k.W.sphere({  // 主角的右腿
            // g:'mainPlayer',
            n:'skybox_test',
            y: 25,
            x: 0,
            z: 0,
            rz:0,
            size: 2500,
            uncullface: 1,
            t: skyTexture,
            // s: 1,
            rx: 10,
            ns: true,
        });
    };

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
        

    ;
    dataProc.process(getdata, 'test0002', {x:0});
   
}