/*! open.js v1.0.0 | (c) kohunglee | MIT License */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["openworld"] = factory();
	else
		root["openworld"] = factory();
})(this, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/common/hooks.js":
/*!*****************************!*\
  !*** ./src/common/hooks.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * 这是通用的 JS 钩子，在 WJS CANNON OPENWORLD 里都有引入
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
    _hookQueues: new Map(), // 任务队列

    // 注册事件
    on(hookName, callbackFunction, priority = 100) {
      if (typeof callbackFunction !== 'function') throw new TypeError('Callback must be function');
      const queue = this._hookQueues.get(hookName) || [];
      queue.push({ func: callbackFunction, priority: priority });
      queue._isSorted = false;  //+1 标记队列为未排序，并加入【任务列表】
      this._hookQueues.set(hookName, queue);
    },

    // 注销事件
    off(hookName, callbackFunction) {
      const queue = this._hookQueues.get(hookName); if (!queue) return;
      const filteredQueue = queue.filter(item => item.func !== callbackFunction);  // 删掉指定任务
      if (filteredQueue.length === 0) this._hookQueues.delete(hookName); // 如果队列为空，直接删除这个 hookName，释放内存
      else if (filteredQueue.length < queue.length) { filteredQueue._isSorted = false; this._hookQueues.set(hookName, filteredQueue); } // 更新队列，标记为未排序
    },

    // 排序
    _getSortedCallbacks(hookName) {
      let queue = this._hookQueues.get(hookName); if (!queue) return [];
      if (!queue._isSorted) { queue.sort((a, b) => b.priority - a.priority); queue._isSorted = true; } // 排序后，标记为已排序（只排序一次）
      return [...queue];
    },

    // 异步触发
    async emit(hookName, ...args) {
      const callbacks = this._getSortedCallbacks(hookName).map(item => item.func);
      const promises = callbacks.map(async callback => { // 为每个“监听者”创建一个异步执行的Promise
        try { return await callback(...args); } catch (errorReason) {
          console.error(`[Async]Hook ${hookName} error:`, errorReason);
          throw errorReason; 
        } });
      return Promise.allSettled(promises);
    },

    // 同步触发
    emitSync(hookName, ...args) {
      const results = []; // 用于收集执行结果
      for (const { func } of this._getSortedCallbacks(hookName)) {
        try {
          const returnValue = func(...args);
          results.push({ status: 'fulfilled', value: returnValue });
          if (returnValue === false) break;  // 返回假，中断
        }
        catch (errorReason) {
          console.error(`[Sync]Hook ${hookName} error:`, errorReason);
          results.push({ status: 'rejected', reason: errorReason }); 
        }
      }
      return results;
    },
});

/***/ }),

/***/ "./src/core/animate.js":
/*!*****************************!*\
  !*** ./src/core/animate.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * 动画进程相关
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
    // 按照列表将 物理体 逐个 物理计算可视化 更新
    gridKeyCurrentTime : 0,  // 辅助更新 gridKey 的工具时间值
    updataBodylist : function(){
        this.dynaNodes_lab();  // 一帧计算区块一次

        for (const index of this.currentlyActiveIndices) {  // 暂时选择遍历吧，反正也显示不了几个，也兼容后续的 mass 改变
            const p_offset = index * 8;
            if(this.positionsStatus[p_offset + 7] > 0){  // 选择 状态码/mass 大于 0 的物体
                const indexItem = this.indexToArgs.get(index);
                const canBody = indexItem.cannonBody;
                if(!canBody) continue;
                const disxX = canBody.position.x - this.positionsStatus[p_offset];
                const disyY = canBody.position.y - this.positionsStatus[p_offset + 1];
                const diszZ = canBody.position.z - this.positionsStatus[p_offset + 2];
                const disten = Math.sqrt(disxX*disxX + disyY*disyY + diszZ*diszZ);  // 计算与自身上次的距离（必须大于 某个值 才能被可视化）
                this.positionsStatus[p_offset] = canBody.position.x;  //+7 位置储存到变量里（这种挨个赋值的方式性能最好）
                this.positionsStatus[p_offset + 1] = canBody.position.y;
                this.positionsStatus[p_offset + 2] = canBody.position.z;
                this.positionsStatus[p_offset + 3] = canBody.quaternion.x;
                this.positionsStatus[p_offset + 4] = canBody.quaternion.y;
                this.positionsStatus[p_offset + 5] = canBody.quaternion.z;
                this.positionsStatus[p_offset + 6] = canBody.quaternion.w;
                if(indexItem.isVisualMode !== false && this.W.next['T' + index] && disten > 0.0001){  // 可视化
                    const eulerQuat = this.quaternionToEuler(canBody.quaternion);
                    this.W.move({
                        n: 'T' + index,
                        x: this.positionsStatus[p_offset],
                        y: this.positionsStatus[p_offset + 1],
                        z: this.positionsStatus[p_offset + 2],
                        rx: eulerQuat.rX,
                        ry: eulerQuat.rY,
                        rz: eulerQuat.rZ,
                    });
                    if(disten > 0.01 && (performance.now() - this.gridKeyCurrentTime > 500)){  //+ 略大一点的距离更改，500ms 间隔以上，计算区块 key，更新表
                        const orginGridKey = indexItem.gridkey || 0;
                        const thisDPZ = this.physicsProps[p_offset + 4];
                        const currentGridKey = `${thisDPZ}_${Math.floor(this.positionsStatus[p_offset] / this.gridsize[thisDPZ])}_${Math.floor(this.positionsStatus[p_offset + 2] / this.gridsize[thisDPZ])}`;
                        if(orginGridKey) {
                            if(currentGridKey !== orginGridKey){
                                var indicesInCell_orige = this.spatialGrid.get(orginGridKey);  //+8 删去已失效的 key
                                if(indicesInCell_orige){
                                    const indexInCell = indicesInCell_orige.indexOf(index);
                                    if(indexInCell > -1){
                                        indicesInCell_orige.splice(indexInCell, 1);
                                        this.spatialGrid.set(orginGridKey, indicesInCell_orige);
                                    }
                                }
                                var indicesInCell = this.spatialGrid.get(currentGridKey);  //+4 添加新的 key
                                if (!indicesInCell) { indicesInCell = [] }
                                indicesInCell.push(index);
                                this.spatialGrid.set(currentGridKey, indicesInCell);
                            }
                        }
                        indexItem.gridkey = currentGridKey; 
                        this.gridKeyCurrentTime = performance.now();
                    }
                }
            }
        }
    },

    // 计算一次物理世界
    cannonAni : function(){
        this.world.step(1 / 60); // 时间步长 1/60，用于更新物理世界
    },

    // 动画循环
    animate : function(){
        var _this = this;
        const viewAnimate = function() {
            _this.cannonAni(); // 物理世界计算
            _this.updataBodylist(); // 更新物体列表
            _this.mainVPlayerMove(_this.mainVPlayer); // 摄像机和主角的移动和旋转
            _this.hooks.emit('animatePreFrame', _this);  // 钩子：'每一帧的计算'
            requestAnimationFrame(viewAnimate);
        }
        viewAnimate();
    },
});

/***/ }),

/***/ "./src/core/main.js":
/*!**************************!*\
  !*** ./src/core/main.js ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({

    // 配置
    speedH: 3,              // 最高速度的反数
    speedL: 8,              // 最低速度的反数
    speedAdd: 0.1,          // 速度的增加率
    jumpYVel: 5,            // 跳跃时向上的加速度
    fov:35,                 // 相机视野
    colorClear: "#7A4141",  // 画布背景色
    displayViewTime: 0.9,      // 显示清晰度

    // openworld 的 cannon.js 物理世界
    world : null,

    // 物体列表
    bodylist : new Array(),  // 有质量，有物理计算，可视化
    bodylistNotPys : new Array(),  // 纯模型，不进行物理计算
    bodylistMass0 : new Array(),  // 无质量的可视模型

    // 画板
    canvas : null,

    // 初始化
    initWorld : function(canvas){
        this.canvas = window.document.getElementById(canvas);
        this.initW(this.canvas);
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0); // 地球重力9.82m/s²
        this.world.broadphase = new CANNON.SAPBroadphase(this.world); // 宽相检测算法
        this.world.solver.iterations = 10; // 物理迭代
        this.world.addContactMaterial(this.cannonDefaultCantactMaterial);  // 默认材质关联
        this.initBodyTypeArray(1_000_000);  // 初始化一个物体信息库
        this.eventListener();  // 事件监听
        this.animate(); // 动画
    },

    // 初始化 W 引擎
    initW : function(c){
        const W = this.W;
        c.width = window.innerWidth * this.displayViewTime;
        c.height = window.innerHeight * this.displayViewTime;
        W.reset(c);
        W.ambient(0.7);
        W.light({ x: 0.5, y: -0.3, z: 0.5});
        W.clearColor(this.colorClear);
        W.camera({n:'camera', fov: this.fov});
        W.group({n:'posZero',x:0,y:1,z:0});  //+8 下面这几行，绘制原点坐标轴
        W.cube({g:'posZero',x:5,w:10,h:.5,d:.5,b:"f44"});
        W.cube({g:'posZero',y:5,h:10,w:.5,d:.5,b:"4f4"});
        W.cube({g:'posZero',z:5,d:10,w:.5,h:.5,b:"44f"});
        W.pyramid({g:'posZero',size:1,x:10,rz:-90,b:"f44"});
        W.pyramid({g:'posZero',size:1,y:10,b:"4f4"});
        W.pyramid({g:'posZero',size:1,z:10,rx:90,b:"44f"});
        W.sphere({n:'posZeroSphere',x:0, y:0, z:0, size:5, s:1, b:"#FF145B"});
    },
});

/***/ }),

