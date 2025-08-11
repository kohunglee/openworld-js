/*! vista.js v1.0.0 | (c) kohunglee | MIT License */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["vista"] = factory();
	else
		root["vista"] = factory();
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
 * 这是通用的 JS 钩子，在 WJS CANNON CCGXK 里都有引入
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

    // ccgxk 的 cannon.js 物理世界
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
            } = {}){
        const myargs = Array.from(arguments)[0];  // 提取参数
        if(size !== 1){  // 处理体积大小
            width =  depth =  height = size;
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
                _this.hooks.emitSync('pointer_lock_click', _this, e);  // 钩子：虚拟鼠标下的单击事件 ()
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
            // shiftInfo.textContent = '速度:' + Math.round((100 / speed)) + ' | ';  // 后续可以改成一个钩子
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

/***/ "./src/plugins/centerDot.js":
/*!**********************************!*\
  !*** ./src/plugins/centerDot.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * 中心点插件
 * ========
 * 可以在屏幕中显示中心点儿，以颜色法，选中物体（最多支持 16777215 个物体）
 */

// 全局变量
const globalVar = {};  // 用于指向 ccgxkObj
let canvas, pointObjIndex, textureEditorTG, textureEditorOffsetX, textureEditorOffsetXR, textureEditorOffsetY, textureEditorInfo;  // 全局 ID DOM 的变量

// 插件入口
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(ccgxkObj) {
    const template = document.createElement('template');  //+4 将 html 节点添加到文档
    template.innerHTML = htmlCode;
    const content = template.content.cloneNode(true);
    document.body.appendChild(content);
    canvas = document.getElementById('centerPoint');  // 画板
    pointObjIndex = document.getElementById('pointObjIndex');  // 热点物体的 index
    textureEditorTG = document.getElementById('textureEditorTG');  // 文字编辑框
    textureEditorOffsetX = document.getElementById('textureEditorOffsetX');  // 左偏移
    textureEditorOffsetXR = document.getElementById('textureEditorOffsetXR');  // 右偏移
    textureEditorOffsetY = document.getElementById('textureEditorOffsetY');  // 下偏移
    textureEditorInfo = document.getElementById('textureEditorInfo');  // 警告有没有保存
    globalVar.ccgxkObj = ccgxkObj;
    const W = ccgxkObj.W;
    W.tempColor = new Uint8Array(4);  // 临时储存颜色，供本插件使用
    W.makeFBO = () => {
        W.pickingFBO = W.gl.createFramebuffer();
        W.gl.bindFramebuffer(W.gl.FRAMEBUFFER, W.pickingFBO);
        W.pickingTexture = W.gl.createTexture();  //+4 为FBO创建纹理附件（相当于排练室的“幕布”）
        W.gl.bindTexture(W.gl.TEXTURE_2D, W.pickingTexture);
        W.gl.texImage2D(W.gl.TEXTURE_2D, 0, W.gl.RGBA, W.canvas.width, W.canvas.height, 0, W.gl.RGBA, W.gl.UNSIGNED_BYTE, null);
        W.gl.framebufferTexture2D(W.gl.FRAMEBUFFER, W.gl.COLOR_ATTACHMENT0, W.gl.TEXTURE_2D, W.pickingTexture, 0);
        W.pickingRenderbuffer = W.gl.createRenderbuffer();  //+4 为FBO创建深度附件（相当于排练室的“地板”，保证3D效果正确）
        W.gl.bindRenderbuffer(W.gl.RENDERBUFFER, W.pickingRenderbuffer);
        W.gl.renderbufferStorage(W.gl.RENDERBUFFER, W.gl.DEPTH_COMPONENT16, W.canvas.width, W.canvas.height);
        W.gl.framebufferRenderbuffer(W.gl.FRAMEBUFFER, W.gl.DEPTH_ATTACHMENT, W.gl.RENDERBUFFER, W.pickingRenderbuffer);
        if (W.gl.checkFramebufferStatus(W.gl.FRAMEBUFFER) !== W.gl.FRAMEBUFFER_COMPLETE) {  //+3 检查FBO是否创建成功
            console.error("秘密排练室（FBO）创建失败！");
        } else { W.makeFBOSucess = true; }
        W.whiteTexture = W.gl.createTexture();  //+3 创建一个纯白图片，用于阴影贴图使用
        W.gl.bindTexture(W.gl.TEXTURE_2D, W.whiteTexture);
        W.gl.texImage2D(W.gl.TEXTURE_2D, 0, W.gl.RGBA, 1, 1, 0, W.gl.RGBA, W.gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
        W.gl.bindFramebuffer(W.gl.FRAMEBUFFER, null);  // 解绑，让绘制回到主舞台
    }
    W.getColorPickObj = () => {  // 获取屏幕中心物体颜色值
        const player = W.next['mainPlayer'];
        if (!player) return;
        W.gl.bindFramebuffer(W.gl.FRAMEBUFFER, W.pickingFBO);  // 切换到 FBO 里
        W.gl.clearColor(0.0, 0.0, 0.0, 1.0); // 黑背景
        W.gl.clear(W.gl.COLOR_BUFFER_BIT | W.gl.DEPTH_BUFFER_BIT); // 清空排练室
        for (const index of ccgxkObj.currentlyActiveIndices) {
            const obj = W.next['T' + index];
            if (!obj) continue;
            var obj_proxy = {...obj};  // 创建代理，想办法将代理显示成纯色
            obj_proxy.b = index.toString(16).padStart(6, '0');
            obj_proxy.ns = 1;
            obj_proxy.mix = 1;
            W.gl.activeTexture(W.gl.TEXTURE0);
            W.gl.bindTexture(W.gl.TEXTURE_2D, null);  // 清空纹理贴图
            W.gl.activeTexture(W.gl.TEXTURE0 + 3);
            W.gl.bindTexture(W.gl.TEXTURE_2D, W.whiteTexture);  // 使用 纯白 贴图代替阴影深度图（以便清除阴影）
            W.render(obj_proxy, 0);
        }
        var player_proxy = {...player};  // 创建代理，想办法将代理显示成纯色
        player_proxy.b = '#f00';
        player_proxy.ns = 1;
        player_proxy.mix = 1;
        W.gl.activeTexture(W.gl.TEXTURE0);
        W.gl.bindTexture(W.gl.TEXTURE_2D, null);  // 清空纹理贴图
        W.gl.activeTexture(W.gl.TEXTURE0 + 3);
        W.gl.bindTexture(W.gl.TEXTURE_2D, W.whiteTexture);  // 使用 纯白 贴图代替阴影深度图（以便清除阴影）
        W.render(player_proxy, 0);
        const pixels = new Uint8Array(4);  // 取点
        W.gl.readPixels(W.gl.canvas.width / 2, W.gl.canvas.height / 2, 1, 1, W.gl.RGBA, W.gl.UNSIGNED_BYTE, pixels);
        W.gl.bindFramebuffer(W.gl.FRAMEBUFFER, null);
        W.clearColor(ccgxkObj.colorClear); // 恢复主画布的背景色
        W.tempColor = pixels;
    }
    ccgxkObj.hooks.on('pointer_lock_click', function(obj, e){
        if(ccgxkObj.centerPointColorUpdatax || e.button === 2){  
            if(ccgxkObj.hotPoint && e.button !== 2) {  // 如果有热点，单击热点后，触发热点事件
                hotAction(ccgxkObj);
            } else {  // 关闭小点
                drawCenterPoint(canvas, ccgxkObj, true);
                clearInterval(ccgxkObj.centerPointColorUpdatax);
                ccgxkObj.centerPointColorUpdatax = null;  // 避免重复清除
                ccgxkObj.mainCamera.pos = {x: 0, y: 2, z: 4};
            }
        } else {  // 开启小点
            if(W.makeFBOSucess !== true){ W.makeFBO() }
            drawCenterPoint(canvas, ccgxkObj);
            ccgxkObj.centerPointColorUpdatax = setInterval(() => { drawCenterPoint(canvas, ccgxkObj) }, 500);
            ccgxkObj.mainCamera.pos = {x:0, y:0.5, z:0};
        }
    });



    // 单击数字行辅助按钮后
    document.getElementById('textureEditorNumAux').addEventListener('click', function(){
        textureEditorTG.value = '0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12\n13\n14\n15\n16' +
            '\n17\n18\n19\n20\n21\n22\n23\n24\n25\n26\n27\n28\n29\n30';  // 数字行辅助
    })

    // 单击清空
    document.getElementById('textureEditorClear').addEventListener('click', function(){
        textureEditorTG.value = '';
    })


    // 单击一键去除数字行
    document.getElementById('textureEditorNumAuxRemove').addEventListener('click', function(){
        textureEditorTG.value = textureEditorTG.value.replace(/^\d+$/gm, '');  // 数字行辅助
    })

    // 用户操作完，然后单击 确认（写入） 按钮后
    document.getElementById('textureEditorSave').addEventListener('click', function(){
        myHUDModal.hidden = true;  // 隐藏模态框
        lockPointer();  // 锁定鼠标
        const modValue = {
            content: textureEditorTG.value,
            x: Number(textureEditorOffsetX.value),
            xr: Number(textureEditorOffsetXR.value),
            y: Number(textureEditorOffsetY.value) ,
        };
        modTextDemo(globalVar.indexHotCurr, modValue, globalVar.ccgxkObj);  // 修改文字
        cleanEditorPanel();  // 清理面板
        closePoint();  // 关闭小点
        const bookAsArray = [...globalVar.ccgxkObj.currTextData.entries()];  //+ 写入到浏览器的 localStorage 里
        const jsonScroll = JSON.stringify(bookAsArray, null, 2);
        localStorage.setItem('TGTOOL-backup', jsonScroll);
    })

    // 单击 CANCEL (取消)按钮后
    document.getElementById('textureEditorCancel').addEventListener('click', function(){
        myHUDModal.hidden = true;  // 隐藏模态框
        lockPointer();  // 锁定鼠标
        cleanEditorPanel();  // 清理面板
        closePoint();  // 关闭小点
    });

    // 单击 下载存档 按钮后
    document.getElementById('textureEditorDownload').addEventListener('click', function(){
        const bookAsArray = [...globalVar.ccgxkObj.currTextData.entries()];
        const jsonScroll = JSON.stringify(bookAsArray, null, 2);
        const blob = new Blob([jsonScroll], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `TGTool-backup-${new Date(Date.now()).toLocaleString('sv-SE').replace(/[-:T\s]/g, '')}.json`; // 给卷轴起个带时间戳的名字
        link.click();
        URL.revokeObjectURL(url); // 释放这个临时URL
    });

    // 单击 读取存档 按钮后
    document.getElementById('textureEditorReadfile').addEventListener('change', function(event){
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                readAfter(e.target.result);
            } catch (error) {
                alert('研读失败！这可能是一份损坏或格式错误的存档。\n' + error.message);
            }
        };
        reader.readAsText(file); // 阅读内容
        event.target.value = ''; // 清空选择，以便下次能上传同一个文件
    });

    // 从浏览器的 localStorage 里读取备份
    document.getElementById('textureEditorRcover').addEventListener('click', function(){
        const jsonScroll = localStorage.getItem('TGTOOL-backup');
        if (jsonScroll) {
            try {
                readAfter(jsonScroll);
                textureEditorTG.placeholder = '';
                textureEditorInfo.innerText = '';
            } catch (error) {
                alert('研读失败！这可能是一份损坏或格式错误的存档。\n' + error.message);
            }
        }
    });

    // 键盘上的 r 键被按下（冻结物体）
    function frozenMVP(event) {
        if (event.key === 'f') {
            const mvpBody = globalVar.ccgxkObj.mainVPlayer.body;
            if(mvpBody.mass === 0){
                mvpBody.mass = 50;  // 重量还原
            } else {
                mvpBody.mass = 0;  // 重量归 0
                mvpBody.velocity.set(0, 0, 0);  // 设置线速度为0
                mvpBody.angularVelocity.set(0, 0, 0);  // 设置角速度为0
                mvpBody.force.set(0, 0, 0);  // 清除所有作用力
                mvpBody.torque.set(0, 0, 0);  // 清除所有扭矩
            }
        }
        document.removeEventListener('keydown', frozenMVP);
    }
    document.addEventListener('keydown', frozenMVP);
    document.addEventListener('keyup', function(){
        document.addEventListener('keydown', frozenMVP);
    });


    // 利用钩子来自定义纹理
    ccgxkObj.hooks.on('errorTexture_diy', function(ctx, width, height, drawItem, _this){
        const index = drawItem.index;
        const id = drawItem.id;
        if('T' + index !== id) return;  // 只支持 T1234 这种格式的图片名
        const value = k.currTextData.get(id)?.content || '';  //+3 使用文字库 currTextData 里的文字，偏移量
        const offsetX = k.currTextData.get(id)?.x || 0;
        const offsetY = k.currTextData.get(id)?.y || 0;
        const offsetXR = k.currTextData.get(id)?.xr || 0;
        const typeObj = {};
        if(!value) return;  // 如果没有文字内容，则不绘制
        ctx.font = typeObj.font || "25px Arial";                  // 字体大小和类型
        ctx.fillStyle =  typeObj.fillStyle || "white";            // 填充颜色
        ctx.strokeStyle = 'transparent';                          // 好像没用（描边颜色）
        ctx.textAlign =  typeObj.textAlign || "left";             // 水平对齐方式（left/center/right）
        ctx.textBaseline =  typeObj.textBaseline ||"top";         // 垂直对齐方式（top/middle/bottom）
        var lineHeight = parseInt(ctx.font) || 30;
        const margin = 10;  // 边距
        const marginLeft = 10;  // 边距
        const marginTop = 10;
        ctx.clearRect(0, 0, width, height);  // 透明色
        ctx.fillStyle = 'white';
        
        // 简单排版函数
        function wrapText(_ctx, text, x, y, maxWidth, lineHeight) {
            text = text.split('/*')[0];  // 去掉注释
            const words = text.split(''); // 按单个字符来拆分，保证中英文都能换行
            let line = ''; // 当前正在排版的行内容
            for(let n = 0; n < words.length; n++) {
                if (words[n] === '\n') {  //+ 处理 \n 来换行的逻辑
                    _ctx.fillText(line, x, y);
                    y += lineHeight; line = '';
                    continue;
                }
                if(words[n] === '&'){  // 本行内有 &, 则本行颜色为透明
                    ctx.fillStyle = 'transparent';
                    ctx.font = "25px Arial";
                    lineHeight = 25;
                    words[n] = '';
                }
                if(words[n] === '#'){  // 本行内有 @, 则本行颜色为蓝色
                    ctx.fillStyle = 'blue';
                    ctx.font = "40px serif";
                    lineHeight = 43;
                    words[n] = '';
                }
                if(words[n] === '%'){  // 本行内有 @, 则本行颜色为红色
                    ctx.fillStyle = 'red';  
                    ctx.font = "40px serif";
                    lineHeight = 43;
                    words[n] = '';
                }
                if(words[n] === '@'){  // 本行内有 #, 则本行格式为默认
                    ctx.fillStyle = 'white';
                    ctx.font = typeObj.font || "25px Arial";
                    lineHeight = 25;
                    words[n] = '';
                }
                const testLine = line + words[n];  //+ 长度够了，换行的逻辑
                const metrics = _ctx.measureText(testLine);  // 计算长度
                const testWidth = metrics.width;
                if (testWidth > maxWidth && n > 0) {  // 超长了
                    _ctx.fillText(line, x, y);
                    line = words[n];  // 另起一行
                    y += lineHeight;
                } else {
                    line = testLine;
                }
            }
            _ctx.fillText(line, x, y);  // 最后剩下的一行
        }

        wrapText(ctx, value, marginLeft + width * offsetX, marginTop + height * offsetY, (width - margin * 2) * (1 - offsetX - offsetXR), lineHeight);
        _this.W.next[id].hidden = false;  //+ 在 webgl 和 ccgxk.js 里的该元素不再隐藏
        _this.indexToArgs.get(index).isInvisible = false;
    })
}


// 绘制屏幕中心的点
function drawCenterPoint(canvas, thisObj, isClear){
    if(isClear) { canvas.width = 0; canvas.height = 0; return; }  // 清空
    if(canvas.width === 0 || canvas.width === 1){
        canvas.width = 20;
        canvas.height = 20;
    }
    const ctx = canvas.getContext('2d');
    thisObj.W.getColorPickObj();  // 拾取颜色一次
    const colorArray = thisObj.W.tempColor || [255, 0, 0, 255];  //+2 获取当前颜色值并转化为数组
    const color = `rgba(${255 - colorArray[0]}, ${255 - colorArray[1]}, ${255 - colorArray[2]}, ${colorArray[3]/255})`;
    const objIndex = colorArray[0] * 256 ** 2 + colorArray[1] * 256 + colorArray[2];  // 根据颜色获取到了对应的 index 值
    pointObjIndex.innerHTML = objIndex;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if(objIndex !== 0){
        thisObj.hotPoint = objIndex;
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.arc(
            canvas.width / 2,
            canvas.height / 2,
            9,                
            0,                
            Math.PI * 2       
        );
        ctx.lineWidth = 2;
        ctx.stroke(); 
    } else if (thisObj.hotPoint) {
        thisObj.hotPoint = false;
    }
    ctx.beginPath();
    ctx.arc(  
        canvas.width / 2,
        canvas.height / 2,
        5,
        0,
        Math.PI * 2
    );
    ctx.fillStyle = color;
    ctx.fill();  // 绘制圆点
}


// 单击热点后的事件
function hotAction(thisObj){
    globalVar.indexHotCurr = thisObj.hotPoint + 0;  // 将 index 数字定格，防止被更改
    unlockPointer();  // 解锁鼠标
    myHUDModal.hidden = false;  // 显示模态框
    if(thisObj.currTextData.size === 0 && localStorage.getItem('TGTOOL-backup') !== null){
        const warnInfo = '浏览器里有上次的备份存档，推荐您【从浏览器恢复】！（数据无价）';
        textureEditorInfo.innerText = warnInfo;
        textureEditorTG.placeholder = warnInfo;
    }
    textureEditorTG.value = thisObj.currTextData.get('T' + globalVar.indexHotCurr)?.content || '';  //+3 填充编辑框
    textureEditorOffsetX.value = thisObj.currTextData.get('T' + globalVar.indexHotCurr)?.x || 0;
    textureEditorOffsetXR.value = thisObj.currTextData.get('T' + globalVar.indexHotCurr)?.xr || 0;
    textureEditorOffsetY.value = thisObj.currTextData.get('T' + globalVar.indexHotCurr)?.y || 0;
}


// 清理面板
function cleanEditorPanel(){
    textureEditorTG.value = '';  // 清空编辑框
    textureEditorOffsetX.value = 0;
    textureEditorOffsetXR.value = 0;
    textureEditorOffsetY.value = 0;
    globalVar.indexHotCurr = -1;
}


// 关闭小点
function closePoint(){
    drawCenterPoint(canvas, globalVar.ccgxkObj, true);  //+4 关闭小点
    clearInterval(globalVar.ccgxkObj.centerPointColorUpdatax);
    globalVar.ccgxkObj.centerPointColorUpdatax = null;
    globalVar.ccgxkObj.mainCamera.pos = {x: 0, y: 2, z: 4};
}


// 读档后的操作
function readAfter(result){
    const bookAsArray = JSON.parse(result);
    if (Array.isArray(bookAsArray)) {
        globalVar.ccgxkObj.currTextData = new Map(bookAsArray);
        for (const item of globalVar.ccgxkObj.currTextData) {  // 改变所有已有数据的 Obj 的 texture 属性
            globalVar.ccgxkObj.indexToArgs.get(Number(item[0].substring(1))).texture = item[0];
        }
        for (const item of globalVar.ccgxkObj.currentlyActiveIndices) {  // 遍历当前激活物体的 set 集合
            const indexID = 'T' + item;  // 前面加上 'T'
            if(globalVar.ccgxkObj.currTextData.has(indexID)){
                globalVar.ccgxkObj.currentlyActiveIndices.delete(item);  // 让 dynaNodes 重新添加一次当前显示的物体
            }
        }
        myHUDModal.hidden = true;  // 隐藏模态框
        lockPointer();  // 锁定鼠标
        cleanEditorPanel();  // 清理面板
        alert('读取完成！');
    } else {
        throw new Error('格式不正确。');
    }
}


// 一个修改文字的 DEMO
function modTextDemo(indexID, value = {}, thisObj) {  // 待优雅化
    const nID = 'T' + indexID;
    if(!thisObj?.indexToArgs?.get(indexID)?.TGtoolText){ return 0 }  // 判断是否可编辑纹理
    thisObj.currTextData.set(nID, {  // 重新设置文本内容
        content: value?.content || '',
        x: value?.x || 0,
        xr: value?.xr || 0,
        y: value?.y || 0,
    });
    thisObj.textureMap.delete(nID);  // 删除纹理库里的该纹理（可能没用？？）
    window[nID] = undefined;  // 顺便删一下全局的该纹理
    thisObj.W.plane({
        n: 'T' + indexID,
        t: nID,
    });
    thisObj.indexToArgs.get(indexID).texture = nID;  // Obj 的 texture 属性重置
    thisObj.currentlyActiveIndices.delete(indexID);  // 让 dynaNodes 重新添加一次
}


// 解锁鼠标
function unlockPointer() {
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
}


// 锁定鼠标
function lockPointer(){
    const canvas = globalVar.ccgxkObj.canvas;
    canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
    canvas.requestPointerLock();
}


// html 内容
const htmlCode = `
<style>
    /* 模态框 */
    .myHUD-modal {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 100vw;
        height: 100vh;
        transform: translate(-50%, -50%);
        z-index: 999;
    }
    .myHUD-modalPos {
        margin-left: 50vw;
        margin-top: 50vh;
        transform: translate(-50%, -50%);
        width: 700px;
        text-align: center;
        background-color: rgb(159 51 204 / 55%);
        padding: 32px;
        backdrop-filter: blur(2px);
    }
    .texture-editorBtn-lab {
        display: inline-block;
        background: rgb(32 32 32);
        color: rgb(255, 255, 255);
        padding: 5px 5px;
        border: none;
        cursor: pointer;
        margin: 5px;
        font-size: 14;
        color: #bbbbbb;
    }
    .xCity {
        font-size: 60px;
        color: rgb(255, 255, 255);
        position: fixed;
        left: 50vw;
        transform: translate(-50%);
        width: max-content;
        top: 30px;
    }
    .pointObjIndex {
        position: fixed;
        top: 50px;
        left: 10px;
    }
</style>
<div id="myHUDModal" class="myHUD-modal" hidden>
    <div class="myHUD-modalPos">
        <div>
            左 <input type="number" id="textureEditorOffsetX" name="offsetX" min="0" max="1" step="0.1">
            &nbsp;&nbsp;&nbsp;&nbsp;
            右 <input type="number" id="textureEditorOffsetXR" name="offsetXR" min="0" max="1" step="0.1">
            &nbsp;&nbsp;&nbsp;&nbsp;
            下 <input type="number" id="textureEditorOffsetY" name="offsetY" min="0" max="1" step="0.1">
            （偏移量，0 ~ 1）
        </div>
        <textarea rows="10" cols="50" class="tgeditor-texture" id="textureEditorTG"></textarea>
        <div><br>
            <div>
                <span id="textureEditorInfo"></span><br>
            </div>
            <button class="texture-editorBtn" id="textureEditorSave">写入</button>
            <button class="texture-editorBtn" id="textureEditorCancel">取消</button>
            <button class="texture-editorBtn" id="textureEditorDownload">下载存档</button>
            <label for="textureEditorReadfile" class="texture-editorBtn-lab">读取存档 </label>
            <input  type="file" id="textureEditorReadfile" accept=".json" hidden>
            <div>
                <button class="texture-editorBtn" id="textureEditorClear">清空</button>
                <button class="texture-editorBtn" id="textureEditorNumAux">数字行号辅</button>
                <button class="texture-editorBtn" id="textureEditorNumAuxRemove">一键去除行号</button>
            </div>
            <hr>
            <button class="texture-editorBtn" id="textureEditorRcover">从浏览器恢复</button>
        </div>
    </div>
</div>
<span id="currCityName" class="xCity">城市</span>
<span id="pointObjIndex" class="pointObjIndex">城市</span>
<canvas id="centerPoint" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);" width="1" height="1"></canvas>
`;

/***/ }),

