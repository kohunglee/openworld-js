/**
 * 简单的动画插件
 * ========
 * 可以生成一些简单的动画，不过代码未经过优化，很多
 */

// 插件入口
export default function(ccgxkObj) {

    const runtime = 300;
    const smoothAnimation = createSwingingAnimation('joint_test', -30, 45, runtime, true);
    const smoothAnimation_left = createSwingingAnimation('joint_test_left', 45, -30, runtime, true);
    const smoothAnimation_leg_right = createSwingingAnimation('joint_test_right_leg', 45, -30, runtime, true);
    const smoothAnimation_leg_left = createSwingingAnimation('joint_test_left_leg', -30, 45, runtime, true);

    ccgxkObj.stopmyani = () => {
        smoothAnimation.stop();
        smoothAnimation_left.stop();
        smoothAnimation_leg_right.stop();
        smoothAnimation_leg_left.stop();
    }

    ccgxkObj.startmyani = () => {
        smoothAnimation.start();
        smoothAnimation_left.start();
        smoothAnimation_leg_right.start();
        smoothAnimation_leg_left.start();
    }

    /**
     * 创建一个可控制的关节摆动动画对象。
     */
    function createSwingingAnimation(jointName, startAngle, endAngle, period, useSin) {
        let animationFrameId = null, startTime = 0;
        const center = (startAngle + endAngle) / 2;      // 计算角度中心点
        const amplitude = (startAngle - endAngle) / 2;   // 计算振幅
        function animate() {
            const elapsed = performance.now() - startTime;
            const progress = (elapsed % period) / period; // 计算进度 (0 to 1)
            const factor = useSin ? Math.cos(progress * Math.PI * 2) : 1 - Math.abs(progress * 2 - 1) * 2;
            const angle = center + amplitude * factor;
            ccgxkObj.W.cube({ n: jointName, rx: angle });
            animationFrameId = requestAnimationFrame(animate);
        }
        return {
            start: () => {
                if (animationFrameId === null) {
                    startTime = performance.now();
                    animate();
                }
            },
            stop: () => {
                if (animationFrameId !== null) {
                    cancelAnimationFrame(animationFrameId);
                    animationFrameId = null;
                    k.W.cube({ n: jointName, rx: 0 });
                }
            }
        };
    }

    let isWPressed = false;
    window.addEventListener('keydown', (event) => {  // 按下键
        if (event.code === 'KeyW' && !isWPressed) {
            isWPressed = true;
            ccgxkObj.startmyani();
        }
    });
    window.addEventListener('keyup', (event) => {  // 松开键
        if (event.code === 'KeyW') {
            isWPressed = false;
            ccgxkObj.stopmyani();
        }
    });
}


