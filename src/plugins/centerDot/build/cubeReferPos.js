
/**
 * 添加方块时的位置参考组件 (建造师，初始化建造师（引用中心点插件）)
 * ========
 * 实验中，可以移动物体
 */

export default function(ccgxkObj) {
    const CUBE_NAME = 'new_cube_pos';
    const g = {
        newCubePosType : 0,  // 默认模式为 关闭
        displayRefer: () => {
            const G = ccgxkObj.centerDot.init;
            const W = ccgxkObj.W;
            const totalModes = 3; // 总共有3个模式 (0, 1, 2)
            G.newCubePosType = (G.newCubePosType + 1) % totalModes;
            switch (G.newCubePosType) {
                case 1:  // 围绕模式
                    W.cube({
                        g: 'mainPlayer',
                        n: CUBE_NAME,
                        y: 0, x: 0, z: -5,
                        w: 1, h: 1, d: 1,
                        b: '#bbbbbb46',
                    });
                    break;
                case 2:  // 正交模式
                    W.cube({
                        n: CUBE_NAME,
                        b: '#ff3d3d26',
                    });
                    if(G.addcubeType2Hook !== true){
                        ccgxkObj.hooks.on('mouseMove', function(o, e, mode = G.newCubePosType, obj = ccgxkObj){
                            if(mode === 2){
                                const mVP = obj.mainVPlayer;
                                const new_ry = ((mVP.rX)? 1: -1) * mVP.rY;
                                W.cube({
                                    n: CUBE_NAME,
                                    ry: new_ry,  // 让方块的旋转角度始终以正交模式添加
                                });
                            }
                        });             
                        G.addcubeType2Hook = true;  // 防止重复添加，小小优化
                    }
                    break;
                case 0:  // 关闭模式
                    W.delete(CUBE_NAME);
                    break;
            }
        },
    };
    ccgxkObj.centerDot.init = { ...g, ...ccgxkObj.centerDot.init };
}