/**
 * addobj.js - 物体管理系统 (DPZ + TypeArray)
 * =====================================================
 *
 * 核心概念：
 * - DPZ (Display Priority Zone)：显示优先级区域，根据距离动态加载/卸载
 * - TypeArray：用类型化数组存百万级物体，内存紧凑，遍历快
 *
 * 【DPZ 层级说明】
 * DPZ=0: 任何时候都显示（天空盒、主角）
 * DPZ=1: 超远可见（巨型建筑轮廓）
 * DPZ=2: 中距离可见（建筑群简模）
 * DPZ=3: 近距离可见（室内装修）
 * DPZ=4: 很近才可见（书本、小物件）
 * DPZ=5: 极近才可见（细节纹理、文字）
 *
 * 【快速开始】
 *   k.initBodyTypeArray();          // 初始化（引擎自动调用）
 *   const idx = k.addTABox({...});  // 添加物体
 *   k.activeTABox(idx);              // 手动激活（可选，DPZ自动管理）
 */

export default {

  // ========== 配置 ==========

  allGroupNum: 1,      // 碰撞组1: 玩家、地面、小物件（会互相碰撞）
  stoneGroupNum: 2,    // 碰撞组2: 静止石头（只与玩家碰撞，互不碰撞）
  bodyObjName: 0,      // 物体ID生成器
  MAX_BODIES: 1_000_000,  // 最大物体数量（可扩容）

  // ========== 数据容器（TypeArray 高性能） ==========

  positionsStatusTA: null,  // [x,y,z, qx,qy,qz,qw, status] × MAX_BODIES
  bodyProp: null,           // 属性备用
  physicsPropsTA: null,     // [mass, w, h, d, DPZ, ?, ?, ?] × MAX_BODIES
  cursorIdx: 0,             // 当前写入游标
  indexToArgs: new Map(),   // index -> 完整参数对象
  spatialGrid: new Map(),   // "DPZ_gridX_gridZ" -> Set(index)

  // DPZ 区块大小配置（格子半径）
  // 例如 gridsize[3]=20 表示 DPZ=3 的物体在 20×20 的格子内激活
  gridsize: new Uint16Array([10000, 200, 100, 20, 5, 1]),
  gridsizeY: new Float32Array([10000, 200, 100, 20, 5, 1]),

  // 激活动态管理
  currentlyActiveIndices: new Set(),  // 当前已激活的物体
  activationQueue: [],

  // ========== 初始化 ==========

  initBodyTypeArray: function(maxBodies = 1_000_000) {
    this.MAX_BODIES = maxBodies;
    this.positionsStatus = new Float32Array(this.MAX_BODIES * 8);
    this.physicsProps = new Float32Array(this.MAX_BODIES * 8);
    this.cursorIdx = 0;
    this.indexToArgs.clear();
    this.spatialGrid.clear();
    this.currentlyActiveIndices.clear();
  },

  // ========== 欧拉角 -> 四元数 ==========

  eulerToQuaternion: function({rX, rY, rZ}) {
    const cx = Math.cos(rX * Math.PI / 360);
    const sx = Math.sin(rX * Math.PI / 360);
    const cy = Math.cos(rY * Math.PI / 360);
    const sy = Math.sin(rY * Math.PI / 360);
    const cz = Math.cos(rZ * Math.PI / 360);
    const sz = Math.sin(rZ * Math.PI / 360);
    return {
      x: sx * cy * cz - cx * sy * sz,
      y: cx * sy * cz + sx * cy * sz,
      z: cx * cy * sz - sx * sy * cz,
      w: cx * cy * cz + sx * sy * sz
    };
  },

  // ========== 添加物体【核心函数】 ==========
  //
  // 参数说明：
  //   DPZ: 3,                    // 显示优先级 0-5
  //   X,Y,Z: 位置,
  //   quat: {x,y,z,w},           // 四元数（可选）
  //   rX,rY,rZ: 旋转角度（度，可选，会自动转quat）
  //   mass: 0,                    // 质量，0=静止
  //   width/height/depth/size: 尺寸
  //   colliGroup: 2,              // 碰撞组
  //   isPhysical: true,           // 是否有物理
  //   isVisualMode: true,         // 是否渲染
  //   texture: null,              // 纹理图片或id
  //   background: '#888888',      // 颜色
  //   mixValue: 0.7,              // 纹理混合度
  //   smooth: 0,                  // 平滑着色
  //   tiling: [1,1],              // 纹理平铺
  //   shape: 'cube',              // 'cube'|'sphere'
  //   isFictBody: false,          // 物理假体（视觉小一圈）
  //   isInvisible: false,         // 不渲染但占坑
  //   activeFunc: null,           // 激活时回调
  //   customIdx: -1,              // 自定义索引（覆盖）

  addTABox: function({
      DPZ = 3,
      X = 0, Y = 0, Z = 0,
      quat = {x: 0, y: 0, z: 0, w: 1},
      mass = 0, width = 1, depth = 1, height = 1, size = 0,
      rX = 0, rY = 0, rZ = 0,
      colliGroup = 2,
      isPhysical = true,
      isVisualMode = true,
      texture = null,
      background = '#888888',
      mixValue = 0.7,
      smooth = 0,
      tiling = [1, 1],
      shape = 'cube',
      isFictBody = false,
      isInvisible = false,
      activeFunc = null,
      customIdx = -1,
      unCullFace = 0,
      nS = false,
      isShadow = 0,
      textureRatio = 1,
  } = {}) {

    const myargs = Array.from(arguments)[0] || {};
    myargs.deleteFunc = null;

    if (size) width = depth = height = size;
    if (rX || rY || rZ) quat = this.eulerToQuaternion({rX, rY, rZ});

    if (this.cursorIdx >= this.MAX_BODIES) {
      console.warn('addTABox: 已达上限 MAX_BODIES=' + this.MAX_BODIES);
      return -1;
    }

    const index = (customIdx > -1) ? customIdx : this.cursorIdx++;
    const p = index * 8;

    this.positionsStatus[p] = X;
    this.positionsStatus[p+1] = Y;
    this.positionsStatus[p+2] = Z;
    this.positionsStatus[p+3] = quat.x;
    this.positionsStatus[p+4] = quat.y;
    this.positionsStatus[p+5] = quat.z;
    this.positionsStatus[p+6] = quat.w;
    this.positionsStatus[p+7] = mass;  // status: -1=隐藏, 0=静止, >0=质量

    this.physicsProps[p] = mass;
    this.physicsProps[p+1] = width;
    this.physicsProps[p+2] = height;
    this.physicsProps[p+3] = depth;
    this.physicsProps[p+4] = DPZ;

    const gridKey = `${DPZ}_${Math.floor(X / this.gridsize[DPZ])}_${Math.floor(Z / this.gridsize[DPZ])}`;
    myargs.initGridKey = gridKey;

    const cell = this.spatialGrid.get(gridKey) || new Set();
    cell.add(index);
    this.spatialGrid.set(gridKey, cell);

    this.indexToArgs.set(index, {
      DPZ, X, Y, Z, quat, mass, width, height, depth, size,
      rX, rY, rZ, colliGroup, isPhysical, isVisualMode, texture,
      background, mixValue, smooth, tiling, shape, isFictBody,
      isInvisible, activeFunc, unCullFace, nS, isShadow, textureRatio,
      deleteFunc: null, initGridKey: gridKey
    });

    return index;
  },

  // ========== 激活物体【核心函数】 ==========

  activeTABox: function(index) {
    const p = index * 8;
    const posProp = this.positionsStatus.subarray(p, p + 8);
    const phyProp = this.physicsProps.subarray(p, p + 8);
    const org_args = this.indexToArgs.get(index);

    if (!org_args) return;

    const args = {
      DPZ: 3, colliGroup: 2, isPhysical: true, isVisualMode: true,
      texture: null, smooth: 0, background: '#888888', mixValue: 0.7,
      rX: 0, rY: 0, rZ: 0, isShadow: 0, tiling: [1,1], shape: 'cube',
      isFictBody: false, isInvisible: false, activeFunc: null,
      textureRatio: 1, unCullFace: 0, nS: false,
      ...org_args
    };

    if (args.isPhysical && this.world) {
      const body = new CANNON.Body();
      body.mass = phyProp[0];
      body.type = phyProp[0] === 0 ? CANNON.Body.STATIC : CANNON.Body.DYNAMIC;

      let boxShape;
      if (args.shape === 'sphere') {
        boxShape = new CANNON.Sphere(phyProp[1]/2);
      } else {
        boxShape = new CANNON.Box(new CANNON.Vec3(phyProp[1]/2, phyProp[2]/2, phyProp[3]/2));
      }

      body.addShape(boxShape);
      body.position.set(posProp[0], posProp[1], posProp[2]);
      body.material = this.cannonDefaultContactMaterial;
      body.updateMassProperties();
      body.wakeUp();
      body.collisionFilterGroup = args.colliGroup;

      const maskMap = { 1: this.stoneGroupNum | this.allGroupNum, 2: this.allGroupNum };
      body.collisionFilterMask = maskMap[args.colliGroup] || this.allGroupNum;

      this.world.addBody(body);
      body.quaternion.set(posProp[3], posProp[4], posProp[5], posProp[6]);
      org_args.body = body;
    }

    if (args.isVisualMode && this.W) {
      let tiling = args.tiling;
      if (typeof tiling === 'number') tiling = [tiling, tiling];

      const utter = args.isFictBody ? 0.1 : 0;
      let texture = args.texture;
      let textureError = false;

      if (typeof args.texture === 'string') {
        if (window[args.texture] !== undefined || (this.textureMap && this.textureMap.has(args.texture))) {
          texture = this.textureMap?.has(args.texture) ? this.textureMap.get(args.texture) : window[args.texture];
        } else {
          texture = null;
          textureError = true;
        }
      }

      const color = (args.background || '#888888').replace('#', '');

      this.W[args.shape]({
        n: 'T' + index,
        w: phyProp[1] - utter,
        h: phyProp[2] - utter,
        d: phyProp[3] - utter,
        x: posProp[0], y: posProp[1], z: posProp[2],
        t: texture, s: args.smooth, tile: tiling,
        rx: args.rX, ry: args.rY, rz: args.rZ,
        b: color, mix: args.mixValue,
        shadow: args.isShadow,
        hidden: args.isInvisible,
        uncullface: args.unCullFace,
        ns: args.nS,
      });

      if (args.activeFunc) args.activeFunc(index);
    }
  },

  // ========== 隐藏物体 ==========

  hiddenTABox: function(index) {
    const org_args = this.indexToArgs.get(index);
    if (!org_args) return;

    if (org_args.isPhysical !== false && org_args.body && this.world) {
      this.world.removeBody(org_args.body);
    }
    if (org_args.isVisualMode !== false && this.W) {
      this.W.delete('T' + index);
    }
    if (org_args.deleteFunc) org_args.deleteFunc(index);
  },

  // ========== DPZ 动态更新（每帧调用） ==========

  dynaNodes_lab: function() {
    if (!this.mainVPlayer || this.stopDynaNodes) return;

    const mVP = this.mainVPlayer;
    const activeKeys = [];

    for (let dpz = 0; dpz < this.gridsize.length; dpz++) {
      const gx = Math.floor(mVP.X / this.gridsize[dpz]);
      const gz = Math.floor(mVP.Z / this.gridsize[dpz]);
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          activeKeys.push(`${dpz}_${gx + i}_${gz + j}`);
        }
      }
    }

    const newActive = new Set();
    const toHide = new Set(this.currentlyActiveIndices);

    for (const key of activeKeys) {
      const indices = this.spatialGrid.get(key);
      if (indices) {
        for (const idx of indices) {
          const dpz = this.physicsProps[idx * 8 + 4];
          const yRange = this.gridsizeY[dpz];
          const objY = this.positionsStatus[idx * 8 + 1];
          if (Math.abs(objY - mVP.Y) < yRange) {
            newActive.add(idx);
          }
        }
      }
    }

    for (const idx of newActive) toHide.delete(idx);
    for (const idx of newActive) {
      if (!this.currentlyActiveIndices.has(idx)) {
        const p = idx * 8;
        this.positionsStatus[p + 7] = this.physicsProps[p];
        this.activeTABox(idx);
      }
    }
    for (const idx of toHide) {
      const p = idx * 8;
      this.positionsStatus[p + 7] = -1;
      this.hiddenTABox(idx);
    }

    this.currentlyActiveIndices = newActive;
  },

  // ========== 简易物理体（主角、地面等） ==========

  addPhy: function({
      colliGroup = 2,
      name = 'k' + this.bodyObjName++,
      X = 0, Y = 0, Z = 0,
      quat = null,
      mass = 0, width = 1, depth = 1, height = 1, size = 0,
      rX = 0, rY = 0, rZ = 0,
  } = {}) {
    if (size) width = depth = height = size;
    const boxSize = new CANNON.Vec3(width/2, height/2, depth/2);
    const body = new CANNON.Body({
      mass,
      shape: new CANNON.Box(boxSize),
      position: new CANNON.Vec3(X, Y, Z),
      material: this.cannonDefaultContactMaterial,
    });
    body.type = mass === 0 ? CANNON.Body.STATIC : CANNON.Body.DYNAMIC;
    body.collisionFilterGroup = colliGroup;
    const maskMap = { 1: this.stoneGroupNum | this.allGroupNum, 2: this.allGroupNum };
    body.collisionFilterMask = maskMap[colliGroup] || this.allGroupNum;
    if (this.world) this.world.addBody(body);
    if (quat) body.quaternion.set(quat.x, quat.y, quat.z, quat.w);
    return { name, body, X, Y, Z, quat: body.quaternion, rX, rY, rZ };
  },

  // ========== 批量添加快捷函数 ==========

  addBoxes: function(arr) {
    return arr.map(item => this.addTABox(item));
  },

  // 按网格批量添加（适合城市、森林等）
  addGrid: function({
      startX=0, startZ=0, countX=10, countZ=10, spacing=5,
      Y=0, width=1, height=1, depth=1,
      DPZ=3, mass=0, background='#888',
      eachCb=null
  }) {
    const ids = [];
    for (let ix = 0; ix < countX; ix++) {
      for (let iz = 0; iz < countZ; iz++) {
        const args = {
          DPZ, mass, width, height, depth, background,
          X: startX + ix * spacing,
          Y: Y,
          Z: startZ + iz * spacing,
        };
        if (eachCb) eachCb(args, ix, iz);
        ids.push(this.addTABox(args));
      }
    }
    return ids;
  },
};
