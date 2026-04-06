/**
 * 一些 常用的快捷键和页面事件 插件
 * ========
 * 功能是 比如 空中 F 键盘悬停....
 */
export default function(ccgxkObj) {
    // console.log('导入自己的 常用快捷键事件 插件成功');
    const myevent = {
        keyEvent : (e, ccgxkObj) => {
            if(document.getElementById('signPanelModal')&&!document.getElementById('signPanelModal').hidden)return;

            // myHUDModal 显示时，小键盘 * 键触发复制按钮
            const myHUDModal = document.getElementById('myHUDModal');
            if(myHUDModal && !myHUDModal.hidden) {
                if (e.key === '*') {
                    const copyBtn = document.getElementById('textureCopyCubes');
                    if (copyBtn) copyBtn.click();
                }
                return;
            }

            const key = e.key.toLowerCase();

            if(key === 'e' || key === ' ') {  // 在冻结物体情况下，按 e 键或空格键，可以解除冻结
                const mvpBody = ccgxkObj.mainVPlayer.body;
                if(mvpBody.mass === 0){
                    mvpBody.mass = 50;  // 重量还原
                }
            }

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


    // 2 模式下，跳跃冻结
    if(ccgxkObj.mode === 2){
        document.addEventListener('keydown', (event) => {
            const key = event.key.toLowerCase();
            const mvpBody = ccgxkObj?.mainVPlayer?.body;

            if(document.getElementById('signPanelModal')&&!document.getElementById('signPanelModal').hidden)return;
            if(document.getElementById('myHUDModal')&&!document.getElementById('myHUDModal').hidden)return;

            // 没有物理体就直接退出
            if (!mvpBody) return;

            // ==================== E 键：只负责解冻 ====================
            if (key === 'e') {
                // 只有当前是冻结状态，才执行解冻
                if (mvpBody.mass === 0) {
                    mvpBody.mass = 50;
                }
            }

            // ==================== F 键：只负责冻结 ====================
            if (key === 'f') {
                // 如果已经冻结 → 按 F 也可以解冻（你要求的：解冻时 E/F 都能用）
                if (mvpBody.mass === 0) {
                mvpBody.mass = 50;
                } 
                // 如果没冻结 → 按 F 才执行冻结
                else {
                mvpBody.mass = 0;
                mvpBody.velocity.set(0, 0, 0);
                mvpBody.angularVelocity.set(0, 0, 0);
                mvpBody.force.set(0, 0, 0);
                mvpBody.torque.set(0, 0, 0);
                }
            }
        });
    }


    // 模式 0：停留超过 10 秒，离开页面时提示
    if (ccgxkObj.mode === 0) {
        const enterTime = Date.now();

        window.addEventListener('beforeunload', (e) => {
            const elapsed = (Date.now() - enterTime) / 1000;
            if (elapsed > 10) {
                e.preventDefault();
                e.returnValue = '数据尚未保存，确定要离开吗？';
                return e.returnValue;
            }
        });
    }

}