/***/ "./src/plugins/cookieSavePos.js":
/*!**************************************!*\
  !*** ./src/plugins/cookieSavePos.js ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * cookie 保存/还原 位置（主角的位置）
 * ========
 */

/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(ccgxkObj){
    // 一秒执行一次
    setInterval(() => {
        if(ccgxkObj?.isMVPInit !== true){ return 0 }
        const mvp = ccgxkObj.mainVPlayer;
        const mPos = mvp.body.position;  //+2 储存主角的位置到 COOKIE
        setObjectCookie('lastPos_mvp', {
            x: mPos.x, y: mPos.y, z: mPos.z,
            rX: mvp.rX, rY:mvp.rY, rZ:mvp.rZ,  // 暂时不研究了，好像没法储存选择
        }); // 存储对象到Cookie
    }, 1000)

    // 存储对象到Cookie
    function setObjectCookie(name, obj, days) {
        const value = encodeURIComponent(JSON.stringify(obj));
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days*24*60*60*1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = `${name}=${value}${expires}; path=/`;
    }

    // 从 Cookie 读取对象
    function getObjectCookie(name) {
        const cookieArr = document.cookie.split('; ');
        for(let i = 0; i < cookieArr.length; i++) {
            const cookiePair = cookieArr[i].split('=');
            if(name === cookiePair[0]) {
            return JSON.parse(decodeURIComponent(cookiePair[1]));
            }
        }
        return null;
    }
    ccgxkObj.lastPos = getObjectCookie('lastPos_mvp');
}

