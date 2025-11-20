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

    var lastPos = k?.lastPos || {x:21 + Math.random() * 10, y:5.00, z:15 + Math.random() * 10, rX:0, rY:0, rZ:0};
    k.keys.turnRight = lastPos.rY;
    const mainVPSize = k?.mainVPSize || 0.5;

    // 添加地面
    if(true){
        const X = 0, Y = -0.5, Z = 0;
        const width = 2000, depth = 2000, height = 2;
        k.addPhy({  // 地面物理体
            name: 'ground',
            colliGroup: 2,
            isShadow: 'ok',
            X: X, Y: Y, Z: Z,
            width: width, depth: depth, height: height,
            mass: 0,
        });
        k.W.cube({  // 地面渲染
            n: 'ground',
            w: width, d: depth, h: height,
            x: X, y: Y, z: Z,
            t: greenStoneborder, b: '#287A17', mix: 0.5, tile: [width, width],
        });
    }

    // 添加主角
    if(true){
        const mvpIndex = k.addPhy({  // 创建一个立方体，并设置为主角
            name: 'mainPlayer',
            DPZ : 0,
            colliGroup: 1,
            X:lastPos.x, Y:lastPos.y + 1, Z:lastPos.z,
            mixValue:0.7,
            size: mainVPSize,
            mass: 50,
            background : '#333',
            texture: greenStone,
        });
        k.mainVPlayer = mvpIndex;
        if(k?.centerDot){
            k.centerDot.setCamView(2);  // 设置默认视角 类型2
        }
    }

    // 配置默认的运动速度
    if(true){
        k.SPRINT_MIN_SPEED = 5;
        k.SPRINT_MAX_SPEED = 15.5;
    }

    const orig_jumpYVel = k.jumpYVel;
    const orig_jumpHoldLimit = k.JUMP_HOLD_LIMIT;
    const mvp = k.mainVPlayer;
    const mp = k.mainVPlayer.body.position;
    const mk = k.keys;
    k.lastHotBookData = [];  // 用于记录上一次的热点图书信息，方便判断
    let Last_mvpBodyPos = (mp.x + mp.y + mp.z + mk.turnRight).toFixed(2);  // 用于判断主角是否停下脚步的辅助
    k.myRestDoFunc = dofunc();  // 静止时要执行的函数队列
    setInterval(  // 动态调整人物的跳跃、地心引力等，每秒走一遍
        () => {
            if(k.W.lastReportTime < 2000){ return 0 }  // 项目启动前 2s 不运行，防止看起来卡顿

            // 不同区域的跳跃和速度不一样的实现逻辑
            if(true){
                const x = mvp.X;
                const z = mvp.Z;
                const y = mvp.Y;
                if(x < 52.3 && x > 17.1 && z < -15 && z > -45.1) {
                    if(x < 50.5  && x > 19.1 && z < -24.9 && z > -35.5){  // 在大厅以及其他区域
                        k.WALK_SPEED = 1/20;  //+ 走路使用快速度
                        k.jumpYVel = orig_jumpYVel;  //+ 跳跃为原力度
                        k.JUMP_HOLD_LIMIT = orig_jumpHoldLimit;
                        k.world.gravity.set(0, -9.82, 0);
                    } else if(y < 17) {  // 在图书区
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
            }

            // 保证人物不掉地面
            if(true){
                if(k.mainVPlayer.body.position.y < 0){
                    k.mainVPlayer.body.position.y = 50;
                }
            }

            // 防止在 F 冻结模式，碰障碍物后失重移动
            if(true){
                const mvpBody = k.mainVPlayer.body;
                if(mvpBody.mass === 0){
                    mvpBody.velocity.set(0, 0, 0);  // 设置线速度为0
                    mvpBody.angularVelocity.set(0, 0, 0);  // 设置角速度为0
                    mvpBody.force.set(0, 0, 0);  // 清除所有作用力
                    mvpBody.torque.set(0, 0, 0);  // 清除所有扭矩
                }
            }

            // 在人物运动、静止时执行的函数
            if(true){
                if((mp.x + mp.y + mp.z + mk.turnRight).toFixed(2) === Last_mvpBodyPos) {  // 人物处于静止状态
                    k.myRestDoFunc();
                } else {  // 人物处于运动状态
                    Last_mvpBodyPos = (mp.x + mp.y + mp.z + mk.turnRight).toFixed(2);
                }
            }

            // 光标划过书本，在屏幕左上角，显示书本的信息
            if(true){
                if (k.hotPoint) {
                    const data = bookHot.getInfo(k.hotPoint);
                    const last = k.lastHotBookData ?? [];
                    const hasNewData = data.length > 0 && data !== last;
                    const needClear  = data.length !== last.length;
                    if (hasNewData) {
                        bookHot.showData(data);  // 左上角展示
                    } else if (needClear) { bookHot.showData([], true); }  // 关闭左上角信息
                    k.lastHotBookData = data;
                }
            }
        }
    , 100);
}



/**
 * 任务队列模式
 * ------------
 * 主要用于在人物静止时加载 svg ，防止画面卡帧、卡顿
 */
function dofunc() {
  let q = [];
  function run() {
    const a = q;
    q = [];
    for (let i = 0; i < a.length; i++) a[i]();
  }
  run.add = f => q[q.length] = f;
  return run;
}