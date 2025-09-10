
export default {

    // 配置
    speedH: 20,              // 最高速度的反数
    speedL: 10,              // 最低速度的反数
    speedAdd: 0.1,          // 速度的增加率
    jumpYVel: 5,            // 跳跃时向上的加速度
    fov:35,                 // 相机视野
    colorClear: "#7A4141",  // 画布背景色
    displayViewTime: 0.9,      // 显示清晰度

    // openworld 的 cannon.js 物理世界
    world : null,

    // 物体列表（接近作废）
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
        // this.world.broadphase = new CANNON.SAPBroadphase(this.world); // 宽相检测算法
        this.world.broadphase = new CANNON.NaiveBroadphase(); // 宽相检测算法
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
}