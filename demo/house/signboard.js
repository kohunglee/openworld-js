const singboard = {

    setTest : () => {
        // const posData = {
        //     x: 16.712,
        //     y: 2.3,
        //     z: -35.212,
        //     ry: 90,
        //     w: 2,
        //     h: 1.5,
        // }

        // k.W.plane({
        //     n: 'testplane',
        //     ...posData,
        // });

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
    }

}