/***/ }),

/***/ "./src/plugins/svgTextureLib.js":
/*!**************************************!*\
  !*** ./src/plugins/svgTextureLib.js ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * 一些 svg 滤镜生成的纹理库源码
 * ========
 * 可用于纹理等等
 */

/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(ccgxkObj){

    const greenStone = `
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <filter id="ancient-wall" filterUnits="userSpaceOnUse" x="-20" y="-20" width="1060" height="1060">
    <feTurbulence type="fractalNoise" baseFrequency="0.005" numOctaves="4" seed="10" result="base_plaster" />
    <feDiffuseLighting in="base_plaster" surfaceScale="15" lighting-color="white" result="lit_plaster">
    <feDistantLight azimuth="145" elevation="30" />
    </feDiffuseLighting>
    <feTurbulence type="turbulence" baseFrequency="0.04" numOctaves="3" seed="20" result="fine_grit" />
    <feDisplacementMap in="lit_plaster" in2="fine_grit" scale="20" xChannelSelector="R" yChannelSelector="G" result="distressed_surface" />
    <feComponentTransfer in="distressed_surface" result="colored_wall">
    <feFuncR type="table" tableValues="0.0 0.1 0.7" />
    <feFuncG type="table" tableValues="0.1 0.4 0.8" />
    <feFuncB type="table" tableValues="0.1 0.4 0.75" />
    </feComponentTransfer>
    <feRadialGradient id="vignette" cx="25%" cy="25%" r="75%" fx="25%" fy="25%">
        <stop offset="0%" stop-color="white" stop-opacity="1" />
        <stop offset="100%" stop-color="black" stop-opacity="1" />
    </feRadialGradient>
    <feBlend in="colored_wall" in2="vignette" mode="multiply" />
  </filter>
<rect width="100%" height="100%" filter="url(#ancient-wall)" />
</svg>
    `;

  const greenStoneTwo = `
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <filter id="ancient-wall" filterUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1024">
    <feTurbulence type="fractalNoise" baseFrequency="0.005" numOctaves="4" seed="10" result="base_plaster" />
    <feDiffuseLighting in="base_plaster" surfaceScale="15" lighting-color="white" result="lit_plaster">
      <feDistantLight azimuth="145" elevation="30" />
    </feDiffuseLighting>
    <feTurbulence type="turbulence" baseFrequency="0.04" numOctaves="3" seed="20" result="fine_grit" />
    <feDisplacementMap in="lit_plaster" in2="fine_grit" scale="20" xChannelSelector="R" yChannelSelector="G" result="distressed_surface" />
    <feComponentTransfer in="distressed_surface" result="colored_wall">
      <feFuncR type="table" tableValues="0.0 0.1 0.7" />
      <feFuncG type="table" tableValues="0.1 0.4 0.8" />
      <feFuncB type="table" tableValues="0.1 0.4 0.75" />
    </feComponentTransfer>
    <feRadialGradient id="vignette" cx="25%" cy="25%" r="75%" fx="25%" fy="25%">
        <stop offset="0%" stop-color="white" stop-opacity="1" />
        <stop offset="100%" stop-color="black" stop-opacity="1" />
    </feRadialGradient>
    <feBlend in="colored_wall" in2="vignette" mode="multiply" />
  </filter>
  <rect width="100%" height="100%" filter="url(#ancient-wall)" />
</svg>  
`;

  const greenStoneTest = `
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <filter id="ancient-wall" filterUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1024">
    <feTurbulence type="fractalNoise" baseFrequency="0.005" numOctaves="4" seed="10" result="base_plaster" />
    <feDiffuseLighting in="base_plaster" surfaceScale="15" lighting-color="white" result="lit_plaster">
      <feDistantLight azimuth="145" elevation="30" />
    </feDiffuseLighting>
    <feTurbulence type="turbulence" baseFrequency="0.04" numOctaves="3" seed="20" result="fine_grit" />
    <feDisplacementMap in="lit_plaster" in2="fine_grit" scale="20" xChannelSelector="R" yChannelSelector="G" result="distressed_surface" />
    <feComponentTransfer in="distressed_surface" result="colored_wall">
      <feFuncR type="table" tableValues="0.0 0.1 0.7" />
      <feFuncG type="table" tableValues="0.1 0.4 0.8" />
      <feFuncB type="table" tableValues="0.1 0.4 0.75" />
    </feComponentTransfer>
    <feRadialGradient id="vignette" cx="25%" cy="25%" r="75%" fx="25%" fy="25%">
        <stop offset="0%" stop-color="white" stop-opacity="1" />
        <stop offset="100%" stop-color="black" stop-opacity="1" />
    </feRadialGradient>
    <feBlend in="colored_wall" in2="vignette" mode="multiply" />
  </filter>
  <rect width="100%" height="100%" filter="url(#ancient-wall)" />
</svg>  
`;

    ccgxkObj.svgTextureLib = [
        { id:'greenStoneTwo', type: 'svg-rasterize', svgCode: greenStoneTwo },
        { id:'greenStone', type: 'svg-rasterize', svgCode: greenStone },
        { id:'greenStoneTest', type: 'svg-rasterize', svgCode: greenStoneTest },
    ];
};