/***/ "./src/obj/addobj.js":
/*!***************************!*\
  !*** ./src/obj/addobj.js ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * 添加物体
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
    
    // 碰撞计算组（cannon.js）
    allGroupNum : 1,  // 玩家、地面、小物件...
    stoneGroupNum : 2,  // 静止石头

    // 物体 name id（递增使用）
    bodyObjName : 0,

    // 初始化类型化数组（储存物体信息使用，TA = typeArray）
    positionsStatusTA : null,  // 位置和状态
    bodyProp : null,           // 属性
    physicsPropsTA : null,     // 物理属性
    freeSlots : null,          // 空位表
    indexToArgs : new Map(),   // index -> args 对应表
    spatialGrid : new Map(),   // 区块  -> index 对应表
    initBodyTypeArray : function(MAX_BODIES = 1_000_000){  // 根据最多物体数量，初始化
        this.positionsStatus = new Float32Array(MAX_BODIES * 8);  // [x, y, z, qx, qy, qz, qw, status]
        this.physicsProps = new Float32Array(MAX_BODIES * 8);  // [mass, width, height, depth]
        this.freeSlots = new Array(MAX_BODIES).fill(0).map((_, i) => MAX_BODIES - 1 - i); // 一个从大到小排列的空闲索引栈，如 [5,4,3,2,1]
    },

    // 最起初的添加物体，TA 物体
    addTABox : function({
                DPZ = 3,
                X = 5, Y = 5, Z = 5,
                quat = {x: 0, y: 0, z: 0, w: 1},
                mass = 0, width = 1, depth = 1, height = 1, size = 1,
                rX= 0, rY= 0, rZ= 0,
            } = {}){
        const myargs = Array.from(arguments)[0];  // 提取参数
        if(size !== 1){  // 处理体积大小
            width =  depth =  height = size;
        }
        if(rX || rY || rZ){  // 处理旋转
            quat = this.eulerToQuaternion({rX,rY,rZ});
        }
        if (this.freeSlots.length === 0) {alert('BodyTypeArray 容量已达上限，需要扩容！'); return false;};  // 没有空位就退，否则占个位子
        const index = this.freeSlots.pop();
        const p_offset = index * 8;  //+8 向 TA 传数据的起点，并传入数据（繁琐写法，但性能高）
        this.positionsStatus[p_offset] = X;  
        this.positionsStatus[p_offset + 1] = Y;
        this.positionsStatus[p_offset + 2] = Z;
        this.positionsStatus[p_offset + 3] = quat.x;
        this.positionsStatus[p_offset + 4] = quat.y;
        this.positionsStatus[p_offset + 5] = quat.z;
        this.positionsStatus[p_offset + 6] = quat.w;
        this.positionsStatus[p_offset + 7] = mass;  // 状态码，-1 代表隐藏，0 表示不计算物理，其他代表 mass 重量
        this.physicsProps[p_offset] = mass;  //+ 这些不需要经常遍历
        this.physicsProps[p_offset + 1] = width;
        this.physicsProps[p_offset + 2] = height;
        this.physicsProps[p_offset + 3] = depth;
        this.physicsProps[p_offset + 4] = DPZ;  // DPZ
        const gridKey = `${DPZ}_${Math.floor(X / this.gridsize[DPZ])}_${Math.floor(Z / this.gridsize[DPZ])}`;  //+5 计算区块 key，并填进数组，再填入表
        let indicesInCell = this.spatialGrid.get(gridKey);
        if (!indicesInCell) { indicesInCell = [] }
        indicesInCell.push(index);
        this.spatialGrid.set(gridKey, indicesInCell);
        this.indexToArgs.set(index, myargs);  // index -> args
    },

    // Box 的默认参数（除去 positionsStatus 里的参数）
    defaultBoxArgs : {
        isPhysical: true,     // 是否物理化
        isVisualMode: true,   // 是否渲染
        DPZ: 3,               // 显示优先级
        colliGroup: 2,        // 碰撞组
        texture: null,
        smooth: 0,
        background: '#888',
        mixValue: 0.71,
        rX: 0,
        rY: 0,
        rZ: 0,
        isShadow: 0,
        tiling: [1, 1],
        shape: 'cube',
        isFictBody: false,    // 物理假体，视觉比真实物理体小一圈，用于颜色探测
        isInvisible: false,  // 在 webgl 留档但不渲染（实验，用于减少渲染压力）
    },

    // 激活 TA 物体
    argsObj : {},  // 外置一个对象，重复利用
    activeTABox : function(index){
        const p_offset = index * 8;
        const posProp = this.positionsStatus.subarray(p_offset, p_offset + 8);    // 提取位置属性
        const physicalProp = this.physicsProps.subarray(p_offset, p_offset + 4);  // 提取物理属性
        const org_args = this.indexToArgs.get(index);  // 提取参数
        this.argsObj = {...this.defaultBoxArgs, ...org_args};  // 为节省内存，固不破坏源对象，使用新对象
        const args = this.argsObj;
        if(args.isPhysical){  // 添加物理体
            const body = new CANNON.Body();  // 新 new 一个对象 （不用对象池，因为 cannon 的对象太复杂）
            body.mass = physicalProp[0];  // mass
            body.type = physicalProp[0] === 0 ? CANNON.Body.STATIC : CANNON.Body.DYNAMIC;
            var boxShape;
            switch (args.shape) {
                case 'sphere':
                    boxShape =  new CANNON.Sphere(physicalProp[1]/2); // 圆的直径以 width 参数值为准
                    break;
                default:
                    const boxSize = new CANNON.Vec3(
                        physicalProp[1]/2,  // w
                        physicalProp[2]/2,  // h
                        physicalProp[3]/2   // d
                    );
                    boxShape = new CANNON.Box(boxSize);
                    break;
            }
            body.addShape(boxShape);
            body.position.set(
                posProp[0],  // x
                posProp[1],  // y
                posProp[2],  // z
            );
            body.material = this.cannonDefaultContactMaterial;
            body.updateMassProperties();
            body.wakeUp();
            body.collisionFilterGroup = args.colliGroup;  // 这 6 行，为物理体分配碰撞组。只有玩家和地面与石头碰撞，石头间不会（小物件除外）
            const collisionFilterMaskMap = {
                1: this.stoneGroupNum | this.allGroupNum,
                2: this.allGroupNum,
            };
            body.collisionFilterMask = collisionFilterMaskMap[args.colliGroup];  // 碰撞组
            this.world.addBody(body);
            body.quaternion.set(
                posProp[3], // quat.x,
                posProp[4], // quat.y,
                posProp[5], // quat.z,
                posProp[6], // quat.w
            );
            org_args.cannonBody = body;  // 注意，是 org_args
        }
        if(args.isVisualMode !== false){  // 添加渲染物体
            var tiling = args.tiling;
            if(posProp[3] !== 0){  // 可近似认为四分数被修改过，遂更新参数
                var eulerQuat = this.quaternionToEuler({ x: posProp[3], y: posProp[4],  z: posProp[5],  w: posProp[6] });
                args.rX = eulerQuat.x;
                args.rY = eulerQuat.y;
                args.rZ = eulerQuat.z
            }
            if(typeof tiling === 'number'){ tiling = [tiling, tiling] }  // 处理平铺数
            const utter = (args.isFictBody) ? 0.1 : 0 // 物理假体，仅在视觉上物体小一圈儿
            var texture, textureError = false;
            if(typeof args.texture === 'string'){  // 处理纹理
                if(window[args.texture] !== undefined || this.textureMap.has(args.texture)){  // 纹理数据 能在全局找到（后续，改成从库里找吧，先使用 window）
                    if(this.textureMap.has(args.texture)){  // 纹理数据 在库中找到
                        texture = this.textureMap.get(args.texture);
                    } else {  // 纹理数据 在全局找到
                        texture = window[args.texture];
                    }
                } else {  // 找不到，需要换个默认纹理
                    texture = null;
                    textureError = true;
                }
            } else {
                texture = args.texture;
            }
            this.W[args.shape]({  // 渲染引擎添加物体
                n: 'T' + index,  // 意为 TypeArray 生成的
                w: physicalProp[1] - utter, d: physicalProp[3] - utter, h: physicalProp[2] - utter,
                x: posProp[0], y:posProp[1], z:posProp[2],
                t: texture, s: args.smooth, tile: tiling,
                rx: args.rX, ry: args.rY, rz: args.rZ, b: args.background, mix: args.mixValue,
                shadow: args.isShadow,
                hidden: args.isInvisible,
            });
            if(textureError){  // 纹理加载失败，尝试换上自定义纹理（id 还是原 id）
                const expRatio = 40;  // 缩放比例
                const cWidth = (physicalProp[1] - utter) * expRatio;
                const cHeight = (physicalProp[2] - utter) * expRatio;
                this.loadTexture([ {
                    func: this.errorTexture,
                    id: args.texture,
                    type: 'png',
                    width: cWidth,
                    height: cHeight,
                    index: index,
                }]).then(res => {
                    this.W[args.shape]({
                        n: 'T' + index,
                        t: this.textureMap.get(args.texture),
                        mix: args.mixValue,
                    });
                });
            }
        }
    },

    // 隐藏 TA 物体
    hiddenTABox : function(index){
        const org_args = this.indexToArgs.get(index);  // 提取参数
        if(org_args.isPhysical !== false && org_args.cannonBody !== undefined){
            this.world.removeBody(org_args.cannonBody);
        }
        if(org_args.isVisualMode !== false){
            this.W.delete('T' + index);
        }
    },































    // 添加 box 物体
    addBox : function({
                DPZ = 2,  // 显示优先级
                isPhysical = true,  // 是否被物理计算
                isVisualMode = true,  // 是否渲染
                kk = 0,
                colliGroup = 2,  // 碰撞组，全能为 1， 静止石头为 2
                name = 'k'+ this.bodyObjName++,  // 如果没指认，则使用随机数生成 ID
                X = 5, Y = 5, Z = 5,
                quat = null,
                isShadow = 0,
                tiling = [1, 1],  // 纹理平铺
                shape = 'cube',  // 默认形状
                mass = 0, width = 1, depth = 1, height = 1, size = 1,
                texture = null, smooth = 0,
                background = '#888', mixValue = 0.71, rX = 0, rY = 0, rZ = 0,
            } = {}){
        var myargs = Array.from(arguments);  // 备份参数
        var posID = this.calPosID(X, Y, Z, DPZ);
        if(size !== 1){  // 处理体积大小
            width =  depth =  height = size;
        }
        var body = null;
        if(isPhysical){  // 是否创建物理计算体
            var boxShape;
            switch (shape) {
                case 'sphere':
                    boxShape =  new CANNON.Sphere(width/2); // 圆的直径以 width 参数值为准
                    break;
                default:
                    const boxSize = new CANNON.Vec3(width/2, height/2, depth/2);
                    boxShape = new CANNON.Box(boxSize);
                    break;
            }

            body = new CANNON.Body({
                mass : mass,
                shape: boxShape,
                position: new CANNON.Vec3(X, Y, Z),
                material: this.cannonDefaultCantactMaterial,
            });

            body.collisionFilterGroup = colliGroup;  // 这 6 行，为物理体分配碰撞组。只有玩家和地面与石头碰撞，石头间不会（小物件除外）
            const collisionFilterMaskMap = {
                1: this.stoneGroupNum | this.allGroupNum,
                2: this.allGroupNum,
            };
            body.collisionFilterMask = collisionFilterMaskMap[colliGroup];  // 碰撞组
        
            this.world.addBody(body);
            if(quat){
                body.quaternion.set(quat.x, quat.y, quat.z, quat.w);
            }
            quat = body.quaternion;
        }
        if(isVisualMode){  // 是否 W 渲染可视化
            if(typeof tiling === 'number'){ tiling = [tiling, tiling] }  // 处理平铺数
            this.W[shape]({
                n: name,
                w: width, d: depth, h: height,
                x: X, y:Y, z:Z,
                t: texture, s: smooth, tile: tiling,
                rx: rX, ry: rY, rz: rZ, b: background, mix: mixValue,
                shadow: isShadow,  // 测试一下

            });
        }
        var result = { name, body, X, Y, Z, rX, rY, rZ, isVisualMode, myargs, posID, DPZ, quat};
        switch (true) {  // 看哪个数组接受它
            case isPhysical === false:
                this.bodylistNotPys.push(result);  // 纯模型
                break;
            case mass === 0:
                this.bodylistMass0.push(result);  // 无质量
                break;
            default:
                this.bodylist.push(result);  // 默认数组
        }
        return result;
    },
});

/***/ }),

