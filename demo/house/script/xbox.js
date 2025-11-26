
// 开启游戏手柄
const xbox = {
    play : () => {
        const DEADZONE = 0.05;
        let highPreciDeg = 1;

        let _anyKeyDown = false; //+ 用于监听是否有按键被按下
        window.addEventListener('keydown', () => _anyKeyDown = true);
        window.addEventListener('keyup', () => _anyKeyDown = false);

        function applyDeadzone(v, dz) {
            return Math.abs(v) < dz ? 0 : v;
        }

        function formatAxis(v) {
            return Math.round(v * 1000) / 1000;
        }

        // 循环体
        function readGamepads() {
            const isUseXBOX = document.getElementById('useGamepad').checked;
            const isUseHighPreci = document.getElementById('hiPrecisionMove').checked;
            const isInverteCamX = document.getElementById('inverteCamX').checked ? -1 : 1;
            const isInverteCamY = document.getElementById('inverteCamY').checked ? -1 : 1;
            const isReverseMVPMoveX = document.getElementById('reverseMVPMoveX').checked ? -1 : 1;
            const isReverseMVPMoveY = document.getElementById('reverseMVPMoveY').checked ? -1 : 1;

            const gps = navigator.getGamepads ? navigator.getGamepads() : [];

            for (let i = 0; i < gps.length; i++) {
                const gp = gps[i];
                if (!gp) continue;

                // ====== 摇杆（实时输出） ======
                if (gp.axes && gp.axes.length >= 4 && _anyKeyDown === false && isUseXBOX) {
                    const leftX  = formatAxis(applyDeadzone(gp.axes[0], DEADZONE)) * isReverseMVPMoveX;
                    const leftY  = formatAxis(applyDeadzone(gp.axes[1], DEADZONE)) * isReverseMVPMoveY;
                    const rightX = -formatAxis(applyDeadzone(gp.axes[2], DEADZONE)) * isInverteCamX;
                    const rightY = -formatAxis(applyDeadzone(gp.axes[3], DEADZONE)) * isInverteCamY;
                    k.keys['viewBackward'] = xbox.roundHalfUp(leftY, isUseHighPreci);
                    k.keys['viewRight'] = xbox.roundHalfUp(leftX, isUseHighPreci);
                    k.keys.turnRight += rightX * highPreciDeg;
                    k.keys.turnUp    += rightY * highPreciDeg;
                }

                const buttonMap = {
                    0: "A",
                    1: "B",
                    2: "X",
                    3: "Y",
                    4: "LB",
                    5: "RB",
                    6: "LT", // 模拟值
                    7: "RT",  // 模拟值  // 8
                    8: "doublebox",
                    9: "menu",
                    12: "up",
                    13: "down",
                    14: "left",
                    15: "right",

                };

                const mvpBody = k.mainVPlayer.body;

                // 在外部定义状态记录对象
                if (!window.gamepadButtonState) {
                    window.gamepadButtonState = {};
                }

                if (gp.buttons && isUseXBOX) {
                    gp.buttons.forEach((b, bi) => {
                        const name = buttonMap[bi];
                        if (!name) return;

                        const pressed = b.pressed;
                        const value = b.value;
                        const prevState = window.gamepadButtonState[bi] || { pressed: false, value: 0 };
                        const justPressed = pressed && !prevState.pressed;
                        const justReleased = !pressed && prevState.pressed;

                        if (name === "A" && justPressed) {  // 冻结和解冻
                            k.mainVPlayer.body.velocity.y = k.jumpYVel;
                            if(mvpBody.mass === 0){
                                mvpBody.mass = 50;  // 重量还原
                            }
                        }

                        if (name === "B" && justPressed) {  // 跳跃
                            if(mvpBody.mass === 0){
                                mvpBody.mass = 50;
                            } else {
                                mvpBody.mass = 0;
                                mvpBody.velocity.set(0, 0, 0);
                                mvpBody.angularVelocity.set(0, 0, 0);
                                mvpBody.force.set(0, 0, 0);
                                mvpBody.torque.set(0, 0, 0);
                            }
                        }

                        if (name === "X" && justPressed) {  
                            k.centerDot.setCamView();
                        }

                        if (name === "Y" && justPressed) {
                            
                        }

                        if (name === "LB") {
                            highPreciDeg = value > 0.5 ? 0.2 : 1;
                        }

                        if (name === "RB" && justPressed) {
                            if(k.centerPointColorUpdatax === null){ // 开关 centerPoint
                                k.centerDot.openPoint(k);
                            } else {  // 关点
                                k.centerDot.closePoint(k)
                            }
                        }

                        if (name === "LT") {
                            k.isShiftPress = value;
                        }

                        if (name === "RT" && justPressed) {  

                        }

                        if (name === "doublebox" && justPressed) {
                            
                        }

                        if (name === "menu" && justPressed) {
                            const isHidden = modal.classList.contains("zindex-1");
                            if (isHidden) {
                                showModal();
                                k.keys['viewForward'] = 0;
                                k.keys['viewBackward'] = 0;
                                k.keys['viewLeft'] = 0;
                                k.keys['viewRight'] = 0;
                                unlockPointer();
                            } else {
                                hideModal();
                                lockPointer();
                            }
                        }

                        // if (name === "up" ) {
                        //     k.keys['viewForward'] = value;
                        // }

                        // if (name === "down" ) {
                        //     k.keys['viewBackward'] = value;
                        // }

                        // if (name === "left" ) {
                        //     k.keys['viewLeft'] = value;
                        // }

                        // if (name === "right" ) {
                        //     k.keys['viewRight'] = value;
                        // }

                        // 保存当前状态供下一帧使用
                        window.gamepadButtonState[bi] = { pressed, value };
                    });
                }
            }

            requestAnimationFrame(readGamepads);
        }

        readGamepads();
    },


    // 正负 四舍五入
    roundHalfUp : (n, close = false) => {
        if(close) { return n }
        return n >= 0
            ? Math.floor(n + 0.5)
            : Math.ceil(n - 0.5);
    },
}