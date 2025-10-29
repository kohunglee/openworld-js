const myevent = {
    keyEvent : (e, ccgxkObj) => {
        const key = e.key.toLowerCase();

        if(key === 'e') {  // 在冻结物体情况下，按 e 键，可以解除冻结
            const mvpBody = ccgxkObj.mainVPlayer.body;
            if(mvpBody.mass === 0){
                mvpBody.mass = 50;  // 重量还原
            }
        }

        if(key === 'f') {  // 键盘上的 f 键被按下（冻结物体）
            const mvpBody = ccgxkObj.mainVPlayer.body;
            if(mvpBody.mass === 0){
                mvpBody.mass = 50;  // 重量还原
            } else {
                mvpBody.mass = 0;  // 重量归 0
                mvpBody.velocity.set(0, 0, 0);  // 设置线速度为0
                mvpBody.angularVelocity.set(0, 0, 0);  // 设置角速度为0
                mvpBody.force.set(0, 0, 0);  // 清除所有作用力
                mvpBody.torque.set(0, 0, 0);  // 清除所有扭矩
            }
        }

        if(key === 'v'){  // 切换视角
            ccgxkObj.centerDot.setCamView();
        }

        document.removeEventListener('keydown', myevent.keyEvent);
    },


}   