/***/ "./src/obj/chunkManager.js":
/*!*********************************!*\
  !*** ./src/obj/chunkManager.js ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * 动态区块管理
 * 
 * 将地图世界分区，以及 n 个优先级，动态加载和卸载模型
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({

    // 计算位置的简码
    calPosID : function(x, y, z, zindex){
        const foo = {2: 100, 3: 100, 4: 40}[zindex] || 0;
        if (zindex === 2) {zindex = ''};
        if(foo === 0){ return 0 }
        var dirctionA = (Math.sign(x) === -1) ? 'X' : 'D';
        var dirctionB = (Math.sign(z) === -1) ? 'B' : 'N';
        var numberA = Math.ceil(x / foo * Math.sign(x));
        var numberB = Math.ceil(z / foo * Math.sign(z));
        return zindex + dirctionA + numberA + dirctionB + numberB;
    },

    // 新的 dynaNodes（适用于长宽 40 以内的物体），lab 版本
    gridsize : new Uint16Array([10000, 1000, 100, 20, 5]),  // 单个区块面积大小（与 DPZ 挨个对应）
    currentlyActiveIndices : new Set(),  // 当前激活状态的物体。也可保存本次的激活物体列表，供下一次使用
    activationQueue : new Array(),  // 激活任务队列
    dynaNodes_lab : function(){
        if(this.mainVPlayer === null || this.stopDynaNodes) {return ''};
        const mVP = this.mainVPlayer;
        const activeGridKeys = [];  // 装 9 * dpz 个格子的区块号
        for (let index = 0; index < this.gridsize.length; index++) {
            const playerGridX = Math.floor(mVP.X / this.gridsize[index]);  //+8 计算主角周围 9 个格子的区块
            const playerGridZ = Math.floor(mVP.Z / this.gridsize[index]);
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    activeGridKeys.push(`${index}_${playerGridX + i}_${playerGridZ + j}`);
                }
            }
        }
        const newActiveIndices = new Set();  // 待做出隐藏动作的物体的 index 列表
        const indicesToHide = new Set(this.currentlyActiveIndices);  // 待做出隐藏动作的物体的 index 列表
        for(const key of activeGridKeys){
            const indicesInGrid = this.spatialGrid.get(key);  // 取物体使用（spatialGrid，物体花名册）
            if (indicesInGrid) {
                for (const index of indicesInGrid) {
                    if(Math.abs(this.positionsStatus[index * 8 + 1] - mVP.Y) < this.gridsize[this.physicsProps[index * 8 + 4]]){  // 高度距离（Y）要接近
                        newActiveIndices.add(index);
                    }
                }
            }
        }
        for (const index of newActiveIndices) {  // 剔除本次还应该是激活状态的
            indicesToHide.delete(index);
        }
        for (const index of newActiveIndices) {  // 执行激活动作
            if(!this.currentlyActiveIndices.has(index)){  // 上次被激活过，这次就不激活了
                const p_offset = index * 8;
                this.positionsStatus[p_offset + 7] = this.physicsProps[p_offset];  // 状态码（或 mass） 重新赋予
                this.activeTABox(index); 
            }
        }
        for(const index of indicesToHide){  // 执行隐藏动作
            const p_offset = index * 8;
            this.positionsStatus[p_offset + 7] = -1;
            this.hiddenTABox(index);
        }
        this.currentlyActiveIndices = newActiveIndices;
        if (this.activationQueue.length > 0 && !this.isActivationScheduled) {  // 如果有旧任务，且没有安排新任务
            this.isActivationScheduled = true;
        }
    },
});

/***/ }),

