/**
 * 供测试使用的临时数据
 */
export default function(ccgxkObj) {
    console.log('临时测试');

    const data = [  // t 的参数，就是 kit 里的对应的函数名，这个可传入多个数据
        {"x":11.902,"y":10,"z":11.769,"w":10,"h":10, "dz": 1, "st": 1, "t":"eastSign"},

        // 静夜思 四句话 排成一排
        {"x":-30,"y":8,"z":20,"w":12,"h":8, "dz": 0, "st": 1, "t":"poemLine1", "ry": 90}, // 床前明月光
        {"x":-15,"y":8,"z":20,"w":12,"h":8, "dz": 0, "st": 1, "t":"poemLine2", "ry": 90}, // 疑是地上霜
        {"x":0,"y":8,"z":20,"w":12,"h":8, "dz": 0, "st": 1, "t":"poemLine3", "ry": 90},  // 举头望明月
        {"x":15,"y":8,"z":20,"w":12,"h":8, "dz": 0, "st": 1, "t":"poemLine4", "ry": 90}, // 低头思故乡
    ];

    ccgxkObj.dataProc.process({  // 固定写法，把 data 传进我的实例化渲染里
        data: data,
        name: 'texture-test',
        type: 1,
        // model: 'plane',  // 暂时先使用 cube 吧，容易看
        invisible: false, noIns: true,  // 纹理使用这种组合
    });
}