/***/ }),

/***/ "./src/plugins/webgl/commModel.js":
/*!****************************************!*\
  !*** ./src/plugins/webgl/commModel.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * 几个常见的基础 3D 模型
 * ========
 */

// 插件入口
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(ccgxkObj) {
    // 六棱柱 prism
    (
        (
            i,          // 一个计数器，像尺子上的刻度
            angle,      // 旋转的角度，圆规张开的弧度
            vertices = [],
            uv = [],
            indices = [],
            normals = [],
            sides = 6,      // 6 棱柱
            radius = 0.5,   // 底面的半径，决定柱子粗细
            height = 1.0    // 柱子的高度
        ) => {
            
            ccgxkObj.W.add("prism", { vertices, uv, });  // 交付
    })();

    // 四面体 Tetrahedron
    ccgxkObj.W.add("Tetra", {
        vertices: [
            0, 0, 0,
            1, 0, 0,
            1, 0, 1,
            0, 0, 1,
        ],
  
        indices: [
            0, 1, 2,
            0, 3, 2,
        ]
    });

    // 学习 uv 使用的面
    ccgxkObj.W.add("uvplane", {
        vertices: [
            /* 后面 */
            1,1,0,  //  口'  0
            0,1,0,  // '口   1
            0,0,0,  // .口   2
            1,0,0,  //  口.  3

            /* 前面 */
            1,1,2,  //  口'  4
            0,1,2,  // '口   5
            0,0,2,  // .口   6
            1,0,2,  //  口.  7

            /* 右一 */
            2,1,1,  //  口'  8
            2,0,1,  //  口.  9
            1,1,2,  // '口   10
            1,0,2,  // .口   11

            /* 左一 */
            0,1,2,  //  口'  12
            0,0,2,  //  口.  13
            -1,1,1, // '口   14
            -1,0,1, // .口   15

            /* 左二 */
            0,1,0,  //  口'  16
            0,0,0,  //  口.  17
            -1,1,1, // '口   18
            -1,0,1, // .口   19

            /* 右二 */
            1,1,0,  //  口'  20
            1,0,0,  //  口.  21
            2,1,1,  // '口   22
            2,0,1,  // .口   23

            /* 顶一 */
            1,1,0,  //  口'  24
            0,1,0,  // '口   25
            -1,1,1, // .口   26


            /* 顶二 */
            1,1,0,  //  口'  27
            -1,1,1, // '口   28
            0,1,2,  // .口   29

            /* 顶三 */
            1,1,0,  //  口'  30
            0,1,2,  // '口   31
            2,1,1,  // .口   32

            /* 顶四 */
            2,1,1,  //  口'  33
            0,1,2,  // '口   34
            1,1,2,  // .口   35

            /* 底一 */
            1,0,0,  //  口'  36
            0,0,0,  // '口   37
            -1,0,1, // .口   38

            /* 底二 */
            1,0,0,  //  口'  39
            -1,0,1, // '口   40
            0,0,2,  // .口   41

            /* 底三 */
            1,0,0,  //  口'  42
            0,0,2,  // '口   43
            2,0,1,  // .口   44    

            /* 底四 */
            2,0,1,  //  口'  45
            0,0,2,  // '口   46
            1,0,2,  // .口   47

        ],
        uv: [
            /* 后面 */
            0,1,
            1,1,
            1,0,
            0,0,

            /* 前面 */
            1,1,
            0,1,
            0,0,
            1,0,

            /* 右一 */
            1,1,
            1,0,
            0,1,
            0,0,

            /* 左一 */
            1,1,
            1,0,
            0,1,
            0,0,

            /* 左二 */
            0,1,
            0,0,
            1,1,
            1,0,
            
            /* 右二 */
            1,1,
            1,0,
            0,1,
            0,0,

            /* 顶一 */
            0.66, 1,
            0.33, 1,
            0, 0.5,
            
            /* 顶二 */
            0.66, 1,
            0, 0.5,
            0.33, 0,

            /* 顶三 */
            0.66, 1,
            0.33, 0,
            1, 0.5,

            /* 顶四 */
            1, 0.5,
            0.33, 0,
            0.66, 0,

            /* 底一 */
            0.33, 1,
            0.66, 1,
            1, 0.5,
            
            /* 底二 */
            0.33, 1,
            1, 0.5,
            0.66, 0,

            /* 底三 */
            0.33, 1,
            0.66, 0,
            0, 0.5,

            /* 底四 */
            0, 0.5,
            0.66, 0,
            0.33, 0,

        ],
        indices: [  // 沿着对角线来画三角
            /* 后面 */
            1,0,2,
            2,0,3,

            /* 前面 */
            4,5,6,
            4,6,7,

            /* 右一 */
            8, 10, 11,
            8, 11, 9,

            /*  左一 */
            12, 14, 15,
            12, 15, 13,

            /* 左二 */
            18, 16, 19,
            19, 16, 17,

            /* 右二 */
            20, 22, 23,
            20, 23, 21,

            /* 顶一 */
            24, 25, 26,
            
            /* 顶二 */
            27, 28, 29,

            /* 顶三 */
            30, 31, 32,

            /* 顶四 */
            33, 34, 35,

            /* 底一 */
            36, 38, 37,

            /* 底二 */
            39, 41, 40,

            /* 底三 */
            42, 44, 43,

            /* 底四 */
            45, 47, 46,

        ],
    });
      

    // // （测试）两个四面体 Tetrahedron2
    // ccgxkObj.W.add("Tetrahedron2", {
    //     vertices: [5,0,0,0,0,5,5,5,5,5,0,5,10,0,0,5,0,5,10,5,5,10,0,5].map(x=>x/10),
    //     uv: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    //     indices: [0,1,2,0,3,1,2,3,0,2,1,3,4,5,6,4,7,5,6,7,4,6,5,7]
    // });
}