/***/ "./src/obj/texture.js":
/*!****************************!*\
  !*** ./src/obj/texture.js ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * 纹理设置相关
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({

    // 纹理列表
    textureMap : new Map(),

    // 一个浏览器不知名的特性(bug)，为防止纹理被缓存，所以搞了个递增数，防止重复
    loadTextureIndex : 1,

    // 用于光栅化 canvas 使用的临时 canvas
    rasterizeCanvas : document.createElement('canvas'),

    // 一个异步函数，用于加载纹理
    loadTexture : function(drawFunclist) {
        const texturePromises = [];  // 任务看板（全部完成才返回）
        for(var i = 0; i < drawFunclist.length; i++){
            const drawItem = drawFunclist[i];
            if(this.textureMap.has(drawItem.id) === true) {  // 纹理已经存在
                texturePromises.push(Promise.resolve(this.textureMap.get(drawItem.id)));
                continue;
            }
            const promise = new Promise(resolve => {  // 纹理不存在，异步生成
                if (drawItem.type === 'svg-rasterize') {  // 处理光栅化 svg（异步繁琐，所以放到这里）
                    const svgImage = new Image();
                    svgImage.onload = () => {
                        const canvas = this.rasterizeCanvas;
                        canvas.width = drawItem.width || 400;
                        canvas.height = drawItem.height || 400;
                        const ctx = canvas.getContext('2d');
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(svgImage, 0, 0, canvas.width, canvas.height);
                        const pngBase64 = canvas.toDataURL('image/png');
                        const finalImage = new Image();
                        finalImage.onload = () => {
                            this.textureMap.set(drawItem.id, finalImage);
                            resolve(finalImage); // Promise 完成，返回最终的PNG图片对象
                        };
                        finalImage.id = drawItem.id;
                        finalImage.src = pngBase64;
                    };
                    const svgBlob = new Blob([drawItem.svgCode], { type: 'image/svg+xml' });
                    svgImage.src = URL.createObjectURL(svgBlob);
                } else {
                    const img = new Image();
                    img.onload = () => {
                        this.textureMap.set(drawItem.id, img);
                        this.loadTextureIndex++;
                        resolve(img);
                    }
                    img.id = drawItem.id + '-' + this.loadTextureIndex;
                    img.src = this.dToBase64(drawItem);
                }
            });
            texturePromises.push(promise);
        }
        return Promise.all(texturePromises);
    },

    canvasObj : document.createElement('canvas'),

    // 给定 canvas 绘制程序，可以绘制纹理并返回 base64
    dToBase64 : function(drawItem) {  // 【之后优化】复用同一个 canvas 元素（清空并重绘），可以避免频繁创建和销毁 canvas 元素。
        if(drawItem.type === 'svg') {
            const svgString = drawItem.svgCode;
            const safeSvgString = svgString.replace(/#/g, '%23');  // 对'#'进行编码，确保URL正确
            return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(safeSvgString);
        }
        const canvas = this.canvasObj;
        canvas.width = drawItem.width || 400;
        canvas.height = drawItem.height || 400;
        canvas.style.webkitFontSmoothing = 'antialiased';  // 两款浏览器的平滑字体兼容（可能有效）
        canvas.style.mozOsxFontSmoothing = 'grayscale';
        const ctx = canvas.getContext('2d')
        if(drawItem.type === 'png'){  // 为透明化作铺垫
            drawItem.func(ctx, canvas.width, canvas.height, drawItem, this);
            return canvas.toDataURL('image/png');
        } else if(drawItem.type === 'jpg') {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            drawItem.func(ctx, canvas.width, canvas.height, drawItem, this);
            var quality = drawItem.quality || 0.7;
            return canvas.toDataURL('image/jpeg', quality);
        } else {}
    },

    // 默认纹理（字符串格式的声明的纹理，不存在时，会激活）
    errorTexture : function(ctx, width, height, drawItem, _this) {
        _this.hooks.emitSync('errorTexture_diy', ctx, width, height, drawItem, _this);  // 钩子：'自定义错误纹理' (后续再修改值，记得清除 textureMap)
    },
});

/***/ }),

/***/ "./src/player/control.js":
/*!*******************************!*\
  !*** ./src/player/control.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * 主角的第一视角操控
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({

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
        'arrowleft': 'turnLeft',
        'arrowright': 'turnRight',
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
            }
            this.keys.jumping = value;
        }
        if (e.keyCode === 16 || e.key.toLowerCase() === 'q') {  // shift键 或 q 开启加速
            this.isShiftPress = value;
        }
    },

    // 向前（后）移动的加速度辅助计算值
    forwardAcc : 0,

    // 显示主角的实时位置
    displayPOS : function(){
        var posInfo = document.getElementById('posInfo');
        if(!posInfo) {return 0}
        if(this.mainVPlayer !== null){
            posInfo.textContent = (
                '位置: X:' + this.mainVPlayer.body.position.x.toFixed(2) +
                ', Y:' + this.mainVPlayer.body.position.y.toFixed(2) +
                ', Z:' + this.mainVPlayer.body.position.z.toFixed(2) + ', | '
            );
        }
    },

    // 计算物体（主要是相机和主角）的移动参数
    calMovePara : function(X, Y, Z, RX, RY, RZ){
        const keys = this.keys;
        if (keys.viewForward || keys.viewBackward) {  // 前后平移
            var speed = (this.isShiftPress)
                        ? Math.max(this.speedH,this.speedL-(this.forwardAcc+=this.speedAdd))
                        : this.speedL+0*(this.forwardAcc=0.01);  // 加速度
            this.hooks.emit('forwardBackward', this, speed);  // 钩子：前后移动
            Z += (-keys.viewForward + keys.viewBackward) * Math.cos(RY * Math.PI / 180) / speed;
            X += (-keys.viewForward + keys.viewBackward) * Math.sin(RY * Math.PI / 180) / speed;
            this.displayPOS();
        }
        if (keys.viewLeft || keys.viewRight) {  // 左右平移
            Z += (-keys.viewLeft + keys.viewRight) * Math.cos((RY + 90) * Math.PI / 180) / 10;
            X += (-keys.viewLeft + keys.viewRight) * Math.sin((RY + 90) * Math.PI / 180) / 10;
            this.displayPOS();
        }
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

    // 摄像机和主角的移动和旋转
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
});

/***/ }),

/***/ "./src/utils/tool.js":
/*!***************************!*\
  !*** ./src/utils/tool.js ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * 一些工具函数、杂项
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
    // 四元数转化为欧拉数
    quaternionToEuler: function(q){
        const { x, y,  z,  w } = q;
        const roll = Math.atan2(2 * (w * x + y * z), 1 - 2 * (x * x + y * y)); // Roll (X轴)
        const sinPitch = 2 * (w * y - z * x);
        const pitch = Math.asin(Math.max(-1, Math.min(1, sinPitch))); // Pitch (Y轴)
        const yaw = Math.atan2(2 * (w * z + x * y), 1 - 2 * (y * y + z * z)); // Yaw (Z轴)
        const toDeg = angle => angle * (180 / Math.PI); // 转为度数
        return { rX: toDeg(roll), rY: toDeg(pitch), rZ: toDeg(yaw)};
    },

    // 将欧拉角 (以度为单位) 转换为四元数。
    eulerToQuaternion: function(euler) {
        const { rX, rY, rZ } = euler;
        const toRad = angle => angle * (Math.PI / 180);
        const halfRoll = toRad(rX) * 0.5;
        const halfPitch = toRad(rY) * 0.5;
        const halfYaw = toRad(rZ) * 0.5;
        const sr = Math.sin(halfRoll);
        const cr = Math.cos(halfRoll);
        const sp = Math.sin(halfPitch);
        const cp = Math.cos(halfPitch);
        const sy = Math.sin(halfYaw);
        const cy = Math.cos(halfYaw);
        const w = cr * cp * cy + sr * sp * sy;
        const x = sr * cp * cy - cr * sp * sy;
        const y = cr * sp * cy + sr * cp * sy;
        const z = cr * cp * sy - sr * sp * cy;
        return { x, y, z, w };
    },

    // 给定种子，生成伪随机数（数组），genPseudoRandoms
    genPR : function (seed, count){
        let x = Math.abs(seed) || 1;
        x = (x * 1664525 + 1013904223) | 0;
        const result = new Float32Array(count);
        const invMaxUInt32 = 1.0 / 4294967296.0;
        for (let i = 0; i < count; i++) {
            x ^= x << 13;
            x ^= x >> 17;
            x ^= x << 5;
            result[i] = (x >>> 0) * invMaxUInt32;
        }
        return result;
    },

    // 默认 cannon js 材质关联材质
    cannonDefaultCantactMaterial : new CANNON.ContactMaterial( // 默认材质关联材质
        new CANNON.Material(),
        new CANNON.Material(), {
            friction: 0.1, // 摩擦力
            restitution: 0.0, // 弹性系数
    }),
    
});

/***/ }),

