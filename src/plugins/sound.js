/**
 * 一些用于音乐合成器的音乐逻辑代码
 * ========
 * 使用 openworld 的 k.audio(f = function(i){}) 来播放音乐
 */

export default function(ccgxkObj){
    var t=(i,n)=>(n-i)/n; // t 为一个函数，用于计算音高
    var sound = {
        coin0 : function(i){  // 硬币声音
            var n=1e4;
            var c=n/3;
            if (i > n) return null;
            var q=Math.pow(t(i,n),2.1);
            return (Math.pow(i,3)&(i<c?16:99))?q:-q;
        },

        heartbeat : function(i){  // 心跳
            return Math.sin(i / 50) * Math.sin(i / 45) * Math.exp(-i/3000);
        },

        wood : function(i){
            return (i >> 7) & (i >> 5) & (i >> 3) ? Math.exp(-i/1000) : 0;
        },
    }
    ccgxkObj.sound = sound;
}