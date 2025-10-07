/**
 * 经过优化的动画插件
 * ==================
 * 动画插件
 */
export default function(ccgxkObj) {
    const animationBlueprints = {
        jog: {
            duration: 300,
            joints: [  // 慢跑
                { name: 'joint_test',            start: -30, end: 45,  axis: 'x' },
                { name: 'joint_test_left',       start: 45,  end: -30, axis: 'x' },
                { name: 'joint_test_right_leg',  start: 45,  end: -30, axis: 'x' },
                { name: 'joint_test_left_leg',   start: -30, end: 45,  axis: 'x' }
            ],
            stopPose: [
                { name: 'joint_test',            value: 0,  axis: 'rx'  },
                { name: 'joint_test_left',       value: 0,  axis: 'rx'  },
                { name: 'joint_test_right_leg',  value: 0,  axis: 'rx'  },
                { name: 'joint_test_left_leg',   value: 0,  axis: 'rx' }
            ]
        },
        jump: {  // 跳跃
            duration: 300,
            joints: [
                // { name: 'joint_test',            start: 30,  end: 75,  axis: 'z' },
                // { name: 'joint_test_left',       start: -30, end: -75, axis: 'z' },
                // { name: 'joint_test_right_leg',  start: 10,  end: 20,  axis: 'x' },
                // { name: 'joint_test_left_leg',   start: 10,  end: 20,  axis: 'x' }
            ],
            stopPose: [
                // { name: 'joint_test',      value: 15, axis: 'rz' },
                // { name: 'joint_test_left', value: -15, axis: 'rz' },
                // { name: 'joint_test_right_leg',  value: 0,  axis: 'rx'  },
                // { name: 'joint_test_left_leg',   value: 0,  axis: 'rx' }
            ]
        }
    };

    // 动画管理
    const animationManager = {
        actions: {},
        currentAction: null,
        
        // 将动画搞到 actions 里
        init() {
            for (const name in animationBlueprints) {
                this.actions[name] = this.buildActionFrom(animationBlueprints[name]);
            }
        },

        // 绑定动画
        buildActionFrom(blueprint) {
            const puppeteers = blueprint.joints.map(jointConfig => 
                createJointAnimation(jointConfig, blueprint.duration)
            );

            return {
                start: () => puppeteers.forEach(p => p.start()),
                stop: () => {
                    puppeteers.forEach(p => p.stop());
                    if (blueprint.stopPose) {
                        blueprint.stopPose.forEach(pose => {
                            // 这里 k.W.cube 假设是您的全局对象
                            k.W.cube({ n: pose.name, [pose.axis]: pose.value });
                        });
                    }
                }
            };
        },

        /**
         * 命令导演：上演某个节目！
         * @param {string} name - 节目名 (如 'jog' 或 'jump')
         */
        play(name) {
            if (this.currentAction === name || !this.actions[name]) return; // 如果正在进行，则无动作
            if (this.currentAction) {
                this.actions[this.currentAction].stop();  // 如果没有，则停止当前节目
            }
            this.actions[name].start();  // 启动新节目
            this.currentAction = name;
        },

        /**
         * 停止当前
         */
        stopCurrent() {
            if (this.currentAction) {
                this.actions[this.currentAction].stop();
                this.currentAction = null;
            }
        }
    };

    animationManager.init();  // 初始化

    function createJointAnimation(config, duration) {
        let frameId = null, startTime = 0;
        const center = (config.start + config.end) / 2;
        const amplitude = (config.start - config.end) / 2;
        
        function animate() {
            const elapsed = performance.now() - startTime;
            const progress = (elapsed % duration) / duration;
            const factor = Math.cos(progress * Math.PI * 2); // 使用 cos 创造平滑的来回摆动
            const angle = center + amplitude * factor;
            
            const updateConfig = { n: config.name };
            const axisKey = `r${config.axis}`; // 'x' -> 'rx', 'z' -> 'rz'
            updateConfig[axisKey] = angle;
            
            // 这里 ccgxkObj.W.cube 假设是您传入的对象方法
            ccgxkObj.W.cube(updateConfig);
            frameId = requestAnimationFrame(animate);
        }

        return {
            start: () => {
                if (frameId === null) {
                    startTime = performance.now();
                    animate();
                }
            },
            stop: () => {
                if (frameId !== null) {
                    cancelAnimationFrame(frameId);
                    frameId = null;
                }
            }
        };
    }

    // ================== 4. 舞台遥控器 (Event Listeners) ==================
    // 我们把键盘事件监听器想象成遥控器，它只负责向“总导演”发送指令。
    // 按下 W，就告诉导演“上演跑步”；松开，就告诉导演“全部停下”。
    const keyState = { KeyW: false, KeyE: false };

    window.addEventListener('keydown', (event) => {
        if (!keyState[event.code]) {
            keyState[event.code] = true;
            if (event.code === 'KeyW') animationManager.play('jog');
        }
    });

    window.addEventListener('keyup', (event) => {
        if (keyState[event.code]) {
            keyState[event.code] = false;
            // 只有当两个键都松开时才停止动画，或者根据您的需求调整
            // 这里简化为，任何一个键松开，都停止当前动画
            // animationManager.stopCurrent();
            if (event.code === 'KeyW') animationManager.stopCurrent();
        }
    });
}