/***/ }),

/***/ "./src/plugins/webgl/wjsDynamicIns.js":
/*!********************************************!*\
  !*** ./src/plugins/webgl/wjsDynamicIns.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * 动态操作 webgl 的实例化对象
 * ========
 */

// 插件入口
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(ccgxkObj) {
    const W = ccgxkObj.W;
    W.dynimicIns = true;  // 标识 动态实例化 已开启

    // 函数：更新实例化对象
    // 参数：objName：W 物体对象的名称； index：索引； props：新内容；
    W.updateInstance = function(objName, index, props) {
        const state = W.next[objName];
        if (!state?.isInstanced || !state.instances?.[index]) return;
        const instance = state.instances[index];
        Object.assign(instance, props);  // 合并修改

        const m = new DOMMatrix();  // 重新计算该条数据的矩阵
        m.translateSelf(instance.x + (state.x|0) | 0,
                        instance.y + (state.y|0) | 0,
                        instance.z + (state.z|0) | 0)
        .rotateSelf(instance.rx || 0, instance.ry || 0, instance.rz || 0)
        .scaleSelf(instance.w || 1, instance.h || 1, instance.d || 1);

        const matrixBuffer = W.instanceMatrixBuffers[objName];
        W.gl.bindBuffer(W.gl.ARRAY_BUFFER, matrixBuffer);
        W.gl.bufferSubData(W.gl.ARRAY_BUFFER, index * 16 * 4, m.toFloat32Array());

        if (props.b) {  // 更新颜色
            const colorBuffer = W.instanceColorBuffers[objName];
            W.gl.bindBuffer(W.gl.ARRAY_BUFFER, colorBuffer);
            W.gl.bufferSubData(W.gl.ARRAY_BUFFER, index * 4 * 4, new Float32Array(W.col(props.b)));
        }
    }

      // 函数：动态删除某实例化对象（假删除）
      // 参数：objName：W 物体对象的名称； index：索引；
    W.deleteInstance = function(objName, index) {
        W.updateInstance(objName, index, { w: 0.001, h: 0.001, d: 0.001 });
    }
}

/***/ }),

/***/ "./src/plugins/webgl/wjsShadow.js":
/*!****************************************!*\
  !*** ./src/plugins/webgl/wjsShadow.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * 阴影插件
 * ========
 */

// 插件入口
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(ccgxkObj) {
    const W = ccgxkObj.W;
    W.isOpenShadow = true;  // 是否开启阴影
    W.lightpos = {  // 灯的初始位置
        rx: 0, ry: -125, rz:-45,
    }
    W.isShodowOne = true;
    W.wjsHooks.on('reset_ok', function(W){  // 在'初始化'处装载
        initDepthMapProgram(W);
    });
    W.wjsHooks.on('shadow_draw', function(W){  // 在'绘制阴影'处装载
          drawShadow(W);
    });
    const intervalPOS = setInterval(()=>{executePerSecond(W)}, 1000);  // 每 1 秒更新一次灯光位置
}


