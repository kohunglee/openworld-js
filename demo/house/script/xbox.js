
// 开启游戏手柄
if(false){
    const DEADZONE = 0.05;

    function applyDeadzone(v, dz) {
    return Math.abs(v) < dz ? 0 : v;
    }

    function formatAxis(v) {
    return Math.round(v * 1000) / 1000;
    }

    function readGamepads() {
    const gps = navigator.getGamepads ? navigator.getGamepads() : [];

    for (let i = 0; i < gps.length; i++) {
        const gp = gps[i];
        if (!gp) continue;

        // ====== 摇杆（实时输出） ======
        if (gp.axes && gp.axes.length >= 4) {
            const leftX  = formatAxis(applyDeadzone(gp.axes[0], DEADZONE));
            const leftY  = formatAxis(applyDeadzone(gp.axes[1], DEADZONE));
            const rightX = formatAxis(applyDeadzone(gp.axes[2], DEADZONE));
            const rightY = formatAxis(applyDeadzone(gp.axes[3], DEADZONE));
            k.keys['viewForward'] = -leftY;
            k.keys['viewLeft'] = -leftX;
            k.keys.turnRight += -rightX;
            k.keys.turnUp    += -rightY;
        }

        const buttonMap = {
            0: "A",
            1: "B",
            2: "X",
            3: "Y",
            4: "LB",
            5: "RB",
            6: "LT", // 模拟值
            7: "RT"  // 模拟值
        };

        const mvpBody = k.mainVPlayer.body;

        // 在外部定义状态记录对象
        if (!window.gamepadButtonState) {
            window.gamepadButtonState = {};
        }

        if (gp.buttons) {
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

                if (name === "Y" && justPressed) {  // 相当于 TAB
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

                if (name === "LB" && justPressed) {
                }

                if (name === "RB" && justPressed) {
                }

                if (name === "LT") {
                    k.isShiftPress = value;
                }

                if (name === "RT" && justPressed) {
                }

                // 保存当前状态供下一帧使用
                window.gamepadButtonState[bi] = { pressed, value };
            });
        }
    }

    requestAnimationFrame(readGamepads);
    }

    readGamepads();

}
