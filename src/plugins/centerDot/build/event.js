/**
 * 和屏幕鼠标锁定、键盘等有关的函数组件 (建造师，初始化建造师（引用中心点插件）)
 * ========
 * 实验中，可以移动物体
 */

export default function(ccgxkObj) {

    var g = {
        // 热点事件
        hotAction : (index) => {
            const G = ccgxkObj.centerDot.init;
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
            const G = ccgxkObj.centerDot.init;
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
            const G = ccgxkObj.centerDot.init;
            const canvas = ccgxkObj.canvas;
            canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
            canvas.requestPointerLock();
            G.backupEdi = null;  // 清空备份，鼠标锁定状态 没备份
        },

        // 大部分键盘事件的激活处
        keyEvent : (e) => {
            const G = ccgxkObj.centerDot.init;
            const key = e.key.toLowerCase();
            if(G.disListen() === false && document.activeElement.tagName !== 'INPUT') {  // 仅在编辑器打开且未激活 input 有效
                if(key >= "0" && key <= "9" || key === '-') {  // 数字键，激活【神奇数字叠加值】
                    magicNum.hidden = false;
                    magicNum.focus();
                }
                const action = G.keyActionMap[key];
                if (action) {  //键盘操作物体
                    const forwardSign = G.forwardAxis.nega ? -1 : 1;  // 根据【罗盘】确定前进后退
                    const initialSideSign = (G.forwardAxis.nega !== (G.axis_widthDepth === 'd')) ? 1 : -1;  // 确定侧向移动
                    const isSpaceWarped = (G.axis_widthDepth === 'd' && G.forwardAxis.axis === 'z') ||  // 一个难以解释的 bug 修复
                                          (G.axis_widthDepth === 'w' && G.forwardAxis.axis === 'x');
                    const sidewaysSign = initialSideSign * (isSpaceWarped ? -1 : 1);
                    const isForwardMove = action.type === 'forward';  // 确定是前进还是侧移
                    const directionSign = isForwardMove ? forwardSign : sidewaysSign;  // 最终的推力方向
                    const step = G.stepValue;
                    var delta = action.dir * directionSign * step;  // 计算步长
                    const feet = { x: objPosX, z: objPosZ };  // 机器人的两个轴
                    const forwardAxisName = G.forwardAxis.axis;  // 确定朝向轴
                    const targetAxisName = isForwardMove ? forwardAxisName : (forwardAxisName === 'x' ? 'z' : 'x');
                    const targetFoot = feet[targetAxisName];
                    if(magicNum.value){
                        delta = delta > 0 ? magicNum.value : -magicNum.value;
                        delta = Number(delta);
                        G.clearMagicNum();
                    }
                    targetFoot.value = G.f(+targetFoot.value + delta);  // 修改参数
                    G.modelUpdate();  // 重绘世界
                }
                return 0;
            }

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
                // G.operaCube(1);
                // G.hotAction(ccgxkObj.visCubeLen + 1 );
            }

            if(key === 'x' && G.newCubePosType) {  // 添加一个新的方块（固定）
                G.operaCube(1, true);
                G.displayRefer();      // 关闭参考模型
            }

            if(key === 'z'){  // 添加方块时的参考
                G.displayRefer();
            }

            if(key === 'v'){  // 切换视角
                ccgxkObj.centerDot.setCamView();
            }

            document.removeEventListener('keydown', G.keyEvent);
        },
        keyActionMap : {  // 用于键盘移动物体使用的键位
            arrowup:    { dir:  1, type: 'forward' },
            arrowdown:  { dir: -1, type: 'forward' },
            arrowright: { dir:  1, type: 'sideways' },
            arrowleft:  { dir: -1, type: 'sideways' },
            w :         { dir:  1, type: 'forward' },
            s :         { dir: -1, type: 'forward' },
            d :         { dir:  1, type: 'sideways' },
            a :         { dir: -1, type: 'sideways' },
        },
    };

    ccgxkObj.centerDot.init = {...g, ...ccgxkObj.centerDot.init};
}
