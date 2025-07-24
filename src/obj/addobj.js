/**
 * 添加物体
 */
export default {
    
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
}