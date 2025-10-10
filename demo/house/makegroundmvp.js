/**
 * 创建地面、人物
 */
function makeGroundMvp(){
    // 主题变量
    globalThis.greenStone = k.textureMap.get('greenStone');
    globalThis.greenStoneborder = k.textureMap.get('greenStoneborder');
    globalThis.frosted = k.textureMap.get('frosted');
    globalThis.jpflag = k.textureMap.get('jpflag');
    globalThis.checkerboard = k.textureMap.get('checkerboard');

    k.addBox({  // 创建地面
        DPZ : 1,
        colliGroup: 1,
        tiling : 200,
        name: 'groundPlane', X: 0, Y: -0.5, Z: 0,
        mass: 0, width: 200, depth: 200, height: 2,
        texture: greenStoneborder, background: '#287A17', mixValue: 0.5,
    });

    var lastPos = k?.lastPos || {x:21, y:5.00, z:15, rX:0, rY:0, rZ:0};
    k.keys.turnRight = lastPos.rY;
    const mainVPSize = 0.5;  // 主角的大小，方便建造
    k.mainVPlayer = k.addBox({  // 创建一个立方体，并设置为主角
        name: 'mainPlayer',
        DPZ : 1,
        colliGroup: 1,
        isShadow: 'ok',
        X:lastPos.x, Y:lastPos.y + 1, Z:lastPos.z,
        mixValue:0.7,
        size: mainVPSize,
        mass: 50,
        background : '#333',
        texture: greenStone,
    });
    if(k?.centerDot){
        k.centerDot.setCamView(2);  // 设置默认视角 类型2
    }

    k.SPRINT_MIN_SPEED = 5;
    k.SPRINT_MAX_SPEED = 15.5;
    const orig_jumpYVel = k.jumpYVel;
    const orig_jumpHoldLimit = k.JUMP_HOLD_LIMIT;
    const mvp = k.mainVPlayer;
    const mvpBody = k.mainVPlayer.body;
    setInterval(  // 动态调整人物的跳跃、地心引力等，每秒走一遍
        () => {
            const x = mvp.X;
            const z = mvp.Z;
            if(x < 52.3 && x > 17.1 && z < -15.7 && z > -44.5) {
                if(x < 50.5  && x > 19.1 &&
                   z < -24.9 && z > -35.5){  // 在大厅以及其他区域

                    k.WALK_SPEED = 1/20;  //+ 走路使用快速度
                    k.jumpYVel = orig_jumpYVel;  //+ 跳跃为原力度
                    k.JUMP_HOLD_LIMIT = orig_jumpHoldLimit;
                    k.world.gravity.set(0, -9.82, 0);

                } else {  // 在图书区

                    k.WALK_SPEED = 1/40;  //+ 走路使用慢速度
                    k.jumpYVel = 0.8;  //+ 减弱跳跃力度
                    k.JUMP_HOLD_LIMIT = 0.5;
                    k.world.gravity.set(0, -9.82/4, 0);

                }
            } else {

                k.WALK_SPEED = 1/20;  //+ 走路使用快速度
                k.jumpYVel = orig_jumpYVel;  //+ 跳跃为原力度
                k.JUMP_HOLD_LIMIT = orig_jumpHoldLimit;
                k.world.gravity.set(0, -9.82, 0);
            }

            // 保证人物不掉地面
            if(k.mainVPlayer.body.position.y < 0){
                k.mainVPlayer.body.position.y = 50;
            }

            if(mvpBody.mass === 0){
                mvpBody.velocity.set(0, 0, 0);  // 设置线速度为0
                mvpBody.angularVelocity.set(0, 0, 0);  // 设置角速度为0
                mvpBody.force.set(0, 0, 0);  // 清除所有作用力
                mvpBody.torque.set(0, 0, 0);  // 清除所有扭矩
            }
        }
    , 100);
}