/***/ "./src/wjs/w_ins_lab.js":
/*!******************************!*\
  !*** ./src/wjs/w_ins_lab.js ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _common_hooks_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../common/hooks.js */ "./src/common/hooks.js");
// WebGL框架
// ===============
  // 引入 JS 钩子

const W = {
  // 一些容器
  models: {},
  instanceMatrixBuffers: {}, // 实例化对象的矩阵数据
  instanceColorBuffers: {},  // 实例化颜色数据

  // WJS 的 JS 钩子，可用于添加插件、扩展功能
  wjsHooks : _common_hooks_js__WEBPACK_IMPORTED_MODULE_0__["default"],

  // 初始化
  reset: canvas => {
    
    // 全局变量
    W.canvas = canvas;
    W.objs = 0;
    W.current = {};
    W.next = {};
    W.textures = {};
    W.viewLimit = 5000;   // 视野
    W.gl = canvas.getContext('webgl2');
    W.gl.blendFunc(770 , 771);
    W.gl.activeTexture(33984);
    W.program = W.gl.createProgram();
    W.gl.enable(2884);  // 隐藏不可见面
    W.instanceColorBuffers = {};  // 初始化颜色实例化数据
    W.lastFrame = 0;
    W.drawTime = 0;         // 初始化 绘制 时间
    W.lastReportTime = 0;   // 时间戳临时变量（用于确定一秒）

    var t;
    W.gl.shaderSource(
          // 默认顶点着色器
          t = W.gl.createShader(35633),
          `#version 300 es
          precision lowp float;                        
          in vec4 pos, col, uv, normal;                 // 普通模型的 位置、颜色、纹理坐标、法线...
          in mat4 instanceModelMatrix;                  // 实例化模型的 模型
          uniform mat4 pv, eye, m, im;                  // 矩阵：投影 * 视图、视线、模型、模型逆矩阵
          uniform vec4 bb;                              // 广告牌：bb = [w, h, 1.0, 0.0]
          out vec4 v_pos, v_col, v_uv, v_normal;
          uniform bool isInstanced;              // 是不是实例化绘制
          void main() {
            mat4 currentModelMatrix;             // 当前的模型矩阵
            if (isInstanced) {
              currentModelMatrix = instanceModelMatrix;
            } else {
              currentModelMatrix = m;
            }
            gl_Position = pv * (                        // 设置顶点位置：p * v * v_pos
              v_pos = bb.z > 0.                         
              ? currentModelMatrix[3] + eye * (pos * bb) // 广告牌
              : currentModelMatrix * pos               
            );
            v_col = col;
            v_uv = uv;
            v_normal = transpose(isInstanced ? inverse(currentModelMatrix) : im) * normal;  // 必要时使用实例矩阵
          }`
        );

        W.gl.compileShader(t);  // 编译
        W.gl.attachShader(W.program, t);
        
        // 默认片段着色器
        W.gl.shaderSource(
          t = W.gl.createShader(35632),
          `#version 300 es
          precision lowp float;
          in vec4 v_pos, v_col, v_uv, v_normal;
          uniform vec3 light;
          uniform vec2 tiling;
          uniform vec4 o;
          uniform sampler2D sampler;
          out vec4 c;
          void main() {
            vec2 final_uv = v_uv.xy;  //+ 新增纹理面修正逻辑，修复纹理面翻转问题
            if (!gl_FrontFacing) {
              final_uv.x = 1.0 - final_uv.x;
            }
            c = mix(texture(sampler, final_uv * tiling), v_col, o[3]);
            if(o[1] > 0.){
              c = vec4(
                c.rgb * (max(0., dot(light, -normalize(
                  o[0] > 0.
                  ? vec3(v_normal.xyz)
                  : cross(dFdx(v_pos.xyz), dFdy(v_pos.xyz))
                )))
                + o[2]),
                c.a
              );
            }
          }`
        );
        
        W.gl.compileShader(t); 
        W.gl.attachShader(W.program, t);
        W.gl.linkProgram(W.program);
        W.gl.useProgram(W.program);
        W.clearColor = c => W.gl.clearColor(...W.col(c));
        W.wjsHooks.emitSync('reset_ok', W);  // 钩子：'重置完成'
        W.uniformLocations = {  // 抽离常用的 uniformLocations 地址（用于提高性能）
          pv: W.gl.getUniformLocation(W.program, 'pv'),
          eye: W.gl.getUniformLocation(W.program, 'eye'),
          m: W.gl.getUniformLocation(W.program, 'm'),
          im: W.gl.getUniformLocation(W.program, 'im'),
          bb: W.gl.getUniformLocation(W.program, 'bb'),
          isInstanced: W.gl.getUniformLocation(W.program, 'isInstanced'),
          o: W.gl.getUniformLocation(W.program, 'o'),
          light: W.gl.getUniformLocation(W.program, 'light'),
          tiling: W.gl.getUniformLocation(W.program, 'tiling'),
          sampler: W.gl.getUniformLocation(W.program, 'sampler'),
          u_MvpMatrixFromLight: W.gl.getUniformLocation(W.program, 'u_MvpMatrixFromLight'), // 阴影相关
          u_ShadowMap: W.gl.getUniformLocation(W.program, 'u_ShadowMap'), // 阴影相关
        };
        W.attribLocations = {  // 常用的 attribLocations
          pos: W.gl.getAttribLocation(W.program, 'pos'),
          col: W.gl.getAttribLocation(W.program, 'col'),
          uv: W.gl.getAttribLocation(W.program, 'uv'),
          normal: W.gl.getAttribLocation(W.program, 'normal'),
          instanceModelMatrix: W.gl.getAttribLocation(W.program, 'instanceModelMatrix'),
        };
        W.clearColor("fff");
        W.gl.enable(2929);
        W.light({y: -1});
        W.camera({fov: 30});
        setTimeout(W.draw, 16);  // 开始绘制
  },

  // 设置对象的状态 
  setState: (state, type, texture, i, normal = [], A, B, C, Ai, Bi, Ci, AB, BC) => {
        state.n ||= 'o' + W.objs++;
        if(state.size) state.w = state.h = state.d = state.size;
        if(state.t && state.t.width && !W.textures[state.t.id]){  // 纹理
          texture = W.gl.createTexture();
          W.gl.pixelStorei(37441 , false);
          W.gl.bindTexture(3553 , texture);
          W.gl.pixelStorei(37440 , 1);
          W.gl.texImage2D(3553 , 0, 6408 , 6408 , 5121 , state.t);
          W.gl.generateMipmap(3553 );
          W.textures[state.t.id] = texture;
        }
        if (state.instances && Array.isArray(state.instances)) {  // 实例坐标传入缓冲区
          state.isInstanced = true;
          state.numInstances = state.instances.length;
          const instanceMatrices = [];
          const instanceColors = [];
          for (const instanceProps of state.instances) {  // 实例顶点
            const m = new DOMMatrix();
            m.translateSelf(
                (instanceProps.x || 0) + (state.x || 0),
                (instanceProps.y || 0) + (state.y || 0),
                (instanceProps.z || 0) + (state.z || 0))
            .rotateSelf(instanceProps.rx || 0, instanceProps.ry || 0, instanceProps.rz || 0)
            .scaleSelf(instanceProps.w || 1, instanceProps.h || 1, instanceProps.d || 1);
            instanceMatrices.push(...m.toFloat32Array());
          }
          for (const p of state.instances) {  // 实例颜色
            instanceColors.push(...W.col(p.b || '888'));
          }
          const matrixData = new Float32Array(instanceMatrices);
          const buffer = W.gl.createBuffer();
          W.gl.bindBuffer(W.gl.ARRAY_BUFFER, buffer);
          W.gl.bufferData(W.gl.ARRAY_BUFFER, matrixData, W.gl.DYNAMIC_DRAW);
          W.instanceMatrixBuffers[state.n] = buffer;
          W.gl.bindBuffer(W.gl.ARRAY_BUFFER, W.instanceColorBuffers[state.n] = W.gl.createBuffer());
          W.gl.bufferData(W.gl.ARRAY_BUFFER, new Float32Array(instanceColors), W.gl.DYNAMIC_DRAW);
        } else {
          state.isInstanced = false;
        }
        if(state.fov){  // 根据 fov 计算【投影矩阵】
          var viewLimit = W.viewLimit;
          W.projection =
            new DOMMatrix([
              (1 / Math.tan(state.fov * Math.PI / 180)) / (W.canvas.width / W.canvas.height), 0, 0, 0, 
              0, (1 / Math.tan(state.fov * Math.PI / 180)), 0, 0, 
              0, 0, -(viewLimit + 0.1) / (viewLimit - 0.1), -1,
              0, 0, -(2 * viewLimit * 0.1) / (viewLimit - 0.1), 0
            ]);
        }
        state = {  // 保存和初始化对象的类型
          type,
          ...(W.current[state.n] = W.next[state.n] || {w:1, h:1, d:1, x:0, y:0, z:0,
                                  rx:0, ry:0, rz:0,
                                  b:'888', mode:4, mix: 0,
                                  hidden: false,  // 更灵活的调整是否隐藏
                                  uncullface: 0,  // 0:只显示外头； 1:两面都显示
                                  smooth: 0, t: state.t,
                                  texture, normal,
                                  A, B, C, Ai, Bi, Ci, AB, BC, ...state}),
          ...state,
          f:0
        };
        if(W.models[state.type]?.vertices && !W.models?.[state.type].verticesBuffer){  // 构建顶点
          W.gl.bindBuffer(34962 , W.models[state.type].verticesBuffer = W.gl.createBuffer());
          W.gl.bufferData(34962 , new Float32Array(W.models[state.type].vertices), 35044 );
          if(!W.models[state.type].normals && W.smooth) W.smooth(state);
          if(W.models[state.type].normals){
            W.gl.bindBuffer(34962 , W.models[state.type].normalsBuffer = W.gl.createBuffer());
            W.gl.bufferData(34962 , new Float32Array(W.models[state.type].normals.flat()), 35044 ); 
          }
        }
        if(W.models[state.type]?.uv && !W.models[state.type].uvBuffer){  // 构建 UV
          W.gl.bindBuffer(34962 , W.models[state.type].uvBuffer = W.gl.createBuffer());
          W.gl.bufferData(34962 , new Float32Array( W.models[state.type].uv), 35044 );
        }
        if(W.models[state.type]?.indices && !W.models[state.type].indicesBuffer){  // 构建索引
          W.gl.bindBuffer(34963 , W.models[state.type].indicesBuffer = W.gl.createBuffer());
          W.gl.bufferData(34963 , new Uint16Array(W.models[state.type].indices), 35044 );
        }
        if(!state.t){  // mix 默认为 1
          state.mix = 1;
        } else if(state.t && !state.mix){ // 有纹理，mix 为 0
          state.mix = 0;
        }
        W.next[state.n] = state;  // 下一帧的状态
  },

  // 绘制场景
  draw: (now, dt, v, i, transparent = []) => {
        const frameRenderStart = performance.now();  // 记录开始的时间
        dt = now - W.lastFrame;
        W.lastFrame = now;
        requestAnimationFrame(W.draw);
        if (W.debugFBO) {  // 如果打开，就播放 FBO 的画面，然后直接结束这一帧
          renderFBOToCanvas();
          return; 
        } else {
          if(W.next.camera.g){  W.render(W.next[W.next.camera.g], dt, 1); }
          v = W.animation('camera');  //  获取相机的矩阵
          if(W.next?.camera?.g){
            v.preMultiplySelf(W.next[W.next.camera.g].M || W.next[W.next.camera.g].m);
          }
          W.gl.uniformMatrix4fv(W.uniformLocations.eye, false, v.toFloat32Array());  // 相机矩阵发往着 eye 着色器
          v.invertSelf();
          v.preMultiplySelf(W.projection);
          W.gl.uniformMatrix4fv(W.uniformLocations.pv,  // 处理好 pv ，传给着色器   
                                false,
                                v.toFloat32Array());   
          W.wjsHooks.emitSync('shadow_draw', W);  // 绘制阴影插件的钩子
          W.gl.clear(16640);
          for(i in W.next) {  // 遍历渲染模型
            const object = W.next[i];
            if(object.hidden !== true) {  // hidden 物体不渲染（用于更灵活的减少 recall 数量）
                if (!object.isInstanced && !object.t && W.col(object.b)[3] == 1) {
                W.render(object, dt);
              } else {
                transparent.push(object);  // 透明的先不渲染，存起来
              }
            }
          }
          transparent.sort((a, b) => {return W.dist(b) - W.dist(a);});  // 感觉会损失性能，先注释掉
          W.gl.enable(3042);
          W.gl.depthMask(1)
          for(i of transparent) {  // 遍历渲染透明对象（这几行好抽象，后续再优化）
            if (i.isInstanced) {
              W.render(i, dt);
            }
          }
          for(i of transparent){
            if (!i.isInstanced) {
              W.render(i, dt);
            }
          }
          W.gl.depthMask(1);
          W.gl.disable(3042);
        }
        W.gl.uniform3f(  // light 信息发往着色器
          W.uniformLocations.light,
          W.lerp('light','x'), W.lerp('light','y'), W.lerp('light','z')
        );
      
        if (now - W.lastReportTime >= 1000) {  // 每秒执行一次，用于测量
            W.drawTime = (performance.now() - frameRenderStart).toFixed(2) + 'ms';  // 每帧的绘制时间
            W.lastReportTime = now;
        }
  },
  
  // 渲染对象
  render: (object, dt, just_compute = ['camera','light','group'].includes(object.type), buffer) => {
        if(object.t) {  // 设置纹理
          W.gl.activeTexture(W.gl.TEXTURE0); 
          W.gl.bindTexture(3553 , W.textures[object.t.id]);
          W.gl.uniform1i(W.uniformLocations.sampler, 0);
          W.gl.uniform2f(  // 纹理平铺->着色器（tiling）
            W.uniformLocations.tiling,
            object.tile?.[0] || 1,
            object.tile?.[1] || 1
          );
        }
        if (!object.isInstanced) {  // 处理普通对象
            if(object.f < object.a) object.f += dt;
            if(object.f > object.a) object.f = object.a;
            W.next[object.n].m = W.animation(object.n);
            if(W.next[object.g]){  // 组 处理
              W.next[object.n].m.preMultiplySelf(W.next[object.g].M || W.next[object.g].m);
            }
            if(!just_compute){  // 可见物体
              W.gl.uniformMatrix4fv(  // 下一帧矩阵->着色器（m）
                W.uniformLocations.m,
                false,
                (W.next[object.n].M || W.next[object.n].m).toFloat32Array()
              );
              W.gl.uniformMatrix4fv(  // 下一帧逆矩阵->着色器（im）
                W.uniformLocations.im,
                false,
                (new DOMMatrix(W.next[object.n].M || W.next[object.n].m)).invertSelf().toFloat32Array()
              );
            }
        }
        if(!just_compute){  // 渲染可见物体
          if(!W.models[object.type]?.verticesBuffer) {  // 热更新模型时会报错，一个勉强的解法。以后再优化
            return 0;
          }
          W.gl.bindBuffer(34962 , W.models[object.type].verticesBuffer);
          W.gl.vertexAttribPointer(buffer = W.attribLocations.pos, 3, 5126 , false, 0, 0);
          W.gl.enableVertexAttribArray(buffer);
          W.gl.vertexAttribDivisor(buffer, 0);
          if(W.models[object.type].uvBuffer){  // uv->着色器（uv）
            W.gl.bindBuffer(34962 , W.models[object.type].uvBuffer);
            W.gl.vertexAttribPointer(buffer = W.attribLocations.uv, 2, 5126 , false, 0, 0);
            W.gl.enableVertexAttribArray(buffer);
            W.gl.vertexAttribDivisor(buffer, 0);
          }
          if((object.s || W.models[object.type].customNormals) && W.models[object.type].normalsBuffer){  // 法线->着色器（normal）
            W.gl.bindBuffer(34962 , W.models[object.type].normalsBuffer);
            W.gl.vertexAttribPointer(buffer = W.attribLocations.normal, 3, 5126 , false, 0, 0);
            W.gl.enableVertexAttribArray(buffer);
            W.gl.vertexAttribDivisor(buffer, 0);
          }
          W.gl.uniform1i(W.uniformLocations.isInstanced, object.isInstanced ? 1 : 0);  // 实例化布尔值->着色器
          if (object.isInstanced && W.instanceMatrixBuffers[object.n]) {  // 实例化对象的各种数据
            const instanceMatrixBuffer = W.instanceMatrixBuffers[object.n];
            W.gl.bindBuffer(W.gl.ARRAY_BUFFER, instanceMatrixBuffer);
            const loc = W.attribLocations.instanceModelMatrix;  
            const bytesPerMatrix = 4 * 4 * Float32Array.BYTES_PER_ELEMENT;
            for (let i = 0; i < 4; ++i) {  // 分四次->着色器（instanceModelMatrix）
              const currentLoc = loc + i;
              W.gl.enableVertexAttribArray(currentLoc);
              W.gl.vertexAttribPointer(currentLoc, 4, W.gl.FLOAT, false, bytesPerMatrix, i * 4 * Float32Array.BYTES_PER_ELEMENT);
              W.gl.vertexAttribDivisor(currentLoc, 1);
            }
          }
          W.gl.uniform4f(  // o选项->着色器（o）
            W.uniformLocations.o,
            object.s,
            ((object.mode > 3) || (W.gl[object.mode] > 3)) && !object.ns ? 1 : 0,
            W.ambientLight || 0.2,
            object.mix
          );
          W.gl.uniform4f(  // 广告牌->着色器（bb）
            W.uniformLocations.bb,
            object.w,
            object.h,
            object.type == 'billboard',
            0
          );
          const colorAttribLoc = W.attribLocations.col;
          if (object.isInstanced) {  // （实例化和普通）颜色->着色器（col）
            W.gl.enableVertexAttribArray(colorAttribLoc);
            W.gl.bindBuffer(W.gl.ARRAY_BUFFER, W.instanceColorBuffers[object.n]);
            W.gl.vertexAttribPointer(colorAttribLoc, 4, W.gl.FLOAT, false, 0, 0);
            W.gl.vertexAttribDivisor(colorAttribLoc, 1);
          } else {
            W.gl.vertexAttrib4fv(colorAttribLoc, W.col(object.b || '888'));
          }
          if(object.uncullface) {  // 面剔除的判断，不知道这样写是否会影响性能
            W.gl.disable(2884);
            W.cullface = false;
          } else {
            if(W.cullface !== true){  // 避免频繁开关
              W.gl.enable(2884);
              W.cullface = true;
            }
          }
          if(W.models[object.type].indicesBuffer){  // 存在索引的绘制
            W.gl.bindBuffer(34963, W.models[object.type].indicesBuffer);  // 重新拿起索引数据
            if (object.isInstanced) { // 索引+实例化
              W.gl.drawElementsInstanced(
                +object.mode || W.gl[object.mode],W.models[object.type].indices.length,W.gl.UNSIGNED_SHORT,0,object.numInstances
              );
            } else { // 正常
              W.gl.drawElements(+object.mode || W.gl[object.mode], W.models[object.type].indices.length, 5123 , 0);
            }
          }
          else { // 不存在索引的绘制
            if (object.isInstanced) {  //无索引+实例化
              W.gl.drawArraysInstanced(+object.mode || W.gl[object.mode],0,W.models[object.type].vertices.length / 3,object.numInstances);
            } else {  // 正常
              W.gl.drawArrays(+object.mode || W.gl[object.mode], 0, W.models[object.type].vertices.length / 3);
            }
          }
          if (object.isInstanced) {  // 清理实例化对象状态，防止误伤普通对象
            const loc = W.attribLocations.instanceModelMatrix;
            for (let i = 0; i < 4; ++i) {
              W.gl.vertexAttribDivisor(loc + i, 0);
              W.gl.disableVertexAttribArray(loc + i);
            }
            W.gl.vertexAttribDivisor(colorAttribLoc, 0);
            W.gl.disableVertexAttribArray(colorAttribLoc);
          }
        }
  },
  
  // 辅助函数
  // -------
  
  // 在两个值之间插值
  lerp: (item, property) => 
    W.next[item]?.a
    ? W.current[item][property] + (W.next[item][property] -  W.current[item][property]) * (W.next[item].f / W.next[item].a)
    : W.next[item][property],
  
  // 过渡一个项目
  animation: (item, m = new DOMMatrix) =>
    W.next[item]
    ? m
      .translateSelf(W.lerp(item, 'x'), W.lerp(item, 'y'), W.lerp(item, 'z'))
      .rotateSelf(W.lerp(item, 'rx'),W.lerp(item, 'ry'),W.lerp(item, 'rz'))
      .scaleSelf(W.lerp(item, 'w'),W.lerp(item, 'h'),W.lerp(item, 'd'))
    : m,
    
  // 计算两个对象之间的距离平方（用于排序透明项目）
  dist: (a, b = W.next.camera) => a?.m && b?.m ? (b.m.m41 - a.m.m41)**2 + (b.m.m42 - a.m.m42)**2 + (b.m.m43 - a.m.m43)**2 : 0,
  
  // 设置环境光级别（0到1）
  ambient: a => W.ambientLight = a,
  
  // 将rgb/rgba十六进制字符串转换为vec4
  col: c => [...c.replace("#","").match(c.length < 5 ? /./g : /../g).map(a => ('0x' + a) / (c.length < 5 ? 15 : 255)), 1], // rgb / rgba / rrggbb / rrggbbaa
  
  // 添加新的3D模型
  add: (name, objects) => {
    W.models[name] = objects;
    if(objects.normals){ W.models[name].customNormals = 1 }
    W[name] = settings => W.setState(settings, name);
  },

  // 根据新的 canvas 大小重置画面
  resetView : (displayViewTime = 1) => {  // displayViewTime : 显示清晰度
    W.gl.viewport(0, 0, W.gl.canvas.width * displayViewTime, W.gl.canvas.height * displayViewTime);
    W.setState({ n: 'camera', fov: W.next.camera.fov });
  },
  
  // 内置对象
  // ----------------
  group: t => W.setState(t, 'group'),
  move: (t, delay) => setTimeout(()=>{ W.setState(t) }, delay || 1),
  delete: (t, delay) => setTimeout(()=>{ delete W.next[t] }, delay || 1),
  camera: (t, delay) => setTimeout(()=>{ W.setState(t, t.n = 'camera') }, delay || 1),
  light: (t, delay) => delay ? setTimeout(()=>{ W.setState(t, t.n = 'light') }, delay) : W.setState(t, t.n = 'light'),
  cullface: true,  // 面剔除(默认启用)
};