// 两个简化 webgl 语法的工具函数
// 创建并编译一对儿着色器
function createProgram(gl, vshaderSource, fshaderSource) {
  const vShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vShader, vshaderSource);
  gl.compileShader(vShader);
  const fShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fShader, fshaderSource);
  gl.compileShader(fShader);
  const program = gl.createProgram();
  gl.attachShader(program, vShader);
  gl.attachShader(program, fShader);
  gl.linkProgram(program);
  return program;
}

// 秘密暗房（一个渲染容器，渲染结果可以不显示到大屏幕上）
function initFramebufferObject(gl, width, height) { 
  var framebuffer, texture, depthRenderbuffer; 
  framebuffer = gl.createFramebuffer();
  texture = gl.createTexture(); 
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); 
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); 
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  depthRenderbuffer = gl.createRenderbuffer(); 
  gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderbuffer); 
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height); 
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer); 
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0); 
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderbuffer); 
  var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  framebuffer.texture = texture; 
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  return framebuffer; 
}

var OFFSCREEN_WIDTH;
var OFFSCREEN_HEIGHT;
    OFFSCREEN_WIDTH = OFFSCREEN_HEIGHT = 2**12;  // 深度图分辨率
var SHADOW_MAP_TEXTURE_UNIT = 3; // 阴影贴图使用的纹理单元
var shadowProgram;  // 深度图着色器程序
var shadowFBO;  // 深度图秘密暗房

// 初始化深度图渲染程序
const initDepthMapProgram = (W) => {
  const gl = W.gl;
  shadowProgram = createProgram(gl, SHADOW_VSHADER_SOURCE_300ES, SHADOW_FSHADER_SOURCE_300ES);  //+3 深度图着色器初始化
  shadowProgram.a_Position = gl.getAttribLocation(shadowProgram, 'pos');
  shadowProgram.u_MvpMatrix = gl.getUniformLocation(shadowProgram, 'u_MvpMatrix');
  shadowProgram.a_Color = gl.getAttribLocation(shadowProgram, 'col');
  W.program = createProgram(W.gl, RENDER_VSHADER_SOURCE_300ES, RENDER_FSHADER_SOURCE_300ES);  // 为阴影设计的新渲染着色器
  gl.useProgram(W.program);  // 很重要，否则会报错
  W.shadowUniformLoc = {
    u_MvpMatrixFromLight: W.gl.getUniformLocation(W.program, 'u_MvpMatrixFromLight'), // 阴影相关
    u_ShadowMap: W.gl.getUniformLocation(W.program, 'u_ShadowMap'), // 阴影相关
    u_ShadowMapTexelSize: W.gl.getUniformLocation(W.program, 'u_ShadowMapTexelSize'),  // 单个像素的尺寸
  }
  shadowFBO = initFramebufferObject(gl, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);  // 深度图的秘密暗房 FBO
}


// 绘制深度图
const drawShadow = (W) => {
  W.debugShadow = false;
  if(W.debugShadow === false){
    W.gl.bindFramebuffer(W.gl.FRAMEBUFFER, shadowFBO);  // 进入暗房
  }
  W.gl.useProgram(shadowProgram);  // 使用阴影着色器
  W.gl.clear(W.gl.COLOR_BUFFER_BIT | W.gl.DEPTH_BUFFER_BIT);  //+2 初始化画布
  W.gl.viewport(0, 0, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);
  var lightpos = W.lightpos;
  var vLight = new DOMMatrix()
              .translateSelf(lightpos.x, lightpos.y, lightpos.z)  // 灯光的位置
              .rotateSelf(lightpos.rx, lightpos.ry, lightpos.rz);  // 灯光的旋转
  vLight.invertSelf();

  const lightNear = 0;  // 近裁剪面
  const lightFar = 400.0; // 远裁剪面
  const lightWidth = 100.0; // 正交投影的宽度范围
  const lightHeight = 200.0; // 正交投影的高度范围
  const lightProjectionMatrix = new DOMMatrix([
      2 / lightWidth, 0, 0, 0,
      0, 2 / lightHeight, 0, 0,
      0, 0, -2 / (lightFar - lightNear), 0,
      0, 0, -(lightFar + lightNear) / (lightFar - lightNear), 1
  ]);
  vLight.preMultiplySelf(lightProjectionMatrix);
  W.lightViewProjMatrix = vLight;
  for (const i in W.next) {
    if(W.isOpenShadow === false){
      continue;
    }
    const object = W.next[i];
    // console.log(object.isShadow);
    if (!W.models[object.type] || ['camera', 'light', 'group'].includes(object.type) || object.shadow !== 'ok') {continue};  //+2 只留下我的模型
    // console.log(object.n);
    let modelMatrix = W.animation(object.n);
    const lightMvpMatrix = vLight.multiply(modelMatrix);
    W.gl.uniformMatrix4fv(shadowProgram.u_MvpMatrix, false, lightMvpMatrix.toFloat32Array());  // 物体矩阵化
    W.gl.bindBuffer(W.gl.ARRAY_BUFFER, W.models[object.type].verticesBuffer);  // 顶点快递
    W.gl.vertexAttribPointer(shadowProgram.a_Position, 3, W.gl.FLOAT, false, 0, 0);
    W.gl.enableVertexAttribArray(shadowProgram.a_Position);
    W.gl.drawArrays(W.gl.TRIANGLES, 0, W.models[object.type].vertices.length / 3);  // 绘制（非索引）
    W.gl.disableVertexAttribArray(shadowProgram.a_Position);  // 关闭顶点属性

  }

  W.gl.useProgram(W.program);  // 切换回原来的着色器
  W.gl.viewport(0, 0, W.gl.canvas.width, W.gl.canvas.height);  // 视角要改回去
  W.gl.bindFramebuffer(W.gl.FRAMEBUFFER, null);  // 走出暗房

  if(W.isOpenShadow === true){
    W.gl.activeTexture(W.gl.TEXTURE0 + SHADOW_MAP_TEXTURE_UNIT); // 激活“货架”
    W.gl.bindTexture(W.gl.TEXTURE_2D, shadowFBO.texture); // 把“深度照片”放到“货架”上
    W.gl.uniform1i(  // 传值 u_ShadowMap
      W.shadowUniformLoc.u_ShadowMap,
      SHADOW_MAP_TEXTURE_UNIT
    );
    W.gl.uniformMatrix4fv(  // 传值 u_MvpMatrixFromLight，告诉主画家，魔镜是怎么拍的
      W.shadowUniformLoc.u_MvpMatrixFromLight,
      false,
      W.lightViewProjMatrix.toFloat32Array()
    );
    W.gl.uniform2f( // 传递 texel size
      W.shadowUniformLoc.u_ShadowMapTexelSize,
      1.0 / OFFSCREEN_WIDTH,
      1.0 / OFFSCREEN_HEIGHT
    );
  }
}

// 灯光位置与主角位置同步
function executePerSecond(W) {
    var plr = W.current['mainPlayer']
    W.lightpos.x = plr.x;
    W.lightpos.y = plr.y + 50;
    W.lightpos.z = plr.z - 50;
}


// 深度图着色器
const SHADOW_VSHADER_SOURCE_300ES = `#version 300 es
  precision lowp float;
  in vec4 pos;
  in vec4 col;
  uniform mat4 u_MvpMatrix;
  out vec4 v_col_debug;
  void main() {
    gl_Position = u_MvpMatrix * pos;
    v_col_debug = col;  // 调试全彩
  }`;

const SHADOW_FSHADER_SOURCE_300ES = `#version 300 es
  precision lowp float;
  in vec4 v_col_debug;  // 调试
  out vec4 FragColor;
  vec4 encodeFloat(float v) { // 函数：将深度值编码到RGBA纹理
    vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;
    enc = fract(enc);
    enc -= enc.yzww * (1.0/255.0);
    return enc;
  }
  void main() {
    FragColor = encodeFloat(gl_FragCoord.z); // gl_FragCoord.z 是深度值 [0,1]
    // FragColor = vec4(gl_FragCoord.z, gl_FragCoord.z, gl_FragCoord.z, 1.0);
    // FragColor = v_col_debug;  // 调试
  }`;

