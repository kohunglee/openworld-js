/**
 * 主角的第一视角操控
 */
export default {

    // 主角被手动操纵的状态值
    keys : {
        viewForward: 0,  // 向前移动
        viewBackward: 0,
        turnRight: 0,
        turnLeft: 0,  // 向左旋转
        turnUp: 0,
        turnDown: 0,
        viewUp: 0,
        viewDown: 0,
        viewLeft: 0,  // 向左移动
        viewRight: 0,
        shiftKeyvalue: 0,
        jumping: 0,
        frozen: 0,  // 冻结
    },

    // 键盘按键 与 操作状态值 的对应
    keyMap : {
        'w': 'viewForward',
        's': 'viewBackward',
        'a': 'viewLeft',
        'd': 'viewRight',
        'i': 'viewUp',
        'v': 'viewDown',
        'o': 'turnUp',
        'p': 'turnDown',
        'k': 'viewLeft',
        'l': 'viewRight',
        'b': 'frozen',
        'arrowup': 'viewForward',
        'arrowdown': 'viewBackward',
        'arrowleft': 'viewLeft',
        'arrowright': 'viewRight',
    },

    // 是否按下了 shift 键
    isShiftPress : 0,

    // 判断当前是否是鼠标锁定状态
    isPointerLock : function(){
        return document.pointerLockElement === this.canvas || document.mozPointerLockElement === this.canvas || document.webkitPointerLockElement === this.canvas;
    },

    // 事件监听
    eventListener : function(){
        var _this = this;
        var isMouseMove = false;
        document.addEventListener('keydown', function(e) {  // 按下键盘
            _this._handleKey(e, 1);
        });
        document.addEventListener('keyup', function(e) {  // 松开键盘
            _this._handleKey(e, 0);
        });
        document.addEventListener('mousemove', function(e) {  // 鼠标移动
            if (isMouseMove) {
                _this.keys.turnRight -= e.movementX * 0.1;
                _this.keys.turnUp -= e.movementY * 0.1;
                _this.hooks.emit('mouseMove', this, this.keys);  // 钩子：鼠标移动
            }
        });
        this.canvas.addEventListener('click', (e) => {  // 单击画布，开启虚拟鼠标
            this.canvas.requestPointerLock = this.canvas.requestPointerLock || this.canvas.mozRequestPointerLock || this.canvas.webkitRequestPointerLock;
            this.canvas.requestPointerLock();
            isMouseMove = true;
            if(document.pointerLockElement){
                _this.hooks.emitSync('pointer_lock_click', _this, e);  // 钩子：虚拟鼠标下的单击事件
            }
        });
        this.lockChangeAlert = function() {  // 单击 ESC 键后
            if (document.pointerLockElement === _this.canvas || document.mozPointerLockElement === _this.canvas || document.webkitPointerLockElement === _this.canvas) {
                isMouseMove = true;
            } else {
                isMouseMove = false;
            }
        }
        document.addEventListener('pointerlockchange', this.lockChangeAlert, false);
        document.addEventListener('mozpointerlockchange', this.lockChangeAlert, false);
        document.addEventListener('webkitpointerlockchange', this.lockChangeAlert, false);
        window.addEventListener('resize', () => {  // 重置窗口大小
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.W.resetView();
        });

    },

    // 键盘事件处理逻辑
    _handleKey : function(e, value) {
        if(!this.isPointerLock()) { return }
        var action = this.keyMap[e.key.toLowerCase()];
        if (action) { this.keys[action] = value; }
        if ((e.keyCode === 32 || e.key.toLowerCase() === 'e') && this.mainVPlayer !== null) {  // e 或 空格键，飞翔
            if (this.keys.jumping === 0) {
                this.mainVPlayer.body.velocity.y = this.jumpYVel;
                this.hooks.emit('jump', this);  // 钩子：跳跃
            }
            this.keys.jumping = value;
        }
        if (e.keyCode === 16 || e.key.toLowerCase() === 'q') {  // shift键 或 q 开启加速
            this.isShiftPress = value;

        }
        this.hooks.emit('handlekey', this, this.keys);  // 钩子：键盘事件
    },

    // 向前（后）移动的加速度辅助计算值
    forwardAcc : 0,

    // 显示主角的实时位置
    displayPOS : function(){
        const posInfo = document.getElementById('posInfo');
        const pos = this.mainVPlayer?.body?.position;
        if(!posInfo) {return 0}
        if(this.mainVPlayer !== null){
            posInfo.textContent = (
                '位置: X:' + pos.x.toFixed(2) +
                ', Y:' + pos.y.toFixed(2) +
                ', Z:' + pos.z.toFixed(2) + ', | '
            );
        }
    },

    // 供 calMovePara() 调用的常量
    WALK_SPEED: 1 / 8,       // 每帧增加的速度
    SPRINT_MIN_SPEED: 5.0,   // 最低冲刺速度
    SPRINT_MAX_SPEED: 15.0,  // 最高冲刺速度
    ACCELERATION: 0.25,      // 每帧增加的速度
    JUMP_STRENGTH: 6.0,      // 跳跃力度
    JUMP_HOLD_LIMIT: 30,     // 允许持续跳跃（施加向上速度）的帧数
    DEG_TO_RAD: Math.PI / 180,

    // 计算物体（主要是相机和主角）的移动参数
    calMovePara : function(X, Y, Z, RX, RY, RZ){
        const keys = this.keys;
        const mPVbody = this.mainVPlayer.body;
        if (keys.viewForward || keys.viewBackward) {  // 前后平移
            const direction = (-keys.viewForward + keys.viewBackward);
            if (this.isShiftPress) {  // 物理速度（快跑）
                if (this.currentSpeed < this.SPRINT_MIN_SPEED) {  //+6 处理加速度
                    this.currentSpeed = this.SPRINT_MIN_SPEED;
                }
                if (this.currentSpeed < this.SPRINT_MAX_SPEED) {
                    this.currentSpeed += this.ACCELERATION;
                }
                const localForward = new CANNON.Vec3(0, 0, direction);
                const worldForward = mPVbody.quaternion.vmult(localForward);
                const horizontalVelocity = worldForward.scale(this.currentSpeed);
                let verticalVelocity = 0;
                if (keys.jumping) {  // 处理跳跃逻辑
                    if (this.jumpHoldFrames < this.JUMP_HOLD_LIMIT) {
                        verticalVelocity = this.JUMP_STRENGTH;
                    }
                    this.jumpHoldFrames++;
                } else {
                    this.jumpHoldFrames = 0;
                }
                mPVbody.velocity.set(  // 据说可以清晰地分离水平和垂直的控制
                    horizontalVelocity.x,
                    verticalVelocity,
                    horizontalVelocity.z
                );
            } else {  // 数学速度（慢跑）
                this.currentSpeed = 0;
                this.jumpHoldFrames = 0;
                const moveDistance = direction * this.WALK_SPEED;
                Z += moveDistance * Math.cos(RY * this.DEG_TO_RAD);
                X += moveDistance * Math.sin(RY * this.DEG_TO_RAD);
            }
            this.displayPOS();
            this.hooks.emit('forwardBackward', this);  // 钩子：前后移动
        }
        if (keys.viewLeft || keys.viewRight) {  // 左右平移
            Z += (-keys.viewLeft + keys.viewRight) * Math.cos((RY + 90) * Math.PI / 180) / 10;
            X += (-keys.viewLeft + keys.viewRight) * Math.sin((RY + 90) * Math.PI / 180) / 10;
            this.displayPOS();
        }
        if(this.lastIsShiftPress !== this.isShiftPress && this.lastIsShiftPress){  // 松开 Q 的瞬间，
            this.forwardAcc = 10;  // 加速度归 0
            mPVbody.velocity.set(0, 0, 0);  // 速度归 0 一下
        }
        this.lastIsShiftPress = this.isShiftPress;
        RY = this.keys.turnRight;
        RX = this.keys.turnUp;
        return {  x: X,  y: Y,  z: Z,  rx: RX,  ry: RY,  rz: RZ  }
    },

    // 主角物理体
    mainVPlayer : null,

    // 摄像机的一些参数
    mainCamera : {
        groupName : null,
        pos : {  // 相对坐标系，相对于主角（下面 qua 也是）
            x: 0,
            y: 2,
            z: 4,
        },
        qua : {
            rx: 0,
            ry: 0,
            rz: 0,
        },
    },

    // 主角、相机辅助值
    isMVPInit : false,  // 相机和主角是否初始化
    Y_AXIS : new CANNON.Vec3(0, 1, 0),  //+ 辅助值
    DEG_TO_RAD : Math.PI / 180,

    // 摄像机和主角的移动和旋转（包括初始化 mVP）
    mainVPlayerMove : function(mVP){
        if(mVP === null){return};
        const cam = this.mainCamera;
        if(this.isMVPInit === false){
            cam.groupName = mVP.name;
            this.isMVPInit = true;
        }
        const vplayerBodyPos = mVP.body.position;  //+ 计算下一帧的主角数据，并传递给物理引擎
        const vplayerBodyQua = mVP.body.quaternion;
        const vplayerAct = this.calMovePara(  // 获取按键和鼠标事件处理后的移动参数
            vplayerBodyPos.x, vplayerBodyPos.y, vplayerBodyPos.z,
            cam.qua.rx, cam.qua.ry, cam.qua.rz
        );
        mVP.body.position.x = vplayerAct.x;
        mVP.body.position.y = vplayerAct.y;
        mVP.body.position.z = vplayerAct.z;
        cam.qua = vplayerAct;
        vplayerBodyQua.setFromAxisAngle(this.Y_AXIS, this.DEG_TO_RAD * vplayerAct.ry);  // 主角只旋转 Y 轴
        this.W.camera({g:mVP.name, x:cam.pos.x, y:cam.pos.y, z:cam.pos.z, rx: cam.qua.rx, rz: cam.qua.rz})  // 摄像机只旋转 X 和 Z 轴
        const pos = mVP.body.position;
        const quat = mVP.body.quaternion;
        const indexItemEuler = this.quaternionToEuler(quat);
        mVP.quat = quat;
        mVP.rX = indexItemEuler.rX;
        mVP.rY = indexItemEuler.rY;
        mVP.rZ = indexItemEuler.rZ;
        mVP.X = pos.x;
        mVP.Y = pos.y;
        mVP.Z = pos.z;
        this.W.move({ n: mVP.name, x: mVP.X, y: mVP.Y, z: mVP.Z, rx: mVP.rX, ry: mVP.rY, rz: mVP.rZ});
        mVP.posID = this.calPosID(mVP.X, mVP.Y, mVP.Z, 2);
        return 0;
    },
}