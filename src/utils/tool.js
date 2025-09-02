/**
 * 一些工具函数、杂项
 */
export default {
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

    // 音乐合成器
    audio : function(func){
        if(this?.offAudio) return;  // 是否开启音效
        const A = window.A = window.A || new AudioContext();  // 防止资源占用太多，导致报错
        const fn = i => func(i) || 0;
        var t, m, b, s, i;
        A.state=='suspended' && (document.onclick=()=>A.resume());
        t=(i,n)=>(n-i)/n;
        m=A.createBuffer(1,96e3,48e3)
        b=m.getChannelData(0)
        for(i=96e3;i--;)b[i]=fn(i)
        s=A.createBufferSource()
        s.buffer=m
        s.connect(A.destination)
        s.start()
    },
    
    // 一个能跑起来的计算角度的函数，凑合用吧，原理混乱 (rx, ry, rz)
    calYAngle : function(t,a,h){
        var t=-t*Math.PI/180,a=-a*Math.PI/180,h=h*Math.PI/180,M=Math.cos(t),
        t=Math.sin(t),o=Math.cos(a),a=Math.sin(a),h=(Math.cos(h),Math.sin(h),a*M),a=-t,t=o*M,o=[0,0,1],M=t,
        a=Math.sqrt(Math.pow(h,2)+Math.pow(a,2)+Math.pow(t,2));let n=Math.acos(Math.min(1,Math.max(-1,M/a)));
        return n=(n=h*o[2]-t*o[0]<0?-n:n)>-Math.PI/2&&n<Math.PI/2?2*Math.PI-n:n
    },
    
};