// 平滑法线计算插件（可选）
// =============================================
W.smooth = (state, dict = {}, vertices = [], iterate, iterateSwitch, i, j, A, B, C, Ai, Bi, Ci, normal) => {
  W.models[state.type].normals = [];
  for(i = 0; i < W.models[state.type].vertices.length; i+=3){vertices.push(W.models[state.type].vertices.slice(i, i+3))}
  if(iterate = W.models[state.type].indices) iterateSwitch = 1;
  else iterate = vertices, iterateSwitch = 0;
  for(i = 0; i < iterate.length * 2; i+=3){
    j = i % iterate.length;
    A = vertices[Ai = iterateSwitch ? W.models[state.type].indices[j] : j];
    B = vertices[Bi = iterateSwitch ? W.models[state.type].indices[j+1] : j+1];
    C = vertices[Ci = iterateSwitch ? W.models[state.type].indices[j+2] : j+2];
    var AB = [B[0] - A[0], B[1] - A[1], B[2] - A[2]];
    var BC = [C[0] - B[0], C[1] - B[1], C[2] - B[2]];
    normal = i > j ? [0,0,0] : [AB[1] * BC[2] - AB[2] * BC[1], AB[2] * BC[0] - AB[0] * BC[2], AB[0] * BC[1] - AB[1] * BC[0]];
    dict[A[0]+"_"+A[1]+"_"+A[2]] ||= [0,0,0];
    dict[B[0]+"_"+B[1]+"_"+B[2]] ||= [0,0,0];
    dict[C[0]+"_"+C[1]+"_"+C[2]] ||= [0,0,0];
    W.models[state.type].normals[Ai] = dict[A[0]+"_"+A[1]+"_"+A[2]] = dict[A[0]+"_"+A[1]+"_"+A[2]].map((a,i) => a + normal[i]);
    W.models[state.type].normals[Bi] = dict[B[0]+"_"+B[1]+"_"+B[2]] = dict[B[0]+"_"+B[1]+"_"+B[2]].map((a,i) => a + normal[i]);
    W.models[state.type].normals[Ci] = dict[C[0]+"_"+C[1]+"_"+C[2]] = dict[C[0]+"_"+C[1]+"_"+C[2]].map((a,i) => a + normal[i]);
  }
}


