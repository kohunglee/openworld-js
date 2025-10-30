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

        k.addTABox({  // 创建地面（先放到这里，看看会不会出异常）
            DPZ : 0,
            colliGroup: 1,
            tiling : 1000,
            X: 0, Y: -0.5, Z: 0,
            mass: 0, width: 10000, depth: 10000, height: 2,
            texture: greenStoneborder, background: '#287A17', mixValue: 0.5,
        });
    }

}