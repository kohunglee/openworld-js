/**
 * 和屏幕鼠标锁定、键盘等有关的函数组件 (建造师，初始化建造师（引用中心点插件）)
 * ========
 * 实验中，可以移动物体
 */

export default function(ccgxkObj) {

    var G = {
        ...ccgxkObj.centerDot.init,

        // 将 HTML 绘制到页面上
        initHTML : () => {
            G = ccgxkObj.centerDot.init;
            const template = document.createElement('template');  //+4 将 html 节点添加到文档
            template.innerHTML = G.htmlCode;
            const content = template.content.cloneNode(true);
            document.body.appendChild(content);
        },


        // 热点事件
        hotAction : (index) => {
            G = ccgxkObj.centerDot.init;
            const thisObj = ccgxkObj;
            if(thisObj.hotPoint + 0 > 1_000_000) return 0;
            G.indexHotCurr = index || thisObj.hotPoint + 0;  // 将 index 数字定格，防止被更改
            G.unlockPointer();  // 解锁鼠标
            myHUDModal.hidden = false;  // 显示模态框
            G.music('openEdi');  // 打开编辑器（音效）
            const _index = G.indexHotCurr;
            G.backupEdi = ccgxkObj.indexToArgs.get(_index);
            objID.value = _index;
            G.insertEdiFromBackUp();
            ccgxkObj.drawPointPause = true;  // 暂停绘制
        },

        // 解锁鼠标
        unlockPointer : () => {
            G = ccgxkObj.centerDot.init;
            if ('pointerLockElement' in document || 
            'mozPointerLockElement' in document || 
            'webkitPointerLockElement' in document) {
                const exitLock = document.exitPointerLock || 
                                document.mozExitPointerLock || 
                                document.webkitExitPointerLock;
                if (exitLock) {
                    exitLock.call(document);
                }
            }
        },

        // 锁定鼠标
        lockPointer : () => {
            G = ccgxkObj.centerDot.init;
            const canvas = ccgxkObj.canvas;
            canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
            canvas.requestPointerLock();
            G.backupEdi = null;  // 清空备份，鼠标锁定状态 没备份
        },

        // 一些键盘事件
        keyEvent : (event) => {
            G = ccgxkObj.centerDot.init;
            if(G.disListen() === false) {return 0}
            const key = event.key.toLowerCase();
            if(key === 'f') {  // 键盘上的 f 键被按下（冻结物体）
                const mvpBody = ccgxkObj.mainVPlayer.body;
                if(mvpBody.mass === 0){
                    mvpBody.mass = 50;  // 重量还原
                    G.music('unfrozen');
                } else {
                    mvpBody.mass = 0;  // 重量归 0
                    mvpBody.velocity.set(0, 0, 0);  // 设置线速度为0
                    mvpBody.angularVelocity.set(0, 0, 0);  // 设置角速度为0
                    mvpBody.force.set(0, 0, 0);  // 清除所有作用力
                    mvpBody.torque.set(0, 0, 0);  // 清除所有扭矩
                    G.music('frozen');
                }
            }

            if(key === 'r') {  // 添加一个新的方块（跟随）
                G.operaCube(1);
                G.hotAction(ccgxkObj.visCubeLen + 1 );
                ccgxkObj.centerDot.openPoint(ccgxkObj);  // 关闭小点
            }

            if(key === 'x') {  // 添加一个新的方块（固定）
                G.operaCube(1, true);
                G.music('addCube0');
            }

            if ((event.keyCode === 32 || key === 'e')) {  // 跳跃的声音
                G.music('jump');
            }

            if(key === 'p'){}
            document.removeEventListener('keydown', G.keyEvent);
        },

    };

    ccgxkObj.centerDot.init = {...G, ...ccgxkObj.centerDot.init};
}
