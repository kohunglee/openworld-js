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

/************* 研究动画实验区 */

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

    /* ------------   测试腿了！  -------------- */
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
}