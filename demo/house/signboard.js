const singboard = {

    setTest : () => {

        k.addTABox({
            DPZ : 2,
            X: 16.712,
            Y: 2.3,
            Z: -35.212,
            rY: 90,
            width : 2,
            height: 1.5,
            shape: 'plane',
            isPhysical: false,
        });

        const groundIndex = k.addTABox({  // 创建地面（先放到这里，看看会不会出异常）
            DPZ : 0,
            colliGroup: 1,
            tiling : 1000,
            X: 0, Y: -0.5, Z: 0,
            mass: 0, width: 200, depth: 200, height: 2,
            texture: greenStoneborder, background: '#287A17', mixValue: 0.5,
        });
        k.centerDotBlacklist instanceof Set || (k.centerDotBlacklist = new Set());
        k.centerDotBlacklist.add(groundIndex);  // 将地面添加到黑名单里
    }

}