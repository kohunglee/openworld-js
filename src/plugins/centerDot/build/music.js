/**
 * 音效组件 (建造师，初始化建造师（引用中心点插件）)
 * ========
 * 实验中，可以移动物体
 */

export default function(ccgxkObj) {
    var G = {
        // 音效映射关系
        musicMap : {  // 映射关系
            'closeEdi' : 'coin0',
            'openEdi'  : 'coin0',
            'closeByClick' : 'coin0',
            'closePoint'   : 'wood',
            'openPoint'    : 'wood',
            'jump'         : 'nudge',
            'frozen'       : 'alien',
            'unfrozen'     : 'unfrozen',
            'addCube0'     : 'ting',
        },

        // 音乐播放器
        music : (myevent) => {
            const obj = ccgxkObj;
            const list = obj.sound;
            obj.audio(list[G.musicMap[myevent]]);
        },
    };

    ccgxkObj.centerDot.init = {...G, ...ccgxkObj.centerDot.init};
}