// 为阴影显示而设计的新渲染着色器，代替原 WJS 里的着色器
const RENDER_VSHADER_SOURCE_300ES = `#version 300 es
          precision lowp float;                        
          in vec4 pos, col, uv, normal;                 // 普通模型的 位置、颜色、纹理坐标、法线...
          in mat4 instanceModelMatrix;                  // 实例化模型的 模型
          uniform mat4 pv, eye, m, im;                  // 矩阵：投影 * 视图、视线、模型、模型逆矩阵
          uniform vec4 bb;                              // 广告牌：bb = [w, h, 1.0, 0.0]
          out vec4 v_pos, v_col, v_uv, v_normal;
          uniform bool isInstanced;              // 是不是实例化绘制

          uniform mat4 u_MvpMatrixFromLight;       // 光源的 MVP 矩阵
          out vec4 v_PositionFromLight;            // 输出，顶点在光源眼中的位置

          void main() {
            mat4 currentModelMatrix;  // 当前的模型矩阵
            if (isInstanced) {
              currentModelMatrix = instanceModelMatrix;
            } else {
              currentModelMatrix = m;
            }
            gl_Position = pv * (    // 设置顶点位置：p * v * v_pos
              v_pos = bb.z > 0.                         
              ? currentModelMatrix[3] + eye * (pos * bb) // 广告牌
              : currentModelMatrix * pos               
            );
            v_col = col;
            v_uv = uv;
            v_normal = transpose(isInstanced ? inverse(currentModelMatrix) : im) * normal;  // 必要时使用实例矩阵
            v_PositionFromLight = u_MvpMatrixFromLight *  // 计算顶点在光源眼中的位置
                                 (isInstanced ? instanceModelMatrix * pos : m * pos);
          }`;

const RENDER_FSHADER_SOURCE_300ES = `#version 300 es
          precision lowp float;                  
          in vec4 v_pos, v_col, v_uv, v_normal;
          uniform vec3 light;
          uniform vec2 tiling;
          uniform vec4 o;
          uniform sampler2D sampler;
          out vec4 c;

          in vec4 v_PositionFromLight;   // 接收灯光视角的位置
          uniform sampler2D u_ShadowMap;  // 接收阴影深度图

          uniform vec2 u_ShadowMapTexelSize;  // 阴影图竖纹大小

          // 解码深度值（与encodeFloat对应）
          float decodeFloat(vec4 rgbaDepth) {
              const vec4 bitShift = vec4(1.0, 1.0/255.0, 1.0/(255.0*255.0), 1.0/(255.0*255.0*255.0));
              return dot(rgbaDepth, bitShift);
          }

          void main() {
            /* 阴影处理逻辑 */
            vec3 shadowCoord = (v_PositionFromLight.xyz    // 创建阴影映射
                                / v_PositionFromLight.w)
                                / 2.0 + 0.5;

            float shadowFactor = 0.0; // 累计阴影贡献值
            const float bias = 0.00015; // 相同的偏移值

            float shadowVisibility = 1.0;  // 非阴影部分亮度

            // for (int x = -4; x <= 4; x++) {
            //     for (int y = -4; y <= 4; y++) {
            //         vec2 offset = vec2(float(x), float(y)) * u_ShadowMapTexelSize;
            //         vec4 rgbaDepth = texture(u_ShadowMap, shadowCoord.xy + offset);
            //         float depth = decodeFloat(rgbaDepth);
            //         if (shadowCoord.z > depth + bias) {
            //             shadowFactor += 0.8; // 如果被遮挡，则降低亮度（0.8表示80%亮度，即20%阴影）
            //         } else {
            //             shadowFactor += 1.0; // 未被遮挡，完全亮度
            //         }
            //     }
            // }

            // // 取平均值
            // shadowFactor /= 81.0; // 3x3 采样一共9个点
            // shadowVisibility = shadowFactor;
            
            
            vec4 rgbaDepth = texture(u_ShadowMap, shadowCoord.xy);  // 解析深度
            

            if(shadowCoord.z > 1.0 || shadowCoord.x < 0.0 || shadowCoord.x > 1.0 || shadowCoord.y < 0.0 || shadowCoord.y > 1.0) {
              shadowVisibility = 1.0;  // 阴影在区域外，则不显示阴影
            } 
            else {  // 计算有没有被遮挡
              const vec4 bitShift = vec4(1.0, 1.0/255.0, 1.0/(255.0*255.0),
                                    1.0/(255.0*255.0*255.0));
              float depth = dot(rgbaDepth, bitShift);
              if (shadowCoord.z > depth + bias) {
                  shadowVisibility = 0.8;
              }
            }

            c = mix(texture(sampler, v_uv.xy * tiling), v_col, o[3]);
            if(o[1] > 0.){
              c = vec4(
                c.rgb * (max(0., dot(light, -normalize(
                  o[0] > 0.
                  ? vec3(v_normal.xyz)
                  : cross(dFdx(v_pos.xyz), dFdy(v_pos.xyz))
                )))
                + o[2]) * shadowVisibility,
                c.a
              );
            } else {
              c.rgb *= shadowVisibility;
            }
          }`;


/***/ }),

/***/ "./src/plugins/xdashpanel.js":
/*!***********************************!*\
  !*** ./src/plugins/xdashpanel.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * 简易仪表盘插件
 * ========
 * 显示 FPS 、物体数量、内存占用等
 */

// 插件入口
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(ccgxkObj) {
    const template = document.createElement('template');  //+4 将 html 节点添加到文档
    template.innerHTML = htmlCode;
    const content = template.content.cloneNode(true);
    document.body.appendChild(content);

    shiftInfo.textContent = '速度:' + 0 + ' | ' // 【测试，临时】

    ccgxkObj.fpsFrameCount = 0;  //+ FPS 计算的辅助值
    ccgxkObj.lastTime = performance.now();

    ccgxkObj.isFirstShowFPS = true;  //+ 显示 FPS 和 内存 等... (所有一秒一次的函数)
    ccgxkObj.showFPS1S = function(){
        var currentTime = performance.now();
        var deltaTime = currentTime - this.lastTime;
        this.fpsFrameCount++;
        if(deltaTime > 1000 || this.isFirstShowFPS){
            this.isFirstShowFPS = false;
            var fps = this.fpsFrameCount / (deltaTime / 1000);
            this.fpsFrameCount = 0;
            this.lastTime = currentTime;
            this._showMemory();  // 一秒显示一次内存
            this.displayPOS();  // 一秒显示一次显示主角坐标
            const mVP = this.mainVPlayer;
            var dynaNodesCon = this.calPosID(mVP?.X, mVP?.Y, mVP?.Z, 2);
            posIDMVP.textContent = dynaNodesCon.replace(/[Dd]/g,'东').replace(/[Xx]/g,'西').replace(/[Nn]/g,'南').replace(/[Bb]/g,'北');  // 一秒显示一次主角位置编码
            fpsInfo.textContent = ('FPS：' + fps.toFixed(1) + '  ，渲染：' + this.W.drawTime );  // 一秒显示一次 FPS
            modListCount.textContent = ('当前模型数：' + this.bodylist.length +
                                        ' - ❀' + this.bodylistNotPys.length +
                                        ' - 口' + this.bodylistMass0.length +
                                        ' - ⚡️ ' +this.currentlyActiveIndices.size +
                                        `（can ${this.world.bodies.length} | w ${this._calWNotHidden()}）` +
                                        `（${this.indexToArgs.size}）` +
                                        `（纹理：${this.textureMap.size}）` +
                                        ' |');
        }
    }

    ccgxkObj._showMemory = function(){  //+ 显示内存占用情况
        var output = document.getElementById('metrics');
        if (performance.memory) {
            const mem = performance.memory;
            output.textContent = `内存: ${(mem.usedJSHeapSize/1048576).toFixed(1)}MB/` +
                    `${(mem.jsHeapSizeLimit/1048576).toFixed(1)}MB`  + ' | ';
        }
    }

    ccgxkObj._calWNotHidden = function() {  // 计算没有被 hidden 的 Webgl 元素数量
        let length = 0;
        for (var key in this.W.next) {
            const item = this.W.next[key];
            if (item.hidden !== true) {
                length++;
            }
        }
        return length;
    }


    ccgxkObj.hooks.on('animatePreFrame', function(_this){
        _this.showFPS1S(); // 显示 FPS 和 一秒一次 的函数
    });
    
}

