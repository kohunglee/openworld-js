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
        keyEvent : (event) => {
            const G = ccgxkObj.centerDot.init;
            const key = event.key.toLowerCase();
            if(G.disListen() === false) {  // 仅在编辑器打开时有效的内容
                const action = G.keyActionMap[key];
                if (action) {

                    // “先锋官” (forwardSign)：他性格耿直，只负责前进后退。
                    // 他的行动准则很简单：如果罗盘(G.forwardAxis.nega)反转了，他就反向行动(-1)，否则就勇往直前(1)。
                    const forwardSign = G.forwardAxis.nega ? -1 : 1;

                    // “诡术师” (sidewaysSign)：他心思缜密，负责神出鬼没的侧向平移。他的决策分为两步：
                    // 第一步：基于“罗盘是否反转(nega)”和“空间感知是深是浅(d/w)”进行一次“异或”判断，得出初步方向。
                    // 注意：这里的逻辑从'w'变成了'd'，以匹配你的新代码。
                    const initialSideSign = (G.forwardAxis.nega !== (G.axis_widthDepth === 'd')) ? 1 : -1;
                    
                    // 第二步：他会观察一种“空间扭曲”现象。
                    // 这种现象只在“深度(d)模式配Z轴”或“宽度(w)模式配X轴”时出现。
                    const isSpaceWarped = (G.axis_widthDepth === 'd' && G.forwardAxis.axis === 'z') ||
                                        (G.axis_widthDepth === 'w' && G.forwardAxis.axis === 'x');

                    // 如果观察到“空间扭曲”，他就会将自己的初步方向完全反转；否则，维持原判。
                    const sidewaysSign = initialSideSign * (isSpaceWarped ? -1 : 1);

                    // 3. 确定最终“推力”

                    // 判断本次行动是“突进”还是“横移”
                    const isForwardMove = action.type === 'forward';
                    // 根据战术类型，选择对应的领航员来掌舵，并结合指令本身，算出最终的“推力方向”
                    const directionSign = isForwardMove ? forwardSign : sidewaysSign;
                    // 计算出本次移动的精确“步长”
                    const delta = action.dir * directionSign * 0.1;

                    // 4. 执行移动

                    // 我们的机器人有两只脚，一只负责X轴，一只负责Z轴
                    const feet = { x: objPosX, z: objPosZ };
                    // 确定“主朝向”是哪个轴
                    const forwardAxisName = G.forwardAxis.axis;
                    // 如果是突进，就移动“主朝向”对应的轴；如果是横移，就移动与“主朝向”垂直的那个轴。
                    const targetAxisName = isForwardMove ? forwardAxisName : (forwardAxisName === 'x' ? 'z' : 'x');

                    // 命令对应的脚，迈出计算好的步长
                    const targetFoot = feet[targetAxisName];
                    targetFoot.value = G.f(+targetFoot.value + delta);
                    
                    // 5. 刷新世界：最后，通知画家重绘机器人的最新位置
                    G.modelUpdate();
                }
                return 0;
                
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
                G.operaCube(1);
                G.hotAction(ccgxkObj.visCubeLen + 1 );
            }

            if(key === 'x') {  // 添加一个新的方块（固定）
                G.operaCube(1, true);
            }

            if(key === 'z'){
                G.displayRefer();
            }
            document.removeEventListener('keydown', G.keyEvent);
        },
        keyActionMap : {  // 用于键盘移动物体使用的键位
            arrowup:    { dir:  1, type: 'forward' },
            arrowdown:  { dir: -1, type: 'forward' },
            arrowright: { dir:  1, type: 'sideways' },
            arrowleft:  { dir: -1, type: 'sideways' }
        },

    };

    ccgxkObj.centerDot.init = {...g, ...ccgxkObj.centerDot.init};
}
