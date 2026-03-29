/**
 * 一些 常用的快捷键和页面事件 插件
 * ========
 * 功能是 比如 空中 F 键盘悬停....
 */
export default function(ccgxkObj) {
    // console.log('导入自己的 常用快捷键事件 插件成功');
    const myevent = {
        keyEvent : (e, ccgxkObj) => {
            const key = e.key.toLowerCase();

            if(key === 'e' || key === ' ') {  // 在冻结物体情况下，按 e 键或空格键，可以解除冻结
                const mvpBody = ccgxkObj.mainVPlayer.body;
                if(mvpBody.mass === 0){
                    mvpBody.mass = 50;  // 重量还原
                }
            }

            // if(key === 'f') {  // 键盘上的 f 键被按下（冻结物体）
            //     const mvpBody = ccgxkObj.mainVPlayer.body;
            //     if(mvpBody.mass === 0){
            //         mvpBody.mass = 50;  // 重量还原
            //     } else {
            //         mvpBody.mass = 0;  // 重量归 0
            //         mvpBody.velocity.set(0, 0, 0);  // 设置线速度为0
            //         mvpBody.angularVelocity.set(0, 0, 0);  // 设置角速度为0
            //         mvpBody.force.set(0, 0, 0);  // 清除所有作用力
            //         mvpBody.torque.set(0, 0, 0);  // 清除所有扭矩
            //     }
            // }

            if(key === 'v'){  // 切换视角
                ccgxkObj.centerDot.setCamView();
            }

            document.removeEventListener('keydown', myevent.keyEvent);
        },
    }

    const keyHandler = e => myevent.keyEvent(e, k);
    document.addEventListener('keydown', keyHandler);
    document.addEventListener('keyup', function(){
        document.addEventListener('keydown', keyHandler);
    });

    // 定时事件
    setInterval(
        () => {
            // 保证人物不掉地面
            if(true){
                if(ccgxkObj.mainVPlayer.body.position.y < 0){
                    ccgxkObj.mainVPlayer.body.position.y = 50;
                }
            }

            // 防止在 F 冻结模式，碰障碍物后失重移动
            if(true){
                const mvpBody = ccgxkObj.mainVPlayer.body;
                if(mvpBody.mass === 0){
                    mvpBody.velocity.set(0, 0, 0);  // 设置线速度为0
                    mvpBody.angularVelocity.set(0, 0, 0);  // 设置角速度为0
                    mvpBody.force.set(0, 0, 0);  // 清除所有作用力
                    mvpBody.torque.set(0, 0, 0);  // 清除所有扭矩
                }
            }
        }
    , 100);

}