const htmlCode = `
<style>
    .myHUD {
        position: absolute;
        bottom: 0;
        padding: 0.3em;
        color: #ffffff;
    }
</style>
<div id="myHUD" class="myHUD">
    <div id="fpsInfo"></div>
    <span id="shiftInfo"></span>
    <span id="posInfo"></span>
    <span id="metrics"></span>
    <span id="cpuInfo"></span>
    <span id="modListCount"></span>
    <span id="posIDMVP"></span>
</div>
`;

/***/ }),

/***/ "./src/plugins/xmap.js":
/*!*****************************!*\
  !*** ./src/plugins/xmap.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * 小地图插件
 * ========
 * 实时显示当前主角在地图的位置
 */

// 插件入口
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(ccgxkObj) {
    const template = document.createElement('template');  //+ 添加 html 节点
    template.innerHTML = htmlCode;
    const content = template.content.cloneNode(true);
    document.body.appendChild(content);

    const mapUpdateInterval = setInterval(() => {  // 每 50 毫秒更新一下
        drawRedDot(posMap, ccgxkObj);
    }, 50);
}

// 用于显示的 html
const htmlCode = `
<style>
    /* 使用一个独特的 ID 或 class 来限定样式作用域 */
    #posMap {
        position: fixed;
        right: 50px;
        bottom: 50px;
        opacity: 0.8;
        border: 1px solid #ccc; /* 增加边框以便看清 */
        background-color: #f0f0f0; /* 增加背景色 */
    }
</style>
<canvas id="posMap" width="100" height="100"></canvas>
`;

// 是否使用小范围地图 10 倍？？
const isMapLittle = true;

// 一个能跑起来的计算角度的函数，凑合用吧，原理混乱
function calculateNorthAngle(t,a,h){var t=-t*Math.PI/180,a=-a*Math.PI/180,h=h*Math.PI/180,M=Math.cos(t),
    t=Math.sin(t),o=Math.cos(a),a=Math.sin(a),h=(Math.cos(h),Math.sin(h),a*M),a=-t,t=o*M,o=[0,0,1],M=t,
    a=Math.sqrt(Math.pow(h,2)+Math.pow(a,2)+Math.pow(t,2));let n=Math.acos(Math.min(1,Math.max(-1,M/a)));
    return n=(n=h*o[2]-t*o[0]<0?-n:n)>-Math.PI/2&&n<Math.PI/2?2*Math.PI-n:n}

// 绘制小地图的核心函数
function drawRedDot(canvasElement, ccgxkObj) {
    const mvp = ccgxkObj.mainVPlayer;
    if(ccgxkObj?.isMVPInit !== true){
        return 0;
    }
    const ctx = canvasElement.getContext("2d");
    const centerX = canvasElement.width / 2;    // 地图中心的 X 坐标
    const centerY = canvasElement.height / 2;   // 地图中心的 Y 坐标
    let playerMapX = (mvp.X / 5000) * centerX;
    let playerMapZ = (mvp.Z / 5000) * centerY;
    const gridSize = canvasElement.width / 10;  // 10 * 10 格子大小
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    if (isMapLittle) {  // 小比例尺
        playerMapX = (mvp.X / 500) * centerX;
        playerMapZ = (mvp.Z / 500) * centerY;
    }
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvasElement.width, canvasElement.height);
    ctx.fillStyle = "#F5F7FF";
    for (let row = 0; row < 10; row++) {  // 棋盘
        for (let col = 0; col < 10; col++) {
            if ((row + col) % 2 === 0) {
                ctx.fillRect(row * gridSize, col * gridSize, gridSize, gridSize);
            }
        }
    }
    const finalPlayerX = centerX + playerMapX;
    const finalPlayerY = centerY + playerMapZ;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 2, 0, 2 * Math.PI); // 中心点
    ctx.arc(finalPlayerX, finalPlayerY, 1, 0, 2 * Math.PI); // 玩家点
    ctx.fillStyle = "red";
    ctx.fill();
    ctx.strokeStyle = "#9AFF4D";  //+ 玩家朝向线
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(finalPlayerX, finalPlayerY);
    const mainPlayer = ccgxkObj.W.current.mainPlayer;
    const northAngle = calculateNorthAngle(mainPlayer.rx, mainPlayer.ry, mainPlayer.rz);
    const lineEndX = finalPlayerX - 100 * Math.sin(northAngle);
    const lineEndY = finalPlayerY - 100 * Math.cos(northAngle);
    ctx.lineTo(lineEndX, lineEndY);
    ctx.stroke();
}



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
            m.translateSelf(instanceProps.x + (state.x|0) | 0,
                            instanceProps.y + (state.y|0) | 0,
                            instanceProps.z + (state.z|0) | 0)
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
/*!**********************!*\
  !*** ./src/ccgxk.js ***!
  \**********************/
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
/* harmony import */ var _plugins_webgl_wjsShadow_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./plugins/webgl/wjsShadow.js */ "./src/plugins/webgl/wjsShadow.js");
/* harmony import */ var _plugins_centerDot_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./plugins/centerDot.js */ "./src/plugins/centerDot.js");
/* harmony import */ var _plugins_webgl_wjsDynamicIns_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./plugins/webgl/wjsDynamicIns.js */ "./src/plugins/webgl/wjsDynamicIns.js");
/* harmony import */ var _plugins_xmap_js__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./plugins/xmap.js */ "./src/plugins/xmap.js");
/* harmony import */ var _plugins_cookieSavePos_js__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./plugins/cookieSavePos.js */ "./src/plugins/cookieSavePos.js");
/* harmony import */ var _plugins_svgTextureLib_js__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./plugins/svgTextureLib.js */ "./src/plugins/svgTextureLib.js");
/* harmony import */ var _plugins_xdashpanel_js__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ./plugins/xdashpanel.js */ "./src/plugins/xdashpanel.js");
/* harmony import */ var _plugins_webgl_commModel_js__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ./plugins/webgl/commModel.js */ "./src/plugins/webgl/commModel.js");












// 插件





// 主对象
const ccgxk = {
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
// wjsShadow(ccgxk);  // 开启阴影（暂时有性能问题，待改进）
// centerDot(ccgxk);  // 开启中心点取物
;(0,_plugins_webgl_wjsDynamicIns_js__WEBPACK_IMPORTED_MODULE_11__["default"])(ccgxk);  // 开启实例化的动态操作

        // 导入插件模块





// import centerDot from './plugins/centerDot.js';
(0,_plugins_xmap_js__WEBPACK_IMPORTED_MODULE_12__["default"])(ccgxk);            // 小地图
(0,_plugins_cookieSavePos_js__WEBPACK_IMPORTED_MODULE_13__["default"])(ccgxk);   // 保存当前位置
(0,_plugins_svgTextureLib_js__WEBPACK_IMPORTED_MODULE_14__["default"])(ccgxk);   // 纹理预设库
(0,_plugins_xdashpanel_js__WEBPACK_IMPORTED_MODULE_15__["default"])(ccgxk);      // 仪表盘
(0,_plugins_webgl_commModel_js__WEBPACK_IMPORTED_MODULE_16__["default"])(ccgxk);       // 基础模型库
(0,_plugins_centerDot_js__WEBPACK_IMPORTED_MODULE_10__["default"])(ccgxk);       // 开启中心点取物



// 兼容浏览器平台
window.ccgxk = ccgxk;

// 导出
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (ccgxk);
})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});