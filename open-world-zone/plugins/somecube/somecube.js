/**
 * 一些方块 插件
 * ========
 * 功能是....
 */
export default function(ccgxkObj) {
    // console.log('导入自己的 方块 插件成功');

    const insts = [];

    // 100 个正常摆放（10×10 阵列）
    for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
            const t = (row * 10 + col) / 100;
            insts.push({
                x: col * 2, z: row * 2,
                y: 4 + Math.sin(t * Math.PI * 2) * 3,        // 波浪高度
                w: 0.5 + t,                               // 从小到大
                h: 0.5 + t,
                d: 0.5 + t,
                ry: t * 360,                              // 渐进旋转
            });
        }
    }

    // 其余 9900 个扔到很远的地方
    for (let i = 0; i < 9900; i++) {
        insts.push({
            x: 999999999, y: 999999999, z: 999999999,
            w: 0.001, d: 0.001, h: 0.001,
            rx: 0, ry: 0, rz: 0,
        });
    }
    
    k.visCubeLen = 100;  // build 插件必要的！
    for (let i = 0; i < insts.length; i++) {
        const c = insts[i];
        k.addTABox({
            DPZ: 4,
            X: c.x, Y: c.y, Z: c.z,
            width: c.w,
            depth: c.d,
            height: c.h,
            rX: c.rx, rY: c.ry, rZ: c.rz,
            background: '#ba1818',
            mass: 0,
            isInvisible: true,  // 只被探测，不可见
        });
    }

    k.W.cube({  // 渲染实例化
        n: 'wsk_0',
        t: marble,  // 大理石
        instances: insts, // 实例属性的数组
        mix: 0.7,
    });
}