// 3D模型
// ========

// 每个模型都有：
// - 一个顶点数组 [x, y, z, x, y, z...]
// - 一个uv数组 [u, v, u, v...]（可选。允许纹理贴图...如果不存在：则只使用RGBA颜色）
// - 一个索引数组（可选，启用drawElements渲染...如果不存在：则使用drawArrays）
// - 一个法线数组 [nx, ny, nz, nx, ny, nz...]（可选...如果不存在：框架在需要时计算硬/平滑法线）
// 当需要时，顶点、uv、索引缓冲区会自动构建
// 所有模型都是可选的，你可以移除不需要的模型以节省空间
// 可以从相同模型添加自定义模型，OBJ导入器可在 https://xem.github.io/WebGLFramework/obj2js/ 获取

// 平面/广告牌
W.add("plane", {
  vertices: [
    .5, .5, 0,    -.5, .5, 0,   -.5,-.5, 0,
    .5, .5, 0,    -.5,-.5, 0,    .5,-.5, 0
  ],
  uv: [
    1, 1,     0, 1,    0, 0,
    1, 1,     0, 0,    1, 0
  ],
});
W.add("billboard", W.models.plane);

// 立方体
W.add("cube", {
  vertices: [
    .5, .5, .5,  -.5, .5, .5,  -.5,-.5, .5, // front
    .5, .5, .5,  -.5,-.5, .5,   .5,-.5, .5,
    .5, .5,-.5,   .5, .5, .5,   .5,-.5, .5, // right
    .5, .5,-.5,   .5,-.5, .5,   .5,-.5,-.5,
    .5, .5,-.5,  -.5, .5,-.5,  -.5, .5, .5, // up
    .5, .5,-.5,  -.5, .5, .5,   .5, .5, .5,
   -.5, .5, .5,  -.5, .5,-.5,  -.5,-.5,-.5, // left
   -.5, .5, .5,  -.5,-.5,-.5,  -.5,-.5, .5,
   -.5, .5,-.5,   .5, .5,-.5,   .5,-.5,-.5, // back
   -.5, .5,-.5,   .5,-.5,-.5,  -.5,-.5,-.5,
    .5,-.5, .5,  -.5,-.5, .5,  -.5,-.5,-.5, // down
    .5,-.5, .5,  -.5,-.5,-.5,   .5,-.5,-.5
  ],
  uv: [
    1, 1,   0, 1,   0, 0, // front
    1, 1,   0, 0,   1, 0,            
    1, 1,   0, 1,   0, 0, // right
    1, 1,   0, 0,   1, 0, 
    1, 1,   0, 1,   0, 0, // up
    1, 1,   0, 0,   1, 0,
    1, 1,   0, 1,   0, 0, // left
    1, 1,   0, 0,   1, 0,
    1, 1,   0, 1,   0, 0, // back
    1, 1,   0, 0,   1, 0,
    1, 1,   0, 1,   0, 0, // down
    1, 1,   0, 0,   1, 0
  ]
});
W.cube = settings => W.setState(settings, 'cube');

