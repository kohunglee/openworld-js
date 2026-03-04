
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
            if(!G?.addCubeByMouseEvent) {
                G.addCubeByMouseEvent = ()=>{
                    if(G.newCubePosType !== 0){
                        G.operaCube(1, true);  // 添加方块
                        G.displayRefer();      // 关闭参考模型
                    }
                }
                document.addEventListener('click', function(event, gObj = G) {
                    if (event.button === 0) {  // 0 表示鼠标左键
                        gObj.addCubeByMouseEvent();
                    }
                });
            }
            const W = ccgxkObj.W;
            const totalModes = 2; // 总共有 2 个模式 (0, 1)
            G.newCubePosType = (G.newCubePosType + 1) % totalModes;
            switch (G.newCubePosType) {
                case 1:  // 正交模式
                    ccgxkObj.notCenterDot = true;  // 禁用【中心点插件】类内容
                    W.cube({
                        g: 'mainPlayer',
                        n: CUBE_NAME,
                        y: 0, x: 0, z: -5,
                        w: 1, h: 1, d: 1,
                        b: '#bbbbbb46',
                    });

                    const mVP = ccgxkObj.mainVPlayer;
                    const new_ry = ((mVP.rX)? 1: -1) * mVP.rY;

                    W.cube({
                        n: CUBE_NAME,
                        ry: new_ry,  // 让方块的旋转角度始终以正交模式添加
                    });

                    ccgxkObj.hooks.on('mouseMove', function(o, e, mode = G.newCubePosType, obj = ccgxkObj){
                        if(mode === 1){
                            const mVP = obj.mainVPlayer;
                            const new_ry = ((mVP.rX)? 1: -1) * mVP.rY;
                            W.cube({
                                n: CUBE_NAME,
                                ry: new_ry,  // 让方块的旋转角度始终以正交模式添加
                            });
                        }
                    });
                    break;
                case 0:  // 关闭模式
                    ccgxkObj.notCenterDot = false;  // 重新启用【中心点插件】类内容
                    W.delete(CUBE_NAME);
                    break;
            }
        },
    };
    ccgxkObj.centerDot.init = { ...g, ...ccgxkObj.centerDot.init };
}