// 金字塔
W.add("pyramid", {
  vertices: [
    -.5,-.5, .5,   .5,-.5, .5,    0, .5,  0,  // Front
     .5,-.5, .5,   .5,-.5,-.5,    0, .5,  0,  // Right
     .5,-.5,-.5,  -.5,-.5,-.5,    0, .5,  0,  // Back
    -.5,-.5,-.5,  -.5,-.5, .5,    0, .5,  0,  // Left
     .5,-.5, .5,  -.5,-.5, .5,  -.5,-.5,-.5, // down
     .5,-.5, .5,  -.5,-.5,-.5,   .5,-.5,-.5
  ],
  uv: [
    0, 0,   1, 0,  .5, 1,  // Front
    0, 0,   1, 0,  .5, 1,  // Right
    0, 0,   1, 0,  .5, 1,  // Back
    0, 0,   1, 0,  .5, 1,  // Left
    1, 1,   0, 1,   0, 0,  // down
    1, 1,   0, 0,   1, 0
  ]
});

// 球形
((i, ai, j, aj, p1, p2, vertices = [], indices = [], uv = [], precision = 20) => {
  for(j = 0; j <= precision; j++){
    aj = j * Math.PI / precision;
    for(i = 0; i <= precision; i++){
      ai = i * 2 * Math.PI / precision;
      vertices.push(+(Math.sin(ai) * Math.sin(aj)/2).toFixed(6), +(Math.cos(aj)/2).toFixed(6), +(Math.cos(ai) * Math.sin(aj)/2).toFixed(6));
      uv.push((Math.sin((i/precision))) * 3.5, -Math.sin(j/precision))
      if(i < precision && j < precision){
        indices.push(p1 = j * (precision + 1) + i, p2 = p1 + (precision + 1), (p1 + 1), (p1 + 1), p2, (p2 + 1));
      }
    }
  }
  W.add("sphere", {vertices, uv, indices});
})();

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (W);


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!**************************!*\
  !*** ./src/openworld.js ***!
  \**************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _common_hooks_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./common/hooks.js */ "./src/common/hooks.js");
/* harmony import */ var _utils_tool_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils/tool.js */ "./src/utils/tool.js");
/* harmony import */ var _wjs_w_ins_lab_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./wjs/w_ins_lab.js */ "./src/wjs/w_ins_lab.js");
/* harmony import */ var _core_main_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./core/main.js */ "./src/core/main.js");
/* harmony import */ var _obj_texture_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./obj/texture.js */ "./src/obj/texture.js");
/* harmony import */ var _player_control_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./player/control.js */ "./src/player/control.js");
/* harmony import */ var _obj_chunkManager_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./obj/chunkManager.js */ "./src/obj/chunkManager.js");
/* harmony import */ var _obj_addobj_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./obj/addobj.js */ "./src/obj/addobj.js");
/* harmony import */ var _core_animate_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./core/animate.js */ "./src/core/animate.js");














// 插件
// import wjsShadow from './plugins/webgl/wjsShadow.js';
// import dynamicIns from './plugins/webgl/wjsDynamicIns.js';


// 主对象
const openworld = {
    hooks : _common_hooks_js__WEBPACK_IMPORTED_MODULE_0__["default"],        // JS 钩子，用于扩展
    W     : _wjs_w_ins_lab_js__WEBPACK_IMPORTED_MODULE_2__["default"],          // 三维模型 WebGL 渲染引擎
    ..._utils_tool_js__WEBPACK_IMPORTED_MODULE_1__["default"],         // 工具函数
    ..._core_main_js__WEBPACK_IMPORTED_MODULE_3__["default"],         // 全局的配置、变量、初始化等
    ..._obj_texture_js__WEBPACK_IMPORTED_MODULE_4__["default"],      // 纹理相关
    ..._player_control_js__WEBPACK_IMPORTED_MODULE_5__["default"],      // 第一视角的实现
    ..._obj_chunkManager_js__WEBPACK_IMPORTED_MODULE_6__["default"], // 动态区块管理
    ..._obj_addobj_js__WEBPACK_IMPORTED_MODULE_7__["default"],       // 添加新物体
    ..._core_animate_js__WEBPACK_IMPORTED_MODULE_8__["default"],      // 动画进程相关
}

// 启用插件
// wjsShadow(openworld);  // 开启阴影（暂时有性能问题，待改进）
dynamicIns(openworld);  // 开启实例化的动态操作

// 兼容浏览器平台
window.openworld = openworld;

// 导出
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (openworld);
})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});